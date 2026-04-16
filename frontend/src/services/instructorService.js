import API from './apiClient';

export const fetchStudentStats = async () => {
    const { data } = await API.get('/instructor/stats/students');
    return data;
};

export const fetchCourseRatingSummary = async (courseId) => {
    const { data } = await API.get(`/instructor/courses/${courseId}/rating-summary`);
    return data;
};

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
