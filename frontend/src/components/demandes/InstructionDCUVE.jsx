import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  changerStatutDemande, enregistrerAvisSanitaire, getDemandes, getDossiers,
  getDemandesParLocal, creerLotCommission,
} from '../../api/demandes';
import { messageErreur } from '../../api/utils';
import {
  AlertBanner, Button, Card, Field, LoadingState, Modal,
  PageWrapper, SectionHeader, Select, StatusBadge, Textarea,
} from '../common/ui';
import DocumentPreviewModal from '../courrier/DocumentPreviewModal';

const isProjetTravaux = (type) => ['RENOVATION', 'CONSTRUCTION_CANDIDAT', 'CONSTRUCTION_CROUST'].includes(type);

// Seuls les statuts dans le périmètre actif DCUVE sont montrés.
// Les dossiers au statut MITIGEE_COMPLEMENT sont en attente chez le candidat.
const STATUTS_DCUVE = [
  'CONTROLE_RECEVABILITE',
  'EN_EXPERTISE_TECHNIQUE',
  'CONTROLE_HYGIENE',
  'EN_ATTENTE_DECISION',
  'EN_COMMISSION',
];
const getDecisionsPourDemande = (type) => {
  const travaux = isProjetTravaux(type);

  return [
    {
      value: travaux ? 'EN_ATTENTE_DECISION' : 'FAVORABLE',
      label: travaux
        ? "Favorable (Transmettre à la Commission d'évaluation)"
        : 'Favorable (Transmettre au Service Juridique pour Contrat)',
      btnLabel: travaux
        ? 'Transmettre à la Commission →'
        : 'Transmettre au Service Juridique →',
      btnVariant: 'navy',
      infoText: travaux
        ? "Avis favorable : dossier de travaux/construction orienté vers la Commission d'évaluation pour délibération."
        : 'Avis favorable : dossier validé et transmis directement au Service Juridique pour rédaction du bail/contrat.',
      succes: travaux
        ? "Dossier instruit favorablement et transmis à la Commission d'évaluation."
        : 'Dossier instruit favorablement et transmis au Service Juridique pour contrat.',
      destination: travaux ? 'COMMISSION' : 'JURIDIQUE',
    },
    {
      value: 'MITIGEE_COMPLEMENT',
      label: 'Complément de dossier requis (Pièces manquantes)',
      btnLabel: 'Retourner au candidat pour complément',
      btnVariant: 'amber',
      infoText: 'Avis défavorable : demande de pièces complémentaires renvoyée au candidat avec notification.',
      succes: 'Dossier mis en attente de complément et notification envoyée au candidat.',
      destination: 'CANDIDAT',
      requiresMotif: true,
    },
    {
      value: 'DEFAVORABLE',
      label: 'Irrecevable / Défavorable (Rejet direct & Archivage)',
      btnLabel: 'Archiver directement le dossier',
      btnVariant: 'stamp',
      infoText: 'Avis défavorable : dossier non complété / irrecevable, classé directement dans les archives.',
      succes: 'Dossier rejeté et archivé directement.',
      destination: 'ARCHIVES',
      requiresMotif: true,
    },
    ...(travaux ? [{
      value: 'EN_EXPERTISE_TECHNIQUE',
      label: 'Transmettre au Service Technique (Expertise requise)',
      btnLabel: 'Transmettre au Service Technique →',
      btnVariant: 'navy',
      infoText: 'Ce dossier nécessite une expertise technique préalable (travaux / rénovation).',
      succes: 'Dossier orienté vers le Service Technique pour expertise.',
      destination: 'TECHNIQUE',
    }] : []),
  ];
};

const LIBELLES_TYPES_DEMANDE = {
  RENOVATION: 'Rénovation de local',
  CONSTRUCTION_CANDIDAT: 'Construction (par le Candidat)',
  CONSTRUCTION_CROUST: 'Construction (par le CROUS-T)',
  VENTE_PRODUIT: 'Vente de produits',
  VENTE_ALIMENTAIRE: 'Vente alimentaire & Restauration',
  PRESTATION_SERVICE: 'Prestation de services',
  LOCAL_ARTISANAL: 'Local artisanal',
};

const formatTypeDemande = (type) =>
  LIBELLES_TYPES_DEMANDE[type] || (type ? type.replace(/_/g, ' ') : 'Dossier de candidature');

