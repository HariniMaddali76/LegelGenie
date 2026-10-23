const express = require("express");
const mongoose = require("mongoose");
const CaseBrief = require("../models/CaseBrief");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Require login for every case-brief route
router.use(authMiddleware);

// 1. SAVE CASE BRIEF
router.post("/", async (req, res) => {
  try {
    const { documentId, documentName, brief } = req.body;

    if (
      typeof documentName !== "string" ||
      !documentName.trim() ||
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
      userId: req.userId,
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

// 2. GET ONLY THE LOGGED-IN USER'S CASE BRIEFS
router.get("/", async (req, res) => {
  try {
    const caseBriefs = await CaseBrief.find({
      userId: req.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, caseBriefs });
  } catch (error) {
    console.error("Fetch case briefs error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not fetch saved case briefs.",
    });
  }
});

// 3. GET ONE CASE BRIEF OWNED BY THE LOGGED-IN USER
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case brief ID.",
      });
    }

    const caseBrief = await CaseBrief.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!caseBrief) {
      return res.status(404).json({
        success: false,
        message: "Saved case brief not found.",
      });
    }

    return res.json({ success: true, caseBrief });
  } catch (error) {
    console.error("Fetch single case brief error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not fetch the case brief.",
    });
  }
});

// 4. DELETE ONLY A CASE BRIEF OWNED BY THE LOGGED-IN USER
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case brief ID.",
      });
    }

    const deletedBrief = await CaseBrief.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

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