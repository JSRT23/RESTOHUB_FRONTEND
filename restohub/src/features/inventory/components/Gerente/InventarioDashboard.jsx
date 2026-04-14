// src/features/inventory/components/gerente/InventarioDashboard.jsx
//
// Dashboard principal de inventario para el gerente local.
// Muestra: almacén central del restaurante, KPIs de stock, proveedores activos
// y órdenes de compra pendientes. Punto de entrada desde el navbar → Inventario.
//
// Rutas que alimenta este módulo (paso a paso):
//   /gerente/inventario          ← esta página
//   /gerente/proveedores         ← próximo paso
//   /gerente/ordenes             ← siguiente
//   /gerente/stock               ← luego

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
  Clock,
  TrendingDown,
  Box,
  ChevronRight,
  BarChart3,
  Layers,
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

// ── Paleta del sistema ─────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(num, moneda = "") {
  if (num == null) return "—";
  const f = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
  return moneda ? `${moneda} ${f}` : f;
}

function getAlmacenNombre(almacenRaw, restauranteNombre) {
  // El almacén se crea automáticamente vía RabbitMQ con nombre "Almacen Central".
  // Lo mostramos como "Almacén Central — <nombre del restaurante>".
  if (!almacenRaw) return "—";
  const base = almacenRaw.nombre || "Almacén Central";
  if (restauranteNombre) return `${base} — ${restauranteNombre}`;
  return base;
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, accent, critical, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-2xl border border-stone-200 p-5 hover:-translate-y-0.5 transition-all duration-200"
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

function AlmacenCard({ almacen, restauranteNombre, loading }) {
  if (loading) return <Skeleton className="h-28 rounded-2xl" />;
  if (!almacen)
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
          <AlertTriangle size={18} />
        </div>
        <div>
          <p className="text-sm font-dm font-semibold text-amber-800">
            Sin almacén registrado
          </p>
          <p className="text-xs font-dm text-amber-600 mt-0.5">
            El almacén se crea automáticamente al crear el restaurante. Si no
            aparece, aguarda unos segundos y recarga.
          </p>
        </div>
      </div>
    );

  const nombre = getAlmacenNombre(almacen, restauranteNombre);
  const pct =
    almacen.totalIngredientes > 0
      ? Math.round(
          ((almacen.totalIngredientes - almacen.ingredientesBajoMinimo) /
            almacen.totalIngredientes) *
            100,
        )
      : 100;

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
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs font-dm text-white/60">
            <span className="text-white font-semibold">
              {almacen.totalIngredientes ?? 0}
            </span>{" "}
            ingredientes
          </span>
          {almacen.ingredientesBajoMinimo > 0 && (
            <span className="text-xs font-dm text-red-300">
              <span className="font-semibold">
                {almacen.ingredientesBajoMinimo}
              </span>{" "}
              bajo mínimo
            </span>
          )}
        </div>
        {/* barra de salud del stock */}
        <div className="mt-2.5 h-1.5 rounded-full bg-white/10 overflow-hidden w-full">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct > 70 ? G[50] : pct > 40 ? "#fde68a" : "#fca5a5",
            }}
          />
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-2xl font-dm font-bold" style={{ color: G[50] }}>
          {pct}%
        </p>
        <p className="text-[10px] font-dm text-white/50">Capacidad</p>
      </div>
    </div>
  );
}

function AccesoCard({ icon: Icon, title, desc, href, badge, badgeColor }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(href)}
      className="group w-full text-left bg-white rounded-2xl border border-stone-200 p-5 hover:border-stone-300 hover:-translate-y-0.5 transition-all duration-200"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: G[50], color: G[300] }}
          >
            <Icon size={18} />
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
          size={15}
          className="text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </button>
  );
}

