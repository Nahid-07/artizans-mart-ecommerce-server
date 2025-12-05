import express from "express";
import { verifyToken } from "../middlewares/varifyToken.js";
import { getAdminStats } from "../controllers/statsController.js";

const router = express.Router();

// Only admins should see this (verifyToken is a start, add verifyAdmin later)
router.get("/admin-stats", verifyToken, getAdminStats);

export default router;