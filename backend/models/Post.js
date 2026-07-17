import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "فري فاير",
          "ببجي",
          "بيس فيفا و كلاش",
          "بلود سترايك",
          "روبلوكس",
          "حسابات سوشيال ميديا",
          "اخري",
        ],
        message: "{VALUE} is not a valid category",
      },
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    currency: {
      type: String,
      enum: ["EGP", "USD", "SAR", "AED"],
      default: "EGP",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    whatsappNumber: {
      type: String,
      required: [true, "WhatsApp number is required"],
      trim: true,
    },
    countryCode: {
      type: String,
      required: [true, "Country code is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Post", postSchema);
