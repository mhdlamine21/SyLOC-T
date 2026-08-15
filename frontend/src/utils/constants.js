// Constantes alignées sur les TextChoices du backend Django (source de vérité).
// Toute valeur ci-dessous doit exister côté serveur, sinon les requêtes échouent.

// comptes.models.RoleUtilisateur (+ OCCUPANT, rôle "effectif" calculé par l'API).
export const ROLES = {
  USAGER: "USAGER",
  OCCUPANT: "OCCUPANT",
  BUREAU_COURRIER: "BUREAU_COURRIER",
  AGENT_DCUVE: "AGENT_DCUVE",
  DIRECTEUR_DCUVE: "DIRECTEUR_DCUVE",
  DIRECTEUR_CROUS_T: "DIRECTEUR_CROUS_T",
  SERVICE_JURIDIQUE: "SERVICE_JURIDIQUE",
  SERVICE_COMPTABLE: "SERVICE_COMPTABLE",
  SERVICE_TECHNIQUE: "SERVICE_TECHNIQUE",
  AGENT_TERRAIN: "AGENT_TERRAIN",
  AGENT_QHSE: "AGENT_QHSE",
  CELLULE_COMMUNICATION: "CELLULE_COMMUNICATION",
  AMICALE: "AMICALE",
  ADMINISTRATEUR_SI: "ADMINISTRATEUR_SI",
};

export const ROLES_LABELS = {
  USAGER: "Usager",
  OCCUPANT: "Occupant titulaire",
  BUREAU_COURRIER: "Bureau du Courrier",
  AGENT_DCUVE: "Agent DCUVE",
  DIRECTEUR_DCUVE: "Directeur DCUVE",
  DIRECTEUR_CROUS_T: "Directeur CROUS-T",
  SERVICE_JURIDIQUE: "Service Juridique",
  SERVICE_COMPTABLE: "Service Comptable",
  SERVICE_TECHNIQUE: "Service Technique",
  AGENT_TERRAIN: "Agent de Terrain",
  AGENT_QHSE: "Agent QHSE",
  CELLULE_COMMUNICATION: "Cellule Communication",
  AMICALE: "Amicale",
  ADMINISTRATEUR_SI: "Administrateur SI",
};

/** Le service n'existe pas en base : il est déduit du rôle (affichage seulement). */
export const SERVICE_PAR_ROLE = {
  BUREAU_COURRIER: "Bureau du Courrier",
  AGENT_DCUVE: "Direction du Centre Universitaire et de la Vie Étudiante",
  DIRECTEUR_DCUVE: "Direction du Centre Universitaire et de la Vie Étudiante",
  DIRECTEUR_CROUS_T: "Direction Générale CROUS-T",
  SERVICE_JURIDIQUE: "Service Juridique & Contentieux",
  SERVICE_COMPTABLE: "Service Comptable & Financement",
  SERVICE_TECHNIQUE: "Service Technique & Maintenance",
  AGENT_TERRAIN: "Brigade de Contrôle Terrain",
  AGENT_QHSE: "Bureau Hygiène, Sécurité & Environnement",
  CELLULE_COMMUNICATION: "Cellule Communication & Relations",
  AMICALE: "Amicale des étudiants",
  ADMINISTRATEUR_SI: "Administration SI",
  USAGER: "Usager / Candidat",
  OCCUPANT: "Occupant titulaire",
};

export const SERVICES = Object.entries(SERVICE_PAR_ROLE)
  .filter(([value]) => value !== "USAGER" && value !== "OCCUPANT")
  .map(([value, label]) => ({ value, label }));

// demandes.models.StatutDemande
export const STATUTS_DEMANDE = {
  NOUVELLE: "NOUVELLE",
  CONTROLE_RECEVABILITE: "CONTROLE_RECEVABILITE",
  MITIGEE_COMPLEMENT: "MITIGEE_COMPLEMENT",
  EN_EXPERTISE_TECHNIQUE: "EN_EXPERTISE_TECHNIQUE",
  CONTROLE_HYGIENE: "CONTROLE_HYGIENE",
  EN_ATTENTE_DECISION: "EN_ATTENTE_DECISION",
  FAVORABLE: "FAVORABLE",
  DEFAVORABLE: "DEFAVORABLE",
  MITIGEE_ARCHIVEE: "MITIGEE_ARCHIVEE",
  EN_ATTENTE_SIGNATURE: "EN_ATTENTE_SIGNATURE",
  CONTRAT_ACCEPTE_RDV_FIXE: "CONTRAT_ACCEPTE_RDV_FIXE",
  CONTRAT_REFUSE: "CONTRAT_REFUSE",
};

