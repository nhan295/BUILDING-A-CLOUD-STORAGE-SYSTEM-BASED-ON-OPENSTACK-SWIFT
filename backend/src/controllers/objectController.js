const SWIFT_URL = process.env.SWIFT_URL
const axios = require('axios');

const getObject = async(req,res)=>{
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

    // Gọi Swift API để lấy danh sách object
    const response = await axios.get(
      `${SWIFT_URL}/v1/AUTH_${projectId}/${containerName}?format=plain`,
      {
        headers: { 'X-Auth-Token': token },
      }
    );

    // Swift trả về danh sách object dạng text, mỗi dòng là 1 object
    const objects = response.data
      ? response.data.split('\n').filter(Boolean)
      : [];

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
}

const delObject = async(req, res) => {

}

const newObject = async(req, res) => {
}

module.exports = {
    getObject,
    delObject,
    newObject
}