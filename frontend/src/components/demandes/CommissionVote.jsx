import { useState } from 'react';
import toast from 'react-hot-toast';

const CRITERES = [
  {
    id: 'projet',
    label: 'Pertinence du projet',
    poids: 30,
  },
  {
    id: 'experience',
    label: 'Expérience préalable',
    poids: 20,
  },
  {
    id: 'budget',
    label: 'Solidité financière',
    poids: 25,
  },
  {
    id: 'impact',
    label: 'Impact social / étudiant',
    poids: 25,
  },
];

// Données temporaires
// À remplacer par le backend plus tard
const demandesMock = [
  {
    id_demande: 'DEM-001',
    type: 'OCCUPATION',
    demandeur: {
      nom: 'Bamba Diagne',
    },
    date_depot: '10/08/2026',
    description:
      "Demande d’occupation d’un local commercial.",
    statut: 'EN_ATTENTE',
  },
  {
    id_demande: 'DEM-002',
    type: 'OCCUPATION',
    demandeur: {
      nom: 'Khadim Diagne',
    },
    date_depot: '10/08/2026',
    description:
      "Demande d’occupation d’un espace commercial.",
    statut: 'EN_ATTENTE',
  },
];

const TYPE_DEMANDE_OPTIONS = [
  {
    value: 'OCCUPATION',
    label: 'Demande d’occupation',
  },
  {
    value: 'RENOUVELLEMENT',
    label: 'Demande de renouvellement',
  },
  {
    value: 'TRANSFERT',
    label: 'Demande de transfert',
  },
];

function labelType(val) {
  return (
    TYPE_DEMANDE_OPTIONS.find(
      (type) => type.value === val
    )?.label ?? val
  );
}

function getAvisClass(avis) {
  if (avis === 'FAVORABLE') {
    return 'border-green-500 bg-green-50 text-green-700';
  }

  if (avis === 'DEFAVORABLE') {
    return 'border-red-500 bg-red-50 text-red-700';
  }

  return 'border-gray-400 bg-gray-50 text-gray-600';
}

function getAvisLabel(avis) {
  if (avis === 'FAVORABLE') {
    return '✅ Favorable';
  }

  if (avis === 'DEFAVORABLE') {
    return '❌ Défavorable';
  }

  return '⚖ Abstention';
}

