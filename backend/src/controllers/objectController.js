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
    const file = req.file;
    const replace = req.query.replace === "true"; // 👈 cho phép ghi đè nếu true

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    const objectName = file.originalname;
    const objectUrl = `${SWIFT_URL}/AUTH_${projectId}/${containerName}/${objectName}`;

    // 🔍 Kiểm tra xem object đã tồn tại chưa
    try {
      await axios.head(objectUrl, {
        headers: { "X-Auth-Token": token },
      });

      // Nếu không bị lỗi thì object tồn tại
      if (!replace) {
        return res.status(409).json({
          success: false,
          message: `File "${objectName}" already exists in "${containerName}".`,
        });
      }
    } catch (headErr) {
      // 404 => file chưa tồn tại, có thể upload
      if (headErr.response && headErr.response.status !== 404) {
        throw headErr; // các lỗi khác thì quăng ra
      }
    }

    // 📤 Upload (ghi đè hoặc tạo mới)
    const response = await axios.put(objectUrl, file.buffer, {
      headers: {
        "X-Auth-Token": token,
        "Content-Type": file.mimetype || "application/octet-stream",
      },
    });

    return res.status(201).json({
      success: true,
      message: `File "${objectName}" uploaded to "${containerName}" successfully.`,
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

const downloadObject = async(req,res)=>{
  try {
    const { container, object } = req.params; // /api/object/:container/:object/download
    const token = req.token; // middleware validateToken đã gắn token vào req
    const projectId = req.project.id; // middleware validateToken cũng có req.project

    const url = `${SWIFT_URL}/AUTH_${projectId}/${container}/${object}`;

    const response = await axios.get(url, {
      headers: { 'X-Auth-Token': token },
      responseType: 'arraybuffer', // quan trọng để nhận dữ liệu binary
    });

    // Lấy tên file và loại file để set header hợp lý
    const fileName = object.split('/').pop();
    const contentType = response.headers['content-type'] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(response.data);

  } catch (err) {
    console.error('❌ Download object error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      success: false,
      message: 'Failed to download object',
      error: err.response?.data || err.message,
    });
  }
}

module.exports = {
    getObject,
    delObject,
    newObject,
    downloadObject
}