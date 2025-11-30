import { ObjectId } from "mongodb";
import { getDb } from "../utils/db.js";

const getProductsCollection = () => getDb().collection("product-data");

// Add a product
export const addProduct = async (req, res) => {
  try {
    const result = await getProductsCollection().insertOne(req.body);
    res.status(201).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to add product" });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const data = await getProductsCollection().find().toArray();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch products" });
  }
};

// Get featured products
export const getFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await getProductsCollection()
      .find({ is_featured: true })
      .toArray();
    res.status(200).json(featuredProducts);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).send({ message: "Failed to fetch featured products" });
  }
};

// Get single product
export const getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid product ID" });
    }

    const product = await getProductsCollection().findOne({
      _id: new ObjectId(id),
    });
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    // Fetch related reviews
    const reviews = await getDb()
      .collection("reviews")
      .find({ productId: id })
      .toArray();

    res.status(200).send({ data: product, filterRiview: reviews });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to get product details" });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  const searchItem = req.query.q;
  if (!searchItem) {
    return res.status(400).json({ message: "Search query is required." });
  }
  try {
    const result = await getProductsCollection()
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
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const result = await getProductsCollection()
      .find({ category: category })
      .toArray();

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
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID format." });
    }

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

    if (Object.keys(updateFields).length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update." });
    }

    const result = await getProductsCollection().updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.status(200).json({ message: "Product updated successfully.", result });
  } catch (error) {
    console.error("Failed to update product:", error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid product ID" });
    }

    const result = await getProductsCollection().deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Product not found" });
    }

    res.status(200).send({ result });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send({ message: "Failed to delete product" });
  }
};
