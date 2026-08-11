import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/demandes";

// =====================================================
// LIBELLÉ DU STATUT
// =====================================================
function getStatutLabel(statut) {
  switch (statut) {
    case "EN_ATTENTE":
      return "En attente";

    case "VALIDEE":
      return "Validée par l'Agent DCUVE";

    case "REFUSEE":
      return "Refusée par l'Agent DCUVE";

    case "APPROUVEE_COMMISSION":
      return "Approuvée par la Commission";

    case "REJETEE_COMMISSION":
      return "Rejetée par la Commission";

    default:
      return statut || "Inconnu";
  }
}

// =====================================================
// STYLE DU STATUT
// =====================================================
function getStatutStyle(statut) {
  switch (statut) {
    case "EN_ATTENTE":
      return {
        backgroundColor: "#fff3cd",
        color: "#856404",
      };

    case "VALIDEE":
    case "APPROUVEE_COMMISSION":
      return {
        backgroundColor: "#d1fae5",
        color: "#047857",
      };

    case "REFUSEE":
    case "REJETEE_COMMISSION":
      return {
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
      };

    default:
      return {
        backgroundColor: "#e5e7eb",
        color: "#374151",
      };
  }
}

// =====================================================
// ÉTAPE DE LA DEMANDE
// =====================================================
function getEtape(statut) {
  switch (statut) {
    case "EN_ATTENTE":
      return 1;

    case "VALIDEE":
      return 2;

    case "APPROUVEE_COMMISSION":
    case "REJETEE_COMMISSION":
      return 3;

    case "REFUSEE":
      return 2;

    default:
      return 1;
  }
}

