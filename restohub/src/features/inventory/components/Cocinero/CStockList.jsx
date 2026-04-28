// src/features/inventory/components/Cocinero/CStockList.jsx
// CAMBIOS vs original:
// 1. Agrega tab "Recetas" — el cocinero puede consultar ingredientes de cada plato
// 2. Cards de plato con imagen, expandibles, muestran receta completa
// La tab "Stock" es idéntica a la versión original.

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  BookOpen,
  UtensilsCrossed,
} from "lucide-react";
import {
  GET_STOCK,
  GET_ALMACENES,
  GET_ALERTAS,
  GET_RECETAS,
} from "../../graphql/queries";
import { GET_PLATOS_CON_RECETA } from "../../graphql/queries_cocinero";
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

// ── Barra de nivel ────────────────────────────────────────────────────────
function NivelBar({ pct, agotado, bajo }) {
  const color = agotado ? "#ef4444" : bajo ? "#f59e0b" : G[300];
  const w = Math.min(100, Math.max(0, pct ?? 0));
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${w}%`, background: color }}
        />
      </div>
      <span
        className="text-[10px] font-dm font-semibold w-7 text-right"
        style={{ color }}
      >
        {Math.round(w)}%
      </span>
    </div>
  );
}

// ── Card de stock (idéntico al original) ──────────────────────────────────
function StockCard({ item }) {
  const agotado = item.estaAgotado;
  const bajo = item.necesitaReposicion && !agotado;
  return (
    <div
      className="bg-white rounded-2xl border p-4 space-y-2 transition-all"
      style={{
        borderColor: agotado ? "#fecaca" : bajo ? "#fde68a" : "#e7e5e4",
        boxShadow: agotado ? "0 0 0 2px #fecaca" : "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-dm font-semibold text-stone-800 truncate">
            {item.nombreIngrediente}
          </p>
          <p className="text-[10px] font-dm text-stone-400 mt-0.5">
            {item.almacenNombre}
          </p>
        </div>
        <span
          className="flex items-center gap-1 text-[11px] font-dm font-bold px-2 py-1 rounded-xl shrink-0"
          style={
            agotado
              ? { background: "#fef2f2", color: "#dc2626" }
              : bajo
                ? { background: "#fffbeb", color: "#d97706" }
                : { background: G[50], color: G[300] }
          }
        >
          {agotado ? (
            <XCircle size={10} />
          ) : bajo ? (
            <AlertTriangle size={10} />
          ) : (
            <CheckCircle2 size={10} />
          )}
          {agotado ? "Agotado" : bajo ? "Stock bajo" : "OK"}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-dm font-bold text-stone-800">
          {parseFloat(item.cantidadActual).toFixed(2)}
        </span>
        <span className="text-xs font-dm text-stone-400">
          {item.unidadMedida}
        </span>
        <span className="ml-auto text-[10px] font-dm text-stone-400">
          mín: {parseFloat(item.nivelMinimo).toFixed(2)}
        </span>
      </div>
      <NivelBar pct={item.porcentajeStock} agotado={agotado} bajo={bajo} />
    </div>
  );
}

// ── Card de plato con receta expandible ───────────────────────────────────
function PlatoRecetaCard({ plato }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { data, loading } = useQuery(GET_RECETAS, {
    variables: { platoId: plato.id },
    skip: !open,
    fetchPolicy: "cache-and-network",
  });

  const receta = data?.recetas ?? [];

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden transition-all"
      style={{
        borderColor: "#e7e5e4",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header clickeable */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-stone-50 transition-colors"
      >
        {/* Imagen */}
        <div
          className="w-14 h-14 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
          style={{ background: G[50] }}
        >
          {plato.imagen && !imgError ? (
            <img
              src={plato.imagen}
              alt={plato.nombre}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <UtensilsCrossed size={22} style={{ color: G[100] }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-dm font-bold text-stone-800 truncate">
            {plato.nombre}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {plato.categoriaNombre && (
              <span className="text-[10px] font-dm text-stone-400 bg-stone-100 px-2 py-0.5 rounded-lg">
                {plato.categoriaNombre}
              </span>
            )}
          </div>
          {plato.descripcion && (
            <p className="text-[11px] font-dm text-stone-400 mt-1 line-clamp-1 leading-snug">
              {plato.descripcion}
            </p>
          )}
        </div>

        {/* Toggle */}
        <div className="shrink-0 flex items-center gap-1">
          <span className="text-[10px] font-dm text-stone-400">
            {open ? "Ocultar" : "Ver receta"}
          </span>
          {open ? (
            <ChevronUp size={14} className="text-stone-400" />
          ) : (
            <ChevronDown size={14} className="text-stone-400" />
          )}
        </div>
      </button>

      {/* Receta expandida */}
      {open && (
        <div className="border-t border-stone-100 px-4 pb-4 pt-3">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 rounded-xl" />
              ))}
            </div>
          ) : receta.length === 0 ? (
            <p className="text-xs font-dm text-stone-400 italic text-center py-3">
              Sin ingredientes registrados. El gerente debe agregar la receta.
            </p>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[10px] font-dm font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Ingredientes · {receta.length} ítem
                {receta.length !== 1 ? "s" : ""}
              </p>
              {receta.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}
                >
                  <FlaskConical
                    size={12}
                    style={{ color: G[300] }}
                    className="shrink-0"
                  />
                  <p className="flex-1 text-xs font-dm font-semibold text-stone-700 truncate">
                    {r.nombreIngrediente}
                  </p>
                  <span
                    className="text-xs font-dm font-bold px-2.5 py-1 rounded-xl shrink-0"
                    style={{ background: G[50], color: G[300] }}
                  >
                    {parseFloat(r.cantidad)} {r.unidadMedida}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function CStockList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;
  const [tab, setTab] = useState("stock");
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");

  // Stock
  const { data: almData } = useQuery(GET_ALMACENES, {
    variables: { restauranteId, activo: true },
    skip: !restauranteId,
  });
  const almacenId = almData?.almacenes?.[0]?.id;

  const {
    data: stockData,
    loading: stockLoading,
    refetch: refetchStock,
  } = useQuery(GET_STOCK, {
    variables: { almacenId },
    skip: !almacenId,
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });

  const { data: alertasData } = useQuery(GET_ALERTAS, {
    variables: { restauranteId, estado: "PENDIENTE" },
    skip: !restauranteId,
  });

  // Platos para tab recetas
  const {
    data: platosData,
    loading: platosLoading,
    refetch: refetchPlatos,
  } = useQuery(GET_PLATOS_CON_RECETA, {
    variables: { disponibles: restauranteId, activo: true },
    skip: !restauranteId || tab !== "recetas",
    fetchPolicy: "cache-and-network",
  });

  const stock = stockData?.stock ?? [];
  const alertas = alertasData?.alertasStock ?? [];
  const platos = platosData?.platos ?? [];

  const alertasAgotado = alertas.filter(
    (a) => a.tipoAlerta === "AGOTADO",
  ).length;
  const alertasBajo = alertas.filter(
    (a) => a.tipoAlerta === "STOCK_BAJO",
  ).length;

  const stockFiltrado = useMemo(() => {
    let s = stock;
    if (filtro === "bajo")
      s = s.filter((i) => i.necesitaReposicion && !i.estaAgotado);
    if (filtro === "agotado") s = s.filter((i) => i.estaAgotado);
    if (search) {
      const q = search.toLowerCase();
      s = s.filter((i) => i.nombreIngrediente?.toLowerCase().includes(q));
    }
    return s;
  }, [stock, filtro, search]);

  const platosFiltrados = useMemo(() => {
    if (!search) return platos;
    const q = search.toLowerCase();
    return platos.filter((p) => p.nombre?.toLowerCase().includes(q));
  }, [platos, search]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Cocinero"
        title={tab === "stock" ? "Stock" : "Recetas"}
        description={
          tab === "stock"
            ? "Ingredientes disponibles en tu restaurante · actualización cada 30s."
            : "Consulta los ingredientes de cada plato del menú."
        }
        action={
          <button
            onClick={() => (tab === "stock" ? refetchStock() : refetchPlatos())}
            className="w-8 h-8 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl w-fit">
        {[
          { v: "stock", label: "Stock", icon: Package },
          { v: "recetas", label: "Recetas", icon: BookOpen },
        ].map(({ v, label, icon: Icon }) => (
          <button
            key={v}
            onClick={() => {
              setTab(v);
              setSearch("");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-dm font-semibold transition-all"
            style={
              tab === v
                ? { background: G[900], color: "#fff" }
                : { color: "#78716c" }
            }
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Resumen de alertas (solo stock) */}
      {tab === "stock" && (alertasAgotado > 0 || alertasBajo > 0) && (
        <div className="flex items-center gap-3 flex-wrap">
          {alertasAgotado > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200">
              <XCircle size={13} className="text-red-500" />
              <span className="text-xs font-dm font-semibold text-red-700">
                {alertasAgotado} agotado{alertasAgotado !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {alertasBajo > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle size={13} className="text-amber-500" />
              <span className="text-xs font-dm font-semibold text-amber-700">
                {alertasBajo} bajo mínimo
              </span>
            </div>
          )}
        </div>
      )}

      {/* Búsqueda */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            tab === "stock" ? "Buscar ingrediente..." : "Buscar plato..."
          }
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-800 placeholder:text-stone-400 outline-none focus:border-stone-400 transition-colors"
        />
      </div>

      {/* Filtros (solo stock) */}
      {tab === "stock" && (
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { v: "todos", label: "Todos" },
            {
              v: "bajo",
              label: `Bajo mínimo${alertasBajo > 0 ? ` (${alertasBajo})` : ""}`,
            },
            {
              v: "agotado",
              label: `Agotados${alertasAgotado > 0 ? ` (${alertasAgotado})` : ""}`,
            },
          ].map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              className="px-3 py-1.5 rounded-xl text-xs font-dm font-semibold transition-all border"
              style={
                filtro === v
                  ? {
                      background: G[900],
                      color: "#fff",
                      borderColor: "transparent",
                    }
                  : {
                      background: "#fff",
                      color: "#78716c",
                      borderColor: "#e7e5e4",
                    }
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Contenido */}
      {tab === "stock" ? (
        stockLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : stockFiltrado.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Sin ingredientes"
            description={
              filtro !== "todos"
                ? "No hay ingredientes con este filtro."
                : "No hay stock registrado. El gerente debe registrar el almacén y los ingredientes."
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stockFiltrado.map((item) => (
              <StockCard key={item.id} item={item} />
            ))}
          </div>
        )
      ) : platosLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : platosFiltrados.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Sin platos"
          description={
            search
              ? "No hay platos que coincidan con la búsqueda."
              : "No hay platos activos en el menú de este restaurante."
          }
        />
      ) : (
        <div className="space-y-3">
          {platosFiltrados.map((plato) => (
            <PlatoRecetaCard key={plato.id} plato={plato} />
          ))}
        </div>
      )}
    </div>
  );
}
