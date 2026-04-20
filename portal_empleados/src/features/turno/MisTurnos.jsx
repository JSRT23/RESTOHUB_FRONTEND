// portal_empleados/src/features/turno/MisTurnos.jsx
import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "../../app/auth/AuthContext";
import { GET_TURNOS } from "./graphql/operations";

const ds = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const after = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ds(d);
};
const fmtHora = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const fmtFecha = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso),
    h = new Date(),
    m = new Date();
  m.setDate(m.getDate() + 1);
  if (d.toDateString() === h.toDateString()) return "Hoy";
  if (d.toDateString() === m.toDateString()) return "Mañana";
  return d.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

// ── Estados con keys exactas del backend ─────────────────────────────────
const ECFG = {
  programado: {
    label: "Programado",
    dot: "#2563eb",
    text: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  activo: {
    label: "En curso",
    dot: "#235347",
    text: "#235347",
    bg: "#DAF1DE",
    border: "#8EB69B",
  },
  completado: {
    label: "Completado",
    dot: "#a8a29e",
    text: "#78716c",
    bg: "#f5f5f4",
    border: "#e7e5e4",
  },
  cancelado: {
    label: "Cancelado",
    dot: "#dc2626",
    text: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
  },
};

const IcoChev = ({ open }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: open ? "rotate(180deg)" : "none",
      transition: "transform .2s",
    }}
  >
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

function TurnoCard({ turno, delay = 0 }) {
  const [open, setOpen] = useState(false);
  const cfg = ECFG[turno.estado] ?? ECFG.programado;
  const vivo = turno.estado === "activo";

  return (
    <button
      onClick={() => setOpen(!open)}
      className="card anim-fadeup font-dm"
      style={{
        width: "100%",
        textAlign: "left",
        padding: "14px 16px",
        cursor: "pointer",
        animationDelay: `${delay}s`,
        display: "block",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow =
          "0 4px 12px rgba(0,0,0,.08),0 16px 40px rgba(0,0,0,.06)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow =
          "0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04)")
      }
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: 0,
          }}
        >
          <span
            className={vivo ? "anim-pulse" : ""}
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              flexShrink: 0,
              background: cfg.dot,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                color: "#1c1917",
                fontWeight: "600",
                fontSize: "14px",
                margin: "0 0 2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fmtFecha(turno.fechaInicio)}
            </p>
            <p style={{ color: "#78716c", fontSize: "12px", margin: 0 }}>
              {fmtHora(turno.fechaInicio)} – {fmtHora(turno.fechaFin)}
              {turno.duracionHoras
                ? ` · ${turno.duracionHoras.toFixed(1)}h`
                : ""}
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: ".04em",
              textTransform: "uppercase",
              padding: "3px 9px",
              borderRadius: "20px",
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              color: cfg.text,
            }}
          >
            {cfg.label}
          </span>
          <span style={{ color: "#a8a29e" }}>
            <IcoChev open={open} />
          </span>
        </div>
      </div>

      {open && (
        <div
          className="anim-fadein"
          style={{
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid #f0ede8",
          }}
        >
          {[
            ["Inicio", fmtHora(turno.fechaInicio)],
            ["Fin", fmtHora(turno.fechaFin)],
            [
              "Duración",
              turno.duracionHoras ? `${turno.duracionHoras.toFixed(1)}h` : "—",
            ],
            ...(turno.notas ? [["Nota", turno.notas]] : []),
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
              }}
            >
              <span style={{ color: "#a8a29e", fontSize: "12px" }}>{k}</span>
              <span
                style={{
                  color: "#78716c",
                  fontSize: "12px",
                  fontStyle: k === "Nota" ? "italic" : "normal",
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

function Lista({ turnos, loading, vacio }) {
  if (loading)
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: "60px" }} />
        ))}
      </div>
    );
  if (!turnos.length)
    return (
      <div
        className="font-dm"
        style={{ textAlign: "center", padding: "48px 20px" }}
      >
        <p
          style={{
            color: "#78716c",
            fontSize: "14px",
            margin: "0 0 4px",
            fontWeight: "500",
          }}
        >
          {vacio}
        </p>
        <p style={{ color: "#a8a29e", fontSize: "12px", margin: 0 }}>
          Aquí aparecerán cuando estén disponibles
        </p>
      </div>
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {turnos.map((t, i) => (
        <TurnoCard key={t.id} turno={t} delay={i * 0.04} />
      ))}
    </div>
  );
}

export default function MisTurnos() {
  const { user } = useAuth();
  const [tab, setTab] = useState("hoy");

  const base = { skip: !user?.empleadoId, fetchPolicy: "cache-and-network" };
  const { data: dH, loading: lH } = useQuery(GET_TURNOS, {
    ...base,
    variables: {
      empleadoId: user?.empleadoId,
      fechaDesde: ds(),
      fechaHasta: ds(),
    },
    skip: !user?.empleadoId || tab !== "hoy",
  });
  const { data: dP, loading: lP } = useQuery(GET_TURNOS, {
    ...base,
    variables: {
      empleadoId: user?.empleadoId,
      fechaDesde: after(1),
      fechaHasta: after(30),
    },
    skip: !user?.empleadoId || tab !== "proximos",
  });
  const { data: dX, loading: lX } = useQuery(GET_TURNOS, {
    ...base,
    variables: {
      empleadoId: user?.empleadoId,
      fechaDesde: after(-90),
      fechaHasta: ds(),
    },
    skip: !user?.empleadoId || tab !== "historial",
  });

  const tH = dH?.turnos ?? [];
  const tP = dP?.turnos ?? [];
  const tX = (dX?.turnos ?? []).filter((t) =>
    ["completado", "cancelado"].includes(t.estado),
  );

  const TABS = [
    { id: "hoy", label: "Hoy", n: tH.length },
    { id: "proximos", label: "Próximos", n: tP.length },
    { id: "historial", label: "Historial", n: tX.length },
  ];

  return (
    <div
      className="font-dm"
      style={{
        minHeight: "100svh",
        background: "#e8e8e6",
        padding: "48px 16px 88px",
      }}
    >
      <h1
        className="font-playfair anim-fadeup"
        style={{
          color: "#1c1917",
          fontSize: "24px",
          fontWeight: "700",
          margin: "0 0 20px",
          letterSpacing: "-.3px",
        }}
      >
        Mis turnos
      </h1>

      {/* Tabs */}
      <div
        className="card anim-fadeup d1"
        style={{
          display: "flex",
          gap: "2px",
          padding: "4px",
          marginBottom: "16px",
        }}
      >
        {TABS.map(({ id, label, n }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="font-dm"
              style={{
                flex: 1,
                padding: "9px 4px",
                borderRadius: "12px",
                border: "none",
                background: active ? "#051F20" : "transparent",
                color: active ? "#fff" : "#78716c",
                fontSize: "13px",
                fontWeight: active ? "600" : "400",
                cursor: "pointer",
                transition: "all .15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              {label}
              {n > 0 && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    background: active ? "rgba(255,255,255,.15)" : "#f0ede8",
                    color: active ? "#DAF1DE" : "#a8a29e",
                  }}
                >
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "hoy" && (
        <Lista turnos={tH} loading={lH} vacio="Sin turnos para hoy" />
      )}
      {tab === "proximos" && (
        <Lista turnos={tP} loading={lP} vacio="Sin turnos próximos" />
      )}
      {tab === "historial" && (
        <Lista turnos={tX} loading={lX} vacio="Sin historial aún" />
      )}
    </div>
  );
}
