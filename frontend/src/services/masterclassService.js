import API from './apiClient';

export const fetchMasterclasses = async () => {
  const { data } = await API.get('/masterclass');
  return data;
};

export const addMasterclass = async (masterclassData) => {
  const { data } = await API.post('/masterclass', masterclassData);
  return data;
};

export const fetchVideoInfo = async (url) => {
  const { data } = await API.get(`/masterclass/info?url=${encodeURIComponent(url)}`);
  return data;
};
