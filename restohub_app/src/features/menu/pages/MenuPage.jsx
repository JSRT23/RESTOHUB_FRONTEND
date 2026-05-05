import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { useCart } from "../../cart/context/CartContext";
import {
  GET_RESTAURANTE,
  GET_PLATOS_RESTAURANTE,
  GET_MENU_RESTAURANTE,
} from "../queries";
import { swalWarning, swalConfirm } from "../../../shared/utils/swal";

const MONEDA_LOCALE = {
  COP: "es-CO",
  MXN: "es-MX",
  PEN: "es-PE",
  ARS: "es-AR",
  USD: "en-US",
};
const fmt = (precio, moneda = "COP") =>
  new Intl.NumberFormat(MONEDA_LOCALE[moneda] || "es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(Number(precio) || 0);

const FALLBACK_FOOD = [
  "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=90",
  "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=500&q=90",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=90",
  "https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=500&q=90",
  "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&q=90",
  "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=90",
];
const getFoodImg = (id) => {
  if (!id) return FALLBACK_FOOD[0];
  return FALLBACK_FOOD[
    parseInt(id.replace(/-/g, "").slice(0, 6), 16) % FALLBACK_FOOD.length
  ];
};

export default function MenuPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add, clear: clearCart, count, total } = useCart();
  const [activeTab, setActiveTab] = useState(0);
  const [modalPlato, setModalPlato] = useState(null);
  const [addedIds, setAddedIds] = useState({});

  // Query 1: datos del restaurante
  const { data: restData, loading: restLoading } = useQuery(GET_RESTAURANTE, {
    variables: { id },
  });

  // Query 2: intentar platos directos (con categoría real)
  const { data: platosData, loading: platosLoading } = useQuery(
    GET_PLATOS_RESTAURANTE,
    {
      variables: { restauranteId: id },
      errorPolicy: "ignore", // si el gateway no soporta estos args, fallback al menú
    },
  );

  // Query 3: menú agrupado (fallback)
  const { data: menuData, loading: menuLoading } = useQuery(
    GET_MENU_RESTAURANTE,
    {
      variables: { restauranteId: id },
    },
  );

  const loading = restLoading || (platosLoading && menuLoading);
  const rest = restData?.restaurante;
  const moneda = rest?.moneda || "COP";

  // Construir categorías: preferir platos directos (con categoria real)
  // Si el gateway devuelve platos con categoriaNombre → agrupar aquí
  // Si no → usar el menuRestaurante del fallback
  const categorias = useMemo(() => {
    const platosDirectos = platosData?.platos || [];
    const preciosDirectos = platosData?.precios || [];
    const menuCategorias = menuData?.menuRestaurante?.categorias || [];

    // Intentar con platos directos si hay datos y precios
    if (platosDirectos.length > 0 && preciosDirectos.length > 0) {
      const precioMap = {};
      preciosDirectos.forEach((p) => {
        if (p.estaVigente !== false) precioMap[p.platoId] = p;
      });

      // Solo platos con precio vigente
      const platosConPrecio = platosDirectos.filter((p) => precioMap[p.id]);

      // Agrupar por categoriaNombre
      const grupos = {};
      platosConPrecio.forEach((p) => {
        const cat = p.categoriaNombre || "General";
        if (!grupos[cat]) grupos[cat] = [];
        grupos[cat].push({
          platoId: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          imagen: p.imagen,
          precio: precioMap[p.id]?.precio,
          moneda,
        });
      });

      const cats = Object.entries(grupos).map(([nombre, platos]) => ({
        nombre,
        platos,
      }));
      if (cats.length > 0) return cats;
    }

    // Fallback: menuRestaurante del gateway
    // Renombrar "Otros" si tiene categoriaId null → "General"
    return menuCategorias.map((cat) => ({
      ...cat,
      nombre:
        !cat.categoriaId && cat.nombre === "Otros" ? "General" : cat.nombre,
    }));
  }, [platosData, menuData, moneda]);

  // Tab "Todos" + categorías reales
  const TABS = useMemo(
    () => ["Todos", ...categorias.map((c) => c.nombre)],
    [categorias],
  );

  const platosTab = useMemo(() => {
    if (activeTab === 0) return categorias.flatMap((c) => c.platos || []);
    return categorias.find((c) => c.nombre === TABS[activeTab])?.platos || [];
  }, [activeTab, categorias, TABS]);

  // Restaurante no encontrado
  if (!loading && !rest)
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

  // Sin menú
  if (!loading && rest && categorias.length === 0)
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
          <strong>{rest?.nombre}</strong> estará disponible muy pronto en
          RestoHub.
        </p>
        <button onClick={() => navigate("/")} className="btn-green">
          Ver otros restaurantes
        </button>
      </div>
    );

  const handleAdd = async (plato) => {
    const platoCart = {
      id: plato.platoId,
      nombre: plato.nombre,
      imagen: plato.imagen,
    };
    const ok = add(platoCart, Number(plato.precio), id, moneda);
    if (!ok) {
      const confirmar = await swalConfirm(
        "Restaurante diferente",
        "Tienes artículos de otro restaurante. ¿Vaciar el carrito y empezar nuevo pedido?",
        "Sí, vaciar",
        "Cancelar",
      );
      if (confirmar) {
        clearCart();
        add(platoCart, Number(plato.precio), id, moneda);
      }
      return;
    }
    setAddedIds((p) => ({ ...p, [plato.platoId]: true }));
    setTimeout(
      () => setAddedIds((p) => ({ ...p, [plato.platoId]: false })),
      1200,
    );
  };

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
            background: `url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=90') center/cover`,
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
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                border: "3px solid rgba(255,250,202,0.3)",
                borderTopColor: "var(--cream)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                display: "inline-block",
              }}
            />
          </div>
        )}
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
          {rest && (
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
                  gap: "16px",
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
                {rest.moneda && <span>💰 {rest.moneda}</span>}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs — "Todos" + categorías reales */}
      {TABS.length > 1 && (
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
              {TABS.map((tab, i) => (
                <button
                  key={tab}
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
                  {tab}
                  {i > 0 && (
                    <span
                      style={{
                        marginLeft: "6px",
                        fontSize: "11px",
                        color:
                          activeTab === i ? "var(--green-lt)" : "var(--text3)",
                      }}
                    >
                      ({categorias[i - 1]?.platos?.length || 0})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Platos */}
      <div
        className="container"
        style={{ paddingTop: "36px", paddingBottom: "110px" }}
      >
        {loading ? (
          <div style={{ display: "grid", gap: "14px", maxWidth: "780px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  overflow: "hidden",
                  height: "130px",
                }}
              >
                <div
                  className="skeleton"
                  style={{ width: "140px", flexShrink: 0, borderRadius: 0 }}
                />
                <div
                  style={{
                    flex: 1,
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div
                    className="skeleton"
                    style={{ height: "18px", width: "60%" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: "13px", width: "90%" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: "13px", width: "40%", marginTop: "auto" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Si estamos en "Todos" mostrar agrupado por categoría */}
            {activeTab === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "36px",
                  maxWidth: "780px",
                }}
              >
                {categorias.map((cat) => (
                  <div key={cat.nombre}>
                    <h3
                      style={{
                        fontFamily: "Playfair Display, serif",
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "var(--text)",
                        marginBottom: "16px",
                        paddingBottom: "10px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {cat.nombre}
                      <span
                        style={{
                          fontSize: "13px",
                          color: "var(--text3)",
                          fontFamily: "DM Sans, sans-serif",
                          fontWeight: 400,
                          marginLeft: "8px",
                        }}
                      >
                        ({cat.platos?.length || 0})
                      </span>
                    </h3>
                    <div style={{ display: "grid", gap: "12px" }}>
                      {(cat.platos || []).map((plato, i) => (
                        <PlatoCard
                          key={plato.platoId}
                          plato={plato}
                          moneda={moneda}
                          addedIds={addedIds}
                          onAdd={handleAdd}
                          onOpen={setModalPlato}
                          i={i}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gap: "14px", maxWidth: "780px" }}>
                {platosTab.map((plato, i) => (
                  <PlatoCard
                    key={plato.platoId}
                    plato={plato}
                    moneda={moneda}
                    addedIds={addedIds}
                    onAdd={handleAdd}
                    onOpen={setModalPlato}
                    i={i}
                  />
                ))}
                {platosTab.length === 0 && (
                  <p
                    style={{
                      textAlign: "center",
                      padding: "48px",
                      color: "var(--text2)",
                    }}
                  >
                    No hay platos en esta categoría.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal producto ── */}
      {modalPlato && (
        <div
          onClick={() => setModalPlato(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            background: "rgba(7,45,32,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "540px",
              overflow: "hidden",
              boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
              animation: "fadeUp 0.3s ease",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Imagen grande */}
            <div
              style={{
                position: "relative",
                height: "260px",
                overflow: "hidden",
              }}
            >
              <img
                src={modalPlato.imagen || getFoodImg(modalPlato.platoId)}
                alt={modalPlato.nombre}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(7,45,32,0.6) 0%, transparent 60%)",
                }}
              />
              <button
                onClick={() => setModalPlato(null)}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            {/* Info */}
            <div style={{ padding: "24px 26px 28px" }}>
              <h2
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "8px",
                }}
              >
                {modalPlato.nombre}
              </h2>
              {modalPlato.descripcion && (
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--text2)",
                    lineHeight: 1.65,
                    marginBottom: "20px",
                  }}
                >
                  {modalPlato.descripcion}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "26px",
                    fontWeight: 700,
                    color: "var(--green)",
                  }}
                >
                  {fmt(modalPlato.precio, moneda)}
                </span>
                <button
                  onClick={() => {
                    handleAdd(modalPlato);
                    setModalPlato(null);
                  }}
                  style={{
                    padding: "12px 28px",
                    background: addedIds[modalPlato.platoId]
                      ? "var(--green3)"
                      : "var(--green)",
                    color: "#fff",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 700,
                    fontFamily: "DM Sans, sans-serif",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    letterSpacing: "0.04em",
                  }}
                >
                  {addedIds[modalPlato.platoId]
                    ? "✓ Agregado"
                    : "Agregar al carrito"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            Ver carrito — {fmt(total, moneda)}
          </button>
        </div>
      )}
    </div>
  );
}

function PlatoCard({ plato, moneda, addedIds, onAdd, onOpen, i }) {
  return (
    <div
      onClick={() => onOpen && onOpen(plato)}
      style={{
        display: "flex",
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        overflow: "hidden",
        animation: `fadeUp 0.4s ${i * 0.05}s ease both`,
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(10,56,40,0.22)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(10,56,40,0.07)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ width: "140px", flexShrink: 0, overflow: "hidden" }}>
        <img
          src={plato.imagen || getFoodImg(plato.platoId)}
          alt={plato.nombre}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.5s ease",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.06)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        />
      </div>
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
            {fmt(plato.precio, moneda)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd(plato);
            }}
            style={{
              padding: "9px 22px",
              background: addedIds[plato.platoId]
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
            {addedIds[plato.platoId] ? "✓ Agregado" : "Agregar +"}
          </button>
        </div>
      </div>
    </div>
  );
}
