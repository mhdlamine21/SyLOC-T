import { useState, useEffect, useRef } from 'react';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import FormatPaintOutlinedIcon from '@mui/icons-material/FormatPaintOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { Card, SectionHeader, Button, Field, Textarea, PageWrapper, AlertBanner, LoadingState } from '../common/ui';
import { createPlainte, getPlaintes } from '../../api/terrain';
import { getContrats } from '../../api/contrats';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

/** Niveaux d'urgence presentes sous forme de cartes cliquables (plus lisible qu'un <select>). */
const NIVEAUX_URGENCE = [
  {
    value: 'ELEVEE',
    titre: 'Élevée',
    exemple: 'Fuite importante, coupure électrique, porte forcée',
    icone: BoltOutlinedIcon,
    couleur: 'var(--red)',
    fond: 'var(--red-soft)',
  },
  {
    value: 'MOYENNE',
    titre: 'Moyenne',
    exemple: 'Serrure défectueuse, fissure, plomberie lente',
    icone: HandymanOutlinedIcon,
    couleur: 'var(--gold-deep)',
    fond: 'var(--gold-soft)',
  },
  {
    value: 'FAIBLE',
    titre: 'Faible',
    exemple: 'Entretien préventif, retouche de peinture',
    icone: FormatPaintOutlinedIcon,
    couleur: 'var(--slate)',
    fond: 'var(--slate-soft)',
  },
];

const LONGUEUR_MIN = 20;

