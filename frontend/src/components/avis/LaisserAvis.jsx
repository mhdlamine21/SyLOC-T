import { useEffect, useState } from 'react';
import { Card, SectionHeader, Button, Field, Select, Textarea, PageWrapper } from '../common/ui';
import { getLocaux } from '../../api/patrimoine';
import { createAvis } from '../../api/avis';
import toast from 'react-hot-toast';
import StarIcon from '@mui/icons-material/StarRounded';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import localFallbackImg from '../../assets/local_croust.jpeg';

const StarRating = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            style={{
              cursor: 'pointer',
              color: (hover || value) >= star ? 'var(--gold, #c9a15c)' : 'var(--border)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hover === star ? 'scale(1.2)' : 'scale(1)',
              display: 'flex',
              padding: 4,
            }}
          >
            {(hover || value) >= star ? <StarIcon style={{ fontSize: 32 }} /> : <StarBorderIcon style={{ fontSize: 32 }} />}
          </div>
        ))}
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gold)', background: 'var(--surface-2)', padding: '6px 12px', borderRadius: 8 }}>
        {value === 1 && "1/5 — Inacceptable"}
        {value === 2 && "2/5 — Médiocre"}
        {value === 3 && "3/5 — Moyen"}
        {value === 4 && "4/5 — Très bien"}
        {value === 5 && "5/5 — Excellent"}
      </span>
    </div>
  );
};

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
    if (commentaire.trim().length < 20) {
      toast.error('Règle anti-fraude : Votre avis doit faire au moins 20 caractères.');
      return;
    }
    if (!localId) {
      toast.error('Veuillez sélectionner un local à évaluer.');
      return;
    }

    setLoading(true);
    try {
      await createAvis({ local: localId, note_etoiles: Number(note), commentaire });
      toast.success(`Votre avis a été soumis avec succès (Note : ${note}/5) !`);
      setCommentaire('');
      setNote(5);
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.detail || data?.commentaire?.[0] || "Erreur lors de l'envoi de votre avis.");
    } finally {
      setLoading(false);
    }
  };

  const charsLeft = Math.max(0, 20 - commentaire.length);

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Vie Étudiante & Restauration"
        title="Évaluer une Cantine ou Restauration (LR-18)"
        subtitle="Dépôt d'un avis vérifié soumis aux 4 règles d'intégrité anti-fraude du CROUS-T."
      />

      <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: 32, alignItems: 'flex-start', marginTop: 24 }}>
        
        {/* Formulaire (Main content) */}
        <Card style={{ flex: '1 1 min(100%, 500px)', padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, var(--gold), var(--navy))' }} />
          
          <h2 style={{ fontSize: 18, color: 'var(--text-navy)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', background: 'var(--gold)', color: 'var(--text-on-gold)', borderRadius: '50%', padding: 6 }}>
              <StarIcon style={{ fontSize: 20 }} />
            </div>
            Partagez votre expérience
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Field label="Cantine / Local évalué *" required>
              <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, snapType: 'x mandatory' }}>
                {locaux.length === 0 && <span style={{ color: 'var(--muted)' }}>Aucun local disponible</span>}
                {locaux.map((l) => (
                  <div 
                    key={l.id} 
                    onClick={() => setLocalId(l.id)}
                    style={{ 
                      flex: '0 0 auto', width: 150, cursor: 'pointer', borderRadius: 12, 
                      border: localId === l.id ? '2px solid var(--gold)' : '1px solid var(--border)', 
                      background: 'var(--surface)', overflow: 'hidden', transition: 'all 0.2s', 
                      opacity: localId === l.id ? 1 : 0.6,
                      transform: localId === l.id ? 'scale(1.02)' : 'scale(1)',
                      scrollSnapAlign: 'start'
                    }}>
                    <img 
                      src={l.photo_url || localFallbackImg} 
                      alt="Local" 
                      style={{ width: '100%', height: 90, objectFit: 'cover' }} 
                    />
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-navy)' }}>{l.reference}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {l.designation || l.type_local}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Field>

            {localId && locaux.length > 0 && (() => {
              const localChoisi = locaux.find((l) => l.id === localId);
              if (!localChoisi) return null;
              return (
                <div style={{
                  display: 'flex', gap: 14, alignItems: 'center',
                  background: 'var(--surface-2)', border: '1px solid var(--gold)',
                  borderRadius: 12, padding: 12,
                }}>
                  <img
                    src={localChoisi.photo_url || localFallbackImg}
                    alt={`Photo du local ${localChoisi.reference}`}
                    style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 10, flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <RestaurantOutlinedIcon style={{ fontSize: 16, color: 'var(--gold)' }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold-deep, var(--gold))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Vous évaluez bien ce local
                      </span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-navy)' }}>{localChoisi.reference}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                      {localChoisi.designation || localChoisi.type_local} — {localChoisi.localisation || 'Campus VCN'}
                    </div>
                  </div>
                </div>
              );
            })()}

            <Field label="Note globale *" required>
              <StarRating value={note} onChange={setNote} />
            </Field>

            <Field 
              label="Votre commentaire détaillé *" 
              required 
              hint={charsLeft > 0 ? `Plus que ${charsLeft} caractère(s) requis.` : 'Longueur valide.'}
            >
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={5}
                placeholder="Racontez-nous votre expérience : qualité des repas, accueil, temps d'attente..."
                style={{
                  resize: 'none',
                  borderColor: charsLeft > 0 && commentaire.length > 0 ? 'var(--gold)' : 'var(--border)'
                }}
                required
              />
            </Field>

            <Button variant="primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', padding: '0 32px' }}>
              {loading ? 'Envoi en cours…' : 'Publier mon Avis Vérifié'}
            </Button>
          </form>
        </Card>

        {/* Règles Anti-Fraude (Sidebar) */}
        <div style={{ flex: '1 1 300px', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.05, transform: 'rotate(15deg)' }}>
               <GppGoodOutlinedIcon style={{ fontSize: 120, color: 'var(--navy)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(201, 161, 92, 0.15)', padding: 8, borderRadius: 8, color: 'var(--gold)', display: 'flex' }}>
                 <GppGoodOutlinedIcon fontSize="small" />
              </div>
              <h3 style={{ fontSize: 15, margin: 0, color: 'var(--text-navy)', fontWeight: 800 }}>Règles d'Intégrité</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 20 }}>
              Pour garantir la fiabilité des avis sur le campus, nous appliquons un protocole strict de vérification.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: 0, padding: 0, listStyle: 'none', position: 'relative', zIndex: 1 }}>
              {[
                'Réservé aux étudiants inscrits et vérifiés.',
                'Commentaire de 20 caractères minimum pour être constructif.',
                'Un seul avis par cantine et par jour max.',
                'Modération préalable et automatique des termes inappropriés.'
              ].map((rule, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5, color: 'var(--text-navy)' }}>
                  <CheckCircleOutlinedIcon style={{ fontSize: 18, color: 'var(--green)', marginTop: 1 }} />
                  <span style={{ lineHeight: 1.4 }}>{rule}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
