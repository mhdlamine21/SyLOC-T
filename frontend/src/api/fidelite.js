import api from './axios';

export const getMonScoreFidelite = async () => (await api.get('/fidelite/mon-score/')).data;
