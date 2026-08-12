import api from './axios';

/**
 * Connexion : le backend accepte l'email OU le username sur /comptes/login/.
 * Réponse : { access, refresh, user }
 */
export const loginApi = async (identifiant, password) => {
  const response = await api.post('/comptes/login/', {
    username: identifiant,
    email: identifiant,
    password,
  });
  return response.data;
};

/**
 * Inscription réelle (reprise de la branche develop, corrigée sur /comptes/register/).
 * Envoie un multipart si une carte étudiant est jointe.
 */
export const registerApi = async (userData) => {
  const carte = userData.carte_etudiant_fichier;
  let payload = userData;
  if (carte instanceof File) {
    payload = new FormData();
    Object.entries(userData).forEach(([cle, valeur]) => {
      if (valeur === undefined || valeur === null || valeur === '') return;
      payload.append(cle, valeur);
    });
  }
  const response = await api.post('/comptes/register/', payload);
  return response.data;
};

export const verifierSession = async () => (await api.get('/comptes/me/')).data;
