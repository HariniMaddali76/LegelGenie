const mongoose = require("mongoose");
const documentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
    },

    // Existing field: keep it for backward compatibility
    extractedText: {
      type: String,
      default: "",
    },

    // New field: store extracted text page by page
    pages: [
      {
        pageNumber: {
          type: Number,
          required: true,
        },
        text: {
          type: String,
          default: "",
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
