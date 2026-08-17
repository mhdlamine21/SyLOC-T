import api from './axios';
import { toArray } from './utils';

export const getNotifications = async () => toArray((await api.get('/comptes/notifications/')).data);

export const getNotificationsNonLues = async () => {
  const { data } = await api.get('/comptes/notifications/non-lues/');
  return { count: data.count ?? 0, results: toArray(data.results) };
};

export const marquerNotificationLue = async (id) =>
  (await api.post(`/comptes/notifications/${id}/marquer-lue/`)).data;

export const marquerToutesLues = async () =>
  (await api.post('/comptes/notifications/marquer-toutes-lues/')).data;

// Audit Phase 1 - suppression d'une notification.
export const supprimerNotification = async (id) =>
  (await api.delete(`/comptes/notifications/${id}/`)).data;
