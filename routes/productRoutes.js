import express from "express";
import {
  addProduct,
  getAllProducts,
  getFeaturedProducts,
  getProductById,
  searchProducts,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Public Routes (Anyone can see products)
router.get("/products", getAllProducts);
router.get("/featured-products", getFeaturedProducts);
router.get("/products/:id", getProductById);
router.get("/search", searchProducts);
router.get("/category/:category", getProductsByCategory);

// Protected Routes (Only Admins/Logged-in users)
router.post("/addProduct", verifyToken, addProduct); // Added verifyToken
router.put("/update-product/:id", verifyToken, updateProduct); // Added verifyToken
router.delete("/delete-a-product/:id", verifyToken, deleteProduct); // Added verifyToken

export default router;
