const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const database = require("./config/database");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Import routes
const customerRoutes = require("./routes/customerRoutes");
const courierRoutes = require("./routes/courierRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const reportRoutes = require("./routes/reportRoutes");

// Use routes
app.use("/api/customers", customerRoutes);
app.use("/api/couriers", courierRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/reports", reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: err.message
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await database.initialize();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  await database.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  await database.close();
  process.exit(0);
});

startServer();
