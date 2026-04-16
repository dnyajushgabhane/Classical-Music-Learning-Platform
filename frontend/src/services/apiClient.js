import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const API = axios.create({
    baseURL,
    withCredentials: true,
});

API.interceptors.request.use((req) => {
    const userInfoString = localStorage.getItem('userInfo');
    if (userInfoString) {
        try {
            const userInfo = JSON.parse(userInfoString);
            if (userInfo?.token) {
                req.headers.Authorization = `Bearer ${userInfo.token}`;
            }
        } catch (e) {
            console.error('Failed to parse userInfo:', e);
        }
    }
    return req;
}, (error) => Promise.reject(error));

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isLoginRequest = error.config.url.includes('/auth/login');
            if (!isLoginRequest) {
                console.warn('Session expired (401). Redirecting to login...');
                localStorage.removeItem('userInfo');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login?expired=true';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default API;
