// Regles d'affichage partagees du referentiel des locaux commerciaux.
// Un local se decrit par sa SURFACE (m2) : il n'a pas de "capacite d'accueil".
import { TYPES_LOCAL_LABELS, ETATS_LOCAL, GESTIONNAIRES } from './constants';
import photoBoutique from '../assets/local_boutique_sn.jpg';
import photoCantine from '../assets/local_cantine_sn.jpg';
import photoDisponible from '../assets/local_disponible_sn.jpg';
import photoOccupe from '../assets/local_occupe_sn.jpg';

export const LIBELLES_ETAT = Object.fromEntries(ETATS_LOCAL.map((e) => [e.value, e.label]));
export const LIBELLES_GESTIONNAIRE = Object.fromEntries(GESTIONNAIRES.map((g) => [g.value, g.label]));


/** Surface lisible : 19.19190247485726 -> "19,2 m²". */
export function formatSurface(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return '- m²';
  const n = Number(valeur);
  if (!Number.isFinite(n)) return '- m²';
  return `${n.toFixed(1).replace('.', ',')} m²`;
}

export function libelleType(loc) {
  return TYPES_LOCAL_LABELS[loc?.type_local] || loc?.type_local || 'Local';
}

export function libelleEtat(loc) {
  return LIBELLES_ETAT[loc?.etat_physique] || (loc?.etat_physique || '-').replace(/_/g, ' ');
}

export function libelleGestionnaire(loc) {
  return LIBELLES_GESTIONNAIRE[loc?.gestionnaire] || (loc?.gestionnaire || '-').replace(/_/g, ' ');
}

export function categorieOccupation(loc) {
  if (loc?.est_libre === false) return 'OCCUPE';
  return 'DISPONIBLE';
}

export function estCandidatable(loc) {
  return categorieOccupation(loc) === 'DISPONIBLE';
}

export function phraseDisponibilite(loc) {
  const cat = categorieOccupation(loc);
  if (cat === 'OCCUPE') return 'Actuellement occupé';
  return 'Disponible à la candidature';
}

/** Photo de vitrine (visuels du campus) : le type prime, puis l'occupation. */
export function photoLocal(loc) {
  if (loc?.photo_url) return loc.photo_url;
  if (loc?.type_local === 'RESTAURATION') return photoCantine;
  if (categorieOccupation(loc) === 'OCCUPE') return photoOccupe;
  if (categorieOccupation(loc) === 'DISPONIBLE') return photoDisponible;
  return photoBoutique;
}

/** Recherche plein texte simple sur un local. */
export function correspondRecherche(loc, terme) {
  const q = (terme || '').trim().toLowerCase();
  if (!q) return true;
  return [loc?.reference, loc?.localisation, loc?.zone_cartographie, libelleType(loc), libelleGestionnaire(loc)]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export const BAREME_BASE_FCFA = {
  RESTAURATION: 75000,
  MULTISERVICES: 25000,
  PAPETERIE: 40000,
  ARTISANAT: 35000,
  AUTRE: 25000,
};

/** Détermine le loyer mensuel estimé (ou de barème) pour un local. */
export function loyerMensuelEstime(loc) {
  if (loc?.loyer_mensuel !== undefined && loc?.loyer_mensuel !== null && loc?.loyer_mensuel !== '') {
    return Number(loc.loyer_mensuel);
  }
  return BAREME_BASE_FCFA[loc?.type_local] || 25000;
}

/** Formate le montant du loyer mensuel pour l'affichage vitrine et catalogue. */
export function formatLoyerMensuel(loc) {
  const montant = loyerMensuelEstime(loc);
  if (montant === 0) return 'Gratuit (Subvention Étudiante)';
  return `${montant.toLocaleString('fr-SN')} FCFA / mois`;
}
