import express from "express";
import { reorderLinks } from "../controllers/linkController.js";
import { protect, admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.put("/reorder", protect, admin, reorderLinks);

export default router;
