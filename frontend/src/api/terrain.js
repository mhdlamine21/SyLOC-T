import api from './axios';

export const getPlaintes = async () => {
  const response = await api.get('/terrain/plaintes/');
  return response.data;
};

export const createPlainte = async (data) => {
  const response = await api.post('/terrain/plaintes/', data);
  return response.data;
};

export const updatePlainte = async (id, data) => {
  const response = await api.patch(`/terrain/plaintes/${id}/`, data);
  return response.data;
};

export const getInspections = async () => {
  const response = await api.get('/terrain/inspections/');
  return response.data;
};

export const createInspection = async (data) => {
  const response = await api.post('/terrain/inspections/', data);
  return response.data;
};

export const createSanction = async (data) => {
  const response = await api.post('/terrain/sanctions/', data);
  return response.data;
};

export const getSanctions = async () => {
  const response = await api.get('/terrain/sanctions/');
  return response.data;
};

export const updateSanction = async (id, data) => {
  const response = await api.patch(`/terrain/sanctions/${id}/`, data);
  return response.data;
};

export const createAvis = async (data) => {
  const response = await api.post('/terrain/avis/', data);
  return response.data;
};
