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

const router = express.Router();

router.post("/addProduct", addProduct);
router.get("/products", getAllProducts);
router.get("/featured-products", getFeaturedProducts);
router.get("/products/:id", getProductById);
router.get("/search", searchProducts);
router.get("/category/:category", getProductsByCategory);
router.put("/update-product/:id", updateProduct);
router.delete("/delete-a-product/:id", deleteProduct);

export default router;
