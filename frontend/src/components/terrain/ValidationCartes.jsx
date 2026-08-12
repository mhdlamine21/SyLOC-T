import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getCartesAValider, validerCarteEtudiant } from '../../api/comptes';
import { messageErreur } from '../../api/utils';
import { Button, Input } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField, DataTable,
  IdentityCell, Pill, RowActions, IconButton,
} from '../common/dashboard';

/**
 * Validation manuelle des cartes etudiantes (procedure DCUVE / scolarite).
 */
export default function ValidationCartes() {
  const [cartes, setCartes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [traitees, setTraitees] = useState({ valides: 0, rejetes: 0 });

  const charger = async () => {
    setLoading(true);
    try {
      const data = await getCartesAValider();
      setCartes(Array.isArray(data) ? data : (data?.results || []));
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur lors du chargement des cartes a valider.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const decider = async (id, decision) => {
    try {
      await validerCarteEtudiant(id, decision);
      toast.success(decision === 'VALIDE' ? 'Carte etudiante validee.' : 'Carte etudiante rejetee.');
      setCartes((prev) => prev.filter((c) => c.id !== id));
      setTraitees((t) => ({
        valides: t.valides + (decision === 'VALIDE' ? 1 : 0),
        rejetes: t.rejetes + (decision === 'REJETE' ? 1 : 0),
      }));
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur lors de la decision.'));
    }
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cartes.filter((c) => !term
      || (c.nom_complet || c.utilisateur_nom || '').toLowerCase().includes(term)
      || (c.matricule_etudiant || '').toLowerCase().includes(term));
  }, [cartes, q]);

  const avecPiece = cartes.filter((c) => c.carte_etudiant_fichier).length;

  const columns = [
    {
      key: 'etudiant',
      label: 'Etudiant',
      render: (r) => (
        <IdentityCell
          title={r.nom_complet || r.utilisateur_nom || '—'}
          subtitle={`Matricule : ${r.matricule_etudiant || 'non renseigne'}`}
          initials={(r.nom_complet || r.utilisateur_nom || 'ET').slice(0, 2).toUpperCase()}
        />
      ),
    },
    { key: 'contact', label: 'Contact', render: (r) => r.contact || r.utilisateur_email || '—' },
    {
      key: 'date',
      label: 'Soumis le',
      render: (r) => (r.date_modification ? new Date(r.date_modification).toLocaleDateString('fr-FR') : '—'),
    },
    {
      key: 'piece',
      label: 'Piece',
      render: (r) => (r.carte_etudiant_fichier
        ? <a href={r.carte_etudiant_fichier} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: 'var(--gold-deep)', fontSize: 12 }}>📎 Consulter</a>
        : <Pill tone="red">Absente</Pill>),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => <Pill tone="gold">{(r.statut_verification_etudiant || 'EN_ATTENTE').replace(/_/g, ' ')}</Pill>,
    },
    {
      key: 'actions',
      label: 'Decision',
      align: 'right',
      render: (r) => (
        <RowActions>
          <IconButton title="Valider" tone="green" onClick={() => decider(r.id, 'VALIDE')}>✓</IconButton>
          <IconButton title="Rejeter" tone="red" onClick={() => decider(r.id, 'REJETE')}>✕</IconButton>
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon="🪪"
        title="Validation des cartes etudiantes"
        subtitle="Verification manuelle des pieces justificatives de scolarite ouvrant droit a la gratuite."
        actions={<Button variant="secondary" onClick={charger}>↻ Actualiser</Button>}
      />

      <StatGrid cols={4}>
        <KpiCard icon="⏳" label="En attente" value={cartes.length} sub="Dossiers a examiner" tone="gold" />
        <KpiCard icon="📎" label="Pieces jointes" value={avecPiece} sub={`${cartes.length - avecPiece} sans justificatif`} tone="navy" />
        <KpiCard icon="✅" label="Validees (session)" value={traitees.valides} sub="Depuis l'ouverture" tone="green" />
        <KpiCard icon="✕" label="Rejetees (session)" value={traitees.rejetes} sub="Depuis l'ouverture" tone="red" />
      </StatGrid>

      <Panel icon="📋" title="File d'attente de validation" padded={false}>
        <div style={{ padding: '14px 16px 0' }}>
          <FilterBar onReset={() => setQ('')}>
            <FilterField label="Recherche">
              <Input placeholder="Nom ou matricule…" value={q} onChange={(e) => setQ(e.target.value)} />
            </FilterField>
          </FilterBar>
        </div>
        <DataTable columns={columns} rows={rows} loading={loading} empty="Aucune carte en attente de validation." pageSize={12} dense />
      </Panel>
    </div>
  );
}
