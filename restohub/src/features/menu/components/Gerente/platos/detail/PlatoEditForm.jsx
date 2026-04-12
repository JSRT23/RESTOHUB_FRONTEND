// src/features/gerente/menu/platos/detail/PlatoEditForm.jsx
// Formulario inline para editar nombre, descripción, categoría e imagen.

import { useMutation, useQuery } from "@apollo/client/react";
import Swal from "sweetalert2";
import {
  ACTUALIZAR_PLATO,
  GET_CATEGORIAS_GERENTE,
} from "../../graphql/operations";
import { G, inputCls, fi, fb } from "../platoUtils";

export default function PlatoEditForm({
  platoId,
  editForm,
  setEditForm,
  onDone,
}) {
  const { data: cData } = useQuery(GET_CATEGORIAS_GERENTE, {
    variables: { activo: true },
  });
  const [actualizarPlato, { loading }] = useMutation(ACTUALIZAR_PLATO, {
    refetchQueries: ["GetPlatosGerente", "GetPlatoDetalle"],
  });

  const categorias = cData?.categorias ?? [];

  const handleGuardar = async () => {
    const { data } = await actualizarPlato({
      variables: { id: platoId, ...editForm },
    });
    if (!data?.actualizarPlato?.ok) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error al actualizar",
        text: data?.actualizarPlato?.error,
        confirmButtonColor: G[900],
      });
      return;
    }
    Swal.fire({
      background: "#fff",
      icon: "success",
      title: "¡Actualizado!",
      confirmButtonColor: G[900],
      timer: 1500,
      timerProgressBar: true,
    });
    onDone();
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3">
      <p className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
        Editar información
      </p>

      <div className="space-y-1.5">
        <label className="text-xs font-dm text-stone-500">Nombre</label>
        <input
          value={editForm.nombre}
          onChange={(e) =>
            setEditForm((f) => ({ ...f, nombre: e.target.value }))
          }
          className={inputCls}
          onFocus={fi}
          onBlur={fb}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-dm text-stone-500">Descripción</label>
        <textarea
          value={editForm.descripcion}
          onChange={(e) =>
            setEditForm((f) => ({ ...f, descripcion: e.target.value }))
          }
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-400 outline-none resize-none transition-all shadow-sm"
          onFocus={fi}
          onBlur={fb}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-dm text-stone-500">Categoría</label>
          <select
            value={editForm.categoriaId}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, categoriaId: e.target.value }))
            }
            className={`${inputCls} appearance-none cursor-pointer`}
            onFocus={fi}
            onBlur={fb}
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-dm text-stone-500">URL Imagen</label>
          <input
            value={editForm.imagen}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, imagen: e.target.value }))
            }
            placeholder="https://..."
            className={inputCls}
            onFocus={fi}
            onBlur={fb}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onDone}
          className="px-3 py-1.5 text-xs font-dm text-stone-500 hover:text-stone-700 transition"
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          disabled={loading}
          style={{ background: G[900] }}
          className="px-4 py-1.5 rounded-xl text-xs font-dm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
