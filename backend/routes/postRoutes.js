import express from "express";
import { body, validationResult } from "express-validator";
import upload from "../middlewares/uploadMiddleware.js";
import {
  createPost,
  getApprovedPosts,
  getMyPosts,
  getPendingPosts,
  updatePostStatus,
  getPostById,
  updatePost,
  deletePost,
} from "../controllers/postController.js";
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

const postValidationRules = [
  body("whatsappNumber")
    .notEmpty()
    .withMessage("WhatsApp number is required")
    .isNumeric()
    .withMessage("WhatsApp number must contain only numbers")
    .isLength({ min: 4, max: 15 })
    .withMessage("WhatsApp number must be between 4 and 15 digits"),
  body("countryCode")
    .notEmpty()
    .withMessage("Country code is required")
    .isNumeric()
    .withMessage("Country code must contain only numbers"),
  body("description")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters long"),
  body("price").isNumeric().withMessage("Price must be numeric"),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn([
      "فري فاير",
      "ببجي",
      "بيس فيفا و كلاش",
      "حسابات سوشيال ميديا",
      "اخري",
    ])
    .withMessage("Invalid category"),
];

router.post(
  "/",
  protect,
  upload.fields([
    { name: "images", maxCount: 5 }
  ]),
  postValidationRules,
  handleValidationErrors,
  createPost,
);

router.get("/", getApprovedPosts);
router.get("/my-posts", protect, getMyPosts);
router.get("/pending", protect, admin, getPendingPosts);

router.put(
  "/:id/status",
  protect,
  admin,
  [
    body("status")
      .isIn(["approved", "rejected"])
      .withMessage("Status must be approved or rejected"),
  ],
  handleValidationErrors,
  updatePostStatus,
);

router.get("/:id", getPostById);
router.put(
  "/:id",
  protect,
  upload.fields([
    { name: "images", maxCount: 5 }
  ]),
  postValidationRules,
  handleValidationErrors,
  updatePost
);
router.delete("/:id", protect, deletePost);

export default router;
