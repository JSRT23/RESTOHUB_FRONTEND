// src/features/orders/components/Cajero/CPedidosDia.jsx
// CAMBIOS:
//  - Filtra solo pedidos del DÍA (cliente-side, sin cambio de query)
//  - "Total recaudado" es clickeable → modal desglose por método de pago
//  - Botón "Historial" → modal con todos los pedidos históricos

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  ClipboardList,
  Banknote,
  CreditCard,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  Receipt,
  ChevronRight,
  X,
  History,
  Wallet,
  QrCode,
} from "lucide-react";
import { GET_PEDIDOS } from "../../graphql/operations";
import {
  PageHeader,
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

const fmt = (n, m = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: m,
    maximumFractionDigits: 0,
  }).format(n ?? 0);
const fmtH = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const fmtFD = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
      })
    : "—";
const esHoy = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  const h = new Date();
  return (
    d.getFullYear() === h.getFullYear() &&
    d.getMonth() === h.getMonth() &&
    d.getDate() === h.getDate()
  );
};

const ESTADO_META = {
  RECIBIDO: { label: "Recibido", variant: "blue" },
  EN_PREPARACION: { label: "En preparación", variant: "amber" },
  LISTO: { label: "Listo", variant: "green" },
  ENTREGADO: { label: "Cobrado", variant: "green" },
  CANCELADO: { label: "Cancelado", variant: "red" },
};

