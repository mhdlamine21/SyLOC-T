import { useAuth } from "../context/useAuth";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Bienvenue, {user?.nom_complet || "Utilisateur"}
        </h2>
        <p className="text-gray-600">Rôle : {user?.role || "Non défini"}</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid md:grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Demandes</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Contrats</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">En attente</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800">Signalements</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
}
