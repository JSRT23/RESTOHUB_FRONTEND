// src/features/inventory/components/InventarioDashboard.jsx
import { useQuery, useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Package,
  ShoppingCart,
  Truck,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Bell,
  RefreshCw,
  Eye,
} from "lucide-react";
import Swal from "sweetalert2";
import { GET_ALERTAS, GET_STOCK, GET_ORDENES_COMPRA } from "../graphql/queries";
import { RESOLVER_ALERTA, IGNORAR_ALERTA } from "../graphql/mutations";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  StatCard,
  Skeleton,
} from "../../../shared/components/ui";

// ── Helpers ────────────────────────────────────────────────────────────────
const TIPO_ALERTA_CONFIG = {
  AGOTADO: { label: "Agotado", variant: "red", icon: XCircle },
  STOCK_BAJO: { label: "Stock bajo", variant: "amber", icon: TrendingDown },
  VENCIMIENTO: { label: "Vencimiento", variant: "blue", icon: Clock },
};

const ESTADO_ORDEN_CONFIG = {
  BORRADOR: { label: "Borrador", variant: "default" },
  PENDIENTE: { label: "Pendiente", variant: "amber" },
  ENVIADA: { label: "Enviada", variant: "blue" },
  RECIBIDA: { label: "Recibida", variant: "green" },
  CANCELADA: { label: "Cancelada", variant: "red" },
};

