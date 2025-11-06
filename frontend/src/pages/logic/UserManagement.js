import api from '../../../api';
export const getUsers = async()=>{
    try{
        const response = await api.get('/api/users/project-users');
        return response.data.users || []; 
    }catch(error){
        console.error('Error while get users list', error);
    }
}

//======================== system admin  UI ==========================//

export const getProjects = async()=> {
    try{
        const response = await api.get('/api/projects/');
        return response.data.projects || [];   
    }catch(error){
        console.error('Error while fetching project list', error);
    }
}

export const getSysUsers = async()=>{
    try{
        const response = await api.get('/api/users/')
        return response.data.users || [];
    }catch(error){
        console.error('Error while get system users list', error);
    }
}

export const createUser = async(username,password)=>{
    try{
        const response = await api.post('/api/users/create-user',{
            username,
            password
        })
        return response.data;
    }catch(error){
        console.error('Error while create user', error);
    }
}

export const deleteUser = async(userId)=>{
    try{
        const response = await api.delete(`/api/users/delete/${userId}`)
        if(response.data.success){
            return{
                success: true,
                message: response.data.message
            }
        }
    }catch(error){
        console.error('Error while delete user', error);
    }
}

export const assignUsertoProject = async (project_id, user_id, role_name) => {
  try {
    const response = await api.post('/api/users/assign', {
      project_id,
      user_id,
      role_name
    });

    return {
      success: response?.data?.success || false,
      message: response?.data?.message || 'Failed to assign user to project.'
    };

  } catch (error) {
    console.error('Error while assign user to project:', error.response?.data || error.message);

    return {
      success: false,
      message: error.response?.data?.message || 'Failed to assign user to project.'
    };
  }
};

export const removeUserfromProject = async(userId,projectId)=>{
    try{
        const response = await api.delete(`/api/users/remove/${projectId}/${userId}`);
        if(response.data.success){
            return{
                success: true,
                message: response.data.message
            }
        }
    }catch(error){
        console.error('Error while remove user from project', error);
    }
}

