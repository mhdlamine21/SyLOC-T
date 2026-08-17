import api from './axios';
import { toArray } from './utils';

const BASE = '/annonces/';

/** Annonces de la vitrine (Cellule Communication). */
export const getAnnonces = async (params = {}) => toArray((await api.get(BASE, { params })).data);

export const createAnnonce = async (data) => (await api.post(BASE, data)).data;

export const updateAnnonce = async (id, data) => (await api.patch(`${BASE}${id}/`, data)).data;

export const deleteAnnonce = async (id) => {
  await api.delete(`${BASE}${id}/`);
  return id;
};

// Audit Phase 1 - detail d'une annonce.
export const getAnnonceById = async (id) => (await api.get(`${BASE}${id}/`)).data;

/** Valider et publier officiellement une annonce transmise par la Direction */
export const publierAnnonce = async (id) => (await api.post(`${BASE}${id}/publier/`)).data;
