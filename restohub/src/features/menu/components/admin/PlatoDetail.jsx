// restohub/src/features/menu/components/PlatoDetail.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  ChevronRight,
  Package,
  Coins,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ImageOff,
  Clock,
  Tag,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_PLATO,
  GET_INGREDIENTES,
  GET_RESTAURANTES,
} from "../../graphql/queries";
import {
  ACTIVAR_PLATO,
  DESACTIVAR_PLATO,
  AGREGAR_INGREDIENTE_PLATO,
  QUITAR_INGREDIENTE_PLATO,
  CREATE_PRECIO,
  ACTIVAR_PRECIO,
  DESACTIVAR_PRECIO,
} from "../../graphql/mutations";
import {
  Badge,
  Button,
  Card,
  Modal,
  Skeleton,
} from "../../../../shared/components/ui";

// ── Formato precio ────────────────────────────────────────────────────────
const fmt = (v, moneda = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(v);

// ── IngredienteTag ─────────────────────────────────────────────────────────
function IngredienteTag({ ing, onQuitar, removing }) {
  return (
    <div className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-300 transition-all">
      <Package size={11} className="text-stone-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-dm text-stone-700 truncate">
          {ing.ingredienteNombre}
        </p>
        <p className="text-[10px] font-dm text-stone-400">
          {ing.cantidad} {ing.unidadMedida}
        </p>
      </div>
      <button
        onClick={() => onQuitar(ing)}
        disabled={removing === ing.ingredienteId}
        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all disabled:opacity-40"
      >
        {removing === ing.ingredienteId ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <Trash2 size={11} />
        )}
      </button>
    </div>
  );
}

