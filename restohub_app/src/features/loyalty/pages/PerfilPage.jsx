// SVG Icon components
const IcoStar = () => (
  <svg
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IcoTrend = () => (
  <svg
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
const IcoCupon = () => (
  <svg
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M2 10h20" />
  </svg>
);
const IcoPromo = () => (
  <svg
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "../../../app/auth/AuthContext";
import { swalConfirm } from "../../../shared/utils/swal";
import {
  GET_PUNTOS_CLIENTE,
  GET_CUPONES_CLIENTE,
  GET_TRANSACCIONES_CLIENTE,
  GET_PROMOCIONES_ACTIVAS,
} from "../queries";

const TABS = ["Resumen", "Puntos", "Cupones", "Promociones", "Información"];

const NIVEL_COLOR = {
  BRONCE: "#CD7F32",
  PLATA: "#A8A9AD",
  ORO: "#FFD700",
  PLATINO: "#E5E4E2",
  DIAMANTE: "#B9F2FF",
};

export default function PerfilPage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [tab, setTab] = useState("Resumen");

  if (!isAuthenticated) {
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
            fontSize: "26px",
            color: "var(--text)",
          }}
        >
          Debes iniciar sesión
        </h2>
        <p style={{ color: "var(--text2)" }}>
          Accede a tu perfil, puntos y cupones exclusivos.
        </p>
        <button onClick={() => navigate("/login")} className="btn-green">
          Ingresar / Registrarse
        </button>
      </div>
    );
  }

  const clienteId = user?.id;

  const { data: puntosData } = useQuery(GET_PUNTOS_CLIENTE, {
    variables: { clienteId },
    skip: !clienteId,
  });
  const { data: cuponesData } = useQuery(GET_CUPONES_CLIENTE, {
    variables: { clienteId },
    skip: !clienteId,
  });
  const { data: txData } = useQuery(GET_TRANSACCIONES_CLIENTE, {
    variables: { clienteId },
    skip: !clienteId,
  });
  const { data: promoData } = useQuery(GET_PROMOCIONES_ACTIVAS, {
    variables: { activa: true },
  });

  const puntos = puntosData?.puntosCliente;
  const cupones = cuponesData?.cupones || [];
  const transacs = txData?.transaccionesPuntos || [];
  const promociones = promoData?.promociones || [];

  const handleLogout = async () => {
    const ok = await swalConfirm(
      "¿Cerrar sesión?",
      "¿Seguro que quieres salir?",
      "Cerrar sesión",
      "Cancelar",
    );
    if (ok) {
      logout();
      navigate("/");
    }
  };

  return (
    <div
      style={{
        paddingTop: "68px",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* ── Hero perfil ── */}
      <div style={{ background: "var(--green)", padding: "36px 0 0" }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginBottom: "28px",
              flexWrap: "wrap",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "var(--cream)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "3px solid rgba(255,250,202,0.4)",
              }}
            >
              <span
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "var(--green)",
                }}
              >
                {user?.nombre?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "clamp(20px,4vw,28px)",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "4px",
                }}
              >
                {user?.nombre}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>
                {user?.email}
              </p>
              {puntos && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "8px",
                    padding: "5px 14px",
                    background: "rgba(255,250,202,0.12)",
                    border: "1px solid rgba(255,250,202,0.25)",
                    borderRadius: "20px",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: NIVEL_COLOR[puntos.nivel] || "var(--cream)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--cream)",
                    }}
                  >
                    {puntos.nivelDisplay || puntos.nivel}
                  </span>
                  <span
                    style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}
                  >
                    · {puntos.saldo} pts
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "8px 16px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                color: "rgba(255,255,255,0.7)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
                flexShrink: 0,
              }}
            >
              Cerrar sesión
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "2px", overflowX: "auto" }}>
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "12px 20px",
                  background: "none",
                  borderBottom: `2px solid ${tab === t ? "var(--cream)" : "transparent"}`,
                  color: tab === t ? "var(--cream)" : "rgba(255,255,255,0.45)",
                  fontSize: "13px",
                  fontWeight: tab === t ? 700 : 500,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif",
                  transition: "all 0.2s",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div
        className="container"
        style={{ paddingTop: "32px", paddingBottom: "80px", maxWidth: "900px" }}
      >
        {/* RESUMEN */}
        {tab === "Resumen" && (
          <div style={{ display: "grid", gap: "20px" }}>
            {/* Stats cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
                gap: "16px",
              }}
            >
              {[
                {
                  label: "Puntos disponibles",
                  value: puntos?.saldo ?? "—",
                  icon: "⭐",
                  color: "var(--green)",
                },
                {
                  label: "Puntos históricos",
                  value: puntos?.puntosTotalesHistoricos ?? "—",
                  icon: "📈",
                  color: "var(--green-lt)",
                },
                {
                  label: "Cupones activos",
                  value: cupones.filter((c) => c.disponible).length,
                  icon: "🎁",
                  color: "#B45309",
                },
                {
                  label: "Promociones activas",
                  value: promociones.length,
                  icon: "🏷️",
                  color: "#6D28D9",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r)",
                    padding: "20px",
                  }}
                >
                  <div style={{ fontSize: "22px", marginBottom: "8px" }}>
                    {s.icon}
                  </div>
                  <div
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "28px",
                      fontWeight: 700,
                      color: s.color,
                      marginBottom: "4px",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text3)",
                      fontWeight: 500,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Últimas transacciones */}
            {transacs.length > 0 && (
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
                    Últimos movimientos
                  </h3>
                  <button
                    onClick={() => setTab("Puntos")}
                    style={{
                      fontSize: "12px",
                      color: "var(--green)",
                      fontWeight: 600,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    Ver todos →
                  </button>
                </div>
                {transacs.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 20px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background:
                          tx.tipo === "ACUMULO"
                            ? "rgba(10,56,40,0.1)"
                            : "rgba(220,38,38,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>
                        {tx.tipo === "ACUMULO" ? (
                          <svg
                            width="12"
                            height="12"
                            fill="none"
                            stroke="var(--green)"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        ) : (
                          <svg
                            width="12"
                            height="12"
                            fill="none"
                            stroke="#DC2626"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        )}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text)",
                          marginBottom: "2px",
                        }}
                      >
                        {tx.descripcion || tx.tipoDisplay}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text3)" }}>
                        {tx.createdAt
                          ? new Date(tx.createdAt).toLocaleDateString("es-CO")
                          : ""}
                      </p>
                    </div>
                    <span
                      style={{
                        fontFamily: "Playfair Display, serif",
                        fontSize: "16px",
                        fontWeight: 700,
                        color:
                          tx.tipo === "ACUMULO" ? "var(--green)" : "#DC2626",
                      }}
                    >
                      {tx.tipo === "ACUMULO" ? "+" : "-"}
                      {Math.abs(tx.puntos)} pts
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Cupones destacados */}
            {cupones.filter((c) => c.disponible).length > 0 && (
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
                    Cupones disponibles
                  </h3>
                  <button
                    onClick={() => setTab("Cupones")}
                    style={{
                      fontSize: "12px",
                      color: "var(--green)",
                      fontWeight: 600,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    Ver todos →
                  </button>
                </div>
                <div
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  {cupones
                    .filter((c) => c.disponible)
                    .slice(0, 3)
                    .map((c) => (
                      <CuponCard key={c.id} cupon={c} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PUNTOS */}
        {tab === "Puntos" && (
          <div style={{ display: "grid", gap: "20px" }}>
            {puntos && (
              <div
                style={{
                  background: "var(--green)",
                  borderRadius: "var(--r-lg)",
                  padding: "28px",
                  color: "#fff",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-20px",
                    right: "-20px",
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "-30px",
                    left: "40px",
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.04)",
                  }}
                />
                <p
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.5)",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  Saldo actual
                </p>
                <div
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "52px",
                    fontWeight: 900,
                    color: "var(--cream)",
                    lineHeight: 1,
                    marginBottom: "8px",
                  }}
                >
                  {puntos.saldo}
                </div>
                <p
                  style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)" }}
                >
                  puntos · Nivel{" "}
                  <strong style={{ color: "var(--cream)" }}>
                    {puntos.nivelDisplay || puntos.nivel}
                  </strong>
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.35)",
                    marginTop: "8px",
                  }}
                >
                  Total histórico: {puntos.puntosTotalesHistoricos} pts
                </p>
              </div>
            )}
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
                  Historial de movimientos
                </h3>
              </div>
              {transacs.length === 0 ? (
                <div
                  style={{
                    padding: "48px 20px",
                    textAlign: "center",
                    color: "var(--text3)",
                  }}
                >
                  <div style={{ fontSize: "36px", marginBottom: "12px" }}>
                    ⭐
                  </div>
                  <p>Aún no tienes movimientos. ¡Haz tu primer pedido!</p>
                </div>
              ) : (
                transacs.map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 20px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background:
                          tx.tipo === "ACUMULO"
                            ? "rgba(10,56,40,0.1)"
                            : "rgba(220,38,38,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "18px",
                      }}
                    >
                      {tx.tipo === "ACUMULO" ? (
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="var(--green)"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <line x1="12" y1="19" x2="12" y2="5" />
                          <polyline points="5 12 12 5 19 12" />
                        </svg>
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="#DC2626"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <polyline points="19 12 12 19 5 12" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text)",
                          marginBottom: "2px",
                        }}
                      >
                        {tx.descripcion || tx.tipoDisplay}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text3)" }}>
                        Saldo anterior: {tx.saldoAnterior} → {tx.saldoPosterior}{" "}
                        pts
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontFamily: "Playfair Display, serif",
                          fontSize: "17px",
                          fontWeight: 700,
                          color:
                            tx.tipo === "ACUMULO" ? "var(--green)" : "#DC2626",
                        }}
                      >
                        {tx.tipo === "ACUMULO" ? "+" : "-"}
                        {Math.abs(tx.puntos)}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text3)" }}>
                        {tx.createdAt
                          ? new Date(tx.createdAt).toLocaleDateString("es-CO")
                          : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CUPONES */}
        {tab === "Cupones" && (
          <div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  padding: "10px 18px",
                  background: "var(--green-dim2)",
                  border: "1px solid rgba(10,56,40,0.2)",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--green)",
                }}
              >
                ✓ {cupones.filter((c) => c.disponible).length} disponibles
              </div>
              <div
                style={{
                  padding: "10px 18px",
                  background: "var(--bg2)",
                  border: "1px solid var(--border2)",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text3)",
                }}
              >
                {cupones.filter((c) => !c.disponible).length} expirados
              </div>
            </div>
            {cupones.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "72px 20px",
                  background: "#fff",
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "44px", marginBottom: "14px" }}>🎁</div>
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "22px",
                    marginBottom: "8px",
                    color: "var(--text)",
                  }}
                >
                  Sin cupones aún
                </h3>
                <p style={{ color: "var(--text2)" }}>
                  Haz pedidos y acumula puntos para obtener cupones exclusivos.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))",
                  gap: "16px",
                }}
              >
                {cupones.map((c) => (
                  <CuponCard key={c.id} cupon={c} full />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROMOCIONES */}
        {tab === "Promociones" && (
          <div style={{ display: "grid", gap: "16px" }}>
            {promociones.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "72px 20px",
                  background: "#fff",
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "44px", marginBottom: "14px" }}>🏷️</div>
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "22px",
                    color: "var(--text)",
                    marginBottom: "8px",
                  }}
                >
                  Sin promociones activas
                </h3>
                <p style={{ color: "var(--text2)" }}>
                  Pronto habrá promociones especiales para ti.
                </p>
              </div>
            ) : (
              promociones.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-lg)",
                    padding: "20px 24px",
                    display: "flex",
                    gap: "16px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      background: "var(--green-dim2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "22px",
                    }}
                  >
                    {p.tipoBeneficio === "DESCUENTO"
                      ? "💸"
                      : p.tipoBeneficio === "PUNTOS_BONUS"
                        ? "⭐"
                        : "🎁"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                        flexWrap: "wrap",
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "Playfair Display, serif",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "var(--text)",
                        }}
                      >
                        {p.nombre}
                      </h3>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          background: "rgba(10,56,40,0.08)",
                          color: "var(--green)",
                          borderRadius: "20px",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {p.alcanceDisplay || p.alcance}
                      </span>
                    </div>
                    {p.descripcion && (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "var(--text2)",
                          lineHeight: 1.55,
                          marginBottom: "8px",
                        }}
                      >
                        {p.descripcion}
                      </p>
                    )}
                    <div
                      style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}
                    >
                      <span style={{ fontSize: "12px", color: "var(--text3)" }}>
                        📅 Hasta{" "}
                        {p.fechaFin
                          ? new Date(p.fechaFin).toLocaleDateString("es-CO")
                          : "Sin fecha"}
                      </span>
                      {p.valor && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--green)",
                            fontWeight: 600,
                          }}
                        >
                          {p.tipoBeneficioDisplay}: {p.valor}
                        </span>
                      )}
                      {p.puntosBonus > 0 && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--green)",
                            fontWeight: 600,
                          }}
                        >
                          +{p.puntosBonus} pts bonus
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* INFORMACIÓN PERSONAL */}
        {tab === "Información" && (
          <div style={{ display: "grid", gap: "20px", maxWidth: "560px" }}>
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
                  background: "var(--bg2)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "17px",
                    color: "var(--text)",
                  }}
                >
                  Datos personales
                </h3>
              </div>
              <div style={{ padding: "20px" }}>
                {[
                  ["Nombre", user?.nombre, "text"],
                  ["Correo", user?.email, "email"],
                  ["Rol", user?.rol?.replace(/_/g, " "), null],
                ].map(([label, value, _]) => (
                  <div
                    key={label}
                    style={{
                      marginBottom: "16px",
                      paddingBottom: "16px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--text3)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "var(--text)",
                        fontWeight: 500,
                      }}
                    >
                      {value || "—"}
                    </p>
                  </div>
                ))}
                <div>
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--text3)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    Estado de cuenta
                  </p>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "4px 12px",
                      background: "var(--green-dim2)",
                      color: "var(--green)",
                      borderRadius: "20px",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--green)",
                      }}
                    />
                    {user?.emailVerificado
                      ? "Email verificado"
                      : "Email pendiente de verificación"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "13px",
                background: "transparent",
                border: "1.5px solid rgba(220,38,38,0.3)",
                borderRadius: "var(--r-sm)",
                color: "#DC2626",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CuponCard({ cupon, full = false }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(cupon.codigo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div
      style={{
        border: `1.5px solid ${cupon.disponible ? "rgba(10,56,40,0.2)" : "var(--border2)"}`,
        borderRadius: "14px",
        overflow: "hidden",
        background: cupon.disponible ? "#fff" : "var(--bg2)",
        opacity: cupon.disponible ? 1 : 0.6,
      }}
    >
      {/* Franja superior */}
      <div
        style={{
          background: cupon.disponible ? "var(--green)" : "var(--bg3)",
          padding: "14px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "15px",
            fontWeight: 700,
            color: cupon.disponible ? "var(--cream)" : "var(--text3)",
          }}
        >
          {cupon.tipoDescuento === "PORCENTAJE"
            ? `${cupon.valorDescuento}% OFF`
            : `$${cupon.valorDescuento} OFF`}
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: cupon.disponible ? "rgba(255,250,202,0.6)" : "var(--text3)",
            letterSpacing: "0.06em",
          }}
        >
          {cupon.disponible ? "DISPONIBLE" : "NO DISPONIBLE"}
        </span>
      </div>
      {/* Código */}
      <div style={{ padding: "14px 16px" }}>
        {cupon.promocionNombre && (
          <p
            style={{
              fontSize: "12px",
              color: "var(--text2)",
              marginBottom: "8px",
            }}
          >
            {cupon.promocionNombre}
          </p>
        )}
        <button
          onClick={copy}
          disabled={!cupon.disponible}
          style={{
            width: "100%",
            padding: "10px",
            background: "var(--bg2)",
            border: "1.5px dashed var(--border2)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: cupon.disponible ? "pointer" : "default",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "0.12em",
            }}
          >
            {cupon.codigo}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: copied ? "var(--green)" : "var(--text3)",
            }}
          >
            {copied ? "✓ Copiado" : "Copiar"}
          </span>
        </button>
        {full && (
          <p
            style={{
              fontSize: "11px",
              color: "var(--text3)",
              marginTop: "8px",
            }}
          >
            Vence:{" "}
            {cupon.fechaFin
              ? new Date(cupon.fechaFin).toLocaleDateString("es-CO")
              : "Sin fecha"}
            {cupon.limiteUso > 0 &&
              ` · Usos: ${cupon.usosActuales}/${cupon.limiteUso}`}
          </p>
        )}
      </div>
    </div>
  );
}
