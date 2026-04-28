// src/features/menu/components/Gerente/platos/detail/PlatoPrecios.jsx
// CAMBIOS vs original:
// 1. Form de nuevo precio usa WizardStepPrecio → tiene modo manual Y modo margen
// 2. El formulario inline se reemplaza por WizardStepPrecio cuando showForm=true
// La lógica de crear/desactivar precios (handleCrear) queda igual.

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { CheckCircle2, XCircle, Plus, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

import { Divider } from "../../../../../../shared/components/ui";
import {
  CREAR_PRECIO_PLATO,
  ACTIVAR_PRECIO,
  DESACTIVAR_PRECIO,
} from "../../graphql/operations";
import { G, fmt, inputCls, fi, fb } from "../platoUtils";
import WizardStepPrecio from "../wizard/WizardStepPrecio";

const hoyLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const buildFechaInicio = (fechaDate) => {
  const hoy = hoyLocal();
  if (!fechaDate || fechaDate === hoy) {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + 1);
    const pad = (n) => String(n).padStart(2, "0");
    return (
      `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}` +
      `T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:00`
    );
  }
  return `${fechaDate}T12:00:00`;
};

export default function PlatoPrecios({
  platoId,
  restauranteId,
  precios,
  moneda,
}) {
  const [showForm, setShowForm] = useState(false);
  // precioForm compatible con WizardStepPrecio: { valor, fechaInicio }
  const [precioForm, setPrecioForm] = useState({
    valor: "",
    fechaInicio: hoyLocal(),
  });
  const [toggling, setToggling] = useState(null);
  const [saving, setSaving] = useState(false);

  // Resetear form cada vez que se abre
  useEffect(() => {
    if (showForm) {
      setPrecioForm({ valor: "", fechaInicio: hoyLocal() });
    }
  }, [showForm]);

  const [crearPrecio] = useMutation(CREAR_PRECIO_PLATO, {
    refetchQueries: ["GetPlatoDetalle", "GetPlatosGerente"],
  });
  const [activarPrecio] = useMutation(ACTIVAR_PRECIO, {
    refetchQueries: ["GetPlatoDetalle", "GetPlatosGerente"],
  });
  const [desactivarPrecio] = useMutation(DESACTIVAR_PRECIO);

  const handleCrear = async () => {
    if (!precioForm.valor || !precioForm.fechaInicio) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Precio y fecha son requeridos",
        confirmButtonColor: G[900],
      });
      return;
    }
    setSaving(true);
    try {
      // 1. Desactivar precios activos actuales
      const preciosActivos = precios.filter((p) => p.activo);
      if (preciosActivos.length > 0) {
        await Promise.all(
          preciosActivos.map((p) =>
            desactivarPrecio({ variables: { id: p.id } }),
          ),
        );
      }
      // 2. Crear nuevo precio
      const { data } = await crearPrecio({
        variables: {
          platoId,
          restauranteId,
          precio: parseFloat(precioForm.valor),
          fechaInicio: buildFechaInicio(precioForm.fechaInicio),
        },
      });
      if (!data?.crearPrecioPlato?.ok) {
        throw new Error(data?.crearPrecioPlato?.error || "Error desconocido");
      }
      setShowForm(false);
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error al guardar precio",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p) => {
    setToggling(p.id);
    try {
      const mutation = p.activo ? desactivarPrecio : activarPrecio;
      await mutation({ variables: { id: p.id } });
    } finally {
      setToggling(null);
    }
  };

  const nActivos = precios.filter((p) => p.activo).length;

  return (
    <>
      <Divider label="Precios" />
      <div className="space-y-2">
        {precios.length === 0 && !showForm && (
          <p className="text-xs font-dm text-stone-400 italic text-center py-2">
            Sin precios asignados
          </p>
        )}

        {/* Lista de precios existentes */}
        {precios.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-all"
            style={
              p.estaVigente && p.activo
                ? { borderColor: G[100], background: `${G[50]}55` }
                : {}
            }
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-bold"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: p.estaVigente && p.activo ? G[500] : "#9ca3af",
                }}
              >
                {fmt(p.precio, p.moneda || moneda)}
              </p>
              <p className="text-[10px] font-dm text-stone-400">
                desde{" "}
                {new Date(p.fechaInicio).toLocaleDateString("es-CO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                {p.fechaFin && (
                  <>
                    {" "}
                    · hasta {new Date(p.fechaFin).toLocaleDateString("es-CO")}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {p.estaVigente && p.activo && (
                <span
                  className="text-[9px] font-dm font-bold px-2 py-1 rounded-full"
                  style={{ background: G[50], color: G[300] }}
                >
                  Vigente
                </span>
              )}
              <button
                onClick={() => handleToggle(p)}
                disabled={toggling === p.id}
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                style={
                  p.activo
                    ? { background: "#fef2f2", color: "#dc2626" }
                    : { background: G[50], color: G[300] }
                }
              >
                {toggling === p.id ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : p.activo ? (
                  <XCircle size={10} />
                ) : (
                  <CheckCircle2 size={10} />
                )}
              </button>
            </div>
          </div>
        ))}

        {/* Form nuevo precio — usa WizardStepPrecio con modo margen */}
        {showForm ? (
          <div
            className="rounded-2xl border border-stone-200 bg-white p-4 space-y-4"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            {nActivos > 0 && (
              <div
                className="flex items-start gap-2 px-3 py-2 rounded-xl text-[10px] font-dm"
                style={{
                  background: `${G[50]}cc`,
                  border: `1px solid ${G[100]}`,
                  color: G[500],
                }}
              >
                <span className="shrink-0 mt-0.5">ℹ️</span>
                <span>
                  El precio vigente actual se desactivará automáticamente al
                  guardar el nuevo.
                </span>
              </div>
            )}

            {/* WizardStepPrecio — incluye modo manual y modo margen con costo de producción */}
            <WizardStepPrecio
              precio={precioForm}
              setPrecio={setPrecioForm}
              moneda={moneda}
              platoId={platoId}
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-xs font-dm text-stone-500 hover:text-stone-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrear}
                disabled={saving || !precioForm.valor}
                style={{ background: G[900] }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-dm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {saving && <Loader2 size={10} className="animate-spin" />}
                {nActivos > 0 ? "Reemplazar precio" : "Guardar precio"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-2 rounded-xl border border-dashed border-stone-300 text-xs font-dm text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus size={12} />
            {nActivos > 0 ? "Actualizar precio" : "Asignar nuevo precio"}
          </button>
        )}
      </div>
    </>
  );
}
