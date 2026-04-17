// src/features/orders/components/Cocinero/CComandas.jsx
// Cocinero — tablero de comandas.
// Tres columnas: PENDIENTE → PREPARANDO → LISTO
// Para cada comanda ve los ítems del pedido asociado.
// Acciones: Iniciar (PENDIENTE→PREPARANDO), Listo (PREPARANDO→LISTO).
// Poll cada 15s para tiempo real.
// Ruta: /cocina

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertTriangle,
  UtensilsCrossed,
  Timer,
  Play,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_COMANDAS,
  GET_PEDIDO,
  INICIAR_COMANDA,
  COMANDA_LISTA,
} from "../../graphql/operations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
} from "../../../../shared/components/ui";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const ESTADO_COL = {
  PENDIENTE: {
    label: "Pendiente",
    bg: "#eff6ff",
    text: "#3b82f6",
    border: "#bfdbfe",
    dot: "bg-blue-500",
  },
  PREPARANDO: {
    label: "Preparando",
    bg: "#fffbeb",
    text: "#d97706",
    border: "#fde68a",
    dot: "bg-amber-400 animate-pulse",
  },
  LISTO: {
    label: "Listo ✓",
    bg: G[50],
    text: G[300],
    border: G[100],
    dot: "bg-emerald-500",
  },
};

const PRIORIDAD_COLOR = {
  4: "#dc2626",
  3: "#d97706",
  2: "#64748b",
  1: "#a8a29e",
};

function fmtHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function minutosDesde(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}
function fmtSegundos(seg) {
  if (!seg) return null;
  const m = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  return `${m}m ${s}s`;
}

// ── Ítems del pedido para una comanda ──────────────────────────────────────
function DetallesPedido({ pedidoId }) {
  const { data, loading } = useQuery(GET_PEDIDO, {
    variables: { id: pedidoId },
    fetchPolicy: "cache-and-network",
  });

  if (loading)
    return (
      <div className="space-y-1.5">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-6 rounded-lg" />
        ))}
      </div>
    );

  const pedido = data?.pedido;
  if (!pedido) return null;

  return (
    <div className="space-y-1.5">
      {pedido.detalles?.map((d) => (
        <div key={d.id} className="flex items-center gap-2.5">
          <span
            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-dm text-white shrink-0"
            style={{ background: G[300] }}
          >
            {d.cantidad}
          </span>
          <p className="flex-1 text-sm font-dm font-semibold text-stone-800">
            {d.nombrePlato}
          </p>
          {d.notas && (
            <span className="text-[10px] font-dm text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full truncate max-w-[100px]">
              {d.notas}
            </span>
          )}
        </div>
      ))}
      {pedido.mesaId && (
        <p className="text-[10px] font-dm text-stone-400 pt-1">
          Mesa · {pedido.canal} · {fmtHora(pedido.fechaCreacion)}
        </p>
      )}
    </div>
  );
}

