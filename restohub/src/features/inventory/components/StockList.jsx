// src/features/inventory/components/StockList.jsx
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Search,
  TrendingDown,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Plus,
  SlidersHorizontal,
  ArrowRight,
  Minus,
} from "lucide-react";
import Swal from "sweetalert2";
import { GET_STOCK, GET_ALMACENES } from "../graphql/queries";
import { AJUSTAR_STOCK } from "../graphql/mutations";
import {
  Badge,
  Button,
  PageHeader,
  StatCard,
  Skeleton,
  Modal,
  Input,
  EmptyState,
} from "../../../shared/components/ui";

// ── StockBar ───────────────────────────────────────────────────────────────
function StockBar({ pct, agotado, bajo }) {
  const p = Math.min(Math.max(pct ?? 0, 0), 100);
  const color = agotado
    ? "bg-red-400"
    : bajo
      ? "bg-amber-400"
      : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${p}%` }}
        />
      </div>
      <span
        className={`text-[10px] font-dm font-semibold w-8 text-right ${agotado ? "text-red-500" : bajo ? "text-amber-500" : "text-emerald-600"}`}
      >
        {Math.round(p)}%
      </span>
    </div>
  );
}

// ── ModalAjuste ────────────────────────────────────────────────────────────
function ModalAjuste({ open, onClose, item }) {
  const [cantidad, setCantidad] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ajustar, { loading }] = useMutation(AJUSTAR_STOCK, {
    refetchQueries: ["GetStock"],
  });

  if (!item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(cantidad);
    if (val === 0) return;

    // Validar que no quede negativo
    const nueva = parseFloat(item.cantidadActual) + val;
    if (nueva < 0) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        iconColor: "#F59E0B",
        title: "Stock insuficiente",
        text: `El stock quedaría en ${nueva.toFixed(3)} ${item.unidadMedida}. No puede ser negativo.`,
        confirmButtonColor: "#F59E0B",
      });
      return;
    }

    const { data: res } = await ajustar({
      variables: { id: item.id, cantidad: val, descripcion },
    });
    if (res.ajustarStock.ok) {
      onClose();
      setCantidad("");
      setDescripcion("");
    } else {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: res.ajustarStock.error,
        confirmButtonColor: "#F59E0B",
      });
    }
  };

  const val = parseFloat(cantidad) || 0;
  const nueva = parseFloat(item.cantidadActual) + val;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajuste manual de stock"
      size="sm"
    >
      <div className="mb-4 px-4 py-3 rounded-xl bg-stone-50 border border-stone-200">
        <p className="text-xs font-dm text-stone-500 mb-0.5">Ingrediente</p>
        <p className="font-playfair text-stone-900 font-semibold">
          {item.nombreIngrediente}
        </p>
        <p className="text-xs font-dm text-stone-400 mt-0.5">
          {item.almacenNombre}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-dm text-stone-500">Stock actual:</span>
          <span className="font-playfair font-bold text-stone-900">
            {parseFloat(item.cantidadActual).toFixed(3)} {item.unidadMedida}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-600">
            Cantidad de ajuste
            <span className="text-stone-400 font-normal ml-1">
              (positivo = entrada, negativo = salida)
            </span>
          </label>
          <input
            type="number"
            step="0.001"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
            placeholder="Ej: 5.000 o -2.500"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
          />
          {cantidad && (
            <div
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-dm ${nueva < 0 ? "bg-red-50 border border-red-200 text-red-600" : "bg-emerald-50 border border-emerald-200 text-emerald-700"}`}
            >
              <span>Stock resultante:</span>
              <span className="font-bold">
                {nueva.toFixed(3)} {item.unidadMedida}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-600">
            Justificación <span className="text-red-400">*</span>
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
            minLength={10}
            rows={3}
            placeholder="Ej: Merma por vencimiento detectada en almacén principal..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
          />
          <p className="text-[11px] font-dm text-stone-400">
            Mínimo 10 caracteres. Obligatorio para auditoría.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={loading}
            type="submit"
            disabled={
              !cantidad || parseFloat(cantidad) === 0 || descripcion.length < 10
            }
          >
            Aplicar ajuste
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── StockCard ──────────────────────────────────────────────────────────────
function StockCard({ item, onAjustar, onClick }) {
  const pct = item.porcentajeStock ?? 0;
  return (
    <div
      onClick={onClick}
      className="group rounded-2xl bg-white border border-stone-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div
        className={`h-1 ${item.estaAgotado ? "bg-red-400" : item.necesitaReposicion ? "bg-amber-400" : "bg-emerald-400"}`}
      />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-playfair text-stone-900 font-semibold text-sm leading-tight truncate">
              {item.nombreIngrediente}
            </p>
            <p className="text-[10px] font-dm text-stone-400 mt-0.5 truncate">
              {item.almacenNombre}
            </p>
          </div>
          <Badge
            variant={
              item.estaAgotado
                ? "red"
                : item.necesitaReposicion
                  ? "amber"
                  : "green"
            }
            size="xs"
          >
            {item.estaAgotado
              ? "Agotado"
              : item.necesitaReposicion
                ? "Stock bajo"
                : "OK"}
          </Badge>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="font-playfair text-2xl font-bold text-stone-900">
              {parseFloat(item.cantidadActual).toFixed(2)}
            </p>
            <p className="text-[10px] font-dm text-stone-400">
              {item.unidadMedida} · mín{" "}
              {parseFloat(item.nivelMinimo).toFixed(2)}
            </p>
          </div>
        </div>

        <StockBar
          pct={pct}
          agotado={item.estaAgotado}
          bajo={item.necesitaReposicion}
        />

        <div className="pt-1 border-t border-stone-100 flex items-center justify-between">
          <span className="text-[10px] font-dm text-stone-400">
            {new Date(item.fechaActualizacion).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "short",
            })}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAjustar(item);
            }}
            className="text-[10px] font-dm font-semibold text-amber-600 hover:text-amber-700 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
          >
            Ajustar stock <ArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function StockList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("all");
  const [almacenFiltro, setAlmacenFiltro] = useState("");
  const [itemAjuste, setItemAjuste] = useState(null);

  const { data, loading } = useQuery(GET_STOCK, {
    variables: { almacenId: almacenFiltro || undefined },
  });
  const { data: almData } = useQuery(GET_ALMACENES);

  const stock = data?.stock ?? [];
  const almacenes = almData?.almacenes ?? [];

  const agotados = stock.filter((s) => s.estaAgotado).length;
  const bajoMinimo = stock.filter(
    (s) => !s.estaAgotado && s.necesitaReposicion,
  ).length;
  const normales = stock.filter(
    (s) => !s.estaAgotado && !s.necesitaReposicion,
  ).length;

  const filtered = stock.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = s.nombreIngrediente.toLowerCase().includes(q);
    const matchFiltro =
      filtro === "all"
        ? true
        : filtro === "agotado"
          ? s.estaAgotado
          : filtro === "bajo"
            ? !s.estaAgotado && s.necesitaReposicion
            : !s.estaAgotado && !s.necesitaReposicion;
    return matchSearch && matchFiltro;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory Service"
        title="Stock de ingredientes"
        description="Control de niveles de inventario por almacén y alertas de reposición."
        action={
          <div className="flex items-center gap-2">
            <StatCard label="Agotados" value={agotados} icon={XCircle} />
            <StatCard
              label="Bajo mínimo"
              value={bajoMinimo}
              icon={TrendingDown}
            />
            <StatCard
              label="Normales"
              value={normales}
              icon={CheckCircle2}
              accent
            />
          </div>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
          <Search size={14} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ingrediente..."
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200 shadow-sm">
          {[
            { v: "all", l: "Todos" },
            { v: "agotado", l: "Agotados" },
            { v: "bajo", l: "Bajo mínimo" },
            { v: "normal", l: "Normales" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-dm font-medium transition-all whitespace-nowrap ${filtro === v ? "bg-amber-500 text-white shadow-sm" : "text-stone-400 hover:text-stone-700"}`}
            >
              {l}
            </button>
          ))}
        </div>

        <select
          value={almacenFiltro}
          onChange={(e) => setAlmacenFiltro(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all shadow-sm"
        >
          <option value="">Todos los almacenes</option>
          {almacenes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin resultados"
          description="Prueba con otros filtros de búsqueda."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <StockCard
              key={item.id}
              item={item}
              onAjustar={setItemAjuste}
              onClick={() => navigate(`/inventario/stock/${item.id}`)}
            />
          ))}
        </div>
      )}

      <ModalAjuste
        open={!!itemAjuste}
        onClose={() => setItemAjuste(null)}
        item={itemAjuste}
      />
    </div>
  );
}
