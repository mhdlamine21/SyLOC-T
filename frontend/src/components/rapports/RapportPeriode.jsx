import { useState } from 'react';
import {
  PageWrapper, SectionHeader, Card, StatCard, Button, Field, Select,
} from '../common/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { evolutionDemandesMock } from '../../mocks/data';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

const PERIODES = ['Mars 2026', 'Avril 2026', 'Mai 2026', 'Juin 2026', 'Juillet 2026', 'Août 2026'];

export default function RapportPeriode() {
  const [periode, setPeriode] = useState('Juillet 2026');

  const columnsExport = [
    { key: 'mois', label: 'Mois' },
    { key: 'soumises', label: 'Demandes Soumises' },
    { key: 'favorables', label: 'Demandes Favorables' },
    { key: 'defavorables', label: 'Demandes Défavorables' },
  ];

  const handleExportCSV = () => {
    exportToCSV(evolutionDemandesMock, `Rapport_Periode_${periode.replace(/ /g, '_')}`, columnsExport);
  };

  const handleExportPDF = () => {
    exportToPDF(`Rapport Mensuel d'Activité Locative - ${periode}`, 'Bilan des demandes et attributions domaniales', evolutionDemandesMock, columnsExport);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Direction CROUS-T"
        title="Rapport par période & Exportation"
        subtitle="Synthèse des indicateurs locatifs sur la période sélectionnée avec export PDF et Excel."
      />

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <Field label="Période" className="mb-0 flex-1">
            <Select value={periode} onChange={(e) => setPeriode(e.target.value)}>
              {PERIODES.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </Field>
          <Button variant="primary" onClick={() => toast.success(`Rapport actualisé pour ${periode}`)}>
            🔄 Actualiser
          </Button>
          <Button variant="amber" onClick={handleExportCSV}>
            📊 Exporter en Excel (.CSV)
          </Button>
          <Button variant="stamp" onClick={handleExportPDF}>
            📄 Exporter en PDF (Imprimer)
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Demandes reçues" value={7} color="teal" icon="📋" />
        <StatCard label="Favorables" value={4} color="ok" icon="✅" sub={`${Math.round((4 / 7) * 100)}%`} />
        <StatCard label="Défavorables" value={3} color="stamp" icon="❌" />
        <StatCard label="Redevances encaissées" value="315k" color="amber" icon="💰" sub="FCFA" />
      </div>

      <Card>
        <div className="flex justify-between items-center mb-5">
          <p className="font-display font-semibold text-base text-ink">Évolution des demandes - 6 derniers mois</p>
          <span className="font-mono text-xs text-teal font-semibold">Bilan consolidé</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={evolutionDemandesMock}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(32,28,20,0.08)" />
            <XAxis dataKey="mois" tick={{ fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
            <YAxis tick={{ fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
            <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="soumises" name="Soumises" fill="#1f4b3f" radius={[2, 2, 0, 0]} />
            <Bar dataKey="favorables" name="Favorables" fill="#2f7d4f" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </PageWrapper>
  );
}
