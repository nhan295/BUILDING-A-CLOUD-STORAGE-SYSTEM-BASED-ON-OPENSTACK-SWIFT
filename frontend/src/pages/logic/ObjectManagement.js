import api from '../../../api';
export const getObject = async(containerName)=>{
    try{
        const response = await api.get(`/api/object/${containerName}`);
        return response.data.objects || [];
    }catch(error){
        console.error('Error: ',error);
    }
}
