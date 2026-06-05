const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const authRoutes = require("./routes/authRoutes");
const logRoutes = require("./routes/logRoutes");

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/logs", logRoutes);

app.get("/", (req, res) => {
  res.send("API running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});