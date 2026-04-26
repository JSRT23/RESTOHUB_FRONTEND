// src/features/orders/components/Mesero/MMisPedidos.jsx
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Truck,
  RefreshCw,
  Tag,
  X,
  UtensilsCrossed,
  MapPin,
  AlertCircle,
  Receipt,
  Layers,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_PEDIDOS,
  GET_PEDIDO,
  CANCELAR_PEDIDO,
} from "../../graphql/operations";
import { EmptyState, Skeleton } from "../../../../shared/components/ui";

// ── Design tokens ──────────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const ESTADOS = {
  RECIBIDO: {
    label: "Recibido",
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: Clock,
    dot: "#3b82f6",
  },
  EN_PREPARACION: {
    label: "En preparación",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: ChefHat,
    dot: "#f59e0b",
  },
  LISTO: {
    label: "Listo",
    color: G[300],
    bg: G[50],
    border: G[100],
    icon: CheckCircle2,
    dot: G[300],
  },
  EN_CAMINO: {
    label: "En camino",
    color: "#7c3aed",
    bg: "#faf5ff",
    border: "#ddd6fe",
    icon: Truck,
    dot: "#7c3aed",
  },
  ENTREGADO: {
    label: "Entregado",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    icon: CheckCircle2,
    dot: "#16a34a",
  },
  CANCELADO: {
    label: "Cancelado",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: XCircle,
    dot: "#dc2626",
  },
};

const FILTROS = [
  { id: "todos", label: "Todos", estados: null },
  { id: "RECIBIDO", label: "Recibido", estados: ["RECIBIDO"] },
  { id: "EN_PREPARACION", label: "En prep.", estados: ["EN_PREPARACION"] },
  { id: "LISTO", label: "Listo ✓", estados: ["LISTO"] },
  { id: "ENTREGADO", label: "Entregado", estados: ["ENTREGADO"] },
  { id: "CANCELADO", label: "Cancelado", estados: ["CANCELADO"] },
];

const fmt = (n, m = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: m,
    maximumFractionDigits: 0,
  }).format(parseFloat(n) || 0);
const fmtH = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const mins = (iso) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 60000) : null;

