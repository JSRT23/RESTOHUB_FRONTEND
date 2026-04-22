// portal_empleados/src/features/kiosco/KioscoScreen.jsx
// Kiosco supervisor — pantalla táctil grande.
// SIN botón de acción manual en el panel QR.
// En su lugar: aviso importante en azul/amarillo debajo del QR.
// El supervisor puede iniciar manualmente SOLO desde el log lateral.

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../../app/auth/AuthContext";
import {
  GET_EMPLEADOS,
  GET_TURNOS,
  INICIAR_TURNO,
  REGISTRAR_SALIDA,
} from "../turno/graphql/operations";
import Swal from "sweetalert2";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const ds = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmtHora = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const ECFG = {
  programado: {
    label: "Programado",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    qrColor: "2563eb",
    accent: "rgba(37,99,235,.08)",
  },
  activo: {
    label: "En curso",
    color: G[300],
    bg: G[50],
    border: G[100],
    qrColor: "235347",
    accent: "rgba(35,83,71,.08)",
  },
  completado: {
    label: "Completado",
    color: "#78716c",
    bg: "#f5f5f4",
    border: "#e7e5e4",
    qrColor: "78716c",
    accent: "rgba(120,113,108,.06)",
  },
  cancelado: {
    label: "Cancelado",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    qrColor: "dc2626",
    accent: "rgba(220,38,38,.06)",
  },
};

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IcoSearch = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IcoLogout = () => (
  <svg
    width="18"
    height="18"
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
const IcoBack = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15,18 9,12 15,6" />
  </svg>
);
const IcoUser = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IcoClock = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);
const IcoCheck = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20,6 9,17 4,12" />
  </svg>
);
const IcoWarning = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IcoPlay = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);
const IcoStop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);
const IcoRefresh = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

