import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/contrats";

function Paiement() {
  const [contrat, setContrat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  // =====================================================
  // CHARGEMENT DES DONNÉES
  // =====================================================

  useEffect(() => {
    let annule = false;

    const chargerPaiement = async () => {
      try {
        const response = await axios.get(API_URL);

        console.log("Données paiement :", response.data);

        const contrats = response.data.contrats || [];

        if (annule) {
          return;
        }

        if (contrats.length === 0) {
          setContrat(null);
          setError("Aucun contrat trouvé.");
          setLoading(false);
          return;
        }

        setContrat(contrats[0]);
        setError("");
        setLoading(false);
      } catch (err) {
        if (annule) {
          return;
        }

        console.error("Erreur paiement :", err);

        setError(
          "Impossible de charger les informations de paiement."
        );

        setLoading(false);
      }
    };

    chargerPaiement();

    return () => {
      annule = true;
    };
  }, [reload]);

  // =====================================================
  // ACTUALISER
  // =====================================================

  const actualiser = () => {
    setLoading(true);
    setError("");
    setReload((ancienneValeur) => ancienneValeur + 1);
  };

  // =====================================================
  // FORMATAGE DU MONTANT
  // =====================================================

  const formatMontant = (montant) => {
    return (
      new Intl.NumberFormat("fr-FR").format(montant || 0) +
      " FCFA"
    );
  };

  const paiement = contrat?.paiement;

  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          color: "#64748b",
        }}
      >
        Chargement des paiements...
      </div>
    );
  }

  // =====================================================
  // ERREUR
  // =====================================================

  if (error) {
    return (
      <div
        style={{
          padding: "35px",
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            padding: "20px",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "10px",
          }}
        >
          <strong>Erreur</strong>

          <p>{error}</p>

          <button
            onClick={actualiser}
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
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // AUCUN CONTRAT
  // =====================================================

  if (!contrat) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
          padding: "35px",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "30px",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#1e293b" }}>
            Aucun contrat disponible
          </h2>

          <button
            onClick={actualiser}
            style={{
              padding: "11px 20px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "7px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Actualiser
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "35px",
      }}
    >
      {/* EN-TÊTE */}

      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "32px",
            fontWeight: "500",
            color: "#1e293b",
          }}
        >
          Paiements
        </h1>

        <p
          style={{
            marginTop: "8px",
            color: "#64748b",
          }}
        >
          Consultez et gérez vos paiements de contrat
        </p>
      </div>

      {/* INFORMATIONS DU CONTRAT */}

      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "25px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#1e293b",
          }}
        >
          Contrat concerné
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <div>
            <strong>Numéro du contrat</strong>

            <p style={{ color: "#475569" }}>
              {contrat.numero}
            </p>
          </div>

          <div>
            <strong>Occupant</strong>

            <p style={{ color: "#475569" }}>
              {contrat.occupant}
            </p>
          </div>

          <div>
            <strong>Boutique</strong>

            <p style={{ color: "#475569" }}>
              {contrat.boutique}
            </p>
          </div>

          <div>
            <strong>Montant mensuel</strong>

            <p
              style={{
                color: "#2563eb",
                fontWeight: "600",
              }}
            >
              {formatMontant(contrat.montant_mensuel)}
            </p>
          </div>
        </div>
      </div>

      {/* SITUATION DU PAIEMENT */}

      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "25px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#1e293b",
            }}
          >
            Situation du paiement
          </h2>

          <span
            style={{
              padding: "8px 15px",
              borderRadius: "20px",
              backgroundColor:
                paiement?.statut === "A_JOUR"
                  ? "#d1fae5"
                  : "#fee2e2",
              color:
                paiement?.statut === "A_JOUR"
                  ? "#047857"
                  : "#b91c1c",
              fontWeight: "600",
              fontSize: "13px",
            }}
          >
            {paiement?.statut === "A_JOUR"
              ? "À jour"
              : paiement?.statut}
          </span>
        </div>

        {/* CARTES */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginTop: "25px",
          }}
        >
          {/* Montant mensuel */}

          <div
            style={{
              padding: "22px",
              backgroundColor: "#f8fafc",
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#64748b",
              }}
            >
              Montant mensuel
            </p>

            <h2
              style={{
                marginTop: "10px",
                color: "#1e293b",
              }}
            >
              {formatMontant(contrat.montant_mensuel)}
            </h2>
          </div>

          {/* Montant payé */}

          <div
            style={{
              padding: "22px",
              backgroundColor: "#ecfdf5",
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#047857",
              }}
            >
              Montant payé
            </p>

            <h2
              style={{
                marginTop: "10px",
                color: "#047857",
              }}
            >
              {formatMontant(paiement?.montant_paye)}
            </h2>
          </div>

          {/* Reste à payer */}

          <div
            style={{
              padding: "22px",
              backgroundColor: "#eff6ff",
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#2563eb",
              }}
            >
              Reste à payer
            </p>

            <h2
              style={{
                marginTop: "10px",
                color: "#2563eb",
              }}
            >
              {formatMontant(
                Math.max(
                  0,
                  (contrat.montant_mensuel || 0) -
                    (paiement?.montant_paye || 0)
                )
              )}
            </h2>
          </div>
        </div>
      </div>

      {/* PROCHAINE ÉCHÉANCE */}

      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "25px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#1e293b",
          }}
        >
          Prochaine échéance
        </h2>

        <div
          style={{
            marginTop: "20px",
            padding: "25px",
            backgroundColor: "#eff6ff",
            borderRadius: "10px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#64748b",
            }}
          >
            Date de la prochaine échéance
          </p>

          <h2
            style={{
              marginTop: "10px",
              color: "#2563eb",
            }}
          >
            {paiement?.prochaine_echeance ||
              "Non renseignée"}
          </h2>

          <p
            style={{
              color: "#64748b",
            }}
          >
            Montant à régler :{" "}
            <strong>
              {formatMontant(contrat.montant_mensuel)}
            </strong>
          </p>
        </div>
      </div>

      {/* HISTORIQUE */}

      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "25px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#1e293b",
          }}
        >
          Historique des paiements
        </h2>

        <div
          style={{
            marginTop: "20px",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr 1fr 1fr",
              padding: "16px",
              backgroundColor: "#f8fafc",
              fontWeight: "600",
              color: "#475569",
            }}
          >
            <span>Date</span>
            <span>Montant</span>
            <span>Statut</span>
            <span>Contrat</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr 1fr 1fr",
              padding: "18px 16px",
              borderTop: "1px solid #e2e8f0",
              color: "#475569",
            }}
          >
            <span>Paiement enregistré</span>

            <strong
              style={{
                color: "#047857",
              }}
            >
              {formatMontant(paiement?.montant_paye)}
            </strong>

            <span
              style={{
                color: "#047857",
                fontWeight: "600",
              }}
            >
              {paiement?.statut === "A_JOUR"
                ? "Payé"
                : paiement?.statut}
            </span>

            <span>{contrat.numero}</span>
          </div>
        </div>
      </div>

      {/* BOUTONS */}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          gap: "15px",
        }}
      >
        <button
          onClick={() => {
            window.location.href = "/espace-occupant";
          }}
          style={{
            padding: "12px 20px",
            backgroundColor: "#64748b",
            color: "#ffffff",
            border: "none",
            borderRadius: "7px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Retour à mon espace
        </button>

        <button
          onClick={actualiser}
          style={{
            padding: "12px 20px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "7px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Actualiser
        </button>
      </div>
    </div>
  );
}

export default Paiement;