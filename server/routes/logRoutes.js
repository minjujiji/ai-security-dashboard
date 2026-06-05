const express = require("express");

const router = express.Router();

const upload =
  require("../config/multer");

const {
  uploadLog,
} = require("../controllers/logController");

router.post(
  "/upload",
  upload.single("logfile"),
  uploadLog
);

module.exports = router;