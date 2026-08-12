import { useState, useEffect } from 'react';
import { Card, SectionHeader, Button, Field, Select, Textarea, PageWrapper, AlertBanner } from '../common/ui';
import { createPlainte } from '../../api/terrain';
import { getContrats } from '../../api/contrats';
import toast from 'react-hot-toast';

export default function SignalerProbleme() {
  const [description, setDescription] = useState('');
  const [urgence, setUrgence] = useState('MOYENNE');
  const [photo, setPhoto] = useState(null);
  const [contrat, setContrat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContrats().then(data => {
      if (data.length > 0) setContrat(data[0]);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contrat) {
      toast.error('Aucun bail domanial actif trouvé.');
      return;
    }
    try {
      await createPlainte({
        type: 'TECHNIQUE',
        urgence,
        description,
        local: contrat.local
      });
      toast.success('⚙️ Signalement d\'incident technique transmis au Service Technique du CROUS-T !');
      setDescription('');
      setPhoto(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors du signalement.");
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Assistance & Service Technique"
        title="Signaler un Dysfonctionnement Technique (LR-14)"
        subtitle="Déclaration d'incident technique rattaché automatiquement à votre bail domanial actif."
      />

      <Card style={{ maxWidth: 640 }}>
        {loading ? (
          <p>Recherche de votre bail en cours...</p>
        ) : !contrat ? (
          <AlertBanner type="warn">
            ⚠️ Vous n'avez aucun bail domanial actif pour signaler un problème technique.
          </AlertBanner>
        ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AlertBanner type="info">
            📍 <strong>Rattachement Automatique au Bail :</strong> Votre signalement est automatiquement rattaché à votre contrat actif <strong>{contrat.local_reference || contrat.local}</strong>.
          </AlertBanner>

          <Field label="Niveau d'Urgence du Signalement *" required>
            <Select value={urgence} onChange={(e) => setUrgence(e.target.value)}>
              <option value="ELEVEE">🚨 Élevée (Fuite d'eau importante, coupure électrique générale)</option>
              <option value="MOYENNE">⚠️ Moyenne (Serrure défectueuse, fissure murale, plomberie)</option>
              <option value="FAIBLE">ℹ️ Faible (Entretien préventif ou retouche peinture)</option>
            </Select>
          </Field>

          <Field label="Description détaillée de l'incident *" required>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Précisez la nature exacte du dysfonctionnement constaté dans votre local..."
              required
            />
          </Field>

          <Field label="Photo de preuve / constatation (optionnel)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </Field>

          <Button variant="navy" type="submit" style={{ justifyContent: 'center' }}>
            🔧 Soumettre le Signalement Technique
          </Button>
        </form>
        )}
      </Card>
    </PageWrapper>
  );
}
