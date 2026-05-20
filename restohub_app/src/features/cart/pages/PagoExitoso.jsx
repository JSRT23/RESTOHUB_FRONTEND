// restohub_app/src/features/cart/pages/PagoExitoso.jsx
// Al cargar: limpia carrito + dispara email de confirmación al gateway

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../../../app/auth/AuthContext";

const GATEWAY_URL = (
  import.meta.env.VITE_GATEWAY_URL || "http://localhost:8000/api/graphql/"
)
  .replace("/api/graphql/", "")
  .replace("/api/graphql", "");

const fmt = (n, moneda = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function PagoExitoso() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { clear, items, total, moneda } = useCart();
  const { user, token } = useAuth();
  const [emailEnviado, setEmailEnviado] = useState(false);

  const paymentId = params.get("payment_id");
  const status = params.get("status");
  const externalRef = params.get("external_reference");
  const isApproved =
    status === "approved" || status === "accredited" || !status;

  useEffect(() => {
    // 1. Enviar email de confirmación
    const enviarEmail = async () => {
      if (emailEnviado) return;
      try {
        await fetch(`${GATEWAY_URL}/api/pagos/email-confirmacion/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            payment_id: paymentId,
            pedido_id: externalRef,
            email: user?.email || "",
            nombre: user?.nombre || "",
            items: items.map((i) => ({
              nombre: i.nombre,
              cantidad: i.cantidad,
              precio: i.precio,
              imagen: i.imagen,
            })),
            total: total,
            moneda: moneda || "COP",
          }),
        });
        setEmailEnviado(true);
      } catch {
        /* falla silenciosamente */
      }
    };

    if (isApproved) enviarEmail();

    // 2. Limpiar carrito
    clear();
  }, []);

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
          maxWidth: "460px",
          width: "100%",
          boxShadow: "0 8px 32px rgba(10,56,40,.08)",
          animation: "fadeUp .4s ease",
        }}
      >
        {/* Ícono */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: isApproved
              ? "rgba(10,56,40,.1)"
              : "rgba(245,158,11,.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          {isApproved ? (
            <svg
              width="34"
              height="34"
              fill="none"
              stroke="var(--green)"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg
              width="34"
              height="34"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>

        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "26px",
            color: isApproved ? "var(--green)" : "#B45309",
            marginBottom: "10px",
          }}
        >
          {isApproved ? "¡Pago exitoso!" : "Pago pendiente"}
        </h2>

        <p
          style={{
            color: "var(--text2)",
            lineHeight: 1.65,
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          {isApproved
            ? "Tu pedido está confirmado. Recibirás un resumen por correo."
            : "Tu pago está siendo procesado. Te notificaremos cuando se confirme."}
        </p>

        {paymentId && (
          <div
            style={{
              background: "var(--bg2)",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "24px",
              border: "1px solid var(--border)",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                color: "var(--text3)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".08em",
                marginBottom: "4px",
              }}
            >
              Referencia de pago
            </p>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text)",
                fontFamily: "monospace",
              }}
            >
              #{paymentId}
            </p>
          </div>
        )}

        {isApproved && user?.email && (
          <p
            style={{
              fontSize: "12px",
              color: "var(--text3)",
              marginBottom: "20px",
            }}
          >
            📧 Resumen enviado a <strong>{user.email}</strong>
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={() => navigate("/")}
            className="btn-green"
            style={{ width: "100%", justifyContent: "center", padding: "14px" }}
          >
            Volver al inicio
          </button>
          <button
            onClick={() => navigate("/perfil?tab=dashboard")}
            style={{
              width: "100%",
              padding: "12px",
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
            Ver mis pedidos
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
