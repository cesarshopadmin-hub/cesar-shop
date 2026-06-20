import Scammer from "../models/Scammer.js";

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Get all scammers
// @route   GET /api/scammers
// @access  Public
const getScammers = asyncHandler(async (req, res) => {
  const scammers = await Scammer.find({}).sort({ createdAt: -1 });
  res.json(scammers);
});

// @desc    Add a new scammer to the list
// @route   POST /api/scammers
// @access  Private/Admin
const createScammer = asyncHandler(async (req, res) => {
  const { name, phone, reason } = req.body;

  if (!name || !phone || !reason) {
    res.status(400);
    throw new Error("يرجى ملء جميع الحقول المطلوبة (الاسم، الهاتف، السبب)");
  }

  const scammer = await Scammer.create({
    name: name.trim(),
    phone: phone.trim(),
    reason: reason.trim(),
  });

  res.status(201).json(scammer);
});

// @desc    Delete a scammer by ID
// @route   DELETE /api/scammers/:id
// @access  Private/Admin
const deleteScammer = asyncHandler(async (req, res) => {
  const scammer = await Scammer.findById(req.params.id);

  if (!scammer) {
    res.status(404);
    throw new Error("المحظر غير موجود");
  }

  await scammer.deleteOne();
  res.json({ message: "تم حذف المحظور بنجاح" });
});

export { getScammers, createScammer, deleteScammer };
