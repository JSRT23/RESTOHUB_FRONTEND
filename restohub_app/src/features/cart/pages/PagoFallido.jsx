// restohub_app/src/features/cart/pages/PagoFallido.jsx
// Página de retorno cuando MercadoPago cancela o falla el pago
// URL: /pago-fallido

import { useNavigate } from "react-router-dom";

export default function PagoFallido() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        paddingTop: "68px",
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "48px 32px",
          background: "#fff",
          borderRadius: "24px",
          border: "1px solid var(--border)",
          maxWidth: "440px",
          width: "100%",
          animation: "fadeUp .4s ease",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(220,38,38,.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg
            width="36"
            height="36"
            fill="none"
            stroke="#DC2626"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "26px",
            color: "#DC2626",
            marginBottom: "10px",
          }}
        >
          Pago cancelado
        </h2>
        <p
          style={{
            color: "var(--text2)",
            lineHeight: 1.65,
            marginBottom: "28px",
          }}
        >
          No se realizó ningún cobro. Puedes intentarlo de nuevo cuando quieras.
        </p>
        <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
          <button
            onClick={() => navigate("/carrito")}
            className="btn-green"
            style={{ width: "100%", justifyContent: "center", padding: "14px" }}
          >
            Volver al carrito
          </button>
          <button
            onClick={() => navigate("/")}
            style={{
              width: "100%",
              padding: "13px",
              background: "transparent",
              border: "1.5px solid var(--border2)",
              borderRadius: "12px",
              color: "var(--text2)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            Ir al inicio
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
