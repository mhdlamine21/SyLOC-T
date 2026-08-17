import api from './axios';

export const getSupervisionSysteme = async () => {
  const { data } = await api.get('/admin/supervision/');
  return data;
};
