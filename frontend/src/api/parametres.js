import api from './axios';
import { toArray } from './utils';

const BASE = '/admin/parametres/';

/** Parametres systeme - Administrateur SI. */
export const getParametres = async (params = {}) =>
  toArray((await api.get(BASE, { params })).data);

export const getParametre = async (id) => (await api.get(`${BASE}${id}/`)).data;

export const createParametre = async (data) => (await api.post(BASE, data)).data;

export const updateParametre = async (id, data) =>
  (await api.patch(`${BASE}${id}/`, data)).data;

export const deleteParametre = async (id) => {
  await api.delete(`${BASE}${id}/`);
  return id;
};
