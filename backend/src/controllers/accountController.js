const { SWIFT_URL } = require('../config/swiftConfig');
const axios = require('axios')
const getAccountInfo = async(req,res)=>{
    try{
        const token = req.headers['x-auth-token'];
        const projectId = req.project.id;
        if(!token){
            return res.status(401).json({
                success:false,
                message: 'Token not found'
            })
        }
        const response = await axios.get(`${SWIFT_URL}/AUTH_${projectId}`,{
            headers: {'X-Auth-Token': token}
        })

        const headers = response.headers;
        return res.status(200).json({
            success: true,
            account: `AUTH_${projectId}`,
            data: {
                container_count: parseInt(headers['x-account-container-count']) || 0,
                object_count: parseInt(headers['x-account-object-count']) || 0,
                bytes_used: parseInt(headers['x-account-bytes-used']) || 0,
                timestamp: headers['x-timestamp'] || null,
            }
        })
    }catch(error){
        console.error('Get account info error', error.message);

        if(error.response?.status === 404){
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }
        if(error.response?.status === 403){
            return res.status(403).json({
                success: false,
                message: 'Permission denied. Token may not have access to this account'
            });
        }
        return res.status(500).json({
            success: true,
            message: `Error: ${error.message}`
        })
    }
}
module.exports = {
    getAccountInfo
}