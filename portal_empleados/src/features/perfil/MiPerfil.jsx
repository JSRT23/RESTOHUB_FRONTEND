// portal_empleados/src/features/perfil/MiPerfil.jsx
import { useQuery } from "@apollo/client/react";
import { useAuth } from "../../app/auth/AuthContext";
import { GET_EMPLEADO } from "../turno/graphql/operations";

const G = { 50: "#DAF1DE", 100: "#8EB69B", 300: "#235347", 900: "#051F20" };

const ROL_CFG = {
  mesero: { label: "Mesero", color: "#2563eb", bg: "#eff6ff" },
  cocinero: { label: "Cocinero", color: "#d97706", bg: "#fffbeb" },
  cajero: { label: "Cajero", color: "#7c3aed", bg: "#f5f3ff" },
  repartidor: { label: "Repartidor", color: "#235347", bg: "#DAF1DE" },
  supervisor: { label: "Supervisor", color: "#235347", bg: "#DAF1DE" },
};

/* ── Icons ────────────────────────────────────────────────────────────────── */
const IcoMail = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="m2 7 10 7 10-7" />
  </svg>
);
const IcoPhone = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 11.9 19.79 19.79 0 0 1 1.12 3.27 2 2 0 0 1 3.11 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
  </svg>
);
const IcoID = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const IcoStore = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);
const IcoCal = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcoOut = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid #f0ede8",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#a8a29e" }}>{icon}</span>
        <span
          className="font-dm"
          style={{ color: "#78716c", fontSize: "13px" }}
        >
          {label}
        </span>
      </div>
      <span
        className="font-dm"
        style={{
          color: "#1c1917",
          fontSize: "13px",
          fontWeight: "500",
          textAlign: "right",
          maxWidth: "55%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function MiPerfil() {
  const { user, logout } = useAuth();
  const { data, loading } = useQuery(GET_EMPLEADO, {
    variables: { empleadoId: user?.empleadoId },
    skip: !user?.empleadoId,
    fetchPolicy: "cache-first",
  });

  const emp = data?.empleado;
  const rol = ROL_CFG[user?.rol] ?? ROL_CFG.mesero;
  const nombre = emp ? `${emp.nombre} ${emp.apellido}` : (user?.nombre ?? "?");
  const ini = nombre[0].toUpperCase();

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
        Mi perfil
      </h1>

      {/* Avatar card */}
      <div
        className="card anim-fadeup d1"
        style={{
          padding: "24px 20px",
          textAlign: "center",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            background: G[50],
            border: `1.5px solid ${G[100]}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            boxShadow: "0 4px 12px rgba(35,83,71,.15)",
          }}
        >
          <span
            className="font-playfair"
            style={{ color: G[300], fontSize: "28px", fontWeight: "700" }}
          >
            {ini}
          </span>
        </div>
        <h2
          className="font-playfair"
          style={{
            color: "#1c1917",
            fontSize: "19px",
            fontWeight: "700",
            margin: "0 0 8px",
          }}
        >
          {loading ? "..." : nombre}
        </h2>
        <span
          className="font-dm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: ".07em",
            padding: "4px 12px",
            borderRadius: "20px",
            background: rol.bg,
            color: rol.color,
            border: `1px solid ${rol.color}25`,
          }}
        >
          {rol.label}
        </span>
      </div>

      {/* Info card */}
      <div
        className="card anim-fadeup d2"
        style={{ padding: "4px 18px", marginBottom: "12px" }}
      >
        {loading ? (
          <div
            style={{
              padding: "16px 0",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: "16px" }} />
            ))}
          </div>
        ) : (
          <>
            <InfoRow
              icon={<IcoMail />}
              label="Correo"
              value={emp?.email ?? user?.email}
            />
            <InfoRow
              icon={<IcoPhone />}
              label="Teléfono"
              value={emp?.telefono}
            />
            <InfoRow
              icon={<IcoID />}
              label="Documento"
              value={emp?.documento}
            />
            <InfoRow
              icon={<IcoStore />}
              label="Restaurante"
              value={emp?.restauranteNombre}
            />
            <InfoRow
              icon={<IcoCal />}
              label="Contratación"
              value={
                emp?.fechaContratacion
                  ? new Date(emp.fechaContratacion).toLocaleDateString(
                      "es-CO",
                      { day: "numeric", month: "long", year: "numeric" },
                    )
                  : null
              }
            />
          </>
        )}
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={logout}
        className="anim-fadeup d3"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          padding: "13px",
          borderRadius: "14px",
          border: "1px solid #fecaca",
          background: "#fef2f2",
          color: "#dc2626",
          fontFamily: "'DM Sans',sans-serif",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all .15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#fee2e2";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#fef2f2";
        }}
      >
        <IcoOut /> Cerrar sesión
      </button>
    </div>
  );
}
