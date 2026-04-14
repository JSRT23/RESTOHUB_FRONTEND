// src/features/inventory/components/gerente/GStockList.jsx
//
// Gestión de stock para gerente_local.
// · Lista todos los ingredientes en stock del almacén central del restaurante
// · Ajuste manual con justificación (mínimo 10 caracteres — auditoría)
// · Filtros: estado (todos/agotado/bajo/normal) + búsqueda
// · Modal de movimientos al hacer clic en una card
// · Registrar stock de un ingrediente nuevo directamente desde aquí
//
// Ruta: /gerente/stock
// index.jsx:
//   import GStockList from "../../features/inventory/components/gerente/GStockList";
//   { path: "gerente/stock", element: <RoleRoute roles={["gerente_local"]}><GStockList /></RoleRoute> }

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Package,
  Search,
  TrendingDown,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Plus,
  ArrowUp,
  ArrowDown,
  History,
  Warehouse,
  FlaskConical,
  SlidersHorizontal,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_STOCK,
  GET_ALMACENES,
  GET_STOCK_ITEM,
} from "../../graphql/queries";
import { AJUSTAR_STOCK, REGISTRAR_STOCK } from "../../graphql/mutations";
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

// ── Paleta ────────────────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
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

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

// ── Barra de salud del stock ──────────────────────────────────────────────
function StockBar({ pct, agotado, bajo }) {
  const p = Math.min(Math.max(pct ?? 0, 0), 100);
  const color = agotado ? "#ef4444" : bajo ? "#f59e0b" : G[300];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${p}%`, background: color }}
        />
      </div>
      <span
        className="text-[10px] font-dm font-semibold w-8 text-right"
        style={{ color }}
      >
        {Math.round(p)}%
      </span>
    </div>
  );
}

// ── Modal Ajuste manual ───────────────────────────────────────────────────
function ModalAjuste({ open, onClose, item }) {
  const [cantidad, setCantidad] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ajustar, { loading }] = useMutation(AJUSTAR_STOCK, {
    refetchQueries: ["GetStock"],
  });

  if (!item) return null;

  const val = parseFloat(cantidad) || 0;
  const nueva = parseFloat(item.cantidadActual) + val;
  const negativa = nueva < 0;

  const handleSubmit = async () => {
    if (val === 0) return;
    if (negativa) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Stock insuficiente",
        text: `El stock resultante sería ${nueva.toFixed(2)} ${item.unidadMedida}, que es negativo.`,
        confirmButtonColor: G[900],
      });
      return;
    }
    const { data: res } = await ajustar({
      variables: { id: item.id, cantidad: val, descripcion },
    });
    if (res?.ajustarStock?.ok) {
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Ajuste aplicado",
        html: `<span style="font-family:'DM Sans';color:#78716c">Nuevo stock: <b>${nueva.toFixed(2)} ${item.unidadMedida}</b></span>`,
        confirmButtonColor: G[900],
        timer: 1600,
        timerProgressBar: true,
      });
      setCantidad("");
      setDescripcion("");
      onClose();
    } else {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: res?.ajustarStock?.error,
        confirmButtonColor: G[900],
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajuste manual de stock"
      size="sm"
    >
      <div className="space-y-4">
        {/* Info del item */}
        <div className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
          <div className="flex items-center gap-2">
            <FlaskConical size={13} style={{ color: G[300] }} />
            <p className="font-playfair text-stone-900 font-semibold text-sm">
              {item.nombreIngrediente}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-dm">
            <span className="text-stone-400">Stock actual</span>
            <span className="font-semibold text-stone-700">
              {parseFloat(item.cantidadActual).toFixed(2)} {item.unidadMedida}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-dm">
            <span className="text-stone-400">Nivel mínimo</span>
            <span className="text-stone-500">
              {parseFloat(item.nivelMinimo).toFixed(2)} {item.unidadMedida}
            </span>
          </div>
        </div>

        {/* Cantidad */}
        <Field
          label="Cantidad de ajuste"
          required
          hint="Positivo (+) = entrada de mercancía · Negativo (−) = salida o merma"
        >
          <input
            type="number"
            step="0.001"
            className={icls}
            onFocus={fi}
            onBlur={fb}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="Ej: 5.000 o -2.500"
          />
        </Field>

        {/* Preview resultado */}
        {cantidad && (
          <div
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-dm ${
              negativa
                ? "bg-red-50 border-red-200"
                : "bg-stone-50 border-stone-200"
            }`}
          >
            <span className="text-stone-500">Stock resultante</span>
            <span
              className={`font-bold ${negativa ? "text-red-600" : "text-stone-900"}`}
            >
              {negativa ? "⚠ " : ""}
              {nueva.toFixed(2)} {item.unidadMedida}
            </span>
          </div>
        )}

        {/* Justificación */}
        <Field
          label="Justificación"
          required
          hint="Mínimo 10 caracteres — requerido para auditoría."
        >
          <textarea
            className={icls + " resize-none"}
            rows={3}
            onFocus={fi}
            onBlur={fb}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Merma detectada en revisión de almacén, producto dañado por humedad…"
          />
          <p
            className={`text-[11px] font-dm text-right mt-0.5 ${descripcion.length >= 10 ? "text-stone-400" : "text-red-400"}`}
          >
            {descripcion.length}/10 mín.
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
          <Button
            size="sm"
            loading={loading}
            disabled={
              !cantidad || val === 0 || negativa || descripcion.length < 10
            }
            onClick={handleSubmit}
          >
            Aplicar ajuste
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal Registrar nuevo stock ───────────────────────────────────────────
function ModalRegistrarStock({ open, onClose, almacenId, restauranteId }) {
  const INIT = {
    ingredienteId: "",
    cantidadActual: "",
    nivelMinimo: "",
    nivelMaximo: "",
  };
  const [form, setForm] = useState(INIT);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const { data: ingData } = useQuery(GET_INGREDIENTES_DISPONIBLES, {
    variables: { disponibles: restauranteId, activo: true },
    skip: !restauranteId,
  });
  const [registrar, { loading }] = useMutation(REGISTRAR_STOCK, {
    refetchQueries: ["GetStock"],
  });

  const ingredientes = ingData?.ingredientes ?? [];
  const ing = ingredientes.find((i) => i.id === form.ingredienteId);

  const canSubmit =
    form.ingredienteId &&
    form.cantidadActual &&
    form.nivelMinimo &&
    form.nivelMaximo &&
    parseFloat(form.nivelMaximo) > parseFloat(form.nivelMinimo);

  const handleSubmit = async () => {
    try {
      const { data: res } = await registrar({
        variables: {
          ingredienteId: form.ingredienteId,
          nombreIngrediente: ing?.nombre ?? "",
          almacenId,
          unidadMedida: ing?.unidadMedida ?? "und",
          cantidadActual: parseFloat(form.cantidadActual),
          nivelMinimo: parseFloat(form.nivelMinimo),
          nivelMaximo: parseFloat(form.nivelMaximo),
        },
      });
      if (!res?.registrarStock?.ok) throw new Error(res?.registrarStock?.error);
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Stock registrado",
        html: `<span style="font-family:'DM Sans';color:#78716c"><b>${ing?.nombre}</b> fue agregado al inventario.</span>`,
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
      title="Registrar ingrediente en stock"
      size="md"
    >
      <div className="space-y-4">
        <div
          className="flex items-start gap-2.5 p-3 rounded-xl border"
          style={{ background: G[50], borderColor: G[100] }}
        >
          <Package
            size={13}
            style={{ color: G[300] }}
            className="mt-0.5 shrink-0"
          />
          <p
            className="text-xs font-dm leading-relaxed"
            style={{ color: G[500] }}
          >
            Registra un ingrediente en el inventario de tu almacén central. Los
            lotes de mercancía se crean automáticamente al recibir órdenes de
            compra.
          </p>
        </div>

        <Field icon={FlaskConical} label="Ingrediente" required>
          <select
            className={icls + " appearance-none cursor-pointer"}
            onFocus={fi}
            onBlur={fb}
            value={form.ingredienteId}
            onChange={set("ingredienteId")}
          >
            <option value="">Selecciona un ingrediente…</option>
            {ingredientes.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre} ({i.unidadMedida})
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field
            icon={Package}
            label={`Cantidad actual (${ing?.unidadMedida ?? "und"})`}
            required
          >
            <input
              type="number"
              step="0.01"
              min="0"
              className={icls}
              onFocus={fi}
              onBlur={fb}
              value={form.cantidadActual}
              onChange={set("cantidadActual")}
              placeholder="0.00"
            />
          </Field>
          <Field label="Nivel mínimo" required>
            <input
              type="number"
              step="0.01"
              min="0"
              className={icls}
              onFocus={fi}
              onBlur={fb}
              value={form.nivelMinimo}
              onChange={set("nivelMinimo")}
              placeholder="0.00"
            />
          </Field>
          <Field label="Nivel máximo" required>
            <input
              type="number"
              step="0.01"
              min="0"
              className={icls}
              onFocus={fi}
              onBlur={fb}
              value={form.nivelMaximo}
              onChange={set("nivelMaximo")}
              placeholder="0.00"
            />
          </Field>
        </div>

        {form.nivelMaximo &&
          form.nivelMinimo &&
          parseFloat(form.nivelMaximo) <= parseFloat(form.nivelMinimo) && (
            <p className="text-xs font-dm text-red-500">
              El nivel máximo debe ser mayor al mínimo.
            </p>
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
            <Plus size={13} /> Registrar stock
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal Movimientos ─────────────────────────────────────────────────────
function ModalMovimientos({ open, onClose, item }) {
  const { data, loading } = useQuery(GET_STOCK_ITEM, {
    variables: { id: item?.id },
    skip: !item?.id || !open,
  });
  const detalle = data?.stockItem;

  const TIPO_CFG = {
    entrada: { icon: ArrowUp, color: "#16a34a", label: "Entrada" },
    salida: { icon: ArrowDown, color: "#dc2626", label: "Salida" },
    ajuste: { icon: SlidersHorizontal, color: "#d97706", label: "Ajuste" },
    recepcion: { icon: Package, color: "#3b82f6", label: "Recepción" },
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? `Movimientos — ${item.nombreIngrediente}` : "Movimientos"}
      size="lg"
    >
      {loading || !detalle ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Resumen rápido */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Stock actual",
                value: `${parseFloat(detalle.cantidadActual).toFixed(2)} ${detalle.unidadMedida}`,
              },
              {
                label: "Nivel mínimo",
                value: `${parseFloat(detalle.nivelMinimo).toFixed(2)} ${detalle.unidadMedida}`,
              },
              {
                label: "Nivel máximo",
                value: `${parseFloat(detalle.nivelMaximo).toFixed(2)} ${detalle.unidadMedida}`,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200"
              >
                <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-sm font-dm font-semibold text-stone-800 mt-0.5">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Lista de movimientos */}
          {!detalle.movimientos || detalle.movimientos.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <History size={24} className="text-stone-200" />
              <p className="text-sm font-dm text-stone-400">
                Sin movimientos registrados
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {detalle.movimientos.map((m) => {
                const cfg = TIPO_CFG[m.tipoMovimiento] ?? {
                  icon: History,
                  color: "#94a3b8",
                  label: m.tipoMovimiento,
                };
                const Icon = cfg.icon;
                const delta = parseFloat(m.cantidad);
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-stone-100"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${cfg.color}15` }}
                    >
                      <Icon size={13} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-dm font-semibold text-stone-800">
                        {cfg.label}
                      </p>
                      {m.descripcion && (
                        <p className="text-[10px] font-dm text-stone-400 truncate">
                          {m.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="text-sm font-dm font-bold"
                        style={{ color: delta >= 0 ? G[300] : "#dc2626" }}
                      >
                        {delta >= 0 ? "+" : ""}
                        {delta.toFixed(2)}
                      </p>
                      <p className="text-[10px] font-dm text-stone-400">
                        {parseFloat(m.cantidadDespues).toFixed(2)} total
                      </p>
                    </div>
                    <div className="text-right shrink-0 min-w-[60px]">
                      <p className="text-[10px] font-dm text-stone-400">
                        {fmtDate(m.fecha)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── StockCard ─────────────────────────────────────────────────────────────
function StockCard({ item, onAjustar, onVerMovimientos }) {
  const pct = item.porcentajeStock ?? 0;
  const estado = item.estaAgotado
    ? "agotado"
    : item.necesitaReposicion
      ? "bajo"
      : "ok";
  const ESTADO = {
    agotado: { label: "Agotado", variant: "red", barColor: "#ef4444" },
    bajo: { label: "Stock bajo", variant: "amber", barColor: "#f59e0b" },
    ok: { label: "OK", variant: "green", barColor: G[300] },
  };
  const cfg = ESTADO[estado];

  return (
    <div
      className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:-translate-y-0.5 transition-all duration-200"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {/* Barra de estado */}
      <div
        className="h-1.5"
        style={{
          background: `linear-gradient(90deg, ${cfg.barColor}, ${cfg.barColor}66)`,
        }}
      />
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-playfair text-stone-900 font-semibold text-sm leading-tight truncate">
              {item.nombreIngrediente}
            </p>
            <p className="text-[10px] font-dm text-stone-400 mt-0.5 flex items-center gap-1 truncate">
              <Warehouse size={9} /> {item.almacenNombre}
            </p>
          </div>
          <Badge variant={cfg.variant} size="xs">
            {cfg.label}
          </Badge>
        </div>

        {/* Cantidad */}
        <div className="flex items-end justify-between">
          <div>
            <p className="font-playfair text-2xl font-bold text-stone-900">
              {parseFloat(item.cantidadActual).toFixed(2)}
            </p>
            <p className="text-[10px] font-dm text-stone-400">
              {item.unidadMedida} · mín{" "}
              {parseFloat(item.nivelMinimo).toFixed(2)}
            </p>
          </div>
          <p className="text-[10px] font-dm text-stone-400 text-right">
            {fmtDate(item.fechaActualizacion)}
          </p>
        </div>

        {/* Barra */}
        <StockBar
          pct={pct}
          agotado={item.estaAgotado}
          bajo={item.necesitaReposicion}
        />

        {/* Acciones (visibles en hover) */}
        <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
          <button
            onClick={() => onVerMovimientos(item)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-dm font-semibold text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-all"
          >
            <History size={10} /> Movimientos
          </button>
          <button
            onClick={() => onAjustar(item)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-dm font-semibold transition-all"
            style={{ color: G[300] }}
          >
            <SlidersHorizontal size={10} /> Ajustar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function GStockList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("all");
  const [itemAjuste, setItemAjuste] = useState(null);
  const [itemMovimientos, setItemMovimientos] = useState(null);
  const [modalRegistrar, setModalRegistrar] = useState(false);

  const { data: almData } = useQuery(GET_ALMACENES, {
    variables: { restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });
  const almacen = almData?.almacenes?.[0];

  const { data, loading, refetch } = useQuery(GET_STOCK, {
    variables: { almacenId: almacen?.id },
    skip: !almacen?.id,
    fetchPolicy: "cache-and-network",
  });

  const stock = data?.stock ?? [];
  const agotados = stock.filter((s) => s.estaAgotado).length;
  const bajoMin = stock.filter(
    (s) => !s.estaAgotado && s.necesitaReposicion,
  ).length;
  const normales = stock.filter(
    (s) => !s.estaAgotado && !s.necesitaReposicion,
  ).length;

  const filtered = stock.filter((s) => {
    const q = search.toLowerCase();
    const matchQ =
      s.nombreIngrediente.toLowerCase().includes(q) ||
      (s.almacenNombre ?? "").toLowerCase().includes(q);
    const matchF =
      filtro === "all"
        ? true
        : filtro === "agotado"
          ? s.estaAgotado
          : filtro === "bajo"
            ? !s.estaAgotado && s.necesitaReposicion
            : !s.estaAgotado && !s.necesitaReposicion;
    return matchQ && matchF;
  });

  const tabs = [
    { v: "all", l: "Todos", n: stock.length },
    { v: "agotado", l: "Agotados", n: agotados },
    { v: "bajo", l: "Bajo mínimo", n: bajoMin },
    { v: "normal", l: "Normales", n: normales },
  ];

  return (
    <div className="space-y-6">
      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <PageHeader
        eyebrow="Inventario"
        title="Stock"
        description="Niveles actuales de ingredientes en tu almacén central."
        action={
          <div className="flex items-center gap-2">
            {/* KPIs */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-dm">
              {agotados > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle size={11} />
                  <b>{agotados}</b> agotados
                </span>
              )}
              {bajoMin > 0 && (
                <span className="flex items-center gap-1 text-amber-500">
                  <TrendingDown size={11} />
                  <b>{bajoMin}</b> bajo mínimo
                </span>
              )}
              <span className="flex items-center gap-1 text-stone-400">
                <CheckCircle2 size={11} style={{ color: G[300] }} />
                <b style={{ color: G[300] }}>{normales}</b> normales
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw size={12} /> Actualizar
            </Button>
            <Button onClick={() => setModalRegistrar(true)}>
              <Plus size={14} /> Nuevo ítem
            </Button>
          </div>
        }
      />

      {/* Almacén activo */}
      {almacen && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={{ background: `${G[50]}80`, borderColor: G[100] }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: G[50] }}
          >
            <Warehouse size={14} style={{ color: G[300] }} />
          </div>
          <div>
            <p
              className="text-xs font-dm font-semibold"
              style={{ color: G[300] }}
            >
              Almacén Central
            </p>
            <p className="text-sm font-playfair font-semibold text-stone-800">
              {almacen.nombre}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs font-dm text-stone-500">
            <span>
              <b className="text-stone-700">{almacen.totalIngredientes ?? 0}</b>{" "}
              ingredientes
            </span>
            {(almacen.ingredientesBajoMinimo ?? 0) > 0 && (
              <span className="text-red-500">
                <b>{almacen.ingredientesBajoMinimo}</b> bajo mínimo
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
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
            placeholder="Buscar ingrediente…"
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

        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
          {tabs.map(({ v, l, n }) => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all whitespace-nowrap"
              style={
                filtro === v
                  ? { background: G[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              {l}
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={
                  filtro === v
                    ? { background: "rgba(255,255,255,0.18)", color: "#fff" }
                    : { background: "#f5f5f4", color: "#a8a29e" }
                }
              >
                {n}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? "Sin resultados" : "Sin stock registrado"}
          description={
            search
              ? `No hay ingredientes que coincidan con "${search}".`
              : "Registra los ingredientes de tu almacén para empezar a controlar el inventario."
          }
          action={
            !search && (
              <Button onClick={() => setModalRegistrar(true)}>
                <Plus size={14} /> Nuevo ítem
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="text-xs font-dm text-stone-400 -mt-2">
            {filtered.length} ingrediente{filtered.length !== 1 ? "s" : ""}
            {search && ` — "${search}"`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <StockCard
                key={item.id}
                item={item}
                onAjustar={setItemAjuste}
                onVerMovimientos={setItemMovimientos}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Modales ──────────────────────────────────────────────────────── */}
      <ModalAjuste
        open={!!itemAjuste}
        onClose={() => setItemAjuste(null)}
        item={itemAjuste}
      />
      <ModalMovimientos
        open={!!itemMovimientos}
        onClose={() => setItemMovimientos(null)}
        item={itemMovimientos}
      />
      <ModalRegistrarStock
        open={modalRegistrar}
        onClose={() => setModalRegistrar(false)}
        almacenId={almacen?.id}
        restauranteId={restauranteId}
      />
    </div>
  );
}
