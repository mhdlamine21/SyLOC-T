import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";

export default function Signup() {
  const [formData, setFormData] = useState({
    nom_complet: "",
    email: "",
    password: "",
    role: "USAGER",
    est_etudiant: false,
    contact: "",
  });
  const [carteFichier, setCarteFichier] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Créer le compte
      const response = await api.post("/accounts/register/", {
        nom_complet: formData.nom_complet,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        est_etudiant: formData.est_etudiant,
        contact: formData.contact,
      });

      // Si l'inscription est réussie
      if (response.status === 201 || response.status === 200) {
        // 2. Si étudiant, uploader la carte
        if (formData.est_etudiant && carteFichier) {
          const form = new FormData();
          form.append("fichier", carteFichier);
          await api.post(
            "/accounts/demandeurs/soumettre-carte-etudiant/",
            form,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
        }

        toast.success("Compte créé avec succès !");
        // 3. Connecter automatiquement
        await login(formData.email, formData.password);
        navigate("/dashboard");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Erreur lors de l'inscription";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Inscription</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Nom complet</label>
            <input
              type="text"
              name="nom_complet"
              value={formData.nom_complet}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Mot de passe</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Contact</label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="est_etudiant"
                checked={formData.est_etudiant}
                onChange={handleChange}
              />
              Je suis étudiant(e)
            </label>
          </div>
          {formData.est_etudiant && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Carte étudiante (photo ou PDF)
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setCarteFichier(e.target.files[0])}
                className="w-full border p-2 rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                Vérifiée par un agent DCUVE avant de débloquer la gratuité et
                les avis
              </p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
        <p className="text-center mt-4 text-gray-600">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
