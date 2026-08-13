import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertBanner, Button, Card, EmptyState, Field, LoadingState, Modal,
  PageWrapper, SectionHeader, Select, StatusBadge, Textarea,
} from '../common/ui';
import { changerStatutDemande, getDemandes, confirmerReceptionPhysique } from '../../api/demandes';
import { getCartesAValider, validerCarteEtudiant } from '../../api/comptes';
import { messageErreur } from '../../api/utils';
import {
  STATUTS_DEMANDE, STATUTS_DEMANDE_LABELS, TYPES_DEMANDE_LABELS,
} from '../../utils/constants';

// Le Bureau du Courrier ne traite que les dossiers a l'entree du circuit.
const STATUTS_A_TRAITER = [STATUTS_DEMANDE.NOUVELLE, STATUTS_DEMANDE.MITIGEE_COMPLEMENT];

const ORIENTATIONS = [
  {
    value: STATUTS_DEMANDE.CONTROLE_RECEVABILITE,
    label: 'âœ… Dossier conforme - transmettre Ã  la DCUVE pour instruction',
    succes: 'Dossier transmis au Directeur DCUVE pour instruction.',
  },
  {
    value: STATUTS_DEMANDE.MITIGEE_COMPLEMENT,
    label: "ðŸ“Ž PiÃ¨ces manquantes - demander un complÃ©ment Ã  l'usager",
    succes: "Demande de complÃ©ment notifiÃ©e Ã  l'usager.",
  },
];