function AlertaRow({ alerta }) {
  const tipoLabel = {
    bajo_minimo: "Bajo mínimo",
    agotado: "Agotado",
    por_vencer: "Por vencer",
    vencido: "Vencido",
  };
  const colors = {
    bajo_minimo: { bg: "#fef3c7", text: "#d97706" },
    agotado: { bg: "#fee2e2", text: "#dc2626" },
    por_vencer: { bg: "#fef3c7", text: "#d97706" },
    vencido: { bg: "#fee2e2", text: "#dc2626" },
  };
  const c = colors[alerta.tipoAlerta] ?? { bg: G[50], text: G[300] };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-stone-100 last:border-0">
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-dm font-semibold shrink-0"
        style={{ background: c.bg, color: c.text }}
      >
        {tipoLabel[alerta.tipoAlerta] ?? alerta.tipoAlerta}
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

// ── Componente principal ───────────────────────────────────────────────────
export default function InventarioDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const restauranteId = user?.restauranteId;

  // ── Datos ──────────────────────────────────────────────────────────────
  const { data: rData } = useQuery(GET_MI_RESTAURANTE, {
    variables: { id: restauranteId },
    skip: !restauranteId,
  });

  const { data: aData, loading: aLoading } = useQuery(GET_ALMACENES, {
    variables: { restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  const { data: sData, loading: sLoading } = useQuery(GET_STOCK, {
    variables: {},
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  const { data: pData, loading: pLoading } = useQuery(GET_PROVEEDORES, {
    variables: { activo: true },
    fetchPolicy: "cache-and-network",
  });

  const { data: oData, loading: oLoading } = useQuery(GET_ORDENES_COMPRA, {
    variables: { restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  const { data: alData } = useQuery(GET_ALERTAS, {
    variables: { restauranteId, estado: "activa" },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  // ── Derivados ──────────────────────────────────────────────────────────
  const restaurante = rData?.restaurante;
  const almacenes = aData?.almacenes ?? [];
  // El almacén principal es el primero (creado por RabbitMQ al crear el restaurante)
  const almacenPrincipal = almacenes[0] ?? null;

  const stock = sData?.stock ?? [];
  const stockCritico = stock.filter(
    (s) => s.necesitaReposicion || s.estaAgotado,
  ).length;
  const stockAgotado = stock.filter((s) => s.estaAgotado).length;

  const proveedores = pData?.proveedores ?? [];

  const ordenes = oData?.ordenesCompra ?? [];
  const ordenesPendientes = ordenes.filter(
    (o) => o.estado === "borrador" || o.estado === "enviada",
  ).length;
  const ordenesEnviadas = ordenes.filter((o) => o.estado === "enviada").length;

  const alertas = alData?.alertasStock ?? [];
  const alertasCriticas = alertas.filter(
    (a) => a.tipoAlerta === "agotado" || a.tipoAlerta === "vencido",
  );
  const alertasWarn = alertas.filter(
    (a) => a.tipoAlerta === "bajo_minimo" || a.tipoAlerta === "por_vencer",
  );

  const loading = aLoading || sLoading || pLoading || oLoading;

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
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-dm font-semibold"
          style={{ background: G[50], color: G[300] }}
        >
          <BarChart3 size={12} />
          {restaurante?.nombre ?? "Mi restaurante"}
        </div>
      </div>

      {/* ── Almacén principal ────────────────────────────────────────────── */}
      <AlmacenCard
        almacen={almacenPrincipal}
        restauranteNombre={restaurante?.nombre}
        loading={aLoading}
      />

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={Package}
          label="Ingredientes en stock"
          value={loading ? "—" : fmt(stock.length)}
          sub={`${stockAgotado > 0 ? stockAgotado + " agotados" : "Todos disponibles"}`}
          accent
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
          label="Órdenes pendientes"
          value={loading ? "—" : fmt(ordenesPendientes)}
          sub={`${ordenesEnviadas} enviadas al proveedor`}
          critical={ordenesEnviadas > 0}
          onClick={() => navigate("/gerente/ordenes")}
        />
      </div>

      {/* ── Grid inferior: Alertas + Accesos rápidos ─────────────────────── */}
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
                }}
              >
                <AlertTriangle
                  size={13}
                  style={{
                    color: alertasCriticas.length > 0 ? "#dc2626" : G[300],
                  }}
                />
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
              {/* Críticas primero */}
              {[...alertasCriticas, ...alertasWarn].slice(0, 6).map((a) => (
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
            Gestión de inventario
          </p>
          <AccesoCard
            icon={Truck}
            title="Proveedores"
            desc="Crear y gestionar relaciones con proveedores"
            href="/gerente/proveedores"
            badge={proveedores.length > 0 ? proveedores.length : null}
          />
          <AccesoCard
            icon={ShoppingCart}
            title="Órdenes de compra"
            desc="Crear, enviar y recibir órdenes"
            href="/gerente/ordenes"
            badge={ordenesPendientes > 0 ? ordenesPendientes : null}
            badgeColor={ordenesEnviadas > 0 ? "amber" : undefined}
          />
          <AccesoCard
            icon={Layers}
            title="Stock"
            desc="Niveles actuales y movimientos"
            href="/gerente/stock"
            badge={stockCritico > 0 ? stockCritico : null}
            badgeColor={stockCritico > 0 ? "red" : undefined}
          />
          <AccesoCard
            icon={Box}
            title="Lotes"
            desc="Trazabilidad y fechas de vencimiento"
            href="/gerente/lotes"
          />
        </div>
      </div>

      {/* ── Órdenes recientes ────────────────────────────────────────────── */}
      {ordenes.length > 0 && (
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
                <Clock size={13} style={{ color: G[300] }} />
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
                  <th className="text-left py-2 text-stone-400 font-semibold">
                    Proveedor
                  </th>
                  <th className="text-left py-2 text-stone-400 font-semibold">
                    Estado
                  </th>
                  <th className="text-right py-2 text-stone-400 font-semibold">
                    Total
                  </th>
                  <th className="text-right py-2 text-stone-400 font-semibold">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordenes.slice(0, 5).map((o) => {
                  const estadoStyle = {
                    borrador: { bg: "#f1f5f9", text: "#64748b" },
                    enviada: { bg: "#fef3c7", text: "#d97706" },
                    recibida: { bg: G[50], text: G[300] },
                    cancelada: { bg: "#fee2e2", text: "#dc2626" },
                  };
                  const s = estadoStyle[o.estado] ?? estadoStyle.borrador;
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
                          {o.estado}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-stone-600">
                        {fmt(o.totalEstimado, o.moneda)}
                      </td>
                      <td className="py-2.5 text-right text-stone-400">
                        {o.fechaCreacion
                          ? new Date(o.fechaCreacion).toLocaleDateString(
                              "es-CO",
                              { day: "2-digit", month: "short" },
                            )
                          : "—"}
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
