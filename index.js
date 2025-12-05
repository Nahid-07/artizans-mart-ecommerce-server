import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectToDatabase, getDb } from "./utils/db.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { createToken, logoutUser } from "./controllers/authController.js";
import statsRoutes from "./routes/statsRoutes.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://artizans-mart-ecommerce-project.web.app",
      "https://artizans-mart-ecommerce-project.firebaseapp.com",
    ],
    credentials: true,
  })
);

connectToDatabase();

// Routes
app.post("/jwt", createToken);
app.post("/logout", logoutUser);

app.use("/", productRoutes);
app.use("/", orderRoutes);
app.use("/", statsRoutes);

// Basic Route
app.get("/", (req, res) => {
  res.send("Artizans server is running");
});

// --- User & Review Routes (Can be refactored later) ---
app.post("/reviews", async (req, res) => {
  try {
    const result = await getDb().collection("reviews").insertOne(req.body);
    if (result.acknowledged)
      res
        .status(201)
        .json({ message: "Review posted!", insertedId: result.insertedId });
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

app.post("/users", async (req, res) => {
  try {
    const user = req.body;
    const userCollection = getDb().collection("user-data");
    const existingUser = await userCollection.findOne({ email: user.email });
    if (existingUser)
      return res.status(409).send({ success: false, message: "User exists." });
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