const METODO_CFG = {
  efectivo: {
    label: "Efectivo",
    icon: Banknote,
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  tarjeta: {
    label: "Tarjeta",
    icon: CreditCard,
    color: "#3b82f6",
    bg: "#eff6ff",
  },
  nequi: { label: "Nequi", icon: Smartphone, color: "#7c3aed", bg: "#faf5ff" },
  daviplata: {
    label: "Daviplata",
    icon: Smartphone,
    color: "#dc2626",
    bg: "#fef2f2",
  },
  transferencia: {
    label: "Transferencia",
    icon: Receipt,
    color: "#d97706",
    bg: "#fffbeb",
  },
  qr: { label: "QR / PSE", icon: QrCode, color: "#0891b2", bg: "#ecfeff" },
};

// ── Modal desglose de caja ────────────────────────────────────────────────
function ModalCaja({ cobrados, moneda, onClose }) {
  // Agrupar por método de pago
  const porMetodo = useMemo(() => {
    const map = {};
    cobrados.forEach((p) => {
      const m = p.metodoPago ?? "efectivo";
      if (!map[m]) map[m] = { total: 0, count: 0 };
      map[m].total += parseFloat(p.totalCobrado ?? p.total ?? 0);
      map[m].count++;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([metodo, data]) => ({ metodo, ...data }));
  }, [cobrados]);

  const totalGeneral = cobrados.reduce(
    (s, p) => s + parseFloat(p.totalCobrado ?? p.total ?? 0),
    0,
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(5,31,32,0.6)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ boxShadow: "0 32px 80px rgba(5,31,32,0.3)" }}
      >
        {/* Header verde */}
        <div
          className="px-6 pt-6 pb-5"
          style={{ background: `linear-gradient(135deg,${G[900]},${G[500]})` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-dm font-bold tracking-widest uppercase text-emerald-300 mb-1">
                Resumen de caja
              </p>
              <p className="font-playfair text-3xl font-bold text-white">
                {fmt(totalGeneral, moneda)}
              </p>
              <p className="text-sm font-dm text-emerald-200 mt-1">
                {cobrados.length} pedido{cobrados.length !== 1 ? "s" : ""}{" "}
                cobrados hoy
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Desglose por método */}
        <div className="p-5 space-y-3">
          <p className="text-[10px] font-dm font-bold uppercase tracking-widest text-stone-400">
            Por método de pago
          </p>
          {porMetodo.length === 0 ? (
            <p className="text-sm font-dm text-stone-400 text-center py-4">
              Sin pagos registrados
            </p>
          ) : (
            <div className="space-y-2">
              {porMetodo.map(({ metodo, total, count }) => {
                const cfg = METODO_CFG[metodo] ?? {
                  label: metodo,
                  icon: Wallet,
                  color: G[300],
                  bg: G[50],
                };
                const Icon = cfg.icon;
                const pct = totalGeneral > 0 ? (total / totalGeneral) * 100 : 0;
                return (
                  <div
                    key={metodo}
                    className="rounded-2xl border p-4 space-y-2"
                    style={{
                      background: cfg.bg,
                      borderColor: `${cfg.color}30`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: cfg.color + "20" }}
                        >
                          <Icon size={14} style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-dm font-semibold text-stone-800">
                            {cfg.label}
                          </p>
                          <p className="text-[10px] font-dm text-stone-400">
                            {count} pago{count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className="font-playfair font-bold text-lg"
                          style={{ color: cfg.color }}
                        >
                          {fmt(total, moneda)}
                        </p>
                        <p className="text-[10px] font-dm text-stone-400">
                          {pct.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    {/* Mini barra */}
                    <div className="h-1 rounded-full bg-white/70 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: cfg.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Nota efectivo */}
        {porMetodo.find((m) => m.metodo === "efectivo") && (
          <div className="px-5 pb-5">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-stone-50 border border-stone-200">
              <Banknote size={14} className="text-stone-400 shrink-0" />
              <p className="text-xs font-dm text-stone-500">
                Efectivo en caja:{" "}
                <strong className="text-stone-800">
                  {fmt(
                    porMetodo.find((m) => m.metodo === "efectivo")?.total ?? 0,
                    moneda,
                  )}
                </strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Modal historial ───────────────────────────────────────────────────────
function ModalHistorial({ pedidos, moneda, onClose }) {
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
          maxHeight: "88dvh",
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
                Historial completo
              </p>
              <p className="text-[11px] font-dm text-stone-400">
                {historico.length} pedidos en total
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
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-stone-100">
              <tr>
                {["Pedido", "Fecha", "Estado", "Método", "Total"].map((l) => (
                  <th
                    key={l}
                    className="py-2.5 px-3 text-left text-[10px] font-dm font-semibold text-stone-400 uppercase tracking-wide first:pl-5 last:pr-5 last:text-right"
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historico.map((p) => {
                const meta = ESTADO_META[p.estado] ?? ESTADO_META.RECIBIDO;
                const cfg = p.metodoPago
                  ? (METODO_CFG[p.metodoPago] ?? null)
                  : null;
                const Icon = cfg?.icon ?? null;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="py-3 pl-5 pr-3">
                      <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg">
                        {p.numeroDia
                          ? `#${p.numeroDia}`
                          : `#${p.id.slice(-6).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs font-dm text-stone-500 whitespace-nowrap">
                      {fmtFD(p.fechaCreacion)} {fmtH(p.fechaCreacion)}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={meta.variant} size="xs">
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      {Icon ? (
                        <div className="flex items-center gap-1.5 text-xs font-dm text-stone-500">
                          <Icon size={11} /> {cfg.label}
                        </div>
                      ) : (
                        <span className="text-stone-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-5 pl-3 text-right">
                      <span className="font-playfair font-bold text-stone-800">
                        {fmt(
                          parseFloat(p.totalCobrado ?? p.total ?? 0),
                          p.moneda,
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function CPedidosDia() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;
  const [filtro, setFiltro] = useState("todos");
  const [showCaja, setShowCaja] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);

  const { data, loading, refetch } = useQuery(GET_PEDIDOS, {
    variables: { restauranteId },
    fetchPolicy: "cache-and-network",
    pollInterval: 20000,
    skip: !restauranteId,
  });

  const todos = data?.pedidos ?? [];

  // Solo pedidos de HOY
  const pedidosHoy = useMemo(
    () => todos.filter((p) => esHoy(p.fechaCreacion)),
    [todos],
  );

  const cobrados = useMemo(
    () => pedidosHoy.filter((p) => p.estado === "ENTREGADO"),
    [pedidosHoy],
  );
  const cancelados = useMemo(
    () => pedidosHoy.filter((p) => p.estado === "CANCELADO"),
    [pedidosHoy],
  );
  const enCurso = useMemo(
    () =>
      pedidosHoy.filter((p) => !["ENTREGADO", "CANCELADO"].includes(p.estado)),
    [pedidosHoy],
  );

  const totalRecaudado = cobrados.reduce(
    (s, p) => s + parseFloat(p.totalCobrado ?? p.total ?? 0),
    0,
  );
  const moneda = pedidosHoy[0]?.moneda ?? "COP";

  const filtrados = useMemo(() => {
    if (filtro === "cobrados") return cobrados;
    if (filtro === "en_curso") return enCurso;
    if (filtro === "cancelados") return cancelados;
    return pedidosHoy;
  }, [pedidosHoy, filtro, cobrados, enCurso, cancelados]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cajero"
        title="Pedidos del día"
        description={`${new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}`}
        action={
          <div className="flex items-center gap-2">
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
        }
      />

      {/* KPIs — Total recaudado clickeable */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* TOTAL RECAUDADO — clickeable → modal caja */}
        <button
          onClick={() => cobrados.length > 0 && setShowCaja(true)}
          className="flex items-center gap-3 p-4 rounded-2xl border transition-all text-left group"
          style={{
            background: G[50],
            borderColor: G[100],
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
          title={
            cobrados.length > 0 ? "Ver desglose por método de pago" : undefined
          }
        >
          <TrendingUp size={15} style={{ color: G[100] }} />
          <div className="flex-1 min-w-0">
            <p
              className="text-xl font-playfair font-bold truncate"
              style={{ color: G[300] }}
            >
              {fmt(totalRecaudado, moneda)}
            </p>
            <div className="flex items-center gap-1">
              <p
                className="text-[10px] font-dm font-semibold"
                style={{ color: G[300] }}
              >
                Total recaudado
              </p>
              {cobrados.length > 0 && (
                <ChevronRight
                  size={10}
                  style={{ color: G[300] }}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              )}
            </div>
          </div>
        </button>

        {[
          {
            label: "Cobrados",
            v: cobrados.length,
            icon: <CheckCircle2 size={15} className="text-emerald-300" />,
            bg: "#f0fdf4",
            bc: "#bbf7d0",
            tc: "#16a34a",
          },
          {
            label: "En curso",
            v: enCurso.length,
            icon: <Clock size={15} className="text-amber-300" />,
            bg: "#fffbeb",
            bc: "#fde68a",
            tc: "#d97706",
          },
          {
            label: "Cancelados",
            v: cancelados.length,
            icon: (
              <XCircle
                size={15}
                className={
                  cancelados.length > 0 ? "text-red-300" : "text-stone-300"
                }
              />
            ),
            bg: cancelados.length > 0 ? "#fef2f2" : "#f5f5f4",
            bc: cancelados.length > 0 ? "#fecaca" : "#e5e5e5",
            tc: cancelados.length > 0 ? "#dc2626" : "#a8a29e",
          },
        ].map(({ label, v, icon, bg, bc, tc }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-4 rounded-2xl border"
            style={{
              background: bg,
              borderColor: bc,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            {icon}
            <div>
              <p
                className="text-xl font-playfair font-bold"
                style={{ color: tc }}
              >
                {v}
              </p>
              <p
                className="text-[10px] font-dm font-semibold"
                style={{ color: tc }}
              >
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl w-fit overflow-x-auto">
        {[
          { v: "todos", l: "Todos", n: pedidosHoy.length },
          { v: "cobrados", l: "Cobrados", n: cobrados.length },
          { v: "en_curso", l: "En curso", n: enCurso.length },
          { v: "cancelados", l: "Cancelados", n: cancelados.length },
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

      {/* Tabla */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin pedidos"
          description="No hay pedidos en este filtro."
        />
      ) : (
        <div
          className="bg-white border border-stone-200 rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                {["Pedido", "Hora", "Estado", "Método", "Total"].map((l) => (
                  <th
                    key={l}
                    className="py-2.5 px-3 text-left text-[10px] font-dm font-semibold text-stone-400 uppercase tracking-wide first:pl-5 last:pr-5 last:text-right"
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const meta = ESTADO_META[p.estado] ?? ESTADO_META.RECIBIDO;
                const cfg = p.metodoPago
                  ? (METODO_CFG[p.metodoPago] ?? null)
                  : null;
                const Icon = cfg?.icon ?? null;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="py-3 pl-5 pr-3">
                      <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg">
                        {p.numeroDia
                          ? `#${p.numeroDia}`
                          : `#${p.id.slice(-8).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs font-dm text-stone-500">
                      {fmtH(p.fechaCreacion)}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={meta.variant} size="xs">
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      {Icon ? (
                        <div className="flex items-center gap-1.5 text-xs font-dm text-stone-500">
                          <Icon size={12} /> {cfg.label}
                        </div>
                      ) : (
                        <span className="text-stone-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-5 pl-3 text-right">
                      <span className="font-playfair font-bold text-stone-800">
                        {fmt(
                          parseFloat(p.totalCobrado ?? p.total ?? 0),
                          p.moneda,
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {cobrados.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-stone-200 bg-stone-50">
                  <td
                    colSpan={4}
                    className="py-3 pl-5 pr-3 text-xs font-dm font-semibold text-stone-500"
                  >
                    Total recaudado ({cobrados.length} pedidos)
                  </td>
                  <td className="py-3 pr-5 pl-3 text-right">
                    <span
                      className="font-playfair text-lg font-bold"
                      style={{ color: G[300] }}
                    >
                      {fmt(totalRecaudado, moneda)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {showCaja && (
        <ModalCaja
          cobrados={cobrados}
          moneda={moneda}
          onClose={() => setShowCaja(false)}
        />
      )}
      {showHistorial && (
        <ModalHistorial
          pedidos={todos}
          moneda={moneda}
          onClose={() => setShowHistorial(false)}
        />
      )}
    </div>
  );
}
