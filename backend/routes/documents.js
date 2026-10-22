
// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const Document = require("../models/Document");
// const mongoose = require("mongoose");
// const { PDFParse } = require("pdf-parse");

// const router = express.Router();

// const uploadDir = path.join(__dirname, "../uploads");
// fs.mkdirSync(uploadDir, { recursive: true });

// // Multer storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },

//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(
//       Math.random() * 1e9
//     )}.pdf`;

//     cb(null, uniqueName);
//   },
// });

// // PDF validation and upload limit
// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024,
//   },

//   fileFilter: (req, file, cb) => {
//     const isPdf =
//       file.mimetype === "application/pdf" &&
//       path.extname(file.originalname).toLowerCase() === ".pdf";

//     if (isPdf) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only PDF files are allowed."));
//     }
//   },
// });

// // ==========================================
// // UPLOAD PDF AND EXTRACT PAGE-WISE TEXT
// // POST /api/documents/upload
// // ==========================================
// router.post("/upload", (req, res) => {
//   upload.single("document")(req, res, async (error) => {
//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: error.message,
//       });
//     }

//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Please select a PDF file.",
//       });
//     }

//     let parser;

//     try {
//       const pdfBuffer = fs.readFileSync(req.file.path);

//       parser = new PDFParse({
//         data: pdfBuffer,
//       });

//       const result = await parser.getText();

//       const extractedText =
//         typeof result.text === "string"
//           ? result.text.trim()
//           : "";

//       // Preserve page boundaries and original page numbers.
//       const pages = Array.isArray(result.pages)
//         ? result.pages.map((page, index) => ({
//             pageNumber:
//               Number(page.pageNumber ?? page.num ?? index + 1),
//             text:
//               typeof page.text === "string"
//                 ? page.text.trim()
//                 : "",
//           }))
//         : [];

//       console.log(
//         `PDF: ${req.file.originalname} | ` +
//         `Text length: ${extractedText.length} | ` +
//         `Pages extracted: ${pages.length}`
//       );

//       const savedDocument = await Document.create({
//         originalName: req.file.originalname,
//         fileName: req.file.filename,
//         filePath: req.file.path,
//         fileSize: req.file.size,
//         extractedText,
//         pages,
//       });

//       return res.status(201).json({
//         success: true,
//         message: extractedText
//           ? "PDF uploaded and text extracted successfully."
//           : "PDF uploaded, but no selectable text was found. It may be a scanned PDF.",
//         document: {
//           id: savedDocument._id,
//           name: savedDocument.originalName,
//           size: savedDocument.fileSize,
//           extractedTextLength: extractedText.length,
//           pagesExtracted: pages.length,
//           pageWiseTextAvailable: pages.length > 0,
//         },
//       });
//     } catch (uploadError) {
//       // Remove the uploaded file if processing or saving fails.
//       if (req.file?.path && fs.existsSync(req.file.path)) {
//         fs.unlink(req.file.path, () => {});
//       }

//       console.error(
//         "PDF upload/extraction error:",
//         uploadError.message
//       );

//       return res.status(500).json({
//         success: false,
//         message: "Could not process the PDF. Please try another PDF.",
//       });
//     } finally {
//       if (parser) {
//         try {
//           await parser.destroy();
//         } catch (cleanupError) {
//           console.error(
//             "PDF parser cleanup error:",
//             cleanupError.message
//           );
//         }
//       }
//     }
//   });
// });

// /* ==========================================
//    OPEN ORIGINAL PDF AT A SPECIFIC PAGE
//    GET /api/documents/:id/pdf
// ========================================== */
// router.get("/:id/pdf", async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid document ID.",
//       });
//     }

//     const document = await Document.findById(id);

//     if (!document) {
//       return res.status(404).json({
//         success: false,
//         message: "Document not found.",
//       });
//     }

//     // Only serve PDFs stored in the backend uploads folder.
//     const savedPath = path.resolve(document.filePath);
//     const uploadsPath = path.resolve(uploadDir);

//     if (
//       path.dirname(savedPath) !== uploadsPath ||
//       !savedPath.toLowerCase().endsWith(".pdf")
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid PDF file path.",
//       });
//     }

//     if (!fs.existsSync(savedPath)) {
//       return res.status(404).json({
//         success: false,
//         message: "PDF file not found on the server.",
//       });
//     }

//     return res.sendFile(savedPath, {
//       headers: {
//         "Content-Type": "application/pdf",
//         "Content-Disposition": "inline",
//       },
//     });
//   } catch (error) {
//     console.error("Open PDF error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Could not open the PDF.",
//     });
//   }
// });

