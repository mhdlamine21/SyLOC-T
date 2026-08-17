import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import { useState, useEffect, useCallback } from 'react';
import { StatusBadge, Button, Modal, Field, Textarea, Select } from '../common/ui';
import { DataTable, EmptyState, useConfirm } from '../ui';
import {
  getContrats,
  getApercuContrat,
  redigerContrat,
  activerContrat,
  resilierContrat,
  getQuitusGeneral,
  getModelesContrat,
  convoquerContrat,
} from '../../api/contrats';
import { messageErreur } from '../../api/utils';
import ApercuContratModal from './ApercuContratModal';
import ResiliationModal from './ResiliationModal';
import toast from 'react-hot-toast';

const fmtMontant = (v) => `${Number(v || 0).toLocaleString('fr-FR')} FCFA`;
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('fr-FR') : '-');

export default function PortefeuilleContrats() {
  const confirm = useConfirm();
  const [contrats, setContrats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modeles, setModeles] = useState([]);

  const [apercu, setApercu] = useState(null);
  const [apercuLoading, setApercuLoading] = useState(false);
  const [apercuOpen, setApercuOpen] = useState(false);

  const [contratRedaction, setContratRedaction] = useState(null);
  const [modeleChoisi, setModeleChoisi] = useState('');
  const [objetRedaction, setObjetRedaction] = useState('');
  const [clausesRedaction, setClausesRedaction] = useState('');
  const [redactionSaving, setRedactionSaving] = useState(false);

  const [contratResiliation, setContratResiliation] = useState(null);
  const [resiliationSaving, setResiliationSaving] = useState(false);

  const [quitus, setQuitus] = useState(null);
  const [quitusOpen, setQuitusOpen] = useState(false);

  const [contratSignature, setContratSignature] = useState(null);
  const [signatureSaving, setSignatureSaving] = useState(false);
  
  // Nouveaux champs pour la convocation
  const [modeConvocation, setModeConvocation] = useState('PHYSIQUE');
  const [dateConvocation, setDateConvocation] = useState('');
  const [lieuConvocation, setLieuConvocation] = useState('');
  const [convocationSaving, setConvocationSaving] = useState(false);
  
  const [reglementExplique, setReglementExplique] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([getContrats(), getModelesContrat(true)]);
      setContrats(c);
      setModeles(m);
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors du chargement du portefeuille contractuel.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleApercu = async (contrat) => {
    setApercuOpen(true);
    setApercuLoading(true);
    try {
      const data = await getApercuContrat(contrat.id);
      setApercu(data);
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de la génération de l'aperçu."));
      setApercuOpen(false);
    } finally {
      setApercuLoading(false);
    }
  };

  const openRedaction = (contrat) => {
    setContratRedaction(contrat);
    setModeleChoisi(contrat.modele || '');
    setObjetRedaction(contrat.objet || '');
    setClausesRedaction(contrat.clauses_particulieres || '');
  };

  const handleRediger = async (e) => {
    e.preventDefault();
    setRedactionSaving(true);
    try {
      await redigerContrat(contratRedaction.id, {
        modele: modeleChoisi || undefined,
        objet: objetRedaction || undefined,
        clauses_particulieres: clausesRedaction,
      });
      toast.success(`Acte ${contratRedaction.reference} rédigé.`);
      setContratRedaction(null);
      fetchAll();
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de la rédaction de l'acte."));
    } finally {
      setRedactionSaving(false);
    }
  };

  const handleOpenSignature = (contrat) => {
    setContratSignature(contrat);
    setModeConvocation(contrat.convocation_mode || 'PHYSIQUE');
    setDateConvocation(contrat.convocation_date ? new Date(contrat.convocation_date).toISOString().slice(0, 16) : '');
    setLieuConvocation(contrat.convocation_lieu || '');
    setReglementExplique(false);
  };

  const handleConvoquer = async () => {
    if (!dateConvocation) {
      toast.error('Veuillez spécifier la date et l\'heure de la convocation.');
      return;
    }
    setConvocationSaving(true);
    try {
      await convoquerContrat(contratSignature.id, {
        date_rdv: dateConvocation,
        mode: modeConvocation,
        lieu: lieuConvocation
      });
      toast.success(`Convocation ${modeConvocation.toLowerCase()} envoyée à ${contratSignature.demandeur_nom}.`);
      fetchAll();
      // On met à jour l'état local pour refléter le changement sans fermer la modale
      setContratSignature(prev => ({...prev, convocation_envoyee: true, convocation_date: dateConvocation, convocation_mode: modeConvocation, convocation_lieu: lieuConvocation}));
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors de l\'envoi de la convocation.'));
    } finally {
      setConvocationSaving(false);
    }
  };

  const handleActiver = async (e) => {
    e.preventDefault();
    if (!reglementExplique) {
      toast.error('Vous devez confirmer avoir expliqué le règlement intérieur.');
      return;
    }
    setSignatureSaving(true);
    try {
      // In a real app we might also send the modeConvocation to the backend or trigger an email
      await activerContrat(contratSignature.id);
      toast.success(`Feu Vert accordé ! Bail ${contratSignature.reference} activé.`);
      setContratSignature(null);
      fetchAll();
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de l'activation."));
    } finally {
      setSignatureSaving(false);
    }
  };

  const handleResilier = async (payload) => {
    setResiliationSaving(true);
    try {
      await resilierContrat(contratResiliation.id, payload);
      toast.success(`Bail ${contratResiliation.reference} résilié.`);
      setContratResiliation(null);
      fetchAll();
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors de la résiliation.'));
    } finally {
      setResiliationSaving(false);
    }
  };

  const handleQuitus = async (contrat) => {
    try {
      const data = await getQuitusGeneral(contrat.id);
      setQuitus(data);
      setQuitusOpen(true);
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors de la génération du quitus.'));
    }
  };

  const columns = [
    { key: 'reference', label: 'Référence', render: (v) => <strong style={{ color: 'var(--text-navy)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</strong> },
    { key: 'demandeur_nom', label: 'Occupant', render: (v) => v || '-' },
    { key: 'local_reference', label: 'Local' },
    { key: 'statut', label: 'Statut', render: (v) => <StatusBadge statut={v} /> },
    { key: 'date_debut', label: 'Début', render: (v) => fmtDate(v) },
    { key: 'date_fin', label: 'Fin', render: (v) => fmtDate(v) },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={() => handleApercu(row)}>Aperçu</Button>
          {row.statut !== 'ACTIF' && row.statut !== 'RESILIE' && (
            <Button variant="secondary" size="sm" onClick={() => openRedaction(row)}>✎ Rédiger</Button>
          )}
          {row.statut !== 'ACTIF' && row.statut !== 'RESILIE' && (
            <Button variant="amber" size="sm" onClick={() => handleOpenSignature(row)}>Signature & Feu Vert</Button>
          )}
          {row.statut !== 'RESILIE' && (
            <Button variant="danger" size="sm" onClick={() => setContratResiliation(row)}>⚖ Résilier</Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => handleQuitus(row)}>Quitus</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={contrats}
        loading={loading}
        pageSize={10}
        empty={<EmptyState icon={<FolderOutlinedIcon style={{ fontSize: 20 }} />} title="Aucun contrat" description="Le portefeuille contractuel est vide pour le moment." />}
      />

      <ApercuContratModal open={apercuOpen} onClose={() => setApercuOpen(false)} apercu={apercu} loading={apercuLoading} />

      {contratRedaction && (
        <Modal open={!!contratRedaction} onClose={() => setContratRedaction(null)} title={`Rédaction de l'acte ${contratRedaction.reference}`}>
          <form onSubmit={handleRediger} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Modèle d'acte">
              <Select value={modeleChoisi} onChange={(e) => setModeleChoisi(e.target.value)}>
                <option value="">- Gabarit par défaut -</option>
                {modeles.map((m) => (
                  <option key={m.id} value={m.id}>{m.nom}</option>
                ))}
              </Select>
            </Field>
            <Field label="Objet du contrat">
              <input
                type="text"
                value={objetRedaction}
                onChange={(e) => setObjetRedaction(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
                placeholder="Occupation domaniale d'un local du site VCN"
              />
            </Field>
            <Field label="Clauses particulières">
              <Textarea value={clausesRedaction} onChange={(e) => setClausesRedaction(e.target.value)} placeholder="Précisez les conditions particulières…" />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setContratRedaction(null)}>Annuler</Button>
              <Button variant="amber" type="submit" disabled={redactionSaving}>{redactionSaving ? 'Rédaction…' : "Régénérer l'acte"}</Button>
            </div>
          </form>
        </Modal>
      )}

      <ResiliationModal
        open={!!contratResiliation}
        onClose={() => setContratResiliation(null)}
        contrat={contratResiliation}
        onConfirm={handleResilier}
        saving={resiliationSaving}
      />

      <Modal open={quitusOpen} onClose={() => setQuitusOpen(false)} title={quitus ? `Quitus général - ${quitus.reference}` : 'Quitus général'}>
        {quitus && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <p><strong>Contrat :</strong> {quitus.contrat}</p>
            <p><strong>Occupant :</strong> {quitus.occupant}</p>
            <p><strong>Local :</strong> {quitus.local} ({quitus.local_localisation})</p>
            <p><strong>Total encaissé :</strong> {fmtMontant(quitus.total_encaisse)}</p>
            <p><strong>Solde restant :</strong> {fmtMontant(quitus.solde_restant)}</p>
            <p><strong>Émis le :</strong> {fmtDate(quitus.date_emission)}</p>
            <div
              style={{
                marginTop: 6,
                padding: 12,
                borderRadius: 10,
                background: quitus.quitte ? 'var(--ok-soft, #eafaf1)' : 'var(--danger-soft, #fdecea)',
                color: quitus.quitte ? 'var(--green)' : 'var(--red)',
                fontWeight: 700,
              }}
            >
              {quitus.mention}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" onClick={() => setQuitusOpen(false)}>Fermer</Button>
              <Button variant="amber" onClick={() => window.print()}>Imprimer</Button>
            </div>
          </div>
        )}
      </Modal>

      {contratSignature && (
        <Modal open={!!contratSignature} onClose={() => setContratSignature(null)} title={`Processus Signature & Feu Vert - ${contratSignature.reference}`}>
          <form onSubmit={handleActiver} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8, fontSize: 13, border: '1px solid var(--border)' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 700, color: 'var(--text-navy)' }}>Étape 1 : Convocation de l'attributaire</p>
              
              {contratSignature.convocation_envoyee ? (
                <div style={{ padding: 12, background: 'var(--ok-soft, #eafaf1)', borderRadius: 6, color: 'var(--green)', fontSize: 12.5, fontWeight: 500 }}>
                  <p style={{ margin: 0 }}>✓ Convocation déjà envoyée pour le {fmtDate(contratSignature.convocation_date)} à {new Date(contratSignature.convocation_date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}.</p>
                  <p style={{ margin: '4px 0 0 0' }}>Lieu / Lien : {contratSignature.convocation_lieu || 'Non précisé'} ({contratSignature.convocation_mode})</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Date et Heure du rendez-vous *">
                    <input
                      type="datetime-local"
                      value={dateConvocation}
                      onChange={(e) => setDateConvocation(e.target.value)}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                  </Field>
                  <Field label="Mode de convocation">
                    <Select value={modeConvocation} onChange={(e) => setModeConvocation(e.target.value)}>
                      <option value="PHYSIQUE">Convocation Physique (au bureau Juridique)</option>
                      <option value="VIRTUELLE">Entretien Virtuel (Visioconférence)</option>
                    </Select>
                  </Field>
                  <Field label="Lieu ou lien visio">
                    <input
                      type="text"
                      value={lieuConvocation}
                      onChange={(e) => setLieuConvocation(e.target.value)}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
                      placeholder={modeConvocation === 'PHYSIQUE' ? 'Ex: Bureau DCUVE' : 'Ex: Lien Google Meet/Teams'}
                    />
                  </Field>
                  <Button variant="secondary" type="button" size="sm" onClick={handleConvoquer} disabled={convocationSaving}>
                    {convocationSaving ? 'Envoi...' : '✉️ Envoyer la convocation'}
                  </Button>
                </div>
              )}
            </div>

            <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8, fontSize: 13, border: '1px solid var(--border)' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 700, color: 'var(--text-navy)' }}>Étape 2 : Validation des prérequis & Signature</p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={reglementExplique}
                  onChange={(e) => setReglementExplique(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontWeight: 600 }}>Le règlement intérieur du CROUS-T a été lu et expliqué à l'occupant.</span>
              </label>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>
                En accordant ce Feu Vert, le contrat devient actif, le local est marqué comme occupé, et l'échéancier des paiements est généré.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setContratSignature(null)}>Annuler</Button>
              <Button variant="amber" type="submit" disabled={!reglementExplique || signatureSaving}>
                {signatureSaving ? 'Validation...' : '✓ Signature bilatérale & Feu Vert'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

