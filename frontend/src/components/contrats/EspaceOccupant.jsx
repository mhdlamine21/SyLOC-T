import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const contratInitial = {
  id_contrat: 'CTR-2026-001',
  redevance_mensuelle: 120000,
  montant_caution: 240000,
  preavis_mois: 2,
  date_signature: '01/09/2026',
  date_debut: '01/09/2026',
  demande_resiliation_encours: false,
  occupant: {
    nom: 'Mamadou Lô',
  },
  local: {
    reference: 'LOC-004',
    localisation: 'Cantine A',
  },
};

const paiementsInitial = [
  {
    id: 1,
    date: '05/08/2026',
    mode: 'WAVE',
    montant: 120000,
    reference: 'PAY-2026-0805',
    quitus: 'QT-2026-0805',
    occupant_nom: 'Mamadou Lô',
    local_ref: 'LOC-004 (Cantine A)',
  },
  {
    id: 2,
    date: '05/07/2026',
    mode: 'ORANGE MONEY',
    montant: 120000,
    reference: 'PAY-2026-0705',
    quitus: 'QT-2026-0705',
    occupant_nom: 'Mamadou Lô',
    local_ref: 'LOC-004 (Cantine A)',
  },
];

function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
  onClick,
}) {
  const variants = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700',
    stamp: 'bg-red-600 text-white hover:bg-red-700',
    amber: 'bg-amber-500 text-white hover:bg-amber-600',
    ghost:
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        variants[variant] || variants.primary
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
  required = false,
  hint = '',
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-gray-800">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      {hint && (
        <p className="mb-1 text-xs text-gray-500">
          {hint}
        </p>
      )}

      {children}
    </div>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
    />
  );
}

