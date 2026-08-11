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

export const SERVICES = [
  { value: "DCUVE", label: "Direction du Centre Universitaire et de la Vie Etudiante" },
  { value: "COMPTABILITE", label: "Service Comptable & Financement" },
  { value: "TECHNIQUE", label: "Service Technique & Maintenance" },
  { value: "TERRAIN", label: "Brigade de Contrôle Terrain" },
  { value: "QHSE", label: "Bureau Environnement, Hygiène & Sécurité (QHSE)" },
  { value: "COMMUNICATION", label: "Cellule Communication & Relations" },
  { value: "JURIDIQUE", label: "Service Juridique & Contentieux" },
  { value: "COURRIER", label: "Bureau du Courrier" },
  { value: "ADMINISTRATION", label: "Administration SI & Direction Générale" },
];

export const STATUTS_DEMANDE = {
  EN_ATTENTE: "EN_ATTENTE",
  EN_EXPERTISE_TECHNIQUE: "EN_EXPERTISE_TECHNIQUE",
  MITIGEE_COMPLEMENT: "MITIGEE_COMPLEMENT",
  FAVORABLE: "FAVORABLE",
  DEFAVORABLE: "DEFAVORABLE",
};

export const TYPES_LOCAL = {
  RESTAURATION: "RESTAURATION",
  MULTISERVICES: "MULTISERVICES",
  PAPETERIE: "PAPETERIE",
  ARTISANAT: "ARTISANAT",
  AUTRE: "AUTRE",
};

export const TYPES_SIGNALEMENT_TERRAIN = [
  { value: "OCCUPATION_ILLEGALE", label: "🏴 Occupation sans titre / illégale" },
  { value: "PRIX_ANORMAUX", label: "💸 Tarifs anormaux non respectés" },
  { value: "ANOMALIE_TECHNIQUE", label: "🔧 Problème technique / panne grave" },
  { value: "NON_CONFORMITE_QHSE", label: "⚠️ Manquement hygiène / insalubrité" },
];

export const APP_NAME = "SyLOC-T";
export const APP_SUBTITLE = "Système de gestion des locaux du CROUS-T";
