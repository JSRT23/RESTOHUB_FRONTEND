// src/features/inventory/components/admin/AAlmacenesList.jsx
// Admin Central — almacenes de toda la cadena.
// Ve, crea y activa/desactiva almacenes por restaurante.
// Al click en un almacén navega a su stock.

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import {
  Warehouse,
  Plus,
  Search,
  Building2,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";
import { GET_ALMACENES } from "../../graphql/queries";
import { CREAR_ALMACEN } from "../../graphql/mutations";
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

const icls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-400 outline-none transition-all shadow-sm";
const fi = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
};
const fb = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};

// ── Modal crear almacén ────────────────────────────────────────────────────
function CrearAlmacenModal({ open, onClose, restaurantes }) {
  const INIT = { restauranteId: "", nombre: "", descripcion: "" };
  const [form, setForm] = useState({ ...INIT });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Al seleccionar restaurante, auto-rellena el nombre como "Almacén Principal — {nombre}"
  const handleRestauranteChange = (e) => {
    const id = e.target.value;
    const rest = restaurantes.find((r) => r.id === id);
    setForm((f) => ({
      ...f,
      restauranteId: id,
      nombre: rest ? `Almacén Principal — ${rest.nombre}` : f.nombre,
    }));
  };

  const [crear, { loading }] = useMutation(CREAR_ALMACEN, {
    refetchQueries: ["GetAlmacenes"],
  });

  const handleSave = async () => {
    if (!form.restauranteId || !form.nombre.trim()) return;
    try {
      const { data } = await crear({
        variables: {
          restauranteId: form.restauranteId,
          nombre: form.nombre.trim(),
          descripcion: form.descripcion || null,
        },
      });
      if (!data?.crearAlmacen?.ok)
        throw new Error(data?.crearAlmacen?.error ?? "Error");
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Almacén creado",
        timer: 1500,
        timerProgressBar: true,
        confirmButtonColor: G[900],
      });
      onClose();
      setForm({ ...INIT });
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

  return (
    <Modal open={open} onClose={onClose} title="Nuevo almacén" size="sm">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-500">
            Restaurante <span className="text-red-400">*</span>
          </label>
          <select
            value={form.restauranteId}
            onChange={handleRestauranteChange}
            className={icls + " appearance-none cursor-pointer"}
            onFocus={fi}
            onBlur={fb}
          >
            <option value="">Selecciona un restaurante</option>
            {restaurantes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre} — {r.ciudad}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-500">
            Nombre <span className="text-red-400">*</span>
          </label>
          <input
            value={form.nombre}
            onChange={set("nombre")}
            placeholder="Ej: Bodega principal, Cuarto frío..."
            className={icls}
            onFocus={fi}
            onBlur={fb}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-500">
            Descripción (opcional)
          </label>
          <input
            value={form.descripcion}
            onChange={set("descripcion")}
            placeholder="Descripción del almacén..."
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
            disabled={!form.restauranteId || !form.nombre.trim()}
            onClick={handleSave}
          >
            Crear almacén
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Tarjeta almacén ────────────────────────────────────────────────────────
function AlmacenCard({ almacen, restaurante, onNavigate }) {
  const alertas = almacen.ingredientesBajoMinimo ?? 0;
  const total = almacen.totalIngredientes ?? 0;

  return (
    <button
      onClick={() => onNavigate(`/inventario/stock?almacen=${almacen.id}`)}
      className="w-full text-left bg-white rounded-2xl border border-stone-200 overflow-hidden hover:-translate-y-0.5 transition-all duration-200 group"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      {/* Tira de color */}
      <div
        className="h-1"
        style={{
          background: almacen.activo
            ? `linear-gradient(90deg, ${G[300]}, ${G[100]})`
            : "linear-gradient(90deg,#d4d4d4,#e5e5e5)",
        }}
      />

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: almacen.activo ? G[50] : "#f5f5f4" }}
            >
              <Warehouse
                size={15}
                style={{ color: almacen.activo ? G[300] : "#a8a29e" }}
              />
            </div>
            <div className="min-w-0">
              <p className="font-dm text-stone-900 font-semibold text-sm truncate">
                {almacen.nombre}
              </p>
              {almacen.descripcion && (
                <p className="text-[10px] font-dm text-stone-400 truncate mt-0.5">
                  {almacen.descripcion}
                </p>
              )}
            </div>
          </div>
          <Badge variant={almacen.activo ? "green" : "default"} size="xs">
            {almacen.activo ? (
              <>
                <CheckCircle2 size={9} /> Activo
              </>
            ) : (
              <>
                <XCircle size={9} /> Inactivo
              </>
            )}
          </Badge>
        </div>

        {/* Restaurante */}
        {restaurante && (
          <div className="flex items-center gap-1.5 text-[10px] font-dm text-stone-500">
            <Building2 size={10} className="text-stone-300" />
            <span className="truncate">
              {restaurante.nombre} · {restaurante.ciudad}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 pt-1 border-t border-stone-100">
          <span className="flex items-center gap-1 text-[11px] font-dm text-stone-500">
            <Package size={10} className="text-stone-300" /> {total}{" "}
            ingredientes
          </span>
          {alertas > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-dm font-semibold text-amber-600">
              <AlertTriangle size={10} /> {alertas} bajo mínimo
            </span>
          )}
          <ArrowRight
            size={12}
            className="ml-auto text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>
      </div>
    </button>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function AAlmacenesList() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroRestaurante, setFiltroRestaurante] = useState("");

  const { data, loading, refetch } = useQuery(GET_ALMACENES, {
    fetchPolicy: "cache-and-network",
  });
  const { data: restData } = useQuery(GET_RESTAURANTES);

  const almacenes = data?.almacenes ?? [];
  const restaurantes = restData?.restaurantes ?? [];

  const restaurantesMap = useMemo(() => {
    const m = {};
    restaurantes.forEach((r) => (m[r.id] = r));
    return m;
  }, [restaurantes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return almacenes.filter((a) => {
      if (
        q &&
        !a.nombre.toLowerCase().includes(q) &&
        !(restaurantesMap[a.restauranteId]?.nombre ?? "")
          .toLowerCase()
          .includes(q)
      )
        return false;
      if (filtroRestaurante && a.restauranteId !== filtroRestaurante)
        return false;
      return true;
    });
  }, [almacenes, search, filtroRestaurante, restaurantesMap]);

  const totalIngredientesBajos = almacenes.reduce(
    (s, a) => s + (a.ingredientesBajoMinimo ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title="Almacenes"
        description="Todos los almacenes de la cadena — organizados por restaurante."
        action={
          <div className="flex items-center gap-3">
            {totalIngredientesBajos > 0 && (
              <span
                className="hidden sm:flex items-center gap-1.5 text-xs font-dm font-semibold text-amber-700 px-2.5 py-1.5 rounded-xl border"
                style={{ background: "#fffbeb", borderColor: "#fde68a" }}
              >
                <AlertTriangle size={12} /> {totalIngredientesBajos}{" "}
                ingredientes bajo mínimo
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              title="Recargar"
            >
              <RefreshCw size={14} />
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={14} /> Nuevo almacén
            </Button>
          </div>
        }
      />

      {/* Controles */}
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
            placeholder="Buscar almacén o restaurante..."
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

      {/* Stats */}
      {!loading && (
        <div className="flex items-center gap-4 text-xs font-dm text-stone-500 -mt-2">
          <span>
            <span className="font-bold" style={{ color: G[300] }}>
              {almacenes.length}
            </span>{" "}
            almacenes
          </span>
          <span className="text-stone-300">·</span>
          <span>
            <span className="font-bold text-stone-700">
              {almacenes.filter((a) => a.activo).length}
            </span>{" "}
            activos
          </span>
          {filtroRestaurante && <span className="text-stone-300">·</span>}
          {filtroRestaurante && (
            <span className="font-semibold" style={{ color: G[300] }}>
              {filtered.length} en este restaurante
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title={search ? "Sin resultados" : "Sin almacenes"}
          description={
            search
              ? `No hay almacenes que coincidan con "${search}".`
              : "Crea el primer almacén para un restaurante."
          }
          action={
            !search && (
              <Button onClick={() => setModalOpen(true)}>
                <Plus size={14} /> Nuevo almacén
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <AlmacenCard
              key={a.id}
              almacen={a}
              restaurante={restaurantesMap[a.restauranteId]}
              onNavigate={navigate}
            />
          ))}
        </div>
      )}

      <CrearAlmacenModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        restaurantes={restaurantes}
      />
    </div>
  );
}
