import api from './axios';
import { toArray } from './utils';

/** Avis des usagers sur les cantines / locaux (app terrain côté Django). */
export const getAvis = async (params = {}) =>
  toArray((await api.get('/terrain/avis/', { params })).data);

export const createAvis = async (data) => (await api.post('/terrain/avis/', data)).data;

export const modererAvis = async (id, statut) =>
  (await api.patch(`/terrain/avis/${id}/`, { statut })).data;

// Audit Phase 1 — AvisCantineViewSet est un ModelViewSet complet.
export const getAvisById = async (id) => (await api.get(`/terrain/avis/${id}/`)).data;
export const updateAvis = async (id, data) => (await api.patch(`/terrain/avis/${id}/`, data)).data;
export const deleteAvis = async (id) => (await api.delete(`/terrain/avis/${id}/`)).data;
