// src/features/inventory/components/OrdenesCompra.jsx
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
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
  Building2,
  Coins,
  FlaskConical,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_ORDENES_COMPRA,
  GET_ORDEN_COMPRA,
  GET_PROVEEDORES,
  GET_ALMACENES,
} from "../graphql/queries";
import { GET_INGREDIENTES } from "../../menu/graphql/queries";
import { GET_RESTAURANTES } from "../../menu/graphql/queries";
import {
  CREAR_ORDEN_COMPRA,
  ENVIAR_ORDEN_COMPRA,
  RECIBIR_ORDEN_COMPRA,
  CANCELAR_ORDEN_COMPRA,
} from "../graphql/mutations";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  StatCard,
  Skeleton,
  EmptyState,
  Modal,
  Input,
  Select,
  StepIndicator,
  Divider,
} from "../../../shared/components/ui";

// ── Configuración estados ──────────────────────────────────────────────────
const ESTADO_CFG = {
  BORRADOR: { label: "Borrador", variant: "default", icon: Clock },
  PENDIENTE: { label: "Pendiente", variant: "amber", icon: Clock },
  ENVIADA: { label: "Enviada", variant: "blue", icon: Truck },
  RECIBIDA: { label: "Recibida", variant: "green", icon: CheckCircle2 },
  CANCELADA: { label: "Cancelada", variant: "red", icon: XCircle },
};

