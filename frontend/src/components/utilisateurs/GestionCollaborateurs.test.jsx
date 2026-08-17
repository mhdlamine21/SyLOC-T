import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GestionCollaborateurs from './GestionCollaborateurs';
import {
  getUtilisateurs,
  changerRoleUtilisateur,
  activerUtilisateur,
  getRapportMensuelCollaborateur,
} from '../../api/comptes';

vi.mock('../../api/comptes', () => ({
  getUtilisateurs: vi.fn(),
  changerRoleUtilisateur: vi.fn(),
  activerUtilisateur: vi.fn(),
  getRapportMensuelCollaborateur: vi.fn(),
}));

describe('GestionCollaborateurs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche les collaborateurs en excluant strictement les usagers / candidats', async () => {
    getUtilisateurs.mockResolvedValue([
      {
        id: 'user-1',
        username: 'agent_terrain_1',
        nom_complet: 'Mamadou Terrain',
        email: 'terrain@crous-t.sn',
        role: 'AGENT_TERRAIN',
        is_active: true,
        date_joined: '2026-01-10T10:00:00Z',
      },
      {
        id: 'user-2',
        username: 'juriste_1',
        nom_complet: 'Fatou Juriste',
        email: 'juridique@crous-t.sn',
        role: 'SERVICE_JURIDIQUE',
        is_active: true,
        date_joined: '2026-02-15T10:00:00Z',
      },
      {
        id: 'user-3',
        username: 'candidat_usager',
        nom_complet: 'Ousmane Candidat',
        email: 'candidat@test.sn',
        role: 'USAGER',
        is_active: true,
        date_joined: '2026-03-01T10:00:00Z',
      },
    ]);

    render(<GestionCollaborateurs />);

    expect(await screen.findByText('Mamadou Terrain')).toBeInTheDocument();
    expect(screen.getByText('Fatou Juriste')).toBeInTheDocument();
    // L'usager ne doit JAMAIS apparaître dans la liste des collaborateurs
    expect(screen.queryByText('Ousmane Candidat')).not.toBeInTheDocument();
  });

  it('ouvre la modale de rapport mensuel et affiche les indicateurs d activité', async () => {
    getUtilisateurs.mockResolvedValue([
      {
        id: 'user-1',
        username: 'agent_terrain_1',
        nom_complet: 'Mamadou Terrain',
        email: 'terrain@crous-t.sn',
        role: 'AGENT_TERRAIN',
        is_active: true,
      },
    ]);

    getRapportMensuelCollaborateur.mockResolvedValue({
      utilisateur: {
        id: 'user-1',
        username: 'agent_terrain_1',
        nom_complet: 'Mamadou Terrain',
        email: 'terrain@crous-t.sn',
        role: 'AGENT_TERRAIN',
        is_active: true,
      },
      mois: 8,
      annee: 2026,
      total_actions: 14,
      kpis: [
        { label: 'Contrôles sanitaires', value: 8, tone: 'teal' },
        { label: 'Ordres de mission clôturés', value: 6, tone: 'blue' },
      ],
      actions: [
        {
          id: 'act-1',
          action: 'CONTROLE_HYGIENE',
          cible: 'LOC-RESTO-01',
          details: 'Inspection mensuelle conforme',
          date_creation: '2026-08-10T11:00:00Z',
        },
      ],
    });

    render(<GestionCollaborateurs />);

    const rapportBtn = await screen.findByRole('button', { name: /Rapport/i });
    fireEvent.click(rapportBtn);

    await waitFor(() => {
      expect(getRapportMensuelCollaborateur).toHaveBeenCalledWith('user-1', expect.any(Object));
    });

    expect(await screen.findByText('Contrôles sanitaires')).toBeInTheDocument();
    expect(screen.getByText('Ordres de mission clôturés')).toBeInTheDocument();
    expect(screen.getByText('Inspection mensuelle conforme')).toBeInTheDocument();
  });

  it('permet d ouvrir la modale d ajustement de rôle', async () => {
    getUtilisateurs.mockResolvedValue([
      {
        id: 'user-1',
        username: 'agent_terrain_1',
        nom_complet: 'Mamadou Terrain',
        email: 'terrain@crous-t.sn',
        role: 'AGENT_TERRAIN',
        is_active: true,
      },
    ]);

    changerRoleUtilisateur.mockResolvedValue({});

    render(<GestionCollaborateurs />);

    const ajusterBtn = await screen.findByRole('button', { name: /Rôle/i });
    fireEvent.click(ajusterBtn);

    expect(await screen.findByText(/Ajuster le rôle/)).toBeInTheDocument();
    expect(screen.getByText('✓ Valider le nouveau rôle')).toBeInTheDocument();
  });
});
