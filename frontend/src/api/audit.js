import api from './axios';
import { toArray } from './utils';

/**
 * Journal d'audit (Administrateur SI / Direction).
 * Filtres possibles : action, utilisateur, date_debut, date_fin.
 */
export const getJournalAudit = async (params = {}) =>
  toArray((await api.get('/comptes/audit/', { params })).data);