export default function BureauCourrierView() {
  const [demandes, setDemandes] = useState([]);
  const [cartes, setCartes] = useState([]);
  const [activeTab, setActiveTab] = useState('COURRIER');
  const [loading, setLoading] = useState(true);
  
  // States Modal Courrier
  const [selected, setSelected] = useState(null);
  const [orientation, setOrientation] = useState(ORIENTATIONS[0].value);
  const [commentaire, setCommentaire] = useState('');
  const [receptionPhysique, setReceptionPhysique] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // States Modal Carte
  const [selectedCarte, setSelectedCarte] = useState(null);
  const [decisionCarte, setDecisionCarte] = useState('VALIDE');
  const [motifCarte, setMotifCarte] = useState('');
  const [submittingCarte, setSubmittingCarte] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'COURRIER') {
        const data = await getDemandes();
        setDemandes(data.filter((d) => STATUTS_A_TRAITER.includes(d.statut)));
      } else {
        const dataCartes = await getCartesAValider();
        setCartes(dataCartes);
      }
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur de chargement.'));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { charger(); }, [charger]);

  const ouvrirTraitement = (demande) => {
    setSelected(demande);
    setOrientation(ORIENTATIONS[0].value);
    setCommentaire('');
    setReceptionPhysique(false);
  };

  const handleTraiter = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      if (receptionPhysique) {
        await confirmerReceptionPhysique(selected.id);
        toast.success("PiÃ¨ces physiques marquÃ©es comme rÃ©ceptionnÃ©es.");
      }
      await changerStatutDemande(selected.id, orientation, commentaire);
      const choix = ORIENTATIONS.find((o) => o.value === orientation);
      toast.success(choix?.succes || 'Dossier traitÃ©.');
      setSelected(null);
      await charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Le traitement du courrier a Ã©chouÃ©.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleValiderCarte = async (e) => {
    e.preventDefault();
    if (!selectedCarte) return;
    setSubmittingCarte(true);
    try {
      await validerCarteEtudiant(selectedCarte.id, decisionCarte, motifCarte);
      toast.success(decisionCarte === 'VALIDE' ? 'Carte validÃ©e avec succÃ¨s.' : 'Carte refusÃ©e avec motif.');
      setSelectedCarte(null);
      await charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors du traitement de la carte.'));
    } finally {
      setSubmittingCarte(false);
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Bureau du Courrier & RÃ©ception"
        title="Enregistrement & orientation du courrier d'arrivÃ©e"
        subtitle="Point d'entrÃ©e officiel des dossiers d'occupation : contrÃ´le prÃ©liminaire des piÃ¨ces, puis transmission Ã  la DCUVE ou demande de complÃ©ment."
      />

      <div style={{ display: 'flex', gap: 20, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('COURRIER')}
          style={{
            padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: activeTab === 'COURRIER' ? 'bold' : 'normal',
            borderBottom: activeTab === 'COURRIER' ? '2px solid var(--navy)' : '2px solid transparent',
            color: activeTab === 'COURRIER' ? 'var(--navy)' : 'var(--muted)',
            fontSize: '15px'
          }}
        >
          ðŸ“­ Courrier Entrant
        </button>
        <button
          onClick={() => setActiveTab('CARTES')}
          style={{
            padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: activeTab === 'CARTES' ? 'bold' : 'normal',
            borderBottom: activeTab === 'CARTES' ? '2px solid var(--navy)' : '2px solid transparent',
            color: activeTab === 'CARTES' ? 'var(--navy)' : 'var(--muted)',
            fontSize: '15px'
          }}
        >
          ðŸŽ“ Cartes Ã‰tudiantes Ã  valider {cartes.length > 0 && <span style={{ background: 'var(--amber)', color: 'var(--ink)', padding: '2px 8px', borderRadius: 12, fontSize: 12, marginLeft: 8 }}>{cartes.length}</span>}
        </button>
      </div>

      <AlertBanner type="info">
        {activeTab === 'COURRIER' 
          ? `Les dossiers dÃ©posÃ©s en ligne par les usagers arrivent ici au statut Â« ${STATUTS_DEMANDE_LABELS.NOUVELLE} Â». Un dossier dÃ©posÃ© physiquement doit d'abord Ãªtre saisi par l'usager.`
          : 'ContrÃ´lez les cartes Ã©tudiantes soumises par les candidats. Une carte valide est requise pour bÃ©nÃ©ficier des tarifs rÃ©duits des locaux de type "Ã‰tudiant".'}
      </AlertBanner>

      {loading ? (
        <LoadingState label="Chargementâ€¦" />
      ) : activeTab === 'COURRIER' && demandes.length === 0 ? (
        <EmptyState
          icon="ðŸ“­"
          title="Aucun courrier en attente"
          description="Tous les dossiers reÃ§us ont Ã©tÃ© orientÃ©s. Les nouveaux dÃ©pÃ´ts apparaÃ®tront ici automatiquement."
        />
      ) : activeTab === 'COURRIER' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {demandes.map((d) => (
            <Card key={d.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>
                    {d.reference_anonyme || `Dossier ${String(d.id).slice(0, 8)}`}
                  </span>
                  <StatusBadge statut={d.statut} />
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--navy)' }}>
                  {TYPES_DEMANDE_LABELS[d.type_demande] || d.type_demande}
                </h3>

                {d.demandeur_nom && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                    Demandeur : <strong>{d.demandeur_nom}</strong>
                  </p>
                )}

                <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14, fontFamily: 'var(--font-mono)' }}>
                  <div>ðŸ“… ReÃ§u le {d.date_depot ? new Date(d.date_depot).toLocaleDateString('fr-FR') : 'â€”'}</div>
                  <div>ðŸ“ Local visÃ© : {d.local_reference || d.local || 'Non prÃ©cisÃ©'}</div>
                </div>

                {d.description_projet && (
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 14px' }}>{d.description_projet}</p>
                )}
              </div>

              <Button variant="primary" size="sm" onClick={() => ouvrirTraitement(d)} style={{ justifyContent: 'center' }}>
                ðŸ“¥ Traiter & orienter le dossier â†’
              </Button>
            </Card>
          ))}
        </div>
      ) : activeTab === 'CARTES' && cartes.length === 0 ? (
        <EmptyState
          icon="ðŸŽ“"
          title="Aucune carte en attente"
          description="Tous les profils Ã©tudiants ont Ã©tÃ© vÃ©rifiÃ©s."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {cartes.map((c) => (
            <Card key={c.id}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Matricule: {c.matricule_etudiant || 'N/A'}</span>
              </div>
              <h3 style={{ fontSize: 16, margin: '0 0 6px', color: 'var(--navy)' }}>{c.utilisateur.nom_complet || c.utilisateur.username}</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 14px' }}>Contact : {c.contact}</p>
              
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="ghost" size="sm" onClick={() => window.open(c.carte_etudiant_fichier, '_blank')} style={{ flex: 1, justifyContent: 'center' }}>
                  ðŸ‘ï¸ Voir la carte
                </Button>
                <Button variant="navy" size="sm" onClick={() => { setSelectedCarte(c); setDecisionCarte('VALIDE'); setMotifCarte(''); }} style={{ flex: 1, justifyContent: 'center' }}>
                  âœ“ Valider/Refuser
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={`Traitement du dossier ${selected.reference_anonyme || String(selected.id).slice(0, 8)}`}
        >
          <form onSubmit={handleTraiter} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Orientation du courrier *" required>
              <Select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                {ORIENTATIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>

            <Field
              label={orientation === STATUTS_DEMANDE.MITIGEE_COMPLEMENT ? "Motif de la demande de complÃ©ment *" : "Notes du rÃ©ceptionniste"}
              hint={orientation === STATUTS_DEMANDE.MITIGEE_COMPLEMENT ? "Obligatoire : prÃ©cisez quelles piÃ¨ces manquent ou sont invalides." : "ConservÃ©es dans l'historique du dossier et visibles par les services suivants."}
              required={orientation === STATUTS_DEMANDE.MITIGEE_COMPLEMENT}
            >
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={3}
                placeholder="Ex. PiÃ¨ce d'identitÃ© manquante, business plan non signÃ©â€¦"
                required={orientation === STATUTS_DEMANDE.MITIGEE_COMPLEMENT}
              />
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: 12, background: 'var(--info-soft)', borderRadius: 8 }}>
              <input
                type="checkbox"
                id="receptionPhysique"
                checked={receptionPhysique}
                onChange={(e) => setReceptionPhysique(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="receptionPhysique" style={{ fontSize: 14, color: 'var(--navy)', cursor: 'pointer', fontWeight: 600 }}>
                Dossier physique rÃ©ceptionnÃ© au guichet
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <Button variant="ghost" type="button" onClick={() => setSelected(null)}>Annuler</Button>
              <Button variant="navy" type="submit" disabled={submitting}>
                {submitting ? 'Enregistrementâ€¦' : 'Valider l\u2019orientation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      
      {selectedCarte && (
        <Modal
          open={!!selectedCarte}
          onClose={() => setSelectedCarte(null)}
          title={`VÃ©rification de la carte Ã©tudiant de ${selectedCarte.utilisateur.nom_complet || selectedCarte.utilisateur.username}`}
        >
          <form onSubmit={handleValiderCarte} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ marginBottom: 10 }}>
              <a href={selectedCarte.carte_etudiant_fichier} target="_blank" rel="noreferrer" style={{ color: 'var(--teal)', fontWeight: 'bold' }}>
                Ouvrir la carte dans un nouvel onglet â†-
              </a>
            </div>
            <Field label="DÃ©cision *" required>
              <Select value={decisionCarte} onChange={(e) => setDecisionCarte(e.target.value)}>
                <option value="VALIDE">âœ… VALIDER la carte Ã©tudiante</option>
                <option value="REJETE">âŒ REFUSER la carte Ã©tudiante</option>
              </Select>
            </Field>

            <Field
              label={decisionCarte === 'REJETE' ? "Motif du refus *" : "Commentaire (Optionnel)"}
              required={decisionCarte === 'REJETE'}
              hint="Le motif sera envoyÃ© par email Ã  l'Ã©tudiant."
            >
              <Textarea
                value={motifCarte}
                onChange={(e) => setMotifCarte(e.target.value)}
                rows={3}
                placeholder="Ex. La carte est floue, illisible ou expirÃ©e..."
                required={decisionCarte === 'REJETE'}
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <Button variant="ghost" type="button" onClick={() => setSelectedCarte(null)}>Annuler</Button>
              <Button variant={decisionCarte === 'VALIDE' ? 'navy' : 'stamp'} type="submit" disabled={submittingCarte}>
                {submittingCarte ? 'Enregistrementâ€¦' : 'Confirmer'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}

