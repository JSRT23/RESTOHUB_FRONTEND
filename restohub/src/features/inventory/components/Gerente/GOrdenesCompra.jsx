// src/features/inventory/components/gerente/GOrdenesCompra.jsx
//
// Gestión completa de órdenes de compra para gerente_local.
// Flujo: Lista → Crear (wizard 3 pasos inline) → Detalle (modal) → Recepción
//
// Diferencias vs. OrdenesCompra del admin:
//  · restauranteId se inyecta del JWT en el gateway — no se envía desde el frontend
//  · Ingredientes = GET_INGREDIENTES_DISPONIBLES (globales + del restaurante)
//  · Proveedores = los que el gateway filtra para el gerente (scope automático)
//  · Design system verde (G[900]) en lugar de ámbar
//  · Estados uppercase: BORRADOR | PENDIENTE | ENVIADA | RECIBIDA | CANCELADA
//
// Ruta: /gerente/ordenes
// index.jsx:
//   import GOrdenesCompra from "../../features/inventory/components/gerente/GOrdenesCompra";
//   { path: "gerente/ordenes", element: <RoleRoute roles={["gerente_local"]}><GOrdenesCompra /></RoleRoute> }

import { useState } from "react";
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
  ChevronDown,
  CalendarDays,
  FileText,
  ReceiptText,
  AlertTriangle,
  Eye,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_ORDENES_COMPRA,
  GET_ORDEN_COMPRA,
  GET_PROVEEDORES,
} from "../../graphql/queries";
import {
  CREAR_ORDEN_COMPRA,
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

// ── Config de estados ─────────────────────────────────────────────────────
const ESTADOS = {
  BORRADOR: {
    label: "Borrador",
    variant: "default",
    icon: Clock,
    color: "#64748b",
  },
  PENDIENTE: {
    label: "Pendiente",
    variant: "amber",
    icon: Clock,
    color: "#d97706",
  },
  ENVIADA: { label: "Enviada", variant: "blue", icon: Truck, color: "#3b82f6" },
  RECIBIDA: {
    label: "Recibida",
    variant: "green",
    icon: CheckCircle2,
    color: "#16a34a",
  },
  CANCELADA: {
    label: "Cancelada",
    variant: "red",
    icon: XCircle,
    color: "#dc2626",
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
          background: `linear-gradient(90deg, ${cfg.color}99, ${cfg.color}44)`,
        }}
      />
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-playfair text-stone-900 font-semibold text-sm leading-tight truncate">
              {orden.proveedorNombre}
            </p>
            <p className="text-[10px] font-dm text-stone-400 mt-0.5">
              OC-{orden.id.slice(0, 8)}
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
            <p className="text-[10px] font-dm text-stone-400">
              {orden.moneda} · {orden.detalles?.length ?? 0} ítem(s)
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-dm text-stone-400">
              {fmtDate(orden.fechaCreacion)}
            </p>
            {orden.fechaEntregaEstimada && (
              <p className="text-[10px] font-dm text-stone-400">
                Entrega: {fmtDate(orden.fechaEntregaEstimada)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end pt-1 border-t border-stone-100">
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
function ModalRecepcion({ open, onClose, orden, onDone }) {
  const [recepcion, setRecepcion] = useState(
    () =>
      orden?.detalles?.map((d) => ({
        detalleId: d.id,
        nombreIngrediente: d.nombreIngrediente,
        cantidadPedida: parseFloat(d.cantidad),
        unidadMedida: d.unidadMedida,
        cantidadRecibida: String(d.cantidad),
        numeroLote: "",
        fechaVencimiento: "",
        fechaProduccion: "",
      })) ?? [],
  );
  const [notas, setNotas] = useState("");

  const [recibir, { loading }] = useMutation(RECIBIR_ORDEN_COMPRA, {
    refetchQueries: ["GetOrdenesCompra"],
  });

  const setField = (idx, k, v) =>
    setRecepcion((r) => r.map((x, i) => (i === idx ? { ...x, [k]: v } : x)));

  const canSubmit = recepcion.every(
    (r) => r.cantidadRecibida && r.numeroLote && r.fechaVencimiento,
  );

  const handleSubmit = async () => {
    try {
      const { data } = await recibir({
        variables: {
          id: orden.id,
          notas: notas || null,
          detalles: recepcion.map((r) => ({
            detalleId: r.detalleId,
            cantidadRecibida: parseFloat(r.cantidadRecibida),
            numeroLote: r.numeroLote,
            fechaVencimiento: r.fechaVencimiento,
            fechaProduccion: r.fechaProduccion || null,
          })),
        },
      });
      if (!data?.recibirOrdenCompra?.ok)
        throw new Error(data?.recibirOrdenCompra?.error);
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "¡Mercancía recibida!",
        html: `<span style="font-family:'DM Sans';color:#78716c">Los lotes han sido registrados en el almacén.</span>`,
        confirmButtonColor: G[900],
        timer: 2000,
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

  if (!orden) return null;

  return (
    <Modal open={open} onClose={onClose} title="Registrar recepción" size="lg">
      <div className="space-y-4">
        <div
          className="flex items-start gap-2.5 p-3 rounded-xl border"
          style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}
        >
          <Package size={13} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs font-dm text-blue-700 leading-relaxed">
            Completa los datos de recepción por cada ítem. Se crearán los lotes
            automáticamente en tu almacén.
          </p>
        </div>

        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
          {recepcion.map((r, idx) => (
            <div
              key={r.detalleId}
              className="bg-white rounded-xl border border-stone-200 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical size={13} style={{ color: G[300] }} />
                  <p className="text-sm font-dm font-semibold text-stone-800">
                    {r.nombreIngrediente}
                  </p>
                  <span className="text-xs font-dm text-stone-400">
                    {r.unidadMedida}
                  </span>
                </div>
                <span className="text-xs font-dm text-stone-400">
                  Pedido: <b className="text-stone-600">{r.cantidadPedida}</b>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field icon={Package} label="Cant. recibida" required>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    className={icls}
                    onFocus={fi}
                    onBlur={fb}
                    value={r.cantidadRecibida}
                    onChange={(e) =>
                      setField(idx, "cantidadRecibida", e.target.value)
                    }
                  />
                </Field>
                <Field icon={FileText} label="Nº de lote" required>
                  <input
                    className={icls}
                    onFocus={fi}
                    onBlur={fb}
                    value={r.numeroLote}
                    onChange={(e) =>
                      setField(idx, "numeroLote", e.target.value)
                    }
                    placeholder="LOTE-001"
                  />
                </Field>
                <Field icon={CalendarDays} label="Vencimiento" required>
                  <input
                    type="date"
                    className={icls}
                    onFocus={fi}
                    onBlur={fb}
                    value={r.fechaVencimiento}
                    onChange={(e) =>
                      setField(idx, "fechaVencimiento", e.target.value)
                    }
                  />
                </Field>
                <Field icon={CalendarDays} label="Producción">
                  <input
                    type="date"
                    className={icls}
                    onFocus={fi}
                    onBlur={fb}
                    value={r.fechaProduccion}
                    onChange={(e) =>
                      setField(idx, "fechaProduccion", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <Field icon={FileText} label="Notas de recepción">
          <textarea
            className={icls + " resize-none"}
            rows={2}
            onFocus={fi}
            onBlur={fb}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Observaciones sobre el estado de la mercancía…"
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
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <CheckCircle2 size={13} /> Confirmar recepción
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal Detalle de orden ────────────────────────────────────────────────
function ModalDetalle({ open, onClose, ordenId }) {
  const { data, loading } = useQuery(GET_ORDEN_COMPRA, {
    variables: { id: ordenId },
    skip: !ordenId || !open,
  });
  const [mostrarRecepcion, setMostrarRecepcion] = useState(false);

  const [enviar, { loading: enviando }] = useMutation(ENVIAR_ORDEN_COMPRA, {
    refetchQueries: ["GetOrdenesCompra", "GetOrdenCompra"],
  });
  const [cancelar, { loading: cancelando }] = useMutation(
    CANCELAR_ORDEN_COMPRA,
    { refetchQueries: ["GetOrdenesCompra", "GetOrdenCompra"] },
  );

  if (!open) return null;
  const orden = data?.ordenCompra;
  const cfg = orden
    ? (ESTADOS[orden.estado?.toUpperCase()] ?? ESTADOS.BORRADOR)
    : null;
  const CIcon = cfg?.icon ?? Clock;

  const handleEnviar = async () => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      icon: "question",
      title: "¿Enviar orden al proveedor?",
      html: `<span style="font-family:'DM Sans';color:#78716c">El estado cambiará a <b>ENVIADA</b>. El proveedor deberá confirmar entrega.</span>`,
      showCancelButton: true,
      confirmButtonColor: G[900],
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: "Sí, enviar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    const { data: res } = await enviar({ variables: { id: ordenId } });
    if (!res?.enviarOrdenCompra?.ok)
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: res?.enviarOrdenCompra?.error,
        confirmButtonColor: G[900],
      });
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
    await cancelar({ variables: { id: ordenId } });
    onClose();
  };

  return (
    <>
      <Modal
        open={open && !mostrarRecepcion}
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
                  OC-{orden.id.slice(0, 8)} · {orden.moneda}
                  {orden.fechaCreacion && ` · ${fmtDate(orden.fechaCreacion)}`}
                </p>
              </div>
              <Badge variant={cfg.variant} size="md">
                <CIcon size={11} /> {cfg.label}
              </Badge>
            </div>

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
                    <div className="text-right shrink-0 min-w-[80px]">
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
                {(orden.estado === "BORRADOR" ||
                  orden.estado === "PENDIENTE") && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={cancelando}
                      onClick={handleCancelar}
                    >
                      <XCircle size={13} /> Cancelar
                    </Button>
                    <Button size="sm" loading={enviando} onClick={handleEnviar}>
                      <Send size={13} /> Enviar al proveedor
                    </Button>
                  </>
                )}
                {orden.estado === "ENVIADA" && (
                  <Button size="sm" onClick={() => setMostrarRecepcion(true)}>
                    <Package size={13} /> Registrar recepción
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de recepción encadenado */}
      <ModalRecepcion
        open={mostrarRecepcion}
        onClose={() => setMostrarRecepcion(false)}
        orden={data?.ordenCompra}
        onDone={() => {
          setMostrarRecepcion(false);
          onClose();
        }}
      />
    </>
  );
}

// ── Mutation del gerente: sin restauranteId (el gateway lo inyecta del JWT) ─
// NO usar CREAR_ORDEN_COMPRA de mutations.js — tiene $restauranteId: ID! como
// requerido y Apollo rechaza la mutation localmente si no se pasa ese campo.
const CREAR_ORDEN_COMPRA_GERENTE = gql`
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
  const [crearOrden, { loading }] = useMutation(CREAR_ORDEN_COMPRA_GERENTE, {
    refetchQueries: ["GetOrdenesCompra"],
  });

  const proveedores = provData?.proveedores ?? [];
  const ingredientes = ingData?.ingredientes ?? [];

  const total = items.reduce(
    (acc, i) =>
      acc + (parseFloat(i.cantidad) || 0) * (parseFloat(i.precioUnitario) || 0),
    0,
  );
  const proveedor = proveedores.find((p) => p.id === form.proveedorId);

  const canNext0 = !!form.proveedorId && !!form.moneda;
  const canNext1 = items.length > 0;

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

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    try {
      const { data: res } = await crearOrden({
        variables: {
          proveedorId: form.proveedorId,
          // restauranteId se inyecta del JWT en el gateway
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
        html: `<span style="font-family:'DM Sans';color:#78716c">Total: ${fmt(total, form.moneda)} · ${items.length} ítem(s)<br/>La orden está en estado <b>BORRADOR</b>. Ábrela para enviarla.</span>`,
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
      {/* Header del wizard */}
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

      {/* Card del paso */}
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
                Selecciona el proveedor y la moneda de la orden.
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
                    {p.nombre} {p.ciudad ? `· ${p.ciudad}` : ""}
                  </option>
                ))}
              </select>
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
                placeholder="Instrucciones especiales de entrega, empaque, etc."
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
                Agrega los ingredientes que necesitas comprar.
              </p>
            </div>

            {/* Formulario de agregar ítem */}
            <div
              className="rounded-2xl border border-stone-200 p-4 space-y-3"
              style={{ background: "#fafaf9" }}
            >
              <p className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
                Agregar ítem
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px_110px] gap-3">
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
                      onClick={() => removeItem(idx)}
                      className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition shrink-0"
                    >
                      <XCircle size={12} />
                    </button>
                  </div>
                ))}
                {/* Total */}
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
                  <div>
                    <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
                      Ítems
                    </p>
                    <p className="font-dm text-stone-900 font-semibold mt-0.5">
                      {items.length}
                    </p>
                  </div>
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
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
              style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}
            >
              <Truck size={14} className="text-blue-500 shrink-0" />
              <p className="text-xs font-dm text-blue-700">
                La orden se creará en estado <strong>BORRADOR</strong>. Podrás
                enviarla al proveedor desde el detalle.
              </p>
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
          <ArrowLeft size={13} />
          {step === 0 ? "Cancelar" : "Atrás"}
        </Button>
        {step < 2 ? (
          <Button
            size="sm"
            disabled={step === 0 ? !canNext0 : !canNext1}
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

  const [vista, setVista] = useState("lista"); // lista | crear
  const [ordenSel, setOrdenSel] = useState(null);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");

  const { data: rData } = useQuery(GET_MI_RESTAURANTE, {
    variables: { id: restauranteId },
    skip: !restauranteId,
  });
  const monedaRestaurante = rData?.restaurante?.moneda ?? "COP";

  const { data, loading } = useQuery(GET_ORDENES_COMPRA, {
    variables: {
      restauranteId,
      estado: filtroEstado === "all" ? undefined : filtroEstado,
    },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  const ordenes = data?.ordenesCompra ?? [];
  const cnt = (e) => ordenes.filter((o) => o.estado === e).length;

  const filtered = ordenes.filter((o) =>
    (o.proveedorNombre ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  // ── Vista Crear ──────────────────────────────────────────────────────────
  if (vista === "crear")
    return (
      <CreateOrdenWizard
        restauranteId={restauranteId}
        monedaRestaurante={monedaRestaurante}
        onCancel={() => setVista("lista")}
        onCreated={() => setVista("lista")}
      />
    );

  // ── Vista Lista ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title="Órdenes de compra"
        description="Gestiona el ciclo completo de compras: crear → enviar → recibir mercancía."
        action={
          <div className="flex items-center gap-2">
            {/* KPIs rápidos */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-dm text-stone-500">
              {[
                { e: "ENVIADA", l: "Enviadas", c: "#3b82f6" },
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
            { v: "ENVIADA", l: "Enviada" },
            { v: "RECIBIDA", l: "Recibida" },
            { v: "CANCELADA", l: "Cancelada" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltroEstado(v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all whitespace-nowrap"
              style={
                filtroEstado === v
                  ? { background: G[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              {l}
              {v !== "all" && (
                <span
                  className="px-1 py-0.5 rounded-full text-[9px] font-bold"
                  style={
                    filtroEstado === v
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
              : "Crea la primera orden de compra para tu restaurante."
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
