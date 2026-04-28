// src/features/staff/components/Supervisor/SStaffList.jsx
//
// Supervisor — gestión operativa de staff.
// Features:
//   · Turnos de hoy con conteo en tiempo real para en_curso
//   · Click en turno PROGRAMADO → modal QR para que el empleado escanee e inicie
//   · Click en turno EN_CURSO → modal QR para finalizar (abre auto -15min antes y +45min después)
//   · Auto-cancelación: si a los 45min de la hora de inicio sigue programado → cancelar
//   · Reprogramar: supervisor puede crear nuevo turno para el mismo empleado
//   · Asistencia en tiempo real
//   · Alertas operacionales mejoradas por nivel/tipo

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  Calendar,
  AlarmClock,
  LogIn,
  Bell,
  Ban,
  QrCode,
  ChevronDown,
  ChevronUp,
  Timer,
  Zap,
  Info,
  Package,
  ShoppingCart,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_TURNOS,
  GET_ASISTENCIA,
  GET_ALERTAS_OPERACIONALES,
  GET_EMPLEADOS,
} from "../../graphql/queries";
import {
  CANCELAR_TURNO,
  CREAR_TURNO,
  INICIAR_TURNO,
  REGISTRAR_SALIDA,
} from "../../graphql/mutations";
import { toLocalISO, inicioHoy, finHoy } from "../../utils/turnoFechas";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
  Modal,
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
const pad = (n) => String(n).padStart(2, "0");

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
function minutosDesde(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}
function minutosHasta(iso) {
  if (!iso) return null;
  return Math.floor((new Date(iso).getTime() - Date.now()) / 60000);
}
function fmtCountdown(totalMinutos) {
  if (totalMinutos === null) return "—";
  const abs = Math.abs(totalMinutos);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`;
}

// ── Configuración de estados ────────────────────────────────────────────────
const ESTADO_CFG = {
  programado: {
    label: "Programado",
    bg: "#eff6ff",
    text: "#3b82f6",
    border: "#bfdbfe",
    dot: "bg-blue-500",
  },
  activo: {
    label: "En curso",
    bg: G[50],
    text: G[300],
    border: G[100],
    dot: "bg-emerald-500 animate-pulse",
  },
  completado: {
    label: "Completado",
    bg: "#f0fdf4",
    text: "#16a34a",
    border: "#bbf7d0",
    dot: "bg-emerald-600",
  },
  cancelado: {
    label: "Cancelado",
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
    dot: "bg-red-500",
  },
};

// ── Configuración de alertas operacionales ──────────────────────────────────
const NIVEL_CFG = {
  ALTA: {
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
    dot: "bg-red-500",
    icon: Zap,
  },
  MEDIA: {
    bg: "#fffbeb",
    text: "#d97706",
    border: "#fde68a",
    dot: "bg-amber-400",
    icon: AlertTriangle,
  },
  INFORMATIVA: {
    bg: "#eff6ff",
    text: "#3b82f6",
    border: "#bfdbfe",
    dot: "bg-blue-400",
    icon: Info,
  },
  BAJA: {
    bg: "#fafaf9",
    text: "#78716c",
    border: "#e7e5e4",
    dot: "bg-stone-400",
    icon: Bell,
  },
};
const TIPO_LABEL = {
  orden_compra: "Orden de compra",
  stock_bajo: "Stock bajo",
  turno: "Turno",
  pedido: "Pedido",
  general: "General",
};

// ═══════════════════════════════════════════════════════════════════════════
// MODAL QR — Supervisor muestra el QR al empleado
//
// Flujo del backend:
//   PROGRAMADO → qrToken (entrada) ya existe desde crearTurno
//   Empleado escanea → iniciarTurno(turnoId) → estado=activo + nuevo qrToken (salida)
//   Empleado escanea al salir → registrarSalida(turnoId) → estado=completado
// ═══════════════════════════════════════════════════════════════════════════
function ModalQR({ turno, modo, onClose }) {
  const esIniciar = modo === "iniciar"; // programado → activo
  const [accionando, setAccionando] = useState(false);
  const [segundos, setSegundos] = useState(null);

  const [iniciarTurno] = useMutation(INICIAR_TURNO, {
    refetchQueries: ["GetTurnos"],
  });
  const [registrarSalida] = useMutation(REGISTRAR_SALIDA, {
    refetchQueries: ["GetTurnos"],
  });

  const token = turno.qrToken ?? "";

  // Countdown hasta expiración del QR
  useEffect(() => {
    if (!turno.qrExpiraEn) return;
    const calcular = () => {
      const diff = Math.floor(
        (new Date(turno.qrExpiraEn).getTime() - Date.now()) / 1000,
      );
      setSegundos(diff);
    };
    calcular();
    const id = setInterval(calcular, 1000);
    return () => clearInterval(id);
  }, [turno.qrExpiraEn]);

  const qrExpirado = segundos !== null && segundos <= 0;

  const fmtExpira = (s) => {
    if (s === null) return null;
    if (s <= 0) return "Expirado";
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return m > 0 ? `${m}m ${pad(ss)}s` : `${ss}s`;
  };

  // Acción manual de respaldo
  const handleAccionManual = async () => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      title: esIniciar
        ? "¿Iniciar manualmente?"
        : "¿Registrar salida manualmente?",
      html: `<span style="font-family:'DM Sans';color:#78716c">Confirma que <b>${turno.empleadoNombre}</b> ${esIniciar ? "está presente e inicia su turno." : "ha finalizado su turno."}</span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: G[900],
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    setAccionando(true);
    try {
      if (esIniciar) {
        const { data } = await iniciarTurno({
          variables: { turnoId: turno.id },
        });
        if (!data?.iniciarTurno?.ok)
          throw new Error(data?.iniciarTurno?.errores ?? "Error al iniciar");
        Swal.fire({
          background: "#fff",
          icon: "success",
          title: "Turno iniciado",
          timer: 1400,
          timerProgressBar: true,
          confirmButtonColor: G[900],
        });
      } else {
        const { data } = await registrarSalida({
          variables: { turnoId: turno.id },
        });
        if (!data?.registrarSalida?.ok)
          throw new Error(
            data?.registrarSalida?.errores ?? "Error al finalizar",
          );
        Swal.fire({
          background: "#fff",
          icon: "success",
          title: "Turno completado",
          timer: 1400,
          timerProgressBar: true,
          confirmButtonColor: G[900],
        });
      }
      onClose();
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setAccionando(false);
    }
  };

  const accentColor = esIniciar ? "#3b82f6" : G[300];
  const accentBg = esIniciar ? "#eff6ff" : G[50];
  const accentBorder = esIniciar ? "#bfdbfe" : G[100];

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={esIniciar ? "Iniciar turno" : "Finalizar turno"}
      size="sm"
    >
      <div className="space-y-4">
        {/* Instrucción */}
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-2xl"
          style={{ background: accentBg, border: `1px solid ${accentBorder}` }}
        >
          <QrCode
            size={15}
            style={{ color: accentColor }}
            className="mt-0.5 shrink-0"
          />
          <div>
            <p
              className="text-sm font-dm font-bold"
              style={{ color: accentColor }}
            >
              {esIniciar
                ? "Escanear para iniciar turno"
                : "Escanear para registrar salida"}
            </p>
            <p className="text-xs font-dm text-stone-500 mt-0.5">
              Pide a{" "}
              <span className="font-semibold">{turno.empleadoNombre}</span> que
              escanee este QR desde la app de empleados.
            </p>
          </div>
        </div>

        {/* Empleado + horario */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-100 bg-stone-50">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-playfair font-bold text-white text-base shrink-0"
            style={{ background: accentColor }}
          >
            {turno.empleadoNombre?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-dm font-semibold text-stone-900">
              {turno.empleadoNombre}
            </p>
            <p className="text-xs font-dm text-stone-400 mt-0.5">
              {fmtHora(turno.fechaInicio)} – {fmtHora(turno.fechaFin)}
              {turno.duracionHoras
                ? ` · ${turno.duracionHoras.toFixed(1)}h`
                : ""}
            </p>
          </div>
        </div>

        {/* QR — con lógica de ventana para modo "finalizar" */}
        {token ? (
          (() => {
            // Ventana de salida: QR habilitado desde -15min antes del fechaFin
            const minsParaFin = minutosHasta(turno.fechaFin);
            const fueraDeVentana =
              !esIniciar && (minsParaFin === null || minsParaFin > 15);
            const qrActivo = !fueraDeVentana && !qrExpirado;

            return (
              <div className="flex flex-col items-center gap-3">
                {fueraDeVentana ? (
                  // Fuera de ventana — mostrar countdown hasta que se habilite
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{
                        background: "#fffbeb",
                        border: "2px solid #fde68a",
                      }}
                    >
                      <Timer size={28} style={{ color: "#d97706" }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-dm font-semibold text-stone-700">
                        QR de salida disponible en
                      </p>
                      <p
                        className="font-playfair text-3xl font-bold mt-1"
                        style={{ color: "#d97706" }}
                      >
                        {fmtCountdown(minsParaFin - 15)}
                      </p>
                      <p className="text-xs font-dm text-stone-400 mt-1">
                        Se activa 15 minutos antes del fin del turno (
                        {fmtHora(turno.fechaFin)})
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`p-4 rounded-3xl border-4 transition-all ${!qrActivo ? "opacity-40 grayscale" : ""}`}
                    style={{ borderColor: accentColor, background: "#fff" }}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(token)}&color=${!qrActivo ? "9ca3af" : accentColor.replace("#", "")}&bgcolor=ffffff&format=svg&qzone=1`}
                      alt="QR de turno"
                      width={200}
                      height={200}
                      style={{ display: "block" }}
                    />
                  </div>
                )}

                {/* Estado del QR */}
                {!fueraDeVentana && turno.qrExpiraEn && (
                  <div
                    className={`flex items-center gap-2 text-xs font-dm font-semibold px-3 py-1.5 rounded-full ${
                      qrExpirado
                        ? "bg-red-50 text-red-500"
                        : segundos !== null && segundos < 60
                          ? "bg-amber-50 text-amber-600"
                          : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    <Timer size={11} />
                    {qrExpirado
                      ? "QR vencido — usa acción manual"
                      : `Expira en ${fmtExpira(segundos)}`}
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
            <QrCode size={40} className="opacity-30" />
            <p className="text-sm font-dm">QR no disponible</p>
          </div>
        )}

        {/* Horario recap */}
        <div className="grid grid-cols-2 gap-2">
          <div className="px-3 py-2.5 rounded-xl text-center bg-stone-50 border border-stone-100">
            <p className="text-[10px] font-dm text-stone-400">Inicio</p>
            <p className="font-playfair text-base font-bold text-stone-800">
              {fmtHora(turno.fechaInicio)}
            </p>
          </div>
          <div className="px-3 py-2.5 rounded-xl text-center bg-stone-50 border border-stone-100">
            <p className="text-[10px] font-dm text-stone-400">Fin</p>
            <p className="font-playfair text-base font-bold text-stone-800">
              {fmtHora(turno.fechaFin)}
            </p>
          </div>
        </div>

        {/* Acción manual */}
        <div className="pt-1 border-t border-stone-100">
          <p className="text-[10px] font-dm text-stone-400 text-center mb-2">
            ¿El empleado no puede escanear?
          </p>
          <button
            onClick={handleAccionManual}
            disabled={accionando}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-dm font-semibold border border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            {accionando ? (
              <span className="w-4 h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play size={13} />
            )}
            {esIniciar ? "Iniciar manualmente" : "Registrar salida manualmente"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL REPROGRAMAR
// ═══════════════════════════════════════════════════════════════════════════
function ModalReprogramar({ turno, restauranteId, onClose }) {
  // Día siguiente como fecha propuesta por defecto
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const mananaStr = manana.toISOString().slice(0, 10);
  const hoyStr = new Date().toISOString().slice(0, 10);

  const [fecha, setFecha] = useState(mananaStr);
  const [horaInicio, setHoraInicio] = useState(
    new Date(turno.fechaInicio).toTimeString().slice(0, 5),
  );
  const [horaFin, setHoraFin] = useState(
    new Date(turno.fechaFin).toTimeString().slice(0, 5),
  );
  const [notas, setNotas] = useState("");

  // Cargar todos los turnos del empleado para detectar conflictos
  const { data: turnosEmpleadoData, loading: loadingConflictos } = useQuery(
    GET_TURNOS,
    {
      variables: {
        empleadoId: turno.empleado,
        restauranteId,
        fechaDesde: mananaStr, // solo futuro interesa
      },
      fetchPolicy: "network-only",
    },
  );

  const [crearTurno, { loading }] = useMutation(CREAR_TURNO, {
    refetchQueries: ["GetTurnos"],
  });

  // Turnos futuros del empleado (excluyendo cancelados)
  const turnosFuturos = useMemo(() => {
    return (turnosEmpleadoData?.turnos ?? []).filter(
      (t) => t.id !== turno.id && t.estado !== "cancelado",
    );
  }, [turnosEmpleadoData, turno.id]);

  // Turnos del día seleccionado
  const turnosEnFechaSeleccionada = useMemo(() => {
    return turnosFuturos.filter((t) => {
      const dTurno = new Date(t.fechaInicio).toISOString().slice(0, 10);
      return dTurno === fecha;
    });
  }, [turnosFuturos, fecha]);

  const fechaEsHoy = fecha === hoyStr;
  const hayConflictoEnFecha = turnosEnFechaSeleccionada.length > 0;

  // Próximas fechas con turnos (para mostrar advertencia visual)
  const fechasOcupadas = useMemo(() => {
    const set = new Set();
    turnosFuturos.forEach((t) => {
      set.add(new Date(t.fechaInicio).toISOString().slice(0, 10));
    });
    return set;
  }, [turnosFuturos]);

  const handleSave = async () => {
    // No permitir el mismo día del turno original
    if (fechaEsHoy) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "No puedes reprogramar para hoy",
        html: `<span style="font-family:'DM Sans';color:#78716c">El turno se reprograma para un día futuro. Selecciona mañana o más adelante.</span>`,
        confirmButtonColor: G[900],
      });
      return;
    }

    // Bloquear si hay conflicto de turno en esa fecha
    if (hayConflictoEnFecha) {
      const lista = turnosEnFechaSeleccionada
        .map(
          (t) =>
            `• ${fmtHora(t.fechaInicio)} – ${fmtHora(t.fechaFin)} (${(ESTADO_CFG[t.estado] ?? ESTADO_CFG.programado).label})`,
        )
        .join("<br>");
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Fecha con turno existente",
        html: `<span style="font-family:'DM Sans';color:#78716c"><b>${turno.empleadoNombre}</b> ya tiene turno ese día:<br><br>${lista}<br><br>Elige otra fecha.</span>`,
        confirmButtonColor: G[900],
      });
      return;
    }

    const inicio = toLocalISO(new Date(`${fecha}T${horaInicio}:00`));
    const fin = toLocalISO(new Date(`${fecha}T${horaFin}:00`));

    if (new Date(fin) <= new Date(inicio)) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Horario inválido",
        text: "La hora de fin debe ser posterior a la de inicio.",
        confirmButtonColor: G[900],
      });
      return;
    }

    // Aviso de confirmación con la fecha propuesta
    const fechaDisplay = new Date(`${fecha}T12:00:00`).toLocaleDateString(
      "es-CO",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
      },
    );
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      icon: "info",
      title: "Confirmar reprogramación",
      html: `<span style="font-family:'DM Sans';color:#78716c">
        El turno de <b>${turno.empleadoNombre}</b> se reprogramará para:<br><br>
        <b style="color:#051F20">${fechaDisplay}</b><br>
        <b style="color:#051F20">${horaInicio} – ${horaFin}</b>
        ${notas ? `<br><br><i>"${notas}"</i>` : ""}
      </span>`,
      showCancelButton: true,
      confirmButtonColor: G[900],
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: "Sí, reprogramar",
      cancelButtonText: "Revisar",
    });
    if (!isConfirmed) return;

    try {
      const { data } = await crearTurno({
        variables: {
          empleado: turno.empleado,
          restauranteId,
          fechaInicio: inicio,
          fechaFin: fin,
          notas:
            notas ||
            `Reprogramado — turno original ${fmtFecha(turno.fechaInicio)} ${fmtHora(turno.fechaInicio)}`,
        },
      });
      if (!data?.crearTurno?.ok)
        throw new Error(data?.crearTurno?.errores ?? "Error");
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Turno reprogramado",
        html: `<span style="font-family:'DM Sans';color:#78716c">Nuevo turno creado para <b>${fechaDisplay}</b>.</span>`,
        timer: 2000,
        timerProgressBar: true,
        confirmButtonColor: G[900],
      });
      onClose();
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    }
  };

  const icls =
    "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 outline-none transition-all shadow-sm";
  const iclsError =
    "w-full px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm font-dm text-stone-900 outline-none transition-all shadow-sm";
  const fi = (e) => {
    e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
    e.target.style.borderColor = "transparent";
  };
  const fb = (e) => {
    e.target.style.boxShadow = "none";
    e.target.style.borderColor = "#e2e8f0";
  };

  return (
    <Modal open={true} onClose={onClose} title="Reprogramar turno" size="sm">
      <div className="space-y-4">
        {/* Empleado + turno original */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-dm font-bold text-white text-xs shrink-0"
            style={{ background: G[300] }}
          >
            {turno.empleadoNombre?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-dm font-semibold text-stone-800 text-sm">
              {turno.empleadoNombre}
            </p>
            <p className="text-[10px] font-dm text-stone-400">
              Turno original cancelado: {fmtFecha(turno.fechaInicio)}{" "}
              {fmtHora(turno.fechaInicio)} – {fmtHora(turno.fechaFin)}
            </p>
          </div>
        </div>

        {/* Aviso: solo días futuros */}
        <div
          className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-dm"
          style={{
            background: "#eff6ff",
            borderColor: "#bfdbfe",
            color: "#3b82f6",
          }}
        >
          <Calendar size={13} className="shrink-0 mt-0.5" />
          <span>
            El turno se reprogramará para la fecha que selecciones. No se puede
            reprogramar para hoy ni para días con turno existente.
          </span>
        </div>

        {/* Selector de fecha */}
        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-500">
            Nueva fecha
          </label>
          <input
            type="date"
            value={fecha}
            min={mananaStr}
            onChange={(e) => setFecha(e.target.value)}
            className={hayConflictoEnFecha ? iclsError : icls}
            onFocus={fi}
            onBlur={fb}
          />

          {/* Estado de la fecha seleccionada */}
          {loadingConflictos ? (
            <p className="text-[10px] font-dm text-stone-400 flex items-center gap-1">
              <span className="w-3 h-3 border border-stone-300 border-t-transparent rounded-full animate-spin inline-block" />
              Verificando disponibilidad...
            </p>
          ) : hayConflictoEnFecha ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 space-y-1.5">
              <p className="text-xs font-dm font-semibold text-red-600 flex items-center gap-1.5">
                <XCircle size={12} />
                {turno.empleadoNombre} ya tiene turno ese día — elige otra fecha
              </p>
              {turnosEnFechaSeleccionada.map((t) => {
                const meta = ESTADO_CFG[t.estado] ?? ESTADO_CFG.programado;
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 text-[10px] font-dm"
                    style={{ color: meta.text }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: meta.text }}
                    />
                    {fmtHora(t.fechaInicio)} – {fmtHora(t.fechaFin)} ·{" "}
                    {meta.label}
                  </div>
                );
              })}
            </div>
          ) : fecha && fecha !== mananaStr ? (
            <p className="text-[10px] font-dm text-emerald-600 flex items-center gap-1">
              <CheckCircle2 size={11} /> Fecha disponible
            </p>
          ) : null}

          {/* Próximas fechas ocupadas como advertencia */}
          {fechasOcupadas.size > 0 && !loadingConflictos && (
            <div className="flex items-start gap-1.5 text-[10px] font-dm text-amber-600">
              <AlertTriangle size={11} className="shrink-0 mt-0.5" />
              <span>
                Tiene turnos en:{" "}
                {[...fechasOcupadas]
                  .sort()
                  .slice(0, 4)
                  .map((f) =>
                    new Date(`${f}T12:00:00`).toLocaleDateString("es-CO", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    }),
                  )
                  .join(", ")}
                {fechasOcupadas.size > 4
                  ? ` y ${fechasOcupadas.size - 4} más`
                  : ""}
              </span>
            </div>
          )}
        </div>

        {/* Horas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-dm font-semibold text-stone-500">
              Hora inicio
            </label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-dm font-semibold text-stone-500">
              Hora fin
            </label>
            <input
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </div>
        </div>

        {/* Nota */}
        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-500">
            Nota (opcional)
          </label>
          <input
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Motivo de reprogramación..."
            className={icls}
            onFocus={fi}
            onBlur={fb}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={loading}
            disabled={hayConflictoEnFecha || fechaEsHoy || loadingConflictos}
            onClick={handleSave}
          >
            <RotateCcw size={13} /> Reprogramar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TARJETA DE TURNO
