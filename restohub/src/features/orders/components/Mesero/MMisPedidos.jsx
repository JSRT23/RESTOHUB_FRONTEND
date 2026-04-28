// src/features/orders/components/Mesero/MMisPedidos.jsx
// CAMBIOS:
//  - Muestra solo pedidos del DÍA por defecto (filtro por fecha en cliente)
//  - Botón "Historial" → modal con todos los pedidos históricos
//  - La lógica de detalle, cancelar, estados es idéntica al original

import { useState, useEffect, useCallback, useMemo } from "react";
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
  History,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_PEDIDOS,
  GET_PEDIDO,
  CANCELAR_PEDIDO,
} from "../../graphql/operations";
import { gql } from "@apollo/client";
const GET_PLATOS_IMG = gql`
  query GetPlatosImgM($disponibles: ID, $activo: Boolean) {
    platos(disponibles: $disponibles, activo: $activo) {
      id
      imagen
    }
  }
`;
import { EmptyState, Skeleton } from "../../../../shared/components/ui";

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
    label: "Listo ✓",
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
const fmtFecha = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
      })
    : "—";
const mins = (iso) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 60000) : null;
const esHoy = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  const hoy = new Date();
  return (
    d.getFullYear() === hoy.getFullYear() &&
    d.getMonth() === hoy.getMonth() &&
    d.getDate() === hoy.getDate()
  );
};

