import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  PageWrapper, SectionHeader, Card, StatusBadge, Button, Modal, AlertBanner, Field, Select,
} from '../common/ui';
import { getDemandes, changerStatutDemande, accepterContratDemande } from '../../api/demandes';
import { getLocaux } from '../../api/patrimoine';
import { getContrats } from '../../api/contrats';
import { REGLEMENT_CONTRAT } from '../../utils/constants';

export default function SuiviDemande() {
  const [demandes, setDemandes] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [locauxMap, setLocauxMap] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  const [selectedContratDossier, setSelectedContratDossier] = useState(null);
  const [dateRdvChoisie, setDateRdvChoisie] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([getDemandes(), getLocaux(), getContrats().catch(() => [])])
      .then(([dems, locs, ctrs]) => {
        setContrats(ctrs);
        const map = {};
        locs.forEach(l => map[l.id] = l.reference);
        setLocauxMap(map);
        setDemandes(dems);
      })
      .catch((err) => toast.error("Erreur de chargement des demandes"))
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
    } catch (err) {
      toast.error('Erreur lors de l\'acceptation du contrat.');
    } finally {
      setLoading(false);
    }
  };

  const refuserContrat = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir refuser le contrat proposé ? La décision sera irréversible.')) {
      setLoading(true);
      try {
        await changerStatutDemande(selectedContratDossier.id, 'CONTRAT_REFUSE');
        setDemandes((prev) =>
          prev.map((d) =>
            d.id === selectedContratDossier.id
              ? { ...d, statut: 'CONTRAT_REFUSE' }
              : d
          )
        );
        toast.success('Proposition de contrat refusée.');
        setSelectedContratDossier(null);
      } catch (err) {
        toast.error('Erreur lors du refus du contrat.');
      } finally {
        setLoading(false);
      }
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
        ) : demandes.map((d) => (
          <Card key={d.id} className="border-l-4 border-l-teal">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted">{d.reference_anonyme || `DOSSIER-${d.id}`}</span>
                  <span className="bg-amber text-ink text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                    {d.type_demande}
                  </span>
                  <StatusBadge statut={d.statut} />
                </div>
                <p className="font-display font-bold text-lg text-ink mt-1">Demande d'exploitation</p>
                <p className="text-xs text-muted mt-1">
                  Local visé : <strong>{locauxMap[d.local] || d.local}</strong> • Déposé le {new Date(d.date_depot).toLocaleDateString()}
                </p>
                <p className="text-xs font-mono text-teal mt-2">📍 Étape actuelle : {d.statut.replace(/_/g, ' ')}</p>

                {/* RDV Fixé si déjà accepté */}
                {d.rdv_signature_date && (
                  <div className="mt-3 p-3 bg-ok-soft border border-ok/30 rounded text-xs">
                    <p className="font-bold text-ok">📅 Rendez-vous de signature confirmé</p>
                    <p className="text-ink font-mono mt-0.5">Date retenue : {d.rdv_signature_date} avec le Directeur Général CROUS-T.</p>
                  </div>
                )}
              </div>

              {/* Action Proposition de Contrat */}
              <div>
                {(d.statut === 'FAVORABLE' || d.statut === 'EN_ATTENTE_SIGNATURE') && (
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
        title={selectedContratDossier ? `Proposition de Bail Officiel — ${selectedContratDossier.reference_anonyme || selectedContratDossier.id}` : ''}
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
                <p className="font-bold text-ink">{contratLie ? `${contratLie.duree_mois} mois` : '—'}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted uppercase">Redevance Mensuelle</p>
                <p className="font-bold text-teal">{contratLie ? `${Number(contratLie.redevance_mensuelle).toLocaleString('fr-SN')} FCFA` : '—'}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted uppercase">Dépôt de Garantie</p>
                <p className="font-bold text-amber">{contratLie ? `${Number(contratLie.montant_caution).toLocaleString('fr-SN')} FCFA` : '—'}</p>
              </div>
            </div>

            {/* Modalités de paiement */}
            <div className="p-3 bg-white border border-ink/15 rounded text-xs">
              <p className="font-bold text-ink mb-1">💳 Modalités de Paiement des Redevances :</p>
              <p className="text-muted">Paiement selon l’échéancier généré par la plateforme : Wave, Orange Money ou espèces au guichet comptable.</p>
            </div>

            {/* Règlements Stricts & Sanctions */}
            <div className="p-3 bg-paper2 border border-ink/15 rounded">
              <p className="font-display font-bold text-sm text-stamp mb-2">⚠️ Règlements Stricts & Clause Résolutoire :</p>
              <pre className="font-mono text-xs text-ink/80 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto pr-2 bg-paper p-3 border border-ink/10 rounded">
                {REGLEMENT_CONTRAT}
              </pre>
            </div>

            {/* Choix Date RDV Signature */}
            <Field label="📅 Choisir un créneau de Rendez-vous pour la signature avec le Directeur Général CROUS-T *" required>
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
                ❌ Refuser la proposition
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
