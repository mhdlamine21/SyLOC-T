import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  PageWrapper, SectionHeader, Card, StatusBadge, Table, Button,
  Modal, Field, Textarea, Select, EmptyState, AlertBanner,
} from '../common/ui';
import { demandesMock, TYPE_DEMANDE_OPTIONS } from '../../mocks/data';

function labelType(val) {
  return TYPE_DEMANDE_OPTIONS.find((t) => t.value === val)?.label ?? val;
}

export default function InstructionDCUVE() {
  const [dossiers, setDossiers] = useState(demandesMock);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [commentaire, setCommentaire] = useState('');
  const [avisSanitaire, setAvisSanitaire] = useState('FAVORABLE');
  const [loading, setLoading] = useState(false);

  const transmettreAuJuridique = async (dossier) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    setDossiers((prev) =>
      prev.map((d) =>
        d.id_demande === dossier.id_demande
          ? { ...d, statut: 'TRANSMIS_JURIDIQUE', etape: 'Rédaction du bail par le Service Juridique' }
          : d
      )
    );

    toast.success(`Dossier ${dossier.id_demande} transmis au Service Juridique pour rédaction du contrat.`);
    setSelected(null);
    setLoading(false);
  };

  const signerEtPromouvoir = async (dossier) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    setDossiers((prev) =>
      prev.map((d) =>
        d.id_demande === dossier.id_demande
          ? { ...d, statut: 'CONTRAT_SIGNE_OCCUPANT', etape: 'Bail signé — Statut OCCUPANT actif' }
          : d
      )
    );

    toast.success(`Contrat signé avec le Directeur Général ! Statut du candidat ${dossier.demandeur?.nom} changé en OCCUPANT.`);
    setSelected(null);
    setLoading(false);
  };

  const traiter = async () => {
    if (!commentaire.trim() && action !== 'valider_completude') {
      toast.error('Ajoutez un commentaire.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    const newStatut = {
      valider_completude:    'EN_ATTENTE',
      demander_complement:   'MITIGEE_COMPLEMENT',
      declarer_irrecevable:  'DEFAVORABLE',
      avis_sanitaire:        'EN_ATTENTE',
    }[action];

    setDossiers((prev) =>
      prev.map((d) =>
        d.id_demande === selected.id_demande ? { ...d, statut: newStatut } : d
      )
    );
    toast.success('Action enregistrée avec succès.');
    setSelected(null);
    setAction(null);
    setCommentaire('');
    setLoading(false);
  };

  const columns = [
    { key: 'id_demande', label: 'Référence', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'type', label: 'Type', render: (v) => labelType(v) },
    { key: 'date_depot', label: 'Déposée le', render: (v) => <span className="font-mono text-xs">{v}</span> },
    {
      key: 'statut',
      label: 'Statut',
      render: (v) => <StatusBadge statut={v} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setSelected(row); }}>
          Instruire →
        </Button>
      ),
    },
  ];

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="DCUVE & Direction General"
        title="Instruction des dossiers & Transmission Juridique"
        subtitle={`${dossiers.filter((d) => d.statut === 'EN_ATTENTE').length} dossier(s) en attente d'instruction.`}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'En attente', count: dossiers.filter((d) => d.statut === 'EN_ATTENTE').length, color: 'text-amber' },
          { label: 'Complément demandé', count: dossiers.filter((d) => d.statut === 'MITIGEE_COMPLEMENT').length, color: 'text-danger' },
          { label: 'Favorables / Juridique', count: dossiers.filter((d) => ['FAVORABLE', 'TRANSMIS_JURIDIQUE', 'CONTRAT_ACCEPTE_RDV_FIXE'].includes(d.statut)).length, color: 'text-ok' },
        ].map((s) => (
          <Card key={s.label} className="text-center py-4">
            <p className={`font-display text-3xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted font-mono uppercase mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <Table
          columns={columns}
          data={dossiers}
          onRow={(row) => setSelected(row)}
          emptyState={<EmptyState icon="✅" title="Aucun dossier en attente" description="Tous les dossiers ont été traités." />}
        />
      </Card>

      {/* Modal instruction */}
      <Modal
        open={!!selected && !action}
        onClose={() => setSelected(null)}
        title={selected ? `Instruction — ${selected.id_demande}` : ''}
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-mono text-xs text-muted uppercase">Type</p>
                <p className="font-semibold mt-1">{labelType(selected.type)}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted uppercase">Statut actuel</p>
                <StatusBadge statut={selected.statut} className="mt-1" />
              </div>
              <div>
                <p className="font-mono text-xs text-muted uppercase">Demandeur</p>
                <p className="font-semibold mt-1">{selected.demandeur?.nom}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted uppercase">Date de dépôt</p>
                <p className="font-semibold mt-1">{selected.date_depot}</p>
              </div>
            </div>

            {selected.description && (
              <div className="bg-paper2 p-3 text-sm" style={{ borderRadius: 'var(--radius)' }}>
                <p className="font-mono text-xs text-muted uppercase mb-1">Description du projet</p>
                <p>{selected.description}</p>
              </div>
            )}

            {/* Circuit Juridique et Signature */}
            {(selected.statut === 'FAVORABLE' || selected.id_demande === 'DM-2026-00799') && (
              <div className="p-4 bg-teal-pale border border-teal/30 rounded space-y-2">
                <p className="font-display font-bold text-sm text-teal">📜 Dossier Favorable — Transmettre au Service Juridique</p>
                <p className="text-xs text-muted">
                  Ce dossier a été validé. Transmettez-le au Service Juridique pour la rédaction des clauses du bail et l'envoi de la convocation.
                </p>
                <Button variant="primary" size="sm" onClick={() => transmettreAuJuridique(selected)} disabled={loading}>
                  ✉️ Transmettre au Service Juridique (Rédaction Contrat)
                </Button>
              </div>
            )}

            {selected.statut === 'CONTRAT_ACCEPTE_RDV_FIXE' && (
              <div className="p-4 bg-ok-soft border border-ok/30 rounded space-y-2">
                <p className="font-display font-bold text-sm text-ok">📅 Rendez-vous de Signature Confirmé avec le Directeur</p>
                <p className="text-xs text-muted">Le candidat a accepté le contrat. Effectuez la signature et changez son statut en OCCUPANT.</p>
                <Button variant="amber" size="sm" onClick={() => signerEtPromouvoir(selected)} disabled={loading}>
                  ✍️ Signer le Contrat & Promouvoir le Candidat en OCCUPANT
                </Button>
              </div>
            )}

            <div>
              <p className="font-mono text-xs text-muted uppercase mb-3">Actions d'instruction d'origine</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'valider_completude', label: '✅ Valider la complétude', variant: 'secondary', desc: 'Dossier complet, passer à l\'instruction.' },
                  { key: 'demander_complement', label: '📋 Demander complément', variant: 'ghost', desc: 'Informer le demandeur d\'une pièce manquante.' },
                  { key: 'declarer_irrecevable', label: '❌ Déclarer irrecevable', variant: 'danger', desc: 'Clore la demande pour irrecevabilité.' },
                  { key: 'avis_sanitaire', label: '🏥 Enregistrer avis sanitaire', variant: 'ghost', desc: 'Avis du Service d\'Hygiène externe.' },
                ].map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setAction(a.key)}
                    className="text-left p-3 border border-ink/15 hover:border-teal/50 hover:bg-teal-pale transition-colors"
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    <p className="font-semibold text-sm">{a.label}</p>
                    <p className="text-xs text-muted mt-0.5">{a.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal action */}
      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        title={action ? {
          valider_completude: 'Valider la complétude du dossier',
          demander_complement: 'Demander un complément',
          declarer_irrecevable: 'Déclarer l\'irrecevabilité',
          avis_sanitaire: 'Enregistrer l\'avis sanitaire',
        }[action] : ''}
      >
        <div className="space-y-4">
          {action === 'avis_sanitaire' && (
            <Field label="Avis sanitaire externe" required>
              <Select value={avisSanitaire} onChange={(e) => setAvisSanitaire(e.target.value)}>
                <option value="FAVORABLE">Favorable</option>
                <option value="DEFAVORABLE">Défavorable</option>
                <option value="EN_ATTENTE">En attente</option>
              </Select>
            </Field>
          )}
          <Field
            label="Commentaire"
            required={action !== 'valider_completude'}
            hint={action === 'valider_completude' ? 'optionnel' : 'obligatoire'}
          >
            <Textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Saisissez votre commentaire ou justification…"
              rows={4}
            />
          </Field>
          {action === 'declarer_irrecevable' && (
            <AlertBanner type="danger">
              Cette action est irréversible. Le dossier sera clôturé et le demandeur notifié.
            </AlertBanner>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setAction(null)}>Annuler</Button>
            <Button
              variant={action === 'declarer_irrecevable' ? 'danger' : 'primary'}
              onClick={traiter}
              disabled={loading}
            >
              {loading ? 'Enregistrement…' : '✓ Confirmer'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}