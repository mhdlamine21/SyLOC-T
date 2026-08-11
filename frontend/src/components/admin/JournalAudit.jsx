import { PageWrapper, SectionHeader, Card, Table, EmptyState, Button } from '../common/ui';
import { journalMock } from '../../mocks/data';
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
  const columnsExport = [
    { key: 'horodatage', label: 'Horodatage' },
    { key: 'action', label: 'Type d\'Action' },
    { key: 'cible', label: 'Cible / Élément' },
    { key: 'auteur', label: 'Auteur' },
    { key: 'details', label: 'Détails de l\'opération' },
  ];

  const handleExportCSV = () => {
    exportToCSV(journalMock, 'Journal_Audit_SyLOC_T', columnsExport);
  };

  const handleExportPDF = () => {
    exportToPDF('Journal d\'Audit & Traçabilité Système', 'Historique des accès et décisions sensibles', journalMock, columnsExport);
  };

  const columns = [
    {
      key: 'horodatage',
      label: 'Date / Heure',
      render: (v) => {
        const d = new Date(v);
        return (
          <span className="font-mono text-xs text-muted whitespace-nowrap">
            {d.toLocaleDateString('fr-SN')} {d.toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' })}
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
    {
      key: 'cible',
      label: 'Cible',
      render: (v) => <span className="font-mono text-xs">{v}</span>,
    },
    {
      key: 'auteur',
      label: 'Auteur',
      render: (v) => <span className="text-sm">{v}</span>,
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
          <Button variant="amber" size="sm" onClick={handleExportCSV}>
            📊 Exporter en Excel (.CSV)
          </Button>
          <Button variant="stamp" size="sm" onClick={handleExportPDF}>
            📄 Exporter en PDF
          </Button>
        </div>
      </div>

      <div className="mb-4 p-3 bg-paper2 border border-ink/10 text-sm text-muted flex items-center gap-2"
        style={{ borderRadius: 'var(--radius)' }}>
        <span>🔒</span>
        <span>Ce journal d'audit est certifié infalsifiable en lecture seule pour la gouvernance SI.</span>
      </div>

      <Card>
        <Table
          columns={columns}
          data={journalMock}
          emptyState={<EmptyState icon="📋" title="Journal vide" description="Aucune action enregistrée pour le moment." />}
        />
      </Card>
    </PageWrapper>
  );
}
