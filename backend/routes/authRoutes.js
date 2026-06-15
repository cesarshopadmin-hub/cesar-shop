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
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email address"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("confirmPassword")
      .notEmpty()
      .withMessage("Confirm password is required"),
    body("phoneNumber")
      .optional({ checkFalsy: true })
      .matches(/^01[0125][0-9]{8}$/)
      .withMessage("Phone number must be a valid 11-digit Egyptian number"),
  ],
  handleValidationErrors,
  registerUser
);

router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address"),
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

export default router;