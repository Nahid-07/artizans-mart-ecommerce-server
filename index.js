import express from "express";
import cors from "cors";
import { connectToDatabase, getDb } from "./utils/db.js";
import productRoutes from "./routes/productRoutes.js";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Initialize Database
connectToDatabase();

// Use Routes
app.use("/", productRoutes);

// Basic Route
app.get("/", (req, res) => {
  res.send("Artizans server is running");
});

// Reviews
app.post("/reviews", async (req, res) => {
  try {
    const result = await getDb().collection("reviews").insertOne(req.body);
    if (result.acknowledged) {
      res.status(201).json({ message: "Review posted!", insertedId: result.insertedId });
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

// Orders
app.post("/place-order", async (req, res) => {
  try {
    const result = await getDb().collection("orders").insertOne(req.body);
    if (result.acknowledged) {
      res.status(201).json({ message: "Order placed!", insertedId: result.insertedId });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to place order." });
  }
});

app.get("/orders", async (req, res) => {
  try {
    const result = await getDb().collection("orders").find().toArray();
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: "Error fetching orders" });
  }
});

// Users
app.post("/users", async (req, res) => {
  try {
    const user = req.body;
    const userCollection = getDb().collection("user-data");
    const existingUser = await userCollection.findOne({ email: user.email });
    if (existingUser) {
      return res.status(409).send({ success: false, message: "User exists." });
    }
    const result = await userCollection.insertOne({ ...user, role: "user", createdAt: new Date() });
    res.status(201).send({ success: true, message: "User created!", insertedId: result.insertedId });
  } catch (error) {
    res.status(500).send({ success: false, message: "Error creating user" });
  }
});

app.get("/user", async (req, res) => {
  try {
    const targetEmail = req.query.email;
    if (!targetEmail) return res.status(400).send({ message: "Email required." });
    
    const user = await getDb().collection("user-data").findOne({ email: targetEmail });
    if (!user) return res.status(404).send({ message: "User not found." });
    
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});