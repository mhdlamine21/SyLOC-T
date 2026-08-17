import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import DirectionsWalkOutlinedIcon from '@mui/icons-material/DirectionsWalkOutlined';
import DoNotDisturbOutlinedIcon from '@mui/icons-material/DoNotDisturbOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import NotificationImportantOutlinedIcon from '@mui/icons-material/NotificationImportantOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getRapportQHSE } from '../../api/rapports';
import { messageErreur } from '../../api/utils';
import { Button, Input, LoadingState, EmptyState } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField,
  ProgressRow, RankList, SplitLayout, MiniStat, SectionLabel,
} from '../common/dashboard';

const isoJour = (d) => d.toISOString().slice(0, 10);
const fcfa = (v) => `${Number(v || 0).toLocaleString('fr-FR')} FCFA`;
const libelle = (cle) => String(cle || '').replace(/_/g, ' ');

/**
 * Rapport QHSE consolide (Phase 5) destine a la Direction : signalements,
 * inspections, sanctions, missions terrain, maintenance et locaux a risque.
 */
export default function RapportQHSE() {
  const aujourdhui = new Date();
  const ilYAUnMois = new Date(aujourdhui.getTime() - 30 * 24 * 3600 * 1000);
  const [debut, setDebut] = useState(isoJour(ilYAUnMois));
  const [fin, setFin] = useState(isoJour(aujourdhui));
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      setRapport(await getRapportQHSE(debut, fin));
    } catch (e) {
      toast.error(messageErreur(e, 'Impossible de generer le rapport QHSE.'));
    } finally {
      setLoading(false);
    }
  }, [debut, fin]);

  useEffect(() => { charger(); }, [charger]);

  const plaintes = rapport?.plaintes;
  const inspections = rapport?.inspections;
  const sanctions = rapport?.sanctions;
  const missions = rapport?.missions;
  const maintenance = rapport?.maintenance;

  return (
    <div>
      <PageHeader
        icon={<ShieldOutlinedIcon style={{ fontSize: 20 }} />}
        title="Rapport QHSE consolide"
        subtitle="Hygiene, securite, conformite des locaux, missions de controle et maintenance technique."
        actions={<Button variant="secondary" onClick={charger}>â†» Regenerer</Button>}
      />

      <FilterBar>
        <FilterField label="Debut de periode">
          <Input type="date" value={debut} max={fin} onChange={(e) => setDebut(e.target.value)} />
        </FilterField>
        <FilterField label="Fin de periode">
          <Input type="date" value={fin} min={debut} onChange={(e) => setFin(e.target.value)} />
        </FilterField>
      </FilterBar>

      {loading && <LoadingState label="Generation du rapport QHSEâ€¦" />}

      {!loading && !rapport && (
        <EmptyState
          icon={<ShieldOutlinedIcon style={{ fontSize: 20 }} />}
          title="Aucune donnee QHSE"
          description="Aucun indicateur disponible pour la periode selectionnee."
        />
      )}

      {!loading && rapport && (
        <>
          <SectionLabel icon={<EventOutlinedIcon style={{ fontSize: 20 }} />}>
            Periode du {new Date(rapport.periode.debut).toLocaleDateString('fr-FR')} au{' '}
            {new Date(rapport.periode.fin).toLocaleDateString('fr-FR')}
          </SectionLabel>

          <StatGrid cols={4}>
            <KpiCard
              icon={<CampaignOutlinedIcon style={{ fontSize: 20 }} />}
              label="Signalements recus"
              value={plaintes?.total ?? 0}
              sub={`${plaintes?.resolues ?? 0} resolu(s) Â· ${plaintes?.en_cours ?? 0} en cours`}
              tone="navy"
            />
            <KpiCard
              icon={<TimerOutlinedIcon style={{ fontSize: 20 }} />}
              label="Delai moyen de resolution"
              value={`${plaintes?.delai_moyen_heures ?? 0} h`}
              sub={`${plaintes?.sla_depassees ?? 0} SLA depasse(s)`}
              tone={plaintes?.sla_depassees ? 'red' : 'green'}
            />
            <KpiCard
              icon={<BiotechOutlinedIcon style={{ fontSize: 20 }} />}
              label="Taux de conformite"
              value={`${inspections?.taux_conformite ?? 0} %`}
              sub={`${inspections?.total ?? 0} inspection(s) Â· note ${inspections?.note_moyenne ?? 0}/20`}
              tone={(inspections?.taux_conformite ?? 0) >= 70 ? 'green' : 'gold'}
            />
            <KpiCard
              icon={<WarningAmberOutlinedIcon style={{ fontSize: 20 }} />}
              label="Sanctions prononcees"
              value={sanctions?.total ?? 0}
              sub={`${sanctions?.levees ?? 0} levee(s)`}
              tone="red"
            />
          </StatGrid>

          <SplitLayout>
            <Panel icon={<CampaignOutlinedIcon style={{ fontSize: 20 }} />} title="Signalements par type" subtitle="Origine des non-conformites remontees">
              {Object.entries(plaintes?.par_type || {}).map(([cle, valeur]) => (
                <ProgressRow key={cle} label={libelle(cle)} value={valeur} total={plaintes?.total || 0} tone="navy" />
              ))}
              {!Object.keys(plaintes?.par_type || {}).length && (
                <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Aucun signalement sur la periode.</p>
              )}
            </Panel>

            <Panel icon={<NotificationImportantOutlinedIcon style={{ fontSize: 20 }} />} title="Locaux a risque" subtitle="Score = 2 Ã- non-conformites + signalements">
              <RankList
                items={(rapport.locaux_a_risque || []).map((l) => ({
                  key: l.local_id,
                  title: l.local_reference || 'Local',
                  subtitle: `${l.plaintes} signalement(s) Â· ${l.non_conformites} non-conformite(s)`,
                  value: l.score_risque,
                }))}
                empty="Aucun local a risque identifie."
              />
            </Panel>
          </SplitLayout>

          <SplitLayout>
            <Panel icon={<ExploreOutlinedIcon style={{ fontSize: 20 }} />} title="Missions de controle terrain" subtitle={`Taux d'execution ${missions?.taux_execution ?? 0} %`}>
              <StatGrid cols={4}>
                <MiniStat icon={<MarkEmailUnreadOutlinedIcon style={{ fontSize: 20 }} />} label="Emis" value={missions?.emis ?? 0} tone="gold" />
                <MiniStat icon={<DirectionsWalkOutlinedIcon style={{ fontSize: 20 }} />} label="En cours" value={missions?.en_cours ?? 0} tone="navy" />
                <MiniStat icon={<TaskAltOutlinedIcon style={{ fontSize: 20 }} />} label="Executes" value={missions?.executes ?? 0} tone="green" />
                <MiniStat icon={<DoNotDisturbOutlinedIcon style={{ fontSize: 20 }} />} label="Annules" value={missions?.annules ?? 0} tone="slate" />
              </StatGrid>
              <div style={{ marginTop: 14 }}>
                {Object.entries(missions?.par_priorite || {}).map(([cle, valeur]) => (
                  <ProgressRow
                    key={cle}
                    label={`Priorite ${libelle(cle)}`}
                    value={valeur}
                    total={missions?.total || 0}
                    tone={cle === 'ELEVEE' ? 'red' : 'navy'}
                  />
                ))}
              </div>
            </Panel>

            <Panel icon={<BuildOutlinedIcon style={{ fontSize: 20 }} />} title="Maintenance technique" subtitle={`Taux de realisation ${maintenance?.taux_realisation ?? 0} %`}>
              <StatGrid cols={2}>
                <MiniStat icon={<CalendarMonthOutlinedIcon style={{ fontSize: 20 }} />} label="Planifiees" value={maintenance?.planifiees ?? 0} tone="gold" />
                <MiniStat icon={<TaskAltOutlinedIcon style={{ fontSize: 20 }} />} label="Terminees" value={maintenance?.terminees ?? 0} tone="green" />
                <MiniStat icon={<PaidOutlinedIcon style={{ fontSize: 20 }} />} label="Cout reel" value={fcfa(maintenance?.cout_reel_total)} tone="red" />
                <MiniStat icon={<HourglassEmptyOutlinedIcon style={{ fontSize: 20 }} />} label="Delai moyen" value={`${maintenance?.delai_moyen_jours ?? 0} j`} tone="navy" />
              </StatGrid>
              <div style={{ marginTop: 14 }}>
                {Object.entries(maintenance?.par_type || {}).map(([cle, valeur]) => (
                  <ProgressRow
                    key={cle}
                    label={libelle(cle)}
                    value={valeur}
                    total={maintenance?.total || 0}
                    tone={cle === 'URGENCE' ? 'red' : 'navy'}
                  />
                ))}
              </div>
            </Panel>
          </SplitLayout>

          <SplitLayout>
            <Panel icon={<BiotechOutlinedIcon style={{ fontSize: 20 }} />} title="Inspections par type de controle">
              {Object.entries(inspections?.par_type_controle || {}).map(([cle, valeur]) => (
                <ProgressRow key={cle} label={libelle(cle)} value={valeur} total={inspections?.total || 0} tone="navy" />
              ))}
              <ProgressRow
                label="Inspections conformes"
                value={inspections?.conformes ?? 0}
                total={inspections?.total || 0}
                tone="green"
              />
            </Panel>

            <Panel icon={<WarningAmberOutlinedIcon style={{ fontSize: 20 }} />} title="Sanctions par niveau">
              {Object.entries(sanctions?.par_niveau || {}).map(([cle, valeur]) => (
                <ProgressRow
                  key={cle}
                  label={libelle(cle)}
                  value={valeur}
                  total={sanctions?.total || 0}
                  tone={['EXPULSION', 'CONVOCATION'].includes(cle) ? 'red' : 'gold'}
                />
              ))}
              {!Object.keys(sanctions?.par_niveau || {}).length && (
                <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>Aucune sanction sur la periode.</p>
              )}
            </Panel>
          </SplitLayout>
        </>
      )}
    </div>
  );
}
