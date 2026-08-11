import { useState } from 'react';
import { Card, SectionHeader, Button, Field, Select, Textarea, PageWrapper, AlertBanner } from '../../../frontend/src/components/common/ui';
import toast from 'react-hot-toast';

export default function LaisserAvis() {
  const [cantine, setCantine] = useState('Cantine A');
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Règle 2 : 20 caractères minimum
    if (commentaire.trim().length < 20) {
      toast.error('🚫 Règle anti-fraude : Votre commentaire doit contenir au moins 20 caractères.');
      return;
    }

    toast.success(`⭐ Avis enregistré pour la ${cantine} avec la note ${note}/5 ! Merci pour votre retour.`);
    setCommentaire('');
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Vie Étudiante & Restauration"
        title="Publier un Avis sur les Cantines (LR-18)"
        subtitle="Évaluation de la qualité du service de restauration du CROUS de Thiès."
      />

      <Card style={{ maxWidth: 640 }}>
        <AlertBanner type="info">
          🛡️ <strong>Règles anti-fraude d'évaluation :</strong><br />
          1. Réservé aux étudiants vérifiés.<br />
          2. Commentaire de 20 caractères minimum.<br />
          3. Limité à 1 avis par cantine par jour.<br />
          4. Modération préalable des termes inappropriés.
        </AlertBanner>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
          <Field label="Cantine / Restauration évaluée *" required>
            <Select value={cantine} onChange={(e) => setCantine(e.target.value)}>
              <option value="Cantine A">Cantine A (Mamadou Lô)</option>
              <option value="Cantine B">Cantine B (Complexe Central)</option>
              <option value="Kiosque Amphi 2">Kiosque Amphi 2</option>
            </Select>
          </Field>

          <Field label="Note globale (sur 5 étoiles) *" required>
            <Select value={note} onChange={(e) => setNote(Number(e.target.value))}>
              <option value={5}>⭐⭐⭐⭐⭐ (5/5 — Excellent)</option>
              <option value={4}>⭐⭐⭐⭐☆ (4/5 — Très bien)</option>
              <option value={3}>⭐⭐⭐☆☆ (3/5 — Moyen)</option>
              <option value={2}>⭐⭐☆☆☆ (2/5 — Médiocre)</option>
              <option value={1}>⭐☆☆☆☆ (1/5 — Inacceptable)</option>
            </Select>
          </Field>

          <Field label="Votre commentaire détaillé (20 caractères min.) *" required>
            <Textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={4}
              placeholder="Ex. Qualité des repas très satisfaisante, temps d'attente raisonnable au guichet..."
              required
            />
          </Field>

          <Button variant="amber" type="submit" style={{ justifyContent: 'center' }}>
            ⭐ Publier mon Avis Vérifié
          </Button>
        </form>
      </Card>
    </PageWrapper>
  );
}
