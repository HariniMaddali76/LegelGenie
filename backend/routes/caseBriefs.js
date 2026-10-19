
const express = require("express");
const mongoose = require("mongoose");
const CaseBrief = require("../models/CaseBrief");

const router = express.Router();

// ==========================================
// 1. SAVE A CASE BRIEF
// POST /api/case-briefs
// ==========================================
router.post("/", async (req, res) => {
  try {
    const { documentId, documentName, brief } = req.body;

    if (
      !documentName ||
      typeof documentName !== "string" ||
      !documentName.trim() ||
      !brief ||
      typeof brief !== "string" ||
      !brief.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Document name and case brief are required.",
      });
    }

    if (
      documentId &&
      !mongoose.Types.ObjectId.isValid(documentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID.",
      });
    }

    const savedBrief = await CaseBrief.create({
      documentId: documentId || null,
      documentName: documentName.trim(),
      brief: brief.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Case brief saved successfully.",
      caseBrief: savedBrief,
    });
  } catch (error) {
    console.error("Save case brief error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not save the case brief.",
    });
  }
});

// ==========================================
// 2. GET ALL SAVED CASE BRIEFS
// GET /api/case-briefs
// ==========================================
router.get("/", async (req, res) => {
  try {
    const caseBriefs = await CaseBrief.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      caseBriefs,
    });
  } catch (error) {
    console.error("Fetch case briefs error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch saved case briefs.",
    });
  }
});

// ==========================================
// 3. GET ONE SAVED CASE BRIEF
// GET /api/case-briefs/:id
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case brief ID.",
      });
    }

    const caseBrief = await CaseBrief.findById(req.params.id);

    if (!caseBrief) {
      return res.status(404).json({
        success: false,
        message: "Saved case brief not found.",
      });
    }

    return res.json({
      success: true,
      caseBrief,
    });
  } catch (error) {
    console.error("Fetch single case brief error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch the case brief.",
    });
  }
});

// ==========================================
// 4. DELETE A SAVED CASE BRIEF
// DELETE /api/case-briefs/:id
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case brief ID.",
      });
    }

    const deletedBrief = await CaseBrief.findByIdAndDelete(
      req.params.id
    );

    if (!deletedBrief) {
      return res.status(404).json({
        success: false,
        message: "Saved case brief not found.",
      });
    }

    return res.json({
      success: true,
      message: "Case brief deleted successfully.",
    });
  } catch (error) {
    console.error("Delete case brief error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not delete the case brief.",
    });
  }
});

module.exports = router;
