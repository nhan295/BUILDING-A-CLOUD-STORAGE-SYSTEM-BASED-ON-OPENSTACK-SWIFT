const SWIFT_URL = process.env.SWIFT_URL
const axios = require('axios');


const getContainers = async (req, res) => {
  try {
    const projectId = req.project.id;
    const token = req.token;

    const response = await axios.get(`${SWIFT_URL}/AUTH_${projectId}`, {
      headers: { 'X-Auth-Token': token },
    });

    const containers = response.data.map(c => c.name);

    return res.status(200).json({
      success: true,
      total_containers: containers.length,
      containers,
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
    const token = req.token; // từ middleware validateToken
    const projectId = req.project.id;
    const roles = req.roles;
    const containerName = req.params.containerName;

    // // ✅ Kiểm tra role
    // if (!roles.includes('admin')) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You do not have permission to delete this container.',
    //   });
    // }

    // ✅ Gọi API Swift để xóa container
    const response = await axios.delete(
      `${SWIFT_URL}/AUTH_${projectId}/${containerName}`,
      {
        headers: { 'X-Auth-Token': token },
      }
    );

    return res.status(200).json({
      success: true,
      message: `Container "${containerName}" deleted successfully.`,
    });
  } catch (error) {
    console.error('Delete container error:', error.message);

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Container not found or already deleted.',
      });
    }

    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
}

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

const renameContainer = async(req,res)=>{

}

module.exports = {
    getContainers,
    delContainer,
    createContainer,
    renameContainer

}