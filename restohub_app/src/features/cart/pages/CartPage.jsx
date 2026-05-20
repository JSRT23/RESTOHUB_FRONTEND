// restohub_app/src/features/cart/pages/CartPage.jsx
// Solo MercadoPago — diseño limpio tipo RestoHub

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  swalWarning,
  swalConfirm,
  swalError,
} from "../../../shared/utils/swal";
import { useCart } from "../context/CartContext";
import { useAuth } from "../../../app/auth/AuthContext";

const CREAR_PEDIDO = gql`
  mutation CrearPedido($input: CrearPedidoInput!) {
    crearPedido(input: $input) {
      ok
      error
      pedido {
        id
        total
        estado
      }
    }
  }
`;

const MONEDA_LOCALE = {
  COP: "es-CO",
  MXN: "es-MX",
  PEN: "es-PE",
  ARS: "es-AR",
  USD: "en-US",
};
const fmt = (n, moneda = "COP") =>
  new Intl.NumberFormat(MONEDA_LOCALE[moneda] || "es-CO", {
    style: "currency",
    currency: moneda || "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

const GATEWAY_URL = (
  import.meta.env.VITE_GATEWAY_URL || "http://localhost:8000/api/graphql/"
)
  .replace("/api/graphql/", "")
  .replace("/api/graphql", "");

// ── Iconos ────────────────────────────────────────────────────────────────────
const IconScooter = () => (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path d="M3 12h13l2-5h3" />
    <circle cx="6" cy="17" r="2" />
    <circle cx="18" cy="17" r="2" />
    <path d="M10 17H8M14 17h2M3 12l1-4h7l2 5" />
  </svg>
);
const IconStore = () => (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconTrash = () => (
  <svg
    width="13"
    height="13"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const IconShield = () => (
  <svg
    width="13"
    height="13"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ENVIO_OPTS = [
  {
    id: "domicilio",
    label: "Domicilio",
    desc: "Entrega en tu dirección",
    Icon: IconScooter,
  },
  {
    id: "recoger",
    label: "Recoger",
    desc: "Retiro en el restaurante",
    Icon: IconStore,
  },
];

// Fallback imágenes para platos sin imagen
const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1547592180-85f173990554?w=120&q=80",
  "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=120&q=80",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&q=80",
  "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=120&q=80",
];
const getFallback = (id) =>
  FALLBACK_IMGS[
    parseInt((id || "0").replace(/-/g, "").slice(0, 4), 16) %
      FALLBACK_IMGS.length
  ];

// ── Componente ────────────────────────────────────────────────────────────────
export default function CartPage() {
  const navigate = useNavigate();
  const { items, restauranteId, moneda, add, remove, clear, total, count } =
    useCart();
  const { isAuthenticated, user, token } = useAuth();

  const [envio, setEnvio] = useState("domicilio");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [showResumen, setShowResumen] = useState(false);
  const [loadingMP, setLoadingMP] = useState(false);

  const [crearPedido] = useMutation(CREAR_PEDIDO, { errorPolicy: "ignore" });

  const totalFinal = total;

  // ── Vaciar ────────────────────────────────────────────────────────────────
  const handleClear = async () => {
    const ok = await swalConfirm(
      "¿Vaciar carrito?",
      "Se eliminarán todos los artículos.",
      "Vaciar",
      "Cancelar",
    );
    if (ok) clear();
  };

  // ── Ir a resumen ──────────────────────────────────────────────────────────
  const handleVerResumen = () => {
    if (envio === "domicilio" && !direccion.trim()) {
      swalWarning(
        "Dirección requerida",
        "Por favor ingresa tu dirección de entrega para continuar.",
      );
      return;
    }
    setShowResumen(true);
  };

  // ── Pagar con MercadoPago ─────────────────────────────────────────────────
  const handlePagarMP = async () => {
    setLoadingMP(true);
    try {
      let pedidoId = null;
      try {
        const { data } = await crearPedido({
          variables: {
            input: {
              restauranteId,
              items: items.map((i) => ({
                platoId: i.platoId,
                nombre: i.nombre,
                cantidad: i.cantidad,
                precio: i.precio,
              })),
              tipoEntrega: envio === "domicilio" ? "DOMICILIO" : "RECOGER",
              direccionEntrega: envio === "domicilio" ? direccion : null,
              notas: notas || null,
              moneda,
            },
          },
        });
        if (data?.crearPedido?.ok) pedidoId = data.crearPedido.pedido?.id;
      } catch {
        /* mutation aún no disponible — continúa */
      }

      const res = await fetch(`${GATEWAY_URL}/api/pagos/crear-preferencia/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          pedido_id: pedidoId,
          items: items.map((i) => ({
            title: i.nombre,
            quantity: i.cantidad,
            unit_price: Math.round(i.precio),
            currency_id: moneda || "COP",
          })),
          total: Math.round(totalFinal),
          moneda: moneda || "COP",
          payer_email: user?.email || "",
          tipo_entrega: envio,
          direccion: envio === "domicilio" ? direccion : "",
          notas,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const { init_point } = await res.json();
      if (!init_point) throw new Error("Sin URL de pago");
      window.location.href = init_point;
    } catch (err) {
      console.error("[MP]", err);
      await swalError(
        "Error al procesar pago",
        "No pudimos conectar con el servidor de pagos. Intenta de nuevo.",
      );
    } finally {
      setLoadingMP(false);
    }
  };

  // ── Carrito vacío ─────────────────────────────────────────────────────────
  if (count === 0)
    return (
      <div
        style={{
          paddingTop: "68px",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          textAlign: "center",
          padding: "80px 20px",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            background: "var(--green-dim2)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="36"
            height="36"
            fill="none"
            stroke="var(--green)"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "28px",
            color: "var(--text)",
          }}
        >
          Tu carrito está vacío
        </h2>
        <p
          style={{ color: "var(--text2)", maxWidth: "320px", lineHeight: 1.65 }}
        >
          Explora los restaurantes y agrega los platos que quieras.
        </p>
        <button
          onClick={() => navigate("/")}
          className="btn-green"
          style={{ marginTop: "4px" }}
        >
          Explorar restaurantes
        </button>
      </div>
    );

  // ── Vista resumen antes de pagar ──────────────────────────────────────────
  if (showResumen)
    return (
      <div
        style={{
          paddingTop: "68px",
          minHeight: "100vh",
          background: "var(--bg)",
        }}
      >
        {/* Header */}
        <div style={{ background: "var(--green)", padding: "24px 0" }}>
          <div
            className="container"
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          >
            <button
              onClick={() => setShowResumen(false)}
              style={{
                color: "rgba(255,255,255,.5)",
                background: "none",
                fontSize: "20px",
                cursor: "pointer",
                lineHeight: 1,
                padding: "0 4px",
              }}
            >
              ←
            </button>
            <h1
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "24px",
                color: "#fff",
              }}
            >
              Confirmar pedido
            </h1>
          </div>
        </div>

        <div
          className="container"
          style={{
            paddingTop: "32px",
            paddingBottom: "100px",
            maxWidth: "580px",
          }}
        >
          {/* Tarjeta orden */}
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 2px 20px rgba(0,0,0,.07)",
              marginBottom: "16px",
            }}
          >
            {/* Encabezado orden */}
            <div
              style={{
                background: "var(--green)",
                padding: "22px 28px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,250,202,.55)",
                    fontWeight: 700,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    marginBottom: "5px",
                  }}
                >
                  RestoHub
                </p>
                <h2
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  Orden de pedido
                </h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,.4)",
                    marginBottom: "3px",
                  }}
                >
                  {new Date().toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    background: "rgba(255,250,202,.15)",
                    color: "var(--cream)",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    border: "1px solid rgba(255,250,202,.2)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {envio === "domicilio" ? (
                    <>
                      <svg
                        width="11"
                        height="11"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 12h13l2-5h3" />
                        <circle cx="6" cy="17" r="2" />
                        <circle cx="18" cy="17" r="2" />
                        <path d="M3 12l1-4h7l2 5" />
                      </svg>
                      Domicilio
                    </>
                  ) : (
                    <>
                      <svg
                        width="11"
                        height="11"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      Para recoger
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Lista de productos */}
            <div style={{ padding: "20px 28px 0" }}>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text3)",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                }}
              >
                Artículos
              </p>
              {items.map((item, i) => (
                <div
                  key={item.platoId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    paddingBottom: "14px",
                    marginBottom: "14px",
                    borderBottom:
                      i < items.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  {/* Imagen del plato */}
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "10px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "var(--bg2)",
                    }}
                  >
                    <img
                      src={item.imagen || getFallback(item.platoId)}
                      alt={item.nombre}
                      onError={(e) => {
                        e.target.src = getFallback(item.platoId);
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--text)",
                        marginBottom: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.nombre}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text3)" }}>
                      {item.cantidad} × {fmt(item.precio, moneda)}
                    </p>
                  </div>
                  {/* Precio */}
                  <p
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--text)",
                      flexShrink: 0,
                    }}
                  >
                    {fmt(item.precio * item.cantidad, moneda)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div style={{ padding: "0 28px 20px" }}>
              <div
                style={{
                  borderTop: "1.5px solid var(--border)",
                  paddingTop: "16px",
                }}
              >
                {[
                  ["Subtotal", fmt(total, moneda), false],
                  ["Envío", "Gratis", true],
                ].map(([l, v, g]) => (
                  <div
                    key={l}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "13px", color: "var(--text2)" }}>
                      {l}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: g ? "var(--green)" : "var(--text)",
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
                {envio === "domicilio" && direccion && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      marginBottom: "10px",
                    }}
                  >
                    <svg
                      width="11"
                      height="11"
                      fill="none"
                      stroke="var(--text3)"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--text3)",
                        margin: 0,
                      }}
                    >
                      {direccion}
                    </p>
                  </div>
                )}
                {/* Total final */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "14px",
                    borderTop: "2px solid var(--border)",
                    marginTop: "6px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "26px",
                      fontWeight: 900,
                      color: "var(--green)",
                    }}
                  >
                    {fmt(totalFinal, moneda)}
                  </span>
                </div>
              </div>
            </div>

            {/* Banner MP — verde suave */}
            <div
              style={{
                background: "var(--green-dim2)",
                padding: "14px 28px",
                borderTop: "1px solid rgba(10,56,40,.1)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="var(--green)"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--green-lt)",
                  lineHeight: 1.5,
                }}
              >
                Serás redirigido a{" "}
                <strong style={{ color: "var(--green)" }}>MercadoPago</strong>{" "}
                para completar tu pago. Aceptamos tarjetas, PSE y efectivo.
              </p>
            </div>
          </div>

          {/* Notas */}
          {notas && (
            <div
              style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "14px 20px",
                marginBottom: "16px",
                border: "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text3)",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  marginBottom: "5px",
                }}
              >
                Notas
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text2)",
                  lineHeight: 1.5,
                }}
              >
                {notas}
              </p>
            </div>
          )}

          {/* Botón pagar */}
          <button
            onClick={handlePagarMP}
            disabled={loadingMP}
            style={{
              width: "100%",
              padding: "17px",
              background: loadingMP ? "var(--green-lt)" : "var(--green)",
              border: "none",
              borderRadius: "14px",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              cursor: loadingMP ? "not-allowed" : "pointer",
              fontFamily: "DM Sans, sans-serif",
              letterSpacing: ".03em",
              boxShadow: loadingMP ? "none" : "0 6px 20px rgba(10,56,40,.3)",
              transition: "all .2s",
            }}
          >
            {loadingMP ? (
              <>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    border: "2px solid rgba(255,255,255,.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin .7s linear infinite",
                    display: "inline-block",
                  }}
                />
                Procesando pago...
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="#fffaca"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                  <path d="M6 15h4M16 15h2" />
                </svg>
                Pagar {fmt(totalFinal, moneda)} con MercadoPago
              </>
            )}
          </button>

          {/* Seguridad */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              marginTop: "12px",
            }}
          >
            <svg
              width="12"
              height="12"
              fill="none"
              stroke="var(--text3)"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span style={{ fontSize: "12px", color: "var(--text3)" }}>
              Pago 100% seguro · No guardamos datos de tarjeta
            </span>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  // ── Vista principal carrito ───────────────────────────────────────────────
  return (
    <div
      style={{
        paddingTop: "68px",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* Header */}
      <div style={{ background: "var(--green)", padding: "24px 0" }}>
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              color: "rgba(255,255,255,.5)",
              background: "none",
              fontSize: "20px",
              cursor: "pointer",
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ←
          </button>
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "26px",
              color: "#fff",
            }}
          >
            Tu pedido
          </h1>
          <span
            style={{
              background: "var(--cream)",
              color: "var(--green)",
              fontSize: "11px",
              fontWeight: 800,
              padding: "3px 10px",
              borderRadius: "20px",
            }}
          >
            {count} {count === 1 ? "ítem" : "ítems"}
          </span>
        </div>
      </div>

      <div
        className="container"
        style={{ paddingTop: "32px", paddingBottom: "80px" }}
      >
        <div
          className="cart-layout"
          style={{ display: "grid", gap: "28px", alignItems: "start" }}
        >
          {/* ── IZQUIERDA ── */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "18px" }}
          >
            {/* Ítems */}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "15px 20px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "16px",
                    color: "var(--text)",
                  }}
                >
                  Artículos
                </h3>
                <button
                  onClick={handleClear}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    color: "var(--text3)",
                    background: "none",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid var(--border2)",
                  }}
                >
                  <IconTrash /> Vaciar
                </button>
              </div>
              {items.map((item) => (
                <div
                  key={item.platoId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {/* Imagen */}
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "10px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "var(--bg2)",
                    }}
                  >
                    <img
                      src={item.imagen || getFallback(item.platoId)}
                      alt={item.nombre}
                      onError={(e) => {
                        e.target.src = getFallback(item.platoId);
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        fontFamily: "Playfair Display, serif",
                        fontSize: "14px",
                        color: "var(--text)",
                        marginBottom: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.nombre}
                    </h4>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--green)",
                        fontWeight: 600,
                      }}
                    >
                      {fmt(item.precio, moneda)}
                    </p>
                  </div>
                  {/* Cantidad */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <button
                      onClick={() => remove(item.platoId)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "7px",
                        background: "var(--bg2)",
                        border: "1px solid var(--border2)",
                        color: "var(--text)",
                        fontSize: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "14px",
                        minWidth: "22px",
                        textAlign: "center",
                        color: "var(--text)",
                      }}
                    >
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() =>
                        add(
                          {
                            id: item.platoId,
                            nombre: item.nombre,
                            imagen: item.imagen,
                          },
                          item.precio,
                          restauranteId,
                          moneda,
                        )
                      }
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "7px",
                        background: "var(--green-dim2)",
                        border: "1px solid rgba(10,56,40,.2)",
                        color: "var(--green)",
                        fontSize: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      +
                    </button>
                  </div>
                  {/* Subtotal */}
                  <p
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontWeight: 700,
                      color: "var(--text)",
                      fontSize: "14px",
                      minWidth: "80px",
                      textAlign: "right",
                    }}
                  >
                    {fmt(item.precio * item.cantidad, moneda)}
                  </p>
                </div>
              ))}
            </div>

            {/* Tipo entrega */}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "15px 20px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "16px",
                    color: "var(--text)",
                  }}
                >
                  Tipo de entrega
                </h3>
              </div>
              <div
                style={{ padding: "14px 20px", display: "flex", gap: "10px" }}
              >
                {ENVIO_OPTS.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setEnvio(op.id)}
                    style={{
                      flex: 1,
                      padding: "14px 10px",
                      background:
                        envio === op.id ? "var(--green-dim2)" : "var(--bg2)",
                      border: `1.5px solid ${envio === op.id ? "rgba(10,56,40,.3)" : "var(--border2)"}`,
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "center",
                      color: envio === op.id ? "var(--green)" : "var(--text2)",
                      transition: "all .15s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "5px",
                      }}
                    >
                      <op.Icon />
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        fontFamily: "DM Sans, sans-serif",
                      }}
                    >
                      {op.label}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text3)",
                        marginTop: "2px",
                      }}
                    >
                      {op.desc}
                    </div>
                  </button>
                ))}
              </div>
              {envio === "domicilio" && (
                <div style={{ padding: "0 20px 14px" }}>
                  <input
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ingresa tu dirección de entrega..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--bg2)",
                      border: "1.5px solid var(--border2)",
                      borderRadius: "10px",
                      color: "var(--text)",
                      fontSize: "13px",
                      fontFamily: "DM Sans, sans-serif",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "var(--green)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border2)")
                    }
                  />
                </div>
              )}
            </div>

            {/* Notas */}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "15px 20px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "16px",
                    color: "var(--text)",
                  }}
                >
                  Notas{" "}
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--text3)",
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: 400,
                    }}
                  >
                    (opcional)
                  </span>
                </h3>
              </div>
              <div style={{ padding: "12px 20px" }}>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Alergias, preferencias, instrucciones especiales..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "var(--bg2)",
                    border: "1.5px solid var(--border2)",
                    borderRadius: "10px",
                    color: "var(--text)",
                    fontSize: "13px",
                    fontFamily: "DM Sans, sans-serif",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--green)")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--border2)")
                  }
                />
              </div>
            </div>
          </div>

          {/* ── DERECHA sticky ── */}
          <div style={{ position: "sticky", top: "88px" }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
              }}
            >
              <div style={{ background: "var(--green)", padding: "16px 22px" }}>
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "17px",
                    color: "#fff",
                  }}
                >
                  Resumen
                </h3>
              </div>
              <div style={{ padding: "18px 22px" }}>
                {/* Items resumen */}
                <div style={{ marginBottom: "14px" }}>
                  {items.map((item) => (
                    <div
                      key={item.platoId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "7px",
                        fontSize: "12px",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text2)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "160px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: "var(--text)",
                            marginRight: "4px",
                          }}
                        >
                          {item.cantidad}×
                        </span>
                        {item.nombre}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--text)",
                          flexShrink: 0,
                          marginLeft: "8px",
                        }}
                      >
                        {fmt(item.precio * item.cantidad, moneda)}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: "12px",
                  }}
                >
                  {[
                    [`Subtotal (${count})`, fmt(total, moneda), false],
                    ["Envío", "Gratis", true],
                    [
                      "Entrega",
                      ENVIO_OPTS.find((o) => o.id === envio)?.label,
                      false,
                    ],
                  ].map(([l, v, g]) => (
                    <div
                      key={l}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                        fontSize: "13px",
                        color: "var(--text2)",
                      }}
                    >
                      <span>{l}</span>
                      <span
                        style={
                          g ? { color: "var(--green)", fontWeight: 600 } : {}
                        }
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderTop: "2px solid var(--border)",
                    marginBottom: "16px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "var(--green)",
                    }}
                  >
                    {fmt(total, moneda)}
                  </span>
                </div>

                {/* CTA */}
                {isAuthenticated ? (
                  <button
                    onClick={handleVerResumen}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: "var(--green)",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor: "pointer",
                      fontFamily: "DM Sans, sans-serif",
                      transition: "all .2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--green3)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "var(--green)")
                    }
                  >
                    Ver resumen y pagar →
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/login")}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: "var(--green)",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    Ingresar para pedir
                  </button>
                )}

                {/* MP badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    marginTop: "10px",
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    fill="none"
                    stroke="var(--green-lt)"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <span style={{ fontSize: "11px", color: "var(--text3)" }}>
                    Pago seguro con MercadoPago
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cart-layout { grid-template-columns: 1fr 360px; }
        @media (max-width: 900px) { .cart-layout { grid-template-columns: 1fr !important; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
