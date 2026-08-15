import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { useCallback, useEffect, useState } from 'react';
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
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import DocumentPreviewModal from './DocumentPreviewModal';

// Le Bureau du Courrier ne traite que les dossiers a l'entree du circuit.
const STATUTS_A_TRAITER = [STATUTS_DEMANDE.NOUVELLE, STATUTS_DEMANDE.MITIGEE_COMPLEMENT];

const ORIENTATIONS = [
  {
    value: STATUTS_DEMANDE.CONTROLE_RECEVABILITE,
    label: 'Avis favorable — dossier conforme, transmettre à la DCUVE',
    succes: 'Dossier transmis au Directeur DCUVE pour instruction.',
    destination: 'DCUVE',
    avis: 'FAVORABLE',
    btnLabel: 'Transmettre à la DCUVE →',
    btnVariant: 'navy',
    infoText: 'Avis favorable : ce dossier sera transmis à la DCUVE pour instruction.',
  },
  {
    value: STATUTS_DEMANDE.MITIGEE_COMPLEMENT,
    label: "Avis défavorable — pièce manquante, retourner au candidat",
    succes: "Demande de complément notifiée au candidat.",
    destination: 'CANDIDAT',
    avis: 'DEFAVORABLE',
    piecesManquantes: true,
    btnLabel: 'Retourner au candidat pour complément',
    btnVariant: 'amber',
    infoText: 'Avis défavorable : demande de pièces complémentaires renvoyée au candidat.',
  },
  {
    value: STATUTS_DEMANDE.DEFAVORABLE,
    label: "Avis défavorable — dossier irrecevable / non complété (Archivage direct)",
    succes: "Dossier classé irrecevable et archivé directement.",
    destination: 'ARCHIVES',
    avis: 'DEFAVORABLE',
    requiresMotif: true,
    btnLabel: 'Archiver directement le dossier',
    btnVariant: 'stamp',
    infoText: 'Avis défavorable : dossier non complété / irrecevable, classé directement dans les archives.',
  },
];

export default function BureauCourrierView() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [orientation, setOrientation] = useState(ORIENTATIONS[0].value);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { charger(); }, [charger]);

  const [dossier, setDossier] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

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

  const choixCourant = ORIENTATIONS.find((o) => o.value === orientation);

  const handleTraiter = async (e) => {
    e.preventDefault();
    if (!selected) return;

    const choix = ORIENTATIONS.find((o) => o.value === orientation);
    if (choix?.requiresMotif && (!commentaire || commentaire.trim().length < 5)) {
      toast.error('Un motif d\'avis défavorable (min. 5 caractères) est obligatoire pour archiver le dossier.');
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
        title="Enregistrement & orientation du courrier d'arrivée"
        subtitle="Point d'entrée officiel des dossiers d'occupation : contrôle préliminaire des pièces, puis transmission à la DCUVE ou demande de complément."
      />

      <AlertBanner type="info">
        Les dossiers déposés en ligne par les usagers arrivent ici au statut
        « {STATUTS_DEMANDE_LABELS.NOUVELLE} ». Un dossier déposé physiquement doit
        d'abord être saisi par l'usager ou par l'Administration SI depuis la
        gestion des comptes, afin que le demandeur reste titulaire de son dossier.
      </AlertBanner>

          {loading ? (
            <LoadingState label="Chargement du courrier entrant…" />
          ) : demandes.filter(d => STATUTS_A_TRAITER.includes(d.statut)).length === 0 ? (
            <EmptyState
              icon={<InboxOutlinedIcon style={{ fontSize: 20 }} />}
              title="Aucun courrier en attente"
              description="Tous les dossiers reçus ont été orientés. Les nouveaux dépôts apparaîtront ici automatiquement."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {demandes.filter(d => STATUTS_A_TRAITER.includes(d.statut)).map((d) => (
                <Card 
                  key={d.id} 
                  style={{ 
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'var(--teal)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>
                        {d.reference_anonyme || `Dossier ${String(d.id).slice(0, 8)}`}
                      </span>
                      <StatusBadge statut={d.statut} />
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-navy)' }}>
                      {TYPES_DEMANDE_LABELS[d.type_demande] || d.type_demande}
                    </h3>

                    {d.demandeur_nom && (
                      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                        Demandeur : <strong>{d.demandeur_nom}</strong>
                      </p>
                    )}

                    <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14, fontFamily: 'var(--font-mono)' }}>
                      <div>Reçu le {d.date_depot ? new Date(d.date_depot).toLocaleDateString('fr-FR') : '—'}</div>
                      <div>Local visé : {d.local_reference || d.local || 'Non précisé'}</div>
                    </div>

                    {d.description_projet && (
                      <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 14px' }}>{d.description_projet}</p>
                    )}
                  </div>

                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => ouvrirTraitement(d)} 
                    style={{ 
                      justifyContent: 'center', 
                      marginTop: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s',
                    }}
                  >
                    Traiter & orienter le dossier →
                  </Button>
                </Card>
              ))}
            </div>
          )}

      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={`Traitement du dossier ${selected.reference_anonyme || String(selected.id).slice(0, 8)}`}
          size="lg"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: 'var(--text-navy)' }}>
                Pièces justificatives fournies
              </h4>
              {!dossier ? (
                <LoadingState label="Chargement des documents..." />
              ) : dossier.documents && dossier.documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
                  {dossier.documents.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                    >
                      <InsertDriveFileOutlinedIcon style={{ color: 'var(--teal)' }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-navy)' }}>{doc.type_label || doc.type_document}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.libelle || doc.fichier.split('/').pop()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <AlertBanner type="warning">Aucun document joint à cette demande.</AlertBanner>
              )}
            </div>

            <form onSubmit={handleTraiter} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Orientation du courrier *" required>
                <Select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                  {ORIENTATIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>

              {choixCourant && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700,
                  padding: '10px 12px', borderRadius: 8,
                  background: choixCourant.destination === 'DCUVE' 
                    ? 'rgba(23,37,84,.08)' 
                    : choixCourant.destination === 'CANDIDAT'
                    ? 'rgba(217,119,6,.08)'
                    : 'rgba(220,38,38,.08)',
                  color: choixCourant.destination === 'DCUVE' 
                    ? 'var(--navy)' 
                    : choixCourant.destination === 'CANDIDAT'
                    ? 'var(--amber)'
                    : 'var(--red)',
                }}>
                  <ArrowForwardOutlinedIcon style={{ fontSize: 16 }} />
                  {choixCourant.infoText}
                </div>
              )}

              {choixCourant?.piecesManquantes && (
                <Field
                  label="Note du réceptionniste *"
                  hint="Précisez les pièces manquantes attendues du candidat. Conservée dans l'historique du dossier."
                  required
                >
                  <Textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    rows={3}
                    placeholder="Ex. Pièce d'identité manquante, business plan non signé…"
                  />
                </Field>
              )}

              {choixCourant?.requiresMotif && (
                <Field
                  label="Motif du rejet *"
                  hint="Obligatoire pour rejeter et archiver le dossier."
                  required
                >
                  <Textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    rows={3}
                    placeholder="Motif détaillé du rejet…"
                  />
                </Field>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <Button variant="ghost" type="button" onClick={() => setSelected(null)}>Annuler</Button>
                <Button variant={choixCourant?.btnVariant || 'navy'} type="submit" disabled={submitting}>
                  {submitting ? 'Enregistrement…' : (choixCourant?.btnLabel || 'Valider l\u2019orientation')}
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


