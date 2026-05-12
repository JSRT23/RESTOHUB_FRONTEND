// src/features/inventory/components/admin/AOrdenesCompra.jsx
// Admin Central — órdenes de compra de toda la cadena.
// Ve, filtra por restaurante/proveedor/estado.
// Solo lectura + puede ver detalle expandible.

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import {
  ShoppingCart,
  Search,
  ChevronDown,
  ChevronUp,
  Building2,
  Truck,
  CalendarDays,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Coins,
  FileText,
} from "lucide-react";
import { GET_ORDENES_COMPRA, GET_ORDEN_COMPRA } from "../../graphql/queries";
import { GET_RESTAURANTES } from "../../../menu/components/admin/graphql/operations";
import { GET_PROVEEDORES } from "../../graphql/queries";
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

const ESTADO_META = {
  BORRADOR: {
    label: "Borrador",
    variant: "default",
    bg: "#f1f5f9",
    text: "#64748b",
    dot: "bg-stone-400",
  },
  PENDIENTE: {
    label: "Pendiente",
    variant: "amber",
    bg: "#fef3c7",
    text: "#d97706",
    dot: "bg-amber-400",
  },
  ENVIADA: {
    label: "Enviada",
    variant: "blue",
    bg: "#dbeafe",
    text: "#2563eb",
    dot: "bg-blue-400",
  },
  RECIBIDA: {
    label: "Recibida",
    variant: "green",
    bg: G[50],
    text: G[300],
    dot: "bg-emerald-500",
  },
  CANCELADA: {
    label: "Cancelada",
    variant: "red",
    bg: "#fee2e2",
    text: "#dc2626",
    dot: "bg-red-500",
  },
};

