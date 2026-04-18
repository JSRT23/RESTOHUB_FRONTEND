// src/features/orders/components/Cajero/CPedidosDia.jsx
// Cajero — historial de pedidos cobrados hoy.
// Ve todos los pedidos del restaurante del día, sus estados y totales.
// Resumen: total recaudado, por método de pago, cantidad de pedidos.
// Ruta: /caja/pedidos

import { useState, useMemo } from "react";
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
  ChefHat,
  RefreshCw,
  TrendingUp,
  Receipt,
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

const ESTADO_META = {
  RECIBIDO: { label: "Recibido", variant: "blue" },
  EN_PREPARACION: { label: "En preparación", variant: "amber" },
  LISTO: { label: "Listo", variant: "green" },
  ENTREGADO: { label: "Cobrado", variant: "green" },
  CANCELADO: { label: "Cancelado", variant: "red" },
};

const METODO_ICON = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  nequi: Smartphone,
  daviplata: Smartphone,
  transferencia: Receipt,
};

export default function CPedidosDia() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;
  const [filtro, setFiltro] = useState("todos");

  const { data, loading, refetch } = useQuery(GET_PEDIDOS, {
    variables: { restauranteId },
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });

  const pedidos = data?.pedidos ?? [];
  const cobrados = pedidos.filter((p) => p.estado === "ENTREGADO");
  const cancelados = pedidos.filter((p) => p.estado === "CANCELADO");
  const enCurso = pedidos.filter(
    (p) => !["ENTREGADO", "CANCELADO"].includes(p.estado),
  );

  // Total recaudado (suma de totalCobrado si existe, si no total)
  const totalRecaudado = cobrados.reduce(
    (s, p) => s + (p.totalCobrado ?? p.total ?? 0),
    0,
  );
  const moneda = pedidos[0]?.moneda ?? "COP";

  const filtrados = useMemo(() => {
    if (filtro === "cobrados") return cobrados;
    if (filtro === "en_curso") return enCurso;
    if (filtro === "cancelados") return cancelados;
    return pedidos;
  }, [pedidos, filtro]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cajero"
        title="Pedidos del día"
        description="Historial completo de pedidos de hoy."
        action={
          <button
            onClick={() => refetch()}
            className="w-8 h-8 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        }
      />

      {/* Resumen del día */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total recaudado",
            value: fmtMoney(totalRecaudado, moneda),
            style: { background: G[50], borderColor: G[100] },
            textColor: G[300],
            icon: <TrendingUp size={15} style={{ color: G[100] }} />,
          },
          {
            label: "Pedidos cobrados",
            value: cobrados.length,
            style: { background: "#f0fdf4", borderColor: "#bbf7d0" },
            textColor: "#16a34a",
            icon: <CheckCircle2 size={15} className="text-emerald-300" />,
          },
          {
            label: "En curso",
            value: enCurso.length,
            style: { background: "#fffbeb", borderColor: "#fde68a" },
            textColor: "#d97706",
            icon: <Clock size={15} className="text-amber-300" />,
          },
          {
            label: "Cancelados",
            value: cancelados.length,
            style:
              cancelados.length > 0
                ? { background: "#fef2f2", borderColor: "#fecaca" }
                : { background: "#f5f5f4", borderColor: "#e5e5e5" },
            textColor: cancelados.length > 0 ? "#dc2626" : "#a8a29e",
            icon: (
              <XCircle
                size={15}
                className={
                  cancelados.length > 0 ? "text-red-300" : "text-stone-300"
                }
              />
            ),
          },
        ].map(({ label, value, style, textColor, icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-4 rounded-2xl border"
            style={{ ...style, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            {icon}
            <div>
              <p
                className="text-xl font-playfair font-bold"
                style={{ color: textColor }}
              >
                {value}
              </p>
              <p
                className="text-[10px] font-dm font-semibold"
                style={{ color: textColor }}
              >
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl w-fit">
        {[
          { v: "todos", l: "Todos", n: pedidos.length },
          { v: "cobrados", l: "Cobrados", n: cobrados.length },
          { v: "en_curso", l: "En curso", n: enCurso.length },
          { v: "cancelados", l: "Cancelados", n: cancelados.length },
        ].map(({ v, l, n }) => (
          <button
            key={v}
            onClick={() => setFiltro(v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
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
          description="No hay pedidos en este filtro todavía."
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
                const MetodoIcon = p.metodoPago
                  ? (METODO_ICON[p.metodoPago] ?? Banknote)
                  : null;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="py-3 pl-5 pr-3">
                      <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg">
                        #{p.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs font-dm text-stone-500">
                      {fmtHora(p.fechaCreacion)}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={meta.variant} size="xs">
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      {MetodoIcon ? (
                        <div className="flex items-center gap-1.5 text-xs font-dm text-stone-500">
                          <MetodoIcon size={12} /> {p.metodoPago}
                        </div>
                      ) : (
                        <span className="text-[10px] font-dm text-stone-300">
                          —
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-5 pl-3 text-right">
                      <span className="font-playfair font-bold text-stone-800">
                        {fmtMoney(p.totalCobrado ?? p.total, p.moneda)}
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
                      {fmtMoney(totalRecaudado, moneda)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
