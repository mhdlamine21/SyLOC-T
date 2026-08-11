export function getNavigationItems(user, role) {
  const isCommissionMember =
    user?.est_membre_commission ||
    role === 'DIRECTEUR_DCUVE' ||
    role === 'ADMINISTRATEUR_SI';

  const NAV = [
    { label: 'Tableau de bord', path: '/dashboard', icon: '🏠', roles: null },
    { label: 'Mon profil', path: '/profile', icon: '👤', roles: null },

    { group: 'Espace Candidat', roles: ['USAGER'] },
    { label: 'Catalogue Locaux', path: '/locaux-catalogue', icon: '🗺️', roles: ['USAGER'] },
    { label: 'Déposer dossier', path: '/depot', icon: '📝', roles: ['USAGER'] },
    { label: 'Suivi candidatures', path: '/suivi', icon: '🔍', roles: ['USAGER'] },
    { label: 'Avis cantines', path: '/avis', icon: '⭐', roles: ['USAGER'] },

    { group: 'Espace Occupant', roles: ['OCCUPANT'] },
    { label: 'Mon Contrat & Échéancier', path: '/espace-occupant', icon: '🏢', roles: ['OCCUPANT'] },
    { label: 'Payer redevance', path: '/paiement', icon: '💳', roles: ['OCCUPANT'] },
    { label: 'Signaler problème', path: '/signaler', icon: '🔧', roles: ['OCCUPANT'] },

    { group: 'Service Juridique', roles: ['SERVICE_JURIDIQUE'] },
    { label: 'Rédaction Contrats', path: '/juridique', icon: '📜', roles: ['SERVICE_JURIDIQUE'] },

    { group: 'Service Technique', roles: ['SERVICE_TECHNIQUE'] },
    { label: 'Expertise & Pannes', path: '/service-technique', icon: '📐', roles: ['SERVICE_TECHNIQUE'] },
    { label: 'Référentiel des locaux', path: '/patrimoine/locaux', icon: '🏗️', roles: ['SERVICE_TECHNIQUE'] },

    ...(isCommissionMember ? [
      { group: 'Commission Consultative', roles: null },
      { label: "Commission d'évaluation", path: '/commission', icon: '⚖', roles: null },
    ] : []),

    { group: 'Instruction DCUVE', roles: ['AGENT_DCUVE', 'DIRECTEUR_DCUVE'] },
    { label: 'Dossiers à instruire', path: '/instruction', icon: '📂', roles: ['AGENT_DCUVE', 'DIRECTEUR_DCUVE'] },
    { label: 'Validation cartes', path: '/validation-cartes', icon: '🪪', roles: ['AGENT_DCUVE'] },
    { label: 'Référentiel des locaux', path: '/patrimoine/locaux', icon: '🏗️', roles: ['DIRECTEUR_DCUVE'] },

    { group: 'Guichet Comptabilité', roles: ['SERVICE_COMPTABLE'] },
    { label: 'Caisse & Quitus', path: '/paiement', icon: '💰', roles: ['SERVICE_COMPTABLE'] },

    { group: 'Brigade Terrain', roles: ['AGENT_TERRAIN'] },
    { label: 'Constats Terrain', path: '/terrain/agent', icon: '🚨', roles: ['AGENT_TERRAIN'] },
    { label: 'Dénoncer occupation', path: '/denoncer', icon: '🏴', roles: ['AGENT_TERRAIN'] },

    { group: 'Bureau Environnement', roles: ['AGENT_QHSE'] },
    { label: 'Traiter Constats', path: '/bureau-environnement', icon: '🔬', roles: ['AGENT_QHSE'] },
    { label: 'Inspections QHSE', path: '/terrain/inspections', icon: '📜', roles: ['AGENT_QHSE'] },

    { group: 'Communication', roles: ['CELLULE_COMMUNICATION'] },
    { label: "Annonces & Appels", path: '/communication', icon: '📢', roles: ['CELLULE_COMMUNICATION'] },

    { group: 'Pilotage & Direction', roles: ['DIRECTEUR_CROUS_T'] },
    { label: 'Tableau de bord direction', path: '/dashboard-direction', icon: '📊', roles: ['DIRECTEUR_CROUS_T'] },
    { label: 'Rapports par période', path: '/rapports', icon: '📈', roles: ['DIRECTEUR_CROUS_T'] },

    { group: 'Supervision Admin SI', roles: ['ADMINISTRATEUR_SI'] },
    { label: 'Gestion Utilisateurs', path: '/admin/comptes', icon: '👥', roles: ['ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T'] },
    { label: "Journal d'audit", path: '/admin/audit', icon: '📋', roles: ['ADMINISTRATEUR_SI'] },
    { label: 'Tableau de bord direction', path: '/dashboard-direction', icon: '📊', roles: ['ADMINISTRATEUR_SI'] },
  ];

  return NAV.filter((item) => !item.roles || item.roles.includes(role));
}
