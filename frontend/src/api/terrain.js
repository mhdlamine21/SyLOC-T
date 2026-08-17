import api from './axios';
import { toArray } from './utils';

export const getPlaintes = async () => {
  const response = await api.get('/terrain/plaintes/');
  return response.data;
};

export const createPlainte = async (data) => {
  const response = await api.post('/terrain/plaintes/', data);
  return response.data;
};

export const updatePlainte = async (id, data) => {
  const response = await api.patch(`/terrain/plaintes/${id}/`, data);
  return response.data;
};

export const getInspections = async () => {
  const response = await api.get('/terrain/inspections/');
  return response.data;
};

export const createInspection = async (data) => {
  const response = await api.post('/terrain/inspections/', data);
  return response.data;
};

export const createSanction = async (data) => {
  const response = await api.post('/terrain/sanctions/', data);
  return response.data;
};

export const getSanctions = async () => {
  const response = await api.get('/terrain/sanctions/');
  return response.data;
};

export const updateSanction = async (id, data) => {
  const response = await api.patch(`/terrain/sanctions/${id}/`, data);
  return response.data;
};

/* Audit Phase 1 - tous les ViewSets terrain sont des ModelViewSet complets. */
export const getPlainteById = async (id) => (await api.get(`/terrain/plaintes/${id}/`)).data;
export const deletePlainte = async (id) => (await api.delete(`/terrain/plaintes/${id}/`)).data;
export const getInspectionById = async (id) => (await api.get(`/terrain/inspections/${id}/`)).data;
export const updateInspection = async (id, data) =>
  (await api.patch(`/terrain/inspections/${id}/`, data)).data;
export const deleteInspection = async (id) => (await api.delete(`/terrain/inspections/${id}/`)).data;
export const getSanctionById = async (id) => (await api.get(`/terrain/sanctions/${id}/`)).data;
export const deleteSanction = async (id) => (await api.delete(`/terrain/sanctions/${id}/`)).data;

/* ------------------------------------------------------------------ *
 * Phase 5 - Statistiques QHSE, ordres de mission, maintenance
 * ------------------------------------------------------------------ */

/** Statistiques des plaintes/signalements (filtres optionnels). */
export const getStatistiquesPlaintes = async (params = {}) =>
  (await api.get('/terrain/plaintes/statistiques/', { params })).data;

/** Statistiques des inspections QHSE. */
export const getStatistiquesInspections = async (params = {}) =>
  (await api.get('/terrain/inspections/statistiques/', { params })).data;

/** Statistiques des sanctions disciplinaires. */
export const getStatistiquesSanctions = async (params = {}) =>
  (await api.get('/terrain/sanctions/statistiques/', { params })).data;

/** Levee d'une sanction apres contre-inspection. */
export const leverSanction = async (id, motif = '') =>
  (await api.post(`/terrain/sanctions/${id}/lever/`, { motif })).data;

// ── Ordres de mission (OM-AAAA-NNNN) ───────────────────────────────
export const getOrdresMission = async (params = {}) =>
  (await api.get('/terrain/ordres-mission/', { params })).data;

export const getOrdreMissionById = async (id) =>
  (await api.get(`/terrain/ordres-mission/${id}/`)).data;

export const createOrdreMission = async (data) =>
  (await api.post('/terrain/ordres-mission/', data)).data;

export const updateOrdreMission = async (id, data) =>
  (await api.patch(`/terrain/ordres-mission/${id}/`, data)).data;

export const deleteOrdreMission = async (id) =>
  (await api.delete(`/terrain/ordres-mission/${id}/`)).data;

export const demarrerOrdreMission = async (id) =>
  (await api.post(`/terrain/ordres-mission/${id}/demarrer/`)).data;

export const cloturerOrdreMission = async (id, compte_rendu, inspection_id = null) =>
  (await api.post(`/terrain/ordres-mission/${id}/cloturer/`, {
    compte_rendu,
    ...(inspection_id ? { inspection_id } : {}),
  })).data;

export const annulerOrdreMission = async (id) =>
  (await api.post(`/terrain/ordres-mission/${id}/annuler/`)).data;

