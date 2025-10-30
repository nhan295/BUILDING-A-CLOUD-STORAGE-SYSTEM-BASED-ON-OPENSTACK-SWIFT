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

const assignUsertoProject = async(req,res)=>{
    try {
    const token = req.headers['x-auth-token'];
    const { project_id, user_id, role_name } = req.body; // role_name : 'member', 'admin'

    // get role list
    const rolesRes = await axios.get(`${KEYSTONE_URL}/roles`, {
      headers: { 'X-Auth-Token': token },
    });

    const role = rolesRes.data.roles.find((r) => r.name === role_name);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: `Role '${role_name}' not found`,
      });
    }

    // 2️⃣ Gán user vào project với role tương ứng
    await axios.put(
      `${KEYSTONE_URL}/projects/${project_id}/users/${user_id}/roles/${role.id}`,
      null,
      { headers: { 'X-Auth-Token': token } }
    );

    return res.status(200).json({
      success: true,
      message: `User assigned to project successfully with role '${role_name}'`,
    });
  } catch (error) {
    console.error('Error assigning user to project:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to assign user to project',
      error: error.response?.data || error.message,
    });
  }
}
module.exports = {
    getUsers,
    createUser,
    deleteUser,
    assignUsertoProject
}

