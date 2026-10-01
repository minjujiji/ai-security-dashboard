const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();
const authRoutes = require("./routes/authRoutes");
const logRoutes = require("./routes/logRoutes");

app.use(helmet());

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",")
  : ["http://localhost:5173"];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/logs", logRoutes);

app.get("/", (req, res) => {
  res.send("API running...");
});

// Keeps multer/validation errors (e.g. rejected file type) as JSON
// instead of falling through to Express's default HTML error page.
app.use((err, req, res, next) => {
  if (err) {
    console.error(err);
    return res.status(400).json({ message: err.message || "Request error" });
  }
  next();
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});