const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

// Limits brute-force/credential-stuffing attempts against login and register.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});


// REGISTER ROUTE
router.post("/register", authLimiter, registerUser);


// LOGIN ROUTE
router.post("/login", authLimiter, loginUser);


module.exports = router;