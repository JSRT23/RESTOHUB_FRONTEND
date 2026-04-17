// src/features/menu/components/admin/IngredientesList.jsx
// Admin Central — catálogo global de ingredientes.
// Ve TODOS (globales + de cualquier restaurante).
// Puede crear, editar nombre/descripción, activar/desactivar.
// La unidad de medida es inmutable una vez creado.

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  FlaskConical,
  Package,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Globe,
  Building2,
  Loader2,
  Filter,
} from "lucide-react";
import Swal from "sweetalert2";
import { GET_INGREDIENTES, GET_PLATOS } from "./graphql/queries";
import {
  CREAR_INGREDIENTE,
  ACTUALIZAR_INGREDIENTE,
  ACTIVAR_INGREDIENTE,
  DESACTIVAR_INGREDIENTE,
} from "./graphql/mutations";
import { GET_RESTAURANTES } from "./graphql/operations";
import {
  Badge,
  Button,
  PageHeader,
  EmptyState,
  Skeleton,
  Modal,
} from "../../../../shared/components/ui";

// ── Paleta ─────────────────────────────────────────────────────────────────
const A = {
  accent: "#D97706",
  accentLight: "#FEF3C7",
  accentMid: "#F59E0B",
  900: "#1C1917",
};

// ── Helpers ────────────────────────────────────────────────────────────────
const UNIDADES_LABEL = {
  kg: "kg",
  g: "g",
  l: "l",
  ml: "ml",
  und: "und",
  por: "por",
};

