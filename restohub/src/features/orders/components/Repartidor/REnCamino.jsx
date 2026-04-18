// src/features/orders/components/Repartidor/REnCamino.jsx
// Repartidor — vista de la entrega que está en curso ahora mismo.
// Pantalla enfocada: dirección grande, ítems, tiempo transcurrido, botón "Entregado".
// Si hay más de una EN_CAMINO las muestra todas.
// Poll cada 15s.
// Ruta: /entregas/en-camino

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  Navigation,
  MapPin,
  CheckCircle2,
  Clock,
  Package,
  Loader2,
  RefreshCw,
  Bike,
} from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { GET_ENTREGAS, COMPLETAR_ENTREGA } from "../../graphql/operations";
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

function minutosDesde(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

// ── Tarjeta de entrega en camino ───────────────────────────────────────────
function EntregaEnCaminoCard({ entrega, onCompletar, completando }) {
  const mins = minutosDesde(entrega.fechaSalida);
  const loading = completando === entrega.id;
  const pedido = entrega.pedidoDetalle;
  const items = pedido?.detalles ?? [];

  return (
    <div
      className="bg-white rounded-3xl border-2 overflow-hidden"
      style={{
        borderColor: G[100],
        boxShadow: `0 0 0 4px ${G[50]}, 0 8px 32px rgba(0,0,0,0.1)`,
      }}
    >
      {/* Barra animada de progreso */}
      <div
        className="h-2 relative overflow-hidden"
        style={{ background: G[50] }}
      >
        <div
          className="absolute inset-y-0 left-0 animate-[shimmer_2s_ease-in-out_infinite]"
          style={{
            width: "60%",
            background: `linear-gradient(90deg, ${G[100]}, ${G[300]}, ${G[100]})`,
            animation: "none",
            backgroundSize: "200% 100%",
          }}
        />
        <div
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${G[300]}, ${G[100]})` }}
        />
      </div>

      <div className="p-6 space-y-5">
        {/* Estado + tiempo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-sm font-dm font-bold text-violet-700">
              En camino
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 text-sm font-dm font-semibold"
            style={{
              color: mins !== null && mins > 30 ? "#dc2626" : "#64748b",
            }}
          >
            <Clock size={14} />
            {mins !== null
              ? `${mins} min en ruta`
              : `Salida ${fmtHora(entrega.fechaSalida)}`}
          </div>
        </div>

        {/* Dirección — elemento principal */}
        <div
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: "#faf5ff", border: "1px solid #ddd6fe" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#7c3aed" }}
          >
            <MapPin size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-dm font-semibold text-violet-500 uppercase tracking-wide mb-1">
              Dirección de entrega
            </p>
            <p className="font-playfair text-lg font-bold text-stone-900 leading-snug">
              {entrega.direccion ?? "Sin dirección registrada"}
            </p>
            {entrega.notas && (
              <p className="text-xs font-dm text-amber-600 mt-1.5 italic">
                Nota: {entrega.notas}
              </p>
            )}
          </div>
        </div>

        {/* Ítems del pedido */}
        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-dm font-semibold text-stone-400 uppercase tracking-wide">
              Contenido del pedido
            </p>
            <div className="space-y-1.5">
              {items.map((d) => (
                <div key={d.id} className="flex items-center gap-2.5">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-dm text-white shrink-0"
                    style={{ background: G[300] }}
                  >
                    {d.cantidad}
                  </span>
                  <p className="text-sm font-dm text-stone-700">
                    {d.nombrePlato}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total + ID */}
        <div className="flex items-center justify-between py-3 border-t border-stone-100">
          <div>
            <p className="text-[10px] font-dm text-stone-400">Pedido</p>
            <span className="font-mono text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg">
              #{entrega.pedido?.slice(-8).toUpperCase()}
            </span>
          </div>
          {pedido && (
            <div className="text-right">
              <p className="text-[10px] font-dm text-stone-400">Total</p>
              <p
                className="font-playfair text-xl font-bold"
                style={{ color: G[300] }}
              >
                {fmtMoney(pedido.total, pedido.moneda)}
              </p>
            </div>
          )}
        </div>

        {/* Botón entregar */}
        <button
          onClick={() => onCompletar(entrega)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-dm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          style={{
            background: `linear-gradient(135deg, ${G[300]}, ${G[500]})`,
            boxShadow: `0 4px 20px ${G[300]}55`,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Procesando...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} /> Confirmar entrega
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function REnCamino() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const repartidorId = user?.empleadoId;
  const restauranteId = user?.restauranteId;
  const [completando, setCompletando] = useState(null);

  const { data, loading, refetch } = useQuery(GET_ENTREGAS, {
    variables: { repartidorId, restauranteId, estadoEntrega: "EN_CAMINO" },
    skip: !repartidorId,
    fetchPolicy: "cache-and-network",
    pollInterval: 15000,
  });

  const [completarEntrega] = useMutation(COMPLETAR_ENTREGA, {
    refetchQueries: ["GetEntregas"],
  });

  const entregas = (data?.entregas ?? []).filter(
    (e) => e.estadoEntrega === "EN_CAMINO",
  );

  const handleCompletar = async (entrega) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      title: "¿Confirmar entrega?",
      html: `<span style="font-family:'DM Sans';color:#78716c">
        Dirección: <b>${entrega.direccion}</b><br/>
        Pedido: <b>#${entrega.pedido?.slice(-8).toUpperCase()}</b>
      </span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: G[900],
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: "Sí, entregado",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;

    setCompletando(entrega.id);
    try {
      const { data: res } = await completarEntrega({
        variables: { id: entrega.id },
      });
      if (!res?.completarEntrega?.id)
        throw new Error("Error al completar la entrega");

      await Swal.fire({
        background: "#fff",
        icon: "success",
        title: "¡Entrega completada!",
        html: `<span style="font-family:'DM Sans';color:#78716c">
          Pedido <b>#${entrega.pedido?.slice(-8).toUpperCase()}</b> entregado correctamente.
        </span>`,
        timer: 2000,
        timerProgressBar: true,
        confirmButtonColor: G[900],
      });

      // Si no quedan más en camino, volver a mis entregas
      if (entregas.length <= 1) navigate("/entregas");
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setCompletando(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Repartidor"
        title="En camino"
        description={
          entregas.length > 0
            ? `${entregas.length} entrega${entregas.length !== 1 ? "s" : ""} en curso — confirma al llegar.`
            : "No estás en camino actualmente."
        }
        action={
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} />
          </Button>
        }
      />

      {loading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : entregas.length === 0 ? (
        <EmptyState
          icon={Navigation}
          title="Sin entregas en curso"
          description="Cuando salgas a un domicilio aparecerá aquí para que puedas confirmarlo."
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/entregas")}
            >
              <Bike size={13} /> Ver mis entregas
            </Button>
          }
        />
      ) : (
        <div className="space-y-4 max-w-lg">
          {entregas.map((e) => (
            <EntregaEnCaminoCard
              key={e.id}
              entrega={e}
              onCompletar={handleCompletar}
              completando={completando}
            />
          ))}
        </div>
      )}
    </div>
  );
}
