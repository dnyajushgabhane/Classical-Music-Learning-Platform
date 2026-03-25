import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api', // Adjust if needed
});

API.interceptors.request.use((req) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        req.headers.Authorization = `Bearer ${JSON.parse(userInfo).token}`;
    }
    return req;
});

export const loginCall = async (credentials) => {
    const { data } = await API.post('/auth/login', credentials);
    return data;
};

export const registerCall = async (userData) => {
    const { data } = await API.post('/auth/register', userData);
    return data;
};

export const fetchCourses = async (filters = {}) => {
    const { data } = await API.get('/courses', { params: filters });
    return data;
};

export const fetchProfile = async () => {
    const { data } = await API.get('/auth/profile');
    return data;
};

export const fetchEvents = async () => {
    const { data } = await API.get('/events');
    return data;
};

export const bookEventTicket = async (eventId) => {
    const { data } = await API.post(`/events/${eventId}/purchase`);
    return data;
};

export const upgradeSubscription = async (tier) => {
    const { data } = await API.post('/subscriptions/upgrade', { tier });
    return data;
};

/** Live class (LiveKit SFU + REST) */
export const fetchLiveSessions = async () => {
    const { data } = await API.get('/live-sessions');
    return data;
};

export const fetchLiveSession = async (id) => {
    const { data } = await API.get(`/live-sessions/${id}`);
    return data;
};

export const createLiveSession = async (payload) => {
    const { data } = await API.post('/live-sessions', payload);
    return data;
};

export const updateLiveSessionStatus = async (id, status) => {
    const { data } = await API.put(`/live-sessions/${id}/status`, { status });
    return data;
};

export const updateLiveSessionMeta = async (id, payload) => {
    const { data } = await API.put(`/live-sessions/${id}`, payload);
    return data;
};

export const getLiveKitToken = async (sessionId) => {
    const { data } = await API.post(`/live-sessions/${sessionId}/token`);
    return data;
};

export const joinLiveWaitingRoom = async (sessionId) => {
    const { data } = await API.post(`/live-sessions/${sessionId}/waiting`);
    return data;
};

export const admitLiveUser = async (sessionId, userId) => {
    const { data } = await API.post(`/live-sessions/${sessionId}/admit`, { userId });
    return data;
};

export const fetchLiveMessages = async (sessionId) => {
    const { data } = await API.get(`/live-sessions/${sessionId}/messages`);
    return data;
};

export const startLiveRecording = async (sessionId) => {
    const { data } = await API.post(`/live-sessions/${sessionId}/recording/start`);
    return data;
};

export const stopLiveRecording = async (sessionId) => {
    const { data } = await API.post(`/live-sessions/${sessionId}/recording/stop`);
    return data;
};

export default API;
