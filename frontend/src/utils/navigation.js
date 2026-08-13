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

const ADMIN = ['ADMINISTRATEUR_SI'];
const SUPER = ['ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T'];

export function getNavigationItems(user, role) {
  const isCommissionMember =
    user?.est_membre_commission ||
    role === 'AMICALE' ||
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
      ],
    },
    {
      group: 'Espace candidat',
      items: [
        { label: 'Deposer un dossier', path: '/depot', icon: '📝', roles: ['USAGER', 'AMICALE'] },
        { label: 'Suivi de candidature', path: '/suivi', icon: '🔍', roles: ['USAGER', 'AMICALE'] },
        { label: 'Avis cantines', path: '/avis', icon: '⭐', roles: ['USAGER', 'AMICALE', 'OCCUPANT'] },
      ],
    },
    {
      group: 'Espace occupant',
      items: [
        { label: 'Mon contrat & echeancier', path: '/espace-occupant', icon: 'ðŸ ¢', roles: ['OCCUPANT'] },
        { label: 'Payer ma redevance', path: '/paiement', icon: 'ðŸ’³', roles: ['OCCUPANT'] },
        { label: 'Signaler un probleme', path: '/signaler', icon: 'ðŸ”§', roles: ['OCCUPANT'] },
        { label: 'Mon score de fidelite', path: '/fidelite', icon: 'ðŸ…', roles: ['OCCUPANT'] },
      ],
    },
    {
      group: 'Bureau du courrier',
      items: [
        { label: "Courrier d'arrivee", path: '/courrier', icon: 'ðŸ“¬', roles: ['BUREAU_COURRIER', ...ADMIN] },
      ],
    },
    {
      group: 'Instruction DCUVE',
      items: [
        { label: 'Dossiers a instruire', path: '/instruction', icon: 'ðŸ“‚', roles: ['AGENT_DCUVE', 'DIRECTEUR_DCUVE', ...ADMIN] },
        { label: 'Validation cartes etudiantes', path: '/validation-cartes', icon: 'ðŸªª', roles: ['AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'BUREAU_COURRIER', ...ADMIN] },
      ],
    },
    {
      group: 'Commission consultative',
      items: [
        { label: "Commission d'evaluation", path: '/commission', icon: 'âš–ï¸', roles: isCommissionMember ? null : [] },
      ],
    },
    {
      group: 'Service juridique',
      items: [
        { label: 'Redaction des contrats', path: '/juridique', icon: 'ðŸ“œ', roles: ['SERVICE_JURIDIQUE', ...ADMIN] },
      ],
    },
    {
      group: 'Service technique',
      items: [
        { label: 'Expertise & pannes', path: '/service-technique', icon: 'ðŸ“', roles: ['SERVICE_TECHNIQUE', ...ADMIN] },
      ],
    },
    {
      group: 'Patrimoine',
      items: [
        { label: 'Referentiel des locaux', path: '/patrimoine/locaux', icon: 'ðŸ-ï¸', roles: ['SERVICE_TECHNIQUE', 'DIRECTEUR_DCUVE', 'AGENT_DCUVE', ...SUPER] },
      ],
    },
    {
      group: 'Guichet comptabilite',
      items: [
        { label: 'Caisse & encaissements', path: '/caisse', icon: 'ðŸ’°', roles: ['SERVICE_COMPTABLE', ...ADMIN] },
        { label: 'Quitus & echeances', path: '/paiement', icon: 'ðŸ§¾', roles: ['SERVICE_COMPTABLE', ...ADMIN] },
        { label: 'Contrats & occupants', path: '/espace-occupant', icon: 'ðŸ¢', roles: ['SERVICE_COMPTABLE', ...ADMIN] },
      ],
    },
    {
      group: 'Brigade terrain',
      items: [
        { label: 'Constats terrain', path: '/terrain/agent', icon: 'ðŸš¨', roles: ['AGENT_TERRAIN', ...ADMIN] },
        { label: 'Nouveau signalement', path: '/terrain/signalements', icon: 'ðŸ”§', roles: ['AGENT_TERRAIN', ...ADMIN] },
        { label: 'Denoncer une occupation', path: '/denoncer', icon: 'ðŸ´', roles: ['AGENT_TERRAIN', 'AGENT_QHSE', 'SERVICE_TECHNIQUE', ...ADMIN] },
      ],
    },
    {
      group: 'Bureau environnement (QHSE)',
      items: [
        { label: 'Sanctions & constats', path: '/bureau-environnement', icon: 'ðŸ”¬', roles: ['AGENT_QHSE', ...ADMIN] },
        { label: 'Inspections QHSE', path: '/terrain/inspections', icon: 'ðŸ“‹', roles: ['AGENT_QHSE', ...ADMIN] },
      ],
    },
    {
      group: 'Communication',
      items: [
        { label: 'Annonces & appels', path: '/communication', icon: 'ðŸ“¢', roles: ['CELLULE_COMMUNICATION', 'AMICALE', ...ADMIN] },
        { label: 'Moderation des avis', path: '/moderation-avis', icon: 'ðŸ›¡ï¸', roles: ['CELLULE_COMMUNICATION', ...ADMIN] },
      ],
    },
    {
      group: 'Pilotage & direction',
      items: [
        { label: 'Tableau de bord direction', path: '/dashboard-direction', icon: 'ðŸ“Š', roles: SUPER },
        { label: 'Rapports par periode', path: '/rapports', icon: 'ðŸ“ˆ', roles: SUPER },
      ],
    },
    {
      group: 'Administration SI',
      items: [
        { label: 'Gestion des utilisateurs', path: '/admin/comptes', icon: 'ðŸ‘¥', roles: SUPER },
        { label: "Journal d'audit", path: '/admin/audit', icon: 'ðŸ“‹', roles: SUPER },
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

