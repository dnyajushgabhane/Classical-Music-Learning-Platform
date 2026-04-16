import API from './apiClient';

export const createOrUpdateReview = async (payload) => {
    const { data } = await API.post('/reviews', payload);
    return data;
};
