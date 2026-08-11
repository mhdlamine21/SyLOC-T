import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  PageWrapper, SectionHeader, Card, StatusBadge, Button, Modal, Field, Textarea, Select, AlertBanner,
} from '../common/ui';
import { contratMock, paiementsMock } from '../../mocks/data';
import { useAuth } from '../../context/AuthContext';

export default function EspaceOccupant() {
  const { user } = useAuth();
  const contrat = contratMock;
  const paiements = paiementsMock;

  const [showResiliationModal, setShowResiliationModal] = useState(false);
  const [dateDeparture, setDateDeparture] = useState('');
  const [motifResiliation, setMotifResiliation] = useState('');
  const [showQuitusPdf, setShowQuitusPdf] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calcul du préavis de 2 mois
  const minDatePreavis = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().slice(0, 10);
  };

  const soumettreResiliation = async (e) => {
    e.preventDefault();
    if (!dateDeparture || !motifResiliation.trim()) {
      toast.error('Date de départ et motif de résiliation requis.');
      return;
    }

    const minDate = minDatePreavis();
    if (dateDeparture < minDate) {
      toast.error(`Le préavis obligatoire est de 2 mois minimum. Votre date de départ doit être égale ou postérieure au ${minDate}.`);
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Demande de résiliation de bail transmise à la Direction avec préavis de 2 mois.');
    contrat.demande_resiliation_encours = true;
    setShowResiliationModal(false);
    setLoading(false);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Espace Occupant Titulaire"
        title="Mon Contrat d'Occupation & Historique Redevances"
        subtitle={`Gestion du bail #${contrat.id_contrat} • Local ${contrat.local.reference}`}
      />

      {/* Alerte Résiliation en cours s'il y a préavis */}
      {contrat.demande_resiliation_encours && (
        <AlertBanner type="warn">
          <strong>Résiliation de bail en cours :</strong> Votre demande de résiliation avec préavis de 2 mois a été enregistrée. Fin d'occupation prévue le {dateDeparture || '31/10/2026'}.
        </AlertBanner>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="text-center py-4 bg-teal-pale border-teal/30">
          <p className="font-mono text-xs text-teal uppercase font-bold">Local Occupé</p>
          <p className="font-display text-2xl font-bold text-teal mt-1">{contrat.local.reference}</p>
          <p className="text-[11px] text-muted">{contrat.local.localisation}</p>
        </Card>

        <Card className="text-center py-4">
          <p className="font-mono text-xs text-muted uppercase">Redevance Mensuelle</p>
          <p className="font-display text-2xl font-bold text-ink mt-1">
            {contrat.redevance_mensuelle.toLocaleString('fr-SN')} <span className="text-xs font-normal">FCFA</span>
          </p>
          <p className="text-[11px] text-ok font-semibold">Caution : {contrat.montant_caution.toLocaleString('fr-SN')} FCFA</p>
        </Card>

        <Card className="text-center py-4">
          <p className="font-mono text-xs text-muted uppercase">Score Conformité QHSE</p>
          <p className="font-display text-2xl font-bold text-ok mt-1">★ 4.2 / 5</p>
          <p className="text-[11px] text-muted">Bon respect des normes</p>
        </Card>

        <Card className="text-center py-4">
          <p className="font-mono text-xs text-muted uppercase">Score Avis Étudiants</p>
          <p className="font-display text-2xl font-bold text-amber mt-1">★ 4.5 / 5</p>
          <p className="text-[11px] text-muted">Très apprécié en restauration</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        {/* Détails du Bail & Préavis */}
        <div className="md:col-span-5 space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-ink/10">
              <h2 className="font-display font-bold text-lg text-ink">Fiche du Contrat de Bail</h2>
              <span className="text-xs font-mono font-bold text-ok bg-ok-soft px-2.5 py-0.5 rounded">
                Bail Actif
              </span>
            </div>

            <div className="space-y-3 text-sm">
              {[
                ['N° de contrat', contrat.id_contrat],
                ['Bailleur', 'CROUS de Thiès (CROUS-T)'],
                ['Occupant titulaire', contrat.occupant.nom],
                ['Local attribué', `${contrat.local.reference} — ${contrat.local.localisation}`],
                ['Date de signature', contrat.date_signature],
                ['Date de prise d\'effet', contrat.date_debut],
                ['Préavis obligatoire', `${contrat.preavis_mois} mois`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-ink/5 pb-2 last:border-0">
                  <span className="font-mono text-xs text-muted uppercase">{k}</span>
                  <span className="font-semibold text-ink text-right">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-ink/10 flex flex-col gap-2">
              <Button
                variant="stamp"
                className="w-full text-xs"
                onClick={() => setShowResiliationModal(true)}
                disabled={contrat.demande_resiliation_encours}
              >
                📄 Résilier mon contrat (Préavis 2 mois)
              </Button>
            </div>
          </Card>
        </div>

        {/* Historique des paiements & Téléchargement Quitus PDF */}
        <div className="md:col-span-7">
          <Card>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-ink/10">
              <div>
                <h2 className="font-display font-bold text-lg text-ink">Historique de mes Paiements & Quitus</h2>
                <p className="text-xs text-muted">Téléchargez vos quitus officiels au format PDF</p>
              </div>
              <span className="font-mono text-xs text-muted font-bold">{paiements.length} règlement(s)</span>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {paiements.map((p) => (
                <div key={p.id} className="p-3 border border-ink/10 hover:border-teal bg-paper/30 rounded flex justify-between items-center transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted">{p.date}</span>
                      <span className="font-mono text-xs font-bold text-teal bg-teal-pale px-2 py-0.5 rounded">
                        {p.mode}
                      </span>
                    </div>
                    <p className="font-display font-bold text-base text-ok mt-1">
                      {p.montant.toLocaleString('fr-SN')} FCFA
                    </p>
                    <p className="font-mono text-xs text-muted">Réf: {p.reference}</p>
                  </div>

                  <Button
                    size="sm"
                    variant="amber"
                    onClick={() => setShowQuitusPdf(p)}
                  >
                    📄 Télécharger Quitus PDF ({p.quitus})
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Demande de Résiliation par l'Occupant */}
      <Modal open={showResiliationModal} onClose={() => setShowResiliationModal(false)} title="Demande de Résiliation de Contrat de Bail">
        <form onSubmit={soumettreResiliation} className="space-y-4">
          <AlertBanner type="warn">
            <strong>Règle du Préavis :</strong> Conformément au règlement d'occupation du CROUS-T, toute résiliation à l'initiative de l'occupant exige un <strong>préavis écrit de 2 mois minimum</strong>.
          </AlertBanner>

          <Field label="Date de départ souhaitée *" required hint={`Date minimale autorisée : ${minDatePreavis()}`}>
            <input
              type="date"
              value={dateDeparture}
              min={minDatePreavis()}
              onChange={(e) => setDateDeparture(e.target.value)}
              className="w-full border border-ink/20 bg-paper/60 px-3 py-2 text-sm text-ink rounded"
              required
            />
          </Field>

          <Field label="Motif de la résiliation *" required>
            <Textarea
              value={motifResiliation}
              onChange={(e) => setMotifResiliation(e.target.value)}
              placeholder="Expliquez la raison de votre départ (fin d'études, réorientation commerciale, déménagement…)"
              rows={3}
              required
            />
          </Field>

          <div className="flex gap-3 justify-end pt-3 border-t border-ink/10">
            <Button variant="ghost" onClick={() => setShowResiliationModal(false)}>Annuler</Button>
            <Button variant="stamp" type="submit" disabled={loading}>
              {loading ? 'Transmission…' : '✓ Soumettre la Résiliation (Préavis 2 mois)'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Impression / PDF Quitus */}
      {showQuitusPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setShowQuitusPdf(null)} />
          <div className="relative bg-white text-ink w-full max-w-lg shadow-2xl p-8 border-2 border-teal rounded-lg font-sans">
            
            {/* Header officiel document PDF */}
            <div className="border-b-2 border-teal pb-4 mb-4 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">REPUBLIQUE DU SENEGAL • MINISTERE DE L'ENSEIGNEMENT SUPERIEUR</p>
              <p className="font-display font-bold text-xl text-teal">CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES DE THIES</p>
              <p className="font-mono text-xs font-bold text-stamp uppercase mt-1">QUITUS OFFICIEL DE LIBERATION MENSUELLE</p>
              <p className="font-mono text-sm font-bold text-ink mt-0.5">N° {showQuitusPdf.quitus}</p>
            </div>

            <div className="space-y-3 text-xs">
              {[
                ['Occupant Titulaire', showQuitusPdf.occupant_nom || 'Mamadou Lô'],
                ['Local Commercial', showQuitusPdf.local_ref || 'LOC-004 (Cantine A)'],
                ['Montant de la redevance', `${showQuitusPdf.montant.toLocaleString('fr-SN')} FCFA`],
                ['Mode de règlement', showQuitusPdf.mode],
                ['Référence Transaction', showQuitusPdf.reference],
                ['Date d\'encaissement', showQuitusPdf.date],
                ['Statut de quittance', 'LIBÉRÉ ET CONFORME'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-ink/10 pb-1.5">
                  <span className="font-mono text-muted uppercase">{k}</span>
                  <span className="font-bold text-ink text-right">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-paper2 border border-ink/10 rounded text-[11px] text-muted text-center italic font-mono">
              Ce document fait foi de paiement de la redevance mensuelle d'occupation. Délivré par le Service Comptable du CROUS-T.
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="primary" className="flex-1 text-xs" onClick={() => window.print()}>
                🖨️ Télécharger / Imprimer en PDF
              </Button>
              <Button variant="ghost" className="flex-1 text-xs" onClick={() => setShowQuitusPdf(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