// ── StockBar ───────────────────────────────────────────────────────────────
function StockBar({ porcentaje, estaAgotado, necesitaReposicion }) {
  const pct = Math.min(Math.max(porcentaje ?? 0, 0), 100);
  const color = estaAgotado
    ? "bg-red-400"
    : necesitaReposicion
      ? "bg-amber-400"
      : "bg-emerald-400";
  return (
    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── AlertaRow ──────────────────────────────────────────────────────────────
function AlertaRow({ alerta, onResolver, onIgnorar, resolving }) {
  const cfg =
    TIPO_ALERTA_CONFIG[alerta.tipoAlerta] ?? TIPO_ALERTA_CONFIG.STOCK_BAJO;
  const Icon = cfg.icon;

  return (
    <div className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 transition-all">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          cfg.variant === "red"
            ? "bg-red-50 border border-red-200"
            : cfg.variant === "amber"
              ? "bg-amber-50 border border-amber-200"
              : "bg-blue-50 border border-blue-200"
        }`}
      >
        <Icon
          size={15}
          className={
            cfg.variant === "red"
              ? "text-red-500"
              : cfg.variant === "amber"
                ? "text-amber-500"
                : "text-blue-500"
          }
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-dm font-semibold text-stone-800 truncate">
            {alerta.nombreIngrediente}
          </p>
          <Badge variant={cfg.variant} size="xs">
            {cfg.label}
          </Badge>
        </div>
        <p className="text-[11px] font-dm text-stone-400 mt-0.5">
          {alerta.almacenNombre} · Actual: {alerta.nivelActual} / Mín:{" "}
          {alerta.nivelMinimo}
          {" · "}
          {new Date(alerta.fechaAlerta).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
          })}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="xs"
          loading={resolving === alerta.id}
          onClick={() => onResolver(alerta)}
        >
          <CheckCircle2 size={12} />
          Resolver
        </Button>
        <Button variant="ghost" size="xs" onClick={() => onIgnorar(alerta)}>
          <XCircle size={12} />
          Ignorar
        </Button>
      </div>
    </div>
  );
}

// ── StockCriticoRow ────────────────────────────────────────────────────────
function StockCriticoRow({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-stone-200 bg-white hover:border-amber-200 hover:bg-amber-50/30 transition-all cursor-pointer"
    >
      <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center shrink-0">
        <Package size={14} className="text-stone-400" />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-dm font-semibold text-stone-800 truncate">
            {item.nombreIngrediente}
          </p>
          <span className="text-xs font-playfair font-bold text-stone-700 shrink-0">
            {parseFloat(item.cantidadActual).toFixed(2)} {item.unidadMedida}
          </span>
        </div>
        <StockBar
          porcentaje={item.porcentajeStock}
          estaAgotado={item.estaAgotado}
          necesitaReposicion={item.necesitaReposicion}
        />
        <p className="text-[10px] font-dm text-stone-400">
          {item.almacenNombre} · {Math.round(item.porcentajeStock ?? 0)}%
        </p>
      </div>
      <Badge variant={item.estaAgotado ? "red" : "amber"} size="xs">
        {item.estaAgotado ? "Agotado" : "Bajo"}
      </Badge>
    </div>
  );
}

// ── OrdenRow ───────────────────────────────────────────────────────────────
function OrdenRow({ orden, onClick }) {
  const cfg = ESTADO_ORDEN_CONFIG[orden.estado] ?? ESTADO_ORDEN_CONFIG.BORRADOR;
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 transition-all cursor-pointer"
    >
      <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center shrink-0">
        <ShoppingCart size={14} className="text-stone-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-dm font-semibold text-stone-800 truncate">
          {orden.proveedorNombre}
        </p>
        <p className="text-[11px] font-dm text-stone-400 mt-0.5">
          {new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: orden.moneda,
            maximumFractionDigits: 0,
          }).format(orden.totalEstimado)}
          {" · "}
          {new Date(orden.fechaCreacion).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <Badge variant={cfg.variant} size="xs">
        {cfg.label}
      </Badge>
      <ArrowRight
        size={13}
        className="text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all shrink-0"
      />
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function InventarioDashboard() {
  const navigate = useNavigate();

  const {
    data: alertasData,
    loading: aLoading,
    refetch: refetchAlertas,
  } = useQuery(GET_ALERTAS, { variables: { estado: "PENDIENTE" } });

  const { data: stockData, loading: sLoading } = useQuery(GET_STOCK, {
    variables: { bajoMinimo: true },
  });

  const { data: ordenesData, loading: oLoading } = useQuery(
    GET_ORDENES_COMPRA,
    {},
  );

  const [resolverAlerta, { loading: resolving }] = useMutation(
    RESOLVER_ALERTA,
    {
      refetchQueries: ["GetAlertas"],
    },
  );
  const [ignorarAlerta] = useMutation(IGNORAR_ALERTA, {
    refetchQueries: ["GetAlertas"],
  });

  const alertas = alertasData?.alertasStock ?? [];
  const stockCritico = stockData?.stock ?? [];
  const ordenes = ordenesData?.ordenesCompra ?? [];

  const alertasAgotado = alertas.filter(
    (a) => a.tipoAlerta === "AGOTADO",
  ).length;
  const alertasBajo = alertas.filter(
    (a) => a.tipoAlerta === "STOCK_BAJO",
  ).length;
  const ordenesPendientes = ordenes.filter((o) =>
    ["PENDIENTE", "ENVIADA"].includes(o.estado),
  ).length;

  const handleResolver = async (alerta) => {
    const { data: res } = await resolverAlerta({
      variables: { id: alerta.id },
    });
    if (!res.resolverAlerta.ok) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        confirmButtonColor: "#F59E0B",
      });
    }
  };

  const handleIgnorar = async (alerta) => {
    const confirm = await Swal.fire({
      background: "#fff",
      icon: "question",
      iconColor: "#F59E0B",
      title: `¿Ignorar alerta?`,
      html: `<span style="font-family:'DM Sans';color:#78716c">${alerta.nombreIngrediente} — ${TIPO_ALERTA_CONFIG[alerta.tipoAlerta]?.label}</span>`,
      showCancelButton: true,
      confirmButtonColor: "#F59E0B",
      cancelButtonColor: "#E7E5E4",
      confirmButtonText: "Sí, ignorar",
    });
    if (!confirm.isConfirmed) return;
    await ignorarAlerta({ variables: { id: alerta.id } });
  };

  const loading = aLoading || sLoading || oLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory Service"
        title="Panel de inventario"
        description="Vista general del stock, alertas y órdenes de compra activas."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => refetchAlertas()}>
              <RefreshCw size={14} />
              Actualizar
            </Button>
            <Button onClick={() => navigate("/inventario/ordenes/new")}>
              <ShoppingCart size={14} />
              Nueva orden
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Alertas activas"
            value={alertas.length}
            icon={Bell}
            accent={alertas.length > 0}
          />
          <StatCard
            label="Ingredientes agotados"
            value={alertasAgotado}
            icon={XCircle}
          />
          <StatCard
            label="Stock bajo mínimo"
            value={stockCritico.length}
            icon={TrendingDown}
          />
          <StatCard
            label="Órdenes en curso"
            value={ordenesPendientes}
            icon={Truck}
          />
        </div>
      )}

      {/* Contenido en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Alertas pendientes ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-3 h-0.5 bg-amber-500 rounded-full" />
                <span className="text-[10px] font-dm font-bold tracking-[0.15em] uppercase text-amber-600">
                  Urgente
                </span>
              </div>
              <h2 className="font-playfair text-stone-900 font-bold text-lg">
                Alertas pendientes
                <span className="text-stone-400 text-sm font-dm ml-2">
                  ({alertas.length})
                </span>
              </h2>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate("/inventario/alertas")}
            >
              Ver todas <ArrowRight size={11} />
            </Button>
          </div>

          {aLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : alertas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-stone-200">
              <CheckCircle2 size={24} className="text-emerald-400 mb-2" />
              <p className="text-stone-400 text-sm font-dm font-medium">
                Sin alertas pendientes
              </p>
              <p className="text-stone-300 text-xs font-dm mt-0.5">
                Todo el stock está en niveles correctos
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alertas.slice(0, 6).map((a) => (
                <AlertaRow
                  key={a.id}
                  alerta={a}
                  onResolver={handleResolver}
                  onIgnorar={handleIgnorar}
                  resolving={resolving ? a.id : null}
                />
              ))}
              {alertas.length > 6 && (
                <button
                  onClick={() => navigate("/inventario/alertas")}
                  className="w-full py-2.5 rounded-xl border border-dashed border-stone-200 text-xs font-dm text-stone-400 hover:border-amber-300 hover:text-amber-600 transition-all"
                >
                  Ver {alertas.length - 6} alertas más →
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── Stock crítico ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-3 h-0.5 bg-amber-500 rounded-full" />
                <span className="text-[10px] font-dm font-bold tracking-[0.15em] uppercase text-amber-600">
                  Stock
                </span>
              </div>
              <h2 className="font-playfair text-stone-900 font-bold text-lg">
                Ingredientes críticos
                <span className="text-stone-400 text-sm font-dm ml-2">
                  ({stockCritico.length})
                </span>
              </h2>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate("/inventario/stock")}
            >
              Ver todo <ArrowRight size={11} />
            </Button>
          </div>

          {sLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : stockCritico.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-stone-200">
              <Package size={24} className="text-emerald-400 mb-2" />
              <p className="text-stone-400 text-sm font-dm font-medium">
                Stock en niveles normales
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {stockCritico.slice(0, 6).map((item) => (
                <StockCriticoRow
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/inventario/stock/${item.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Órdenes recientes ── */}
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-3 h-0.5 bg-amber-500 rounded-full" />
                <span className="text-[10px] font-dm font-bold tracking-[0.15em] uppercase text-amber-600">
                  Compras
                </span>
              </div>
              <h2 className="font-playfair text-stone-900 font-bold text-lg">
                Órdenes de compra recientes
              </h2>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate("/inventario/ordenes")}
            >
              Ver todas <ArrowRight size={11} />
            </Button>
          </div>

          {oLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : ordenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-stone-200">
              <ShoppingCart size={24} className="text-stone-300 mb-2" />
              <p className="text-stone-400 text-sm font-dm">
                No hay órdenes de compra
              </p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => navigate("/inventario/ordenes/new")}
              >
                <ShoppingCart size={13} />
                Crear orden
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ordenes.slice(0, 6).map((o) => (
                <OrdenRow
                  key={o.id}
                  orden={o}
                  onClick={() => navigate(`/inventario/ordenes/${o.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
