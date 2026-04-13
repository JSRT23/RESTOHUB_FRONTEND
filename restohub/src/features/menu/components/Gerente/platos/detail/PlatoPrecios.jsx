// src/features/menu/components/Gerente/platos/detail/PlatoPrecios.jsx

import { useState, useEffect } from "react";
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

const hoyLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Si la fecha es hoy → now()+2min para pasar validación del backend
// Si es futuro      → mediodía UTC, safe para cualquier TZ
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

export default function PlatoPrecios({
  platoId,
  restauranteId,
  precios, // ya filtrados por restauranteId desde PlatoDetailModal
  moneda,
}) {
  const [showForm, setShowForm] = useState(false);
  const [precioForm, setPrecioForm] = useState({
    valor: "",
    fechaInicio: hoyLocal(),
  });
  const [toggling, setToggling] = useState(null);
  const [saving, setSaving] = useState(false);

  // Resetear form con fecha de hoy cada vez que se abre
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
  const [desactivarPrecio] = useMutation(DESACTIVAR_PRECIO, {
    // Sin refetchQueries aquí — el crearPrecio ya lo dispara al final
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
    setSaving(true);
    try {
      // 1. Desactivar todos los precios activos de este restaurante en paralelo
      const preciosActivos = precios.filter((p) => p.activo);
      if (preciosActivos.length > 0) {
        await Promise.all(
          preciosActivos.map((p) =>
            desactivarPrecio({ variables: { id: p.id } }),
          ),
        );
      }

      // 2. Crear el nuevo precio — el refetch aquí refresca todo de una vez
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
              {nActivos > 0 ? "Reemplazar precio" : "Nuevo precio"}
            </p>

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
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-dm text-stone-400">
                  Vigente desde
                </label>
                <input
                  type="date"
                  value={precioForm.fechaInicio}
                  min={hoyLocal()}
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
                {precioForm.fechaInicio === hoyLocal() && (
                  <span className="text-stone-400 ml-1">· vigente hoy</span>
                )}
              </p>
            )}

            <div className="flex justify-end gap-2">
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
