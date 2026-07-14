import { adminAuth } from "../config/firebaseAdmin.js";
import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";

const getPublicIdFromUrl = (url) => {
  try {
    // 1. Remove the transformation segment if it exists (everything between /upload/ and the next slash or version)
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    
    let path = parts[1];
    
    // 2. Remove transformation string if it's the first segment (e.g., f_auto,q_auto,w_800/)
    if (path.includes("/") && path.split("/")[0].includes(",")) {
        path = path.substring(path.indexOf("/") + 1);
    }
    
    // 3. Remove version prefix (e.g., v1783898624/)
    if (path.startsWith("v")) {
        const slashIndex = path.indexOf("/");
        if (slashIndex !== -1) path = path.substring(slashIndex + 1);
    }
    
    // 4. Remove extension
    return path.substring(0, path.lastIndexOf('.'));
  } catch (err) {
    console.error("Error parsing Public ID:", err);
    return null;
  }
};

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

/**
 * @desc    Delete an image from Cloudinary
 * @route   POST /api/chat/delete-image
 * @access  Private
 */
export const deleteChatImage = asyncHandler(async (req, res) => {
  const { imageUrl, public_id } = req.body;

  let publicIdToDelete = public_id;

  if (!publicIdToDelete && imageUrl) {
    publicIdToDelete = getPublicIdFromUrl(imageUrl);
  }

  if (!publicIdToDelete) {
    res.status(400);
    throw new Error("يرجى تقديم public_id أو imageUrl صالح");
  }

  try {
    const result = await cloudinary.uploader.destroy(publicIdToDelete);
    if (result.result === "ok") {
      res.json({ message: "تم حذف الصورة بنجاح", result });
    } else {
      res.status(400).json({ message: "فشل حذف الصورة أو الصورة غير موجودة", result });
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    res.status(500);
    throw new Error("حدث خطأ أثناء حذف الصورة من Cloudinary");
  }
});