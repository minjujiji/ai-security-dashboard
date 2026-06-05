/** Responsibilities:
 * Receive file
Read contents
Parse entries
Store in database
Return results */

const fs = require("fs");

const uploadLog = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const fileContent = fs.readFileSync( req.file.path, "utf8" );

    res.status(200).json({
        message: "File processed successfully",
        filename: req.file.filename,
        content: fileContent,
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