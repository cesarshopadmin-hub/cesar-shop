import mongoose from "mongoose";

const scammerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Scammer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Scammer phone is required"],
      trim: true,
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Scammer", scammerSchema);
