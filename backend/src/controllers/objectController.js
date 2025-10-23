const { SWIFT_URL } = require('../config/swiftConfig');
const axios = require('axios');

const getObject = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];
    const projectId = req.project.id;
    const containerName = req.params.container;

    if (!containerName) {
      return res.status(400).json({
        success: false,
        message: 'Container name is required',
      });
    }

    // 🟢 Gọi Swift API dạng JSON để có thông tin chi tiết
    const response = await axios.get(
      `${SWIFT_URL}/AUTH_${projectId}/${containerName}?format=json`,
      {
        headers: { 'X-Auth-Token': token },
      }
    );

    // 🧩 Swift trả về mảng object có dạng:
    // { name, bytes, content_type, hash, last_modified }
    const objects = response.data.map(obj => ({
      name: obj.name,
      size: obj.bytes, // Dung lượng (bytes)
      upload_at: obj.last_modified, // Ngày upload
    }));

    return res.status(200).json({
      success: true,
      total_objects: objects.length,
      container: containerName,
      objects,
    });
  } catch (error) {
    console.error('Get objects error:', error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
};

const newObject = async (req, res) => {
  try {
    const token = req.token;
    const projectId = req.project.id;
    const containerName = req.params.container;
    const file = req.file; // multer tự parse

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    const objectName = file.originalname;

    const response = await axios.put(
      `${SWIFT_URL}/AUTH_${projectId}/${containerName}/${objectName}`,
      file.buffer, // chính là nội dung file
      {
        headers: {
          "X-Auth-Token": token,
          "Content-Type": file.mimetype || "application/octet-stream",
        },
      }
    );

    return res.status(201).json({
      success: true,
      message: `File "${objectName}" uploaded to "${containerName}" successfully`,
      etag: response.headers.etag,
    });
  } catch (error) {
    console.error("Upload object error:", error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
};


const delObject = async (req, res) => {
  try {
    const token = req.token;
    const projectId = req.project.id;
    const containerName = req.params.container;
    const objectName = req.params.object;

    // Validate input
    if (!containerName || !objectName) {
      return res.status(400).json({
        success: false,
        message: 'Container and object name are required',
      });
    }

    // Encode để tránh lỗi 404 giả
    const url = `${SWIFT_URL}/AUTH_${encodeURIComponent(projectId)}/${encodeURIComponent(containerName)}/${encodeURIComponent(objectName)}`;
    console.log('Deleting object at URL:', url);

    // Gọi Swift API xóa object
    await axios.delete(url, {
      headers: { 'X-Auth-Token': token },
    });

    return res.status(200).json({
      success: true,
      message: `Object "${objectName}" deleted from container "${containerName}"`,
    });
  } catch (error) {
    console.error('Delete object error:', error.message);
    console.log('Container:', req.params.container);
    console.log('Object:', req.params.object);
    console.log('Project ID:', req.project.id);
    console.log('Token:', req.token);

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Object not found or already deleted',
      });
    }

    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
};

module.exports = {
    getObject,
    delObject,
    newObject
}