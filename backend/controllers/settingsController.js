import asyncHandler from "express-async-handler";
import Settings from "../models/Settings.js";

// @desc    Get global settings
// @route   GET /api/settings
// @access  Public
export const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({});

  if (!settings) {
    settings = {};
  } else {
    settings = settings.toObject();
    if (settings.socialLinks) {
      settings.socialLinks.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  }

  res.json(settings);
});

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Protected/Admin
export const updateSettings = asyncHandler(async (req, res) => {
  const {  socialLinks, adminContactNumbers, alertMessage } = req.body;

  // Build the update object from provided fields to avoid overwriting with undefined
  const updateData = {};
  if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
  if (adminContactNumbers !== undefined) updateData.adminContactNumbers = adminContactNumbers;
  if (alertMessage !== undefined) updateData.alertMessage = alertMessage;

  let settings = await Settings.findOneAndUpdate(
    {},
    updateData,
    { new: true, upsert: true, runValidators: true }
  );

  if (settings) {
    settings = settings.toObject();
    if (settings.socialLinks) {
      settings.socialLinks.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  }

  res.json(settings);
});
