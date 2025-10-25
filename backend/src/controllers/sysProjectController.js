const { SWIFT_URL, KEYSTONE_URL } = require('../config/swiftConfig');
const axios = require('axios')

const getProject = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];

    const projectRes = await axios.get(`${KEYSTONE_URL}/projects`, {
      headers: { 'X-Auth-Token': token },
    });

    const projects = projectRes.data.projects;

    const projectsWithQuota = await Promise.all(
      projects.map(async (project) => {
        const debug = { projectId: project.id, projectName: project.name, attempts: [] };

        try {
          // 1) call GET to get header account
          const swiftGet = await axios.get(`${SWIFT_URL}/AUTH_${project.id}`, {
            headers: { 'X-Auth-Token': token },
            validateStatus: (s) => true,
          });

          debug.attempts.push({ method: 'GET', status: swiftGet.status });

          // if account is exist
          if (swiftGet.status === 200) {
            const headers = Object.fromEntries(
              Object.entries(swiftGet.headers).map(([k, v]) => [k.toLowerCase(), v])
            );

            let quotaBytes = parseInt(headers['x-account-meta-quota-bytes']) || 0;
            let bytesUsed = parseInt(headers['x-account-bytes-used']) || 0;
            const containerCount = parseInt(headers['x-account-container-count']) || 0;
            const objectCount = parseInt(headers['x-account-object-count']) || 0;

            // If bytes_used = 0, then automatically calculate the total usage by summing the sizes of all container
            if (bytesUsed === 0) {
              try {
                const contRes = await axios.get(`${SWIFT_URL}/AUTH_${project.id}?format=json`, {
                  headers: { 'X-Auth-Token': token },
                });

                const containers = contRes.data || [];
                let totalBytes = 0;
                let totalObjects = 0;

                for (const c of containers) {
                  try {
                    const head = await axios.head(`${SWIFT_URL}/AUTH_${project.id}/${c.name}`, {
                      headers: { 'X-Auth-Token': token },
                    });
                    const bytes = parseInt(head.headers['x-container-bytes-used']) || 0;
                    const objs = parseInt(head.headers['x-container-object-count']) || 0;
                    totalBytes += bytes;
                    totalObjects += objs;
                  } catch (err) {
                    debug.attempts.push({ method: 'HEAD container', container: c.name, error: err.message });
                  }
                }

                // Ghi đè lại kết quả thực tế
                bytesUsed = totalBytes;
              } catch (e) {
                debug.note = `Cannot calculate bytes_used : ${e.message}`;
              }
            }

            return {
              ...project,
              swift_quota: {
                quota_bytes: quotaBytes || 'unlimited',
                bytes_used: bytesUsed,
                container_count: containerCount,
                object_count: objectCount,
                usage_percent: quotaBytes > 0 ? ((bytesUsed / quotaBytes) * 100).toFixed(2) : 0,
              },
              _debug: undefined,
            };
          }

          // if GET doesn't success, try HEAD
          const swiftHead = await axios.head(`${SWIFT_URL}/AUTH_${project.id}`, {
            headers: { 'X-Auth-Token': token },
            validateStatus: (s) => true,
          });

          debug.attempts.push({ method: 'HEAD', status: swiftHead.status });

          if (swiftHead.status === 200) {
            const headers = Object.fromEntries(
              Object.entries(swiftHead.headers).map(([k, v]) => [k.toLowerCase(), v])
            );

            let quotaBytes = parseInt(headers['x-account-meta-quota-bytes']) || 0;
            let bytesUsed = parseInt(headers['x-account-bytes-used']) || 0;
            const containerCount = parseInt(headers['x-account-container-count']) || 0;
            const objectCount = parseInt(headers['x-account-object-count']) || 0;

            if (bytesUsed === 0) {
              try {
                const contRes = await axios.get(`${SWIFT_URL}/AUTH_${project.id}?format=json`, {
                  headers: { 'X-Auth-Token': token },
                });
                const containers = contRes.data || [];
                let totalBytes = 0;

                for (const c of containers) {
                  const head = await axios.head(`${SWIFT_URL}/AUTH_${project.id}/${c.name}`, {
                    headers: { 'X-Auth-Token': token },
                  });
                  const bytes = parseInt(head.headers['x-container-bytes-used']) || 0;
                  totalBytes += bytes;
                }

                bytesUsed = totalBytes;
              } catch (e) {
                debug.note = `Cannot calculate bytes_used (HEAD): ${e.message}`;
              }
            }

            return {
              ...project,
              swift_quota: {
                quota_bytes: quotaBytes || 'unlimited',
                bytes_used: bytesUsed,
                container_count: containerCount,
                object_count: objectCount,
                usage_percent: quotaBytes > 0 ? ((bytesUsed / quotaBytes) * 100).toFixed(2) : 0,
              },
              _debug: undefined,
            };
          }

          // both GET and HEAD fail
          debug.error = `Both GET and HEAD failed`;
          return {
            ...project,
            swift_quota: null,
            _debug: debug,
          };
        } catch (err) {
          return {
            ...project,
            swift_quota: null,
            _debug: { projectId: project.id, err: err.message },
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      total: projects.length,
      projects: projectsWithQuota,
    });
  } catch (error) {
    console.error('Get project error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
};

const createProject = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];
    const { projectName} = req.body;

    if (!projectName)
      return res.status(400).json({ success: false, message: 'Missing project name' });

    const payload = {
      project: {
        name: projectName,
        enabled: true,
      },
    };

    const response = await axios.post(`${KEYSTONE_URL}/projects`, payload, {
      headers: {
        'X-Auth-Token': token,
        'Content-Type': 'application/json',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Create project successfully',
      project: response.data.project,
    });
  } catch (error) {
    console.error('Error while create project', error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Cannot create project.',
    });
  }
};


const deleteProject = async(req,res)=>{
    try{
        const token = req.headers[`x-auth-token`];
        const projectId = req.params.projectId

        if(!projectId){
            return res.status(400).json({
                success: false,
                message: 'Missing project name'
            })
        }
        await axios.delete(`${KEYSTONE_URL}/projects/${projectId}`,{
            headers:{ 'X-Auth-Token': token}
        });
        return res.status(200).json({
            success: true,
            message: `Delete ${projectId} successfully`
        })
    }catch(error){
        console.error('Error while create project', error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.error?.message || 'Cannot delete project.',
    });
    }
}

const setProjectQuota = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];
    const { projectId } = req.params;
    const { quota_bytes } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Missing project id',
      });
    }

    if (!quota_bytes || isNaN(quota_bytes)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing quota_bytes in request body',
      });
    }

    // Swift require header include quota bytes (count by byte)
    const headers = {
      'X-Auth-Token': token,
      'X-Account-Meta-Quota-Bytes': quota_bytes.toString(),
    };

    // use POST to update metadata Swift's account
    await axios.post(`${SWIFT_URL}/AUTH_${projectId}`, null, { headers });

    return res.status(200).json({
      success: true,
      message: `Quota ${quota_bytes} bytes assigned successfully to project ${projectId}`,
    });
  } catch (error) {
    console.error(
      'Error while assigning quota:',
      error.response?.data || error.message
    );
    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.error?.message ||
        'Cannot assign project quota. The project may not exist in Swift yet.',
    });
  }
};


module.exports={
    getProject,
    createProject,
    deleteProject,
    setProjectQuota

}