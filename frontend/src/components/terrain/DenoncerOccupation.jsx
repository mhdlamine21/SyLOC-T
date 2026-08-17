import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import FolderCopyOutlinedIcon from '@mui/icons-material/FolderCopyOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { createPlainte, getPlaintes } from '../../api/terrain';
import { getLocaux } from '../../api/patrimoine';
import { messageErreur } from '../../api/utils';
import { Button, Field, Input, Select, Textarea, AlertBanner } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, DataTable, Pill,
} from '../common/dashboard';

const VIDE = {
  local: '', localisation_libre: '', description: '', urgence: 'MOYENNE',
  photo_preuve: '', est_anonyme: true,
};

/**
 * Dénonciation d'occupation sans titre : formulaire pleine largeur
 * avec téléversement direct de photo et suivi des signalements.
 */
export default function DenoncerOccupation() {
  const [form, setForm] = useState(VIDE);
  const [locaux, setLocaux] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [photoFichier, setPhotoFichier] = useState(null);
  const [apercuPhoto, setApercuPhoto] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleFileChange = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La taille du fichier ne doit pas dépasser 5 Mo.');
      return;
    }
    setPhotoFichier(file);
    const reader = new FileReader();
    reader.onload = () => {
      setApercuPhoto(reader.result);
      setForm((f) => ({ ...f, photo_preuve: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const retirerPhoto = () => {
    setPhotoFichier(null);
    setApercuPhoto(null);
    setForm((f) => ({ ...f, photo_preuve: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      });
      toast.success('Dénonciation transmise à la Brigade de Contrôle Terrain.');
      setForm(VIDE);
      retirerPhoto();
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
    { key: 'localisation_libre', label: 'Localisation', render: (r) => <span style={{ fontWeight: 600 }}>{r.localisation_libre || r.local_reference || '-'}</span> },
    { key: 'description', label: 'Faits constatés', render: (r) => (r.description || '-').slice(0, 90) },
    { key: 'urgence', label: 'Urgence', render: (r) => <Pill tone={r.urgence === 'ELEVEE' ? 'red' : r.urgence === 'MOYENNE' ? 'gold' : 'slate'}>{r.urgence}</Pill> },
    { key: 'statut', label: 'Statut', render: (r) => <Pill tone={r.statut === 'RESOLUE' ? 'green' : r.statut === 'REJETEE' ? 'slate' : 'red'}>{(r.statut || '').replace(/_/g, ' ')}</Pill> },
    { key: 'date_creation', label: 'Transmis le', render: (r) => (r.date_creation ? new Date(r.date_creation).toLocaleDateString('fr-FR') : '-') },
  ];

  return (
    <div style={{ display: 'grid', gap: 24, width: '100%' }}>
      <PageHeader
        icon={<FlagOutlinedIcon style={{ fontSize: 26 }} />}
        title="Dénoncer une occupation sans titre"
        subtitle="Signalement d'une occupation illégale d'un local ou d'un espace commercial domanial du CROUS-T."
      />

      <StatGrid cols={4}>
        <KpiCard icon={<FlagOutlinedIcon style={{ fontSize: 22 }} />} label="Dénonciations" value={stats.total} sub="Total enregistré" tone="navy" />
        <KpiCard icon={<CircleOutlinedIcon style={{ fontSize: 22 }} />} label="Ouvertes" value={stats.ouvertes} sub="Non prises en charge" tone="red" />
        <KpiCard icon={<ScheduleOutlinedIcon style={{ fontSize: 22 }} />} label="En traitement" value={stats.encours} sub="Brigade mobilisée" tone="gold" />
        <KpiCard icon={<TaskAltOutlinedIcon style={{ fontSize: 22 }} />} label="Résolues" value={stats.resolues} sub="Dossiers clôturés" tone="green" />
      </StatGrid>

      {/* Bloc 1 : Formulaire Pleine Largeur */}
      <Panel icon={<EditNoteOutlinedIcon style={{ fontSize: 22 }} />} title="Nouvelle dénonciation" subtitle="Formulaire de constat d'occupation illégale">
        <form onSubmit={soumettre} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AlertBanner type="warn">
            <strong>Dénonciation confidentielle :</strong> vous pouvez soumettre ce signalement sans révéler votre identité.
          </AlertBanner>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <Field label="Local concerné (si identifié)">
              <Select value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })}>
                <option value="">-- Local non répertorié ou zone libre --</option>
                {locaux.map((l) => <option key={l.id} value={l.id}>{l.reference} - {l.localisation || l.type_local}</option>)}
              </Select>
            </Field>

            <Field label="Niveau d'urgence *" required>
              <Select value={form.urgence} onChange={(e) => setForm({ ...form, urgence: e.target.value })}>
                <option value="FAIBLE">Faible (activité ponctuelle)</option>
                <option value="MOYENNE">Moyenne (installation précaire)</option>
                <option value="ELEVEE">Élevée (construction / squat permanent)</option>
              </Select>
            </Field>
          </div>

          <Field label="Localisation précise du lieu *" required>
            <Input
              value={form.localisation_libre}
              onChange={(e) => setForm({ ...form, localisation_libre: e.target.value })}
              placeholder="Ex. Kiosque non autorisé installé près du Bloc C, Allée centrale…"
              required
            />
          </Field>

          <Field label="Description détaillée des faits constatés *" required>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Activité commerciale non autorisée, horaires d'ouverture, personnes concernées, nature du commerce…"
              required
            />
          </Field>

          <Field label="Photo de preuve (Optionnel)">
            {apercuPhoto ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 12,
                  borderRadius: 10,
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface-2)',
                }}
              >
                <img
                  src={apercuPhoto}
                  alt="Aperçu preuve"
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: 'var(--text-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {photoFichier?.name || 'Photo de preuve sélectionnée'}
                  </p>
                  <p style={{ margin: 0, fontSize: 11.5, color: 'var(--muted)' }}>
                    {photoFichier ? `${(photoFichier.size / 1024).toFixed(0)} Ko` : 'Image prête pour téléversement'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" type="button" onClick={retirerPhoto} style={{ color: 'var(--red)' }}>
                  <DeleteOutlineOutlinedIcon style={{ fontSize: 16, marginRight: 4 }} /> Retirer
                </Button>
              </div>
            ) : (
              <label
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 12,
                  padding: '20px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  background: 'var(--surface-2)',
                  transition: 'border-color .15s, background .15s',
                }}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--gold-deep)'; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--border)';
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileChange(file);
                }}
              >
                <PhotoCameraOutlinedIcon style={{ fontSize: 32, color: 'var(--gold-deep)' }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-navy)' }}>
                  📷 Cliquer pour choisir une photo ou glisser-déposer le fichier
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  Formats acceptés : JPG, PNG, WEBP — 5 Mo maximum
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </Field>

          <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 700, margin: '4px 0 8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.est_anonyme} onChange={(e) => setForm({ ...form, est_anonyme: e.target.checked })} />
            Soumettre ce signalement de façon anonyme
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="danger" disabled={envoi} style={{ minWidth: 260, justifyContent: 'center' }}>
              {envoi ? 'Transmission…' : '🚀 Transmettre à la Brigade Terrain'}
            </Button>
          </div>
        </form>
      </Panel>

      {/* Bloc 2 : Historique Pleine Largeur */}
      <Panel icon={<FolderCopyOutlinedIcon style={{ fontSize: 22 }} />} title="Dénonciations transmises" subtitle="Suivi du traitement par la brigade de surveillance domaniale" padded={false}>
        <DataTable columns={columns} rows={historique} loading={loading} empty="Aucune dénonciation enregistrée pour le moment." pageSize={10} />
      </Panel>
    </div>
  );
}


