import { getDb } from "../utils/db.js";

export const getAdminStats = async (req, res) => {
  try {
    const db = getDb();

    // 1. Basic Counts (Keep showing total order volume, even pending ones)
    const users = await db.collection("user-data").estimatedDocumentCount();
    const products = await db
      .collection("product-data")
      .estimatedDocumentCount();
    const orders = await db.collection("orders").estimatedDocumentCount();

    // 2. Total Revenue (Net Realized Sales)
    // Logic: ONLY count orders where status is "Delivered"
    const revenueData = await db
      .collection("orders")
      .aggregate([
        { $match: { status: "Delivered" } }, // <--- FILTER ADDED
        {
          $group: {
            _id: null,
            // Subtract shipping fee to get pure product revenue
            totalRevenue: { $sum: { $subtract: ["$total", "$shippingFee"] } },
          },
        },
      ])
      .toArray();

    const revenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // 3. Category Stats (Unchanged)
    const categoryStats = await db
      .collection("product-data")
      .aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // 4. Order Trends (Chart)
    // Logic: Show ALL orders count, but ONLY "Delivered" Revenue
    const orderStats = await db
      .collection("orders")
      .aggregate([
        {
          $group: {
            _id: "$date",
            // Conditional Sum: If status == 'Delivered', add (total - shipping), else add 0
            dailyRevenue: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "Delivered"] },
                  { $subtract: ["$total", "$shippingFee"] },
                  0,
                ],
              },
            },
            orderCount: { $sum: 1 }, // Still count the order to show traffic volume
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 7 },
      ])
      .toArray();

    res.send({
      users,
      products,
      orders,
      revenue,
      categoryStats,
      orderStats,
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).send({ message: "Failed to fetch stats" });
  }
};
