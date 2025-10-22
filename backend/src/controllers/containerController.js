const { SWIFT_URL } = require('../config/swiftConfig');
const axios = require('axios');
const JSZip = require('jszip');
const fs = require('fs');

const getContainers = async (req, res) => {
  try {
    const projectId = req.project.id;
    const token = req.token;

    // 1️⃣ Lấy danh sách containers
    const response = await axios.get(`${SWIFT_URL}/AUTH_${projectId}?format=json`, {
      headers: { 'X-Auth-Token': token },
    });

    const containers = response.data; // Swift trả dạng [{name, count, bytes}, ...]

    // 2️⃣ Lấy thêm thông tin chi tiết cho từng container
    const detailedContainers = await Promise.all(
      containers.map(async (container) => {
        try {
          const headRes = await axios.head(
            `${SWIFT_URL}/AUTH_${projectId}/${container.name}`,
            {
              headers: { 'X-Auth-Token': token },
            }
          );

          const h = headRes.headers;
          return {
            name: container.name,
            objects: parseInt(h['x-container-object-count'] || container.count || 0),
            bytes: parseInt(h['x-container-bytes-used'] || container.bytes || 0),
            last_modified: h['last-modified'] || null,
            content_type: h['content-type'] || '',
          };
        } catch (e) {
          console.error(`Error fetching info for container ${container.name}:`, e.message);
          return { name: container.name, error: 'Failed to fetch details' };
        }
      })
    );

    // 3️⃣ Trả kết quả về client
    return res.status(200).json({
      success: true,
      total_containers: detailedContainers.length,
      containers: detailedContainers,
    });

  } catch (error) {
    console.error('Get containers error:', error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const delContainer = async (req, res) => {
  try {
    const token = req.token; // lấy từ middleware validateToken
    const projectId = req.project.id;
    const containerName = req.params.containerName;

    // 🧩 B1: Lấy danh sách object trong container
    const listRes = await axios.get(
      `${SWIFT_URL}/AUTH_${projectId}/${containerName}?format=json`,
      { headers: { "X-Auth-Token": token } }
    );

    const objects = listRes.data || [];

    // 🧹 B2: Nếu có object thì xóa từng object
    if (objects.length > 0) {
      for (const obj of objects) {
        await axios.delete(
          `${SWIFT_URL}/AUTH_${projectId}/${containerName}/${encodeURIComponent(obj.name)}`,
          { headers: { "X-Auth-Token": token } }
        );
      }
    }

    // 🧱 B3: Sau khi container trống → xóa container
    await axios.delete(`${SWIFT_URL}/AUTH_${projectId}/${containerName}`, {
      headers: { "X-Auth-Token": token },
    });

    return res.status(200).json({
      success: true,
      message:
        objects.length > 0
          ? `Đã xóa toàn bộ ${objects.length} object và container "${containerName}".`
          : `Container "${containerName}" đã bị xóa.`,
    });
  } catch (error) {
    console.error("Lỗi khi xóa container:", error.message);

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Container không tồn tại hoặc đã bị xóa.",
      });
    }

    if (error.response?.status === 409) {
      return res.status(409).json({
        success: false,
        message: "Container không rỗng. Vui lòng thử lại hoặc bật xóa toàn bộ.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
};


const createContainer = async (req, res) => {
   try {
    const token = req.headers['x-auth-token'];
    const projectId = req.project.id;
    const { container } = req.body; // tên container gửi từ body

    if (!container) {
      return res.status(400).json({
        success: false,
        message: 'Container name is required',
      });
    }

    // Gọi Swift API tạo container
    const response = await axios.put(
      `${SWIFT_URL}/AUTH_${projectId}/${container}`,
      null, // body không cần
      {
        headers: { 'X-Auth-Token': token },
      }
    );

    const status = response.status === 201 ? 'created' : 'already exists';

    return res.status(200).json({
      success: true,
      message: `Container "${container}" ${status} successfully`,
    });
  } catch (error) {
    console.error('Create container error:', error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
}

const downloadContainer = async(req,res)=>{
  const { containerName } = req.params;
  const token = req.token;
  const projectId = req.project.id;

  try {
    const listRes = await axios.get(`${SWIFT_URL}/AUTH_${projectId}/${containerName}?format=json`, {
      headers: { 'X-Auth-Token': token }
    });

    const zip = new JSZip();

    for (const obj of listRes.data) {
      const fileRes = await axios.get(`${SWIFT_URL}/AUTH_${projectId}/${containerName}/${obj.name}`, {
        headers: { 'X-Auth-Token': token },
        responseType: 'arraybuffer'
      });
      zip.file(obj.name, fileRes.data);
    }

    const zipContent = await zip.generateAsync({ type: "nodebuffer" });
    res.setHeader("Content-Disposition", `attachment; filename=${containerName}.zip`);
    res.setHeader("Content-Type", "application/zip");
    res.send(zipContent);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getContainers,
  delContainer,
  createContainer,
  downloadContainer
}