import { useState, useEffect } from 'react';
import { Card, SectionHeader, Button, Field, Select, Textarea, PageWrapper, AlertBanner } from '../common/ui';
import { getLocaux } from '../../api/patrimoine';
import { createInspection } from '../../api/terrain';
import toast from 'react-hot-toast';

export default function InspectionTerrain() {
  const [locaux, setLocaux] = useState([]);
  const [localId, setLocalId] = useState('');
  const [typeControle, setTypeControle] = useState('TECHNIQUE');
  const [conforme, setConforme] = useState(true);
  const [coords, setCoords] = useState(null);
  const [observations, setObservations] = useState('');
  const [loadingLocaux, setLoadingLocaux] = useState(true);

  useEffect(() => {
    getLocaux().then(data => {
      setLocaux(data);
      if (data.length > 0) {
        setLocalId(data[0].id);
      }
    }).catch(err => {
      toast.error('Erreur chargement des locaux');
    }).finally(() => {
      setLoadingLocaux(false);
    });
  }, []);

  const handleCaptureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) });
          toast.success('Position GPS capturée avec succès !');
        },
        () => {
          setCoords({ lat: '14.7912', lng: '-16.9254' });
          toast('Position GPS par défaut appliquée (Campus VCN).');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!localId) {
      toast.error('Veuillez sélectionner un local.');
      return;
    }
    try {
      await createInspection({
        local: localId,
        type_controle: typeControle,
        est_conforme: conforme,
        latitude: coords ? coords.lat : null,
        longitude: coords ? coords.lng : null,
        observations
      });
      toast.success(`Inspection de Terrain enregistrée avec succès.`);
      setObservations('');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement de l\'inspection.');
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Brigade de Terrain (Service Technique)"
        title="Inspection Technique & Géolocalisation GPS (LR-17)"
        subtitle="Contrôle de conformité technique (électricité, pannes, dégâts matériels) des locaux."
      />

      <Card style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Local commercial inspecté *" required>
            {loadingLocaux ? (
              <p>Chargement des locaux...</p>
            ) : (
              <Select value={localId} onChange={(e) => setLocalId(e.target.value)}>
                {locaux.map(l => (
                  <option key={l.id} value={l.id}>{l.reference} - {l.type_local.replace(/_/g, ' ')}</option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Type d'inspection *" required>
            <Select value={typeControle} onChange={(e) => setTypeControle(e.target.value)}>
              <option value="TECHNIQUE">Technique (Général & Plomberie)</option>
              <option value="ELECTRIQUE">Électrique (Raccordements, Câbles)</option>
              <option value="OCCUPATION">Occupation (Vérification présence)</option>
            </Select>
          </Field>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="conf" checked={conforme} onChange={(e) => setConforme(e.target.checked)} />
            <label htmlFor="conf" style={{ fontSize: 13, fontWeight: 700 }}>Conforme aux exigences d'hygiène de la Vie Étudiante</label>
          </div>

          <AlertBanner type="info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Coordonnées GPS : {coords ? `${coords.lat}, ${coords.lng}` : 'Non encore capturées'}</span>
              <Button variant="outline" size="sm" type="button" onClick={handleCaptureGPS}>
                Capturer Position GPS
              </Button>
            </div>
          </AlertBanner>

          <Field label="Observations de l'Agent QHSE">
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              placeholder="Remarques sur la chaîne du froid, la propreté, la gestion des déchets..."
            />
          </Field>

          <Button variant="navy" type="submit" style={{ justifyContent: 'center' }}>
            Enregistrer l'Inspection QHSE
          </Button>
        </form>
      </Card>
    </PageWrapper>
  );
}

