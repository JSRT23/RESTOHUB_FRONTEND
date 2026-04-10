// src/features/menu/components/CategoriasList.jsx
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Tag,
  Plus,
  Search,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  GripVertical,
  Hash,
} from "lucide-react";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
} from "../../../shared/components/ui";
import {
  GET_CATEGORIAS,
  CREAR_CATEGORIA,
  ACTUALIZAR_CATEGORIA,
  ACTIVAR_CATEGORIA,
  DESACTIVAR_CATEGORIA,
} from "../graphql/categorias.operations";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const fi = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
};
const fb = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};
const inputCls =
  "w-full px-3.5 py-3 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all shadow-sm";

// ── Modal crear / editar ───────────────────────────────────────────────────
function CategoriaModal({ categoria, onClose, onSaved }) {
  const editando = !!categoria;
  const [form, setForm] = useState({
    nombre: categoria?.nombre || "",
    descripcion: categoria?.descripcion || "",
    orden: categoria?.orden ?? "",
  });
  const [error, setError] = useState("");

  const [crear, { loading: lc }] = useMutation(CREAR_CATEGORIA);
  const [actualizar, { loading: la }] = useMutation(ACTUALIZAR_CATEGORIA);
  const loading = lc || la;

  const handleSave = async () => {
    setError("");
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    const vars = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      orden: form.orden !== "" ? parseInt(form.orden) : null,
    };

    if (editando) {
      const { data } = await actualizar({
        variables: { id: categoria.id, ...vars },
      });
      if (!data?.actualizarCategoria?.ok) {
        setError(data?.actualizarCategoria?.error || "Error al actualizar.");
        return;
      }
    } else {
      const { data } = await crear({ variables: vars });
      if (!data?.crearCategoria?.ok) {
        setError(data?.crearCategoria?.error || "Error al crear.");
        return;
      }
    }
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1" style={{ background: G[900] }} />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: G[50] }}
          >
            <Tag size={14} style={{ color: G[300] }} />
          </div>
          <h2
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="font-semibold text-stone-900 text-lg flex-1"
          >
            {editando ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400 text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <div className="p-5 space-y-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Entradas, Platos fuertes, Postres..."
              className={inputCls}
              onFocus={fi}
              onBlur={fb}
              autoFocus
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
              Descripción{" "}
              <span className="text-stone-300 font-normal normal-case">
                (opcional)
              </span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
              placeholder="Describe brevemente esta categoría..."
              rows={3}
              className={`${inputCls} resize-none`}
              onFocus={fi}
              onBlur={fb}
            />
          </div>

          {/* Orden */}
          <div className="space-y-1.5">
            <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Hash size={11} style={{ color: G[300] }} />
              Orden de aparición{" "}
              <span className="text-stone-300 font-normal normal-case">
                (opcional)
              </span>
            </label>
            <input
              type="number"
              min="1"
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: e.target.value })}
              placeholder="1, 2, 3..."
              className={inputCls}
              onFocus={fi}
              onBlur={fb}
            />
            <p className="text-[11px] font-dm text-stone-400 pl-1">
              Controla el orden en que aparecen las categorías en el menú
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
              <p className="text-xs font-dm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-stone-100 bg-stone-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-dm font-semibold text-stone-500 bg-white border border-stone-200 hover:border-stone-300 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{ background: G[900] }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-dm font-bold text-white hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {editando ? "Guardar cambios" : "Crear categoría"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Fila de categoría ──────────────────────────────────────────────────────
