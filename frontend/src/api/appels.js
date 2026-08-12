import api from './axios';

export const appelsAPI = {
  getAll: (params) => api.get('/api/demandes/appels/', { params }),
  
  getActifsEpingles: () => api.get('/api/demandes/appels/', { 
    params: { est_actif: 'true', est_epinglee: 'true' } 
  }),

  create: (data) => api.post('/api/demandes/appels/', data),
  
  update: (id, data) => api.patch(`/api/demandes/appels/${id}/`, data),
  
  delete: (id) => api.delete(`/api/demandes/appels/${id}/`),

  toggleEpinglee: async (id, isCurrentlyPinned) => {
    // Si on veut épingler, vérifier s'il y a déjà 3 annonces épinglées
    if (!isCurrentlyPinned) {
      const response = await appelsAPI.getActifsEpingles();
      // DRF returns paginated response or list
      const results = response.data.results || response.data;
      if (results.length >= 3) {
        throw new Error("Impossible d'épingler plus de 3 annonces simultanément.");
      }
    }
    return api.patch(`/api/demandes/appels/${id}/`, { est_epinglee: !isCurrentlyPinned });
  }
};
