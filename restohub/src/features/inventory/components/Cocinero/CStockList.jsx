// src/features/inventory/components/Cocinero/CStockList.jsx
// Cocinero — vista de stock de su restaurante.
// Solo lectura — ve qué ingredientes están disponibles y cuáles bajo mínimo.
// Puede ver la receta de un plato para saber cuánto consume.
// NO puede ajustar stock ni crear órdenes.
// Ruta: /cocina/stock

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
} from "lucide-react";
import { GET_STOCK, GET_ALMACENES, GET_ALERTAS } from "../../graphql/queries";
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
        {w.toFixed(0)}%
      </span>
    </div>
  );
}

function StockCard({ item }) {
  const agotado = item.estaAgotado;
  const bajo = !agotado && item.necesitaReposicion;

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2.5"
      style={{
        borderColor: agotado ? "#fecaca" : bajo ? "#fde68a" : "#e5e7eb",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: agotado ? "#fef2f2" : bajo ? "#fffbeb" : G[50],
            }}
          >
            <FlaskConical
              size={13}
              style={{ color: agotado ? "#ef4444" : bajo ? "#f59e0b" : G[300] }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-dm font-semibold text-stone-800 truncate">
              {item.nombreIngrediente}
            </p>
            <p className="text-[10px] font-dm text-stone-400 mt-0.5">
              {item.almacenNombre}
            </p>
          </div>
        </div>
        <Badge variant={agotado ? "red" : bajo ? "amber" : "green"} size="xs">
          {agotado ? (
            <>
              <XCircle size={9} /> Agotado
            </>
          ) : bajo ? (
            <>
              <AlertTriangle size={9} /> Bajo
            </>
          ) : (
            <>
              <CheckCircle2 size={9} /> OK
            </>
          )}
        </Badge>
      </div>

      <div>
        <p
          className="text-lg font-playfair font-bold"
          style={{ color: agotado ? "#ef4444" : bajo ? "#d97706" : G[300] }}
        >
          {parseFloat(item.cantidadActual).toFixed(2)}
          <span className="text-xs font-dm font-normal text-stone-400 ml-1">
            {item.unidadMedida}
          </span>
        </p>
        <NivelBar pct={item.porcentajeStock} agotado={agotado} bajo={bajo} />
        <p className="text-[10px] font-dm text-stone-400 mt-1">
          mín {parseFloat(item.nivelMinimo).toFixed(1)} · máx{" "}
          {parseFloat(item.nivelMaximo).toFixed(1)} {item.unidadMedida}
        </p>
      </div>
    </div>
  );
}

