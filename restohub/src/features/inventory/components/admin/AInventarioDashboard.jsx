// src/features/inventory/components/Admin/AInventarioDashboard.jsx
//
// Dashboard de inventario para admin_central.
// Muestra visión global de la cadena: proveedores por alcance,
// alertas críticas de todos los restaurantes, órdenes activas y KPIs globales.
// Punto de entrada desde navbar → Inventario → Dashboard.

import { useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  AlertTriangle,
  ShoppingCart,
  Globe,
  MapPin,
  Building2,
  ArrowRight,
  CheckCircle2,
  Package,
  BarChart3,
  ChevronRight,
  TrendingDown,
  Warehouse,
} from "lucide-react";
import { Skeleton } from "../../../../shared/components/ui";
import {
  GET_PROVEEDORES,
  GET_ALERTAS,
  GET_ORDENES_COMPRA,
  GET_ALMACENES,
} from "../../graphql/queries";

// ── Paleta ─────────────────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const ALCANCE_META = {
  GLOBAL: {
    label: "Global",
    bg: "#eff6ff",
    text: "#3b82f6",
    border: "#bfdbfe",
    icon: Globe,
  },
  PAIS: {
    label: "País",
    bg: "#faf5ff",
    text: "#7c3aed",
    border: "#ddd6fe",
    icon: MapPin,
  },
  CIUDAD: {
    label: "Ciudad",
    bg: "#fff7ed",
    text: "#ea580c",
    border: "#fed7aa",
    icon: Building2,
  },
  LOCAL: {
    label: "Local",
    bg: G[50],
    text: G[300],
    border: G[100],
    icon: Building2,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-CO").format(n);
}

