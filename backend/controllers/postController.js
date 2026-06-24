import asyncHandler from "express-async-handler";
import Post from "../models/Post.js";
import { uploadToCloudinary } from "../middlewares/uploadMiddleware.js";
import { v2 as cloudinary } from "cloudinary";

const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const pathParts = parts[1].split("/");
    if (pathParts[0].startsWith("v") && /^\d+$/.test(pathParts[0].substring(1))) {
      pathParts.shift();
    }
    const filename = pathParts.join("/");
    return filename.split(".")[0];
  } catch {
    return null;
  }
};

const createPost = asyncHandler(async (req, res) => {
  const { title, description, category, price, videoUrl } = req.body;
  
  let imageUrls = [];

  if (req.files && req.files.images) {
    const uploadPromises = req.files.images.map((file) =>
      uploadToCloudinary(file.buffer, "cesar_shop_media")
    );
    const results = await Promise.all(uploadPromises);
    imageUrls = results.map((result) => result.secure_url);
  }

  const post = await Post.create({
    user: req.user._id,
    title,
    description,
    category,
    price,
    images: imageUrls,
    videoUrl: videoUrl || "",
  });

  res.status(201).json(post);
});

const getApprovedPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ status: "approved" })
    .populate("user", "name profilePictureUrl")
    .sort({ createdAt: -1 });

  res.json(posts);
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
  const { status, rejectionReason } = req.body;

  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  post.status = status;
  post.rejectionReason = status === "rejected" ? rejectionReason || "" : "";

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
  const { title, description, category, price, videoUrl } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  // Ensure only the post owner can edit the post
  if (post.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("غير مصرح لك بتعديل هذا الإعلان");
  }

  // Strict status check: can only edit if pending
  if (post.status !== "pending") {
    res.status(400);
    throw new Error("لا يمكن تعديل الإعلان بعد مراجعته");
  }

  post.title = title || post.title;
  post.description = description || post.description;
  post.category = category || post.category;
  post.price = price || post.price;

  if (videoUrl !== undefined) {
    post.videoUrl = videoUrl;
  }

  if (req.files && req.files.images && req.files.images.length > 0) {
    const uploadPromises = req.files.images.map((file) =>
      uploadToCloudinary(file.buffer, "cesar_shop_media")
    );
    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map((result) => result.secure_url);
    post.images = imageUrls;
  }

  post.status = "pending";
  post.rejectionReason = "";

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
