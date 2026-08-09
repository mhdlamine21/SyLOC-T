import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Gestion des Locaux VCN
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Plateforme intégrée de gestion de l'occupation du site VCN
          </p>

          {!isAuthenticated ? (
            <div className="space-x-4">
              <Link
                to="/login"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
              >
                Se connecter
              </Link>
              <Link
                to="/signup"
                className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700"
              >
                S'inscrire
              </Link>
            </div>
          ) : (
            <Link
              to="/dashboard"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
            >
              Accéder au tableau de bord
            </Link>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">📍 Localisation</h3>
            <p className="text-gray-600">
              Consultez les locaux disponibles sur le site VCN
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">📝 Demandes</h3>
            <p className="text-gray-600">
              Déposez et suivez vos demandes d'occupation
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">📊 Transparence</h3>
            <p className="text-gray-600">
              Processus d'attribution transparent et traçable
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
