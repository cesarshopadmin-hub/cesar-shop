import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { v2 as cloudinary } from "cloudinary";

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, phoneNumber } = req.body;

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    phoneNumber,
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber,
    profilePictureUrl: user.profilePictureUrl,
    token: generateToken(user._id),
  });
});

const getUserProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.phoneNumber = req.body.phoneNumber ?? user.phoneNumber;

  if (req.body.password) {
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    phoneNumber: updatedUser.phoneNumber,
    profilePictureUrl: updatedUser.profilePictureUrl,
    token: generateToken(updatedUser._id),
  });
});
const updateProfilePicture = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "profile_pictures",
    });
    user.profilePictureUrl = result.secure_url;
  }

  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    profilePictureUrl: user.profilePictureUrl,
  });
});
// @desc    Register a new admin (Admin only)
// @route   POST /api/users/add-admin
// @access  Private/Admin
const addAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const adminUser = await User.create({
    name,
    email,
    password,
    role: "admin", 
  });

  if (adminUser) {
    res.status(201).json({
      _id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      message: "تم إضافة الأدمن بنجاح",
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});



export {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  addAdmin,
};
