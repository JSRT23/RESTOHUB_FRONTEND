// src/features/loyalty/pages/PerfilPage.jsx
// Dashboard profesional del cliente — puntos, cupones, promociones, pedidos
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "../../../app/auth/AuthContext";
import {
  GET_PUNTOS_CLIENTE,
  GET_CUPONES_CLIENTE,
  GET_TRANSACCIONES_CLIENTE,
  GET_PROMOCIONES_ACTIVAS,
} from "../queries";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes de nivel
// ─────────────────────────────────────────────────────────────────────────────
const NIVEL_META = {
  bronce: {
    color: "#CD7F32",
    bg: "rgba(205,127,50,0.12)",
    label: "Bronce",
    next: 1000,
    nextLabel: "Plata",
  },
  plata: {
    color: "#9CA3AF",
    bg: "rgba(156,163,175,0.12)",
    label: "Plata",
    next: 5000,
    nextLabel: "Oro",
  },
  oro: {
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    label: "Oro",
    next: 10000,
    nextLabel: "Diamante",
  },
  diamante: {
    color: "#67E8F9",
    bg: "rgba(103,232,249,0.12)",
    label: "Diamante",
    next: null,
    nextLabel: null,
  },
};

const NIVEL_THRESHOLDS = { bronce: 0, plata: 1000, oro: 5000, diamante: 10000 };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n, m = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: m,
    maximumFractionDigits: 0,
  }).format(n || 0);

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtRelative = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Hoy";
  if (d === 1) return "Ayer";
  if (d < 7) return `Hace ${d} días`;
  return fmtDate(iso);
};

// ─────────────────────────────────────────────────────────────────────────────
// Tabs config
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Inicio" },
  { id: "puntos", label: "Mis puntos" },
  { id: "cupones", label: "Cupones" },
  { id: "promociones", label: "Promociones" },
  { id: "cuenta", label: "Mi cuenta" },
];