export default function CommissionVote() {
  const candidats = demandesMock.filter(
    (demande) => demande.statut === 'EN_ATTENTE'
  );

  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState({});
  const [avis, setAvis] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const score = CRITERES.reduce(
    (total, critere) =>
      total +
      (notes[critere.id] ?? 0) *
        (critere.poids / 100),
    0
  ).toFixed(1);

  const ouvrirEvaluation = (demande) => {
    setSelected(demande);
    setNotes({});
    setAvis('');
    setCommentaire('');
  };

  const fermerEvaluation = () => {
    if (loading) {
      return;
    }

    setSelected(null);
    setNotes({});
    setAvis('');
    setCommentaire('');
  };

  const modifierNote = (critereId, valeur) => {
    setNotes((ancienneNotes) => ({
      ...ancienneNotes,
      [critereId]: Number(valeur),
    }));
  };

  const soumettre = async () => {
    if (!selected) {
      toast.error('Aucun dossier sélectionné.');
      return;
    }

    if (!avis) {
      toast.error('Sélectionnez votre avis.');
      return;
    }

    setLoading(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    const nouveauVote = {
      id_demande: selected.id_demande,
      avis,
      score,
      commentaire,
    };

    setVotes((anciensVotes) => [
      ...anciensVotes,
      nouveauVote,
    ]);

    toast.success('Vote enregistré.');

    setSelected(null);
    setNotes({});
    setAvis('');
    setCommentaire('');
    setLoading(false);
  };

  const voted = (idDemande) =>
    votes.find(
      (vote) => vote.id_demande === idDemande
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Commission
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Délibération de la commission
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Évaluez les dossiers et émettez votre avis
          consultatif.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Information :</strong>{' '}
          Votre avis est consultatif. La décision finale
          appartient au Directeur CROUS-T.
        </p>
      </div>

      {candidats.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center shadow-sm">
          <p className="mb-3 text-4xl">✅</p>

          <p className="text-lg font-semibold text-gray-900">
            Aucun dossier à évaluer
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Tous les dossiers soumis à la commission
            ont été traités.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidats.map((demande) => {
            const vote = voted(demande.id_demande);

            return (
              <div
                key={demande.id_demande}
                className="rounded-lg border bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">

                  <div>
                    <p className="font-mono text-xs text-gray-500">
                      {demande.id_demande}
                    </p>

                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {labelType(demande.type)}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Demandeur :{' '}
                      {demande.demandeur?.nom ||
                        'Non renseigné'}
                      {' • '}
                      Déposé le {demande.date_depot}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {vote ? (
                      <div className="flex flex-wrap items-center gap-2">

                        <span
                          className={`rounded border px-3 py-1 text-xs font-semibold ${getAvisClass(
                            vote.avis
                          )}`}
                        >
                          {getAvisLabel(vote.avis)}
                        </span>

                        <span className="font-mono text-xs text-gray-500">
                          Score : {vote.score}/10
                        </span>

                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          ouvrirEvaluation(demande)
                        }
                        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                      >
                        Évaluer →
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 bg-black/50"
            onClick={fermerEvaluation}
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b bg-white p-5">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Commission
                </p>

                <h2 className="text-xl font-bold text-gray-900">
                  Évaluation — {selected.id_demande}
                </h2>
              </div>

              <button
                type="button"
                onClick={fermerEvaluation}
                className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>

            </div>

            <div className="space-y-6 p-5">

              <div className="rounded-lg border bg-gray-50 p-4">

                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                  Projet
                </p>

                <p className="font-semibold text-gray-900">
                  {labelType(selected.type)}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  {selected.description ||
                    'Aucune description disponible.'}
                </p>

              </div>

              <div>

                <p className="mb-3 text-xs font-semibold uppercase text-gray-500">
                  Notes par critère (0 – 10)
                </p>

                <div className="space-y-4">

                  {CRITERES.map((critere) => (
                    <div
                      key={critere.id}
                      className="rounded-lg border p-4"
                    >

                      <div className="mb-3 flex items-center justify-between">

                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {critere.label}
                          </p>

                          <p className="text-xs text-gray-500">
                            Poids : {critere.poids}%
                          </p>
                        </div>

                        <span className="rounded bg-gray-100 px-3 py-1 font-mono text-sm font-bold">
                          {notes[critere.id] ?? 0}/10
                        </span>

                      </div>

                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={notes[critere.id] ?? 0}
                        onChange={(event) =>
                          modifierNote(
                            critere.id,
                            event.target.value
                          )
                        }
                        className="w-full accent-teal-600"
                      />

                    </div>
                  ))}

                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg border bg-teal-50 p-4">

                  <span className="text-xs font-semibold uppercase text-gray-600">
                    Score pondéré
                  </span>

                  <span className="text-2xl font-bold text-teal-700">
                    {score} / 10
                  </span>

                </div>

              </div>

              <div>

                <p className="mb-3 text-xs font-semibold uppercase text-gray-500">
                  Votre avis
                </p>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                  {[
                    {
                      value: 'FAVORABLE',
                      label: '✅ Favorable',
                    },
                    {
                      value: 'DEFAVORABLE',
                      label: '❌ Défavorable',
                    },
                    {
                      value: 'ABSTENTION',
                      label: '⚖ Abstention',
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setAvis(option.value)
                      }
                      className={`rounded-lg border-2 p-3 text-sm font-semibold ${
                        avis === option.value
                          ? getAvisClass(option.value)
                          : 'border-gray-200 bg-white text-gray-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}

                </div>

              </div>

              <div>

                <label
                  htmlFor="commentaire-commission"
                  className="mb-2 block text-xs font-semibold uppercase text-gray-500"
                >
                  Commentaire de commission
                  <span className="ml-1 normal-case font-normal">
                    (optionnel)
                  </span>
                </label>

                <textarea
                  id="commentaire-commission"
                  value={commentaire}
                  onChange={(event) =>
                    setCommentaire(event.target.value)
                  }
                  placeholder="Justifiez votre vote si nécessaire…"
                  rows="4"
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-teal-500"
                />

              </div>

              <div className="flex justify-end gap-3 border-t pt-4">

                <button
                  type="button"
                  onClick={fermerEvaluation}
                  disabled={loading}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={soumettre}
                  disabled={loading}
                  className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {loading
                    ? 'Enregistrement…'
                    : '✓ Soumettre mon vote'}
                </button>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}