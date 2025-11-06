const { SWIFT_URL, KEYSTONE_URL } = require('../config/swiftConfig');
const axios = require('axios')

const getUsers = async(req,res)=>{
    try {
    const token = req.headers['x-auth-token'];

    // get all users
    const usersRes = await axios.get(`${KEYSTONE_URL}/users`, {
      headers: { 'X-Auth-Token': token },
    });
    const users = usersRes.data.users;

    //  Lấy danh sách roles để map ID -> name
    const rolesRes = await axios.get(`${KEYSTONE_URL}/roles`, {
      headers: { 'X-Auth-Token': token },
    });
    const rolesMap = {};
    rolesRes.data.roles.forEach((r) => {
      rolesMap[r.id] = r.name;
    });

    // Lấy project + role cho từng user
    const usersWithProjects = await Promise.all(
      users.map(async (user) => {
        try {
          //  Lấy các project mà user này thuộc về
          const projectRes = await axios.get(`${KEYSTONE_URL}/projects?user_id=${user.id}`, {
            headers: { 'X-Auth-Token': token },
          });

          //  Với mỗi project, lấy role của user trong project đó
          const projectsWithRoles = await Promise.all(
            projectRes.data.projects.map(async (project) => {
              try {
                const roleAssignRes = await axios.get(
                  `${KEYSTONE_URL}/role_assignments?user.id=${user.id}&scope.project.id=${project.id}`,
                  { headers: { 'X-Auth-Token': token } }
                );

                // Lấy danh sách role ID -> role name
                const assignedRoles = roleAssignRes.data.role_assignments.map((r) => {
                  const roleId = r.role.id;
                  return rolesMap[roleId] || roleId;
                });

                return {
                  id: project.id,
                  name: project.name,
                  roles: assignedRoles.length > 0 ? assignedRoles : ['(no role)'],
                };
              } catch (err) {
                console.error(`Failed to get roles for user ${user.name} in project ${project.name}:`,
                  err.response?.data || err.message);
                return {
                  id: project.id,
                  name: project.name,
                  roles: ['(fetch error)'],
                };
              }
            })
          );

          return {
            id: user.id,
            name: user.name,
            enabled: user.enabled,
            domain_id: user.domain_id,
            projects: projectsWithRoles,
          };
        } catch (err) {
          console.error(`Failed to fetch projects for user ${user.name}:`, err.response?.data || err.message);
          return {
            id: user.id,
            name: user.name,
            enabled: user.enabled,
            projects: [],
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      total_users: usersWithProjects.length,
      users: usersWithProjects,
    });
  } catch (error) {
    console.error('Error getting users with projects and roles:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to get users with projects and roles',
      error: error.response?.data || error.message,
    });
  }
}

const createUser = async(req,res)=>{
     try {
    const token = req.headers['x-auth-token'];
    const { username, password, domain_id = 'default' } = req.body;

    const response = await axios.post(
      `${KEYSTONE_URL}/users`,
      {
        user: {
          name: username,
          password: password,
          domain_id: domain_id,
          enabled: true,
        },
      },
      { headers: { 'X-Auth-Token': token, 'Content-Type': 'application/json' } }
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: response.data.user,
    });
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to create user',
      error: error.response?.data || error.message,
    });
  }
}

const deleteUser = async(req,res)=>{
     try {
    const token = req.headers['x-auth-token'];
    const  user_id  = req.params.userId;

    await axios.delete(`${KEYSTONE_URL}/users/${user_id}`, {
      headers: { 'X-Auth-Token': token },
    });

    return res.status(200).json({
      success: true,
      message: `User ${user_id} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting user:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.response?.data || error.message,
    });
  }
}

const assignUserToProject = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];
    const { project_id, user_id, role_name } = req.body;

    if (!project_id || !user_id || !role_name) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: project_id, user_id, or role_name.",
      });
    }

    const rolesRes = await axios.get(`${KEYSTONE_URL}/roles`, {
      headers: { 'X-Auth-Token': token },
    });

    const role = rolesRes.data.roles.find((r) => r.name === role_name);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: `Role '${role_name}' not found.`,
      });
    }

    // Kiểm tra user đã có role nào trong project chưa
    const assignedRolesRes = await axios.get(
      `${KEYSTONE_URL}/projects/${project_id}/users/${user_id}/roles`,
      { headers: { 'X-Auth-Token': token } }
    );

    const assignedRoles = assignedRolesRes.data.roles || [];

    // Nếu đã có bất kỳ role nào => không cho gán thêm
    if (assignedRoles.length > 0) {
      const existingRoleNames = assignedRoles.map(r => r.name).join(', ');
      return res.status(400).json({
        success: false,
        message: `User already has role(s) '${existingRoleNames}' in this project. Cannot assign another role.`,
      });
    }

    await axios.put(
      `${KEYSTONE_URL}/projects/${project_id}/users/${user_id}/roles/${role.id}`,
      null,
      { headers: { 'X-Auth-Token': token } }
    );

    return res.status(200).json({
      success: true,
      message: `User assigned to project successfully with role '${role_name}'.`,
    });
  } catch (error) {
    console.error('Error assigning user to project:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to assign user to project.',
      error: error.response?.data || error.message,
    });
  }
};


const removeUserFromProject = async(req,res)=>{
  try {
    const { projectId, userId } = req.params;
    const token = req.headers["x-auth-token"];

    if (!projectId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: projectId or userId.",
      });
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Missing authentication token.",
      });
    }

    console.log("=== DEBUG: Removing user from project ===");
    console.log("Project ID:", projectId);
    console.log("User ID:", userId);

    const rolesRes = await axios.get(
      `${KEYSTONE_URL}/projects/${projectId}/users/${userId}/roles`,
      {
        headers: { "X-Auth-Token": token },
      }
    );
    // check if user has roles in the project
    const roles = rolesRes.data.roles || [];
    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User has no roles in this project.",
      });
    }

    // Lặp qua từng role để xóa
    for (const role of roles) {
      await axios.delete(`${KEYSTONE_URL}/projects/${projectId}/users/${userId}/roles/${role.id}`,
        {
          headers: { "X-Auth-Token": token },
        }
      );
      console.log(`Removed role ${role.name} (${role.id})`);
    }

    return res.status(200).json({
      success: true,
      message: `Removed user ${userId} from project ${projectId}`,
    });
  } catch (error) {
    console.error("Error removing user from project:", error.response?.data || error.message);
    const status = error.response?.status || 500;
    return res.status(status).json({
      success: false,
      message: error.response?.data?.error?.message || "Failed to remove user from project.",
    });
  }
}

module.exports = {
    getUsers,
    createUser,
    deleteUser,
    assignUserToProject,
    removeUserFromProject
}

