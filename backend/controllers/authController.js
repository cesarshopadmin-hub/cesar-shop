import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { uploadToCloudinary } from "../middlewares/uploadMiddleware.js";

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, identifier, password, confirmPassword, phoneNumber } = req.body;

  if (!name || !identifier || !password || !confirmPassword) {
    res.status(400);
    throw new Error("يرجى ملء جميع الحقول المطلوبة");
  }

  if (!phoneNumber || !phoneNumber.trim()) {
    res.status(400);
    throw new Error("رقم الهاتف مطلوب للتسجيل");
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("كلمات المرور غير متطابقة");
  }

  const trimmedIdentifier = identifier.trim();
  const isEmail = trimmedIdentifier.includes("@");
  const lowercaseIdentifier = trimmedIdentifier.toLowerCase();
  const normalizedIdentifier = isEmail
    ? lowercaseIdentifier
    : trimmedIdentifier.replace(/[\s\-\(\)]/g, "");

  const normalizedPhone = phoneNumber.trim().replace(/[\s\-\(\)]/g, "");

  const existingUser = await User.findOne({
    $or: [
      { identifier: normalizedIdentifier },
      { email: isEmail ? normalizedIdentifier : "undefined_dummy_email" },
      { phoneNumber: normalizedPhone }
    ]
  });

  if (existingUser) {
    res.status(400);
    const isEmailConflict = isEmail && (
      (existingUser.email && existingUser.email.toLowerCase() === normalizedIdentifier.toLowerCase()) || 
      (existingUser.identifier && existingUser.identifier.toLowerCase() === normalizedIdentifier.toLowerCase())
    );
    const isPhoneConflict = existingUser.phoneNumber === normalizedPhone || existingUser.identifier === normalizedPhone;

    if (isEmailConflict && isPhoneConflict) {
      throw new Error("البريد الإلكتروني ورقم الهاتف مسجلان بالفعل في النظام. يرجى تسجيل الدخول.");
    }
    if (isEmailConflict) {
      throw new Error("البريد الإلكتروني هذا مسجل بالفعل في النظام. يرجى استخدام بريد آخر أو تسجيل الدخول.");
    }
    if (isPhoneConflict) {
      throw new Error("رقم الهاتف هذا مسجل بالفعل في النظام. يرجى استخدام رقم آخر أو تسجيل الدخول.");
    }
    throw new Error("البريد الإلكتروني أو رقم الهاتف مسجل بالفعل في النظام.");
  }

  const userData = {
    name,
    identifier: normalizedIdentifier,
    password,
    phoneNumber: normalizedPhone,
  };

  if (isEmail) {
    userData.email = normalizedIdentifier;
  }

  const user = await User.create(userData);

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    token: generateToken(user._id),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400);
    throw new Error("يرجى إدخال اسم المستخدم وكلمة المرور");
  }

  const trimmedIdentifier = identifier.trim();
  const isEmail = trimmedIdentifier.includes("@");
  const normalizedIdentifier = isEmail
    ? trimmedIdentifier.toLowerCase()
    : trimmedIdentifier.replace(/[\s\-\(\)]/g, "");

  const user = await User.findOne({
    $or: [
      { identifier: normalizedIdentifier },
      { email: normalizedIdentifier },
      { phoneNumber: normalizedIdentifier }
    ]
  });

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
  }

  if (user.isBlocked) {
    res.status(403);
    throw new Error("تم حظر حسابك لمخالفة شروط الاستخدام");
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
    throw new Error("المستخدم غير موجود");
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email ?? user.email;
  user.phoneNumber = req.body.phoneNumber ? req.body.phoneNumber.trim().replace(/[\s\-\(\)]/g, "") : user.phoneNumber;

  if (req.body.email) {
    user.identifier = req.body.email.toLowerCase().trim();
  } else if (req.body.phoneNumber) {
    user.identifier = req.body.phoneNumber.trim().replace(/[\s\-\(\)]/g, "");
  }

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
    throw new Error("المستخدم غير موجود");
  }

  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, "profile_pictures");
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

const addAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("يرجى ملء جميع الحقول المطلوبة");
  }

  const lowercaseEmail = email.toLowerCase().trim();

  const userExists = await User.findOne({
    $or: [
      { identifier: lowercaseEmail },
      { email: lowercaseEmail }
    ]
  });

  if (userExists) {
    res.status(400);
    throw new Error("المسؤول (الأدمن) مسجل بالفعل");
  }

  const adminUser = await User.create({
    name,
    email: lowercaseEmail,
    identifier: lowercaseEmail,
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
    throw new Error("بيانات غير صالحة");
  }
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password").sort({ createdAt: -1 });
  res.json(users);
});

const toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("المستخدم غير موجود");
  }
  if (user.role === "admin") {
    res.status(400);
    throw new Error("لا يمكن حظر حساب المسؤول (الأدمن)");
  }
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({
    message: user.isBlocked ? "تم حظر المستخدم بنجاح" : "تم إلغاء حظر المستخدم بنجاح",
    isBlocked: user.isBlocked,
  });
});

export {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  addAdmin,
  getAllUsers,
  toggleBlockUser,
};
