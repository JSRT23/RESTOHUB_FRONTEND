// src/features/inventory/components/Gerente/GOrdenesCompra.jsx
//
// FLUJO COMPLETO:
// 1. CREAR ORDEN  → elige proveedor + ingredientes + cantidades + precios → BORRADOR
// 2. ENVIAR       → BORRADOR → ENVIADA (se notifica al proveedor)
// 3. RECIBIR      → ENVIADA → llena nº lote + fecha vencimiento + cantidad real → RECIBIDA
//                  → backend crea lotes, actualiza stock y actualiza costo_unitario en RecetaPlato
//                  → ahora el cálculo de precio por margen usa costos reales
//
// FIX CRÍTICO: useState lazy init no capturaba orden (llegaba undefined en primer render)
//              → reemplazado por useEffect que re-inicializa cuando orden.detalles llega

import { useState, useEffect, useMemo } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  ShoppingCart,
  Plus,
  Search,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Package,
  ArrowRight,
  ArrowLeft,
  Coins,
  FlaskConical,
  CalendarDays,
  FileText,
  ReceiptText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_ORDENES_COMPRA,
  GET_ORDEN_COMPRA,
  GET_PROVEEDORES,
} from "../../graphql/queries";
import {
  ENVIAR_ORDEN_COMPRA,
  RECIBIR_ORDEN_COMPRA,
  CANCELAR_ORDEN_COMPRA,
} from "../../graphql/mutations";
import {
  GET_INGREDIENTES_DISPONIBLES,
  GET_MI_RESTAURANTE,
} from "../../../menu/components/Gerente/graphql/operations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
  Modal,
  StepIndicator,
  Divider,
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

const ESTADOS = {
  BORRADOR: {
    label: "Borrador",
    variant: "default",
    icon: Clock,
    color: "#64748b",
    tip: "Aún no enviada al proveedor. Puedes editarla.",
  },
  PENDIENTE: {
    label: "Pendiente",
    variant: "amber",
    icon: Clock,
    color: "#d97706",
    tip: "En espera.",
  },
  ENVIADA: {
    label: "Enviada",
    variant: "blue",
    icon: Truck,
    color: "#3b82f6",
    tip: "Enviada al proveedor. Cuando llegue, registra la recepción.",
  },
  RECIBIDA: {
    label: "Recibida",
    variant: "green",
    icon: CheckCircle2,
    color: "#16a34a",
    tip: "Mercancía recibida. Stock y costos actualizados.",
  },
  CANCELADA: {
    label: "Cancelada",
    variant: "red",
    icon: XCircle,
    color: "#dc2626",
    tip: "Cancelada.",
  },
};

const MONEDAS = ["COP", "USD", "EUR", "MXN", "ARS", "BRL", "CLP", "PEN"];
const STEPS = ["Proveedor", "Ítems", "Confirmar"];

