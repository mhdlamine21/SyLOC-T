import api from './axios';
import { toArray } from './utils';

export const getEcheances = async (params = {}) =>
  toArray((await api.get('/paiements/echeances/', { params })).data);

export const getPaiements = async () => toArray((await api.get('/paiements/')).data);

export const reglerPaiement = async (echeance_id, montant_regle, mode, reference_transaction = '') => {
  const response = await api.post('/paiements/regler/', {
    echeance_id,
    montant_regle,
    mode,
    reference_transaction,
  });
  return response.data;
};
