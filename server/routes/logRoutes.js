const express = require("express");

const router = express.Router();

const upload = require("../config/multer");

const { uploadLog, getAllEvents, getAllAlerts, getDashboardSummary, getEventsByType, getAlertsBySeverity, getRecentAlerts,
  getRecentEvents, getTopAttackingIPs, getRecommendations } = require("../controllers/logController");

router.post( "/upload", upload.single("logfile"), uploadLog);

router.get("/events", getAllEvents);
router.get("/summary", getDashboardSummary);
router.get("/alerts", getAllAlerts);
router.get("/event-types", getEventsByType);
router.get("/alert-severity", getAlertsBySeverity);
router.get("/recent-alerts", getRecentAlerts);
router.get("/recent-events", getRecentEvents);
router.get("/top-attacking-ips", getTopAttackingIPs);
router.get("/recommendations", getRecommendations);

module.exports = router;