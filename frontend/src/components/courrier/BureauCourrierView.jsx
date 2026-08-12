import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertBanner, Button, Card, EmptyState, Field, LoadingState, Modal,
  PageWrapper, SectionHeader, Select, StatusBadge, Textarea,
} from '../common/ui';
import { changerStatutDemande, getDemandes } from '../../api/demandes';
import { messageErreur } from '../../api/utils';
import {
  STATUTS_DEMANDE, STATUTS_DEMANDE_LABELS, TYPES_DEMANDE_LABELS,
} from '../../utils/constants';

// Le Bureau du Courrier ne traite que les dossiers a l'entree du circuit.
const STATUTS_A_TRAITER = [STATUTS_DEMANDE.NOUVELLE, STATUTS_DEMANDE.MITIGEE_COMPLEMENT];

const ORIENTATIONS = [
  {
    value: STATUTS_DEMANDE.CONTROLE_RECEVABILITE,
    label: '✅ Dossier conforme — transmettre à la DCUVE pour instruction',
    succes: 'Dossier transmis au Directeur DCUVE pour instruction.',
  },
  {
    value: STATUTS_DEMANDE.MITIGEE_COMPLEMENT,
    label: "📎 Pièces manquantes — demander un complément à l'usager",
    succes: "Demande de complément notifiée à l'usager.",
  },
];

export default function BureauCourrierView() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [orientation, setOrientation] = useState(ORIENTATIONS[0].value);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDemandes();
      setDemandes(data.filter((d) => STATUTS_A_TRAITER.includes(d.statut)));
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur de chargement du courrier entrant.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const ouvrirTraitement = (demande) => {
    setSelected(demande);
    setOrientation(ORIENTATIONS[0].value);
    setCommentaire('');
  };

  const handleTraiter = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      await changerStatutDemande(selected.id, orientation, commentaire);
      const choix = ORIENTATIONS.find((o) => o.value === orientation);
      toast.success(choix?.succes || 'Dossier traité.');
      setSelected(null);
      await charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Le traitement du courrier a échoué.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Bureau du Courrier & Réception"
        title="Enregistrement & orientation du courrier d'arrivée"
        subtitle="Point d'entrée officiel des dossiers d'occupation : contrôle préliminaire des pièces, puis transmission à la DCUVE ou demande de complément."
      />

      <AlertBanner type="info">
        Les dossiers déposés en ligne par les usagers arrivent ici au statut
        « {STATUTS_DEMANDE_LABELS.NOUVELLE} ». Un dossier déposé physiquement doit
        d'abord être saisi par l'usager ou par l'Administration SI depuis la
        gestion des comptes, afin que le demandeur reste titulaire de son dossier.
      </AlertBanner>

      {loading ? (
        <LoadingState label="Chargement du courrier entrant…" />
      ) : demandes.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Aucun courrier en attente"
          description="Tous les dossiers reçus ont été orientés. Les nouveaux dépôts apparaîtront ici automatiquement."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {demandes.map((d) => (
            <Card key={d.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>
                    {d.reference_anonyme || `Dossier ${String(d.id).slice(0, 8)}`}
                  </span>
                  <StatusBadge statut={d.statut} />
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--navy)' }}>
                  {TYPES_DEMANDE_LABELS[d.type_demande] || d.type_demande}
                </h3>

                {d.demandeur_nom && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                    Demandeur : <strong>{d.demandeur_nom}</strong>
                  </p>
                )}

                <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14, fontFamily: 'var(--font-mono)' }}>
                  <div>📅 Reçu le {d.date_depot ? new Date(d.date_depot).toLocaleDateString('fr-FR') : '—'}</div>
                  <div>📍 Local visé : {d.local_reference || d.local || 'Non précisé'}</div>
                </div>

                {d.description_projet && (
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 14px' }}>{d.description_projet}</p>
                )}
              </div>

              <Button variant="primary" size="sm" onClick={() => ouvrirTraitement(d)} style={{ justifyContent: 'center' }}>
                📥 Traiter & orienter le dossier →
              </Button>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={`Traitement du dossier ${selected.reference_anonyme || String(selected.id).slice(0, 8)}`}
        >
          <form onSubmit={handleTraiter} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Orientation du courrier *" required>
              <Select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                {ORIENTATIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>

            <Field
              label="Notes du réceptionniste"
              hint="Conservées dans l'historique du dossier et visibles par les services suivants."
            >
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={3}
                placeholder="Ex. Pièce d'identité manquante, business plan non signé…"
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <Button variant="ghost" type="button" onClick={() => setSelected(null)}>Annuler</Button>
              <Button variant="navy" type="submit" disabled={submitting}>
                {submitting ? 'Enregistrement…' : 'Valider l\u2019orientation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
