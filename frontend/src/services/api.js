import axios from 'axios';

const API = axios.create({
    baseURL: '/api', // Use proxy
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
            // Prevent redirect loop if already on login or if this is the login call itself
            const isLoginRequest = error.config.url.includes('/auth/login');
            
            if (!isLoginRequest) {
                console.warn('Session expired (401). Redirecting to login...');
                localStorage.removeItem('userInfo');
                // Use window.location for a hard redirect to ensure state is cleared
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login?expired=true';
                }
            }
        }
        return Promise.reject(error);
    }
);

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

export const createCourse = async (courseData, onUploadProgress) => {
    const { data } = await API.post('/courses', courseData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress,
    });
    return data;
};

export const fetchProfile = async () => {
    const { data } = await API.get('/auth/profile');
    return data;
};

export const fetchStudentStats = async () => {
    const { data } = await API.get('/instructor/stats/students');
    return data;
};

export const createOrUpdateReview = async (payload) => {
    const { data } = await API.post('/reviews', payload);
    return data;
};

export const fetchCourseRatingSummary = async (courseId) => {
    const { data } = await API.get(`/instructor/courses/${courseId}/rating-summary`);
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

export const createCourseOrder = async (courseId) => {
    const { data } = await API.post(`/courses/${courseId}/razorpay/order`);
    return data;
};

export const verifyCoursePayment = async (payload) => {
    const { data } = await API.post(`/courses/${payload.courseId}/razorpay/verify`, payload);
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

export const checkLiveKitHealth = async () => {
    const { data } = await API.get('/live-sessions/health/livekit');
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

export const uploadSessionMaterial = async (sessionId, formData, onUploadProgress) => {
    const { data } = await API.post(`/live-sessions/${sessionId}/material`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress,
    });
    return data;
};

export const fetchTranscriptionSummary = async (sessionId, recordingId) => {
    const { data } = await API.get(`/live-sessions/${sessionId}/recordings/${recordingId}/summary`);
    return data;
};

export const downloadRecording = async (recordingId) => {
    const { data } = await API.get(`/recordings/${recordingId}/download`, { responseType: 'blob' });
    return data;
};

export const createInviteLink = async (sessionId, payload) => {
    const { data } = await API.post(`/live-sessions/${sessionId}/invite`, payload);
    return data;
};

export const fetchInviteLinks = async (sessionId) => {
    const { data } = await API.get(`/live-sessions/${sessionId}/invites`);
    return data;
};

export const deleteInviteLink = async (sessionId, linkId) => {
    const { data } = await API.delete(`/live-sessions/${sessionId}/invite/${linkId}`);
    return data;
};

export const fetchMeetingHistory = async (filters = {}) => {
    const { data } = await API.get('/meetings/history', { params: filters });
    return data;
};

export const muteParticipant = async (sessionId, userId, type, mute) => {
    const { data } = await API.post(`/live-sessions/${sessionId}/participants/${userId}/mute`, { type, mute });
    return data;
};

export const removeParticipant = async (sessionId, userId) => {
    const { data } = await API.post(`/live-sessions/${sessionId}/participants/${userId}/remove`);
    return data;
};

export const updateParticipantPermissions = async (sessionId, userId, permissions) => {
    const { data } = await API.put(`/live-sessions/${sessionId}/participants/${userId}/permissions`, { permissions });
    return data;
};

export const lockMeeting = async (sessionId, locked) => {
    const { data } = await API.post(`/live-sessions/${sessionId}/lock`, { locked });
    return data;
};

export const raiseHand = async (sessionId, raised) => {
    const { data } = await API.post(`/live-sessions/${sessionId}/raise-hand`, { raised });
    return data;
};

export const lowerHand = async (sessionId, userId) => {
    const { data } = await API.post(`/live-sessions/${sessionId}/participants/${userId}/lower-hand`);
    return data;
};

/** Scheduled Masterclasses */
export const createScheduledSession = async (payload) => {
    const { data } = await API.post('/sessions', payload);
    return data;
};

export const fetchInstructorSessions = async () => {
    const { data } = await API.get('/sessions/instructor');
    return data;
};

export const fetchUpcomingSessions = async () => {
    const { data } = await API.get('/sessions/upcoming');
    return data;
};

export const enrollInSession = async (sessionId) => {
    const { data } = await API.post(`/sessions/${sessionId}/enroll`);
    return data;
};

export const joinScheduledSession = async (sessionId) => {
    const { data } = await API.post(`/sessions/${sessionId}/join`);
    return data;
};

/** Instructor Analytics & Operations */
export const fetchInstructorDashboardStats = async () => {
    const { data } = await API.get('/instructor/dashboard-stats');
    return data;
};

export const fetchStudentAnalytics = async () => {
    const { data } = await API.get('/instructor/analytics/students');
    return data;
};

export const fetchRevenueAnalytics = async () => {
    const { data } = await API.get('/instructor/analytics/revenue');
    return data;
};

export const fetchActivityFeed = async () => {
    const { data } = await API.get('/instructor/activity');
    return data;
};

export const fetchRevenueDetails = async (page = 1, limit = 10) => {
    const { data } = await API.get('/instructor/revenue/details', { params: { page, limit } });
    return data;
};

export default API;
