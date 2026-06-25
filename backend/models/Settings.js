import mongoose from "mongoose";

const socialLinkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Link title is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    url: {
      type: String,
      required: [true, "Link URL is required"],
      trim: true,
    },
    platform: {
      type: String,
      required: [true, "Platform type is required"],
      enum: [
        "whatsapp",
        "facebook",
        "tiktok",
        "telegram",
        "instagram",
        "other",
      ],
      default: "whatsapp",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true },
);

const settingsSchema = new mongoose.Schema(
  {
    socialLinks: {
      type: [socialLinkSchema],
      default: [],
    },
    adminContactNumbers: {
      type: [String],
      default: [],
    },
    alertMessage: {
      type: String,
      trim: true,
      default: "احذر النصب! تعامل فقط من خلال أرقامنا الرسمية.",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Settings", settingsSchema);
