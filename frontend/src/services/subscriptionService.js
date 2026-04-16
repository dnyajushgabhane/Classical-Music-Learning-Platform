import API from './apiClient';

export const upgradeSubscription = async (tier) => {
    const { data } = await API.post('/subscriptions/upgrade', { tier });
    return data;
};

export const fetchSubscription = async () => {
    const { data } = await API.get('/subscriptions');
    return data;
};
