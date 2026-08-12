import api from './axios';
import { toArray } from './utils';

const BASE = '/contrats/';

export const getContrats = async () => toArray((await api.get(BASE)).data);

export const getContratById = async (id) => (await api.get(`${BASE}${id}/`)).data;

export const genererContrat = async (data) => (await api.post(BASE, data)).data;

export const updateContrat = async (id, data) => (await api.patch(`${BASE}${id}/`, data)).data;
