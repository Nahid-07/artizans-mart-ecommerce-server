import express from "express";
import cors from "cors";
import { connectToDatabase, getDb } from "./utils/db.js";
import productRoutes from "./routes/productRoutes.js";
import { createToken, logoutUser } from "./controllers/authController.js";
import { ObjectId } from "mongodb";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://artizans-mart-auth.web.app",
      "https://artizans-mart-ecommerce-project.firebaseapp.com",
    ],
    credentials: true,
  })
);

// Initialize Database
connectToDatabase();

// Auth Routes
app.post("/jwt", createToken);
app.post("/logout", logoutUser);

// Use Product Routes
app.use("/", productRoutes);

// Basic Route
app.get("/", (req, res) => {
  res.send("Artizans server is running");
});

// --- Order Routes ---

// Place Order
app.post("/place-order", async (req, res) => {
  try {
    const result = await getDb().collection("orders").insertOne(req.body);
    if (result.acknowledged) {
      res
        .status(201)
        .json({ message: "Order placed!", insertedId: result.insertedId });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to place order." });
  }
});

// Get All Orders
app.get("/orders", async (req, res) => {
  try {
    const result = await getDb().collection("orders").find().toArray();
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: "Error fetching orders" });
  }
});

// Update Order Status (PATCH) - THIS FIXES YOUR ERROR
app.patch("/orders/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid Order ID" });
    }

    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: { status: status },
    };

    const result = await getDb()
      .collection("orders")
      .updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).send({ message: "Failed to update status" });
  }
});

// --- Review Routes ---
app.post("/reviews", async (req, res) => {
  try {
    const result = await getDb().collection("reviews").insertOne(req.body);
    if (result.acknowledged) {
      res
        .status(201)
        .json({ message: "Review posted!", insertedId: result.insertedId });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to post review." });
  }
});

app.get("/reviews", async (req, res) => {
  try {
    const reviews = await getDb().collection("reviews").find().toArray();
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).send({ message: "Failed to get reviews" });
  }
});

// --- User Routes ---
app.post("/users", async (req, res) => {
  try {
    const user = req.body;
    const userCollection = getDb().collection("user-data");
    const existingUser = await userCollection.findOne({ email: user.email });
    if (existingUser) {
      return res.status(409).send({ success: false, message: "User exists." });
    }
    const result = await userCollection.insertOne({
      ...user,
      role: "user",
      createdAt: new Date(),
    });
    res
      .status(201)
      .send({
        success: true,
        message: "User created!",
        insertedId: result.insertedId,
      });
  } catch (error) {
    res.status(500).send({ success: false, message: "Error creating user" });
  }
});

app.get("/user", async (req, res) => {
  try {
    const targetEmail = req.query.email;
    if (!targetEmail)
      return res.status(400).send({ message: "Email required." });

    const user = await getDb()
      .collection("user-data")
      .findOne({ email: targetEmail });
    if (!user) return res.status(404).send({ message: "User not found." });

    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
