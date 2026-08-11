import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  PageWrapper,
  SectionHeader,
  Card,
  StatusBadge,
  Button,
  Modal,
  Field,
  Textarea,
  Input,
  Select,
  AlertBanner,
} from '../common/ui';
import { demandesMock } from '../../mocks/data';

const DEMANDE_FAVORABLE = demandesMock.filter(
  (d) =>
    d.statut === 'FAVORABLE' ||
    d.statut === 'EN_ATTENTE_CONTRAT'
);

const RUPTURES_INITIEES_MOCK = [
  {
    id_procedure: 'PR-RUP-2026-001',
    contrat_ref: 'CT-2026-00312',
    local_ref: 'LOC-004',
    occupant_nom: 'Mamadou Lô (Cantine A)',
    motif:
      'Non-paiement répété des redevances & non-conformité sanitaire grave',
    initie_par: 'Direction Générale (Abdou Diallo)',
    date_initiation: '2026-08-09',
    statut: 'EN_ATTENTE_VALIDATION_JURIDIQUE',
    pieces_justificatives: [
      'Constat_Huissier_0908.pdf',
      'Compte_Redevances_Impayees.pdf',
    ],
  },
];

const SANCTIONS_PROCEDURES_MOCK = [
  {
    id_sanction: 'PROC-SAN-01',
    type_acte: 'RAPPEL_A_L_ORDRE',
    occupant_nom: 'Mamadou Lô',
    local_ref: 'LOC-004',
    date_emission: '2026-08-06',
    motif:
      'Hygiène défaillante en cuisine et légers retards de paiement.',
    statut: 'EMIS',
    delai_correction_jours: 7,
  },
  {
    id_sanction: 'PROC-SAN-02',
    type_acte: 'CONVOCATION',
    occupant_nom: 'Ousmane Traoré',
    local_ref: 'LOC-002',
    date_emission: '2026-08-08',
    motif:
      'Sous-location non autorisée suspectée par la brigade terrain.',
    statut: 'CONVOCATION_ENVOYEE',
    date_audience: '2026-08-16 à 10h00',
    lieu: 'Bureau Service Juridique, CROUS-T',
  },
];

