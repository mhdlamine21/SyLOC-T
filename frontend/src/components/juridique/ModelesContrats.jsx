import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Modal, Field, Input, Textarea, Select } from '../common/ui';
import { DataTable, EmptyState, Skeleton, useConfirm } from '../ui';
import {
  getModelesContrat,
  createModeleContrat,
  updateModeleContrat,
  deleteModeleContrat,
  getVariablesContrat,
} from '../../api/contrats';
import { messageErreur } from '../../api/utils';
import toast from 'react-hot-toast';

const TYPES_ACTE = [
  { value: 'BAIL_COMMERCIAL', label: 'Bail commercial domanial' },
  { value: 'CONVENTION_OCCUPATION', label: "Convention d'occupation précaire" },
  { value: 'CONVENTION_ETUDIANTE', label: 'Convention étudiante (gratuite)' },
  { value: 'AVENANT', label: 'Avenant' },
];

const VIDE = {
  nom: '',
  type_contrat: 'BAIL_COMMERCIAL',
  objet: '',
  corps: '',
  clauses_standard: '',
  duree_mois_defaut: 24,
  preavis_mois_defaut: 3,
  est_actif: true,
};

export default function ModelesContrats() {
  const confirm = useConfirm();
  const [modeles, setModeles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [variablesInfo, setVariablesInfo] = useState(null);

  const [editing, setEditing] = useState(null); // null = fermé, {} = création, objet = édition
  const [form, setForm] = useState(VIDE);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [m, v] = await Promise.all([getModelesContrat(), getVariablesContrat()]);
      setModeles(m);
      setVariablesInfo(v);
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors du chargement des modèles.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setForm({ ...VIDE, corps: variablesInfo?.corps_par_defaut || '', clauses_standard: variablesInfo?.clauses_standard || '' });
    setEditing({});
  };

  const openEdit = (modele) => {
    setForm({ ...VIDE, ...modele });
    setEditing(modele);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing?.id) {
        await updateModeleContrat(editing.id, form);
        toast.success('Modèle mis à jour.');
      } else {
        await createModeleContrat(form);
        toast.success('Modèle créé.');
      }
      setEditing(null);
      fetchAll();
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de l'enregistrement du modèle."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (modele) => {
    const ok = await confirm({
      title: 'Supprimer le modèle',
      message: `Supprimer définitivement le modèle « ${modele.nom} » ?`,
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deleteModeleContrat(modele.id);
      toast.success('Modèle supprimé.');
      fetchAll();
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors de la suppression.'));
    }
  };

  const copierVariable = (v) => {
    navigator.clipboard?.writeText(`{{${v}}}`);
    toast.success(`Variable {{${v}}} copiée.`);
  };

  const columns = [
    { key: 'nom', label: 'Nom' },
    { key: 'type_contrat', label: 'Type', render: (v) => TYPES_ACTE.find((t) => t.value === v)?.label || v },
    { key: 'est_actif', label: 'Actif', render: (v) => (v ? 'Oui' : '⏸ Non') },
    { key: 'nb_contrats', label: 'Contrats liés' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>✎ Modifier</Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(row)}>Supprimer</Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <Button variant="amber" onClick={openCreate}>+ Nouveau modèle</Button>
        </div>
        {loading ? (
          <Skeleton lines={4} height={40} />
        ) : (
          <DataTable
            columns={columns}
            data={modeles}
            empty={<EmptyState icon={<DescriptionOutlinedIcon style={{ fontSize: 20 }} />} title="Aucun modèle" description="Créez un premier modèle d'acte pour standardiser la rédaction." />}
          />
        )}
      </div>

      <Card>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--text-navy)', margin: '0 0 10px' }}>
          Variables disponibles
        </h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px' }}>
          Cliquez sur une variable pour la copier au format <code>{'{{variable}}'}</code>.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(variablesInfo?.variables || []).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => copierVariable(v)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, padding: '5px 9px',
                borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)',
                color: 'var(--text-navy)', cursor: 'pointer',
              }}
            >
              {`{{${v}}}`}
            </button>
          ))}
        </div>
      </Card>

      {editing !== null && (
        <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? `Modifier « ${editing.nom} »` : 'Nouveau modèle d\'acte'} size="lg">
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Nom du modèle" required>
                <Input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              </Field>
              <Field label="Type d'acte">
                <Select value={form.type_contrat} onChange={(e) => setForm({ ...form, type_contrat: e.target.value })}>
                  {TYPES_ACTE.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Objet par défaut">
              <Input value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })} />
            </Field>
            <Field label="Corps du contrat" hint="Utilisez les variables {{cle}}">
              <Textarea rows={10} value={form.corps} onChange={(e) => setForm({ ...form, corps: e.target.value })} style={{ minHeight: 220, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
            </Field>
            <Field label="Clauses standard">
              <Textarea value={form.clauses_standard} onChange={(e) => setForm({ ...form, clauses_standard: e.target.value })} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Durée par défaut (mois)">
                <Input type="number" value={form.duree_mois_defaut} onChange={(e) => setForm({ ...form, duree_mois_defaut: e.target.value })} />
              </Field>
              <Field label="Préavis par défaut (mois)">
                <Input type="number" value={form.preavis_mois_defaut} onChange={(e) => setForm({ ...form, preavis_mois_defaut: e.target.value })} />
              </Field>
              <Field label="Statut">
                <Select value={form.est_actif ? '1' : '0'} onChange={(e) => setForm({ ...form, est_actif: e.target.value === '1' })}>
                  <option value="1">Actif</option>
                  <option value="0">Inactif</option>
                </Select>
              </Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setEditing(null)}>Annuler</Button>
              <Button variant="amber" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

