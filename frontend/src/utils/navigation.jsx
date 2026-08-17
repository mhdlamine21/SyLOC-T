import ApartmentIcon from '@mui/icons-material/Apartment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BadgeIcon from '@mui/icons-material/Badge';
import BalanceIcon from '@mui/icons-material/Balance';
import BarChartIcon from '@mui/icons-material/BarChart';
import BiotechIcon from '@mui/icons-material/Biotech';
import BuildIcon from '@mui/icons-material/Build';
import CampaignIcon from '@mui/icons-material/Campaign';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ExploreIcon from '@mui/icons-material/Explore';
import FolderIcon from '@mui/icons-material/Folder';
import FoundationIcon from '@mui/icons-material/Foundation';
import GavelIcon from '@mui/icons-material/Gavel';
import GroupIcon from '@mui/icons-material/Group';
import MapIcon from '@mui/icons-material/Map';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MemoryIcon from '@mui/icons-material/Memory';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import NatureIcon from '@mui/icons-material/Nature';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import RunCircleIcon from '@mui/icons-material/RunCircle';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/SecurityOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

/**
 * Navigation du back-office SyLOC-T.
 *
 * Règle : tout lien affiché ici DOIT être autorisé par routes.jsx pour le
 * même rôle (sinon l'utilisateur est renvoyé vers /dashboard).
 *
 * Chaque acteur métier a exactement un espace de travail dédié :
 *   AGENT_TERRAIN     → /terrain/agent
 *   AGENT_QHSE        → /agent-qhse
 *   SERVICE_TECHNIQUE → /service-technique
 *   SERVICE_COMPTABLE → /caisse, /quitus, /espace-occupant
 *   SERVICE_JURIDIQUE → /juridique
 *   DIRECTEUR_CROUS_T → section SUPERVISION complète
 *   ADMINISTRATEUR_SI → section ADMINISTRATION & supervision transversale
 */

const ADMIN_SI = ['ADMINISTRATEUR_SI'];

export const SECTIONS = ['ACTIVITÉ', 'GESTION', 'OPERATIONS', 'SUPERVISION', 'ADMINISTRATION'];

