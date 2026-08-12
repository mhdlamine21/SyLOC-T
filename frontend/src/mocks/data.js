/**
 * Structures de données réelles SyLOC-T (CROUS-T / Campus VCN)
 * Connectées à la base de données MySQL.
 */

export const ROLES = {
  USAGER: 'USAGER',
  OCCUPANT: 'OCCUPANT',
  BUREAU_COURRIER: 'BUREAU_COURRIER',
  AGENT_DCUVE: 'AGENT_DCUVE',
  DIRECTEUR_DCUVE: 'DIRECTEUR_DCUVE',
  DIRECTEUR_CROUS_T: 'DIRECTEUR_CROUS_T',
  SERVICE_JURIDIQUE: 'SERVICE_JURIDIQUE',
  SERVICE_COMPTABLE: 'SERVICE_COMPTABLE',
  SERVICE_TECHNIQUE: 'SERVICE_TECHNIQUE',
  AGENT_TERRAIN: 'AGENT_TERRAIN',
  AGENT_QHSE: 'AGENT_QHSE',
  CELLULE_COMMUNICATION: 'CELLULE_COMMUNICATION',
  AMICALE: 'AMICALE',
  ADMINISTRATEUR_SI: 'ADMINISTRATEUR_SI',
};

export const STATUT_STYLES = {
  EN_ATTENTE:              { label: 'En attente',             bg: 'bg-amber-pale',   fg: 'text-amber-deep',  dot: 'bg-amber' },
  EN_EXPERTISE_TECHNIQUE:  { label: 'Expertise Technique',    bg: 'bg-info-soft',    fg: 'text-info',        dot: 'bg-info' },
  MITIGEE_COMPLEMENT:      { label: 'Complément requis',       bg: 'bg-danger-soft',  fg: 'text-danger',      dot: 'bg-danger' },
  FAVORABLE:               { label: 'Favorable',               bg: 'bg-ok-soft',      fg: 'text-ok',          dot: 'bg-ok' },
  DEFAVORABLE:             { label: 'Défavorable',             bg: 'bg-stamp-pale',   fg: 'text-stamp',       dot: 'bg-stamp' },
  OUVERTE:                 { label: 'Ouverte',                 bg: 'bg-info-soft',    fg: 'text-info',        dot: 'bg-info' },
  INTERVENTION_EN_COURS:   { label: 'Intervention en cours',   bg: 'bg-amber-pale',   fg: 'text-amber-deep',  dot: 'bg-amber' },
  RESOLUE:                 { label: 'Résolue',                 bg: 'bg-ok-soft',      fg: 'text-ok',          dot: 'bg-ok' },
  PAYEE:                   { label: 'Payée',                   bg: 'bg-ok-soft',      fg: 'text-ok',          dot: 'bg-ok' },
  EXIGIBLE:                { label: 'Exigible',                bg: 'bg-warn-soft',    fg: 'text-warn',        dot: 'bg-warn' },
  EN_RETARD:               { label: 'En retard',               bg: 'bg-danger-soft',  fg: 'text-danger',      dot: 'bg-danger' },
  VALIDE:                  { label: 'Validée',                 bg: 'bg-ok-soft',      fg: 'text-ok',          dot: 'bg-ok' },
  DANGER:                  { label: 'Dernier Avis (Danger)',   bg: 'bg-stamp-pale',   fg: 'text-stamp',       dot: 'bg-stamp' },
  RESILIE:                 { label: 'Contrat Résilié',         bg: 'bg-stamp text-paper', fg: 'text-paper',  dot: 'bg-paper' },
};

export const TYPE_DEMANDE_OPTIONS = [
  { value: 'VENTE_PRODUIT',         label: 'Vente de produits' },
  { value: 'PRESTATION_SERVICE',    label: 'Prestation de service' },
  { value: 'LOCAL_ARTISANAL',       label: 'Local artisanal' },
  { value: 'RENOVATION',            label: "Rénovation d'un local existant" },
  { value: 'CONSTRUCTION_CANDIDAT', label: 'Construction par le candidat' },
  { value: 'CONSTRUCTION_CROUST',   label: 'Construction CROUS-T' },
];

