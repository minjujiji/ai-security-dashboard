const fs = require("fs");
const pool = require("../config/db");
// const {generateSecurityAnalysis} = require("../services/geminiService");
const {generateSecurityAnalysis} = require("../services/ollamaService");

const parseLogContent = (content) => {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    const parts = line.split(" ");

    const date = parts[0];
    const time = parts[1];
    const eventType = parts[2];
    const ipAddress = parts[3];

    return {
      timestamp: `${date} ${time}`,
      eventType,
      ipAddress,
      rawLog: line,
    };
  });
};

const detectThreats = (parsedLogs) => {
  const failedLoginCounts = {};
  const alerts = [];

  parsedLogs.forEach((log) => {
    if (log.eventType === "FAILED_LOGIN") {
      failedLoginCounts[log.ipAddress] =
        (failedLoginCounts[log.ipAddress] || 0) + 1;
    }
  });

  Object.keys(failedLoginCounts).forEach((ip) => {
    if (failedLoginCounts[ip] >= 3) {
      alerts.push({
        severity: "High",
        message: `Possible brute-force attack detected from IP ${ip}`,
        ipAddress: ip,
      });
    }
  });

  return alerts;
};

const uploadLog = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const fileContent = fs.readFileSync(req.file.path, "utf8");
    const parsedLogs = parseLogContent(fileContent);
    const detectedAlerts = detectThreats(parsedLogs);

    const savedLog = await pool.query(
      "INSERT INTO logs (filename) VALUES ($1) RETURNING *",
      [req.file.filename]
    );

    const logId = savedLog.rows[0].id;

    const savedEvents = [];

    for (const log of parsedLogs) {
      const result = await pool.query(
        `INSERT INTO log_events 
        (log_id, event_timestamp, event_type, ip_address, raw_log)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          logId,
          log.timestamp,
          log.eventType,
          log.ipAddress,
          log.rawLog,
        ]
      );

      savedEvents.push(result.rows[0]);
    }

    const savedAlerts = [];

    for (const alert of detectedAlerts) {
      const result = await pool.query(
        `INSERT INTO alerts 
        (log_id, severity, message, ip_address)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [
          logId,
          alert.severity,
          alert.message,
          alert.ipAddress,
        ]
      );

      savedAlerts.push(result.rows[0]);
    }

    res.status(200).json({
      message: "Log file uploaded, parsed, and saved successfully",
      filename: req.file.filename,
      logId,
      totalEvents: savedEvents.length,
      events: savedEvents,
      alerts: savedAlerts,
      totalAlerts: savedAlerts.length,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getAllEvents = async (req, res) => {
  try {

    const events = await pool.query(
      `SELECT * FROM log_events
       ORDER BY event_timestamp DESC`
    );

    res.status(200).json(events.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error",
    });

  }
};

const getAllAlerts = async (req, res) => {
  try {
    const alerts = await pool.query(
      `SELECT * FROM alerts
       ORDER BY created_at DESC`
    );

    res.status(200).json(alerts.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getEventsByType = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT event_type, COUNT(*) 
       FROM log_events
       GROUP BY event_type
       ORDER BY COUNT(*) DESC`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getAlertsBySeverity = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT severity, COUNT(*)
       FROM alerts
       GROUP BY severity
       ORDER BY COUNT(*) DESC`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getDashboardSummary = async (req, res) => {
  try {
    const totalEvents = await pool.query(
      "SELECT COUNT(*) FROM log_events"
    );

    const totalAlerts = await pool.query(
      "SELECT COUNT(*) FROM alerts"
    );

    const highAlerts = await pool.query(
      "SELECT COUNT(*) FROM alerts WHERE severity = 'High'"
    );

    const failedLogins = await pool.query(
      "SELECT COUNT(*) FROM log_events WHERE event_type = 'FAILED_LOGIN'"
    );

    const riskScore = Number(highAlerts.rows[0].count) * 30 + Number(failedLogins.rows[0].count) * 5;

    const finalRiskScore = Math.min(riskScore, 100);

    res.status(200).json({
      totalEvents: Number(totalEvents.rows[0].count),
      totalAlerts: Number(totalAlerts.rows[0].count),
      highAlerts: Number(highAlerts.rows[0].count),
      failedLogins: Number(failedLogins.rows[0].count),
      riskScore: finalRiskScore,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const getRecentAlerts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM alerts
       ORDER BY created_at DESC
       LIMIT 5`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getRecentEvents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM log_events
       ORDER BY event_timestamp DESC
       LIMIT 5`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getTopAttackingIPs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ip_address, COUNT(*) AS failed_attempts
       FROM log_events
       WHERE event_type = 'FAILED_LOGIN'
       GROUP BY ip_address
       ORDER BY failed_attempts DESC
       LIMIT 5`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const topIPs = await pool.query(
      `SELECT ip_address, COUNT(*) AS failed_attempts
       FROM log_events
       WHERE event_type = 'FAILED_LOGIN'
       GROUP BY ip_address
       HAVING COUNT(*) >= 3
       ORDER BY failed_attempts DESC`
    );

    const recommendations = topIPs.rows.map((ip) => ({
      title: `Block or monitor IP ${ip.ip_address}`,
      description: `${ip.ip_address} has ${ip.failed_attempts} failed login attempts. This may indicate brute-force activity.`,
      priority: "High",
    }));

    res.status(200).json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getEventTimeline = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DATE(event_timestamp) AS date, COUNT(*) AS count
       FROM log_events
       GROUP BY DATE(event_timestamp)
       ORDER BY date ASC`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getSecuritySummary = async (req, res) => {
  try {
    const totalEvents = await pool.query(
      "SELECT COUNT(*) FROM log_events"
    );

    const failedLogins = await pool.query(
      "SELECT COUNT(*) FROM log_events WHERE event_type = 'FAILED_LOGIN'"
    );

    const totalAlerts = await pool.query(
      "SELECT COUNT(*) FROM alerts"
    );

    const topIP = await pool.query(
      `SELECT ip_address, COUNT(*) AS failed_attempts
       FROM log_events
       WHERE event_type = 'FAILED_LOGIN'
       GROUP BY ip_address
       ORDER BY failed_attempts DESC
       LIMIT 1`
    );

    const topIpAddress =
      topIP.rows.length > 0 ? topIP.rows[0].ip_address : "None";

    const summary = [
      `${totalEvents.rows[0].count} log events were analyzed.`,
      `${failedLogins.rows[0].count} failed login attempts were detected.`,
      `${totalAlerts.rows[0].count} security alerts were generated.`,
      `Highest-risk IP address: ${topIpAddress}.`,
      "Recommended action: Review repeated failed logins, monitor suspicious IPs, and consider blocking high-risk sources.",
    ];

    res.status(200).json({
      summary,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const getAISecurityAnalysis = async (req, res) => {
  try {
    const summary = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM log_events) AS total_events,
        (SELECT COUNT(*) FROM alerts) AS total_alerts,
        (SELECT COUNT(*) FROM log_events WHERE event_type = 'FAILED_LOGIN') AS failed_logins`
    );

    const topIPs = await pool.query(
      `SELECT ip_address, COUNT(*) AS failed_attempts
       FROM log_events
       WHERE event_type = 'FAILED_LOGIN'
       GROUP BY ip_address
       ORDER BY failed_attempts DESC
       LIMIT 5`
    );

    const recentAlerts = await pool.query(
      `SELECT severity, message, ip_address, created_at
       FROM alerts
       ORDER BY created_at DESC
       LIMIT 5`
    );

    const securityData = {
      summary: summary.rows[0],
      topAttackingIPs: topIPs.rows,
      recentAlerts: recentAlerts.rows,
    };

    const analysis = await generateSecurityAnalysis(securityData);

    res.status(200).json({
      analysis,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "AI analysis failed",
    });
  }
};

module.exports = {
  uploadLog,
  getAllEvents,
  getAllAlerts,
  getDashboardSummary,
  getEventsByType,
  getAlertsBySeverity,
  getRecentAlerts,
  getRecentEvents,
  getTopAttackingIPs,
  getRecommendations,
  getEventTimeline,
  getSecuritySummary,
  getAISecurityAnalysis,
};