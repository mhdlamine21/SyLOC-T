import api from './axios';

/** Rapport d'activité sur une période : /api/rapports/periode/?debut=&fin= */
export const getRapportPeriode = async (debut, fin) =>
  (await api.get('/rapports/periode/', { params: { debut, fin } })).data;

/** Classement des occupants (satisfaction usagers + conformite QHSE). */
export const getTopOccupants = async (limit = 10) =>
  (await api.get('/rapports/top-occupants/', { params: { limit } })).data;

/** Rapport QHSE consolide : /api/rapports/qhse/?debut=&fin= */
export const getRapportQHSE = async (debut, fin) =>
  (await api.get('/rapports/qhse/', { params: { debut, fin } })).data;

