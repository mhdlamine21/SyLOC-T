import api from './axios';

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats/');
  return response.data;
};

export const getPublicStats = async () => {
  const response = await api.get('/public/stats/');
  return response.data;
};

export const getPublicAnnonces = async () => {
  const response = await api.get('/public/annonces/');
  return response.data;
};