const UNIDADES = [
  { value: "kg", label: "Kilogramo (kg)" },
  { value: "g", label: "Gramo (g)" },
  { value: "l", label: "Litro (l)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "und", label: "Unidad (und)" },
  { value: "por", label: "Porción (por)" },
];

const icls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-400 outline-none transition-all shadow-sm";

function fi(e) {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${A.accent}`;
}
function fb(e) {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-dm font-semibold text-stone-500">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Modal Crear / Editar ───────────────────────────────────────────────────
function IngredienteModal({ open, onClose, ingrediente, restaurantes }) {
  const editando = !!ingrediente;

  const INIT = {
    nombre: "",
    unidadMedida: "und",
    descripcion: "",
    restauranteId: "",
  };

  const [form, setForm] = useState(
    ingrediente
      ? {
          nombre: ingrediente.nombre ?? "",
          unidadMedida: ingrediente.unidadMedida ?? "und",
          descripcion: ingrediente.descripcion ?? "",
          restauranteId: ingrediente.restauranteId ?? "",
        }
      : { ...INIT },
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [crear, { loading: lc }] = useMutation(CREAR_INGREDIENTE, {
    refetchQueries: ["GetIngredientes"],
  });
  const [actualizar, { loading: la }] = useMutation(ACTUALIZAR_INGREDIENTE, {
    refetchQueries: ["GetIngredientes"],
  });
  const loading = lc || la;

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    try {
      let res;
      if (editando) {
        const { data } = await actualizar({
          variables: {
            id: ingrediente.id,
            nombre: form.nombre.trim(),
            descripcion: form.descripcion || null,
          },
        });
        res = data?.actualizarIngrediente;
      } else {
        const { data } = await crear({
          variables: {
            nombre: form.nombre.trim(),
            unidadMedida: form.unidadMedida,
            descripcion: form.descripcion || null,
            restauranteId: form.restauranteId || null,
          },
        });
        res = data?.crearIngrediente;
      }
      if (!res?.ok) throw new Error(res?.error ?? "Error desconocido");
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: editando ? "Ingrediente actualizado" : "Ingrediente creado",
        timer: 1500,
        timerProgressBar: true,
        confirmButtonColor: A[900],
      });
      onClose();
    } catch (err) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: err.message,
        confirmButtonColor: A[900],
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? "Editar ingrediente" : "Nuevo ingrediente"}
      size="sm"
    >
      <div className="space-y-4">
        <Field label="Nombre" required>
          <input
            className={icls}
            onFocus={fi}
            onBlur={fb}
            value={form.nombre}
            onChange={set("nombre")}
            placeholder="Ej: Carne Angus"
          />
        </Field>

        <Field
          label={editando ? "Unidad de medida (inmutable)" : "Unidad de medida"}
        >
          <select
            className={
              icls +
              " appearance-none cursor-pointer" +
              (editando ? " opacity-60 cursor-not-allowed" : "")
            }
            onFocus={editando ? undefined : fi}
            onBlur={editando ? undefined : fb}
            value={form.unidadMedida}
            onChange={set("unidadMedida")}
            disabled={editando}
          >
            {UNIDADES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
          {editando && (
            <p className="text-[10px] text-stone-400 font-dm">
              La unidad no se puede cambiar una vez creado el ingrediente.
            </p>
          )}
        </Field>

        {!editando && (
          <Field label="Restaurante (dejar vacío = global)">
            <select
              className={icls + " appearance-none cursor-pointer"}
              onFocus={fi}
              onBlur={fb}
              value={form.restauranteId}
              onChange={set("restauranteId")}
            >
              <option value="">🌐 Global — toda la cadena</option>
              {restaurantes.map((r) => (
                <option key={r.id} value={r.id}>
                  🏪 {r.nombre} ({r.ciudad})
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Descripción (opcional)">
          <input
            className={icls}
            onFocus={fi}
            onBlur={fb}
            value={form.descripcion}
            onChange={set("descripcion")}
            placeholder="Descripción breve..."
          />
        </Field>

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
            disabled={!form.nombre.trim()}
            onClick={handleSave}
          >
            {editando ? "Guardar" : "Crear ingrediente"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Tarjeta ────────────────────────────────────────────────────────────────
function IngredienteCard({ ing, onEdit, onToggle, toggling, restaurantesMap }) {
  const esGlobal = !ing.restauranteId;
  const restaurante = ing.restauranteId
    ? restaurantesMap[ing.restauranteId]
    : null;

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 hover:-translate-y-0.5 transition-all duration-200"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: A.accentLight }}
          >
            <FlaskConical size={15} style={{ color: A.accent }} />
          </div>
          <div className="min-w-0">
            <p className="font-dm text-stone-900 font-semibold text-sm truncate">
              {ing.nombre}
            </p>
            <p className="text-[10px] font-dm text-stone-400 mt-0.5">
              {UNIDADES_LABEL[ing.unidadMedida] ?? ing.unidadMedida}
            </p>
          </div>
        </div>
        <Badge variant={ing.activo ? "green" : "default"} size="xs">
          {ing.activo ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
          {ing.activo ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      {ing.descripcion && (
        <p className="text-[11px] font-dm text-stone-400 line-clamp-2">
          {ing.descripcion}
        </p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-stone-100">
        <span
          className="inline-flex items-center gap-1 text-[10px] font-dm font-semibold px-2 py-1 rounded-full"
          style={
            esGlobal
              ? { background: "#eff6ff", color: "#3b82f6" }
              : { background: "#f0fdf4", color: "#16a34a" }
          }
        >
          {esGlobal ? (
            <>
              <Globe size={9} /> Global
            </>
          ) : (
            <>
              <Building2 size={9} /> {restaurante?.nombre ?? "Restaurante"}
            </>
          )}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(ing)}
            className="w-7 h-7 rounded-lg bg-stone-50 hover:bg-stone-100 flex items-center justify-center transition-colors"
          >
            <Pencil size={11} className="text-stone-500" />
          </button>
          <button
            onClick={() => onToggle(ing)}
            disabled={toggling === ing.id}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${
              ing.activo
                ? "bg-red-50 hover:bg-red-100"
                : "bg-stone-50 hover:bg-stone-100"
            }`}
          >
            {toggling === ing.id ? (
              <Loader2 size={11} className="animate-spin text-stone-400" />
            ) : ing.activo ? (
              <ToggleRight size={13} className="text-red-500" />
            ) : (
              <ToggleLeft size={13} className="text-stone-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function IngredientesList() {
  const [modal, setModal] = useState(null); // null | "nuevo" | ingrediente-obj
  const [search, setSearch] = useState("");
  const [filtroScope, setFiltroScope] = useState("all"); // all | global | restaurante
  const [filtroActivo, setFiltroActivo] = useState("all"); // all | activo | inactivo
  const [toggling, setToggling] = useState(null);

  const { data, loading } = useQuery(GET_INGREDIENTES, {
    fetchPolicy: "cache-and-network",
  });
  const { data: restData } = useQuery(GET_RESTAURANTES);

  const [activar] = useMutation(ACTIVAR_INGREDIENTE, {
    refetchQueries: ["GetIngredientes"],
  });
  const [desactivar] = useMutation(DESACTIVAR_INGREDIENTE, {
    refetchQueries: ["GetIngredientes"],
  });

  const ingredientes = data?.ingredientes ?? [];
  const restaurantes = restData?.restaurantes ?? [];
  const restaurantesMap = useMemo(() => {
    const m = {};
    restaurantes.forEach((r) => (m[r.id] = r));
    return m;
  }, [restaurantes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ingredientes.filter((i) => {
      if (q && !i.nombre.toLowerCase().includes(q)) return false;
      if (filtroScope === "global" && i.restauranteId) return false;
      if (filtroScope === "restaurante" && !i.restauranteId) return false;
      if (filtroActivo === "activo" && !i.activo) return false;
      if (filtroActivo === "inactivo" && i.activo) return false;
      return true;
    });
  }, [ingredientes, search, filtroScope, filtroActivo]);

  const globales = ingredientes.filter((i) => !i.restauranteId).length;
  const activos = ingredientes.filter((i) => i.activo).length;

  const handleToggle = async (ing) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      title: ing.activo ? "¿Desactivar ingrediente?" : "¿Activar ingrediente?",
      html: `<span style="font-family:'DM Sans';color:#78716c">Cambiarás el estado de <b>${ing.nombre}</b>.</span>`,
      icon: ing.activo ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: ing.activo ? "#ef4444" : A[900],
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: ing.activo ? "Desactivar" : "Activar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    setToggling(ing.id);
    try {
      const mutation = ing.activo ? desactivar : activar;
      const { data: res } = await mutation({ variables: { id: ing.id } });
      const result = ing.activo
        ? res?.desactivarIngrediente
        : res?.activarIngrediente;
      if (!result?.ok) throw new Error(result?.error ?? "Error");
    } catch (err) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: err.message,
        confirmButtonColor: A[900],
      });
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Menú"
        title="Ingredientes"
        description="Catálogo global — globales para toda la cadena o específicos por restaurante."
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-xs font-dm text-stone-500">
              <span>
                <span className="font-bold text-blue-600">{globales}</span>{" "}
                globales
              </span>
              <span className="text-stone-300">·</span>
              <span>
                <span className="font-bold" style={{ color: A.accent }}>
                  {activos}
                </span>{" "}
                activos
              </span>
            </div>
            <Button onClick={() => setModal("nuevo")}>
              <Plus size={14} /> Nuevo ingrediente
            </Button>
          </div>
        }
      />

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 transition-all"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          onFocusCapture={(e) =>
            (e.currentTarget.style.boxShadow = `0 0 0 2px ${A.accent}`)
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

        {/* Scope */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
          {[
            { v: "all", l: "Todos", n: ingredientes.length },
            { v: "global", l: "Globales", n: globales },
            {
              v: "restaurante",
              l: "Por restaurante",
              n: ingredientes.length - globales,
            },
          ].map(({ v, l, n }) => (
            <button
              key={v}
              onClick={() => setFiltroScope(v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
              style={
                filtroScope === v
                  ? { background: A[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              {l}
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={
                  filtroScope === v
                    ? { background: "rgba(255,255,255,0.18)", color: "#fff" }
                    : { background: "#f5f5f4", color: "#a8a29e" }
                }
              >
                {n}
              </span>
            </button>
          ))}
        </div>

        {/* Activo */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
          {[
            { v: "all", l: "Todos" },
            { v: "activo", l: "Activos" },
            { v: "inactivo", l: "Inactivos" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltroActivo(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
              style={
                filtroActivo === v
                  ? { background: A.accent, color: "#fff" }
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
          {filtered.length} ingrediente{filtered.length !== 1 ? "s" : ""}
          {search && ` — "${search}"`}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title={search ? "Sin resultados" : "Sin ingredientes"}
          description={
            search
              ? `No hay ingredientes que coincidan con "${search}".`
              : "Crea el primer ingrediente del catálogo."
          }
          action={
            !search && (
              <Button onClick={() => setModal("nuevo")}>
                <Plus size={14} /> Nuevo ingrediente
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((ing) => (
            <IngredienteCard
              key={ing.id}
              ing={ing}
              onEdit={setModal}
              onToggle={handleToggle}
              toggling={toggling}
              restaurantesMap={restaurantesMap}
            />
          ))}
        </div>
      )}

      <IngredienteModal
        key={modal === "nuevo" ? "nuevo" : modal?.id}
        open={!!modal}
        onClose={() => setModal(null)}
        ingrediente={modal === "nuevo" ? null : modal}
        restaurantes={restaurantes}
      />
    </div>
  );
}
