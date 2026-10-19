
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Document = require("../models/Document");
const { PDFParse } = require("pdf-parse");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");

fs.mkdirSync(uploadDir, { recursive: true });

// ==========================================
// MULTER STORAGE CONFIGURATION
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}.pdf`;

    cb(null, uniqueName);
  },
});

// ==========================================
// PDF UPLOAD VALIDATION
// ==========================================
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" &&
      path.extname(file.originalname).toLowerCase() === ".pdf";

    if (isPdf) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."));
    }
  },
});

// ==========================================
// UPLOAD PDF AND EXTRACT TEXT
// POST /api/documents/upload
// ==========================================
router.post("/upload", (req, res) => {
  upload.single("document")(req, res, async (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a PDF file.",
      });
    }

    let parser;

    try {
      // Read the uploaded PDF
      const pdfBuffer = fs.readFileSync(req.file.path);

      // Extract text using pdf-parse v2
      parser = new PDFParse({
        data: pdfBuffer,
      });

      const result = await parser.getText();
      const extractedText =
        typeof result.text === "string" ? result.text.trim() : "";

      console.log(
        `PDF: ${req.file.originalname} | Extracted text length: ${extractedText.length}`
      );

      // Save PDF details and extracted text in MongoDB
      const savedDocument = await Document.create({
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        extractedText,
      });

      return res.status(201).json({
        success: true,
        message: extractedText
          ? "PDF uploaded and text extracted successfully!"
          : "PDF uploaded, but no selectable text was found. This may be a scanned PDF.",
        document: {
          id: savedDocument._id,
          name: savedDocument.originalName,
          size: savedDocument.fileSize,
          extractedTextLength: extractedText.length,
        },
      });
    } catch (uploadError) {
      // Remove the uploaded file if processing or saving fails
      fs.unlink(req.file.path, () => {});

      console.error("PDF upload/extraction error:", uploadError.message);

      return res.status(500).json({
        success: false,
        message: "Could not process the PDF. Please try another PDF.",
      });
    } finally {
      if (parser) {
        try {
          await parser.destroy();
        } catch (cleanupError) {
          console.error(
            "PDF parser cleanup error:",
            cleanupError.message
          );
        }
      }
    }
  });
});

// ==========================================
// GET ALL UPLOADED DOCUMENTS
// GET /api/documents
// ==========================================
router.get("/", async (req, res) => {
  try {
    const documents = await Document.find()
      .select("originalName fileSize createdAt")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("Fetch documents error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch documents.",
    });
  }
});

/* ==========================================
   DELETE DOCUMENT FROM DATABASE AND UPLOADS
   DELETE /api/documents/:id
========================================== */
router.delete("/:id", async (req, res) => {
  try {
    const mongoose = require("mongoose");

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID.",
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    // Delete the uploaded PDF file
    const filePath = document.filePath;

    await Document.findByIdAndDelete(req.params.id);

    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (fileError) {
        console.error(
          "Could not delete PDF file:",
          fileError.message
        );
      }
    }

    return res.json({
      success: true,
      message: "Document deleted successfully.",
    });
  } catch (error) {
    console.error("Delete document error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not delete the document.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const { id } = req.params;

    // Validate MongoDB document ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID.",
      });
    }

    // Find document in MongoDB
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    // Delete document record from MongoDB
    await Document.findByIdAndDelete(id);

    // Delete uploaded PDF from local storage, if available
    if (document.filePath && fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
      } catch (fileError) {
        console.error("PDF file deletion error:", fileError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "PDF deleted successfully.",
    });
  } catch (error) {
    console.error("Delete document error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting PDF.",
    });
  }
});

module.exports = router;
