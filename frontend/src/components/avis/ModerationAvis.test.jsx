import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModerationAvis from './ModerationAvis';

const mockAvis = [
  {
    id: 1,
    local_reference: 'LOC-VCN-11',
    note_etoiles: 5,
    commentaire: 'Le meilleur café Touba du campus VCN !',
    date_creation: '2026-08-16T12:00:00Z',
    statut: 'PUBLIE',
  },
  {
    id: 2,
    local_reference: 'LOC-VCN-04',
    note_etoiles: 2,
    commentaire: 'Temps d attente trop long.',
    date_creation: '2026-08-16T14:00:00Z',
    statut: 'SIGNALE',
  },
];

vi.mock('../../api/avis', () => ({
  getAvis: vi.fn(() => Promise.resolve(mockAvis)),
  modererAvis: vi.fn(() => Promise.resolve({})),
}));

describe('ModerationAvis Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche les indicateurs, la file de modération et la répartition des notes en pleine largeur', async () => {
    render(<ModerationAvis />);

    expect(await screen.findByText('Moderation des avis cantines')).toBeInTheDocument();
    expect(screen.getByText('File de moderation')).toBeInTheDocument();
    expect(screen.getByText('Repartition des notes')).toBeInTheDocument();
    expect(screen.getByText('LOC-VCN-11')).toBeInTheDocument();
    expect(screen.getAllByText(/Masquer/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Conserver/i)).toBeInTheDocument();
  });
});
