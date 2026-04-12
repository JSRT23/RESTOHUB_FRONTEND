// src/features/menu/components/Gerente/menu/GIngredientesList.jsx
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  FlaskConical,
  Plus,
  Search,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_INGREDIENTES_GERENTE,
  CREAR_INGREDIENTE,
  ACTUALIZAR_INGREDIENTE,
  ACTIVAR_INGREDIENTE,
  DESACTIVAR_INGREDIENTE,
} from "../graphql/operations";
import {
  PageHeader,
  Button,
  Skeleton,
  EmptyState,
} from "../../../../../shared/components/ui";
import { useAuth } from "../../../../../app/auth/AuthContext";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};
const UNIDADES = [
  { value: "kg", label: "Kilogramo (kg)" },
  { value: "g", label: "Gramo (g)" },
  { value: "l", label: "Litro (l)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "und", label: "Unidad (und)" },
  { value: "por", label: "Porción (por)" },
];
const fi = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
};
const fb = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};
const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all shadow-sm";

function IngredienteModal({ ingrediente, onClose, onSaved, restauranteId }) {
  const editando = !!ingrediente;
  const [form, setForm] = useState({
    nombre: ingrediente?.nombre || "",
    unidadMedida: ingrediente?.unidadMedida || "und",
    descripcion: ingrediente?.descripcion || "",
  });
  const [crear, { loading: lc }] = useMutation(CREAR_INGREDIENTE, {
    refetchQueries: ["GetIngredientesGerente"],
  });
  const [actualizar, { loading: la }] = useMutation(ACTUALIZAR_INGREDIENTE, {
    refetchQueries: ["GetIngredientesGerente"],
  });
  const loading = lc || la;

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Nombre requerido",
        confirmButtonColor: G[900],
      });
      return;
    }
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
      // CRÍTICO: pasa restauranteId para que el ingrediente quede asociado a este restaurante
      const { data } = await crear({
        variables: {
          nombre: form.nombre.trim(),
          unidadMedida: form.unidadMedida,
          descripcion: form.descripcion || null,
          restauranteId,
        },
      });
      res = data?.crearIngrediente;
    }
    if (!res?.ok) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: res?.error,
        confirmButtonColor: G[900],
      });
      return;
    }
    Swal.fire({
      background: "#fff",
      icon: "success",
      draggable: true,
      title: editando ? "¡Ingrediente actualizado!" : "¡Ingrediente creado!",
      html: `<span style="font-family:'DM Sans';color:#78716c"><b>${form.nombre}</b> ${editando ? "fue actualizado" : "fue creado"}.</span>`,
      confirmButtonColor: G[900],
      timer: 1800,
      timerProgressBar: true,
    });
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1" style={{ background: G[900] }} />
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: G[50] }}
          >
            <FlaskConical size={14} style={{ color: G[300] }} />
          </div>
          <h2
            className="font-semibold text-stone-900 text-lg flex-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {editando ? "Editar ingrediente" : "Nuevo ingrediente"}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400 transition"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Carne Angus, Tomate..."
              autoFocus
              className={inputCls}
              onFocus={fi}
              onBlur={fb}
            />
          </div>
          {!editando && (
            <div className="space-y-1.5">
              <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
                Unidad de medida <span className="text-red-400">*</span>
              </label>
              <select
                value={form.unidadMedida}
                onChange={(e) =>
                  setForm({ ...form, unidadMedida: e.target.value })
                }
                className={`${inputCls} appearance-none cursor-pointer`}
                onFocus={fi}
                onBlur={fb}
              >
                {UNIDADES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-dm text-stone-400 pl-1">
                ⚠ No podrás cambiar la unidad después de crear.
              </p>
            </div>
          )}
          {editando && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200">
              <FlaskConical size={12} className="text-stone-400 shrink-0" />
              <div>
                <p className="text-[10px] font-dm text-stone-400">
                  Unidad de medida
                </p>
                <p className="text-sm font-dm font-semibold text-stone-700">
                  {ingrediente.unidadMedida}
                </p>
              </div>
              <span className="ml-auto text-[9px] font-dm text-stone-300 italic">
                No editable
              </span>
            </div>
          )}
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
              rows={2}
              placeholder="Descripción breve..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all resize-none shadow-sm"
              onFocus={fi}
              onBlur={fb}
            />
          </div>
        </div>
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
            {editando ? "Guardar cambios" : "Crear ingrediente"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IngredienteRow({ ing, onEdit, onToggle, toggling }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50/60 transition-colors group">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: ing.activo ? G[50] : "#f3f4f6" }}
      >
        <FlaskConical
          size={14}
          style={{ color: ing.activo ? G[300] : "#9ca3af" }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-dm font-semibold text-stone-800 truncate">
            {ing.nombre}
          </p>
          <span className="text-[10px] font-dm text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-md shrink-0">
            {ing.unidadMedida}
          </span>
        </div>
        {ing.descripcion && (
          <p className="text-[11px] font-dm text-stone-400 mt-0.5 truncate">
            {ing.descripcion}
          </p>
        )}
      </div>
      <span
        className="text-[10px] font-dm font-bold px-3 py-1.5 rounded-full tracking-wide shrink-0"
        style={
          ing.activo
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
      >
        {ing.activo ? "ACTIVO" : "INACTIVO"}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onEdit(ing)}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 bg-white border border-stone-200 hover:border-stone-300 hover:text-stone-700 transition-all shadow-sm"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => onToggle(ing)}
          disabled={toggling === ing.id}
          className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all shadow-sm disabled:opacity-50"
          style={
            ing.activo
              ? {
                  background: "#fef2f2",
                  color: "#dc2626",
                  borderColor: "#fecaca",
                }
              : { background: G[50], color: G[300], borderColor: G[100] }
          }
        >
          {toggling === ing.id ? (
            <Loader2 size={12} className="animate-spin" />
          ) : ing.activo ? (
            <ToggleRight size={13} />
          ) : (
            <ToggleLeft size={13} />
          )}
        </button>
      </div>
    </div>
  );
}

export default function GIngredientesList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [modal, setModal] = useState(null);
  const [toggling, setToggling] = useState(null);

  // CRÍTICO: pasa restauranteId para ver solo ingredientes de este restaurante
  const { data, loading, refetch } = useQuery(GET_INGREDIENTES_GERENTE, {
    variables: { restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });
  const [activar] = useMutation(ACTIVAR_INGREDIENTE, {
    refetchQueries: ["GetIngredientesGerente"],
  });
  const [desactivar] = useMutation(DESACTIVAR_INGREDIENTE, {
    refetchQueries: ["GetIngredientesGerente"],
  });

  const todos = data?.ingredientes ?? [];
  const activos = todos.filter((i) => i.activo).length;
  const inactivos = todos.filter((i) => !i.activo).length;
  const filtered = todos
    .filter((i) => {
      const q = search.toLowerCase();
      const matchQ =
        !q ||
        i.nombre.toLowerCase().includes(q) ||
        (i.descripcion || "").toLowerCase().includes(q);
      const matchF =
        filtro === "todos" ? true : filtro === "activos" ? i.activo : !i.activo;
      return matchQ && matchF;
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const handleToggle = async (ing) => {
    if (ing.activo) {
      const c = await Swal.fire({
        background: "#fff",
        icon: "warning",
        draggable: true,
        title: "¿Desactivar ingrediente?",
        html: `<span style="font-family:'DM Sans';color:#78716c">Los platos que usan <b>${ing.nombre}</b> quedarán sin este ingrediente.</span>`,
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#e2e8f0",
        confirmButtonText: "Sí, desactivar",
      });
      if (!c.isConfirmed) return;
    }
    setToggling(ing.id);
    try {
      if (ing.activo) {
        const { data: d } = await desactivar({ variables: { id: ing.id } });
        if (!d?.desactivarIngrediente?.ok)
          throw new Error(d?.desactivarIngrediente?.error);
      } else {
        const { data: d } = await activar({ variables: { id: ing.id } });
        if (!d?.activarIngrediente?.ok)
          throw new Error(d?.activarIngrediente?.error);
      }
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    }
    await refetch();
    setToggling(null);
  };

  const fi = (e) => {
    e.target.style.borderColor = "transparent";
    e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
  };
  const fb = (e) => {
    e.target.style.borderColor = "#e2e8f0";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gerente · Menú"
        title="Ingredientes"
        description="Ingredientes de tu restaurante. La unidad de medida no se puede cambiar tras crearlo."
        action={
          <Button onClick={() => setModal("nuevo")} variant="primary" size="md">
            <Plus size={15} /> Nuevo ingrediente
          </Button>
        }
      />

      {!loading && todos.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { n: todos.length, l: "en total", s: {} },
            {
              n: activos,
              l: "activos",
              s: { background: `${G[50]}99`, borderColor: G[100] },
            },
            ...(inactivos > 0 ? [{ n: inactivos, l: "inactivos", s: {} }] : []),
          ].map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-4 py-2.5 shadow-sm"
              style={s.s}
            >
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: s.s.borderColor ? G[500] : "#1c1917",
                }}
              >
                {s.n}
              </span>
              <span
                className="text-xs font-dm"
                style={{ color: s.s.borderColor ? G[300] : "#9ca3af" }}
              >
                {s.l}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ingrediente..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-700 placeholder:text-stone-300 outline-none shadow-sm transition-all"
            onFocus={fi}
            onBlur={fb}
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
          {["todos", "activos", "inactivos"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={filtro === f ? { background: G[900], color: "white" } : {}}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-dm font-semibold capitalize transition-all ${filtro === f ? "" : "text-stone-500 hover:bg-stone-50"}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 px-5 py-4 ${i < 4 ? "border-b border-stone-100" : ""}`}
            >
              <div className="w-9 h-9 rounded-xl bg-stone-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-stone-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title={search ? "Sin resultados" : "Sin ingredientes"}
          description={
            search
              ? `No hay coincidencias con "${search}"`
              : "Crea el primer ingrediente de tu restaurante"
          }
          action={
            !search && (
              <Button
                onClick={() => setModal("nuevo")}
                variant="primary"
                size="sm"
              >
                <Plus size={13} /> Nuevo ingrediente
              </Button>
            )
          }
        />
      ) : (
        <div
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center gap-4 px-5 py-3 border-b border-stone-100 bg-stone-50/50">
            <div className="w-9 shrink-0" />
            <p className="flex-1 text-[10px] font-dm font-bold text-stone-400 uppercase tracking-wider">
              Ingrediente
            </p>
            <p className="text-[10px] font-dm font-bold text-stone-400 uppercase tracking-wider w-24 text-center shrink-0">
              Estado
            </p>
            <p className="text-[10px] font-dm font-bold text-stone-400 uppercase tracking-wider w-20 text-right shrink-0">
              Acciones
            </p>
          </div>
          {filtered.map((ing, i) => (
            <div
              key={ing.id}
              className={
                i < filtered.length - 1 ? "border-b border-stone-100" : ""
              }
            >
              <IngredienteRow
                ing={ing}
                toggling={toggling}
                onToggle={handleToggle}
                onEdit={(i) => setModal(i)}
              />
            </div>
          ))}
          <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/50">
            <p className="text-xs font-dm text-stone-400">
              {filtered.length} ingrediente{filtered.length !== 1 ? "s" : ""}
              {filtro !== "todos" ? ` ${filtro}` : ""}
              {search ? ` · "${search}"` : ""}
            </p>
          </div>
        </div>
      )}

      {modal && (
        <IngredienteModal
          ingrediente={modal === "nuevo" ? null : modal}
          restauranteId={restauranteId}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
