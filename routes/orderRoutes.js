import express from "express";
import { verifyToken } from "../middlewares/varifyToken.js";
import {
  placeOrder,
  getAllOrders,
  getOrdersByEmail,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

// Public/User Routes
router.post("/place-order", placeOrder); // Can be protected if you force login
router.get("/my-orders/:email", verifyToken, getOrdersByEmail); // PROTECTED

// Admin Routes (Should ideally add verifyAdmin middleware later)
router.get("/orders", verifyToken, getAllOrders);
router.patch("/orders/:id", verifyToken, updateOrderStatus);

export default router;
