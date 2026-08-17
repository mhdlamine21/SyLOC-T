import api from './axios';
import { toArray } from './utils';

/**
 * API publique de la vitrine (aucune authentification requise).
 * Toutes les routes vivent sous /api/public/* cote Django.
 */
export const getPublicStats = async () => (await api.get('/public/stats/')).data;

export const getPublicAnnonces = async () => toArray((await api.get('/public/annonces/')).data);

export const getPublicLocaux = async (params = {}) =>
  toArray((await api.get('/public/locaux/', { params })).data);

export const getPublicAppels = async () => toArray((await api.get('/public/appels/')).data);

export const getPublicAvis = async (params = {}) =>
  toArray((await api.get('/public/avis/', { params })).data);

/** Contenus editoriaux (hero, etapes, FAQ, contacts) pilotes par l'Admin SI. */
export const getPublicVitrine = async () => (await api.get('/public/vitrine/')).data;

