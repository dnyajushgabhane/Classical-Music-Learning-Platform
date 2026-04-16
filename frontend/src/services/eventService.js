import API from './apiClient';

export const fetchEvents = async () => {
    const { data } = await API.get('/events');
    return data;
};

export const bookEventTicket = async (eventId) => {
    const { data } = await API.post(`/events/${eventId}/purchase`);
    return data;
};

export const fetchMeetingHistory = async (filters = {}) => {
    const { data } = await API.get('/meetings/history', { params: filters });
    return data;
};