export default function ServiceJuridiqueView() {
  const [tabActive, setTabActive] = useState('baux');

  // Baux & Contrats
  const [dossiers, setDossiers] = useState(DEMANDE_FAVORABLE);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ruptures de contrat
  const [ruptures, setRuptures] = useState(
    RUPTURES_INITIEES_MOCK
  );
  const [selectedRupture, setSelectedRupture] =
    useState(null);

  // Sanctions
  const [sanctions, setSanctions] = useState(
    SANCTIONS_PROCEDURES_MOCK
  );
  const [showNewSanctionModal, setShowNewSanctionModal] =
    useState(false);

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
    reglements_stricts: `ARTICLE 1 — USAGE DU LOCAL : Le local est concédé à titre d'occupation domaniale précaire et révocable. Toute sous-location est formellement interdite sous peine de résiliation immédiate.

ARTICLE 2 — NORMES SANITAIRES ET PRIX : L'occupant s'engage à respecter scrupuleusement la grille des prix arrêtée avec le CROUS-T et à maintenir un état de propreté irréprochable.

ARTICLE 3 — PAIEMENT DES REDEVANCES : La redevance est payable d'avance le 15 de chaque mois. Tout retard supérieur à 10 jours entraînera des pénalités de 5% et l'émission d'un rappel à l'ordre.

ARTICLE 4 — SANCTIONS & EXPULSION : En cas de 3 avis défavorables QHSE ou d'impayé persistant, le contrat sera résilié de plein droit avec préavis d'urgence de 48 heures.`,
    modalites_paiement:
      'Paiement mensuel par Wave, Orange Money, Virement bancaire ou en espèces au Guichet Comptable.',
    dates_proposees: [
      '2026-08-22 à 10h00',
      '2026-08-23 à 14h30',
      '2026-08-25 à 11h00',
    ],
  });

  // =====================================================
  // TRANSMETTRE PROPOSITION DE CONTRAT
  // =====================================================

  const transmettrePropositionContrat = async () => {
    if (!selectedDossier) {
      return;
    }

    setLoading(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 800)
    );

    setDossiers((prev) =>
      prev.map((dossier) =>
        dossier.id_demande === selectedDossier.id_demande
          ? {
              ...dossier,
              statut: 'PROPOSITION_CONTRAT_ENVOYEE',
              contrat_propose: {
                duree: contractForm.duree_mois,
                redevance: contractForm.redevance,
                caution: contractForm.caution,
                reglements:
                  contractForm.reglements_stricts,
                modalites:
                  contractForm.modalites_paiement,
                dates_rdv:
                  contractForm.dates_proposees,
                date_envoi: new Date()
                  .toISOString()
                  .slice(0, 10),
              },
            }
          : dossier
      )
    );

    toast.success(
      `Projet de contrat officiel & convocation de signature transmis au candidat ${selectedDossier.demandeur?.nom} !`
    );

    setSelectedDossier(null);
    setLoading(false);
  };

  // =====================================================
  // VALIDER RUPTURE
  // =====================================================

  const validerRuptureEtNotifier = async () => {
    if (!selectedRupture) {
      return;
    }

    setLoading(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 800)
    );

    setRuptures((prev) =>
      prev.map((rupture) =>
        rupture.id_procedure ===
        selectedRupture.id_procedure
          ? {
              ...rupture,
              statut: 'VALIDEE_ET_NOTIFIEE',
              date_validation: new Date()
                .toISOString()
                .slice(0, 10),
            }
          : rupture
      )
    );

    toast.success(
      `Rupture de contrat validée juridiquement et notification formelle transmise à ${selectedRupture.occupant_nom}.`
    );

    setSelectedRupture(null);
    setLoading(false);
  };

  // =====================================================
  // ÉMETTRE ACTE DISCIPLINAIRE
  // =====================================================

  const emettreActeDisciplinaire = async () => {
    if (!newSanctionForm.motif.trim()) {
      toast.error(
        'Veuillez indiquer le motif juridique ou réglementaire.'
      );
      return;
    }

    setLoading(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 600)
    );

    const created = {
      id_sanction: `PROC-SAN-0${
        sanctions.length + 1
      }`,
      ...newSanctionForm,
      date_emission: new Date()
        .toISOString()
        .slice(0, 10),
      statut: 'EMIS',
    };

    setSanctions((prev) => [
      created,
      ...prev,
    ]);

    toast.success(
      `Acte "${newSanctionForm.type_acte.replace(
        /_/g,
        ' '
      )}" émis et notifié à l'occupant !`
    );

    setShowNewSanctionModal(false);

    setNewSanctionForm({
      type_acte: 'RAPPEL_A_L_ORDRE',
      occupant_nom: 'Mamadou Lô',
      local_ref: 'LOC-004',
      motif: '',
      delai_jours: 7,
      date_audience: '',
    });

    setLoading(false);
  };

  return (
    <PageWrapper>

      <SectionHeader
        eyebrow="Service Juridique & Contentieux"
        title="Baux, Procédures de Rupture & Actes Disciplinaires"
        subtitle="Rédaction des baux d'occupation domaniale, validation juridique des ruptures de contrat et suivi des rappels à l'ordre & convocations."
      />

      <AlertBanner
        type="info"
        className="mb-6"
      >
        📜 <strong>Rôle du Service Juridique :</strong>{' '}
        Vous assurez la sécurité juridique du patrimoine
        domanial du CROUS-T : rédaction des baux
        d'occupation, contrôle légal des demandes de
        résiliation initiées par la Direction/Admin, et
        émission des actes de rappel à l'ordre ou
        convocations.
      </AlertBanner>

      {/* =====================================================
          TABS
      ===================================================== */}

      <div className="mb-6 flex border-b border-ink/15">

        <button
          type="button"
          onClick={() => setTabActive('baux')}
          className={`border-b-2 px-5 py-3 text-sm font-semibold font-mono transition-colors ${
            tabActive === 'baux'
              ? 'border-teal text-teal font-bold'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          📜 Baux & Contrats à rédiger ({dossiers.length})
        </button>

        <button
          type="button"
          onClick={() => setTabActive('ruptures')}
          className={`border-b-2 px-5 py-3 text-sm font-semibold font-mono transition-colors ${
            tabActive === 'ruptures'
              ? 'border-stamp text-stamp font-bold'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          ⚖️ Procédures de Rupture ({ruptures.length})
        </button>

        <button
          type="button"
          onClick={() => setTabActive('sanctions')}
          className={`border-b-2 px-5 py-3 text-sm font-semibold font-mono transition-colors ${
            tabActive === 'sanctions'
              ? 'border-amber text-amber-deep font-bold'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          📢 Rappels à l'ordre & Convocations (
          {sanctions.length}
          )
        </button>

      </div>

      {/* =====================================================
          TAB 1 : BAUX
      ===================================================== */}

      {tabActive === 'baux' && (
        <div className="space-y-4">

          {dossiers.length === 0 ? (
            <Card className="py-8 text-center text-sm text-muted font-mono">
              Aucun dossier favorable en attente de
              rédaction de bail.
            </Card>
          ) : (
            dossiers.map((dossier) => (
              <Card
                key={dossier.id_demande}
                className="flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-teal"
              >

                <div>

                  <div className="mb-1 flex items-center gap-2">

                    <span className="font-mono text-xs text-muted">
                      {dossier.id_demande}
                    </span>

                    <span className="rounded bg-ok-soft px-2 py-0.5 text-[11px] font-mono font-bold text-ok">
                      DÉCISION FAVORABLE
                    </span>

                    <StatusBadge
                      statut={dossier.statut}
                    />

                  </div>

                  <p className="font-display text-base font-bold text-ink">
                    {dossier.description}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Candidat retenu :{' '}
                    <strong>
                      {dossier.demandeur?.nom}
                    </strong>{' '}
                    ({dossier.demandeur?.email}) • Local
                    visé : {dossier.local_vise}
                  </p>

                </div>

                <div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setSelectedDossier(dossier)
                    }
                  >
                    📜 Rédiger le Contrat & Convoquer le
                    Candidat →
                  </Button>

                </div>

              </Card>
            ))
          )}

        </div>
      )}

      {/* =====================================================
          TAB 2 : RUPTURES
      ===================================================== */}

      {tabActive === 'ruptures' && (
        <div className="space-y-4">

          <AlertBanner type="warning">

            ⚠️ <strong>Procédure de Résiliation :</strong>{' '}
            La rupture de contrat peut être initiée par la
            Direction Générale ou l'Admin SI (suite à
            impayés ou infractions grave QHSE). Le{' '}
            <strong>Service Juridique</strong> doit valider
            le motif légal et rédiger l'acte de notification
            formelle avec ordre de libération des lieux.

          </AlertBanner>

          {ruptures.map((rupture) => (
            <Card
              key={rupture.id_procedure}
              className="border-l-4 border-l-stamp"
            >

              <div className="flex flex-wrap items-start justify-between gap-4">

                <div>

                  <div className="mb-1 flex items-center gap-2">

                    <span className="font-mono text-xs font-bold text-stamp">
                      {rupture.id_procedure}
                    </span>

                    <span className="rounded bg-paper2 px-2 py-0.5 font-mono text-xs">
                      Bail #{rupture.contrat_ref}
                    </span>

                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-mono font-bold ${
                        rupture.statut ===
                        'VALIDEE_ET_NOTIFIEE'
                          ? 'bg-stamp text-paper'
                          : 'bg-amber-pale text-amber-deep'
                      }`}
                    >
                      {rupture.statut ===
                      'VALIDEE_ET_NOTIFIEE'
                        ? 'NOTIFIÉE (EN COURS D’EXPULSION)'
                        : 'EN ATTENTE VALIDATION JURIDIQUE'}
                    </span>

                  </div>

                  <h3 className="mt-1 font-display text-base font-bold text-ink">
                    Occupant : {rupture.occupant_nom}{' '}
                    (Local {rupture.local_ref})
                  </h3>

                  <p className="mt-1 text-xs text-muted">
                    Motif de rupture :{' '}
                    <strong>{rupture.motif}</strong>
                  </p>

                  <p className="mt-1 font-mono text-[11px] text-muted">
                    Initiée par : {rupture.initie_par} le{' '}
                    {rupture.date_initiation}
                  </p>

                </div>

                <div>

                  {rupture.statut !==
                  'VALIDEE_ET_NOTIFIEE' ? (
                    <Button
                      variant="stamp"
                      size="sm"
                      onClick={() =>
                        setSelectedRupture(rupture)
                      }
                    >
                      ⚖️ Examiner, Valider la Rupture &
                      Notifier →
                    </Button>
                  ) : (
                    <span className="rounded bg-stamp-pale px-3 py-1.5 font-mono text-xs font-bold text-stamp">
                      ✓ Acte de résiliation délivré le{' '}
                      {rupture.date_validation}
                    </span>
                  )}

                </div>

              </div>

            </Card>
          ))}

        </div>
      )}

      {/* =====================================================
          TAB 3 : SANCTIONS
      ===================================================== */}

      {tabActive === 'sanctions' && (
        <div className="space-y-4">

          <div className="flex items-center justify-between rounded border border-ink/10 bg-white p-4">

            <div>

              <h3 className="font-display text-base font-bold text-ink">
                Actes Disciplinaires & Procédures de Rappel
              </h3>

              <p className="text-xs text-muted">
                Avertissements réglementaires, convocations
                en commission disciplinaire et mises en
                demeure.
              </p>

            </div>

            <Button
              variant="amber"
              onClick={() =>
                setShowNewSanctionModal(true)
              }
            >
              + Émettre un Rappel à l'ordre / Convocation
            </Button>

          </div>

          <div className="space-y-3">

            {sanctions.map((sanction) => (
              <Card
                key={sanction.id_sanction}
                className="border-l-4 border-l-amber"
              >

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <div className="mb-1 flex items-center gap-2">

                      <span className="rounded bg-amber-pale px-2 py-0.5 font-mono text-xs font-bold text-amber-deep">
                        {sanction.type_acte.replace(
                          /_/g,
                          ' '
                        )}
                      </span>

                      <span className="font-mono text-xs text-muted">
                        Réf : {sanction.id_sanction}
                      </span>

                      <span className="font-mono text-xs text-muted">
                        • Émis le {sanction.date_emission}
                      </span>

                    </div>

                    <p className="font-display text-sm font-bold text-ink">
                      Occupant visé :{' '}
                      {sanction.occupant_nom} (
                      {sanction.local_ref})
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      Motif : {sanction.motif}
                    </p>

                    {sanction.date_audience && (
                      <p className="mt-1 font-mono text-xs font-bold text-teal">
                        📅 Convocation :{' '}
                        {sanction.date_audience} au{' '}
                        {sanction.lieu}
                      </p>
                    )}

                    {sanction.delai_correction_jours && (
                      <p className="mt-1 font-mono text-xs text-stamp">
                        ⏳ Délai de régularisation :{' '}
                        {sanction.delai_correction_jours}{' '}
                        jours accordés
                      </p>
                    )}

                  </div>

                  <span className="shrink-0 rounded bg-ok-soft px-2 py-1 font-mono text-xs font-bold text-ok">
                    {sanction.statut}
                  </span>

                </div>

              </Card>
            ))}

          </div>

        </div>
      )}

      {/* =====================================================
          MODAL 1 : RÉDACTION CONTRAT
      ===================================================== */}

      <Modal
        open={!!selectedDossier}
        onClose={() => setSelectedDossier(null)}
        title={
          selectedDossier
            ? `Rédaction de Bail — ${selectedDossier.id_demande}`
            : ''
        }
        size="lg"
      >
        {selectedDossier && (
          <div className="space-y-4">

            <div className="rounded bg-paper2 p-3 text-xs">

              <p className="font-bold">
                Candidat :{' '}
                {selectedDossier.demandeur?.nom}
              </p>

              <p className="text-muted">
                Projet : {selectedDossier.description}{' '}
                (Local {selectedDossier.local_vise})
              </p>

            </div>

            <div className="grid grid-cols-3 gap-3">

              <Field
                label="Durée du bail (mois) *"
                required
              >
                <Input
                  type="number"
                  value={contractForm.duree_mois}
                  onChange={(event) =>
                    setContractForm((current) => ({
                      ...current,
                      duree_mois: Number(
                        event.target.value
                      ),
                    }))
                  }
                />
              </Field>

              <Field
                label="Redevance mensuelle (FCFA) *"
                required
              >
                <Input
                  type="number"
                  value={contractForm.redevance}
                  onChange={(event) =>
                    setContractForm((current) => ({
                      ...current,
                      redevance: Number(
                        event.target.value
                      ),
                    }))
                  }
                />
              </Field>

              <Field
                label="Caution / Dépôt de garantie (FCFA) *"
                required
              >
                <Input
                  type="number"
                  value={contractForm.caution}
                  onChange={(event) =>
                    setContractForm((current) => ({
                      ...current,
                      caution: Number(
                        event.target.value
                      ),
                    }))
                  }
                />
              </Field>

            </div>

            <Field
              label="Modalités de paiement & Procédure caisse *"
              required
            >
              <Input
                value={contractForm.modalites_paiement}
                onChange={(event) =>
                  setContractForm((current) => ({
                    ...current,
                    modalites_paiement:
                      event.target.value,
                  }))
                }
              />
            </Field>

            <Field
              label="Règlement Stricte & Clauses d'expulsion (Affichés au Candidat) *"
              required
            >
              <Textarea
                value={contractForm.reglements_stricts}
                onChange={(event) =>
                  setContractForm((current) => ({
                    ...current,
                    reglements_stricts:
                      event.target.value,
                  }))
                }
                rows={6}
                className="font-mono text-xs"
              />
            </Field>

            <div className="flex justify-end gap-3 border-t border-ink/10 pt-3">

              <Button
                variant="ghost"
                onClick={() => setSelectedDossier(null)}
              >
                Annuler
              </Button>

              <Button
                variant="primary"
                onClick={transmettrePropositionContrat}
                disabled={loading}
              >
                {loading
                  ? 'Transmission…'
                  : '✉️ Notifier le Candidat & Proposer le RDV de Signature'}
              </Button>

            </div>

          </div>
        )}
      </Modal>

      {/* =====================================================
          MODAL 2 : VALIDATION RUPTURE
      ===================================================== */}

      <Modal
        open={!!selectedRupture}
        onClose={() => setSelectedRupture(null)}
        title="Validation Juridique de Résiliation de Contrat"
        size="lg"
      >
        {selectedRupture && (
          <div className="space-y-4">

            <div className="rounded border border-stamp/30 bg-stamp-pale p-4 text-xs space-y-2">

              <p className="text-sm font-bold text-stamp">
                Procédure Réf :{' '}
                {selectedRupture.id_procedure}
              </p>

              <p>
                Occupant :{' '}
                <strong>
                  {selectedRupture.occupant_nom}
                </strong>{' '}
                — Contrat{' '}
                <strong>
                  #{selectedRupture.contrat_ref}
                </strong>{' '}
                (Local {selectedRupture.local_ref})
              </p>

              <p>
                Motif formulé par la Direction :{' '}
                <em>{selectedRupture.motif}</em>
              </p>

            </div>

            <Field
              label="Visa Juridique & Attestation des fondements légaux *"
              required
            >
              <Textarea
                defaultValue={`Attendu les pièces versées au dossier constatant les manquements réitérés aux obligations contractuelles (notamment redevances impayées et infractions sanitaires) ;

En application du décret domanial et des clauses résolutoires de la convention d'occupation précaire ;

Le Service Juridique certifie la régularité de la procédure de résiliation et émet l'ordre de notification pour libération sous préavis de 48 heures.`}
                rows={5}
                className="font-mono text-xs"
              />
            </Field>

            <div className="rounded bg-paper2 p-3 font-mono text-xs text-muted">

              📩 À la validation, la notification formelle
              de résiliation sera générée et transmise à
              l'occupant, avec copie au Directeur Général et
              au Service Comptable pour liquidation des
              comptes.

            </div>

            <div className="flex justify-end gap-3 border-t border-ink/10 pt-3">

              <Button
                variant="ghost"
                onClick={() => setSelectedRupture(null)}
              >
                Annuler
              </Button>

              <Button
                variant="stamp"
                onClick={validerRuptureEtNotifier}
                disabled={loading}
              >
                {loading
                  ? 'Validation…'
                  : "⚖️ Valider la Résiliation & Notifier l'Occupant"}
              </Button>

            </div>

          </div>
        )}
      </Modal>

      {/* =====================================================
          MODAL 3 : ACTE DISCIPLINAIRE
      ===================================================== */}

      <Modal
        open={showNewSanctionModal}
        onClose={() =>
          setShowNewSanctionModal(false)
        }
        title="Émettre un Acte Disciplinaire ou Convocation"
      >
        <div className="space-y-4">

          <Field
            label="Type d'acte juridique *"
            required
          >
            <Select
              value={newSanctionForm.type_acte}
              onChange={(event) =>
                setNewSanctionForm((current) => ({
                  ...current,
                  type_acte: event.target.value,
                }))
              }
            >
              <option value="RAPPEL_A_L_ORDRE">
                Rappel à l'ordre (1er avertissement)
              </option>

              <option value="CONVOCATION">
                Convocation à une audience disciplinaire
              </option>

              <option value="MISE_EN_DEMEURE">
                Mise en demeure (Mise en demeure de payer /
                régulariser)
              </option>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">

            <Field
              label="Nom de l'occupant visé *"
              required
            >
              <Input
                value={newSanctionForm.occupant_nom}
                onChange={(event) =>
                  setNewSanctionForm((current) => ({
                    ...current,
                    occupant_nom:
                      event.target.value,
                  }))
                }
              />
            </Field>

            <Field
              label="Référence local *"
              required
            >
              <Input
                value={newSanctionForm.local_ref}
                onChange={(event) =>
                  setNewSanctionForm((current) => ({
                    ...current,
                    local_ref: event.target.value,
                  }))
                }
              />
            </Field>

          </div>

          {newSanctionForm.type_acte ===
          'CONVOCATION' ? (
            <Field
              label="Date et heure de l'audience *"
              required
            >
              <Input
                type="text"
                placeholder="Ex. 2026-08-20 à 10h00"
                value={
                  newSanctionForm.date_audience
                }
                onChange={(event) =>
                  setNewSanctionForm((current) => ({
                    ...current,
                    date_audience:
                      event.target.value,
                  }))
                }
              />
            </Field>
          ) : (
            <Field
              label="Délai accordé pour régularisation (jours) *"
              required
            >
              <Input
                type="number"
                value={
                  newSanctionForm.delai_jours
                }
                onChange={(event) =>
                  setNewSanctionForm((current) => ({
                    ...current,
                    delai_jours: Number(
                      event.target.value
                    ),
                  }))
                }
              />
            </Field>
          )}

          <Field
            label="Motif détaillé et visé réglementaire *"
            required
          >
            <Textarea
              value={newSanctionForm.motif}
              onChange={(event) =>
                setNewSanctionForm((current) => ({
                  ...current,
                  motif: event.target.value,
                }))
              }
              rows={3}
              placeholder="Expliquez la faute ou l'infraction constatée (ex. non-respect du tarif public conventionné, insanité)..."
            />
          </Field>

          <div className="flex justify-end gap-3 border-t border-ink/10 pt-3">

            <Button
              variant="ghost"
              onClick={() =>
                setShowNewSanctionModal(false)
              }
            >
              Annuler
            </Button>

            <Button
              variant="amber"
              onClick={emettreActeDisciplinaire}
              disabled={loading}
            >
              {loading
                ? 'Émission…'
                : "✉️ Valider & Notifier l'Occupant"}
            </Button>

          </div>

        </div>
      </Modal>

    </PageWrapper>
  );
}