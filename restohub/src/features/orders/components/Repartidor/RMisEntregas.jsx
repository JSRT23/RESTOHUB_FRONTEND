// src/features/orders/components/Repartidor/RMisEntregas.jsx
// Repartidor — lista de sus entregas asignadas hoy.
// Ve pendientes (PENDIENTE / EN_CAMINO) y completadas (ENTREGADO).
// Puede salir a domicilio desde aquí o ir al detalle en "En camino".
// Poll cada 20s para ver si le asignan nuevas.
// Ruta: /entregas

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  Bike,
  MapPin,
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  ChevronRight,
  Navigation,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { GET_ENTREGAS, ENTREGA_EN_CAMINO } from "../../graphql/operations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
} from "../../../../shared/components/ui";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
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

const ESTADO_META = {
  PENDIENTE: {
    label: "Pendiente",
    bg: "#eff6ff",
    text: "#3b82f6",
    border: "#bfdbfe",
    dot: "bg-blue-500",
  },
  EN_CAMINO: {
    label: "En camino",
    bg: "#faf5ff",
    text: "#7c3aed",
    border: "#ddd6fe",
    dot: "bg-violet-500 animate-pulse",
  },
  ENTREGADO: {
    label: "Entregado",
    bg: "#f0fdf4",
    text: "#16a34a",
    border: "#bbf7d0",
    dot: "bg-emerald-500",
  },
  FALLIDO: {
    label: "Fallido",
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
    dot: "bg-red-500",
  },
};

