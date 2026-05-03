import { useState } from "react";
import { useLocation } from "../contexts/LocationContext";
import { COMING_COUNTRIES } from "../data/restaurants";

export default function LocationPicker() {
  const {
    showPicker,
    confirm,
    COUNTRIES,
    country: savedCountry,
    city: savedCity,
    geoLoading,
    geoError,
    setGeoError,
    detectLocation,
  } = useLocation();

  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  if (!showPicker) return null;

  const filteredActive = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );
  const filteredComing = COMING_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const handleCountry = (c) => {
    setSelected(c);
    setStep(2);
    setQuery("");
    setGeoError(null);
  };
  const handleCity = (ci) => {
    confirm(selected, ci);
  };
  const handleBack = () => {
    setStep(1);
    setSelected(null);
    setQuery("");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(7,45,32,0.94)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.25s ease",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "520px",
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.35)",
          animation: "fadeUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div style={{ background: "var(--green)", padding: "26px 28px 22px" }}>
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
              }}
            >
              📍
            </div>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  color: "rgba(255,250,202,0.6)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                {step === 1 ? "Paso 1 de 2" : "Paso 2 de 2"}
              </p>
              <h2
                style={{
                  fontFamily: "Playfair Display, serif",
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
          {/* Progress */}
          <div
            style={{
              height: "3px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "2px",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: "2px",
                background: "var(--cream)",
                width: step === 1 ? "50%" : "100%",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Botón geolocalización — solo paso 1 */}
        {step === 1 && (
          <div style={{ padding: "16px 24px 0" }}>
            <button
              onClick={detectLocation}
              disabled={geoLoading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "9px",
                padding: "12px",
                background: geoLoading ? "var(--bg2)" : "var(--green-dim2)",
                border: "1.5px solid rgba(10,56,40,0.2)",
                borderRadius: "12px",
                color: "var(--green)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: geoLoading ? "not-allowed" : "pointer",
                fontFamily: "DM Sans, sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!geoLoading)
                  e.currentTarget.style.background = "rgba(10,56,40,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = geoLoading
                  ? "var(--bg2)"
                  : "var(--green-dim2)";
              }}
            >
              {geoLoading ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(10,56,40,0.3)",
                      borderTopColor: "var(--green)",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  Detectando tu ubicación...
                </>
              ) : (
                <>
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
                    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8" />
                  </svg>
                  Usar mi ubicación actual
                </>
              )}
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
                style={{ flex: 1, height: "1px", background: "var(--border)" }}
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
                style={{ flex: 1, height: "1px", background: "var(--border)" }}
              />
            </div>
          </div>
        )}

        {/* Search */}
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

        {/* List */}
        <div
          style={{
            maxHeight: "280px",
            overflowY: "auto",
            padding: "12px 24px 6px",
          }}
        >
          {step === 1 && (
            <>
              {/* Países activos */}
              {filteredActive.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  {filteredActive.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => handleCountry(c)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "9px 14px",
                        background: "var(--bg2)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        color: "var(--text)",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        fontFamily: "DM Sans, sans-serif",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--green-dim2)";
                        e.currentTarget.style.borderColor =
                          "rgba(10,56,40,0.3)";
                        e.currentTarget.style.color = "var(--green)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--bg2)";
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.color = "var(--text)";
                      }}
                    >
                      <span style={{ fontSize: "19px" }}>{c.flag}</span>{" "}
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              {/* Países próximos */}
              {filteredComing.length > 0 && (
                <>
                  <p
                    style={{
                      fontSize: "10px",
                      color: "var(--text3)",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                      marginTop: "4px",
                    }}
                  >
                    Próximamente
                  </p>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {filteredComing.map((c) => (
                      <div
                        key={c.code}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "9px 14px",
                          background: "var(--bg3)",
                          border: "1px dashed var(--border2)",
                          borderRadius: "10px",
                          color: "var(--text3)",
                          fontSize: "13px",
                          fontWeight: 500,
                          fontFamily: "DM Sans, sans-serif",
                          opacity: 0.7,
                          cursor: "not-allowed",
                        }}
                      >
                        <span style={{ fontSize: "19px" }}>{c.flag}</span>{" "}
                        {c.name}
                        <span
                          style={{
                            fontSize: "10px",
                            background: "var(--green-dim)",
                            color: "var(--green-lt)",
                            padding: "2px 7px",
                            borderRadius: "6px",
                            fontWeight: 700,
                          }}
                        >
                          Pronto
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {selected?.cities
                .filter((ci) => ci.toLowerCase().includes(query.toLowerCase()))
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
                      transition: "all 0.15s",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--green-dim2)";
                      e.currentTarget.style.borderColor = "rgba(10,56,40,0.3)";
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {step === 2 && (
            <button
              onClick={handleBack}
              style={{
                width: "100%",
                padding: "11px",
                background: "transparent",
                border: "1px solid var(--border2)",
                borderRadius: "10px",
                color: "var(--text2)",
                fontSize: "13px",
                fontFamily: "DM Sans, sans-serif",
                cursor: "pointer",
              }}
            >
              ← Volver a países
            </button>
          )}
          {savedCountry && savedCity && (
            <button
              onClick={() => confirm(savedCountry, savedCity)}
              style={{
                width: "100%",
                padding: "8px",
                background: "transparent",
                border: "none",
                color: "var(--text3)",
                fontSize: "12px",
                fontFamily: "DM Sans, sans-serif",
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
  );
}
