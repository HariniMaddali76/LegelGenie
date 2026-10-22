
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

const documentRoutes = require("./routes/documents");
const researchRoutes = require("./routes/research");
const caseBriefRoutes = require("./routes/caseBriefs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded PDF files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// API Routes
app.use("/api/documents", documentRoutes);
app.use("/api/research", researchRoutes);
app.use("/api/case-briefs", caseBriefRoutes);

// Welcome route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to LegalGenie API!",
    status: "Backend is running",
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "LegalGenie server is healthy",
  });
});

// Start server after connecting to MongoDB
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `LegalGenie server running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server startup failed because MongoDB is unavailable.",
      error.message
    );
    process.exit(1);
  }
};

startServer();