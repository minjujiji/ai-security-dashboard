const express = require("express");

const router = express.Router();

const upload = require("../config/multer");

const protect = require("../middleware/authMiddleware");

const { uploadLog, getAllEvents, getAllAlerts, getDashboardSummary, getEventsByType, getAlertsBySeverity, getRecentAlerts,
  getRecentEvents, getTopAttackingIPs, getRecommendations, getEventTimeline, getSecuritySummary, getAISecurityAnalysis, } = require("../controllers/logController");

router.post( "/upload", protect, upload.single("logfile"), uploadLog);

router.get("/events", protect, getAllEvents);
router.get("/summary", protect, getDashboardSummary);
router.get("/alerts", protect, getAllAlerts);
router.get("/event-types", protect, getEventsByType);
router.get("/alert-severity", protect, getAlertsBySeverity);
router.get("/recent-alerts", protect, getRecentAlerts);
router.get("/recent-events", protect, getRecentEvents);
router.get("/top-attacking-ips", protect, getTopAttackingIPs);
router.get("/recommendations", protect, getRecommendations);
router.get("/event-timeline", protect, getEventTimeline);
router.get("/security-summary", protect, getSecuritySummary);
router.get("/ai-analysis", protect, getAISecurityAnalysis);

module.exports = router;