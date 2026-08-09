import { useAuth } from "../../context/useAuth";

const STATUTS_VERIFICATION = {
  NON_SOUMIS: "NON_SOUMIS",
  EN_ATTENTE: "EN_ATTENTE",
  VALIDE: "VALIDE",
  REJETE: "REJETE",
};

export default function Profile() {
  const { user } = useAuth();

  const getStatusBadge = (status) => {
    const colors = {
      [STATUTS_VERIFICATION.NON_SOUMIS]: "bg-gray-100 text-gray-800",
      [STATUTS_VERIFICATION.EN_ATTENTE]: "bg-yellow-100 text-yellow-800",
      [STATUTS_VERIFICATION.VALIDE]: "bg-green-100 text-green-800",
      [STATUTS_VERIFICATION.REJETE]: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Mon profil</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="text-gray-500 text-sm">Nom complet</label>
            <p className="text-lg font-semibold">
              {user?.nom_complet || "Non défini"}
            </p>
          </div>
          <div>
            <label className="text-gray-500 text-sm">Email</label>
            <p className="text-lg">{user?.email || "Non défini"}</p>
          </div>
          <div>
            <label className="text-gray-500 text-sm">Rôle</label>
            <p className="text-lg">{user?.role || "Non défini"}</p>
          </div>
          {user?.profil_demandeur && (
            <>
              <div>
                <label className="text-gray-500 text-sm">Statut étudiant</label>
                <p className="text-lg">
                  {user.profil_demandeur.est_etudiant ? "✅ Oui" : "❌ Non"}
                </p>
              </div>
              {user.profil_demandeur.est_etudiant && (
                <div>
                  <label className="text-gray-500 text-sm">
                    Vérification carte étudiante
                  </label>
                  <span
                    className={`inline-block ml-2 px-2 py-1 text-sm rounded ${getStatusBadge(user.profil_demandeur.statut_verification_etudiant)}`}
                  >
                    {user.profil_demandeur.statut_verification_etudiant ||
                      "Non soumis"}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
