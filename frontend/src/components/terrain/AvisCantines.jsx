import { useState, useEffect } from 'react';
import { Card, SectionHeader, Button, Modal, Field, Select, Textarea, PageWrapper } from '../common/ui';
import { getLocaux } from '../../api/patrimoine';
import { createAvis } from '../../api/terrain';
import toast from 'react-hot-toast';
import { messageErreur } from '../../api/utils';

const TYPE_ICON = { RESTAURATION: '🍽️', MULTISERVICES: '🛒', PAPETERIE: '📚', ARTISANAT: '🧵', AUTRE: '🏢' };

export default function AvisCantines() {
  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLocal, setActiveLocal] = useState(null);
  
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLocaux = async () => {
    try {
      setLocaux(await getLocaux());
    } catch (err) {
      toast.error(messageErreur(err, "Erreur de chargement des locaux."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocaux();
  }, []);

  const handleOpenModal = (local) => {
    setActiveLocal(local);
    setNote(5);
    setCommentaire('');
  };

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAvis({
        local: activeLocal.id,
        note_etoiles: note,
        commentaire: commentaire
      });
      toast.success(`Votre avis sur ${activeLocal.reference} a été enregistré avec succès ! Merci de votre contribution.`);
      setActiveLocal(null);
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de l'enregistrement de l'avis."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Évaluation des prestations"
        title="Laisser un avis (Restaurants & Locaux)"
        subtitle="Partagez votre expérience et aidez-nous à améliorer la qualité de vie sur le campus !"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {loading ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>Chargement...</p>
        ) : locaux.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>Aucun local disponible.</p>
        ) : locaux.map((loc) => (
          <Card key={loc.id} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 120, background: 'var(--surface-2)', borderRadius: '8px 8px 0 0', margin: '-16px -16px 16px -16px', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
              {(loc.photo || loc.photo_url)
                ? <img src={loc.photo || loc.photo_url} alt={loc.reference} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 40, opacity: 0.3 }}>{TYPE_ICON[loc.type_local] || '🏢'}</span>}
            </div>
            
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--navy)' }}>
              {loc.reference}
            </h3>
            <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 800, marginBottom: 8 }}>
              {TYPE_ICON[loc.type_local]} {(loc.type_local || '').replace(/_/g, ' ')}
            </div>
            
            <p style={{ fontSize: 13, color: 'var(--muted)', flex: 1, margin: '0 0 16px' }}>
              📍 {loc.localisation}
            </p>

            <Button variant="primary" size="sm" onClick={() => handleOpenModal(loc)} style={{ width: '100%', justifyContent: 'center' }}>
              ⭐ Noter ce local
            </Button>
          </Card>
        ))}
      </div>

      {activeLocal && (
        <Modal open={!!activeLocal} onClose={() => setActiveLocal(null)} title={`Évaluer ${activeLocal.reference}`}>
          <form onSubmit={handleVoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 15, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13 }}>
              Vous êtes sur le point de donner votre avis public (mais anonymisé) concernant la qualité de service pour ce local.
            </div>

            <Field label="Votre note (sur 5 étoiles)" required>
              <Select value={note} onChange={(e) => setNote(Number(e.target.value))}>
                <option value="5">⭐⭐⭐⭐⭐ Excellent (5/5)</option>
                <option value="4">⭐⭐⭐⭐ Très bien (4/5)</option>
                <option value="3">⭐⭐⭐ Correct (3/5)</option>
                <option value="2">⭐⭐ Moyen (2/5)</option>
                <option value="1">⭐ À améliorer (1/5)</option>
              </Select>
            </Field>

            <Field label="Commentaire (Optionnel)">
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={4}
                placeholder="Ex: Temps d'attente trop long, repas très bon, accueil chaleureux..."
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setActiveLocal(null)} disabled={submitting}>Annuler</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Publier mon avis'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
