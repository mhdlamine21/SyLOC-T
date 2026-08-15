/**
 * Styles d'affichage des statuts — aligné sur les TextChoices Django.
 * (Anciennement dans mocks/data.js : les mocks ne doivent plus être importés
 * par du code de production.)
 */
export const STATUT_STYLES = {
  // demandes.models.StatutDemande
  NOUVELLE:                 { label: 'Nouvelle',                bg: 'bg-info-soft',   fg: 'text-info',       dot: 'bg-info' },
  CONTROLE_RECEVABILITE:    { label: 'Contrôle recevabilité',   bg: 'bg-amber-pale',  fg: 'text-amber-deep', dot: 'bg-amber' },
  MITIGEE_COMPLEMENT:       { label: 'Complément requis',       bg: 'bg-danger-soft', fg: 'text-danger',     dot: 'bg-danger' },
  EN_EXPERTISE_TECHNIQUE:   { label: 'Expertise technique',     bg: 'bg-info-soft',   fg: 'text-info',       dot: 'bg-info' },
  CONTROLE_HYGIENE:         { label: 'Contrôle hygiène',        bg: 'bg-info-soft',   fg: 'text-info',       dot: 'bg-info' },
  EN_ATTENTE_DECISION:      { label: 'En attente de décision',  bg: 'bg-amber-pale',  fg: 'text-amber-deep', dot: 'bg-amber' },
  FAVORABLE:                { label: 'Favorable',               bg: 'bg-ok-soft',     fg: 'text-ok',         dot: 'bg-ok' },
  DEFAVORABLE:              { label: 'Défavorable',             bg: 'bg-stamp-pale',  fg: 'text-stamp',      dot: 'bg-stamp' },
  MITIGEE_ARCHIVEE:         { label: 'Mitigée (archivée)',      bg: 'bg-soft',        fg: 'text-muted',      dot: 'bg-muted' },
  EN_ATTENTE_SIGNATURE:     { label: 'En attente signature',    bg: 'bg-amber-pale',  fg: 'text-amber-deep', dot: 'bg-amber' },
  CONTRAT_ACCEPTE_RDV_FIXE: { label: 'Contrat accepté (RDV)',   bg: 'bg-ok-soft',     fg: 'text-ok',         dot: 'bg-ok' },
  CONTRAT_REFUSE:           { label: 'Contrat refusé',          bg: 'bg-stamp-pale',  fg: 'text-stamp',      dot: 'bg-stamp' },

  // comptes.models.StatutVerificationEtudiant
  EN_ATTENTE:               { label: 'En attente',              bg: 'bg-amber-pale',  fg: 'text-amber-deep', dot: 'bg-amber' },
  VALIDE:                   { label: 'Validée',                 bg: 'bg-ok-soft',     fg: 'text-ok',         dot: 'bg-ok' },
  REJETE:                   { label: 'Rejetée',                 bg: 'bg-stamp-pale',  fg: 'text-stamp',      dot: 'bg-stamp' },

  // terrain.models.StatutPlainte
  OUVERTE:                  { label: 'Ouverte',                 bg: 'bg-info-soft',   fg: 'text-info',       dot: 'bg-info' },
  EN_COURS_TRAITEMENT:      { label: 'En cours de traitement',  bg: 'bg-amber-pale',  fg: 'text-amber-deep', dot: 'bg-amber' },
  RESOLUE:                  { label: 'Résolue',                 bg: 'bg-ok-soft',     fg: 'text-ok',         dot: 'bg-ok' },
  REJETEE:                  { label: 'Rejetée',                 bg: 'bg-stamp-pale',  fg: 'text-stamp',      dot: 'bg-stamp' },

  // paiements.models.StatutEcheance
  NON_ECHUE:                { label: 'Non échue',               bg: 'bg-soft',        fg: 'text-muted',      dot: 'bg-muted' },
  EXIGIBLE:                 { label: 'Exigible',                bg: 'bg-warn-soft',   fg: 'text-warn',       dot: 'bg-warn' },
  PAYEE:                    { label: 'Payée',                   bg: 'bg-ok-soft',     fg: 'text-ok',         dot: 'bg-ok' },
  EN_RETARD:                { label: 'En retard',               bg: 'bg-danger-soft', fg: 'text-danger',     dot: 'bg-danger' },

  // terrain.models.StatutAvis / StatutSanction
  PUBLIE:                   { label: 'Publié',                  bg: 'bg-ok-soft',     fg: 'text-ok',         dot: 'bg-ok' },
  SIGNALE:                  { label: 'Signalé',                 bg: 'bg-amber-pale',  fg: 'text-amber-deep', dot: 'bg-amber' },
  MASQUE:                   { label: 'Masqué',                  bg: 'bg-soft',        fg: 'text-muted',      dot: 'bg-muted' },
  NOTIFIEE:                 { label: 'Notifiée',                bg: 'bg-stamp-pale',  fg: 'text-stamp',      dot: 'bg-stamp' },
  LEVEE:                    { label: 'Levée',                   bg: 'bg-ok-soft',     fg: 'text-ok',         dot: 'bg-ok' },

  // Divers (contrats)
  RESILIE:                  { label: 'Contrat résilié',         bg: 'bg-stamp-pale',  fg: 'text-stamp',      dot: 'bg-stamp' },
  ACTIF:                    { label: 'Contrat actif',           bg: 'bg-ok-soft',     fg: 'text-ok',         dot: 'bg-ok' },

  // Catalogue Locaux
  DISPONIBLE:               { label: 'Disponible',              bg: 'bg-ok-soft',     fg: 'text-ok',         dot: 'bg-ok' },
  OCCUPE:                   { label: 'Occupé',                  bg: 'bg-stamp-pale',  fg: 'text-stamp',      dot: 'bg-stamp' },
  AUTRE:                    { label: 'Autre',                   bg: 'bg-soft',        fg: 'text-muted',      dot: 'bg-muted' },
};

export default STATUT_STYLES;
