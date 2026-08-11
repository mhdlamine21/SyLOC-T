import { useState } from 'react';
import { Card, SectionHeader, Button, Field, Textarea, PageWrapper, AlertBanner } from '../../../frontend/src/components/common/ui';
import toast from 'react-hot-toast';

export default function DenoncerOccupation() {
  const [localisation, setLocalisation] = useState('');
  const [description, setDescription] = useState('');
  const [estAnonyme, setEstAnonyme] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Dénonciation d\'occupation sans titre enregistrée et transmise à la Brigade Terrain.');
    setLocalisation('');
    setDescription('');
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Brigade de Contrôle Terrain"
        title="Dénoncer une Occupation Sans Titre (LR-15)"
        subtitle="Signalement d'une occupation illégale d'un local ou espace commercial."
      />

      <Card style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AlertBanner type="warn">
            🔒 <strong>Option Anonymat :</strong> Vous pouvez soumettre ce signalement de manière 100 % anonyme sans révéler votre identité.
          </AlertBanner>

          <Field label="Localisation du local ou espace concerné *" required>
            <input
              type="text"
              value={localisation}
              onChange={(e) => setLocalisation(e.target.value)}
              placeholder="Ex. Kiosque non identifié près du Bloc C..."
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}
              required
            />
          </Field>

          <Field label="Description des faits *" required>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Précisez la nature de l'occupation illégale constatée..."
              required
            />
          </Field>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              id="anonyme"
              checked={estAnonyme}
              onChange={(e) => setEstAnonyme(e.target.checked)}
            />
            <label htmlFor="anonyme" style={{ fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Soumettre cette dénonciation de manière anonyme
            </label>
          </div>

          <Button variant="stamp" type="submit" style={{ justifyContent: 'center', marginTop: 10 }}>
            🚨 Transmettre la Dénonciation à la Brigade
          </Button>
        </form>
      </Card>
    </PageWrapper>
  );
}
