// src/features/inventory/components/gerente/GLotesList.jsx
//
// Gestión de lotes para gerente_local.
// · Lista lotes del almacén central del restaurante (filtrados por almacenId)
// · Filtros: estado (ACTIVO/VENCIDO/AGOTADO/RETIRADO) + vencimiento próximo + búsqueda
// · Banner de alerta si hay lotes vencidos o por vencer en ≤7 días
// · Registrar lote manualmente (independiente de órdenes de compra)
// · Retirar lote con confirmación (solo ACTIVO o AGOTADO)
// · Fix del bug del admin: muestra el nombre del ingrediente, no el UUID
//
// Ruta: /gerente/lotes
// index.jsx:
//   import GLotesList from "../../features/inventory/components/gerente/GLotesList";
//   { path: "gerente/lotes", element: <RoleRoute roles={["gerente_local"]}><GLotesList /></RoleRoute> }

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Archive,
  Plus,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CalendarClock,
  FlaskConical,
  Truck,
  Warehouse,
  Trash2,
  Loader2,
  CalendarDays,
  FileText,
  Package,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_LOTES,
  GET_ALMACENES,
  GET_PROVEEDORES,
} from "../../graphql/queries";
import { REGISTRAR_LOTE } from "../../graphql/mutations";
import { gql } from "@apollo/client";
import { GET_INGREDIENTES_DISPONIBLES } from "../../../menu/components/Gerente/graphql/operations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
  Modal,
} from "../../../../shared/components/ui";
import { useAuth } from "../../../../app/auth/AuthContext";

// retirarLote no estaba en mutations.js — lo definimos aquí
const RETIRAR_LOTE = gql`
  mutation RetirarLote($id: ID!) {
    retirarLote(id: $id) {
      ok
      error
      lote {
        id
        estado
      }
    }
  }
`;

// ── Paleta ────────────────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

// ── Config de estados ─────────────────────────────────────────────────────
const ESTADO_CFG = {
  ACTIVO: { label: "Activo", variant: "green", barColor: G[300] },
  AGOTADO: { label: "Agotado", variant: "red", barColor: "#ef4444" },
  VENCIDO: { label: "Vencido", variant: "red", barColor: "#dc2626" },
  RETIRADO: { label: "Retirado", variant: "default", barColor: "#94a3b8" },
};

// ── Helpers ───────────────────────────────────────────────────────────────
const fi = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
};
const fb = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};
const icls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all shadow-sm";

function fmtDate(
  iso,
  opts = { day: "2-digit", month: "short", year: "numeric" },
) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", opts);
}

function diasLabel(dias, vencido) {
  if (vencido || dias < 0) return `Vencido hace ${Math.abs(dias ?? 0)}d`;
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  return `${dias}d para vencer`;
}

function diasVariant(dias, vencido) {
  if (vencido || dias < 0) return "red";
  if (dias <= 3) return "red";
  if (dias <= 7) return "amber";
  if (dias <= 30) return "blue";
  return "green";
}

function Field({ icon: Icon, label, required, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-dm font-semibold text-stone-500">
        {Icon && <Icon size={11} style={{ color: G[300] }} />}
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] font-dm text-stone-400 pl-1">{hint}</p>
      )}
    </div>
  );
}

