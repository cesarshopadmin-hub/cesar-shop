import asyncHandler from "express-async-handler";
import Settings from "../models/Settings.js";

// @desc    Get global settings
// @route   GET /api/settings
// @access  Public
export const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({});

  if (!settings) {
    settings = {};
  }

  res.json(settings);
});

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Protected/Admin
export const updateSettings = asyncHandler(async (req, res) => {
  const {  socialLinks, adminContactNumber, alertMessage } = req.body;

  // Build the update object from provided fields to avoid overwriting with undefined
  const updateData = {};
  if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
  if (adminContactNumber !== undefined) updateData.adminContactNumber = adminContactNumber;
  if (alertMessage !== undefined) updateData.alertMessage = alertMessage;

  const settings = await Settings.findOneAndUpdate(
    {},
    updateData,
    { new: true, upsert: true, runValidators: true }
  );

  res.json(settings);
});