function AlertBanner({ children, type = 'info' }) {
  const classes = {
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warn: 'border-amber-200 bg-amber-50 text-amber-800',
    warning:
      'border-amber-200 bg-amber-50 text-amber-800',
  };

  return (
    <div
      className={`mb-6 rounded-lg border p-4 text-sm ${
        classes[type] || classes.info
      }`}
    >
      {children}
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-bold text-gray-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function EspaceOccupant() {
  const { user } = useAuth();

  const [contrat, setContrat] =
    useState(contratInitial);

  const [paiements] =
    useState(paiementsInitial);

  const [
    showResiliationModal,
    setShowResiliationModal,
  ] = useState(false);

  const [
    dateDeparture,
    setDateDeparture,
  ] = useState('');

  const [
    motifResiliation,
    setMotifResiliation,
  ] = useState('');

  const [
    showQuitusPdf,
    setShowQuitusPdf,
  ] = useState(null);

  const [loading, setLoading] =
    useState(false);

  const minDatePreavis = () => {
    const date = new Date();

    date.setMonth(
      date.getMonth() + 2
    );

    return date
      .toISOString()
      .slice(0, 10);
  };

  const soumettreResiliation = async (
    event
  ) => {
    event.preventDefault();

    if (
      !dateDeparture ||
      !motifResiliation.trim()
    ) {
      toast.error(
        'Date de départ et motif de résiliation requis.'
      );

      return;
    }

    const minDate =
      minDatePreavis();

    if (dateDeparture < minDate) {
      toast.error(
        `Le préavis obligatoire est de 2 mois minimum. Votre date de départ doit être égale ou postérieure au ${minDate}.`
      );

      return;
    }

    setLoading(true);

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 800)
    );

    setContrat((current) => ({
      ...current,
      demande_resiliation_encours:
        true,
    }));

    toast.success(
      'Demande de résiliation de bail transmise à la Direction avec préavis de 2 mois.'
    );

    setShowResiliationModal(false);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Espace Occupant Titulaire
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Mon Contrat d'Occupation & Historique Redevances
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Gestion du bail #{contrat.id_contrat} • Local{' '}
          {contrat.local.reference}
        </p>

        {user?.nom && (
          <p className="mt-1 text-xs text-gray-500">
            Occupant : {user.nom}
          </p>
        )}
      </div>

      {contrat.demande_resiliation_encours && (
        <AlertBanner type="warn">
          <strong>
            Résiliation de bail en cours :
          </strong>{' '}
          Votre demande de résiliation avec préavis
          de 2 mois a été enregistrée.
        </AlertBanner>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">

        <Card className="text-center">
          <p className="text-xs font-bold uppercase text-teal-700">
            Local Occupé
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {contrat.local.reference}
          </p>

          <p className="text-xs text-gray-500">
            {contrat.local.localisation}
          </p>
        </Card>

        <Card className="text-center">
          <p className="text-xs font-bold uppercase text-gray-500">
            Redevance Mensuelle
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {contrat.redevance_mensuelle.toLocaleString(
              'fr-SN'
            )}{' '}
            <span className="text-xs font-normal">
              FCFA
            </span>
          </p>

          <p className="text-xs font-semibold text-green-600">
            Caution :{' '}
            {contrat.montant_caution.toLocaleString(
              'fr-SN'
            )}{' '}
            FCFA
          </p>
        </Card>

        <Card className="text-center">
          <p className="text-xs font-bold uppercase text-gray-500">
            Score Conformité QHSE
          </p>

          <p className="mt-1 text-2xl font-bold text-green-600">
            ★ 4.2 / 5
          </p>

          <p className="text-xs text-gray-500">
            Bon respect des normes
          </p>
        </Card>

        <Card className="text-center">
          <p className="text-xs font-bold uppercase text-gray-500">
            Score Avis Étudiants
          </p>

          <p className="mt-1 text-2xl font-bold text-amber-600">
            ★ 4.5 / 5
          </p>

          <p className="text-xs text-gray-500">
            Très apprécié en restauration
          </p>
        </Card>

      </div>

      <div className="grid gap-6 md:grid-cols-12">

        <div className="space-y-6 md:col-span-5">

          <Card>

            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Fiche du Contrat de Bail
              </h2>

              <span className="rounded bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                Bail Actif
              </span>
            </div>

            <div className="space-y-3 text-sm">

              {[
                [
                  'N° de contrat',
                  contrat.id_contrat,
                ],
                [
                  'Bailleur',
                  'CROUS de Thiès (CROUS-T)',
                ],
                [
                  'Occupant titulaire',
                  contrat.occupant.nom,
                ],
                [
                  'Local attribué',
                  `${contrat.local.reference} — ${contrat.local.localisation}`,
                ],
                [
                  'Date de signature',
                  contrat.date_signature,
                ],
                [
                  "Date de prise d'effet",
                  contrat.date_debut,
                ],
                [
                  'Préavis obligatoire',
                  `${contrat.preavis_mois} mois`,
                ],
              ].map(
                ([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-0"
                  >
                    <span className="text-xs uppercase text-gray-500">
                      {label}
                    </span>

                    <span className="text-right font-semibold text-gray-900">
                      {value}
                    </span>
                  </div>
                )
              )}

            </div>

            <div className="mt-6 border-t pt-4">

              <Button
                variant="stamp"
                className="w-full"
                onClick={() =>
                  setShowResiliationModal(
                    true
                  )
                }
                disabled={
                  contrat.demande_resiliation_encours
                }
              >
                📄 Résilier mon contrat
                (Préavis 2 mois)
              </Button>

            </div>

          </Card>

        </div>

        <div className="md:col-span-7">

          <Card>

            <div className="mb-4 flex items-center justify-between border-b pb-3">

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Historique de mes Paiements & Quitus
                </h2>

                <p className="text-xs text-gray-500">
                  Consultez vos quitus officiels.
                </p>
              </div>

              <span className="text-xs font-bold text-gray-500">
                {paiements.length} règlement(s)
              </span>

            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">

              {paiements.map(
                (paiement) => (
                  <div
                    key={paiement.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                  >

                    <div>

                      <div className="flex items-center gap-2">

                        <span className="text-xs text-gray-500">
                          {paiement.date}
                        </span>

                        <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">
                          {paiement.mode}
                        </span>

                      </div>

                      <p className="mt-1 text-base font-bold text-green-600">
                        {paiement.montant.toLocaleString(
                          'fr-SN'
                        )}{' '}
                        FCFA
                      </p>

                      <p className="text-xs text-gray-500">
                        Réf :{' '}
                        {paiement.reference}
                      </p>

                    </div>

                    <Button
                      variant="amber"
                      onClick={() =>
                        setShowQuitusPdf(
                          paiement
                        )
                      }
                    >
                      📄 Quitus PDF
                    </Button>

                  </div>
                )
              )}

            </div>

          </Card>

        </div>

      </div>

      <Modal
        open={showResiliationModal}
        onClose={() =>
          setShowResiliationModal(
            false
          )
        }
        title="Demande de Résiliation de Contrat de Bail"
      >

        <form
          onSubmit={
            soumettreResiliation
          }
          className="space-y-4"
        >

          <AlertBanner type="warn">
            <strong>
              Règle du Préavis :
            </strong>{' '}
            Toute résiliation à l'initiative
            de l'occupant exige un{' '}
            <strong>
              préavis écrit de 2 mois minimum
            </strong>
            .
          </AlertBanner>

          <Field
            label="Date de départ souhaitée"
            required
            hint={`Date minimale autorisée : ${minDatePreavis()}`}
          >
            <input
              type="date"
              value={dateDeparture}
              min={minDatePreavis()}
              onChange={(event) =>
                setDateDeparture(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              required
            />
          </Field>

          <Field
            label="Motif de la résiliation"
            required
          >
            <Textarea
              value={motifResiliation}
              onChange={(event) =>
                setMotifResiliation(
                  event.target.value
                )
              }
              placeholder="Expliquez la raison de votre départ..."
              rows={4}
              required
            />
          </Field>

          <div className="flex justify-end gap-3 border-t pt-4">

            <Button
              variant="ghost"
              onClick={() =>
                setShowResiliationModal(
                  false
                )
              }
            >
              Annuler
            </Button>

            <Button
              variant="stamp"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Transmission…'
                : '✓ Soumettre la Résiliation'}
            </Button>

          </div>

        </form>

      </Modal>

      {showQuitusPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 bg-black/60"
            onClick={() =>
              setShowQuitusPdf(null)
            }
          />

          <div className="relative z-10 w-full max-w-lg rounded-lg border-2 border-teal-600 bg-white p-8 text-gray-900 shadow-2xl">

            <div className="mb-4 border-b-2 border-teal-600 pb-4 text-center">

              <p className="text-[10px] uppercase tracking-widest text-gray-500">
                REPUBLIQUE DU SENEGAL • MINISTERE DE
                L'ENSEIGNEMENT SUPERIEUR
              </p>

              <p className="mt-1 text-xl font-bold text-teal-700">
                CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES
                DE THIES
              </p>

              <p className="mt-1 text-xs font-bold uppercase text-red-600">
                QUITUS OFFICIEL DE LIBERATION MENSUELLE
              </p>

              <p className="mt-1 text-sm font-bold">
                N° {showQuitusPdf.quitus}
              </p>

            </div>

            <div className="space-y-3 text-xs">

              {[
                [
                  'Occupant Titulaire',
                  showQuitusPdf.occupant_nom,
                ],
                [
                  'Local Commercial',
                  showQuitusPdf.local_ref,
                ],
                [
                  'Montant de la redevance',
                  `${showQuitusPdf.montant.toLocaleString(
                    'fr-SN'
                  )} FCFA`,
                ],
                [
                  'Mode de règlement',
                  showQuitusPdf.mode,
                ],
                [
                  'Référence Transaction',
                  showQuitusPdf.reference,
                ],
                [
                  "Date d'encaissement",
                  showQuitusPdf.date,
                ],
                [
                  'Statut de quittance',
                  'LIBÉRÉ ET CONFORME',
                ],
              ].map(
                ([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 border-b border-gray-100 pb-2"
                  >
                    <span className="uppercase text-gray-500">
                      {label}
                    </span>

                    <span className="text-right font-bold">
                      {value}
                    </span>
                  </div>
                )
              )}

            </div>

            <div className="mt-6 rounded border bg-gray-50 p-3 text-center text-[11px] italic text-gray-500">
              Ce document fait foi de paiement de la
              redevance mensuelle d'occupation. Délivré
              par le Service Comptable du CROUS-T.
            </div>

            <div className="mt-6 flex gap-3">

              <Button
                variant="primary"
                className="flex-1"
                onClick={() =>
                  window.print()
                }
              >
                🖨️ Imprimer / PDF
              </Button>

              <Button
                variant="ghost"
                className="flex-1"
                onClick={() =>
                  setShowQuitusPdf(null)
                }
              >
                Fermer
              </Button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}