// ── Maintenance technique ──────────────────────────────────────────
export const getInterventions = async (params = {}) =>
  (await api.get('/terrain/maintenance/', { params })).data;

export const getInterventionById = async (id) =>
  (await api.get(`/terrain/maintenance/${id}/`)).data;

export const createIntervention = async (data) =>
  (await api.post('/terrain/maintenance/', data)).data;

export const updateIntervention = async (id, data) =>
  (await api.patch(`/terrain/maintenance/${id}/`, data)).data;

export const deleteIntervention = async (id) =>
  (await api.delete(`/terrain/maintenance/${id}/`)).data;

export const demarrerIntervention = async (id) =>
  (await api.post(`/terrain/maintenance/${id}/demarrer/`)).data;

export const cloturerIntervention = async (id, rapport, cout_reel = null) =>
  (await api.post(`/terrain/maintenance/${id}/cloturer/`, {
    rapport,
    ...(cout_reel != null && cout_reel !== '' ? { cout_reel: Number(cout_reel) } : {}),
  })).data;

export const annulerIntervention = async (id) =>
  (await api.post(`/terrain/maintenance/${id}/annuler/`)).data;

export const getStatistiquesMaintenance = async (params = {}) =>
  (await api.get('/terrain/maintenance/statistiques/', { params })).data;

/* ------------------------------------------------------------------ *
 * Dispatch d'agent de terrain - occupants au score de fidélité
 * fortement négatif (déclenché par la Commission Environnement)
 * ------------------------------------------------------------------ */

/** Liste des dispatchs (missions de médiation) en cours ou passés. */
export const getDispatchsFidelite = async (params = {}) =>
  (await api.get('/terrain/dispatch-fidelite/', { params })).data;

/** Déclenche l'envoi d'un agent de terrain auprès d'un occupant à risque. */
export const creerDispatchFidelite = async ({ demandeur, motif, urgence = 'ELEVEE' }) =>
  (await api.post('/terrain/dispatch-fidelite/', { demandeur, motif, urgence })).data;

/** Mise à jour du suivi d'un dispatch (agent assigné, statut, compte-rendu). */
export const updateDispatchFidelite = async (id, data) =>
  (await api.patch(`/terrain/dispatch-fidelite/${id}/`, data)).data;

/* ------------------------------------------------------------------ *
 * Rapports de visite terrain - cadence réglementaire de 10 jours,
 * transmission à la commission de rattachement de l'agent.
 * ------------------------------------------------------------------ */

/** Rapports de visite (filtres : local, statut, commission, mes_rapports). */
export const getRapportsVisite = async (params = {}) =>
  toArray((await api.get('/terrain/rapports-visite/', { params })).data);

/** Rédige un rapport de visite (agent terrain / QHSE). */
export const creerRapportVisite = async (data) =>
  (await api.post('/terrain/rapports-visite/', data)).data;

export const updateRapportVisite = async (id, data) =>
  (await api.patch(`/terrain/rapports-visite/${id}/`, data)).data;

/** Transmet le rapport à la commission destinataire. */
export const transmettreRapportVisite = async (id) =>
  (await api.post(`/terrain/rapports-visite/${id}/transmettre/`)).data;

/** Validation du rapport par la commission. */
export const validerRapportVisite = async (id) =>
  (await api.post(`/terrain/rapports-visite/${id}/valider/`)).data;

/** Suivi de la cadence de 10 jours, local par local (retards inclus). */
export const getCadenceVisites = async () =>
  (await api.get('/terrain/rapports-visite/cadence/')).data;

export const getStatistiquesRapportsVisite = async (params = {}) =>
  (await api.get('/terrain/rapports-visite/statistiques/', { params })).data;

/** Occupants éligibles à l'envoi d'un agent (score très négatif). */
export const getCandidatsDispatch = async (seuil = -20) =>
  (await api.get('/terrain/dispatch-fidelite/candidats/', { params: { seuil } })).data;

export const assignerDispatchFidelite = async (id, agent) =>
  (await api.post(`/terrain/dispatch-fidelite/${id}/assigner/`, { agent })).data;

export const cloturerDispatchFidelite = async (id, compte_rendu) =>
  (await api.post(`/terrain/dispatch-fidelite/${id}/cloturer/`, { compte_rendu })).data;
