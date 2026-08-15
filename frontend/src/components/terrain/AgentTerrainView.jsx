import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import FolderCopyOutlinedIcon from '@mui/icons-material/FolderCopyOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import NotificationImportantOutlinedIcon from '@mui/icons-material/NotificationImportantOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getPlaintes, updatePlainte } from '../../api/terrain';
import { messageErreur } from '../../api/utils';
import { Button, Input, Select, Modal, Textarea, Field } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField, DataTable,
  IdentityCell, Pill, RowActions, IconButton,
} from '../common/dashboard';

const URGENCE_TONE = { ELEVEE: 'red', MOYENNE: 'gold', FAIBLE: 'slate' };
const STATUT_TONE = { OUVERTE: 'red', EN_COURS_TRAITEMENT: 'gold', RESOLUE: 'green', REJETEE: 'slate' };
const TYPES = ['TECHNIQUE', 'NON_CONFORMITE_QHSE', 'ENVIRONNEMENT', 'DENONCIATION_ILLEGALE'];

/**
 * Brigade de controle terrain : pilotage complet des constats et signalements
 * (tri, filtres, transmission, resolution, rejet).
 */
export default function AgentTerrainView() {
  const [plaintes, setPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [statut, setStatut] = useState('');
  const [urgence, setUrgence] = useState('');
  const [detail, setDetail] = useState(null);

  const charger = async () => {
    setLoading(true);
    try {
      setPlaintes(await getPlaintes());
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur de chargement des constats.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const majStatut = async (id, patch, msg) => {
    try {
      await updatePlainte(id, patch);
      toast.success(msg);
      setDetail(null);
      charger();
    } catch (e) {
      toast.error(messageErreur(e, 'Mise a jour impossible.'));
    }
  };

  const stats = useMemo(() => ({
    total: plaintes.length,
    ouvertes: plaintes.filter((p) => p.statut === 'OUVERTE').length,
    encours: plaintes.filter((p) => p.statut === 'EN_COURS_TRAITEMENT').length,
    resolues: plaintes.filter((p) => p.statut === 'RESOLUE').length,
    urgentes: plaintes.filter((p) => p.urgence === 'ELEVEE' && p.statut !== 'RESOLUE').length,
    illegales: plaintes.filter((p) => p.type === 'DENONCIATION_ILLEGALE' && p.statut !== 'RESOLUE').length,
  }), [plaintes]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return plaintes
      .filter((p) => (type ? p.type === type : true))
      .filter((p) => (statut ? p.statut === statut : true))
      .filter((p) => (urgence ? p.urgence === urgence : true))
      .filter((p) => !term
        || (p.description || '').toLowerCase().includes(term)
        || (p.localisation_libre || '').toLowerCase().includes(term)
        || (p.local_reference || '').toLowerCase().includes(term))
      .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
  }, [plaintes, q, type, statut, urgence]);

  const columns = [
    {
      key: 'ref',
      label: 'Constat',
      render: (r) => (
        <IdentityCell
          title={(r.type || '').replace(/_/g, ' ')}
          subtitle={`SIG-${String(r.id).slice(0, 8).toUpperCase()}`}
          initials="AT"
          tone={r.type === 'DENONCIATION_ILLEGALE' ? 'red' : 'navy'}
        />
      ),
    },
    {
      key: 'localisation',
      label: 'Localisation',
      render: (r) => r.localisation_libre || r.local_reference || '—',
    },
    { key: 'urgence', label: 'Urgence', render: (r) => <Pill tone={URGENCE_TONE[r.urgence] || 'slate'}>{r.urgence}</Pill> },
    { key: 'statut', label: 'Statut', render: (r) => <Pill tone={STATUT_TONE[r.statut] || 'slate'}>{(r.statut || '').replace(/_/g, ' ')}</Pill> },
    {
      key: 'date',
      label: 'Depose le',
      render: (r) => (r.date_creation ? new Date(r.date_creation).toLocaleDateString('fr-FR') : '—'),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <RowActions>
          <IconButton title="Consulter" onClick={() => setDetail(r)}><VisibilityOutlinedIcon style={{ fontSize: 17 }} /></IconButton>
          <IconButton
            title="Transmettre au QHSE"
            tone="gold"
            disabled={r.statut !== 'OUVERTE'}
            onClick={() => majStatut(r.id, { statut: 'EN_COURS_TRAITEMENT', urgence: 'ELEVEE' }, 'Rapport de constat transmis au Bureau QHSE.')}
          >

          </IconButton>
          <IconButton
            title="Marquer resolu"
            tone="green"
            disabled={r.statut === 'RESOLUE'}
            onClick={() => majStatut(r.id, { statut: 'RESOLUE' }, 'Constat cloture.')}
          >
            ✓
          </IconButton>
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon={<NotificationImportantOutlinedIcon style={{ fontSize: 20 }} />}
        title="Constats & missions de terrain"
        subtitle="Verification sur le terrain de l'occupation effective des locaux domaniaux et suivi des signalements."
        actions={<Button variant="secondary" onClick={charger}>↻ Actualiser</Button>}
      />

      <StatGrid cols={4}>
        <KpiCard icon={<AssignmentOutlinedIcon style={{ fontSize: 20 }} />} label="Constats enregistres" value={stats.total} sub={`${stats.ouvertes} ouverts`} tone="navy" />
        <KpiCard icon={<LocalFireDepartmentOutlinedIcon style={{ fontSize: 20 }} />} label="Urgence elevee" value={stats.urgentes} sub="A traiter en priorite" tone="red" />
        <KpiCard icon={<FlagOutlinedIcon style={{ fontSize: 20 }} />} label="Occupations illegales" value={stats.illegales} sub="Denonciations actives" tone="gold" />
        <KpiCard icon={<TaskAltOutlinedIcon style={{ fontSize: 20 }} />} label="Constats resolus" value={stats.resolues} sub={`${stats.encours} en cours`} tone="green" />
      </StatGrid>

      <Panel icon={<FolderCopyOutlinedIcon style={{ fontSize: 20 }} />} title="Registre des constats" subtitle="Tri par date de depot" padded={false}>
        <div style={{ padding: '14px 16px 0' }}>
          <FilterBar onReset={() => { setQ(''); setType(''); setStatut(''); setUrgence(''); }}>
            <FilterField label="Recherche">
              <Input placeholder="Description, local, localisation…" value={q} onChange={(e) => setQ(e.target.value)} />
            </FilterField>
            <FilterField label="Type">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Tous les types</option>
                {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </Select>
            </FilterField>
            <FilterField label="Statut">
              <Select value={statut} onChange={(e) => setStatut(e.target.value)}>
                <option value="">Tous</option>
                <option value="OUVERTE">Ouverte</option>
                <option value="EN_COURS_TRAITEMENT">En cours</option>
                <option value="RESOLUE">Resolue</option>
                <option value="REJETEE">Rejetee</option>
              </Select>
            </FilterField>
            <FilterField label="Urgence">
              <Select value={urgence} onChange={(e) => setUrgence(e.target.value)}>
                <option value="">Toutes</option>
                <option value="ELEVEE">Elevee</option>
                <option value="MOYENNE">Moyenne</option>
                <option value="FAIBLE">Faible</option>
              </Select>
            </FilterField>
          </FilterBar>
        </div>
        <DataTable columns={columns} rows={rows} loading={loading} empty="Aucun constat ne correspond aux filtres." pageSize={12} dense />
      </Panel>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail du constat" size="md">
        {detail && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Pill tone={URGENCE_TONE[detail.urgence]}>{detail.urgence}</Pill>
              <Pill tone={STATUT_TONE[detail.statut]}>{(detail.statut || '').replace(/_/g, ' ')}</Pill>
              <Pill tone="navy">{(detail.type || '').replace(/_/g, ' ')}</Pill>
              {detail.est_anonyme && <Pill tone="slate">Anonyme</Pill>}
            </div>
            <Field label="Description">
              <Textarea value={detail.description || ''} readOnly rows={4} />
            </Field>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              Localisation : {detail.localisation_libre || detail.local_reference || '—'}<br />
              {detail.latitude && detail.longitude ? `GPS : ${detail.latitude}, ${detail.longitude}` : 'GPS non renseigne'}<br />
              {detail.date_limite_sla ? `Echeance SLA : ${new Date(detail.date_limite_sla).toLocaleString('fr-FR')}` : ''}
            </div>
            {detail.photo_preuve && (
              <a href={detail.photo_preuve} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gold-deep)' }}>
                Consulter la photo de preuve
              </a>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="danger" size="sm" onClick={() => majStatut(detail.id, { statut: 'REJETEE' }, 'Constat rejete.')}>Rejeter</Button>
              <Button size="sm" onClick={() => majStatut(detail.id, { statut: 'RESOLUE' }, 'Constat cloture.')}>Marquer resolu</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

