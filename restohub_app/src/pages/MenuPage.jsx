import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { RESTAURANTS, MENUS } from "../data/restaurants";

const CURRENCY_LABELS = {
  COP: "COP",
  MXN: "MXN",
  PEN: "PEN",
  ARS: "ARS",
  USD: "USD",
};

function fmtPrecio(precio, moneda) {
  const locales = { COP: "es-CO", MXN: "es-MX", PEN: "es-PE", ARS: "es-AR" };
  return new Intl.NumberFormat(locales[moneda] || "es-CO", {
    style: "currency",
    currency: moneda || "COP",
    maximumFractionDigits: 0,
  }).format(precio);
}

export default function MenuPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add, count, total } = useCart();
  const [activeTab, setActiveTab] = useState(0);
  const [addedIds, setAddedIds] = useState({});

  const rest = RESTAURANTS.find((r) => r.id === id);
  const menuData = MENUS[id];

  // Redirige si no tiene menú
  if (!rest)
    return (
      <div
        style={{
          paddingTop: "68px",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          background: "var(--bg)",
        }}
      >
        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "28px",
            color: "var(--text)",
          }}
        >
          Restaurante no encontrado
        </h2>
        <button onClick={() => navigate("/")} className="btn-green">
          Volver al inicio
        </button>
      </div>
    );

  if (!rest.tieneMenu)
    return (
      <div
        style={{
          paddingTop: "68px",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          background: "var(--bg)",
          textAlign: "center",
          padding: "80px 20px",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--green-dim2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="28"
            height="28"
            fill="none"
            stroke="var(--green)"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "28px",
            color: "var(--text)",
          }}
        >
          Menú en preparación
        </h2>
        <p
          style={{ color: "var(--text2)", maxWidth: "340px", lineHeight: 1.65 }}
        >
          <strong>{rest.nombre}</strong> estará disponible muy pronto en
          RestoHub. ¡Vuelve a visitarnos!
        </p>
        <button onClick={() => navigate("/")} className="btn-green">
          Ver otros restaurantes
        </button>
      </div>
    );

  const moneda = menuData?.moneda || "COP";

  const handleAdd = (plato) => {
    const ok = add(plato, plato.precio, id);
    if (!ok) {
      alert("Ya tienes artículos de otro restaurante en el carrito.");
      return;
    }
    setAddedIds((p) => ({ ...p, [plato.id]: true }));
    setTimeout(() => setAddedIds((p) => ({ ...p, [plato.id]: false })), 1200);
  };

  const cartTotal = fmtPrecio(total, moneda);

  return (
    <div
      style={{
        paddingTop: "68px",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* Hero */}
      <div
        style={{
          position: "relative",
          height: "300px",
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `url('${rest.imagen}') center/cover`,
            filter: "brightness(0.3)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, var(--green2) 0%, rgba(7,45,32,0.45) 55%, transparent 100%)",
          }}
        />
        <div
          className="container"
          style={{ position: "relative", paddingBottom: "32px" }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "rgba(255,255,255,0.5)",
              fontSize: "13px",
              fontWeight: 500,
              background: "none",
              marginBottom: "10px",
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            ← Volver
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "clamp(26px,5vw,40px)",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {rest.nombre}
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "13px",
                  marginTop: "5px",
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  📍 {rest.ciudad}, {rest.pais}
                </span>
                <span
                  style={{
                    color: rest.activo ? "var(--cream)" : "#fecaca",
                    fontWeight: 600,
                  }}
                >
                  ● {rest.activo ? "Abierto ahora" : "Cerrado"}
                </span>
                <span>
                  ⭐ {rest.calificacion} ({rest.reseñas} reseñas)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          position: "sticky",
          top: "68px",
          zIndex: 100,
          background: "#fff",
          borderBottom: "2px solid var(--bg3)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <div className="container">
          <div style={{ display: "flex", gap: "2px", overflowX: "auto" }}>
            {menuData?.categorias.map((cat, i) => (
              <button
                key={cat.nombre}
                onClick={() => setActiveTab(i)}
                style={{
                  padding: "15px 22px",
                  background: "none",
                  borderBottom: `2px solid ${activeTab === i ? "var(--green)" : "transparent"}`,
                  color: activeTab === i ? "var(--green)" : "var(--text2)",
                  fontSize: "13px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {cat.nombre}
                <span
                  style={{
                    marginLeft: "6px",
                    fontSize: "11px",
                    color: activeTab === i ? "var(--green-lt)" : "var(--text3)",
                  }}
                >
                  ({cat.platos.length})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Platos */}
      <div
        className="container"
        style={{ paddingTop: "36px", paddingBottom: "110px" }}
      >
        <div style={{ display: "grid", gap: "14px", maxWidth: "780px" }}>
          {menuData?.categorias[activeTab]?.platos.map((plato, i) => (
            <div
              key={plato.id}
              style={{
                display: "flex",
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: "var(--r)",
                overflow: "hidden",
                animation: `fadeUp 0.4s ${i * 0.05}s ease both`,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(10,56,40,0.22)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(10,56,40,0.07)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {plato.imagen && (
                <div
                  style={{ width: "140px", flexShrink: 0, overflow: "hidden" }}
                >
                  <img
                    src={plato.imagen}
                    alt={plato.nombre}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.5s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.transform = "scale(1.06)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.transform = "scale(1)")
                    }
                  />
                </div>
              )}
              <div
                style={{
                  flex: 1,
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: "5px",
                    }}
                  >
                    {plato.nombre}
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text2)",
                      lineHeight: 1.55,
                    }}
                  >
                    {plato.descripcion}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "14px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "var(--green)",
                    }}
                  >
                    {fmtPrecio(plato.precio, moneda)}
                  </span>
                  <button
                    onClick={() => handleAdd(plato)}
                    style={{
                      padding: "9px 22px",
                      background: addedIds[plato.id]
                        ? "var(--green3)"
                        : "var(--green)",
                      color: "#fff",
                      borderRadius: "9px",
                      fontSize: "12px",
                      fontWeight: 700,
                      transition: "all 0.2s",
                      fontFamily: "DM Sans, sans-serif",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {addedIds[plato.id] ? "✓ Agregado" : "Agregar +"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carrito flotante */}
      {count > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "22px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            animation: "fadeUp 0.3s ease",
          }}
        >
          <button
            onClick={() => navigate("/carrito")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "13px 28px",
              background: "var(--green)",
              borderRadius: "50px",
              boxShadow: "0 8px 32px rgba(10,56,40,0.4)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "13px",
              fontFamily: "DM Sans, sans-serif",
              cursor: "pointer",
              border: "2px solid rgba(255,250,202,0.2)",
            }}
          >
            <span
              style={{
                background: "var(--cream)",
                color: "var(--green)",
                width: 22,
                height: 22,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 900,
              }}
            >
              {count}
            </span>
            Ver carrito — {cartTotal}
          </button>
        </div>
      )}
    </div>
  );
}
