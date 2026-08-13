import api from './axios';
import { toArray } from './utils';

const BASE = '/demandes/demandes/';

export const getDemandes = async (params = {}) => toArray((await api.get(BASE, { params })).data);

export const getMesDemandes = async () => toArray((await api.get(`${BASE}mes-demandes/`)).data);

export const createDemande = async (demandeData) => (await api.post(BASE, demandeData)).data;

export const getDemandeById = async (id) => (await api.get(`${BASE}${id}/`)).data;

export const getHistoriqueDemande = async (id) =>
  toArray((await api.get(`${BASE}${id}/historique/`)).data);

export const uploadDocumentDemande = async (id, { fichier, type_document, libelle }) => {
  const form = new FormData();
  form.append('fichier', fichier);
  if (type_document) form.append('type_document', type_document);
  if (libelle) form.append('libelle', libelle);
  const { data } = await api.post(`${BASE}${id}/documents/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const changerStatutDemande = async (id, statut, commentaire = '') =>
  (await api.post(`${BASE}${id}/changer_statut/`, { statut, commentaire })).data;

export const confirmerReceptionPhysique = async (id) =>
  (await api.post(`${BASE}${id}/reception-physique/`)).data;

export const enregistrerAvisSanitaire = async (id, avis, reference = '') =>
  (await api.post(`${BASE}${id}/avis-sanitaire/`, { avis, reference })).data;

export const enregistrerAvisTechnique = async (id, avis) =>
  (await api.post(`${BASE}${id}/avis-technique/`, { avis })).data;

export const deciderDemande = async (id, decision, commentaire = '') =>
  (await api.post(`${BASE}${id}/decider/`, { decision, commentaire })).data;

export const accepterContratDemande = async (id, dateRdv) =>
  (await api.post(`${BASE}${id}/accepter-contrat/`, { date_rdv: dateRdv })).data;

export const getAppels = async () => toArray((await api.get('/demandes/appels/')).data);

export const getVotes = async (params = {}) =>
  toArray((await api.get('/demandes/votes/', { params })).data);

export const createVoteCommission = async (data) => (await api.post('/demandes/votes/', data)).data;

export const refuserContratDemande = async (id, motif = '') =>
  (await api.post(`${BASE}${id}/refuser-contrat/`, { motif })).data;

export const createAppel = async (data) => (await api.post('/demandes/appels/', data)).data;

export const getPalmaresCommission = async () =>
  toArray((await api.get(`${BASE}palmares-commission/`)).data);

export const cloturerLocal = async (local_id, gagnant_id) =>
  (await api.post(`${BASE}cloturer-local/`, { local_id, gagnant_id })).data;
