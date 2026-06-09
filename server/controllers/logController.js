const fs = require("fs");

const parseLogContent = (content) => {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const parsedLogs = lines.map((line) => {
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

  return parsedLogs;
};

const uploadLog = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const fileContent = fs.readFileSync(
      req.file.path,
      "utf8"
    );

    const parsedLogs = parseLogContent(fileContent);

    res.status(200).json({
      message: "File parsed successfully",
      filename: req.file.filename,
      totalEvents: parsedLogs.length,
      parsedLogs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  uploadLog,
};