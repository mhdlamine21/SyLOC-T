import { useState } from 'react';
import { Card, SectionHeader, Button, Field, Textarea, PageWrapper, AlertBanner } from '../common/ui';
import toast from 'react-hot-toast';

export default function DenoncerOccupation() {
  const [localisation, setLocalisation] = useState('');
  const [description, setDescription] = useState('');
  const [estAnonyme, setEstAnonyme] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('🚨 Dénonciation d\'occupation sans titre transmise à la Brigade de Contrôle Terrain !');
    setLocalisation('');
    setDescription('');
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Brigade de Contrôle Terrain"
        title="Dénoncer une Occupation Sans Titre (LR-15)"
        subtitle="Signalement d'une occupation illégale d'un local ou d'un espace commercial domanial."
      />

      <Card style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AlertBanner type="warn">
            🔒 <strong>Dénonciation 100 % Anonyme :</strong> Vous pouvez soumettre ce signalement en toute confidentialité sans révéler votre identité.
          </AlertBanner>

          <Field label="Localisation précise du local ou espace concerné *" required>
            <input
              type="text"
              value={localisation}
              onChange={(e) => setLocalisation(e.target.value)}
              placeholder="Ex. Kiosque non autorisé installé près du Bloc C..."
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}
              required
            />
          </Field>

          <Field label="Description des faits constatés *" required>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Décrivez l'activité commerciale non autorisée, les horaires ou les personnes concernées..."
              required
            />
          </Field>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              id="anonymeCheck"
              checked={estAnonyme}
              onChange={(e) => setEstAnonyme(e.target.checked)}
            />
            <label htmlFor="anonymeCheck" style={{ fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Soumettre ce signalement de façon 100 % anonyme
            </label>
          </div>

          <Button variant="stamp" type="submit" style={{ justifyContent: 'center', marginTop: 10 }}>
            🚨 Transmettre la Dénonciation à la Brigade Terrain
          </Button>
        </form>
      </Card>
    </PageWrapper>
  );
}
