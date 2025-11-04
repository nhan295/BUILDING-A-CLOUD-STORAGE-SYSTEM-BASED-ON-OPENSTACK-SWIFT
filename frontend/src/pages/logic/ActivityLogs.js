import api from '../../../api';

export const activityLogger = async()=>{
    try{
        const response = await api.get('/api/activity/recent')
        return response.data.activities || []

    }catch(error){
        console.error("Failed to fetch recent activities:", error.message);
    }
}
