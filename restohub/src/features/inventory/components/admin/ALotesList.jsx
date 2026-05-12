// src/features/inventory/components/admin/ALotesList.jsx
// Admin Central — trazabilidad de lotes de toda la cadena.
// Filtros: restaurante, almacén, estado, por vencer.
// Ve todos los lotes de todos los restaurantes.

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Archive,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Building2,
  RefreshCw,
  Filter,
  CalendarDays,
  Truck,
  TrendingDown,
} from "lucide-react";
import { GET_LOTES, GET_ALMACENES } from "../../graphql/queries";
import { GET_RESTAURANTES } from "../../../menu/components/admin/graphql/operations";
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

// ── Estado meta ────────────────────────────────────────────────────────────
const ESTADO_META = {
  ACTIVO: { label: "Activo", variant: "green", dot: "bg-emerald-500" },
  AGOTADO: { label: "Agotado", variant: "default", dot: "bg-stone-400" },
  VENCIDO: { label: "Vencido", variant: "red", dot: "bg-red-500" },
  CUARENTENA: { label: "Cuarentena", variant: "amber", dot: "bg-amber-400" },
};

function fmtFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Fila de lote ───────────────────────────────────────────────────────────
function LoteRow({ lote, restaurante }) {
  const meta = ESTADO_META[lote.estado] ?? ESTADO_META.ACTIVO;
  const porVencer =
    !lote.estaVencido &&
    lote.diasParaVencer != null &&
    lote.diasParaVencer <= 7;
  const vencido = lote.estaVencido;
  const pct =
    lote.cantidadRecibida > 0
      ? Math.min(100, (lote.cantidadActual / lote.cantidadRecibida) * 100)
      : 0;

  return (
    <tr
      className={`border-b border-stone-100 hover:bg-stone-50/60 transition-colors ${vencido ? "opacity-60" : ""}`}
    >
      {/* Lote + ingrediente */}
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
          <div>
            <p className="text-sm font-dm font-semibold text-stone-800 leading-tight">
              {lote.nombreIngrediente ?? "—"}
            </p>
            <p className="font-mono text-[10px] text-stone-400 mt-0.5">
              {lote.numeroLote}
            </p>
          </div>
        </div>
      </td>

      {/* Restaurante + almacén */}
      <td className="py-3.5 px-3">
        <p className="text-xs font-dm font-semibold text-stone-700 truncate max-w-[140px]">
          {restaurante?.nombre ?? "—"}
        </p>
        <p className="text-[10px] font-dm text-stone-400 truncate max-w-[140px] mt-0.5">
          {lote.almacenNombre}
        </p>
      </td>

      {/* Proveedor */}
      <td className="py-3.5 px-3">
        <p className="text-xs font-dm text-stone-600 truncate max-w-[120px]">
          {lote.proveedorNombre ?? "—"}
        </p>
      </td>

      {/* Cantidad */}
      <td className="py-3.5 px-3">
        <div className="space-y-1">
          <p className="text-xs font-dm font-semibold text-stone-800">
            {parseFloat(lote.cantidadActual ?? 0).toFixed(2)}{" "}
            <span className="text-stone-400 font-normal">
              {lote.unidadMedida}
            </span>
          </p>
          <div className="h-1 rounded-full bg-stone-100 w-24 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background:
                  pct > 50 ? G[300] : pct > 20 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
          <p className="text-[9px] font-dm text-stone-400">
            de {parseFloat(lote.cantidadRecibida ?? 0).toFixed(2)} recibidos
          </p>
        </div>
      </td>

      {/* Vencimiento */}
      <td className="py-3.5 px-3">
        <div>
          <p
            className={`text-xs font-dm font-semibold ${
              vencido
                ? "text-red-600"
                : porVencer
                  ? "text-amber-600"
                  : "text-stone-700"
            }`}
          >
            {fmtFecha(lote.fechaVencimiento)}
          </p>
          {!vencido && lote.diasParaVencer != null && (
            <p
              className={`text-[10px] font-dm mt-0.5 ${
                porVencer ? "text-amber-500 font-semibold" : "text-stone-400"
              }`}
            >
              {lote.diasParaVencer === 0
                ? "Vence hoy"
                : lote.diasParaVencer === 1
                  ? "Vence mañana"
                  : `${lote.diasParaVencer}d restantes`}
            </p>
          )}
          {vencido && (
            <p className="text-[10px] font-dm text-red-400 mt-0.5">Vencido</p>
          )}
        </div>
      </td>

      {/* Estado */}
      <td className="py-3.5 pr-5 pl-3">
        <Badge variant={meta.variant} size="xs">
          {lote.estado === "ACTIVO" && <CheckCircle2 size={9} />}
          {lote.estado === "VENCIDO" && <XCircle size={9} />}
          {lote.estado === "AGOTADO" && <Package size={9} />}
          {lote.estado === "CUARENTENA" && <AlertTriangle size={9} />}
          {meta.label}
        </Badge>
      </td>
    </tr>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ALotesList() {
  const [search, setSearch] = useState("");
  const [filtroRestaurante, setFiltroRestaurante] = useState("");
  const [filtroAlmacen, setFiltroAlmacen] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [filtroPorVencer, setFiltroPorVencer] = useState(false);

  const { data, loading, refetch } = useQuery(GET_LOTES, {
    variables: filtroPorVencer ? { porVencer: 7 } : {},
    fetchPolicy: "cache-and-network",
  });

  const { data: almData } = useQuery(GET_ALMACENES, {
    variables: filtroRestaurante ? { restauranteId: filtroRestaurante } : {},
    fetchPolicy: "cache-and-network",
  });

  const { data: restData } = useQuery(GET_RESTAURANTES);

  const lotes = data?.lotes ?? [];
  const almacenes = almData?.almacenes ?? [];
  const restaurantes = restData?.restaurantes ?? [];

  // Map almacén → restauranteId para cruzar
  const almacenRestauranteMap = useMemo(() => {
    const m = {};
    almacenes.forEach((a) => (m[a.id] = a.restauranteId));
    return m;
  }, [almacenes]);

  const restaurantesMap = useMemo(() => {
    const m = {};
    restaurantes.forEach((r) => (m[r.id] = r));
    return m;
  }, [restaurantes]);

  // Los lotes tienen almacen (UUID). Cruzamos con almacenRestauranteMap para filtrar por restaurante
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return lotes.filter((l) => {
      if (q) {
        const matchQ =
          (l.nombreIngrediente ?? "").toLowerCase().includes(q) ||
          (l.numeroLote ?? "").toLowerCase().includes(q) ||
          (l.proveedorNombre ?? "").toLowerCase().includes(q) ||
          (l.almacenNombre ?? "").toLowerCase().includes(q);
        if (!matchQ) return false;
      }
      if (filtroAlmacen && l.almacen !== filtroAlmacen) return false;
      if (filtroRestaurante) {
        const restId = almacenRestauranteMap[l.almacen];
        if (restId !== filtroRestaurante) return false;
      }
      if (filtroEstado !== "all" && l.estado !== filtroEstado) return false;
      return true;
    });
  }, [
    lotes,
    search,
    filtroAlmacen,
    filtroRestaurante,
    filtroEstado,
    almacenRestauranteMap,
  ]);

  // KPIs
  const activos = lotes.filter(
    (l) => l.estado === "ACTIVO" && !l.estaVencido,
  ).length;
  const vencidos = lotes.filter(
    (l) => l.estaVencido || l.estado === "VENCIDO",
  ).length;
  const porVencer7 = lotes.filter(
    (l) => !l.estaVencido && l.diasParaVencer != null && l.diasParaVencer <= 7,
  ).length;
  const agotados = lotes.filter((l) => l.estado === "AGOTADO").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title="Lotes"
        description="Trazabilidad de lotes de toda la cadena — vencimientos y cantidades por restaurante."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltroPorVencer((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-dm font-semibold border transition-all ${
                filtroPorVencer
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
              }`}
            >
              <Clock size={12} />
              Por vencer (7d)
              {porVencer7 > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ background: "#fde68a", color: "#d97706" }}
                >
                  {porVencer7}
                </span>
              )}
            </button>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Activos",
            n: activos,
            bg: G[50],
            text: G[300],
            border: G[100],
            icon: <CheckCircle2 size={14} style={{ color: G[100] }} />,
            filter: "ACTIVO",
          },
          {
            label: "Por vencer (7d)",
            n: porVencer7,
            bg: "#fffbeb",
            text: "#d97706",
            border: "#fde68a",
            icon: <Clock size={14} className="text-amber-400" />,
            filter: null,
          },
          {
            label: "Vencidos",
            n: vencidos,
            bg: vencidos > 0 ? "#fef2f2" : "#f5f5f4",
            text: vencidos > 0 ? "#dc2626" : "#a8a29e",
            border: vencidos > 0 ? "#fecaca" : "#e5e5e5",
            icon: (
              <XCircle
                size={14}
                className={vencidos > 0 ? "text-red-400" : "text-stone-300"}
              />
            ),
            filter: "VENCIDO",
          },
          {
            label: "Agotados",
            n: agotados,
            bg: "#f5f5f4",
            text: "#78716c",
            border: "#e5e5e5",
            icon: <Package size={14} className="text-stone-300" />,
            filter: "AGOTADO",
          },
        ].map(({ label, n, bg, text, border, icon, filter }) => (
          <button
            key={label}
            onClick={() => {
              if (!filter) return;
              setFiltroEstado(filtroEstado === filter ? "all" : filter);
            }}
            className="flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all hover:-translate-y-0.5"
            style={{
              background: bg,
              borderColor: filtroEstado === filter ? text : border,
              boxShadow:
                filtroEstado === filter
                  ? `0 0 0 2px ${text}22`
                  : "0 2px 8px rgba(0,0,0,0.05)",
              cursor: filter ? "pointer" : "default",
            }}
          >
            {icon}
            <div>
              <p
                className="text-xl font-playfair font-bold"
                style={{ color: text }}
              >
                {n}
              </p>
              <p
                className="text-[10px] font-dm font-semibold"
                style={{ color: text }}
              >
                {label}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div
          className="flex items-center gap-2.5 flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl bg-white border border-stone-200"
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
            placeholder="Buscar ingrediente, lote, proveedor..."
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

        {/* Filtro restaurante */}
        <select
          value={filtroRestaurante}
          onChange={(e) => {
            setFiltroRestaurante(e.target.value);
            setFiltroAlmacen(""); // limpiar almacén al cambiar restaurante
          }}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none cursor-pointer"
        >
          <option value="">Todos los restaurantes</option>
          {restaurantes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>

        {/* Filtro almacén — se filtra por restaurante si está seleccionado */}
        <select
          value={filtroAlmacen}
          onChange={(e) => setFiltroAlmacen(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none cursor-pointer"
        >
          <option value="">Todos los almacenes</option>
          {almacenes
            .filter(
              (a) =>
                !filtroRestaurante || a.restauranteId === filtroRestaurante,
            )
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
        </select>

        {/* Filtro estado */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
          {[
            { v: "all", l: "Todos" },
            { v: "ACTIVO", l: "Activos" },
            { v: "VENCIDO", l: "Vencidos" },
            { v: "AGOTADO", l: "Agotados" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltroEstado(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
              style={
                filtroEstado === v
                  ? { background: G[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Contador */}
      {!loading && (
        <p className="text-xs font-dm text-stone-400 -mt-2">
          {filtered.length} lote{filtered.length !== 1 ? "s" : ""}
          {filtroEstado !== "all" &&
            ` · ${ESTADO_META[filtroEstado]?.label ?? filtroEstado}`}
          {search && ` — "${search}"`}
        </p>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Archive}
          title={search ? "Sin resultados" : "Sin lotes registrados"}
          description={
            search
              ? `No hay lotes que coincidan con "${search}".`
              : "Los lotes se crean al recibir órdenes de compra."
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
                    { l: "Ingrediente · Lote", cls: "pl-5 pr-3" },
                    { l: "Restaurante · Almacén", cls: "px-3" },
                    { l: "Proveedor", cls: "px-3 hidden md:table-cell" },
                    { l: "Cantidad", cls: "px-3" },
                    { l: "Vencimiento", cls: "px-3" },
                    { l: "Estado", cls: "pr-5 pl-3" },
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
                {filtered.map((lote) => (
                  <LoteRow
                    key={lote.id}
                    lote={lote}
                    restaurante={
                      restaurantesMap[almacenRestauranteMap[lote.almacen]]
                    }
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