// ── Sub-componentes ────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, accent, critical, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left bg-white rounded-2xl border border-stone-200 p-5 transition-all duration-200 ${onClick ? "hover:-translate-y-0.5 cursor-pointer" : "cursor-default"}`}
      style={{
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        borderTop: accent
          ? `2px solid ${G[300]}`
          : critical
            ? "2px solid #ef4444"
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

function ProveedoresPorAlcance({ proveedores, loading, onNavigate }) {
  if (loading) return <Skeleton className="h-40 rounded-2xl" />;

  const grupos = { GLOBAL: [], PAIS: [], CIUDAD: [], LOCAL: [] };
  (proveedores ?? []).forEach((p) => {
    const k = p.alcance ?? "GLOBAL";
    if (grupos[k]) grupos[k].push(p);
  });

  return (
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
            <Truck size={13} style={{ color: G[300] }} />
          </div>
          <p className="text-sm font-dm font-semibold text-stone-800">
            Proveedores por alcance
          </p>
        </div>
        <button
          onClick={() => onNavigate("/inventario/proveedores")}
          className="text-xs font-dm font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
          style={{ color: G[300] }}
        >
          Gestionar <ArrowRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(ALCANCE_META).map(([alcance, meta]) => {
          const Icon = meta.icon;
          const n = grupos[alcance].length;
          return (
            <button
              key={alcance}
              onClick={() =>
                onNavigate(`/inventario/proveedores?alcance=${alcance}`)
              }
              className="flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all hover:-translate-y-0.5"
              style={{ background: meta.bg, borderColor: meta.border }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  color: meta.text,
                }}
              >
                <Icon size={15} />
              </div>
              <p
                className="text-xl font-dm font-bold"
                style={{ color: meta.text }}
              >
                {n}
              </p>
              <p
                className="text-[10px] font-dm font-semibold"
                style={{ color: meta.text }}
              >
                {meta.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AlertasGlobales({ alertas, loading }) {
  if (loading) return <Skeleton className="h-48 rounded-2xl" />;

  const todas = alertas ?? [];
  const criticas = todas.filter((a) => a.tipoAlerta === "AGOTADO");
  const advertencias = todas.filter((a) => a.tipoAlerta !== "AGOTADO");
  const visible = [...criticas, ...advertencias].slice(0, 7);

  const TIPO_LABEL = {
    STOCK_BAJO: { label: "Bajo mínimo", bg: "#fef3c7", text: "#d97706" },
    VENCIMIENTO: { label: "Por vencer", bg: "#fef3c7", text: "#d97706" },
    AGOTADO: { label: "Agotado", bg: "#fee2e2", text: "#dc2626" },
  };

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 p-5"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: criticas.length > 0 ? "#fee2e2" : G[50] }}
        >
          <AlertTriangle
            size={13}
            style={{ color: criticas.length > 0 ? "#dc2626" : G[300] }}
          />
        </div>
        <p className="text-sm font-dm font-semibold text-stone-800">
          Alertas de la cadena
        </p>
        {todas.length > 0 && (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-dm font-bold"
            style={{
              background: criticas.length > 0 ? "#fee2e2" : "#fef3c7",
              color: criticas.length > 0 ? "#dc2626" : "#d97706",
            }}
          >
            {todas.length}
          </span>
        )}
      </div>

      {todas.length === 0 ? (
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
            Toda la cadena está en orden
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {visible.map((a) => {
            const t = TIPO_LABEL[a.tipoAlerta] ?? TIPO_LABEL.STOCK_BAJO;
            return (
              <div
                key={a.id}
                className="flex items-center gap-2.5 py-2 border-b border-stone-50 last:border-0"
              >
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-dm font-semibold shrink-0"
                  style={{ background: t.bg, color: t.text }}
                >
                  {t.label}
                </span>
                <p className="text-xs font-dm text-stone-700 flex-1 truncate">
                  {a.nombreIngrediente}
                </p>
                <p className="text-[10px] font-dm text-stone-400 shrink-0 truncate max-w-[90px]">
                  {a.almacenNombre}
                </p>
              </div>
            );
          })}
          {todas.length > 7 && (
            <p className="text-[11px] font-dm text-stone-400 mt-2 text-center">
              +{todas.length - 7} alertas más
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function OrdenesActivas({ ordenes, loading, onNavigate }) {
  if (loading) return <Skeleton className="h-40 rounded-2xl" />;

  const activas = (ordenes ?? []).filter(
    (o) =>
      o.estado === "BORRADOR" ||
      o.estado === "PENDIENTE" ||
      o.estado === "ENVIADA",
  );

  const ESTADO_STYLE = {
    BORRADOR: { bg: "#f1f5f9", text: "#64748b" },
    PENDIENTE: { bg: "#fef3c7", text: "#d97706" },
    ENVIADA: { bg: "#dbeafe", text: "#2563eb" },
    RECIBIDA: { bg: G[50], text: G[300] },
    CANCELADA: { bg: "#fee2e2", text: "#dc2626" },
  };

  return (
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
            Órdenes activas
          </p>
          {activas.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-dm font-bold"
              style={{ background: G[50], color: G[300] }}
            >
              {activas.length}
            </span>
          )}
        </div>
        <button
          onClick={() => onNavigate("/inventario/ordenes")}
          className="text-xs font-dm font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
          style={{ color: G[300] }}
        >
          Ver todas <ArrowRight size={12} />
        </button>
      </div>

      {activas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: G[50] }}
          >
            <CheckCircle2 size={15} style={{ color: G[300] }} />
          </div>
          <p className="text-xs font-dm text-stone-400">
            Sin órdenes pendientes
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-dm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left py-2 text-stone-400 font-semibold">
                  Proveedor
                </th>
                <th className="text-left py-2 text-stone-400 font-semibold">
                  Estado
                </th>
                <th className="text-right py-2 text-stone-400 font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {activas.slice(0, 5).map((o) => {
                const s = ESTADO_STYLE[o.estado] ?? ESTADO_STYLE.BORRADOR;
                return (
                  <tr
                    key={o.id}
                    className="border-b border-stone-50 last:border-0"
                  >
                    <td className="py-2.5 text-stone-700 font-medium truncate max-w-[140px]">
                      {o.proveedorNombre}
                    </td>
                    <td className="py-2.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                        style={{ background: s.bg, color: s.text }}
                      >
                        {o.estado.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-stone-600">
                      {o.moneda} {fmt(o.totalEstimado)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AccesoCard({
  icon: Icon,
  title,
  desc,
  href,
  badge,
  badgeColor,
  onNavigate,
}) {
  return (
    <button
      onClick={() => onNavigate(href)}
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
              {badge != null && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-dm font-bold"
                  style={{
                    background:
                      badgeColor === "red"
                        ? "#fee2e2"
                        : badgeColor === "amber"
                          ? "#fef3c7"
                          : G[50],
                    color:
                      badgeColor === "red"
                        ? "#dc2626"
                        : badgeColor === "amber"
                          ? "#d97706"
                          : G[300],
                  }}
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

// ── Componente principal ───────────────────────────────────────────────────
export default function AInventarioDashboard() {
  const navigate = useNavigate();

  const { data: pData, loading: pLoading } = useQuery(GET_PROVEEDORES, {
    fetchPolicy: "cache-and-network",
  });

  const { data: alData, loading: alLoading } = useQuery(GET_ALERTAS, {
    variables: { estado: "PENDIENTE" },
    fetchPolicy: "cache-and-network",
  });

  const { data: oData, loading: oLoading } = useQuery(GET_ORDENES_COMPRA, {
    fetchPolicy: "cache-and-network",
  });

  const { data: almData, loading: almLoading } = useQuery(GET_ALMACENES, {
    fetchPolicy: "cache-and-network",
  });

  const proveedores = pData?.proveedores ?? [];
  const alertas = alData?.alertasStock ?? [];
  const ordenes = oData?.ordenesCompra ?? [];
  const almacenes = almData?.almacenes ?? [];

  const provActivos = proveedores.filter((p) => p.activo).length;
  const alertasCrit = alertas.filter((a) => a.tipoAlerta === "AGOTADO").length;
  const ordPend = ordenes.filter((o) =>
    ["BORRADOR", "PENDIENTE", "ENVIADA"].includes(o.estado),
  ).length;

  const loading = pLoading || alLoading || oLoading || almLoading;

  return (
    <div className="space-y-7">
      {/* ── Encabezado ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-playfair font-bold"
            style={{ color: G[900] }}
          >
            Inventario
          </h1>
          <p className="text-sm font-dm text-stone-400 mt-0.5">
            Vista global de la cadena — proveedores, stock y compras
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-dm font-semibold"
          style={{ background: G[50], color: G[300] }}
        >
          <BarChart3 size={12} />
          Admin Central
        </div>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={Truck}
          label="Proveedores activos"
          value={loading ? "—" : fmt(provActivos)}
          sub={`${proveedores.length} en total`}
          accent
          onClick={() => navigate("/inventario/proveedores")}
        />
        <KpiCard
          icon={Warehouse}
          label="Almacenes"
          value={loading ? "—" : fmt(almacenes.length)}
          sub="En toda la cadena"
          onClick={() => navigate("/inventario/almacenes")}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Alertas críticas"
          value={loading ? "—" : fmt(alertasCrit)}
          sub="Ingredientes agotados"
          critical={alertasCrit > 0}
          onClick={
            alertasCrit > 0 ? () => navigate("/inventario/alertas") : undefined
          }
        />
        <KpiCard
          icon={ShoppingCart}
          label="Órdenes activas"
          value={loading ? "—" : fmt(ordPend)}
          sub="Borradores y enviadas"
          onClick={() => navigate("/inventario/ordenes")}
        />
      </div>

      {/* ── Proveedores por alcance ────────────────────────────────────────── */}
      <ProveedoresPorAlcance
        proveedores={proveedores}
        loading={pLoading}
        onNavigate={navigate}
      />

      {/* ── Grid: Alertas + Órdenes ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertasGlobales alertas={alertas} loading={alLoading} />
        <OrdenesActivas
          ordenes={ordenes}
          loading={oLoading}
          onNavigate={navigate}
        />
      </div>

      {/* ── Accesos rápidos ────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-dm font-semibold text-stone-400 uppercase tracking-wider px-1 mb-3">
          Gestión global de inventario
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AccesoCard
            icon={Truck}
            title="Proveedores"
            desc="Crear globales, por país o ciudad"
            href="/inventario/proveedores"
            badge={proveedores.length > 0 ? proveedores.length : null}
            onNavigate={navigate}
          />
          <AccesoCard
            icon={Warehouse}
            title="Almacenes"
            desc="Ver almacenes de todos los restaurantes"
            href="/inventario/almacenes"
            badge={almacenes.length > 0 ? almacenes.length : null}
            onNavigate={navigate}
          />
          <AccesoCard
            icon={Package}
            title="Stock global"
            desc="Niveles de stock por restaurante"
            href="/inventario/stock"
            onNavigate={navigate}
          />
          <AccesoCard
            icon={ShoppingCart}
            title="Órdenes de compra"
            desc="Supervisar órdenes de la cadena"
            href="/inventario/ordenes"
            badge={ordPend > 0 ? ordPend : null}
            badgeColor={ordPend > 0 ? "amber" : undefined}
            onNavigate={navigate}
          />
          <AccesoCard
            icon={AlertTriangle}
            title="Alertas"
            desc="Alertas de stock de toda la cadena"
            href="/inventario/alertas"
            badge={alertas.length > 0 ? alertas.length : null}
            badgeColor={
              alertasCrit > 0 ? "red" : alertas.length > 0 ? "amber" : undefined
            }
            onNavigate={navigate}
          />
          <AccesoCard
            icon={TrendingDown}
            title="Lotes"
            desc="Trazabilidad y vencimientos"
            href="/inventario/lotes"
            onNavigate={navigate}
          />
        </div>
      </div>
    </div>
  );
}
