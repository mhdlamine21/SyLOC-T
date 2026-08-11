/**
 * Données de démonstration SyLOC-T — v2.1
 * Exportation exhaustive pour garantir zéro rupture de module HMR.
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
  { value: 'RENOVATION',            label: "Rénovation d'un local existant (Expertise Technique)" },
  { value: 'CONSTRUCTION_CANDIDAT', label: 'Construction financée par le candidat (Maquette & Plan)' },
  { value: 'CONSTRUCTION_CROUST',   label: 'Construction financée par le CROUS-T' },
];

export const TYPE_LOCAL_INFO = {
  RESTAURATION:  { label: 'Restauration',   emoji: '🍽️', desc: 'Vente alimentaire, soumise à contrôle sanitaire préalable et inspections QHSE régulières.' },
  MULTISERVICES: { label: 'Multiservices',  emoji: '🛒', desc: 'Papeterie et prestations diverses pour la vie quotidienne des étudiants.' },
  PAPETERIE:     { label: 'Papeterie',      emoji: '📚', desc: 'Fournitures scolaires, photocopie, reliure et services connexes.' },
  ARTISANAT:     { label: 'Artisanat',      emoji: '🧵', desc: 'Locaux dédiés à l\'artisanat avec gratuité applicable aux étudiants.' },
  AUTRE:         { label: 'Autre',          emoji: '📦', desc: 'Autres usages non couverts par les catégories précédentes.' },
};

export const DEMO_ACCOUNTS = {
  usager: {
    id: 'USR-001',
    role: 'USAGER',
    nom_complet: 'Babacar Ndiaye (Candidat Commercial)',
    email: 'visiteur@example.com',
    type_usager: 'CANDIDAT',
    est_etudiant: false,
    statut_verification_etudiant: 'NON_SOUMIS',
    service: 'Candidat commercial',
  },
  demandeur: {
    id: 'USR-002',
    role: 'USAGER',
    nom_complet: 'Aïssatou Ndiaye (Étudiante & Candidate)',
    email: 'aissatou.ndiaye@example.com',
    type_usager: 'ETUDIANT',
    est_etudiant: true,
    statut_verification_etudiant: 'VALIDE',
    service: 'Étudiante UIDT / Candidate',
  },
  occupant: {
    id: 'USR-OCC-01',
    role: 'OCCUPANT',
    nom_complet: 'Mamadou Lô (Occupant Titulaire)',
    email: 'mamadou.lo@example.com',
    telephone: '77 450 12 34',
    adresse: 'Campus Social VCN, Thiès',
    local_attribue: 'LOC-004',
    contrat_ref: 'CT-2026-00312',
    est_etudiant: false,
    score_qhse: 4.2,
    score_avis: 4.5,
    service: 'Occupant Titulaire (Cantine A)',
  },
  service_technique: {
    id: 'USR-009',
    role: 'SERVICE_TECHNIQUE',
    nom_complet: 'Seydou Ba (Service Technique & Membre Commission)',
    email: 'seydou.ba@crous-t.sn',
    service: 'Service Technique & Maintenance',
    telephone: '77 777 88 99',
    est_membre_commission: true,
  },
  service_comptable: {
    id: 'USR-008',
    role: 'SERVICE_COMPTABLE',
    nom_complet: 'Oumar Thiam (Caissier & Comptable)',
    email: 'oumar.thiam@crous-t.sn',
    service: 'Service Comptable & Financement',
    telephone: '77 666 77 88',
  },
  agent_dcuve: {
    id: 'USR-004',
    role: 'AGENT_DCUVE',
    nom_complet: 'Moussa Diagne',
    email: 'moussa.diagne@crous-t.sn',
    service: 'Direction du Centre Universitaire et de la Vie Etudiante',
    telephone: '77 222 33 44',
  },
  directeur_dcuve: {
    id: 'USR-005',
    role: 'DIRECTEUR_DCUVE',
    nom_complet: 'Fatou Mbaye',
    email: 'fatou.mbaye@crous-t.sn',
    service: 'DCUVE',
    telephone: '77 333 44 55',
    est_membre_commission: true,
  },
  directeur_crous_t: {
    id: 'USR-006',
    role: 'DIRECTEUR_CROUS_T',
    nom_complet: 'Abdou Diallo',
    email: 'abdou.diallo@crous-t.sn',
    service: 'Direction Générale CROUS-T',
    telephone: '77 444 55 66',
  },
  agent_terrain: {
    id: 'USR-010',
    role: 'AGENT_TERRAIN',
    nom_complet: 'Lamine Kouyaté (Brigade Terrain)',
    email: 'lamine.kouyate@crous-t.sn',
    service: 'Brigade de Contrôle Terrain',
    telephone: '77 888 99 00',
  },
  agent_qhse: {
    id: 'USR-011',
    role: 'AGENT_QHSE',
    nom_complet: 'Ndéye Sarr (Bureau Environnement & QHSE)',
    email: 'ndeye.sarr@crous-t.sn',
    service: 'Bureau Environnement, Hygiène & Sécurité',
    telephone: '77 999 00 11',
  },
  service_juridique: {
    id: 'USR-007',
    role: 'SERVICE_JURIDIQUE',
    nom_complet: 'Mame Diarra Fall (Juriste & Membre Commission)',
    email: 'mdiarra.fall@crous-t.sn',
    service: 'Service Juridique & Contentieux',
    telephone: '77 555 66 77',
    est_membre_commission: true,
  },
  cellule_communication: {
    id: 'USR-012',
    role: 'CELLULE_COMMUNICATION',
    nom_complet: 'Rokhaya Diop',
    email: 'rokhaya.diop@crous-t.sn',
    service: 'Cellule Communication & Relations',
    telephone: '77 000 11 22',
  },
  administrateur_si: {
    id: 'USR-013',
    role: 'ADMINISTRATEUR_SI',
    nom_complet: 'Admin SyLOC-T (Superviseur Système)',
    email: 'admin@crous-t.sn',
    service: 'Administration SI & Direction Générale',
    telephone: '77 123 99 88',
  },
};

export const appelsMock = [
  {
    id: 'AP-2026-014',
    titre: 'Appel à projets — Local Bloc C',
    campus: 'Social (VCN)',
    cloture: '2026-08-28',
    est_actif: true,
    description: 'Appel ouvert à tout porteur de projet souhaitant développer une activité dans ce local disponible du Bloc C. Le type d\'activité sera proposé par le candidat dans son dossier.',
    local_id: 'LOC-002',
    local_ref: 'LOC-002',
    local_localisation: 'Bloc B – RDC',
    surface_m2: 18,
    photo_url: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=600&q=80',
    criteres_preference: {
      genre_prefere: 'INDIFFERENT',
      tranche_age: null,
      questions: [],
    },
  },
  {
    id: 'AP-2026-015',
    titre: 'Appel à projets — Local Artisanal Bloc D',
    campus: 'Social (VCN)',
    cloture: '2026-09-02',
    est_actif: true,
    description: 'Espace disponible dans le Bloc D. Tout type de projet est accepté. L\'activité exacte sera définie par le candidat dans sa proposition.',
    local_id: 'LOC-005',
    local_ref: 'LOC-005',
    local_localisation: 'Atelier – Bloc D',
    surface_m2: 28,
    photo_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
    criteres_preference: {
      genre_prefere: 'FEMININ',
      tranche_age: { min: 18, max: 35 },
      questions: [
        { id: 'q1', question: 'Avez-vous une expérience antérieure dans l\'artisanat ou une activité similaire ?' },
        { id: 'q2', question: 'Disposez-vous du matériel nécessaire à l\'exercice de votre activité ?' },
      ],
    },
  },
  {
    id: 'AP-2026-016',
    titre: 'Appel à projets — Local Bloc C (Niveau 1)',
    campus: 'Social (VCN)',
    cloture: '2026-09-10',
    est_actif: true,
    description: 'Local situé au premier étage du Bloc C. La nature de l\'activité est libre et sera évaluée selon le projet déposé.',
    local_id: 'LOC-003',
    local_ref: 'LOC-003',
    local_localisation: 'Bloc C – Niveau 1',
    surface_m2: 22,
    photo_url: 'https://images.unsplash.com/photo-1568832359672-e36cf5d74f54?auto=format&fit=crop&w=600&q=80',
    criteres_preference: {
      genre_prefere: 'INDIFFERENT',
      tranche_age: null,
      questions: [
        { id: 'q1', question: 'Décrivez brièvement votre projet d\'activité et son impact pour la communauté étudiante.' },
      ],
    },
  },
  {
    id: 'AP-2026-017',
    titre: 'Appel ouvert — Espace Campus Pédagogique',
    campus: 'Pédagogique',
    cloture: '2026-09-18',
    est_actif: true,
    description: 'Appel général sans local prédéfini. Les candidats soumettent leur projet complet incluant le local souhaité. Fort trafic entre les amphithéâtres.',
    local_id: null,
    local_ref: null,
    local_localisation: null,
    surface_m2: null,
    photo_url: null,
    criteres_preference: {
      genre_prefere: 'INDIFFERENT',
      tranche_age: null,
      questions: [],
    },
  },
];

export const locauxMock = [
  {
    id: 'LOC-001',
    reference: 'LOC-001',
    localisation: 'Bloc A – RDC',
    type: 'RESTAURATION',
    surface_m2: 32,
    capacite_accueil: 40,
    etat: 'BON_ETAT',
    gestionnaire: 'CROUS_T',
    est_libre: false,
    zone: 'VCN-Social',
    photo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    description: 'Espace restauration climatisé avec comptoir de service et cuisine équipée.',
    occupant_actuel: 'Mamadou Lô',
  },
  {
    id: 'LOC-002',
    reference: 'LOC-002',
    localisation: 'Bloc B – RDC',
    type: 'MULTISERVICES',
    surface_m2: 18,
    capacite_accueil: 20,
    etat: 'BON_ETAT',
    gestionnaire: 'CROUS_T',
    est_libre: true,
    zone: 'VCN-Social',
    photo_url: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=600&q=80',
    description: 'Boutique lumineuse au rez-de-chaussée du Bloc B, grille de protection metallique.',
    occupant_actuel: null,
  },
  {
    id: 'LOC-003',
    reference: 'LOC-003',
    localisation: 'Bloc C – Niveau 1',
    type: 'PAPETERIE',
    surface_m2: 22,
    capacite_accueil: 15,
    etat: 'NECESSITE_RENOVATION',
    gestionnaire: 'AMICALE',
    est_libre: true,
    zone: 'VCN-Social',
    photo_url: 'https://images.unsplash.com/photo-1568832359672-e36cf5d74f54?auto=format&fit=crop&w=600&q=80',
    description: 'Local papeterie situé au 1er étage. Nécessite travaux de peinture et réfection sol.',
    occupant_actuel: null,
  },
  {
    id: 'LOC-004',
    reference: 'LOC-004',
    localisation: 'Cantine A – Campus péda.',
    type: 'RESTAURATION',
    surface_m2: 55,
    capacite_accueil: 80,
    etat: 'BON_ETAT',
    gestionnaire: 'CROUS_T',
    est_libre: false,
    zone: 'Pédagogique',
    photo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    description: 'Grande cantine d\'angle avec vaste terrasse couverte et accès livraison direct.',
    occupant_actuel: 'Mamadou Lô (Occupant Titulaire)',
  },
  {
    id: 'LOC-005',
    reference: 'LOC-005',
    localisation: 'Atelier – Bloc D',
    type: 'ARTISANAT',
    surface_m2: 28,
    capacite_accueil: 12,
    etat: 'DEGRADE',
    gestionnaire: 'CROUS_T',
    est_libre: true,
    zone: 'VCN-Social',
    photo_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
    description: 'Atelier artisanal renforcé pour matériel lourd. Travaux de serrurerie à prévoir.',
    occupant_actuel: null,
  },
];

export const demandesMock = [
  {
    id_demande: 'DM-2026-00842',
    type: 'CONSTRUCTION_CANDIDAT',
    statut: 'EN_EXPERTISE_TECHNIQUE',
    date_depot: '2026-07-03',
    etape: 'Expertise Faisabilité — Service Technique',
    local_vise: 'LOC-002',
    description: 'Construction d\'une extension kiosque jus de fruits et viennoiseries.',
    documents_technique: [
      { nom: 'Maquette_Projet_Kiosque_V2.pdf', type: 'MAQUETTE_PLAN', taille: '4.2 Mo' },
      { nom: 'Devis_Descriptif_Materiaux.pdf', type: 'DEVIS', taille: '1.8 Mo' },
      { nom: 'CV_Entrepreneur_Ndiaye.pdf', type: 'CV', taille: '850 Ko' },
    ],
    avis_technique: { statut: 'EN_COURS', rapporteur: 'Seydou Ba', avis: 'En cours d\'analyse des structures métalliques et raccordement eau.' },
    demandeur: { nom: 'Aïssatou Ndiaye', email: 'aissatou.ndiaye@example.com', est_etudiant: true, id_user: 'USR-002' },
  },
  {
    id_demande: 'DM-2026-00799',
    type: 'MULTISERVICES',
    statut: 'FAVORABLE',
    date_depot: '2026-06-21',
    etape: 'Décision rendue — Prêt pour contrat',
    local_vise: 'LOC-002',
    description: 'Boutique de fournitures scolaires et services de reprographie.',
    documents_technique: [
      { nom: 'Plan_Amenagement_Interieur.pdf', type: 'PLAN', taille: '2.1 Mo' },
      { nom: 'Registre_Commerce_NINEA.pdf', type: 'JURIDIQUE', taille: '1.1 Mo' },
    ],
    avis_technique: { statut: 'APPROUVE', rapporteur: 'Seydou Ba', avis: 'Conformité électrique et charge au sol validées.' },
    demandeur: { nom: 'Mamadou Lô', email: 'mamadou.lo@example.com', est_etudiant: false, id_user: 'USR-OCC-01' },
  },
];

export const contratMock = {
  id_contrat: 'CT-2026-00312',
  local: { reference: 'LOC-004', localisation: 'Cantine A — Campus pédagogique', type: 'RESTAURATION' },
  date_signature: '2026-03-01',
  date_debut: '2026-03-15',
  date_fin_prevue: '2027-03-14',
  duree_mois: 12,
  preavis_mois: 2,
  redevance_mensuelle: 45000,
  montant_caution: 90000,
  est_gratuit: false,
  est_actif: true,
  demande_resiliation_encours: false,
  occupant: { id_user: 'USR-OCC-01', nom: 'Mamadou Lô (Occupant Titulaire)', email: 'mamadou.lo@example.com' },
  echeances: [
    { id: 1, date_exigibilite: '2026-03-15', montant_du: 45000, montant_penalite: 0, statut: 'PAYEE' },
    { id: 2, date_exigibilite: '2026-04-15', montant_du: 45000, montant_penalite: 0, statut: 'PAYEE' },
    { id: 3, date_exigibilite: '2026-05-15', montant_du: 45000, montant_penalite: 0, statut: 'PAYEE' },
    { id: 4, date_exigibilite: '2026-06-15', montant_du: 45000, montant_penalite: 0, statut: 'PAYEE' },
    { id: 5, date_exigibilite: '2026-07-15', montant_du: 45000, montant_penalite: 0, statut: 'PAYEE' },
    { id: 6, date_exigibilite: '2026-08-15', montant_du: 45000, montant_penalite: 2250, statut: 'EN_RETARD' },
    { id: 7, date_exigibilite: '2026-09-15', montant_du: 45000, montant_penalite: 0, statut: 'EXIGIBLE' },
  ],
};

export const paiementsMock = [
  { id: 'PAY-001', date: '2026-03-14', montant: 45000, mode: 'MOBILE_MONEY', reference: 'WAV-20260314-001', quitus: 'QIT-2026-001', occupant_nom: 'Mamadou Lô', local_ref: 'LOC-004' },
  { id: 'PAY-002', date: '2026-04-13', montant: 45000, mode: 'MOBILE_MONEY', reference: 'WAV-20260413-002', quitus: 'QIT-2026-002', occupant_nom: 'Mamadou Lô', local_ref: 'LOC-004' },
  { id: 'PAY-003', date: '2026-05-15', montant: 45000, mode: 'VIREMENT',     reference: 'VIR-20260515-003', quitus: 'QIT-2026-003', occupant_nom: 'Mamadou Lô', local_ref: 'LOC-004' },
  { id: 'PAY-004', date: '2026-06-14', montant: 45000, mode: 'MOBILE_MONEY', reference: 'WAV-20260614-004', quitus: 'QIT-2026-004', occupant_nom: 'Mamadou Lô', local_ref: 'LOC-004' },
  { id: 'PAY-005', date: '2026-07-15', montant: 45000, mode: 'ESPECES',      reference: 'ESP-20260715-005', quitus: 'QIT-2026-005', occupant_nom: 'Mamadou Lô', local_ref: 'LOC-004' },
];

export const signalementsMock = [
  { id: 'SIG-001', type: 'TECHNIQUE', statut: 'OUVERTE', urgence: 'ELEVEE', date_depot: '2026-08-08', description: 'Fuite d\'eau importante dans la cantine A, risque de glissade.', localisation: 'Cantine A — Cuisine', photo: null, est_anonyme: false, deposant: 'Mamadou Lô', local: 'LOC-004' },
  { id: 'SIG-002', type: 'NON_CONFORMITE_QHSE', statut: 'EN_COURS_TRAITEMENT', urgence: 'MOYENNE', date_depot: '2026-08-06', description: 'Absence de gants et masques lors de la manipulation des aliments.', localisation: 'Kiosque — Amphi 2', photo: null, est_anonyme: true, deposant: 'Anonyme', local: 'LOC-006' },
  { id: 'SIG-003', type: 'DENONCIATION_ILLEGALE', statut: 'OUVERTE', urgence: 'ELEVEE', date_depot: '2026-08-07', description: 'Occupant sans titre installé dans le local LOC-003 depuis 3 jours.', localisation: 'Bloc C — Niveau 1', photo: null, est_anonyme: false, deposant: 'Lamine Kouyaté', local: 'LOC-003' },
];

export const inspectionsMock = [
  { id: 'INS-001', type_controle: 'SANITAIRE', date_visite: '2026-08-05', est_conforme: false, observations: 'Température réfrigérateur hors norme. Absence de cahier de traçabilité.', local: 'LOC-004', inspecteur: 'Ndéye Sarr', sanctions: ['SAC-001'] },
  { id: 'INS-002', type_controle: 'TECHNIQUE', date_visite: '2026-08-03', est_conforme: true, observations: 'Installation électrique aux normes. Extincteurs en place et valides.', local: 'LOC-001', inspecteur: 'Ndéye Sarr', sanctions: [] },
];

export const sanctionsMock = [
  { id: 'SAC-001', niveau: 'RAPPEL_A_L_ORDRE', statut: 'NOTIFIEE', date_application: '2026-08-06', motif: 'Non-conformité sanitaire — température réfrigérateur.', local: 'LOC-004', occupant: 'Mamadou Lô' },
];

export const cartesEtudiantsMock = [
  { id: 'CE-001', demandeur: 'Aïssatou Ndiaye', email: 'aissatou.ndiaye@example.com', fichier: null, statut: 'VALIDE', date_soumission: '2026-08-08' },
  { id: 'CE-002', demandeur: 'Cheikh Ndiaye', email: 'cheikh.ndiaye@student.uidt.sn', fichier: null, statut: 'EN_ATTENTE', date_soumission: '2026-08-07' },
];

export const kpisMock = {
  demandes_en_cours: 8,
  demandes_favorables_mois: 3,
  demandes_en_attente: 5,
  taux_favorable: 72,
  locaux_occupes: 4,
  locaux_libres: 2,
  impayés_montant: 47250,
  signalements_ouverts: 2,
  inspections_mois: 3,
  score_qhse_moyen: 4.1,
};

export const evolutionDemandesMock = [
  { mois: 'Mars', soumises: 4, favorables: 3, defavorables: 1 },
  { mois: 'Avr', soumises: 6, favorables: 4, defavorables: 2 },
  { mois: 'Mai', soumises: 5, favorables: 3, defavorables: 2 },
  { mois: 'Juin', soumises: 8, favorables: 5, defavorables: 3 },
  { mois: 'Juil', soumises: 7, favorables: 4, defavorables: 3 },
  { mois: 'Août', soumises: 5, favorables: 3, defavorables: 2 },
];

export const repartitionTypesMock = [
  { name: 'Restauration', value: 38 },
  { name: 'Multiservices', value: 27 },
  { name: 'Artisanat', value: 20 },
  { name: 'Papeterie', value: 15 },
];

export const signalementsTerrainMock = [
  { id: 'SIG-TR-001', type: 'OCCUPATION_ILLEGALE', statut: 'CONVOCATION_EMISE', severite: 'HAUTE', date_constat: '2026-08-08', description: 'Occupant non identifié installé sans bail dans le local LOC-003.', localisation: 'Bloc C — Niveau 1', agent_rapporteur: 'Lamine Kouyaté', transmis_au_bureau_env: true },
  { id: 'SIG-TR-002', type: 'PRIX_ANORMAUX', statut: 'EN_INSPECTION', severite: 'MOYENNE', date_constat: '2026-08-07', description: 'Le plat de thiéboudienne vendu à 1500 FCFA au lieu du tarif conventionné de 1000 FCFA.', localisation: 'Cantine A', agent_rapporteur: 'Lamine Kouyaté', transmis_au_bureau_env: true },
];

export const convocationsQHSEMock = [
  { id: 'CONV-001', local: 'LOC-004', occupant: 'Mamadou Lô', etape: 'RAPPEL_A_L_ORDRE', motif: 'Insanité constatée lors du contrôle réfrigérateur.', date_limite_correction: '2026-08-20', statut: 'EN_ATTENTE_CORRECTION' },
  { id: 'CONV-002', local: 'LOC-003', occupant: 'Squatteur Inconnu', etape: 'DANGER_EXPULSION', motif: 'Occupation illégale non régularisée sous 48h.', date_limite_correction: '2026-08-12', statut: 'URGENCE_EXPULSION' },
];

export const topOccupantsMock = [
  { rank: 1, nom: 'Mamadou Lô', local: 'LOC-004 (Cantine A)', score_qhse: 4.8, score_avis: 4.7, retard_paiement: false, photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
  { rank: 2, nom: 'Fatou Bintou Sow', local: 'LOC-001 (Kiosque A)', score_qhse: 4.6, score_avis: 4.4, retard_paiement: false, photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
  { rank: 3, nom: 'Ousmane Traoré', local: 'LOC-002 (Multiservices)', score_qhse: 3.2, score_avis: 2.7, retard_paiement: true, alerte_mission: true, photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
];

export const avisMock = [
  { id: 'AV-001', local: 'LOC-004', local_label: 'Cantine A', note_etoiles: 4, commentaire: 'Très bonne cuisine du terroir. Propre et accueillant. Un peu long en heure de pointe.', date_publication: '2026-08-02', auteur: 'Mariama Sy (Étudiante vérifiée)', statut: 'PUBLIE' },
  { id: 'AV-002', local: 'LOC-004', local_label: 'Cantine A', note_etoiles: 5, commentaire: 'Excellent ! Le thiéboudienne est délicieux. Prix très abordable.', date_publication: '2026-08-04', auteur: 'Modou Fall (Étudiant vérifié)', statut: 'PUBLIE' },
  { id: 'AV-003', local: 'LOC-001', local_label: 'Cantine Bloc A', note_etoiles: 2, commentaire: 'Manque de propreté dans la salle. Personnel peu aimable.', date_publication: '2026-08-06', auteur: 'Étudiant anonyme', statut: 'SIGNALE' },
];

export const utilisateursMock = [
  { id: 'USR-001', prenom: 'Babacar', nom: 'Ndiaye', nom_complet: 'Babacar Ndiaye', email: 'visiteur@example.com', role: 'USAGER', type_usager: 'CANDIDAT', service: 'Usager Candidat', statut: 'ACTIF', date_creation: '2026-01-10', telephone: '77 100 00 00', adresse: 'Thiès VCN' },
  { id: 'USR-002', prenom: 'Aïssatou', nom: 'Ndiaye', nom_complet: 'Aïssatou Ndiaye', email: 'aissatou.ndiaye@example.com', role: 'USAGER', type_usager: 'ETUDIANT', service: 'Étudiante / Candidate', statut: 'ACTIF', date_creation: '2026-01-15', est_etudiant: true, statut_verification_etudiant: 'VALIDE', telephone: '77 200 00 00', adresse: 'VCN Thiès' },
  { id: 'USR-OCC-01', prenom: 'Mamadou', nom: 'Lô', nom_complet: 'Mamadou Lô', email: 'mamadou.lo@example.com', role: 'OCCUPANT', service: 'Occupant Titulaire (LOC-004)', statut: 'ACTIF', date_creation: '2026-02-01', telephone: '77 450 12 34', adresse: 'Campus Social VCN' },
  { id: 'USR-003', prenom: 'Ibrahima', nom: 'Sow', nom_complet: 'Ibrahima Sow', email: 'ibrahima.sow@crous-t.sn', role: 'BUREAU_COURRIER', service: 'Bureau du Courrier', statut: 'ACTIF', date_creation: '2025-09-01', telephone: '77 111 22 33', adresse: 'CROUS-T Direction' },
  { id: 'USR-004', prenom: 'Moussa', nom: 'Diagne', nom_complet: 'Moussa Diagne', email: 'moussa.diagne@crous-t.sn', role: 'AGENT_DCUVE', service: 'DCUVE', statut: 'ACTIF', date_creation: '2025-09-01', telephone: '77 222 33 44', adresse: 'CROUS-T DCUVE' },
  { id: 'USR-005', prenom: 'Fatou', nom: 'Mbaye', nom_complet: 'Fatou Mbaye', email: 'fatou.mbaye@crous-t.sn', role: 'DIRECTEUR_DCUVE', service: 'DCUVE', statut: 'ACTIF', date_creation: '2025-09-01', telephone: '77 333 44 55', adresse: 'CROUS-T DCUVE', est_membre_commission: true },
  { id: 'USR-006', prenom: 'Abdou', nom: 'Diallo', nom_complet: 'Abdou Diallo', email: 'abdou.diallo@crous-t.sn', role: 'DIRECTEUR_CROUS_T', service: 'Direction Générale', statut: 'ACTIF', date_creation: '2025-09-01', telephone: '77 444 55 66', adresse: 'CROUS-T Direction' },
  { id: 'USR-007', prenom: 'Mame Diarra', nom: 'Fall', nom_complet: 'Mame Diarra Fall', email: 'mdiarra.fall@crous-t.sn', role: 'SERVICE_JURIDIQUE', service: 'Service Juridique', statut: 'ACTIF', date_creation: '2025-10-01', telephone: '77 555 66 77', adresse: 'CROUS-T Juridique', est_membre_commission: true },
  { id: 'USR-008', prenom: 'Oumar', nom: 'Thiam', nom_complet: 'Oumar Thiam', email: 'oumar.thiam@crous-t.sn', role: 'SERVICE_COMPTABLE', service: 'Service Comptable', statut: 'ACTIF', date_creation: '2025-10-01', telephone: '77 666 77 88', adresse: 'CROUS-T Finances' },
  { id: 'USR-009', prenom: 'Seydou', nom: 'Ba', nom_complet: 'Seydou Ba', email: 'seydou.ba@crous-t.sn', role: 'SERVICE_TECHNIQUE', service: 'Service Technique', statut: 'ACTIF', date_creation: '2025-10-01', telephone: '77 777 88 99', adresse: 'CROUS-T Maintenance', est_membre_commission: true },
  { id: 'USR-010', prenom: 'Lamine', nom: 'Kouyaté', nom_complet: 'Lamine Kouyaté', email: 'lamine.kouyate@crous-t.sn', role: 'AGENT_TERRAIN', service: 'Brigade Terrain', statut: 'ACTIF', date_creation: '2025-11-01', telephone: '77 888 99 00', adresse: 'VCN Terrain' },
  { id: 'USR-011', prenom: 'Ndéye', nom: 'Sarr', nom_complet: 'Ndéye Sarr', email: 'ndeye.sarr@crous-t.sn', role: 'AGENT_QHSE', service: 'Bureau Environnement & QHSE', statut: 'ACTIF', date_creation: '2025-11-01', telephone: '77 999 00 11', adresse: 'CROUS-T QHSE' },
  { id: 'USR-012', prenom: 'Rokhaya', nom: 'Diop', nom_complet: 'Rokhaya Diop', email: 'rokhaya.diop@crous-t.sn', role: 'CELLULE_COMMUNICATION', service: 'Cellule Communication', statut: 'ACTIF', date_creation: '2025-12-01', telephone: '77 000 11 22', adresse: 'CROUS-T Com' },
  { id: 'USR-013', prenom: 'Admin', nom: 'SyLOC-T', nom_complet: 'Admin SyLOC-T', email: 'admin@crous-t.sn', role: 'ADMINISTRATEUR_SI', service: 'Direction SI', statut: 'ACTIF', date_creation: '2025-09-01', telephone: '77 123 99 88', adresse: 'CROUS-T SI' },
];

export const journalMock = [
  { id: 'LOG-001', action: 'CONNEXION', cible: 'Abdou Diallo', horodatage: '2026-08-10T08:12:00Z', details: 'Connexion réussie depuis 192.168.1.45', auteur: 'Abdou Diallo' },
  { id: 'LOG-002', action: 'COMMISSION_COMMUTE', cible: 'Seydou Ba', horodatage: '2026-08-10T08:30:00Z', details: 'Le membre du Service Technique Seydou Ba est ajouté à la Commission d\'évaluation.', auteur: 'Abdou Diallo (Directeur)' },
  { id: 'LOG-003', action: 'CONVOCATION_EMISE', cible: 'LOC-004', horodatage: '2026-08-09T16:45:00Z', details: 'Signalement transmis par Agent Terrain au Bureau Environnement pour suivi.', auteur: 'Lamine Kouyaté' },
];
