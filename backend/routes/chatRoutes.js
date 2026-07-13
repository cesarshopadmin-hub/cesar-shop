import express from "express";
import { generateFirebaseToken } from "../controllers/chatController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/firebase-token", protect, generateFirebaseToken);

export default router;