// // ==========================================
// // GET ALL UPLOADED DOCUMENTS
// // GET /api/documents
// // ==========================================
// router.get("/", async (req, res) => {
//   try {
//     const documents = await Document.find()
//       .select("originalName fileSize createdAt")
//       .sort({ createdAt: -1 });

//     return res.json({
//       success: true,
//       documents,
//     });
//   } catch (error) {
//     console.error("Fetch documents error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Could not fetch documents.",
//     });
//   }
// });

// // ==========================================
// // DELETE DOCUMENT
// // DELETE /api/documents/:id
// // ==========================================
// router.delete("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid document ID.",
//       });
//     }

//     const document = await Document.findById(id);

//     if (!document) {
//       return res.status(404).json({
//         success: false,
//         message: "Document not found.",
//       });
//     }

//     await Document.findByIdAndDelete(id);

//     if (document.filePath && fs.existsSync(document.filePath)) {
//       try {
//         fs.unlinkSync(document.filePath);
//       } catch (fileError) {
//         console.error(
//           "Could not delete PDF file:",
//           fileError.message
//         );
//       }
//     }

//     return res.json({
//       success: true,
//       message: "Document deleted successfully.",
//     });
//   } catch (error) {
//     console.error("Delete document error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Could not delete the document.",
//     });
//   }
// });

// module.exports = router;
//2

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Document = require("../models/Document");
const mongoose = require("mongoose");
const { PDFParse } = require("pdf-parse");

const router = express.Router();

const uploadDir = path.resolve(__dirname, "../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage
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

// PDF validation and upload limit
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
// UPLOAD PDF AND EXTRACT PAGE-WISE TEXT
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
      const pdfBuffer = fs.readFileSync(req.file.path);

      parser = new PDFParse({
        data: pdfBuffer,
      });

      const result = await parser.getText();

      const extractedText =
        typeof result.text === "string"
          ? result.text.trim()
          : "";

      const pages = Array.isArray(result.pages)
        ? result.pages.map((page, index) => ({
            pageNumber: Number(
              page.pageNumber ?? page.num ?? index + 1
            ),
            text:
              typeof page.text === "string"
                ? page.text.trim()
                : "",
          }))
        : [];

      console.log(
        `PDF: ${req.file.originalname} | ` +
          `Text length: ${extractedText.length} | ` +
          `Pages extracted: ${pages.length}`
      );

      const savedDocument = await Document.create({
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        extractedText,
        pages,
      });

      return res.status(201).json({
        success: true,
        message: extractedText
          ? "PDF uploaded and text extracted successfully."
          : "PDF uploaded, but no selectable text was found. It may be a scanned PDF.",
        document: {
          id: savedDocument._id,
          name: savedDocument.originalName,
          size: savedDocument.fileSize,
          extractedTextLength: extractedText.length,
          pagesExtracted: pages.length,
          pageWiseTextAvailable: pages.length > 0,
        },
      });
    } catch (uploadError) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, () => {});
      }

      console.error(
        "PDF upload/extraction error:",
        uploadError.message
      );

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
// OPEN ORIGINAL PDF AT A SPECIFIC PAGE
// GET /api/documents/:id/pdf
// ==========================================
router.get("/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID.",
      });
    }

    const document = await Document.findById(id).select(
      "filePath fileName"
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    // Confirm the file is directly inside the uploads folder.
    const savedPath = path.resolve(document.filePath);
    const uploadsPath = path.resolve(uploadDir);

    if (
      path.dirname(savedPath) !== uploadsPath ||
      path.basename(savedPath) !== document.fileName ||
      path.extname(savedPath).toLowerCase() !== ".pdf"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid PDF file path.",
      });
    }

    if (!fs.existsSync(savedPath)) {
      return res.status(404).json({
        success: false,
        message: "PDF file not found on the server.",
      });
    }

    return res.sendFile(
      savedPath,
      {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline",
        },
      },
      (error) => {
        if (error && !res.headersSent) {
          console.error("Send PDF error:", error.message);
          res.status(500).json({
            success: false,
            message: "Could not send the PDF file.",
          });
        }
      }
    );
  } catch (error) {
    console.error("Open PDF error:", error.message);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Could not open the PDF.",
      });
    }
  }
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

// ==========================================
// DELETE DOCUMENT
// DELETE /api/documents/:id
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID.",
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    await Document.findByIdAndDelete(id);

    if (document.filePath && fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
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

module.exports = router;