// ═══════════════════════════════════════════════════════════════════════════
function TurnoCard({ turno, onShowQR, onReprogramar, onCancelar, cancelando }) {
  const meta = ESTADO_CFG[turno.estado] ?? ESTADO_CFG.programado;
  const enCurso = turno.estado === "activo";
  const prog = turno.estado === "programado";
  const cancel = turno.estado === "programado"; // activo no se cancela manualmente

  // Tiempo restante para en_curso
  const minsRestantes = enCurso ? minutosHasta(turno.fechaFin) : null;
  const urgenteFin = enCurso && minsRestantes !== null && minsRestantes <= 15;

  // Tiempo pasado desde inicio para programado
  const minsPasados = prog ? minutosDesde(turno.fechaInicio) : null;
  const tardanza = prog && minsPasados !== null && minsPasados > 0;

  const loading = cancelando === turno.id;

  return (
    <div
      onClick={() => {
        if (prog) onShowQR(turno, "iniciar");
        else if (enCurso) onShowQR(turno, "finalizar");
      }}
      className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all ${
        prog || enCurso
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
          : ""
      }`}
      style={{
        background: "#fff",
        borderColor: urgenteFin
          ? "#fde68a"
          : tardanza && minsPasados > 30
            ? "#fecaca"
            : meta.border,
        boxShadow: urgenteFin
          ? "0 0 0 2px #fde68a"
          : tardanza && minsPasados > 30
            ? "0 0 0 2px #fecaca"
            : "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-dm font-bold text-sm"
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
          {fmtHora(turno.fechaInicio)} – {fmtHora(turno.fechaFin)}
          {turno.duracionHoras ? ` · ${turno.duracionHoras.toFixed(1)}h` : ""}
        </p>
      </div>

      {/* Countdown para en_curso */}
      {enCurso && minsRestantes !== null && (
        <div className="text-right shrink-0">
          <p
            className={`text-sm font-playfair font-bold ${urgenteFin ? "text-amber-600" : "text-stone-700"}`}
          >
            {minsRestantes > 0
              ? `${fmtCountdown(minsRestantes)} restante`
              : `${fmtCountdown(minsRestantes)} pasado`}
          </p>
          {urgenteFin && (
            <p className="text-[9px] font-dm text-amber-500">Por terminar</p>
          )}
        </div>
      )}

      {/* Tardanza para programado */}
      {prog && tardanza && (
        <div className="text-right shrink-0">
          <p
            className={`text-[10px] font-dm font-semibold ${minsPasados > 30 ? "text-red-500" : "text-amber-500"}`}
          >
            {minsPasados}m tarde
          </p>
        </div>
      )}

      {/* Badge estado */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        <span
          className="text-[10px] font-dm font-semibold hidden sm:block"
          style={{ color: meta.text }}
        >
          {meta.label}
        </span>
      </div>

      {/* QR hint para programado/en_curso */}
      {(prog || enCurso) && (
        <QrCode size={14} className="text-stone-300 shrink-0" />
      )}

      {/* Botones acción (no bloquean el click de la card) */}
      <div
        className="flex items-center gap-1 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {turno.estado === "cancelado" && (
          <button
            onClick={() => onReprogramar(turno)}
            className="flex items-center gap-1 text-[10px] font-dm font-semibold px-2 py-1.5 rounded-lg border border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100 transition-colors"
          >
            <RotateCcw size={10} /> Reprogramar
          </button>
        )}
        {cancel && (
          <button
            onClick={() => onCancelar(turno)}
            disabled={loading}
            className="flex items-center gap-1 text-[10px] font-dm font-semibold px-2 py-1.5 rounded-lg border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="w-3 h-3 border border-red-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Ban size={10} />
            )}
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ALERTA OPERACIONAL — Mejorada
// ═══════════════════════════════════════════════════════════════════════════
function AlertaCard({ alerta }) {
  const nivel = (alerta.nivel ?? "BAJA").toUpperCase();
  const cfg = NIVEL_CFG[nivel] ?? NIVEL_CFG.BAJA;
  const Icon = cfg.icon;
  const tipo =
    TIPO_LABEL[alerta.tipo] ?? alerta.tipoDisplay ?? alerta.tipo ?? "General";

  // Limpiar el mensaje para hacerlo legible
  let mensaje = alerta.mensaje ?? "";
  // Reemplazar UUIDs completos con versión corta
  mensaje = mensaje.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    (uuid) => `…${uuid.slice(-8)}`,
  );
  // Para orden_compra: limpiar UUIDs y total 0.0 — mostrar solo lo esencial
  if (alerta.tipo === "orden_compra") {
    mensaje = mensaje.replace(/ \| total 0\.0 [A-Z]+/, "");
    // El nombre real del proveedor no viene en el evento — usar referencia limpia
    mensaje = mensaje.replace(/— proveedor …[0-9a-f]+/i, "");
    mensaje = mensaje.trim().replace(/—\s*$/, "").trim();
  }

  const [expanded, setExpanded] = useState(false);
  const larga = mensaje.length > 80;
  const esOrdenCompra = alerta.tipo === "orden_compra";
  const cardBg = cfg.bg;
  const cardBorder = cfg.border;
  const cardText = cfg.text;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: cardBg, borderColor: cardBorder }}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${cardText}18` }}
        >
          <Icon size={14} style={{ color: cardText }} />
        </div>
        <div className="flex-1 min-w-0">
          {/* Nivel + tipo */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[10px] font-dm font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${cardText}18`, color: cardText }}
            >
              {alerta.nivelDisplay ?? nivel}
            </span>
            <span className="text-[10px] font-dm font-semibold text-stone-500">
              {tipo}
            </span>
          </div>
          {/* Mensaje */}
          <p
            className={`text-sm font-dm text-stone-700 leading-snug ${!expanded && larga ? "line-clamp-2" : ""}`}
          >
            {mensaje}
          </p>
          {larga && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] font-dm font-semibold mt-1 flex items-center gap-0.5"
              style={{ color: cardText }}
            >
              {expanded ? (
                <>
                  <ChevronUp size={10} /> Ver menos
                </>
              ) : (
                <>
                  <ChevronDown size={10} /> Ver más
                </>
              )}
            </button>
          )}
          {/* Fecha */}
          <p className="text-[10px] font-dm text-stone-400 mt-1">
            {new Date(alerta.createdAt).toLocaleString("es-CO", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ASISTENCIA ROW
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
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
const AUTO_CANCEL_MINUTOS = 45; // cancelar si lleva N minutos después del inicio en programado

export default function SStaffList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [cancelando, setCancelando] = useState(null);

  // Modal QR
  const [qrModal, setQrModal] = useState(null); // { turno, modo: "iniciar"|"finalizar" }

  // Modal reprogramar
  const [reprogramarTurno, setReprogramarTurno] = useState(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const {
    data: turnosData,
    loading: turnosLoading,
    refetch: refetchTurnos,
  } = useQuery(GET_TURNOS, {
    variables: { restauranteId, fechaDesde: inicioHoy(), fechaHasta: finHoy() },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });

  const {
    data: asistData,
    loading: asistLoading,
    refetch: refetchAsist,
  } = useQuery(GET_ASISTENCIA, {
    variables: { restauranteId, fechaDesde: inicioHoy() },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });

  const { data: alertasData } = useQuery(GET_ALERTAS_OPERACIONALES, {
    variables: { restauranteId, resuelta: false },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
    pollInterval: 60000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const [cancelarTurno] = useMutation(CANCELAR_TURNO, {
    refetchQueries: ["GetTurnos"],
  });

  // ── Data ──────────────────────────────────────────────────────────────────
  const turnos = turnosData?.turnos ?? [];
  const asistencia = asistData?.asistencia ?? [];
  const alertas = alertasData?.alertasOperacionales ?? [];

  const enCurso = turnos.filter((t) => t.estado === "activo").length;
  const programados = turnos.filter((t) => t.estado === "programado").length;
  const alertasAltas = alertas.filter(
    (a) => (a.nivel ?? "").toUpperCase() === "ALTA",
  ).length;

  // ── Auto-cancelación: 45min después del inicio sin escanear ───────────────
  // Usa setInterval propio (cada 60s) independiente del poll de Apollo.
  // Así no depende de que lleguen datos nuevos para dispararse.
  const canceladosRef = useRef(new Set()); // evitar doble-cancelación
  useEffect(() => {
    const check = async () => {
      const tardos = turnos.filter((t) => {
        if (t.estado !== "programado") return false;
        if (canceladosRef.current.has(t.id)) return false;
        const mins = minutosDesde(t.fechaInicio);
        return mins !== null && mins >= AUTO_CANCEL_MINUTOS;
      });

      for (const turno of tardos) {
        canceladosRef.current.add(turno.id); // marcar antes de la llamada
        try {
          const { data } = await cancelarTurno({
            variables: { turnoId: turno.id },
          });
          if (!data?.cancelarTurno?.ok) {
            canceladosRef.current.delete(turno.id); // revertir si falló
          }
        } catch (e) {
          canceladosRef.current.delete(turno.id);
          console.error("[Auto-cancel] Error:", e);
        }
      }
    };

    // Correr inmediatamente al montar y al cambiar turnos
    check();
    // Y cada 60 segundos independientemente
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [turnos, cancelarTurno]);

  // ── Ventana de salida: QR habilitado -15min antes del fechaFin ────────────
  // Si turno ACTIVO pasa +15min de fechaFin sin registrar salida → cancelar
  const autoCancelSalidaRef = useRef(new Set());
  useEffect(() => {
    if (!qrModal) {
      // Auto-abrir modal finalizar cuando entramos en ventana (-15min a 0)
      const candidato = turnos.find((t) => {
        if (t.estado !== "activo") return false;
        if (modalAutoAbiertoRef.current.has(t.id)) return false;
        const restantes = minutosHasta(t.fechaFin);
        return restantes !== null && restantes <= 15 && restantes >= 0;
      });
      if (candidato) {
        modalAutoAbiertoRef.current.add(candidato.id);
        setQrModal({ turno: candidato, modo: "finalizar" });
      }
    }

    // Auto-cancelar turnos activos que llevan +15min después de su fechaFin sin salida
    const vencidos = turnos.filter((t) => {
      if (t.estado !== "activo") return false;
      if (autoCancelSalidaRef.current.has(t.id)) return false;
      const pasados = minutosDesde(t.fechaFin);
      return pasados !== null && pasados >= 15;
    });

    vencidos.forEach(async (t) => {
      autoCancelSalidaRef.current.add(t.id);
      try {
        const { data } = await cancelarTurno({ variables: { turnoId: t.id } });
        if (!data?.cancelarTurno?.ok) autoCancelSalidaRef.current.delete(t.id);
      } catch (e) {
        autoCancelSalidaRef.current.delete(t.id);
        console.error("[Auto-cancel salida]", e);
      }
    });
  }, [turnos, qrModal, cancelarTurno]);

  // ── Auto-abrir modal QR para finalizar (-15min antes o +45min después) ───
  const modalAutoAbiertoRef = useRef(new Set());
  useEffect(() => {
    if (qrModal) return; // ya hay un modal abierto
    const candidato = turnos.find((t) => {
      if (t.estado !== "activo") return false;
      if (modalAutoAbiertoRef.current.has(t.id)) return false;
      const restantes = minutosHasta(t.fechaFin);
      // -15 antes de acabar o hasta +45 después
      return restantes !== null && restantes <= 15 && restantes >= -45;
    });
    if (candidato) {
      modalAutoAbiertoRef.current.add(candidato.id);
      setQrModal({ turno: candidato, modo: "finalizar" });
    }
  }, [turnos, qrModal]);

  // ── Filtro de turnos ──────────────────────────────────────────────────────
  const filteredTurnos = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return turnos.filter((t) => {
      if (q && !t.empleadoNombre?.toLowerCase().includes(q)) return false;
      if (filtroEstado !== "all" && t.estado !== filtroEstado) return false;
      return true;
    });
  }, [turnos, busqueda, filtroEstado]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCancelar = async (turno) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      title: "¿Cancelar turno?",
      html: `<span style="font-family:'DM Sans';color:#78716c">Turno de <b>${turno.empleadoNombre}</b> (${fmtHora(turno.fechaInicio)} – ${fmtHora(turno.fechaFin)}).</span>`,
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Supervisor"
        title="Staff operativo"
        description="Gestiona turnos de hoy — toca un turno para mostrar el QR."
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
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "En curso",
            n: enCurso,
            style: { background: G[50], borderColor: G[100] },
            text: G[300],
            extra: (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ),
          },
          {
            label: "Programados",
            n: programados,
            style: { background: "#eff6ff", borderColor: "#bfdbfe" },
            text: "#3b82f6",
            extra: <Calendar size={14} className="text-blue-400" />,
          },
          {
            label: "Alertas",
            n: alertas.length,
            style:
              alertasAltas > 0
                ? { background: "#fef2f2", borderColor: "#fecaca" }
                : { background: "#f5f5f4", borderColor: "#e5e5e5" },
            text: alertasAltas > 0 ? "#dc2626" : "#a8a29e",
            extra: (
              <Bell
                size={14}
                className={alertasAltas > 0 ? "text-red-400" : "text-stone-300"}
              />
            ),
          },
        ].map(({ label, n, style, text, extra }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-3.5 rounded-2xl border"
            style={{ ...style, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            {extra}
            <div>
              <p
                className="text-2xl font-playfair font-bold"
                style={{ color: text }}
              >
                {n}
              </p>
              <p
                className="text-[10px] font-dm font-semibold"
                style={{ color: text }}
              >
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ══ TURNOS ══ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-playfair text-lg font-bold text-stone-800">
            Turnos de hoy
          </h2>
          <span className="text-xs font-dm text-stone-400">
            {fmtFecha(new Date().toISOString())} · Toca para QR
          </span>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div
            className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200"
            onFocusCapture={(e) =>
              (e.currentTarget.style.boxShadow = `0 0 0 2px ${G[300]}`)
            }
            onBlurCapture={(e) => (e.currentTarget.style.boxShadow = "none")}
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
              { v: "activo", l: "En curso" },
              { v: "programado", l: "Programados" },
              { v: "completado", l: "Completados" },
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

        {/* Lista */}
        {turnosLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        ) : filteredTurnos.length === 0 ? (
          <EmptyState
            icon={Clock}
            title={
              filtroEstado === "all"
                ? "Sin turnos hoy"
                : `Sin turnos ${filtroEstado.replace("_", " ")}`
            }
            description="No hay turnos en este filtro para hoy."
          />
        ) : (
          <div className="space-y-2">
            {filteredTurnos.map((t) => (
              <TurnoCard
                key={t.id}
                turno={t}
                onShowQR={(turno, modo) => setQrModal({ turno, modo })}
                onReprogramar={setReprogramarTurno}
                onCancelar={handleCancelar}
                cancelando={cancelando}
              />
            ))}
          </div>
        )}
      </section>

      {/* ══ ASISTENCIA ══ */}
      <section className="space-y-3">
        <h2 className="font-playfair text-lg font-bold text-stone-800">
          Asistencia de hoy
        </h2>
        {asistLoading ? (
          <Skeleton className="h-28 rounded-2xl" />
        ) : asistencia.length === 0 ? (
          <div className="space-y-2">
            {/* Si hay turnos activos pero sin registro QR, mostrarlos igual */}
            {turnos.filter((t) => t.estado === "activo").length > 0 ? (
              <>
                <div
                  className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-dm"
                  style={{
                    background: "#eff6ff",
                    borderColor: "#bfdbfe",
                    color: "#3b82f6",
                  }}
                >
                  <Info size={13} className="shrink-0 mt-0.5" />
                  <span>
                    El turno fue iniciado manualmente — el registro formal de
                    asistencia se crea al escanear el QR.
                  </span>
                </div>
                <div
                  className="bg-white border border-stone-200 rounded-2xl overflow-hidden"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 bg-stone-50/50">
                        {[
                          "Empleado",
                          "Entrada",
                          "Fin turno",
                          "Estado",
                          "Trabajadas",
                        ].map((l) => (
                          <th
                            key={l}
                            className="py-2.5 px-3 text-left text-[10px] font-dm font-semibold text-stone-400 uppercase tracking-wide first:pl-5 last:pr-5"
                          >
                            {l}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {turnos
                        .filter((t) => t.estado === "activo")
                        .map((t) => {
                          const inicio = new Date(t.fechaInicio);
                          const ahora = new Date();
                          const mins = Math.floor((ahora - inicio) / 60000);
                          const h = Math.floor(mins / 60);
                          const m = mins % 60;
                          return (
                            <tr
                              key={t.id}
                              className="border-b border-stone-100 last:border-0"
                            >
                              <td className="py-3 pl-5 pr-3">
                                <p className="text-sm font-dm font-semibold text-stone-800">
                                  {t.empleadoNombre}
                                </p>
                              </td>
                              <td className="py-3 px-3 text-sm font-dm text-stone-600">
                                {inicio.toLocaleTimeString("es-CO", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="py-3 px-3 text-sm font-dm text-stone-500">
                                {new Date(t.fechaFin).toLocaleTimeString(
                                  "es-CO",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  En curso
                                </span>
                              </td>
                              <td className="py-3 pr-5 pl-3 text-sm font-dm font-semibold text-stone-700">
                                {h > 0 ? `${h}h ${m}m` : `${m}m`}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50">
                <LogIn size={14} className="text-stone-300" />
                <p className="text-sm font-dm text-stone-400">
                  Ningún empleado ha registrado entrada hoy.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            className="bg-white border border-stone-200 rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
          >
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
        )}
      </section>

      {/* ══ ALERTAS OPERACIONALES ══ */}
      {alertas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-playfair text-lg font-bold text-stone-800">
              Alertas operacionales
            </h2>
            <span
              className="text-[10px] font-dm font-semibold px-2 py-1 rounded-full"
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

      {/* ══ MODALES ══ */}
      {qrModal && (
        <ModalQR
          turno={qrModal.turno}
          modo={qrModal.modo}
          onClose={() => setQrModal(null)}
        />
      )}

      {reprogramarTurno && (
        <ModalReprogramar
          turno={reprogramarTurno}
          restauranteId={restauranteId}
          onClose={() => setReprogramarTurno(null)}
        />
      )}
    </div>
  );
}