// ── Modal de detalle ───────────────────────────────────────────────────────
function ModalDetalle({ pedidoId, onClose, onCancelar, cancelando }) {
  const { data, loading } = useQuery(GET_PEDIDO, {
    variables: { id: pedidoId },
    fetchPolicy: "cache-and-network",
    skip: !pedidoId,
  });

  // Cerrar con Escape
  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  // Bloquear scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const pedido = data?.pedido;
  const meta = pedido ? (ESTADOS[pedido.estado] ?? ESTADOS.RECIBIDO) : null;
  const Icon = meta?.icon ?? Clock;
  const puedeCancelar = pedido?.estado === "RECIBIDO";
  const m = mins(pedido?.fechaCreacion);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(5,31,32,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          maxHeight: "92dvh",
          boxShadow:
            "0 32px 80px rgba(5,31,32,0.25), 0 0 0 1px rgba(5,31,32,0.08)",
        }}
      >
        {/* Banda de color superior */}
        {meta && (
          <div
            className="h-1.5 w-full"
            style={{
              background: `linear-gradient(90deg,${meta.color},${meta.border})`,
            }}
          />
        )}

        {/* Header del modal */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {pedido?.numeroDia ? (
                <span className="font-dm text-xl font-bold text-stone-900">
                  Pedido #{pedido.numeroDia}
                </span>
              ) : null}
              <span className="font-mono text-xs font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-lg">
                #{pedidoId.slice(-8).toUpperCase()}
              </span>
              {pedido?.mesaId && (
                <span className="flex items-center gap-1 text-xs font-dm text-stone-500 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-lg">
                  <MapPin size={10} /> Mesa {pedido.mesaId.slice(-4)}
                </span>
              )}
            </div>
            {meta && (
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="flex items-center gap-1.5 text-xs font-dm font-bold px-2.5 py-1 rounded-xl"
                  style={{
                    background: meta.bg,
                    color: meta.color,
                    border: `1px solid ${meta.border}`,
                  }}
                >
                  <Icon size={11} />
                  {meta.label}
                </span>
                {m !== null && (
                  <span
                    className={`text-xs font-dm ${m > 20 ? "text-red-500 font-semibold" : "text-stone-400"}`}
                  >
                    · {m} min
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 rounded-xl" />
              ))}
            </div>
          ) : !pedido ? (
            <div className="flex flex-col items-center justify-center py-8 text-stone-400">
              <AlertCircle size={32} className="mb-2 opacity-40" />
              <p className="text-sm font-dm">No se pudo cargar el pedido</p>
            </div>
          ) : (
            <>
              {/* Ítems */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UtensilsCrossed size={13} className="text-stone-400" />
                  <span className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
                    Ítems ({pedido.detalles?.length ?? 0})
                  </span>
                </div>
                <div className="space-y-2">
                  {pedido.detalles?.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50"
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: G[300] }}
                      >
                        {d.cantidad}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-dm font-semibold text-stone-800 truncate">
                          {d.nombrePlato}
                        </p>
                        {d.notas && (
                          <p className="text-[11px] font-dm text-stone-400 italic truncate mt-0.5">
                            "{d.notas}"
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-dm font-bold text-stone-700">
                          {fmt(d.subtotal, pedido.moneda)}
                        </p>
                        <p className="text-[10px] text-stone-400 font-dm">
                          {fmt(d.precioUnitario, pedido.moneda)} c/u
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-2xl"
                style={{ background: G[900], color: "#fff" }}
              >
                <div className="flex items-center gap-2">
                  <Receipt size={14} className="opacity-70" />
                  <span className="text-sm font-dm font-semibold opacity-70">
                    Total
                  </span>
                </div>
                <span className="font-playfair text-lg font-bold">
                  {fmt(pedido.total, pedido.moneda)}
                </span>
              </div>

              {/* Seguimiento */}
              {pedido.seguimientos?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={13} className="text-stone-400" />
                    <span className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
                      Historial
                    </span>
                  </div>
                  <div className="relative pl-5">
                    {/* línea vertical */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-stone-200" />
                    <div className="space-y-3">
                      {pedido.seguimientos.map((s, i) => {
                        const sm = ESTADOS[s.estado] ?? ESTADOS.RECIBIDO;
                        const SI = sm.icon;
                        const isLast = i === pedido.seguimientos.length - 1;
                        return (
                          <div key={s.id} className="flex items-start gap-3">
                            <span
                              className="w-3.5 h-3.5 rounded-full border-2 border-white shrink-0 mt-0.5 relative z-10"
                              style={{
                                background: isLast ? sm.color : "#d1d5db",
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className="text-xs font-dm font-bold"
                                  style={{
                                    color: isLast ? sm.color : "#6b7280",
                                  }}
                                >
                                  {sm.label}
                                </span>
                                <span className="text-[10px] font-dm text-stone-400">
                                  {fmtH(s.fecha)}
                                </span>
                              </div>
                              {s.descripcion && (
                                <p className="text-[11px] font-dm text-stone-400 mt-0.5 truncate">
                                  {s.descripcion}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Info adicional */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-stone-50">
                  <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider mb-1">
                    Hora
                  </p>
                  <p className="text-sm font-dm font-semibold text-stone-700">
                    {fmtH(pedido.fechaCreacion)}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50">
                  <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider mb-1">
                    Canal
                  </p>
                  <p className="text-sm font-dm font-semibold text-stone-700">
                    {pedido.canal ?? "TPV"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer con acción */}
        {puedeCancelar && (
          <div className="px-6 pb-6 pt-3 border-t border-stone-100">
            <button
              onClick={() => {
                onClose();
                onCancelar(pedido);
              }}
              disabled={cancelando === pedidoId}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-dm font-bold transition-all"
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                border: "1.5px solid #fecaca",
              }}
            >
              {cancelando === pedidoId ? (
                <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
              ) : (
                <XCircle size={15} />
              )}
              Cancelar pedido
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Card de pedido (clickeable, sin barra de detalle) ──────────────────────
function PedidoCard({ pedido, onClick }) {
  const meta = ESTADOS[pedido.estado] ?? ESTADOS.RECIBIDO;
  const Icon = meta.icon;
  const m = mins(pedido.fechaCreacion);
  const urgent =
    m !== null && m > 20 && !["ENTREGADO", "CANCELADO"].includes(pedido.estado);

  return (
    <button
      onClick={() => onClick(pedido.id)}
      className="w-full text-left bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md active:scale-[0.99]"
      style={{
        borderColor: meta.border,
        boxShadow: urgent
          ? `0 0 0 2px ${meta.color}33, 0 2px 12px rgba(0,0,0,0.06)`
          : "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* barra superior */}
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg,${meta.color},${meta.border})`,
        }}
      />

      <div className="px-4 py-3.5 flex items-center gap-3">
        {/* Dot de estado */}
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            background: meta.dot,
            boxShadow: `0 0 0 3px ${meta.bg}`,
          }}
        />

        {/* ID + estado */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {pedido.numeroDia ? (
              <span className="font-dm text-sm font-bold text-stone-800">
                Pedido #{pedido.numeroDia}
              </span>
            ) : (
              <span className="font-mono text-xs font-bold text-stone-700">
                #{pedido.id.slice(-8).toUpperCase()}
              </span>
            )}
            {pedido.mesaId && (
              <span className="flex items-center gap-1 text-[10px] font-dm text-stone-400">
                <Tag size={8} /> Mesa
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Icon size={10} style={{ color: meta.color }} />
            <span
              className="text-xs font-dm font-semibold"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
            {m !== null && (
              <span
                className={`text-[10px] font-dm ${urgent ? "text-red-500 font-bold" : "text-stone-400"}`}
              >
                · {m}m
              </span>
            )}
          </div>
        </div>

        {/* Total + hora */}
        <div className="text-right shrink-0">
          <p className="text-sm font-dm font-bold text-stone-800">
            {fmt(pedido.total, pedido.moneda)}
          </p>
          <p className="text-[10px] font-dm text-stone-400 mt-0.5">
            {fmtH(pedido.fechaCreacion)}
          </p>
        </div>

        {/* Flecha hint */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="shrink-0 text-stone-300"
        >
          <path
            d="M5 3l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function MMisPedidos() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;
  const [cancelando, setCancelando] = useState(null);
  const [tab, setTab] = useState("activos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [pedidoModal, setPedidoModal] = useState(null);

  const { data, loading, refetch } = useQuery(GET_PEDIDOS, {
    variables: { restauranteId },
    fetchPolicy: "cache-and-network",
    pollInterval: 20000,
  });

  const [cancelarPedido] = useMutation(CANCELAR_PEDIDO, {
    refetchQueries: ["GetPedidos"],
  });

  const pedidos = data?.pedidos ?? [];
  const activos = pedidos.filter(
    (p) => !["ENTREGADO", "CANCELADO"].includes(p.estado),
  );
  const historial = pedidos.filter((p) =>
    ["ENTREGADO", "CANCELADO"].includes(p.estado),
  );
  const listos = activos.filter((p) => p.estado === "LISTO").length;

  const base = tab === "activos" ? activos : historial;
  const mostrar =
    filtroEstado === "todos"
      ? base
      : base.filter((p) => p.estado === filtroEstado);

  // Filtros disponibles según tab
  const filtrosTab = FILTROS.filter((f) => {
    if (f.id === "todos") return true;
    if (tab === "activos") return !["ENTREGADO", "CANCELADO"].includes(f.id);
    return ["ENTREGADO", "CANCELADO"].includes(f.id);
  });

  const handleCancelar = useCallback(
    async (pedido) => {
      const { isConfirmed } = await Swal.fire({
        background: "#fff",
        title: "¿Cancelar pedido?",
        html: `<span style="font-family:'DM Sans';color:#78716c">El pedido <b>${pedido.numeroDia ? `#${pedido.numeroDia}` : `#${pedido.id.slice(-8).toUpperCase()}`}</b> será cancelado permanentemente.</span>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#e5e7eb",
        confirmButtonText: "Sí, cancelar",
        cancelButtonText: "No",
      });
      if (!isConfirmed) return;
      setCancelando(pedido.id);
      try {
        const { data: res } = await cancelarPedido({
          variables: { id: pedido.id },
        });
        if (!res?.cancelarPedido?.ok)
          throw new Error(res?.cancelarPedido?.error ?? "Error al cancelar");
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
    },
    [cancelarPedido],
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-xl font-bold text-stone-900">
            Mis pedidos
          </h1>
          <p className="text-xs font-dm text-stone-400 mt-0.5">
            Pedidos de hoy — actualización cada 20s
          </p>
        </div>
        <div className="flex items-center gap-2">
          {listos > 0 && (
            <span
              className="flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-xl border"
              style={{ background: G[50], borderColor: G[100], color: G[300] }}
            >
              <CheckCircle2 size={12} /> {listos} listo{listos !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={() => refetch()}
            className="w-8 h-8 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Tabs Activos / Historial */}
      <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl w-fit">
        {[
          { v: "activos", l: "Activos", n: activos.length },
          { v: "historial", l: "Historial", n: historial.length },
        ].map(({ v, l, n }) => (
          <button
            key={v}
            onClick={() => {
              setTab(v);
              setFiltroEstado("todos");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-dm font-semibold transition-all"
            style={
              tab === v
                ? { background: G[900], color: "#fff" }
                : { color: "#78716c" }
            }
          >
            {l}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={
                tab === v
                  ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                  : { background: "#f5f5f4", color: "#a8a29e" }
              }
            >
              {n}
            </span>
          </button>
        ))}
      </div>

      {/* Filtros por estado */}
      {base.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {filtrosTab.map((f) => {
            const count =
              f.id === "todos"
                ? base.length
                : base.filter((p) => p.estado === f.id).length;
            if (f.id !== "todos" && count === 0) return null;
            const em = f.id !== "todos" ? ESTADOS[f.id] : null;
            const active = filtroEstado === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFiltroEstado(f.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-dm font-semibold whitespace-nowrap transition-all border shrink-0"
                style={
                  active
                    ? {
                        background: em ? em.color : G[900],
                        color: "#fff",
                        borderColor: "transparent",
                      }
                    : {
                        background: "#fff",
                        color: "#78716c",
                        borderColor: "#e7e5e4",
                      }
                }
              >
                {em && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: active ? "#fff" : em.color }}
                  />
                )}
                {f.label}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={
                    active
                      ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                      : { background: "#f5f5f4", color: "#a8a29e" }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : mostrar.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={tab === "activos" ? "Sin pedidos activos" : "Sin historial"}
          description={
            tab === "activos"
              ? "Todos tus pedidos de hoy están finalizados."
              : "Aún no hay pedidos entregados o cancelados hoy."
          }
        />
      ) : (
        <div className="space-y-2.5">
          {mostrar.map((p) => (
            <PedidoCard key={p.id} pedido={p} onClick={setPedidoModal} />
          ))}
        </div>
      )}

      {/* Modal */}
      {pedidoModal && (
        <ModalDetalle
          pedidoId={pedidoModal}
          onClose={() => setPedidoModal(null)}
          onCancelar={handleCancelar}
          cancelando={cancelando}
        />
      )}
    </div>
  );
}
