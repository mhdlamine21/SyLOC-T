import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { PageWrapper, SectionHeader, Card, Table, Button, AlertBanner } from '../common/ui';
import { getUtilisateurs, getMembresCommission, nommerMembreCommission, majMembreCommission } from '../../api/comptes';
import { getDelegationCommission, toggleDelegationCommission } from '../../api/demandes';
import { SERVICE_PAR_ROLE } from '../../utils/constants';

function adapter(u, membresParUtilisateur) {
  const membre = membresParUtilisateur.get(String(u.id));
  return {
    ...u,
    nom_complet: u.nom_complet || u.username,
    service: SERVICE_PAR_ROLE[u.role_effectif || u.role] || '-',
    est_membre_commission: !!membre?.actif,
    membre_commission_id: membre?.id ?? null,
  };
}

export default function GestionCommission() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [delegationActive, setDelegationActive] = useState(false);
  const [delegationLoading, setDelegationLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setChargement(true);
    try {
      const [uData, mData, delegData] = await Promise.all([
        getUtilisateurs({ role: '' }), // on ramène tout et on filtre sur is_active
        getMembresCommission(),
        getDelegationCommission()
      ]);
      const mapM = new Map(mData.map((m) => [String(m.utilisateur), m]));
      setUsers(uData.filter(u => u.is_active && u.role !== 'USAGER').map((u) => adapter(u, mapM)));
      setDelegationActive(delegData.active);
    } catch (err) {
      toast.error('Impossible de charger les utilisateurs ou les paramètres.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleTitreMembre = async (utilisateur) => {
    if (loading) return;
    setLoading(true);
    try {
      if (utilisateur.membre_commission_id) {
        const maj = await majMembreCommission(
          utilisateur.membre_commission_id,
          !utilisateur.est_membre_commission,
        );
        setUsers(users.map(u => u.id === utilisateur.id ? { ...u, est_membre_commission: !!maj.actif } : u));
      } else {
        const cree = await nommerMembreCommission(utilisateur.id);
        setUsers(users.map(u => u.id === utilisateur.id ? { ...u, est_membre_commission: true, membre_commission_id: cree.id } : u));
      }
      toast.success(
        utilisateur.est_membre_commission
          ? 'Titre de Commission retiré pour ce collaborateur.'
          : 'Titre de Membre de la Commission attribué !',
      );
    } catch (err) {
      toast.error('Échec de la mise à jour du titre de commission.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDelegation = async () => {
    setDelegationLoading(true);
    try {
      const resp = await toggleDelegationCommission(!delegationActive);
      setDelegationActive(resp.active);
      if (resp.active) {
        toast.success("Délégation activée. La Commission décidera en votre absence.");
      } else {
        toast.success("Délégation désactivée. Vous reprenez le pouvoir décisionnel.");
      }
    } catch (err) {
      toast.error("Erreur lors du changement de statut de la délégation.");
    } finally {
      setDelegationLoading(false);
    }
  };

  const columns = [
    { key: 'username', label: 'Identifiant / Nom', render: (v, r) => (
      <div>
        <div style={{ fontWeight: 700, color: 'var(--text-navy)' }}>{r.nom_complet}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>@{v}</div>
      </div>
    ) },
    { key: 'role', label: 'Rôle Système', render: (v, r) => r.service },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, r) => (
        <Button
          variant={r.est_membre_commission ? 'danger' : 'amber'}
          size="sm"
          onClick={() => toggleTitreMembre(r)}
          disabled={loading}
        >
          {r.est_membre_commission ? 'Retirer de la Commission' : 'Nommer à la Commission'}
        </Button>
      ),
    },
  ];

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Direction Générale CROUS-T"
        title="Gestion de la Commission d'Évaluation"
        subtitle="Nommez les membres habilités à siéger en commission et déléguez votre pouvoir décisionnel en cas d'absence."
      />

      <Card style={{ marginBottom: 20, background: delegationActive ? 'var(--amber-soft)' : 'var(--surface-2)', border: delegationActive ? '2px solid var(--amber)' : '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: 16, color: 'var(--text-navy)' }}>
              Délégation du Pouvoir de Validation
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
              {delegationActive 
                ? "La délégation est ACTIVÉE. La Commission a le pouvoir de valider définitivement les demandes (feu vert) sans votre intervention."
                : "La délégation est DÉSACTIVÉE. Vous gardez le contrôle total sur la validation finale (Décision du Directeur)."}
            </p>
          </div>
          <Button 
            variant="amber"
            onClick={handleToggleDelegation}
            disabled={delegationLoading}
          >
            Déléguer mes tâches à la commission
          </Button>
        </div>
      </Card>

      <Card>
        <div style={{ marginBottom: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-navy)' }}>Collaborateurs (Candidats à la Commission)</h3>
        </div>

        <Table columns={columns} data={users} loading={chargement} pageSize={10} />
      </Card>
    </PageWrapper>
  );
}
