const Billing = require("../billing/billing.model");
const Product = require("../products/product.model");

// Escape special characters in user-provided search text.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDate = (value, endOfDay = false) => {
  if (!value) return null;

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  // Ensure YYYY-MM-DD values are real calendar dates.
  if (dateOnly && date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid date: ${value}`);
  }

  if (dateOnly && endOfDay) {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date;
};

const getProductsReport = async (filters = {}) => {
  const {
    from,
    to,
    category,
    search,
    sortBy = "revenue",
    sortOrder = "desc",
  } = filters;

  const startDate = parseDate(from);
  const endDate = parseDate(to, true);

  if (startDate && endDate && startDate > endDate) {
    throw new Error("'from' date cannot be after 'to' date.");
  }

  const allowedSortFields = {
    revenue: "totalRevenue",
    quantitySold: "totalQuantitySold",
    stock: "stock",
    estimatedProfit: "estimatedProfit",
    productName: "productName",
  };

  if (!allowedSortFields[sortBy]) {
    throw new Error("Invalid sortBy value.");
  }

  const direction = sortOrder.toLowerCase();

  if (!["asc", "desc"].includes(direction)) {
    throw new Error("sortOrder must be 'asc' or 'desc'.");
  }

  const productMatch = {};

  if (category) {
    productMatch.category = category;
  }

  if (search?.trim()) {
    const searchRegex = new RegExp(escapeRegex(search.trim()), "i");

    productMatch.$or = [
      { productName: searchRegex },
      { productCode: searchRegex },
    ];
  }

  // Only sales metrics are date-filtered.
  // Every matching product remains in the report,
  // including products without sales in this period.
  const salesDateMatch = {};

  if (startDate || endDate) {
    salesDateMatch.saleDate = {};

    if (startDate) {
      salesDateMatch.saleDate.$gte = startDate;
    }

    if (endDate) {
      salesDateMatch.saleDate.$lte = endDate;
    }
  }

  const salesPipeline = [
    ...(Object.keys(salesDateMatch).length ? [{ $match: salesDateMatch }] : []),

    { $unwind: "$items" },

    {
      $match: {
        $expr: {
          $eq: ["$items.productCode", "$$productCode"],
        },
      },
    },

    {
      $group: {
        _id: null,
        totalQuantitySold: {
          $sum: "$items.quantity",
        },
        totalRevenue: {
          $sum: "$items.totalPrice",
        },
      },
    },
  ];

  const products = await Product.aggregate([
    { $match: productMatch },

    {
      $lookup: {
        from: Billing.collection.name,
        let: { productCode: "$productCode" },
        pipeline: salesPipeline,
        as: "sales",
      },
    },

    {
      $addFields: {
        totalQuantitySold: {
          $ifNull: [{ $arrayElemAt: ["$sales.totalQuantitySold", 0] }, 0],
        },
        totalRevenue: {
          $ifNull: [{ $arrayElemAt: ["$sales.totalRevenue", 0] }, 0],
        },
      },
    },

    {
      $addFields: {
        estimatedProfit: {
          $subtract: [
            "$totalRevenue",
            {
              $multiply: ["$purchasePrice", "$totalQuantitySold"],
            },
          ],
        },

        stockStatus: {
          $switch: {
            branches: [
              {
                case: { $lte: ["$stock", 0] },
                then: "Out of stock",
              },
              {
                case: { $lte: ["$stock", 10] },
                then: "Low stock",
              },
            ],
            default: "In stock",
          },
        },
      },
    },

    {
      $sort: {
        [allowedSortFields[sortBy]]: direction === "asc" ? 1 : -1,
        _id: 1,
      },
    },

    {
      $project: {
        _id: 1,
        productName: 1,
        productCode: 1,
        category: 1,
        purchasePrice: 1,
        sellingPrice: 1,
        stock: 1,
        isActive: 1,
        totalQuantitySold: 1,
        totalRevenue: 1,
        estimatedProfit: 1,
        stockStatus: 1,
      },
    },
  ]);

  const summary = products.reduce(
    (result, product) => {
      result.productCount++;
      result.totalQuantitySold += product.totalQuantitySold;
      result.totalRevenue += product.totalRevenue;
      result.estimatedProfit += product.estimatedProfit;

      if (product.stockStatus === "Low stock") {
        result.lowStockCount++;
      }

      if (product.stockStatus === "Out of stock") {
        result.outOfStockCount++;
      }

      return result;
    },
    {
      productCount: 0,
      totalQuantitySold: 0,
      totalRevenue: 0,
      estimatedProfit: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    },
  );

  return { summary, products };
};

/**
 * Build date query
 *
 * Supported:
 * ?date=2026-10-01
 * ?from=2026-10-01&to=2026-10-07
 * ?month=2026-10
 */
const buildDateQuery = ({ date, from, to, month }) => {
  const query = {};

  if (date) {
    query.saleDate = {
      $gte: new Date(`${date}T00:00:00.000Z`),
      $lte: new Date(`${date}T23:59:59.999Z`),
    };

    return query;
  }

  if (from || to) {
    query.saleDate = {};

    if (from) {
      query.saleDate.$gte = new Date(`${from}T00:00:00.000Z`);
    }

    if (to) {
      query.saleDate.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    return query;
  }

  if (month) {
    const [year, monthNumber] = month.split("-");

    const startDate = new Date(
      Date.UTC(Number(year), Number(monthNumber) - 1, 1),
    );

    const endDate = new Date(Date.UTC(Number(year), Number(monthNumber), 1));

    query.saleDate = {
      $gte: startDate,
      $lt: endDate,
    };
  }

  return query;
};

/**
 * Get Overview Summary
 *
 * Returns:
 * - totalSales
 * - transactionCount
 * - customerCount
 * - averageBill
 * - salesTrend
 */
const getOverviewSummary = async (filters) => {
  const query = buildDateQuery(filters);

  const result = await Billing.aggregate([
    {
      $match: query,
    },

    {
      $facet: {
        // -----------------------------------------
        // Summary
        // -----------------------------------------

        summary: [
          {
            $group: {
              _id: null,

              totalSales: {
                $sum: "$grandTotal",
              },

              transactionCount: {
                $sum: 1,
              },

              customerIds: {
                $addToSet: "$customerId",
              },
            },
          },

          {
            $project: {
              _id: 0,

              totalSales: 1,

              transactionCount: 1,

              customerCount: {
                $size: {
                  $filter: {
                    input: "$customerIds",

                    as: "customer",

                    cond: {
                      $and: [
                        {
                          $ne: ["$$customer", null],
                        },

                        {
                          $ne: ["$$customer", ""],
                        },
                      ],
                    },
                  },
                },
              },

              averageBill: {
                $cond: [
                  {
                    $eq: ["$transactionCount", 0],
                  },

                  0,

                  {
                    $divide: ["$totalSales", "$transactionCount"],
                  },
                ],
              },
            },
          },
        ],

        // -----------------------------------------
        // Sales Trend
        //
        // Groups sales by day
        // -----------------------------------------

        salesTrend: [
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$saleDate",
                  timezone: "Asia/Kolkata",
                },
              },

              sales: {
                $sum: "$grandTotal",
              },
            },
          },

          {
            $project: {
              _id: 0,

              date: "$_id",

              sales: 1,
            },
          },

          {
            $sort: {
              date: 1,
            },
          },
        ],

        paymentBreakdown: [
          {
            $group: {
              _id: "$paymentType",
              amount: {
                $sum: "$grandTotal",
              },
              transactionCount: {
                $sum: 1,
              },
            },
          },

          {
            $project: {
              _id: 0,
              paymentType: "$_id",
              amount: 1,
              transactionCount: 1,
            },
          },

          {
            $sort: {
              amount: -1,
            },
          },
        ],
      },
    },
  ]);

  const data = result[0];

  const summary = data.summary[0] || {
    totalSales: 0,
    transactionCount: 0,
    customerCount: 0,
    averageBill: 0,
  };

  return {
    ...summary,

    salesTrend: data.salesTrend || [],
    paymentBreakdown: data.paymentBreakdown || [],
  };
};

/**
 * Get Transactions
 *
 * Supported:
 *
 * ?date=2026-10-01
 * ?from=2026-10-01&to=2026-10-07
 * ?month=2026-10
 *
 * ?paymentType=UPI
 *
 * ?search=BILL261004
 * ?search=6360959764
 * ?search=CustomerName
 * ?search=Tea
 *
 * ?page=1&limit=10
 */
const getTransactions = async (filters) => {
  const { date, from, to, month, paymentType, search } = filters;

  const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);

  const limit = Math.min(
    Math.max(Number.parseInt(filters.limit, 10) || 10, 1),
    100,
  );

  const skip = (page - 1) * limit;

  // -----------------------------------------
  // Base date query
  // -----------------------------------------

  const query = buildDateQuery({
    date,
    from,
    to,
    month,
  });

  // -----------------------------------------
  // Payment type filter
  // -----------------------------------------

  if (paymentType && paymentType !== "all") {
    query.paymentType = paymentType;
  }

  // -----------------------------------------
  // Aggregation
  // -----------------------------------------

  const pipeline = [
    {
      $match: query,
    },

    // -----------------------------------------
    // Get customer
    //
    // Billing.customerId = Customer.phone
    // -----------------------------------------

    {
      $lookup: {
        from: "customers",

        localField: "customerId",

        foreignField: "phone",

        as: "customer",
      },
    },

    {
      $unwind: {
        path: "$customer",

        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  // -----------------------------------------
  // Search
  //
  // Customer name can only be searched after
  // the Customer lookup.
  // -----------------------------------------

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");

    pipeline.push({
      $match: {
        $or: [
          {
            billNumber: searchRegex,
          },

          {
            customerId: searchRegex,
          },

          {
            "customer.name": searchRegex,
          },

          {
            "items.productCode": searchRegex,
          },

          {
            "items.productName": searchRegex,
          },
        ],
      },
    });
  }

  // -----------------------------------------
  // Facet
  // -----------------------------------------

  pipeline.push({
    $facet: {
      // -------------------------------------
      // Paginated transactions
      // -------------------------------------

      transactions: [
        {
          $sort: {
            saleDate: -1,
          },
        },

        {
          $skip: skip,
        },

        {
          $limit: limit,
        },

        {
          $project: {
            _id: 1,

            billNumber: 1,

            customerId: 1,

            // Customer name comes from Customer
            customerName: {
              $ifNull: ["$customer.name", ""],
            },

            items: 1,

            grandTotal: 1,

            paymentType: 1,

            saleDate: 1,
          },
        },
      ],

      // -------------------------------------
      // Pagination count
      // -------------------------------------

      pagination: [
        {
          $count: "totalRecords",
        },
      ],

      // -------------------------------------
      // Summary
      // -------------------------------------

      summary: [
        {
          $group: {
            _id: null,

            totalSales: {
              $sum: "$grandTotal",
            },

            transactionCount: {
              $sum: 1,
            },

            customerIds: {
              $addToSet: "$customerId",
            },
          },
        },

        {
          $project: {
            _id: 0,

            totalSales: 1,

            transactionCount: 1,

            customerCount: {
              $size: {
                $filter: {
                  input: "$customerIds",

                  as: "customer",

                  cond: {
                    $and: [
                      {
                        $ne: ["$$customer", null],
                      },

                      {
                        $ne: ["$$customer", ""],
                      },
                    ],
                  },
                },
              },
            },

            averageBill: {
              $cond: [
                {
                  $eq: ["$transactionCount", 0],
                },

                0,

                {
                  $divide: ["$totalSales", "$transactionCount"],
                },
              ],
            },
          },
        },
      ],
    },
  });

  // -----------------------------------------
  // Execute aggregation
  // -----------------------------------------

  const result = await Billing.aggregate(pipeline);

  const data = result[0];

  const transactions = data.transactions || [];

  const totalRecords = data.pagination[0]?.totalRecords || 0;

  const summary = data.summary[0] || {
    totalSales: 0,
    transactionCount: 0,
    customerCount: 0,
    averageBill: 0,
  };

  const totalPages = Math.ceil(totalRecords / limit);

  return {
    transactions,

    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
    },

    summary,
  };
};

module.exports = {
  buildDateQuery,
  getOverviewSummary,
  getTransactions,
  getProductsReport,
};
