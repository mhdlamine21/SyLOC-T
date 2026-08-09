import { useEffect, useState } from "react";
import api from "../api/axios";
import { TYPES_LOCAL } from "../utils/constants";

export default function Vitrine() {
  const [locaux, setLocaux] = useState([]);
  const [filtre, setFiltre] = useState("");

  useEffect(() => {
    api
      .get("/patrimoine/locaux/")
      .then(({ data }) => setLocaux(data))
      .catch((error) => console.error("Erreur:", error));
  }, []);

  const locauxFiltres = filtre
    ? locaux.filter((l) => l.type_local === filtre)
    : locaux;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Vitrine des locaux</h1>

      <div className="mb-6">
        <select
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Tous les types</option>
          {Object.entries(TYPES_LOCAL).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {locauxFiltres.map((local) => (
          <div key={local.id_local} className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-lg">{local.reference}</h3>
            <p className="text-gray-600">{local.localisation}</p>
            <p className="text-sm">
              Type: {TYPES_LOCAL[local.type_local] || local.type_local}
            </p>
            <p className="text-sm">Surface: {local.surface_m2} m²</p>
            <span
              className={`inline-block mt-2 px-2 py-1 text-sm rounded ${
                local.est_libre
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {local.est_libre ? "Disponible" : "Occupé"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
