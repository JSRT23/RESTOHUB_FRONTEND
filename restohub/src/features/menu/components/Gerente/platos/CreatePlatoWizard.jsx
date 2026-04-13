// src/features/menu/components/Gerente/platos/CreatePlatoWizard.jsx

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { StepIndicator } from "../../../../../shared/components/ui";
import {
  GET_CATEGORIAS_GERENTE,
  GET_INGREDIENTES_DISPONIBLES,
  CREAR_PLATO,
  AGREGAR_INGREDIENTE_PLATO,
  CREAR_PRECIO_PLATO,
} from "../graphql/operations";
import WizardStepInfo from "./wizard/WizardStepInfo";
import WizardStepPrecio from "./wizard/WizardStepPrecio";
import WizardStepConfirmar from "./wizard/WizardStepConfirmar";
import { G, fmt } from "./platoUtils";

const STEPS = ["Info básica", "Precio", "Confirmar"];

// Devuelve "YYYY-MM-DD" de hoy en hora local
const hoyLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Construye el datetime ISO que se manda al backend:
// - Si la fecha elegida es hoy → now() + 2 minutos
// - Si es un día futuro        → YYYY-MM-DDT12:00:00
const buildFechaInicio = (fechaDate) => {
  const hoy = hoyLocal();
  if (!fechaDate || fechaDate === hoy) {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + 2);
    const pad = (n) => String(n).padStart(2, "0");
    return (
      `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}` +
      `T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:00`
    );
  }
  return `${fechaDate}T12:00:00`;
};

export default function CreatePlatoWizard({
  onClose,
  onCreado,
  restauranteId,
  moneda,
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    categoriaId: "",
    imagen: "",
  });
  const [ings, setIngs] = useState([]);
  // FIX: fecha pre-rellenada con hoy para que el wizard no rechace al confirmar
  const [precio, setPrecio] = useState({ valor: "", fechaInicio: hoyLocal() });
  const [creating, setCreating] = useState(false);

  const { data: cData } = useQuery(GET_CATEGORIAS_GERENTE, {
    variables: { activo: true },
  });

  const { data: iData } = useQuery(GET_INGREDIENTES_DISPONIBLES, {
    variables: { disponibles: restauranteId, activo: true },
    skip: !restauranteId,
  });

  const [crearPlato] = useMutation(CREAR_PLATO, {
    refetchQueries: ["GetPlatosGerente"],
  });
  const [agregarIng] = useMutation(AGREGAR_INGREDIENTE_PLATO);
  const [crearPrecio] = useMutation(CREAR_PRECIO_PLATO, {
    refetchQueries: ["GetPlatosGerente"],
  });

  const categorias = cData?.categorias ?? [];
  const ingredientes = iData?.ingredientes ?? [];
  const canNext0 = form.nombre.trim() && form.descripcion.trim();

  const handleFinalizar = async () => {
    setCreating(true);
    try {
      // 1. Crear el plato
      const { data: d1 } = await crearPlato({
        variables: {
          nombre: form.nombre,
          descripcion: form.descripcion,
          categoriaId: form.categoriaId || null,
          imagen: form.imagen || null,
          restauranteId,
        },
      });
      if (!d1.crearPlato.ok) throw new Error(d1.crearPlato.error);
      const platoId = d1.crearPlato.plato?.id;

      // 2. Agregar ingredientes en paralelo
      if (platoId && ings.length > 0) {
        await Promise.all(
          ings.map((i) =>
            agregarIng({
              variables: {
                platoId,
                ingredienteId: i.ingredienteId,
                cantidad: i.cantidad,
              },
            }),
          ),
        );
      }

      // 3. Crear precio con hora inteligente
      if (platoId && precio.valor && precio.fechaInicio) {
        const { data: d3 } = await crearPrecio({
          variables: {
            platoId,
            restauranteId,
            precio: parseFloat(precio.valor),
            fechaInicio: buildFechaInicio(precio.fechaInicio),
          },
        });
        if (!d3?.crearPrecioPlato?.ok) {
          console.warn("Precio no guardado:", d3?.crearPrecioPlato?.error);
        }
      }

      await Swal.fire({
        background: "#fff",
        icon: "success",
        draggable: true,
        title: "¡Plato creado!",
        html: `<span style="font-family:'DM Sans';color:#78716c"><b>${form.nombre}</b> — ${ings.length} ingrediente(s)${
          precio.valor && precio.fechaInicio
            ? ` · ${fmt(parseFloat(precio.valor), moneda)}`
            : " · Sin precio aún"
        }</span>`,
        confirmButtonColor: G[900],
        timer: 3000,
        timerProgressBar: true,
      });
      onCreado();
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error al crear el plato",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <StepIndicator steps={STEPS} current={step} />
      <div
        className="bg-white rounded-2xl border border-stone-200 p-6"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        {step === 0 && (
          <WizardStepInfo
            form={form}
            setForm={setForm}
            ings={ings}
            setIngs={setIngs}
            categorias={categorias}
            ingredientes={ingredientes}
          />
        )}
        {step === 1 && (
          <WizardStepPrecio
            precio={precio}
            setPrecio={setPrecio}
            moneda={moneda}
          />
        )}
        {step === 2 && (
          <WizardStepConfirmar
            form={form}
            ings={ings}
            precio={precio}
            categorias={categorias}
            moneda={moneda}
          />
        )}
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-dm font-semibold text-stone-500 bg-white border border-stone-200 hover:border-stone-300 transition-all"
        >
          <ArrowLeft size={14} />
          {step === 0 ? "Cancelar" : "Atrás"}
        </button>
        {step < 2 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && !canNext0}
            style={{ background: G[900] }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-dm font-bold text-white hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {step === 0 ? "Siguiente: Precio" : "Revisar y confirmar"}
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleFinalizar}
            disabled={creating}
            style={{ background: G[900] }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-dm font-bold text-white hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {creating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Crear plato
          </button>
        )}
      </div>
    </div>
  );
}
