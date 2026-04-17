// src/features/staff/components/Supervisor/SStaffList.jsx
//
// Supervisor — vista operativa de staff.
// NO crea ni edita empleados ni turnos (eso es del gerente).
// SÍ puede:
//   · Ver turnos de hoy + próximos del restaurante
//   · Ver asistencia en tiempo real (quién entró, quién no)
//   · Ver y resolver alertas operacionales
//   · Cancelar un turno si hay un imprevisto
//
// Ruta: /supervisor  (tab "Staff")

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  UserCircle,
  Calendar,
  AlarmClock,
  LogIn,
  LogOut,
  Ban,
  Bell,
  ChevronDown,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_TURNOS,
  GET_ASISTENCIA,
  GET_ALERTAS_OPERACIONALES,
} from "../../graphql/queries";
import { CANCELAR_TURNO } from "../../graphql/mutations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
} from "../../../../shared/components/ui";

// ── Paleta ─────────────────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

// ── Helpers ────────────────────────────────────────────────────────────────
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
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}
function hoy() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function manana() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

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

const ROL_LABEL = {
  supervisor: "Supervisor",
  cocinero: "Cocinero",
  mesero: "Mesero",
  cajero: "Cajero",
  repartidor: "Repartidor",
};

const NIVEL_ALERTA = {
  ALTA: {
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
    dot: "bg-red-500",
  },
  MEDIA: {
    bg: "#fffbeb",
    text: "#d97706",
    border: "#fde68a",
    dot: "bg-amber-400",
  },
  BAJA: { bg: G[50], text: G[300], border: G[100], dot: `bg-emerald-500` },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN: TURNOS DE HOY
// ═══════════════════════════════════════════════════════════════════════════

function TurnoRow({ turno, onCancelar, cancelando }) {
  const meta = ESTADO_TURNO[turno.estado] ?? ESTADO_TURNO.PROGRAMADO;
  const enCurso = turno.estado === "EN_CURSO";
  const cancelable = !["COMPLETADO", "CANCELADO"].includes(turno.estado);

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-all">
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-dm font-bold text-xs"
        style={{
          background: enCurso ? G[50] : "#f5f5f4",
          color: enCurso ? G[300] : "#a8a29e",
        }}
      >
        {turno.empleadoNombre?.[0]?.toUpperCase() ?? "?"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-dm font-semibold text-stone-800 truncate">
          {turno.empleadoNombre}
        </p>
        <p className="text-[10px] font-dm text-stone-400 mt-0.5">
          {fmtHora(turno.fechaInicio)} – {fmtHora(turno.fechaFin)} ·{" "}
          {turno.duracionHoras?.toFixed(1) ?? "?"} h
        </p>
      </div>

      {/* Estado */}
      <span
        className="hidden sm:inline-flex items-center gap-1 text-[10px] font-dm font-semibold px-2 py-1 rounded-full border shrink-0"
        style={{
          background: meta.bg,
          color: meta.text,
          borderColor: meta.border,
        }}
      >
        {meta.label}
      </span>

      {/* Notas */}
      {turno.notas && (
        <span className="hidden lg:block text-[10px] font-dm text-stone-400 truncate max-w-[120px]">
          {turno.notas}
        </span>
      )}

      {/* Cancelar */}
      {cancelable && (
        <button
          onClick={() => onCancelar(turno)}
          disabled={cancelando === turno.id}
          className="flex items-center gap-1 text-[10px] font-dm font-semibold px-2 py-1.5 rounded-lg border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 shrink-0"
        >
          {cancelando === turno.id ? (
            <span className="w-3 h-3 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Ban size={10} />
          )}
          Cancelar
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN: ASISTENCIA EN TIEMPO REAL
// ═══════════════════════════════════════════════════════════════════════════

function AsistenciaRow({ reg }) {
  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
      <td className="py-3 pl-5 pr-3">
        <p className="text-sm font-dm font-semibold text-stone-800">
          {reg.empleadoNombre}
        </p>
      </td>
      <td className="py-3 px-3 text-sm font-dm text-stone-600">
        {fmtHora(reg.horaEntrada)}
      </td>
      <td className="py-3 px-3 text-sm font-dm text-stone-500">
        {reg.horaSalida ? (
          fmtHora(reg.horaSalida)
        ) : (
          <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En curso
          </span>
        )}
      </td>
      <td className="py-3 px-3 text-[10px] font-dm text-stone-400 capitalize">
        {reg.metodoDisplay ?? reg.metodoRegistro}
      </td>
      <td className="py-3 pr-5 pl-3 text-sm font-dm font-semibold text-stone-700">
        {reg.horasTotales != null ? `${reg.horasTotales.toFixed(1)} h` : "—"}
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN: ALERTAS OPERACIONALES
// ═══════════════════════════════════════════════════════════════════════════

function AlertaCard({ alerta }) {
  const meta = NIVEL_ALERTA[alerta.nivel] ?? NIVEL_ALERTA.MEDIA;
  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all"
      style={{ background: meta.bg, borderColor: meta.border }}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${meta.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-dm font-semibold"
            style={{ color: meta.text }}
          >
            {alerta.nivelDisplay ?? alerta.nivel}
          </span>
          <span className="text-[10px] font-dm text-stone-400">
            {alerta.tipoDisplay ?? alerta.tipo}
          </span>
        </div>
        <p className="text-sm font-dm text-stone-700 mt-0.5">
          {alerta.mensaje}
        </p>
        <p className="text-[10px] font-dm text-stone-400 mt-0.5">
          {new Date(alerta.createdAt).toLocaleString("es-CO", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

export default function SStaffList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [cancelando, setCancelando] = useState(null);

  // Turnos de hoy
  const {
    data: turnosData,
    loading: turnosLoading,
    refetch: refetchTurnos,
  } = useQuery(GET_TURNOS, {
    variables: { restauranteId, fechaDesde: hoy(), fechaHasta: manana() },
    fetchPolicy: "cache-and-network",
    pollInterval: 60000,
  });

  // Asistencia de hoy
  const {
    data: asistData,
    loading: asistLoading,
    refetch: refetchAsist,
  } = useQuery(GET_ASISTENCIA, {
    variables: { restauranteId, fechaDesde: hoy() },
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });

  // Alertas operacionales sin resolver
  const { data: alertasData, loading: alertasLoading } = useQuery(
    GET_ALERTAS_OPERACIONALES,
    {
      variables: { restauranteId, resuelta: false },
      fetchPolicy: "cache-and-network",
      pollInterval: 60000,
    },
  );

  const [cancelarTurno] = useMutation(CANCELAR_TURNO, {
    refetchQueries: ["GetTurnos"],
  });

  const turnos = turnosData?.turnos ?? [];
  const asistencia = asistData?.asistencia ?? [];
  const alertas = alertasData?.alertasOperacionales ?? [];

  const enCurso = turnos.filter((t) => t.estado === "EN_CURSO").length;
  const programados = turnos.filter((t) => t.estado === "PROGRAMADO").length;
  const alertasAltas = alertas.filter((a) => a.nivel === "ALTA").length;

  const filteredTurnos = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return turnos.filter((t) => {
      if (q && !t.empleadoNombre?.toLowerCase().includes(q)) return false;
      if (filtroEstado !== "all" && t.estado !== filtroEstado) return false;
      return true;
    });
  }, [turnos, busqueda, filtroEstado]);

  const handleCancelar = async (turno) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      title: "¿Cancelar turno?",
      html: `<span style="font-family:'DM Sans';color:#78716c">El turno de <b>${turno.empleadoNombre}</b> (${fmtHora(turno.fechaInicio)} – ${fmtHora(turno.fechaFin)}) será cancelado.</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });
    if (!isConfirmed) return;
    setCancelando(turno.id);
    try {
      const { data } = await cancelarTurno({
        variables: { turnoId: turno.id },
      });
      if (!data?.cancelarTurno?.ok)
        throw new Error(data?.cancelarTurno?.errores ?? "Error");
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setCancelando(null);
    }
  };

  const refetch = () => {
    refetchTurnos();
    refetchAsist();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Supervisor"
        title="Staff operativo"
        description="Turnos de hoy, asistencia en tiempo real y alertas del equipo."
        action={
          <div className="flex items-center gap-2">
            {alertasAltas > 0 && (
              <span
                className="flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-xl border"
                style={{
                  background: "#fef2f2",
                  borderColor: "#fecaca",
                  color: "#dc2626",
                }}
              >
                <AlertTriangle size={12} /> {alertasAltas} alerta
                {alertasAltas !== 1 ? "s" : ""} alta
                {alertasAltas !== 1 ? "s" : ""}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              title="Recargar"
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "En curso ahora",
            n: enCurso,
            style: { background: G[50], borderColor: G[100] },
            textColor: G[300],
            icon: (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ),
          },
          {
            label: "Programados hoy",
            n: programados,
            style: { background: "#eff6ff", borderColor: "#bfdbfe" },
            textColor: "#3b82f6",
            icon: <Calendar size={14} className="text-blue-400" />,
          },
          {
            label: "Alertas abiertas",
            n: alertas.length,
            style:
              alertasAltas > 0
                ? { background: "#fef2f2", borderColor: "#fecaca" }
                : { background: "#f5f5f4", borderColor: "#e5e5e5" },
            textColor: alertasAltas > 0 ? "#dc2626" : "#a8a29e",
            icon: (
              <Bell
                size={14}
                className={alertasAltas > 0 ? "text-red-400" : "text-stone-300"}
              />
            ),
          },
        ].map(({ label, n, style, textColor, icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-3.5 rounded-2xl border"
            style={{ ...style, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            {icon}
            <div>
              <p
                className="text-2xl font-playfair font-bold"
                style={{ color: textColor }}
              >
                {n}
              </p>
              <p
                className="text-[10px] font-dm font-semibold"
                style={{ color: textColor }}
              >
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ══ TURNOS ══ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-playfair text-lg font-bold text-stone-800">
            Turnos de hoy
          </h2>
          <span className="text-xs font-dm text-stone-400">
            {fmtFecha(new Date().toISOString())}
          </span>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div
            className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            onFocusCapture={(e) =>
              (e.currentTarget.style.boxShadow = `0 0 0 2px ${G[300]}`)
            }
            onBlurCapture={(e) =>
              (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)")
            }
          >
            <Search size={13} className="text-stone-300 shrink-0" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar empleado..."
              className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
            {[
              { v: "all", l: "Todos" },
              { v: "EN_CURSO", l: "En curso" },
              { v: "PROGRAMADO", l: "Programados" },
              { v: "COMPLETADO", l: "Completados" },
            ].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setFiltroEstado(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
                style={
                  filtroEstado === v
                    ? { background: G[900], color: "#fff" }
                    : { color: "#78716c" }
                }
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {turnosLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : filteredTurnos.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Sin turnos"
            description={
              busqueda
                ? `Sin resultados para "${busqueda}".`
                : "No hay turnos programados para hoy."
            }
          />
        ) : (
          <div className="space-y-2">
            {filteredTurnos.map((t) => (
              <TurnoRow
                key={t.id}
                turno={t}
                onCancelar={handleCancelar}
                cancelando={cancelando}
              />
            ))}
          </div>
        )}
      </section>

      {/* ══ ASISTENCIA ══ */}
      <section className="space-y-4">
        <h2 className="font-playfair text-lg font-bold text-stone-800">
          Asistencia de hoy
        </h2>

        {asistLoading ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : asistencia.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50">
            <LogIn size={14} className="text-stone-300" />
            <p className="text-sm font-dm text-stone-400">
              Ningún empleado ha registrado entrada hoy.
            </p>
          </div>
        ) : (
          <div
            className="bg-white border border-stone-200 rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    {["Empleado", "Entrada", "Salida", "Método", "Horas"].map(
                      (l) => (
                        <th
                          key={l}
                          className="py-2.5 px-3 text-left text-[10px] font-dm font-semibold text-stone-400 uppercase tracking-wide first:pl-5 last:pr-5"
                        >
                          {l}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {asistencia.map((reg) => (
                    <AsistenciaRow key={reg.id} reg={reg} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ══ ALERTAS OPERACIONALES ══ */}
      {alertas.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="font-playfair text-lg font-bold text-stone-800">
              Alertas operacionales
            </h2>
            <span
              className="flex items-center gap-1 text-[10px] font-dm font-semibold px-2 py-1 rounded-full"
              style={{
                background: alertasAltas > 0 ? "#fef2f2" : "#fffbeb",
                color: alertasAltas > 0 ? "#dc2626" : "#d97706",
              }}
            >
              {alertas.length} pendiente{alertas.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2">
            {alertas.map((a) => (
              <AlertaCard key={a.id} alerta={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
