import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import StarOutlineOutlinedIcon from '@mui/icons-material/StarOutlineOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getAvis, modererAvis } from '../../api/avis';
import { messageErreur } from '../../api/utils';
import { Button, Input, Select } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField, DataTable,
  IdentityCell, Pill, RowActions, IconButton, SplitLayout, ProgressRow,
} from '../common/dashboard';

const STATUT_TONE = { PUBLIE: 'green', SIGNALE: 'gold', MASQUE: 'red' };

/**
 * Moderation des avis cantines : indicateurs de satisfaction et file de
 * moderation (publier / signaler / masquer).
 */
export default function ModerationAvis() {
  const [avisList, setAvisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [note, setNote] = useState('');

  const charger = async () => {
    setLoading(true);
    try {
      setAvisList(await getAvis());
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur lors du chargement des avis.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const moderer = async (id, nouveauStatut) => {
    try {
      await modererAvis(id, nouveauStatut);
      setAvisList((prev) => prev.map((a) => (a.id === id ? { ...a, statut: nouveauStatut } : a)));
      toast.success(`Avis marque comme ${nouveauStatut.toLowerCase()}.`);
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur lors de la moderation.'));
    }
  };

  const stats = useMemo(() => {
    const notes = avisList.filter((a) => a.note_etoiles != null);
    const moyenne = notes.length ? notes.reduce((s, a) => s + Number(a.note_etoiles), 0) / notes.length : 0;
    return {
      total: avisList.length,
      publies: avisList.filter((a) => a.statut === 'PUBLIE').length,
      signales: avisList.filter((a) => a.statut === 'SIGNALE').length,
      masques: avisList.filter((a) => a.statut === 'MASQUE').length,
      moyenne: moyenne.toFixed(1),
      repartition: [5, 4, 3, 2, 1].map((n) => ({
        n, count: avisList.filter((a) => Number(a.note_etoiles) === n).length,
      })),
    };
  }, [avisList]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return avisList
      .filter((a) => (statut ? a.statut === statut : true))
      .filter((a) => (note ? Number(a.note_etoiles) === Number(note) : true))
      .filter((a) => !term
        || (a.commentaire || '').toLowerCase().includes(term)
        || (a.local_reference || '').toLowerCase().includes(term))
      .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
  }, [avisList, q, statut, note]);

  const columns = [
    {
      key: 'local',
      label: 'Local',
      render: (r) => (
        <IdentityCell
          title={r.local_reference || 'Local'}
          subtitle={`Avis #${String(r.id).slice(0, 8).toUpperCase()}`}
          initials="AV"
          tone="gold"
        />
      ),
    },
    {
      key: 'note_etoiles',
      label: 'Note',
      render: (r) => (
        <span style={{ whiteSpace: 'nowrap' }} title={`${r.note_etoiles}/5`}>
          {'★'.repeat(Number(r.note_etoiles) || 0)}
          <span style={{ opacity: 0.3 }}>{'★'.repeat(5 - (Number(r.note_etoiles) || 0))}</span>
        </span>
      ),
    },
    { key: 'commentaire', label: 'Commentaire', render: (r) => <span title={r.commentaire}>{(r.commentaire || '—').slice(0, 90)}</span> },
    { key: 'date_creation', label: 'Depose le', render: (r) => (r.date_creation ? new Date(r.date_creation).toLocaleDateString('fr-FR') : '—') },
    { key: 'statut', label: 'Statut', render: (r) => <Pill tone={STATUT_TONE[r.statut] || 'slate'}>{r.statut}</Pill> },
    {
      key: 'actions',
      label: 'Moderation',
      align: 'right',
      render: (r) => (
        <RowActions>
          <IconButton title="Publier" tone="green" disabled={r.statut === 'PUBLIE'} onClick={() => moderer(r.id, 'PUBLIE')}>✓</IconButton>
          <IconButton title="Signaler" tone="gold" disabled={r.statut === 'SIGNALE'} onClick={() => moderer(r.id, 'SIGNALE')}>⚑</IconButton>
          <IconButton title="Masquer" tone="red" disabled={r.statut === 'MASQUE'} onClick={() => moderer(r.id, 'MASQUE')}><BlockOutlinedIcon style={{ fontSize: 17 }} /></IconButton>
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon={<ShieldOutlinedIcon style={{ fontSize: 20 }} />}
        title="Moderation des avis cantines"
        subtitle="Validation et filtrage des commentaires deposes par la communaute etudiante."
        actions={<Button variant="secondary" onClick={charger}>↻ Actualiser</Button>}
      />

      <StatGrid cols={4}>
        <KpiCard icon={<ChatBubbleOutlineOutlinedIcon style={{ fontSize: 20 }} />} label="Avis collectes" value={stats.total} sub={`${stats.publies} publies`} tone="navy" />
        <KpiCard icon={<StarOutlineOutlinedIcon style={{ fontSize: 20 }} />} label="Note moyenne" value={`${stats.moyenne}/5`} sub="Satisfaction globale" tone="gold" />
        <KpiCard icon={<FlagOutlinedIcon style={{ fontSize: 20 }} />} label="Avis signales" value={stats.signales} sub="A examiner" tone="red" />
        <KpiCard icon={<BlockOutlinedIcon style={{ fontSize: 20 }} />} label="Avis masques" value={stats.masques} sub="Retires de la vitrine" tone="slate" />
      </StatGrid>

      <SplitLayout ratio="1.8fr 1fr">
        <Panel icon={<AssignmentOutlinedIcon style={{ fontSize: 20 }} />} title="File de moderation" padded={false}>
          <div style={{ padding: '14px 16px 0' }}>
            <FilterBar onReset={() => { setQ(''); setStatut(''); setNote(''); }}>
              <FilterField label="Recherche">
                <Input placeholder="Commentaire, local…" value={q} onChange={(e) => setQ(e.target.value)} />
              </FilterField>
              <FilterField label="Statut">
                <Select value={statut} onChange={(e) => setStatut(e.target.value)}>
                  <option value="">Tous</option>
                  <option value="PUBLIE">Publie</option>
                  <option value="SIGNALE">Signale</option>
                  <option value="MASQUE">Masque</option>
                </Select>
              </FilterField>
              <FilterField label="Note">
                <Select value={note} onChange={(e) => setNote(e.target.value)}>
                  <option value="">Toutes</option>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} etoile(s)</option>)}
                </Select>
              </FilterField>
            </FilterBar>
          </div>
          <DataTable columns={columns} rows={rows} loading={loading} empty="Aucun avis a moderer." pageSize={10} dense />
        </Panel>

        <Panel icon={<BarChartOutlinedIcon style={{ fontSize: 20 }} />} title="Repartition des notes">
          {stats.repartition.map((r) => (
            <ProgressRow
              key={r.n}
              label={`${r.n} etoile${r.n > 1 ? 's' : ''} — ${r.count} avis`}
              value={r.count}
              total={stats.total || 1}
              tone={r.n >= 4 ? 'green' : r.n === 3 ? 'gold' : 'red'}
            />
          ))}
        </Panel>
      </SplitLayout>
    </div>
  );
}