/* ── QR Panel: sin botón manual, con aviso ──────────────────────────────── */
function QRPanel({ token, expiraEn, nombre, accion, onVolver }) {
  const [segs, setSegs] = useState(null);
  const [qrKey, setQrKey] = useState(0); // forzar reload del QR

  useEffect(() => {
    setSegs(null);
    if (!expiraEn) return;
    const calc = () =>
      setSegs(
        Math.max(0, Math.floor((new Date(expiraEn) - Date.now()) / 1000)),
      );
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiraEn, token]);

  const exp = segs !== null && segs <= 0;
  const urgente = segs !== null && segs > 0 && segs < 60;
  const cfg = accion === "iniciar" ? ECFG.programado : ECFG.activo;

  const minutos = segs !== null && segs > 0 ? Math.floor(segs / 60) : 0;
  const secs = segs !== null && segs > 0 ? segs % 60 : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: "20px",
      }}
    >
      {/* Header acción */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: ".1em",
              padding: "5px 14px",
              borderRadius: "20px",
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: cfg.color,
                display: "inline-block",
                animation:
                  accion === "finalizar"
                    ? "pulse 1.5s ease-in-out infinite"
                    : "none",
              }}
            />
            {accion === "iniciar" ? "Iniciando turno" : "Registrando salida"}
          </span>
        </div>
        <button
          onClick={onVolver}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "8px 14px",
            color: "#78716c",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
            transition: "all .15s",
          }}
        >
          <IcoBack /> Nuevo empleado
        </button>
      </div>

      {/* Nombre empleado */}
      <div>
        <h2
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "28px",
            fontWeight: "700",
            color: "#1c1917",
            margin: "0 0 4px",
            letterSpacing: "-.4px",
          }}
        >
          {nombre}
        </h2>
        <p
          style={{
            fontFamily: "'DM Sans',sans-serif",
            fontSize: "15px",
            color: "#78716c",
            margin: 0,
          }}
        >
          {accion === "iniciar"
            ? "Escanea el código con tu celular para iniciar el turno"
            : "Escanea el código con tu celular para registrar tu salida"}
        </p>
      </div>

      {/* QR grande centrado */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            padding: "18px",
            borderRadius: "28px",
            border: `4px solid ${exp ? "#e7e5e4" : cfg.color}`,
            background: "#fff",
            boxShadow: exp
              ? "0 4px 20px rgba(0,0,0,.06)"
              : `0 8px 40px ${cfg.accent.replace(".08", ".2")}, 0 2px 8px rgba(0,0,0,.08)`,
            opacity: exp ? 0.45 : 1,
            filter: exp ? "grayscale(1)" : "none",
            transition: "all .4s ease",
            position: "relative",
          }}
        >
          <img
            key={qrKey}
            src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(token)}&color=${exp ? "9ca3af" : cfg.qrColor}&bgcolor=ffffff&format=svg&qzone=1`}
            alt="QR de turno"
            width={260}
            height={260}
            style={{ display: "block", borderRadius: "12px" }}
          />
          {/* Esquinas decorativas estilo iPhone (solo cuando activo) */}
          {!exp &&
            [
              {
                top: 0,
                left: 0,
                borderTop: `3px solid ${cfg.color}`,
                borderLeft: `3px solid ${cfg.color}`,
                borderTopLeftRadius: "20px",
              },
              {
                top: 0,
                right: 0,
                borderTop: `3px solid ${cfg.color}`,
                borderRight: `3px solid ${cfg.color}`,
                borderTopRightRadius: "20px",
              },
              {
                bottom: 0,
                left: 0,
                borderBottom: `3px solid ${cfg.color}`,
                borderLeft: `3px solid ${cfg.color}`,
                borderBottomLeftRadius: "20px",
              },
              {
                bottom: 0,
                right: 0,
                borderBottom: `3px solid ${cfg.color}`,
                borderRight: `3px solid ${cfg.color}`,
                borderBottomRightRadius: "20px",
              },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: "28px",
                  height: "28px",
                  ...s,
                  opacity: 0.6,
                }}
              />
            ))}
        </div>

        {/* Timer */}
        {segs !== null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "30px",
              fontSize: "15px",
              fontWeight: "600",
              fontFamily: "'DM Sans',sans-serif",
              background: exp ? "#fef2f2" : urgente ? "#fffbeb" : "#f5f5f4",
              border: `1px solid ${exp ? "#fecaca" : urgente ? "#fde68a" : "#e7e5e4"}`,
              color: exp ? "#dc2626" : urgente ? "#d97706" : "#78716c",
              transition: "all .3s",
            }}
          >
            <IcoClock size={16} />
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {exp
                ? "QR vencido"
                : urgente
                  ? `Expira en ${minutos}:${String(secs).padStart(2, "0")} — renueva el QR`
                  : `Válido por ${minutos}:${String(secs).padStart(2, "0")}`}
            </span>
          </div>
        )}

        {/* ── AVISO IMPORTANTE — sin botón manual ────────────────────────── */}
        <div
          style={{
            width: "100%",
            maxWidth: "480px",
            background: exp ? "#fffbeb" : "rgba(59,130,246,.06)",
            border: `1.5px solid ${exp ? "#fde68a" : "rgba(59,130,246,.25)"}`,
            borderRadius: "16px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <span
            style={{
              color: exp ? "#d97706" : "#2563eb",
              flexShrink: 0,
              marginTop: "1px",
            }}
          >
            <IcoWarning />
          </span>
          <div>
            <p
              style={{
                fontFamily: "'DM Sans',sans-serif",
                fontSize: "14px",
                fontWeight: "700",
                color: exp ? "#92400e" : "#1d4ed8",
                margin: "0 0 3px",
              }}
            >
              {exp
                ? "QR vencido — solicita actualización"
                : "¿Problema al escanear?"}
            </p>
            <p
              style={{
                fontFamily: "'DM Sans',sans-serif",
                fontSize: "13px",
                lineHeight: "1.5",
                color: exp ? "#92400e" : "#3b82f6",
                margin: 0,
              }}
            >
              Si el QR no funciona, comunícate con el supervisor para que{" "}
              <strong>actualice el turno manualmente</strong> desde el panel de
              control.
            </p>
          </div>
        </div>
        <style>{`
          @keyframes spin  { to { transform:rotate(360deg); } }
          @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        `}</style>
      </div>
    </div>
  );
}

/* ── Fichaje row ────────────────────────────────────────────────────────── */
function FichajeRow({ f, isNew }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "11px 14px",
        borderRadius: "12px",
        background: isNew
          ? f.tipo === "Entrada"
            ? "rgba(218,241,222,.4)"
            : "rgba(255,243,199,.4)"
          : "transparent",
        border: isNew
          ? `1px solid ${f.tipo === "Entrada" ? G[100] : "#fde68a"}`
          : "1px solid transparent",
        transition: "all .3s",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "10px",
          flexShrink: 0,
          background: f.tipo === "Entrada" ? G[50] : "#fef3c7",
          border: `1px solid ${f.tipo === "Entrada" ? G[100] : "#fde68a"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: f.tipo === "Entrada" ? G[300] : "#d97706",
        }}
      >
        {f.tipo === "Entrada" ? (
          <IcoCheck />
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9,10 4,15 9,20" />
            <path d="M20 4v7a4 4 0 0 1-4 4H4" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'DM Sans',sans-serif",
            color: "#1c1917",
            fontSize: "14px",
            fontWeight: "500",
            margin: "0 0 1px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {f.nombre}
        </p>
        <p
          style={{
            fontFamily: "'DM Sans',sans-serif",
            color: f.tipo === "Entrada" ? G[300] : "#d97706",
            fontSize: "12px",
            margin: 0,
            fontWeight: "600",
          }}
        >
          {f.tipo}
        </p>
      </div>
      <span
        style={{
          fontFamily: "monospace",
          color: "#a8a29e",
          fontSize: "13px",
          fontWeight: "500",
          flexShrink: 0,
        }}
      >
        {f.hora}
      </span>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function KioscoScreen() {
  const { user, logout } = useAuth();
  const inputRef = useRef(null);
  const [doc, setDoc] = useState("");
  const [buscado, setBuscado] = useState(null);
  const [turno, setTurno] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fichajes, setFichajes] = useState([]);
  const [newFichajeId, setNewFichajeId] = useState(null);
  const [reloj, setReloj] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setReloj(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: empData } = useQuery(GET_EMPLEADOS, {
    variables: { restauranteId: user?.restauranteId },
    skip: !user?.restauranteId,
    fetchPolicy: "cache-and-network",
  });
  const { data: tData, refetch: rT } = useQuery(GET_TURNOS, {
    variables: { empleadoId: buscado?.id, fechaDesde: ds(), fechaHasta: ds() },
    skip: !buscado?.id,
    fetchPolicy: "network-only",
  });

  // Turnos del restaurante hoy — para contadores reales del header
  const { data: tRestData, refetch: rRestT } = useQuery(GET_TURNOS, {
    variables: {
      restauranteId: user?.restauranteId,
      fechaDesde: ds(),
      fechaHasta: ds(),
    },
    skip: !user?.restauranteId,
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });

  const [iniciarTurno] = useMutation(INICIAR_TURNO);
  const [registrarSalida] = useMutation(REGISTRAR_SALIDA);

  // ── Auto-cancelar turno ACTIVO si pasaron 30min después de fechaFin ───────
  const canceladosAutoRef = useRef(new Set());
  useEffect(() => {
    if (!turno || turno.estado !== "activo" || !turno.fechaFin) return;
    const check = () => {
      const limiteCancel = new Date(turno.fechaFin).getTime() + 30 * 60000;
      if (
        Date.now() > limiteCancel &&
        !canceladosAutoRef.current.has(turno.id)
      ) {
        canceladosAutoRef.current.add(turno.id);
        rT()
          .then(() => limpiar())
          .catch(() => {});
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [turno?.id, turno?.estado, turno?.fechaFin]);

  const empleados = empData?.empleados ?? [];
  const turnos = tData?.turnos ?? [];

  useEffect(() => {
    if (!buscado) return;
    setTurno(
      turnos.find((t) => t.estado === "activo") ??
        turnos.find((t) => t.estado === "programado") ??
        null,
    );
  }, [turnos, buscado]);

  const buscar = () => {
    if (!doc.trim()) return;
    const e = empleados.find(
      (x) => x.documento.toLowerCase() === doc.trim().toLowerCase(),
    );
    if (!e) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        confirmButtonColor: G[900],
        title: "Empleado no encontrado",
        text: "No hay empleado activo con ese número de documento.",
      });
      return;
    }
    setBuscado(e);
    setDoc("");
  };

  const limpiar = () => {
    setBuscado(null);
    setTurno(null);
    setDoc("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const ejecutar = async (accion) => {
    if (!turno) return;
    setBusy(true);
    try {
      const nombre = `${buscado.nombre} ${buscado.apellido}`;
      const tipo = accion === "iniciar" ? "Entrada" : "Salida";
      if (accion === "iniciar") {
        const { data: r } = await iniciarTurno({
          variables: { turnoId: turno.id },
        });
        if (!r?.iniciarTurno?.ok)
          throw new Error(r?.iniciarTurno?.errores ?? "Error");
      } else {
        const { data: r } = await registrarSalida({
          variables: { turnoId: turno.id },
        });
        if (!r?.registrarSalida?.ok)
          throw new Error(r?.registrarSalida?.errores ?? "Error");
      }
      const nuevoFichaje = {
        nombre,
        tipo,
        hora: fmtHora(new Date().toISOString()),
        id: Date.now(),
      };
      setFichajes((p) => [nuevoFichaje, ...p.slice(0, 19)]);
      setNewFichajeId(nuevoFichaje.id);
      setTimeout(() => setNewFichajeId(null), 3000);
      Swal.fire({
        background: "#fff",
        icon: "success",
        confirmButtonColor: G[900],
        title: `${tipo} registrada`,
        text: nombre,
        timer: 1800,
        showConfirmButton: false,
      });
      await rT();
      await rRestT();
      limpiar();
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setBusy(false);
    }
  };

  const esInit = turno?.estado === "programado";
  const esFin = turno?.estado === "activo";
  const nombre = buscado ? `${buscado.nombre} ${buscado.apellido}` : "";
  const cfgT = turno ? (ECFG[turno.estado] ?? ECFG.programado) : null;

  // Ventana del QR de salida: desde -15min antes de fechaFin hasta +30min después
  const enVentanaSalida = (() => {
    if (!esFin || !turno?.fechaFin) return false;
    const ahora = Date.now();
    const inicio = new Date(turno.fechaFin).getTime() - 15 * 60000; // -15min
    const fin = new Date(turno.fechaFin).getTime() + 30 * 60000; // +30min
    return ahora >= inicio && ahora <= fin;
  })();

  // QR de salida disponible a las (fechaFin - 15min)
  const horaActivacionSalida = turno?.fechaFin
    ? fmtHora(
        new Date(new Date(turno.fechaFin).getTime() - 15 * 60000).toISOString(),
      )
    : null;

  // Mostrar panel QR: entrada siempre, salida solo en ventana
  const mostrarQR =
    buscado && turno && turno.qrToken && (esInit || (esFin && enVentanaSalida));

  // Si turno activo pero fuera de ventana — mostrar aviso en lugar del QR
  const mostrarAvisoFueraVentana =
    buscado && esFin && !enVentanaSalida && turno?.qrToken;

  // Contadores reales basados en turnos del restaurante hoy
  const turnosHoy = tRestData?.turnos ?? [];
  const entradas = turnosHoy.filter(
    (t) => t.estado === "activo" || t.estado === "completado",
  ).length;
  const salidas = turnosHoy.filter((t) => t.estado === "completado").length;

  return (
    <div
      className="kiosco-full"
      style={{
        minHeight: "100svh",
        background: "#f0ede8",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 40px",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
          boxShadow: "0 1px 4px rgba(0,0,0,.05)",
        }}
        className="kiosco-header"
      >
        {/* Logo */}
        <div
          className="kiosco-header-brand"
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "11px",
              background: G[50],
              border: `1.5px solid ${G[100]}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: "800",
                fontSize: "16px",
                color: G[900],
              }}
            >
              R
            </span>
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: "700",
                fontSize: "17px",
                color: "#1c1917",
                margin: 0,
              }}
            >
              RestoHub
            </p>
            <p
              style={{
                fontFamily: "'DM Sans',sans-serif",
                fontSize: "11px",
                color: "#a8a29e",
                margin: 0,
              }}
            >
              Estación de fichaje · {user?.nombre}
            </p>
          </div>
        </div>

        {/* Reloj */}
        <div className="kiosco-header-clock" style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: "26px",
              fontWeight: "700",
              color: "#1c1917",
              margin: 0,
              letterSpacing: "-1px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {reloj.toLocaleTimeString("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
          <p
            style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: "11px",
              color: "#a8a29e",
              margin: 0,
              textTransform: "capitalize",
            }}
          >
            {reloj.toLocaleDateString("es-CO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

        {/* Stats + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <div
              style={{
                textAlign: "center",
                padding: "6px 14px",
                background: "rgba(218,241,222,.4)",
                borderRadius: "10px",
                border: `1px solid ${G[100]}`,
              }}
            >
              <p
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: "18px",
                  fontWeight: "700",
                  color: G[300],
                  margin: 0,
                }}
              >
                {entradas}
              </p>
              <p
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: "10px",
                  color: G[300],
                  margin: 0,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                }}
              >
                Entradas
              </p>
            </div>
            <div
              style={{
                textAlign: "center",
                padding: "6px 14px",
                background: "rgba(255,243,199,.5)",
                borderRadius: "10px",
                border: "1px solid #fde68a",
              }}
            >
              <p
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#d97706",
                  margin: 0,
                }}
              >
                {salidas}
              </p>
              <p
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: "10px",
                  color: "#d97706",
                  margin: 0,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                }}
              >
                Salidas
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "11px",
              padding: "9px 16px",
              color: "#dc2626",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            <IcoLogout /> Salir
          </button>
        </div>
      </header>

      {/* ── ESTILOS RESPONSIVE ───────────────────────────────────────────── */}
      <style>{`
        .kiosco-body {
          flex: 1;
          display: grid;
          gap: 20px;
          padding: 24px 32px;
          align-items: start;
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        /* Desktop: 3 col cuando hay QR/espera, 2 col en búsqueda */
        @media (min-width: 1024px) {
          .kiosco-body.modo-busqueda   { grid-template-columns: 1fr 360px; }
          .kiosco-body.modo-qr         { grid-template-columns: 340px 1fr 300px; }
          .kiosco-body.modo-espera     { grid-template-columns: 340px 1fr 300px; }
        }
        /* Tablet: 2 col siempre */
        @media (min-width: 640px) and (max-width: 1023px) {
          .kiosco-body.modo-busqueda   { grid-template-columns: 1fr 320px; }
          .kiosco-body.modo-qr         { grid-template-columns: 1fr 280px; }
          .kiosco-body.modo-espera     { grid-template-columns: 1fr 280px; }
          .kiosco-col-busqueda-qr      { display: none !important; }
        }
        /* Móvil: 1 col */
        @media (max-width: 639px) {
          .kiosco-body { grid-template-columns: 1fr !important; padding: 16px; gap: 14px; }
          .kiosco-header-clock         { display: none !important; }
          .kiosco-col-busqueda-qr      { display: none !important; }
        }
        /* Header responsive */
        @media (max-width: 767px) {
          .kiosco-header { padding: 0 16px !important; }
          .kiosco-header-brand p:last-child { display: none; }
          .kiosco-header-clock { font-size: 18px !important; }
          .kiosco-stats-label { display: none; }
        }
        @media (max-width: 480px) {
          .kiosco-header-clock { display: none !important; }
        }
        /* Log panel: se mueve abajo en móvil/tablet */
        @media (max-width: 1023px) {
          .kiosco-log { max-height: 280px !important; }
        }
        @keyframes kiosco-spin  { to { transform:rotate(360deg); } }
        @keyframes kiosco-pulse { 0%,100%{opacity:1}50%{opacity:.4} }
      `}</style>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div
        className={`kiosco-body ${mostrarQR ? "modo-qr" : mostrarAvisoFueraVentana ? "modo-espera" : "modo-busqueda"}`}
      >
        {/* ── COL 1: Búsqueda (visible siempre excepto en tablet/móvil cuando hay QR) */}
        <div
          className={
            mostrarQR || mostrarAvisoFueraVentana
              ? "kiosco-col-busqueda-qr"
              : ""
          }
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* Título — solo en modo búsqueda */}
          {!mostrarQR && !mostrarAvisoFueraVentana && (
            <div>
              <h1
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "clamp(22px,4vw,32px)",
                  fontWeight: "700",
                  color: "#1c1917",
                  margin: "0 0 6px",
                  letterSpacing: "-.5px",
                }}
              >
                Registrar turno
              </h1>
              <p
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: "15px",
                  color: "#78716c",
                  margin: 0,
                }}
              >
                Ingresa tu documento para registrar entrada o salida
              </p>
            </div>
          )}

          {/* Input documento */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "18px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#a8a29e",
                  pointerEvents: "none",
                }}
              >
                <IcoSearch size={18} />
              </span>
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                autoFocus
                value={doc}
                onChange={(e) => setDoc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscar()}
                placeholder="Número de documento"
                style={{
                  width: "100%",
                  background: "#fff",
                  borderRadius: "16px",
                  border: "1.5px solid #e2e8f0",
                  padding:
                    mostrarQR || mostrarAvisoFueraVentana
                      ? "14px 14px 14px 46px"
                      : "20px 20px 20px 50px",
                  fontFamily: "monospace",
                  fontSize:
                    mostrarQR || mostrarAvisoFueraVentana
                      ? "18px"
                      : "clamp(18px,3vw,26px)",
                  color: "#1c1917",
                  outline: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,.05)",
                  transition: "border-color .15s, box-shadow .15s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = G[300];
                  e.target.style.boxShadow = `0 0 0 3px rgba(35,83,71,.1)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,.05)";
                }}
              />
            </div>
            {!(mostrarQR || mostrarAvisoFueraVentana) && (
              <button
                onClick={buscar}
                disabled={!doc.trim()}
                style={{
                  width: "100%",
                  padding: "18px",
                  borderRadius: "14px",
                  border: "none",
                  background: doc.trim() ? G[900] : "#e7e5e4",
                  color: doc.trim() ? "#fff" : "#a8a29e",
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: "17px",
                  fontWeight: "700",
                  cursor: doc.trim() ? "pointer" : "default",
                  boxShadow: doc.trim()
                    ? "0 4px 24px rgba(5,31,32,.22)"
                    : "none",
                  transition: "all .18s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <IcoSearch size={18} /> Buscar empleado
              </button>
            )}
            {/* Botón buscar compacto cuando hay QR/espera */}
            {(mostrarQR || mostrarAvisoFueraVentana) && (
              <button
                onClick={() => {
                  limpiar();
                  setTimeout(buscar, 10);
                }}
                disabled={!doc.trim()}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: "12px",
                  border: "none",
                  background: doc.trim() ? G[900] : "#e7e5e4",
                  color: doc.trim() ? "#fff" : "#a8a29e",
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: doc.trim() ? "pointer" : "default",
                  transition: "all .18s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <IcoSearch size={14} /> Buscar
              </button>
            )}
          </div>

          {/* Empleado encontrado (modo búsqueda) */}
          {buscado && !(mostrarQR || mostrarAvisoFueraVentana) && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "18px",
                boxShadow: "0 2px 8px rgba(0,0,0,.05)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: G[50],
                    border: `1.5px solid ${G[100]}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: G[300],
                    flexShrink: 0,
                  }}
                >
                  <IcoUser size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#1c1917",
                      margin: "0 0 3px",
                    }}
                  >
                    {nombre}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: "13px",
                      color: "#78716c",
                      margin: "0 0 8px",
                      textTransform: "capitalize",
                    }}
                  >
                    {buscado.rolDisplay}
                  </p>
                  {turno ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: ".07em",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        background: cfgT?.bg,
                        color: cfgT?.color,
                        border: `1px solid ${cfgT?.border}`,
                      }}
                    >
                      {cfgT?.label} · {fmtHora(turno.fechaInicio)} –{" "}
                      {fmtHora(turno.fechaFin)}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#d97706",
                        fontWeight: "600",
                      }}
                    >
                      Sin turno para hoy
                    </span>
                  )}
                </div>
                <button
                  onClick={limpiar}
                  style={{
                    background: "none",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    color: "#78716c",
                    fontSize: "13px",
                    fontFamily: "'DM Sans',sans-serif",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Cambiar
                </button>
              </div>
            </div>
          )}

          {/* Empleado colapsado (modo QR/espera) */}
          {buscado && (mostrarQR || mostrarAvisoFueraVentana) && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "14px",
                boxShadow: "0 2px 8px rgba(0,0,0,.05)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: G[50],
                    border: `1px solid ${G[100]}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: G[300],
                    flexShrink: 0,
                  }}
                >
                  <IcoUser size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "#1c1917",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {nombre}
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: "11px",
                      color: "#78716c",
                      margin: 0,
                      textTransform: "capitalize",
                    }}
                  >
                    {buscado.rolDisplay}
                  </p>
                </div>
                <button
                  onClick={limpiar}
                  style={{
                    background: "none",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    color: "#78716c",
                    fontSize: "12px",
                    fontFamily: "'DM Sans',sans-serif",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <IcoBack />
                </button>
              </div>
              {turno && cfgT && (
                <div style={{ marginTop: "10px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: ".07em",
                      padding: "3px 9px",
                      borderRadius: "20px",
                      background: cfgT.bg,
                      color: cfgT.color,
                      border: `1px solid ${cfgT.border}`,
                    }}
                  >
                    {cfgT.label} · {fmtHora(turno.fechaInicio)} –{" "}
                    {fmtHora(turno.fechaFin)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── COL CENTRAL: QR o Panel de espera ───────────────────────────────── */}
        {(mostrarQR || mostrarAvisoFueraVentana) && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "24px",
              padding: "clamp(20px,3vw,32px)",
              boxShadow: "0 4px 24px rgba(0,0,0,.07)",
            }}
          >
            {/* ── QR panel ─────────────────────────────────────────────────── */}
            {mostrarQR && (
              <QRPanel
                token={turno.qrToken}
                expiraEn={turno.qrExpiraEn}
                nombre={nombre}
                accion={esInit ? "iniciar" : "finalizar"}
                onVolver={limpiar}
              />
            )}

            {/* ── Panel de espera (activo fuera de ventana) ──────────────── */}
            {mostrarAvisoFueraVentana && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "24px",
                  padding: "8px 0",
                }}
              >
                {/* Estado */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: ".1em",
                    padding: "6px 16px",
                    borderRadius: "20px",
                    background: ECFG.activo.bg,
                    color: ECFG.activo.color,
                    border: `1px solid ${ECFG.activo.border}`,
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: ECFG.activo.color,
                      display: "inline-block",
                      animation: "kiosco-pulse 1.5s ease-in-out infinite",
                    }}
                  />
                  Turno activo
                </span>

                {/* Nombre */}
                <div style={{ textAlign: "center" }}>
                  <h2
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: "clamp(22px,3vw,32px)",
                      fontWeight: "700",
                      color: "#1c1917",
                      margin: "0 0 4px",
                      letterSpacing: "-.4px",
                    }}
                  >
                    {nombre}
                  </h2>
                  <p
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: "15px",
                      color: "#78716c",
                      margin: 0,
                    }}
                  >
                    {fmtHora(turno?.fechaInicio)} – {fmtHora(turno?.fechaFin)}
                  </p>
                </div>

                {/* Reloj + hora activación */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "14px",
                    background: "#fffbeb",
                    border: "2px solid #fde68a",
                    borderRadius: "24px",
                    padding: "28px 40px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <IcoClock size={36} style={{ color: "#d97706" }} />
                  <div style={{ textAlign: "center" }}>
                    <p
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#92400e",
                        margin: "0 0 4px",
                      }}
                    >
                      QR de salida disponible a las
                    </p>
                    <p
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontSize: "clamp(40px,6vw,60px)",
                        fontWeight: "700",
                        color: "#d97706",
                        margin: "0 0 4px",
                        letterSpacing: "-2px",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {horaActivacionSalida}
                    </p>
                    <p
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: "12px",
                        color: "#a16207",
                        margin: 0,
                      }}
                    >
                      15 min antes del fin del turno ({fmtHora(turno?.fechaFin)}
                      )
                    </p>
                  </div>
                </div>

                <button
                  onClick={limpiar}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "none",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "10px 20px",
                    color: "#78716c",
                    fontSize: "13px",
                    fontFamily: "'DM Sans',sans-serif",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  <IcoBack /> Nuevo empleado
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── COL LOG: Fichajes de hoy ─────────────────────────────────────── */}
        <div
          className="kiosco-log"
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "20px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,.05)",
            maxHeight: "calc(100vh - 68px - 48px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <h3
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: "16px",
                fontWeight: "700",
                color: "#1c1917",
                margin: 0,
              }}
            >
              Fichajes de hoy
            </h3>
            <span
              style={{
                fontFamily: "'DM Sans',sans-serif",
                fontSize: "12px",
                color: "#a8a29e",
                fontWeight: "500",
              }}
            >
              {fichajes.length} registros
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }} className="noscroll">
            {fichajes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "16px",
                    background: "#f5f5f4",
                    border: "1px solid #e7e5e4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <IcoClock size={24} />
                </div>
                <p
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    color: "#a8a29e",
                    fontSize: "13px",
                    margin: 0,
                  }}
                >
                  Sin registros aún
                </p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                {fichajes.map((f) => (
                  <FichajeRow key={f.id} f={f} isNew={f.id === newFichajeId} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
