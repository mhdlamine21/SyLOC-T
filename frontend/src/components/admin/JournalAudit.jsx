import { useCallback, useEffect, useState } from 'react';
import { PageWrapper, SectionHeader, Card, Table, EmptyState, Button, Field, Input } from '../common/ui';
import { getJournalAudit } from '../../api/audit';
import { messageErreur } from '../../api/utils';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const ACTION_STYLES = {
  CONNEXION:            { label: '🔑 Connexion',              bg: 'bg-info-soft text-info' },
  CHANGEMENT_ROLE:      { label: '🔄 Changement de rôle',     bg: 'bg-amber-pale text-amber-deep' },
  DECISION_ATTRIBUTION: { label: '✅ Décision attribution',   bg: 'bg-ok-soft text-ok' },
  SANCTION_PRONONCEE:   { label: '⚖ Sanction prononcée',      bg: 'bg-stamp-pale text-stamp' },
  COMPTE_DESACTIVE:     { label: '🔒 Compte désactivé',        bg: 'bg-danger-soft text-danger' },
  ARCHIVAGE:            { label: '📦 Archivage',              bg: 'bg-soft text-muted' },
};

export default function JournalAudit() {
  const [entrees, setEntrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtres, setFiltres] = useState({ action: '', utilisateur: '', date_debut: '', date_fin: '' });

  const charger = useCallback(async (params) => {
    setChargement(true);
    try {
      const nettoyes = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
      );
      const data = await getJournalAudit(nettoyes);
      // Aplatit la réponse pour l'affichage et l'export.
      setEntrees(
        data.map((e) => ({
          id: e.id,
          horodatage: e.date_creation,
          action: e.action,
          cible: e.cible,
          auteur: e.utilisateur_nom || '—',
          role: e.utilisateur_role || '',
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
  }, []);

  useEffect(() => {
    charger(filtres);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charger]);

  const columnsExport = [
    { key: 'horodatage', label: 'Horodatage' },
    { key: 'action', label: "Type d'Action" },
    { key: 'cible', label: 'Cible / Élément' },
    { key: 'auteur', label: 'Auteur' },
    { key: 'details', label: "Détails de l'opération" },
  ];

  const handleExportCSV = () => exportToCSV(entrees, 'Journal_Audit_SyLOC_T', columnsExport);

  const handleExportPDF = () =>
    exportToPDF(
      "Journal d'Audit & Traçabilité Système",
      'Historique des accès et décisions sensibles',
      entrees,
      columnsExport,
    );

  const columns = [
    {
      key: 'horodatage',
      label: 'Date / Heure',
      render: (v) => {
        const d = new Date(v);
        return (
          <span className="font-mono text-xs text-muted whitespace-nowrap">
            {Number.isNaN(d.getTime())
              ? '—'
              : `${d.toLocaleDateString('fr-SN')} ${d.toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        );
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: (v) => {
        const style = ACTION_STYLES[v] ?? { label: v, bg: 'bg-soft text-muted' };
        return (
          <span className={`text-xs font-semibold px-2.5 py-1 font-mono ${style.bg}`} style={{ borderRadius: '20px' }}>
            {style.label}
          </span>
        );
      },
    },
    { key: 'cible', label: 'Cible', render: (v) => <span className="font-mono text-xs">{v}</span> },
    {
      key: 'auteur',
      label: 'Auteur',
      render: (v, row) => (
        <span className="text-sm">
          {v}
          {row.role ? <span className="block text-[10px] font-mono text-muted">{row.role}</span> : null}
        </span>
      ),
    },
    {
      key: 'details',
      label: 'Détails',
      render: (v) => <span className="text-xs text-muted max-w-xs truncate block">{v}</span>,
    },
  ];

  return (
    <PageWrapper>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <SectionHeader
          eyebrow="Administration SI"
          title="Journal d'audit & Traçabilité"
          subtitle="Traçabilité infalsifiable des connexions, modifications de rôles, décisions et sanctions."
        />
        <div className="flex gap-2">
          <Button variant="amber" size="sm" onClick={handleExportCSV} disabled={!entrees.length}>
            📊 Exporter en Excel (.CSV)
          </Button>
          <Button variant="stamp" size="sm" onClick={handleExportPDF} disabled={!entrees.length}>
            📄 Exporter en PDF
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <form
          className="grid gap-3 md:grid-cols-5 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            charger(filtres);
          }}
        >
          <Field label="Action">
            <Input
              value={filtres.action}
              onChange={(e) => setFiltres((f) => ({ ...f, action: e.target.value }))}
              placeholder="Ex. CONNEXION"
            />
          </Field>
          <Field label="Auteur">
            <Input
              value={filtres.utilisateur}
              onChange={(e) => setFiltres((f) => ({ ...f, utilisateur: e.target.value }))}
              placeholder="Nom ou identifiant"
            />
          </Field>
          <Field label="Du">
            <Input
              type="date"
              value={filtres.date_debut}
              onChange={(e) => setFiltres((f) => ({ ...f, date_debut: e.target.value }))}
            />
          </Field>
          <Field label="Au">
            <Input
              type="date"
              value={filtres.date_fin}
              onChange={(e) => setFiltres((f) => ({ ...f, date_fin: e.target.value }))}
            />
          </Field>
          <Button type="submit" size="sm" disabled={chargement}>
            {chargement ? 'Chargement…' : 'Filtrer'}
          </Button>
        </form>
      </Card>

      <div className="mb-4 p-3 bg-paper2 border border-ink/10 text-sm text-muted flex items-center gap-2"
        style={{ borderRadius: 'var(--radius)' }}>
        <span>🔒</span>
        <span>Ce journal d'audit est certifié infalsifiable en lecture seule pour la gouvernance SI.</span>
      </div>

      {erreur && (
        <div className="mb-4 p-3 bg-danger-soft text-danger text-sm" style={{ borderRadius: 'var(--radius)' }}>
          {erreur}
        </div>
      )}

      <Card>
        <Table
          columns={columns}
          data={entrees}
          emptyState={
            <EmptyState
              icon="📋"
              title={chargement ? 'Chargement…' : 'Journal vide'}
              description={
                chargement
                  ? "Récupération des entrées d'audit."
                  : 'Aucune action enregistrée pour ces critères.'
              }
            />
          }
        />
      </Card>
    </PageWrapper>
  );
}
