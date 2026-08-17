import { describe, it, expect } from 'vitest';
import { getNavigationItems, getFlatNavigation } from './navigation';

describe('Visibilité de la commission dans la navigation', () => {
  it('masque entièrement la commission pour un Directeur DCUVE non-membre', () => {
    const user = { id: 1, role: 'DIRECTEUR_DCUVE', est_membre_commission: false };
    const nav = getFlatNavigation(user, 'DIRECTEUR_DCUVE');
    const paths = nav.map((item) => item.path);

    expect(paths).not.toContain('/commission');
    expect(paths).not.toContain('/commission/mes-taches');
    expect(paths).not.toContain('/commission/gestion');
    expect(paths).not.toContain('/commission/rapport');
  });

  it('affiche les espaces de vote pour un Directeur DCUVE membre d\'une commission active', () => {
    const user = { id: 1, role: 'DIRECTEUR_DCUVE', est_membre_commission: true };
    const nav = getFlatNavigation(user, 'DIRECTEUR_DCUVE');
    const paths = nav.map((item) => item.path);

    expect(paths).toContain('/commission');
    expect(paths).toContain('/commission/mes-taches');
    expect(paths).not.toContain('/commission/gestion');
    expect(paths).not.toContain('/commission/rapport');
  });

  it('masque la commission pour tout autre rôle (ex: Service Technique) non-membre', () => {
    const user = { id: 2, role: 'SERVICE_TECHNIQUE', est_membre_commission: false };
    const nav = getFlatNavigation(user, 'SERVICE_TECHNIQUE');
    const paths = nav.map((item) => item.path);

    expect(paths).not.toContain('/commission');
    expect(paths).not.toContain('/commission/mes-taches');
    expect(paths).not.toContain('/commission/gestion');
    expect(paths).not.toContain('/commission/rapport');
  });

  it('affiche les espaces de vote pour un agent quelconque quand il est membre actif', () => {
    const user = { id: 3, role: 'AGENT_DCUVE', est_membre_commission: true };
    const nav = getFlatNavigation(user, 'AGENT_DCUVE');
    const paths = nav.map((item) => item.path);

    expect(paths).toContain('/commission');
    expect(paths).toContain('/commission/mes-taches');
    expect(paths).not.toContain('/commission/gestion');
    expect(paths).not.toContain('/commission/rapport');
  });

  it('affiche les espaces occupant sans le suivi de candidature', () => {
    const user = { id: 5, role: 'OCCUPANT' };
    const nav = getFlatNavigation(user, 'OCCUPANT');
    const paths = nav.map((item) => item.path);

    expect(paths).toContain('/dashboard');
    expect(paths).toContain('/fidelite');
    expect(paths).toContain('/espace-occupant');
    expect(paths).toContain('/paiement');
    expect(paths).toContain('/signaler');
    expect(paths).not.toContain('/suivi');
    expect(paths).not.toContain('/depot');
  });

  it('affiche le catalogue et la carte GPS pour le Service Juridique', () => {
    const user = { id: 6, role: 'SERVICE_JURIDIQUE' };
    const nav = getFlatNavigation(user, 'SERVICE_JURIDIQUE');
    const paths = nav.map((item) => item.path);

    expect(paths).toContain('/locaux-catalogue');
    expect(paths).toContain('/carte');
    expect(paths).toContain('/juridique');
  });

  it('affiche la supervision système et les vues transversales pour l Administrateur SI sans gestion des comptes', () => {
    const user = { id: 7, role: 'ADMINISTRATEUR_SI' };
    const nav = getFlatNavigation(user, 'ADMINISTRATEUR_SI');
    const paths = nav.map((item) => item.path);

    expect(paths).toContain('/admin/supervision');
    expect(paths).toContain('/admin/audit');
    expect(paths).toContain('/admin/parametres');
    expect(paths).toContain('/locaux-catalogue');
    expect(paths).toContain('/carte');
    expect(paths).toContain('/patrimoine/locaux');
    expect(paths).toContain('/rapports');
    expect(paths).not.toContain('/admin/comptes');
  });

  it('affiche le catalogue et la carte GPS pour la Cellule Communication et l Amicale', () => {
    const userCom = { id: 8, role: 'CELLULE_COMMUNICATION' };
    const navCom = getFlatNavigation(userCom, 'CELLULE_COMMUNICATION');
    const pathsCom = navCom.map((item) => item.path);

    expect(pathsCom).toContain('/locaux-catalogue');
    expect(pathsCom).toContain('/carte');
    expect(pathsCom).toContain('/appels');

    const userAmicale = { id: 9, role: 'AMICALE' };
    const navAmicale = getFlatNavigation(userAmicale, 'AMICALE');
    const pathsAmicale = navAmicale.map((item) => item.path);

    expect(pathsAmicale).toContain('/locaux-catalogue');
    expect(pathsAmicale).toContain('/carte');
  });

  it('affiche uniquement l Espace Terrain QHSE pour l Agent QHSE et masque le Bureau Environnement', () => {
    const user = { id: 10, username: 'agent_qhse', role: 'AGENT_QHSE' };
    const nav = getFlatNavigation(user, 'AGENT_QHSE');
    const paths = nav.map((item) => item.path);

    expect(paths).toContain('/agent-qhse');
    expect(paths).not.toContain('/bureau-environnement');
  });

  it('affiche Bureau Environnement pour le superviseur qhse', () => {
    const user = { id: 11, username: 'qhse', role: 'AGENT_QHSE' };
    const nav = getFlatNavigation(user, 'AGENT_QHSE');
    const paths = nav.map((item) => item.path);

    expect(paths).toContain('/bureau-environnement');
    expect(paths).not.toContain('/agent-qhse');
  });
});


