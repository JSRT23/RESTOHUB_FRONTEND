// src/features/gerente/menu/platos/wizard/WizardStepInfo.jsx
// Paso 0: nombre, descripción, categoría, imagen + ingredientes opcionales
// IMPORTANTE: este componente es una función pura (no definida dentro de otro
// componente) para evitar que React lo desmonte/remonte en cada render y
// pierda el foco al escribir.

import { useState } from "react";
import { Plus, X, FlaskConical } from "lucide-react";
import { Divider } from "../../../../../../shared/components/ui";
import { G, inputCls, fi, fb } from "../platoUtils";

export default function WizardStepInfo({
  form,
  setForm,
  ings,
  setIngs,
  categorias,
  ingredientes,
}) {
  const [ingForm, setIngForm] = useState({ ingredienteId: "", cantidad: "" });

  const disponibles = ingredientes.filter(
    (i) => !ings.some((s) => s.ingredienteId === i.id),
  );
  const ingActual = ingredientes.find((i) => i.id === ingForm.ingredienteId);

  const addIng = () => {
    if (
      !ingForm.ingredienteId ||
      !ingForm.cantidad ||
      parseFloat(ingForm.cantidad) <= 0
    )
      return;
    setIngs([
      ...ings,
      {
        ingredienteId: ingForm.ingredienteId,
        nombre: ingActual?.nombre ?? "",
        unidadMedida: ingActual?.unidadMedida ?? "",
        cantidad: parseFloat(ingForm.cantidad),
      },
    ]);
    setIngForm({ ingredienteId: "", cantidad: "" });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="font-bold text-stone-900 text-xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Información del plato
        </h2>
        <p className="text-stone-400 text-sm mt-1 font-dm">
          Define nombre, descripción y categoría.
        </p>
      </div>

      {/* Nombre */}
      <div className="space-y-1.5">
        <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
          Nombre <span className="text-red-400">*</span>
        </label>
        <input
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          placeholder="Ej: Hamburguesa Angus doble"
          autoFocus
          className={inputCls}
          onFocus={fi}
          onBlur={fb}
        />
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
          Descripción <span className="text-red-400">*</span>
        </label>
        <textarea
          value={form.descripcion}
          onChange={(e) =>
            setForm((f) => ({ ...f, descripcion: e.target.value }))
          }
          rows={3}
          placeholder="Describe el plato..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-400 outline-none transition-all resize-none shadow-sm"
          onFocus={fi}
          onBlur={fb}
        />
      </div>

      {/* Categoría + Imagen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
            Categoría
          </label>
          <select
            value={form.categoriaId}
            onChange={(e) =>
              setForm((f) => ({ ...f, categoriaId: e.target.value }))
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
          <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
            URL Imagen{" "}
            <span className="text-stone-400 font-normal normal-case">
              (opcional)
            </span>
          </label>
          <input
            value={form.imagen}
            onChange={(e) => setForm((f) => ({ ...f, imagen: e.target.value }))}
            placeholder="https://..."
            className={inputCls}
            onFocus={fi}
            onBlur={fb}
          />
        </div>
      </div>

      <Divider label="Ingredientes (opcional, puedes agregar después)" />

      {/* Agregar ingredientes */}
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
              Ingrediente
            </label>
            <select
              value={ingForm.ingredienteId}
              onChange={(e) =>
                setIngForm((f) => ({ ...f, ingredienteId: e.target.value }))
              }
              className={`${inputCls} appearance-none cursor-pointer`}
              onFocus={fi}
              onBlur={fb}
            >
              <option value="">Selecciona...</option>
              {disponibles.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre} ({i.unidadMedida})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
              Cantidad
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={ingForm.cantidad}
              onChange={(e) =>
                setIngForm((f) => ({ ...f, cantidad: e.target.value }))
              }
              placeholder="0.000"
              className={inputCls}
              onFocus={fi}
              onBlur={fb}
            />
          </div>
          <button
            onClick={addIng}
            disabled={!ingForm.ingredienteId || !ingForm.cantidad}
            style={{ background: G[900] }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-dm font-bold text-white hover:opacity-90 disabled:opacity-40 transition-all self-end"
          >
            <Plus size={13} /> Agregar
          </button>
        </div>

        {ings.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {ings.map((ing) => (
              <div
                key={ing.ingredienteId}
                className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-stone-200 shadow-sm"
              >
                <FlaskConical size={12} className="text-stone-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-dm font-semibold text-stone-800 truncate">
                    {ing.nombre}
                  </p>
                  <p className="text-[10px] font-dm text-stone-400">
                    {ing.cantidad} {ing.unidadMedida}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setIngs((prev) =>
                      prev.filter((i) => i.ingredienteId !== ing.ingredienteId),
                    )
                  }
                  className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition shrink-0"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
