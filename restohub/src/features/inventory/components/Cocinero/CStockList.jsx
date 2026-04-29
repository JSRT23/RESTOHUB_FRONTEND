// src/features/inventory/components/Cocinero/CStockList.jsx
// CAMBIOS:
//  - Tab Stock: porcentaje calculado correctamente (igual que GStockList fix)
//  - Tab Recetas: click en card abre MODAL con imagen grande + receta completa (en vez de expandir inline)
//  - Modal de receta diseñado profesionalmente

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
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
  BookOpen,
  UtensilsCrossed,
  X,
  ChefHat,
  Layers,
} from "lucide-react";
import { GET_STOCK, GET_ALERTAS, GET_RECETAS } from "../../graphql/queries";
import { GET_PLATOS_CON_RECETA } from "../../graphql/queries_cocinero";
import {
  PageHeader,
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
        className="text-[10px] font-dm font-semibold w-8 text-right"
        style={{ color }}
      >
        {w < 1 ? `${w.toFixed(1)}%` : `${Math.round(w)}%`}
      </span>
    </div>
  );
}

function StockCard({ item }) {
  const agotado = item.estaAgotado;
  const bajo = item.necesitaReposicion && !agotado;
  // Calcular pct correctamente (backend redondea a 0)
  const nivelMax = parseFloat(item.nivelMaximo) || 0;
  const cantAct = parseFloat(item.cantidadActual) || 0;
  const pct = nivelMax > 0 ? (cantAct / nivelMax) * 100 : 0;

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
          {cantAct.toFixed(2)}
        </span>
        <span className="text-xs font-dm text-stone-400">
          {item.unidadMedida}
        </span>
        <span className="ml-auto text-[10px] font-dm text-stone-400">
          mín: {parseFloat(item.nivelMinimo).toFixed(2)}
        </span>
      </div>
      <NivelBar pct={pct} agotado={agotado} bajo={bajo} />
    </div>
  );
}

