import { useState, useEffect } from 'react';
import { Card, SectionHeader, StatusBadge, Button, Modal, Field, Textarea, PageWrapper } from '../common/ui';
import { getDemandes, getLots, createVoteCommission, getSyntheseVotes, getDelegationCommission, cloturerLocalDemande } from '../../api/demandes';
import { useConfirm } from '../ui';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import StarRateRoundedIcon from '@mui/icons-material/StarRateRounded';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import BalanceIcon from '@mui/icons-material/Balance';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';

export default function CommissionVote() {
  const [demandes, setDemandes] = useState([]);
  const [lots, setLots] = useState([]);
  const [vueActive, setVueActive] = useState('lots');
  const [loadingData, setLoadingData] = useState(true);
  const [activeDemande, setActiveDemande] = useState(null);
  const [vote, setVote] = useState('FAVORABLE');
  const [noteFormelle, setNoteFormelle] = useState(4.5);
  const [noteTechnique, setNoteTechnique] = useState(4.0);
  const [remarque, setRemarque] = useState('');
  const [synthese, setSynthese] = useState(null);
  const [delegationActive, setDelegationActive] = useState(false);
  const confirm = useConfirm();

  const ouvrirDeliberation = async (d) => {
    setActiveDemande(d);
    setVote('FAVORABLE');
    setNoteFormelle(4.5);
    setNoteTechnique(4.0);
    setRemarque('');
    setSynthese(null);
    try {
      const donnees = await getSyntheseVotes(d.id);
      setSynthese(donnees);
      const mien = (donnees.votes || []).find((v) => v.est_mon_vote);
      if (mien) {
        setVote(mien.avis);
        setNoteFormelle(mien.note_formelle ?? 4.5);
        setNoteTechnique(mien.note_technique ?? 4.0);
        setRemarque(mien.commentaire || '');
      }
    } catch {
      setSynthese(null);
    }
  };

  const fetchData = async () => {
    try {
      const [dataDemandes, dataLots, delegData] = await Promise.all([
        getDemandes(),
        getLots().catch(() => []),
        getDelegationCommission().catch(() => ({ active: false })),
      ]);

      const filteredDemandes = (dataDemandes || []).filter((d) =>
        ['EN_ATTENTE_DECISION', 'EN_COMMISSION', 'FAVORABLE', 'DEFAVORABLE'].includes(d.statut)
      );

      setDemandes(filteredDemandes);
      setLots(Array.isArray(dataLots) ? dataLots : []);
      setDelegationActive(!!delegData?.active);
      
      // Si aucun lot actif, basculer par défaut sur la vue tous les dossiers
      if ((!dataLots || dataLots.length === 0) && filteredDemandes.length > 0) {
        setVueActive('tous');
      }
    } catch {
      toast.error('Erreur lors du chargement de la séance de commission.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    try {
      await createVoteCommission({
        demande: activeDemande.id,
        avis: vote,
        note_formelle: vote === 'ABSTENTION' ? null : parseFloat(noteFormelle),
        note_technique: vote === 'ABSTENTION' ? null : parseFloat(noteTechnique),
        commentaire: remarque,
      });

      const noteCalculee =
        vote === 'ABSTENTION'
          ? 'sans note'
          : `${((Number(noteFormelle) + Number(noteTechnique)) / 2).toFixed(1)}/5`;

      toast.success(
        `Vote enregistré (${vote} - ${noteCalculee}) pour le dossier ${
          activeDemande.reference_anonyme || `DEM-${String(activeDemande.id).slice(0, 8)}`
        }.`
      );
      setActiveDemande(null);
      fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.detail || "Erreur lors de l'enregistrement du vote. Êtes-vous bien membre actif ?"
      );
    }
  };

  const noteMoyenneMembre =
    vote === 'ABSTENTION'
      ? null
      : ((Number(noteFormelle || 0) + Number(noteTechnique || 0)) / 2).toFixed(1);

  const nbDossiersEnLot = lots.reduce((acc, l) => acc + (l.nb_demandes || (l.demandes ? l.demandes.length : 0)), 0);

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Commission Consultative d'Évaluation"
        title="Séance Plénière & Arbitrage des Lots (LR-10)"
        subtitle="Examen collégial des candidatures concurrentes par local, délibération sur les critères formels/techniques et émission de l'avis de commission."
        action={
          <Link to="/commission/mes-taches" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm" style={{ gap: 6, fontWeight: 700 }}>
              <GroupsOutlinedIcon style={{ fontSize: 16 }} />
              Mes tâches & votes individuels
            </Button>
          </Link>
        }
      />

      {/* ── BANDEAU DE NAVIGATION PAR MODE DE SÉANCE ──────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant={vueActive === 'lots' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setVueActive('lots')}
            style={{ gap: 6, fontWeight: 700 }}
          >
            <BalanceIcon style={{ fontSize: 16 }} />
            Lots & Concurrence ({lots.length} lot{lots.length > 1 ? 's' : ''})
          </Button>

          <Button
            variant={vueActive === 'tous' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setVueActive('tous')}
            style={{ gap: 6, fontWeight: 700 }}
          >
            <ViewListOutlinedIcon style={{ fontSize: 16 }} />
            Tous les dossiers ({demandes.length})
          </Button>
        </div>

        {delegationActive && (
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 700,
              background: 'var(--gold-tint)',
              color: 'var(--gold-deep)',
              border: '1px solid var(--gold-tint-2)',
            }}
          >
            ⚖ Délégation Directeur Active : La commission statue à la majorité
          </div>
        )}
      </div>

      {/* ── VUE 1 : ARBITRAGE DES LOTS DE CONCURRENCE ─────────────────────── */}
      {vueActive === 'lots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {loadingData ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Chargement des lots d'arbitrage...</p>
          ) : lots.length === 0 ? (
            <div style={{ background: 'var(--surface-2)', padding: 32, borderRadius: 14, textAlign: 'center', border: '1px solid var(--border)' }}>
              <BalanceIcon style={{ fontSize: 36, color: 'var(--gold-deep)', marginBottom: 8 }} />
              <h3 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-navy)', fontWeight: 800 }}>Aucun lot de candidatures concurrentes actif</h3>
              <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 16px' }}>
                Les dossiers uniques peuvent être examinés directement dans l'onglet « Tous les dossiers ».
              </p>
              <Button variant="secondary" size="sm" onClick={() => setVueActive('tous')}>
                Voir la liste complète des dossiers ({demandes.length})
              </Button>
            </div>
          ) : (
            lots.map((lot) => (
              <div
                key={lot.id}
                style={{
                  background: 'var(--surface-card, var(--surface))',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 20,
                  boxShadow: '0 4px 16px rgba(15, 27, 61, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gold-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <StorefrontOutlinedIcon style={{ fontSize: 20, color: 'var(--gold-deep)' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-navy)' }}>
                        Lot d'arbitrage : {lot.local_reference || `Local #${lot.local_id || lot.local}`}
                      </h3>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {lot.demandes?.length || lot.nb_demandes || 0} candidatures concurrentes pour cet emplacement
                        {lot.commentaire ? ` • Note DCUVE : ${lot.commentaire}` : ''}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 12, background: 'var(--gold-tint)', color: 'var(--gold-deep)', border: '1px solid var(--gold-tint-2)' }}>
                    ⚖ Arbitrage Collégial
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  {(lot.demandes || []).map((d) => (
                    <div
                      key={d.id}
                      style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--navy)' }}>
                            {d.reference_anonyme || `DEM-${String(d.id).slice(0, 8).toUpperCase()}`}
                          </span>
                          <StatusBadge statut={d.statut} />
                        </div>

                        <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: 'var(--text-navy)' }}>
                          {(d.type_demande || '').replace(/_/g, ' ')}
                        </h4>
                        <p style={{ margin: '0 0 10px', fontSize: 11.5, color: 'var(--muted)' }}>
                          Déposé le {d.date_depot ? new Date(d.date_depot).toLocaleDateString('fr-FR') : '-'}
                        </p>
                      </div>

                      <Button
                        variant={d.statut === 'FAVORABLE' || d.statut === 'DEFAVORABLE' ? 'secondary' : 'amber'}
                        size="sm"
                        onClick={() => ouvrirDeliberation(d)}
                        style={{ justifyContent: 'center', fontWeight: 800, gap: 6, width: '100%', marginTop: 8 }}
                      >
                        <HowToVoteOutlinedIcon style={{ fontSize: 15 }} />
                        {d.statut === 'FAVORABLE' || d.statut === 'DEFAVORABLE' ? 'Réviser mon vote' : 'Voter sur ce candidat'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── VUE 2 : TOUS LES DOSSIERS SOUMIS ──────────────────────────────── */}
      {vueActive === 'tous' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {loadingData ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>
              Chargement des dossiers soumis à la commission...
            </p>
          ) : demandes.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>
              Aucun dossier en cours d'évaluation par la commission.
            </p>
          ) : (
            demandes.map((d) => (
              <Card key={d.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 800, color: 'var(--navy)' }}>
                      {d.reference_anonyme || `DEM-${String(d.id).slice(0, 8).toUpperCase()}`}
                    </span>
                    {d.statut === 'FAVORABLE' || d.statut === 'DEFAVORABLE' ? (
                      <span
                        style={{
                          background: d.statut === 'FAVORABLE' ? 'rgba(22,163,74,0.14)' : 'rgba(220,38,38,0.14)',
                          color: d.statut === 'FAVORABLE' ? 'var(--green)' : 'var(--red)',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        ✓ Délibéré ({d.statut})
                      </span>
                    ) : (
                      <StatusBadge statut={d.statut} />
                    )}
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16.5, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-navy)' }}>
                    {(d.type_demande || '').replace(/_/g, ' ')}
                  </h3>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 10px' }}>
                    Déposé le : <strong>{d.date_depot ? new Date(d.date_depot).toLocaleDateString('fr-FR') : '-'}</strong>
                  </p>

                  {d.statut === 'EN_COMMISSION' && (
                    <div
                      style={{
                        marginBottom: 10,
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        background: 'var(--gold-tint)',
                        color: 'var(--gold-deep)',
                        border: '1px solid var(--gold-tint-2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      ⚖ En Lot — Candidatures concurrentes sur ce local
                    </div>
                  )}

                  <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 10, fontSize: 12.5, marginBottom: 14, border: '1px solid var(--border)' }}>
                    <div style={{ marginBottom: 4 }}>
                      Emplacement ciblé : <strong>{d.local_reference || d.local || 'Non spécifié'}</strong>
                    </div>
                    <div>
                      Notes d'instruction DCUVE :{' '}
                      <span style={{ color: 'var(--text-navy)', fontWeight: 600 }}>
                        {d.notes_admin || 'Dossier jugé recevable'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant={d.statut === 'FAVORABLE' || d.statut === 'DEFAVORABLE' ? 'secondary' : 'amber'}
                  size="sm"
                  onClick={() => ouvrirDeliberation(d)}
                  style={{ justifyContent: 'center', fontWeight: 800, gap: 6 }}
                >
                  <HowToVoteOutlinedIcon style={{ fontSize: 16 }} />
                  {d.statut === 'FAVORABLE' || d.statut === 'DEFAVORABLE' ? '✏️ Réviser mon vote' : '⚖ Voter en commission'}
                </Button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── MODALE DE DÉLIBÉRATION ET DE VOTE CLAIRE & STRUCTURÉE ─────────── */}
      {activeDemande && (
        <Modal
          open={!!activeDemande}
          onClose={() => setActiveDemande(null)}
          title={`Délibération Commission — ${activeDemande.reference_anonyme || `DEM-${String(activeDemande.id).slice(0, 8).toUpperCase()}`}`}
          size="lg"
        >
          <form onSubmit={handleVoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* 1. Fiche Récapitulative du Projet Candidat */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <InfoOutlinedIcon style={{ fontSize: 18, color: 'var(--gold-deep)' }} />
                <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: 'var(--text-navy)' }}>
                  Fiche du projet candidat
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 12.5 }}>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block', fontSize: 11, fontWeight: 700 }}>TYPE D'ACTIVITÉ</span>
                  <strong style={{ color: 'var(--text-navy)' }}>{(activeDemande.type_demande || '').replace(/_/g, ' ')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block', fontSize: 11, fontWeight: 700 }}>LOCAL CIBLÉ</span>
                  <strong style={{ color: 'var(--text-navy)' }}>{activeDemande.local_reference || activeDemande.local || 'Non spécifié'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block', fontSize: 11, fontWeight: 700 }}>DATE DE DÉPÔT</span>
                  <strong>{activeDemande.date_depot ? new Date(activeDemande.date_depot).toLocaleDateString('fr-FR') : '-'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block', fontSize: 11, fontWeight: 700 }}>INSTRUCTION DCUVE</span>
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>{activeDemande.notes_admin || 'Dossier complet et conforme'}</span>
                </div>
              </div>
            </div>

            {/* 2. Synthèse Collégiale en Temps Réel */}
            {synthese && (
              <div style={{ background: 'var(--surface-card, var(--surface))', border: '1px solid var(--border)', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(15, 27, 61, 0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: 'var(--text-navy)' }}>
                    État collégial de la délibération
                  </p>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 9px',
                      borderRadius: 14,
                      background: synthese.quorum_atteint ? 'rgba(22,163,74,0.14)' : 'rgba(220,38,38,0.12)',
                      color: synthese.quorum_atteint ? 'var(--green)' : 'var(--red)',
                    }}
                  >
                    Quorum : {synthese.quorum_atteint ? 'Atteint ✓' : `${synthese.total_votes || 0}/${synthese.quorum_requis || 1} requis`}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
                  <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase' }}>Favorables</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>{synthese.favorables ?? 0}</div>
                  </div>

                  <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase' }}>Défavorables</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red)' }}>{synthese.defavorables ?? 0}</div>
                  </div>

                  <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.2)' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase' }}>Abstentions</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--slate)' }}>{synthese.abstentions ?? 0}</div>
                  </div>

                  <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Note Moyenne</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold-deep)' }}>
                      {synthese.note_moyenne ? `${synthese.note_moyenne}/5` : '-'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Sens majoritaire actuel :</span>
                  <strong style={{ color: 'var(--text-navy)', textTransform: 'uppercase' }}>
                    {synthese.sens_majoritaire === 'FAVORABLE' ? '🟢 Attribution recommandée' : synthese.sens_majoritaire === 'DEFAVORABLE' ? '🔴 Rejet recommandé' : '🟡 Avis partagé (Mitigé)'}
                  </strong>
                </div>
              </div>
            )}

            {/* 3. Choix du Vote (Cartes Interactives) */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: 'var(--text-navy)', marginBottom: 8 }}>
                Votre Avis & Délibération Individuelle :
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                <div
                  onClick={() => setVote('FAVORABLE')}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: vote === 'FAVORABLE' ? '2px solid var(--green)' : '1px solid var(--border)',
                    background: vote === 'FAVORABLE' ? 'rgba(22,163,74,0.1)' : 'var(--surface)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <CheckCircleOutlineOutlinedIcon style={{ fontSize: 18, color: 'var(--green)' }} />
                    <strong style={{ fontSize: 13, color: 'var(--green)' }}>Vote Favorable</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                    Attribution recommandée au candidat.
                  </p>
                </div>

                <div
                  onClick={() => setVote('DEFAVORABLE')}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: vote === 'DEFAVORABLE' ? '2px solid var(--red)' : '1px solid var(--border)',
                    background: vote === 'DEFAVORABLE' ? 'rgba(220,38,38,0.1)' : 'var(--surface)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <HighlightOffOutlinedIcon style={{ fontSize: 18, color: 'var(--red)' }} />
                    <strong style={{ fontSize: 13, color: 'var(--red)' }}>Vote Défavorable</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                    Rejet du dossier pour ce local.
                  </p>
                </div>

                <div
                  onClick={() => setVote('ABSTENTION')}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: vote === 'ABSTENTION' ? '2px solid var(--slate)' : '1px solid var(--border)',
                    background: vote === 'ABSTENTION' ? 'rgba(100,116,139,0.1)' : 'var(--surface)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <RemoveCircleOutlineOutlinedIcon style={{ fontSize: 18, color: 'var(--slate)' }} />
                    <strong style={{ fontSize: 13, color: 'var(--slate)' }}>Abstention</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                    Comptabilisé pour le quorum sans note.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Notation par critères si vote Favorable ou Défavorable */}
            {vote !== 'ABSTENTION' && (
              <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StarRateRoundedIcon style={{ fontSize: 20, color: 'var(--gold)' }} />
                    <strong style={{ fontSize: 13, color: 'var(--text-navy)' }}>Évaluation par critères (sur 5)</strong>
                  </div>
                  {noteMoyenneMembre && (
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold-deep)' }}>
                      Votre moyenne : {noteMoyenneMembre} / 5
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="1. Solidité du Dossier Formel (sur 5) :">
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.5"
                      value={noteFormelle}
                      onChange={(e) => setNoteFormelle(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13 }}
                      required
                    />
                  </Field>

                  <Field label="2. Faisabilité & Cohérence d'Activité (sur 5) :">
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.5"
                      value={noteTechnique}
                      onChange={(e) => setNoteTechnique(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13 }}
                      required
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* 5. Remarques & Justifications */}
            <Field label="Motivations & Justifications de votre vote :">
              <Textarea
                value={remarque}
                onChange={(e) => setRemarque(e.target.value)}
                rows={3}
                placeholder="Précisez les points forts, réserves ou motivations de votre délibération..."
              />
            </Field>

            {/* Boutons d'Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              {delegationActive && synthese?.quorum_atteint && synthese?.sens_majoritaire !== 'EGALITE' && synthese?.sens_majoritaire !== 'ABSTENTION_MAJORITAIRE' ? (
                <Button
                  variant="primary"
                  type="button"
                  onClick={async () => {
                    if (
                      await confirm({
                        title: 'Décision Définitive (Délégation)',
                        content: `En l'absence du Directeur, la Commission cloturera ce dossier par un verdict ${synthese.sens_majoritaire}. Confirmer ?`,
                        confirmLabel: 'Clôturer Définitivement',
                        intent: 'primary',
                      })
                    ) {
                      try {
                        if (synthese.sens_majoritaire === 'FAVORABLE') {
                          await cloturerLocalDemande(activeDemande.local_id, activeDemande.id);
                          toast.success(`Dossier clôturé avec succès.`);
                          setActiveDemande(null);
                          fetchData();
                        } else {
                          toast.error("Le rejet automatique requiert l'arbitrage du Directeur.");
                        }
                      } catch {
                        toast.error('Erreur lors de la clôture définitive.');
                      }
                    }
                  }}
                >
                  Clôturer (Délégation de Pouvoir)
                </Button>
              ) : (
                <div />
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="ghost" type="button" onClick={() => setActiveDemande(null)}>
                  Annuler
                </Button>
                <Button variant="amber" type="submit" style={{ fontWeight: 800 }}>
                  ✓ Confirmer & Enregistrer mon Vote
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
