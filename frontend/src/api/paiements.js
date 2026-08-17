import api from './axios';
import { toArray } from './utils';

export const getEcheances = async (params = {}) =>
  toArray((await api.get('/paiements/echeances/', { params })).data);

export const getPaiements = async () => toArray((await api.get('/paiements/')).data);

export const reglerPaiement = async (
  echeance_id,
  montant_regle,
  mode,
  reference_transaction = '',
  numero_payeur = '',
) => {
  // `numero_payeur` est OBLIGATOIRE cote backend pour le Mobile Money :
  // l'omettre renvoyait un 400 et donnait l'impression d'une panne serveur.
  const payload = { echeance_id, montant_regle, mode, reference_transaction };
  if (numero_payeur) payload.numero_payeur = numero_payeur;
  const response = await api.post('/paiements/regler/', payload);
  return response.data;
};
export const validerPaiement = async (id) => (await api.post(`/paiements/${id}/valider/`)).data;

export const getPaiementsEnAttente = async () => toArray((await api.get('/paiements/en_attente/')).data);
/* Audit Phase 1 - PaiementViewSet est un ModelViewSet, EcheanceViewSet en lecture seule. */
export const getEcheanceById = async (id) => (await api.get(`/paiements/echeances/${id}/`)).data;
export const getPaiementById = async (id) => (await api.get(`/paiements/${id}/`)).data;
export const createPaiement = async (data) => (await api.post('/paiements/', data)).data;
export const updatePaiement = async (id, data) => (await api.patch(`/paiements/${id}/`, data)).data;
export const deletePaiement = async (id) => (await api.delete(`/paiements/${id}/`)).data;

// ============================= Phase 4 - Service Comptable =============================

/** Force l'actualisation des statuts d'echeances (NON_ECHUE -> EXIGIBLE -> EN_RETARD + penalites). */
export const actualiserEcheances = async () => (await api.post('/paiements/echeances/actualiser/')).data;

/** Echeances exigibles ou a echoir dans les 30 jours (relances). */
export const getEcheancesAVenir = async () => toArray((await api.get('/paiements/echeances/a_venir/')).data);

/** Reedition du quitus d'un paiement (Ticket / Facture A4). */
export const getQuitusPaiement = async (id) => (await api.get(`/paiements/${id}/quitus/`)).data;

/** Registre des recus emis, filtrable par periode et par mode. */
export const getRecus = async (params = {}) => (await api.get('/paiements/recus/', { params })).data;

/** Vue consolidee de la caisse (guichet comptable). */
export const getCaisse = async () => (await api.get('/paiements/caisse/')).data;

/** Liste tous les quitus emis (SERVICE_COMPTABLE, DIRECTEUR_CROUS_T) ou ceux de l'occupant connecte. */
export const getAllQuitus = async (params = {}) =>
  toArray((await api.get('/paiements/registre_quitus/', { params })).data);

/** Paiements en especes EN_ATTENTE de validation par la caisse. */
export const getEspecesEnAttente = async () =>
  toArray((await api.get('/paiements/en_attente_especes/')).data);


/** Numeros officiels Orange Money / Wave (accessible a tout utilisateur connecte, occupant inclus). */
export const getConfigMobileMoney = async () =>
  (await api.get('/paiements/config-mobile-money/')).data;
