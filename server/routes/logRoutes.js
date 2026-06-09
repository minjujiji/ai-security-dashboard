const express = require("express");

const router = express.Router();

const upload = require("../config/multer");

const { uploadLog, getAllEvents } = require("../controllers/logController");

router.post(
  "/upload",
  upload.single("logfile"),
  uploadLog
);

router.get("/events", getAllEvents);

module.exports = router;