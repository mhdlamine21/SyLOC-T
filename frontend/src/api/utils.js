/** Helpers partagés par la couche API. */

/** DRF peut renvoyer une liste brute ou un objet paginé {results: []}. */
export const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

/** Message d'erreur lisible à partir d'une erreur axios/DRF. */
export const messageErreur = (error, fallback = "Une erreur est survenue.") => {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  const premier = Object.entries(data)[0];
  if (!premier) return fallback;
  const [champ, valeur] = premier;
  const texte = Array.isArray(valeur) ? valeur[0] : valeur;
  return `${champ} : ${texte}`;
};
