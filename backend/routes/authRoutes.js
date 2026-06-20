import express from "express";
import { body, validationResult } from "express-validator";
import upload from "../middlewares/uploadMiddleware.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  addAdmin,
  getAllUsers,
  toggleBlockUser,
} from "../controllers/authController.js";
import { protect, admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Name must be at least 3 characters long"),
    body("identifier")
      .trim()
      .notEmpty()
      .withMessage("البريد الإلكتروني أو رقم الهاتف مطلوب")
      .custom((value) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const cleanValue = value.replace(/[\s\-\(\)]/g, "");
        const isPhone = /^\+?[1-9]\d{6,14}$/.test(cleanValue);
        if (!isEmail && !isPhone) {
          throw new Error("يجب إدخال بريد إلكتروني صالح أو رقم هاتف دولي صالح");
        }
        return true;
      }),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("confirmPassword")
      .notEmpty()
      .withMessage("Confirm password is required"),
  ],
  handleValidationErrors,
  registerUser
);

router.post(
  "/login",
  [
    body("identifier")
      .trim()
      .notEmpty()
      .withMessage("البريد الإلكتروني أو رقم الهاتف مطلوب"),
    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  handleValidationErrors,
  loginUser
);

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/profile-picture", protect, upload.single("profilePicture"), updateProfilePicture);
router.post("/add-admin", protect, admin, addAdmin);

// Admin-only User management routes
router.get("/users", protect, admin, getAllUsers);
router.put("/users/:id/block", protect, admin, toggleBlockUser);

export default router;