// src/features/menu/components/Gerente/platos/wizard/WizardStepPrecio.jsx
// CAMBIOS vs original:
// 1. Dos modos: "manual" (precio directo) y "margen" (% ganancia → precio calculado)
// 2. Consulta GET_COSTO_PLATO cuando platoId existe (edición de plato existente)
// 3. Vista de receta expandible con stock por ingrediente
// En wizard de CREACIÓN platoId es undefined → solo modo manual disponible
// En PlatoPrecios (edición) platoId llega → ambos modos disponibles

import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "../../../../../../app/auth/AuthContext";
import {
  DollarSign,
  Percent,
  FlaskConical,
  TrendingUp,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { G, fmt, inputCls, fi, fb } from "../platoUtils";
import { GET_COSTO_PLATO } from "../../graphql/operations";

// Helpers
const hoyLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Botones de margen de 5% en 5% desde 5% hasta 100%
const MARGENES = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);

// precio = costo / (1 - margen%)
const calcularPrecio = (costo, margenPct) => {
  if (!costo || costo <= 0 || margenPct >= 100) return null;
  return Math.ceil(costo / (1 - margenPct / 100));
};

// ── Fila de ingrediente en vista de receta ────────────────────────────────
function IngredienteRow({ ing }) {
  const agotado = ing.estaAgotado;
  const bajo = !agotado && ing.necesitaReposicion;
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
      style={{
        background: agotado ? "#fef2f2" : bajo ? "#fffbeb" : "#f0fdf4",
        borderColor: agotado ? "#fecaca" : bajo ? "#fde68a" : "#bbf7d0",
      }}
    >
      <FlaskConical
        size={12}
        style={{ color: agotado ? "#dc2626" : bajo ? "#d97706" : G[300] }}
        className="shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-dm font-semibold text-stone-800 truncate">
          {ing.nombreIngrediente}
        </p>
        <p className="text-[10px] font-dm text-stone-400">
          {ing.cantidadReceta} {ing.unidadMedida}
          {ing.stockActual !== null && ing.stockActual !== undefined && (
            <span
              className={`ml-2 font-semibold ${
                agotado
                  ? "text-red-500"
                  : bajo
                    ? "text-amber-600"
                    : "text-emerald-600"
              }`}
            >
              · stock: {parseFloat(ing.stockActual).toFixed(2)}{" "}
              {ing.unidadMedida}
            </span>
          )}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-dm font-bold text-stone-700">
          {fmt(ing.costoIngrediente, "COP")}
        </p>
        {ing.porcionesPosibles !== null &&
          ing.porcionesPosibles !== undefined && (
            <p
              className={`text-[10px] font-dm font-semibold ${agotado ? "text-red-500" : "text-stone-400"}`}
            >
              {agotado ? "Agotado" : `~${ing.porcionesPosibles} porciones`}
            </p>
          )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────
export default function WizardStepPrecio({
  precio,
  setPrecio,
  moneda,
  platoId,
}) {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;
  const fechaValue = precio.fechaInicio || hoyLocal();
  const [modo, setModo] = useState("manual");
  const [margenPct, setMargenPct] = useState(30);
  const [showReceta, setShowReceta] = useState(false);

  // Solo consultar costoPlato si el plato ya existe (edición, no creación)
  const { data: costoData, loading: costoLoading } = useQuery(GET_COSTO_PLATO, {
    variables: { platoId, restauranteId },
    skip: !platoId || !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  const costoPlato = costoData?.costoPlato;
  const costoTotal = costoPlato?.costoTotal ?? null;
  const porciones = costoPlato?.porcionesDisponibles;
  const ingredientes = costoPlato?.ingredientes ?? [];
  const tieneAgotados = ingredientes.some((i) => i.estaAgotado);
  const tieneBajo =
    !tieneAgotados && ingredientes.some((i) => i.necesitaReposicion);

  // Cuando cambia margen o llega el costo → recalcular precio automáticamente
  useEffect(() => {
    if (modo !== "margen" || costoTotal === null) return;
    const p = calcularPrecio(costoTotal, margenPct);
    if (p) setPrecio((prev) => ({ ...prev, valor: String(p) }));
  }, [modo, margenPct, costoTotal]);

  const precioNum = parseFloat(precio.valor) || 0;
  const gananciaReal =
    precioNum > 0 && costoTotal && costoTotal > 0
      ? (((precioNum - costoTotal) / precioNum) * 100).toFixed(1)
      : null;

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
          Ingresa el precio manualmente o calcula por margen de ganancia.
        </p>
      </div>

      {/* Tabs de modo */}
      <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl w-fit">
        {[
          { v: "manual", label: "Precio manual", icon: DollarSign },
          { v: "margen", label: "Por margen", icon: Percent },
        ].map(({ v, label, icon: Icon }) => (
          <button
            key={v}
            onClick={() => setModo(v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-dm font-semibold transition-all"
            style={
              modo === v
                ? { background: G[900], color: "#fff" }
                : { color: "#78716c" }
            }
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Panel de costo de producción (solo si el plato ya existe) */}
      {platoId && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            borderColor: tieneAgotados
              ? "#fecaca"
              : tieneBajo
                ? "#fde68a"
                : G[100],
          }}
        >
          <button
            onClick={() => setShowReceta((s) => !s)}
            className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:opacity-90"
            style={{
              background: tieneAgotados
                ? "#fef2f2"
                : tieneBajo
                  ? "#fffbeb"
                  : G[50],
            }}
          >
            <div className="flex items-center gap-2">
              <FlaskConical
                size={14}
                style={{
                  color: tieneAgotados
                    ? "#dc2626"
                    : tieneBajo
                      ? "#d97706"
                      : G[300],
                }}
              />
              <span
                className="text-sm font-dm font-semibold"
                style={{ color: G[900] }}
              >
                Costo de producción
              </span>
              {costoLoading && (
                <Loader2 size={12} className="text-stone-400 animate-spin" />
              )}
              {costoTotal !== null && !costoLoading && (
                <span
                  className="font-dm font-bold text-sm"
                  style={{ color: G[300] }}
                >
                  {fmt(costoTotal, moneda)}
                </span>
              )}
              {!costoTotal && !costoLoading && (
                <span className="text-xs font-dm text-stone-400 italic">
                  Sin receta configurada
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {porciones !== null && porciones !== undefined && (
                <span
                  className="text-xs font-dm font-semibold px-2 py-0.5 rounded-lg"
                  style={
                    tieneAgotados
                      ? { background: "#fef2f2", color: "#dc2626" }
                      : { background: "white", color: "#78716c" }
                  }
                >
                  ~{porciones} porciones
                </span>
              )}
              {showReceta ? (
                <ChevronUp size={14} className="text-stone-400" />
              ) : (
                <ChevronDown size={14} className="text-stone-400" />
              )}
            </div>
          </button>

          {showReceta && ingredientes.length > 0 && (
            <div className="bg-white px-4 pb-4 pt-3 space-y-2">
              {costoPlato?.advertencia && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle
                    size={13}
                    className="text-amber-500 mt-0.5 shrink-0"
                  />
                  <p className="text-xs font-dm text-amber-700">
                    {costoPlato.advertencia}
                  </p>
                </div>
              )}
              {ingredientes.map((ing, i) => (
                <IngredienteRow key={i} ing={ing} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modo margen — selector de % */}
      {modo === "margen" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider block mb-3">
              Margen de ganancia
            </label>
            <div className="flex flex-wrap gap-2">
              {MARGENES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMargenPct(m)}
                  className="px-3 py-1.5 rounded-xl text-sm font-dm font-bold transition-all"
                  style={
                    margenPct === m
                      ? { background: G[900], color: "#fff" }
                      : { background: "#f5f5f4", color: "#78716c" }
                  }
                >
                  {m}%
                </button>
              ))}
            </div>
          </div>

          {costoTotal !== null ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Costo",
                  value: fmt(costoTotal, moneda),
                  color: "#64748b",
                },
                { label: "Margen", value: `${margenPct}%`, color: "#7c3aed" },
                {
                  label: "Precio calculado",
                  value: precioNum > 0 ? fmt(precioNum, moneda) : "—",
                  color: G[300],
                  playfair: true,
                },
              ].map(({ label, value, color, playfair }) => (
                <div
                  key={label}
                  className="p-3 rounded-2xl bg-stone-50 text-center"
                >
                  <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p
                    className="font-dm font-bold text-sm"
                    style={{
                      color,
                      fontFamily: playfair
                        ? "'Playfair Display', serif"
                        : undefined,
                    }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <Info size={13} className="text-amber-500 shrink-0" />
              <p className="text-xs font-dm text-amber-700">
                {!platoId
                  ? "El costo estará disponible al editar el plato, una vez asignados sus ingredientes."
                  : "Este plato no tiene ingredientes con costo. Agrega ingredientes y recibe una orden de compra."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Inputs de precio y fecha (siempre visibles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
            Precio ({moneda})
            {modo === "margen" && costoTotal && (
              <span className="text-stone-400 font-normal normal-case ml-1">
                · ajustable
              </span>
            )}
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
          {gananciaReal !== null && (
            <p className="text-[11px] font-dm text-stone-400 flex items-center gap-1 mt-1">
              <TrendingUp size={10} style={{ color: G[300] }} />
              Margen real:
              <span className="font-semibold" style={{ color: G[300] }}>
                {gananciaReal}%
              </span>
            </p>
          )}
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

      {/* Preview del precio */}
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
              style={{ fontFamily: "'Playfair Display', serif", color: G[500] }}
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
          visible en el menú.
        </p>
      </div>
    </div>
  );
}
