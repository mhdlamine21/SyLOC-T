import api from "./axios";

export const demandesAPI = {
  // LR-6 : Déposer une demande
  create: (data) => api.post("/demandes/", data),

  // LR-7 : Suivi des demandes
  getMesDemandes: () => api.get("/demandes/mes-demandes/"),
  getDetail: (id) => api.get(`/demandes/${id}/`),

  // LR-19 : Dashboard Direction
  getRapport: (params) => api.get("/rapports/", { params }),

  // LR-20 : Rapports par période
  getRapportPeriodique: (du, au) =>
    api.get("/rapports/", { params: { du, au } }),

  // LR-21 : Gestion des comptes
  getUtilisateurs: () => api.get("/accounts/utilisateurs/"),
  updateRole: (id, role) =>
    api.patch(`/accounts/utilisateurs/${id}/`, { role }),
  desactiverCompte: (id) =>
    api.post(`/accounts/utilisateurs/${id}/desactiver/`),
};
