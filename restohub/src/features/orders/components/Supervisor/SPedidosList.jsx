// src/features/orders/components/Supervisor/SPedidosList.jsx
// Supervisor — tablero de pedidos activos del restaurante.
// Acciones: confirmar (RECIBIDO→EN_PREPARACION), marcar listo, entregar, cancelar.
// Auto-poll cada 30s para tiempo real.
// Ruta: /supervisor/pedidos

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  ChefHat,
  Truck,
  Package,
  Search,
  RefreshCw,
  AlertTriangle,
  Coins,
  ArrowRight,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_PEDIDOS,
  CONFIRMAR_PEDIDO,
  CANCELAR_PEDIDO,
  MARCAR_LISTO_PEDIDO,
  ENTREGAR_PEDIDO,
} from "../../graphql/operations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
  Modal,
} from "../../../../shared/components/ui";

// ── Paleta ─────────────────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

// ── Helpers ────────────────────────────────────────────────────────────────
const ESTADO = {
  RECIBIDO: {
    label: "Recibido",
    bg: "#eff6ff",
    text: "#3b82f6",
    border: "#bfdbfe",
    dot: "bg-blue-500",
  },
  EN_PREPARACION: {
    label: "En preparación",
    bg: "#fffbeb",
    text: "#d97706",
    border: "#fde68a",
    dot: "bg-amber-400",
  },
  LISTO: {
    label: "Listo",
    bg: G[50],
    text: G[300],
    border: G[100],
    dot: "bg-emerald-500",
  },
  EN_CAMINO: {
    label: "En camino",
    bg: "#faf5ff",
    text: "#7c3aed",
    border: "#ddd6fe",
    dot: "bg-violet-500",
  },
  ENTREGADO: {
    label: "Entregado",
    bg: "#f0fdf4",
    text: "#16a34a",
    border: "#bbf7d0",
    dot: "bg-emerald-600",
  },
  CANCELADO: {
    label: "Cancelado",
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
    dot: "bg-red-500",
  },
};

const CANAL = {
  TPV: "TPV",
  APP: "App",
  UBER_EATS: "Uber Eats",
  RAPPI: "Rappi",
};

const PRIORIDAD = {
  4: { label: "Urgente", color: "#dc2626" },
  3: { label: "Alta", color: "#d97706" },
  2: { label: "Normal", color: "#64748b" },
  1: { label: "Baja", color: "#a8a29e" },
};

function fmtHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtMoney(n, moneda = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}
function minutosDesde(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

// ── Tarjeta de pedido ──────────────────────────────────────────────────────
function PedidoCard({ pedido, onAccion, actuando }) {
  const meta = ESTADO[pedido.estado] ?? ESTADO.RECIBIDO;
  const prio = PRIORIDAD[pedido.prioridad] ?? PRIORIDAD[2];
  const mins = minutosDesde(pedido.fechaCreacion);
  const loading = actuando === pedido.id;

  // Botón de acción principal según estado
  const accionPrincipal = {
    RECIBIDO: {
      label: "Confirmar",
      accion: "confirmar",
      style: { background: G[900], color: "#fff" },
    },
    EN_PREPARACION: {
      label: "Marcar listo",
      accion: "marcar_listo",
      style: { background: "#f59e0b", color: "#fff" },
    },
    LISTO: {
      label: "Entregar",
      accion: "entregar",
      style: { background: "#16a34a", color: "#fff" },
    },
  }[pedido.estado];

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden transition-all duration-200"
      style={{
        borderColor: meta.border,
        boxShadow:
          pedido.prioridad >= 3
            ? `0 0 0 2px ${prio.color}33, 0 4px 16px rgba(0,0,0,0.08)`
            : "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Tira de estado */}
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, ${meta.text}, ${meta.border})`,
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
              <span className="text-[10px] font-dm text-stone-400">
                {CANAL[pedido.canal] ?? pedido.canal}
              </span>
              {pedido.mesaId && (
                <span className="text-[10px] font-dm font-semibold text-stone-500">
                  Mesa
                </span>
              )}
              {pedido.prioridad >= 3 && (
                <span
                  className="text-[10px] font-dm font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: `${prio.color}18`, color: prio.color }}
                >
                  {prio.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              <span
                className="text-xs font-dm font-semibold"
                style={{ color: meta.text }}
              >
                {meta.label}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-playfair text-stone-900 font-bold text-base">
              {fmtMoney(pedido.total, pedido.moneda)}
            </p>
            <p className="text-[10px] font-dm text-stone-400 mt-0.5">
              {fmtHora(pedido.fechaCreacion)}
              {mins !== null && (
                <span
                  className={`ml-1 font-semibold ${mins > 15 ? "text-red-500" : mins > 8 ? "text-amber-500" : "text-stone-400"}`}
                >
                  · {mins}m
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Acciones */}
        {(accionPrincipal ||
          !["ENTREGADO", "CANCELADO"].includes(pedido.estado)) && (
          <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
            {accionPrincipal && (
              <button
                onClick={() => onAccion(pedido, accionPrincipal.accion)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-dm font-bold transition-all disabled:opacity-60"
                style={accionPrincipal.style}
              >
                {loading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  accionPrincipal.label
                )}
              </button>
            )}
            {!["ENTREGADO", "CANCELADO"].includes(pedido.estado) && (
              <button
                onClick={() => onAccion(pedido, "cancelar")}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-dm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <XCircle size={11} /> Cancelar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Columna kanban ─────────────────────────────────────────────────────────
function Columna({ estado, pedidos, onAccion, actuando }) {
  const meta = ESTADO[estado] ?? ESTADO.RECIBIDO;
  return (
    <div className="flex flex-col gap-3 min-w-0">
      {/* Header columna */}
      <div className="flex items-center gap-2 px-1">
        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
        <span className="text-xs font-dm font-bold text-stone-700">
          {meta.label}
        </span>
        <span
          className="ml-auto text-[10px] font-dm font-semibold px-2 py-0.5 rounded-full"
          style={{ background: meta.bg, color: meta.text }}
        >
          {pedidos.length}
        </span>
      </div>
      {/* Tarjetas */}
      {pedidos.length === 0 ? (
        <div className="flex items-center justify-center py-8 rounded-2xl border-2 border-dashed border-stone-200">
          <p className="text-xs font-dm text-stone-300">Sin pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((p) => (
            <PedidoCard
              key={p.id}
              pedido={p}
              onAccion={onAccion}
              actuando={actuando}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
const COLUMNAS_ACTIVAS = ["RECIBIDO", "EN_PREPARACION", "LISTO"];

export default function SPedidosList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;
  const [search, setSearch] = useState("");
  const [actuando, setActuando] = useState(null);
  const [verHistorial, setVerHistorial] = useState(false);

  const { data, loading, refetch } = useQuery(GET_PEDIDOS, {
    variables: { restauranteId },
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });

  const [confirmar] = useMutation(CONFIRMAR_PEDIDO, {
    refetchQueries: ["GetPedidos"],
  });
  const [cancelar] = useMutation(CANCELAR_PEDIDO, {
    refetchQueries: ["GetPedidos"],
  });
  const [marcarListo] = useMutation(MARCAR_LISTO_PEDIDO, {
    refetchQueries: ["GetPedidos"],
  });
  const [entregar] = useMutation(ENTREGAR_PEDIDO, {
    refetchQueries: ["GetPedidos"],
  });

  const pedidos = data?.pedidos ?? [];

  const activos = pedidos.filter((p) => COLUMNAS_ACTIVAS.includes(p.estado));
  const historial = pedidos.filter((p) =>
    ["ENTREGADO", "CANCELADO", "EN_CAMINO"].includes(p.estado),
  );
  const urgentes = activos.filter((p) => p.prioridad >= 3).length;

  const columnas = useMemo(() => {
    const q = search.toLowerCase().trim();
    const fuente = verHistorial ? historial : activos;
    const filtrados = q
      ? fuente.filter(
          (p) =>
            p.id.toLowerCase().includes(q) ||
            CANAL[p.canal]?.toLowerCase().includes(q),
        )
      : fuente;
    // Ordenar por prioridad desc + fecha asc
    const sorted = [...filtrados].sort(
      (a, b) =>
        b.prioridad - a.prioridad ||
        new Date(a.fechaCreacion) - new Date(b.fechaCreacion),
    );
    if (verHistorial)
      return {
        ENTREGADO: sorted.filter((p) => p.estado === "ENTREGADO"),
        CANCELADO: sorted.filter((p) => p.estado === "CANCELADO"),
        EN_CAMINO: sorted.filter((p) => p.estado === "EN_CAMINO"),
      };
    return Object.fromEntries(
      COLUMNAS_ACTIVAS.map((e) => [e, sorted.filter((p) => p.estado === e)]),
    );
  }, [pedidos, search, verHistorial]);

  const handleAccion = async (pedido, accion) => {
    if (accion === "cancelar") {
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
    }

    setActuando(pedido.id);
    try {
      const mutations = {
        confirmar: confirmar,
        cancelar: cancelar,
        marcar_listo: marcarListo,
        entregar: entregar,
      };
      const mutation = mutations[accion];
      if (!mutation) return;
      const { data: res } = await mutation({ variables: { id: pedido.id } });
      // Cada mutation devuelve el pedido con el nuevo estado
      const resultado =
        res?.confirmarPedido ??
        res?.cancelarPedido ??
        res?.marcarListoPedido ??
        res?.entregarPedido;
      if (!resultado?.id) throw new Error("Error al actualizar el pedido");
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setActuando(null);
    }
  };

  const columnasActuales = verHistorial
    ? [
        ["ENTREGADO", columnas.ENTREGADO ?? []],
        ["EN_CAMINO", columnas.EN_CAMINO ?? []],
        ["CANCELADO", columnas.CANCELADO ?? []],
      ]
    : COLUMNAS_ACTIVAS.map((e) => [e, columnas[e] ?? []]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Supervisor"
        title="Pedidos"
        description="Tablero operativo — confirma, sigue y entrega los pedidos de tu restaurante."
        action={
          <div className="flex items-center gap-2">
            {urgentes > 0 && (
              <span
                className="flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-xl border"
                style={{
                  background: "#fef2f2",
                  borderColor: "#fecaca",
                  color: "#dc2626",
                }}
              >
                <AlertTriangle size={12} /> {urgentes} urgente
                {urgentes !== 1 ? "s" : ""}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              title="Recargar"
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* Stats + controles */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Stats rápidas */}
        <div className="flex items-center gap-3 text-xs font-dm text-stone-500">
          {COLUMNAS_ACTIVAS.map((e) => {
            const meta = ESTADO[e];
            const n = (columnas[e] ?? []).length;
            return (
              <span key={e} className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                <span className="font-bold" style={{ color: meta.text }}>
                  {n}
                </span>
                <span>{meta.label.toLowerCase()}</span>
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          {/* Búsqueda */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-stone-200">
            <Search size={12} className="text-stone-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ID o canal..."
              className="w-28 bg-transparent text-xs font-dm text-stone-700 placeholder:text-stone-300 outline-none"
            />
          </div>

          {/* Toggle activos / historial */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
            <button
              onClick={() => setVerHistorial(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
              style={
                !verHistorial
                  ? { background: G[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              Activos
            </button>
            <button
              onClick={() => setVerHistorial(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
              style={
                verHistorial
                  ? { background: G[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              Historial
            </button>
          </div>
        </div>
      </div>

      {/* Tablero kanban */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-32 rounded-lg" />
              {[1, 2].map((j) => (
                <Skeleton key={j} className="h-32 rounded-2xl" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`grid gap-4 ${columnasActuales.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}
        >
          {columnasActuales.map(([estado, peds]) => (
            <Columna
              key={estado}
              estado={estado}
              pedidos={peds}
              onAccion={handleAccion}
              actuando={actuando}
            />
          ))}
        </div>
      )}
    </div>
  );
}
