// src/features/inventory/components/gerente/InventarioDashboard.jsx
//
// Dashboard de inventario para gerente_local.
// Fixes respecto a la versión anterior:
//  · GET_STOCK ahora espera almacenId (obtenido del almacén principal)
//  · GET_ALERTAS usa estado: "PENDIENTE" (mayúsculas, según el API)
//  · Stock se carga en cascada: primero almacén → luego stock con su id
//  · Órdenes usa estado uppercase para los conteos
//  · Accesos rápidos incluyen todos los módulos ya implementados

import { useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import {
  Warehouse,
  Truck,
  ShoppingCart,
  AlertTriangle,
  Package,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  Archive,
  ChevronRight,
  BarChart3,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../../../app/auth/AuthContext";
import { Skeleton } from "../../../../shared/components/ui";
import {
  GET_ALMACENES,
  GET_STOCK,
  GET_PROVEEDORES,
  GET_ORDENES_COMPRA,
  GET_ALERTAS,
} from "../../graphql/queries";
import { GET_MI_RESTAURANTE } from "../../../menu/components/Gerente/graphql/operations";

// ── Paleta ────────────────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

// ── Helpers ───────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);
}
function fmtMoney(n, moneda = "COP") {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(n);
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

// ── KpiCard ───────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, accent, critical, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`group w-full text-left bg-white rounded-2xl border border-stone-200 p-5 transition-all duration-200 ${onClick ? "hover:-translate-y-0.5 cursor-pointer" : "cursor-default"}`}
      style={{
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        borderTop: critical
          ? "2px solid #ef4444"
          : accent
            ? `2px solid ${G[300]}`
            : undefined,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: critical ? "#fee2e2" : G[50],
            color: critical ? "#ef4444" : G[300],
          }}
        >
          <Icon size={16} />
        </div>
        {onClick && (
          <ChevronRight
            size={14}
            className="text-stone-300 group-hover:text-stone-500 transition-colors mt-1"
          />
        )}
      </div>
      <p className="text-[11px] font-dm font-semibold text-stone-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className="text-2xl font-dm font-bold"
        style={{ color: critical ? "#ef4444" : G[900] }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[11px] font-dm text-stone-400 mt-0.5">{sub}</p>
      )}
    </button>
  );
}

// ── AlmacenCard ───────────────────────────────────────────────────────────
function AlmacenCard({ almacen, restauranteNombre, stockCritico, loading }) {
  if (loading) return <Skeleton className="h-28 rounded-2xl" />;

  if (!almacen)
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <AlertTriangle size={18} />
        </div>
        <div>
          <p className="text-sm font-dm font-semibold text-amber-800">
            Sin almacén registrado
          </p>
          <p className="text-xs font-dm text-amber-600 mt-0.5">
            El almacén se crea automáticamente al crear el restaurante vía
            RabbitMQ. Si no aparece, espera unos segundos y recarga la página.
          </p>
        </div>
      </div>
    );

  // Nombre: "Almacén Central — <nombre restaurante>"
  const nombre = restauranteNombre
    ? `${almacen.nombre} — ${restauranteNombre}`
    : almacen.nombre;

  const total = almacen.totalIngredientes ?? 0;
  const bajoMin = almacen.ingredientesBajoMinimo ?? 0;
  const pct = total > 0 ? Math.round(((total - bajoMin) / total) * 100) : 100;
  const barColor = pct > 70 ? G[50] : pct > 40 ? "#fde68a" : "#fca5a5";

  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-5"
      style={{
        background: `linear-gradient(135deg, ${G[900]} 0%, ${G[500]} 100%)`,
        boxShadow: "0 4px 20px rgba(5,31,32,0.18)",
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(218,241,222,0.12)" }}
      >
        <Warehouse size={26} style={{ color: G[50] }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-dm font-semibold text-white/50 uppercase tracking-widest mb-0.5">
          Almacén Principal
        </p>
        <p className="text-base font-dm font-bold text-white truncate">
          {nombre}
        </p>
        <div className="flex items-center gap-4 mt-1.5">
          <span className="text-xs font-dm text-white/60">
            <span className="text-white font-semibold">{total}</span>{" "}
            ingredientes
          </span>
          {bajoMin > 0 && (
            <span className="text-xs font-dm text-red-300">
              <span className="font-semibold">{bajoMin}</span> bajo mínimo
            </span>
          )}
          {stockCritico > 0 && (
            <span className="text-xs font-dm text-amber-300">
              <span className="font-semibold">{stockCritico}</span> críticos
            </span>
          )}
        </div>
        <div className="mt-2.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-2xl font-dm font-bold" style={{ color: G[50] }}>
          {pct}%
        </p>
        <p className="text-[10px] font-dm text-white/50">salud</p>
      </div>
    </div>
  );
}

// ── AccesoCard ────────────────────────────────────────────────────────────
function AccesoCard({
  icon: Icon,
  title,
  desc,
  href,
  badge,
  badgeColor = "green",
}) {
  const navigate = useNavigate();
  const colors = {
    green: { bg: G[50], text: G[300] },
    red: { bg: "#fee2e2", text: "#dc2626" },
    amber: { bg: "#fef3c7", text: "#d97706" },
    blue: { bg: "#eff6ff", text: "#3b82f6" },
  };
  const bc = colors[badgeColor] ?? colors.green;

  return (
    <button
      onClick={() => navigate(href)}
      className="group w-full text-left bg-white rounded-2xl border border-stone-200 p-4 hover:border-stone-300 hover:-translate-y-0.5 transition-all duration-200"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: G[50], color: G[300] }}
          >
            <Icon size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-dm font-semibold text-stone-800">
                {title}
              </p>
              {badge != null && badge > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-dm font-bold"
                  style={{ background: bc.bg, color: bc.text }}
                >
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs font-dm text-stone-400 mt-0.5">{desc}</p>
          </div>
        </div>
        <ArrowRight
          size={14}
          className="text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </button>
  );
}