export const STATUTS_DEMANDE_LABELS = {
  NOUVELLE: "Nouvelle demande",
  CONTROLE_RECEVABILITE: "Contrôle de recevabilité",
  MITIGEE_COMPLEMENT: "En attente de compléments",
  EN_EXPERTISE_TECHNIQUE: "Expertise technique",
  CONTROLE_HYGIENE: "Contrôle sanitaire et hygiène",
  EN_ATTENTE_DECISION: "En attente de décision finale",
  FAVORABLE: "Favorable",
  DEFAVORABLE: "Défavorable",
  MITIGEE_ARCHIVEE: "Mitigée (archivée)",
  EN_ATTENTE_SIGNATURE: "En attente de signature",
  CONTRAT_ACCEPTE_RDV_FIXE: "Contrat accepté (RDV fixé)",
  CONTRAT_REFUSE: "Contrat refusé",
};

// demandes.models.TypeDemande
export const TYPES_DEMANDE = [
  { value: "RENOVATION", label: "Rénovation" },
  { value: "CONSTRUCTION_CANDIDAT", label: "Construction (candidat)" },
  { value: "CONSTRUCTION_CROUST", label: "Construction (CROUS-T)" },
  { value: "VENTE_PRODUIT", label: "Vente de produit" },
  { value: "VENTE_ALIMENTAIRE", label: "Vente alimentaire" },
  { value: "PRESTATION_SERVICE", label: "Prestation de service" },
  { value: "LOCAL_ARTISANAL", label: "Local artisanal" },
];

// demandes.models.TypeDocument
export const TYPES_DOCUMENT = [
  { value: "CARTE_ETUDIANT", label: "Carte étudiant" },
  { value: "PIECE_IDENTITE", label: "Pièce d'identité" },
  { value: "REGISTRE_COMMERCE", label: "Registre de commerce" },
  { value: "ATTESTATION_HYGIENE", label: "Attestation d'hygiène" },
  { value: "PLAN_AMENAGEMENT", label: "Plan d'aménagement" },
  { value: "CV", label: "Curriculum Vitae" },
  { value: "AUTORISATION_VENTE", label: "Autorisation de vente" },
  { value: "BUSINESS_PLAN", label: "Business Plan" },
  { value: "MAQUETTE_3D", label: "Maquette 3D" },
  { value: "FICHE_SANTE", label: "Fiche santé alimentaire" },
];

// patrimoine.models
export const TYPES_LOCAL = {
  RESTAURATION: "RESTAURATION",
  MULTISERVICES: "MULTISERVICES",
  PAPETERIE: "PAPETERIE",
  ARTISANAT: "ARTISANAT",
  AUTRE: "AUTRE",
};

export const ETATS_LOCAL = [
  { value: "BON_ETAT", label: "Bon état" },
  { value: "NECESSITE_RENOVATION", label: "Nécessite rénovation" },
  { value: "DEGRADE", label: "Dégradé" },
  { value: "EN_TRAVAUX", label: "En travaux" },
];

export const GESTIONNAIRES = [
  { value: "CROUS_T", label: "CROUS-T" },
  { value: "AMICALE", label: "Amicale" },
];

// paiements.models
export const MODES_PAIEMENT = [
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "ESPECES", label: "Espèces" },
];

export const STATUTS_ECHEANCE = {
  NON_ECHUE: "NON_ECHUE",
  EXIGIBLE: "EXIGIBLE",
  PAYEE: "PAYEE",
  EN_RETARD: "EN_RETARD",
};

// terrain.models
export const TYPES_SIGNALEMENT_TERRAIN = [
  { value: "TECHNIQUE", label: "Problème technique / panne" },
  { value: "NON_CONFORMITE_QHSE", label: "Manquement hygiène / insalubrité" },
  { value: "ENVIRONNEMENT", label: "Nuisance environnementale" },
  { value: "DENONCIATION_ILLEGALE", label: "Occupation sans titre / illégale" },
];

export const STATUTS_PLAINTE = {
  OUVERTE: "OUVERTE",
  EN_COURS_TRAITEMENT: "EN_COURS_TRAITEMENT",
  RESOLUE: "RESOLUE",
  REJETEE: "REJETEE",
};

