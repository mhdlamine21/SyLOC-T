import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SupervisionSysteme from './SupervisionSysteme';

const mockSupervisionData = {
  status: 'OPERATIONNEL',
  systeme: {
    version: '1.3.0-prod',
    debug: false,
    timezone: 'Africa/Dakar',
    db_engine: 'sqlite3',
    db_latency_ms: 12.4,
    timestamp: '2026-08-17T01:30:00Z',
  },
  services: [
    { id: 'api', nom: 'API REST Core (Django)', statut: 'OK', latence_ms: 12.4, description: 'Endpoints opérationnels' },
    { id: 'db', nom: 'Base de Données Principale', statut: 'OK', tables_actives: 18, description: 'Connectivité et intégrité vérifiées' },
    { id: 'storage', nom: 'Stockage Médias & Fichiers', statut: 'OK', fichiers_total: 42, description: 'Dossier media accessible en écriture' },
    { id: 'audit', nom: 'Module de Traçabilité & Audit', statut: 'OK', evenements_24h: 15, description: 'Journalisation des accès active' },
  ],
  volumetrie: {
    comptes: 38,
    locaux: 24,
    demandes: 120,
    contrats: 18,
    paiements: 45,
    audit: 350,
    audit_24h: 15,
    parametres: 8,
    missions: 12,
    interventions: 6,
  },
  anomalies: [
    {
      niveau: 'ATTENTION',
      titre: 'Arriérés critiques détectés',
      message: '2 échéance(s) en arriéré critique (> 60 jours) nécessitant un suivi financier.',
    },
  ],
};

vi.mock('../../api/supervision', () => ({
  getSupervisionSysteme: vi.fn(() => Promise.resolve(mockSupervisionData)),
}));

describe('SupervisionSysteme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre et les cartes de santé des services', async () => {
    render(<SupervisionSysteme />);

    expect(await screen.findByText('Supervision & Santé Système')).toBeInTheDocument();
    expect(screen.getByText('API REST Core (Django)')).toBeInTheDocument();
    expect(screen.getByText('Base de Données Principale')).toBeInTheDocument();
    expect(screen.getByText('Stockage Médias & Fichiers')).toBeInTheDocument();
    expect(screen.getByText('Module de Traçabilité & Audit')).toBeInTheDocument();
  });

  it('affiche la volumétrie des données de la plateforme', async () => {
    render(<SupervisionSysteme />);

    expect(await screen.findByText('Volumétrie & Données Système')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument(); // locaux
    expect(screen.getByText('120')).toBeInTheDocument(); // demandes
    expect(screen.getByText('350')).toBeInTheDocument(); // logs audit
  });

  it('affiche les anomalies et alertes système', async () => {
    render(<SupervisionSysteme />);

    expect(await screen.findByText('Arriérés critiques détectés')).toBeInTheDocument();
    expect(screen.getByText(/2 échéance\(s\) en arriéré critique/)).toBeInTheDocument();
  });
});
