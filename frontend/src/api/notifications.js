import api from './axios';

export const getNotifications = async () => {
  const response = await api.get('/comptes/notifications/');
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await api.patch(`/comptes/notifications/${id}/marquer_lue/`);
  return response.data;
};
