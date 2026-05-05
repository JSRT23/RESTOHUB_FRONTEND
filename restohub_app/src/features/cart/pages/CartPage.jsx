import { useState } from "react";
import { swalWarning } from "../../../shared/utils/swal";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../../../app/auth/AuthContext";

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

// Iconos SVG inline — sin emojis
const IconScooter = () => (
  <svg
    width="22"
    height="22"
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
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconCash = () => (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);
const IconCard = () => (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const IconPhone = () => (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line
      x1="12"
      y1="18"
      x2="12"
      y2="18"
      strokeLinecap="round"
      strokeWidth="2"
    />
  </svg>
);
const IconCheck = () => (
  <svg
    width="32"
    height="32"
    fill="none"
    stroke="var(--green)"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const IconTrash = () => (
  <svg
    width="14"
    height="14"
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
const PAGO_OPTS = [
  { id: "efectivo", label: "Efectivo", Icon: IconCash },
  { id: "tarjeta", label: "Tarjeta débito/crédito", Icon: IconCard },
  { id: "transferencia", label: "Transferencia / PSE", Icon: IconPhone },
];

export default function CartPage() {
  const navigate = useNavigate();
  const { items, restauranteId, moneda, add, remove, clear, total, count } =
    useCart();
  const { isAuthenticated } = useAuth();

  const [envio, setEnvio] = useState("domicilio");
  const [pago, setPago] = useState("efectivo");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [pedidoOk, setPedidoOk] = useState(false);

  const totalFinal = total;

  const handleConfirmar = () => {
    if (envio === "domicilio" && !direccion.trim()) {
      swalWarning(
        "Dirección requerida",
        "Por favor ingresa tu dirección de entrega para continuar.",
      );
      return;
      return;
    }
    setPedidoOk(true);
  };

  // ── Pedido confirmado ─────────────────────────────────────────────────────
  if (pedidoOk)
    return (
      <div
        style={{
          paddingTop: "68px",
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "48px 32px",
            background: "#fff",
            borderRadius: "var(--r-lg)",
            border: "1px solid var(--border)",
            maxWidth: "420px",
            width: "100%",
            animation: "fadeUp 0.4s ease",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              background: "var(--green-dim2)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <IconCheck />
          </div>
          <h2
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "26px",
              color: "var(--text)",
              marginBottom: "10px",
            }}
          >
            ¡Pedido recibido!
          </h2>
          <p
            style={{
              color: "var(--text2)",
              lineHeight: 1.65,
              marginBottom: "6px",
            }}
          >
            {envio === "domicilio"
              ? `Lo llevamos a: ${direccion}`
              : "Puedes pasar a retirarlo pronto."}
          </p>
          <p
            style={{
              color: "var(--text3)",
              fontSize: "13px",
              marginBottom: "24px",
            }}
          >
            Pago: {PAGO_OPTS.find((p) => p.id === pago)?.label}
          </p>
          <p
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--green)",
              marginBottom: "28px",
            }}
          >
            {fmt(totalFinal, moneda)}
          </p>
          <button
            onClick={() => {
              clear();
              navigate("/");
            }}
            className="btn-green"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );

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
          gap: "14px",
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
            fontSize: "30px",
            color: "var(--text)",
          }}
        >
          Tu carrito está vacío
        </h2>
        <p
          style={{ color: "var(--text2)", maxWidth: "340px", lineHeight: 1.65 }}
        >
          Explora los restaurantes y agrega los platos que quieras.
        </p>
        <button
          onClick={() => navigate("/")}
          className="btn-green"
          style={{ marginTop: "6px" }}
        >
          Explorar restaurantes
        </button>
      </div>
    );

  // ── Carrito con ítems ─────────────────────────────────────────────────────
  return (
    <div
      style={{
        paddingTop: "68px",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* Header */}
      <div style={{ background: "var(--green)", padding: "28px 0" }}>
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              color: "rgba(255,255,255,0.5)",
              background: "none",
              fontSize: "18px",
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            ←
          </button>
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "28px",
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
            {count} ítems
          </span>
        </div>
      </div>

      <div
        className="container"
        style={{ paddingTop: "36px", paddingBottom: "80px" }}
      >
        <div
          className="cart-layout"
          style={{
            display: "grid",
            gap: "28px",
            alignItems: "start",
          }}
        >
          {/* ── IZQUIERDA ── */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
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
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "17px",
                    color: "var(--text)",
                  }}
                >
                  Artículos
                </h3>
                <button
                  onClick={clear}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    color: "var(--text3)",
                    background: "none",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
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
                    gap: "14px",
                    padding: "14px 20px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {item.imagen && (
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "10px",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        fontFamily: "Playfair Display, serif",
                        fontSize: "14px",
                        color: "var(--text)",
                        marginBottom: "3px",
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
                      {fmt(item.precio, moneda)} c/u
                    </p>
                  </div>
                  {/* Controles cantidad */}
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
                        width: 30,
                        height: 30,
                        borderRadius: "8px",
                        background: "var(--bg2)",
                        border: "1px solid var(--border2)",
                        color: "var(--text)",
                        fontSize: "18px",
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
                        fontSize: "15px",
                        minWidth: "24px",
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
                        width: 30,
                        height: 30,
                        borderRadius: "8px",
                        background: "var(--green-dim2)",
                        border: "1px solid rgba(10,56,40,0.2)",
                        color: "var(--green)",
                        fontSize: "18px",
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
                  <p
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontWeight: 700,
                      color: "var(--text)",
                      fontSize: "15px",
                      minWidth: "90px",
                      textAlign: "right",
                    }}
                  >
                    {fmt(item.precio * item.cantidad, moneda)}
                  </p>
                </div>
              ))}
            </div>

            {/* Tipo de entrega */}
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
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "17px",
                    color: "var(--text)",
                  }}
                >
                  Tipo de entrega
                </h3>
              </div>
              <div
                style={{ padding: "16px 20px", display: "flex", gap: "12px" }}
              >
                {ENVIO_OPTS.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setEnvio(op.id)}
                    style={{
                      flex: 1,
                      padding: "16px 12px",
                      background:
                        envio === op.id ? "var(--green-dim2)" : "var(--bg2)",
                      border: `1.5px solid ${envio === op.id ? "rgba(10,56,40,0.35)" : "var(--border2)"}`,
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s",
                      color: envio === op.id ? "var(--green)" : "var(--text2)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "6px",
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
                <div style={{ padding: "0 20px 16px" }}>
                  <input
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ingresa tu dirección de entrega..."
                    style={{
                      width: "100%",
                      padding: "11px 14px",
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

            {/* Método de pago */}
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
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "17px",
                    color: "var(--text)",
                  }}
                >
                  Método de pago
                </h3>
              </div>
              <div
                style={{
                  padding: "12px 20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {PAGO_OPTS.map((op) => (
                  <label
                    key={op.id}
                    onClick={() => setPago(op.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 14px",
                      background:
                        pago === op.id ? "var(--green-dim2)" : "var(--bg2)",
                      border: `1.5px solid ${pago === op.id ? "rgba(10,56,40,0.3)" : "var(--border2)"}`,
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      color: pago === op.id ? "var(--green)" : "var(--text)",
                    }}
                  >
                    <input
                      type="radio"
                      name="pago"
                      value={op.id}
                      checked={pago === op.id}
                      onChange={() => setPago(op.id)}
                      style={{ accentColor: "var(--green)" }}
                    />
                    <op.Icon />
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        fontFamily: "DM Sans, sans-serif",
                      }}
                    >
                      {op.label}
                    </span>
                  </label>
                ))}
              </div>
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
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "17px",
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
              <div style={{ padding: "14px 20px" }}>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Alergias, preferencias, instrucciones especiales..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
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

          {/* ── DERECHA: resumen sticky ── */}
          <div style={{ position: "sticky", top: "88px" }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
              }}
            >
              <div style={{ background: "var(--green)", padding: "18px 22px" }}>
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "18px",
                    color: "#fff",
                  }}
                >
                  Resumen del pedido
                </h3>
              </div>
              <div style={{ padding: "18px 22px" }}>
                {/* Desglose por ítem */}
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
                          maxWidth: "170px",
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "7px",
                      fontSize: "13px",
                      color: "var(--text2)",
                    }}
                  >
                    <span>Subtotal ({count} ítems)</span>
                    <span>{fmt(total, moneda)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "7px",
                      fontSize: "13px",
                      color: "var(--text2)",
                    }}
                  >
                    <span>Envío</span>
                    <span style={{ color: "var(--green)", fontWeight: 600 }}>
                      Gratis
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "5px",
                      fontSize: "12px",
                      color: "var(--text3)",
                    }}
                  >
                    <span>Entrega</span>
                    <span>{ENVIO_OPTS.find((o) => o.id === envio)?.label}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                      fontSize: "12px",
                      color: "var(--text3)",
                    }}
                  >
                    <span>Pago</span>
                    <span>{PAGO_OPTS.find((o) => o.id === pago)?.label}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "14px 0",
                    borderTop: "2px solid var(--border)",
                    marginBottom: "16px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "21px",
                      fontWeight: 700,
                      color: "var(--green)",
                    }}
                  >
                    {fmt(totalFinal, moneda)}
                  </span>
                </div>

                <button
                  onClick={
                    isAuthenticated ? handleConfirmar : () => navigate("/login")
                  }
                  className="btn-cream"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "14px",
                  }}
                >
                  {isAuthenticated ? "Confirmar pedido" : "Ingresar para pedir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Responsive styles */}
      <style>{`
        .cart-layout { grid-template-columns: 1fr 380px; }
        @media (max-width: 900px) {
          .cart-layout { grid-template-columns: 1fr !important; }
          .cart-sticky { position: static !important; }
        }
      `}</style>
    </div>
  );
}
