const { SWIFT_URL, KEYSTONE_URL } = require('../config/swiftConfig');
const axios = require('axios')

const getProject = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];

    // 1️⃣ Lấy danh sách project
    const projectRes = await axios.get(`${KEYSTONE_URL}/projects`, {
      headers: { 'X-Auth-Token': token },
    });

    const projects = projectRes.data.projects;

    // 2️⃣ Lặp từng project để thêm quota + user count
    const projectsWithQuota = await Promise.all(
      projects.map(async (project) => {
        const debug = { projectId: project.id, projectName: project.name, attempts: [] };
        let userCount = 0;

        try {
          // 🧩 Gọi Keystone API để đếm user trong project
          const userRes = await axios.get(
            `${KEYSTONE_URL}/role_assignments?scope.project.id=${project.id}&include_names=True`,
            { headers: { 'X-Auth-Token': token } }
          );

          // Mỗi role_assignment thường tương ứng 1 user
          // lọc ra user duy nhất để tránh trùng
          const users = [
            ...new Set(
              userRes.data.role_assignments
                .filter(r => r.user) // chỉ lấy role thuộc user
                .map(r => r.user.id)
            ),
          ];
          userCount = users.length;
        } catch (err) {
          debug.userCountError = err.message;
        }

        // 3️⃣ Lấy quota của project trong Swift
        try {
          const swiftGet = await axios.get(`${SWIFT_URL}/AUTH_${project.id}`, {
            headers: { 'X-Auth-Token': token },
            validateStatus: (s) => true,
          });

          debug.attempts.push({ method: 'GET', status: swiftGet.status });

          if (swiftGet.status === 200) {
            const headers = Object.fromEntries(
              Object.entries(swiftGet.headers).map(([k, v]) => [k.toLowerCase(), v])
            );

            let quotaBytes = parseInt(headers['x-account-meta-quota-bytes']) || 0;
            let bytesUsed = parseInt(headers['x-account-bytes-used']) || 0;
            const containerCount = parseInt(headers['x-account-container-count']) || 0;
            const objectCount = parseInt(headers['x-account-object-count']) || 0;

            // Nếu bytes_used = 0 thì tự tính lại
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
                  totalBytes += parseInt(head.headers['x-container-bytes-used']) || 0;
                }

                bytesUsed = totalBytes;
              } catch (e) {
                debug.note = `Cannot calculate bytes_used : ${e.message}`;
              }
            }

            return {
              ...project,
              user_count: userCount,
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

          // fallback nếu GET thất bại
          return {
            ...project,
            user_count: userCount,
            swift_quota: null,
            _debug: debug,
          };
        } catch (err) {
          return {
            ...project,
            user_count: userCount,
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
    const { projectName, description, quota_bytes } = req.body;

    // 🧩 Kiểm tra dữ liệu đầu vào
    if (!projectName) {
      return res.status(400).json({ success: false, message: 'Missing project name' });
    }

    if (quota_bytes && isNaN(quota_bytes)) {
      return res.status(400).json({
        success: false,
        message: 'quota_bytes must be a valid number if provided',
      });
    }

    // 🪄 1️⃣ Tạo project trong Keystone
    const payload = {
      project: {
        name: projectName,
        enabled: true,
        domain_id: 'default',
        description: description || '', // thêm description nếu có
      },
    };

    const createRes = await axios.post(`${KEYSTONE_URL}/projects`, payload, {
      headers: {
        'X-Auth-Token': token,
        'Content-Type': 'application/json',
      },
    });

    const project = createRes.data.project;
    const projectId = project.id;

    console.log(`✅ Created project: ${projectName} (${projectId})`);

    // 🪄 2️⃣ Nếu có quota_bytes => set quota trong Swift
    if (quota_bytes) {
      const headers = {
        'X-Auth-Token': token,
        'X-Account-Meta-Quota-Bytes': quota_bytes.toString(),
      };

      await axios.post(`${SWIFT_URL}/AUTH_${projectId}`, null, { headers });

      console.log(`✅ Assigned quota ${quota_bytes} bytes for project ${projectId}`);
    } else {
      console.log('⚠️ No quota assigned (quota_bytes not provided)');
    }

    // 🪄 3️⃣ Trả kết quả về
    return res.status(201).json({
      success: true,
      message: `Project "${projectName}" created successfully${quota_bytes ? ` with quota ${quota_bytes} bytes` : ''}`,
      project: {
        id: projectId,
        name: projectName,
        description: description || '',
        quota_bytes: quota_bytes || 'unlimited',
      },
    });

  } catch (error) {
    console.error('❌ Error while creating project with quota:', error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.error?.message ||
        'Cannot create project or assign quota.',
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