// ── PrecioRow ──────────────────────────────────────────────────────────────
function PrecioRow({ precio, onToggle, toggling }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 transition-all">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-playfair text-stone-900 font-semibold">
          {fmt(precio.precio, precio.moneda)}
        </p>
        <p className="text-[10px] font-dm text-stone-400 mt-0.5">
          {precio.restauranteNombre} · desde{" "}
          {new Date(precio.fechaInicio).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <Badge variant={precio.estaVigente ? "amber" : "default"} size="xs">
        {precio.estaVigente ? "Vigente" : "No vigente"}
      </Badge>
      <Badge variant={precio.activo ? "green" : "red"} size="xs">
        {precio.activo ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
        {precio.activo ? "Activo" : "Inactivo"}
      </Badge>
      <button
        onClick={() => onToggle(precio)}
        disabled={toggling === precio.id}
        className="text-stone-300 hover:text-stone-600 transition disabled:opacity-40"
      >
        {toggling === precio.id ? (
          <Loader2 size={14} className="animate-spin" />
        ) : precio.activo ? (
          <ToggleRight size={16} className="text-emerald-500" />
        ) : (
          <ToggleLeft size={16} />
        )}
      </button>
    </div>
  );
}

// ── Modal agregar ingrediente ──────────────────────────────────────────────
function ModalIngrediente({ open, onClose, platoId, ingredientesActuales }) {
  const { data } = useQuery(GET_INGREDIENTES, { variables: { activo: true } });
  const [ingredienteId, setIngredienteId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [agregar, { loading }] = useMutation(AGREGAR_INGREDIENTE_PLATO, {
    refetchQueries: ["GetPlato"],
  });

  const disponibles = (data?.ingredientes ?? []).filter(
    (i) => !ingredientesActuales.some((a) => a.ingredienteId === i.id),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ingredienteId || !cantidad) return;
    const { data: res } = await agregar({
      variables: { platoId, ingredienteId, cantidad: parseFloat(cantidad) },
    });
    if (res.agregarIngredientePlato.ok) {
      onClose();
      setIngredienteId("");
      setCantidad("");
    } else {
      Swal.fire({
        background: "#ffffff",
        color: "#1C1917",
        icon: "error",
        title: "Error",
        text: res.agregarIngredientePlato.error,
        confirmButtonColor: "#F59E0B",
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar ingrediente" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-dm font-semibold tracking-widest uppercase text-stone-500">
            Ingrediente
          </label>
          <select
            value={ingredienteId}
            onChange={(e) => setIngredienteId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 outline-none appearance-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
          >
            <option value="">Selecciona un ingrediente</option>
            {disponibles.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre} ({i.unidadMedida})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-dm font-semibold tracking-widest uppercase text-stone-500">
            Cantidad
          </label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
            placeholder="Ej: 0.250"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" loading={loading} type="submit">
            Agregar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal crear precio ─────────────────────────────────────────────────────
function ModalPrecio({ open, onClose, platoId }) {
  const { data } = useQuery(GET_RESTAURANTES);
  const [form, setForm] = useState({
    restauranteId: "",
    precio: "",
    fechaInicio: "",
    fechaFin: "",
  });
  const [crear, { loading }] = useMutation(CREATE_PRECIO, {
    refetchQueries: ["GetPlato"],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: res } = await crear({
      variables: {
        platoId,
        restauranteId: form.restauranteId,
        precio: parseFloat(form.precio),
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin || null,
      },
    });
    if (res.crearPrecioPlato.ok) {
      onClose();
      setForm({ restauranteId: "", precio: "", fechaInicio: "", fechaFin: "" });
    } else {
      Swal.fire({
        background: "#ffffff",
        color: "#1C1917",
        icon: "error",
        title: "Error",
        text: res.crearPrecioPlato.error,
        confirmButtonColor: "#F59E0B",
      });
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all";
  const labelClass =
    "text-[10px] font-dm font-semibold tracking-widest uppercase text-stone-500";

  const field = (label, key, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        required={key !== "fechaFin"}
        className={inputClass}
      />
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Asignar precio" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className={labelClass}>Restaurante</label>
          <select
            value={form.restauranteId}
            onChange={(e) =>
              setForm({ ...form, restauranteId: e.target.value })
            }
            required
            className={inputClass + " appearance-none cursor-pointer"}
          >
            <option value="">Selecciona un restaurante</option>
            {(data?.restaurantes ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre} — {r.ciudad} ({r.moneda})
              </option>
            ))}
          </select>
        </div>
        {field("Precio", "precio", "number", "Ej: 25000")}
        {field("Fecha de inicio", "fechaInicio", "datetime-local")}
        {field("Fecha de fin (opcional)", "fechaFin", "datetime-local")}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" loading={loading} type="submit">
            Guardar precio
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function PlatoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modalIng, setModalIng] = useState(false);
  const [modalPrecio, setModalPrecio] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [removing, setRemoving] = useState(null);

  const { data, loading } = useQuery(GET_PLATO, { variables: { id } });
  const [activarPlato] = useMutation(ACTIVAR_PLATO, {
    refetchQueries: ["GetPlato"],
  });
  const [desactivarPlato] = useMutation(DESACTIVAR_PLATO, {
    refetchQueries: ["GetPlato"],
  });
  const [quitarIngrediente] = useMutation(QUITAR_INGREDIENTE_PLATO, {
    refetchQueries: ["GetPlato"],
  });
  const [activarPrecio] = useMutation(ACTIVAR_PRECIO, {
    refetchQueries: ["GetPlato"],
  });
  const [desactivarPrecio] = useMutation(DESACTIVAR_PRECIO, {
    refetchQueries: ["GetPlato"],
  });

  if (loading)
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-72" />
          <Skeleton className="h-72 lg:col-span-2" />
        </div>
      </div>
    );

  const plato = data?.plato;
  if (!plato)
    return <p className="font-dm text-stone-400 p-8">Plato no encontrado.</p>;

  const handleTogglePlato = async () => {
    const mutation = plato.activo ? desactivarPlato : activarPlato;
    await mutation({ variables: { id: plato.id } });
  };

  const handleQuitarIng = async (ing) => {
    const ok = await Swal.fire({
      background: "#ffffff",
      color: "#1C1917",
      title: `¿Quitar ${ing.ingredienteNombre}?`,
      text: "Esta acción publicará un evento a inventory_service.",
      icon: "warning",
      iconColor: "#F59E0B",
      showCancelButton: true,
      confirmButtonColor: "#F59E0B",
      cancelButtonColor: "#E7E5E4",
      confirmButtonText: "Sí, quitar",
    });
    if (!ok.isConfirmed) return;
    setRemoving(ing.ingredienteId);
    await quitarIngrediente({
      variables: { platoId: plato.id, ingredienteId: ing.ingredienteId },
    });
    setRemoving(null);
  };

  const handleTogglePrecio = async (precio) => {
    setToggling(precio.id);
    const mutation = precio.activo ? desactivarPrecio : activarPrecio;
    await mutation({ variables: { id: precio.id } });
    setToggling(null);
  };

  return (
    <div className="font-dm max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400">
        <button
          onClick={() => navigate("/menu/platos")}
          className="hover:text-stone-700 transition"
        >
          Platos
        </button>
        <ChevronRight size={12} className="text-stone-300" />
        <span className="text-stone-600 truncate max-w-[200px]">
          {plato.nombre}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Panel izquierdo — info del plato ── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white shadow-card overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-300" />

            {/* Imagen */}
            <div className="relative h-44 bg-stone-100 overflow-hidden">
              {plato.imagen ? (
                <img
                  src={plato.imagen}
                  alt={plato.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff size={28} className="text-stone-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent" />
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h1 className="font-playfair text-stone-900 font-bold text-xl leading-tight">
                  {plato.nombre}
                </h1>
                {plato.categoriaNombre && (
                  <Badge variant="muted" size="xs" className="mt-1.5">
                    <Tag size={9} />
                    {plato.categoriaNombre}
                  </Badge>
                )}
                <p className="text-stone-400 text-xs font-dm mt-2 leading-relaxed">
                  {plato.descripcion}
                </p>
              </div>

              <div className="h-px bg-stone-100" />

              <div className="flex items-center justify-between">
                <span className="text-xs font-dm text-stone-400">Estado</span>
                <Badge variant={plato.activo ? "green" : "red"} size="xs">
                  {plato.activo ? (
                    <CheckCircle2 size={9} />
                  ) : (
                    <XCircle size={9} />
                  )}
                  {plato.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-stone-400 text-[10px] font-dm">
                <Clock size={10} />
                Creado{" "}
                {plato.fechaCreacion
                  ? new Date(plato.fechaCreacion).toLocaleDateString("es-CO")
                  : "—"}
              </div>

              <Button
                variant={plato.activo ? "danger" : "outline"}
                size="sm"
                className="w-full"
                onClick={handleTogglePlato}
              >
                {plato.activo ? (
                  <>
                    <ToggleLeft size={13} />
                    Desactivar plato
                  </>
                ) : (
                  <>
                    <ToggleRight size={13} />
                    Activar plato
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Panel derecho — ingredientes + precios ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Ingredientes */}
          <div className="rounded-2xl border border-stone-200 bg-white shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-3 h-px bg-amber-500" />
                  <span className="text-[9px] font-dm font-semibold tracking-[0.2em] uppercase text-amber-600">
                    Receta
                  </span>
                </div>
                <h2 className="font-playfair text-stone-900 font-semibold">
                  Ingredientes
                  <span className="text-stone-400 text-sm font-dm ml-2">
                    ({plato.ingredientes?.length ?? 0})
                  </span>
                </h2>
              </div>
              <Button size="sm" onClick={() => setModalIng(true)}>
                <Plus size={13} />
                Agregar
              </Button>
            </div>

            <div className="p-4">
              {plato.ingredientes?.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={20} className="text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-400 text-xs font-dm">
                    Sin ingredientes asignados
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plato.ingredientes?.map((ing) => (
                    <IngredienteTag
                      key={ing.id}
                      ing={ing}
                      onQuitar={handleQuitarIng}
                      removing={removing}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Precios */}
          <div className="rounded-2xl border border-stone-200 bg-white shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-3 h-px bg-amber-500" />
                  <span className="text-[9px] font-dm font-semibold tracking-[0.2em] uppercase text-amber-600">
                    Pricing
                  </span>
                </div>
                <h2 className="font-playfair text-stone-900 font-semibold">
                  Precios por restaurante
                  <span className="text-stone-400 text-sm font-dm ml-2">
                    ({plato.precios?.length ?? 0})
                  </span>
                </h2>
              </div>
              <Button size="sm" onClick={() => setModalPrecio(true)}>
                <Plus size={13} />
                Asignar precio
              </Button>
            </div>
            <div className="p-4 space-y-2">
              {plato.precios?.length === 0 ? (
                <div className="text-center py-8">
                  <Coins size={20} className="text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-400 text-xs font-dm">
                    Sin precios asignados
                  </p>
                </div>
              ) : (
                plato.precios?.map((p) => (
                  <PrecioRow
                    key={p.id}
                    precio={p}
                    onToggle={handleTogglePrecio}
                    toggling={toggling}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ModalIngrediente
        open={modalIng}
        onClose={() => setModalIng(false)}
        platoId={id}
        ingredientesActuales={plato.ingredientes ?? []}
      />
      <ModalPrecio
        open={modalPrecio}
        onClose={() => setModalPrecio(false)}
        platoId={id}
      />
    </div>
  );
}