export function getNavigationItems(user, role) {
  const isCommissionMember = Boolean(user?.est_membre_commission);
  const isBureauSupervisor = user?.username === 'qhse';
  const isAgentTerrain = user?.username === 'agent_qhse' || (!isBureauSupervisor && role === 'AGENT_QHSE');

  // Rôles qui ont besoin du catalogue & carte publique des locaux
  const ROLES_CATALOGUE = [
    'USAGER',
    'OCCUPANT',
    'AGENT_DCUVE',
    'DIRECTEUR_DCUVE',
    'DIRECTEUR_CROUS_T',
    'AGENT_TERRAIN',
    'AGENT_QHSE',
    'BUREAU_COURRIER',
    'SERVICE_JURIDIQUE',
    'SERVICE_COMPTABLE',
    'SERVICE_TECHNIQUE',
    'ADMINISTRATEUR_SI',
    'CELLULE_COMMUNICATION',
    'AMICALE',
  ];

  const ITEMS = [
    // ── ACTIVITÉ ────────────────────────────────────────────────────────────
    { section: 'ACTIVITÉ', groupe: 'Général', label: 'Tableau de bord', path: '/dashboard', icon: <DashboardIcon fontSize="small" />, roles: null },
    { section: 'ACTIVITÉ', groupe: 'Général', label: 'Catalogue des locaux', path: '/locaux-catalogue', icon: <ApartmentIcon fontSize="small" />, roles: ROLES_CATALOGUE },
    { section: 'ACTIVITÉ', groupe: 'Général', label: 'Carte GPS des locaux', path: '/carte', icon: <MapIcon fontSize="small" />, roles: ROLES_CATALOGUE },

    // Espace candidat / usager
    { section: 'ACTIVITÉ', groupe: 'Espace candidat', label: 'Appels à candidature', path: '/appels', icon: <CampaignIcon fontSize="small" />, roles: ['CELLULE_COMMUNICATION', 'AMICALE'] },
    { section: 'ACTIVITÉ', groupe: 'Espace candidat', label: 'Déposer un dossier', path: '/depot', icon: <NoteAddIcon fontSize="small" />, roles: ['USAGER'] },
    { section: 'ACTIVITÉ', groupe: 'Espace candidat', label: 'Suivi de candidature', path: '/suivi', icon: <SearchIcon fontSize="small" />, roles: ['USAGER'] },
    { section: 'ACTIVITÉ', groupe: 'Espace candidat', label: 'Avis cantines', path: '/avis', icon: <StarIcon fontSize="small" />, roles: ['USAGER'] },

    // Espace occupant
    { section: 'ACTIVITÉ', groupe: 'Espace occupant', label: 'Mon score de fidélité', path: '/fidelite', icon: <WorkspacePremiumIcon fontSize="small" />, roles: ['OCCUPANT'] },
    { section: 'ACTIVITÉ', groupe: 'Espace occupant', label: 'Mon contrat & échéancier', path: '/espace-occupant', icon: <ApartmentIcon fontSize="small" />, roles: ['OCCUPANT'] },
    { section: 'ACTIVITÉ', groupe: 'Espace occupant', label: 'Payer ma redevance', path: '/paiement', icon: <PaymentIcon fontSize="small" />, roles: ['OCCUPANT'] },
    { section: 'ACTIVITÉ', groupe: 'Espace occupant', label: 'Signaler un problème', path: '/signaler', icon: <BuildIcon fontSize="small" />, roles: ['OCCUPANT'] },

    // ── GESTION ─────────────────────────────────────────────────────────────

    // Bureau du courrier
    { section: 'GESTION', groupe: 'Bureau du courrier', label: "Courrier d'arrivée", path: '/courrier', icon: <MarkEmailReadIcon fontSize="small" />, roles: ['BUREAU_COURRIER'] },

    // Instruction DCUVE
    { section: 'GESTION', groupe: 'Instruction DCUVE', label: 'Dossiers à instruire', path: '/instruction', icon: <FolderIcon fontSize="small" />, roles: ['AGENT_DCUVE', 'DIRECTEUR_DCUVE'] },
    { section: 'GESTION', groupe: 'Instruction DCUVE', label: 'Archives dossiers', path: '/courrier/archives', icon: <FolderIcon fontSize="small" />, roles: ['BUREAU_COURRIER', 'AGENT_DCUVE', 'DIRECTEUR_DCUVE'] },
    { section: 'GESTION', groupe: 'Instruction DCUVE', label: 'Validation cartes étudiantes', path: '/validation-cartes', icon: <BadgeIcon fontSize="small" />, roles: ['AGENT_DCUVE', 'BUREAU_COURRIER'] },
    { section: 'GESTION', groupe: 'Patrimoine', label: 'Référentiel des locaux', path: '/patrimoine/locaux', icon: <FoundationIcon fontSize="small" />, roles: ['DIRECTEUR_DCUVE', 'AGENT_DCUVE', 'ADMINISTRATEUR_SI'] },

    // Service juridique
    { section: 'GESTION', groupe: 'Service juridique', label: 'Rédaction des contrats', path: '/juridique', icon: <GavelIcon fontSize="small" />, roles: ['SERVICE_JURIDIQUE'] },

    // Service technique
    { section: 'GESTION', groupe: 'Service technique', label: 'Signalements & interventions', path: '/service-technique', icon: <BuildIcon fontSize="small" />, roles: ['SERVICE_TECHNIQUE'] },
    { section: 'GESTION', groupe: 'Service technique', label: 'Rapports Agent de Terrain', path: '/technique/rapports-terrain', icon: <AssignmentIcon fontSize="small" />, roles: ['SERVICE_TECHNIQUE'] },

    // Guichet comptable
    { section: 'GESTION', groupe: 'Guichet comptable', label: 'Caisse & encaissements', path: '/caisse', icon: <AttachMoneyIcon fontSize="small" />, roles: ['SERVICE_COMPTABLE'] },
    { section: 'GESTION', groupe: 'Guichet comptable', label: 'Gestion des quitus', path: '/quitus', icon: <ReceiptIcon fontSize="small" />, roles: ['SERVICE_COMPTABLE'] },
    { section: 'GESTION', groupe: 'Guichet comptable', label: 'Contrats & occupants', path: '/espace-occupant', icon: <ApartmentIcon fontSize="small" />, roles: ['SERVICE_COMPTABLE'] },

    // Communication
    { section: 'GESTION', groupe: 'Communication', label: 'Annonces & appels', path: '/communication', icon: <CampaignIcon fontSize="small" />, roles: ['CELLULE_COMMUNICATION', 'AMICALE'] },
    { section: 'GESTION', groupe: 'Communication', label: 'Modération des avis', path: '/moderation-avis', icon: <SecurityIcon fontSize="small" />, roles: ['CELLULE_COMMUNICATION'] },

    // ── OPERATIONS ───────────────────────────────────────────────────────────

    // Agent terrain - espace de travail dédié + actions spécifiques
    { section: 'OPERATIONS', groupe: 'Brigade terrain', label: 'Mon espace terrain', path: '/terrain/agent', icon: <ExploreIcon fontSize="small" />, roles: ['AGENT_TERRAIN'] },
    { section: 'OPERATIONS', groupe: 'Brigade terrain', label: 'Ordres de mission', path: '/terrain/ordres-mission', icon: <RunCircleIcon fontSize="small" />, roles: ['AGENT_TERRAIN'] },
    { section: 'OPERATIONS', groupe: 'Brigade terrain', label: 'Dénoncer une occupation', path: '/denoncer', icon: <ReportProblemIcon fontSize="small" />, roles: ['AGENT_TERRAIN'] },
    { section: 'OPERATIONS', groupe: 'Brigade terrain', label: 'Visites & rapports', path: '/terrain/rapports-visite', icon: <AssignmentIcon fontSize="small" />, roles: ['AGENT_TERRAIN'] },

    // Agent QHSE (Terrain) vs Bureau Environnement (Supervision)
    {
      section: 'OPERATIONS',
      groupe: 'Contrôles QHSE',
      label: 'Espace Terrain QHSE',
      path: '/agent-qhse',
      icon: <BiotechIcon fontSize="small" />,
      roles: isAgentTerrain ? ['AGENT_QHSE'] : [],
    },
    {
      section: 'OPERATIONS',
      groupe: 'Environnement & Salubrité',
      label: 'Bureau Environnement',
      path: '/bureau-environnement',
      icon: <NatureIcon fontSize="small" />,
      roles: isBureauSupervisor ? ['AGENT_QHSE'] : ['DIRECTEUR_DCUVE', 'AGENT_DCUVE', 'DIRECTEUR_CROUS_T', 'ADMINISTRATEUR_SI'],
    },

    // ── SUPERVISION ─────────────────────────────────────────────────────────
    { section: 'SUPERVISION', groupe: "Commission d'évaluation", label: "Séance & Arbitrage des lots", path: '/commission', icon: <BalanceIcon fontSize="small" />, roles: isCommissionMember ? null : [] },
    { section: 'SUPERVISION', groupe: "Commission d'évaluation", label: 'Mes tâches & votes individuels', path: '/commission/mes-taches', icon: <AssignmentIcon fontSize="small" />, roles: isCommissionMember ? null : [] },
    { section: 'SUPERVISION', groupe: "Commission d'évaluation", label: 'Gestion & Membres', path: '/commission/gestion', icon: <GroupIcon fontSize="small" />, roles: ['DIRECTEUR_CROUS_T'] },
    { section: 'SUPERVISION', groupe: "Commission d'évaluation", label: 'Rapport de la commission', path: '/commission/rapport', icon: <BarChartIcon fontSize="small" />, roles: ['DIRECTEUR_CROUS_T'] },
    { section: 'SUPERVISION', groupe: 'Pilotage & direction', label: 'Tableau de bord direction', path: '/dashboard-direction', icon: <BarChartIcon fontSize="small" />, roles: ['DIRECTEUR_CROUS_T'] },
    { section: 'SUPERVISION', groupe: 'Pilotage & direction', label: 'Validation Finale', path: '/direction/validation', icon: <GavelIcon fontSize="small" />, roles: ['DIRECTEUR_CROUS_T'] },
    { section: 'SUPERVISION', groupe: 'Pilotage & direction', label: 'Quitus & reçus', path: '/direction/quitus', icon: <ReceiptIcon fontSize="small" />, roles: ['DIRECTEUR_CROUS_T'] },
    { section: 'SUPERVISION', groupe: 'Pilotage & direction', label: 'Rapports par période', path: '/rapports', icon: <TrendingUpIcon fontSize="small" />, roles: ['DIRECTEUR_CROUS_T', 'ADMINISTRATEUR_SI'] },
    { section: 'SUPERVISION', groupe: 'Pilotage & direction', label: 'Gestion des Collaborateurs', path: '/direction/collaborateurs', icon: <GroupIcon fontSize="small" />, roles: ['DIRECTEUR_CROUS_T'] },

    // ── ADMINISTRATION ──────────────────────────────────────────────────────
    { section: 'ADMINISTRATION', groupe: 'Administration SI', label: 'Supervision & Santé', path: '/admin/supervision', icon: <MemoryIcon fontSize="small" />, roles: ADMIN_SI },
    { section: 'ADMINISTRATION', groupe: 'Administration SI', label: "Journal d'audit", path: '/admin/audit', icon: <AssignmentIcon fontSize="small" />, roles: ADMIN_SI },
    { section: 'ADMINISTRATION', groupe: 'Administration SI', label: 'Paramètres système', path: '/admin/parametres', icon: <SettingsIcon fontSize="small" />, roles: ADMIN_SI },
  ];

  const autorises = ITEMS.filter((i) => i.roles === null || i.roles.includes(role));

  return SECTIONS.map((section) => ({
    group: section,
    section,
    items: autorises.filter((i) => i.section === section),
  })).filter((s) => s.items.length > 0);
}

/** Liste à plat (header, fil d'ariane, tests). */
export function getFlatNavigation(user, role) {
  return getNavigationItems(user, role).flatMap((g) => g.items);
}

/** Entrée de navigation correspondant à l'URL courante (match le plus long). */
export function getCurrentNavItem(user, role, pathname) {
  const flat = getFlatNavigation(user, role);
  return (
    flat.find((i) => i.path === pathname) ||
    flat
      .filter((i) => i.path !== '/dashboard' && pathname.startsWith(`${i.path}/`))
      .sort((a, b) => b.path.length - a.path.length)[0] ||
    null
  );
}

/**
 * Fil d'ariane : [{ label, path? }].
 * Accueil › SECTION › Groupe › Page
 */
export function getBreadcrumb(user, role, pathname) {
  const item = getCurrentNavItem(user, role, pathname);
  const fil = [{ label: 'Accueil', path: '/dashboard' }];
  if (!item) {
    fil.push({ label: 'Page' });
    return fil;
  }
  fil.push({ label: item.section });
  if (item.groupe && item.groupe !== item.section && item.groupe !== 'Général') {
    fil.push({ label: item.groupe });
  }
  fil.push({ label: item.label, icon: item.icon, current: true });
  return fil;
}
