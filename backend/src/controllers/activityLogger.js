const fs = require("fs");
const path = require("path");

const logDir = path.join(process.cwd(), "logs");
const logFile = path.join(logDir, "activity.log");

// Đảm bảo thư mục logs tồn tại
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Ghi lại hoạt động của người dùng
 * @param {string} username - Tên người dùng
 * @param {string} action - Hành động (vd: Create Container)
 * @param {string} details - Mô tả chi tiết
 */
function logActivity(username, action, details) {
  try {
    const entry = {
      username,
      action,
      details,
      time: new Date().toISOString(),
    };

    fs.appendFileSync(logFile, JSON.stringify(entry) + "\n", "utf8");
  } catch (error) {
    console.error("Error writing to log file:", error);
  }
}

/**
 * Đọc các log gần nhất
 * @param {number} limit - Số lượng log cần lấy
 * @returns {Array} Mảng các log entries
 */
function getRecentActivity(limit = 20) {
  try {
    if (!fs.existsSync(logFile)) return [];

    const content = fs.readFileSync(logFile, "utf8").trim();
    if (!content) return [];

    const lines = content.split("\n");
    const recent = lines
      .slice(-limit)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    return recent.reverse(); // Mới nhất lên đầu
  } catch (error) {
    console.error("Error reading log file:", error);
    return [];
  }
}

/**
 * Xóa các log cũ (optional - để tránh file quá lớn)
 * @param {number} maxLines - Số dòng tối đa giữ lại
 */
function trimLogFile(maxLines = 1000) {
  try {
    if (!fs.existsSync(logFile)) return;

    const lines = fs.readFileSync(logFile, "utf8").trim().split("\n");
    
    if (lines.length > maxLines) {
      const keepLines = lines.slice(-maxLines);
      fs.writeFileSync(logFile, keepLines.join("\n") + "\n", "utf8");
    }
  } catch (error) {
    console.error("Error trimming log file:", error);
  }
}

module.exports = {
  logActivity,
  getRecentActivity,
  trimLogFile
};