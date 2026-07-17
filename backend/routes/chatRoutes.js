import express from "express";
import { generateFirebaseToken, deleteChatImage } from "../controllers/chatController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/firebase-token", protect, generateFirebaseToken);
router.post("/delete-image", protect, deleteChatImage);

export default router;
