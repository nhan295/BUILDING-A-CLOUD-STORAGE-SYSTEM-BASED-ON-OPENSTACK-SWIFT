const fs = require("fs");
const path = require("path");

//  Đường dẫn tới file log
const logDir = path.join(process.cwd(), "logs");
const logFile = path.join(logDir, "activity.log");

//  Đảm bảo thư mục logs tồn tại
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 *  Ghi lại hoạt động của người dùng
 * @param {string} username - Tên người dùng
 * @param {string} action - Hành động (vd: "Create Container")
 * @param {string} details - Mô tả chi tiết hành động
 * @param {string|null} projectId - ID project liên quan (nếu có)
 * @param {string|null} projectName - Tên project (nếu có)
 */
function logActivity(username, action, details, projectId = null, projectName = null) {
  try {
    const entry = {
      username,
      action,
      details,
      projectId,
      projectName,
      time: new Date().toISOString(),
    };

    fs.appendFileSync(logFile, JSON.stringify(entry) + "\n", "utf8");
  } catch (error) {
    console.error("Error writing to log file:", error);
  }
}

/**
 * Lấy danh sách log gần nhất (có thể lọc theo project)
 * @param {number} [limit=20] - Số lượng log cần lấy
 * @param {string|null} [projectId=null] - ID project cần lọc (nếu có)
 * @returns {Array<Object>} Danh sách log
 */
function getRecentActivity(limit = 20, projectId = null) {
  try {
    if (!fs.existsSync(logFile)) return [];

    const content = fs.readFileSync(logFile, "utf8").trim();
    if (!content) return [];

    const lines = content.split("\n");
    let entries = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Lọc theo projectId nếu có
    if (projectId) {
      entries = entries.filter((e) => e.projectId === projectId);
    }

    // Trả về log mới nhất lên đầu
    return entries.slice(-limit).reverse();
  } catch (error) {
    console.error("Error reading log file:", error);
    return [];
  }
}

/**
 * Xoá bớt log cũ để tránh file quá lớn
 * @param {number} [maxLines=1000] - Số dòng log tối đa giữ lại
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
  trimLogFile,
};
