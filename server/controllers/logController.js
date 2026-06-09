const fs = require("fs");
const pool = require("../config/db");

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

const uploadLog = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const fileContent = fs.readFileSync(req.file.path, "utf8");
    const parsedLogs = parseLogContent(fileContent);

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

    res.status(200).json({
      message: "Log file uploaded, parsed, and saved successfully",
      filename: req.file.filename,
      logId,
      totalEvents: savedEvents.length,
      events: savedEvents,
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

module.exports = {
  uploadLog,
  getAllEvents
};