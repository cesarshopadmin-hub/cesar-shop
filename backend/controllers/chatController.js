import { adminAuth } from "../config/firebaseAdmin.js";
import asyncHandler from "express-async-handler";

/**
 * @desc    Generate a custom Firebase token for authenticated users
 * @route   GET /api/chat/firebase-token
 * @access  Private
 */
export const generateFirebaseToken = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    res.status(401);
    throw new Error("User unauthorized or not found in request context");
  }

  if (!adminAuth) {
    res.status(500);
    throw new Error("Firebase Admin Auth is not initialized properly check env keys.");
  }

  try {
    const firebaseToken = await adminAuth.createCustomToken(userId.toString());
    res.json({ firebaseToken });
  } catch (error) {
    console.error("Error creating Firebase custom token:", error);
    res.status(500);
    throw new Error("Failed to generate Firebase custom token");
  }
});