export default function CStockList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("all");
  const [filtroAlmacen, setFiltroAlmacen] = useState("");
  const [alertasOpen, setAlertasOpen] = useState(true);

  const {
    data: stockData,
    loading,
    refetch,
  } = useQuery(GET_STOCK, {
    variables: { almacenId: filtroAlmacen || undefined },
    fetchPolicy: "cache-and-network",
    pollInterval: 60000,
  });

  const { data: almData } = useQuery(GET_ALMACENES, {
    variables: { restauranteId },
    skip: !restauranteId,
  });

  const { data: alertasData } = useQuery(GET_ALERTAS, {
    variables: { estado: "PENDIENTE", restauranteId },
    fetchPolicy: "cache-and-network",
    pollInterval: 60000,
  });

  const stock = stockData?.stock ?? [];
  const almacenes = almData?.almacenes ?? [];
  const alertas = alertasData?.alertasStock ?? [];

  const agotados = stock.filter((s) => s.estaAgotado).length;
  const bajos = stock.filter(
    (s) => !s.estaAgotado && s.necesitaReposicion,
  ).length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return stock.filter((s) => {
      if (q && !s.nombreIngrediente.toLowerCase().includes(q)) return false;
      if (filtroAlmacen && s.almacen !== filtroAlmacen) return false;
      if (filtro === "agotado" && !s.estaAgotado) return false;
      if (filtro === "bajo" && (s.estaAgotado || !s.necesitaReposicion))
        return false;
      if (filtro === "ok" && (s.estaAgotado || s.necesitaReposicion))
        return false;
      return true;
    });
  }, [stock, search, filtroAlmacen, filtro]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Cocinero"
        title="Stock disponible"
        description="Ingredientes de tu restaurante — solo lectura."
        action={
          <div className="flex items-center gap-2">
            {(agotados > 0 || bajos > 0) && (
              <span
                className="hidden sm:flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-xl border"
                style={{
                  background: "#fef2f2",
                  borderColor: "#fecaca",
                  color: "#dc2626",
                }}
              >
                <AlertTriangle size={12} />
                {agotados > 0 &&
                  `${agotados} agotado${agotados !== 1 ? "s" : ""}`}
                {agotados > 0 && bajos > 0 && " · "}
                {bajos > 0 && `${bajos} bajo mínimo`}
              </span>
            )}
            <button
              onClick={() => refetch()}
              className="w-8 h-8 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        }
      />

      {/* Alertas colapsables */}
      {alertas.length > 0 && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "#fecaca" }}
        >
          <button
            onClick={() => setAlertasOpen(!alertasOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            style={{ background: "#fef2f2" }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-sm font-dm font-bold text-red-700">
                {alertas.length} alerta{alertas.length !== 1 ? "s" : ""} de
                stock
              </span>
            </div>
            {alertasOpen ? (
              <ChevronUp size={14} className="text-red-400" />
            ) : (
              <ChevronDown size={14} className="text-red-400" />
            )}
          </button>
          {alertasOpen && (
            <div className="p-3 space-y-2 bg-white">
              {alertas.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                  style={{
                    background:
                      a.tipoAlerta === "AGOTADO" ? "#fef2f2" : "#fffbeb",
                  }}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.tipoAlerta === "AGOTADO" ? "bg-red-500" : "bg-amber-400"}`}
                  />
                  <p className="text-sm font-dm text-stone-700 truncate flex-1">
                    {a.nombreIngrediente}
                  </p>
                  <span
                    className="text-[10px] font-dm font-semibold shrink-0"
                    style={{
                      color: a.tipoAlerta === "AGOTADO" ? "#dc2626" : "#d97706",
                    }}
                  >
                    {a.tipoAlerta === "AGOTADO"
                      ? "Agotado"
                      : a.tipoAlerta === "STOCK_BAJO"
                        ? "Bajo mínimo"
                        : "Por vencer"}
                  </span>
                </div>
              ))}
              {alertas.length > 5 && (
                <p className="text-[10px] font-dm text-stone-400 text-center pt-1">
                  +{alertas.length - 5} alertas más — avisa al supervisor
                </p>
              )}
            </div>
          )}
        </div>
      )}

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
            placeholder="Buscar ingrediente..."
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

        {almacenes.length > 1 && (
          <select
            value={filtroAlmacen}
            onChange={(e) => setFiltroAlmacen(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none cursor-pointer"
          >
            <option value="">Todos los almacenes</option>
            {almacenes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
          {[
            { v: "all", l: "Todos", n: stock.length },
            { v: "agotado", l: "Agotados", n: agotados },
            { v: "bajo", l: "Bajo mínimo", n: bajos },
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
              {n > 0 && filtro !== v && (
                <span
                  className="text-[9px] px-1 rounded-full font-bold"
                  style={{
                    background:
                      v === "agotado"
                        ? "#fecaca"
                        : v === "bajo"
                          ? "#fde68a"
                          : "#f5f5f4",
                    color:
                      v === "agotado"
                        ? "#dc2626"
                        : v === "bajo"
                          ? "#d97706"
                          : "#a8a29e",
                  }}
                >
                  {n}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contador */}
      {!loading && (
        <p className="text-xs font-dm text-stone-400 -mt-2">
          {filtered.length} ingrediente{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? "Sin resultados" : "Sin stock"}
          description={
            search
              ? `Sin ingredientes para "${search}".`
              : "No hay stock registrado."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <StockCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