// ── AlertaRow ─────────────────────────────────────────────────────────────
function AlertaRow({ alerta }) {
  const TIPO = {
    bajo_minimo: { label: "Bajo mínimo", bg: "#fef3c7", text: "#d97706" },
    agotado: { label: "Agotado", bg: "#fee2e2", text: "#dc2626" },
    por_vencer: { label: "Por vencer", bg: "#fef3c7", text: "#d97706" },
    vencido: { label: "Vencido", bg: "#fee2e2", text: "#dc2626" },
  };
  const c = TIPO[alerta.tipoAlerta] ?? {
    label: alerta.tipoAlerta,
    bg: G[50],
    text: G[300],
  };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-stone-100 last:border-0">
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-dm font-semibold shrink-0"
        style={{ background: c.bg, color: c.text }}
      >
        {c.label}
      </span>
      <p className="text-xs font-dm text-stone-700 flex-1 truncate">
        {alerta.nombreIngrediente}
      </p>
      <p className="text-[10px] font-dm text-stone-400 shrink-0">
        {alerta.almacenNombre}
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function InventarioDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const restauranteId = user?.restauranteId;

  // 1. Restaurante
  const { data: rData } = useQuery(GET_MI_RESTAURANTE, {
    variables: { id: restauranteId },
    skip: !restauranteId,
  });

  // 2. Almacén principal (RabbitMQ lo crea al crear el restaurante)
  const { data: aData, loading: aLoading } = useQuery(GET_ALMACENES, {
    variables: { restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  const almacenPrincipal = aData?.almacenes?.[0] ?? null;

  // 3. Stock — espera el almacenId del paso anterior (cascada correcta)
  const { data: sData, loading: sLoading } = useQuery(GET_STOCK, {
    variables: { almacenId: almacenPrincipal?.id },
    skip: !almacenPrincipal?.id,
    fetchPolicy: "cache-and-network",
  });

  // 4. Proveedores activos
  const { data: pData, loading: pLoading } = useQuery(GET_PROVEEDORES, {
    variables: { activo: true },
    fetchPolicy: "cache-and-network",
  });

  // 5. Órdenes del restaurante
  const { data: oData, loading: oLoading } = useQuery(GET_ORDENES_COMPRA, {
    variables: { restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  // 6. Alertas activas (estado PENDIENTE — uppercase según API)
  const { data: alData } = useQuery(GET_ALERTAS, {
    variables: { restauranteId, estado: "PENDIENTE" },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  // ── Derivados ─────────────────────────────────────────────────────────
  const restaurante = rData?.restaurante;
  const stock = sData?.stock ?? [];
  const proveedores = pData?.proveedores ?? [];
  const ordenes = oData?.ordenesCompra ?? [];
  const alertas = alData?.alertasStock ?? [];

  // Stock
  const stockCritico = stock.filter(
    (s) => s.necesitaReposicion || s.estaAgotado,
  ).length;
  const stockAgotado = stock.filter((s) => s.estaAgotado).length;

  // Órdenes — estados uppercase
  const ordenesPendientes = ordenes.filter((o) =>
    ["BORRADOR", "PENDIENTE", "ENVIADA"].includes(o.estado?.toUpperCase()),
  ).length;
  const ordenesEnviadas = ordenes.filter(
    (o) => o.estado?.toUpperCase() === "ENVIADA",
  ).length;
  const ordenesRecientes = [...ordenes]
    .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
    .slice(0, 5);

  // Alertas — críticas primero
  const alertasCriticas = alertas.filter(
    (a) => a.tipoAlerta === "agotado" || a.tipoAlerta === "vencido",
  );
  const alertasWarn = alertas.filter(
    (a) => a.tipoAlerta === "bajo_minimo" || a.tipoAlerta === "por_vencer",
  );
  const alertasOrdenadas = [...alertasCriticas, ...alertasWarn];

  const loading = aLoading || sLoading || pLoading || oLoading;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">
      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-playfair font-bold"
            style={{ color: G[900] }}
          >
            Inventario
          </h1>
          <p className="text-sm font-dm text-stone-400 mt-0.5">
            Vista general del almacén, stock y compras de tu restaurante
          </p>
        </div>
        {restaurante && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-dm font-semibold"
            style={{ background: G[50], color: G[300] }}
          >
            <BarChart3 size={12} />
            {restaurante.nombre}
          </div>
        )}
      </div>

      {/* ── Almacén principal ────────────────────────────────────────────── */}
      <AlmacenCard
        almacen={almacenPrincipal}
        restauranteNombre={restaurante?.nombre}
        stockCritico={stockCritico}
        loading={aLoading}
      />

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={Package}
          label="Ingredientes en stock"
          value={loading ? "—" : fmt(stock.length)}
          sub={
            stockAgotado > 0 ? `${stockAgotado} agotados` : "Todos disponibles"
          }
          accent
          onClick={() => navigate("/gerente/stock")}
        />
        <KpiCard
          icon={TrendingDown}
          label="Stock crítico"
          value={loading ? "—" : fmt(stockCritico)}
          sub="Bajo mínimo o agotados"
          critical={stockCritico > 0}
          onClick={
            stockCritico > 0 ? () => navigate("/gerente/stock") : undefined
          }
        />
        <KpiCard
          icon={Truck}
          label="Proveedores activos"
          value={loading ? "—" : fmt(proveedores.length)}
          sub="Con relación vigente"
          onClick={() => navigate("/gerente/proveedores")}
        />
        <KpiCard
          icon={ShoppingCart}
          label="Órdenes en curso"
          value={loading ? "—" : fmt(ordenesPendientes)}
          sub={
            ordenesEnviadas > 0
              ? `${ordenesEnviadas} enviadas al proveedor`
              : "Sin envíos pendientes"
          }
          critical={ordenesEnviadas > 0}
          onClick={() => navigate("/gerente/ordenes")}
        />
      </div>

      {/* ── Grid inferior ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas activas */}
        <div
          className="bg-white rounded-2xl border border-stone-200 p-5"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: alertasCriticas.length > 0 ? "#fee2e2" : G[50],
                  color: alertasCriticas.length > 0 ? "#dc2626" : G[300],
                }}
              >
                <AlertTriangle size={13} />
              </div>
              <p className="text-sm font-dm font-semibold text-stone-800">
                Alertas activas
              </p>
              {alertas.length > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-dm font-bold"
                  style={{
                    background:
                      alertasCriticas.length > 0 ? "#fee2e2" : "#fef3c7",
                    color: alertasCriticas.length > 0 ? "#dc2626" : "#d97706",
                  }}
                >
                  {alertas.length}
                </span>
              )}
            </div>
          </div>

          {alertas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: G[50] }}
              >
                <CheckCircle2 size={18} style={{ color: G[300] }} />
              </div>
              <p className="text-sm font-dm font-semibold text-stone-500">
                Sin alertas activas
              </p>
              <p className="text-xs font-dm text-stone-400">
                Todo el inventario está en orden
              </p>
            </div>
          ) : (
            <div>
              {alertasOrdenadas.slice(0, 6).map((a) => (
                <AlertaRow key={a.id} alerta={a} />
              ))}
              {alertas.length > 6 && (
                <p className="text-[11px] font-dm text-stone-400 mt-2 text-center">
                  +{alertas.length - 6} alertas más
                </p>
              )}
            </div>
          )}
        </div>

        {/* Accesos rápidos */}
        <div className="space-y-3">
          <p className="text-xs font-dm font-semibold text-stone-400 uppercase tracking-wider px-1">
            Módulos de inventario
          </p>
          <AccesoCard
            icon={Truck}
            title="Proveedores"
            desc="Gestiona tus proveedores locales y ve los globales"
            href="/gerente/proveedores"
            badge={proveedores.length}
          />
          <AccesoCard
            icon={ShoppingCart}
            title="Órdenes de compra"
            desc="Crear, enviar y recibir órdenes de mercancía"
            href="/gerente/ordenes"
            badge={ordenesEnviadas}
            badgeColor={ordenesEnviadas > 0 ? "amber" : "green"}
          />
          <AccesoCard
            icon={SlidersHorizontal}
            title="Stock"
            desc="Niveles actuales, ajustes y movimientos"
            href="/gerente/stock"
            badge={stockCritico}
            badgeColor={stockCritico > 0 ? "red" : "green"}
          />
          <AccesoCard
            icon={Archive}
            title="Lotes"
            desc="Trazabilidad, vencimientos y retiros"
            href="/gerente/lotes"
          />
        </div>
      </div>

      {/* ── Órdenes recientes ────────────────────────────────────────────── */}
      {ordenesRecientes.length > 0 && (
        <div
          className="bg-white rounded-2xl border border-stone-200 p-5"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: G[50] }}
              >
                <ShoppingCart size={13} style={{ color: G[300] }} />
              </div>
              <p className="text-sm font-dm font-semibold text-stone-800">
                Órdenes recientes
              </p>
            </div>
            <button
              onClick={() => navigate("/gerente/ordenes")}
              className="text-xs font-dm font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
              style={{ color: G[300] }}
            >
              Ver todas <ArrowRight size={12} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-dm">
              <thead>
                <tr className="border-b border-stone-100">
                  {["Proveedor", "Estado", "Total", "Fecha"].map((h) => (
                    <th
                      key={h}
                      className={`py-2 text-stone-400 font-semibold ${h === "Total" || h === "Fecha" ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenesRecientes.map((o) => {
                  const ESTADO_STYLE = {
                    BORRADOR: { bg: "#f1f5f9", text: "#64748b" },
                    PENDIENTE: { bg: "#fef3c7", text: "#d97706" },
                    ENVIADA: { bg: "#eff6ff", text: "#3b82f6" },
                    RECIBIDA: { bg: G[50], text: G[300] },
                    CANCELADA: { bg: "#fee2e2", text: "#dc2626" },
                  };
                  const s =
                    ESTADO_STYLE[o.estado?.toUpperCase()] ??
                    ESTADO_STYLE.BORRADOR;
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-stone-50 last:border-0"
                    >
                      <td className="py-2.5 text-stone-700 font-medium">
                        {o.proveedorNombre}
                      </td>
                      <td className="py-2.5">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                          style={{ background: s.bg, color: s.text }}
                        >
                          {o.estado?.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-stone-600">
                        {fmtMoney(o.totalEstimado, o.moneda)}
                      </td>
                      <td className="py-2.5 text-right text-stone-400">
                        {fmtDate(o.fechaCreacion)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
