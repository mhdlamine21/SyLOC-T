import api from './axios';

// ---- Profil connecté -------------------------------------------------------
export const getMe = async () => (await api.get('/comptes/me/')).data;

export const updateMe = async (patch) => (await api.patch('/comptes/me/', patch)).data;

export const changerMotDePasse = async (ancien_mot_de_passe, nouveau_mot_de_passe) =>
  (await api.post('/comptes/changer-mot-de-passe/', { ancien_mot_de_passe, nouveau_mot_de_passe })).data;

// ---- Gestion des comptes (Administrateur SI / Direction) -------------------
export const getUtilisateurs = async (params = {}) =>
  (await api.get('/comptes/utilisateurs/', { params })).data;

export const createUtilisateur = async (data) =>
  (await api.post('/comptes/utilisateurs/', data)).data;

export const updateUtilisateur = async (id, data) =>
  (await api.patch(`/comptes/utilisateurs/${id}/`, data)).data;

export const activerUtilisateur = async (id) =>
  (await api.post(`/comptes/utilisateurs/${id}/activer/`)).data;

export const changerRoleUtilisateur = async (id, role) =>
  (await api.post(`/comptes/utilisateurs/${id}/changer-role/`, { role })).data;

export const reinitialiserMotDePasse = async (id, nouveau_mot_de_passe) =>
  (await api.post(`/comptes/utilisateurs/${id}/reinitialiser-mot-de-passe/`,
    nouveau_mot_de_passe ? { nouveau_mot_de_passe } : {})).data;

export const deleguerUtilisateur = async (id, active, expiration = null) =>
  (await api.post(`/comptes/utilisateurs/${id}/deleguer/`, { active, expiration })).data;

export const getRoles = async () => (await api.get('/comptes/utilisateurs/roles/')).data;

// ---- Demandeurs / cartes étudiant -----------------------------------------
export const getMonProfilDemandeur = async () => (await api.get('/comptes/demandeurs/moi/')).data;

export const getCartesAValider = async () =>
  (await api.get('/comptes/demandeurs/cartes-a-valider/')).data;

export const soumettreCarteEtudiant = async ({ fichier, matricule_etudiant, contact }) => {
  const form = new FormData();
  form.append('fichier', fichier);
  if (matricule_etudiant) form.append('matricule_etudiant', matricule_etudiant);
  if (contact) form.append('contact', contact);
  const { data } = await api.post('/comptes/demandeurs/soumettre-carte-etudiant/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const validerCarteEtudiant = async (id, decision, motif = '') =>
  (await api.post(`/comptes/demandeurs/${id}/valider-carte-etudiant/`, { decision, motif })).data;

// ---- Membres de la commission ---------------------------------------------
export const getMembresCommission = async () => (await api.get('/demandes/membres/')).data;

export const nommerMembreCommission = async (utilisateurId) =>
  (await api.post('/demandes/membres/', { utilisateur: utilisateurId, actif: true })).data;

export const majMembreCommission = async (id, actif) =>
  (await api.patch(`/demandes/membres/${id}/`, { actif })).data;
