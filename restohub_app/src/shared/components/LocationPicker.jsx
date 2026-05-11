// restohub_app/src/shared/components/LocationPicker.jsx

import { useState } from "react";
import { useLocation } from "../../app/auth/LocationContext";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../features/cart/context/CartContext";

export default function LocationPicker() {
  const {
    showPicker,
    confirm,
    countries,
    comingCountries,
    country: savedCountry,
    city: savedCity,
    geoError,
    setGeoError,
  } = useLocation();

  const navigate = useNavigate();
  const { clear } = useCart();

  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoProposal, setGeoProposal] = useState(null);

  if (!showPicker) return null;

  const q = query.toLowerCase();
  const filteredActive = countries.filter((c) =>
    c.name.toLowerCase().includes(q),
  );
  const filteredComing = comingCountries.filter((c) =>
    c.name.toLowerCase().includes(q),
  );
  const norm = (s) =>
    (s || "")
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const handleCountry = (c) => {
    setSelected(c);
    setStep(2);
    setQuery("");
    setGeoError(null);
  };
  const handleCity = (ci) => {
    clear();
    confirm(selected, ci);
    navigate("/");
  };
  const handleKeep = () => {
    confirm(savedCountry, savedCity);
    navigate("/");
  };
  const handleBack = () => {
    setStep(1);
    setSelected(null);
    setQuery("");
  };

  const handleDetectLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=es`,
            { headers: { "User-Agent": "RestoHub/1.0" } },
          );
          const data = await res.json();
          const countryCode = data.address?.country_code?.toUpperCase();
          const rawCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.municipality ||
            data.address?.county ||
            null;
          const foundCountry = countries.find((c) => c.code === countryCode);
          setGeoLoading(false);
          if (!foundCountry) {
            setGeoError(
              countries.length === 0
                ? "Cargando países. Intenta de nuevo."
                : "RestoHub aún no está disponible en tu país.",
            );
            return;
          }
          const gc = norm(rawCity);
          const cityMatch =
            foundCountry.cities.find((c) => norm(c) === gc) ||
            foundCountry.cities.find((c) => norm(c).includes(gc)) ||
            foundCountry.cities.find((c) => gc.includes(norm(c))) ||
            null;
          setGeoProposal({
            country: foundCountry,
            city: cityMatch || rawCity,
            hasRestaurants: !!cityMatch,
            rawCity,
          });
        } catch {
          setGeoLoading(false);
          setGeoError(
            "No pudimos identificar tu ubicación. Elige manualmente.",
          );
        }
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(
          err.code === 1
            ? "Permiso denegado. Elige manualmente."
            : "No pudimos obtener tu ubicación.",
        );
      },
      { timeout: 8000, maximumAge: 300000 },
    );
  };

  const handleConfirmGeo = () => {
    clear();
    confirm(geoProposal.country, geoProposal.city);
    setGeoProposal(null);
    navigate("/");
  };
  const handleGeoPickCity = (ci) => {
    clear();
    confirm(geoProposal.country, ci);
    setGeoProposal(null);
    navigate("/");
  };
  const handleGeoManual = () => {
    if (geoProposal?.country) {
      setSelected(geoProposal.country);
      setStep(2);
    }
    setGeoProposal(null);
    setGeoError(null);
  };

  const anyOverlay = geoLoading || !!geoProposal;

  // ── Chips picker ───────────────────────────────────────────────────────────
  const btnActive = (c) => (
    <button
      key={c.code}
      onClick={() => handleCountry(c)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        padding: "8px 13px",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        color: "var(--text)",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all .15s",
        fontFamily: "DM Sans,sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--green-dim2)";
        e.currentTarget.style.borderColor = "rgba(10,56,40,.3)";
        e.currentTarget.style.color = "var(--green)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg2)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.color = "var(--text)";
      }}
    >
      <span
        style={{
          fontSize: "9px",
          fontWeight: 800,
          letterSpacing: ".06em",
          background: "var(--green-dim2)",
          color: "var(--green)",
          border: "1px solid rgba(10,56,40,.15)",
          borderRadius: "5px",
          padding: "2px 5px",
          minWidth: "24px",
          textAlign: "center",
        }}
      >
        {c.code}
      </span>
      {c.flag && (
        <span style={{ fontSize: "16px", lineHeight: 1 }}>{c.flag}</span>
      )}
      {c.name}
    </button>
  );

  const chipComing = (c) => (
    <div
      key={c.code}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        padding: "8px 13px",
        background: "var(--bg3)",
        border: "1px dashed var(--border2)",
        borderRadius: "10px",
        color: "var(--text3)",
        fontSize: "13px",
        fontWeight: 500,
        fontFamily: "DM Sans,sans-serif",
        opacity: 0.65,
        cursor: "not-allowed",
      }}
    >
      <span
        style={{
          fontSize: "9px",
          fontWeight: 800,
          letterSpacing: ".06em",
          background: "var(--bg2)",
          color: "var(--text3)",
          border: "1px solid var(--border2)",
          borderRadius: "5px",
          padding: "2px 5px",
          minWidth: "24px",
          textAlign: "center",
        }}
      >
        {c.code}
      </span>
      {c.flag && (
        <span style={{ fontSize: "16px", lineHeight: 1 }}>{c.flag}</span>
      )}
      {c.name}
      <span
        style={{
          fontSize: "10px",
          fontWeight: 700,
          background: "var(--green-dim)",
          color: "var(--green-lt)",
          padding: "2px 7px",
          borderRadius: "6px",
          marginLeft: "2px",
        }}
      >
        Pronto
      </span>
    </div>
  );

  return (
    <>
      {/* ── Picker principal ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          pointerEvents: anyOverlay ? "none" : "auto",
          transition: "filter .25s",
          filter: anyOverlay ? "brightness(.45) blur(2px)" : "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=85')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(7,45,32,.82)",
            backdropFilter: "blur(3px)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            background: "#fff",
            borderRadius: "24px",
            width: "100%",
            maxWidth: "520px",
            overflow: "hidden",
            boxShadow: "0 40px 80px rgba(0,0,0,.45)",
            animation: "slideUp .3s cubic-bezier(.34,1.2,.64,1)",
          }}
        >
          {/* Header verde */}
          <div
            style={{ background: "var(--green)", padding: "26px 28px 22px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  background: "var(--cream)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                📍
              </div>
              <div>
                <p
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,250,202,.6)",
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  {step === 1 ? "Paso 1 de 2" : "Paso 2 de 2"}
                </p>
                <h2
                  style={{
                    fontFamily: "Playfair Display,serif",
                    fontSize: "20px",
                    color: "#fff",
                    marginTop: "2px",
                  }}
                >
                  {step === 1
                    ? "¿En qué país estás?"
                    : `Ciudades en ${selected?.name}`}
                </h2>
              </div>
            </div>
            <div
              style={{
                height: "3px",
                background: "rgba(255,255,255,.15)",
                borderRadius: "2px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "2px",
                  background: "var(--cream)",
                  width: step === 1 ? "50%" : "100%",
                  transition: "width .4s ease",
                }}
              />
            </div>
          </div>

          {step === 1 && (
            <div style={{ padding: "16px 24px 0" }}>
              <button
                onClick={handleDetectLocation}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "9px",
                  padding: "12px",
                  background: "var(--green-dim2)",
                  border: "1.5px solid rgba(10,56,40,.2)",
                  borderRadius: "12px",
                  color: "var(--green)",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "DM Sans,sans-serif",
                  transition: "all .2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(10,56,40,.18)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--green-dim2)")
                }
              >
                <svg
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                </svg>
                Usar mi ubicación actual
              </button>
              {geoError && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#c0392b",
                    marginTop: "8px",
                    textAlign: "center",
                    lineHeight: 1.4,
                  }}
                >
                  {geoError}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  margin: "14px 0 0",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "var(--border)",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text3)",
                    fontWeight: 500,
                  }}
                >
                  o elige manualmente
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "var(--border)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Botón volver — encima del buscador, solo en paso 2 */}
          {step === 2 && (
            <div style={{ padding: "10px 24px 0" }}>
              <button
                onClick={handleBack}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "0",
                  background: "none",
                  border: "none",
                  color: "var(--text3)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "DM Sans,sans-serif",
                  letterSpacing: ".02em",
                  transition: "color .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--green)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text3)")
                }
              >
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Volver a países
              </button>
            </div>
          )}

          <div style={{ padding: "12px 24px 0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "var(--bg2)",
                border: "1px solid var(--border2)",
                borderRadius: "12px",
                padding: "0 14px",
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={step === 1 ? "Buscar país..." : "Buscar ciudad..."}
                autoFocus
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "transparent",
                  color: "var(--text)",
                  fontSize: "14px",
                  border: "none",
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  style={{
                    color: "var(--text3)",
                    background: "none",
                    fontSize: "16px",
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              padding: "12px 24px 6px",
            }}
          >
            {step === 1 && (
              <>
                {filteredActive.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginBottom: "14px",
                    }}
                  >
                    {filteredActive.map(btnActive)}
                  </div>
                )}
                {countries.length === 0 && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text3)",
                      textAlign: "center",
                      padding: "10px 0",
                    }}
                  >
                    Cargando países disponibles...
                  </p>
                )}
                {filteredComing.length > 0 && (
                  <>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "var(--text3)",
                        fontWeight: 700,
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      Próximamente
                    </p>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                    >
                      {filteredComing.map(chipComing)}
                    </div>
                  </>
                )}
              </>
            )}
            {step === 2 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(selected?.cities || [])
                  .filter((ci) => ci.toLowerCase().includes(q))
                  .map((ci) => (
                    <button
                      key={ci}
                      onClick={() => handleCity(ci)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "9px 14px",
                        background: "var(--bg2)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        color: "var(--text)",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all .15s",
                        fontFamily: "DM Sans,sans-serif",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--green-dim2)";
                        e.currentTarget.style.borderColor = "rgba(10,56,40,.3)";
                        e.currentTarget.style.color = "var(--green)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--bg2)";
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.color = "var(--text)";
                      }}
                    >
                      <svg
                        width="11"
                        height="11"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        style={{ opacity: 0.5 }}
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      {ci}
                    </button>
                  ))}
                {(selected?.cities || []).length === 0 && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text3)",
                      padding: "12px 0",
                    }}
                  >
                    No hay ciudades disponibles aún en {selected?.name}.
                  </p>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "12px 24px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {savedCountry && savedCity && (
              <button
                onClick={handleKeep}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text3)",
                  fontSize: "12px",
                  fontFamily: "DM Sans,sans-serif",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Mantener {savedCity}, {savedCountry?.name}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal cargando ───────────────────────────────────────────────── */}
      {geoLoading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,.55)",
            backdropFilter: "blur(8px)",
            animation: "fadeIn .15s ease",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "22px",
              padding: "36px 40px",
              textAlign: "center",
              boxShadow: "0 24px 60px rgba(0,0,0,.35)",
              animation: "slideUp .2s ease",
              minWidth: "280px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "3px solid #e5e7eb",
                borderTopColor: "var(--green)",
                animation: "spin .7s linear infinite",
                margin: "0 auto 20px",
              }}
            />
            <p
              style={{
                fontFamily: "Playfair Display,serif",
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "6px",
              }}
            >
              Detectando ubicación...
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text3)",
                lineHeight: 1.6,
              }}
            >
              Acepta el permiso cuando
              <br />
              el navegador te lo solicite.
            </p>
          </div>
        </div>
      )}

      {/* ── Modal propuesta GPS ──────────────────────────────────────────── */}
      {geoProposal &&
        (() => {
          const { country: gc, city: gci, hasRestaurants } = geoProposal;

          /* ── Ciudad con restaurantes ─────────────────────────────────────── */
          if (hasRestaurants)
            return (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 10001,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px",
                  background: "rgba(0,0,0,.55)",
                  backdropFilter: "blur(8px)",
                  animation: "fadeIn .2s ease",
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "24px",
                    width: "100%",
                    maxWidth: "380px",
                    overflow: "hidden",
                    boxShadow: "0 32px 80px rgba(0,0,0,.4)",
                    animation: "slideUp .25s cubic-bezier(.34,1.56,.64,1)",
                  }}
                >
                  {/* Header verde */}
                  <div
                    style={{
                      background: "var(--green)",
                      padding: "28px 24px 24px",
                      textAlign: "center",
                      position: "relative",
                    }}
                  >
                    {/* X */}
                    <button
                      onClick={() => setGeoProposal(null)}
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,.15)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "background .15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,.25)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,.15)")
                      }
                      aria-label="Cerrar"
                    >
                      <svg
                        width="11"
                        height="11"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        viewBox="0 0 24 24"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <div
                      style={{
                        fontSize: "44px",
                        lineHeight: 1,
                        marginBottom: "12px",
                      }}
                    >
                      {gc.flag}
                    </div>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,250,202,.55)",
                        fontWeight: 700,
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      Ubicación detectada
                    </p>
                    <h2
                      style={{
                        fontFamily: "Playfair Display,serif",
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "#fff",
                        marginBottom: "4px",
                      }}
                    >
                      {gci}
                    </h2>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "rgba(255,255,255,.45)",
                      }}
                    >
                      {gc.name}
                    </p>
                  </div>

                  {/* Cuerpo */}
                  <div style={{ padding: "22px 24px 24px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        background: "rgba(10,56,40,.06)",
                        border: "1.5px solid rgba(10,56,40,.1)",
                        borderRadius: "14px",
                        marginBottom: "18px",
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "10px",
                          background: "var(--green)",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--green)",
                            margin: "0 0 2px",
                          }}
                        >
                          Restaurantes disponibles
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--text3)",
                            margin: 0,
                          }}
                        >
                          Hay opciones en {gci} para ti.
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <button
                        onClick={handleConfirmGeo}
                        className="btn-green"
                        style={{
                          width: "100%",
                          justifyContent: "center",
                          padding: "13px",
                          fontSize: "13px",
                        }}
                      >
                        Confirmar — {gci}
                      </button>
                      <button
                        onClick={handleGeoManual}
                        style={{
                          width: "100%",
                          padding: "11px",
                          background: "transparent",
                          border: "1.5px solid #e5e7eb",
                          borderRadius: "12px",
                          color: "#6b7280",
                          fontSize: "13px",
                          fontWeight: 500,
                          cursor: "pointer",
                          fontFamily: "DM Sans,sans-serif",
                        }}
                      >
                        Elegir otra ciudad
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );

          /* ── Sin restaurantes en la ciudad detectada ─────────────────────── */
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 10001,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background: "rgba(0,0,0,.55)",
                backdropFilter: "blur(8px)",
                animation: "fadeIn .2s ease",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  width: "100%",
                  maxWidth: "460px",
                  overflow: "hidden",
                  boxShadow: "0 32px 80px rgba(0,0,0,.4)",
                  animation: "slideUp .28s cubic-bezier(.34,1.4,.64,1)",
                }}
              >
                {/* ── Sección: ubicación actual ── todo blanco, sin header oscuro */}
                <div
                  style={{
                    padding: "28px 28px 20px",
                    borderBottom: "1px solid #f3f4f6",
                    position: "relative",
                  }}
                >
                  {/* Botón cerrar X */}
                  <button
                    onClick={() => setGeoProposal(null)}
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "#f3f4f6",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "background .15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#e5e7eb")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#f3f4f6")
                    }
                    aria-label="Cerrar"
                  >
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="#6b7280"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      viewBox="0 0 24 24"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>

                  {/* Pill de ubicación actual */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 12px 5px 8px",
                      background: "var(--green-dim2)",
                      border: "1px solid rgba(10,56,40,.12)",
                      borderRadius: "20px",
                      marginBottom: "16px",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="var(--green)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                    </svg>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--green)",
                        letterSpacing: ".04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Ubicación actual
                    </span>
                  </div>

                  {/* Ciudad y país detectados */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{ fontSize: "32px", lineHeight: 1, flexShrink: 0 }}
                    >
                      {gc.flag}
                    </span>
                    <div>
                      <p
                        style={{
                          fontFamily: "Playfair Display,serif",
                          fontSize: "22px",
                          fontWeight: 700,
                          color: "var(--text)",
                          margin: "0 0 2px",
                          letterSpacing: "-.3px",
                        }}
                      >
                        {gci || gc.name}
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "var(--text3)",
                          margin: 0,
                          fontWeight: 500,
                        }}
                      >
                        {gc.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Sección: aviso ── */}
                <div style={{ padding: "18px 28px 0" }}>
                  {/* Aviso */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "12px 14px",
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    {/* Icono info */}
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                      style={{ flexShrink: 0, marginTop: "1px" }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#92400e",
                        margin: 0,
                        lineHeight: 1.6,
                        fontWeight: 500,
                      }}
                    >
                      No hay restaurantes disponibles en tu localidad, pero hay
                      sedes en otras ciudades de{" "}
                      <strong style={{ color: "#78350f" }}>{gc.name}</strong>.
                    </p>
                  </div>

                  {/* Label ciudades */}
                  {gc.cities?.length > 0 && (
                    <>
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--text3)",
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Sedes disponibles
                      </p>

                      {/* Grilla de ciudades */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: "8px",
                          marginBottom: "18px",
                        }}
                      >
                        {gc.cities.map((ci) => (
                          <button
                            key={ci}
                            onClick={() => handleGeoPickCity(ci)}
                            style={{
                              padding: "10px 8px",
                              borderRadius: "12px",
                              background: "#fff",
                              border: "1.5px solid #e5e7eb",
                              color: "var(--text)",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "DM Sans,sans-serif",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              transition: "all .15s",
                              boxShadow: "0 1px 3px rgba(0,0,0,.05)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--green)";
                              e.currentTarget.style.borderColor =
                                "var(--green)";
                              e.currentTarget.style.color = "#fff";
                              e.currentTarget.style.boxShadow =
                                "0 4px 14px rgba(10,56,40,.2)";
                              e.currentTarget.style.transform =
                                "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#fff";
                              e.currentTarget.style.borderColor = "#e5e7eb";
                              e.currentTarget.style.color = "var(--text)";
                              e.currentTarget.style.boxShadow =
                                "0 1px 3px rgba(0,0,0,.05)";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <svg
                              width="10"
                              height="10"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              viewBox="0 0 24 24"
                              style={{ opacity: 0.4, flexShrink: 0 }}
                            >
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            </svg>
                            {ci}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* ── Footer ── */}
                <div style={{ padding: "0 28px 24px" }}>
                  <div
                    style={{
                      height: "1px",
                      background: "#f3f4f6",
                      marginBottom: "14px",
                    }}
                  />
                  <button
                    onClick={handleGeoManual}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "transparent",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "12px",
                      color: "#6b7280",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "DM Sans,sans-serif",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                      transition: "all .15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#9ca3af";
                      e.currentTarget.style.color = "#374151";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.color = "#6b7280";
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    Seleccionar país manualmente
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>
    </>
  );
}
