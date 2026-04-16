import API from './apiClient';

export const loginCall = async (credentials) => {
    const { data } = await API.post('/auth/login', credentials);
    return data;
};

export const registerCall = async (userData) => {
    const { data } = await API.post('/auth/register', userData);
    return data;
};

export const fetchProfile = async () => {
    const { data } = await API.get('/auth/profile');
    return data;
};
