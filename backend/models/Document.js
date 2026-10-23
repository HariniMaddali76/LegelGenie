
const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    // Store the user who owns this document
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

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

    // Store the complete extracted text
    extractedText: {
      type: String,
      default: "",
    },

    // Store extracted text page by page
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
