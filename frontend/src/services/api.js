import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const authState = localStorage.getItem('syloc_auth');
  if (authState) {
    try {
      const { user } = JSON.parse(authState);
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error('Erreur parsing token', e);
    }
  }
  return config;
});

export const fetchLocaux = async () => {
  const response = await api.get('patrimoine/locaux/');
  // Django REST framework with pagination returns data in `response.data.results`
  return response.data.results ? response.data.results : response.data;
};

export const fetchContrats = async () => {
  const response = await api.get('contrats/contrats/');
  return response.data.results ? response.data.results : response.data;
};

export const fetchMouvementsCaisse = async () => {
  const response = await api.get('paiements/mouvements/');
  return response.data.results ? response.data.results : response.data;
};

export default api;
