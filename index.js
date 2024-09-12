const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://baby-logger-1-435402.uk.r.appspot.com"
        : "http://localhost:3004",
    methods: "GET,POST,PUT,DELETE",
  })
);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

// Define the log schema and model
const logSchema = new mongoose.Schema({
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  archived: { type: Boolean, default: false }, // New field to mark a log as archived
});

const Log = mongoose.model("Log", logSchema);

// POST route to add a new log
app.post("/api/logs", async (req, res) => {
  console.log("Received body:", req.body);
  try {
    const newLog = new Log(req.body);
    await newLog.save();
    res.json(newLog);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error saving log:", error);
    res.status(500).json({ error: "Failed to save log" });
  }
});

// GET route to fetch all logs
app.get("/api/logs", async (req, res) => {
  const logs = await Log.find({ archived: false }).sort({ timestamp: -1 });
  res.json(logs);
});

// GET route to fetch archived logs
app.get("/api/logs/archived", async (req, res) => {
  const logs = await Log.find({ archived: true }).sort({ timestamp: -1 });
  res.json(logs);
});

// DELETE route to delete a log by its ID
app.delete("/api/logs/:id", async (req, res) => {
  try {
    const logId = req.params.id;
    const deletedLog = await Log.findByIdAndDelete(logId);
    if (!deletedLog) {
      return res.status(404).json({ message: "Log not found" });
    }
    res.json({ message: "Log deleted", deletedLog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// PUT route to archive a log by its ID
app.put("/api/logs/archive/:id", async (req, res) => {
  try {
    const logId = req.params.id;
    const archivedLog = await Log.findByIdAndUpdate(
      logId,
      { archived: true },
      { new: true }
    );
    if (!archivedLog) {
      return res.status(404).json({ message: "Log not found" });
    }
    res.json({ message: "Log archived", archivedLog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// // Catch-all route to serve the frontend app
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "index.html"));
// });

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
