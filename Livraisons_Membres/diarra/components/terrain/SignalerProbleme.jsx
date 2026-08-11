import { useState } from 'react';
import { Card, SectionHeader, Button, Field, Select, Textarea, PageWrapper, AlertBanner } from '../../../frontend/src/components/common/ui';
import toast from 'react-hot-toast';

export default function SignalerProbleme() {
  const [description, setDescription] = useState('');
  const [urgence, setUrgence] = useState('MOYENNE');

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Signalement technique transmis au Service Technique ! Intervention programmée.');
    setDescription('');
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Assistance & Maintenance"
        title="Signaler un Problème Technique (LR-14)"
        subtitle="Déclaration d'incident technique rattaché automatiquement à votre local sous contrat."
      />

      <Card style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AlertBanner type="info">
            📍 <strong>Rattachement automatique :</strong> Votre demande sera automatiquement associée à votre contrat actif <strong>LOC-004 (Cantine A)</strong>.
          </AlertBanner>

          <Field label="Niveau d'Urgence *" required>
            <Select value={urgence} onChange={(e) => setUrgence(e.target.value)}>
              <option value="ELEVEE">🚨 Élevée (Fuite importante, panne électrique globale)</option>
              <option value="MOYENNE">⚠️ Moyenne (Serrure, fissure, plomberie mineure)</option>
              <option value="FAIBLE">ℹ️ Faible (Entretien de routine)</option>
            </Select>
          </Field>

          <Field label="Description détaillée de l'incident *" required>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Décrivez précisément la panne ou le dysfonctionnement constaté..."
              required
            />
          </Field>

          <Button variant="navy" type="submit" style={{ justifyContent: 'center' }}>
            🔧 Transmettre le Signalement Technique
          </Button>
        </form>
      </Card>
    </PageWrapper>
  );
}
