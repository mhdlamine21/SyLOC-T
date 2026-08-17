import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DenoncerOccupation from './DenoncerOccupation';

const mockLocaux = [
  { id: '1', reference: 'LOC-001', localisation: 'Bloc A' },
];

const mockPlaintes = [
  {
    id: 10,
    type: 'DENONCIATION_ILLEGALE',
    description: 'Vendeur ambulant non autorisé',
    localisation_libre: 'Allée centrale',
    urgence: 'MOYENNE',
    statut: 'RESOLUE',
    date_creation: '2026-08-16T10:00:00Z',
  },
];

vi.mock('../../api/patrimoine', () => ({
  getLocaux: vi.fn(() => Promise.resolve(mockLocaux)),
}));

vi.mock('../../api/terrain', () => ({
  getPlaintes: vi.fn(() => Promise.resolve(mockPlaintes)),
  createPlainte: vi.fn(() => Promise.resolve({ id: 11 })),
}));

describe('DenoncerOccupation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche la zone de téléversement de fichier photo à la place du champ URL', async () => {
    render(<DenoncerOccupation />);

    expect(await screen.findByText(/Cliquer pour choisir une photo/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/https:\/\//i)).not.toBeInTheDocument();
  });
});