// =====================================================
// COMPOSANT
// =====================================================
function SuiviDemande() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [demandeSelectionnee, setDemandeSelectionnee] =
    useState(null);

  // Permet de relancer le chargement
  const [reload, setReload] = useState(0);

  // ===================================================
  // CHARGEMENT DES DEMANDES
  // ===================================================
  useEffect(() => {
    let annule = false;

    const chargerDemandes = async () => {
      try {
        const response = await axios.get(API_URL);

        if (annule) {
          return;
        }

        console.log("Demandes reçues :", response.data);

        setDemandes(response.data.demandes || []);
        setError("");
        setLoading(false);
      } catch (err) {
        if (annule) {
          return;
        }

        console.error(
          "Erreur lors du chargement :",
          err
        );

        setError(
          "Impossible de charger les demandes. Vérifiez que le backend fonctionne."
        );

        setLoading(false);
      }
    };

    chargerDemandes();

    return () => {
      annule = true;
    };
  }, [reload]);

  // ===================================================
  // RÉESSAYER / ACTUALISER
  // ===================================================
  const recharger = () => {
    setLoading(true);
    setError("");

    setReload(
      (ancienneValeur) => ancienneValeur + 1
    );
  };

  // ===================================================
  // CHARGEMENT
  // ===================================================
  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        Chargement des demandes...
      </div>
    );
  }

  // ===================================================
  // ERREUR
  // ===================================================
  if (error) {
    return (
      <div
        style={{
          margin: "30px",
          padding: "20px",
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
          borderRadius: "10px",
        }}
      >
        {error}

        <div style={{ marginTop: "15px" }}>
          <button
            onClick={recharger}
            style={{
              padding: "10px 18px",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "7px",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ===================================================
  // INTERFACE
  // ===================================================
  return (
    <div
      style={{
        padding: "35px",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* =================================================
          EN-TÊTE
      ================================================= */}
      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "32px",
            fontWeight: "500",
            color: "#1e293b",
          }}
        >
          Suivi des demandes
        </h1>

        <p
          style={{
            marginTop: "8px",
            color: "#64748b",
            fontSize: "16px",
          }}
        >
          Consultez l'état d'avancement de vos demandes
        </p>
      </div>

      {/* =================================================
          NOMBRE DE DEMANDES
      ================================================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "21px",
            fontWeight: "500",
            color: "#334155",
          }}
        >
          Mes demandes
        </h2>

        <span
          style={{
            padding: "8px 15px",
            borderRadius: "20px",
            backgroundColor: "#dbeafe",
            color: "#2563eb",
            fontWeight: "600",
          }}
        >
          {demandes.length} demande
          {demandes.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* =================================================
          AUCUNE DEMANDE
      ================================================= */}
      {demandes.length === 0 && (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "45px",
            textAlign: "center",
          }}
        >
          <h3 style={{ color: "#475569" }}>
            Aucune demande trouvée
          </h3>

          <p style={{ color: "#94a3b8" }}>
            Vous n'avez encore aucune demande enregistrée.
          </p>
        </div>
      )}

      {/* =================================================
          LISTE DES DEMANDES
      ================================================= */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {demandes.map((demande) => {
          const etape = getEtape(demande.statut);
          const statutStyle =
            getStatutStyle(demande.statut);

          return (
            <div
              key={demande.id}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "25px",
                boxShadow:
                  "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              {/* HAUT DE LA CARTE */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "20px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "21px",
                      color: "#1e293b",
                    }}
                  >
                    {demande.numero}
                  </h3>

                  <p
                    style={{
                      marginTop: "6px",
                      color: "#64748b",
                    }}
                  >
                    {demande.type}
                  </p>
                </div>

                <span
                  style={{
                    padding: "8px 14px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: "600",
                    ...statutStyle,
                  }}
                >
                  {getStatutLabel(demande.statut)}
                </span>
              </div>

              {/* INFORMATIONS */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "15px",
                  marginTop: "20px",
                  paddingTop: "20px",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <div>
                  <strong>Demandeur</strong>

                  <div
                    style={{
                      marginTop: "5px",
                      color: "#475569",
                    }}
                  >
                    {demande.demandeur}
                  </div>
                </div>

                <div>
                  <strong>Date</strong>

                  <div
                    style={{
                      marginTop: "5px",
                      color: "#475569",
                    }}
                  >
                    {demande.date}
                  </div>
                </div>

                <div>
                  <strong>Fiche sanitaire</strong>

                  <div
                    style={{
                      marginTop: "5px",
                      color: "#475569",
                    }}
                  >
                    {demande.fiche_sanitaire?.presente
                      ? "Présente"
                      : "Non présente"}
                  </div>
                </div>

                <div>
                  <strong>Avis sanitaire</strong>

                  <div
                    style={{
                      marginTop: "5px",
                      color: "#475569",
                    }}
                  >
                    {demande.fiche_sanitaire?.avis ||
                      "Non renseigné"}
                  </div>
                </div>
              </div>

              {/* PROGRESSION */}

              <div
                style={{
                  marginTop: "25px",
                  padding: "20px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "15px",
                  }}
                >
                  <strong>
                    Progression de la demande
                  </strong>

                  <span style={{ color: "#64748b" }}>
                    Étape {etape}/3
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3, 1fr)",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderRadius: "8px",
                      backgroundColor:
                        etape >= 1
                          ? "#dbeafe"
                          : "#e5e7eb",
                      color:
                        etape >= 1
                          ? "#2563eb"
                          : "#64748b",
                    }}
                  >
                    <strong>1</strong>

                    <div
                      style={{
                        fontSize: "13px",
                        marginTop: "5px",
                      }}
                    >
                      Dépôt
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderRadius: "8px",
                      backgroundColor:
                        etape >= 2
                          ? "#dbeafe"
                          : "#e5e7eb",
                      color:
                        etape >= 2
                          ? "#2563eb"
                          : "#64748b",
                    }}
                  >
                    <strong>2</strong>

                    <div
                      style={{
                        fontSize: "13px",
                        marginTop: "5px",
                      }}
                    >
                      Instruction DCUVE
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderRadius: "8px",
                      backgroundColor:
                        etape >= 3
                          ? "#dbeafe"
                          : "#e5e7eb",
                      color:
                        etape >= 3
                          ? "#2563eb"
                          : "#64748b",
                    }}
                  >
                    <strong>3</strong>

                    <div
                      style={{
                        fontSize: "13px",
                        marginTop: "5px",
                      }}
                    >
                      Commission
                    </div>
                  </div>
                </div>
              </div>

              {/* DÉCISION COMMISSION */}

              {demande.vote_commission && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "18px",
                    borderRadius: "10px",
                    backgroundColor:
                      demande.vote_commission ===
                      "FAVORABLE"
                        ? "#ecfdf5"
                        : "#fef2f2",
                  }}
                >
                  <strong>
                    Décision de la Commission
                  </strong>

                  <p
                    style={{
                      margin: "8px 0 0",
                      fontWeight: "600",
                      color:
                        demande.vote_commission ===
                        "FAVORABLE"
                          ? "#047857"
                          : "#b91c1c",
                    }}
                  >
                    {demande.vote_commission ===
                    "FAVORABLE"
                      ? "✓ Vote favorable"
                      : "✕ Vote défavorable"}
                  </p>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#475569",
                    }}
                  >
                    Décision :{" "}
                    {demande.decision === "VALIDEE"
                      ? "Validée"
                      : "Refusée"}
                  </p>
                </div>
              )}

              {/* BOUTON */}

              <div style={{ marginTop: "20px" }}>
                <button
                  onClick={() =>
                    setDemandeSelectionnee(demande)
                  }
                  style={{
                    padding: "10px 18px",
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Consulter le dossier
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* =================================================
          FENÊTRE DU DOSSIER
      ================================================= */}

      {demandeSelectionnee && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              width: "100%",
              maxWidth: "750px",
              maxHeight: "80vh",
              overflowY: "auto",
              borderRadius: "14px",
              padding: "30px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >
            {/* EN-TÊTE */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom:
                  "1px solid #e5e7eb",
                paddingBottom: "18px",
                marginBottom: "25px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#1e293b",
                    fontSize: "25px",
                  }}
                >
                  Dossier{" "}
                  {demandeSelectionnee.numero}
                </h2>

                <p
                  style={{
                    marginTop: "6px",
                    color: "#64748b",
                  }}
                >
                  Détails de la demande
                </p>
              </div>

              <button
                onClick={() =>
                  setDemandeSelectionnee(null)
                }
                style={{
                  border: "none",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
              >
                ×
              </button>
            </div>

            {/* INFORMATIONS */}

            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "20px",
                borderRadius: "10px",
                marginBottom: "18px",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  color: "#1e293b",
                }}
              >
                Informations de la demande
              </h3>

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
                <span
                  style={{
                    ...getStatutStyle(
                      demandeSelectionnee.statut
                    ),
                    padding: "5px 10px",
                    borderRadius: "15px",
                    fontWeight: "600",
                  }}
                >
                  {getStatutLabel(
                    demandeSelectionnee.statut
                  )}
                </span>
              </p>
            </div>

            {/* FICHE SANITAIRE */}

            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "20px",
                borderRadius: "10px",
                marginBottom: "18px",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  color: "#1e293b",
                }}
              >
                Fiche sanitaire
              </h3>

              <p>
                <strong>Présence :</strong>{" "}
                {demandeSelectionnee
                  .fiche_sanitaire?.presente
                  ? "Présente"
                  : "Non présente"}
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

            {/* PROGRESSION */}

            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "20px",
                borderRadius: "10px",
                marginBottom: "18px",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  color: "#1e293b",
                }}
              >
                Progression du dossier
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, 1fr)",
                  gap: "10px",
                }}
              >
                {[1, 2, 3].map((numeroEtape) => (
                  <div
                    key={numeroEtape}
                    style={{
                      padding: "15px",
                      textAlign: "center",
                      borderRadius: "8px",
                      backgroundColor:
                        getEtape(
                          demandeSelectionnee.statut
                        ) >= numeroEtape
                          ? "#dbeafe"
                          : "#e5e7eb",
                      color:
                        getEtape(
                          demandeSelectionnee.statut
                        ) >= numeroEtape
                          ? "#2563eb"
                          : "#64748b",
                    }}
                  >
                    <strong>{numeroEtape}</strong>

                    <div
                      style={{
                        fontSize: "13px",
                        marginTop: "5px",
                      }}
                    >
                      {numeroEtape === 1
                        ? "Dépôt"
                        : numeroEtape === 2
                        ? "Instruction DCUVE"
                        : "Commission"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DÉCISION */}

            {demandeSelectionnee.vote_commission && (
              <div
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  backgroundColor:
                    demandeSelectionnee
                      .vote_commission ===
                    "FAVORABLE"
                      ? "#ecfdf5"
                      : "#fef2f2",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  Décision de la Commission
                </h3>

                <p
                  style={{
                    fontWeight: "600",
                    color:
                      demandeSelectionnee
                        .vote_commission ===
                      "FAVORABLE"
                        ? "#047857"
                        : "#b91c1c",
                  }}
                >
                  {demandeSelectionnee
                    .vote_commission ===
                  "FAVORABLE"
                    ? "✓ Vote favorable"
                    : "✕ Vote défavorable"}
                </p>

                <p>
                  <strong>Décision :</strong>{" "}
                  {demandeSelectionnee.decision ===
                  "VALIDEE"
                    ? "Validée"
                    : "Refusée"}
                </p>
              </div>
            )}

            {/* FERMER */}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() =>
                  setDemandeSelectionnee(null)
                }
                style={{
                  padding: "11px 20px",
                  backgroundColor: "#64748b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "7px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuiviDemande;