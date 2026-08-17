import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationBell from './NotificationBell';
import * as notifApi from '../../api/notifications';
import * as authContext from '../../context/AuthContext';

vi.mock('../../api/notifications');
vi.mock('../../context/AuthContext');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authContext.useAuth.mockReturnValue({
      isAuthenticated: true,
      role: 'OCCUPANT',
      user: { id: 1, nom_complet: 'Occupant Test' },
    });
  });

  it('affiche la cloche avec le badge du nombre de notifications non lues', async () => {
    notifApi.getNotifications.mockResolvedValue([
      { id: 1, contenu: 'Dossier validé', est_lue: false, date_creation: '2026-08-15T12:00:00Z', canal: 'EMAIL' },
      { id: 2, contenu: 'Quitus émis', est_lue: true, date_creation: '2026-08-14T10:00:00Z', canal: 'SMS' },
    ]);

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('ouvre le panneau de notifications lors du clic sur la cloche', async () => {
    notifApi.getNotifications.mockResolvedValue([
      { id: 1, contenu: 'Nouveau message de test', est_lue: false, date_creation: '2026-08-15T12:00:00Z', canal: 'EMAIL' },
    ]);

    render(<NotificationBell />);

    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Nouveau message de test')).toBeInTheDocument();
    });
  });

  it('marque une notification comme lue au clic', async () => {
    notifApi.getNotifications.mockResolvedValue([
      { id: 1, contenu: 'Dossier validé', est_lue: false, date_creation: '2026-08-15T12:00:00Z', canal: 'EMAIL' },
    ]);
    notifApi.marquerNotificationLue.mockResolvedValue({ id: 1, est_lue: true });

    render(<NotificationBell />);

    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);

    const notifItem = await screen.findByText('Dossier validé');
    fireEvent.click(notifItem);

    await waitFor(() => {
      expect(notifApi.marquerNotificationLue).toHaveBeenCalledWith(1);
    });
  });
});
