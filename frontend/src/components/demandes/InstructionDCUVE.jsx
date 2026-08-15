import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  changerStatutDemande, enregistrerAvisSanitaire, getDemandes, getDossiers,
} from '../../api/demandes';
import { messageErreur } from '../../api/utils';
import {
  AlertBanner, Button, Card, Field, LoadingState, Modal,
  PageWrapper, SectionHeader, Select, StatusBadge, Textarea,
} from '../common/ui';

const isProjetTravaux = (type) => ['RENOVATION', 'CONSTRUCTION_CANDIDAT', 'CONSTRUCTION_CROUST'].includes(type);

const getDecisionsPourDemande = (type) => {
  const travaux = isProjetTravaux(type);

  return [
    {
      value: travaux ? 'EN_ATTENTE_DECISION' : 'FAVORABLE',
      label: travaux
        ? 'Favorable (Transmettre à la Commission Consultative)'
        : 'Favorable (Transmettre au Service Juridique pour Contrat)',
      btnLabel: travaux
        ? 'Transmettre à la Commission →'
        : 'Transmettre au Service Juridique →',
      btnVariant: 'navy',
      infoText: travaux
        ? 'Avis favorable : dossier de travaux/construction orienté vers la Commission Consultative pour délibération.'
        : 'Avis favorable : dossier validé et transmis directement au Service Juridique pour rédaction du bail/contrat.',
      succes: travaux
        ? 'Dossier instruit favorablement et transmis à la Commission Consultative.'
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

export default function InstructionDCUVE() {
  const [demandes, setDemandes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [avisSanitaire, setAvisSanitaire] = useState('EN_ATTENTE');
  const [statutDecision, setStatutDecision] = useState('FAVORABLE');
  const [commentaire, setCommentaire] = useState('');
  const [dossier, setDossier] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
        if (!ignore) toast.error("Erreur lors de la récupération des dossiers.");
      } finally {
        if (!ignore) setLoadingData(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredDemandes = demandes.filter(d => filterType === 'ALL' || d.type_demande === filterType);

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
        eyebrow="Direction de la Vie Étudiante (DCUVE)"
        title="Instruction & Vérification des Candidatures (LR-8 & LR-9)"
        subtitle="Examen de la recevabilité administrative, complétude des pièces et avis d'aptitude sanitaire."
      />

      {/* Bar de Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>Filtrer par type :</span>
        <Button variant={filterType === 'ALL' ? 'navy' : 'ghost'} size="sm" onClick={() => setFilterType('ALL')}>
          Tous les dossiers ({demandes.length})
        </Button>
        <Button variant={filterType === 'VENTE_PRODUIT' ? 'navy' : 'ghost'} size="sm" onClick={() => setFilterType('VENTE_PRODUIT')}>
          Vente de Produits (Alimentaire)
        </Button>
        <Button variant={filterType === 'PRESTATION_SERVICE' ? 'navy' : 'ghost'} size="sm" onClick={() => setFilterType('PRESTATION_SERVICE')}>
          Prestation de Services
        </Button>
      </div>

      {/* Grille des Dossiers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {loadingData ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>Chargement des dossiers...</p>
        ) : filteredDemandes.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>Aucun dossier trouvé.</p>
        ) : filteredDemandes.map((d) => (
          <Card key={d.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>
                  {d.reference_anonyme || `Dossier #${d.id}`}
                </span>
                <StatusBadge statut={d.statut} />
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-navy)' }}>
                {d.type_demande.replace(/_/g, ' ')}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                Soumis le : <strong>{new Date(d.date_depot).toLocaleDateString()}</strong>
              </p>

              <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                <div>Local préféré : <strong>{d.local || 'Non spécifié'}</strong></div>
                <div>Pièces récepissées : <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓ En cours</span></div>
                {(d.type_demande === 'VENTE_PRODUIT' || d.type_demande === 'VENTE_ALIMENTAIRE') && (
                  <div style={{ marginTop: 4 }}>
                    Avis Sanitaire Hygiène : <strong style={{ color: d.avis_sanitaire_externe === 'FAVORABLE' ? 'var(--green)' : 'var(--amber-deep)' }}>{d.avis_sanitaire_externe || 'EN_ATTENTE'}</strong>
                  </div>
                )}
              </div>
            </div>

            <Button variant="primary" size="sm" onClick={() => handleOpenInstruction(d)} style={{ justifyContent: 'center' }}>
              ⚙ Instruire & Valider le Dossier →
            </Button>
          </Card>
        ))}
      </div>

      {/* Modal d'Instruction */}
      {selectedDemande && (
        <Modal open={!!selectedDemande} onClose={() => setSelectedDemande(null)} title={`Instruction Dossier ${selectedDemande.id}`} size="lg">
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
                    <a key={doc.id} href={doc.fichier} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', color: 'inherit', transition: 'all 0.2s' }}>
                      <InsertDriveFileOutlinedIcon style={{ color: 'var(--teal)' }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-navy)' }}>{doc.type_label || doc.type_document}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.libelle || doc.fichier.split('/').pop()}</div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <AlertBanner type="warning">Aucun document joint à cette demande.</AlertBanner>
              )}
            </div>

            <form onSubmit={handleSaveDecision} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Dossier (Anonyme)">
              <input type="text" readOnly value={selectedDemande.reference_anonyme || selectedDemande.id} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', fontWeight: 700 }} />
            </Field>

            {(selectedDemande.type_demande === 'VENTE_PRODUIT' || selectedDemande.type_demande === 'VENTE_ALIMENTAIRE') && (
              <Field label="Avis Sanitaire Externe (Service d'Hygiène de Thiès)">
                <Select value={avisSanitaire} onChange={(e) => setAvisSanitaire(e.target.value)}>
                  <option value="EN_ATTENTE">En attente du rapport d'inspection sanitaire</option>
                  <option value="FAVORABLE">Avis Sanitaire Favorable (Conforme aux normes agroalimentaires)</option>
                  <option value="DEFAVORABLE">Avis Sanitaire Défavorable (Risque microbiologique)</option>
                </Select>
              </Field>
            )}

            <Field label="Décision d'Instruction DCUVE *" required>
              <Select value={statutDecision} onChange={(e) => setStatutDecision(e.target.value)}>
                {decisionsDisponibles.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>

            {choixCourant && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700,
                padding: '10px 12px', borderRadius: 8,
                background: choixCourant.destination === 'COMMISSION' || choixCourant.destination === 'TECHNIQUE' || choixCourant.destination === 'JURIDIQUE'
                  ? 'rgba(23,37,84,.08)'
                  : choixCourant.destination === 'CANDIDAT'
                  ? 'rgba(217,119,6,.08)'
                  : 'rgba(220,38,38,.08)',
                color: choixCourant.destination === 'COMMISSION' || choixCourant.destination === 'TECHNIQUE' || choixCourant.destination === 'JURIDIQUE'
                  ? 'var(--navy)'
                  : choixCourant.destination === 'CANDIDAT'
                  ? 'var(--amber)'
                  : 'var(--red)',
              }}>
                <ArrowForwardOutlinedIcon style={{ fontSize: 16 }} />
                {choixCourant.infoText}
              </div>
            )}

            <Field
              label={choixCourant?.requiresMotif ? "Motif / Remarques de l'instruction *" : "Observations & Motifs de la Décision"}
              required={choixCourant?.requiresMotif}
            >
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={4}
                placeholder="Consignez les remarques d'instruction administrative..."
              />
            </Field>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <Button variant="ghost" type="button" onClick={() => setSelectedDemande(null)}>Annuler</Button>
                <Button variant={choixCourant?.btnVariant || 'navy'} type="submit" disabled={submitting}>
                  {submitting ? 'Enregistrement…' : (choixCourant?.btnLabel || 'Valider l\u2019Instruction')}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}
