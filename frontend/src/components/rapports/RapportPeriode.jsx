import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { PageWrapper, SectionHeader, Card, StatCard, Button, Field } from '../common/ui';
import { getRapportPeriode } from '../../api/rapports';
import { messageErreur } from '../../api/utils';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';
import { STATUTS_DEMANDE_LABELS, TYPES_DEMANDE_LABELS } from '../../utils/constants';

const isoJour = (d) => d.toISOString().slice(0, 10);
const fcfa = (n) => Number(n || 0).toLocaleString('fr-SN');

export default function RapportPeriode() {
  const aujourdhui = useMemo(() => new Date(), []);
  const [debut, setDebut] = useState(isoJour(new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1)));
  const [fin, setFin] = useState(isoJour(aujourdhui));
  const [rapport, setRapport] = useState(null);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      setRapport(await getRapportPeriode(debut, fin));
    } catch (error) {
      toast.error(messageErreur(error, 'Chargement du rapport impossible.'));
    } finally {
      setChargement(false);
    }
  }, [debut, fin]);

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lignes = useMemo(() => {
    if (!rapport) return [];
    return [
      ...rapport.demandes.par_statut.map((r) => ({
        categorie: 'Demandes par statut',
        libelle: STATUTS_DEMANDE_LABELS[r.statut] || r.statut,
        total: r.total,
      })),
      ...rapport.demandes.par_type.map((r) => ({
        categorie: 'Demandes par type',
        libelle: TYPES_DEMANDE_LABELS?.[r.type_demande] || r.type_demande,
        total: r.total,
      })),
      ...rapport.finances.par_mode.map((r) => ({
        categorie: 'Paiements par mode',
        libelle: r.mode,
        total: r.total,
      })),
      ...rapport.terrain.par_type.map((r) => ({
        categorie: 'Signalements par type',
        libelle: r.type,
        total: r.total,
      })),
    ];
  }, [rapport]);

  const colonnes = [
    { key: 'categorie', label: 'Catégorie' },
    { key: 'libelle', label: 'Libellé' },
    { key: 'total', label: 'Total' },
  ];

  const titrePeriode = `${debut} au ${fin}`;

  const graphe = rapport
    ? [
        { indicateur: 'Demandes', total: rapport.demandes.total },
        { indicateur: 'Favorables', total: rapport.demandes.favorables },
        { indicateur: 'Défavorables', total: rapport.demandes.defavorables },
        { indicateur: 'En cours', total: rapport.demandes.en_cours },
        { indicateur: 'Contrats signés', total: rapport.contrats.signes },
        { indicateur: 'Signalements', total: rapport.terrain.signalements },
        { indicateur: 'Inspections', total: rapport.terrain.inspections },
      ]
    : [];

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Direction CROUS-T"
        title="Rapport par période & exportation"
        subtitle="Synthèse réelle des indicateurs locatifs sur la période sélectionnée."
      />

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <Field label="Début" className="mb-0">
            <input
              type="date" value={debut} onChange={(e) => setDebut(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </Field>
          <Field label="Fin" className="mb-0">
            <input
              type="date" value={fin} onChange={(e) => setFin(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </Field>
          <Button variant="primary" onClick={charger} disabled={chargement}>
            {chargement ? 'Chargement…' : '🔄 Générer le rapport'}
          </Button>
          <Button
            variant="amber"
            disabled={!lignes.length}
            onClick={() => exportToCSV(lignes, `Rapport_${debut}_${fin}`, colonnes)}
          >
            📊 Exporter en Excel (.CSV)
          </Button>
          <Button
            variant="stamp"
            disabled={!lignes.length}
            onClick={() => exportToPDF(
              `Rapport d'activité locative — ${titrePeriode}`,
              'Bilan des demandes, contrats, finances et terrain',
              lignes,
              colonnes,
            )}
          >
            📄 Exporter en PDF (Imprimer)
          </Button>
        </div>
      </Card>

      {rapport && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Demandes reçues" value={rapport.demandes.total} color="teal" icon="📋" />
            <StatCard label="Favorables" value={rapport.demandes.favorables} color="ok" icon="✅" sub={`${rapport.demandes.taux_favorable}%`} />
            <StatCard label="Défavorables" value={rapport.demandes.defavorables} color="stamp" icon="❌" />
            <StatCard label="Redevances encaissées" value={fcfa(rapport.finances.montant_encaisse)} color="amber" icon="💰" sub="FCFA" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Contrats signés" value={rapport.contrats.signes} color="navy" icon="📜" sub={`${rapport.contrats.actifs} actifs`} />
            <StatCard label="Impayés" value={fcfa(rapport.finances.impayes)} color="danger" icon="💸" sub="FCFA" />
            <StatCard label="Signalements" value={rapport.terrain.signalements} color="stamp" icon="🚩" sub={`${rapport.terrain.resolus} résolus`} />
            <StatCard label="Taux d'occupation" value={`${rapport.patrimoine.taux_occupation}%`} color="ok" icon="🏢" sub={`${rapport.patrimoine.locaux_libres} libres`} />
          </div>

          <Card>
            <div className="flex justify-between items-center mb-5">
              <p className="font-display font-semibold text-base text-ink">Indicateurs de la période — {titrePeriode}</p>
              <span className="font-mono text-xs text-teal font-semibold">Bilan consolidé</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={graphe}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(32,28,20,0.08)" />
                <XAxis dataKey="indicateur" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
                <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" name="Total" fill="#1f4b3f" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </PageWrapper>
  );
}
