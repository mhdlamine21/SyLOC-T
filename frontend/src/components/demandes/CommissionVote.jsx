import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  PageWrapper, SectionHeader, Card, StatusBadge, Button, Modal, Textarea, Field, AlertBanner,
} from '../common/ui';
import { demandesMock, TYPE_DEMANDE_OPTIONS } from '../../mocks/data';

const CRITERES = [
  { id: 'projet', label: 'Pertinence du projet', poids: 30 },
  { id: 'experience', label: 'Expérience préalable', poids: 20 },
  { id: 'budget', label: 'Solidité financière', poids: 25 },
  { id: 'impact', label: 'Impact social / étudiant', poids: 25 },
];

function labelType(val) {
  return TYPE_DEMANDE_OPTIONS.find((t) => t.value === val)?.label ?? val;
}

export default function CommissionVote() {
  const candidats = demandesMock.filter((d) => d.statut === 'EN_ATTENTE');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState({});
  const [avis, setAvis] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const score = CRITERES.reduce((acc, c) => acc + (notes[c.id] ?? 0) * (c.poids / 100), 0).toFixed(1);

  const soumettre = async () => {
    if (!avis) { toast.error('Sélectionnez votre avis.'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setVotes((prev) => [...prev, { id_demande: selected.id_demande, avis, score, commentaire }]);
    toast.success('Vote enregistré.');
    setSelected(null);
    setNotes({});
    setAvis('');
    setCommentaire('');
    setLoading(false);
  };

  const voted = (id) => votes.find((v) => v.id_demande === id);

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Commission"
        title="Délibération de la commission"
        subtitle="Évaluez les dossiers et émettez votre avis consultatif."
      />

      <AlertBanner type="info">
        Votre avis est consultatif. La décision finale appartient au Directeur CROUS-T.
      </AlertBanner>

      {candidats.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-display font-semibold text-lg">Aucun dossier à évaluer</p>
          <p className="text-sm text-muted mt-1">Tous les dossiers soumis à la commission ont été traités.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {candidats.map((d) => {
            const v = voted(d.id_demande);
            return (
              <Card key={d.id_demande} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-muted">{d.id_demande}</p>
                  <p className="font-display font-semibold">{labelType(d.type)}</p>
                  <p className="text-sm text-muted">Demandeur : {d.demandeur?.nom} • Déposé le {d.date_depot}</p>
                </div>
                <div className="flex items-center gap-3">
                  {v ? (
                    <div className="flex items-center gap-2">
                      <StatusBadge statut={v.avis === 'FAVORABLE' ? 'FAVORABLE' : v.avis === 'DEFAVORABLE' ? 'DEFAVORABLE' : 'EN_ATTENTE'} />
                      <span className="font-mono text-xs text-muted">Score : {v.score}/10</span>
                    </div>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => setSelected(d)}>
                      Évaluer →
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal évaluation */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Évaluation — ${selected.id_demande}` : ''}
        size="lg"
      >
        {selected && (
          <div className="space-y-6">
            <div className="bg-paper2 p-4" style={{ borderRadius: 'var(--radius)' }}>
              <p className="font-mono text-xs text-muted uppercase mb-2">Projet</p>
              <p className="font-display font-semibold">{labelType(selected.type)}</p>
              <p className="text-sm text-muted mt-1">{selected.description}</p>
            </div>

            {/* Notes par critère */}
            <div>
              <p className="font-mono text-xs text-muted uppercase mb-3">Notes par critère (0 – 10)</p>
              <div className="space-y-3">
                {CRITERES.map((c) => (
                  <div key={c.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{c.label}</p>
                      <p className="font-mono text-xs text-muted">Poids : {c.poids}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min={0} max={10} step={1}
                        value={notes[c.id] ?? 0}
                        onChange={(e) => setNotes((n) => ({ ...n, [c.id]: +e.target.value }))}
                        className="w-28 accent-teal"
                      />
                      <span className="font-mono text-sm font-bold w-6 text-right">{notes[c.id] ?? 0}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-ink/10 flex justify-between items-center">
                <span className="font-mono text-xs text-muted uppercase">Score pondéré</span>
                <span className="font-display text-2xl font-bold text-teal">{score} / 10</span>
              </div>
            </div>

            {/* Avis */}
            <div>
              <p className="font-mono text-xs text-muted uppercase mb-3">Votre avis</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'FAVORABLE', label: '✅ Favorable', color: 'border-ok text-ok bg-ok-soft' },
                  { value: 'DEFAVORABLE', label: '❌ Défavorable', color: 'border-danger text-danger bg-danger-soft' },
                  { value: 'ABSTENTION', label: '⚖ Abstention', color: 'border-ink/30 text-muted bg-soft' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAvis(opt.value)}
                    className={`p-3 border-2 font-semibold text-sm transition-all
                      ${avis === opt.value ? opt.color : 'border-ink/15 text-muted hover:border-ink/30'}`}
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Commentaire de commission" hint="optionnel">
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Justifiez votre vote si nécessaire…"
                rows={3}
              />
            </Field>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setSelected(null)}>Annuler</Button>
              <Button variant="primary" onClick={soumettre} disabled={loading}>
                {loading ? 'Enregistrement…' : '✓ Soumettre mon vote'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
