import { useState } from 'react';
import { Card, SectionHeader, Button, Field, Select, Textarea, PageWrapper, AlertBanner } from '../../../frontend/src/components/common/ui';
import toast from 'react-hot-toast';

export default function InspectionQHSE() {
  const [local, setLocal] = useState('LOC-004');
  const [noteSanitaire, setNoteSanitaire] = useState(4);
  const [conforme, setConforme] = useState(true);
  const [coords, setCoords] = useState(null);
  const [observations, setObservations] = useState('');

  const handleCaptureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) });
        toast.success('📍 Coordonnées GPS capturées avec succès !');
      }, () => {
        setCoords({ lat: '14.7912', lng: '-16.9254' });
        toast('📍 Coordonnées GPS par défaut appliquées.');
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(`Inspection QHSE enregistrée avec note ${noteSanitaire}/5 pour le local ${local}.`);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Bureau Environnement & QHSE"
        title="Inspection Sanitaire & Géolocalisation GPS (LR-16)"
        subtitle="Contrôle de conformité QHSE des cantines et locaux commerciaux."
      />

      <Card style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Local inspecté *" required>
            <Select value={local} onChange={(e) => setLocal(e.target.value)}>
              <option value="LOC-004">LOC-004 — Cantine A (Mamadou Lô)</option>
              <option value="LOC-001">LOC-001 — Kiosque Bloc A (Aïssatou Ndiaye)</option>
              <option value="LOC-002">LOC-002 — Multiservices (Ousmane Traoré)</option>
            </Select>
          </Field>

          <Field label="Note de Conformité Sanitaire (sur 5) *" required>
            <input type="number" min="1" max="5" value={noteSanitaire} onChange={(e) => setNoteSanitaire(Number(e.target.value))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
          </Field>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="conf" checked={conforme} onChange={(e) => setConforme(e.target.checked)} />
            <label htmlFor="conf" style={{ fontSize: 13, fontWeight: 700 }}>Conforme aux normes d'hygiène de la vie étudiante</label>
          </div>

          <AlertBanner type="info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📍 GPS : {coords ? `${coords.lat}, ${coords.lng}` : 'Non capturé'}</span>
              <Button variant="outline" size="sm" type="button" onClick={handleCaptureGPS}>
                📍 Capturer Position GPS
              </Button>
            </div>
          </AlertBanner>

          <Field label="Observations de l'Agent QHSE">
            <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={3} placeholder="Remarques sanitaires, propreté, équipement..." />
          </Field>

          <Button variant="navy" type="submit" style={{ justifyContent: 'center' }}>
            🔬 Enregistrer l'Inspection QHSE
          </Button>
        </form>
      </Card>
    </PageWrapper>
  );
}
