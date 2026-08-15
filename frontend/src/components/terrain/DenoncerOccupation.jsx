import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import FolderCopyOutlinedIcon from '@mui/icons-material/FolderCopyOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { createPlainte, getPlaintes } from '../../api/terrain';
import { getLocaux } from '../../api/patrimoine';
import { messageErreur } from '../../api/utils';
import { Button, Field, Input, Select, Textarea, AlertBanner } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, SplitLayout, DataTable, Pill,
} from '../common/dashboard';

const VIDE = {
  local: '', localisation_libre: '', description: '', urgence: 'MOYENNE',
  photo_preuve: '', latitude: '', longitude: '', est_anonyme: true,
};

/**
 * Denonciation d'occupation sans titre : formulaire complet (local, GPS,
 * preuve photo, anonymat) et suivi des denonciations deja transmises.
 */
export default function DenoncerOccupation() {
  const [form, setForm] = useState(VIDE);
  const [locaux, setLocaux] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const [l, p] = await Promise.all([getLocaux(), getPlaintes()]);
      setLocaux(l);
      setHistorique(p.filter((x) => x.type === 'DENONCIATION_ILLEGALE'));
    } catch (e) {
      toast.error(messageErreur(e, 'Chargement impossible.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const geolocaliser = () => {
    if (!navigator.geolocation) return toast.error('Geolocalisation indisponible sur cet appareil.');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success('Position GPS capturee.');
      },
      () => toast.error('Impossible de recuperer votre position.'),
    );
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      await createPlainte({
        type: 'DENONCIATION_ILLEGALE',
        urgence: form.urgence,
        description: form.description,
        localisation_libre: form.localisation_libre,
        est_anonyme: form.est_anonyme,
        ...(form.local ? { local: form.local } : {}),
        ...(form.photo_preuve ? { photo_preuve: form.photo_preuve } : {}),
        ...(form.latitude ? { latitude: Number(form.latitude) } : {}),
        ...(form.longitude ? { longitude: Number(form.longitude) } : {}),
      });
      toast.success('Denonciation transmise a la Brigade de Controle Terrain.');
      setForm(VIDE);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors du signalement.'));
    } finally {
      setEnvoi(false);
    }
  };

  const stats = useMemo(() => ({
    total: historique.length,
    ouvertes: historique.filter((p) => p.statut === 'OUVERTE').length,
    encours: historique.filter((p) => p.statut === 'EN_COURS_TRAITEMENT').length,
    resolues: historique.filter((p) => p.statut === 'RESOLUE').length,
  }), [historique]);

  const columns = [
    { key: 'localisation_libre', label: 'Localisation', render: (r) => r.localisation_libre || r.local_reference || '—' },
    { key: 'description', label: 'Faits', render: (r) => (r.description || '—').slice(0, 60) },
    { key: 'urgence', label: 'Urgence', render: (r) => <Pill tone={r.urgence === 'ELEVEE' ? 'red' : r.urgence === 'MOYENNE' ? 'gold' : 'slate'}>{r.urgence}</Pill> },
    { key: 'statut', label: 'Statut', render: (r) => <Pill tone={r.statut === 'RESOLUE' ? 'green' : r.statut === 'REJETEE' ? 'slate' : 'red'}>{(r.statut || '').replace(/_/g, ' ')}</Pill> },
    { key: 'date_creation', label: 'Transmis le', render: (r) => (r.date_creation ? new Date(r.date_creation).toLocaleDateString('fr-FR') : '—') },
  ];

  return (
    <div>
      <PageHeader
        icon={<FlagOutlinedIcon style={{ fontSize: 20 }} />}
        title="Denoncer une occupation sans titre"
        subtitle="Signalement d'une occupation illegale d'un local ou d'un espace commercial domanial."
      />

      <StatGrid cols={4}>
        <KpiCard icon={<FlagOutlinedIcon style={{ fontSize: 20 }} />} label="Denonciations" value={stats.total} sub="Total enregistre" tone="navy" />
        <KpiCard icon={<CircleOutlinedIcon style={{ fontSize: 20 }} />} label="Ouvertes" value={stats.ouvertes} sub="Non prises en charge" tone="red" />
        <KpiCard icon={<ScheduleOutlinedIcon style={{ fontSize: 20 }} />} label="En traitement" value={stats.encours} sub="Brigade mobilisee" tone="gold" />
        <KpiCard icon={<TaskAltOutlinedIcon style={{ fontSize: 20 }} />} label="Resolues" value={stats.resolues} sub="Dossiers clotures" tone="green" />
      </StatGrid>

      <SplitLayout ratio="1fr 1.2fr">
        <Panel icon={<EditNoteOutlinedIcon style={{ fontSize: 20 }} />} title="Nouvelle denonciation">
          <form onSubmit={soumettre}>
            <AlertBanner type="warn">
              <strong>Denonciation confidentielle :</strong> vous pouvez soumettre ce signalement sans reveler votre identite.
            </AlertBanner>

            <Field label="Local concerne (si identifie)">
              <Select value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })}>
                <option value="">— Local non repertorie —</option>
                {locaux.map((l) => <option key={l.id} value={l.id}>{l.reference} — {l.localisation}</option>)}
              </Select>
            </Field>

            <Field label="Localisation precise" required>
              <Input
                value={form.localisation_libre}
                onChange={(e) => setForm({ ...form, localisation_libre: e.target.value })}
                placeholder="Kiosque non autorise pres du Bloc C…"
                required
              />
            </Field>

            <Field label="Description des faits constates" required>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Activite commerciale non autorisee, horaires, personnes concernees…"
                required
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
              <Field label="Niveau d'urgence">
                <Select value={form.urgence} onChange={(e) => setForm({ ...form, urgence: e.target.value })}>
                  <option value="FAIBLE">Faible</option>
                  <option value="MOYENNE">Moyenne</option>
                  <option value="ELEVEE">Elevee</option>
                </Select>
              </Field>
              <Field label="Latitude">
                <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
              </Field>
              <Field label="Longitude">
                <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
              </Field>
            </div>

            <Button type="button" variant="secondary" size="sm" onClick={geolocaliser}>Capturer ma position GPS</Button>

            <Field label="Photo de preuve (URL)">
              <Input value={form.photo_preuve} onChange={(e) => setForm({ ...form, photo_preuve: e.target.value })} placeholder="https://…" />
            </Field>

            <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.8, fontWeight: 700, margin: '4px 0 14px' }}>
              <input type="checkbox" checked={form.est_anonyme} onChange={(e) => setForm({ ...form, est_anonyme: e.target.checked })} />
              Soumettre ce signalement de facon anonyme
            </label>

            <Button type="submit" disabled={envoi} style={{ width: '100%', justifyContent: 'center' }}>
              {envoi ? 'Transmission…' : 'Transmettre a la Brigade Terrain'}
            </Button>
          </form>
        </Panel>

        <Panel icon={<FolderCopyOutlinedIcon style={{ fontSize: 20 }} />} title="Denonciations transmises" subtitle="Suivi du traitement par la brigade" padded={false}>
          <DataTable columns={columns} rows={historique} loading={loading} empty="Aucune denonciation enregistree." pageSize={10} dense />
        </Panel>
      </SplitLayout>
    </div>
  );
}

