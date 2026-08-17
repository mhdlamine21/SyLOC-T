import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertBanner, Button, Card, EmptyState, Field, LoadingState, Modal,
  PageWrapper, SectionHeader, Select, StatusBadge, Textarea,
} from '../common/ui';
import { changerStatutDemande, getDemandes, getDossiers } from '../../api/demandes';
import { messageErreur } from '../../api/utils';
import {
  STATUTS_DEMANDE, STATUTS_DEMANDE_LABELS, TYPES_DEMANDE_LABELS,
} from '../../utils/constants';
import DocumentPreviewModal from './DocumentPreviewModal';

const STATUTS_A_TRAITER = [
  STATUTS_DEMANDE.NOUVELLE,
];

const ORIENTATIONS = [
  {
    value: STATUTS_DEMANDE.CONTROLE_RECEVABILITE,
    label: 'Pièces complètes - dossier conforme, transmettre à la DCUVE',
    succes: 'Dossier transmis au Directeur DCUVE pour instruction.',
    destination: 'DCUVE',
    avis: 'FAVORABLE',
    btnLabel: 'Transmettre à la DCUVE →',
    btnVariant: 'primary',
    infoText: 'Dossier complet : pièces conformes, transmission à la DCUVE pour instruction.',
  },
  {
    value: STATUTS_DEMANDE.MITIGEE_COMPLEMENT,
    label: 'Pièces manquantes - retourner au candidat pour complétion',
    succes: 'Demande de pièces manquantes notifiée au candidat.',
    destination: 'CANDIDAT',
    avis: 'DEFAVORABLE',
    piecesManquantes: true,
    btnLabel: 'Retourner au candidat pour pièces manquantes',
    btnVariant: 'amber',
    infoText: 'Pièces manquantes : demande de pièces complémentaires renvoyée au candidat.',
  },
  {
    value: STATUTS_DEMANDE.DEFAVORABLE,
    label: 'Dossier irrecevable - non complété après plusieurs relances (Archivage direct)',
    succes: 'Dossier classé irrecevable et archivé directement.',
    destination: 'ARCHIVES',
    avis: 'DEFAVORABLE',
    requiresMotif: true,
    requiresMultipleRenvois: true,
    btnLabel: 'Archiver directement le dossier',
    btnVariant: 'danger',
    infoText: 'Dossier irrecevable : non complété après relances, archivage direct.',
  },
];

const joursDepuis = (date) => {
  if (!date) return null;
  const ms = Date.now() - new Date(date).getTime();
  return Math.max(Math.floor(ms / 86400000), 0);
};

