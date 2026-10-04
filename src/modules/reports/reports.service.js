const Billing = require("../billing/billing.model");

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
 */
const getOverviewSummary = async (filters) => {
  const query = buildDateQuery(filters);

  const result = await Billing.aggregate([
    {
      $match: query,
    },

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
  ]);

  return (
    result[0] || {
      totalSales: 0,
      transactionCount: 0,
      averageBill: 0,
      customerCount: 0,
    }
  );
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
};
