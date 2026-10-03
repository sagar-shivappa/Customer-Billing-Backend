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
                  { $ne: ["$$customer", null] },
                  { $ne: ["$$customer", ""] },
                ],
              },
            },
          },
        },

        averageBill: {
          $cond: [
            { $eq: ["$transactionCount", 0] },
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

module.exports = {
  getOverviewSummary,
};
