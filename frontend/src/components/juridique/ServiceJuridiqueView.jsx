import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  PageWrapper, SectionHeader, Card, StatusBadge, Button, Modal, Field, Textarea, Input, Select, AlertBanner,
} from '../common/ui';
import { demandesMock, contratMock, sanctionsMock } from '../../mocks/data';

const DEMANDE_FAVORABLE = demandesMock.filter(
  (d) => d.statut === 'FAVORABLE' || d.statut === 'EN_ATTENTE_CONTRAT'
);

const RUPTURES_INITIEES_MOCK = [
  {
    id_procedure: 'PR-RUP-2026-001',
    contrat_ref: 'CT-2026-00312',
    local_ref: 'LOC-004',
    occupant_nom: 'Mamadou Lô (Cantine A)',
    motif: 'Non-paiement répété des redevances & non-conformité sanitaire grave',
    initie_par: 'Direction Générale (Abdou Diallo)',
    date_initiation: '2026-08-09',
    statut: 'EN_ATTENTE_VALIDATION_JURIDIQUE',
    pieces_justificatives: ['Constat_Huissier_0908.pdf', 'Compte_Redevances_Impayees.pdf'],
  },
];

const SANCTIONS_PROCEDURES_MOCK = [
  {
    id_sanction: 'PROC-SAN-01',
    type_acte: 'RAPPEL_A_L_ORDRE',
    occupant_nom: 'Mamadou Lô',
    local_ref: 'LOC-004',
    date_emission: '2026-08-06',
    motif: 'Hygiène défaillante en cuisine et légers retards de paiement.',
    statut: 'EMIS',
    delai_correction_jours: 7,
  },
  {
    id_sanction: 'PROC-SAN-02',
    type_acte: 'CONVOCATION',
    occupant_nom: 'Ousmane Traoré',
    local_ref: 'LOC-002',
    date_emission: '2026-08-08',
    motif: 'Sous-location non autorisée suspectée par la brigade terrain.',
    statut: 'CONVOCATION_ENVOYEE',
    date_audience: '2026-08-16 à 10h00',
    lieu: 'Bureau Service Juridique, CROUS-T',
  },
];

