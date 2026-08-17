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

export const partagerDossier = async (id, utilisateurId, message = '') =>
  (await api.post(`${BASE}${id}/partager/`, { utilisateur: utilisateurId, message })).data;

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

export const getDelegationCommission = async () =>
  (await api.get('/demandes/membres/delegation/')).data;

export const toggleDelegationCommission = async (active) =>
  (await api.post('/demandes/membres/delegation/', { active })).data;

export const createVoteCommission = async (data) => (await api.post('/demandes/votes/', data)).data;

export const refuserContratDemande = async (id, motif = '') =>
  (await api.post(`${BASE}${id}/refuser-contrat/`, { motif })).data;

export const createAppel = async (data) => (await api.post('/demandes/appels/', data)).data;

export const cloturerLocalDemande = async (local_id, gagnant_id) =>
  (await api.post(`${BASE}cloturer-local/`, { local_id, gagnant_id })).data;

/* ────────────────────────────────────────────────────────────────
 * Actions DRF exposees suite a l'audit des endpoints (Phase 1).
 * Voir docs/AUDIT_ENDPOINTS.md
 * ──────────────────────────────────────────────────────────────── */

// DemandeViewSet - CRUD complet + actions metier
export const updateDemande = async (id, data) => (await api.patch(`${BASE}${id}/`, data)).data;
export const deleteDemande = async (id) => (await api.delete(`${BASE}${id}/`)).data;
export const validerDemande = async (id, commentaire = '') =>
  (await api.post(`${BASE}${id}/valider/`, { commentaire })).data;
export const getDemandesTriees = async (appelId) =>
  toArray((await api.get(`${BASE}triees/`, { params: appelId ? { appel: appelId } : {} })).data);
export const getAnalyseEquidistance = async (id) =>
  (await api.get(`${BASE}${id}/analyse_equidistance/`)).data;

// AppelCandidatureViewSet
const APPELS = '/demandes/appels/';
export const getAppelById = async (id) => (await api.get(`${APPELS}${id}/`)).data;
export const updateAppel = async (id, data) => (await api.patch(`${APPELS}${id}/`, data)).data;
export const deleteAppel = async (id) => (await api.delete(`${APPELS}${id}/`)).data;

// DossierViewSet
const DOSSIERS = '/demandes/dossiers/';
export const getDossiers = async (params = {}) => toArray((await api.get(DOSSIERS, { params })).data);
export const getDossierById = async (id) => (await api.get(`${DOSSIERS}${id}/`)).data;
export const createDossier = async (data) => (await api.post(DOSSIERS, data)).data;
export const updateDossier = async (id, data) => (await api.patch(`${DOSSIERS}${id}/`, data)).data;
export const deleteDossier = async (id) => (await api.delete(`${DOSSIERS}${id}/`)).data;

// VoteCommissionViewSet
const VOTES = '/demandes/votes/';
export const updateVoteCommission = async (id, data) => (await api.patch(`${VOTES}${id}/`, data)).data;
export const deleteVoteCommission = async (id) => (await api.delete(`${VOTES}${id}/`)).data;

/* ────────────────────────────────────────────────────────────────
 * Phase 3 - Usager/Candidat, Communication, DCUVE & Commission.
 * ──────────────────────────────────────────────────────────────── */

/** Chronologie du dossier : etapes du parcours + evenements horodates. */
export const getChronologieDemande = async (id) =>
  (await api.get(`${BASE}${id}/chronologie/`)).data;

/** Synthese consultative de la commission (quorum, sens majoritaire, notes). */
export const getSyntheseVotes = async (id) =>
  (await api.get(`${BASE}${id}/synthese-votes/`)).data;

/** La DCUVE reclame des pieces complementaires au candidat. */
export const demanderComplementDemande = async (id, commentaire) =>
  (await api.post(`${BASE}${id}/demander-complement/`, { commentaire })).data;

/** Appels reellement ouverts a candidature (actifs et dans la fenetre de depot). */
export const getAppelsOuverts = async () =>
  toArray((await api.get(`${APPELS}ouverts/`)).data);

export const cloturerAppel = async (id) => (await api.post(`${APPELS}${id}/cloturer/`)).data;

export const ajouterCritereAppel = async (id, critere) =>
  (await api.post(`${APPELS}${id}/criteres/`, critere)).data;

export const getCriteresAppel = async (appelId) =>
  toArray((await api.get('/demandes/criteres/', { params: { appel: appelId } })).data);

/** Votes deja emis sur un dossier (filtre serveur). */
export const getVotesDemande = async (demandeId) =>
  toArray((await api.get(VOTES, { params: { demande: demandeId } })).data);

export const getMesVotes = async () =>
  toArray((await api.get(VOTES, { params: { mes_votes: 1 } })).data);

/* ────────────────────────────────────────────────────────────────
 * Commission d'évaluation - délégation, rapport & tâches des membres
 * ──────────────────────────────────────────────────────────────── */

/** Rapport consolidé des travaux de la Commission (vue Directeur CROUS-T). */
export const getRapportCommission = async (params = {}) =>
  (await api.get('/demandes/membres/rapport/', { params })).data;

/** Tâches de la commission pour le membre connecté : dossiers à voter, échéances. */
export const getMesTachesCommission = async () =>
  (await api.get('/demandes/membres/mes-taches/')).data;

/** Re-soumission par le candidat après complétion des pièces manquantes.
 *  Remet le dossier à NOUVELLE → bannette Bureau du Courrier. */
export const resoumettreComplement = async (id) =>
  (await api.post(`${BASE}${id}/re-soumettre/`)).data;

/** Demandes groupées par local (concurrence) - DIRECTEUR_DCUVE. */
export const getDemandesParLocal = async () =>
  (await api.get(`${BASE}par-local/`)).data;

/** Crée un lot, passe les demandes à EN_COMMISSION et active la commission. */
export const creerLotCommission = async ({ demande_ids, commentaire = '' }) =>
  (await api.post(`${BASE}creer-lot-commission/`, { demande_ids, commentaire })).data;

/** Liste les lots commission (optionnellement filtrés par statut). */
export const getLots = async (statut = '') =>
  (await api.get('/demandes/lots-commission/', { params: statut ? { statut } : {} })).data;
