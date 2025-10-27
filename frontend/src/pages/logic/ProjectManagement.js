import api from '../../../api';
export const getProjects = async()=> {
    try{
        const response = await api.get('/api/projects/');
        return response.data.projects || [];   
    }catch(error){
        console.error('Error while fetching project list', error);
    }
}

