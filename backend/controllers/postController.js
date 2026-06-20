import asyncHandler from "express-async-handler";
import Post from "../models/Post.js";

const createPost = asyncHandler(async (req, res) => {
  const { title, description, category, price } = req.body;
  
  let imageUrls = [];
  let videoUrl = "";

  if (req.files) {
    if (req.files.images) {
      imageUrls = req.files.images.map((file) => file.path);
    }
    if (req.files.video && req.files.video.length > 0) {
      const videoFile = req.files.video[0];
      if (videoFile.size > 20 * 1024 * 1024) {
        res.status(400);
        throw new Error("حجم ملف الفيديو يتجاوز الحد الأقصى المسموح به وهو 20 ميجابايت");
      }
      videoUrl = videoFile.path;
    }
  }

  const post = await Post.create({
    user: req.user._id,
    title,
    description,
    category,
    price,
    images: imageUrls,
    videoUrl,
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
  const { title, description, category, price } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (post.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("غير مصرح لك بتعديل هذا الإعلان");
  }

  post.title = title || post.title;
  post.description = description || post.description;
  post.category = category || post.category;
  post.price = price || post.price;

  if (req.files) {
    if (req.files.images && req.files.images.length > 0) {
      const imageUrls = req.files.images.map((file) => file.path);
      post.images = imageUrls;
    }
    if (req.files.video && req.files.video.length > 0) {
      const videoFile = req.files.video[0];
      if (videoFile.size > 20 * 1024 * 1024) {
        res.status(400);
        throw new Error("حجم ملف الفيديو يتجاوز الحد الأقصى المسموح به وهو 20 ميجابايت");
      }
      post.videoUrl = videoFile.path;
    }
  }

  post.status = "pending";
  post.rejectionReason = "";

  const updatedPost = await post.save();
  res.json(updatedPost);
});



export {
  createPost,
  getApprovedPosts,
  getMyPosts,
  getPendingPosts,
  updatePostStatus,
  getPostById,
  updatePost,
};
