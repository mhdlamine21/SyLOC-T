import api from './axios';
import { toArray } from './utils';

const BASE = '/contrats/';

export const getContrats = async () => toArray((await api.get(BASE)).data);

export const getContratById = async (id) => (await api.get(`${BASE}${id}/`)).data;

export const genererContrat = async (data) => (await api.post(BASE, data)).data;

export const updateContrat = async (id, data) => (await api.patch(`${BASE}${id}/`, data)).data;

// Audit Phase 1 : ContratViewSet est un ModelViewSet complet.
export const createContrat = async (data) => (await api.post(BASE, data)).data;
export const deleteContrat = async (id) => (await api.delete(`${BASE}${id}/`)).data;

// ============================= Phase 4 — Service Juridique =============================

// --- Modèles d'actes -----------------------------------------------------------------
export const getModelesContrat = async (actifsSeulement = false) =>
  toArray((await api.get(`${BASE}modeles/`, { params: actifsSeulement ? { actifs: 1 } : {} })).data);

export const createModeleContrat = async (data) => (await api.post(`${BASE}modeles/`, data)).data;

export const updateModeleContrat = async (id, data) => (await api.patch(`${BASE}modeles/${id}/`, data)).data;

export const deleteModeleContrat = async (id) => (await api.delete(`${BASE}modeles/${id}/`)).data;

export const getVariablesContrat = async () => (await api.get(`${BASE}modeles/variables/`)).data;

// --- Cycle de vie d'un acte ------------------------------------------------------------
export const getApercuContrat = async (id) => (await api.get(`${BASE}${id}/apercu/`)).data;

export const redigerContrat = async (id, data) => (await api.post(`${BASE}${id}/rediger/`, data)).data;

export const activerContrat = async (id) => (await api.post(`${BASE}${id}/activer/`)).data;

export const resilierContrat = async (id, data) => (await api.post(`${BASE}${id}/resilier/`, data)).data;

export const getQuitusGeneral = async (id) => (await api.get(`${BASE}${id}/quitus_general/`)).data;

// --- Tableau de bord -------------------------------------------------------------------
export const getStatistiquesContrats = async () => (await api.get(`${BASE}statistiques/`)).data;

// --- Convocation -----------------------------------------------------------------------
export const convoquerContrat = async (id, data) => (await api.post(`${BASE}${id}/convoquer/`, data)).data;
