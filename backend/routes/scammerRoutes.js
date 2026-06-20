import express from "express";
import { getScammers, createScammer, deleteScammer } from "../controllers/scammerController.js";
import { protect, admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getScammers);
router.post("/", protect, admin, createScammer);
router.delete("/:id", protect, admin, deleteScammer);

export default router;
