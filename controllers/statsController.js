import { getDb } from "../utils/db.js";

export const getAdminStats = async (req, res) => {
  try {
    const db = getDb();
    
    // 1. Basic Counts
    const users = await db.collection("user-data").estimatedDocumentCount();
    const products = await db.collection("product-data").estimatedDocumentCount();
    const orders = await db.collection("orders").estimatedDocumentCount();

    // 2. Total Revenue (Sum of 'total' field in orders)
    const revenueData = await db.collection("orders").aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" }
        }
      }
    ]).toArray();
    const revenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // 3. Category Stats (For Pie Chart)
    // Counts how many products exist per category
    const categoryStats = await db.collection("product-data").aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // 4. Order Trends (For Line Chart - Last 7 days or similar)
    // Note: This assumes your 'date' field is standardized YYYY-MM-DD
    const orderStats = await db.collection("orders").aggregate([
      {
        $group: {
          _id: "$date", // Group by Date
          dailyRevenue: { $sum: "$total" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }, // Sort by date ascending
      { $limit: 7 } // Limit to 7 entries (optional)
    ]).toArray();

    res.send({
      users,
      products,
      orders,
      revenue,
      categoryStats,
      orderStats
    });

  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).send({ message: "Failed to fetch stats" });
  }
};