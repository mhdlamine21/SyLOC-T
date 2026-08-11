import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_ACCOUNTS } from '../../mocks/data';
import toast from 'react-hot-toast';

export default function DemoSwitcher() {
  const { login, role, user } = useAuth();
  const [open, setOpen] = useState(false);

  const switchAccount = (key) => {
    const account = DEMO_ACCOUNTS[key];
    if (account) {
      login(account, 'demo-token');
      toast.success(`Connecté sous l'identité : ${account.nom_complet} (${account.role})`);
      setOpen(false);
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="bg-amber text-ink font-bold px-4 py-2.5 rounded-full shadow-lg hover:bg-amber-deep transition-all flex items-center gap-2 border-2 border-white text-xs"
        >
          <span className="animate-pulse text-sm">⚡</span>
          <span>Sélecteur Démo Rôles ({role || 'Non connecté'})</span>
        </button>
      ) : (
        <div className="bg-teal-deep text-paper p-4 rounded-lg shadow-2xl border-2 border-amber max-w-sm w-full fade-in text-xs space-y-3">
          <div className="flex justify-between items-center border-b border-paper/20 pb-2">
            <div>
              <p className="font-display font-bold text-sm text-amber-pale">Changer d'Identité / Rôle</p>
              <p className="text-[10px] text-paper/60">Sélectionnez un profil pour tester l'interface</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-paper/60 hover:text-paper text-lg font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {[
              { key: 'demandeur', label: '🎓 Usager / Candidat Étudiant', name: 'Aïssatou Ndiaye' },
              { key: 'usager', label: '💼 Usager / Candidat Visiteur', name: 'Babacar Ndiaye' },
              { key: 'occupant', label: '🔑 Occupant Titulaire (Contrat LOC-004)', name: 'Mamadou Lô' },
              { key: 'agent_dcuve', label: '📂 Agent DCUVE', name: 'Moussa Diagne' },
              { key: 'directeur_dcuve', label: '🏛️ Directeur DCUVE', name: 'Fatou Mbaye' },
              { key: 'directeur_crous_t', label: '👑 Directeur Général CROUS-T', name: 'Abdou Diallo' },
              { key: 'service_comptable', label: '💰 Service Comptable (Guichet Caisse)', name: 'Oumar Thiam' },
              { key: 'service_juridique', label: '⚖ Service Juridique', name: 'Mame Diarra Fall' },
              { key: 'service_technique', label: '🔧 Service Technique', name: 'Seydou Ba' },
              { key: 'agent_terrain', label: '🗺️ Agent Terrain', name: 'Lamine Kouyaté' },
              { key: 'agent_qhse', label: '🔬 Agent QHSE (Sanctions)', name: 'Ndéye Sarr' },
              { key: 'cellule_communication', label: '💬 Cellule Communication', name: 'Rokhaya Diop' },
              { key: 'administrateur_si', label: '⚙️ Admin SI & Gestion Comptes', name: 'Admin SyLOC-T' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => switchAccount(item.key)}
                className={`w-full text-left p-2 rounded border transition-colors ${
                  user?.email === DEMO_ACCOUNTS[item.key]?.email
                    ? 'bg-amber text-ink font-bold border-amber'
                    : 'bg-paper/10 hover:bg-paper/20 border-paper/15 text-paper'
                }`}
              >
                <p className="font-semibold text-xs">{item.label}</p>
                <p className="text-[10px] opacity-75 font-mono">{item.name}</p>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-paper/20 flex justify-end">
            <button onClick={() => setOpen(false)} className="text-[10px] font-mono text-paper/50 hover:underline">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
