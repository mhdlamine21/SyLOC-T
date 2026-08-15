import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getCartesAValider, validerCarteEtudiant } from '../../api/comptes';
import { messageErreur } from '../../api/utils';
import { Button, Field, Input, Modal, Textarea } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField, DataTable,
  IdentityCell, Pill, RowActions, IconButton, Tabs, MiniStat,
} from '../common/dashboard';

const TONE_STATUT = { VALIDE: 'green', REJETE: 'red', EN_ATTENTE: 'gold' };
const dateFr = (v) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—');
const dateHeureFr = (v) => (v ? new Date(v).toLocaleString('fr-FR') : '—');

/**
 * Validation enrichie des cartes etudiantes (Bureau du Courrier / DCUVE).
 * Fiche complete du candidat, apercu de la piece, motif de rejet obligatoire
 * et historique des decisions deja rendues.
 */
export default function ValidationCartes() {
  const [onglet, setOnglet] = useState('EN_ATTENTE');
  const [cartes, setCartes] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [fiche, setFiche] = useState(null);
  const [motif, setMotif] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [attente, tout] = await Promise.all([
        getCartesAValider('EN_ATTENTE'),
        getCartesAValider('TOUTES').catch(() => []),
      ]);
      const norm = (d) => (Array.isArray(d) ? d : (d?.results || []));
      setCartes(norm(attente));
      setHistorique(norm(tout).filter((c) => c.statut_verification_etudiant !== 'EN_ATTENTE'));
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur lors du chargement des cartes à valider.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const decider = async (demandeur, decision) => {
    if (decision === 'REJETE' && motif.trim().length < 5) {
      toast.error('Un motif de rejet (min. 5 caractères) est obligatoire.');
      return;
    }
    setSubmitting(true);
    try {
      await validerCarteEtudiant(demandeur.id, decision, decision === 'REJETE' ? motif.trim() : '');
      toast.success(decision === 'VALIDE'
        ? 'Carte étudiante validée : la gratuité est ouverte au candidat.'
        : 'Carte étudiante rejetée, le candidat est notifié du motif.');
      setFiche(null);
      setMotif('');
      await charger();
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur lors de la décision.'));
    } finally {
      setSubmitting(false);
    }
  };

  const source = onglet === 'EN_ATTENTE' ? cartes : historique;

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return source;
    return source.filter((c) => [c.nom_complet, c.matricule_etudiant, c.email, c.contact]
      .some((v) => (v || '').toLowerCase().includes(term)));
  }, [source, q]);

  const avecPiece = cartes.filter((c) => c.carte_etudiant_fichier).length;
  const valides = historique.filter((c) => c.statut_verification_etudiant === 'VALIDE').length;
  const rejetes = historique.filter((c) => c.statut_verification_etudiant === 'REJETE').length;

  const colonneIdentite = {
    key: 'etudiant',
    label: 'Étudiant',
    render: (r) => (
      <IdentityCell
        title={r.nom_complet || r.username || '—'}
        subtitle={`Matricule : ${r.matricule_etudiant || 'non renseigné'}`}
        initials={(r.nom_complet || r.username || 'ET').slice(0, 2).toUpperCase()}
      />
    ),
  };

  const colonneContact = {
    key: 'contact',
    label: 'Contact',
    render: (r) => (
      <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{r.contact || '—'}</div>
        <div style={{ color: 'var(--muted)' }}>{r.email || '—'}</div>
      </div>
    ),
  };

  const colonneDossier = {
    key: 'dossier',
    label: 'Activité du candidat',
    render: (r) => (
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
        <div>{r.nb_demandes ?? 0} dossier(s) déposé(s)</div>
        <div>{r.nb_contrats_actifs ?? 0} bail actif · fidélité {Math.round(r.score_fidelite ?? 0)}</div>
      </div>
    ),
  };

  const colonnePiece = {
    key: 'piece',
    label: 'Pièce',
    render: (r) => (r.carte_etudiant_fichier
      ? (
        <button
          type="button"
          onClick={() => { setFiche(r); setMotif(''); }}
          style={{ padding: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'none', cursor: 'pointer', display: 'block' }}
        >
          <img src={r.carte_etudiant_fichier} alt="Carte étudiante" style={{ width: 68, height: 44, objectFit: 'cover', display: 'block' }} />
        </button>
      )
      : <Pill tone="red">Absente</Pill>),
  };

  const columnsAttente = [
    colonneIdentite,
    colonneContact,
    colonneDossier,
    { key: 'depot', label: 'Soumis le', render: (r) => dateFr(r.carte_etudiant_date_soumission || r.date_modification) },
    colonnePiece,
    {
      key: 'actions',
      label: 'Décision',
      align: 'right',
      render: (r) => (
        <RowActions>
          <IconButton title="Ouvrir la fiche" tone="navy" onClick={() => { setFiche(r); setMotif(''); }}>
            <VisibilityOutlinedIcon style={{ fontSize: 17 }} />
          </IconButton>
          <IconButton title="Valider" tone="green" onClick={() => decider(r, 'VALIDE')}>✓</IconButton>
          <IconButton title="Rejeter (motif requis)" tone="red" onClick={() => { setFiche(r); setMotif(''); }}>✕</IconButton>
        </RowActions>
      ),
    },
  ];

  const columnsHistorique = [
    colonneIdentite,
    colonneContact,
    { key: 'statut', label: 'Décision', render: (r) => <Pill tone={TONE_STATUT[r.statut_verification_etudiant] || 'slate'}>{(r.statut_verification_etudiant || '').replace(/_/g, ' ')}</Pill> },
    { key: 'motif', label: 'Motif', render: (r) => r.motif_rejet_carte || '—' },
    { key: 'par', label: 'Traité par', render: (r) => r.valide_par_nom || '—' },
    { key: 'date', label: 'Le', render: (r) => dateHeureFr(r.carte_etudiant_date_validation) },
    colonnePiece,
  ];

  return (
    <div>
      <PageHeader
        icon={<BadgeOutlinedIcon style={{ fontSize: 20 }} />}
        title="Validation des cartes étudiantes"
        subtitle="Vérification des pièces de scolarité ouvrant droit à la gratuité : fiche complète du candidat, aperçu de la carte et traçabilité des décisions."
        actions={<Button variant="secondary" onClick={charger}>↻ Actualiser</Button>}
      />

      <StatGrid cols={4}>
        <KpiCard icon={<HourglassEmptyOutlinedIcon style={{ fontSize: 20 }} />} label="En attente" value={cartes.length} sub="Dossiers à examiner" tone={cartes.length ? 'gold' : 'green'} />
        <KpiCard icon={<AttachFileOutlinedIcon style={{ fontSize: 20 }} />} label="Pièces jointes" value={avecPiece} sub={`${cartes.length - avecPiece} sans justificatif`} tone="navy" />
        <KpiCard icon={<TaskAltOutlinedIcon style={{ fontSize: 20 }} />} label="Cartes validées" value={valides} sub="Gratuité ouverte" tone="green" />
        <KpiCard icon={<CloseOutlinedIcon style={{ fontSize: 20 }} />} label="Cartes rejetées" value={rejetes} sub="Motif notifié au candidat" tone="red" />
      </StatGrid>

      <Tabs
        active={onglet}
        onChange={setOnglet}
        tabs={[
          { key: 'EN_ATTENTE', label: `À valider${cartes.length ? ` (${cartes.length})` : ''}` },
          { key: 'HISTORIQUE', label: `Décisions rendues${historique.length ? ` (${historique.length})` : ''}` },
        ]}
      />

      <Panel padded={false}>
        <FilterBar onReset={() => setQ('')}>
          <FilterField label="Rechercher">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, matricule, email, téléphone…" />
          </FilterField>
        </FilterBar>
        <DataTable
          columns={onglet === 'EN_ATTENTE' ? columnsAttente : columnsHistorique}
          rows={rows}
          loading={loading}
          empty={onglet === 'EN_ATTENTE' ? 'Aucune carte en attente de validation.' : 'Aucune décision enregistrée.'}
          pageSize={10}
        />
      </Panel>

      <Modal
        open={!!fiche}
        onClose={() => { setFiche(null); setMotif(''); }}
        title={`Carte étudiante — ${fiche?.nom_complet || ''}`}
        size="lg"
      >
        {fiche && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }}>
            <div>
              {fiche.carte_etudiant_fichier ? (
                <a href={fiche.carte_etudiant_fichier} target="_blank" rel="noreferrer">
                  <img
                    src={fiche.carte_etudiant_fichier}
                    alt="Carte étudiante du candidat"
                    style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', display: 'block' }}
                  />
                </a>
              ) : (
                <div style={{ padding: 24, borderRadius: 12, background: 'var(--surface-2)', color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>
                  Aucune pièce jointe : la carte doit être re-déposée par le candidat.
                </div>
              )}
              <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
                Cliquez sur l'image pour l'ouvrir en pleine taille.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
              <MiniStat label="Matricule" value={fiche.matricule_etudiant || 'Non renseigné'} tone="navy" />
              <MiniStat label="Téléphone" value={fiche.contact || '—'} />
              <MiniStat label="Email" value={fiche.email || '—'} />
              <MiniStat label="Compte créé le" value={dateFr(fiche.compte_cree_le)} />
              <MiniStat label="Ancienneté" value={`${fiche.anciennete_jours ?? 0} jour(s)`} />
              <MiniStat label="Dossiers déposés" value={`${fiche.nb_demandes ?? 0}`} />
              <MiniStat label="Baux actifs" value={`${fiche.nb_contrats_actifs ?? 0}`} tone={fiche.nb_contrats_actifs ? 'green' : 'slate'} />
              <MiniStat label="Score de fidélité" value={`${Math.round(fiche.score_fidelite ?? 0)}`} tone="gold" />
              <MiniStat
                label="Statut actuel"
                value={(fiche.statut_verification_etudiant || '').replace(/_/g, ' ')}
                tone={TONE_STATUT[fiche.statut_verification_etudiant] || 'slate'}
              />

              {fiche.statut_verification_etudiant === 'EN_ATTENTE' ? (
                <>
                  <Field
                    label="Motif (obligatoire en cas de rejet)"
                    hint="Ex. carte illisible, carte expirée, matricule non concordant."
                  >
                    <Textarea rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif du rejet…" />
                  </Field>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <Button variant="danger" disabled={submitting} onClick={() => decider(fiche, 'REJETE')}>Rejeter</Button>
                    <Button variant="navy" disabled={submitting} onClick={() => decider(fiche, 'VALIDE')}>Valider la carte</Button>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Décision rendue le {dateHeureFr(fiche.carte_etudiant_date_validation)}
                  {fiche.valide_par_nom ? ` par ${fiche.valide_par_nom}` : ''}.
                  {fiche.motif_rejet_carte ? ` Motif : ${fiche.motif_rejet_carte}` : ''}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
