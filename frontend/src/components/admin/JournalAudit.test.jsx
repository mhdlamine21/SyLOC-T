import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JournalAudit from './JournalAudit';

const mockAuditLogs = [
  {
    id: 1,
    date_creation: '2026-08-16T18:18:00Z',
    action: 'INITIALISATION_BASE_GODMODE',
    cible: 'Base SyLOC-T',
    utilisateur_nom: 'Administrateur Central CROUS-T',
    utilisateur_role: 'ADMINISTRATEUR_SI',
    details: 'Injection massive de 25 locaux, 18 demandes, 12 contrats.',
  },
  {
    id: 2,
    date_creation: '2026-08-17T00:30:00Z',
    action: 'CONNEXION',
    cible: 'Session Web',
    utilisateur_nom: 'Pape Alioune Niang',
    utilisateur_role: 'ADMINISTRATEUR_SI',
    details: 'Authentification JWT réussie depuis adresse IP autorisée.',
  },
  {
    id: 3,
    date_creation: '2026-08-17T01:00:00Z',
    action: 'CHANGEMENT_ROLE',
    cible: 'Utilisateur #42',
    utilisateur_nom: 'Directeur CROUS-T',
    utilisateur_role: 'DIRECTEUR_CROUS_T',
    details: 'Attribution du rôle AGENT_DCUVE.',
  },
];

vi.mock('../../api/audit', () => ({
  getJournalAudit: vi.fn(() => Promise.resolve(mockAuditLogs)),
}));

describe('JournalAudit Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre de la page et les statistiques du journal', async () => {
    render(<JournalAudit />);

    expect(await screen.findByText("Journal d'Audit & Traçabilité")).toBeInTheDocument();
    expect(screen.getByText('Total des événements')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les entrées du journal d audit dans le tableau', async () => {
    render(<JournalAudit />);

    expect(await screen.findByText('Administrateur Central CROUS-T')).toBeInTheDocument();
    expect(screen.getByText('Pape Alioune Niang')).toBeInTheDocument();
    expect(screen.getByText(/Base SyLOC-T/i)).toBeInTheDocument();
  });

  it('ouvre la modale de détails lors du clic sur le bouton Détails', async () => {
    render(<JournalAudit />);

    expect(await screen.findByText('Administrateur Central CROUS-T')).toBeInTheDocument();
    const boutons = screen.getAllByRole('button', { name: /Détails/i });
    fireEvent.click(boutons[0]);

    expect(await screen.findByText(/Détail de l'événement d'audit/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Injection massive de 25 locaux/i).length).toBeGreaterThanOrEqual(1);
  });
});
