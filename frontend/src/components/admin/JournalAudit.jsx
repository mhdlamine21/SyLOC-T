import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import LayersIcon from '@mui/icons-material/Layers';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { PageWrapper, SectionHeader, Card, Button, Modal, Field, Input, Select } from '../common/ui';
import { getJournalAudit } from '../../api/audit';
import { messageErreur } from '../../api/utils';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const ACTION_CONFIG = {
  CONNEXION: { label: 'Connexion', color: '#0284c7', bg: '#e0f2fe' },
  CHANGEMENT_ROLE: { label: 'Changement de rôle', color: '#d97706', bg: '#fef3c7' },
  DECISION_ATTRIBUTION: { label: 'Attribution de lot', color: '#16a34a', bg: '#dcfce7' },
  SANCTION_PRONONCEE: { label: 'Sanction prononcée', color: '#dc2626', bg: '#fee2e2' },
  COMPTE_DESACTIVE: { label: 'Compte désactivé', color: '#991b1b', bg: '#fef2f2' },
  ARCHIVAGE: { label: 'Archivage dossier', color: '#64748b', bg: '#f1f5f9' },
  INITIALISATION_BASE_GODMODE: { label: 'Initialisation Système', color: '#7c3aed', bg: '#ede9fe' },
  CREATION_CONTRAT: { label: 'Création de contrat', color: '#059669', bg: '#d1fae5' },
  MODIFICATION_PARAMETRE: { label: 'Paramètre modifié', color: '#475569', bg: '#f8fafc' },
  PAIEMENT_ENCAISSE: { label: 'Encaissement', color: '#15803d', bg: '#f0fdf4' },
};

const ACTION_OPTIONS = [
  { value: '', label: 'Toutes les actions' },
  { value: 'CONNEXION', label: 'Connexions & Authentification' },
  { value: 'CHANGEMENT_ROLE', label: 'Changements de rôle & Habilitations' },
  { value: 'DECISION_ATTRIBUTION', label: 'Attributions & Décisions' },
  { value: 'SANCTION_PRONONCEE', label: 'Sanctions & Discipline' },
  { value: 'INITIALISATION_BASE_GODMODE', label: 'Initialisation & Système' },
  { value: 'CREATION_CONTRAT', label: 'Contrats & Baux' },
  { value: 'MODIFICATION_PARAMETRE', label: 'Paramètres système' },
];

