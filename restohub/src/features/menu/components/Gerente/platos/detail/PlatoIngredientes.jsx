// src/features/gerente/menu/platos/detail/PlatoIngredientes.jsx
// Muestra, agrega y quita ingredientes de un plato existente.

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { FlaskConical, Trash2, Plus, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

import { Divider } from "../../../../../../shared/components/ui";
import {
  AGREGAR_INGREDIENTE_PLATO,
  QUITAR_INGREDIENTE_PLATO,
} from "../../graphql/operations";
import { G, inputCls, fi, fb } from "../platoUtils";

export default function PlatoIngredientes({
  platoId,
  ingredientes,
  disponibles,
}) {
  const [ingForm, setIngForm] = useState({ ingredienteId: "", cantidad: "" });
  const [removing, setRemoving] = useState(null);

  const [agregarIng] = useMutation(AGREGAR_INGREDIENTE_PLATO, {
    refetchQueries: ["GetPlatoDetalle"],
  });
  const [quitarIng] = useMutation(QUITAR_INGREDIENTE_PLATO, {
    refetchQueries: ["GetPlatoDetalle"],
  });

  const handleAgregar = async () => {
    if (!ingForm.ingredienteId || !ingForm.cantidad) return;
    await agregarIng({
      variables: {
        platoId,
        ingredienteId: ingForm.ingredienteId,
        cantidad: parseFloat(ingForm.cantidad),
      },
    });
    setIngForm({ ingredienteId: "", cantidad: "" });
  };

  const handleQuitar = async (ing) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      icon: "warning",
      title: `¿Quitar "${ing.ingredienteNombre}"?`,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonText: "No",
      confirmButtonText: "Sí, quitar",
    });
    if (!isConfirmed) return;
    setRemoving(ing.ingredienteId);
    await quitarIng({
      variables: { platoId, ingredienteId: ing.ingredienteId },
    });
    setRemoving(null);
  };

  return (
    <>
      <Divider label="Ingredientes" />
      <div className="space-y-2">
        {ingredientes.length === 0 && (
          <p className="text-xs font-dm text-stone-400 italic text-center py-4">
            Sin ingredientes asignados
          </p>
        )}

        {ingredientes.map((ing) => (
          <div
            key={ing.id}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-all"
          >
            <FlaskConical
              size={12}
              style={{ color: G[300] }}
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-dm font-semibold text-stone-800 truncate">
                {ing.ingredienteNombre}
              </p>
              <p className="text-[10px] font-dm text-stone-400">
                {ing.cantidad} {ing.unidadMedida}
              </p>
            </div>
            <button
              onClick={() => handleQuitar(ing)}
              disabled={removing === ing.ingredienteId}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-all shrink-0"
            >
              {removing === ing.ingredienteId ? (
                <Loader2 size={9} className="animate-spin" />
              ) : (
                <Trash2 size={9} />
              )}
            </button>
          </div>
        ))}

        {/* Agregar ingrediente */}
        <div className="flex items-end gap-2 mt-1">
          <div className="flex-1">
            <select
              value={ingForm.ingredienteId}
              onChange={(e) =>
                setIngForm((f) => ({ ...f, ingredienteId: e.target.value }))
              }
              className={`${inputCls} appearance-none cursor-pointer text-xs`}
              onFocus={fi}
              onBlur={fb}
            >
              <option value="">+ Agregar ingrediente...</option>
              {disponibles.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre} ({i.unidadMedida})
                </option>
              ))}
            </select>
          </div>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={ingForm.cantidad}
            onChange={(e) =>
              setIngForm((f) => ({ ...f, cantidad: e.target.value }))
            }
            placeholder="Cant."
            style={{ width: "80px" }}
            className={`${inputCls} text-xs`}
            onFocus={fi}
            onBlur={fb}
          />
          <button
            onClick={handleAgregar}
            disabled={!ingForm.ingredienteId || !ingForm.cantidad}
            style={{ background: G[900] }}
            className="px-3 py-2.5 rounded-xl text-xs font-dm font-bold text-white hover:opacity-90 disabled:opacity-40 transition-all shrink-0"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    </>
  );
}
