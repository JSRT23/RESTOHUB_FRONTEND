// src/features/staff/components/Gerente/GTurnosList.jsx
//
// Planificación de turnos para el gerente local.
// El gerente CREA y CANCELA turnos (planificación).
// El supervisor los INICIA y registra asistencia (operación).
//
// Ruta: /gerente/staff/turnos

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Clock,
  Plus,
  Search,
  Calendar,
  UserCircle,
  ChevronDown,
  X,
  Loader2,
  AlarmClock,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
  Modal,
} from "../../../../shared/components/ui";
import { GET_TURNOS, GET_EMPLEADOS } from "../../graphql/queries";
import { CREAR_TURNO, CANCELAR_TURNO } from "../../graphql/mutations";

// ── Paleta ─────────────────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fi = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
};
const fb = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};
const cls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all shadow-sm";

function fmtFecha(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function fmtHora(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function fmtDatetimeLocal(str) {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d)) return "";
  // "YYYY-MM-DDTHH:mm"
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ESTADO_CONFIG = {
  programado: { label: "Programado", variant: "blue", icon: AlarmClock },
  en_curso: { label: "En curso", variant: "green", icon: CheckCircle2 },
  completado: { label: "Completado", variant: "default", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", variant: "red", icon: XCircle },
};

// ── Field wrapper ──────────────────────────────────────────────────────────
function Field({ icon: Icon, label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-dm font-semibold text-stone-500">
        {Icon && <Icon size={11} style={{ color: G[300] }} />}
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Modal: Crear turno ─────────────────────────────────────────────────────
function ModalCrear({ open, onClose, restauranteId, empleados }) {
  const ahora = new Date();
  const enUnaHora = new Date(ahora.getTime() + 3600000);
  const enOchoHoras = new Date(ahora.getTime() + 8 * 3600000);

  const pad = (n) => String(n).padStart(2, "0");
  const toLocal = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const INIT = {
    empleadoId: "",
    fechaInicio: toLocal(enUnaHora),
    fechaFin: toLocal(enOchoHoras),
    notas: "",
  };
  const [form, setForm] = useState(INIT);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [crear, { loading }] = useMutation(CREAR_TURNO, {
    refetchQueries: ["GetTurnos"],
  });

  // Calcular duración en tiempo real
  const duracion = useMemo(() => {
    if (!form.fechaInicio || !form.fechaFin) return null;
    const diff =
      new Date(form.fechaFin).getTime() - new Date(form.fechaInicio).getTime();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m > 0 ? m + "m" : ""}`.trim();
  }, [form.fechaInicio, form.fechaFin]);

  const handleSave = async () => {
    if (!form.empleadoId || !form.fechaInicio || !form.fechaFin) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Campos requeridos",
        text: "Selecciona un empleado y define las fechas del turno.",
        confirmButtonColor: G[900],
      });
      return;
    }
    if (new Date(form.fechaFin) <= new Date(form.fechaInicio)) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Fechas inválidas",
        text: "La fecha de fin debe ser posterior al inicio.",
        confirmButtonColor: G[900],
      });
      return;
    }
    try {
      const { data } = await crear({
        variables: {
          empleado: form.empleadoId,
          restauranteId,
          fechaInicio: new Date(form.fechaInicio).toISOString(),
          fechaFin: new Date(form.fechaFin).toISOString(),
          notas: form.notas || null,
        },
      });
      const res = data?.crearTurno;
      if (!res?.ok) throw new Error(res?.errores?.[0] || "Error al crear");
      const emp = empleados.find((e) => e.id === form.empleadoId);
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "¡Turno programado!",
        html: `<span style="font-family:'DM Sans';color:#78716c">Turno creado para <b>${emp?.nombre ?? ""} ${emp?.apellido ?? ""}</b>.</span>`,
        confirmButtonColor: G[900],
        timer: 1800,
        timerProgressBar: true,
      });
      setForm(INIT);
      onClose();
    } catch (err) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: err.message,
        confirmButtonColor: G[900],
      });
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Programar turno" size="md">
      <div className="space-y-4">
        {/* Empleado */}
        <Field icon={UserCircle} label="Empleado" required>
          <div className="relative">
            <select
              className={cls + " appearance-none cursor-pointer pr-8"}
              onFocus={fi}
              onBlur={fb}
              value={form.empleadoId}
              onChange={set("empleadoId")}
            >
              <option value="">— Selecciona un empleado —</option>
              {empleados
                .filter((e) => e.activo)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} {e.apellido} · {e.rolDisplay || e.rol}
                  </option>
                ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            />
          </div>
        </Field>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-3">
          <Field icon={Calendar} label="Inicio" required>
            <input
              type="datetime-local"
              className={cls}
              onFocus={fi}
              onBlur={fb}
              value={form.fechaInicio}
              onChange={set("fechaInicio")}
            />
          </Field>
          <Field icon={Calendar} label="Fin" required>
            <input
              type="datetime-local"
              className={cls}
              onFocus={fi}
              onBlur={fb}
              value={form.fechaFin}
              onChange={set("fechaFin")}
            />
          </Field>
        </div>

        {/* Preview duración */}
        {duracion && (
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-dm"
            style={{
              background: G[50],
              borderColor: G[100],
              color: G[500],
            }}
          >
            <Clock size={13} style={{ color: G[300] }} />
            <span>
              Duración estimada: <strong>{duracion}</strong>
            </span>
          </div>
        )}

        {/* Notas */}
        <Field icon={null} label="Notas (opcional)">
          <textarea
            className={cls + " resize-none"}
            onFocus={fi}
            onBlur={fb}
            rows={2}
            value={form.notas}
            onChange={set("notas")}
            placeholder="Ej: Turno de cocina, sección caliente"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button size="sm" loading={loading} onClick={handleSave}>
            Programar turno
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Tarjeta de turno ───────────────────────────────────────────────────────
function TurnoCard({ turno, onCancelar, canceling }) {
  const estado = ESTADO_CONFIG[turno.estado] ?? ESTADO_CONFIG.programado;
  const IconEstado = estado.icon;
  const cancelable =
    turno.estado === "programado" || turno.estado === "en_curso";

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 flex gap-4 items-start hover:shadow-sm transition-all">
      {/* Ícono estado */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background:
            turno.estado === "en_curso"
              ? "#d1fae5"
              : turno.estado === "cancelado"
                ? "#fee2e2"
                : G[50],
        }}
      >
        <IconEstado
          size={16}
          style={{
            color:
              turno.estado === "en_curso"
                ? "#059669"
                : turno.estado === "cancelado"
                  ? "#dc2626"
                  : G[300],
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-dm font-semibold text-stone-800">
            {turno.empleadoNombre}
          </p>
          <Badge variant={estado.variant}>{estado.label}</Badge>
        </div>

        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          <span className="flex items-center gap-1 text-xs font-dm text-stone-400">
            <Calendar size={11} /> {fmtFecha(turno.fechaInicio)}
          </span>
          <span className="flex items-center gap-1 text-xs font-dm text-stone-400">
            <Clock size={11} />
            {fmtHora(turno.fechaInicio)} — {fmtHora(turno.fechaFin)}
          </span>
          {turno.duracionHoras != null && (
            <span className="text-xs font-dm text-stone-400">
              {Number(turno.duracionHoras).toFixed(1)}h
            </span>
          )}
        </div>

        {turno.notas && (
          <p className="mt-1.5 text-xs font-dm text-stone-400 italic">
            "{turno.notas}"
          </p>
        )}
      </div>

      {/* Cancelar */}
      {cancelable && (
        <button
          onClick={() => onCancelar(turno)}
          disabled={canceling === turno.id}
          className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
          title="Cancelar turno"
        >
          {canceling === turno.id ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Ban size={14} />
          )}
        </button>
      )}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function GTurnosList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  // Rango de fechas: semana actual
  const hoy = new Date();
  const lunesSemana = new Date(hoy);
  lunesSemana.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  lunesSemana.setHours(0, 0, 0, 0);
  const domingoSemana = new Date(lunesSemana);
  domingoSemana.setDate(lunesSemana.getDate() + 13); // 2 semanas
  domingoSemana.setHours(23, 59, 59, 999);

  const pad = (n) => String(n).padStart(2, "0");
  const toDateStr = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState(toDateStr(lunesSemana));
  const [fechaHasta, setFechaHasta] = useState(toDateStr(domingoSemana));
  const [showCrear, setShowCrear] = useState(false);
  const [canceling, setCanceling] = useState(null);

  const { data, loading, error } = useQuery(GET_TURNOS, {
    variables: {
      restauranteId,
      estado: filtroEstado !== "todos" ? filtroEstado : undefined,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
    },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  const { data: empData } = useQuery(GET_EMPLEADOS, {
    variables: { restauranteId, activo: true },
    skip: !restauranteId,
  });

  const [cancelar] = useMutation(CANCELAR_TURNO, {
    refetchQueries: ["GetTurnos"],
  });

  const turnos = data?.turnos ?? [];
  const empleados = empData?.empleados ?? [];

  const filtrados = turnos.filter((t) => {
    if (!busqueda.trim()) return true;
    return t.empleadoNombre?.toLowerCase().includes(busqueda.toLowerCase());
  });

  // Agrupar por fecha
  const agrupados = useMemo(() => {
    const map = new Map();
    filtrados.forEach((t) => {
      const fechaKey = new Date(t.fechaInicio).toDateString();
      if (!map.has(fechaKey)) map.set(fechaKey, []);
      map.get(fechaKey).push(t);
    });
    return [...map.entries()].sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime(),
    );
  }, [filtrados]);

  const handleCancelar = async (turno) => {
    const confirm = await Swal.fire({
      background: "#fff",
      icon: "warning",
      title: "¿Cancelar este turno?",
      html: `<span style="font-family:'DM Sans';color:#78716c">Turno de <b>${turno.empleadoNombre}</b> el ${fmtFecha(turno.fechaInicio)}.</span>`,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });
    if (!confirm.isConfirmed) return;

    setCanceling(turno.id);
    try {
      const { data } = await cancelar({ variables: { turnoId: turno.id } });
      const res = data?.cancelarTurno;
      if (!res?.ok) throw new Error(res?.errores?.[0] || "Error");
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Turno cancelado",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: err.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setCanceling(null);
    }
  };

  // KPIs
  const programados = turnos.filter((t) => t.estado === "programado").length;
  const enCurso = turnos.filter((t) => t.estado === "en_curso").length;
  const completados = turnos.filter((t) => t.estado === "completado").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Turnos"
        subtitle="Planificación de turnos de tu equipo"
        icon={Clock}
        action={
          <Button size="sm" onClick={() => setShowCrear(true)}>
            <Plus size={14} /> Programar turno
          </Button>
        }
      />

      {/* KPIs */}
      {!loading && turnos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Programados", value: programados, color: "#2563eb" },
            { label: "En curso", value: enCurso, color: "#059669" },
            { label: "Completados", value: completados, color: G[300] },
          ].map((k) => (
            <div
              key={k.label}
              className="bg-white rounded-2xl border border-stone-200 px-4 py-3"
            >
              <p
                className="text-2xl font-dm font-bold"
                style={{ color: k.color }}
              >
                {k.value}
              </p>
              <p className="text-xs font-dm text-stone-400 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-800 placeholder:text-stone-400 outline-none shadow-sm"
            placeholder="Buscar empleado…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <input
          type="date"
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-700 outline-none shadow-sm"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
        />
        <input
          type="date"
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-700 outline-none shadow-sm"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
        />

        <div className="relative">
          <select
            className="pl-3.5 pr-8 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-700 outline-none shadow-sm appearance-none cursor-pointer"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="programado">Programado</option>
            <option value="en_curso">En curso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <ChevronDown
            size={13}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Contenido */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <p className="text-sm font-dm text-red-600">
            Error al cargar turnos: {error.message}
          </p>
        </div>
      )}

      {!loading && !error && filtrados.length === 0 && (
        <EmptyState
          icon={Clock}
          title="Sin turnos en este rango"
          description="Cambia el rango de fechas o programa un nuevo turno."
          action={
            <Button size="sm" onClick={() => setShowCrear(true)}>
              <Plus size={14} /> Programar turno
            </Button>
          }
        />
      )}

      {/* Agrupado por fecha */}
      {!loading && agrupados.length > 0 && (
        <div className="space-y-6">
          {agrupados.map(([fechaKey, lista]) => {
            const fechaD = new Date(fechaKey);
            const esHoy = fechaD.toDateString() === hoy.toDateString();
            const esManana =
              fechaD.toDateString() ===
              new Date(hoy.getTime() + 86400000).toDateString();
            const label = esHoy
              ? "Hoy"
              : esManana
                ? "Mañana"
                : fechaD.toLocaleDateString("es-CO", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  });

            return (
              <div key={fechaKey}>
                <div className="flex items-center gap-3 mb-3">
                  <p
                    className="text-xs font-dm font-semibold capitalize"
                    style={{ color: esHoy ? G[300] : "#78716c" }}
                  >
                    {label}
                  </p>
                  <div className="flex-1 h-px bg-stone-200" />
                  <span className="text-xs font-dm text-stone-400">
                    {lista.length} turno{lista.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {lista.map((t) => (
                    <TurnoCard
                      key={t.id}
                      turno={t}
                      onCancelar={handleCancelar}
                      canceling={canceling}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ModalCrear
        open={showCrear}
        onClose={() => setShowCrear(false)}
        restauranteId={restauranteId}
        empleados={empleados}
      />
    </div>
  );
}
