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