function CategoriaRow({ cat, onEdit, onToggle, toggling }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50/60 transition-colors group">
      {/* Drag handle (visual) */}
      <div className="text-stone-200 group-hover:text-stone-300 transition-colors shrink-0">
        <GripVertical size={14} />
      </div>

      {/* Icono */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: cat.activo ? G[50] : "#f3f4f6" }}
      >
        <Tag size={14} style={{ color: cat.activo ? G[300] : "#9ca3af" }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-dm font-semibold text-stone-800 truncate">
            {cat.nombre}
          </p>
          {cat.orden && (
            <span className="text-[10px] font-dm text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-md shrink-0">
              #{cat.orden}
            </span>
          )}
        </div>
        {cat.descripcion && (
          <p className="text-xs font-dm text-stone-400 truncate mt-0.5">
            {cat.descripcion}
          </p>
        )}
      </div>

      {/* Estado */}
      <span
        style={
          cat.activo
            ? {
                background: G[50],
                color: G[500],
                border: `1px solid ${G[100]}`,
              }
            : {
                background: "#f3f4f6",
                color: "#6b7280",
                border: "1px solid #e5e7eb",
              }
        }
        className="text-[10px] font-dm font-bold px-3 py-1.5 rounded-full tracking-wide shrink-0"
      >
        {cat.activo ? "ACTIVA" : "INACTIVA"}
      </span>

      {/* Acciones */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onEdit(cat)}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400
                     bg-white border border-stone-200 hover:border-stone-300 hover:text-stone-700
                     transition-all shadow-sm"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => onToggle(cat)}
          disabled={toggling === cat.id}
          style={
            cat.activo
              ? {
                  background: "#fef2f2",
                  color: "#dc2626",
                  borderColor: "#fecaca",
                }
              : { background: G[50], color: G[300], borderColor: G[100] }
          }
          className="w-8 h-8 rounded-xl flex items-center justify-center border
                     transition-all shadow-sm disabled:opacity-50"
        >
          {toggling === cat.id ? (
            <Loader2 size={12} className="animate-spin" />
          ) : cat.activo ? (
            <ToggleRight size={13} />
          ) : (
            <ToggleLeft size={13} />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function CategoriasList() {
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [modal, setModal] = useState(null); // null | "nueva" | categoria
  const [toggling, setToggling] = useState(null);

  const { data, loading, refetch } = useQuery(GET_CATEGORIAS, {
    fetchPolicy: "cache-and-network",
  });

  const [activar] = useMutation(ACTIVAR_CATEGORIA);
  const [desactivar] = useMutation(DESACTIVAR_CATEGORIA);

  const todas = data?.categorias || [];
  const categorias = todas
    .filter((c) => {
      const q = search.toLowerCase();
      const matchQ =
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        c.descripcion?.toLowerCase().includes(q);
      const matchF =
        filtro === "todas" ? true : filtro === "activas" ? c.activo : !c.activo;
      return matchQ && matchF;
    })
    .sort(
      (a, b) =>
        (a.orden ?? 999) - (b.orden ?? 999) || a.nombre.localeCompare(b.nombre),
    );

  const handleToggle = async (cat) => {
    setToggling(cat.id);
    if (cat.activo) {
      await desactivar({ variables: { id: cat.id } });
    } else {
      await activar({ variables: { id: cat.id } });
    }
    await refetch();
    setToggling(null);
  };

  const handleSaved = () => {
    setModal(null);
    refetch();
  };

  const activas = todas.filter((c) => c.activo).length;
  const inactivas = todas.filter((c) => !c.activo).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Central · Menú"
        title="Categorías globales"
        description="Las categorías las usan todos los restaurantes para organizar sus platos"
        action={
          <Button onClick={() => setModal("nueva")} variant="primary" size="md">
            <Plus size={15} /> Nueva categoría
          </Button>
        }
      />

      {/* Stats */}
      {!loading && todas.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { n: todas.length, l: "en total", style: {} },
            {
              n: activas,
              l: "activas",
              style: { background: `${G[50]}99`, borderColor: G[100] },
            },
            ...(inactivas > 0
              ? [{ n: inactivas, l: "inactivas", style: {} }]
              : []),
          ].map((s, i) => (
            <div
              key={i}
              style={s.style}
              className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-4 py-2.5 shadow-sm"
            >
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: s.style.borderColor ? G[500] : "#1c1917",
                }}
                className="text-2xl font-bold"
              >
                {s.n}
              </span>
              <span
                style={{ color: s.style.borderColor ? G[300] : "#9ca3af" }}
                className="text-xs font-dm"
              >
                {s.l}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm
                       text-stone-700 placeholder:text-stone-300 outline-none shadow-sm transition-all"
            onFocus={fi}
            onBlur={fb}
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
          {["todas", "activas", "inactivas"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={filtro === f ? { background: G[900], color: "white" } : {}}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-dm font-semibold capitalize transition-all
                ${filtro === f ? "" : "text-stone-500 hover:bg-stone-50"}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 px-5 py-4 ${i < 4 ? "border-b border-stone-100" : ""}`}
            >
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-xl" />
              <Skeleton className="w-8 h-8 rounded-xl" />
            </div>
          ))}
        </div>
      ) : categorias.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={search ? "Sin resultados" : "Sin categorías"}
          description={
            search
              ? `No hay categorías que coincidan con "${search}"`
              : "Crea la primera categoría global para que los gerentes puedan organizar sus platos"
          }
          action={
            !search && (
              <Button
                onClick={() => setModal("nueva")}
                variant="primary"
                size="sm"
              >
                <Plus size={13} /> Nueva categoría
              </Button>
            )
          }
        />
      ) : (
        <div
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          {/* Header tabla */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-stone-100 bg-stone-50/50">
            <div className="w-4 shrink-0" />
            <div className="w-9 shrink-0" />
            <p className="flex-1 text-[10px] font-dm font-bold text-stone-400 uppercase tracking-wider">
              Categoría
            </p>
            <p className="text-[10px] font-dm font-bold text-stone-400 uppercase tracking-wider w-24 text-center shrink-0">
              Estado
            </p>
            <p className="text-[10px] font-dm font-bold text-stone-400 uppercase tracking-wider w-20 text-right shrink-0">
              Acciones
            </p>
          </div>

          {/* Filas */}
          {categorias.map((cat, i) => (
            <div
              key={cat.id}
              className={
                i < categorias.length - 1 ? "border-b border-stone-100" : ""
              }
            >
              <CategoriaRow
                cat={cat}
                toggling={toggling}
                onToggle={handleToggle}
                onEdit={(cat) => setModal(cat)}
              />
            </div>
          ))}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/50">
            <p className="text-xs font-dm text-stone-400">
              {categorias.length} categoría{categorias.length !== 1 ? "s" : ""}
              {filtro !== "todas" ? ` ${filtro}` : ""}
              {search ? ` · "${search}"` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <CategoriaModal
          categoria={modal === "nueva" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