// ── Modal de receta — profesional ─────────────────────────────────────────
function ModalReceta({ plato, onClose }) {
  const [imgError, setImgError] = useState(false);

  const { data, loading } = useQuery(GET_RECETAS, {
    variables: { platoId: plato.id },
    fetchPolicy: "cache-and-network",
  });
  const receta = data?.recetas ?? [];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(5,31,32,0.65)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          maxHeight: "92dvh",
          boxShadow: "0 32px 80px rgba(5,31,32,0.3)",
        }}
      >
        {/* Imagen de cabecera */}
        <div className="relative w-full h-52 shrink-0 bg-stone-100 overflow-hidden">
          {plato.imagen && !imgError ? (
            <img
              src={plato.imagen}
              alt={plato.nombre}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg,${G[900]},${G[500]})`,
              }}
            >
              <UtensilsCrossed size={48} className="text-white/30" />
            </div>
          )}
          {/* Gradiente bottom */}
          <div
            className="absolute inset-x-0 bottom-0 h-24"
            style={{
              background:
                "linear-gradient(to top,rgba(255,255,255,0.95),transparent)",
            }}
          />
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <X size={14} />
          </button>
          {/* Categoría badge */}
          {plato.categoriaNombre && (
            <span
              className="absolute top-4 left-4 text-[10px] font-dm font-bold px-2.5 py-1 rounded-xl backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.85)", color: G[500] }}
            >
              {plato.categoriaNombre}
            </span>
          )}
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1">
          {/* Info del plato */}
          <div className="px-6 pt-5 pb-4 border-b border-stone-100">
            <h2 className="font-playfair text-2xl font-bold text-stone-900 leading-tight">
              {plato.nombre}
            </h2>
            {plato.descripcion && (
              <p className="text-sm font-dm text-stone-500 mt-1.5 leading-relaxed">
                {plato.descripcion}
              </p>
            )}
          </div>

          {/* Receta */}
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: G[50] }}
              >
                <ChefHat size={14} style={{ color: G[300] }} />
              </div>
              <p className="text-sm font-dm font-bold text-stone-800">Receta</p>
              {!loading && (
                <span className="text-[10px] font-dm text-stone-400 bg-stone-100 px-2 py-0.5 rounded-lg">
                  {receta.length} ingrediente{receta.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : receta.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-4 rounded-2xl border border-dashed border-stone-200 bg-stone-50">
                <Layers size={16} className="text-stone-300 shrink-0" />
                <p className="text-sm font-dm text-stone-400">
                  Sin ingredientes registrados. El gerente debe configurar la
                  receta.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {receta.map((r, idx) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-stone-100 bg-stone-50/60"
                  >
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-dm font-bold shrink-0 text-stone-400 bg-stone-100">
                      {idx + 1}
                    </span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FlaskConical
                        size={12}
                        style={{ color: G[300] }}
                        className="shrink-0"
                      />
                      <p className="text-sm font-dm font-semibold text-stone-800 truncate">
                        {r.nombreIngrediente}
                      </p>
                    </div>
                    <span
                      className="flex items-center gap-1 text-sm font-dm font-bold px-3 py-1 rounded-xl shrink-0"
                      style={{ background: G[50], color: G[300] }}
                    >
                      {parseFloat(r.cantidad)}{" "}
                      <span className="text-[10px] font-normal text-stone-400 ml-0.5">
                        {r.unidadMedida}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Plato card (solo click, sin expand) ──────────────────────────────────
function PlatoCard({ plato, onClick }) {
  const [imgError, setImgError] = useState(false);
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-stone-200 overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 group"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="w-16 h-16 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center bg-stone-50 border border-stone-100">
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
        <div className="flex-1 min-w-0">
          <p className="text-sm font-dm font-bold text-stone-800 truncate">
            {plato.nombre}
          </p>
          {plato.categoriaNombre && (
            <span className="text-[10px] font-dm text-stone-400 bg-stone-100 px-2 py-0.5 rounded-lg inline-block mt-1">
              {plato.categoriaNombre}
            </span>
          )}
          {plato.descripcion && (
            <p className="text-[11px] font-dm text-stone-400 mt-1 line-clamp-1 leading-snug">
              {plato.descripcion}
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1 text-[11px] font-dm font-semibold text-stone-400 group-hover:text-stone-600 transition-colors">
          Ver receta
          <BookOpen size={12} />
        </div>
      </div>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function CStockList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;
  const [tab, setTab] = useState("stock");
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [recetaPlato, setRecetaPlato] = useState(null); // plato seleccionado para modal

  // Cocinero no tiene permiso a GET_ALMACENES (❌ en tabla de permisos)
  // GET_STOCK sin almacenId → el gateway usa JWT restauranteId del cocinero
  const {
    data: stockData,
    loading: stockLoading,
    refetch: refetchStock,
  } = useQuery(GET_STOCK, {
    variables: { restauranteId }, // gateway filtra stock del restaurante del cocinero
    skip: !restauranteId,
    fetchPolicy: "network-only",
    pollInterval: 30000,
  });

  const { data: alertasData } = useQuery(GET_ALERTAS, {
    variables: { restauranteId, estado: "PENDIENTE" },
    skip: !restauranteId,
  });

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
            : "Toca cualquier plato para ver su receta completa."
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
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Alertas (solo stock) */}
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
                : "No hay stock registrado."
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
              ? "No hay platos que coincidan."
              : "No hay platos activos en el menú."
          }
        />
      ) : (
        <div className="space-y-3">
          {platosFiltrados.map((plato) => (
            <PlatoCard
              key={plato.id}
              plato={plato}
              onClick={() => setRecetaPlato(plato)}
            />
          ))}
        </div>
      )}

      {/* Modal de receta */}
      {recetaPlato && (
        <ModalReceta plato={recetaPlato} onClose={() => setRecetaPlato(null)} />
      )}
    </div>
  );
}
