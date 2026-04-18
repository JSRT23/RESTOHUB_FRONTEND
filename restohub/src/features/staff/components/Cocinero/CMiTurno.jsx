// src/features/staff/components/Cocinero/CMiTurno.jsx
// Cocinero — su turno activo del día.
// Muestra horario, estado, horas trabajadas, QR token para check-in/out.
// Ruta: /cocina/turno

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlarmClock,
  Calendar,
  User,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { GET_TURNOS, GET_ASISTENCIA } from "../../graphql/queries";
import { inicioHoy, finHoy } from "../../utils/turnoFechas";
import { Skeleton } from "../../../../shared/components/ui";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const ESTADO_TURNO = {
  PROGRAMADO: {
    label: "Programado",
    bg: "#eff6ff",
    text: "#3b82f6",
    border: "#bfdbfe",
  },
  EN_CURSO: { label: "En curso", bg: G[50], text: G[300], border: G[100] },
  COMPLETADO: {
    label: "Completado",
    bg: "#f0fdf4",
    text: "#16a34a",
    border: "#bbf7d0",
  },
  CANCELADO: {
    label: "Cancelado",
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
  },
};

function fmtHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ── Bloque QR ──────────────────────────────────────────────────────────────
function QRBlock({ qrToken, qrExpiraEn }) {
  const [mostrarToken, setMostrarToken] = useState(false);

  if (!qrToken)
    return (
      <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border border-stone-200 bg-stone-50">
        <QrCode size={16} className="text-stone-300" />
        <p className="text-sm font-dm text-stone-400">
          QR no disponible para este turno
        </p>
      </div>
    );

  const expira = qrExpiraEn ? new Date(qrExpiraEn) : null;
  const expirado = expira && expira < new Date();

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: expirado ? "#fecaca" : G[100] }}
    >
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{
          background: expirado ? "#fef2f2" : G[50],
          borderColor: expirado ? "#fecaca" : G[100],
        }}
      >
        <div className="flex items-center gap-2">
          <QrCode size={14} style={{ color: expirado ? "#dc2626" : G[300] }} />
          <span
            className="text-xs font-dm font-bold"
            style={{ color: expirado ? "#dc2626" : G[300] }}
          >
            {expirado ? "QR vencido" : "QR de asistencia"}
          </span>
        </div>
        {expira && !expirado && (
          <span className="text-[10px] font-dm text-stone-400">
            Expira: {fmtHora(qrExpiraEn)}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Representación visual del QR — token como código */}
        <div className="flex items-center justify-center">
          <div
            className="w-40 h-40 rounded-2xl flex items-center justify-center border-2 border-dashed"
            style={{ borderColor: expirado ? "#fecaca" : G[100] }}
          >
            {/* QR visual simplificado con el token */}
            <div className="text-center space-y-2 px-3">
              <QrCode
                size={36}
                style={{
                  color: expirado ? "#dc2626" : G[300],
                  margin: "0 auto",
                }}
              />
              <p
                className="font-mono text-[10px] font-bold break-all leading-tight"
                style={{ color: expirado ? "#dc2626" : G[500] }}
              >
                {mostrarToken ? qrToken : qrToken.slice(0, 8) + "..."}
              </p>
              <button
                onClick={() => setMostrarToken(!mostrarToken)}
                className="text-[9px] font-dm underline"
                style={{ color: G[300] }}
              >
                {mostrarToken ? "Ocultar" : "Ver token completo"}
              </button>
            </div>
          </div>
        </div>
        <p className="text-[10px] font-dm text-stone-400 text-center">
          Muestra este código al supervisor para registrar{" "}
          {expirado ? "tu asistencia" : "entrada/salida"}
        </p>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function CMiTurno() {
  const { user } = useAuth();
  const empleadoId = user?.empleadoId;
  const restauranteId = user?.restauranteId;

  const {
    data: turnosData,
    loading: turnosLoading,
    refetch,
  } = useQuery(GET_TURNOS, {
    variables: {
      empleadoId,
      restauranteId,
      fechaDesde: inicioHoy(),
      fechaHasta: finHoy(),
    },
    skip: !empleadoId,
    fetchPolicy: "cache-and-network",
    pollInterval: 60000,
  });

  const { data: asistData, loading: asistLoading } = useQuery(GET_ASISTENCIA, {
    variables: { empleadoId, restauranteId, fechaDesde: inicioHoy() },
    skip: !empleadoId,
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });

  const turnos = turnosData?.turnos ?? [];
  const asistencia = asistData?.asistencia ?? [];

  // Turno prioritario: en curso > programado > completado
  const turnoActivo =
    turnos.find((t) => t.estado === "EN_CURSO") ??
    turnos.find((t) => t.estado === "PROGRAMADO") ??
    turnos[0];

  const registroHoy = asistencia[0]; // el más reciente
  const estaEnTurno = registroHoy && !registroHoy.horaSalida;

  const meta = turnoActivo
    ? (ESTADO_TURNO[turnoActivo.estado] ?? ESTADO_TURNO.PROGRAMADO)
    : null;

  if (!empleadoId)
    return (
      <div className="flex items-center gap-3 px-4 py-4 rounded-2xl border border-amber-200 bg-amber-50">
        <XCircle size={16} className="text-amber-500 shrink-0" />
        <p className="text-sm font-dm text-amber-700">
          Tu cuenta no tiene un empleado vinculado. Contacta al gerente.
        </p>
      </div>
    );

  return (
    <div className="space-y-6 max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-xl font-bold text-stone-900">
            Mi turno
          </h1>
          <p className="text-xs font-dm text-stone-400 mt-0.5">
            {fmtFecha(new Date().toISOString())}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="w-8 h-8 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {turnosLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : !turnoActivo ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-2xl border border-stone-200 bg-stone-50">
          <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center">
            <Clock size={20} className="text-stone-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-dm font-semibold text-stone-600">
              Sin turno hoy
            </p>
            <p className="text-xs font-dm text-stone-400 mt-1">
              No tienes turnos programados para hoy. Consulta con tu supervisor.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Tarjeta turno */}
          <div
            className="bg-white rounded-2xl border overflow-hidden"
            style={{
              borderColor: meta.border,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div
              className="h-1.5"
              style={{
                background: `linear-gradient(90deg,${meta.text},${meta.border})`,
              }}
            />
            <div className="p-5 space-y-4">
              {/* Estado */}
              <div className="flex items-center justify-between">
                <span
                  className="flex items-center gap-2 text-sm font-dm font-bold"
                  style={{ color: meta.text }}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      turnoActivo.estado === "EN_CURSO" ? "animate-pulse" : ""
                    }`}
                    style={{ background: meta.text }}
                  />
                  {meta.label}
                </span>
                {estaEnTurno && (
                  <span
                    className="flex items-center gap-1.5 text-[10px] font-dm font-bold px-3 py-1.5 rounded-full"
                    style={{
                      background: G[50],
                      color: G[300],
                      border: `1px solid ${G[100]}`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    En curso
                  </span>
                )}
              </div>

              {/* Horario */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <p className="text-[10px] font-dm font-semibold text-stone-400 mb-1">
                    Entrada
                  </p>
                  <p className="font-playfair text-2xl font-bold text-stone-800">
                    {fmtHora(turnoActivo.fechaInicio)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <p className="text-[10px] font-dm font-semibold text-stone-400 mb-1">
                    Salida
                  </p>
                  <p className="font-playfair text-2xl font-bold text-stone-800">
                    {fmtHora(turnoActivo.fechaFin)}
                  </p>
                </div>
              </div>

              {/* Duración */}
              {turnoActivo.duracionHoras && (
                <div className="flex items-center gap-2 text-sm font-dm text-stone-500">
                  <AlarmClock size={14} className="text-stone-300" />
                  Duración:{" "}
                  <span className="font-semibold text-stone-700">
                    {turnoActivo.duracionHoras.toFixed(1)} horas
                  </span>
                </div>
              )}

              {turnoActivo.notas && (
                <p className="text-xs font-dm text-stone-400 italic px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                  "{turnoActivo.notas}"
                </p>
              )}
            </div>
          </div>

          {/* QR */}
          <QRBlock
            qrToken={turnoActivo.qrToken}
            qrExpiraEn={turnoActivo.qrExpiraEn}
          />

          {/* Asistencia de hoy */}
          {asistencia.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-dm font-semibold text-stone-400 uppercase tracking-wider">
                Registro de hoy
              </p>
              {asistencia.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 bg-white"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: reg.horaSalida ? "#f0fdf4" : G[50] }}
                  >
                    {reg.horaSalida ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 text-sm font-dm">
                      <span className="text-stone-600">
                        <span className="font-semibold text-stone-800">
                          Entrada:
                        </span>{" "}
                        {fmtHora(reg.horaEntrada)}
                      </span>
                      {reg.horaSalida && (
                        <span className="text-stone-600">
                          <span className="font-semibold text-stone-800">
                            Salida:
                          </span>{" "}
                          {fmtHora(reg.horaSalida)}
                        </span>
                      )}
                    </div>
                    {reg.horasTotales != null && (
                      <p className="text-[10px] font-dm text-stone-400 mt-0.5">
                        {reg.horasTotales.toFixed(1)} h trabajadas ·{" "}
                        {reg.metodoDisplay ?? reg.metodoRegistro}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
