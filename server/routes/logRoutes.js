const express = require("express");

const router = express.Router();

const upload = require("../config/multer");

const { uploadLog, getAllEvents, getAllAlerts } = require("../controllers/logController");

router.post( "/upload", upload.single("logfile"), uploadLog);

router.get("/events", getAllEvents);

router.get("/alerts", getAllAlerts);

module.exports = router;