// ── Modal detalle (idéntico al original) ─────────────────────────────────
function ModalDetalle({
  pedidoId,
  onClose,
  onCancelar,
  cancelando,
  imagenMap,
}) {
  const { data, loading } = useQuery(GET_PEDIDO, {
    variables: { id: pedidoId },
    fetchPolicy: "cache-and-network",
    skip: !pedidoId,
  });
  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
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
        {meta && (
          <div
            className="h-1.5 w-full"
            style={{
              background: `linear-gradient(90deg,${meta.color},${meta.border})`,
            }}
          />
        )}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {pedido?.numeroDia && (
                <span className="font-dm text-xl font-bold text-stone-900">
                  Pedido #{pedido.numeroDia}
                </span>
              )}
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
                  <Icon size={11} /> {meta.label}
                </span>
                {m !== null && (
                  <span className="text-[10px] font-dm text-stone-400">
                    hace {m}min
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 hover:bg-stone-200 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : pedido ? (
            <>
              <div className="space-y-2">
                {pedido.detalles?.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-stone-50 border border-stone-100"
                  >
                    {/* Imagen del plato */}
                    <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden bg-stone-200 flex items-center justify-center">
                      {d.imagenPlato || imagenMap?.[d.platoId] ? (
                        <img
                          src={d.imagenPlato || imagenMap[d.platoId]}
                          alt={d.nombrePlato}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-stone-400 text-lg">🍽</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-dm font-semibold text-stone-800 truncate">
                        {d.nombrePlato}
                      </p>
                      <p className="text-[11px] font-dm text-stone-400">
                        {fmt(d.precioUnitario, pedido.moneda)} c/u
                      </p>
                      {d.notas && (
                        <p className="text-[10px] font-dm text-amber-600 italic truncate">
                          "{d.notas}"
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-dm font-bold text-stone-800">
                        {fmt(d.subtotal, pedido.moneda)}
                      </p>
                      <p className="text-[10px] font-dm text-stone-400">
                        × {d.cantidad}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {pedido.detalles?.some((d) => d.notas) && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <AlertCircle
                    size={13}
                    className="text-amber-500 mt-0.5 shrink-0"
                  />
                  <div className="space-y-1">
                    {pedido.detalles
                      .filter((d) => d.notas)
                      .map((d) => (
                        <p
                          key={d.id}
                          className="text-xs font-dm text-amber-700"
                        >
                          <span className="font-semibold">
                            {d.nombrePlato}:
                          </span>{" "}
                          {d.notas}
                        </p>
                      ))}
                  </div>
                </div>
              )}
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
                style={{ background: `${G[50]}88`, borderColor: G[100] }}
              >
                <span
                  className="text-sm font-dm font-semibold"
                  style={{ color: G[500] }}
                >
                  Total
                </span>
                <span
                  className="font-playfair text-lg font-bold"
                  style={{ color: G[500] }}
                >
                  {fmt(pedido.total, pedido.moneda)}
                </span>
              </div>

              {/* Historial de seguimiento */}
              {pedido.seguimientos?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={13} className="text-stone-400" />
                    <span className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
                      Historial
                    </span>
                  </div>
                  <div className="relative pl-5">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-stone-200" />
                    <div className="space-y-3">
                      {pedido.seguimientos.map((s, i) => {
                        const sm = ESTADOS[s.estado] ?? ESTADOS.RECIBIDO;
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

              {/* Hora y canal */}
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
          ) : null}
        </div>

        {puedeCancelar && (
          <div className="px-6 pb-5 pt-3 border-t border-stone-100">
            <button
              disabled={cancelando}
              onClick={() => onCancelar(pedidoId)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-dm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle size={14} /> Cancelar pedido
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Modal historial ───────────────────────────────────────────────────────
function ModalHistorial({ pedidos, onClose, onVer }) {
  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const historico = useMemo(
    () =>
      [...pedidos].sort(
        (a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion),
      ),
    [pedidos],
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(5,31,32,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          maxHeight: "92dvh",
          boxShadow: "0 32px 80px rgba(5,31,32,0.25)",
        }}
      >
        <div
          className="h-1"
          style={{ background: `linear-gradient(90deg,${G[300]},${G[100]})` }}
        />
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: G[50] }}
            >
              <History size={16} style={{ color: G[300] }} />
            </div>
            <div>
              <p className="font-playfair text-lg font-bold text-stone-900">
                Historial de pedidos
              </p>
              <p className="text-[11px] font-dm text-stone-400">
                {historico.length} pedido{historico.length !== 1 ? "s" : ""} en
                total
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 hover:bg-stone-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {historico.map((p) => {
            const meta = ESTADOS[p.estado] ?? ESTADOS.RECIBIDO;
            const Icon = meta.icon;
            return (
              <button
                key={p.id}
                onClick={() => {
                  onClose();
                  onVer(p.id);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all text-left"
              >
                <span
                  className="flex items-center gap-1 text-[10px] font-dm font-bold px-2 py-1 rounded-lg shrink-0"
                  style={{
                    background: meta.bg,
                    color: meta.color,
                    border: `1px solid ${meta.border}`,
                  }}
                >
                  <Icon size={9} /> {meta.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-dm font-semibold text-stone-800">
                    {p.numeroDia
                      ? `Pedido #${p.numeroDia}`
                      : `#${p.id.slice(-6).toUpperCase()}`}
                  </p>
                  <p className="text-[10px] font-dm text-stone-400">
                    {fmtFecha(p.fechaCreacion)} · {fmtH(p.fechaCreacion)}
                  </p>
                </div>
                <span className="font-playfair font-bold text-stone-800 shrink-0">
                  {fmt(p.total, p.moneda)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── PedidoCard (solo día) ─────────────────────────────────────────────────
function PedidoCard({ pedido, onClick }) {
  const meta = ESTADOS[pedido.estado] ?? ESTADOS.RECIBIDO;
  const Icon = meta.icon;
  const m = mins(pedido.fechaCreacion);
  const urgente = pedido.estado === "RECIBIDO" && m !== null && m > 20;
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border overflow-hidden hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
      style={{
        borderColor: urgente ? "#fecaca" : meta.border,
        boxShadow: urgente
          ? "0 0 0 2px #fecaca, 0 4px 16px rgba(0,0,0,0.06)"
          : "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <div className="h-0.5 w-full" style={{ background: meta.color }} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-playfair text-stone-900 font-bold text-base leading-tight">
              {pedido.numeroDia
                ? `Pedido #${pedido.numeroDia}`
                : `#${pedido.id.slice(-6).toUpperCase()}`}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {pedido.mesaId && (
                <span className="flex items-center gap-1 text-[10px] font-dm text-stone-500">
                  <MapPin size={9} /> Mesa {pedido.mesaId.slice(-4)}
                </span>
              )}
              <span className="text-[10px] font-dm text-stone-400">
                {fmtH(pedido.fechaCreacion)}
              </span>
              {m !== null && (
                <span
                  className={`text-[10px] font-dm font-semibold ${urgente ? "text-red-500" : "text-stone-400"}`}
                >
                  · {m}min
                </span>
              )}
            </div>
          </div>
          <span
            className="flex items-center gap-1 text-[11px] font-dm font-bold px-2.5 py-1 rounded-xl shrink-0"
            style={{
              background: meta.bg,
              color: meta.color,
              border: `1px solid ${meta.border}`,
            }}
          >
            <Icon size={10} /> {meta.label}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-dm text-stone-400">
            {pedido.detalles?.length ?? 0} ítem
            {(pedido.detalles?.length ?? 0) !== 1 ? "s" : ""}
          </p>
          <p className="font-playfair font-bold text-stone-900">
            {fmt(pedido.total, pedido.moneda)}
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function MMisPedidos() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;
  const [filtro, setFiltro] = useState("activos");
  const [detalle, setDetalle] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);

  const { data, loading, refetch } = useQuery(GET_PEDIDOS, {
    variables: { restauranteId },
    fetchPolicy: "cache-and-network",
    pollInterval: 15000,
    skip: !restauranteId,
  });

  const { data: platosImgData } = useQuery(GET_PLATOS_IMG, {
    variables: { disponibles: restauranteId, activo: true },
    skip: !restauranteId,
    fetchPolicy: "cache-first",
  });
  const imagenMap = useMemo(() => {
    const map = {};
    (platosImgData?.platos ?? []).forEach((p) => {
      map[p.id] = p.imagen;
    });
    return map;
  }, [platosImgData]);

  const [cancelarPedido] = useMutation(CANCELAR_PEDIDO, {
    refetchQueries: ["GetPedidos"],
  });

  const todos = data?.pedidos ?? [];

  // Filtrar solo pedidos de HOY
  const pedidosHoy = useMemo(
    () => todos.filter((p) => esHoy(p.fechaCreacion)),
    [todos],
  );

  const activos = useMemo(
    () =>
      pedidosHoy.filter((p) => !["ENTREGADO", "CANCELADO"].includes(p.estado)),
    [pedidosHoy],
  );
  const entregados = useMemo(
    () => pedidosHoy.filter((p) => p.estado === "ENTREGADO"),
    [pedidosHoy],
  );
  const cancelados = useMemo(
    () => pedidosHoy.filter((p) => p.estado === "CANCELADO"),
    [pedidosHoy],
  );

  const filtrados = useMemo(() => {
    if (filtro === "activos") return activos;
    if (filtro === "entregados") return entregados;
    if (filtro === "cancelados") return cancelados;
    return pedidosHoy;
  }, [filtro, activos, entregados, cancelados, pedidosHoy]);

  const handleCancelar = useCallback(
    async (id) => {
      const { isConfirmed } = await Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "¿Cancelar pedido?",
        html: `<span style="font-family:'DM Sans';color:#78716c">Esta acción no se puede deshacer.</span>`,
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#e5e7eb",
        confirmButtonText: "Sí, cancelar",
        cancelButtonText: "Volver",
      });
      if (!isConfirmed) return;
      setCancelando(true);
      try {
        await cancelarPedido({ variables: { id } });
        setDetalle(null);
      } finally {
        setCancelando(false);
      }
    },
    [cancelarPedido],
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[10px] font-dm font-bold tracking-[0.18em] uppercase mb-1"
            style={{ color: G[300] }}
          >
            Mesero
          </p>
          <h1 className="font-playfair text-2xl font-bold text-stone-900">
            Mis pedidos de hoy
          </h1>
          <p className="text-sm font-dm text-stone-400 mt-0.5">
            {pedidosHoy.length} pedido{pedidosHoy.length !== 1 ? "s" : ""} ·{" "}
            {new Date().toLocaleDateString("es-CO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowHistorial(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-dm font-semibold border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <History size={13} /> Historial
          </button>
          <button
            onClick={() => refetch()}
            className="w-8 h-8 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* KPIs rápidos del día */}
      {pedidosHoy.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "Activos",
              n: activos.length,
              color: "#d97706",
              bg: "#fffbeb",
            },
            {
              label: "Entregados",
              n: entregados.length,
              color: G[300],
              bg: G[50],
            },
            {
              label: "Cancelados",
              n: cancelados.length,
              color: "#dc2626",
              bg: "#fef2f2",
            },
          ].map(({ label, n, color, bg }) => (
            <div
              key={label}
              className="text-center py-3 rounded-2xl border"
              style={{ background: bg, borderColor: `${color}40` }}
            >
              <p className="font-playfair text-2xl font-bold" style={{ color }}>
                {n}
              </p>
              <p
                className="text-[10px] font-dm font-semibold"
                style={{ color }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl overflow-x-auto">
        {[
          { v: "activos", l: "Activos", n: activos.length },
          { v: "entregados", l: "Entregados", n: entregados.length },
          { v: "cancelados", l: "Cancelados", n: cancelados.length },
          { v: "todos", l: "Todos", n: pedidosHoy.length },
        ].map(({ v, l, n }) => (
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
              className="text-[9px] px-1 rounded-full font-bold"
              style={
                filtro === v
                  ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                  : { background: "#f5f5f4", color: "#a8a29e" }
              }
            >
              {n}
            </span>
          </button>
        ))}
      </div>

      {/* Grid de pedidos del día */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={
            filtro === "activos"
              ? "Sin pedidos activos"
              : "Sin pedidos en este filtro"
          }
          description={
            filtro === "activos"
              ? "Todos los pedidos de hoy están entregados o no hay pedidos aún."
              : "No hay pedidos que coincidan con este filtro."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtrados.map((p) => (
            <PedidoCard
              key={p.id}
              pedido={p}
              onClick={() => setDetalle(p.id)}
            />
          ))}
        </div>
      )}

      {detalle && (
        <ModalDetalle
          pedidoId={detalle}
          onClose={() => setDetalle(null)}
          onCancelar={handleCancelar}
          cancelando={cancelando}
          imagenMap={imagenMap}
        />
      )}
      {showHistorial && (
        <ModalHistorial
          pedidos={todos}
          onClose={() => setShowHistorial(false)}
          onVer={(id) => setDetalle(id)}
        />
      )}
    </div>
  );
}
