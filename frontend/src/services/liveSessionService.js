import API from './apiClient';

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
