// src/features/menu/components/admin/CreatePlato.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client/react";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  ArrowRight,
  UtensilsCrossed,
  Tag,
  Link as LinkIcon,
  CheckCircle2,
  Plus,
  Trash2,
  Package,
  FlaskConical,
  Globe,
  Building2,
} from "lucide-react";
import { CREAR_PLATO, AGREGAR_INGREDIENTE_PLATO } from "./graphql/mutations";
import { GET_INGREDIENTES } from "./graphql/queries";
import { GET_CATEGORIAS } from "./graphql/categorias.operations";
import { GET_RESTAURANTES } from "./graphql/operations";
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  StepIndicator,
  Divider,
  Badge,
} from "../../../../shared/components/ui";

const STEPS = ["Info básica", "Ingredientes", "Confirmar"];

const UNIDADES = [
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "g", label: "Gramos (g)" },
  { value: "l", label: "Litros (l)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "und", label: "Unidades (und)" },
  { value: "por", label: "Porciones (por)" },
];

// ── PASO 1: Info básica ────────────────────────────────────────────────────
function Step1({ form, setForm, categorias, restaurantes }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-playfair text-stone-900 text-xl font-bold">
          Información del plato
        </h2>
        <p className="text-stone-400 text-sm mt-1 font-dm">
          Define el nombre, descripción, categoría y alcance del plato.
        </p>
      </div>

      <Input
        label="Nombre del plato"
        icon={UtensilsCrossed}
        value={form.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        placeholder="Ej: Hamburguesa Angus doble"
        required
      />

      <Textarea
        label="Descripción"
        icon={UtensilsCrossed}
        value={form.descripcion}
        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        placeholder="Describe el plato: presentación, sabor, acompañamientos..."
        rows={4}
        required
      />

      <Select
        label="Categoría"
        icon={Tag}
        value={form.categoriaId}
        onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
      >
        <option value="">Sin categoría</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </Select>

      {/* Restaurante — null = global */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-dm font-semibold tracking-widest uppercase text-stone-500">
          Alcance
        </label>
        <select
          value={form.restauranteId}
          onChange={(e) => setForm({ ...form, restauranteId: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 outline-none appearance-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
        >
          <option value="">🌐 Global — toda la cadena</option>
          {restaurantes.map((r) => (
            <option key={r.id} value={r.id}>
              🏪 {r.nombre} — {r.ciudad}
            </option>
          ))}
        </select>
        <p className="text-[10px] font-dm text-stone-400">
          Dejar vacío para que el plato sea visible en todos los restaurantes.
        </p>
      </div>

      <Input
        label="URL de imagen (opcional)"
        icon={LinkIcon}
        value={form.imagen}
        onChange={(e) => setForm({ ...form, imagen: e.target.value })}
        placeholder="https://ejemplo.com/imagen.jpg"
        hint="Pega una URL de imagen para mostrar en el menú"
      />
    </div>
  );
}

// ── PASO 2: Ingredientes ───────────────────────────────────────────────────
function Step2({
  ingredientesSeleccionados,
  setIngredientesSeleccionados,
  ingredientesCatalogo,
}) {
  const [ingredienteId, setIngredienteId] = useState("");
  const [cantidad, setCantidad] = useState("");

  const disponibles = ingredientesCatalogo.filter(
    (i) => !ingredientesSeleccionados.some((s) => s.ingredienteId === i.id),
  );
  const ingredienteActual = ingredientesCatalogo.find(
    (i) => i.id === ingredienteId,
  );

  const agregar = () => {
    if (!ingredienteId || !cantidad || parseFloat(cantidad) <= 0) return;
    setIngredientesSeleccionados([
      ...ingredientesSeleccionados,
      {
        ingredienteId,
        nombre: ingredienteActual?.nombre ?? "",
        unidadMedida: ingredienteActual?.unidadMedida ?? "",
        cantidad: parseFloat(cantidad),
      },
    ]);
    setIngredienteId("");
    setCantidad("");
  };

  const quitar = (id) =>
    setIngredientesSeleccionados(
      ingredientesSeleccionados.filter((i) => i.ingredienteId !== id),
    );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-playfair text-stone-900 text-xl font-bold">
          Ingredientes de la receta
        </h2>
        <p className="text-stone-400 text-sm mt-1 font-dm">
          Agrega los ingredientes del plato. Puedes saltarte este paso y
          agregarlos después.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3">
        <p className="text-xs font-dm font-semibold text-stone-600 uppercase tracking-wider">
          Agregar ingrediente
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-3 items-end">
          <Select
            label="Ingrediente"
            icon={FlaskConical}
            value={ingredienteId}
            onChange={(e) => setIngredienteId(e.target.value)}
          >
            <option value="">Selecciona un ingrediente...</option>
            {disponibles.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre} ({i.unidadMedida})
              </option>
            ))}
          </Select>
          <Input
            label="Cantidad"
            icon={Package}
            type="number"
            step="0.001"
            min="0.001"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="0.250"
          />
          <Button
            onClick={agregar}
            disabled={!ingredienteId || !cantidad}
            className="self-end"
          >
            <Plus size={14} />
            Agregar
          </Button>
        </div>
      </div>

      {ingredientesSeleccionados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed border-stone-200">
          <Package size={24} className="text-stone-200 mb-2" />
          <p className="text-stone-400 text-sm font-dm">
            Sin ingredientes agregados aún
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
            Receta ({ingredientesSeleccionados.length} ingrediente
            {ingredientesSeleccionados.length !== 1 ? "s" : ""})
          </p>
          {ingredientesSeleccionados.map((ing) => (
            <div
              key={ing.ingredienteId}
              className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-stone-200 shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <FlaskConical size={13} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-dm font-semibold text-stone-800 truncate">
                  {ing.nombre}
                </p>
                <p className="text-[11px] font-dm text-stone-400">
                  {ing.cantidad} {ing.unidadMedida}
                </p>
              </div>
              <Badge variant="amber" size="xs">
                {ing.cantidad} {ing.unidadMedida}
              </Badge>
              <button
                onClick={() => quitar(ing.ingredienteId)}
                className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-all shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PASO 3: Confirmación ───────────────────────────────────────────────────
function Step3({ form, ingredientesSeleccionados, categorias, restaurantes }) {
  const categoria = categorias.find((c) => c.id === form.categoriaId);
  const restaurante = restaurantes.find((r) => r.id === form.restauranteId);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-playfair text-stone-900 text-xl font-bold">
          Confirmar plato
        </h2>
        <p className="text-stone-400 text-sm mt-1 font-dm">
          Revisa la información antes de crear.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
        {form.imagen && (
          <div className="h-40 overflow-hidden">
            <img
              src={form.imagen}
              alt={form.nombre}
              className="w-full h-full object-cover"
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>
        )}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-start gap-3 mb-2 flex-wrap">
              <div>
                <h3 className="font-playfair text-stone-900 text-xl font-bold">
                  {form.nombre || "—"}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {categoria && (
                    <Badge variant="amber" size="xs">
                      <Tag size={9} /> {categoria.nombre}
                    </Badge>
                  )}
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-dm font-semibold px-2 py-1 rounded-full"
                    style={
                      restaurante
                        ? { background: "#f0fdf4", color: "#16a34a" }
                        : { background: "#eff6ff", color: "#3b82f6" }
                    }
                  >
                    {restaurante ? (
                      <>
                        <Building2 size={9} /> {restaurante.nombre}
                      </>
                    ) : (
                      <>
                        <Globe size={9} /> Global
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm font-dm text-stone-500 leading-relaxed">
              {form.descripcion || "—"}
            </p>
          </div>

          <Divider label="Ingredientes" />

          {ingredientesSeleccionados.length === 0 ? (
            <p className="text-xs font-dm text-stone-400 italic">
              Sin ingredientes — podrás agregarlos después.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {ingredientesSeleccionados.map((ing) => (
                <div
                  key={ing.ingredienteId}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-stone-200"
                >
                  <FlaskConical size={11} className="text-amber-400 shrink-0" />
                  <span className="text-xs font-dm text-stone-700 truncate">
                    {ing.nombre}
                  </span>
                  <span className="text-[10px] font-dm text-stone-400 ml-auto shrink-0">
                    {ing.cantidad} {ing.unidadMedida}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
        <p className="text-sm font-dm text-emerald-700">
          Al crear, los eventos se publicarán a{" "}
          <strong>inventory_service</strong> vía RabbitMQ.
        </p>
      </div>
    </div>
  );
}

// ── Main wizard ────────────────────────────────────────────────────────────
export default function CreatePlato() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    categoriaId: "",
    imagen: "",
    restauranteId: "",
  });
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState(
    [],
  );
  const [creandoPlato, setCreandoPlato] = useState(false);

  const { data: catData } = useQuery(GET_CATEGORIAS, {
    variables: { activo: true },
  });
  const { data: ingData } = useQuery(GET_INGREDIENTES, {
    variables: { activo: true },
  });
  const { data: restData } = useQuery(GET_RESTAURANTES);

  // ✅ FIX: CREAR_PLATO, no CREATE_PLATO
  const [crearPlato] = useMutation(CREAR_PLATO, {
    refetchQueries: ["GetPlatos"],
  });
  const [agregarIngrediente] = useMutation(AGREGAR_INGREDIENTE_PLATO);

  const categorias = catData?.categorias ?? [];
  const ingredientesCatalogo = ingData?.ingredientes ?? [];
  const restaurantes = restData?.restaurantes ?? [];

  const canNext =
    step === 0 ? form.nombre.trim() && form.descripcion.trim() : true;

  const handleFinalizar = async () => {
    setCreandoPlato(true);
    try {
      const { data: res } = await crearPlato({
        variables: {
          nombre: form.nombre,
          descripcion: form.descripcion,
          categoriaId: form.categoriaId || null,
          imagen: form.imagen || null,
          restauranteId: form.restauranteId || null,
        },
      });

      if (!res.crearPlato.ok) throw new Error(res.crearPlato.error);
      const platoId = res.crearPlato.plato?.id;

      if (platoId && ingredientesSeleccionados.length > 0) {
        await Promise.all(
          ingredientesSeleccionados.map((ing) =>
            agregarIngrediente({
              variables: {
                platoId,
                ingredienteId: ing.ingredienteId,
                cantidad: ing.cantidad,
              },
            }),
          ),
        );
      }

      await Swal.fire({
        background: "#fff",
        icon: "success",
        iconColor: "#F59E0B",
        title: "¡Plato creado!",
        html: `<span style="font-family:'DM Sans',sans-serif;color:#78716c">${form.nombre} con ${ingredientesSeleccionados.length} ingrediente(s)</span>`,
        confirmButtonColor: "#F59E0B",
        confirmButtonText: "Ver platos",
      });

      navigate("/menu/platos");
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        iconColor: "#ef4444",
        title: "Error",
        text: e.message,
        confirmButtonColor: "#F59E0B",
      });
    } finally {
      setCreandoPlato(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/menu/platos")}
        className="flex items-center gap-2 text-stone-400 hover:text-stone-700 transition text-sm mb-6 group"
      >
        <ArrowLeft
          size={14}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        Volver a platos
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-0.5 bg-amber-500 rounded-full" />
          <span className="text-[10px] font-dm font-bold tracking-[0.18em] uppercase text-amber-600">
            Nuevo plato
          </span>
        </div>
        <h1 className="font-playfair text-3xl font-bold text-stone-900 mb-5">
          Crear plato
        </h1>
        <StepIndicator steps={STEPS} current={step} />
      </div>

      <Card accent className="mb-5">
        {step === 0 && (
          <Step1
            form={form}
            setForm={setForm}
            categorias={categorias}
            restaurantes={restaurantes}
          />
        )}
        {step === 1 && (
          <Step2
            ingredientesSeleccionados={ingredientesSeleccionados}
            setIngredientesSeleccionados={setIngredientesSeleccionados}
            ingredientesCatalogo={ingredientesCatalogo}
          />
        )}
        {step === 2 && (
          <Step3
            form={form}
            ingredientesSeleccionados={ingredientesSeleccionados}
            categorias={categorias}
            restaurantes={restaurantes}
          />
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() =>
            step === 0 ? navigate("/menu/platos") : setStep(step - 1)
          }
        >
          <ArrowLeft size={14} />
          {step === 0 ? "Cancelar" : "Atrás"}
        </Button>

        {step < 2 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
            Siguiente
            <ArrowRight size={14} />
          </Button>
        ) : (
          <Button onClick={handleFinalizar} loading={creandoPlato}>
            <CheckCircle2 size={14} />
            Crear plato
          </Button>
        )}
      </div>
    </div>
  );
}
