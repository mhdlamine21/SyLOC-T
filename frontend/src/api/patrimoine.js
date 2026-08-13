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
  let data = localData;
  let headers = {};
  if (localData.photo instanceof File) {
    data = new FormData();
    Object.keys(localData).forEach(key => {
      if (localData[key] !== null && localData[key] !== undefined) {
        data.append(key, localData[key]);
      }
    });
    headers = { 'Content-Type': 'multipart/form-data' };
  }
  const response = await api.post('/patrimoine/locaux/', data, { headers });
  return response.data;
};


export const updateLocal = async (id, localData) => {
  let data = localData;
  let headers = {};
  if (localData.photo instanceof File) {
    data = new FormData();
    Object.keys(localData).forEach(key => {
      if (localData[key] !== null && localData[key] !== undefined) {
        data.append(key, localData[key]);
      }
    });
    headers = { 'Content-Type': 'multipart/form-data' };
  }
  const response = await api.patch(`/patrimoine/locaux/${id}/`, data, { headers });
  return response.data;
};