function BannetteStat({ icone: Icone, valeur, libelle, accent, iconBg }) {
  return (
    <div
      style={{
        flex: '1 1 160px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 18px',
        borderRadius: 14,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.2s var(--ease-premium), box-shadow 0.2s var(--ease-premium)',
      }}
    >
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          background: iconBg || 'var(--surface)',
          color: accent,
          border: '1px solid var(--border)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        <Icone style={{ fontSize: 20 }} />
      </span>
      <span>
        <span
          style={{
            display: 'block',
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1.1,
            color: 'var(--text-navy)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {valeur}
        </span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>
          {libelle}
        </span>
      </span>
    </div>
  );
}

export default function BureauCourrierView() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [orientation, setOrientation] = useState(ORIENTATIONS[0].value);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [dossier, setDossier] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDemandes();
      setDemandes(data);
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur de chargement du courrier entrant.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const aTraiter = useMemo(
    () => demandes.filter((d) => STATUTS_A_TRAITER.includes(d.statut)),
    [demandes],
  );

  const nbNouveaux = aTraiter.filter((d) => (d.nb_renvois || 0) === 0).length;
  const nbResoumis = aTraiter.filter((d) => (d.nb_renvois || 0) > 0).length;

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return aTraiter
      .filter((d) => {
        if (filtreStatut === 'NOUVEAUX') return (d.nb_renvois || 0) === 0;
        if (filtreStatut === 'RESOUMIS') return (d.nb_renvois || 0) > 0;
        return true;
      })
      .filter((d) => {
        if (!q) return true;
        return [
          d.reference_anonyme,
          d.demandeur_nom,
          d.local_reference,
          d.local,
          TYPES_DEMANDE_LABELS[d.type_demande] || d.type_demande,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      })
      .sort((a, b) => new Date(a.date_depot || 0) - new Date(b.date_depot || 0));
  }, [aTraiter, recherche, filtreStatut]);

  const ouvrirTraitement = async (demande) => {
    setSelected(demande);
    setOrientation(ORIENTATIONS[0].value);
    setCommentaire('');
    setDossier(null);
    try {
      const data = await getDossiers({ demande: demande.id });
      if (data && data.length > 0) setDossier(data[0]);
    } catch {
      toast.error('Impossible de charger les pièces jointes.');
    }
  };

  const orientationsDisponibles = useMemo(() => {
    if (!selected) return ORIENTATIONS;
    const nbRenvois = selected.nb_renvois || 0;
    return ORIENTATIONS.filter((o) => !o.requiresMultipleRenvois || nbRenvois > 1);
  }, [selected]);

  const choixCourant = ORIENTATIONS.find((o) => o.value === orientation);

  const handleTraiter = async (e) => {
    e.preventDefault();
    if (!selected) return;

    const choix = ORIENTATIONS.find((o) => o.value === orientation);
    if (choix?.requiresMotif && (!commentaire || commentaire.trim().length < 5)) {
      toast.error("Un motif d'irrecevabilité (min. 5 caractères) est obligatoire pour archiver le dossier.");
      return;
    }

    setSubmitting(true);
    try {
      await changerStatutDemande(selected.id, orientation, commentaire);
      toast.success(choix?.succes || 'Dossier traité.');
      setSelected(null);
      await charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Le traitement du courrier a échoué.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Bureau du Courrier & Réception"
        title="Registre du courrier d’arrivée"
        subtitle="Point d’entrée officiel des dossiers d’occupation : contrôle préliminaire des pièces, puis transmission à la DCUVE ou demande de complément."
      />

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 22,
          marginBottom: 24,
          boxShadow: 'var(--shadow)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              background: 'var(--navy)',
              color: 'var(--gold)',
              boxShadow: '0 4px 12px rgba(23, 37, 84, 0.15)',
            }}
          >
            <InboxOutlinedIcon style={{ fontSize: 22 }} />
          </span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text-navy)',
              }}
            >
              Bannette d’arrivée
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--muted)' }}>
              Les plis les plus anciens sont présentés en premier.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={charger} disabled={loading}>
            <RefreshOutlinedIcon style={{ fontSize: 17 }} /> Actualiser
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
          <BannetteStat
            icone={MarkEmailUnreadOutlinedIcon}
            valeur={nbNouveaux}
            libelle="Nouveaux dépôts"
            accent="var(--navy)"
            iconBg="var(--slate-soft)"
          />
          <BannetteStat
            icone={PendingActionsOutlinedIcon}
            valeur={nbResoumis}
            libelle="Re-soumissions (après complément)"
            accent="var(--gold-deep)"
            iconBg="var(--gold-soft)"
          />
          <BannetteStat
            icone={InboxOutlinedIcon}
            valeur={aTraiter.length}
            libelle="Total à orienter"
            accent="var(--slate)"
            iconBg="var(--surface-2)"
          />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <SearchOutlinedIcon
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 18,
                color: 'var(--muted)',
              }}
            />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une référence, un demandeur, un local…"
              style={{
                width: '100%',
                padding: '11px 14px 11px 40px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                fontSize: 13.5,
                color: 'var(--text)',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--gold)';
                e.target.style.boxShadow = '0 0 0 3px var(--gold-tint)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { v: 'TOUS', l: 'Tous' },
              { v: 'NOUVEAUX', l: 'Nouveaux dépôts' },
              { v: 'RESOUMIS', l: 'Re-soumissions' },
            ].map((f) => {
              const actif = filtreStatut === f.v;
              return (
                <button
                  key={f.v}
                  type="button"
                  onClick={() => setFiltreStatut(f.v)}
                  style={{
                    cursor: 'pointer',
                    padding: '9px 16px',
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 700,
                    background: actif ? 'var(--navy)' : 'var(--surface-2)',
                    color: actif ? 'var(--text-on-navy)' : 'var(--muted)',
                    border: `1px solid ${actif ? 'var(--navy)' : 'var(--border)'}`,
                    boxShadow: actif ? '0 2px 8px rgba(23, 37, 84, 0.18)' : 'none',
                    transition: 'all .2s var(--ease-premium)',
                  }}
                >
                  {f.l}
                </button>
              );
            })}
          </div>
        </div>
      </div>


      {loading ? (
        <LoadingState label="Chargement du courrier entrant…" />
      ) : visibles.length === 0 ? (
        <EmptyState
          icon={<InboxOutlinedIcon style={{ fontSize: 24 }} />}
          title={aTraiter.length === 0 ? 'Aucun courrier en attente' : 'Aucun pli ne correspond à ce filtre'}
          description={
            aTraiter.length === 0
              ? 'Tous les dossiers reçus ont été orientés. Les nouveaux dépôts apparaîtront ici automatiquement.'
              : 'Modifiez votre recherche ou revenez au filtre « Tous ».'
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 20 }}>
          {visibles.map((d) => {
            const anciennete = joursDepuis(d.date_depot);
            const urgent = anciennete !== null && anciennete >= 7;
            return (
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
                  position: 'relative',
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
                {/* Bandeau d'accent haut */}
                <div style={{ height: 4, background: 'linear-gradient(90deg, var(--navy) 0%, var(--gold) 100%)' }} />

                {/* En-tête référence & statut */}
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

                {/* Corps de la carte */}
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 17,
                        fontWeight: 800,
                        margin: '0 0 8px',
                        color: 'var(--text-navy)',
                        lineHeight: 1.3,
                      }}
                    >
                      {TYPES_DEMANDE_LABELS[d.type_demande] || d.type_demande}
                    </h3>
                    {anciennete !== null && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 11px',
                          borderRadius: 999,
                          fontSize: 11.5,
                          fontWeight: 700,
                          background: urgent ? 'var(--red-soft)' : anciennete === 0 ? 'var(--green-soft)' : 'var(--slate-soft)',
                          color: urgent ? 'var(--red)' : anciennete === 0 ? 'var(--green)' : 'var(--navy)',
                          border: `1px solid ${urgent ? 'rgba(185, 28, 28, 0.3)' : anciennete === 0 ? 'rgba(21, 128, 61, 0.3)' : 'var(--border)'}`,
                        }}
                      >
                        {urgent
                          ? `⚠️ En attente depuis ${anciennete} j`
                          : anciennete === 0
                          ? '✨ Reçu aujourd’hui'
                          : `⏱️ En bannette depuis ${anciennete} j`}
                      </span>
                    )}
                  </div>

                  {/* Bloc métadonnées structurées */}
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

                  {d.description_projet && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12.5,
                        lineHeight: 1.55,
                        color: 'var(--text)',
                        padding: '10px 14px',
                        borderRadius: '0 10px 10px 0',
                        background: 'var(--surface-2)',
                        borderLeft: '3px solid var(--gold)',
                        fontStyle: 'italic',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      « {d.description_projet} »
                    </p>
                  )}

                  {d.nb_renvois > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '8px 12px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        background: 'var(--gold-soft)',
                        color: 'var(--gold-deep)',
                        border: '1px solid var(--gold)',
                      }}
                    >
                      <span>🔄</span>
                      <span>Re-soumission n°{d.nb_renvois} {d.nb_renvois > 1 ? '(renvois multiples)' : ''}</span>
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => ouvrirTraitement(d)}
                      style={{ width: '100%', justifyContent: 'center', fontWeight: 800 }}
                    >
                      Traiter & orienter le pli →
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={`Traitement du dossier ${selected.reference_anonyme || `DOSSIER-${String(selected.id).slice(0, 8).toUpperCase()}`}`}
          size="lg"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 24 }}>
            {/* Colonne Pièces justificatives */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 15,
                    fontWeight: 800,
                    margin: 0,
                    color: 'var(--text-navy)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <InsertDriveFileOutlinedIcon style={{ fontSize: 18, color: 'var(--gold-deep)' }} />
                  Pièces justificatives fournies
                </h4>
                {dossier?.documents && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      background: 'var(--slate-soft)',
                      color: 'var(--navy)',
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}
                  >
                    {dossier.documents.length} doc{dossier.documents.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {selected.nb_renvois > 0 && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontSize: 12,
                    background: 'var(--gold-soft)',
                    border: '1px solid var(--gold)',
                    color: 'var(--gold-deep)',
                  }}
                >
                  <strong>🔄 Re-soumission n°{selected.nb_renvois}</strong>
                  {selected.derniere_note_complement && (
                    <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-mono)', fontSize: 11.5, opacity: 0.9 }}>
                      Dernier renvoi : {selected.derniere_note_complement}
                    </p>
                  )}
                </div>
              )}

              {!dossier ? (
                <LoadingState label="Chargement des documents..." />
              ) : dossier.documents && dossier.documents.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 9,
                    maxHeight: 380,
                    overflowY: 'auto',
                    paddingRight: 6,
                  }}
                >
                  {dossier.documents.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        color: 'inherit',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--gold)';
                        e.currentTarget.style.background = 'var(--gold-soft)';
                        e.currentTarget.style.transform = 'translateX(3px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.background = 'var(--surface-2)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: 'var(--surface)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          color: 'var(--navy)',
                          border: '1px solid var(--border)',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                        }}
                      >
                        <InsertDriveFileOutlinedIcon style={{ fontSize: 18 }} />
                      </span>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-navy)' }}>
                          {doc.type_label || doc.type_document}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: 'var(--muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: 1,
                          }}
                        >
                          {doc.libelle || (doc.fichier ? doc.fichier.split('/').pop() : 'Document')}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--gold-deep)',
                          background: 'var(--surface)',
                          padding: '3px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--gold-tint-2)',
                          flexShrink: 0,
                        }}
                      >
                        Aperçu ↗
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <AlertBanner type="warn">Aucun document joint à cette demande.</AlertBanner>
              )}
            </div>

            {/* Colonne Orientation & Traitement */}
            <form onSubmit={handleTraiter} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Orientation du courrier" hint="Sélectionnez la décision du bureau" required>
                <Select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  style={{
                    fontWeight: 600,
                    borderRadius: 10,
                    padding: '12px 14px',
                    borderColor: 'var(--border)',
                  }}
                >
                  {orientationsDisponibles.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>

              {choixCourant && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '14px 16px',
                    borderRadius: 12,
                    lineHeight: 1.5,
                    background:
                      choixCourant.destination === 'DCUVE'
                        ? 'var(--slate-soft)'
                        : choixCourant.destination === 'CANDIDAT'
                        ? 'var(--gold-soft)'
                        : 'var(--red-soft)',
                    color:
                      choixCourant.destination === 'DCUVE'
                        ? 'var(--navy)'
                        : choixCourant.destination === 'CANDIDAT'
                        ? 'var(--gold-deep)'
                        : 'var(--red)',
                    border: `1px solid ${
                      choixCourant.destination === 'DCUVE'
                        ? 'rgba(23, 37, 84, 0.15)'
                        : choixCourant.destination === 'CANDIDAT'
                        ? 'var(--gold)'
                        : 'rgba(185, 28, 28, 0.25)'
                    }`,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <ArrowForwardOutlinedIcon style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }} />
                  <span>{choixCourant.infoText}</span>
                </div>
              )}

              {choixCourant?.piecesManquantes && (
                <Field
                  label="Pièces obligatoires manquantes"
                  hint="Précisez les documents attendus du candidat"
                  required
                >
                  <Textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    rows={3}
                    placeholder="Ex. Pièce d'identité manquante, registre de commerce non fourni…"
                    style={{ borderRadius: 10 }}
                  />
                </Field>
              )}

              {choixCourant?.requiresMotif && (
                <Field
                  label="Motif du rejet"
                  hint="Obligatoire pour rejeter et archiver le dossier"
                  required
                >
                  <Textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    rows={3}
                    placeholder="Motif détaillé du rejet…"
                    style={{ borderRadius: 10 }}
                  />
                </Field>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 'auto', paddingTop: 8 }}>
                <Button variant="secondary" size="md" type="button" onClick={() => setSelected(null)}>
                  Annuler
                </Button>
                <Button variant={choixCourant?.btnVariant || 'primary'} size="md" type="submit" disabled={submitting}>
                  {submitting ? 'Enregistrement…' : choixCourant?.btnLabel || 'Valider l’orientation'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </PageWrapper>
  );
}