export default function ServiceJuridiqueView() {
  const [tabActive, setTabActive] = useState('baux'); // 'baux', 'ruptures', 'sanctions'

  // Baux & Contrats
  const [dossiers, setDossiers] = useState(DEMANDE_FAVORABLE);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ruptures de contrat
  const [ruptures, setRuptures] = useState(RUPTURES_INITIEES_MOCK);
  const [selectedRupture, setSelectedRupture] = useState(null);

  // Sanctions (Rappels, Convocations, Mises en demeure)
  const [sanctions, setSanctions] = useState(SANCTIONS_PROCEDURES_MOCK);
  const [showNewSanctionModal, setShowNewSanctionModal] = useState(false);
  const [newSanctionForm, setNewSanctionForm] = useState({
    type_acte: 'RAPPEL_A_L_ORDRE',
    occupant_nom: 'Mamadou Lô',
    local_ref: 'LOC-004',
    motif: '',
    delai_jours: 7,
    date_audience: '',
  });

  const [contractForm, setContractForm] = useState({
    duree_mois: 12,
    redevance: 45000,
    caution: 90000,
    reglements_stricts: `ARTICLE 1 — USAGE DU LOCAL : Le local est concédé à titre d'occupation domaniale précaire et révocable. Toute sous-location est formellement interdite sous peine de résiliation immédiate.\n\nARTICLE 2 — NORMES SANITAIRES ET PRIX : L'occupant s'engage à respecter scrupuleusement la grille des prix arrêtée avec le CROUS-T et à maintenir un état de propreté irréprochable.\n\nARTICLE 3 — PAIEMENT DES REDEVANCES : La redevance est payable d'avance le 15 de chaque mois. Tout retard supérieur à 10 jours entraînera des pénalités de 5% et l'émission d'un rappel à l'ordre.\n\nARTICLE 4 — SANCTIONS & EXPULSION : En cas de 3 avis défavorables QHSE ou d'impayé persistant, le contrat sera résilié de plein droit avec préavis d'urgence de 48 heures.`,
    modalites_paiement: 'Paiement mensuel par Wave, Orange Money, Virement bancaire ou en espèces au Guichet Comptable.',
    dates_proposees: ['2026-08-22 à 10h00', '2026-08-23 à 14h30', '2026-08-25 à 11h00'],
  });

  // Action : Transmettre proposition contrat
  const transmettrePropositionContrat = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    setDossiers((prev) =>
      prev.map((d) =>
        d.id_demande === selectedDossier.id_demande
          ? {
              ...d,
              statut: 'PROPOSITION_CONTRAT_ENVOYEE',
              contrat_propose: {
                duree: contractForm.duree_mois,
                redevance: contractForm.redevance,
                caution: contractForm.caution,
                reglements: contractForm.reglements_stricts,
                modalites: contractForm.modalites_paiement,
                dates_rdv: contractForm.dates_proposees,
                date_envoi: new Date().toISOString().slice(0, 10),
              },
            }
          : d
      )
    );

    toast.success(
      `Projet de contrat officiel & convocation de signature transmis au candidat ${selectedDossier.demandeur?.nom} !`
    );
    setSelectedDossier(null);
    setLoading(false);
  };

  // Action : Valider la rupture de contrat & Notifier l'occupant
  const validerRuptureEtNotifier = async () => {
    if (!selectedRupture) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    setRuptures((prev) =>
      prev.map((r) =>
        r.id_procedure === selectedRupture.id_procedure
          ? { ...r, statut: 'VALIDEE_ET_NOTIFIEE', date_validation: new Date().toISOString().slice(0, 10) }
          : r
      )
    );

    toast.success(`Rupture de contrat validée juridiquement et notification formelle transmise à ${selectedRupture.occupant_nom}.`);
    setSelectedRupture(null);
    setLoading(false);
  };

  // Action : Émettre un acte disciplinaire (Rappel à l'ordre, Convocation, Mise en demeure)
  const emettreActeDisciplinaire = async () => {
    if (!newSanctionForm.motif) {
      toast.error('Veuillez indiquer le motif juridique ou réglementaire.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const created = {
      id_sanction: `PROC-SAN-0${sanctions.length + 1}`,
      ...newSanctionForm,
      date_emission: new Date().toISOString().slice(0, 10),
      statut: 'EMIS',
    };

    setSanctions((prev) => [created, ...prev]);
    toast.success(`Acte "${newSanctionForm.type_acte.replace(/_/g, ' ')}" émis et notifié à l'occupant !`);
    setShowNewSanctionModal(false);
    setNewSanctionForm({ type_acte: 'RAPPEL_A_L_ORDRE', occupant_nom: 'Mamadou Lô', local_ref: 'LOC-004', motif: '', delai_jours: 7, date_audience: '' });
    setLoading(false);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Service Juridique & Contentieux"
        title="Baux, Procédures de Rupture & Actes Disciplinaires"
        subtitle="Rédaction des baux d'occupation domaniale, validation juridique des ruptures de contrat et suivi des rappels à l'ordre & convocations."
      />

      <AlertBanner type="info" className="mb-6">
        📜 <strong>Rôle du Service Juridique :</strong> Vous assurez la sécurité juridique du patrimoine domanial du CROUS-T : rédaction des baux d'occupation, contrôle légal des demandes de résiliation initiées par la Direction/Admin, et émission des actes de rappel à l'ordre ou convocations.
      </AlertBanner>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-ink/15 mb-6">
        <button
          onClick={() => setTabActive('baux')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 font-mono transition-colors ${
            tabActive === 'baux' ? 'border-teal text-teal font-bold' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          📜 Baux & Contrats à rédiger ({dossiers.length})
        </button>
        <button
          onClick={() => setTabActive('ruptures')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 font-mono transition-colors ${
            tabActive === 'ruptures' ? 'border-stamp text-stamp font-bold' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          ⚖️ Procédures de Rupture ({ruptures.length})
        </button>
        <button
          onClick={() => setTabActive('sanctions')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 font-mono transition-colors ${
            tabActive === 'sanctions' ? 'border-amber text-amber-deep font-bold' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          📢 Rappels à l'ordre & Convocations ({sanctions.length})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1 : BAUX & CONTRATS À RÉDIGER
      ═══════════════════════════════════════════════════════════ */}
      {tabActive === 'baux' && (
        <div className="space-y-4">
          {dossiers.length === 0 ? (
            <Card className="text-center py-8 text-muted font-mono text-sm">
              Aucun dossier favorable en attente de rédaction de bail.
            </Card>
          ) : (
            dossiers.map((d) => (
              <Card key={d.id_demande} className="border-l-4 border-l-teal flex flex-wrap justify-between items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted">{d.id_demande}</span>
                    <span className="bg-ok-soft text-ok text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                      DÉCISION FAVORABLE
                    </span>
                    <StatusBadge statut={d.statut} />
                  </div>
                  <p className="font-display font-bold text-base text-ink">{d.description}</p>
                  <p className="text-xs text-muted mt-1">
                    Candidat retenu : <strong>{d.demandeur?.nom}</strong> ({d.demandeur?.email}) • Local visé : {d.local_vise}
                  </p>
                </div>

                <div>
                  <Button variant="primary" size="sm" onClick={() => setSelectedDossier(d)}>
                    📜 Rédiger le Contrat & Convoquer le Candidat →
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2 : PROCÉDURES DE RUPTURE DE CONTRAT
      ═══════════════════════════════════════════════════════════ */}
      {tabActive === 'ruptures' && (
        <div className="space-y-4">
          <AlertBanner type="warning">
            ⚠️ <strong>Procédure de Résiliation :</strong> La rupture de contrat peut être initiée par la Direction Générale ou l'Admin SI (suite à impayés ou infractions grave QHSE). Le <strong>Service Juridique</strong> doit valider le motif légal et rédiger l'acte de notification formelle avec ordre de libération des lieux.
          </AlertBanner>

          {ruptures.map((r) => (
            <Card key={r.id_procedure} className="border-l-4 border-l-stamp">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-stamp font-bold">{r.id_procedure}</span>
                    <span className="font-mono text-xs bg-paper2 px-2 py-0.5 rounded">Bail #{r.contrat_ref}</span>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${r.statut === 'VALIDEE_ET_NOTIFIEE' ? 'bg-stamp text-paper' : 'bg-amber-pale text-amber-deep'}`}>
                      {r.statut === 'VALIDEE_ET_NOTIFIEE' ? 'NOTIFIÉE (EN COURS D\'EXPULSION)' : 'EN ATTENTE VALIDATION JURIDIQUE'}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-ink mt-1">Occupant : {r.occupant_nom} (Local {r.local_ref})</h3>
                  <p className="text-xs text-muted mt-1">Motif de rupture : <strong>{r.motif}</strong></p>
                  <p className="text-[11px] font-mono text-muted mt-1">Initiée par : {r.initie_par} le {r.date_initiation}</p>
                </div>

                <div>
                  {r.statut !== 'VALIDEE_ET_NOTIFIEE' ? (
                    <Button variant="stamp" size="sm" onClick={() => setSelectedRupture(r)}>
                      ⚖️ Examiner, Valider la Rupture & Notifier →
                    </Button>
                  ) : (
                    <span className="text-xs font-mono text-stamp font-bold bg-stamp-pale px-3 py-1.5 rounded">
                      ✓ Acte de résiliation délivré le {r.date_validation}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 3 : RAPPELS À L'ORDRE & CONVOCATIONS
      ═══════════════════════════════════════════════════════════ */}
      {tabActive === 'sanctions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 border border-ink/10 rounded">
            <div>
              <h3 className="font-display font-bold text-base text-ink">Actes Disciplinaires & Procédures de Rappel</h3>
              <p className="text-xs text-muted">Avertissements réglementaires, convocations en commission disciplinaire et mises en demeure.</p>
            </div>
            <Button variant="amber" onClick={() => setShowNewSanctionModal(true)}>
              + Émettre un Rappel à l'ordre / Convocation
            </Button>
          </div>

          <div className="space-y-3">
            {sanctions.map((s) => (
              <Card key={s.id_sanction} className="border-l-4 border-l-amber">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-amber-deep bg-amber-pale px-2 py-0.5 rounded">
                        {s.type_acte.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-xs text-muted">Réf : {s.id_sanction}</span>
                      <span className="font-mono text-xs text-muted">• Émis le {s.date_emission}</span>
                    </div>
                    <p className="font-display font-bold text-sm text-ink">Occupant visé : {s.occupant_nom} ({s.local_ref})</p>
                    <p className="text-xs text-muted mt-1">Motif : {s.motif}</p>
                    {s.date_audience && (
                      <p className="font-mono text-xs text-teal font-bold mt-1">📅 Convocation : {s.date_audience} au {s.lieu}</p>
                    )}
                    {s.delai_correction_jours && (
                      <p className="font-mono text-xs text-stamp mt-1">⏳ Délai de régularisation : {s.delai_correction_jours} jours accordés</p>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold text-ok bg-ok-soft px-2 py-1 rounded shrink-0">
                    {s.statut}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL 1 : Redaction du Contrat de Bail
      ═══════════════════════════════════════════════════════════ */}
      <Modal open={!!selectedDossier} onClose={() => setSelectedDossier(null)} title={selectedDossier ? `Rédaction de Bail — ${selectedDossier.id_demande}` : ''} size="lg">
        {selectedDossier && (
          <div className="space-y-4">
            <div className="bg-paper2 p-3 rounded text-xs">
              <p className="font-bold">Candidat : {selectedDossier.demandeur?.nom}</p>
              <p className="text-muted">Projet : {selectedDossier.description} (Local {selectedDossier.local_vise})</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Durée du bail (mois) *" required>
                <Input
                  type="number"
                  value={contractForm.duree_mois}
                  onChange={(e) => setContractForm((c) => ({ ...c, duree_mois: Number(e.target.value) }))}
                />
              </Field>
              <Field label="Redevance mensuelle (FCFA) *" required>
                <Input
                  type="number"
                  value={contractForm.redevance}
                  onChange={(e) => setContractForm((c) => ({ ...c, redevance: Number(e.target.value) }))}
                />
              </Field>
              <Field label="Caution / Dépôt de garantie (FCFA) *" required>
                <Input
                  type="number"
                  value={contractForm.caution}
                  onChange={(e) => setContractForm((c) => ({ ...c, caution: Number(e.target.value) }))}
                />
              </Field>
            </div>

            <Field label="Modalités de paiement & Procédure caisse *" required>
              <Input
                value={contractForm.modalites_paiement}
                onChange={(e) => setContractForm((c) => ({ ...c, modalites_paiement: e.target.value }))}
              />
            </Field>

            <Field label="Règlement Stricte & Clauses d'expulsion (Affichés au Candidat) *" required>
              <Textarea
                value={contractForm.reglements_stricts}
                onChange={(e) => setContractForm((c) => ({ ...c, reglements_stricts: e.target.value }))}
                rows={6}
                className="font-mono text-xs"
              />
            </Field>

            <div className="flex gap-3 justify-end pt-3 border-t border-ink/10">
              <Button variant="ghost" onClick={() => setSelectedDossier(null)}>Annuler</Button>
              <Button variant="primary" onClick={transmettrePropositionContrat} disabled={loading}>
                {loading ? 'Transmissions…' : '✉️ Notifier le Candidat & Proposer le RDV de Signature'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          MODAL 2 : Validation Rupture de Contrat par Service Juridique
      ═══════════════════════════════════════════════════════════ */}
      <Modal open={!!selectedRupture} onClose={() => setSelectedRupture(null)} title="Validation Juridique de Résiliation de Contrat" size="lg">
        {selectedRupture && (
          <div className="space-y-4">
            <div className="p-4 bg-stamp-pale border border-stamp/30 rounded text-xs space-y-2">
              <p className="font-bold text-stamp text-sm">Procédure Réf : {selectedRupture.id_procedure}</p>
              <p>Occupant : <strong>{selectedRupture.occupant_nom}</strong> — Contrat <strong>#{selectedRupture.contrat_ref}</strong> (Local {selectedRupture.local_ref})</p>
              <p>Motif formulé par la Direction : <em>{selectedRupture.motif}</em></p>
            </div>

            <Field label="Visa Juridique & Attestation des fondements légaux *" required>
              <Textarea
                defaultValue={`Attendu les pièces versées au dossier constatant les manquements réitérés aux obligations contractuelles (notamment redevances impayées et infractions sanitaires) ;\n\nEn application du décret domanial et des clauses résolutoires de la convention d'occupation précaire ;\n\nLe Service Juridique certifie la régularité de la procédure de résiliation et émet l'ordre de notification pour libération sous prévis de 48 heures.`}
                rows={5}
                className="font-mono text-xs"
              />
            </Field>

            <div className="p-3 bg-paper2 rounded text-xs font-mono text-muted">
              📩 À la validation, la notification formelle de résiliation sera générée et transmise à l'occupant, avec copie au Directeur Général et au Service Comptable pour liquidation des comptes.
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-ink/10">
              <Button variant="ghost" onClick={() => setSelectedRupture(null)}>Annuler</Button>
              <Button variant="stamp" onClick={validerRuptureEtNotifier} disabled={loading}>
                {loading ? 'Validation…' : '⚖️ Valider la Résiliation & Notifier l\'Occupant'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          MODAL 3 : Émission d'un Acte Disciplinaire
      ═══════════════════════════════════════════════════════════ */}
      <Modal open={showNewSanctionModal} onClose={() => setShowNewSanctionModal(false)} title="Émettre un Acte Disciplinaire ou Convocation">
        <div className="space-y-4">
          <Field label="Type d'acte juridique *" required>
            <Select
              value={newSanctionForm.type_acte}
              onChange={(e) => setNewSanctionForm((f) => ({ ...f, type_acte: e.target.value }))}
            >
              <option value="RAPPEL_A_L_ORDRE">Rappel à l'ordre (1er avertissement)</option>
              <option value="CONVOCATION">Convocation à une audience disciplinaire</option>
              <option value="MISE_EN_DEMEURE">Mise en demeure (Mise en demeure de payer / régulariser)</option>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom de l'occupant visé *" required>
              <Input
                value={newSanctionForm.occupant_nom}
                onChange={(e) => setNewSanctionForm((f) => ({ ...f, occupant_nom: e.target.value }))}
              />
            </Field>
            <Field label="Référence local *" required>
              <Input
                value={newSanctionForm.local_ref}
                onChange={(e) => setNewSanctionForm((f) => ({ ...f, local_ref: e.target.value }))}
              />
            </Field>
          </div>

          {newSanctionForm.type_acte === 'CONVOCATION' ? (
            <Field label="Date et heure de l'audience *" required>
              <Input
                type="text"
                placeholder="Ex. 2026-08-20 à 10h00"
                value={newSanctionForm.date_audience}
                onChange={(e) => setNewSanctionForm((f) => ({ ...f, date_audience: e.target.value }))}
              />
            </Field>
          ) : (
            <Field label="Délai accordé pour régularisation (jours) *" required>
              <Input
                type="number"
                value={newSanctionForm.delai_jours}
                onChange={(e) => setNewSanctionForm((f) => ({ ...f, delai_jours: Number(e.target.value) }))}
              />
            </Field>
          )}

          <Field label="Motif détaillé et visé réglementaire *" required>
            <Textarea
              value={newSanctionForm.motif}
              onChange={(e) => setNewSanctionForm((f) => ({ ...f, motif: e.target.value }))}
              rows={3}
              placeholder="Expliquez la faute ou l'infraction constatée (ex. non-respect du tarif public conventionné, insanité)..."
            />
          </Field>

          <div className="flex gap-3 justify-end pt-3 border-t border-ink/10">
            <Button variant="ghost" onClick={() => setShowNewSanctionModal(false)}>Annuler</Button>
            <Button variant="amber" onClick={emettreActeDisciplinaire} disabled={loading}>
              {loading ? 'Émission…' : '✉️ Valider & Notifier l\'Occupant'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
