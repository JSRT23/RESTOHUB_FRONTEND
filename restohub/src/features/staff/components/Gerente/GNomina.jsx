// src/features/staff/components/Gerente/GNomina.jsx
//
// Gestión de nómina para el gerente local.
// Permite: generar nómina por período, ver resúmenes y cerrar nóminas.
//
// Ruta: /gerente/staff/nomina

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  DollarSign,
  Plus,
  Clock,
  Calendar,
  UserCircle,
  ChevronDown,
  CheckCircle2,
  Lock,
  Loader2,
  BarChart3,
  FileText,
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
import { GET_NOMINA, GET_EMPLEADOS } from "../../graphql/queries";
import { GENERAR_NOMINA, CERRAR_NOMINA } from "../../graphql/mutations";

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
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtNum(n) {
  if (n == null) return "0";
  return Number(n).toFixed(1);
}

function getPrimerYUltimoDiaMes() {
  const hoy = new Date();
  const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const ultimo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { primero: fmt(primero), ultimo: fmt(ultimo) };
}

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

// ── Modal: Generar nómina ──────────────────────────────────────────────────
function ModalGenerar({ open, onClose, restauranteId, empleados, onSuccess }) {
  const { primero, ultimo } = getPrimerYUltimoDiaMes();
  const [form, setForm] = useState({
    periodoInicio: primero,
    periodoFin: ultimo,
    empleadoId: "", // vacío = todo el restaurante
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [generar, { loading }] = useMutation(GENERAR_NOMINA, {
    refetchQueries: ["GetNomina"],
  });

  const handleGenerar = async () => {
    if (!form.periodoInicio || !form.periodoFin) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Define el período",
        confirmButtonColor: G[900],
      });
      return;
    }
    if (new Date(form.periodoFin) < new Date(form.periodoInicio)) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Período inválido",
        text: "La fecha de fin debe ser posterior al inicio.",
        confirmButtonColor: G[900],
      });
      return;
    }
    try {
      const { data } = await generar({
        variables: {
          periodoInicio: form.periodoInicio,
          periodoFin: form.periodoFin,
          restauranteId,
          empleadoId: form.empleadoId || null,
        },
      });
      const res = data?.generarNomina;
      if (!res?.ok) throw new Error(res?.errores?.[0] || "Error al generar");
      const cant = res.resumenes?.length ?? 0;
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "¡Nómina generada!",
        html: `<span style="font-family:'DM Sans';color:#78716c">Se generaron <b>${cant}</b> resumen${cant !== 1 ? "es" : ""} de nómina.</span>`,
        confirmButtonColor: G[900],
        timer: 2000,
        timerProgressBar: true,
      });
      onSuccess?.();
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
    <Modal open={open} onClose={onClose} title="Generar nómina" size="sm">
      <div className="space-y-4">
        {/* Período */}
        <div className="grid grid-cols-2 gap-3">
          <Field icon={Calendar} label="Inicio período" required>
            <input
              type="date"
              className={cls}
              onFocus={fi}
              onBlur={fb}
              value={form.periodoInicio}
              onChange={set("periodoInicio")}
            />
          </Field>
          <Field icon={Calendar} label="Fin período" required>
            <input
              type="date"
              className={cls}
              onFocus={fi}
              onBlur={fb}
              value={form.periodoFin}
              onChange={set("periodoFin")}
            />
          </Field>
        </div>

        {/* Empleado (opcional) */}
        <Field icon={UserCircle} label="Empleado (opcional)">
          <div className="relative">
            <select
              className={cls + " appearance-none cursor-pointer pr-8"}
              onFocus={fi}
              onBlur={fb}
              value={form.empleadoId}
              onChange={set("empleadoId")}
            >
              <option value="">Todo el equipo</option>
              {empleados.map((e) => (
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
          <p className="text-[11px] font-dm text-stone-400 pl-1">
            Vacío = genera para todos los empleados del restaurante.
          </p>
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
          <Button size="sm" loading={loading} onClick={handleGenerar}>
            Generar nómina
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Card de resumen de nómina ──────────────────────────────────────────────
function NominaCard({ resumen, onCerrar, closing }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-stone-200 p-5 space-y-4 hover:shadow-sm transition-all ${
        resumen.cerrado ? "opacity-70" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-dm font-semibold text-stone-800">
            {resumen.empleadoNombre}
          </p>
          <p className="text-xs font-dm text-stone-400 mt-0.5">
            {fmtFecha(resumen.periodoInicio)} — {fmtFecha(resumen.periodoFin)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={resumen.moneda === "COP" ? "default" : "blue"}>
            {resumen.monedaDisplay || resumen.moneda}
          </Badge>
          {resumen.cerrado ? (
            <Badge variant="muted">
              <Lock size={9} className="mr-0.5" /> Cerrado
            </Badge>
          ) : (
            <Badge variant="amber">Abierto</Badge>
          )}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Días trab.",
            value: resumen.diasTrabajados ?? 0,
            icon: Calendar,
          },
          {
            label: "H. normales",
            value: fmtNum(resumen.totalHorasNormales),
            icon: Clock,
          },
          {
            label: "H. extra",
            value: fmtNum(resumen.totalHorasExtra),
            icon: BarChart3,
            color: resumen.totalHorasExtra > 0 ? "#d97706" : undefined,
          },
          {
            label: "H. totales",
            value: fmtNum(resumen.totalHoras),
            icon: Clock,
            color: G[300],
          },
        ].map((m) => {
          const MIcon = m.icon;
          return (
            <div
              key={m.label}
              className="bg-stone-50 rounded-xl px-3 py-2.5 text-center"
            >
              <p
                className="text-lg font-dm font-bold"
                style={{ color: m.color ?? "#292524" }}
              >
                {m.value}
              </p>
              <p className="text-[10px] font-dm text-stone-400 mt-0.5">
                {m.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Acción cerrar */}
      {!resumen.cerrado && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            loading={closing === resumen.id}
            onClick={() => onCerrar(resumen)}
          >
            <Lock size={12} /> Cerrar nómina
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function GNomina() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [filtroCerrado, setFiltroCerrado] = useState("todos");
  const [showGenerar, setShowGenerar] = useState(false);
  const [closing, setClosing] = useState(null);

  const cerradoBool =
    filtroCerrado === "cerrados"
      ? true
      : filtroCerrado === "abiertos"
        ? false
        : undefined;

  const { data, loading, error, refetch } = useQuery(GET_NOMINA, {
    variables: {
      restauranteId,
      cerrado: cerradoBool,
    },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  const { data: empData } = useQuery(GET_EMPLEADOS, {
    variables: { restauranteId },
    skip: !restauranteId,
  });

  const [cerrar] = useMutation(CERRAR_NOMINA, {
    refetchQueries: ["GetNomina"],
  });

  const nominas = data?.nomina ?? [];
  const empleados = empData?.empleados ?? [];

  // KPIs
  const abiertas = nominas.filter((n) => !n.cerrado).length;
  const cerradas = nominas.filter((n) => n.cerrado).length;
  const totalHoras = nominas
    .reduce((acc, n) => acc + Number(n.totalHoras ?? 0), 0)
    .toFixed(1);

  const handleCerrar = async (resumen) => {
    const confirm = await Swal.fire({
      background: "#fff",
      icon: "warning",
      title: "¿Cerrar esta nómina?",
      html: `<span style="font-family:'DM Sans';color:#78716c">Nómina de <b>${resumen.empleadoNombre}</b>. Esta acción no se puede revertir.</span>`,
      showCancelButton: true,
      confirmButtonColor: G[900],
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Sí, cerrar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    setClosing(resumen.id);
    try {
      const { data } = await cerrar({ variables: { resumenId: resumen.id } });
      const res = data?.cerrarNomina;
      if (!res?.ok) throw new Error(res?.errores?.[0] || "Error");
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Nómina cerrada",
        timer: 1500,
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
      setClosing(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nómina"
        subtitle="Resúmenes de horas y períodos del equipo"
        icon={DollarSign}
        action={
          <Button size="sm" onClick={() => setShowGenerar(true)}>
            <Plus size={14} /> Generar nómina
          </Button>
        }
      />

      {/* KPIs */}
      {!loading && nominas.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Abiertas", value: abiertas, color: "#d97706" },
            { label: "Cerradas", value: cerradas, color: G[300] },
            { label: "Horas totales", value: totalHoras + "h", color: G[500] },
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

      {/* Filtro */}
      <div className="flex gap-3">
        {[
          { value: "todos", label: "Todas" },
          { value: "abiertos", label: "Abiertas" },
          { value: "cerrados", label: "Cerradas" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFiltroCerrado(opt.value)}
            className="px-4 py-2 rounded-xl text-sm font-dm font-semibold transition-all"
            style={
              filtroCerrado === opt.value
                ? { background: G[900], color: "#fff" }
                : {
                    background: "#fff",
                    color: "#78716c",
                    border: "1px solid #e2e8f0",
                  }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <p className="text-sm font-dm text-red-600">
            Error al cargar nómina: {error.message}
          </p>
        </div>
      )}

      {!loading && !error && nominas.length === 0 && (
        <EmptyState
          icon={FileText}
          title="Sin resúmenes de nómina"
          description="Genera la nómina del período actual para tu equipo."
          action={
            <Button size="sm" onClick={() => setShowGenerar(true)}>
              <Plus size={14} /> Generar nómina
            </Button>
          }
        />
      )}

      {!loading && nominas.length > 0 && (
        <div className="space-y-4">
          {nominas.map((n) => (
            <NominaCard
              key={n.id}
              resumen={n}
              onCerrar={handleCerrar}
              closing={closing}
            />
          ))}
        </div>
      )}

      <ModalGenerar
        open={showGenerar}
        onClose={() => setShowGenerar(false)}
        restauranteId={restauranteId}
        empleados={empleados}
        onSuccess={refetch}
      />
    </div>
  );
}
