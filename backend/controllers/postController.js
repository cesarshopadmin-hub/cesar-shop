import asyncHandler from "express-async-handler";
import Post from "../models/Post.js";
import { uploadToCloudinary } from "../middlewares/uploadMiddleware.js";
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

const createPost = asyncHandler(async (req, res) => {
  const { whatsappNumber, countryCode, description, category, price, currency, images } = req.body;
  
  const imageUrls = Array.isArray(images) ? images : [];

  const post = await Post.create({
    user: req.user._id,
    whatsappNumber,
    countryCode,
    description,
    category,
    price,
    currency: currency || "EGP",
    images: imageUrls,
  });

  res.status(201).json(post);
});

const getApprovedPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 12);
  const skip = (page - 1) * limit;

  // Initialize a base query object that only fetches posts with status: "approved"
  const query = { status: "approved" };

  // Category Filtration: If req.query.category is provided (and is not "الكل", "all", or an empty string), add it to the query object.
  // Crucially, use a Regex to prevent trailing space issues in Arabic.
  if (
    req.query.category &&
    req.query.category !== "الكل" &&
    req.query.category !== "all" &&
    req.query.category.trim() !== ""
  ) {
    query.category = { $regex: new RegExp(req.query.category.trim(), "i") };
  }

  // Keyword Search: If req.query.keyword is provided, safely add an $or array to the query object to search within both the title and description fields.
  if (req.query.keyword && req.query.keyword.trim() !== "") {
    const keywordRegex = { $regex: new RegExp(req.query.keyword.trim(), "i") };
    query.$or = [
      { title: keywordRegex },
      { description: keywordRegex },
    ];
  }

  const total = await Post.countDocuments(query);

  const posts = await Post.find(query)
    .populate("user", "name profilePictureUrl")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const hasMore = total > page * limit;

  res.json({ posts, hasMore });
});

const getMyPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ user: req.user._id }).sort({ createdAt: -1 });

  res.json(posts);
});

const getPendingPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ status: "pending" })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json(posts);
});

const updatePostStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason, description } = req.body;

  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  post.status = status;
  post.rejectionReason = status === "rejected" ? rejectionReason || "" : "";

  if (status === "approved" && description !== undefined) {
    post.description = description;
  }

  await post.save();

  if (status === "approved") {
    await Post.collection.updateOne(
      { _id: post._id },
      { $set: { createdAt: new Date() } }
    );
    post.createdAt = new Date(); // Update the object in memory for the frontend response
  }

  res.json(post);
});
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate("user", "name email phoneNumber profilePictureUrl");

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  res.json(post);
});

const updatePost = asyncHandler(async (req, res) => {
  const { whatsappNumber, countryCode, description, category, price, currency, images } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const isAdmin = req.user && req.user.role === "admin";
  const isOwner = post.user.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    res.status(403);
    throw new Error("غير مصرح لك بتعديل هذا الإعلان");
  }

  if (!isAdmin && isOwner && post.status !== "pending" && post.status !== "rejected") {
    res.status(403);
    throw new Error("غير مصرح لك بتعديل هذا الإعلان إلا إذا كان معلقاً أو مرفوضاً");
  }

  // description, price, category, currency — updatable by both admin and owner
  post.description = description !== undefined ? description : post.description;
  post.price = price !== undefined ? price : post.price;
  post.category = category !== undefined ? category : post.category;
  post.currency = currency !== undefined ? currency : post.currency;

  if (isOwner) {
    post.whatsappNumber = whatsappNumber !== undefined ? whatsappNumber : post.whatsappNumber;
    post.countryCode = countryCode !== undefined ? countryCode : post.countryCode;

    if (Array.isArray(images)) {
      post.images = images;
    }
  }

  if (!isAdmin) {
    post.status = "pending";
    post.rejectionReason = "";
  }

  const updatedPost = await post.save();
  res.json(updatedPost);
});

const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("الإعلان غير موجود");
  }

  // Ensure only the post owner OR an admin can delete the post
  if (post.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("غير مصرح لك بحذف هذا الإعلان");
  }

  // Delete images from Cloudinary
  if (post.images && post.images.length > 0) {
    for (const imageUrl of post.images) {
      if (imageUrl && imageUrl.includes("cloudinary")) {
        try {
          const publicId = getPublicIdFromUrl(imageUrl);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (err) {
          console.error("Failed to delete post image from Cloudinary:", err);
        }
      }
    }
  }

  // Support single image field just in case
  if (post.image && post.image.includes("cloudinary")) {
    try {
      const publicId = getPublicIdFromUrl(post.image);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (err) {
      console.error("Failed to delete post image from Cloudinary:", err);
    }
  }

  // Delete the post from the database
  await post.deleteOne();

  res.json({ message: "تم حذف الإعلان بنجاح" });
});

export {
  createPost,
  getApprovedPosts,
  getMyPosts,
  getPendingPosts,
  updatePostStatus,
  getPostById,
  updatePost,
  deletePost,
};
