// src/features/gerente/menu/platos/wizard/WizardStepConfirmar.jsx
// Paso 2: resumen de todo antes de enviar

import { FlaskConical } from "lucide-react";
import { Divider } from "../../../../../../shared/components/ui";
import { G, fmt } from "../platoUtils";

export default function WizardStepConfirmar({
  form,
  ings,
  precio,
  categorias,
  moneda,
}) {
  const cat = categorias.find((c) => c.id === form.categoriaId);

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="font-bold text-stone-900 text-xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Confirmar plato
        </h2>
        <p className="text-stone-400 text-sm mt-1 font-dm">
          Revisa todo antes de crear.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 overflow-hidden">
        {form.imagen && (
          <div className="h-32 overflow-hidden bg-stone-100">
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
            <h3
              className="font-bold text-stone-900 text-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {form.nombre || (
                <span className="text-stone-300 italic">Sin nombre</span>
              )}
            </h3>
            {cat && (
              <span
                className="text-[10px] font-dm font-semibold px-2 py-1 rounded-full mt-1 inline-block"
                style={{
                  background: G[50],
                  color: G[500],
                  border: `1px solid ${G[100]}`,
                }}
              >
                {cat.nombre}
              </span>
            )}
            <p className="text-sm font-dm text-stone-500 mt-2">
              {form.descripcion}
            </p>
          </div>

          {ings.length > 0 && (
            <>
              <Divider label="Ingredientes" />
              <div className="grid grid-cols-2 gap-2">
                {ings.map((i) => (
                  <div
                    key={i.ingredienteId}
                    className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-xl border border-stone-100"
                  >
                    <FlaskConical
                      size={10}
                      style={{ color: G[300] }}
                      className="shrink-0"
                    />
                    <span className="text-xs font-dm text-stone-700 truncate">
                      {i.nombre}
                    </span>
                    <span className="text-[10px] font-dm text-stone-400 ml-auto shrink-0">
                      {i.cantidad} {i.unidadMedida}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {precio.valor && precio.fechaInicio && (
            <>
              <Divider label="Precio" />
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: `${G[50]}99`,
                  border: `1px solid ${G[100]}`,
                }}
              >
                <p
                  className="text-xl font-bold"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: G[500],
                  }}
                >
                  {fmt(parseFloat(precio.valor), moneda)}
                </p>
                <span className="text-xs font-dm text-stone-400">
                  · desde{" "}
                  {new Date(precio.fechaInicio).toLocaleDateString("es-CO")}
                </span>
              </div>
            </>
          )}

          {precio.valor && !precio.fechaInicio && (
            <p className="text-xs font-dm text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
              ⚠️ Tienes un precio ingresado pero falta la fecha de inicio. No se
              guardará.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