const fmt = (v, moneda = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(v);

// ── OrdenCard ──────────────────────────────────────────────────────────────
function OrdenCard({ orden, onClick }) {
  const cfg = ESTADO_CFG[orden.estado] ?? ESTADO_CFG.BORRADOR;
  const Icon = cfg.icon;
  return (
    <div
      onClick={onClick}
      className="group rounded-2xl bg-white border border-stone-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-playfair text-stone-900 font-semibold leading-tight">
            {orden.proveedorNombre}
          </p>
          <p className="text-[10px] font-dm text-stone-400 mt-0.5">
            OC-{orden.id.slice(0, 8)}
          </p>
        </div>
        <Badge variant={cfg.variant} size="sm">
          <Icon size={10} />
          {cfg.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-playfair text-2xl font-bold text-stone-900">
            {fmt(orden.totalEstimado, orden.moneda)}
          </p>
          <p className="text-[10px] font-dm text-stone-400">
            {orden.moneda} · {orden.detalles?.length ?? 0} ítem(s)
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-dm text-stone-500">
            {new Date(orden.fechaCreacion).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          {orden.fechaEntregaEstimada && (
            <p className="text-[10px] font-dm text-stone-400">
              Entrega:{" "}
              {new Date(orden.fechaEntregaEstimada).toLocaleDateString(
                "es-CO",
                { day: "2-digit", month: "short" },
              )}
            </p>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-stone-100 flex items-center justify-end">
        <span className="text-xs font-dm font-semibold text-amber-600 flex items-center gap-1 group-hover:gap-1.5 transition-all">
          Ver detalle <ArrowRight size={11} />
        </span>
      </div>
    </div>
  );
}

// ── OrdenDetalle — modal con acciones de flujo ─────────────────────────────
function ModalOrdenDetalle({ open, onClose, ordenId }) {
  const { data, loading } = useQuery(GET_ORDEN_COMPRA, {
    variables: { id: ordenId },
    skip: !ordenId || !open,
  });
  const [enviar, { loading: enviando }] = useMutation(ENVIAR_ORDEN_COMPRA, {
    refetchQueries: ["GetOrdenesCompra"],
  });
  const [cancelar, { loading: cancelando }] = useMutation(
    CANCELAR_ORDEN_COMPRA,
    { refetchQueries: ["GetOrdenesCompra"] },
  );
  const [mostrarRecepcion, setMostrarRecepcion] = useState(false);

  if (!open) return null;
  const orden = data?.ordenCompra;
  const cfg = orden ? (ESTADO_CFG[orden.estado] ?? ESTADO_CFG.BORRADOR) : null;
  const CfgIcon = cfg?.icon ?? Clock;

  const handleEnviar = async () => {
    const c = await Swal.fire({
      background: "#fff",
      icon: "question",
      iconColor: "#F59E0B",
      title: "¿Enviar orden al proveedor?",
      text: "El estado cambiará a ENVIADA. El proveedor deberá confirmar la recepción.",
      showCancelButton: true,
      confirmButtonColor: "#F59E0B",
      confirmButtonText: "Sí, enviar",
    });
    if (!c.isConfirmed) return;
    const { data: res } = await enviar({ variables: { id: ordenId } });
    if (!res.enviarOrdenCompra.ok) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: res.enviarOrdenCompra.error,
        confirmButtonColor: "#F59E0B",
      });
    }
  };

  const handleCancelar = async () => {
    const c = await Swal.fire({
      background: "#fff",
      icon: "warning",
      iconColor: "#ef4444",
      title: "¿Cancelar esta orden?",
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#E7E5E4",
      confirmButtonText: "Sí, cancelar",
    });
    if (!c.isConfirmed) return;
    await cancelar({ variables: { id: ordenId } });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle de orden de compra"
      size="lg"
    >
      {loading || !orden ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header orden */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-playfair text-stone-900 text-xl font-bold">
                {orden.proveedorNombre}
              </p>
              <p className="text-xs font-dm text-stone-400 mt-0.5">
                OC-{orden.id.slice(0, 8)} · {orden.moneda}
              </p>
            </div>
            <Badge variant={cfg.variant} size="md">
              <CfgIcon size={11} />
              {cfg.label}
            </Badge>
          </div>

          {/* Detalles */}
          <div className="rounded-2xl border border-stone-200 overflow-hidden">
            <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
              <p className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
                Ítems de la orden
              </p>
            </div>
            <div className="divide-y divide-stone-100">
              {orden.detalles?.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <FlaskConical size={13} className="text-stone-300 shrink-0" />
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
                      {parseFloat(d.cantidad).toFixed(3)}
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
                      <p className="text-[10px] font-dm text-emerald-600">
                        Rcbd: {parseFloat(d.cantidadRecibida).toFixed(3)}
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

          {/* Notas */}
          {orden.notas && (
            <div className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-200">
              <p className="text-xs font-dm text-stone-500 mb-1 font-semibold">
                Notas
              </p>
              <p className="text-sm font-dm text-stone-700">{orden.notas}</p>
            </div>
          )}

          {/* Acciones según estado */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            <div className="flex gap-2">
              {orden.estado === "PENDIENTE" && (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={cancelando}
                    onClick={handleCancelar}
                  >
                    <XCircle size={13} />
                    Cancelar orden
                  </Button>
                  <Button size="sm" loading={enviando} onClick={handleEnviar}>
                    <Send size={13} />
                    Enviar al proveedor
                  </Button>
                </>
              )}
              {orden.estado === "BORRADOR" && (
                <Button size="sm" loading={enviando} onClick={handleEnviar}>
                  <Send size={13} />
                  Confirmar y enviar
                </Button>
              )}
              {orden.estado === "ENVIADA" && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                  }}
                >
                  <CheckCircle2 size={13} />
                  Registrar recepción
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── CreateOrdenWizard — wizard de 3 pasos ─────────────────────────────────
const STEPS_ORDEN = ["Proveedor y destino", "Ítems", "Confirmar"];
const MONEDAS = ["COP", "USD", "EUR", "MXN", "ARS", "BRL", "CLP"];

export function CreateOrdenWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    proveedorId: "",
    restauranteId: "",
    moneda: "COP",
    fechaEntregaEstimada: "",
    notas: "",
  });
  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState({
    ingredienteId: "",
    nombreIngrediente: "",
    unidadMedida: "",
    cantidad: "",
    precioUnitario: "",
  });

  const { data: provData } = useQuery(GET_PROVEEDORES, {
    variables: { activo: true },
  });
  const { data: restData } = useQuery(GET_RESTAURANTES);
  const { data: ingData } = useQuery(GET_INGREDIENTES, {
    variables: { activo: true },
  });
  const [crearOrden, { loading }] = useMutation(CREAR_ORDEN_COMPRA, {
    refetchQueries: ["GetOrdenesCompra"],
  });

  const proveedores = provData?.proveedores ?? [];
  const restaurantes = restData?.restaurantes ?? [];
  const ingredientes = ingData?.ingredientes ?? [];

  const total = items.reduce(
    (acc, i) =>
      acc + (parseFloat(i.cantidad) || 0) * (parseFloat(i.precioUnitario) || 0),
    0,
  );
  const canNext0 = form.proveedorId && form.restauranteId && form.moneda;
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
        unidadMedida: ing?.unidadMedida ?? "",
        cantidad: parseFloat(itemForm.cantidad),
        precioUnitario: parseFloat(itemForm.precioUnitario),
      },
    ]);
    setItemForm({
      ingredienteId: "",
      nombreIngrediente: "",
      unidadMedida: "",
      cantidad: "",
      precioUnitario: "",
    });
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    const { data: res } = await crearOrden({
      variables: {
        proveedorId: form.proveedorId,
        restauranteId: form.restauranteId,
        moneda: form.moneda,
        detalles: items.map((i) => ({
          ingredienteId: i.ingredienteId,
          nombreIngrediente: i.nombreIngrediente,
          unidadMedida: i.unidadMedida,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
        })),
        fechaEntregaEstimada: form.fechaEntregaEstimada || null,
        notas: form.notas || null,
      },
    });
    if (res.crearOrdenCompra.ok) {
      await Swal.fire({
        background: "#fff",
        icon: "success",
        iconColor: "#F59E0B",
        title: "¡Orden creada!",
        html: `<span style="font-family:'DM Sans';color:#78716c">Total: ${fmt(total, form.moneda)} · ${items.length} ítem(s)</span>`,
        confirmButtonColor: "#F59E0B",
        confirmButtonText: "Ver órdenes",
      });
      navigate("/inventario/ordenes");
    } else {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: res.crearOrdenCompra.error,
        confirmButtonColor: "#F59E0B",
      });
    }
  };

  const proveedor = proveedores.find((p) => p.id === form.proveedorId);
  const restaurante = restaurantes.find((r) => r.id === form.restauranteId);

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/inventario/ordenes")}
        className="flex items-center gap-2 text-stone-400 hover:text-stone-700 transition text-sm mb-6 group"
      >
        <ArrowLeft
          size={14}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        Volver a órdenes
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-0.5 bg-amber-500 rounded-full" />
          <span className="text-[10px] font-dm font-bold tracking-[0.18em] uppercase text-amber-600">
            Nueva orden
          </span>
        </div>
        <h1 className="font-playfair text-3xl font-bold text-stone-900 mb-5">
          Crear orden de compra
        </h1>
        <StepIndicator steps={STEPS_ORDEN} current={step} />
      </div>

      <Card accent className="mb-5">
        {/* PASO 0 */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-playfair text-stone-900 text-xl font-bold">
                Proveedor y destino
              </h2>
              <p className="text-stone-400 text-sm mt-1 font-dm">
                Selecciona el proveedor y el restaurante de destino.
              </p>
            </div>
            <Select
              label="Proveedor"
              icon={Truck}
              value={form.proveedorId}
              onChange={(e) =>
                setForm({ ...form, proveedorId: e.target.value })
              }
            >
              <option value="">Selecciona un proveedor...</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.pais})
                </option>
              ))}
            </Select>
            <Select
              label="Restaurante destino"
              icon={Building2}
              value={form.restauranteId}
              onChange={(e) =>
                setForm({ ...form, restauranteId: e.target.value })
              }
            >
              <option value="">Selecciona un restaurante...</option>
              {restaurantes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} — {r.ciudad}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Moneda"
                icon={Coins}
                value={form.moneda}
                onChange={(e) => setForm({ ...form, moneda: e.target.value })}
              >
                {MONEDAS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              <Input
                label="Fecha de entrega estimada"
                type="datetime-local"
                value={form.fechaEntregaEstimada}
                onChange={(e) =>
                  setForm({ ...form, fechaEntregaEstimada: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-dm font-semibold text-stone-600">
                Notas (opcional)
              </label>
              <textarea
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                rows={3}
                placeholder="Instrucciones especiales para el proveedor..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none shadow-sm"
              />
            </div>
          </div>
        )}

        {/* PASO 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-playfair text-stone-900 text-xl font-bold">
                Ítems de la orden
              </h2>
              <p className="text-stone-400 text-sm mt-1 font-dm">
                Agrega los ingredientes que necesitas comprar.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3">
              <p className="text-xs font-dm font-semibold text-stone-600 uppercase tracking-wider">
                Agregar ítem
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px_100px_auto] gap-3 items-end">
                <Select
                  label="Ingrediente"
                  icon={FlaskConical}
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
                  <option value="">Selecciona...</option>
                  {ingredientes
                    .filter(
                      (i) => !items.some((it) => it.ingredienteId === i.id),
                    )
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre} ({i.unidadMedida})
                      </option>
                    ))}
                </Select>
                <Input
                  label="Cantidad"
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={itemForm.cantidad}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, cantidad: e.target.value })
                  }
                  placeholder="0.000"
                />
                <Input
                  label={`Precio/${itemForm.unidadMedida || "und"}`}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={itemForm.precioUnitario}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, precioUnitario: e.target.value })
                  }
                  placeholder="0.00"
                />
                <Button
                  onClick={addItem}
                  disabled={
                    !itemForm.ingredienteId ||
                    !itemForm.cantidad ||
                    !itemForm.precioUnitario
                  }
                  className="self-end"
                >
                  <Plus size={14} />
                  Agregar
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center py-10 rounded-2xl border-2 border-dashed border-stone-200">
                <ShoppingCart size={24} className="text-stone-200 mb-2" />
                <p className="text-stone-400 text-sm font-dm">
                  Sin ítems agregados
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
                    {items.length} ítem(s)
                  </p>
                  <p className="font-playfair font-bold text-amber-600">
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
                      className="text-amber-400 shrink-0"
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
                    <p className="font-playfair font-bold text-stone-900 shrink-0">
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
                <div className="flex justify-end px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-right">
                    <p className="text-xs font-dm text-amber-600">
                      Total estimado
                    </p>
                    <p className="font-playfair font-bold text-amber-700 text-xl">
                      {fmt(total, form.moneda)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASO 2 — confirmación */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-playfair text-stone-900 text-xl font-bold">
                Confirmar orden
              </h2>
              <p className="text-stone-400 text-sm mt-1 font-dm">
                Revisa antes de crear la orden de compra.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
              <div className="p-5 space-y-4">
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
                      Restaurante
                    </p>
                    <p className="font-dm text-stone-900 font-semibold mt-0.5">
                      {restaurante?.nombre}
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
                </div>
                <Divider label="Resumen" />
                <div className="space-y-1.5">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm font-dm"
                    >
                      <span className="text-stone-700">
                        {item.nombreIngrediente} × {item.cantidad}{" "}
                        {item.unidadMedida}
                      </span>
                      <span className="font-semibold text-stone-900">
                        {fmt(item.cantidad * item.precioUnitario, form.moneda)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-amber-200">
                  <span className="font-dm font-semibold text-amber-700">
                    Total estimado
                  </span>
                  <span className="font-playfair font-bold text-amber-700 text-xl">
                    {fmt(total, form.moneda)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
              <Truck size={15} className="text-blue-500 shrink-0" />
              <p className="text-sm font-dm text-blue-700">
                La orden se creará en estado <strong>BORRADOR</strong>. Podrás
                enviarla al proveedor desde el detalle.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() =>
            step === 0 ? navigate("/inventario/ordenes") : setStep(step - 1)
          }
        >
          <ArrowLeft size={14} />
          {step === 0 ? "Cancelar" : "Atrás"}
        </Button>
        {step < 2 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={step === 0 ? !canNext0 : !canNext1}
          >
            Siguiente <ArrowRight size={14} />
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={loading}>
            <CheckCircle2 size={14} />
            Crear orden
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Lista principal de órdenes ─────────────────────────────────────────────
export default function OrdenesCompra() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  const { data, loading } = useQuery(GET_ORDENES_COMPRA, {
    variables: { estado: filtroEstado === "all" ? undefined : filtroEstado },
  });

  const ordenes = data?.ordenesCompra ?? [];
  const porEstado = (e) => ordenes.filter((o) => o.estado === e).length;

  const filtered = ordenes.filter((o) =>
    (o.proveedorNombre ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory Service"
        title="Órdenes de compra"
        description="Gestiona el ciclo completo: crear → enviar → recibir mercancía."
        action={
          <div className="flex items-center gap-2">
            <StatCard
              label="Enviadas"
              value={porEstado("ENVIADA")}
              icon={Truck}
            />
            <StatCard
              label="Recibidas"
              value={porEstado("RECIBIDA")}
              icon={CheckCircle2}
              accent
            />
            <Button onClick={() => navigate("/inventario/ordenes/new")}>
              <Plus size={14} />
              Nueva orden
            </Button>
          </div>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
          <Search size={14} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por proveedor..."
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200 shadow-sm">
          {[
            "all",
            "BORRADOR",
            "PENDIENTE",
            "ENVIADA",
            "RECIBIDA",
            "CANCELADA",
          ].map((v) => (
            <button
              key={v}
              onClick={() => setFiltroEstado(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-dm font-medium transition-all whitespace-nowrap ${filtroEstado === v ? "bg-amber-500 text-white shadow-sm" : "text-stone-400 hover:text-stone-700"}`}
            >
              {v === "all" ? "Todas" : (ESTADO_CFG[v]?.label ?? v)}
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
          title="Sin órdenes"
          description="Crea la primera orden de compra."
          action={
            <Button onClick={() => navigate("/inventario/ordenes/new")}>
              <Plus size={14} />
              Nueva orden
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((o) => (
            <OrdenCard
              key={o.id}
              orden={o}
              onClick={() => setOrdenSeleccionada(o.id)}
            />
          ))}
        </div>
      )}

      <ModalOrdenDetalle
        open={!!ordenSeleccionada}
        onClose={() => setOrdenSeleccionada(null)}
        ordenId={ordenSeleccionada}
      />
    </div>
  );
}
