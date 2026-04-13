// src/features/menu/components/Gerente/platos/wizard/WizardStepPrecio.jsx

import { DollarSign } from "lucide-react";
import { G, fmt, inputCls, fi, fb } from "../platoUtils";

// Devuelve "YYYY-MM-DD" de hoy en hora local
const hoyLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function WizardStepPrecio({ precio, setPrecio, moneda }) {
  // Si la fecha no está seteada todavía, pre-rellenar con hoy
  const fechaValue = precio.fechaInicio || hoyLocal();

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="font-bold text-stone-900 text-xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Asignar precio
        </h2>
        <p className="text-stone-400 text-sm mt-1 font-dm">
          Puedes omitirlo y asignarlo después desde el detalle del plato.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
            Precio ({moneda})
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={precio.valor}
            onChange={(e) =>
              setPrecio((p) => ({ ...p, valor: e.target.value }))
            }
            placeholder="Ej: 25000"
            className={inputCls}
            onFocus={fi}
            onBlur={fb}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
            Vigente desde
          </label>
          <input
            type="date"
            value={fechaValue}
            min={hoyLocal()}
            onChange={(e) =>
              setPrecio((p) => ({ ...p, fechaInicio: e.target.value }))
            }
            className={inputCls}
            onFocus={fi}
            onBlur={fb}
          />
        </div>
      </div>

      {precio.valor && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: `${G[50]}99`, border: `1px solid ${G[100]}` }}
        >
          <DollarSign size={14} style={{ color: G[300] }} />
          <div>
            <p className="text-xs font-dm text-stone-500">Precio a registrar</p>
            <p
              className="text-lg font-bold"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: G[500],
              }}
            >
              {fmt(parseFloat(precio.valor || 0), moneda)}
            </p>
            {fechaValue === hoyLocal() && (
              <p className="text-[10px] font-dm text-stone-400 mt-0.5">
                vigente hoy
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200">
        <p className="text-xs font-dm text-stone-400">
          Si no asignas precio ahora, el plato quedará activo pero sin precio
          visible en el menú público.
        </p>
      </div>
    </div>
  );
}