export default function SignalerProbleme() {
  const { role } = useAuth();
  const [description, setDescription] = useState('');
  const [urgence, setUrgence] = useState('MOYENNE');
  const [photo, setPhoto] = useState(null);
  const [apercu, setApercu] = useState('');
  const [contrat, setContrat] = useState(null);
  const [localisation, setLocalisation] = useState('');
  const [mesPlaintes, setMesPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(false);
  const fichierRef = useRef(null);

  const chargerDonnees = async () => {
    try {
      const [cData, pData] = await Promise.all([
        getContrats().catch(() => []),
        getPlaintes().catch(() => []),
      ]);
      if (cData && cData.length > 0) setContrat(cData[0]);
      const list = Array.isArray(pData) ? pData : (pData?.results || []);
      setMesPlaintes(list.filter((p) => p.type === 'TECHNIQUE'));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Libere l'URL objet de l'apercu pour eviter une fuite memoire.
  useEffect(() => () => { if (apercu) URL.revokeObjectURL(apercu); }, [apercu]);

  const choisirPhoto = (fichier) => {
    if (apercu) URL.revokeObjectURL(apercu);
    if (!fichier) {
      setPhoto(null);
      setApercu('');
      return;
    }
    setPhoto(fichier);
    setApercu(URL.createObjectURL(fichier));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contrat && !localisation.trim()) {
      return toast.error('Veuillez préciser le lieu du dysfonctionnement.');
    }
    if (description.trim().length < LONGUEUR_MIN) {
      return toast.error(`Décrivez l'incident en ${LONGUEUR_MIN} caractères minimum.`);
    }
    setEnvoi(true);
    try {
      const formData = new FormData();
      formData.append('type', 'TECHNIQUE');
      formData.append('urgence', urgence);
      formData.append('description', description);
      if (contrat) formData.append('local', contrat.local);
      else formData.append('localisation_libre', localisation);
      if (photo) formData.append('photo_preuve', photo);

      await createPlainte(formData);
      toast.success('Signalement transmis au Service Technique du CROUS-T.');
      setSucces(true);
      setDescription('');
      setLocalisation('');
      setUrgence('MOYENNE');
      choisirPhoto(null);
      if (fichierRef.current) fichierRef.current.value = '';
      chargerDonnees();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors du signalement.');
    } finally {
      setEnvoi(false);
    }
  };

  const restant = Math.max(LONGUEUR_MIN - description.trim().length, 0);

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Assistance & Service Technique"
        title="Signaler un dysfonctionnement"
        subtitle={
          contrat
            ? 'Votre signalement est rattaché automatiquement à votre bail domanial actif.'
            : 'Déclaration d’un incident technique constaté sur le campus.'
        }
      />

      {loading ? (
        <LoadingState label="Chargement de votre espace…" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(340px, 1.5fr) minmax(260px, .9fr)',
              gap: 24,
              alignItems: 'start',
            }}
          >
            {/* ─────────── Formulaire ─────────── */}
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '20px 26px',
                  background: 'linear-gradient(135deg, var(--navy) 0%, #142a5c 100%)',
                  color: 'var(--text-on-navy)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <BuildOutlinedIcon style={{ fontSize: 26, color: 'var(--gold)' }} />
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: 0, fontWeight: 800 }}>
                    Nouveau signalement
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, opacity: 0.85 }}>
                    Trois informations suffisent : le lieu, l’urgence et la description.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 18 }}>
                {succes && (
                  <div
                    style={{
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      padding: 14, borderRadius: 12,
                      background: 'var(--green-soft)', border: '1px solid var(--green)',
                    }}
                  >
                    <TaskAltOutlinedIcon style={{ fontSize: 20, color: 'var(--green)', flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-navy)', lineHeight: 1.6 }}>
                      Signalement enregistré. Le Service Technique le prend en charge et vous
                      pourrez suivre son avancement depuis votre espace.
                    </p>
                  </div>
                )}

                {/* Lieu */}
                {contrat ? (
                  <AlertBanner type="info">
                    <strong>Rattachement automatique :</strong> ce signalement concerne votre local{' '}
                    <strong>{contrat.local_reference || contrat.local}</strong>.
                  </AlertBanner>
                ) : (
                  <Field label="Lieu exact du dysfonctionnement *" required hint="Soyez précis : bâtiment, étage, numéro de porte.">
                    <div style={{ position: 'relative' }}>
                      <PlaceOutlinedIcon
                        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--slate)' }}
                      />
                      <input
                        type="text"
                        value={localisation}
                        onChange={(e) => setLocalisation(e.target.value)}
                        placeholder="Ex : Bâtiment A - toilettes 2ᵉ étage"
                        style={{
                          width: '100%', padding: '12px 14px 12px 38px', borderRadius: 10,
                          border: '1px solid var(--border)', background: 'var(--surface)',
                          color: 'var(--text)', fontSize: 14,
                        }}
                        required
                      />
                    </div>
                  </Field>
                )}

                {/* Urgence - cartes cliquables */}
                <Field label="Niveau d’urgence *" required>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                    {NIVEAUX_URGENCE.map((n) => {
                      const Icone = n.icone;
                      const actif = urgence === n.value;
                      return (
                        <button
                          key={n.value}
                          type="button"
                          onClick={() => setUrgence(n.value)}
                          aria-pressed={actif}
                          style={{
                            textAlign: 'left', cursor: 'pointer',
                            padding: '12px 14px', borderRadius: 12,
                            background: actif ? n.fond : 'var(--surface)',
                            border: `1.5px solid ${actif ? n.couleur : 'var(--border)'}`,
                            boxShadow: actif ? 'var(--shadow-sm)' : 'none',
                            transition: 'all .2s var(--ease-premium)',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Icone style={{ fontSize: 18, color: n.couleur }} />
                            <span style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--text-navy)' }}>{n.titre}</span>
                          </span>
                          <span style={{ display: 'block', marginTop: 6, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.45 }}>
                            {n.exemple}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Description */}
                <Field label="Description détaillée de l’incident *" required>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Que constatez-vous exactement ? Depuis quand ? Y a-t-il un risque pour les personnes ou les biens ?"
                    required
                  />
                  <div style={{ marginTop: 6, fontSize: 11.5, color: restant > 0 ? 'var(--gold-deep)' : 'var(--green)' }}>
                    {restant > 0
                      ? `Encore ${restant} caractère${restant > 1 ? 's' : ''} pour une description exploitable.`
                      : 'Description suffisamment détaillée ✓'}
                  </div>
                </Field>

                {/* Photo */}
                <Field label="Photo de constat (optionnel)" hint="Une image accélère nettement le diagnostic technique.">
                  {apercu ? (
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: 12, borderRadius: 12,
                        border: '1px solid var(--border)', background: 'var(--surface-2)',
                      }}
                    >
                      <img
                        src={apercu}
                        alt="Aperçu du constat"
                        style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {photo?.name}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--muted)' }}>
                          {photo ? `${(photo.size / 1024).toFixed(0)} Ko` : ''}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => { choisirPhoto(null); if (fichierRef.current) fichierRef.current.value = ''; }}
                      >
                        <DeleteOutlineOutlinedIcon style={{ fontSize: 17 }} /> Retirer
                      </Button>
                    </div>
                  ) : (
                    <label
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        padding: '22px 16px', borderRadius: 12, cursor: 'pointer',
                        border: '1.5px dashed var(--gold)', background: 'var(--gold-tint)',
                        textAlign: 'center',
                      }}
                    >
                      <PhotoCameraOutlinedIcon style={{ fontSize: 24, color: 'var(--gold-deep)' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-navy)' }}>
                        Ajouter une photo du dysfonctionnement
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>JPEG ou PNG - 5 Mo maximum</span>
                      <input
                        ref={fichierRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => choisirPhoto(e.target.files?.[0] || null)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </Field>

                <Button
                  variant="navy"
                  type="submit"
                  disabled={envoi}
                  style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                >
                  {envoi ? 'Transmission en cours…' : 'Transmettre au Service Technique'}
                </Button>
              </form>
            </Card>

            {/* ─────────── Colonne d'aide ─────────── */}
            <div style={{ display: 'grid', gap: 20 }}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <SupportAgentOutlinedIcon style={{ fontSize: 20, color: 'var(--gold-deep)' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, margin: 0, fontWeight: 800, color: 'var(--text-navy)' }}>
                    Que se passe-t-il ensuite ?
                  </h3>
                </div>
                <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
                  {[
                    'Votre signalement arrive immédiatement au Service Technique.',
                    'Le Service Technique affecte un technicien qualifié (électricien, plombier...).',
                    'L’intervention est réalisée et votre signalement passe en statut « Traité ».',
                  ].map((etape, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span
                        style={{
                          width: 22, height: 22, flexShrink: 0, borderRadius: '50%',
                          display: 'grid', placeItems: 'center',
                          background: 'var(--navy)', color: 'var(--gold)',
                          fontSize: 11.5, fontWeight: 800,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 12.5, color: 'var(--slate)', lineHeight: 1.6 }}>{etape}</span>
                    </li>
                  ))}
                </ol>
              </Card>

              <Card style={{ background: 'var(--gold-soft)', border: '1px solid var(--gold)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, margin: '0 0 10px', fontWeight: 800, color: 'var(--text-navy)' }}>
                  Pour un traitement plus rapide
                </h3>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 7 }}>
                  {[
                    'Indiquez le lieu exact plutôt qu’une zone approximative.',
                    'Précisez depuis quand le problème est constaté.',
                    'Joignez une photo nette prise de face.',
                    'Réservez l’urgence « Élevée » aux risques réels.',
                  ].map((astuce) => (
                    <li key={astuce} style={{ fontSize: 12.5, color: 'var(--slate)', lineHeight: 1.55 }}>{astuce}</li>
                  ))}
                </ul>
              </Card>

              {(role === 'USAGER' || role === 'OCCUPANT') && (
                <Card>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--slate)', lineHeight: 1.65 }}>
                    <strong style={{ color: 'var(--text-navy)' }}>Urgence vitale ou danger immédiat ?</strong>
                    <br />
                    Ne passez pas par ce formulaire : contactez directement le poste de sécurité du campus.
                  </p>
                </Card>
              )}
            </div>
          </div>

          {/* ─────────── Liste & Suivi des signalements de l'occupant ─────────── */}
          <Card style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, margin: 0, fontWeight: 800, color: 'var(--text-navy)' }}>
                  Suivi de mes signalements
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
                  Visualisez en direct l'avancement et la résolution de vos incidents techniques.
                </p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: 99 }}>
                {mesPlaintes.length} signalement(s)
              </span>
            </div>

            {mesPlaintes.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '32px 16px', background: 'var(--surface-2)',
                borderRadius: 12, border: '1px dashed var(--border)',
              }}>
                <MarkEmailReadOutlinedIcon style={{ fontSize: 36, color: 'var(--muted)', marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                  Vous n'avez aucun signalement en cours.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {mesPlaintes.map((p) => {
                  const estTraite = p.statut === 'RESOLUE';
                  const estEnCours = p.statut === 'EN_COURS_TRAITEMENT';
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                        padding: '14px 18px', borderRadius: 12,
                        border: estTraite
                          ? '1.5px solid var(--green, #16a34a)'
                          : estEnCours
                          ? '1.5px solid var(--gold, #c9a15c)'
                          : '1px solid var(--border)',
                        background: estTraite
                          ? 'var(--green-soft, #f0fdf4)'
                          : 'var(--surface, #ffffff)',
                        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 240 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color: 'var(--navy)' }}>
                            {p.local_reference || p.local || 'Local'}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                            background: p.urgence === 'ELEVEE' ? 'var(--red-soft)' : 'var(--slate-soft)',
                            color: p.urgence === 'ELEVEE' ? 'var(--red)' : 'var(--slate)',
                          }}>
                            Urgence {p.urgence}
                          </span>
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-navy)' }}>
                          {p.description}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
                          Déposé le {p.date_creation ? new Date(p.date_creation).toLocaleDateString('fr-FR') : '-'}
                          {estTraite && p.date_resolution && (
                            <span> · Traité le {new Date(p.date_resolution).toLocaleDateString('fr-FR')}</span>
                          )}
                        </div>
                      </div>

                      {/* Statut visible */}
                      <div>
                        {estTraite ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 20,
                            background: '#16a34a', color: '#ffffff',
                            fontWeight: 700, fontSize: 12.5,
                            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                          }}>
                            <CheckCircleOutlinedIcon style={{ fontSize: 16 }} />
                            Signalement traité
                          </div>
                        ) : estEnCours ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 20,
                            background: 'var(--gold-soft, #fef3c7)', color: 'var(--gold-deep, #92400e)',
                            fontWeight: 700, fontSize: 12.5,
                            border: '1px solid var(--gold, #d97706)',
                          }}>
                            <HourglassEmptyOutlinedIcon style={{ fontSize: 16 }} />
                            En cours de traitement
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 20,
                            background: 'var(--surface-2, #f1f5f9)', color: 'var(--slate, #475569)',
                            fontWeight: 600, fontSize: 12,
                            border: '1px solid var(--border)',
                          }}>
                            Transmis au Service Technique
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </PageWrapper>
  );
}
