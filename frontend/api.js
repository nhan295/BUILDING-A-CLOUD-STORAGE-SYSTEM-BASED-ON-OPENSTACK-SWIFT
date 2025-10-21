import axios from 'axios';

const apiUrl = '/choreo-apis/awbo/backend/rest-api-be2/v1.0';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : apiUrl,
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token'); // Lấy token đã lưu
    
    if (token) {
      config.headers['X-Auth-Token'] = token; // Gắn vào header
      console.log('Token được gửi:', token); // Debug
    } else {
      console.warn('Không tìm thấy token!');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý response - tự động logout nếu token hết hạn
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Token hết hạn hoặc không hợp lệ');
      // Có thể redirect về login
      // localStorage.clear();
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;