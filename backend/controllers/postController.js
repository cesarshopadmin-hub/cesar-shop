import asyncHandler from "express-async-handler";
import Post from "../models/Post.js";

const createPost = asyncHandler(async (req, res) => {
  const { title, description, category, price, images } = req.body;
  const imageUrls = req.files ? req.files.map((file) => file.path) : [];

  const post = await Post.create({
    user: req.user._id,
    title,
    description,
    category,
    price,
    images: imageUrls,
  });

  res.status(201).json(post);
});

const getApprovedPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ status: "approved" }).populate(
    "user",
    "name profilePictureUrl",
  );

  res.json(posts);
});

const getMyPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ user: req.user._id });

  res.json(posts);
});

const getPendingPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ status: "pending" }).populate(
    "user",
    "name email",
  );

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

  const updatedPost = await post.save();

  res.json(updatedPost);
});

export {
  createPost,
  getApprovedPosts,
  getMyPosts,
  getPendingPosts,
  updatePostStatus,
};
