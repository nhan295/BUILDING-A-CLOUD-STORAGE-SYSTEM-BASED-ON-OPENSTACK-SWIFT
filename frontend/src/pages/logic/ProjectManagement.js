import api from '../../../api';
export const getProjects = async()=> {
    try{
        const response = await api.get('/api/projects/');
        return response.data.projects || [];   
    }catch(error){
        console.error('Error while fetching project list', error);
    }
}

export const createProject = async(projectName,quota_bytes,description)=>{
    try{
        const response = await api.post('/api/projects/create-project',{
            projectName,
            quota_bytes,
            description
        })
        return response.data;
    }catch(error){
        console.error('Error while creating project', error);
        throw error;
    }
}

export const deleteProject = async(projectId)=>{
    try{
        const response = await api.delete(`/api/projects/delete/${projectId}`);
        if(response.data.success){
            return{
                success: true,
                message: response.data.message
            }
        }
    }catch(error){
        console.error('Error while deleting project', error)
    }
}

export const updateQuota  = async(projectId, quota_bytes)=>{
    try{
        const response = await api.post(`/api/projects/set-quota/${projectId}`,{
            quota_bytes
        })
        return response.data;
    }catch(error){
        console.error('Error while updating project quota', error);
    }
}

