import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { changerStatutDemande, getDemandes, partagerDossier } from '../../api/demandes';
import { getUtilisateurs } from '../../api/comptes';
import { messageErreur } from '../../api/utils';
import {
  AlertBanner, Button, Card, Field, Input, LoadingState, Modal, Select, StatusBadge, Textarea, PageWrapper, SectionHeader,
} from '../common/ui';
import { STATUTS_DEMANDE, TYPES_DEMANDE_LABELS } from '../../utils/constants';

const STATUTS_ARCHIVES = ['DEFAVORABLE', 'MITIGEE_ARCHIVEE', 'CONTRAT_REFUSE'];

const MOTIFS = [
  { value: 'AVIS_DEFAVORABLE', label: 'Avis défavorable rendu sur le dossier' },
  { value: 'MANQUE_PIECES', label: 'Manque de dossier / pièces justificatives' },
  { value: 'AUTRE', label: 'Autre motif (à préciser)' },
];

export default function ArchivesDossiers() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [aArchiver, setAArchiver] = useState(null);
  const [aPartager, setAPartager] = useState(null);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [ciblePartage, setCiblePartage] = useState('');
  const [motif, setMotif] = useState(MOTIFS[0].value);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [data, users] = await Promise.all([
        getDemandes(),
        getUtilisateurs().catch(() => []),
      ]);
      setDemandes(data);
      if (users && users.results) {
        setUtilisateurs(users.results);
      } else if (Array.isArray(users)) {
        setUtilisateurs(users);
      }
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur de chargement des archives.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const archivees = useMemo(() => {
    const term = q.trim().toLowerCase();
    return demandes
      .filter((d) => STATUTS_ARCHIVES.includes(d.statut))
      .filter((d) => !term
        || (d.reference_anonyme || '').toLowerCase().includes(term)
        || (d.demandeur_nom || '').toLowerCase().includes(term)
        || (d.local_reference || '').toLowerCase().includes(term));
  }, [demandes, q]);

  const archivables = useMemo(
    () => demandes.filter((d) => !STATUTS_ARCHIVES.includes(d.statut)),
    [demandes],
  );

  const ouvrirArchivage = (d) => {
    setAArchiver(d);
    setMotif(MOTIFS[0].value);
    setCommentaire('');
  };

  const ouvrirPartage = (d) => {
    setAPartager(d);
    setCiblePartage(utilisateurs.length > 0 ? utilisateurs[0].id : '');
    setCommentaire('');
  };

  const confirmerArchivage = async (e) => {
    e.preventDefault();
    if (motif === 'AUTRE' && (!commentaire || commentaire.trim().length < 5)) {
      toast.error('Merci de préciser le motif (min. 5 caractères) pour "Autre".');
      return;
    }
    setSubmitting(true);
    try {
      const libelleMotif = MOTIFS.find((m) => m.value === motif)?.label;
      const note = `[Motif d'archivage : ${libelleMotif}]${commentaire ? ` ${commentaire}` : ''}`;
      await changerStatutDemande(aArchiver.id, STATUTS_DEMANDE.MITIGEE_ARCHIVEE, note);
      toast.success('Dossier archivé avec succès.');
      setAArchiver(null);
      await charger();
    } catch (err) {
      toast.error(messageErreur(err, "L'archivage du dossier a échoué."));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmerPartage = async (e) => {
    e.preventDefault();
    if (!ciblePartage) {
      toast.error("Veuillez sélectionner un utilisateur.");
      return;
    }
    setSubmitting(true);
    try {
      await partagerDossier(aPartager.id, ciblePartage, commentaire);
      toast.success('Dossier partagé avec succès.');
      setAPartager(null);
    } catch (err) {
      toast.error(messageErreur(err, "Le partage a échoué."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Bureau du Courrier & Réception"
        title="Archivage des dossiers"
        subtitle="Archivage définitif des dossiers rejetés, retournés aux candidats ou non-conformes."
      />

      <div style={{ marginTop: 24 }}>
        {/* En-tête Registre & Barre de recherche */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 16px', gap: 14, flexWrap: 'wrap' }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--text-navy)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--slate-soft)',
                color: 'var(--navy)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <InventoryOutlinedIcon style={{ fontSize: 20 }} />
            </span>
            Registre des dossiers archivés ({archivees.length})
          </h3>
          <div style={{ position: 'relative', minWidth: 260, flex: '0 1 320px' }}>
            <SearchOutlinedIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--muted)' }} />
            <Input
              placeholder="Rechercher un dossier, demandeur…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ paddingLeft: 38, background: 'var(--surface-2)', borderRadius: 10 }}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState label="Chargement des archives…" />
        ) : archivees.length === 0 ? (
          <AlertBanner type="info">Aucun dossier archivé pour le moment.</AlertBanner>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 20, marginBottom: 36 }}>
            {archivees.map((d) => (
              <Card
                key={d.id}
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 16px rgba(15, 27, 61, 0.05)',
                  borderRadius: 18,
                  transition: 'transform .25s var(--ease-premium), box-shadow .25s var(--ease-premium), border-color .25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(23, 37, 84, 0.12)';
                  e.currentTarget.style.borderColor = 'var(--gold)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 27, 61, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <div style={{ height: 4, background: 'linear-gradient(90deg, var(--slate) 0%, var(--red) 100%)' }} />

                <div
                  style={{
                    padding: '12px 18px',
                    background: 'var(--surface-2)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--text-navy)',
                      letterSpacing: '.4px',
                      background: 'var(--surface)',
                      padding: '4px 9px',
                      borderRadius: 7,
                      border: '1px solid var(--border)',
                    }}
                  >
                    {d.reference_anonyme || `DOSSIER-${String(d.id).slice(0, 8).toUpperCase()}`}
                  </span>
                  <StatusBadge statut={d.statut} />
                </div>

                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16.5,
                      fontWeight: 800,
                      margin: 0,
                      color: 'var(--text-navy)',
                      lineHeight: 1.3,
                    }}
                  >
                    {TYPES_DEMANDE_LABELS[d.type_demande] || d.type_demande}
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gap: 9,
                      fontSize: 12.5,
                      background: 'var(--surface-2)',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <PersonOutlineOutlinedIcon style={{ fontSize: 16, color: 'var(--slate)' }} />
                      <span style={{ color: 'var(--muted)' }}>
                        Demandeur : <strong style={{ color: 'var(--text-navy)', fontWeight: 700 }}>{d.demandeur_nom || '-'}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <CalendarTodayOutlinedIcon style={{ fontSize: 16, color: 'var(--slate)' }} />
                      <span style={{ color: 'var(--muted)' }}>
                        Reçu le : <strong style={{ color: 'var(--text-navy)', fontWeight: 700 }}>{d.date_depot ? new Date(d.date_depot).toLocaleDateString('fr-FR') : '-'}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <ApartmentOutlinedIcon style={{ fontSize: 16, color: 'var(--slate)' }} />
                      <span style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        Local visé :
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            fontSize: 11.5,
                            color: 'var(--gold-deep)',
                            background: 'var(--gold-soft)',
                            border: '1px solid var(--gold-tint-2)',
                            padding: '2px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {d.local_reference || d.local || 'Non précisé'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {d.commentaire_dcuve && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        lineHeight: 1.5,
                        color: 'var(--muted)',
                        padding: '10px 12px',
                        borderRadius: '0 8px 8px 0',
                        background: 'var(--surface-2)',
                        borderLeft: '3px solid var(--red)',
                        fontStyle: 'italic',
                      }}
                    >
                      {d.commentaire_dcuve}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => ouvrirPartage(d)}
                      style={{ width: '100%', justifyContent: 'center', borderRadius: 10, fontWeight: 700 }}
                    >
                      <ShareOutlinedIcon style={{ fontSize: 16 }} /> Partager
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Section Archiver un dossier */}
        <div style={{ margin: '36px 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--red-soft)',
              color: 'var(--red)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <ArchiveOutlinedIcon style={{ fontSize: 20 }} />
          </span>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-navy)', margin: 0 }}>
              Archiver un dossier
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
              Sélectionnez un dossier actif à classer aux archives avec justification obligatoire.
            </p>
          </div>
        </div>

        {archivables.length === 0 ? (
          <AlertBanner type="info">Tous les dossiers connus sont déjà archivés.</AlertBanner>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 20 }}>
            {archivables.map((d) => (
              <Card
                key={d.id}
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 16px rgba(15, 27, 61, 0.05)',
                  borderRadius: 18,
                  transition: 'transform .25s var(--ease-premium), box-shadow .25s var(--ease-premium), border-color .25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(220, 38, 38, 0.12)';
                  e.currentTarget.style.borderColor = 'var(--red)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 27, 61, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <div
                  style={{
                    padding: '12px 18px',
                    background: 'var(--surface-2)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--text-navy)',
                      letterSpacing: '.4px',
                      background: 'var(--surface)',
                      padding: '4px 9px',
                      borderRadius: 7,
                      border: '1px solid var(--border)',
                    }}
                  >
                    {d.reference_anonyme || `DOSSIER-${String(d.id).slice(0, 8).toUpperCase()}`}
                  </span>
                  <StatusBadge statut={d.statut} />
                </div>

                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16,
                      fontWeight: 800,
                      margin: 0,
                      color: 'var(--text-navy)',
                    }}
                  >
                    {TYPES_DEMANDE_LABELS[d.type_demande] || d.type_demande}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--muted)' }}>
                    <PersonOutlineOutlinedIcon style={{ fontSize: 16, color: 'var(--slate)' }} />
                    <span>Demandeur : <strong style={{ color: 'var(--text-navy)' }}>{d.demandeur_nom || '-'}</strong></span>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => ouvrirArchivage(d)}
                      style={{ width: '100%', justifyContent: 'center', borderRadius: 10, fontWeight: 700 }}
                    >
                      <ArchiveOutlinedIcon style={{ fontSize: 16 }} /> Archiver ce dossier
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {aArchiver && (
          <Modal
            open={!!aArchiver}
            onClose={() => setAArchiver(null)}
            title={`Archiver le dossier ${aArchiver.reference_anonyme || `DOSSIER-${String(aArchiver.id).slice(0, 8).toUpperCase()}`}`}
            size="md"
          >
            <form onSubmit={confirmerArchivage} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Motif de l'archivage" required>
                <Select value={motif} onChange={(e) => setMotif(e.target.value)} style={{ borderRadius: 10 }}>
                  {MOTIFS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </Select>
              </Field>
              <Field
                label={motif === 'AUTRE' ? 'Précisez le motif' : 'Commentaire complémentaire'}
                hint="Conservé dans l'historique du dossier"
                required={motif === 'AUTRE'}
              >
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={3}
                  placeholder="Détails du motif d'archivage…"
                  style={{ borderRadius: 10 }}
                />
              </Field>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <Button variant="secondary" size="md" type="button" onClick={() => setAArchiver(null)}>Annuler</Button>
                <Button variant="danger" size="md" type="submit" disabled={submitting}>
                  {submitting ? 'Archivage…' : 'Confirmer l’archivage'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {aPartager && (
          <Modal
            open={!!aPartager}
            onClose={() => setAPartager(null)}
            title={`Partager le dossier ${aPartager.reference_anonyme || `DOSSIER-${String(aPartager.id).slice(0, 8).toUpperCase()}`}`}
            size="md"
          >
            <form onSubmit={confirmerPartage} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Utilisateur destinataire" required>
                <Select
                  value={ciblePartage}
                  onChange={(e) => setCiblePartage(e.target.value)}
                  style={{ borderRadius: 10 }}
                >
                  <option value="" disabled>Sélectionner un utilisateur</option>
                  {utilisateurs.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nom_complet || u.username} ({u.role.replace(/_/g, ' ')})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Message optionnel" hint="Sera inclus dans la notification envoyée">
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={3}
                  placeholder="Bonjour, voici le dossier demandé..."
                  style={{ borderRadius: 10 }}
                />
              </Field>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <Button variant="secondary" size="md" type="button" onClick={() => setAPartager(null)}>Annuler</Button>
                <Button variant="primary" size="md" type="submit" disabled={submitting || !ciblePartage}>
                  {submitting ? 'Partage…' : 'Partager'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </PageWrapper>
  );
}
