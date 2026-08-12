import { useEffect, useState } from 'react';
import { Card, SectionHeader, Button, Field, Select, Textarea, PageWrapper, AlertBanner } from '../common/ui';
import { getLocaux } from '../../api/patrimoine';
import { createAvis } from '../../api/avis';
import toast from 'react-hot-toast';

export default function LaisserAvis() {
  const [locaux, setLocaux] = useState([]);
  const [localId, setLocalId] = useState('');
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getLocaux();
        const list = Array.isArray(data) ? data : (data?.results || []);
        setLocaux(list);
        if (list.length > 0) setLocalId(list[0].id);
      } catch (err) {
        toast.error('Erreur lors du chargement des locaux.');
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Règle 2 : 20 caractères minimum
    if (commentaire.trim().length < 20) {
      toast.error('🚫 Règle anti-fraude : Votre avis doit faire au moins 20 caractères.');
      return;
    }
    if (!localId) {
      toast.error('Veuillez sélectionner un local à évaluer.');
      return;
    }

    setLoading(true);
    try {
      await createAvis({ local: localId, note_etoiles: Number(note), commentaire });
      toast.success(`⭐ Votre avis a été soumis avec succès (Note : ${note}/5) !`);
      setCommentaire('');
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.detail || data?.commentaire?.[0] || "Erreur lors de l'envoi de votre avis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Vie Étudiante & Restauration"
        title="Évaluer une Cantine ou Restauration (LR-18)"
        subtitle="Dépôt d'un avis vérifié soumis aux 4 règles d'intégrité anti-fraude du CROUS-T."
      />

      <Card style={{ maxWidth: 640 }}>
        <AlertBanner type="info">
          🛡️ <strong>4 Règles Anti-Fraude d'Évaluation :</strong><br />
          1. Réservé aux étudiants vérifiés.<br />
          2. Commentaire de 20 caractères minimum.<br />
          3. 1 seul avis par cantine et par jour max.<br />
          4. Modération préalable des termes inappropriés.
        </AlertBanner>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
          <Field label="Cantine / Local évalué *" required>
            <Select value={localId} onChange={(e) => setLocalId(e.target.value)}>
              {locaux.length === 0 && <option value="">Aucun local disponible</option>}
              {locaux.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.reference} — {l.designation || l.type_local}
                </option>
              ))}
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

          <Button variant="amber" type="submit" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? 'Envoi en cours…' : '⭐ Publier mon Avis Vérifié'}
          </Button>
        </form>
      </Card>
    </PageWrapper>
  );
}
