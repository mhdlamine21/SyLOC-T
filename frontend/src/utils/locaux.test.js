import { describe, it, expect } from 'vitest';
import {
  categorieOccupation,
  estCandidatable,
  phraseDisponibilite,
  formatSurface,
  libelleType,
  libelleEtat,
  libelleGestionnaire,
  correspondRecherche,
} from './locaux';

describe('locaux utils', () => {
  it('identifie correctement la categorie occupation (DISPONIBLE ou OCCUPE uniquement)', () => {
    expect(categorieOccupation({ est_libre: true })).toBe('DISPONIBLE');
    expect(categorieOccupation({ est_libre: false })).toBe('OCCUPE');
    expect(categorieOccupation({ est_libre: true, etat_physique: 'EN_TRAVAUX' })).toBe('DISPONIBLE');
    expect(categorieOccupation({ est_libre: true, etat_physique: 'DEGRADE' })).toBe('DISPONIBLE');
  });

  it('determine si un local est candidatable', () => {
    expect(estCandidatable({ est_libre: true })).toBe(true);
    expect(estCandidatable({ est_libre: false })).toBe(false);
  });

  it('fournit la phrase de disponibilite adequate', () => {
    expect(phraseDisponibilite({ est_libre: true })).toBe('Disponible à la candidature');
    expect(phraseDisponibilite({ est_libre: false })).toBe('Actuellement occupé');
  });

  it('formate correctement les surfaces', () => {
    expect(formatSurface(19.2)).toBe('19,2 m²');
    expect(formatSurface(null)).toBe('- m²');
  });

  it('filtre par terme de recherche', () => {
    const local = { reference: 'LOC-001', localisation: 'Campus Nord', type_local: 'RESTAURATION' };
    expect(correspondRecherche(local, '001')).toBe(true);
    expect(correspondRecherche(local, 'nord')).toBe(true);
    expect(correspondRecherche(local, 'sud')).toBe(false);
  });

  it('retourne la photo du local ou l image par defaut du campus', async () => {
    const { photoLocal } = await import('./locaux');
    expect(photoLocal({ photo_url: 'https://example.com/photo.jpg' })).toBe('https://example.com/photo.jpg');
    expect(photoLocal({ type_local: 'RESTAURATION' })).toBeTruthy();
    expect(photoLocal({ est_libre: true })).toBeTruthy();
    expect(photoLocal({ est_libre: false })).toBeTruthy();
  });

  it('calcule et formate le loyer de reference selon le bareme', async () => {
    const { formatLoyerMensuel, loyerMensuelEstime } = await import('./locaux');
    expect(loyerMensuelEstime({ type_local: 'RESTAURATION' })).toBe(75000);
    expect(loyerMensuelEstime({ type_local: 'MULTISERVICES' })).toBe(25000);
    expect(loyerMensuelEstime({ loyer_mensuel: 45000 })).toBe(45000);
    expect(formatLoyerMensuel({ type_local: 'RESTAURATION' })).toContain('75');
    expect(formatLoyerMensuel({ loyer_mensuel: 0 })).toBe('Gratuit (Subvention Étudiante)');
  });
});

