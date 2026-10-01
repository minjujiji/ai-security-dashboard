const fs = require("fs");
const pool = require("../config/db");
const { analyzeSecurityData } = require("../services/aiClient");
const {
  computeRiskScore,
  severityFromScore,
  combineSeverity,
} = require("../services/riskService");

const parseLogContent = (content) => {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines
    .map((line) => {
      const parts = line.split(" ");

      if (parts.length < 4) {
        return null;
      }

      const [date, time, eventType, ipAddress] = parts;

      return {
        timestamp: `${date} ${time}`,
        eventType,
        ipAddress,
        rawLog: line,
      };
    })
    .filter((log) => log !== null);
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

    const savedLog = await pool.query( "INSERT INTO logs (filename, user_id) VALUES ($1, $2) RETURNING *", [req.file.filename, req.user.id]);

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
      `SELECT log_events.*
      FROM log_events
      JOIN logs ON log_events.log_id = logs.id
      WHERE logs.user_id = $1
      ORDER BY log_events.event_timestamp DESC`,
      [req.user.id]
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
      `SELECT alerts.*
      FROM alerts
      JOIN logs ON alerts.log_id = logs.id
      WHERE logs.user_id = $1
      ORDER BY alerts.created_at DESC`,
      [req.user.id]
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
      `SELECT log_events.event_type, COUNT(*)
      FROM log_events
      JOIN logs ON log_events.log_id = logs.id
      WHERE logs.user_id = $1
      GROUP BY log_events.event_type
      ORDER BY COUNT(*) DESC`,
      [req.user.id]
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
      `SELECT alerts.severity, COUNT(*)
      FROM alerts
      JOIN logs ON alerts.log_id = logs.id
      WHERE logs.user_id = $1
      GROUP BY alerts.severity
      ORDER BY COUNT(*) DESC`,
      [req.user.id]
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
  `SELECT COUNT(*)
   FROM log_events
   JOIN logs ON log_events.log_id = logs.id
   WHERE logs.user_id = $1`,
  [req.user.id]
);

    const totalAlerts = await pool.query(
  `SELECT COUNT(*)
   FROM alerts
   JOIN logs ON alerts.log_id = logs.id
   WHERE logs.user_id = $1`,
  [req.user.id]
);

    const highAlerts = await pool.query(
      `SELECT COUNT(*)
      FROM alerts
      JOIN logs ON alerts.log_id = logs.id
      WHERE logs.user_id = $1 AND alerts.severity = 'High'`,
      [req.user.id]
    );

    const failedLogins = await pool.query(
      `SELECT COUNT(*)
      FROM log_events
      JOIN logs ON log_events.log_id = logs.id
      WHERE logs.user_id = $1 AND log_events.event_type = 'FAILED_LOGIN'`,
      [req.user.id]
    );

    const finalRiskScore = computeRiskScore(
      highAlerts.rows[0].count,
      failedLogins.rows[0].count
    );

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
      `SELECT alerts.*
      FROM alerts
      JOIN logs ON alerts.log_id = logs.id
      WHERE logs.user_id = $1
      ORDER BY alerts.created_at DESC
      LIMIT 5`,
      [req.user.id]
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
      `SELECT log_events.*
      FROM log_events
      JOIN logs ON log_events.log_id = logs.id
      WHERE logs.user_id = $1
      ORDER BY log_events.event_timestamp DESC
      LIMIT 5`,
      [req.user.id]
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
      `SELECT log_events.ip_address, COUNT(*) AS failed_attempts
      FROM log_events
      JOIN logs ON log_events.log_id = logs.id
      WHERE logs.user_id = $1
      AND log_events.event_type = 'FAILED_LOGIN'
      GROUP BY log_events.ip_address
      ORDER BY failed_attempts DESC
      LIMIT 5`,
      [req.user.id]
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
      `SELECT log_events.ip_address, COUNT(*) AS failed_attempts
      FROM log_events
      JOIN logs ON log_events.log_id = logs.id
      WHERE logs.user_id = $1
      AND log_events.event_type = 'FAILED_LOGIN'
      GROUP BY log_events.ip_address
      HAVING COUNT(*) >= 3
      ORDER BY failed_attempts DESC`,
      [req.user.id]
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
     `SELECT 
      log_events.event_timestamp::date AS event_date,
      COUNT(*) AS count
      FROM log_events
      JOIN logs ON log_events.log_id = logs.id
      WHERE logs.user_id = $1
      GROUP BY log_events.event_timestamp::date
      ORDER BY event_date ASC`,
      [req.user.id]
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
      `SELECT COUNT(*)
       FROM log_events
       JOIN logs ON log_events.log_id = logs.id
       WHERE logs.user_id = $1`,
      [req.user.id]
    );

    const failedLogins = await pool.query(
      `SELECT COUNT(*)
       FROM log_events
       JOIN logs ON log_events.log_id = logs.id
       WHERE logs.user_id = $1 AND log_events.event_type = 'FAILED_LOGIN'`,
      [req.user.id]
    );

    const totalAlerts = await pool.query(
      `SELECT COUNT(*)
       FROM alerts
       JOIN logs ON alerts.log_id = logs.id
       WHERE logs.user_id = $1`,
      [req.user.id]
    );

    const topIP = await pool.query(
      `SELECT log_events.ip_address, COUNT(*) AS failed_attempts
       FROM log_events
       JOIN logs ON log_events.log_id = logs.id
       WHERE logs.user_id = $1 AND log_events.event_type = 'FAILED_LOGIN'
       GROUP BY log_events.ip_address
       ORDER BY failed_attempts DESC
       LIMIT 1`,
      [req.user.id]
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
        (SELECT COUNT(*) FROM log_events JOIN logs ON log_events.log_id = logs.id WHERE logs.user_id = $1) AS total_events,
        (SELECT COUNT(*) FROM alerts JOIN logs ON alerts.log_id = logs.id WHERE logs.user_id = $1) AS total_alerts,
        (SELECT COUNT(*) FROM alerts JOIN logs ON alerts.log_id = logs.id WHERE logs.user_id = $1 AND alerts.severity = 'High') AS high_alerts,
        (SELECT COUNT(*) FROM log_events JOIN logs ON log_events.log_id = logs.id WHERE logs.user_id = $1 AND log_events.event_type = 'FAILED_LOGIN') AS failed_logins`,
      [req.user.id]
    );

    const topIPs = await pool.query(
      `SELECT log_events.ip_address, COUNT(*) AS failed_attempts
       FROM log_events
       JOIN logs ON log_events.log_id = logs.id
       WHERE logs.user_id = $1 AND log_events.event_type = 'FAILED_LOGIN'
       GROUP BY log_events.ip_address
       ORDER BY failed_attempts DESC
       LIMIT 5`,
      [req.user.id]
    );

    const recentAlerts = await pool.query(
      `SELECT alerts.severity, alerts.message, alerts.ip_address, alerts.created_at
       FROM alerts
       JOIN logs ON alerts.log_id = logs.id
       WHERE logs.user_id = $1
       ORDER BY alerts.created_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    // Deterministic rules first
    const row = summary.rows[0];
    const riskScore = computeRiskScore(row.high_alerts, row.failed_logins);
    const ruleSeverity = severityFromScore(riskScore);

    // AI reasoning second (FastAPI + Gemini, Ollama fallback)
    const ai = await analyzeSecurityData({
      summary: row,
      top_attacking_ips: topIPs.rows,
      recent_alerts: recentAlerts.rows,
      risk_score: riskScore,
      rule_based_severity: ruleSeverity,
    });

    // Final severity is never lower than what the rules established
    const finalSeverity = combineSeverity(ruleSeverity, ai.severity);

    res.status(200).json({
      severity: finalSeverity,
      ruleSeverity,
      aiSeverity: ai.severity || null,
      riskScore,
      mainFinding: ai.main_finding,
      summary: ai.summary,
      suspiciousIps: ai.suspicious_ips,
      recommendedActions: ai.recommended_actions,
      provider: ai.provider,
      model: ai.model,
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