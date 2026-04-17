// src/features/orders/components/Mesero/MMisPedidos.jsx
// Mesero — seguimiento de los pedidos que tomó hoy.
// Ve el estado de cada pedido, puede ver el detalle y cancelar si está en RECIBIDO.
// Ruta: /mesero/pedidos

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Truck,
  RefreshCw,
  AlertTriangle,
  Tag,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_PEDIDOS,
  GET_PEDIDO,
  CANCELAR_PEDIDO,
} from "../../graphql/operations";
import { EmptyState, Skeleton, Badge } from "../../../../shared/components/ui";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const ESTADO = {
  RECIBIDO: {
    label: "Recibido",
    bg: "#eff6ff",
    text: "#3b82f6",
    border: "#bfdbfe",
    icon: Clock,
  },
  EN_PREPARACION: {
    label: "En preparación",
    bg: "#fffbeb",
    text: "#d97706",
    border: "#fde68a",
    icon: ChefHat,
  },
  LISTO: {
    label: "Listo ✓",
    bg: G[50],
    text: G[300],
    border: G[100],
    icon: CheckCircle2,
  },
  EN_CAMINO: {
    label: "En camino",
    bg: "#faf5ff",
    text: "#7c3aed",
    border: "#ddd6fe",
    icon: Truck,
  },
  ENTREGADO: {
    label: "Entregado",
    bg: "#f0fdf4",
    text: "#16a34a",
    border: "#bbf7d0",
    icon: CheckCircle2,
  },
  CANCELADO: {
    label: "Cancelado",
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
    icon: XCircle,
  },
};

const fmtMoney = (n, moneda = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(n ?? 0);
const fmtHora = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const minutosDesde = (iso) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 60000) : null;

// ── Detalle expandible ─────────────────────────────────────────────────────
function DetallePedido({ pedidoId }) {
  const { data, loading } = useQuery(GET_PEDIDO, {
    variables: { id: pedidoId },
    fetchPolicy: "cache-and-network",
  });

  if (loading)
    return (
      <div className="space-y-1.5 pt-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-8 rounded-lg" />
        ))}
      </div>
    );

  const pedido = data?.pedido;
  if (!pedido) return null;

  return (
    <div className="pt-3 border-t border-stone-100 space-y-2">
      {pedido.detalles?.map((d) => (
        <div key={d.id} className="flex items-center gap-2.5">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-dm text-white shrink-0"
            style={{ background: G[300] }}
          >
            {d.cantidad}
          </span>
          <p className="flex-1 text-sm font-dm text-stone-700">
            {d.nombrePlato}
          </p>
          {d.notas && (
            <span className="text-[10px] font-dm text-stone-400 italic truncate max-w-[100px]">
              "{d.notas}"
            </span>
          )}
          <p className="text-sm font-dm font-semibold text-stone-600 shrink-0">
            {fmtMoney(d.subtotal, pedido.moneda)}
          </p>
        </div>
      ))}

      {/* Seguimiento */}
      {pedido.seguimientos?.length > 0 && (
        <div className="pt-2 border-t border-stone-100 space-y-1">
          {pedido.seguimientos.slice(-3).map((s) => {
            const meta = ESTADO[s.estado] ?? ESTADO.RECIBIDO;
            const Icon = meta.icon;
            return (
              <div
                key={s.id}
                className="flex items-center gap-2 text-[10px] font-dm text-stone-400"
              >
                <Icon size={10} style={{ color: meta.text }} />
                <span style={{ color: meta.text }} className="font-semibold">
                  {meta.label}
                </span>
                <span>· {fmtHora(s.fecha)}</span>
                {s.descripcion && (
                  <span className="truncate">· {s.descripcion}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Card de pedido ─────────────────────────────────────────────────────────
function PedidoCard({ pedido, onCancelar, cancelando }) {
  const [expandido, setExpandido] = useState(false);
  const meta = ESTADO[pedido.estado] ?? ESTADO.RECIBIDO;
  const Icon = meta.icon;
  const mins = minutosDesde(pedido.fechaCreacion);
  const puedeCancelar = pedido.estado === "RECIBIDO";
  const loading = cancelando === pedido.id;

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden transition-all"
      style={{
        borderColor: meta.border,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg,${meta.text},${meta.border})`,
        }}
      />
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg">
                #{pedido.id.slice(-8).toUpperCase()}
              </span>
              {pedido.mesaId && (
                <Badge variant="muted" size="xs">
                  <Tag size={8} /> Mesa {pedido.mesaId.slice(-4)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Icon size={12} style={{ color: meta.text }} />
              <span
                className="text-xs font-dm font-bold"
                style={{ color: meta.text }}
              >
                {meta.label}
              </span>
              {mins !== null && (
                <span
                  className={`text-[10px] font-dm ml-1 ${mins > 20 ? "text-red-500 font-semibold" : "text-stone-400"}`}
                >
                  · {mins}m
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-playfair text-stone-900 font-bold">
              {fmtMoney(pedido.total, pedido.moneda)}
            </p>
            <p className="text-[10px] font-dm text-stone-400 mt-0.5">
              {fmtHora(pedido.fechaCreacion)}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpandido(!expandido)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-dm font-semibold text-stone-500 bg-stone-50 hover:bg-stone-100 transition-colors"
          >
            {expandido ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expandido ? "Ocultar" : "Ver detalle"}
          </button>
          {puedeCancelar && (
            <button
              onClick={() => onCancelar(pedido)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-dm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="w-3 h-3 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <XCircle size={12} />
              )}
              Cancelar
            </button>
          )}
        </div>

        {expandido && <DetallePedido pedidoId={pedido.id} />}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
function hoy() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function MMisPedidos() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;
  const [cancelando, setCancelando] = useState(null);
  const [filtro, setFiltro] = useState("activos");

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
  const mostrar = filtro === "activos" ? activos : historial;

  // Conteo por estado
  const listos = activos.filter((p) => p.estado === "LISTO").length;

  const handleCancelar = async (pedido) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      title: "¿Cancelar pedido?",
      html: `<span style="font-family:'DM Sans';color:#78716c">El pedido <b>#${pedido.id.slice(-8).toUpperCase()}</b> será cancelado.</span>`,
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
      if (!res?.cancelarPedido?.id) throw new Error("Error al cancelar");
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

      {/* Tabs activos / historial */}
      <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl w-fit">
        {[
          { v: "activos", l: "Activos", n: activos.length },
          { v: "historial", l: "Historial", n: historial.length },
        ].map(({ v, l, n }) => (
          <button
            key={v}
            onClick={() => setFiltro(v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-dm font-semibold transition-all"
            style={
              filtro === v
                ? { background: G[900], color: "#fff" }
                : { color: "#78716c" }
            }
          >
            {l}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
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

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : mostrar.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={filtro === "activos" ? "Sin pedidos activos" : "Sin historial"}
          description={
            filtro === "activos"
              ? "Todos tus pedidos de hoy están finalizados."
              : "Aún no hay pedidos entregados o cancelados hoy."
          }
        />
      ) : (
        <div className="space-y-3">
          {mostrar.map((p) => (
            <PedidoCard
              key={p.id}
              pedido={p}
              onCancelar={handleCancelar}
              cancelando={cancelando}
            />
          ))}
        </div>
      )}
    </div>
  );
}
