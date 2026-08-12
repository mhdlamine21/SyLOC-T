/**
 * Navigation du back-office SyLOC-T.
 *
 * getNavigationItems() renvoie une liste de GROUPES :
 *   [{ group: 'ESPACE CANDIDAT', items: [{ label, path, icon }] }, ...]
 * Le groupe technique '_' n'affiche pas de titre (entrees communes).
 *
 * Regle : tout lien affiche ici DOIT etre autorise par routes.jsx pour le
 * meme role (sinon l'utilisateur est renvoye vers /dashboard).
 */

const SUPER = ['ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T'];

export function getNavigationItems(user, role) {
  const isCommissionMember =
    user?.est_membre_commission ||
    role === 'DIRECTEUR_DCUVE' ||
    role === 'SERVICE_JURIDIQUE' ||
    role === 'SERVICE_TECHNIQUE' ||
    SUPER.includes(role);

  const GROUPS = [
    {
      group: '_',
      items: [
        { label: 'Tableau de bord', path: '/dashboard', icon: '🏠', roles: null },
        { label: 'Catalogue des locaux', path: '/locaux-catalogue', icon: '🗺️', roles: null },
        { label: 'Mon profil', path: '/profile', icon: '👤', roles: null },
      ],
    },
    {
      group: 'Espace candidat',
      items: [
        { label: 'Deposer un dossier', path: '/depot', icon: '📝', roles: ['USAGER'] },
        { label: 'Suivi de candidature', path: '/suivi', icon: '🔍', roles: ['USAGER'] },
        { label: 'Avis cantines', path: '/avis', icon: '⭐', roles: ['USAGER', 'OCCUPANT'] },
        { label: 'Mon score de fidelite', path: '/fidelite', icon: '🏅', roles: ['USAGER', 'OCCUPANT'] },
      ],
    },
    {
      group: 'Espace occupant',
      items: [
        { label: 'Mon contrat & echeancier', path: '/espace-occupant', icon: '🏢', roles: ['OCCUPANT'] },
        { label: 'Payer ma redevance', path: '/paiement', icon: '💳', roles: ['OCCUPANT'] },
        { label: 'Signaler un probleme', path: '/signaler', icon: '🔧', roles: ['OCCUPANT'] },
      ],
    },
    {
      group: 'Bureau du courrier',
      items: [
        { label: "Courrier d'arrivee", path: '/courrier', icon: '📬', roles: ['BUREAU_COURRIER', ...SUPER] },
      ],
    },
    {
      group: 'Instruction DCUVE',
      items: [
        { label: 'Dossiers a instruire', path: '/instruction', icon: '📂', roles: ['AGENT_DCUVE', 'DIRECTEUR_DCUVE', ...SUPER] },
        { label: 'Validation cartes etudiantes', path: '/validation-cartes', icon: '🪪', roles: ['AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'BUREAU_COURRIER', ...SUPER] },
      ],
    },
    {
      group: 'Commission consultative',
      items: [
        { label: "Commission d'evaluation", path: '/commission', icon: '⚖️', roles: isCommissionMember ? null : [] },
      ],
    },
    {
      group: 'Service juridique',
      items: [
        { label: 'Redaction des contrats', path: '/juridique', icon: '📜', roles: ['SERVICE_JURIDIQUE', ...SUPER] },
      ],
    },
    {
      group: 'Service technique',
      items: [
        { label: 'Expertise & pannes', path: '/service-technique', icon: '📐', roles: ['SERVICE_TECHNIQUE', ...SUPER] },
      ],
    },
    {
      group: 'Patrimoine',
      items: [
        { label: 'Referentiel des locaux', path: '/patrimoine/locaux', icon: '🏗️', roles: ['SERVICE_TECHNIQUE', 'DIRECTEUR_DCUVE', 'AGENT_DCUVE', ...SUPER] },
      ],
    },
    {
      group: 'Guichet comptabilite',
      items: [
        { label: 'Caisse & encaissements', path: '/caisse', icon: '💰', roles: ['SERVICE_COMPTABLE', ...SUPER] },
        { label: 'Quitus & echeances', path: '/paiement', icon: '🧾', roles: ['SERVICE_COMPTABLE', ...SUPER] },
        { label: 'Contrats & occupants', path: '/espace-occupant', icon: '🏢', roles: ['SERVICE_COMPTABLE', ...SUPER] },
      ],
    },
    {
      group: 'Brigade terrain',
      items: [
        { label: 'Constats terrain', path: '/terrain/agent', icon: '🚨', roles: ['AGENT_TERRAIN', ...SUPER] },
        { label: 'Nouveau signalement', path: '/terrain/signalements', icon: '🔧', roles: ['AGENT_TERRAIN', ...SUPER] },
        { label: 'Denoncer une occupation', path: '/denoncer', icon: '🏴', roles: ['AGENT_TERRAIN', 'AGENT_QHSE', 'SERVICE_TECHNIQUE', ...SUPER] },
      ],
    },
    {
      group: 'Bureau environnement (QHSE)',
      items: [
        { label: 'Sanctions & constats', path: '/bureau-environnement', icon: '🔬', roles: ['AGENT_QHSE', ...SUPER] },
        { label: 'Inspections QHSE', path: '/terrain/inspections', icon: '📋', roles: ['AGENT_QHSE', ...SUPER] },
      ],
    },
    {
      group: 'Communication',
      items: [
        { label: 'Annonces & appels', path: '/communication', icon: '📢', roles: ['CELLULE_COMMUNICATION', 'AMICALE', ...SUPER] },
        { label: 'Moderation des avis', path: '/moderation-avis', icon: '🛡️', roles: ['CELLULE_COMMUNICATION', ...SUPER] },
      ],
    },
    {
      group: 'Pilotage & direction',
      items: [
        { label: 'Tableau de bord direction', path: '/dashboard-direction', icon: '📊', roles: SUPER },
        { label: 'Rapports par periode', path: '/rapports', icon: '📈', roles: SUPER },
      ],
    },
    {
      group: 'Administration SI',
      items: [
        { label: 'Gestion des utilisateurs', path: '/admin/comptes', icon: '👥', roles: SUPER },
        { label: "Journal d'audit", path: '/admin/audit', icon: '📋', roles: SUPER },
      ],
    },
  ];

  return GROUPS.map((g) => ({
    group: g.group === '_' ? '_' : g.group.toUpperCase(),
    items: g.items.filter((i) => i.roles === null || i.roles.includes(role)),
  })).filter((g) => g.items.length > 0);
}

/** Liste a plat (utilisee par le header pour retrouver le titre de la page). */
export function getFlatNavigation(user, role) {
  return getNavigationItems(user, role).flatMap((g) => g.items);
}