function fmt(n, moneda = "COP") {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Fila expandible de orden ───────────────────────────────────────────────
function OrdenRow({ orden, restaurante }) {
  const [expanded, setExpanded] = useState(false);
  const meta = ESTADO_META[orden.estado] ?? ESTADO_META.BORRADOR;

  // Cargar detalle solo al expandir
  const { data: detData, loading: detLoading } = useQuery(GET_ORDEN_COMPRA, {
    variables: { id: orden.id },
    skip: !expanded,
    fetchPolicy: "cache-first",
  });

  const detalle = detData?.ordenCompra;

  return (
    <>
      <tr
        className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Proveedor */}
        <td className="py-3.5 pl-5 pr-3">
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
            <div>
              <p className="text-sm font-dm font-semibold text-stone-800 leading-tight truncate max-w-[140px]">
                {orden.proveedorNombre ?? "—"}
              </p>
              <p className="text-[10px] font-dm text-stone-400 font-mono mt-0.5">
                #{orden.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
        </td>

        {/* Restaurante */}
        <td className="py-3.5 px-3">
          <p className="text-xs font-dm font-semibold text-stone-700 truncate max-w-[130px]">
            {restaurante?.nombre ?? "—"}
          </p>
          <p className="text-[10px] font-dm text-stone-400">
            {restaurante?.ciudad ?? ""}
          </p>
        </td>

        {/* Estado */}
        <td className="py-3.5 px-3">
          <Badge variant={meta.variant} size="xs">
            {meta.label}
          </Badge>
        </td>

        {/* Fechas */}
        <td className="py-3.5 px-3 hidden lg:table-cell">
          <p className="text-xs font-dm text-stone-600">
            {fmtFecha(orden.fechaCreacion)}
          </p>
          {orden.fechaEntregaEstimada && (
            <p className="text-[10px] font-dm text-stone-400 mt-0.5">
              Entrega: {fmtFecha(orden.fechaEntregaEstimada)}
            </p>
          )}
        </td>

        {/* Total */}
        <td className="py-3.5 px-3 text-right">
          <p className="text-sm font-playfair font-bold text-stone-800">
            {fmt(orden.totalEstimado, orden.moneda)}
          </p>
          <p className="text-[10px] font-dm text-stone-400">{orden.moneda}</p>
        </td>

        {/* Expand */}
        <td className="py-3.5 pr-5 pl-3 text-right">
          {expanded ? (
            <ChevronUp size={14} className="text-stone-400 ml-auto" />
          ) : (
            <ChevronDown size={14} className="text-stone-400 ml-auto" />
          )}
        </td>
      </tr>

      {/* Detalle expandible */}
      {expanded && (
        <tr className="border-b border-stone-100 bg-stone-50/40">
          <td colSpan={6} className="px-5 py-4">
            {detLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-8 rounded-lg" />
                ))}
              </div>
            ) : detalle ? (
              <div className="space-y-3">
                {/* Meta info */}
                <div className="flex flex-wrap gap-4 text-xs font-dm text-stone-500">
                  {detalle.notas && (
                    <span className="flex items-center gap-1.5">
                      <FileText size={11} className="text-stone-300" />
                      {detalle.notas}
                    </span>
                  )}
                  {detalle.fechaRecepcion && (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={11} className="text-emerald-400" />
                      Recibida: {fmtFecha(detalle.fechaRecepcion)}
                    </span>
                  )}
                </div>

                {/* Tabla de detalles */}
                {detalle.detalles?.length > 0 && (
                  <div
                    className="rounded-xl border border-stone-200 overflow-hidden bg-white"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                  >
                    <table className="w-full text-xs font-dm">
                      <thead>
                        <tr className="border-b border-stone-100 bg-stone-50/50">
                          {[
                            "Ingrediente",
                            "Cantidad",
                            "P. Unitario",
                            "Subtotal",
                            "Recibido",
                          ].map((h) => (
                            <th
                              key={h}
                              className="py-2 px-3 text-left text-[10px] text-stone-400 font-semibold uppercase tracking-wide first:pl-4 last:pr-4"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detalle.detalles.map((d) => (
                          <tr
                            key={d.id}
                            className="border-b border-stone-100 last:border-0"
                          >
                            <td className="py-2.5 pl-4 pr-3 font-semibold text-stone-700">
                              {d.nombreIngrediente}
                            </td>
                            <td className="py-2.5 px-3 text-stone-600">
                              {parseFloat(d.cantidad).toFixed(2)}{" "}
                              {d.unidadMedida}
                            </td>
                            <td className="py-2.5 px-3 text-stone-600">
                              {d.precioUnitario
                                ? fmt(d.precioUnitario, detalle.moneda)
                                : "—"}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-stone-700">
                              {d.subtotal
                                ? fmt(d.subtotal, detalle.moneda)
                                : "—"}
                            </td>
                            <td className="py-2.5 pr-4 pl-3">
                              {d.cantidadRecibida != null ? (
                                <span
                                  className={`font-semibold ${parseFloat(d.cantidadRecibida) >= parseFloat(d.cantidad) ? "text-emerald-600" : "text-amber-600"}`}
                                >
                                  {parseFloat(d.cantidadRecibida).toFixed(2)}{" "}
                                  {d.unidadMedida}
                                </span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs font-dm text-stone-400 italic">
                Sin detalles disponibles.
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function AOrdenesCompra() {
  const [search, setSearch] = useState("");
  const [filtroRestaurante, setFiltroRestaurante] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");

  const { data, loading, refetch } = useQuery(GET_ORDENES_COMPRA, {
    variables: filtroEstado !== "all" ? { estado: filtroEstado } : {},
    fetchPolicy: "cache-and-network",
  });

  const { data: restData } = useQuery(GET_RESTAURANTES);

  const ordenes = data?.ordenesCompra ?? [];
  const restaurantes = restData?.restaurantes ?? [];

  const restaurantesMap = useMemo(() => {
    const m = {};
    restaurantes.forEach((r) => (m[r.id] = r));
    return m;
  }, [restaurantes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ordenes.filter((o) => {
      if (q) {
        const match =
          (o.proveedorNombre ?? "").toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          (restaurantesMap[o.restauranteId]?.nombre ?? "")
            .toLowerCase()
            .includes(q);
        if (!match) return false;
      }
      if (filtroRestaurante && o.restauranteId !== filtroRestaurante)
        return false;
      return true;
    });
  }, [ordenes, search, filtroRestaurante, restaurantesMap]);

  // KPIs
  const kpis = {
    BORRADOR: ordenes.filter((o) => o.estado === "BORRADOR").length,
    PENDIENTE: ordenes.filter((o) => o.estado === "PENDIENTE").length,
    ENVIADA: ordenes.filter((o) => o.estado === "ENVIADA").length,
    RECIBIDA: ordenes.filter((o) => o.estado === "RECIBIDA").length,
    CANCELADA: ordenes.filter((o) => o.estado === "CANCELADA").length,
  };

  const totalPendiente = ordenes
    .filter((o) => ["BORRADOR", "PENDIENTE", "ENVIADA"].includes(o.estado))
    .reduce((s, o) => s + parseFloat(o.totalEstimado ?? 0), 0);

  const monedaDefault = ordenes[0]?.moneda ?? "COP";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title="Órdenes de compra"
        description="Supervisión global de órdenes de compra de toda la cadena."
        action={
          <div className="flex items-center gap-2">
            {totalPendiente > 0 && (
              <span
                className="hidden sm:flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-1.5 rounded-xl border"
                style={{
                  background: "#fffbeb",
                  borderColor: "#fde68a",
                  color: "#d97706",
                }}
              >
                <Coins size={12} />
                {fmt(totalPendiente, monedaDefault)} en proceso
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* KPIs — estados */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ESTADO_META).map(([estado, meta]) => (
          <button
            key={estado}
            onClick={() =>
              setFiltroEstado(filtroEstado === estado ? "all" : estado)
            }
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-dm font-semibold transition-all"
            style={{
              background: filtroEstado === estado ? meta.text : meta.bg,
              borderColor: filtroEstado === estado ? meta.text : meta.bg,
              color: filtroEstado === estado ? "#fff" : meta.text,
              boxShadow:
                filtroEstado === estado ? `0 0 0 2px ${meta.text}33` : "none",
            }}
          >
            <span>{kpis[estado] ?? 0}</span>
            {meta.label}
          </button>
        ))}
        {filtroEstado !== "all" && (
          <button
            onClick={() => setFiltroEstado("all")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-xs font-dm text-stone-500 hover:bg-stone-50 transition-all"
          >
            <XCircle size={11} /> Limpiar
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          onFocusCapture={(e) =>
            (e.currentTarget.style.boxShadow = `0 0 0 2px ${G[300]}`)
          }
          onBlurCapture={(e) =>
            (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)")
          }
        >
          <Search size={13} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar proveedor, restaurante o ID..."
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-stone-300 hover:text-stone-500 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={filtroRestaurante}
          onChange={(e) => setFiltroRestaurante(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none cursor-pointer"
        >
          <option value="">Todos los restaurantes</option>
          {restaurantes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Contador */}
      {!loading && (
        <p className="text-xs font-dm text-stone-400 -mt-2">
          {filtered.length} orden{filtered.length !== 1 ? "es" : ""}
          {filtroEstado !== "all" && ` · ${ESTADO_META[filtroEstado]?.label}`}
          {search && ` — "${search}"`}
          {" · "}
          <span className="text-stone-500">Toca una fila para ver detalle</span>
        </p>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={search ? "Sin resultados" : "Sin órdenes de compra"}
          description={
            search
              ? `No hay órdenes que coincidan con "${search}".`
              : filtroEstado !== "all"
                ? `No hay órdenes con estado ${ESTADO_META[filtroEstado]?.label}.`
                : "Las órdenes aparecen aquí cuando los gerentes las crean."
          }
        />
      ) : (
        <div
          className="bg-white border border-stone-200 rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  {[
                    { l: "Proveedor · ID", cls: "pl-5 pr-3" },
                    { l: "Restaurante", cls: "px-3" },
                    { l: "Estado", cls: "px-3" },
                    { l: "Fechas", cls: "px-3 hidden lg:table-cell" },
                    { l: "Total", cls: "px-3 text-right" },
                    { l: "", cls: "pr-5 pl-3" },
                  ].map(({ l, cls }) => (
                    <th
                      key={l}
                      className={`py-3 text-left text-[10px] font-dm font-semibold text-stone-400 uppercase tracking-wide ${cls}`}
                    >
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <OrdenRow
                    key={o.id}
                    orden={o}
                    restaurante={restaurantesMap[o.restauranteId]}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
