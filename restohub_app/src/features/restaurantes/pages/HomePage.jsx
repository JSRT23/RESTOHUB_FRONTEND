import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { useLocation } from "../../../app/auth/LocationContext";
import { GET_RESTAURANTES } from "../queries";
import RestaurantCard, {
  RestaurantCardSkeleton,
} from "../components/RestaurantCard";

// Normalizar pais del gateway → código ISO
const PAIS_ALIASES = {
  COLOMBIA: "CO",
  MEXICO: "MX",
  MÉXICO: "MX",
  PERU: "PE",
  PERÚ: "PE",
  ARGENTINA: "AR",
  BRASIL: "BR",
  BRAZIL: "BR",
  CHILE: "CL",
  ECUADOR: "EC",
  VENEZUELA: "VE",
  ESPAÑA: "ES",
  ESPANA: "ES",
  "ESTADOS UNIDOS": "US",
  USA: "US",
};
const resolveCode = (raw) => {
  if (!raw) return "";
  const up = raw.toUpperCase().trim();
  return PAIS_ALIASES[up] || up;
};

export default function HomePage() {
  const { confirmed, city, country, setShowPicker, setRestaurants } =
    useLocation();
  const [search, setSearch] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [categoria, setCategoria] = useState("Todos");

  const { data, loading, error } = useQuery(GET_RESTAURANTES, {
    variables: { activo: true },
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (data?.restaurantes) setRestaurants(data.restaurantes);
  }, [data, setRestaurants]);

  const allRestaurants = data?.restaurantes || [];
  const withMenuFlag = (r) => Boolean(r.moneda);

  // Categorías dinámicas = ciudades únicas de los restaurantes filtrados por país
  // Usamos ciudad como "categoría geográfica" hasta que el gateway exponga categorías
  // PERO según las imágenes las categorías del menú vienen en el menuRestaurante
  // Para el home usamos ciudades como agrupación si hay varias, sino no mostramos filtro
  const ciudades = useMemo(() => {
    const set = new Set(
      allRestaurants
        .filter(
          (r) => !confirmed || !country || resolveCode(r.pais) === country.code,
        )
        .map((r) => r.ciudad)
        .filter(Boolean),
    );
    return ["Todos", ...set];
  }, [allRestaurants, confirmed, country]);

  const filtered = useMemo(
    () =>
      allRestaurants.filter((r) => {
        if (confirmed && country && resolveCode(r.pais) !== country.code)
          return false;
        if (
          confirmed &&
          city &&
          r.ciudad?.toLowerCase().trim() !== city?.toLowerCase().trim()
        )
          return false;
        if (onlyOpen && !r.activo) return false;
        if (categoria !== "Todos" && r.ciudad !== categoria) return false;
        if (
          search &&
          !r.nombre?.toLowerCase().includes(search.toLowerCase()) &&
          !r.ciudad?.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [allRestaurants, confirmed, country, city, onlyOpen, search, categoria],
  );

  const sorted = useMemo(
    () => [
      ...filtered.filter((r) => withMenuFlag(r)),
      ...filtered.filter((r) => !withMenuFlag(r)),
    ],
    [filtered],
  );

  const conMenu = sorted.filter((r) => withMenuFlag(r)).length;
  const sinMenu = sorted.filter((r) => !withMenuFlag(r)).length;
  const totalAll = allRestaurants.length;
  const showCiudadFilter = ciudades.length > 2; // solo si hay >1 ciudad

  return (
    <div>
      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1800&q=90') center/cover no-repeat`,
            filter: "brightness(0.38) saturate(0.9)",
            transform: "scale(1.03)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(110deg, rgba(7,45,32,0.9) 0%, rgba(7,45,32,0.55) 50%, rgba(7,45,32,0.2) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: 0,
            width: "30%",
            height: "1px",
            background:
              "linear-gradient(to left, transparent, rgba(255,250,202,0.3))",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "26%",
            left: 0,
            width: "22%",
            height: "1px",
            background:
              "linear-gradient(to right, transparent, rgba(255,250,202,0.2))",
          }}
        />

        <div
          className="container"
          style={{ position: "relative", zIndex: 1, paddingTop: "80px" }}
        >
          <div style={{ maxWidth: "620px" }}>
            {confirmed && city ? (
              <button
                onClick={() => setShowPicker(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "7px 16px",
                  background: "rgba(255,250,202,0.12)",
                  border: "1px solid rgba(255,250,202,0.3)",
                  borderRadius: "20px",
                  color: "var(--cream)",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "28px",
                  cursor: "pointer",
                  animation: "fadeUp 0.5s ease both",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                <span>{country?.flag}</span>
                <span>
                  {city}, {country?.name}
                </span>
                <svg
                  width="11"
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            ) : (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "28px",
                  animation: "fadeUp 0.5s ease both",
                }}
              >
                <div
                  style={{ width: 28, height: 1, background: "var(--cream)" }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--cream)",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    opacity: 0.8,
                  }}
                >
                  Descubre restaurantes cerca de ti
                </span>
              </div>
            )}

            <h1
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "clamp(44px,7vw,80px)",
                fontWeight: 900,
                lineHeight: 1.04,
                color: "#fff",
                marginBottom: "22px",
                animation: "fadeUp 0.6s 0.1s ease both",
                letterSpacing: "-0.02em",
              }}
            >
              La mejor mesa
              <br />
              <em style={{ color: "var(--cream)", fontStyle: "italic" }}>
                te espera.
              </em>
            </h1>

            <p
              style={{
                fontSize: "17px",
                color: "rgba(255,255,255,0.68)",
                lineHeight: 1.68,
                maxWidth: "440px",
                marginBottom: "38px",
                animation: "fadeUp 0.6s 0.2s ease both",
              }}
            >
              Explora los mejores restaurantes de tu ciudad, consulta sus menús
              y realiza tu pedido en segundos.
            </p>

            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
                animation: "fadeUp 0.6s 0.3s ease both",
              }}
            >
              <button
                onClick={() =>
                  document
                    .getElementById("restaurants")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="btn-cream"
              >
                <svg
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                </svg>
                Explorar restaurantes
              </button>
              {!confirmed && (
                <button
                  onClick={() => setShowPicker(true)}
                  className="btn-ghost-light"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  </svg>
                  Detectar mi ubicación
                </button>
              )}
            </div>

            {!loading && totalAll > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "36px",
                  marginTop: "52px",
                  paddingTop: "40px",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  animation: "fadeUp 0.6s 0.4s ease both",
                }}
              >
                {[
                  [conMenu + "+", "Con menú activo"],
                  [
                    [...new Set(allRestaurants.map((r) => r.pais))].length,
                    "Países",
                  ],
                  [totalAll + "+", "Restaurantes"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <div
                      style={{
                        fontFamily: "Playfair Display, serif",
                        fontSize: "26px",
                        fontWeight: 700,
                        color: "var(--cream)",
                      }}
                    >
                      {n}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.45)",
                        fontWeight: 500,
                        letterSpacing: "0.06em",
                        marginTop: "2px",
                      }}
                    >
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            animation: "float 2.2s ease infinite",
            opacity: 0.35,
          }}
        >
          <span
            style={{
              fontSize: "9px",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Scroll
          </span>
          <div
            style={{
              width: 1,
              height: 36,
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)",
            }}
          />
        </div>
      </section>

      {/* ── BANDA VERDE ── */}
      <div style={{ background: "var(--green)", padding: "17px 0" }}>
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            "Colombiana",
            "◆",
            "Mexicana",
            "◆",
            "Peruana",
            "◆",
            "Argentina",
            "◆",
            "Chilena",
            "◆",
            "Internacional",
          ].map((tag, i) => (
            <span
              key={i}
              style={{
                fontSize: "11px",
                fontWeight: tag === "◆" ? 400 : 700,
                color:
                  tag === "◆"
                    ? "rgba(255,250,202,0.2)"
                    : "rgba(255,250,202,0.72)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                padding: "0 16px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── RESTAURANTES ── */}
      <section
        id="restaurants"
        style={{ padding: "80px 0 100px", background: "var(--bg)" }}
      >
        <div className="container">
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "28px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 2,
                    background: "var(--cream-dk)",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--green-lt)",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {confirmed && city
                    ? `${city}, ${country?.name}`
                    : "Todos los restaurantes"}
                </span>
              </div>
              {!loading && (
                <h2
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "clamp(24px,4vw,38px)",
                    fontWeight: 700,
                    color: "var(--text)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {conMenu} con menú
                  {sinMenu > 0 && (
                    <span
                      style={{
                        fontSize: "0.55em",
                        color: "var(--text3)",
                        fontFamily: "DM Sans, sans-serif",
                        fontWeight: 500,
                        marginLeft: "12px",
                      }}
                    >
                      + {sinMenu} sin menú
                    </span>
                  )}
                </h2>
              )}
            </div>
            <button
              onClick={() => setOnlyOpen((o) => !o)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 16px",
                background: onlyOpen ? "var(--green-dim2)" : "#fff",
                border: `1.5px solid ${onlyOpen ? "rgba(10,56,40,0.3)" : "var(--border2)"}`,
                borderRadius: "10px",
                color: onlyOpen ? "var(--green)" : "var(--text2)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
                transition: "all 0.2s",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: onlyOpen ? "var(--green)" : "var(--text3)",
                }}
              />
              Solo abiertos
            </button>
          </div>

          {/* Búsqueda + filtro ciudad */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "32px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: "200px",
                maxWidth: "320px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#fff",
                border: "1.5px solid var(--border2)",
                borderRadius: "var(--r-sm)",
                padding: "0 12px",
              }}
            >
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="var(--text3)"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar restaurante o ciudad..."
                style={{
                  flex: 1,
                  padding: "11px 0",
                  background: "transparent",
                  color: "var(--text)",
                  fontSize: "13px",
                  border: "none",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    color: "var(--text3)",
                    background: "none",
                    fontSize: "14px",
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtro por ciudad — solo si hay más de 1 ciudad */}
            {showCiudadFilter && (
              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                {ciudades.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoria(cat)}
                    style={{
                      padding: "7px 14px",
                      background: categoria === cat ? "var(--green)" : "#fff",
                      border: `1.5px solid ${categoria === cat ? "var(--green)" : "var(--border2)"}`,
                      borderRadius: "20px",
                      color: categoria === cat ? "#fff" : "var(--text2)",
                      fontSize: "12px",
                      fontWeight: categoria === cat ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: "DM Sans, sans-serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                gap: "24px",
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div
              style={{
                textAlign: "center",
                padding: "72px 20px",
                background: "#fff",
                borderRadius: "var(--r-lg)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "44px", marginBottom: "14px" }}>⚠️</div>
              <h3
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "22px",
                  marginBottom: "10px",
                  color: "var(--text)",
                }}
              >
                No pudimos cargar los restaurantes
              </h3>
              <p style={{ color: "var(--text2)", marginBottom: "24px" }}>
                Verifica que el gateway esté corriendo en{" "}
                <code
                  style={{
                    background: "var(--bg2)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  localhost:8000/api/graphql/
                </code>
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-green"
              >
                Reintentar
              </button>
            </div>
          ) : sorted.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "72px 20px",
                background: "#fff",
                borderRadius: "var(--r-lg)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "44px", marginBottom: "14px" }}>🍽️</div>
              <h3
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "22px",
                  marginBottom: "10px",
                  color: "var(--text)",
                }}
              >
                Sin resultados
              </h3>
              <p style={{ color: "var(--text2)", marginBottom: "24px" }}>
                {confirmed && city
                  ? `Aún no hay restaurantes en ${city}. ¡Pronto llegamos!`
                  : "Prueba ajustando los filtros o la ubicación."}
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setOnlyOpen(false);
                  setCategoria("Todos");
                }}
                className="btn-green"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                gap: "24px",
              }}
            >
              {sorted.map((r, i) => (
                <RestaurantCard
                  key={r.id}
                  restaurante={r}
                  tieneMenu={withMenuFlag(r)}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "var(--green2)" }}>
        <div
          style={{
            padding: "68px 0 52px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="container"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 28,
                height: 2,
                background: "var(--cream)",
                marginBottom: "20px",
              }}
            />
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "clamp(24px,4vw,42px)",
                fontWeight: 700,
                color: "#fff",
                marginBottom: "14px",
              }}
            >
              ¿Tienes un restaurante?
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.52)",
                maxWidth: "440px",
                lineHeight: 1.65,
                marginBottom: "28px",
              }}
            >
              Únete a RestoHub y lleva tu negocio al siguiente nivel con gestión
              inteligente de pedidos, staff e inventario.
            </p>
            <a href="mailto:hola@restohub.app" className="btn-cream">
              Contáctanos
            </a>
          </div>
        </div>
        <div style={{ padding: "22px 0" }}>
          <div
            className="container"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: "var(--cream)",
                  borderRadius: "7px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="var(--green)"
                  strokeWidth="2.8"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 11l19-9-9 19-2-8-8-2z" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "16px",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                Resto<span style={{ color: "var(--cream)" }}>Hub</span>
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)" }}>
              © {new Date().getFullYear()} RestoHub. Todos los derechos
              reservados.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