export default function JournalAudit() {
  const [entrees, setEntrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  const [filtres, setFiltres] = useState({
    action: '',
    recherche: '',
    date_debut: '',
    date_fin: '',
  });

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const params = {};
      if (filtres.action) params.action = filtres.action;
      if (filtres.date_debut) params.date_debut = filtres.date_debut;
      if (filtres.date_fin) params.date_fin = filtres.date_fin;

      const data = await getJournalAudit(params);
      setEntrees(
        data.map((e) => ({
          id: e.id,
          horodatage: e.date_creation,
          action: e.action,
          cible: e.cible,
          auteur: e.utilisateur_nom || 'Système Central',
          role: e.utilisateur_role || 'SYSTÈME',
          details: e.details || '',
        })),
      );
      setErreur(null);
    } catch (err) {
      setErreur(messageErreur(err, "Impossible de charger le journal d'audit."));
      setEntrees([]);
    } finally {
      setChargement(false);
    }
  }, [filtres.action, filtres.date_debut, filtres.date_fin]);

  useEffect(() => {
    charger();
  }, [charger]);

  const entreesFiltrees = useMemo(() => {
    const q = filtres.recherche.trim().toLowerCase();
    if (!q) return entrees;
    return entrees.filter((e) =>
      `${e.action} ${e.cible} ${e.auteur} ${e.role} ${e.details}`.toLowerCase().includes(q),
    );
  }, [entrees, filtres.recherche]);

  const stats = useMemo(() => {
    const total = entrees.length;
    const hier = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recents = entrees.filter((e) => new Date(e.horodatage) >= hier).length;
    const auteursUniques = new Set(entrees.map((e) => e.auteur)).size;
    const actionsSensibles = entrees.filter((e) =>
      ['CHANGEMENT_ROLE', 'SANCTION_PRONONCEE', 'COMPTE_DESACTIVE', 'INITIALISATION_BASE_GODMODE'].includes(e.action),
    ).length;

    return { total, recents, auteursUniques, actionsSensibles };
  }, [entrees]);

  const reinitialiserFiltres = () => {
    setFiltres({ action: '', recherche: '', date_debut: '', date_fin: '' });
  };

  const columnsExport = [
    { key: 'horodatage', label: 'Horodatage' },
    { key: 'action', label: "Type d'Action" },
    { key: 'cible', label: 'Cible / Élément' },
    { key: 'auteur', label: 'Auteur' },
    { key: 'role', label: 'Rôle' },
    { key: 'details', label: "Détails de l'opération" },
  ];

  const handleExportCSV = () => exportToCSV(entreesFiltrees, `Journal_Audit_${new Date().toISOString().slice(0, 10)}`, columnsExport);

  const handleExportPDF = () =>
    exportToPDF(
      "Journal d'Audit & Traçabilité Système",
      'Rapport officiel des événements de gouvernance et sécurité',
      entreesFiltrees,
      columnsExport,
    );

  const getActionBadge = (actionKey) => {
    const cfg = ACTION_CONFIG[actionKey] || {
      label: actionKey.replace(/_/g, ' '),
      color: 'var(--text-navy)',
      bg: 'var(--surface-sunken)',
    };
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 9px',
          borderRadius: 14,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: cfg.color,
          backgroundColor: cfg.bg,
          border: `1px solid ${cfg.color}22`,
          whiteSpace: 'nowrap',
        }}
      >
        {cfg.label}
      </span>
    );
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="GOUVERNANCE & SÉCURITÉ SI"
        title="Journal d'Audit & Traçabilité"
        subtitle="Registre immuable et horodaté retraçant l'ensemble des accès, mutations de données et actes administratifs."
        actions={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={handleExportCSV} disabled={!entreesFiltrees.length}>
              <DownloadIcon fontSize="small" /> Exporter CSV
            </Button>
            <Button variant="amber" size="sm" onClick={handleExportPDF} disabled={!entreesFiltrees.length}>
              <DownloadIcon fontSize="small" /> Exporter PDF
            </Button>
            <Button variant="primary" size="sm" onClick={charger} disabled={chargement}>
              <RefreshIcon fontSize="small" /> Actualiser
            </Button>
          </div>
        }
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(23, 37, 84, 0.08)',
            color: 'var(--navy)',
            display: 'grid',
            placeItems: 'center',
          }}>
            <HistoryIcon fontSize="medium" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Total des événements
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-navy)' }}>
              {stats.total}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            color: '#16a34a',
            display: 'grid',
            placeItems: 'center',
          }}>
            <CheckCircleOutlinedIcon fontSize="medium" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Dernières 24 heures
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>
              {stats.recents}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            color: '#dc2626',
            display: 'grid',
            placeItems: 'center',
          }}>
            <SecurityIcon fontSize="medium" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Actions sensibles
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>
              {stats.actionsSensibles}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(201, 161, 92, 0.15)',
            color: 'var(--gold-deep, #b45309)',
            display: 'grid',
            placeItems: 'center',
          }}>
            <PersonOutlinedIcon fontSize="medium" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Auteurs distincts
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold-deep, #b45309)' }}>
              {stats.auteursUniques}
            </div>
          </div>
        </Card>
      </div>

      <div style={{
        padding: '12px 18px',
        backgroundColor: 'var(--surface-sunken)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        fontSize: 13,
        color: 'var(--text-secondary)',
      }}>
        <LockOutlinedIcon style={{ fontSize: 18, color: 'var(--gold-deep)' }} />
        <span>
          <strong>Registre Immuable :</strong> Ce journal d'audit est certifié infalsifiable en lecture seule pour la conformité et la gouvernance du CROUS-T.
        </span>
      </div>

      <Card style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-navy)' }}>
            <FilterAltIcon fontSize="small" style={{ color: 'var(--gold-deep)' }} />
            Filtres & Recherche Avancée
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
            alignItems: 'end',
          }}>
            <Field label="Recherche libre" className="mb-0">
              <div style={{ position: 'relative' }}>
                <Input
                  value={filtres.recherche}
                  onChange={(e) => setFiltres((f) => ({ ...f, recherche: e.target.value }))}
                  placeholder="Auteur, cible, action, mot-clé..."
                  style={{ paddingLeft: 34 }}
                />
                <SearchIcon style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18,
                  color: 'var(--text-muted)',
                }} />
              </div>
            </Field>

            <Field label="Type d'action" className="mb-0">
              <Select
                value={filtres.action}
                onChange={(e) => setFiltres((f) => ({ ...f, action: e.target.value }))}
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </Field>

            <Field label="Date début" className="mb-0">
              <Input
                type="date"
                value={filtres.date_debut}
                onChange={(e) => setFiltres((f) => ({ ...f, date_debut: e.target.value }))}
              />
            </Field>

            <Field label="Date fin" className="mb-0">
              <Input
                type="date"
                value={filtres.date_fin}
                onChange={(e) => setFiltres((f) => ({ ...f, date_fin: e.target.value }))}
              />
            </Field>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="md" onClick={reinitialiserFiltres} style={{ width: '100%' }}>
                <ClearIcon fontSize="small" /> Réinitialiser
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {erreur && (
        <div style={{
          padding: 14,
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: 12,
          marginBottom: 20,
          fontSize: 13,
        }}>
          {erreur}
        </div>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--surface-sunken)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-navy)' }}>
            Événements d'audit ({entreesFiltrees.length})
          </div>
          {chargement && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chargement des données…</span>}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{
                backgroundColor: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                textAlign: 'left',
              }}>
                <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Horodatage
                </th>
                <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Action
                </th>
                <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cible
                </th>
                <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Auteur & Rôle
                </th>
                <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Détails
                </th>
                <th style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {entreesFiltrees.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <AssignmentOutlinedIcon style={{ fontSize: 36, color: 'var(--text-muted)', marginBottom: 8 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-navy)' }}>
                      {chargement ? 'Chargement du journal…' : 'Aucun événement trouvé'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      {chargement ? 'Veuillez patienter.' : 'Modifiez vos critères de recherche pour afficher des résultats.'}
                    </div>
                  </td>
                </tr>
              ) : (
                entreesFiltrees.map((row) => {
                  const d = new Date(row.horodatage);
                  const dateStr = Number.isNaN(d.getTime())
                    ? '-'
                    : d.toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' });
                  const heureStr = Number.isNaN(d.getTime())
                    ? ''
                    : d.toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedLog(row)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-sunken)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-navy)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {dateStr}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {heureStr}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {getActionBadge(row.action)}
                      </td>

                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          borderRadius: 8,
                          backgroundColor: 'var(--surface-sunken)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          <LayersIcon style={{ fontSize: 13, color: 'var(--text-muted)' }} />
                          {row.cible || '-'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            backgroundColor: 'var(--gold-tint)',
                            color: 'var(--gold-deep)',
                            fontWeight: 800,
                            fontSize: 12,
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                          }}>
                            {row.auteur.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-navy)', fontSize: 13 }}>
                              {row.auteur}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {row.role}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px', maxWidth: 280 }}>
                        <div style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {row.details || '-'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(row);
                          }}
                        >
                          <VisibilityIcon fontSize="small" /> Détails
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedLog && (
        <Modal
          open={Boolean(selectedLog)}
          title="Détail de l'événement d'audit"
          onClose={() => setSelectedLog(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              backgroundColor: 'var(--surface-sunken)',
              borderRadius: 12,
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Identifiant événement
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--text-navy)' }}>
                  #AUDIT-{selectedLog.id}
                </div>
              </div>
              <div>
                {getActionBadge(selectedLog.action)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>
                  Date & Heure
                </span>
                <strong>{new Date(selectedLog.horodatage).toLocaleString('fr-SN')}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>
                  Cible
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{selectedLog.cible}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>
                  Auteur de l'action
                </span>
                <strong>{selectedLog.auteur}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>
                  Rôle Auteur
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{selectedLog.role}</span>
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
                Détails & Payload de l'opération
              </div>
              <div style={{
                padding: 14,
                backgroundColor: 'var(--surface-sunken)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                fontSize: 12.5,
                lineHeight: 1.6,
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 200,
                overflowY: 'auto',
              }}>
                {selectedLog.details || 'Aucun détail complémentaire fourni.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Button variant="primary" size="sm" onClick={() => setSelectedLog(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}