// ── Helpers ───────────────────────────────────────────────────────────────
const fmt = (v, moneda = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(v ?? 0);

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

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

// ── Mutation para gerente (sin $restauranteId — lo inyecta el gateway del JWT) ─
const CREAR_ORDEN_GERENTE = gql`
  mutation CrearOrdenCompraGerente(
    $proveedorId: ID!
    $moneda: String!
    $detalles: [DetalleOrdenInput!]!
    $fechaEntregaEstimada: String
    $notas: String
  ) {
    crearOrdenCompra(
      proveedorId: $proveedorId
      moneda: $moneda
      detalles: $detalles
      fechaEntregaEstimada: $fechaEntregaEstimada
      notas: $notas
    ) {
      ok
      error
      orden {
        id
        estado
        totalEstimado
        moneda
        proveedorNombre
        fechaCreacion
      }
    }
  }
`;

// ── OrdenCard ─────────────────────────────────────────────────────────────
function OrdenCard({ orden, onClick }) {
  const cfg = ESTADOS[orden.estado] ?? ESTADOS.BORRADOR;
  const Icon = cfg.icon;
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg,${cfg.color}99,${cfg.color}33)`,
        }}
      />
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-playfair text-stone-900 font-semibold text-sm leading-tight truncate">
              {orden.proveedorNombre}
            </p>
            <p className="text-[10px] font-dm text-stone-400 mt-0.5">
              OC-{orden.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <Badge variant={cfg.variant} size="xs">
            <Icon size={9} /> {cfg.label}
          </Badge>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="font-playfair text-xl font-bold text-stone-900">
              {fmt(orden.totalEstimado, orden.moneda)}
            </p>
            <p className="text-[10px] font-dm text-stone-400">{orden.moneda}</p>
          </div>
          <p className="text-xs font-dm text-stone-400">
            {fmtDate(orden.fechaCreacion)}
          </p>
        </div>

        {/* Tip del estado */}
        <p className="text-[10px] font-dm text-stone-400 italic border-t border-stone-100 pt-2">
          {cfg.tip}
        </p>

        <div className="flex items-center justify-end">
          <span
            className="text-xs font-dm font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all"
            style={{ color: G[300] }}
          >
            Ver detalle <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Modal Recepción ───────────────────────────────────────────────────────
// FIX: useEffect re-inicializa cuando llegan los detalles (useState lazy init
//      solo corría una vez y orden llegaba undefined)
function ModalRecepcion({ open, onClose, orden, onDone }) {
  const buildRows = (ord) =>
    ord?.detalles?.map((d) => ({
      detalleId: d.id,
      nombreIngrediente: d.nombreIngrediente,
      unidadMedida: d.unidadMedida,
      cantidadPedida: parseFloat(d.cantidad),
      cantidadRecibida: String(d.cantidad), // pre-rellena con la cantidad pedida
      numeroLote: "",
      fechaVencimiento: "",
      fechaProduccion: "",
    })) ?? [];

  const [rows, setRows] = useState([]);
  const [notas, setNotas] = useState("");

  // ← ESTE es el fix: reinicializa cuando llegan los detalles
  useEffect(() => {
    if (orden?.detalles?.length) {
      setRows(buildRows(orden));
      setNotas("");
    }
  }, [orden?.id, orden?.detalles?.length]);

  const [recibir, { loading }] = useMutation(RECIBIR_ORDEN_COMPRA, {
    refetchQueries: ["GetOrdenesCompra", "GetOrdenCompra"],
  });

  const set = (idx, k, v) =>
    setRows((r) => r.map((x, i) => (i === idx ? { ...x, [k]: v } : x)));

  const canSubmit =
    rows.length > 0 &&
    rows.every((r) => r.cantidadRecibida && r.numeroLote && r.fechaVencimiento);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const { data } = await recibir({
        variables: {
          id: orden.id,
          notas: notas || null,
          detalles: rows.map((r) => ({
            detalleId: r.detalleId,
            cantidadRecibida: parseFloat(r.cantidadRecibida),
            numeroLote: r.numeroLote,
            fechaVencimiento: r.fechaVencimiento,
            fechaProduccion: r.fechaProduccion || null,
          })),
        },
      });
      if (!data?.recibirOrdenCompra?.ok)
        throw new Error(data?.recibirOrdenCompra?.error ?? "Error desconocido");

      await Swal.fire({
        background: "#fff",
        icon: "success",
        title: "¡Mercancía recibida!",
        html: `<span style="font-family:'DM Sans';color:#78716c">
          Los lotes fueron registrados en el almacén.<br/>
          El <b>costo unitario</b> de cada ingrediente se actualizó automáticamente.<br/>
          Ahora puedes calcular el precio de los platos por margen de ganancia.
        </span>`,
        confirmButtonColor: G[900],
        timer: 3500,
        timerProgressBar: true,
      });
      onDone();
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
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar recepción de mercancía"
      size="lg"
    >
      <div className="space-y-4">
        {/* Banner informativo */}
        <div
          className="flex items-start gap-2.5 p-3 rounded-xl border"
          style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}
        >
          <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <div className="text-xs font-dm text-blue-700 space-y-0.5">
            <p className="font-semibold">¿Qué sucede al confirmar?</p>
            <p>✓ Se crean los lotes en tu almacén con fecha de vencimiento</p>
            <p>✓ El stock de cada ingrediente aumenta automáticamente</p>
            <p>
              ✓ El costo unitario en la receta de cada plato se actualiza con el
              precio de esta orden
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-dm text-stone-400">
              Cargando ítems de la orden…
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
            {rows.map((r, idx) => (
              <div
                key={r.detalleId}
                className="bg-white rounded-xl border border-stone-200 p-4 space-y-3"
              >
                {/* Header del ítem */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: G[50] }}
                    >
                      <FlaskConical size={13} style={{ color: G[300] }} />
                    </div>
                    <div>
                      <p className="text-sm font-dm font-semibold text-stone-800">
                        {r.nombreIngrediente}
                      </p>
                      <p className="text-[10px] font-dm text-stone-400">
                        {r.unidadMedida}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-dm text-stone-400">
                    Pedido:{" "}
                    <b className="text-stone-600">
                      {r.cantidadPedida} {r.unidadMedida}
                    </b>
                  </span>
                </div>

                {/* Campos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Field
                    icon={Package}
                    label="Cant. recibida"
                    required
                    hint={`Máx: ${r.cantidadPedida} ${r.unidadMedida}`}
                  >
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      className={icls}
                      onFocus={fi}
                      onBlur={fb}
                      value={r.cantidadRecibida}
                      onChange={(e) =>
                        set(idx, "cantidadRecibida", e.target.value)
                      }
                    />
                  </Field>
                  <Field icon={FileText} label="Nº de lote" required>
                    <input
                      className={icls}
                      onFocus={fi}
                      onBlur={fb}
                      placeholder="LOTE-001"
                      value={r.numeroLote}
                      onChange={(e) => set(idx, "numeroLote", e.target.value)}
                    />
                  </Field>
                  <Field icon={CalendarDays} label="Fecha vencimiento" required>
                    <input
                      type="date"
                      className={icls}
                      onFocus={fi}
                      onBlur={fb}
                      value={r.fechaVencimiento}
                      onChange={(e) =>
                        set(idx, "fechaVencimiento", e.target.value)
                      }
                    />
                  </Field>
                  <Field
                    icon={CalendarDays}
                    label="Fecha producción"
                    hint="Opcional"
                  >
                    <input
                      type="date"
                      className={icls}
                      onFocus={fi}
                      onBlur={fb}
                      value={r.fechaProduccion}
                      onChange={(e) =>
                        set(idx, "fechaProduccion", e.target.value)
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}

        <Field icon={FileText} label="Notas de recepción">
          <textarea
            className={icls + " resize-none"}
            rows={2}
            onFocus={fi}
            onBlur={fb}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: Carne en buen estado, temperatura correcta…"
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
          <Button
            size="sm"
            loading={loading}
            disabled={!canSubmit || rows.length === 0}
            onClick={handleSubmit}
          >
            <CheckCircle2 size={13} /> Confirmar recepción
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal Detalle ─────────────────────────────────────────────────────────
function ModalDetalle({ open, onClose, ordenId }) {
  const { data, loading } = useQuery(GET_ORDEN_COMPRA, {
    variables: { id: ordenId },
    skip: !ordenId || !open,
    fetchPolicy: "cache-and-network",
  });
  const [showRecepcion, setShowRecepcion] = useState(false);

  const [enviar, { loading: enviando }] = useMutation(ENVIAR_ORDEN_COMPRA, {
    refetchQueries: ["GetOrdenesCompra", "GetOrdenCompra"],
  });
  const [cancelar, { loading: cancelando }] = useMutation(
    CANCELAR_ORDEN_COMPRA,
    {
      refetchQueries: ["GetOrdenesCompra", "GetOrdenCompra"],
    },
  );

  const orden = data?.ordenCompra;
  const cfg = orden
    ? (ESTADOS[orden.estado?.toUpperCase()] ?? ESTADOS.BORRADOR)
    : null;

  const handleEnviar = async () => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      icon: "question",
      title: "¿Enviar orden al proveedor?",
      html: `<span style="font-family:'DM Sans';color:#78716c">El estado cambiará a <b>ENVIADA</b>. Cuando llegue la mercancía regresa aquí y haz clic en <b>Registrar recepción</b>.</span>`,
      showCancelButton: true,
      confirmButtonColor: G[900],
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: "Sí, enviar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    try {
      const { data: res } = await enviar({ variables: { id: ordenId } });
      if (!res?.enviarOrdenCompra?.ok)
        throw new Error(res?.enviarOrdenCompra?.error);
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "¡Orden enviada!",
        html: `<span style="font-family:'DM Sans';color:#78716c">Ahora espera a que el proveedor entregue y registra la recepción.</span>`,
        confirmButtonColor: G[900],
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (err) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error al enviar",
        text: err.message,
        confirmButtonColor: G[900],
      });
    }
  };

  const handleCancelar = async () => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      icon: "warning",
      title: "¿Cancelar esta orden?",
      html: `<span style="font-family:'DM Sans';color:#78716c">Esta acción no se puede deshacer.</span>`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Volver",
    });
    if (!isConfirmed) return;
    try {
      const { data: res } = await cancelar({ variables: { id: ordenId } });
      if (!res?.cancelarOrdenCompra?.ok)
        throw new Error(res?.cancelarOrdenCompra?.error);
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Orden cancelada",
        confirmButtonColor: G[900],
        timer: 1800,
        timerProgressBar: true,
      });
      onClose();
    } catch (err) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error al cancelar",
        text: err.message,
        confirmButtonColor: G[900],
      });
    }
  };

  if (!open) return null;
  const CIcon = cfg?.icon ?? Clock;

  return (
    <>
      <Modal
        open={open && !showRecepcion}
        onClose={onClose}
        title="Detalle de orden de compra"
        size="lg"
      >
        {loading || !orden ? (
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-playfair text-stone-900 text-xl font-bold">
                  {orden.proveedorNombre}
                </p>
                <p className="text-xs font-dm text-stone-400 mt-0.5">
                  OC-{orden.id.slice(0, 8).toUpperCase()} · {orden.moneda}
                  {orden.fechaCreacion && ` · ${fmtDate(orden.fechaCreacion)}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={cfg.variant} size="md">
                  <CIcon size={11} /> {cfg.label}
                </Badge>
                <p className="text-[10px] font-dm text-stone-400 italic">
                  {cfg.tip}
                </p>
              </div>
            </div>

            {/* Banner flujo — guía al gerente */}
            {orden.estado === "ENVIADA" && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-xl border"
                style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}
              >
                <Truck size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs font-dm text-blue-700">
                  La orden fue enviada al proveedor. Cuando llegue la mercancía,
                  haz clic en <strong>Registrar recepción</strong> para
                  actualizar el stock y los costos.
                </p>
              </div>
            )}
            {orden.estado === "RECIBIDA" && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-xl border"
                style={{ background: G[50], borderColor: G[100] }}
              >
                <CheckCircle2
                  size={14}
                  style={{ color: G[300] }}
                  className="mt-0.5 shrink-0"
                />
                <p className="text-xs font-dm" style={{ color: G[500] }}>
                  ✓ Stock actualizado · ✓ Costos de producción actualizados · ✓
                  Lotes registrados. Ahora puedes ir a{" "}
                  <strong>Platos → Precio</strong> y calcular el precio por
                  margen de ganancia.
                </p>
              </div>
            )}

            {/* Ítems */}
            <div className="rounded-2xl border border-stone-200 overflow-hidden">
              <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
                <p className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
                  Ítems de la orden
                </p>
              </div>
              <div className="divide-y divide-stone-100">
                {orden.detalles?.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                    <FlaskConical
                      size={13}
                      className="text-stone-300 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-dm text-stone-800 font-medium truncate">
                        {d.nombreIngrediente}
                      </p>
                      <p className="text-[10px] font-dm text-stone-400">
                        {d.unidadMedida}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-dm text-stone-700 font-semibold">
                        {parseFloat(d.cantidad).toFixed(2)}
                      </p>
                      <p className="text-[10px] font-dm text-stone-400">
                        @ {fmt(d.precioUnitario, orden.moneda)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 min-w-[90px]">
                      <p className="text-sm font-playfair text-stone-900 font-bold">
                        {fmt(d.subtotal, orden.moneda)}
                      </p>
                      {parseFloat(d.cantidadRecibida) > 0 && (
                        <p
                          className="text-[10px] font-dm"
                          style={{ color: G[300] }}
                        >
                          Rcbd: {parseFloat(d.cantidadRecibida).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
                <span className="text-sm font-dm font-semibold text-stone-600">
                  Total estimado
                </span>
                <span className="font-playfair text-stone-900 font-bold text-lg">
                  {fmt(orden.totalEstimado, orden.moneda)}
                </span>
              </div>
            </div>

            {/* Fechas y notas */}
            {(orden.fechaEntregaEstimada ||
              orden.fechaRecepcion ||
              orden.notas) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {orden.fechaEntregaEstimada && (
                  <div className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-200">
                    <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
                      Entrega estimada
                    </p>
                    <p className="text-sm font-dm text-stone-700 mt-0.5">
                      {fmtDate(orden.fechaEntregaEstimada)}
                    </p>
                  </div>
                )}
                {orden.fechaRecepcion && (
                  <div
                    className="px-4 py-3 rounded-xl border"
                    style={{ background: G[50], borderColor: G[100] }}
                  >
                    <p
                      className="text-[10px] font-dm uppercase tracking-wider"
                      style={{ color: G[300] }}
                    >
                      Recibida el
                    </p>
                    <p className="text-sm font-dm text-stone-700 mt-0.5">
                      {fmtDate(orden.fechaRecepcion)}
                    </p>
                  </div>
                )}
                {orden.notas && (
                  <div className="sm:col-span-2 px-4 py-3 rounded-xl bg-stone-50 border border-stone-200">
                    <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider mb-1">
                      Notas
                    </p>
                    <p className="text-sm font-dm text-stone-700">
                      {orden.notas}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cerrar
              </Button>
              <div className="flex gap-2">
                {["BORRADOR", "PENDIENTE"].includes(orden.estado) && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={cancelando}
                      onClick={handleCancelar}
                    >
                      <XCircle size={13} /> Cancelar orden
                    </Button>
                    <Button size="sm" loading={enviando} onClick={handleEnviar}>
                      <Send size={13} /> Enviar al proveedor
                    </Button>
                  </>
                )}
                {orden.estado === "ENVIADA" && (
                  <Button size="sm" onClick={() => setShowRecepcion(true)}>
                    <Package size={13} /> Registrar recepción
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de recepción */}
      <ModalRecepcion
        open={showRecepcion}
        onClose={() => setShowRecepcion(false)}
        orden={data?.ordenCompra}
        onDone={() => {
          setShowRecepcion(false);
          onClose();
        }}
      />
    </>
  );
}

// ── Wizard de creación ────────────────────────────────────────────────────
function CreateOrdenWizard({
  restauranteId,
  monedaRestaurante,
  onCancel,
  onCreated,
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    proveedorId: "",
    moneda: monedaRestaurante || "COP",
    fechaEntregaEstimada: "",
    notas: "",
  });
  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState({
    ingredienteId: "",
    unidadMedida: "",
    cantidad: "",
    precioUnitario: "",
  });

  const { data: provData } = useQuery(GET_PROVEEDORES, {
    variables: { activo: true },
    fetchPolicy: "cache-and-network",
  });
  const { data: ingData } = useQuery(GET_INGREDIENTES_DISPONIBLES, {
    variables: { disponibles: restauranteId, activo: true },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });
  const [crearOrden, { loading }] = useMutation(CREAR_ORDEN_GERENTE, {
    refetchQueries: ["GetOrdenesCompra"],
  });

  const proveedores = provData?.proveedores ?? [];
  const ingredientes = ingData?.ingredientes ?? [];
  const total = items.reduce(
    (acc, i) => acc + i.cantidad * i.precioUnitario,
    0,
  );
  const proveedor = proveedores.find((p) => p.id === form.proveedorId);

  const addItem = () => {
    if (
      !itemForm.ingredienteId ||
      !itemForm.cantidad ||
      !itemForm.precioUnitario
    )
      return;
    const ing = ingredientes.find((i) => i.id === itemForm.ingredienteId);
    setItems([
      ...items,
      {
        ingredienteId: itemForm.ingredienteId,
        nombreIngrediente: ing?.nombre ?? "",
        unidadMedida: ing?.unidadMedida ?? itemForm.unidadMedida,
        cantidad: parseFloat(itemForm.cantidad),
        precioUnitario: parseFloat(itemForm.precioUnitario),
      },
    ]);
    setItemForm({
      ingredienteId: "",
      unidadMedida: "",
      cantidad: "",
      precioUnitario: "",
    });
  };

  const handleSubmit = async () => {
    try {
      const { data: res } = await crearOrden({
        variables: {
          proveedorId: form.proveedorId,
          moneda: form.moneda,
          fechaEntregaEstimada: form.fechaEntregaEstimada || null,
          notas: form.notas || null,
          detalles: items.map((i) => ({
            ingredienteId: i.ingredienteId,
            nombreIngrediente: i.nombreIngrediente,
            unidadMedida: i.unidadMedida,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
          })),
        },
      });
      if (!res?.crearOrdenCompra?.ok)
        throw new Error(res?.crearOrdenCompra?.error);
      await Swal.fire({
        background: "#fff",
        icon: "success",
        title: "¡Orden creada!",
        html: `<span style="font-family:'DM Sans';color:#78716c">
          Total: <b>${fmt(total, form.moneda)}</b> · ${items.length} ítem(s)<br/>
          Ahora ábrela y haz clic en <b>Enviar al proveedor</b>.
        </span>`,
        confirmButtonColor: G[900],
        confirmButtonText: "Ver órdenes",
      });
      onCreated();
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-0.5 rounded-full"
              style={{ background: G[300] }}
            />
            <span
              className="text-[10px] font-dm font-bold tracking-[0.18em] uppercase"
              style={{ color: G[300] }}
            >
              Nueva orden
            </span>
          </div>
          <h2 className="font-playfair text-2xl font-bold text-stone-900">
            Crear orden de compra
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 transition text-sm font-dm"
        >
          <XCircle size={14} /> Cancelar
        </button>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      {/* Banner guía */}
      <div
        className="flex items-start gap-2.5 p-3 rounded-xl border"
        style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}
      >
        <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs font-dm text-blue-700">
          <strong>Flujo:</strong> Crea la orden → Envíala al proveedor → Cuando
          llegue la mercancía, regresa y registra la recepción → Stock y costos
          se actualizan automáticamente.
        </p>
      </div>

      <div
        className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5"
        style={{
          borderTop: `2px solid ${G[300]}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        {/* ── PASO 0: Proveedor ── */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-playfair text-stone-900 text-lg font-bold">
                Proveedor y configuración
              </h3>
              <p className="text-stone-400 text-sm mt-0.5 font-dm">
                Selecciona a quién le vas a comprar y en qué moneda.
              </p>
            </div>

            <Field icon={Truck} label="Proveedor" required>
              <select
                className={icls + " appearance-none cursor-pointer"}
                onFocus={fi}
                onBlur={fb}
                value={form.proveedorId}
                onChange={(e) =>
                  setForm({ ...form, proveedorId: e.target.value })
                }
              >
                <option value="">Selecciona un proveedor…</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                    {p.ciudad ? ` · ${p.ciudad}` : ""}
                  </option>
                ))}
              </select>
              {proveedores.length === 0 && (
                <p className="text-[11px] font-dm text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} /> Sin proveedores. Crea uno en{" "}
                  <b>Inventario → Proveedores</b>.
                </p>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field icon={Coins} label="Moneda" required>
                <select
                  className={icls + " appearance-none cursor-pointer"}
                  onFocus={fi}
                  onBlur={fb}
                  value={form.moneda}
                  onChange={(e) => setForm({ ...form, moneda: e.target.value })}
                >
                  {MONEDAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              <Field icon={CalendarDays} label="Entrega estimada">
                <input
                  type="datetime-local"
                  className={icls}
                  onFocus={fi}
                  onBlur={fb}
                  value={form.fechaEntregaEstimada}
                  onChange={(e) =>
                    setForm({ ...form, fechaEntregaEstimada: e.target.value })
                  }
                />
              </Field>
            </div>

            <Field icon={FileText} label="Notas para el proveedor">
              <textarea
                className={icls + " resize-none"}
                rows={3}
                onFocus={fi}
                onBlur={fb}
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Instrucciones de entrega, empaque, calidad esperada…"
              />
            </Field>
          </div>
        )}

        {/* ── PASO 1: Ítems ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-playfair text-stone-900 text-lg font-bold">
                Ítems de la orden
              </h3>
              <p className="text-stone-400 text-sm mt-0.5 font-dm">
                Agrega los ingredientes. El precio por unidad que pongas aquí se
                usará para calcular el costo de producción de los platos.
              </p>
            </div>

            {/* Formulario de ítem */}
            <div
              className="rounded-2xl border border-stone-200 p-4 space-y-3"
              style={{ background: "#fafaf9" }}
            >
              <p className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
                Agregar ingrediente
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px_120px] gap-3">
                <Field icon={FlaskConical} label="Ingrediente">
                  <select
                    className={icls + " appearance-none cursor-pointer"}
                    onFocus={fi}
                    onBlur={fb}
                    value={itemForm.ingredienteId}
                    onChange={(e) => {
                      const ing = ingredientes.find(
                        (i) => i.id === e.target.value,
                      );
                      setItemForm({
                        ...itemForm,
                        ingredienteId: e.target.value,
                        unidadMedida: ing?.unidadMedida ?? "",
                      });
                    }}
                  >
                    <option value="">Selecciona…</option>
                    {ingredientes
                      .filter(
                        (i) => !items.some((it) => it.ingredienteId === i.id),
                      )
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nombre} ({i.unidadMedida})
                        </option>
                      ))}
                  </select>
                </Field>
                <Field icon={Package} label="Cantidad">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    className={icls}
                    onFocus={fi}
                    onBlur={fb}
                    value={itemForm.cantidad}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, cantidad: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </Field>
                <Field
                  icon={Coins}
                  label={`Precio/${itemForm.unidadMedida || "und"}`}
                  hint="Precio que pagas al proveedor"
                >
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={icls}
                    onFocus={fi}
                    onBlur={fb}
                    value={itemForm.precioUnitario}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        precioUnitario: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={
                    !itemForm.ingredienteId ||
                    !itemForm.cantidad ||
                    !itemForm.precioUnitario
                  }
                  onClick={addItem}
                >
                  <Plus size={13} /> Agregar ítem
                </Button>
              </div>
            </div>

            {/* Lista de ítems */}
            {items.length === 0 ? (
              <div className="flex flex-col items-center py-10 rounded-2xl border-2 border-dashed border-stone-200">
                <ShoppingCart size={24} className="text-stone-200 mb-2" />
                <p className="text-stone-400 text-sm font-dm">
                  Sin ítems — agrega al menos uno
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
                    {items.length} ítem(s)
                  </p>
                  <p
                    className="font-playfair font-bold text-lg"
                    style={{ color: G[300] }}
                  >
                    {fmt(total, form.moneda)}
                  </p>
                </div>
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-stone-200 shadow-sm"
                  >
                    <FlaskConical
                      size={13}
                      style={{ color: G[100] }}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-dm font-semibold text-stone-800 truncate">
                        {item.nombreIngrediente}
                      </p>
                      <p className="text-[10px] font-dm text-stone-400">
                        {item.cantidad} {item.unidadMedida} @{" "}
                        {fmt(item.precioUnitario, form.moneda)}
                      </p>
                    </div>
                    <p className="font-playfair font-bold text-stone-900 shrink-0 text-sm">
                      {fmt(item.cantidad * item.precioUnitario, form.moneda)}
                    </p>
                    <button
                      onClick={() =>
                        setItems(items.filter((_, i) => i !== idx))
                      }
                      className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition shrink-0"
                    >
                      <XCircle size={12} />
                    </button>
                  </div>
                ))}
                <div
                  className="flex justify-end px-4 py-3 rounded-xl border"
                  style={{ background: G[50], borderColor: G[100] }}
                >
                  <div className="text-right">
                    <p className="text-xs font-dm" style={{ color: G[300] }}>
                      Total estimado
                    </p>
                    <p
                      className="font-playfair font-bold text-xl"
                      style={{ color: G[500] }}
                    >
                      {fmt(total, form.moneda)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PASO 2: Confirmar ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-playfair text-stone-900 text-lg font-bold">
                Confirmar orden
              </h3>
              <p className="text-stone-400 text-sm mt-0.5 font-dm">
                Revisa los datos antes de crear.
              </p>
            </div>

            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: G[100] }}
            >
              <div
                className="h-1"
                style={{
                  background: `linear-gradient(90deg,${G[900]},${G[300]})`,
                }}
              />
              <div
                className="p-5 space-y-4"
                style={{ background: `${G[50]}55` }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
                      Proveedor
                    </p>
                    <p className="font-dm text-stone-900 font-semibold mt-0.5">
                      {proveedor?.nombre}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
                      Moneda
                    </p>
                    <p className="font-dm text-stone-900 font-semibold mt-0.5">
                      {form.moneda}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
                      Ítems
                    </p>
                    <p className="font-dm text-stone-900 font-semibold mt-0.5">
                      {items.length}
                    </p>
                  </div>
                  {form.fechaEntregaEstimada && (
                    <div>
                      <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
                        Entrega estimada
                      </p>
                      <p className="font-dm text-stone-900 font-semibold mt-0.5">
                        {fmtDate(form.fechaEntregaEstimada)}
                      </p>
                    </div>
                  )}
                </div>
                <Divider label="Resumen de ítems" />
                <div className="space-y-1.5">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm font-dm"
                    >
                      <span className="text-stone-600">
                        {item.nombreIngrediente} × {item.cantidad}{" "}
                        {item.unidadMedida}
                      </span>
                      <span className="font-semibold text-stone-900">
                        {fmt(item.cantidad * item.precioUnitario, form.moneda)}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  className="flex items-center justify-between pt-3 border-t"
                  style={{ borderColor: G[100] }}
                >
                  <span
                    className="font-dm font-semibold"
                    style={{ color: G[300] }}
                  >
                    Total estimado
                  </span>
                  <span
                    className="font-playfair font-bold text-xl"
                    style={{ color: G[500] }}
                  >
                    {fmt(total, form.moneda)}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="flex items-start gap-2.5 px-4 py-3 rounded-xl border"
              style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}
            >
              <Truck size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs font-dm text-blue-700">
                <p>
                  La orden se creará en estado <strong>BORRADOR</strong>.
                </p>
                <p className="mt-0.5">
                  Siguiente paso: ábrela en la lista y haz clic en{" "}
                  <strong>Enviar al proveedor</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}
        >
          <ArrowLeft size={13} /> {step === 0 ? "Cancelar" : "Atrás"}
        </Button>
        {step < 2 ? (
          <Button
            size="sm"
            disabled={
              step === 0
                ? !form.proveedorId || !form.moneda
                : items.length === 0
            }
            onClick={() => setStep(step + 1)}
          >
            Siguiente <ArrowRight size={13} />
          </Button>
        ) : (
          <Button size="sm" loading={loading} onClick={handleSubmit}>
            <CheckCircle2 size={13} /> Crear orden
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Vista principal ───────────────────────────────────────────────────────
export default function GOrdenesCompra() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [vista, setVista] = useState("lista");
  const [ordenSel, setOrdenSel] = useState(null);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("all");

  const { data: rData } = useQuery(GET_MI_RESTAURANTE, {
    variables: { id: restauranteId },
    skip: !restauranteId,
  });
  const monedaRestaurante = rData?.restaurante?.moneda ?? "COP";

  const { data, loading } = useQuery(GET_ORDENES_COMPRA, {
    variables: { restauranteId, estado: filtro === "all" ? undefined : filtro },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  const ordenes = data?.ordenesCompra ?? [];
  const cnt = (e) => ordenes.filter((o) => o.estado === e).length;

  const filtered = useMemo(
    () =>
      ordenes.filter((o) =>
        (o.proveedorNombre ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [ordenes, search],
  );

  if (vista === "crear")
    return (
      <CreateOrdenWizard
        restauranteId={restauranteId}
        monedaRestaurante={monedaRestaurante}
        onCancel={() => setVista("lista")}
        onCreated={() => setVista("lista")}
      />
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title="Órdenes de compra"
        description="Flujo: Crear → Enviar al proveedor → Registrar recepción → Stock y costos actualizados."
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-xs font-dm text-stone-500">
              {[
                { e: "ENVIADA", l: "Esperando", c: "#3b82f6" },
                { e: "RECIBIDA", l: "Recibidas", c: G[300] },
                { e: "BORRADOR", l: "Borrador", c: "#94a3b8" },
              ].map(({ e, l, c }) => (
                <span key={e} className="flex items-center gap-1">
                  <span className="font-semibold" style={{ color: c }}>
                    {cnt(e)}
                  </span>
                  <span className="text-stone-400">{l}</span>
                </span>
              ))}
            </div>
            <Button onClick={() => setVista("crear")}>
              <Plus size={14} /> Nueva orden
            </Button>
          </div>
        }
      />

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
          <Search size={14} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por proveedor…"
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

        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200 overflow-x-auto">
          {[
            { v: "all", l: "Todas" },
            { v: "BORRADOR", l: "Borrador" },
            { v: "ENVIADA", l: "Enviadas" },
            { v: "RECIBIDA", l: "Recibidas" },
            { v: "CANCELADA", l: "Canceladas" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all whitespace-nowrap"
              style={
                filtro === v
                  ? { background: G[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              {l}
              {v !== "all" && (
                <span
                  className="px-1 py-0.5 rounded-full text-[9px] font-bold"
                  style={
                    filtro === v
                      ? { background: "rgba(255,255,255,0.18)", color: "#fff" }
                      : { background: "#f5f5f4", color: "#a8a29e" }
                  }
                >
                  {cnt(v)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={search ? "Sin resultados" : "Sin órdenes de compra"}
          description={
            search
              ? `No hay órdenes que coincidan con "${search}".`
              : "Crea tu primera orden. El ciclo: Crear → Enviar → Recibir actualiza el stock y los costos automáticamente."
          }
          action={
            !search && (
              <Button onClick={() => setVista("crear")}>
                <Plus size={14} /> Nueva orden
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="text-xs font-dm text-stone-400 -mt-2">
            {filtered.length} orden{filtered.length !== 1 ? "es" : ""}
            {search && ` — "${search}"`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((o) => (
              <OrdenCard
                key={o.id}
                orden={o}
                onClick={() => setOrdenSel(o.id)}
              />
            ))}
          </div>
        </>
      )}

      <ModalDetalle
        open={!!ordenSel}
        onClose={() => setOrdenSel(null)}
        ordenId={ordenSel}
      />
    </div>
  );
}
