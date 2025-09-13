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

    // Always send a 200 OK status.
    // If no products are found, the array will be empty [].
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
          { category: { $regex: searchItem, $options: "i" } },
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

// shop by category api

app.get("/category/:category", async (req, res) => {
  try {
    const allProduct = db.collection("product-data");

    // Get the category from the URL parameter
    const category = req.params.category;

    // Use the category variable to filter the database query
    const result = await allProduct.find({ category: category }).toArray();

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found in this category." });
    }

    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching products." });
  }
});
// product update api created
app.put("/update-product/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Input Validation: Check if the ID is valid and body is not empty.
    if (!id || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ error: "Missing product ID or request body." });
    }

    // Validate ObjectId format to prevent bad input from reaching the database.
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID format." });
    }

    // 2. Destructuring and Data Sanitization: Extract only the allowed fields.
    const {
      name,
      brand,
      regular_price,
      offer_price,
      rating,
      category,
      is_featured,
      stock_status,
      short_description,
      long_description,
      images,
      features,
    } = req.body;

    // 3. Dynamic Update Object: Build the $set object dynamically.
    // This prevents hardcoding fields and allows for partial updates.
    const updateFields = {};
    if (name) updateFields.name = name;
    if (brand) updateFields.brand = brand;
    if (regular_price !== undefined) updateFields.regular_price = regular_price;
    if (offer_price !== undefined) updateFields.offer_price = offer_price;
    if (rating !== undefined) updateFields.rating = rating;
    if (category) updateFields.category = category;
    if (is_featured !== undefined) updateFields.is_featured = is_featured;
    if (stock_status) updateFields.stock_status = stock_status;
    if (short_description) updateFields.short_description = short_description;
    if (long_description) updateFields.long_description = long_description;
    if (images) updateFields.images = images;
    if (features) updateFields.features = features;

    // If no fields are provided for update, return an error.
    if (Object.keys(updateFields).length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update." });
    }

    const productData = db.collection("product-data");
    const filter = { _id: new ObjectId(id) };
    const updatedata = { $set: updateFields };

    const result = await productData.updateOne(filter, updatedata);

    // 4. Proper Response Handling: Check the result of the database operation.
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.status(200).json({ message: "Product updated successfully.", result });
  } catch (error) {
    // 5. Specific Error Handling: Log the error and return a generic server error.
    console.error("Failed to update product:", error);
    res.status(500).json({ error: "Internal Server Error." });
  }
});

app.delete('/delete-a-product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the provided ID is a valid ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid product ID.' });
    }

    const productData = db.collection('product-data');

    const result = await productData.deleteOne({ _id: new ObjectId(id) });
    
    // Check if a document was actually deleted
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.status(200).json({ message: 'Product successfully deleted.', result });

  } catch (error) {
    console.error(error); // Log the error on the server side
    res.status(500).json({ error: 'An error occurred while deleting the product.' });
  }
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
