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
  const {  socialLinks, adminContactNumbers, alertMessage, videoLink } = req.body;

  // Build the update object from provided fields to avoid overwriting with undefined
  const updateData = {};
  if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
  if (adminContactNumbers !== undefined) updateData.adminContactNumbers = adminContactNumbers;
  if (alertMessage !== undefined) updateData.alertMessage = alertMessage;
  if (videoLink !== undefined) {
    let resolvedLink = videoLink.trim();
    if (resolvedLink.includes("tiktok.com")) {
      let match = resolvedLink.match(/video\/(\d+)/);
      if (!match) {
        try {
          const res = await fetch(resolvedLink, { redirect: "follow" });
          const finalUrl = res.url;
          match = finalUrl.match(/video\/(\d+)/);
        } catch (error) {
          console.error("Failed to resolve TikTok URL redirect:", error);
        }
      }
      if (match && match[1]) {
        resolvedLink = `https://www.tiktok.com/embed/v2/${match[1]}`;
      }
    }
    updateData.videoLink = resolvedLink;
  }

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
