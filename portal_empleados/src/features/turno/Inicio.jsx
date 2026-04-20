// portal_empleados/src/features/turno/Inicio.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../../app/auth/AuthContext";
import {
  GET_TURNOS,
  INICIAR_TURNO,
  REGISTRAR_SALIDA,
} from "./graphql/operations";
import QRScanner from "../../shared/components/QRScanner";
import Swal from "sweetalert2";

const G = { 50: "#DAF1DE", 100: "#8EB69B", 300: "#235347", 900: "#051F20" };

const ds = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmtHora = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const minsHasta = (iso) =>
  iso ? Math.floor((new Date(iso) - Date.now()) / 60000) : null;

// ── Estados — keys exactas del backend ────────────────────────────────────
const ECFG = {
  programado: {
    label: "Programado",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  activo: {
    label: "En curso",
    color: "#235347",
    bg: "#DAF1DE",
    border: "#8EB69B",
  },
  completado: {
    label: "Completado",
    color: "#78716c",
    bg: "#f5f5f4",
    border: "#e7e5e4",
  },
  cancelado: {
    label: "Cancelado",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
  },
};

const ROL_LABEL = {
  mesero: "Mesero",
  cocinero: "Cocinero",
  cajero: "Cajero",
  repartidor: "Repartidor",
  supervisor: "Supervisor",
};

/* ── Icons ──────────────────────────────────────────────────────────────── */
const IcoQR = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <path d="M14 14h.01M14 17h3M17 14v3M21 21h-3v-3M21 17h-1" />
  </svg>
);
const IcoList = () => (
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
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
const IcoCal = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#a8a29e"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcoClock = () => (
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
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

export default function Inicio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scanner, setScanner] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, loading, refetch } = useQuery(GET_TURNOS, {
    variables: {
      empleadoId: user?.empleadoId,
      fechaDesde: ds(),
      fechaHasta: ds(),
    },
    skip: !user?.empleadoId,
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });

  const [iniciarTurno] = useMutation(INICIAR_TURNO, {
    refetchQueries: ["GetTurnos"],
  });
  const [registrarSalida] = useMutation(REGISTRAR_SALIDA, {
    refetchQueries: ["GetTurnos"],
  });

  const turnos = data?.turnos ?? [];
  const turno =
    turnos.find((t) => t.estado === "activo") ??
    turnos.find((t) => t.estado === "programado") ??
    turnos[0];

  const cfg = turno ? (ECFG[turno.estado] ?? ECFG.programado) : null;
  const esInit = turno?.estado === "programado";
  const esFin = turno?.estado === "activo";

  // Ventana de salida: QR se habilita -15min antes del fechaFin
  const minsR = esFin ? minsHasta(turno?.fechaFin) : null;
  const enVentanaSalida = esFin && minsR !== null && minsR <= 15;
  // Hora en que se activa el QR de salida (fechaFin - 15min)
  const horaActivacion = turno?.fechaFin
    ? fmtHora(
        new Date(new Date(turno.fechaFin).getTime() - 15 * 60000).toISOString(),
      )
    : null;

  const onQR = async () => {
    setScanner(false);
    setBusy(true);
    try {
      if (esInit) {
        const { data: r } = await iniciarTurno({
          variables: { turnoId: turno.id },
        });
        if (!r?.iniciarTurno?.ok)
          throw new Error(r?.iniciarTurno?.errores ?? "Error");
        Swal.fire({
          background: "#fff",
          icon: "success",
          title: "¡Turno iniciado!",
          text: "Que tengas un excelente turno.",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          confirmButtonColor: G[900],
        });
      } else if (esFin) {
        const { data: r } = await registrarSalida({
          variables: { turnoId: turno.id },
        });
        if (!r?.registrarSalida?.ok)
          throw new Error(r?.registrarSalida?.errores ?? "Error");
        Swal.fire({
          background: "#fff",
          icon: "success",
          title: "¡Turno completado!",
          text: "Hasta pronto.",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          confirmButtonColor: G[900],
        });
      }
      refetch();
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "No se pudo registrar",
        html: `<p style='font-family:DM Sans;color:#78716c;font-size:14px;margin:0'>
          <strong style='color:#1c1917'>Comunícate con el supervisor</strong><br/><br/>
          Pídele que registre tu turno manualmente desde el panel de control.
        </p>`,
        confirmButtonColor: G[900],
        confirmButtonText: "Entendido",
      });
    } finally {
      setBusy(false);
    }
  };

  const abrirScanner = () => {
    // Si está activo pero fuera de la ventana, informar
    if (esFin && !enVentanaSalida) {
      Swal.fire({
        background: "#fff",
        icon: "info",
        title: "Aún no disponible",
        html: `<p style='font-family:DM Sans;color:#78716c;font-size:14px;margin:0;line-height:1.6'>
          El QR de salida se activa <strong>15 minutos antes</strong> del fin del turno.<br/>
          Estará disponible a las <strong>${horaActivacion}</strong>.
        </p>`,
        confirmButtonColor: G[900],
        confirmButtonText: "Entendido",
      });
      return;
    }
    setScanner(true);
  };

  return (
    <div
      className="font-dm"
      style={{
        minHeight: "100svh",
        background: "#e8e8e6",
        padding: "48px 16px 88px",
      }}
    >
      {/* Saludo */}
      <div className="anim-fadeup" style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{ color: "#78716c", fontSize: "13px", margin: "0 0 2px" }}
            >
              Bienvenido,
            </p>
            <h1
              className="font-playfair"
              style={{
                color: "#1c1917",
                fontSize: "22px",
                fontWeight: "700",
                margin: "0 0 2px",
                letterSpacing: "-.3px",
              }}
            >
              {user?.nombre}
            </h1>
            <p
              style={{
                color: "#a8a29e",
                fontSize: "12px",
                margin: 0,
                textTransform: "capitalize",
              }}
            >
              {ROL_LABEL[user?.rol] ?? user?.rol} ·{" "}
              {new Date().toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: G[50],
              border: `1.5px solid ${G[100]}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              className="font-dm"
              style={{ color: G[300], fontWeight: "700", fontSize: "16px" }}
            >
              {(user?.nombre?.[0] ?? "?").toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Card turno de hoy */}
      {loading ? (
        <div
          className="skeleton anim-fadein"
          style={{ height: "180px", marginBottom: "12px" }}
        />
      ) : !turno ? (
        <div
          className="card anim-fadeup d1"
          style={{ padding: "28px", textAlign: "center", marginBottom: "12px" }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "#f5f5f4",
              border: "1px solid #e7e5e4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <IcoCal />
          </div>
          <p
            className="font-dm"
            style={{
              color: "#1c1917",
              fontWeight: "600",
              fontSize: "15px",
              margin: "0 0 6px",
            }}
          >
            Sin turno hoy
          </p>
          <p
            className="font-dm"
            style={{ color: "#78716c", fontSize: "13px", margin: "0 0 16px" }}
          >
            No tienes turnos programados para hoy.
          </p>
          <button
            onClick={() => navigate("/turnos")}
            className="btn-ghost"
            style={{ display: "inline-flex", width: "auto" }}
          >
            Ver todos mis turnos →
          </button>
        </div>
      ) : (
        <div
          className="card anim-fadeup d1"
          style={{ marginBottom: "12px", overflow: "hidden" }}
        >
          {/* Badge estado + countdown */}
          <div
            style={{
              padding: "16px 18px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              className="font-dm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: ".07em",
                padding: "3px 10px",
                borderRadius: "20px",
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
              }}
            >
              {esFin && (
                <span
                  className="anim-pulse"
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: cfg.color,
                    display: "inline-block",
                  }}
                />
              )}
              {cfg.label}
            </span>

            {esFin && minsR !== null && (
              <span
                className="font-dm"
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: minsR < 15 ? "#fef3c7" : "#f5f5f4",
                  color: minsR < 15 ? "#d97706" : "#78716c",
                  border: `1px solid ${minsR < 15 ? "#fde68a" : "#e7e5e4"}`,
                }}
              >
                {minsR > 0
                  ? `${minsR}m restantes`
                  : `${Math.abs(minsR)}m pasado`}
              </span>
            )}
          </div>

          {/* Horario grande */}
          <div style={{ padding: "4px 18px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span
                className="font-playfair"
                style={{
                  color: "#1c1917",
                  fontSize: "38px",
                  fontWeight: "700",
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                {fmtHora(turno.fechaInicio)}
              </span>
              <span
                className="font-dm"
                style={{ color: "#d4d4d4", fontSize: "18px" }}
              >
                →
              </span>
              <span
                className="font-playfair"
                style={{
                  color: "#78716c",
                  fontSize: "38px",
                  fontWeight: "700",
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                {fmtHora(turno.fechaFin)}
              </span>
            </div>
            <p
              className="font-dm"
              style={{ color: "#a8a29e", fontSize: "13px", margin: 0 }}
            >
              {turno.duracionHoras?.toFixed(1)}h de turno
              {turno.notas && (
                <span style={{ fontStyle: "italic" }}> · "{turno.notas}"</span>
              )}
            </p>
          </div>

          {/* Divider */}
          {(esInit || esFin) && (
            <div
              style={{ height: "1px", background: "#f0ede8", margin: "0 18px" }}
            />
          )}

          {/* Botón acción */}
          {(esInit || esFin) && (
            <div style={{ padding: "14px 16px" }}>
              <button
                onClick={abrirScanner}
                disabled={busy}
                className="btn-primary"
              >
                <IcoQR />
                {busy
                  ? "Procesando..."
                  : esInit
                    ? "Escanear para iniciar"
                    : enVentanaSalida
                      ? "Escanear para finalizar"
                      : "Escanear para finalizar"}
              </button>

              {/* Aviso ventana de salida — solo cuando activo y fuera de ventana */}
              {esFin && !enVentanaSalida && horaActivacion && (
                <div
                  className="anim-fadein"
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                  }}
                >
                  <span
                    style={{
                      color: "#d97706",
                      marginTop: "1px",
                      flexShrink: 0,
                    }}
                  >
                    <IcoClock />
                  </span>
                  <div>
                    <p
                      className="font-dm"
                      style={{
                        color: "#92400e",
                        fontSize: "12px",
                        fontWeight: "700",
                        margin: "0 0 1px",
                      }}
                    >
                      QR de salida disponible a las {horaActivacion}
                    </p>
                    <p
                      className="font-dm"
                      style={{ color: "#b45309", fontSize: "11px", margin: 0 }}
                    >
                      El QR de salida se activa 15 min antes de las{" "}
                      {fmtHora(turno.fechaFin)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Estado final */}
          {(turno.estado === "completado" || turno.estado === "cancelado") && (
            <div style={{ padding: "14px 18px 18px", textAlign: "center" }}>
              <p
                className="font-dm"
                style={{ color: "#a8a29e", fontSize: "13px", margin: 0 }}
              >
                {turno.estado === "completado"
                  ? "✅ Turno completado"
                  : "❌ Turno cancelado"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Link ver turnos */}
      <button
        onClick={() => navigate("/turnos")}
        className="btn-ghost anim-fadeup d2"
        style={{ width: "100%", justifyContent: "center" }}
      >
        <IcoList /> Ver todos mis turnos
      </button>

      {/* QR Scanner */}
      {scanner && turno && (
        <QRScanner
          tokenEsperado={turno.qrToken}
          onExito={onQR}
          onCerrar={() => setScanner(false)}
        />
      )}
    </div>
  );
}
