import api from '../../../api';
export const getUsers = async()=>{
    try{
        const response = await api.get('/api/users/project-users');
        return response.data.users || []; 
    }catch(error){
        console.error('Error while get users list', error);
    }
}