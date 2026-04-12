// src/features/gerente/menu/platos/detail/PlatoPrecios.jsx
// Lista, crea y activa/desactiva precios de un plato.

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { CheckCircle2, XCircle, Plus, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

import { Divider } from "../../../../../../shared/components/ui";
import {
  CREAR_PRECIO_PLATO,
  ACTIVAR_PRECIO,
  DESACTIVAR_PRECIO,
} from "../../graphql/operations";
import { G, fmt, inputCls, fi, fb } from "../platoUtils";

export default function PlatoPrecios({
  platoId,
  restauranteId,
  precios,
  moneda,
}) {
  const [showForm, setShowForm] = useState(false);
  const [precioForm, setPrecioForm] = useState({ valor: "", fechaInicio: "" });
  const [toggling, setToggling] = useState(null);

  const [crearPrecio] = useMutation(CREAR_PRECIO_PLATO, {
    refetchQueries: ["GetPlatoDetalle", "GetPlatosGerente"],
  });
  const [activarPrecio] = useMutation(ACTIVAR_PRECIO, {
    refetchQueries: ["GetPlatoDetalle", "GetPlatosGerente"],
  });
  const [desactivarPrecio] = useMutation(DESACTIVAR_PRECIO, {
    refetchQueries: ["GetPlatoDetalle", "GetPlatosGerente"],
  });

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
    const { data } = await crearPrecio({
      variables: {
        platoId,
        restauranteId,
        precio: parseFloat(precioForm.valor),
        fechaInicio: precioForm.fechaInicio,
      },
    });
    if (!data?.crearPrecioPlato?.ok) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error al guardar precio",
        text: data?.crearPrecioPlato?.error,
        confirmButtonColor: G[900],
      });
      return;
    }
    setPrecioForm({ valor: "", fechaInicio: "" });
    setShowForm(false);
  };

  const handleToggle = async (p) => {
    setToggling(p.id);
    const mutation = p.activo ? desactivarPrecio : activarPrecio;
    await mutation({ variables: { id: p.id } });
    setToggling(null);
  };

  return (
    <>
      <Divider label="Precios" />
      <div className="space-y-2">
        {precios.length === 0 && !showForm && (
          <p className="text-xs font-dm text-stone-400 italic text-center py-2">
            Sin precios asignados
          </p>
        )}

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
                {fmt(p.precio, p.moneda)}
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
                  style={{
                    background: G[50],
                    color: G[500],
                    border: `1px solid ${G[100]}`,
                  }}
                >
                  VIGENTE
                </span>
              )}
              {!p.activo && (
                <span className="text-[9px] font-dm font-bold px-2 py-1 rounded-full bg-stone-100 text-stone-400 border border-stone-200">
                  INACTIVO
                </span>
              )}
              <button
                onClick={() => handleToggle(p)}
                disabled={toggling === p.id}
                title={p.activo ? "Desactivar precio" : "Activar precio"}
                className="w-6 h-6 rounded-lg flex items-center justify-center border transition-all"
                style={
                  p.activo
                    ? {
                        background: "#fef2f2",
                        borderColor: "#fecaca",
                        color: "#dc2626",
                      }
                    : { background: G[50], borderColor: G[100], color: G[300] }
                }
              >
                {toggling === p.id ? (
                  <Loader2 size={9} className="animate-spin" />
                ) : p.activo ? (
                  <XCircle size={10} />
                ) : (
                  <CheckCircle2 size={10} />
                )}
              </button>
            </div>
          </div>
        ))}

        {/* Form nuevo precio */}
        {showForm ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3">
            <p className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
              Nuevo precio
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-dm text-stone-400">
                  Precio ({moneda})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={precioForm.valor}
                  onChange={(e) =>
                    setPrecioForm((f) => ({ ...f, valor: e.target.value }))
                  }
                  placeholder="25000"
                  className={`${inputCls} text-xs`}
                  onFocus={fi}
                  onBlur={fb}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-dm text-stone-400">
                  Vigente desde
                </label>
                <input
                  type="datetime-local"
                  value={precioForm.fechaInicio}
                  onChange={(e) =>
                    setPrecioForm((f) => ({
                      ...f,
                      fechaInicio: e.target.value,
                    }))
                  }
                  className={`${inputCls} text-xs`}
                  onFocus={fi}
                  onBlur={fb}
                />
              </div>
            </div>
            {precioForm.valor && (
              <p className="text-xs font-dm text-stone-500">
                Se registrará:{" "}
                <strong style={{ color: G[500] }}>
                  {fmt(parseFloat(precioForm.valor || 0), moneda)}
                </strong>
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setPrecioForm({ valor: "", fechaInicio: "" });
                }}
                className="px-3 py-1.5 text-xs font-dm text-stone-500 hover:text-stone-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrear}
                style={{ background: G[900] }}
                className="px-4 py-1.5 rounded-xl text-xs font-dm font-bold text-white hover:opacity-90 transition-all"
              >
                Guardar precio
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-2 rounded-xl border border-dashed border-stone-300 text-xs font-dm text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus size={12} /> Asignar nuevo precio
          </button>
        )}
      </div>
    </>
  );
}
