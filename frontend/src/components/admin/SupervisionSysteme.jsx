import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import RefreshIcon from '@mui/icons-material/Refresh';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import ApartmentIcon from '@mui/icons-material/Apartment';
import FolderIcon from '@mui/icons-material/Folder';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import { PageWrapper, SectionHeader, Card, Button } from '../common/ui';
import { getSupervisionSysteme } from '../../api/supervision';
import { messageErreur } from '../../api/utils';

export default function SupervisionSysteme() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSupervisionSysteme();
      setData(res);
    } catch (err) {
      toast.error(messageErreur(err, 'Impossible de charger la supervision système.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const exporterBilan = () => {
    if (!data) return;
    const contenu = JSON.stringify(data, null, 2);
    const blob = new Blob([contenu], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supervision_syloc_t_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Bilan technique exporté.');
  };

  const getServiceIcon = (id) => {
    switch (id) {
      case 'api': return <CloudDoneIcon fontSize="medium" style={{ color: 'var(--navy)' }} />;
      case 'db': return <StorageIcon fontSize="medium" style={{ color: 'var(--navy)' }} />;
      case 'storage': return <MemoryIcon fontSize="medium" style={{ color: 'var(--navy)' }} />;
      default: return <SecurityIcon fontSize="medium" style={{ color: 'var(--navy)' }} />;
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        tag="OBSERVABILITÉ & INFRASTRUCTURE"
        title="Supervision & Santé Système"
        subtitle="Monitoring temps réel des services, base de données, stockage et indicateurs techniques."
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" size="sm" onClick={exporterBilan} disabled={loading || !data}>
              <DownloadIcon fontSize="small" /> Exporter le bilan JSON
            </Button>
            <Button variant="primary" size="sm" onClick={charger} disabled={loading}>
              <RefreshIcon fontSize="small" /> Rafraîchir
            </Button>
          </div>
        }
      />

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {data.services?.map((srv) => {
              const estOk = srv.statut === 'OK';
              return (
                <Card key={srv.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: 'var(--surface-sunken)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {getServiceIcon(srv.id)}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{srv.nom}</span>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      color: estOk ? '#10b981' : '#ef4444',
                      backgroundColor: estOk ? '#ecfdf5' : '#fef2f2',
                      padding: '4px 8px',
                      borderRadius: 12,
                    }}>
                      {estOk ? <CheckCircleIcon style={{ fontSize: 14 }} /> : <WarningAmberIcon style={{ fontSize: 14 }} />}
                      {srv.statut}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{srv.description}</p>
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'var(--text-secondary)',
                  }}>
                    {srv.latence_ms !== undefined && <span>Latence : <strong>{srv.latence_ms} ms</strong></span>}
                    {srv.tables_actives !== undefined && <span>Tables actives : <strong>{srv.tables_actives}</strong></span>}
                    {srv.fichiers_total !== undefined && <span>Fichiers stockés : <strong>{srv.fichiers_total}</strong></span>}
                    {srv.evenements_24h !== undefined && <span>Dernières 24h : <strong>{srv.evenements_24h} logs</strong></span>}
                  </div>
                </Card>
              );
            })}
          </div>

          {data.anomalies && data.anomalies.length > 0 && (
            <Card style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <WarningAmberIcon style={{ color: '#d97706' }} />
                <h3 style={{ margin: 0, fontSize: 16, color: '#92400e', fontWeight: 600 }}>
                  Alertes & Détections Système
                </h3>
              </div>
              {data.anomalies.map((anom, idx) => (
                <div key={idx} style={{ padding: '8px 0', borderTop: idx > 0 ? '1px solid #fef3c7' : 'none' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#92400e' }}>{anom.titre}</div>
                  <div style={{ fontSize: 13, color: '#b45309' }}>{anom.message}</div>
                </div>
              ))}
            </Card>
          )}

          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-navy)' }}>
              Volumétrie & Données Système
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
            }}>
              <Card style={{ textAlign: 'center', padding: '16px 12px' }}>
                <ApartmentIcon style={{ color: 'var(--navy)', marginBottom: 6 }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-navy)' }}>
                  {data.volumetrie?.locaux ?? 0}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Locaux Référencés</div>
              </Card>

              <Card style={{ textAlign: 'center', padding: '16px 12px' }}>
                <FolderIcon style={{ color: 'var(--navy)', marginBottom: 6 }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-navy)' }}>
                  {data.volumetrie?.demandes ?? 0}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Dossiers Candidatures</div>
              </Card>

              <Card style={{ textAlign: 'center', padding: '16px 12px' }}>
                <ReceiptIcon style={{ color: 'var(--navy)', marginBottom: 6 }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-navy)' }}>
                  {data.volumetrie?.contrats ?? 0}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Contrats & Baux</div>
              </Card>

              <Card style={{ textAlign: 'center', padding: '16px 12px' }}>
                <AssignmentIcon style={{ color: 'var(--navy)', marginBottom: 6 }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-navy)' }}>
                  {data.volumetrie?.audit ?? 0}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Entrées Journal d'Audit</div>
              </Card>
            </div>
          </div>

          <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-navy)' }}>
              Paramètres d'Environnement & Télémétrie
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              fontSize: 13,
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Version Core : </span>
                <strong>{data.systeme?.version}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Moteur BDD : </span>
                <strong>{data.systeme?.db_engine}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Latence BDD : </span>
                <strong>{data.systeme?.db_latency_ms} ms</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Fuseau horaire : </span>
                <strong>{data.systeme?.timezone}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Mode Debug : </span>
                <strong>{data.systeme?.debug ? 'Actif (Développement)' : 'Désactivé (Production)'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Dernière synchro : </span>
                <strong>{data.systeme?.timestamp ? new Date(data.systeme.timestamp).toLocaleTimeString('fr-SN') : '-'}</strong>
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
}