export const NIVEAUX_URGENCE = [
  { value: "FAIBLE", label: "Faible" },
  { value: "MOYENNE", label: "Moyenne" },
  { value: "ELEVEE", label: "Élevée" },
];

export const TYPES_CONTROLE_QHSE = [
  { value: "SANITAIRE", label: "Sanitaire" },
  { value: "TECHNIQUE", label: "Technique" },
  { value: "ELECTRIQUE", label: "Électrique" },
  { value: "OCCUPATION", label: "Occupation" },
];

export const NIVEAUX_SANCTION = [
  { value: "AVERTISSEMENT", label: "Avertissement" },
  { value: "RAPPEL_A_L_ORDRE", label: "Rappel à l'ordre" },
  { value: "CONVOCATION", label: "Convocation" },
  { value: "EXPULSION", label: "Expulsion" },
];

export const STATUTS_AVIS = {
  PUBLIE: "PUBLIE",
  SIGNALE: "SIGNALE",
  MASQUE: "MASQUE",
};

export const APP_NAME = "SyLOC-T";
export const APP_SUBTITLE = "Système de gestion des locaux du CROUS-T";

// Libellés des types de demande (dérivés de TYPES_DEMANDE).
export const TYPES_DEMANDE_LABELS = Object.fromEntries(
  TYPES_DEMANDE.map((t) => [t.value, t.label]),
);

// Libellés d'affichage des types de local.
export const TYPES_LOCAL_LABELS = {
  RESTAURATION: "Restauration",
  MULTISERVICES: "Multiservices",
  PAPETERIE: "Papeterie",
  ARTISANAT: "Artisanat",
  AUTRE: "Autre",
};

// Options du formulaire de dépôt de dossier (sous-ensemble métier de TYPES_DEMANDE).
export const TYPE_DEMANDE_OPTIONS = [
  { value: "VENTE_PRODUIT", label: "Vente de produits" },
  { value: "VENTE_ALIMENTAIRE", label: "Vente alimentaire" },
  { value: "PRESTATION_SERVICE", label: "Prestation de service" },
  { value: "LOCAL_ARTISANAL", label: "Local artisanal" },
  { value: "RENOVATION", label: "Rénovation d'un local existant (expertise technique)" },
  { value: "CONSTRUCTION_CANDIDAT", label: "Construction financée par le candidat (maquette & plan)" },
  { value: "CONSTRUCTION_CROUST", label: "Construction financée par le CROUS-T" },
];

// Règlement intérieur type annexé à tout contrat d'occupation domaniale.
export const REGLEMENT_CONTRAT = `ARTICLE 1 — USAGE DU LOCAL : Le local est concédé à titre d'occupation domaniale précaire et révocable. Toute sous-location est formellement interdite sous peine de résiliation immédiate.

ARTICLE 2 — NORMES SANITAIRES ET PRIX : L'occupant s'engage à respecter la grille des prix arrêtée avec le CROUS-T et à maintenir un état de propreté irréprochable.

ARTICLE 3 — PAIEMENT DES REDEVANCES : La redevance est payable d'avance selon l'échéancier généré par la plateforme. Tout retard entraîne des pénalités et un rappel à l'ordre.

ARTICLE 4 — SANCTIONS & EXPULSION : En cas de non-conformités QHSE répétées ou d'impayé persistant, le contrat peut être résilié de plein droit après notification.`;

// terrain.models — Phase 5 (ordres de mission & maintenance technique)
export const STATUTS_ORDRE_MISSION = {
  EMIS: "EMIS",
  EN_COURS: "EN_COURS",
  EXECUTE: "EXECUTE",
  ANNULE: "ANNULE",
};

export const STATUTS_ORDRE_MISSION_LABELS = {
  EMIS: "Émis",
  EN_COURS: "En cours",
  EXECUTE: "Exécuté",
  ANNULE: "Annulé",
};

export const TYPES_INTERVENTION = [
  { value: "PREVENTIVE", label: "Préventive" },
  { value: "CURATIVE", label: "Curative" },
  { value: "URGENCE", label: "Urgence" },
];

export const STATUTS_INTERVENTION = {
  PLANIFIEE: "PLANIFIEE",
  EN_COURS: "EN_COURS",
  TERMINEE: "TERMINEE",
  ANNULEE: "ANNULEE",
};

export const STATUTS_INTERVENTION_LABELS = {
  PLANIFIEE: "Planifiée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};
