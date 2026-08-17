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

// Audit Phase 1 : LocalViewSet est un ModelViewSet complet.
export const deleteLocal = async (id) => (await api.delete(`/patrimoine/locaux/${id}/`)).data;

// Emplacements ou un type de projet est autorise (ex. local artisanal),
// avec leur photo de vitrine, pour le choix visuel du candidat.
export const getEmplacementsAutorises = async (typeDemande) => {
  const response = await api.get('/patrimoine/locaux/emplacements-autorises/', {
    params: { type_demande: typeDemande },
  });
  const data = response.data;
  return Array.isArray(data) ? data : (data?.results ?? []);
};