export default function InstructionDCUVE() {
  const [demandes, setDemandes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [avisSanitaire, setAvisSanitaire] = useState('EN_ATTENTE');
  const [statutDecision, setStatutDecision] = useState('FAVORABLE');
  const [commentaire, setCommentaire] = useState('');
  const [dossier, setDossier] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  // Onglet actif : 'instruction' | 'concurrence'
  const [onglet, setOnglet] = useState('instruction');
  // Groupes de demandes par local (pour onglet concurrence)
  const [groupes, setGroupes] = useState([]);
  const [loadingGroupes, setLoadingGroupes] = useState(false);
  // Lot en cours de constitution
  const [lotModal, setLotModal] = useState(null); // { local_reference, local_id, demandes }
  const [lotSelection, setLotSelection] = useState([]);
  const [lotCommentaire, setLotCommentaire] = useState('');
  const [lotSubmitting, setLotSubmitting] = useState(false);

  const fetchGroupes = useCallback(async () => {
    setLoadingGroupes(true);
    try {
      const data = await getDemandesParLocal();
      setGroupes(data || []);
    } catch {
      toast.error('Impossible de charger les groupes de concurrence.');
    } finally {
      setLoadingGroupes(false);
    }
  }, []);

  const fetchDemandes = useCallback(async () => {
    try {
      const data = await getDemandes();
      setDemandes(data || []);
    } catch {
      toast.error("Erreur lors de la récupération des dossiers.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getDemandes();
        if (!ignore) setDemandes(data || []);
      } catch {
        if (!ignore) toast.error("Erreur lors de la r\u00e9cup\u00e9ration des dossiers.");
      } finally {
        if (!ignore) setLoadingData(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (onglet === 'concurrence') fetchGroupes();
  }, [onglet, fetchGroupes]);

  const handleOuvrirLot = (groupe) => {
    setLotModal(groupe);
    setLotSelection(groupe.demandes.map((d) => d.id));
    setLotCommentaire('');
  };

  const groupesActifs = groupes
    .map((g) => {
      const demandesActives = g.demandes.filter((d) => STATUTS_DCUVE.includes(d.statut));
      return {
        ...g,
        demandes: demandesActives,
        nb_candidatures: demandesActives.length,
      };
    })
    .filter((g) => g.nb_candidatures >= 2);

  const handleCreerLot = async () => {
    if (lotSelection.length < 2) {
      toast.error('S\u00e9lectionnez au moins 2 dossiers.');
      return;
    }
    setLotSubmitting(true);
    try {
      await creerLotCommission({ demande_ids: lotSelection, commentaire: lotCommentaire });
      toast.success('Lot constitu\u00e9 ! La commission a \u00e9t\u00e9 activ\u00e9e et les membres notifi\u00e9s.');
      setLotModal(null);
      fetchGroupes();
      fetchDemandes();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la constitution du lot.');
    } finally {
      setLotSubmitting(false);
    }
  };

  const filteredDemandes = demandes.filter((d) => STATUTS_DCUVE.includes(d.statut));

  const decisionsDisponibles = selectedDemande
    ? getDecisionsPourDemande(selectedDemande.type_demande)
    : [];

  const handleOpenInstruction = async (d) => {
    const decs = getDecisionsPourDemande(d.type_demande);
    setSelectedDemande(d);
    setAvisSanitaire(d.avis_sanitaire_externe || 'EN_ATTENTE');
    setStatutDecision(decs[0].value);
    setCommentaire(d.commentaire_dcuve || '');
    setDossier(null);
    try {
      const data = await getDossiers({ demande: d.id });
      if (data && data.length > 0) setDossier(data[0]);
    } catch {
      toast.error('Impossible de charger les pièces jointes.');
    }
  };

  const choixCourant = decisionsDisponibles.find((c) => c.value === statutDecision) || decisionsDisponibles[0];

  const handleSaveDecision = async (e) => {
    e.preventDefault();
    if (!selectedDemande) return;

    if (choixCourant?.requiresMotif && (!commentaire || commentaire.trim().length < 5)) {
      toast.error('Veuillez renseigner un motif ou des remarques (min. 5 caractères).');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedDemande.type_demande === 'VENTE_PRODUIT' || selectedDemande.type_demande === 'VENTE_ALIMENTAIRE') {
        await enregistrerAvisSanitaire(selectedDemande.id, avisSanitaire);
      }
      await changerStatutDemande(selectedDemande.id, statutDecision, commentaire);
      toast.success(choixCourant?.succes || `Instruction validée pour le dossier ${selectedDemande.reference_anonyme || selectedDemande.id}.`);
      setSelectedDemande(null);
      await fetchDemandes();
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de l'enregistrement de l'instruction."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Direction de la Vie Étudiante · DCUVE"
        title="Instruction des dossiers de candidature"
        subtitle="Examen de la recevabilité, complétude des pièces justificatives et orientation des dossiers."
      />

      {/* Onglets principaux */}
      <div style={{
        display: 'inline-flex',
        background: 'var(--surface-2)',
        padding: 4,
        borderRadius: 10,
        gap: 6,
        marginBottom: 22,
        border: '1px solid var(--border)',
      }}>
        <Button
          variant={onglet === 'instruction' ? 'navy' : 'ghost'}
          size="sm"
          onClick={() => setOnglet('instruction')}
          style={{ borderRadius: 7, fontWeight: 700 }}
        >
          📋 Instruction des dossiers
        </Button>
        <Button
          variant={onglet === 'concurrence' ? 'navy' : 'ghost'}
          size="sm"
          onClick={() => setOnglet('concurrence')}
          style={{ borderRadius: 7, fontWeight: 700 }}
        >
          ⚖ Concurrence par local
        </Button>
      </div>

      {/* ═══ ONGLET CONCURRENCE ═══ */}
      {onglet === 'concurrence' && (
        <div>
          <div style={{
            marginBottom: 20,
            padding: '14px 18px',
            background: 'var(--surface-2)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            fontSize: 13,
            color: 'var(--text-navy)',
            lineHeight: 1.5,
          }}>
            <strong>⚖ Arbitrage des candidatures concurrentes :</strong> Lorsque plusieurs dossiers ciblent le même local domanial,
            le Directeur DCUVE peut regrouper les demandes concurrentes en un lot et les transmettre directement à la Commission d'évaluation pour délibération et arbitrage.
          </div>

          {loadingGroupes ? (
            <LoadingState label="Analyse des concurrences par local..." />
          ) : groupesActifs.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--surface-2)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              color: 'var(--muted)',
            }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>
                Aucune concurrence directe active détectée actuellement sur les locaux domaniaux.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
              {groupesActifs.map((g) => (
                <Card
                  key={g.local_id}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: g.en_lot
                      ? 'linear-gradient(90deg, var(--green) 0%, var(--teal) 100%)'
                      : 'linear-gradient(90deg, var(--gold) 0%, var(--navy) 100%)',
                  }} />

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          fontWeight: 800,
                          color: 'var(--text-navy)',
                          background: 'var(--surface-2)',
                          padding: '4px 9px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          display: 'inline-block',
                          marginBottom: 4,
                        }}>
                          {g.local_reference}
                        </span>
                        {g.local_designation && (
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-navy)' }}>
                            {g.local_designation}
                          </div>
                        )}
                      </div>

                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 11.5,
                        fontWeight: 800,
                        background: g.en_lot ? 'rgba(22, 163, 74, 0.12)' : 'rgba(201, 161, 92, 0.15)',
                        color: g.en_lot ? 'var(--green)' : 'var(--gold-deep)',
                        border: g.en_lot ? '1px solid rgba(22, 163, 74, 0.25)' : '1px solid rgba(201, 161, 92, 0.3)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {g.nb_candidatures} candidatures
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      {g.demandes.map((d) => (
                        <div
                          key={d.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'var(--surface-2)',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 11.5, color: 'var(--text-navy)' }}>
                              {d.reference_anonyme || `#${d.id}`}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                              {formatTypeDemande(d.type_demande)}
                            </div>
                          </div>
                          <StatusBadge statut={d.statut} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {g.en_lot ? (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(22, 163, 74, 0.1)',
                      border: '1px solid rgba(22, 163, 74, 0.25)',
                      color: 'var(--green)',
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'center',
                    }}>
                      ✓ Lot constitué et transmis en Commission
                    </div>
                  ) : (
                    <Button
                      variant="navy"
                      size="sm"
                      onClick={() => handleOuvrirLot(g)}
                      style={{ justifyContent: 'center', width: '100%', fontWeight: 700 }}
                    >
                      ⚖ Transmettre le lot en Commission →
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Modal constitution de lot */}
          {lotModal && (
            <Modal
              open={!!lotModal}
              onClose={() => setLotModal(null)}
              title={`Arbitrage Commission - Local ${lotModal.local_reference}`}
              size="lg"
            >
              <div style={{
                marginBottom: 16,
                padding: '12px 16px',
                background: 'rgba(201, 161, 92, 0.1)',
                border: '1px solid var(--gold)',
                borderRadius: 10,
                fontSize: 13,
                color: 'var(--text-navy)',
                lineHeight: 1.5,
              }}>
                <strong>⚖ Transmission à la Commission d'évaluation :</strong> Les dossiers sélectionnés seront groupés
                en un lot d'arbitrage et passeront au statut <code>Transmis en Commission</code>. La commission d'évaluation sera automatiquement activée pour délibération.
              </div>

              <Field label="Dossiers concurrents à inclure dans le lot d'arbitrage">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                  {lotModal.demandes.map((d) => (
                    <label
                      key={d.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        cursor: 'pointer',
                        padding: '10px 14px',
                        background: lotSelection.includes(d.id) ? 'rgba(23, 37, 84, 0.06)' : 'var(--surface-2)',
                        border: lotSelection.includes(d.id) ? '1px solid var(--navy)' : '1px solid var(--border)',
                        borderRadius: 8,
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={lotSelection.includes(d.id)}
                        onChange={(e) => {
                          if (e.target.checked) setLotSelection((s) => [...s, d.id]);
                          else setLotSelection((s) => s.filter((x) => x !== d.id));
                        }}
                        style={{ width: 16, height: 16, accentColor: 'var(--navy)' }}
                      />
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 12, color: 'var(--text-navy)' }}>
                        {d.reference_anonyme || `#${d.id}`}
                      </span>
                      <StatusBadge statut={d.statut} />
                      <span style={{ fontSize: 11.5, color: 'var(--muted)', marginLeft: 'auto' }}>
                        {formatTypeDemande(d.type_demande)}
                      </span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Note d'instruction & motifs d'arbitrage (optionnel)">
                <Textarea
                  value={lotCommentaire}
                  onChange={(e) => setLotCommentaire(e.target.value)}
                  rows={3}
                  placeholder="Observations du Directeur DCUVE pour guider la Commission d'évaluation sur ce lot de candidatures concurrentes..."
                />
              </Field>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                <Button variant="ghost" onClick={() => setLotModal(null)}>Annuler</Button>
                <Button variant="navy" disabled={lotSubmitting || lotSelection.length < 2} onClick={handleCreerLot}>
                  {lotSubmitting ? 'Transmission en cours...' : `⚖ Transmettre ${lotSelection.length} dossier(s) en Commission`}
                </Button>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ═══ ONGLET INSTRUCTION ═══ */}
      {onglet === 'instruction' && (
      <>
      {/* Grille des Dossiers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {loadingData ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>Chargement des dossiers...</p>
        ) : filteredDemandes.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>Aucun dossier trouvé.</p>
        ) : filteredDemandes.map((d) => (
          <Card
            key={d.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, var(--gold) 0%, var(--navy) 100%)',
            }} />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: 'var(--text-navy)',
                  background: 'var(--surface-2)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                }}>
                  {d.reference_anonyme || `Dossier #${d.id}`}
                </span>
                <StatusBadge statut={d.statut} />
              </div>

              {/* Tag de catégorie de projet */}
              {isProjetTravaux(d.type_demande) && (
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-deep)', marginBottom: 6 }}>
                  🏗 Projet de travaux / Construction
                </div>
              )}
              {(d.type_demande === 'VENTE_PRODUIT' || d.type_demande === 'VENTE_ALIMENTAIRE') && (
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>
                  🍽 Activité Alimentaire & Hygiène
                </div>
              )}
              {d.type_demande === 'LOCAL_ARTISANAL' && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>
                  🎨 Espace Artisanal
                </div>
              )}
              {d.type_demande === 'PRESTATION_SERVICE' && (
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                  💼 Prestation de Services
                </div>
              )}

              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16.5,
                fontWeight: 800,
                margin: '0 0 6px',
                color: 'var(--text-navy)',
              }}>
                {formatTypeDemande(d.type_demande)}
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 12px' }}>
                Soumis le : <strong>{new Date(d.date_depot).toLocaleDateString('fr-FR')}</strong>
              </p>

              {/* Badge re-soumission */}
              {d.nb_renvois > 0 && (
                <div style={{
                  marginBottom: 10,
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 700,
                  background: 'rgba(201, 161, 92, 0.12)',
                  color: 'var(--gold-deep, #92400e)',
                  border: '1px solid rgba(201, 161, 92, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  🔄 Re-soumission n°{d.nb_renvois}
                  {d.derniere_note_complement && (
                    <span style={{ fontWeight: 500, fontSize: 11, marginLeft: 4 }}>
                      - {d.derniere_note_complement.slice(0, 50)}{d.derniere_note_complement.length > 50 ? '…' : ''}
                    </span>
                  )}
                </div>
              )}

              {/* Badge statut contextuel */}
              {d.statut === 'EN_EXPERTISE_TECHNIQUE' && (
                <div style={{ marginBottom: 10, padding: '5px 9px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: 'rgba(23,37,84,0.07)', color: 'var(--navy)' }}>
                  🔧 Retour Service Technique · Expertise en cours
                </div>
              )}
              {d.statut === 'CONTROLE_HYGIENE' && (
                <div style={{ marginBottom: 10, padding: '5px 9px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: 'rgba(22,163,74,0.08)', color: 'var(--green)' }}>
                  🍽 Contrôle hygiène & sanitaire en cours
                </div>
              )}

              <div style={{
                background: 'var(--surface-2)',
                padding: '12px 14px',
                borderRadius: 10,
                fontSize: 12,
                marginBottom: 16,
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Local visé :</span>
                  <strong style={{ color: 'var(--text-navy)' }}>
                    {d.local_reference || d.local_designation || (typeof d.local === 'string' && !d.local.includes('-') ? d.local : 'Local assigné')}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Pièces du dossier :</span>
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓ Récépissées</span>
                </div>
                {(d.type_demande === 'VENTE_PRODUIT' || d.type_demande === 'VENTE_ALIMENTAIRE') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Avis Sanitaire :</span>
                    <strong style={{ color: d.avis_sanitaire_externe === 'FAVORABLE' ? 'var(--green)' : 'var(--gold-deep)' }}>
                      {d.avis_sanitaire_externe || 'EN_ATTENTE'}
                    </strong>
                  </div>
                )}
                {isProjetTravaux(d.type_demande) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Circuit :</span>
                    <span style={{ color: 'var(--gold-deep)', fontWeight: 700 }}>Expertise Technique & Commission</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="navy"
              size="sm"
              onClick={() => handleOpenInstruction(d)}
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
            >
              Instruire le Dossier →
            </Button>
          </Card>
        ))}
      </div>

      {/* Modal d'Instruction */}
      {selectedDemande && (
        <Modal
          open={!!selectedDemande}
          onClose={() => setSelectedDemande(null)}
          title="Instruction administrative du dossier"
          size="xl"
        >
          <div style={{ overflowX: 'hidden' }}>
            {/* Bandeau d'en-tête du dossier : Fond bleu marine et écritures beige / or */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #0d1b2a 0%, #172554 100%)',
              borderRadius: 12,
              border: '1px solid rgba(201, 161, 92, 0.35)',
              marginBottom: 20,
              boxShadow: '0 4px 14px rgba(13, 27, 42, 0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'var(--gold)',
                  background: 'rgba(201, 161, 92, 0.15)',
                  padding: '5px 12px',
                  borderRadius: 7,
                  border: '1px solid rgba(201, 161, 92, 0.4)',
                  letterSpacing: '0.5px',
                }}>
                  {selectedDemande.reference_anonyme || `Dossier #${selectedDemande.id}`}
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold-soft)' }}>
                  {formatTypeDemande(selectedDemande.type_demande)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12.5, color: 'rgba(201, 161, 92, 0.85)' }}>
                <span>Local : <strong style={{ color: 'var(--gold-soft)' }}>{selectedDemande.local_reference || selectedDemande.local_designation || 'Assigné'}</strong></span>
                <span>·</span>
                <span>Déposé le : <strong style={{ color: 'var(--gold-soft)' }}>{new Date(selectedDemande.date_depot).toLocaleDateString('fr-FR')}</strong></span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {/* Colonne Gauche : Pièces justificatives */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 800, margin: 0, color: 'var(--text-navy)' }}>
                    Pièces justificatives déposées
                  </h4>
                  {dossier?.documents && (
                    <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--muted)' }}>
                      {dossier.documents.length} pièce(s)
                    </span>
                  )}
                </div>

                {!dossier ? (
                  <LoadingState label="Chargement des documents..." />
                ) : dossier.documents && dossier.documents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto', paddingRight: 6 }}>
                    {/* Note de renvoi si re-soumission */}
                    {selectedDemande.nb_renvois > 0 && (
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        background: 'rgba(201, 161, 92, 0.12)',
                        border: '1px solid rgba(201, 161, 92, 0.35)',
                        color: 'var(--gold-deep, #92400e)',
                        marginBottom: 6,
                      }}>
                        <div style={{ fontWeight: 800 }}>🔄 Dossier re-soumis (Renvoi n°{selectedDemande.nb_renvois})</div>
                        {selectedDemande.derniere_note_complement && (
                          <div style={{ marginTop: 3, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                            Précédent motif : {selectedDemande.derniere_note_complement}
                          </div>
                        )}
                      </div>
                    )}

                    {dossier.documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setPreviewDoc(doc)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          padding: '10px 12px',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 9,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--gold)';
                          e.currentTarget.style.background = 'var(--surface-2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.background = 'var(--surface)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 7,
                            background: 'rgba(23, 37, 84, 0.08)',
                            color: 'var(--navy)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <InsertDriveFileOutlinedIcon style={{ fontSize: 18 }} />
                          </div>
                          <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {doc.type_label || doc.type_document}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {doc.libelle || doc.fichier?.split('/').pop()}
                            </div>
                          </div>
                        </div>

                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--navy)',
                          background: 'var(--surface-2)',
                          padding: '3px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          flexShrink: 0,
                        }}>
                          Aperçu 👁
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <AlertBanner type="warning">Aucun document joint à cette demande.</AlertBanner>
                )}
              </div>

              {/* Colonne Droite : Formulaire d'instruction */}
              <form onSubmit={handleSaveDecision} style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                {(selectedDemande.type_demande === 'VENTE_PRODUIT' || selectedDemande.type_demande === 'VENTE_ALIMENTAIRE') && (
                  <Field label="Avis Sanitaire Externe (Service d'Hygiène)">
                    <Select value={avisSanitaire} onChange={(e) => setAvisSanitaire(e.target.value)}>
                      <option value="EN_ATTENTE">⏳ En attente du rapport sanitaire</option>
                      <option value="FAVORABLE">✓ Favorable (Conforme aux normes hygiène)</option>
                      <option value="DEFAVORABLE">✕ Défavorable (Non-conformité hygiène)</option>
                    </Select>
                  </Field>
                )}

                <Field label="Décision d'Instruction administrative" required>
                  <Select value={statutDecision} onChange={(e) => setStatutDecision(e.target.value)}>
                    {decisionsDisponibles.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </Field>

                {/* Bloc explicatif contextuel de la décision : Fond bleu marine et écritures beige / or */}
                {choixCourant && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #0d1b2a 0%, #172554 100%)',
                    color: 'var(--gold-soft)',
                    border: '1px solid rgba(201, 161, 92, 0.35)',
                    boxShadow: '0 2px 8px rgba(13, 27, 42, 0.12)',
                  }}>
                    <ArrowForwardOutlinedIcon style={{ fontSize: 18, marginTop: 2, flexShrink: 0, color: 'var(--gold)' }} />
                    <div style={{ color: 'var(--gold-soft)', fontWeight: 600 }}>{choixCourant.infoText}</div>
                  </div>
                )}

                <Field
                  label={choixCourant?.requiresMotif ? "Motif obligatoire de la décision" : "Observations & Consignes d'instruction"}
                  required={choixCourant?.requiresMotif}
                >
                  <Textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    rows={3}
                    placeholder={
                      choixCourant?.requiresMotif
                        ? "Précisez les pièces manquantes ou le motif du rejet..."
                        : "Consignez vos remarques d'instruction administrative..."
                    }
                  />
                </Field>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <Button variant="ghost" type="button" onClick={() => setSelectedDemande(null)}>
                    Annuler
                  </Button>
                  <Button
                    variant={choixCourant?.btnVariant || 'navy'}
                    type="submit"
                    disabled={submitting}
                    style={{ fontWeight: 700 }}
                  >
                    {submitting ? 'Traitement en cours…' : (choixCourant?.btnLabel || 'Valider l’Instruction')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
      <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      </>
      )}
    </PageWrapper>
  );
}
