import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  PageWrapper, SectionHeader, Card, StatusBadge, Button, Modal, AlertBanner, Field, Timeline,
} from '../common/ui';
import {
  getDemandes, getMesDemandes, accepterContratDemande, refuserContratDemande,
  getChronologieDemande, uploadDocumentDemande, resoumettreComplement,
} from '../../api/demandes';
import { useConfirm } from '../ui/useConfirm';
import { getLocaux } from '../../api/patrimoine';
import { getContrats } from '../../api/contrats';
import { REGLEMENT_CONTRAT } from '../../utils/constants';
import { STATUT_STYLES } from '../../utils/statutStyles';
import { photoLocal } from '../../utils/locaux';

export default function SuiviDemande() {
  const confirm = useConfirm();
  const fileInputRef = useRef(null);
  const [demandes, setDemandes] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [locauxMap, setLocauxMap] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  const [selectedContratDossier, setSelectedContratDossier] = useState(null);
  const [dateRdvChoisie, setDateRdvChoisie] = useState('');
  const [loading, setLoading] = useState(false);
  const [chronoDossier, setChronoDossier] = useState(null);
  const [chrono, setChrono] = useState(null);
  const [chronoLoading, setChronoLoading] = useState(false);
  // Re-soumission
  const [resoumettreDossier, setResoumettreDossier] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('AUTRE');
  const [uploading, setUploading] = useState(false);
  const [resoumettreLoading, setResoumettreLoading] = useState(false);

  const ouvrirChronologie = async (d) => {
    setChronoDossier(d);
    setChrono(null);
    setChronoLoading(true);
    try {
      setChrono(await getChronologieDemande(d.id));
    } catch {
      toast.error("Chronologie indisponible pour ce dossier.");
      setChronoDossier(null);
    } finally {
      setChronoLoading(false);
    }
  };

  const ouvrirResoumettre = (d) => {
    setResoumettreDossier(d);
    setUploadFile(null);
    setUploadType('AUTRE');
  };

  const handleUploadPiece = async () => {
    if (!uploadFile || !resoumettreDossier) return;
    setUploading(true);
    try {
      await uploadDocumentDemande(resoumettreDossier.id, {
        fichier: uploadFile,
        type_document: uploadType,
        libelle: uploadFile.name,
      });
      toast.success('Pièce ajoutée avec succès.');
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      toast.error("Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleResoumettre = async () => {
    if (!resoumettreDossier) return;
    const ok = await confirm({
      title: 'Re-soumettre le dossier ?',
      message: 'Le Bureau du Courrier recevra une notification et examinera à nouveau votre dossier complété.',
      confirmLabel: 'Re-soumettre',
      cancelLabel: 'Annuler',
    });
    if (!ok) return;
    setResoumettreLoading(true);
    try {
      const maj = await resoumettreComplement(resoumettreDossier.id);
      setDemandes((prev) => prev.map((d) => d.id === maj.id ? maj : d));
      toast.success('Dossier re-soumis ! Le Bureau du Courrier en a été notifié.');
      setResoumettreDossier(null);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la re-soumission.');
    } finally {
      setResoumettreLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      getMesDemandes().catch(() => getDemandes()),
      getLocaux(),
      getContrats().catch(() => []),
    ])
      .then(([dems, locs, ctrs]) => {
        setContrats(ctrs);
        const map = {};
        locs.forEach(l => { map[l.id] = l; });
        setLocauxMap(map);
        setDemandes(dems);
      })
      .catch(() => toast.error("Erreur de chargement des demandes"))
      .finally(() => setLoadingData(false));
  }, []);


  const contratLie = selectedContratDossier
    ? contrats.find(
        (c) =>
          c.demande === selectedContratDossier.id ||
          (selectedContratDossier.local && c.local === selectedContratDossier.local),
      ) || null
    : null;

  const accepterContrat = async () => {
    setLoading(true);
    try {
      await accepterContratDemande(selectedContratDossier.id, dateRdvChoisie);
      setDemandes((prev) =>
        prev.map((d) =>
          d.id === selectedContratDossier.id
            ? {
                ...d,
                statut: 'CONTRAT_ACCEPTE_RDV_FIXE',
                rdv_signature_date: dateRdvChoisie,
              }
            : d
        )
      );

      toast.success(
        `Projet de contrat accepté ! Rendez-vous de signature confirmé le ${dateRdvChoisie} avec le Directeur Général CROUS-T.`
      );
      setSelectedContratDossier(null);
    } catch {
      toast.error('Erreur lors de l\'acceptation du contrat.');
    } finally {
      setLoading(false);
    }
  };

  const refuserContrat = async () => {
    // Ecran de confirmation applicatif (aucun window.confirm natif).
    const valide = await confirm({
      title: 'Refuser la proposition de contrat ?',
      message:
        'Cette decision est irreversible : votre dossier sera clos et le local pourra etre propose a un autre candidat.',
      confirmLabel: 'Refuser le contrat',
      cancelLabel: 'Revenir en arriere',
      tone: 'danger',
    });
    if (!valide) return;

    setLoading(true);
    try {
      await refuserContratDemande(selectedContratDossier.id, 'Refus du candidat');
      setDemandes((prev) =>
        prev.map((d) =>
          d.id === selectedContratDossier.id ? { ...d, statut: 'CONTRAT_REFUSE' } : d
        )
      );
      toast.success('Proposition de contrat refusée.');
      setSelectedContratDossier(null);
    } catch {
      toast.error('Erreur lors du refus du contrat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Suivi des candidatures"
        title="Mes dossiers de candidature & Propositions de Contrat"
        subtitle="Consultez l'avancement de vos demandes, l'expertise technique et validez les contrats."
      />

      <div className="space-y-4">
        {loadingData ? (
          <p className="text-center text-muted">Chargement de vos dossiers...</p>
        ) : demandes.length === 0 ? (
          <p className="text-center text-muted">Vous n'avez déposé aucune candidature pour le moment.</p>
        ) : demandes.map((d) => {
          const localObj = locauxMap[d.local];
          return (
            <Card key={d.id} className="border-l-4 border-l-teal hover:shadow-md transition-shadow relative overflow-hidden">
              {(d.statut === 'FAVORABLE' || d.statut === 'EN_ATTENTE_SIGNATURE') && (
                 <div className="absolute top-0 right-0 bg-amber text-ink text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm">PROPOSITION DE CONTRAT</div>
              )}
              <div className="flex flex-col md:flex-row items-start gap-5">
                <img
                  src={photoLocal(localObj)}
                  alt={`Local ${localObj?.reference || d.local}`}
                  loading="lazy"
                  className="w-full md:w-44 h-32 object-cover rounded-xl border border-border flex-shrink-0"
                />
                <div className="flex-1 min-w-0 w-full flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs text-muted bg-paper px-2 py-1 rounded border border-border">{d.reference_anonyme || `DOSSIER-${d.id}`}</span>
                      <span className="bg-teal-pale text-teal text-[10px] font-mono font-bold px-2 py-1 rounded uppercase tracking-wider">
                        {d.type_demande.replace(/_/g, ' ')}
                      </span>
                      <StatusBadge statut={d.statut} />
                    </div>
                    
                    <h3 className="font-display font-bold text-xl text-ink mt-2 mb-1">
                      Local visé : {localObj?.reference || d.local}
                    </h3>
                    <p className="text-sm text-muted mb-4">
                      Dossier déposé le {new Date(d.date_depot).toLocaleDateString('fr-SN')}
                    </p>

                {/* Notification d'alerte pour pièces manquantes - avec note de renvoi + CTA */}
                {d.statut === 'MITIGEE_COMPLEMENT' && (
                  <div style={{
                    marginTop: 12, padding: '14px 16px',
                    background: 'rgba(217,119,6,0.07)', border: '1px solid #d97706',
                    borderRadius: 12, fontSize: 13,
                  }}>
                    <p style={{ fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 6px' }}>
                      ⚠️ Action requise : Pièces complémentaires demandées
                    </p>
                    {d.derniere_note_complement && (
                      <p style={{ fontSize: 12, color: '#78350f', fontFamily: 'var(--font-mono)', margin: '0 0 8px', padding: '6px 10px', background: 'rgba(217,119,6,0.1)', borderRadius: 8 }}>
                        Note : {d.derniere_note_complement}
                      </p>
                    )}
                    {d.nb_renvois > 1 && (
                      <p style={{ fontSize: 11, color: '#b45309', margin: '0 0 8px' }}>
                        🔄 Renvoi n°{d.nb_renvois} - assurez-vous d'avoir bien complété toutes les pièces.
                      </p>
                    )}
                    <Button variant="amber" size="sm" onClick={() => ouvrirResoumettre(d)} style={{ marginTop: 4 }}>
                      📎 Ajouter des pièces &amp; Re-soumettre →
                    </Button>
                  </div>
                )}

                {/* Notification dossier archivé / défavorable */}
                {(d.statut === 'DEFAVORABLE' || d.archive || d.statut === 'MITIGEE_ARCHIVEE') && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm mb-3">
                    <p className="font-bold text-rose-700 flex items-center gap-2">
                      <span>📁</span> Dossier classé sans suite (Archivé)
                    </p>
                    {d.commentaire_archivage && (
                      <p className="text-rose-800 text-xs mt-1 font-mono">
                        Motif : {d.commentaire_archivage}
                      </p>
                    )}
                  </div>
                )}

                {/* RDV Fixé si déjà accepté */}
                {d.rdv_signature_date && (
                  <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg text-sm mb-4">
                    <p className="font-bold text-green-700 flex items-center gap-2"><span>✅</span> Rendez-vous de signature confirmé</p>
                    <p className="text-green-800 font-mono mt-1 ml-6 text-xs">Le {new Date(d.rdv_signature_date).toLocaleString('fr-SN')} avec la Direction CROUS-T.</p>
                  </div>
                )}

                {/* Tracking Progress Bar */}
                <div className="mt-5 pt-4 border-t border-border w-full">
                  <p className="text-[11px] uppercase font-mono text-muted mb-2 font-bold tracking-wider">Avancement du traitement</p>
                  <div className="flex items-center w-full max-w-sm h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ 
                        width: d.statut === 'NOUVELLE' ? '15%' :
                               d.statut === 'CONTROLE_RECEVABILITE' ? '35%' :
                               d.statut === 'EN_EXPERTISE_TECHNIQUE' ? '50%' :
                               d.statut === 'CONTROLE_HYGIENE' ? '65%' :
                               d.statut === 'EN_ATTENTE_DECISION' ? '85%' :
                               (d.statut === 'FAVORABLE' || d.statut.includes('CONTRAT')) ? '100%' :
                               (d.statut.includes('DEFAVORABLE') || d.statut.includes('REFUSE') || d.statut.includes('ARCHIVEE')) ? '100%' : '50%',
                        background: (d.statut.includes('DEFAVORABLE') || d.statut.includes('REFUSE') || d.statut.includes('ARCHIVEE')) 
                                    ? 'var(--red)' : 'linear-gradient(90deg, var(--gold) 0%, #fde047 100%)' 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs font-mono font-bold mt-2" style={{ color: (d.statut.includes('DEFAVORABLE') || d.statut.includes('REFUSE')) ? 'var(--red)' : 'var(--gold)' }}>
                    {STATUT_STYLES[d.statut]?.label || d.statut.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-3 min-w-[220px] pt-2">
                {(d.statut === 'FAVORABLE' || d.statut === 'EN_ATTENTE_SIGNATURE') && (
                  <Button variant="amber" onClick={() => setSelectedContratDossier(d)} className="w-full shadow-sm">
                    Consulter le Contrat →
                  </Button>
                )}
                <Button variant="secondary" onClick={() => ouvrirChronologie(d)} className="w-full">
                  Voir l'historique détaillé
                </Button>
              </div>
            </div>
          </div>
        </Card>
      );
    })}
  </div>

      {/* Modal Re-soumission : upload de pièces + bouton re-soumettre */}
      {resoumettreDossier && (
        <Modal
          open={!!resoumettreDossier}
          onClose={() => setResoumettreDossier(null)}
          title={`Compléter & Re-soumettre - ${resoumettreDossier.reference_anonyme || resoumettreDossier.id}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AlertBanner type="warning">
              {resoumettreDossier.derniere_note_complement
                ? <><strong>Pièces demandées :</strong> {resoumettreDossier.derniere_note_complement}</>           
                : 'Le Bureau du Courrier a retourné votre dossier pour complétion. Ajoutez les pièces manquantes puis cliquez sur « Re-soumettre ».'}
            </AlertBanner>

            <Field label="Type de document">
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
              >
                {[
                  ['CARTE_ETUDIANT', "Carte étudiant"], ['PIECE_IDENTITE', "Pièce d'identité"],
                  ['REGISTRE_COMMERCE', 'Registre de commerce'], ['ATTESTATION_HYGIENE', "Attestation d'hygiène"],
                  ['PLAN_AMENAGEMENT', "Plan d'aménagement"], ['CV', 'Curriculum Vitae'],
                  ['BUSINESS_PLAN', 'Business Plan'], ['AUTRE', 'Autre document'],
                ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>

            <Field label="Fichier à joindre">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                style={{ fontSize: 13 }}
              />
            </Field>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleUploadPiece}
              disabled={!uploadFile || uploading}
            >
              {uploading ? 'Upload en cours…' : '📎 Joindre cette pièce'}
            </Button>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" onClick={() => setResoumettreDossier(null)}>Annuler</Button>
              <Button variant="amber" onClick={handleResoumettre} disabled={resoumettreLoading}>
                {resoumettreLoading ? 'Re-soumission…' : '🚀 Re-soumettre le dossier complété →'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Chronologie du dossier */}
      <Modal
        open={!!chronoDossier}
        onClose={() => setChronoDossier(null)}
        title={chronoDossier ? `Chronologie - ${chronoDossier.reference_anonyme || `DOSSIER-${chronoDossier.id}`}` : ''}
        size="lg"
      >
        {chronoLoading && <p className="text-sm text-muted">Chargement de la chronologie…</p>}
        {!chronoLoading && chrono && (
          <div className="space-y-4">
            {locauxMap[chronoDossier?.local] && (
              <img
                src={photoLocal(locauxMap[chronoDossier.local])}
                alt={`Local ${locauxMap[chronoDossier.local]?.reference || chronoDossier.local}`}
                loading="lazy"
                className="w-full h-44 object-cover rounded-xl border border-border"
              />
            )}
            <AlertBanner type="info">
              Étape actuelle : <strong>{chrono.statut_label || chrono.statut}</strong>
              {chrono.est_cloturee && ' - dossier clôturé'}
            </AlertBanner>


            {/* Journal horodate des decisions */}
            {(chrono.evenements || []).length > 0 && (
              <div>
                <p className="font-display font-bold text-sm text-ink mb-2">Journal des décisions</p>
                <Timeline
                  items={(chrono.evenements || []).map((ev) => ({
                    statut: ev.statut,
                    titre: ev.libelle,
                    date: ev.date ? new Date(ev.date).toLocaleString('fr-SN') : '',
                    commentaire: ev.commentaire || '',
                    auteur: ev.auteur || '',
                  }))}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Consultation & Acceptation du Contrat par le Candidat */}
      <Modal
        open={!!selectedContratDossier}
        onClose={() => setSelectedContratDossier(null)}
        title={selectedContratDossier ? `Proposition de Bail Officiel - ${selectedContratDossier.reference_anonyme || selectedContratDossier.id}` : ''}
        size="lg"
      >
        {selectedContratDossier && (
          <div className="space-y-4">
            <AlertBanner type="info">
              <strong>Contrat rédigé par le Service Juridique :</strong> Veuillez lire attentivement les termes du bail, le règlement intérieur strict et choisir votre date de rendez-vous pour la signature physique avec le Directeur Général.
            </AlertBanner>

            {/* Conditions Financières */}
            <div className="grid grid-cols-3 gap-3 bg-paper2 p-3 rounded text-sm text-center">
              <div>
                <p className="font-mono text-xs text-muted uppercase">Durée du Bail</p>
                <p className="font-bold text-ink">{contratLie ? `${contratLie.duree_mois} mois` : '-'}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted uppercase">Redevance Mensuelle</p>
                <p className="font-bold text-teal">{contratLie ? `${Number(contratLie.redevance_mensuelle).toLocaleString('fr-SN')} FCFA` : '-'}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted uppercase">Dépôt de Garantie</p>
                <p className="font-bold text-amber">{contratLie ? `${Number(contratLie.montant_caution).toLocaleString('fr-SN')} FCFA` : '-'}</p>
              </div>
            </div>

            {/* Modalités de paiement */}
            <div className="p-3 bg-white border border-ink/15 rounded text-xs">
              <p className="font-bold text-ink mb-1">Modalités de Paiement des Redevances :</p>
              <p className="text-muted">Paiement selon l'échéancier généré par la plateforme : Wave, Orange Money ou espèces au guichet comptable.</p>
            </div>

            {/* Règlements Stricts & Sanctions */}
            <div className="p-3 bg-paper2 border border-ink/15 rounded">
              <p className="font-display font-bold text-sm text-stamp mb-2">Règlements Stricts & Clause Résolutoire :</p>
              <pre className="font-mono text-xs text-ink/80 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto pr-2 bg-paper p-3 border border-ink/10 rounded">
                {REGLEMENT_CONTRAT}
              </pre>
            </div>

            {/* Choix Date RDV Signature */}
            <Field label="Choisir un créneau de Rendez-vous pour la signature avec le Directeur Général CROUS-T *" required>
              <input
                type="datetime-local"
                value={dateRdvChoisie}
                onChange={(e) => setDateRdvChoisie(e.target.value)}
                required
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </Field>

            <div className="flex gap-3 justify-end pt-3 border-t border-ink/10">
              <Button variant="stamp" onClick={refuserContrat} disabled={loading}>
                Refuser la proposition
              </Button>
              <Button variant="primary" onClick={accepterContrat} disabled={loading || !dateRdvChoisie}>
                {loading ? 'Validation…' : '✓ Accepter le Contrat & Confirmer le Rendez-vous de Signature'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}

