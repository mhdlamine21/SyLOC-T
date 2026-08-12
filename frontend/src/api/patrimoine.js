import api from './axios';

export const getLocaux = async () => {
  const response = await api.get('/patrimoine/locaux/');
  return response.data;
};

export const getLocalById = async (id) => {
  const response = await api.get(`/patrimoine/locaux/${id}/`);
  return response.data;
};

export const createLocal = async (localData) => {
  const response = await api.post('/patrimoine/locaux/', localData);
  return response.data;
};


export const updateLocal = async (id, data) => {
  const response = await api.patch(`/patrimoine/locaux/${id}/`, data);
  return response.data;
};
