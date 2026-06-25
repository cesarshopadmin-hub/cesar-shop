import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import Settings from "../models/Settings.js";

// @desc    Reorder communication links/groups
// @route   PUT /api/links/reorder
// @access  Private/Admin
export const reorderLinks = asyncHandler(async (req, res) => {
  const links = req.body; // Expects array of [{ id, order }]

  if (!Array.isArray(links)) {
    res.status(400);
    throw new Error("Invalid request body. Expected an array of { id, order } objects.");
  }

  // Generate bulk write operations to update each subdocument's order
  const bulkOps = [];
  
  for (const item of links) {
    if (!item.id || typeof item.order !== "number") {
      res.status(400);
      throw new Error("Each item in the list must contain a valid 'id' and 'order' (Number).");
    }

    if (!mongoose.Types.ObjectId.isValid(item.id)) {
      continue; // Skip temporary client-side IDs
    }

    bulkOps.push({
      updateOne: {
        filter: { "socialLinks._id": item.id },
        update: { $set: { "socialLinks.$.order": item.order } },
      },
    });
  }

  if (bulkOps.length > 0) {
    await Settings.bulkWrite(bulkOps);
  }

  // Retrieve the updated settings and sort the links in-memory before returning
  const settings = await Settings.findOne({});
  let sortedLinks = [];
  if (settings && settings.socialLinks) {
    settings.socialLinks.sort((a, b) => (a.order || 0) - (b.order || 0));
    sortedLinks = settings.socialLinks;
  }

  res.status(200).json({
    message: "Links reordered successfully",
    socialLinks: sortedLinks,
  });
});