// ── Tarjeta de comanda ─────────────────────────────────────────────────────
function ComandaCard({ comanda, onIniciar, onLista, actuando }) {
  const meta = ESTADO_COL[comanda.estado] ?? ESTADO_COL.PENDIENTE;
  const mins = minutosDesde(comanda.horaEnvio);
  const loading = actuando === comanda.id;

  // Urgencia visual si lleva mucho tiempo pendiente
  const urgente = comanda.estado === "PENDIENTE" && mins !== null && mins > 10;
  const lento = comanda.estado === "PREPARANDO" && mins !== null && mins > 20;

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden transition-all duration-200"
      style={{
        borderColor: urgente ? "#fecaca" : lento ? "#fde68a" : meta.border,
        boxShadow:
          urgente || lento
            ? `0 0 0 2px ${urgente ? "#fecaca" : "#fde68a"}, 0 4px 16px rgba(0,0,0,0.08)`
            : "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Tira de estado */}
      <div
        className="h-1.5"
        style={{
          background: `linear-gradient(90deg, ${meta.text}, ${meta.border})`,
        }}
      />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg">
              #
              {comanda.pedido?.slice(-8).toUpperCase() ??
                comanda.pedido?.slice(-8)}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              <span
                className="text-xs font-dm font-bold"
                style={{ color: meta.text }}
              >
                {meta.label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-dm text-stone-400">
              {fmtHora(comanda.horaEnvio)}
            </p>
            {mins !== null && (
              <p
                className={`text-sm font-dm font-bold mt-0.5 ${
                  urgente || lento
                    ? urgente
                      ? "text-red-600"
                      : "text-amber-600"
                    : "text-stone-500"
                }`}
              >
                {mins}m
                {(urgente || lento) && (
                  <AlertTriangle size={10} className="inline ml-1" />
                )}
              </p>
            )}
            {comanda.tiempoPreparacionSegundos && (
              <p className="text-[10px] font-dm text-stone-400 mt-0.5">
                {fmtSegundos(comanda.tiempoPreparacionSegundos)}
              </p>
            )}
          </div>
        </div>

        {/* Estación */}
        {comanda.estacion && comanda.estacion !== "GENERAL" && (
          <span
            className="inline-flex text-[10px] font-dm font-semibold px-2 py-1 rounded-full"
            style={{ background: "#f0f9ff", color: "#0369a1" }}
          >
            {comanda.estacion}
          </span>
        )}

        {/* Ítems del pedido */}
        <DetallesPedido pedidoId={comanda.pedido} />

        {/* Acción */}
        {comanda.estado !== "LISTO" && (
          <button
            onClick={() =>
              comanda.estado === "PENDIENTE"
                ? onIniciar(comanda)
                : onLista(comanda)
            }
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-dm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{
              background: comanda.estado === "PENDIENTE" ? "#3b82f6" : G[900],
            }}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : comanda.estado === "PENDIENTE" ? (
              <>
                <Play size={13} /> Iniciar
              </>
            ) : (
              <>
                <CheckCircle2 size={13} /> Marcar listo
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Columna kanban ─────────────────────────────────────────────────────────
function Columna({ estado, comandas, onIniciar, onLista, actuando }) {
  const meta = ESTADO_COL[estado];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
        <span className="text-xs font-dm font-bold text-stone-700">
          {meta.label}
        </span>
        <span
          className="ml-auto text-[10px] font-dm font-semibold px-2 py-0.5 rounded-full"
          style={{ background: meta.bg, color: meta.text }}
        >
          {comandas.length}
        </span>
      </div>
      {comandas.length === 0 ? (
        <div className="flex items-center justify-center py-10 rounded-2xl border-2 border-dashed border-stone-200">
          <p className="text-xs font-dm text-stone-300">Sin comandas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comandas.map((c) => (
            <ComandaCard
              key={c.id}
              comanda={c}
              onIniciar={onIniciar}
              onLista={onLista}
              actuando={actuando}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
const COLUMNAS = ["PENDIENTE", "PREPARANDO", "LISTO"];

export default function CComandas() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;
  const [actuando, setActuando] = useState(null);
  const [filtroEstacion, setFiltroEstacion] = useState("TODAS");

  const { data, loading, refetch } = useQuery(GET_COMANDAS, {
    variables: filtroEstacion !== "TODAS" ? { estacion: filtroEstacion } : {},
    fetchPolicy: "cache-and-network",
    pollInterval: 15000,
  });

  const [iniciarComanda] = useMutation(INICIAR_COMANDA, {
    refetchQueries: ["GetComandas"],
  });
  const [marcarLista] = useMutation(COMANDA_LISTA, {
    refetchQueries: ["GetComandas"],
  });

  const comandas = data?.comandas ?? [];

  // Sólo las activas (no mostrar LISTO de hace horas — solo las últimas 20 min)
  const activas = useMemo(() => {
    const limite = Date.now() - 30 * 60 * 1000; // últimas 30 min
    return comandas.filter(
      (c) =>
        c.estado !== "LISTO" ||
        (c.horaFin && new Date(c.horaFin).getTime() > limite),
    );
  }, [comandas]);

  const columnas = useMemo(
    () =>
      Object.fromEntries(
        COLUMNAS.map((e) => [
          e,
          activas
            .filter((c) => c.estado === e)
            .sort((a, b) => new Date(a.horaEnvio) - new Date(b.horaEnvio)), // más antiguos primero
        ]),
      ),
    [activas],
  );

  const pendientes = columnas.PENDIENTE?.length ?? 0;

  const ESTACIONES = [
    "TODAS",
    "GENERAL",
    "PARRILLA",
    "BEBIDAS",
    "POSTRES",
    "FRIOS",
  ];

  const handleIniciar = async (comanda) => {
    setActuando(comanda.id);
    try {
      const { data: res } = await iniciarComanda({
        variables: { id: comanda.id },
      });
      if (!res?.iniciarComanda?.id) throw new Error("Error al iniciar");
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

  const handleLista = async (comanda) => {
    setActuando(comanda.id);
    try {
      const { data: res } = await marcarLista({
        variables: { id: comanda.id },
      });
      if (!res?.comandaLista?.id) throw new Error("Error al marcar listo");
      // Flash visual de éxito sin modal
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

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Cocinero"
        title="Comandas"
        description="Pedidos en cola — actualización cada 15 segundos."
        action={
          <div className="flex items-center gap-2">
            {pendientes > 0 && (
              <span
                className="flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-xl border border-blue-200"
                style={{ background: "#eff6ff", color: "#3b82f6" }}
              >
                <Timer size={12} /> {pendientes} pendiente
                {pendientes !== 1 ? "s" : ""}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* Filtro estación */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {ESTACIONES.map((e) => (
          <button
            key={e}
            onClick={() => setFiltroEstacion(e)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-dm font-semibold transition-all"
            style={
              filtroEstacion === e
                ? { background: G[900], color: "#fff" }
                : {
                    background: "#fff",
                    color: "#78716c",
                    border: "1px solid #e5e7eb",
                  }
            }
          >
            {e === "TODAS"
              ? "Todas las estaciones"
              : e.charAt(0) + e.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Tablero */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-28 rounded-lg" />
              {[1, 2].map((j) => (
                <Skeleton key={j} className="h-44 rounded-2xl" />
              ))}
            </div>
          ))}
        </div>
      ) : activas.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Sin comandas activas"
          description="No hay pedidos en cola. Cuando el mesero tome un pedido aparecerá aquí."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COLUMNAS.map((estado) => (
            <Columna
              key={estado}
              estado={estado}
              comandas={columnas[estado] ?? []}
              onIniciar={handleIniciar}
              onLista={handleLista}
              actuando={actuando}
            />
          ))}
        </div>
      )}
    </div>
  );
}
