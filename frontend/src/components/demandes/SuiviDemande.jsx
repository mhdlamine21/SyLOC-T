import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  PageWrapper, SectionHeader, Card, StatusBadge, Button, Modal, AlertBanner, Field, Select,
} from '../common/ui';
import { demandesMock } from '../../mocks/data';

export default function SuiviDemande() {
  const [demandes, setDemandes] = useState(demandesMock);
  const [selectedContratDossier, setSelectedContratDossier] = useState(null);
  const [dateRdvChoisie, setDateRdvChoisie] = useState('2026-08-23 à 14h30');
  const [loading, setLoading] = useState(false);

  const contractDemo = {
    duree: 12,
    redevance: 45000,
    caution: 90000,
    modalites: 'Paiement mensuel par Wave, Orange Money, Virement bancaire ou en espèces au Guichet Comptable.',
    reglements: `ARTICLE 1 - USAGE DU LOCAL : Le local est concédé à titre d'occupation domaniale précaire et révocable. Toute sous-location est formellement interdite sous peine de résiliation immédiate.\n\nARTICLE 2 - NORMES SANITAIRES ET PRIX : L'occupant s'engage à respecter scrupuleusement la grille des prix arrêtée avec le CROUS-T et à maintenir un état de propreté irréprochable.\n\nARTICLE 3 - PAIEMENT DES REDEVANCES : La redevance est payable d'avance le 15 de chaque mois. Tout retard supérieur à 10 jours entraînera des pénalités de 5% et l'émission d'un rappel à l'ordre.\n\nARTICLE 4 - SANCTIONS & EXPULSION : En cas de 3 avis défavorables QHSE ou d'impayé persistant, le contrat sera résilié de plein droit avec préavis d'urgence de 48 heures.`,
    dates_rdv: ['2026-08-22 à 10h00', '2026-08-23 à 14h30', '2026-08-25 à 11h00'],
  };

  const accepterContrat = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    setDemandes((prev) =>
      prev.map((d) =>
        d.id_demande === selectedContratDossier.id_demande
          ? {
              ...d,
              statut: 'CONTRAT_ACCEPTE_RDV_FIXE',
              rdv_signature: dateRdvChoisie,
            }
          : d
      )
    );

    toast.success(
      `Projet de contrat accepté ! Rendez-vous de signature confirmé le ${dateRdvChoisie} avec le Directeur Général CROUS-T.`
    );
    setSelectedContratDossier(null);
    setLoading(false);
  };

  const refuserContrat = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir refuser le contrat proposé ? La décision sera irréversible.')) {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 500));
      setDemandes((prev) =>
        prev.map((d) =>
          d.id_demande === selectedContratDossier.id_demande
            ? { ...d, statut: 'CONTRAT_REFUSE' }
            : d
        )
      );
      toast.success('Proposition de contrat refusée.');
      setSelectedContratDossier(null);
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
        {demandes.map((d) => (
          <Card key={d.id_demande} className="border-l-4 border-l-teal">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted">{d.id_demande}</span>
                  <span className="bg-amber text-ink text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                    {d.type}
                  </span>
                  <StatusBadge statut={d.statut} />
                </div>
                <p className="font-display font-bold text-lg text-ink mt-1">{d.description}</p>
                <p className="text-xs text-muted mt-1">
                  Local visé : <strong>{d.local_vise}</strong> • Déposé le {d.date_depot}
                </p>
                <p className="text-xs font-mono text-teal mt-2">📍 Étape actuelle : {d.etape}</p>

                {/* RDV Fixé si déjà accepté */}
                {d.rdv_signature && (
                  <div className="mt-3 p-3 bg-ok-soft border border-ok/30 rounded text-xs">
                    <p className="font-bold text-ok">📅 Rendez-vous de signature confirmé</p>
                    <p className="text-ink font-mono mt-0.5">Date retenue : {d.rdv_signature} avec le Directeur Général CROUS-T.</p>
                  </div>
                )}
              </div>

              {/* Action Proposition de Contrat */}
              <div>
                {(d.statut === 'FAVORABLE' || d.statut === 'PROPOSITION_CONTRAT_ENVOYEE' || d.id_demande === 'DM-2026-00799') && (
                  <Button variant="amber" size="sm" onClick={() => setSelectedContratDossier(d)}>
                    📜 Consulter le Contrat Rédigé & RDV Signature →
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Consultation & Acceptation du Contrat par le Candidat */}
      <Modal
        open={!!selectedContratDossier}
        onClose={() => setSelectedContratDossier(null)}
        title={selectedContratDossier ? `Proposition de Bail Officiel - ${selectedContratDossier.id_demande}` : ''}
        size="lg"
      >
        {selectedContratDossier && (
          <div className="space-y-4">
            <AlertBanner type="info">
              📜 <strong>Contrat rédigé par le Service Juridique :</strong> Veuillez lire attentivement les termes du bail, le règlement intérieur strict et choisir votre date de rendez-vous pour la signature physique avec le Directeur Général.
            </AlertBanner>

            {/* Conditions Financières */}
            <div className="grid grid-cols-3 gap-3 bg-paper2 p-3 rounded text-sm text-center">
              <div>
                <p className="font-mono text-xs text-muted uppercase">Durée du Bail</p>
                <p className="font-bold text-ink">{contractDemo.duree} Mois</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted uppercase">Redevance Mensuelle</p>
                <p className="font-bold text-teal">{contractDemo.redevance.toLocaleString('fr-SN')} FCFA</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted uppercase">Dépôt de Garantie</p>
                <p className="font-bold text-amber">{contractDemo.caution.toLocaleString('fr-SN')} FCFA</p>
              </div>
            </div>

            {/* Modalités de paiement */}
            <div className="p-3 bg-white border border-ink/15 rounded text-xs">
              <p className="font-bold text-ink mb-1">💳 Modalités de Paiement des Redevances :</p>
              <p className="text-muted">{contractDemo.modalites}</p>
            </div>

            {/* Règlements Stricts & Sanctions */}
            <div className="p-3 bg-paper2 border border-ink/15 rounded">
              <p className="font-display font-bold text-sm text-stamp mb-2">⚠️ Règlements Stricts & Clause Résolutoire :</p>
              <pre className="font-mono text-xs text-ink/80 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto pr-2 bg-paper p-3 border border-ink/10 rounded">
                {contractDemo.reglements}
              </pre>
            </div>

            {/* Choix Date RDV Signature */}
            <Field label="📅 Choisir un créneau de Rendez-vous pour la signature avec le Directeur Général CROUS-T *" required>
              <Select value={dateRdvChoisie} onChange={(e) => setDateRdvChoisie(e.target.value)}>
                {contractDemo.dates_rdv.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </Field>

            <div className="flex gap-3 justify-end pt-3 border-t border-ink/10">
              <Button variant="stamp" onClick={refuserContrat} disabled={loading}>
                ❌ Refuser la proposition
              </Button>
              <Button variant="primary" onClick={accepterContrat} disabled={loading}>
                {loading ? 'Validation…' : '✓ Accepter le Contrat & Confirmer le Rendez-vous de Signature'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
