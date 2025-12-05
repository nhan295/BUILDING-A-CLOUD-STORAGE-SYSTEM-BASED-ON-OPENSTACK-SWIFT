const { SWIFT_URL } = require('../config/swiftConfig');
const axios = require('axios');
const { logActivity } = require("./activityLogger.js");

const getObject = async (req, res) => {
  try {
    const token = req.headers["x-auth-token"];
    const projectId = req.project.id;
    const containerName = req.params.container;

    if (!containerName) {
      return res.status(400).json({
        success: false,
        message: "Container name is required",
      });
    }

    //  Lấy danh sách object cơ bản
    const listResponse = await axios.get(
      `${SWIFT_URL}/AUTH_${projectId}/${containerName}?format=json`,
      { headers: { "X-Auth-Token": token } }
    );

    // Duyệt qua từng object và gọi HEAD để lấy metadata
    const objects = await Promise.all(
      listResponse.data.map(async (obj) => {
        const objectUrl = `${SWIFT_URL}/AUTH_${projectId}/${containerName}/${obj.name}`;


        try {
          const headResponse = await axios.head(objectUrl, {
            headers: { "X-Auth-Token": token },
          });

          const headers = headResponse.headers;
          const uploadBy = headers["x-object-meta-uploaded-by"] || "unknown";
          const uploadTime =
            headers["x-object-meta-upload-time"] || obj.last_modified;

          return {
            name: obj.name,
            size: obj.bytes,
            upload_at: uploadTime,
            upload_by: uploadBy,
          };
        } catch (err) {
          console.warn(`Cannot get metadata for ${obj.name}:`, err.message);
          return {
            name: obj.name,
            size: obj.bytes,
            upload_at: obj.last_modified,
            upload_by: "unknown",
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      total_objects: objects.length,
      container: containerName,
      objects,
    });
  } catch (error) {
    console.error("Get objects error:", error.message);
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
    const files = req.files;
    const replace = req.query.replace === "true";
    const upload_by = req.user?.username || "unknown";

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const results = [];

    for (const file of files) {
      const objectName = file.originalname;
      const objectUrl = `${SWIFT_URL}/AUTH_${projectId}/${containerName}/${encodeURIComponent(objectName)}`;

      // check if exists
      try {
        await axios.head(objectUrl, {
          headers: { "X-Auth-Token": token },
        });

        if (!replace) {
          results.push({
            name: objectName,
            success: false,
            message: `File "${objectName}" already exists`,
          });
          continue;
        }
      } catch (headErr) {
        if (headErr.response && headErr.response.status !== 404) {
          throw headErr;
        }
      }

      // upload
      try {
        const response = await axios.put(objectUrl, file.buffer, {
          headers: {
            "X-Auth-Token": token,
            "Content-Type": file.mimetype || "application/octet-stream",
            "X-Object-Meta-Uploaded-By": upload_by,
            "X-Object-Meta-Upload-Time": new Date().toISOString(),
          },
        });

        results.push({
          name: objectName,
          success: true,
          etag: response.headers.etag,
        });

        const username = req.user?.username || req.project?.username || "unknown";
        logActivity(
          username,
          "Upload",
          `File ${objectName} uploaded to ${containerName}`,
          projectId
        );

      } catch (upErr) {
        results.push({
          name: objectName,
          success: false,
          message: upErr.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      total: results.length,
      container: containerName,
      results,
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

    // Encode to avoid fake 404
    const url = `${SWIFT_URL}/AUTH_${encodeURIComponent(projectId)}/${encodeURIComponent(containerName)}/${encodeURIComponent(objectName)}`;
    console.log('Deleting object at URL:', url);

    await axios.delete(url, {
      headers: { 'X-Auth-Token': token },
    });
    const username = req.user?.username || req.project?.username || 'unknown';
    logActivity(username, "Delete", `File ${objectName} delete from ${containerName}`,projectId);

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
    const { container, object } = req.params; 
    const token = req.token; 
    const projectId = req.project.id; 

    const url = `${SWIFT_URL}/AUTH_${projectId}/${container}/${object}`;

    const response = await axios.get(url, {
      headers: { 'X-Auth-Token': token },
      responseType: 'arraybuffer', // receive binary data
    });

    // Retrieve the file name and file type to set the appropriate headers
    const fileName = object.split('/').pop();
    const contentType = response.headers['content-type'] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(response.data);

  } catch (err) {
    console.error(' Download object error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      success: false,
      message: 'Failed to download object',
      error: err.response?.data || err.message,
    });
  }
}


// MOVE = COPY + DELETE
const moveObject = async (req, res) => {
  try {
    const { srcContainer, srcObject, destContainer, destObject } = req.body;

    const token = req.token; 
    const projectId = req.project.id;
    const username = req.user?.username || "unknown";

    if (!srcContainer || !srcObject || !destContainer) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    // Nếu không truyền destObject → giữ nguyên tên file
    const finalDestObject = destObject || srcObject;

    const copyUrl = `${SWIFT_URL}/AUTH_${projectId}/${srcContainer}/${encodeURIComponent(srcObject)}`;

    // COPY
    await axios({
      method: "COPY",
      url: copyUrl,
      headers: {
        "X-Auth-Token": token,
        "Destination": `/${encodeURIComponent(destContainer)}/${encodeURIComponent(finalDestObject)}`
      }
    });

    // DELETE source
    const deleteUrl = `${SWIFT_URL}/AUTH_${projectId}/${srcContainer}/${encodeURIComponent(srcObject)}`;
    await axios.delete(deleteUrl, { headers: { "X-Auth-Token": token } });

    // LOG
    logActivity(
      username,
      "Move",
      `File ${srcObject} moved from ${srcContainer} to ${destContainer}`,
      projectId
    );

    return res.json({
      success: true,
      message: "Object moved successfully.",
      from: `${srcContainer}/${srcObject}`,
      to: `${destContainer}/${finalDestObject}`,
    });

  } catch (error) {
    console.error("Move object error:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to move object.",
      error: error.response?.data || error.message,
    });
  }
};


module.exports = {
    getObject,
    delObject,
    newObject,
    downloadObject,
    moveObject
}