import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import { configDotenv } from "dotenv";

configDotenv();

const app = express();
const port = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.ugpmzsn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

let db;

async function connectToDatabase() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB!");
    db = client.db("artizans-mart");
  } catch (error) {
    console.error("Could not connect to the database", error);
    process.exit(1); // Exit with failure
  }
}

connectToDatabase();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("artizans server is running");
});

app.post("/addProduct", async (req, res) => {
  try {
    const productData = db.collection("product-data");
    const result = await productData.insertOne(req.body);
    res.status(201).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to add product" });
  }
});

// get all the products api
app.get("/products", async (req, res) => {
  const productData = db.collection("product-data");
  const data = await productData.find().toArray();
  if (!data) {
    res.status(404).json({ message: "Not found" });
  }
  res.status(200).json(data);
});
// getting featured products
app.get("/featured-products", async (req, res) => {
  try {
    const productData = db.collection("product-data");
    const featuredProducts = await productData
      .find({ is_featured: true })
      .toArray();

    if (featuredProducts.length === 0) {
      return res.status(404).json({ message: "No featured products found" });
    }

    res.status(200).json(featuredProducts);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).send({ message: "Failed to fetch featured products" });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid product ID" });
    }
    const productData = db.collection("product-data");
    const productReviews = db.collection("reviews");
    const product = await productData.findOne({ _id: new ObjectId(id) });
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }
    const reviews = await productReviews.find({ productId: id }).toArray();
    res.status(200).send({ data: product, filterRiview: reviews });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to get product details" });
  }
});

// review post api
app.post("/reviews", async (req, res) => {
  try {
    const productReviews = db.collection("reviews");
    const result = await productReviews.insertOne(req.body);

    // Check if the insertion was successfully acknowledged by the database
    if (result.acknowledged) {
      res.status(201).json({
        message: "Review posted successfully!",
        insertedId: result.insertedId,
      });
    } else {
      // This case is unlikely with a working connection but handles potential database issues
      res
        .status(500)
        .json({ message: "Failed to post review. Please try again." });
    }
  } catch (error) {
    console.error(error);
    // Use a specific message for client-side feedback
    res.status(500).send({
      message: "An internal server error occurred. Please try again later.",
    });
  }
});
app.get("/reviews", async (req, res) => {
  try {
    const productReviews = db.collection("reviews");
    const reviews = await productReviews.find().toArray();

    if (reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found" });
    }

    res.status(200).json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to get reviews" });
  }
});

app.get("/search", async (req, res) => {
  const searchItem = req.query.q;
  if (!searchItem) {
    return res.status(400).json({ message: "Search query is required." });
  }
  try {
    const productData = db.collection("product-data");
    const result = await productData
      .find({
        $or: [
          { name: { $regex: searchItem, $options: "i" } },
          { short_description: { $regex: searchItem, $options: "i" } },
          { long_description: { $regex: searchItem, $options: "i" } },
        ],
      })
      .toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).send({ message: "Failed to perform search" });
  }
});

// order place api

app.post("/place-order", async (req, res) => {
  try {
    const Orders = db.collection("orders");
    const result = await Orders.insertOne(req.body);
    if (result.acknowledged) {
      res.status(201).json({
        message: "Order placed successfully",
        insertedId: result.insertedId,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to post review. Please try again." });
  }
});

app.get("/orders", async (req, res) => {
  try {
    const orders = db.collection("orders");
    const result = await orders.find().toArray();
    if (!result) {
      res
        .status(404)
        .send({ message: "Cannot get data. something went wrong" });
    } else {
      res.status(200).send(result);
    }
  } catch (error) {}
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
