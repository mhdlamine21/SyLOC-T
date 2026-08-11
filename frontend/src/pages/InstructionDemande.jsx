import { useEffect, useState } from "react";

function InstructionDemande() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demandeSelectionnee, setDemandeSelectionnee] =
    useState(null);

  // ============================
  // Charger les demandes
  // ============================
  useEffect(() => {
    let annule = false;

    const chargerDemandes = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/demandes"
        );

        if (!response.ok) {
          throw new Error(
            "Erreur lors du chargement des demandes"
          );
        }

        const data = await response.json();

        console.log("Demandes reçues :", data);

        if (annule) {
          return;
        }

        setDemandes(data.demandes || []);
        setError("");
        setLoading(false);
      } catch (error) {
        if (annule) {
          return;
        }

        console.error("Erreur :", error);

        setError(
          "Impossible de charger les demandes."
        );

        setLoading(false);
      }
    };

    chargerDemandes();

    return () => {
      annule = true;
    };
  }, []);

  // ============================
  // Ouvrir un dossier
  // ============================
  const ouvrirDossier = (demande) => {
    console.log("Dossier ouvert :", demande);

    setDemandeSelectionnee(demande);
  };

  // ============================
  // Fermer le dossier
  // ============================
  const fermerDossier = () => {
    setDemandeSelectionnee(null);
  };

  // ============================
  // Valider une demande
  // ============================
  const validerDemande = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/demandes/${id}/valider`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Erreur lors de la validation"
        );
      }

      console.log(
        "Demande validée :",
        data.demande
      );

      // Mise à jour de la liste
      setDemandes((anciennesDemandes) =>
        anciennesDemandes.map((demande) =>
          demande.id === id
            ? {
                ...demande,
                statut: "VALIDEE",
              }
            : demande
        )
      );

      // Mise à jour du dossier ouvert
      setDemandeSelectionnee(
        (ancienneDemande) =>
          ancienneDemande?.id === id
            ? {
                ...ancienneDemande,
                statut: "VALIDEE",
              }
            : ancienneDemande
      );

      alert(
        "La demande a été validée avec succès."
      );
    } catch (error) {
      console.error("Erreur :", error);

      alert(
        error.message ||
          "Impossible de valider la demande."
      );
    }
  };

  // ============================
  // Refuser une demande
  // ============================
  const refuserDemande = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/demandes/${id}/refuser`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Erreur lors du refus"
        );
      }

      console.log(
        "Demande refusée :",
        data.demande
      );

      // Mise à jour de la liste
      setDemandes((anciennesDemandes) =>
        anciennesDemandes.map((demande) =>
          demande.id === id
            ? {
                ...demande,
                statut: "REFUSEE",
              }
            : demande
        )
      );

      // Mise à jour du dossier ouvert
      setDemandeSelectionnee(
        (ancienneDemande) =>
          ancienneDemande?.id === id
            ? {
                ...ancienneDemande,
                statut: "REFUSEE",
              }
            : ancienneDemande
      );

      alert(
        "La demande a été refusée."
      );
    } catch (error) {
      console.error("Erreur :", error);

      alert(
        error.message ||
          "Impossible de refuser la demande."
      );
    }
  };

  // ============================
  // Couleur du statut
  // ============================
  const getStatutStyle = (statut) => {
    switch (statut) {
      case "VALIDEE":
        return {
          backgroundColor: "#d1fae5",
          color: "#047857",
        };

      case "REFUSEE":
        return {
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
        };

      case "EN_ATTENTE":
      default:
        return {
          backgroundColor: "#fef3c7",
          color: "#92400e",
        };
    }
  };

  // ============================
  // Affichage
  // ============================
  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* ============================
          TITRE
      ============================ */}

      <div
        style={{
          marginBottom: "30px",
        }}
      >
        <h1
          style={{
            marginBottom: "8px",
            fontSize: "30px",
            color: "#1f2937",
          }}
        >
          Instruction des demandes
        </h1>

        <p
          style={{
            margin: 0,
            color: "#6b7280",
            fontSize: "16px",
          }}
        >
          Espace Agent DCUVE
        </p>
      </div>

      {/* ============================
          CHARGEMENT
      ============================ */}

      {loading && (
        <div
          style={{
            padding: "30px",
            textAlign: "center",
            backgroundColor: "#f9fafb",
            borderRadius: "10px",
          }}
        >
          <p>Chargement des demandes...</p>
        </div>
      )}

      {/* ============================
          ERREUR
      ============================ */}

      {error && (
        <div
          style={{
            padding: "15px",
            marginBottom: "20px",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "8px",
          }}
        >
          <p style={{ margin: 0 }}>
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "12px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "9px 15px",
              borderRadius: "7px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ============================
          AUCUNE DEMANDE
      ============================ */}

      {!loading &&
        !error &&
        demandes.length === 0 && (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              backgroundColor: "#f9fafb",
              borderRadius: "10px",
            }}
          >
            <p>Aucune demande disponible.</p>
          </div>
        )}

      {/* ============================
          LISTE DES DEMANDES
      ============================ */}

      {!loading &&
        !error &&
        demandes.length > 0 && (
          <div>
            <h2
              style={{
                fontSize: "20px",
                marginBottom: "20px",
                color: "#374151",
              }}
            >
              Demandes à instruire
            </h2>

            {demandes.map((demande) => (
              <div
                key={demande.id}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "18px",
                  boxShadow:
                    "0 2px 8px rgba(0, 0, 0, 0.05)",
                }}
              >
                {/* En-tête */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "20px",
                        color: "#1f2937",
                      }}
                    >
                      {demande.numero}
                    </h3>

                    <span
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                      }}
                    >
                      {demande.type ||
                        "Demande d'occupation"}
                    </span>
                  </div>

                  {/* Statut */}

                  <span
                    style={{
                      ...getStatutStyle(
                        demande.statut
                      ),
                      padding: "7px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {demande.statut}
                  </span>
                </div>

                {/* Informations */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(250px, 1fr))",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <strong>Demandeur :</strong>{" "}
                    {demande.demandeur}
                  </p>

                  <p style={{ margin: 0 }}>
                    <strong>Type :</strong>{" "}
                    {demande.type}
                  </p>

                  <p style={{ margin: 0 }}>
                    <strong>Date :</strong>{" "}
                    {demande.date}
                  </p>

                  <p style={{ margin: 0 }}>
                    <strong>
                      Fiche sanitaire :
                    </strong>{" "}
                    {demande.fiche_sanitaire
                      ?.presente
                      ? "Présente"
                      : "Absente"}
                  </p>

                  <p style={{ margin: 0 }}>
                    <strong>
                      Avis sanitaire :
                    </strong>{" "}
                    {demande.fiche_sanitaire
                      ?.avis ||
                      "Non renseigné"}
                  </p>
                </div>

                {/* Bouton */}

                <button
                  onClick={() =>
                    ouvrirDossier(demande)
                  }
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "11px 18px",
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Ouvrir le dossier
                </button>
              </div>
            ))}
          </div>
        )}

      {/* ============================
          DOSSIER SÉLECTIONNÉ
      ============================ */}

      {demandeSelectionnee && (
        <div
          style={{
            marginTop: "35px",
            padding: "28px",
            backgroundColor: "#f8fafc",
            border: "2px solid #dbeafe",
            borderRadius: "12px",
          }}
        >
          {/* En-tête */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#1f2937",
                }}
              >
                Dossier{" "}
                {demandeSelectionnee.numero}
              </h2>

              <p
                style={{
                  color: "#6b7280",
                  marginTop: "5px",
                }}
              >
                Informations détaillées de la
                demande
              </p>
            </div>

            <span
              style={{
                ...getStatutStyle(
                  demandeSelectionnee.statut
                ),
                padding: "7px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              {demandeSelectionnee.statut}
            </span>
          </div>

          {/* ============================
              INFORMATIONS
          ============================ */}

          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "20px",
              borderRadius: "10px",
              marginBottom: "20px",
              border:
                "1px solid #e5e7eb",
            }}
          >
            <h3>Informations de la demande</h3>

            <p>
              <strong>Numéro :</strong>{" "}
              {demandeSelectionnee.numero}
            </p>

            <p>
              <strong>Demandeur :</strong>{" "}
              {demandeSelectionnee.demandeur}
            </p>

            <p>
              <strong>Type :</strong>{" "}
              {demandeSelectionnee.type}
            </p>

            <p>
              <strong>Date :</strong>{" "}
              {demandeSelectionnee.date}
            </p>

            <p>
              <strong>Statut :</strong>{" "}
              {demandeSelectionnee.statut}
            </p>
          </div>

          {/* ============================
              FICHE SANITAIRE
          ============================ */}

          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "20px",
              borderRadius: "10px",
              marginBottom: "20px",
              border:
                "1px solid #e5e7eb",
            }}
          >
            <h3>Fiche sanitaire</h3>

            <p>
              <strong>Présence :</strong>{" "}
              {demandeSelectionnee
                .fiche_sanitaire?.presente
                ? "Présente"
                : "Absente"}
            </p>

            <p>
              <strong>Fichier :</strong>{" "}
              {demandeSelectionnee
                .fiche_sanitaire?.fichier ||
                "Aucun fichier"}
            </p>

            <p>
              <strong>Avis sanitaire :</strong>{" "}
              {demandeSelectionnee
                .fiche_sanitaire?.avis ||
                "Non renseigné"}
            </p>
          </div>

          {/* ============================
              DÉCISION
          ============================ */}

          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "20px",
              borderRadius: "10px",
              border:
                "1px solid #e5e7eb",
            }}
          >
            <h3>
              Décision de l'Agent DCUVE
            </h3>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {/* VALIDER */}

              <button
                onClick={() =>
                  validerDemande(
                    demandeSelectionnee.id
                  )
                }
                disabled={
                  demandeSelectionnee.statut ===
                  "VALIDEE"
                }
                style={{
                  backgroundColor:
                    demandeSelectionnee.statut ===
                    "VALIDEE"
                      ? "#9ca3af"
                      : "#16a34a",
                  color: "#ffffff",
                  border: "none",
                  padding: "11px 18px",
                  borderRadius: "7px",
                  cursor:
                    demandeSelectionnee.statut ===
                    "VALIDEE"
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "600",
                }}
              >
                Valider la demande
              </button>

              {/* REFUSER */}

              <button
                onClick={() =>
                  refuserDemande(
                    demandeSelectionnee.id
                  )
                }
                disabled={
                  demandeSelectionnee.statut ===
                  "REFUSEE"
                }
                style={{
                  backgroundColor:
                    demandeSelectionnee.statut ===
                    "REFUSEE"
                      ? "#9ca3af"
                      : "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  padding: "11px 18px",
                  borderRadius: "7px",
                  cursor:
                    demandeSelectionnee.statut ===
                    "REFUSEE"
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "600",
                }}
              >
                Refuser la demande
              </button>

              {/* FERMER */}

              <button
                onClick={fermerDossier}
                style={{
                  backgroundColor: "#6b7280",
                  color: "#ffffff",
                  border: "none",
                  padding: "11px 18px",
                  borderRadius: "7px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Fermer le dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstructionDemande;