import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDemandes, getDelegationCommission, getMesVotes } from '../../api/demandes';
import { messageErreur } from '../../api/utils';
import { useAuth } from '../../context/AuthContext';
import {
  PageHeader, StatGrid, KpiCard, Panel, DataTable, IdentityCell, Pill, RowActions,
} from '../common/dashboard';
import { Button } from '../common/ui';

const EN_ATTENTE = new Set(['EN_ATTENTE_DECISION', 'CONTROLE_HYGIENE', 'EN_EXPERTISE_TECHNIQUE']);

/**
 * Espace dédié à tout membre de la Commission d'évaluation : rappel clair
 * de son statut, dossiers à traiter, votes déjà exprimés et échéances.
 * Sert de tableau de bord avant bascule vers la séance de vote (/commission).
 */
export default function EspaceMembreCommission() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [mesVotes, setMesVotes] = useState([]);
  const [delegationActive, setDelegationActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const charger = async () => {
    setLoading(true);
    try {
      const [d, v, deleg] = await Promise.all([
        getDemandes(),
        getMesVotes().catch(() => []),
        getDelegationCommission().catch(() => ({ active: false })),
      ]);
      setDemandes(Array.isArray(d) ? d : []);
      setMesVotes(Array.isArray(v) ? v : []);
      setDelegationActive(!!deleg?.active);
    } catch (e) {
      toast.error(messageErreur(e, 'Impossible de charger vos tâches de commission.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const votesParDemande = useMemo(() => {
    const map = new Map();
    mesVotes.forEach((v) => map.set(String(v.demande), v));
    return map;
  }, [mesVotes]);

  const aTraiter = useMemo(
    () => demandes.filter((d) => EN_ATTENTE.has(d.statut) && !votesParDemande.has(String(d.id))),
    [demandes, votesParDemande],
  );
  const deliberes = useMemo(
    () => demandes.filter((d) => votesParDemande.has(String(d.id))),
    [demandes, votesParDemande],
  );

  const stats = {
    aTraiter: aTraiter.length,
    votesExprimes: mesVotes.length,
    quorumSuivi: deliberes.length,
  };

  const colonnes = [
    {
      key: 'dossier',
      label: 'Dossier',
      render: (r) => (
        <IdentityCell
          title={(r.type_demande || '').replace(/_/g, ' ')}
          subtitle={r.reference_anonyme || `Candidature #${r.id}`}
          initials="CE"
          tone="navy"
        />
      ),
    },
    { key: 'local', label: 'Local ciblé', render: (r) => r.local_reference || r.local || '-' },
    {
      key: 'date_depot',
      label: 'Déposé le',
      render: (r) => (r.date_depot ? new Date(r.date_depot).toLocaleDateString('fr-FR') : '-'),
    },
    {
      key: 'echeance',
      label: 'Échéance de vote',
      render: (r) => r.date_limite_vote
        ? <Pill tone={new Date(r.date_limite_vote) < new Date() ? 'red' : 'gold'}>{new Date(r.date_limite_vote).toLocaleDateString('fr-FR')}</Pill>
        : <Pill tone="slate">Non fixée</Pill>,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: () => (
        <RowActions>
          <Link to="/commission">
            <Button variant="amber" size="sm">Voter</Button>
          </Link>
        </RowActions>
      ),
    },
  ];

  const colonnesTraites = [
    {
      key: 'dossier',
      label: 'Dossier',
      render: (r) => (
        <IdentityCell
          title={(r.type_demande || '').replace(/_/g, ' ')}
          subtitle={r.reference_anonyme || `Candidature #${r.id}`}
          initials="OK"
          tone="green"
        />
      ),
    },
    {
      key: 'mon_avis',
      label: 'Mon avis',
      render: (r) => {
        const v = votesParDemande.get(String(r.id));
        return <Pill tone={v?.avis === 'FAVORABLE' ? 'green' : v?.avis === 'DEFAVORABLE' ? 'red' : 'slate'}>{v?.avis || '-'}</Pill>;
      },
    },
    { key: 'statut', label: 'Statut du dossier', render: (r) => <Pill tone={r.statut === 'FAVORABLE' ? 'green' : r.statut === 'DEFAVORABLE' ? 'red' : 'gold'}>{(r.statut || '').replace(/_/g, ' ')}</Pill> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: () => (
        <Link to="/commission"><Button variant="secondary" size="sm">Réviser</Button></Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon={<GroupsOutlinedIcon style={{ fontSize: 20 }} />}
        title="Mon espace - Commission d'évaluation"
        subtitle="Vous siégez à la Commission d'évaluation du CROUS-T : retrouvez ici vos dossiers à instruire, vos votes et les échéances."
        actions={<Button variant="secondary" onClick={charger}>↻ Actualiser</Button>}
      />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14,
        background: 'var(--gold-tint, rgba(201,161,92,.12))', border: '1px solid var(--gold-tint-2, rgba(201,161,92,.35))',
        marginBottom: 28,
      }}>
        <VerifiedUserOutlinedIcon style={{ fontSize: 22, color: 'var(--gold-deep)' }} />
        <div style={{ fontSize: 13, color: 'var(--text-navy)' }}>
          <strong>{user?.nom_complet || user?.username}</strong>, vous êtes officiellement <strong>membre de la Commission d'évaluation</strong> du CROUS-T.
          {delegationActive && (
            <span style={{ marginLeft: 6 }}>
              La délégation du Directeur est <strong>activée</strong> : la Commission peut statuer par vote majoritaire en son absence.
            </span>
          )}
        </div>
      </div>

      <StatGrid cols={3}>
        <KpiCard icon={<PendingActionsOutlinedIcon style={{ fontSize: 20 }} />} label="Dossiers à examiner" value={stats.aTraiter} sub="En attente de mon vote" tone="gold" />
        <KpiCard icon={<HowToVoteOutlinedIcon style={{ fontSize: 20 }} />} label="Votes exprimés" value={stats.votesExprimes} sub="Depuis mon entrée en fonction" tone="navy" />
        <KpiCard icon={<TaskAltOutlinedIcon style={{ fontSize: 20 }} />} label="Dossiers délibérés" value={stats.quorumSuivi} sub="Suivi collégial" tone="green" />
      </StatGrid>

      <Panel icon={<ScheduleOutlinedIcon style={{ fontSize: 20 }} />} title="Dossiers en attente de mon vote" subtitle="Priorité aux échéances les plus proches" padded={false}>
        <DataTable columns={colonnes} rows={aTraiter} loading={loading} empty="Aucun dossier en attente de vote." pageSize={8} dense />
      </Panel>

      <div style={{ height: 28 }} />

      <Panel icon={<TaskAltOutlinedIcon style={{ fontSize: 20 }} />} title="Mes délibérations passées" padded={false}>
        <DataTable columns={colonnesTraites} rows={deliberes} loading={loading} empty="Vous n'avez pas encore voté." pageSize={8} dense />
      </Panel>
    </div>
  );
}