export const DEMO_ACCOUNTS = {};
export const demandesMock = [];
export const signalementsMock = [];
export const cartesEtudiantsMock = [];
export const utilisateursMock = [];
export const appelsMock = [
  {
    id: 'APP-2026-001',
    date: '10 Août 2026',
    titre: 'Appel à candidature : Gérance de la Cantine Universitaire (Campus VCN)',
    contenu: "Le CROUS de Thiès lance un appel à candidature pour la gérance de la cantine A du campus VCN. Nous recherchons un prestataire expérimenté dans la restauration de masse.",
    criteres: ['Expérience de 5 ans', 'Agrément Sanitaire', 'Activité : Restauration'],
    local_cible: 'Cantine A (65m²)',
    statut: 'OUVERT',
    date_limite: '30 Août 2026'
  },
  {
    id: 'APP-2026-002',
    date: '05 Août 2026',
    titre: 'Mise à disposition de locaux artisanaux pour étudiants entrepreneurs',
    contenu: "Dans le cadre de l'accompagnement des étudiants entrepreneurs, 3 locaux de 15m² sont mis à disposition pour des activités de cordonnerie, couture ou multiservices. Critère strict : Être étudiant inscrit.",
    criteres: ['Carte Étudiant', 'Activité : Artisanat/Multiservices'],
    local_cible: 'Bloc C - Locaux 1 à 3',
    statut: 'OUVERT',
    date_limite: '25 Août 2026'
  }
];
export const journalMock = [];
export const repartitionTypesMock = [];
export const evolutionDemandesMock = [];
export const topOccupantsMock = [];
export const locauxMock = [
  { 
    id: 'LOC-004', 
    reference: 'LOC-004', 
    type: 'Restauration', 
    surface_m2: 65, 
    localisation: 'Campus VCN - Restauration', 
    statut_occupation: 'OCCUPE',
    photo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    occupant_nom: 'Fatou Diop',
    service_description: 'Cantine A - Restauration Rapide & Plats Locaux. Service en continu de 8h à 22h.',
    horaires: '08:00 - 22:00',
    coordonnees: [14.795, -16.963], // Latitude, Longitude (Thies)
  },
  { 
    id: 'LOC-001', 
    reference: 'LOC-001', 
    type: 'Multiservices', 
    surface_m2: 24, 
    localisation: 'Campus VCN - Bloc A', 
    statut_occupation: 'OCCUPE',
    photo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    occupant_nom: 'Moussa Ndiaye',
    service_description: 'Kiosque Multiservices : Impression, Reliure, Transfert Mobile Money, Vente de fournitures.',
    horaires: '08:00 - 18:00',
    coordonnees: [14.796, -16.962],
  },
  { 
    id: 'LOC-003', 
    reference: 'LOC-003', 
    type: 'Artisanat', 
    surface_m2: 32, 
    localisation: 'Campus VCN - Bloc C', 
    statut_occupation: 'DISPONIBLE',
    photo_url: 'https://images.unsplash.com/photo-1556740714-a8395b3bf30f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    occupant_nom: null,
    service_description: 'Local artisanal libre, idéal pour atelier de couture, cordonnerie ou réparation électronique.',
    horaires: 'Non défini',
    coordonnees: [14.794, -16.964],
  },
];

export const contratMock = {
  id_contrat: 'CT-2026-001',
  date_debut: '2026-01-01',
  date_fin: '2027-12-31',
  redevance_mensuelle: 15000,
  gratuit_etudiant: true,
  local: { reference: 'LOC-004', type: 'Cantine A', localisation: 'Campus VCN' },
};

export const kpisMock = {
  demandes_en_cours: 0,
  taux_favorable: 0,
  impayés_montant: 0,
  signalements_ouverts: 0,
  inspections_mois: 0,
  score_qhse_moyen: 0,
};