// ── LoteCard ──────────────────────────────────────────────────────────────
function LoteCard({ lote, onRetirar, retirando }) {
  const cfg = ESTADO_CFG[lote.estado] ?? ESTADO_CFG.ACTIVO;
  const dv = diasVariant(lote.diasParaVencer, lote.estaVencido);
  const pct =
    lote.cantidadRecibida > 0
      ? Math.min(
          (parseFloat(lote.cantidadActual) /
            parseFloat(lote.cantidadRecibida)) *
            100,
          100,
        )
      : 0;

  const puedeRetirar = lote.estado === "ACTIVO" || lote.estado === "AGOTADO";

  // Color de la barra de progreso
  const barColor = lote.estaVencido ? "#ef4444" : pct < 25 ? "#f59e0b" : G[300];

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:-translate-y-0.5 transition-all duration-200"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {/* Barra de color por urgencia */}
      <div
        className="h-1.5"
        style={{
          background: `linear-gradient(90deg, ${cfg.barColor}, ${cfg.barColor}55)`,
        }}
      />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-playfair text-stone-900 font-semibold text-sm leading-tight truncate">
              {lote.proveedorNombre ?? "Lote"}
            </p>
            <p className="text-[10px] font-dm text-stone-400 font-mono mt-0.5">
              #{lote.numeroLote}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant={cfg.variant} size="xs">
              {cfg.label}
            </Badge>
            <Badge variant={dv} size="xs">
              <Clock size={9} />{" "}
              {diasLabel(lote.diasParaVencer, lote.estaVencido)}
            </Badge>
          </div>
        </div>

        {/* Barra de cantidad */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-dm">
            <span className="text-stone-400">Disponible</span>
            <span className="font-semibold text-stone-700">
              {parseFloat(lote.cantidadActual).toFixed(2)} /{" "}
              {parseFloat(lote.cantidadRecibida).toFixed(2)} {lote.unidadMedida}
            </span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: barColor }}
            />
          </div>
          <p className="text-[10px] font-dm text-stone-400 text-right">
            {Math.round(pct)}% restante
          </p>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="px-2.5 py-2 rounded-lg bg-stone-50 border border-stone-100">
            <p className="text-[9px] font-dm text-stone-400 uppercase tracking-wider mb-0.5">
              Recepción
            </p>
            <p className="text-[11px] font-dm text-stone-700 font-semibold">
              {fmtDate(lote.fechaRecepcion, { day: "2-digit", month: "short" })}
            </p>
          </div>
          <div
            className={`px-2.5 py-2 rounded-lg border ${
              lote.estaVencido || lote.diasParaVencer <= 3
                ? "bg-red-50 border-red-200"
                : lote.diasParaVencer <= 7
                  ? "bg-amber-50 border-amber-200"
                  : "bg-stone-50 border-stone-100"
            }`}
          >
            <p className="text-[9px] font-dm text-stone-400 uppercase tracking-wider mb-0.5">
              Vencimiento
            </p>
            <p
              className={`text-[11px] font-dm font-semibold ${
                lote.estaVencido || lote.diasParaVencer <= 3
                  ? "text-red-600"
                  : lote.diasParaVencer <= 7
                    ? "text-amber-600"
                    : "text-stone-700"
              }`}
            >
              {fmtDate(lote.fechaVencimiento, {
                day: "2-digit",
                month: "short",
                year: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Footer — proveedor + almacén + retirar */}
        <div className="pt-3 border-t border-stone-100 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-dm text-stone-400">
            <span className="flex items-center gap-1">
              <Warehouse size={9} />
              {lote.almacenNombre ?? "—"}
            </span>
            <span className="flex items-center gap-1">
              <Truck size={9} />
              {lote.proveedorNombre ?? "—"}
            </span>
          </div>
          {puedeRetirar && (
            <button
              onClick={() => onRetirar(lote)}
              disabled={retirando === lote.id}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-dm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {retirando === lote.id ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Trash2 size={10} />
              )}
              Retirar lote
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal Registrar Lote ──────────────────────────────────────────────────
function ModalRegistrarLote({ open, onClose, almacenId, restauranteId }) {
  const INIT = {
    ingredienteId: "",
    proveedorId: "",
    numeroLote: "",
    cantidadRecibida: "",
    fechaVencimiento: "",
    fechaProduccion: "",
  };
  const [form, setForm] = useState(INIT);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const { data: ingData } = useQuery(GET_INGREDIENTES_DISPONIBLES, {
    variables: { disponibles: restauranteId, activo: true },
    skip: !restauranteId,
  });
  const { data: provData } = useQuery(GET_PROVEEDORES, {
    variables: { activo: true },
  });
  const [registrar, { loading }] = useMutation(REGISTRAR_LOTE, {
    refetchQueries: ["GetLotes"],
  });

  const ingredientes = ingData?.ingredientes ?? [];
  const proveedores = provData?.proveedores ?? [];
  const ing = ingredientes.find((i) => i.id === form.ingredienteId);

  const yaVencio =
    form.fechaVencimiento && new Date(form.fechaVencimiento) < new Date();
  const canSubmit =
    form.ingredienteId &&
    form.proveedorId &&
    form.numeroLote &&
    form.fechaVencimiento &&
    parseFloat(form.cantidadRecibida) > 0 &&
    !yaVencio;

  const handleSubmit = async () => {
    try {
      const { data: res } = await registrar({
        variables: {
          ingredienteId: form.ingredienteId,
          almacenId,
          proveedorId: form.proveedorId,
          numeroLote: form.numeroLote,
          cantidadRecibida: parseFloat(form.cantidadRecibida),
          unidadMedida: ing?.unidadMedida ?? "und",
          fechaVencimiento: form.fechaVencimiento,
          fechaProduccion: form.fechaProduccion || null,
        },
      });
      if (!res?.registrarLote?.ok) throw new Error(res?.registrarLote?.error);
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "¡Lote registrado!",
        html: `<span style="font-family:'DM Sans';color:#78716c">Lote <b>${form.numeroLote}</b> agregado al inventario.</span>`,
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar lote de ingrediente"
      size="md"
    >
      <div className="space-y-4">
        <div
          className="flex items-start gap-2.5 p-3 rounded-xl border"
          style={{ background: G[50], borderColor: G[100] }}
        >
          <Archive
            size={13}
            style={{ color: G[300] }}
            className="mt-0.5 shrink-0"
          />
          <p
            className="text-xs font-dm leading-relaxed"
            style={{ color: G[500] }}
          >
            Registra un lote físico recibido. Los lotes de órdenes de compra se
            crean automáticamente al registrar la recepción.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field icon={FlaskConical} label="Ingrediente" required>
            <select
              className={icls + " appearance-none cursor-pointer"}
              onFocus={fi}
              onBlur={fb}
              value={form.ingredienteId}
              onChange={set("ingredienteId")}
            >
              <option value="">Selecciona…</option>
              {ingredientes.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre} ({i.unidadMedida})
                </option>
              ))}
            </select>
          </Field>

          <Field icon={Truck} label="Proveedor" required>
            <select
              className={icls + " appearance-none cursor-pointer"}
              onFocus={fi}
              onBlur={fb}
              value={form.proveedorId}
              onChange={set("proveedorId")}
            >
              <option value="">Selecciona…</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field icon={FileText} label="Número de lote" required>
            <input
              className={icls}
              onFocus={fi}
              onBlur={fb}
              value={form.numeroLote}
              onChange={set("numeroLote")}
              placeholder="Ej: LOT-2026-001"
            />
          </Field>
          <Field
            icon={Package}
            label={`Cantidad (${ing?.unidadMedida ?? "und"})`}
            required
          >
            <input
              type="number"
              step="0.001"
              min="0.001"
              className={icls}
              onFocus={fi}
              onBlur={fb}
              value={form.cantidadRecibida}
              onChange={set("cantidadRecibida")}
              placeholder="0.000"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field icon={CalendarDays} label="Producción">
            <input
              type="date"
              className={icls}
              onFocus={fi}
              onBlur={fb}
              value={form.fechaProduccion}
              onChange={set("fechaProduccion")}
            />
          </Field>
          <Field icon={CalendarClock} label="Vencimiento" required>
            <input
              type="date"
              className={icls}
              onFocus={fi}
              onBlur={fb}
              value={form.fechaVencimiento}
              onChange={set("fechaVencimiento")}
            />
          </Field>
        </div>

        {/* Preview de vencimiento */}
        {form.fechaVencimiento && (
          <div
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-dm ${
              yaVencio
                ? "bg-red-50 border-red-200 text-red-600"
                : "border-stone-200 text-stone-500"
            }`}
            style={
              !yaVencio
                ? { background: G[50], borderColor: G[100], color: G[300] }
                : {}
            }
          >
            <CalendarClock size={12} />
            {yaVencio
              ? "⚠ La fecha de vencimiento ya pasó — no puedes registrar un lote vencido."
              : `Vence el ${fmtDate(form.fechaVencimiento, { day: "2-digit", month: "long", year: "numeric" })}`}
          </div>
        )}

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
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Archive size={13} /> Registrar lote
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function GLotesList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [porVencer, setPorVencer] = useState("");
  const [retirando, setRetirando] = useState(null);

  // Obtener el almacén principal del restaurante
  const { data: almData } = useQuery(GET_ALMACENES, {
    variables: { restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });
  const almacen = almData?.almacenes?.[0];

  const { data, loading } = useQuery(GET_LOTES, {
    variables: {
      almacenId: almacen?.id,
      estado: filtroEstado === "all" ? undefined : filtroEstado,
      porVencer: porVencer ? parseInt(porVencer) : undefined,
    },
    skip: !almacen?.id,
    fetchPolicy: "cache-and-network",
  });

  const [retirar] = useMutation(RETIRAR_LOTE, { refetchQueries: ["GetLotes"] });

  const handleRetirar = async (lote) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      icon: "warning",
      title: "¿Retirar este lote?",
      html: `<span style="font-family:'DM Sans';color:#78716c">
        Lote <b>${lote.numeroLote}</b> de <b>${lote.almacenNombre ?? ""}</b> será marcado como retirado.
        Esta acción no se puede deshacer.
      </span>`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: "Sí, retirar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    setRetirando(lote.id);
    try {
      const { data: res } = await retirar({ variables: { id: lote.id } });
      if (!res?.retirarLote?.ok) throw new Error(res?.retirarLote?.error);
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Lote retirado",
        timer: 1400,
        timerProgressBar: true,
        confirmButtonColor: G[900],
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
      setRetirando(null);
    }
  };

  const lotes = data?.lotes ?? [];
  const activos = lotes.filter((l) => l.estado === "ACTIVO").length;
  const vencidos = lotes.filter(
    (l) => l.estaVencido || l.estado === "VENCIDO",
  ).length;
  const pv7 = lotes.filter(
    (l) => !l.estaVencido && l.diasParaVencer <= 7,
  ).length;
  const agotados = lotes.filter((l) => l.estado === "AGOTADO").length;

  const filtered = lotes.filter((l) => {
    const q = search.toLowerCase();
    return (
      (l.numeroLote ?? "").toLowerCase().includes(q) ||
      (l.proveedorNombre ?? "").toLowerCase().includes(q) ||
      (l.almacenNombre ?? "").toLowerCase().includes(q)
    );
  });

  const tabs = [
    { v: "all", l: "Todos", n: lotes.length },
    { v: "ACTIVO", l: "Activos", n: activos },
    { v: "VENCIDO", l: "Vencidos", n: vencidos },
    { v: "AGOTADO", l: "Agotados", n: agotados },
  ];

  return (
    <div className="space-y-6">
      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <PageHeader
        eyebrow="Inventario"
        title="Lotes"
        description="Los lotes se generan automáticamente al registrar la recepción de una orden de compra."
        action={
          <div className="flex items-center gap-2">
            {/* KPIs */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-dm">
              <span
                className="flex items-center gap-1"
                style={{ color: G[300] }}
              >
                <CheckCircle2 size={11} />
                <b>{activos}</b> activos
              </span>
              {pv7 > 0 && (
                <span className="flex items-center gap-1 text-amber-500">
                  <AlertTriangle size={11} />
                  <b>{pv7}</b> por vencer
                </span>
              )}
              {vencidos > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle size={11} />
                  <b>{vencidos}</b> vencidos
                </span>
              )}
            </div>
            {/* Lotes se crean automáticamente al recibir una orden de compra */}
          </div>
        }
      />

      {/* Banner de alerta crítica */}
      {!loading && (vencidos > 0 || pv7 > 0) && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
            vencidos > 0
              ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <AlertTriangle
            size={15}
            className={vencidos > 0 ? "text-red-500" : "text-amber-500"}
          />
          <p
            className={`text-sm font-dm ${vencidos > 0 ? "text-red-700" : "text-amber-700"}`}
          >
            {vencidos > 0
              ? `⚠ ${vencidos} lote${vencidos !== 1 ? "s" : ""} vencido${vencidos !== 1 ? "s" : ""}. Retíralos del inventario para mantener la trazabilidad.`
              : `${pv7} lote${pv7 !== 1 ? "s" : ""} vencen en menos de 7 días. Revisa el inventario.`}
          </p>
        </div>
      )}

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Búsqueda */}
        <div
          className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 transition-all"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          onFocusCapture={(e) =>
            (e.currentTarget.style.boxShadow = `0 0 0 2px ${G[300]}`)
          }
          onBlurCapture={(e) =>
            (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)")
          }
        >
          <Search size={14} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por lote, ingrediente o proveedor…"
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-stone-300 hover:text-stone-500 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tabs de estado */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
          {tabs.map(({ v, l, n }) => (
            <button
              key={v}
              onClick={() => setFiltroEstado(v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all whitespace-nowrap"
              style={
                filtroEstado === v
                  ? { background: G[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              {l}
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={
                  filtroEstado === v
                    ? { background: "rgba(255,255,255,0.18)", color: "#fff" }
                    : { background: "#f5f5f4", color: "#a8a29e" }
                }
              >
                {n}
              </span>
            </button>
          ))}
        </div>

        {/* Por vencer */}
        <select
          value={porVencer}
          onChange={(e) => setPorVencer(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none shadow-sm"
          onFocus={fi}
          onBlur={fb}
        >
          <option value="">Todos los vencimientos</option>
          <option value="7">Vencen en ≤7 días</option>
          <option value="15">Vencen en ≤15 días</option>
          <option value="30">Vencen en ≤30 días</option>
        </select>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Archive}
          title={search ? "Sin resultados" : "Sin lotes registrados"}
          description={
            search
              ? `No hay lotes que coincidan con "${search}".`
              : filtroEstado !== "all"
                ? `No hay lotes con estado ${filtroEstado.toLowerCase()}.`
                : "Los lotes se crean automáticamente al recibir una orden de compra en Inventario → Órdenes."
          }
          action={
            !search && (
              <Button onClick={() => setModalRegistrar(true)}>
                <Plus size={14} /> Registrar lote
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="text-xs font-dm text-stone-400 -mt-2">
            {filtered.length} lote{filtered.length !== 1 ? "s" : ""}
            {search && ` — "${search}"`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((l) => (
              <LoteCard
                key={l.id}
                lote={l}
                onRetirar={handleRetirar}
                retirando={retirando}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Modal ────────────────────────────────────────────────────────── */}
    </div>
  );
}