// ── Tarjeta de entrega ─────────────────────────────────────────────────────
function EntregaCard({ entrega, onSalir, saliendo }) {
  const navigate = useNavigate();
  const meta = ESTADO_META[entrega.estadoEntrega] ?? ESTADO_META.PENDIENTE;
  const enCamino = entrega.estadoEntrega === "EN_CAMINO";
  const completada = entrega.estadoEntrega === "ENTREGADO";
  const loading = saliendo === entrega.id;
  const mins = enCamino
    ? minutosDesde(entrega.fechaSalida)
    : minutosDesde(null);

  const pedido = entrega.pedidoDetalle;
  const items = pedido?.detalles ?? [];

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden transition-all duration-200"
      style={{
        borderColor: meta.border,
        boxShadow: enCamino
          ? `0 0 0 2px ${meta.text}33, 0 4px 20px rgba(0,0,0,0.08)`
          : "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="h-1.5"
        style={{
          background: `linear-gradient(90deg, ${meta.text}, ${meta.border})`,
        }}
      />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg">
                #{entrega.pedido?.slice(-8).toUpperCase()}
              </span>
              <span
                className="flex items-center gap-1 text-xs font-dm font-semibold"
                style={{ color: meta.text }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
              {enCamino && mins !== null && (
                <span
                  className={`text-[10px] font-dm font-semibold ${mins > 30 ? "text-red-500" : "text-stone-400"}`}
                >
                  {mins}m en ruta
                </span>
              )}
            </div>

            {/* Dirección */}
            <div className="flex items-start gap-1.5">
              <MapPin size={12} className="text-stone-400 mt-0.5 shrink-0" />
              <p className="text-sm font-dm text-stone-700 leading-snug">
                {entrega.direccion ?? "Sin dirección registrada"}
              </p>
            </div>

            {entrega.notas && (
              <p className="text-[10px] font-dm text-amber-600 italic">
                Nota: {entrega.notas}
              </p>
            )}
          </div>

          {/* Total */}
          {pedido && (
            <div className="text-right shrink-0">
              <p className="font-playfair text-base font-bold text-stone-900">
                {fmtMoney(pedido.total, pedido.moneda)}
              </p>
              <p className="text-[10px] font-dm text-stone-400 mt-0.5">
                {items.length} ítem{items.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        {/* Ítems del pedido resumidos */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {items.slice(0, 4).map((d) => (
              <span
                key={d.id}
                className="text-[10px] font-dm px-2 py-0.5 rounded-full bg-stone-100 text-stone-500"
              >
                {d.cantidad}× {d.nombrePlato}
              </span>
            ))}
            {items.length > 4 && (
              <span className="text-[10px] font-dm px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">
                +{items.length - 4} más
              </span>
            )}
          </div>
        )}

        {/* Tiempos */}
        {(entrega.fechaSalida || entrega.fechaEntregaReal) && (
          <div className="flex items-center gap-4 text-[10px] font-dm text-stone-400">
            {entrega.fechaSalida && (
              <span>
                <span className="font-semibold text-stone-500">Salida:</span>{" "}
                {fmtHora(entrega.fechaSalida)}
              </span>
            )}
            {entrega.fechaEntregaReal && (
              <span>
                <span className="font-semibold text-stone-500">Entregado:</span>{" "}
                {fmtHora(entrega.fechaEntregaReal)}
              </span>
            )}
          </div>
        )}

        {/* Acciones */}
        {!completada && (
          <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
            {entrega.estadoEntrada === "PENDIENTE" ||
            entrega.estadoEntrega === "PENDIENTE" ? (
              <button
                onClick={() => onSalir(entrega)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-dm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "#7c3aed" }}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Navigation size={14} /> Salir a domicilio
                  </>
                )}
              </button>
            ) : enCamino ? (
              <button
                onClick={() => navigate("/entregas/en-camino")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-dm font-bold transition-all hover:opacity-90"
                style={{
                  background: G[50],
                  color: G[300],
                  border: `1px solid ${G[100]}`,
                }}
              >
                <Navigation size={14} /> Ver en camino
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function RMisEntregas() {
  const { user } = useAuth();
  const repartidorId = user?.empleadoId;
  const restauranteId = user?.restauranteId;

  const [filtro, setFiltro] = useState("activas");
  const [saliendo, setSaliendo] = useState(null);

  const { data, loading, refetch } = useQuery(GET_ENTREGAS, {
    variables: { repartidorId, restauranteId },
    skip: !repartidorId,
    fetchPolicy: "cache-and-network",
    pollInterval: 20000,
  });

  const [salirADomicilio] = useMutation(ENTREGA_EN_CAMINO, {
    refetchQueries: ["GetEntregas"],
  });

  const entregas = data?.entregas ?? [];
  const activas = entregas.filter(
    (e) => !["ENTREGADO", "FALLIDO"].includes(e.estadoEntrega),
  );
  const completadas = entregas.filter((e) => e.estadoEntrega === "ENTREGADO");
  const enCamino = activas.filter(
    (e) => e.estadoEntrega === "EN_CAMINO",
  ).length;

  const mostrar = filtro === "activas" ? activas : completadas;

  const handleSalir = async (entrega) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      title: "¿Salir a domicilio?",
      html: `<span style="font-family:'DM Sans';color:#78716c">
        Dirección: <b>${entrega.direccion}</b><br/>
        Esto marcará la entrega como "En camino".
      </span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#7c3aed",
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    setSaliendo(entrega.id);
    try {
      const { data: res } = await salirADomicilio({
        variables: { id: entrega.id },
      });
      if (!res?.entregaEnCamino?.id)
        throw new Error("Error al actualizar la entrega");
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setSaliendo(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Repartidor"
        title="Mis entregas"
        description="Entregas asignadas — actualización cada 20 segundos."
        action={
          <div className="flex items-center gap-2">
            {enCamino > 0 && (
              <span
                className="flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-xl border border-violet-200"
                style={{ background: "#faf5ff", color: "#7c3aed" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                En camino
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl w-fit">
        {[
          { v: "activas", l: "Activas", n: activas.length },
          { v: "completadas", l: "Completadas", n: completadas.length },
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
              className="text-[9px] px-1.5 rounded-full font-bold"
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
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : mostrar.length === 0 ? (
        <EmptyState
          icon={Bike}
          title={
            filtro === "activas"
              ? "Sin entregas asignadas"
              : "Sin entregas completadas"
          }
          description={
            filtro === "activas"
              ? "Cuando el supervisor te asigne una entrega aparecerá aquí."
              : "Aún no has completado ninguna entrega hoy."
          }
        />
      ) : (
        <div className="space-y-3">
          {mostrar.map((e) => (
            <EntregaCard
              key={e.id}
              entrega={e}
              onSalir={handleSalir}
              saliendo={saliendo}
            />
          ))}
        </div>
      )}
    </div>
  );
}
