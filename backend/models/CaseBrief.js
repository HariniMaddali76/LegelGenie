
const mongoose = require("mongoose");

const caseBriefSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    brief: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CaseBrief", caseBriefSchema);
