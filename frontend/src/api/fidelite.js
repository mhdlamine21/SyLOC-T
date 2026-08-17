import api from './axios';

export const getMonScoreFidelite = async () => (await api.get('/fidelite/mon-score/')).data;

/** Classement des demandeurs par score (DCUVE, direction, communication). */
export const getClassementFidelite = async (limit = 10) =>
  (await api.get('/fidelite/classement/', { params: { limit } })).data;

/** Occupants dont le score de fidélité est fortement négatif (alerte médiation). */
export const getAlertesFidelite = async (seuil = -20) =>
  (await api.get('/fidelite/alertes/', { params: { seuil } })).data;
