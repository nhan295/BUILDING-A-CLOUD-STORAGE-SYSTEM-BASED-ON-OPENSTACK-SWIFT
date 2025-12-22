const { SWIFT_URL } = require('../config/swiftConfig');
const { logActivity } = require("./activityLogger.js");
const axios = require('axios');
const JSZip = require('jszip');
const fs = require('fs');

const getContainers = async (req, res) => {
  try {
    const projectId = req.project.id;
    const token = req.token;

    const response = await axios.get(`${SWIFT_URL}/AUTH_${projectId}?format=json`, {
      headers: { 'X-Auth-Token': token },
    });

    const containers = response.data; // Swift return type [{name, count, bytes}, ...]

    //  iterates over the list of containers to get more details for each container
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
    const token = req.token; 
    const projectId = req.project.id;
    const containerName = req.params.containerName;

    // get list of objects in the container
    const listRes = await axios.get(
      `${SWIFT_URL}/AUTH_${projectId}/${containerName}?format=json`,
      { headers: { "X-Auth-Token": token } }
    );

    const objects = listRes.data || [];

    // delete all objects in the container
    if (objects.length > 0) {
      for (const obj of objects) {
        await axios.delete(
          `${SWIFT_URL}/AUTH_${projectId}/${containerName}/${encodeURIComponent(obj.name)}`,
          { headers: { "X-Auth-Token": token } }
        );
      }
    }

    // after all objects are deleted, delete the container
    await axios.delete(`${SWIFT_URL}/AUTH_${projectId}/${containerName}`, {
      headers: { "X-Auth-Token": token },
    });

     const username = req.user?.username || req.project?.username || 'unknown';
    logActivity(username, "Delete", `Deleted container ${containerName}`,projectId);
    return res.status(200).json({
      success: true,
      message:
        objects.length > 0
          ? `Deleted ${objects.length} object và container "${containerName}".`
          : `Container "${containerName}" deleted successfully.`,
    });
  } catch (error) {
    console.error("Error while deleting container:", error.message);

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
    const { container } = req.body;

    // Validation: Container name required
    if (!container || !container.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Container name is required.',
      });
    }

    const containerName = container.trim();

    // Check if container already exists
    try {
      await axios.head(
        `${SWIFT_URL}/AUTH_${projectId}/${containerName}`,
        {
          headers: { 'X-Auth-Token': token },
        }
      );

      // If HEAD request succeeds, container exists
      return res.status(409).json({
        success: false,
        message: `Container "${containerName}" already exists.`,
      });
    } catch (headError) {
      // If HEAD returns 404, container doesn't exist - proceed to create
      if (headError.response?.status !== 404) {
        // Other errors (403, 401, etc.)
        throw headError;
      }
    }

    // Create container
    await axios.put(
      `${SWIFT_URL}/AUTH_${projectId}/${containerName}`,
      null,
      {
        headers: { 'X-Auth-Token': token },
      }
    );

    const username = req.user?.username || req.project?.username || 'unknown';
    logActivity(username, "Create", `Created container ${containerName}`, projectId);

    return res.status(201).json({
      success: true,
      message: `Container "${containerName}" created successfully.`,
    });

  } catch (error) {
    console.error('Create container error:', error.response?.data || error.message);

    // Handle specific errors
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Invalid authentication token.',
      });
    }

    if (error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. You do not have permission to create containers.',
      });
    }

    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to create container.',
    });
  }
};

const downloadContainer = async(req,res)=>{
  const { containerName } = req.params;
  const token = req.token;
  const projectId = req.project.id;

  try {
    // retrieve the list of objects in the container 
    const listRes = await axios.get(`${SWIFT_URL}/AUTH_${projectId}/${containerName}?format=json`, {
      headers: { 'X-Auth-Token': token }
    });

    const zip = new JSZip();
    //Download each object individually as binary data
    for (const obj of listRes.data) {
      const fileRes = await axios.get(`${SWIFT_URL}/AUTH_${projectId}/${containerName}/${obj.name}`, {
        headers: { 'X-Auth-Token': token },
        responseType: 'arraybuffer'
      });
      zip.file(obj.name, fileRes.data);
    }
    // Generate ZIP file as a Node.js buffer
    const zipContent = await zip.generateAsync({ type: "nodebuffer" });
    res.setHeader("Content-Disposition", `attachment; filename=${containerName}.zip`);
    res.setHeader("Content-Type", "application/zip");

    //Send ZIP file to client
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