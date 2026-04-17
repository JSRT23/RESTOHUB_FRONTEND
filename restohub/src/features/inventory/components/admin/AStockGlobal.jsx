// src/features/inventory/components/admin/AStockGlobal.jsx
// Admin Central — Stock global de toda la cadena.
// Ve stock de todos los almacenes, filtra por restaurante/almacén/estado.
// Puede ajustar cantidades (ajuste manual con descripción).

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useSearchParams } from "react-router-dom";
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  BarChart3,
  Loader2,
  TrendingDown,
  Minus,
  Plus,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";
import { GET_STOCK, GET_ALMACENES } from "../../graphql/queries";
import { AJUSTAR_STOCK } from "../../graphql/mutations";
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

// ── Modal Ajuste manual ────────────────────────────────────────────────────
function AjusteModal({ open, onClose, item }) {
  const [cantidad, setCantidad] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ajustar, { loading }] = useMutation(AJUSTAR_STOCK, {
    refetchQueries: ["GetStock"],
  });

  const handleSave = async () => {
    const val = parseFloat(cantidad);
    if (!val || !descripcion.trim()) return;
    try {
      const { data } = await ajustar({
        variables: {
          id: item.id,
          cantidad: val,
          descripcion: descripcion.trim(),
        },
      });
      if (!data?.ajustarStock?.ok)
        throw new Error(data?.ajustarStock?.error ?? "Error");
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Stock ajustado",
        timer: 1400,
        timerProgressBar: true,
        confirmButtonColor: G[900],
      });
      onClose();
      setCantidad("");
      setDescripcion("");
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    }
  };

  const icls =
    "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-400 outline-none transition-all";
  const fi = (e) => {
    e.target.style.borderColor = "transparent";
    e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
  };
  const fb = (e) => {
    e.target.style.borderColor = "#e2e8f0";
    e.target.style.boxShadow = "none";
  };

  if (!item) return null;
  return (
    <Modal open={open} onClose={onClose} title="Ajuste de stock" size="sm">
      <div className="space-y-4">
        <div
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border"
          style={{ background: G[50], borderColor: G[100] }}
        >
          <Package size={14} style={{ color: G[300] }} />
          <div>
            <p
              className="text-sm font-dm font-semibold"
              style={{ color: G[500] }}
            >
              {item.nombreIngrediente}
            </p>
            <p className="text-[10px] font-dm text-stone-400">
              Actual: {item.cantidadActual} {item.unidadMedida} · Almacén:{" "}
              {item.almacenNombre}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-500">
            Cantidad a ajustar{" "}
            <span className="text-stone-400 font-normal">
              (positivo = entrada, negativo = salida)
            </span>
          </label>
          <input
            type="number"
            step="0.001"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="Ej: 5.000 o -2.500"
            className={icls}
            onFocus={fi}
            onBlur={fb}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-500">
            Motivo del ajuste <span className="text-red-400">*</span>
          </label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Conteo físico semanal, Merma detectada..."
            className={icls}
            onFocus={fi}
            onBlur={fb}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={loading}
            disabled={!cantidad || !descripcion.trim()}
            onClick={handleSave}
          >
            Aplicar ajuste
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Fila de stock ──────────────────────────────────────────────────────────
function StockRow({ item, onAjustar }) {
  const agotado = item.estaAgotado;
  const bajo = !agotado && item.necesitaReposicion;
  const ok = !agotado && !bajo;

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${agotado ? "bg-red-500" : bajo ? "bg-amber-400" : "bg-emerald-500"}`}
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

      <td className="py-3.5 px-3 text-sm font-dm text-stone-700">
        <span className="font-semibold">
          {parseFloat(item.cantidadActual).toFixed(2)}
        </span>
        <span className="text-stone-400 text-xs ml-1">{item.unidadMedida}</span>
      </td>

      <td className="py-3.5 px-3">
        <div className="text-[10px] font-dm text-stone-400 mb-1">
          mín {parseFloat(item.nivelMinimo).toFixed(1)} · máx{" "}
          {parseFloat(item.nivelMaximo).toFixed(1)}
        </div>
        <NivelBar pct={item.porcentajeStock} agotado={agotado} bajo={bajo} />
      </td>

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

      <td className="py-3.5 pr-5 pl-3">
        <button
          onClick={() => onAjustar(item)}
          className="flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100 transition-colors"
        >
          <SlidersHorizontal size={11} /> Ajustar
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
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [ajusteItem, setAjusteItem] = useState(null);

  const { data, loading, refetch } = useQuery(GET_STOCK, {
    fetchPolicy: "cache-and-network",
  });
  const { data: almData } = useQuery(GET_ALMACENES);

  const stock = data?.stock ?? [];
  const almacenes = almData?.almacenes ?? [];

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
      if (filtroEstado === "agotado" && !s.estaAgotado) return false;
      if (filtroEstado === "bajo" && (s.estaAgotado || !s.necesitaReposicion))
        return false;
      if (filtroEstado === "ok" && (s.estaAgotado || s.necesitaReposicion))
        return false;
      return true;
    });
  }, [stock, search, filtroAlmacen, filtroEstado]);

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
            : "Niveles de inventario de todos los almacenes de la cadena."
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

      {/* Stats strip */}
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
      </div>

      {/* Contador */}
      {!loading && (
        <p className="text-xs font-dm text-stone-400 -mt-2">
          {filtered.length} ítem{filtered.length !== 1 ? "s" : ""}
          {filtroEstado !== "all" &&
            ` · ${filtroEstado === "agotado" ? "agotados" : filtroEstado === "bajo" ? "bajo mínimo" : "nivel OK"}`}
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
                    { l: "Cantidad", cls: "px-3" },
                    { l: "Nivel", cls: "px-3 min-w-[180px]" },
                    { l: "Estado", cls: "px-3" },
                    { l: "Ajuste", cls: "pr-5 pl-3" },
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
                    onAjustar={setAjusteItem}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AjusteModal
        open={!!ajusteItem}
        onClose={() => setAjusteItem(null)}
        item={ajusteItem}
      />
    </div>
  );
}
