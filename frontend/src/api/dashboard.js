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

/** Phase 2 — blocs complementaires : 7 jours, paiements, top locaux. */
export const getDashboardComplement = async (params = {}) => {
  const response = await api.get('/dashboard/complement/', { params });
  return response.data;
};

export const getTopLocaux = async (limit = 10) => {
  const response = await api.get('/rapports/top-locaux/', { params: { limit } });
  return response.data;
};

export const getTopOccupants = async (limit = 10) => {
  const response = await api.get('/rapports/top-occupants/', { params: { limit } });
  return response.data;
};

export const getPublicLocaux = async (params = {}) => {
  const response = await api.get('/public/locaux/', { params });
  return response.data;
};

export const getPublicVitrine = async () => {
  const response = await api.get('/public/vitrine/');
  return response.data;
};

/** Pilotage documentaire du bureau DCUVE : traites / non traites, delais. */
export const getStatsDcuve = async () => {
  const response = await api.get('/dashboard/dcuve/');
  return response.data;
};

/** Serie journaliere des paiements pour un mois donne — Service Comptable. */
export const getPaiementsMois = async (annee, mois) => {
  const response = await api.get('/dashboard/paiements-mois/', { params: { annee, mois } });
  return response.data;
};

