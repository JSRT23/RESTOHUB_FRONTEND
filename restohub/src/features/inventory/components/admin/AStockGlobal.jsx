// src/features/inventory/components/admin/AStockGlobal.jsx
// Admin Central — Stock global de toda la cadena.
// Ve stock de todos los almacenes, filtra por restaurante/almacén/estado.
// Admin es de solo lectura: ve movimientos pero NO ajusta (eso es del gerente).

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { useSearchParams } from "react-router-dom";
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import {
  GET_STOCK,
  GET_ALMACENES,
  GET_STOCK_ITEM,
} from "../../graphql/queries";
import { GET_RESTAURANTES } from "../../../menu/components/admin/graphql/operations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
  Modal,
} from "../../../../shared/components/ui";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

// ── Barra de nivel visual ──────────────────────────────────────────────────
function NivelBar({ pct, agotado, bajo }) {
  const color = agotado ? "#ef4444" : bajo ? "#f59e0b" : G[300];
  const w = Math.min(100, Math.max(0, pct ?? 0));
  return (
    <div className="flex items-center gap-2">
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
        {w.toFixed(0)}%
      </span>
    </div>
  );
}

// ── Modal Movimientos ─────────────────────────────────────────────────────
function MovimientosModal({ open, onClose, item }) {
  const { data, loading } = useQuery(GET_STOCK_ITEM, {
    variables: { id: item?.id },
    skip: !item?.id || !open,
    fetchPolicy: "cache-and-network",
  });

  const detalle = data?.stockItem;

  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const TIPO_CFG = {
    ENTRADA: { icon: ArrowUp, color: "#16a34a", label: "Entrada", signo: +1 },
    DEVOLUCION: {
      icon: ArrowUp,
      color: "#3b82f6",
      label: "Devolución",
      signo: +1,
    },
    SALIDA: { icon: ArrowDown, color: "#dc2626", label: "Venta", signo: -1 },
    VENCIMIENTO: { icon: Trash2, color: "#7c3aed", label: "Retiro", signo: -1 },
    AJUSTE: {
      icon: SlidersHorizontal,
      color: "#d97706",
      label: "Ajuste",
      signo: null,
    },
  };

  if (!item) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Movimientos — ${item.nombreIngrediente}`}
      size="lg"
    >
      {loading || !detalle ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Resumen del ítem */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Stock actual",
                value: `${parseFloat(detalle.cantidadActual).toFixed(2)} ${detalle.unidadMedida}`,
              },
              {
                label: "Nivel mínimo",
                value: `${parseFloat(detalle.nivelMinimo).toFixed(2)} ${detalle.unidadMedida}`,
              },
              {
                label: "Nivel máximo",
                value: `${parseFloat(detalle.nivelMaximo).toFixed(2)} ${detalle.unidadMedida}`,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200"
              >
                <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-sm font-dm font-semibold text-stone-800 mt-0.5">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Nota solo lectura */}
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-dm"
            style={{ background: G[50], borderColor: G[100], color: G[300] }}
          >
            <History size={12} />
            <span>
              Los ajustes de stock los realiza el <strong>gerente local</strong>
              . Los movimientos se generan automáticamente al recibir órdenes de
              compra o por ventas.
            </span>
          </div>

          {/* Lista de movimientos */}
          {!detalle.movimientos?.length ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <History size={24} className="text-stone-200" />
              <p className="text-sm font-dm text-stone-400">
                Sin movimientos registrados
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {detalle.movimientos.map((m) => {
                const cfg = TIPO_CFG[m.tipoMovimiento] ?? {
                  icon: History,
                  color: "#94a3b8",
                  label: m.tipoMovimiento,
                  signo: null,
                };
                const Icon = cfg.icon;
                const cantidad = parseFloat(m.cantidad);
                const signo =
                  cfg.signo !== null
                    ? cfg.signo
                    : parseFloat(m.cantidadDespues) >=
                        parseFloat(m.cantidadAntes)
                      ? +1
                      : -1;
                const esIngreso = signo >= 0;

                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-stone-100"
                    style={{ borderLeft: `3px solid ${cfg.color}` }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${cfg.color}15` }}
                    >
                      <Icon size={13} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-dm font-semibold text-stone-800">
                        {cfg.label}
                      </p>
                      {m.descripcion && (
                        <p className="text-[10px] font-dm text-stone-400 truncate">
                          {m.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="text-sm font-dm font-bold"
                        style={{ color: esIngreso ? G[300] : "#dc2626" }}
                      >
                        {esIngreso ? "+" : "−"}
                        {cantidad.toFixed(2)}
                      </p>
                      <p className="text-[10px] font-dm text-stone-400">
                        → {parseFloat(m.cantidadDespues).toFixed(2)}{" "}
                        {detalle.unidadMedida}
                      </p>
                    </div>
                    <div className="text-right shrink-0 min-w-[80px]">
                      <p className="text-[10px] font-dm text-stone-400">
                        {fmtDate(m.fecha)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Fila de stock ──────────────────────────────────────────────────────────
function StockRow({ item, restaurante, onVerMovimientos }) {
  const agotado = item.estaAgotado;
  const bajo = !agotado && item.necesitaReposicion;

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
      {/* Ingrediente + almacén */}
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              agotado ? "bg-red-500" : bajo ? "bg-amber-400" : "bg-emerald-500"
            }`}
          />
          <div>
            <p className="text-sm font-dm font-semibold text-stone-800 leading-tight">
              {item.nombreIngrediente}
            </p>
            <p className="text-[10px] font-dm text-stone-400 mt-0.5">
              {item.almacenNombre}
            </p>
          </div>
        </div>
      </td>

      {/* Restaurante */}
      <td className="py-3.5 px-3 hidden md:table-cell">
        <p className="text-xs font-dm font-semibold text-stone-600 truncate max-w-[120px]">
          {restaurante?.nombre ?? "—"}
        </p>
        <p className="text-[10px] font-dm text-stone-400">
          {restaurante?.ciudad ?? ""}
        </p>
      </td>

      {/* Cantidad */}
      <td className="py-3.5 px-3 text-sm font-dm text-stone-700">
        <span className="font-semibold">
          {parseFloat(item.cantidadActual).toFixed(2)}
        </span>
        <span className="text-stone-400 text-xs ml-1">{item.unidadMedida}</span>
      </td>

      {/* Nivel */}
      <td className="py-3.5 px-3 min-w-[180px]">
        <div className="text-[10px] font-dm text-stone-400 mb-1">
          mín {parseFloat(item.nivelMinimo).toFixed(1)} · máx{" "}
          {parseFloat(item.nivelMaximo).toFixed(1)}
        </div>
        <NivelBar pct={item.porcentajeStock} agotado={agotado} bajo={bajo} />
      </td>

      {/* Estado */}
      <td className="py-3.5 px-3">
        <Badge variant={agotado ? "red" : bajo ? "amber" : "green"} size="xs">
          {agotado ? (
            <>
              <XCircle size={9} /> Agotado
            </>
          ) : bajo ? (
            <>
              <AlertTriangle size={9} /> Bajo mínimo
            </>
          ) : (
            <>
              <CheckCircle2 size={9} /> OK
            </>
          )}
        </Badge>
      </td>

      {/* Movimientos — reemplaza Ajuste */}
      <td className="py-3.5 pr-5 pl-3">
        <button
          onClick={() => onVerMovimientos(item)}
          className="flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100 transition-colors"
        >
          <History size={11} /> Movimientos
        </button>
      </td>
    </tr>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function AStockGlobal() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filtroAlmacen, setFiltroAlmacen] = useState(
    searchParams.get("almacen") ?? "",
  );
  const [filtroRestaurante, setFiltroRestaurante] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [movItem, setMovItem] = useState(null);

  const { data, loading, refetch } = useQuery(GET_STOCK, {
    fetchPolicy: "cache-and-network",
  });
  const { data: almData } = useQuery(GET_ALMACENES);
  const { data: restData } = useQuery(GET_RESTAURANTES);

  const stock = data?.stock ?? [];
  const almacenes = almData?.almacenes ?? [];
  const restaurantes = restData?.restaurantes ?? [];

  // Map almacén → restauranteId
  const almacenRestMap = useMemo(() => {
    const m = {};
    almacenes.forEach((a) => (m[a.id] = a.restauranteId));
    return m;
  }, [almacenes]);

  const restaurantesMap = useMemo(() => {
    const m = {};
    restaurantes.forEach((r) => (m[r.id] = r));
    return m;
  }, [restaurantes]);

  // Filtro de almacenes según restaurante seleccionado
  const almacenesFiltrados = useMemo(
    () =>
      filtroRestaurante
        ? almacenes.filter((a) => a.restauranteId === filtroRestaurante)
        : almacenes,
    [almacenes, filtroRestaurante],
  );

  const agotados = stock.filter((s) => s.estaAgotado).length;
  const bajos = stock.filter(
    (s) => !s.estaAgotado && s.necesitaReposicion,
  ).length;
  const ok = stock.filter(
    (s) => !s.estaAgotado && !s.necesitaReposicion,
  ).length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return stock.filter((s) => {
      if (
        q &&
        !s.nombreIngrediente.toLowerCase().includes(q) &&
        !s.almacenNombre.toLowerCase().includes(q)
      )
        return false;
      if (filtroAlmacen && s.almacen !== filtroAlmacen) return false;
      if (filtroRestaurante) {
        const restId = almacenRestMap[s.almacen];
        if (restId !== filtroRestaurante) return false;
      }
      if (filtroEstado === "agotado" && !s.estaAgotado) return false;
      if (filtroEstado === "bajo" && (s.estaAgotado || !s.necesitaReposicion))
        return false;
      if (filtroEstado === "ok" && (s.estaAgotado || s.necesitaReposicion))
        return false;
      return true;
    });
  }, [
    stock,
    search,
    filtroAlmacen,
    filtroRestaurante,
    filtroEstado,
    almacenRestMap,
  ]);

  const almacenSeleccionado = filtroAlmacen
    ? almacenes.find((a) => a.id === filtroAlmacen)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title={
          almacenSeleccionado
            ? `Stock — ${almacenSeleccionado.nombre}`
            : "Stock global"
        }
        description={
          almacenSeleccionado
            ? "Mostrando stock de este almacén. Usa el selector para cambiar de almacén."
            : "Niveles de inventario de todos los almacenes de la cadena — solo lectura."
        }
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-xs font-dm">
              {agotados > 0 && (
                <span className="flex items-center gap-1 text-red-600 font-semibold">
                  <XCircle size={12} /> {agotados} agotados
                </span>
              )}
              {bajos > 0 && (
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  <AlertTriangle size={12} /> {bajos} bajo mínimo
                </span>
              )}
              <span className="text-stone-400">{ok} OK</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              title="Recargar"
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* Stats clicables */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Agotados",
            n: agotados,
            bg: "#fef2f2",
            text: "#dc2626",
            border: "#fecaca",
            icon: <XCircle size={15} className="text-red-400" />,
            filter: "agotado",
          },
          {
            label: "Bajo mínimo",
            n: bajos,
            bg: "#fffbeb",
            text: "#d97706",
            border: "#fde68a",
            icon: <AlertTriangle size={15} className="text-amber-400" />,
            filter: "bajo",
          },
          {
            label: "Nivel OK",
            n: ok,
            bg: G[50],
            text: G[300],
            border: G[100],
            icon: <CheckCircle2 size={15} style={{ color: G[100] }} />,
            filter: "ok",
          },
        ].map(({ label, n, bg, text, border, icon, filter }) => (
          <button
            key={label}
            onClick={() =>
              setFiltroEstado(filtroEstado === filter ? "all" : filter)
            }
            className="flex items-center gap-3 p-3.5 rounded-2xl border transition-all hover:-translate-y-0.5 text-left"
            style={{
              background: bg,
              borderColor: filtroEstado === filter ? text : border,
              boxShadow:
                filtroEstado === filter
                  ? `0 0 0 2px ${text}22`
                  : "0 2px 8px rgba(0,0,0,0.05)",
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
            placeholder="Buscar ingrediente o almacén..."
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

        {/* Filtro almacén — en cascada con restaurante */}
        <select
          value={filtroAlmacen}
          onChange={(e) => setFiltroAlmacen(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none cursor-pointer"
        >
          <option value="">Todos los almacenes</option>
          {almacenesFiltrados.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Contador */}
      {!loading && (
        <p className="text-xs font-dm text-stone-400 -mt-2">
          {filtered.length} ítem{filtered.length !== 1 ? "s" : ""}
          {filtroEstado !== "all" &&
            ` · ${
              filtroEstado === "agotado"
                ? "agotados"
                : filtroEstado === "bajo"
                  ? "bajo mínimo"
                  : "nivel OK"
            }`}
          {" · "}
          <span className="text-stone-500">
            Solo lectura — los ajustes los gestiona el gerente
          </span>
        </p>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? "Sin resultados" : "Sin stock registrado"}
          description={
            search
              ? `No hay ítems que coincidan con "${search}".`
              : "No hay stock registrado en ningún almacén."
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
                    { l: "Ingrediente · Almacén", cls: "pl-5 pr-3" },
                    { l: "Restaurante", cls: "px-3 hidden md:table-cell" },
                    { l: "Cantidad", cls: "px-3" },
                    { l: "Nivel", cls: "px-3 min-w-[180px]" },
                    { l: "Estado", cls: "px-3" },
                    { l: "Historial", cls: "pr-5 pl-3" },
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
                {filtered.map((item) => (
                  <StockRow
                    key={item.id}
                    item={item}
                    restaurante={restaurantesMap[almacenRestMap[item.almacen]]}
                    onVerMovimientos={setMovItem}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <MovimientosModal
        open={!!movItem}
        onClose={() => setMovItem(null)}
        item={movItem}
      />
    </div>
  );
}