// ─────────────────────────────────────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────────────────────────────────────
const IcoStar = ({ s = 18 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IcoCupon = ({ s = 18 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M2 10h20" />
  </svg>
);
const IcoPromo = ({ s = 18 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const IcoTrend = ({ s = 18 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
const IcoUser = ({ s = 18 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IcoShield = ({ s = 16 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IcoCheck = ({ s = 14 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const IcoCopy = ({ s = 14 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const IcoArrowUp = ({ s = 12 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
  >
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);
const IcoArrowDn = ({ s = 12 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);
const IcoLogout = ({ s = 16 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IcoCalendar = ({ s = 14 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcoGift = ({ s = 18 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path d="M20 12v10H4V12" />
    <path d="M22 7H2v5h20V7z" />
    <path d="M12 22V7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);
const IcoPercent = ({ s = 18 }) => (
  <svg
    width={s}
    height={s}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Componentes pequeños
// ─────────────────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16, r = 8 }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: r }}
    />
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color = "var(--green)",
  bg = "var(--green-dim2)",
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "20px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) =>
        onClick &&
        (e.currentTarget.style.boxShadow = "0 4px 20px rgba(10,56,40,0.1)")
      }
      onMouseLeave={(e) =>
        onClick && (e.currentTarget.style.boxShadow = "none")
      }
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
          }}
        >
          {icon}
        </div>
        {onClick && (
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="var(--text3)"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        )}
      </div>
      <div
        style={{
          fontFamily: "Playfair Display, serif",
          fontSize: 28,
          fontWeight: 700,
          color,
          marginBottom: 2,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text3)",
          marginBottom: sub ? 2 : 0,
        }}
      >
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text3)" }}>{sub}</div>}
    </div>
  );
}

function TxRow({ tx }) {
  const isPos = tx.puntos > 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 20px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isPos ? "rgba(10,56,40,0.08)" : "rgba(220,38,38,0.07)",
          color: isPos ? "var(--green)" : "#DC2626",
        }}
      >
        {isPos ? <IcoArrowUp s={13} /> : <IcoArrowDn s={13} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {tx.descripcion || tx.tipoDisplay || tx.tipo}
        </p>
        <p style={{ fontSize: 11, color: "var(--text3)" }}>
          {fmtRelative(tx.createdAt)}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: 16,
            fontWeight: 700,
            color: isPos ? "var(--green)" : "#DC2626",
          }}
        >
          {isPos ? "+" : ""}
          {tx.puntos} pts
        </p>
        <p style={{ fontSize: 10, color: "var(--text3)" }}>
          {tx.saldoPosterior} total
        </p>
      </div>
    </div>
  );
}

function CuponCard({ cupon, full = false }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cupon.codigo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const isDisp = cupon.disponible;
  const tipoPct =
    cupon.tipoDescuento === "PORCENTAJE" ||
    cupon.tipoDescuentoDisplay?.includes("%") ||
    cupon.tipoDescuento === "porcentaje";

  return (
    <div
      style={{
        background: isDisp ? "#fff" : "var(--bg2)",
        border: `1.5px solid ${isDisp ? "rgba(10,56,40,0.18)" : "var(--border2)"}`,
        borderRadius: 16,
        overflow: "hidden",
        opacity: isDisp ? 1 : 0.6,
        transition: "all 0.2s",
      }}
    >
      {/* Franja superior */}
      <div
        style={{
          background: isDisp ? "var(--green)" : "#9CA3AF",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ color: "var(--cream)", opacity: 0.8 }}>
            {tipoPct ? <IcoPercent s={16} /> : <IcoCupon s={16} />}
          </div>
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 18,
              fontWeight: 700,
              color: isDisp ? "var(--cream)" : "#fff",
            }}
          >
            {tipoPct
              ? `${parseFloat(cupon.valorDescuento || 0).toFixed(0)}% OFF`
              : fmt(cupon.valorDescuento) + " OFF"}
          </span>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "3px 8px",
            borderRadius: 20,
            background: isDisp
              ? "rgba(255,250,202,0.15)"
              : "rgba(255,255,255,0.1)",
            color: isDisp ? "var(--cream)" : "rgba(255,255,255,0.7)",
            border: `1px solid ${isDisp ? "rgba(255,250,202,0.25)" : "rgba(255,255,255,0.2)"}`,
          }}
        >
          {isDisp ? "Disponible" : "No disponible"}
        </span>
      </div>

      {/* Cuerpo */}
      <div style={{ padding: "14px 18px" }}>
        {cupon.promocionNombre && (
          <p
            style={{
              fontSize: 11,
              color: "var(--text3)",
              marginBottom: 8,
              fontWeight: 500,
            }}
          >
            {cupon.promocionNombre}
          </p>
        )}

        {/* Código copiable */}
        <button
          onClick={isDisp ? copy : undefined}
          disabled={!isDisp}
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "var(--bg2)",
            border: "1.5px dashed var(--border2)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: isDisp ? "pointer" : "default",
            fontFamily: "DM Sans, sans-serif",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) =>
            isDisp && (e.currentTarget.style.borderColor = "rgba(10,56,40,0.4)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "var(--border2)")
          }
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 17,
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "0.14em",
            }}
          >
            {cupon.codigo}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              color: copied ? "var(--green)" : "var(--text3)",
            }}
          >
            {copied ? <IcoCheck s={11} /> : <IcoCopy s={11} />}
            {copied ? "Copiado" : "Copiar"}
          </span>
        </button>

        {full && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "var(--text3)",
              }}
            >
              <IcoCalendar s={11} />
              Vence {cupon.fechaFin ? fmtDate(cupon.fechaFin) : "Sin fecha"}
            </span>
            {cupon.limiteUso > 0 && (
              <span style={{ fontSize: 11, color: "var(--text3)" }}>
                · Usos: {cupon.usosActuales}/{cupon.limiteUso}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NivelProgress({ puntos }) {
  if (!puntos) return null;
  const nivel = (puntos.nivel || "bronce").toLowerCase();
  const meta = NIVEL_META[nivel] || NIVEL_META.bronce;
  const hist = puntos.puntosTotalesHistoricos || 0;
  const nextThreshold = meta.next;

  if (!nextThreshold) {
    return (
      <div
        style={{
          background: "rgba(103,232,249,0.08)",
          border: "1px solid rgba(103,232,249,0.2)",
          borderRadius: 12,
          padding: "12px 16px",
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#67E8F9",
            marginBottom: 2,
          }}
        >
          Nivel máximo alcanzado
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
          ¡Eres un cliente Diamante!
        </p>
      </div>
    );
  }

  const prevThreshold = NIVEL_THRESHOLDS[nivel] || 0;
  const range = nextThreshold - prevThreshold;
  const progress = Math.min(100, ((hist - prevThreshold) / range) * 100);
  const needed = nextThreshold - hist;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
            fontWeight: 600,
          }}
        >
          Progreso → {meta.nextLabel}
        </span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
          {needed > 0
            ? `${needed.toLocaleString("es-CO")} pts restantes`
            : "¡Próximo nivel!"}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "rgba(255,255,255,0.12)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${meta.color}88, ${meta.color})`,
            transition: "width 1s ease",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 5,
        }}
      >
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
          {prevThreshold.toLocaleString("es-CO")} pts
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
          {nextThreshold.toLocaleString("es-CO")} pts
        </span>
      </div>
    </div>
  );
}

function PromoCard({ p }) {
  const BENE_ICON = {
    descuento_pct: <IcoPercent s={20} />,
    descuento_monto: <IcoCupon s={20} />,
    puntos_extra: <IcoStar s={20} />,
    regalo: <IcoGift s={20} />,
    "2x1": <span style={{ fontSize: 14, fontWeight: 800 }}>2×1</span>,
  };
  const BENE_COLOR = {
    descuento_pct: "#7C3AED",
    descuento_monto: "#2563EB",
    puntos_extra: "var(--green)",
    regalo: "#B45309",
    "2x1": "#DC2626",
  };

  const tipo = p.tipoBeneficio || "";
  const color = BENE_COLOR[tipo] || "var(--green)";
  const icon = BENE_ICON[tipo] || <IcoPromo s={20} />;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "18px 20px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `${color}12`,
          color,
          border: `1px solid ${color}22`,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 4,
          }}
        >
          <h3
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            {p.nombre}
          </h3>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: 20,
              background: `${color}12`,
              color,
            }}
          >
            {p.alcanceDisplay || p.alcance}
          </span>
        </div>
        {p.descripcion && (
          <p
            style={{
              fontSize: 13,
              color: "var(--text2)",
              lineHeight: 1.55,
              marginBottom: 8,
            }}
          >
            {p.descripcion}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {p.tipoBeneficioDisplay && (
            <span style={{ fontSize: 12, color, fontWeight: 700 }}>
              {p.tipoBeneficioDisplay}: {p.valor > 0 ? p.valor : ""}
            </span>
          )}
          {p.puntosBonus > 0 && (
            <span
              style={{ fontSize: 12, color: "var(--green)", fontWeight: 700 }}
            >
              +{p.puntosBonus} pts bonus
            </span>
          )}
          {p.fechaFin && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "var(--text3)",
              }}
            >
              <IcoCalendar s={10} /> Hasta {fmtDate(p.fechaFin)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function PerfilPage({ tab: tabProp }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, isAuthenticated } = useAuth();

  const initialTab = tabProp || searchParams.get("tab") || "dashboard";
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const t = tabProp || searchParams.get("tab");
    if (t) setTab(t);
  }, [tabProp, searchParams]);

  // ── Guard no autenticado ──────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div
        style={{
          paddingTop: 68,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          textAlign: "center",
          padding: "80px 20px",
          gap: 16,
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
          <IcoUser s={30} />
        </div>
        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: 28,
            color: "var(--text)",
          }}
        >
          Debes iniciar sesión
        </h2>
        <p style={{ color: "var(--text2)", maxWidth: 340, lineHeight: 1.65 }}>
          Accede a tu dashboard, puntos y cupones exclusivos.
        </p>
        <button onClick={() => navigate("/login")} className="btn-green">
          Ingresar / Registrarse
        </button>
      </div>
    );
  }

  const clienteId = user?.id;

  const { data: puntosData, loading: loadingPuntos } = useQuery(
    GET_PUNTOS_CLIENTE,
    {
      variables: { clienteId },
      skip: !clienteId,
    },
  );
  const { data: cuponesData, loading: loadingCupones } = useQuery(
    GET_CUPONES_CLIENTE,
    {
      variables: { clienteId },
      skip: !clienteId,
    },
  );
  const { data: txData, loading: loadingTx } = useQuery(
    GET_TRANSACCIONES_CLIENTE,
    {
      variables: { clienteId },
      skip: !clienteId,
    },
  );
  const { data: promoData, loading: loadingPromo } = useQuery(
    GET_PROMOCIONES_ACTIVAS,
    {
      variables: { activa: true },
    },
  );

  const puntos = puntosData?.puntosCliente;
  const cupones = cuponesData?.cupones || [];
  const transacs = txData?.transaccionesPuntos || [];
  const promociones = promoData?.promociones || [];
  const cuponesDisp = cupones.filter((c) => c.disponible);

  const nivel = (puntos?.nivel || "bronce").toLowerCase();
  const nivelMeta = NIVEL_META[nivel] || NIVEL_META.bronce;

  const goTab = (t) => setTab(t);

  // ── HERO ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ paddingTop: 68, minHeight: "100vh", background: "var(--bg)" }}
    >
      {/* ── Hero Header ── */}
      <div
        style={{
          background: "var(--green)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Círculos decorativos */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: 60,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(255,250,202,0.04)",
          }}
        />

        <div className="container" style={{ position: "relative" }}>
          {/* Info usuario */}
          <div
            style={{
              padding: "32px 0 0",
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            {/* Avatar con inicial */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                flexShrink: 0,
                background: "var(--cream)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "3px solid rgba(255,250,202,0.35)",
              }}
            >
              <span
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "var(--green)",
                }}
              >
                {user?.nombre?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>

            {/* Nombre + detalles */}
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "clamp(18px,4vw,26px)",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 3,
                }}
              >
                {user?.nombre}
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 8,
                }}
              >
                {user?.email}
              </p>

              {/* Badges nivel + cuenta activa */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {/* Nivel */}
                {puntos && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 12px",
                      background: nivelMeta.bg,
                      border: `1px solid ${nivelMeta.color}44`,
                      borderRadius: 20,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: nivelMeta.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: nivelMeta.color,
                      }}
                    >
                      {nivelMeta.label}
                    </span>
                    <span
                      style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}
                    >
                      · {(puntos.saldo || 0).toLocaleString("es-CO")} pts
                    </span>
                  </div>
                )}
                {/* Cuenta activa */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    background: "rgba(34,197,94,0.12)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    borderRadius: 20,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#22C55E",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#22C55E" }}
                  >
                    Cuenta activa
                  </span>
                </div>
              </div>
            </div>

            {/* Botón logout desktop */}
            <button
              onClick={logout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 10,
                color: "rgba(255,255,255,0.65)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(220,38,38,0.12)";
                e.currentTarget.style.borderColor = "rgba(220,38,38,0.3)";
                e.currentTarget.style.color = "#fc8181";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = "rgba(255,255,255,0.65)";
              }}
            >
              <IcoLogout s={13} />
              Salir
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 2,
              overflowX: "auto",
              marginTop: 28,
              paddingBottom: 0,
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => goTab(t.id)}
                style={{
                  padding: "11px 18px",
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${tab === t.id ? "var(--cream)" : "transparent"}`,
                  color:
                    tab === t.id ? "var(--cream)" : "rgba(255,255,255,0.42)",
                  fontSize: 13,
                  fontWeight: tab === t.id ? 700 : 500,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif",
                  transition: "all 0.18s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div
        className="container"
        style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 960 }}
      >
        {/* ═══════════════════════════════════════════════════
            TAB: DASHBOARD / INICIO
            ═══════════════════════════════════════════════ */}
        {tab === "dashboard" && (
          <div style={{ display: "grid", gap: 24 }}>
            {/* Stats grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
                gap: 16,
              }}
            >
              <StatCard
                icon={<IcoStar s={20} />}
                label="Puntos disponibles"
                value={
                  loadingPuntos
                    ? "—"
                    : (puntos?.saldo ?? 0).toLocaleString("es-CO")
                }
                sub="para canjear en tu próximo pedido"
                color="var(--green)"
                bg="var(--green-dim2)"
                onClick={() => goTab("puntos")}
              />
              <StatCard
                icon={<IcoTrend s={20} />}
                label="Puntos históricos"
                value={
                  loadingPuntos
                    ? "—"
                    : (puntos?.puntosTotalesHistoricos ?? 0).toLocaleString(
                        "es-CO",
                      )
                }
                sub={`Nivel ${nivelMeta.label}`}
                color="#7C3AED"
                bg="rgba(124,58,237,0.1)"
                onClick={() => goTab("puntos")}
              />
              <StatCard
                icon={<IcoCupon s={20} />}
                label="Cupones activos"
                value={loadingCupones ? "—" : cuponesDisp.length}
                sub={
                  cuponesDisp.length > 0
                    ? "disponibles para usar"
                    : "Haz pedidos para ganar más"
                }
                color="#B45309"
                bg="rgba(180,83,9,0.1)"
                onClick={() => goTab("cupones")}
              />
              <StatCard
                icon={<IcoPromo s={20} />}
                label="Promociones activas"
                value={loadingPromo ? "—" : promociones.length}
                sub="disponibles ahora mismo"
                color="#0891B2"
                bg="rgba(8,145,178,0.1)"
                onClick={() => goTab("promociones")}
              />
            </div>

            {/* Tarjeta de nivel completa */}
            {puntos && (
              <div
                style={{
                  background: "var(--green)",
                  borderRadius: 20,
                  padding: "28px 32px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -30,
                    right: -30,
                    width: 180,
                    height: 180,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.03)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: -40,
                    left: 40,
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: "rgba(255,250,202,0.04)",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    gap: 20,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.45)",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        marginBottom: 6,
                      }}
                    >
                      Saldo de puntos
                    </p>
                    <div
                      style={{
                        fontFamily: "Playfair Display, serif",
                        fontSize: "clamp(42px,8vw,64px)",
                        fontWeight: 900,
                        color: "var(--cream)",
                        lineHeight: 1,
                        marginBottom: 6,
                      }}
                    >
                      {(puntos.saldo || 0).toLocaleString("es-CO")}
                    </div>
                    <p
                      style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}
                    >
                      puntos · Nivel{" "}
                      <strong style={{ color: nivelMeta.color }}>
                        {nivelMeta.label}
                      </strong>
                    </p>
                  </div>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <NivelProgress puntos={puntos} />
                  </div>
                </div>
              </div>
            )}

            {/* Últimas transacciones */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 0,
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 16,
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
                    fontSize: 17,
                    color: "var(--text)",
                  }}
                >
                  Últimos movimientos
                </h3>
                <button
                  onClick={() => goTab("puntos")}
                  style={{
                    fontSize: 12,
                    color: "var(--green)",
                    fontWeight: 700,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  Ver historial →
                </button>
              </div>
              {loadingTx ? (
                <div style={{ padding: "20px" }}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{ display: "flex", gap: 12, marginBottom: 12 }}
                    >
                      <Skeleton w={36} h={36} r={18} />
                      <div style={{ flex: 1 }}>
                        <Skeleton h={13} w="60%" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : transacs.length === 0 ? (
                <div
                  style={{
                    padding: "48px 20px",
                    textAlign: "center",
                    color: "var(--text3)",
                  }}
                >
                  <div style={{ marginBottom: 12, opacity: 0.4 }}>
                    <IcoTrend s={36} />
                  </div>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>
                    Sin movimientos aún
                  </p>
                  <p style={{ fontSize: 13 }}>
                    Haz tu primer pedido y empieza a acumular.
                  </p>
                </div>
              ) : (
                transacs.slice(0, 5).map((tx) => <TxRow key={tx.id} tx={tx} />)
              )}
            </div>

            {/* Cupones destacados */}
            {cuponesDisp.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
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
                      fontSize: 17,
                      color: "var(--text)",
                    }}
                  >
                    Cupones disponibles
                  </h3>
                  <button
                    onClick={() => goTab("cupones")}
                    style={{
                      fontSize: 12,
                      color: "var(--green)",
                      fontWeight: 700,
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
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                    gap: 12,
                  }}
                >
                  {cuponesDisp.slice(0, 3).map((c) => (
                    <CuponCard key={c.id} cupon={c} />
                  ))}
                </div>
              </div>
            )}

            {/* Promociones vigentes (snippet) */}
            {promociones.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
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
                      fontSize: 17,
                      color: "var(--text)",
                    }}
                  >
                    Promociones activas
                  </h3>
                  <button
                    onClick={() => goTab("promociones")}
                    style={{
                      fontSize: 12,
                      color: "var(--green)",
                      fontWeight: 700,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    Ver todas →
                  </button>
                </div>
                <div style={{ padding: "16px 20px", display: "grid", gap: 12 }}>
                  {promociones.slice(0, 2).map((p) => (
                    <PromoCard key={p.id} p={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB: PUNTOS
            ═══════════════════════════════════════════════ */}
        {tab === "puntos" && (
          <div style={{ display: "grid", gap: 24 }}>
            {/* Tarjeta hero de puntos */}
            <div
              style={{
                background: "var(--green)",
                borderRadius: 20,
                padding: "32px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.03)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -50,
                  left: 60,
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background: "rgba(255,250,202,0.04)",
                }}
              />
              <div style={{ position: "relative" }}>
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Saldo disponible
                </p>
                {loadingPuntos ? (
                  <div
                    style={{
                      height: 64,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Skeleton w={180} h={52} r={8} />
                  </div>
                ) : (
                  <div
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "clamp(48px,10vw,72px)",
                      fontWeight: 900,
                      color: "var(--cream)",
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    {(puntos?.saldo || 0).toLocaleString("es-CO")}
                  </div>
                )}
                <p
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.55)",
                    marginBottom: 20,
                  }}
                >
                  puntos · Nivel{" "}
                  <strong style={{ color: nivelMeta.color }}>
                    {nivelMeta.label}
                  </strong>
                  {puntos && (
                    <span
                      style={{
                        color: "rgba(255,255,255,0.35)",
                        marginLeft: 12,
                      }}
                    >
                      ·{" "}
                      {(puntos.puntosTotalesHistoricos || 0).toLocaleString(
                        "es-CO",
                      )}{" "}
                      pts históricos
                    </span>
                  )}
                </p>
                <NivelProgress puntos={puntos} />
              </div>
            </div>

            {/* Info niveles */}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "20px 24px",
              }}
            >
              <h3
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: 16,
                  color: "var(--text)",
                  marginBottom: 16,
                }}
              >
                Niveles de fidelización
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                  gap: 10,
                }}
              >
                {Object.entries(NIVEL_META).map(([key, m]) => (
                  <div
                    key={key}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: nivel === key ? m.bg : "var(--bg2)",
                      border: `1.5px solid ${nivel === key ? m.color + "44" : "var(--border2)"}`,
                      opacity: nivel === key ? 1 : 0.7,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: m.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: nivel === key ? m.color : "var(--text2)",
                        }}
                      >
                        {m.label}
                      </span>
                      {nivel === key && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            color: m.color,
                            background: m.bg,
                            padding: "1px 6px",
                            borderRadius: 20,
                          }}
                        >
                          ACTUAL
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text3)" }}>
                      {key === "diamante"
                        ? "10.000+ pts"
                        : `${NIVEL_THRESHOLDS[key].toLocaleString("es-CO")}+ pts`}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Historial completo */}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 16,
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
                    fontSize: 17,
                    color: "var(--text)",
                  }}
                >
                  Historial de movimientos
                </h3>
              </div>
              {loadingTx ? (
                <div style={{ padding: 20 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{ display: "flex", gap: 12, marginBottom: 14 }}
                    >
                      <Skeleton w={36} h={36} r={18} />
                      <div style={{ flex: 1 }}>
                        <Skeleton h={13} w="55%" r={6} />
                        <div style={{ marginTop: 6 }}>
                          <Skeleton h={11} w="30%" r={4} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : transacs.length === 0 ? (
                <div style={{ padding: "60px 20px", textAlign: "center" }}>
                  <div
                    style={{
                      marginBottom: 14,
                      color: "var(--text3)",
                      opacity: 0.35,
                    }}
                  >
                    <IcoTrend s={44} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: 20,
                      color: "var(--text)",
                      marginBottom: 8,
                    }}
                  >
                    Sin movimientos
                  </h3>
                  <p style={{ color: "var(--text2)" }}>
                    Haz tu primer pedido y empieza a acumular puntos.
                  </p>
                </div>
              ) : (
                transacs.map((tx) => <TxRow key={tx.id} tx={tx} />)
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB: CUPONES
            ═══════════════════════════════════════════════ */}
        {tab === "cupones" && (
          <div style={{ display: "grid", gap: 24 }}>
            {/* Contadores */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div
                style={{
                  padding: "10px 18px",
                  background: "var(--green-dim2)",
                  border: "1px solid rgba(10,56,40,0.18)",
                  borderRadius: 99,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
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
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--green)",
                  }}
                >
                  {cuponesDisp.length} disponibles
                </span>
              </div>
              <div
                style={{
                  padding: "10px 18px",
                  background: "var(--bg2)",
                  border: "1px solid var(--border2)",
                  borderRadius: 99,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--text3)",
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--text3)",
                  }}
                >
                  {cupones.filter((c) => !c.disponible).length} expirados /
                  usados
                </span>
              </div>
            </div>

            {loadingCupones ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
                  gap: 16,
                }}
              >
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: 140 }} className="skeleton" />
                ))}
              </div>
            ) : cupones.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "72px 20px",
                  background: "#fff",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    marginBottom: 16,
                    color: "var(--text3)",
                    opacity: 0.3,
                  }}
                >
                  <IcoCupon s={52} />
                </div>
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: 22,
                    color: "var(--text)",
                    marginBottom: 8,
                  }}
                >
                  Sin cupones aún
                </h3>
                <p
                  style={{
                    color: "var(--text2)",
                    maxWidth: 340,
                    margin: "0 auto",
                  }}
                >
                  Acumula puntos haciendo pedidos y desbloquea cupones
                  exclusivos.
                </p>
              </div>
            ) : (
              <>
                {cuponesDisp.length > 0 && (
                  <div>
                    <h3
                      style={{
                        fontFamily: "Playfair Display, serif",
                        fontSize: 16,
                        color: "var(--text)",
                        marginBottom: 14,
                      }}
                    >
                      Disponibles para usar
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill,minmax(280px,1fr))",
                        gap: 14,
                      }}
                    >
                      {cuponesDisp.map((c) => (
                        <CuponCard key={c.id} cupon={c} full />
                      ))}
                    </div>
                  </div>
                )}
                {cupones.filter((c) => !c.disponible).length > 0 && (
                  <div>
                    <h3
                      style={{
                        fontFamily: "Playfair Display, serif",
                        fontSize: 16,
                        color: "var(--text3)",
                        marginBottom: 14,
                      }}
                    >
                      Expirados / usados
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill,minmax(280px,1fr))",
                        gap: 14,
                      }}
                    >
                      {cupones
                        .filter((c) => !c.disponible)
                        .map((c) => (
                          <CuponCard key={c.id} cupon={c} full />
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB: PROMOCIONES
            ═══════════════════════════════════════════════ */}
        {tab === "promociones" && (
          <div style={{ display: "grid", gap: 16 }}>
            {loadingPromo ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 96, borderRadius: 16 }}
                />
              ))
            ) : promociones.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "72px 20px",
                  background: "#fff",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    marginBottom: 16,
                    color: "var(--text3)",
                    opacity: 0.3,
                  }}
                >
                  <IcoPromo s={52} />
                </div>
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: 22,
                    color: "var(--text)",
                    marginBottom: 8,
                  }}
                >
                  Sin promociones activas
                </h3>
                <p style={{ color: "var(--text2)" }}>
                  Pronto habrá ofertas especiales para ti.
                </p>
              </div>
            ) : (
              promociones.map((p) => <PromoCard key={p.id} p={p} />)
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB: MI CUENTA
            ═══════════════════════════════════════════════ */}
        {tab === "cuenta" && (
          <div style={{ display: "grid", gap: 20, maxWidth: 580 }}>
            {/* Info personal */}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--bg2)",
                }}
              >
                <IcoUser s={16} />
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: 17,
                    color: "var(--text)",
                  }}
                >
                  Datos personales
                </h3>
              </div>
              <div style={{ padding: "20px" }}>
                {[
                  ["Nombre completo", user?.nombre],
                  ["Correo electrónico", user?.email],
                  ["Rol", user?.rol?.replace(/_/g, " ")],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      marginBottom: 18,
                      paddingBottom: 18,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--text3)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--text)",
                        fontWeight: 500,
                      }}
                    >
                      {value || "—"}
                    </p>
                  </div>
                ))}
                {/* Estado cuenta */}
                <div>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--text3)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Estado de cuenta
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 12px",
                        background: "rgba(34,197,94,0.1)",
                        border: "1px solid rgba(34,197,94,0.2)",
                        borderRadius: 20,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#22C55E",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#16A34A",
                        }}
                      >
                        Cuenta activa
                      </span>
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 12px",
                        borderRadius: 20,
                        background: user?.emailVerificado
                          ? "rgba(34,197,94,0.1)"
                          : "rgba(245,158,11,0.1)",
                        border: `1px solid ${user?.emailVerificado ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
                      }}
                    >
                      {user?.emailVerificado ? (
                        <IcoCheck s={11} />
                      ) : (
                        <IcoShield s={11} />
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: user?.emailVerificado ? "#16A34A" : "#B45309",
                        }}
                      >
                        Email{" "}
                        {user?.emailVerificado ? "verificado" : "pendiente"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen fidelización */}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--bg2)",
                }}
              >
                <IcoStar s={16} />
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: 17,
                    color: "var(--text)",
                  }}
                >
                  Tu cuenta de puntos
                </h3>
              </div>
              <div style={{ padding: "20px" }}>
                {loadingPuntos ? (
                  [1, 2].map((i) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <Skeleton h={13} w="50%" />
                    </div>
                  ))
                ) : puntos ? (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      {[
                        [
                          "Saldo disponible",
                          `${(puntos.saldo || 0).toLocaleString("es-CO")} pts`,
                          nivelMeta.color,
                        ],
                        [
                          "Puntos históricos",
                          `${(puntos.puntosTotalesHistoricos || 0).toLocaleString("es-CO")} pts`,
                          "var(--text)",
                        ],
                        ["Nivel actual", nivelMeta.label, nivelMeta.color],
                        ["Cupones activos", `${cuponesDisp.length}`, "#B45309"],
                      ].map(([l, v, c]) => (
                        <div
                          key={l}
                          style={{
                            padding: "12px 14px",
                            background: "var(--bg2)",
                            borderRadius: 10,
                          }}
                        >
                          <p
                            style={{
                              fontSize: 10,
                              color: "var(--text3)",
                              fontWeight: 600,
                              marginBottom: 4,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            {l}
                          </p>
                          <p
                            style={{
                              fontFamily: "Playfair Display, serif",
                              fontSize: 18,
                              fontWeight: 700,
                              color: c,
                            }}
                          >
                            {v}
                          </p>
                        </div>
                      ))}
                    </div>
                    <NivelProgressMini puntos={puntos} nivelMeta={nivelMeta} />
                  </>
                ) : (
                  <p style={{ color: "var(--text3)", fontSize: 13 }}>
                    Aún no tienes cuenta de puntos. ¡Haz tu primer pedido!
                  </p>
                )}
              </div>
            </div>

            {/* Cerrar sesión */}
            <button
              onClick={logout}
              style={{
                width: "100%",
                padding: 14,
                background: "transparent",
                border: "1.5px solid rgba(220,38,38,0.25)",
                borderRadius: 12,
                color: "#DC2626",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(220,38,38,0.05)";
                e.currentTarget.style.borderColor = "rgba(220,38,38,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(220,38,38,0.25)";
              }}
            >
              <IcoLogout s={15} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Mini progress para pestaña Cuenta
function NivelProgressMini({ puntos, nivelMeta }) {
  const nivel = (puntos?.nivel || "bronce").toLowerCase();
  const meta = NIVEL_META[nivel] || NIVEL_META.bronce;
  if (!meta.next) return null;
  const hist = puntos?.puntosTotalesHistoricos || 0;
  const prev = NIVEL_THRESHOLDS[nivel] || 0;
  const pct = Math.min(100, ((hist - prev) / (meta.next - prev)) * 100);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 11, color: "var(--text3)" }}>
          Progreso hacia {meta.nextLabel}
        </span>
        <span style={{ fontSize: 11, color: "var(--text3)" }}>
          {(meta.next - hist).toLocaleString("es-CO")} pts restantes
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "var(--bg3)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${meta.color}66, ${meta.color})`,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}
