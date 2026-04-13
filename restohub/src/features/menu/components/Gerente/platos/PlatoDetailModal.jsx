// src/features/menu/components/Gerente/platos/PlatoDetailModal.jsx
// FIXES:
// 1. Los precios en el modal mostraban precios de TODOS los restaurantes.
//    Se filtra plato.precios por restauranteId antes de pasar a PlatoPrecios.
// 2. El precio vigente del header también se filtra por restauranteId.
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Pencil, ToggleLeft, ToggleRight, ImageOff } from "lucide-react";
import { Skeleton } from "../../../../../shared/components/ui";
import {
  GET_PLATO_DETALLE,
  GET_INGREDIENTES_DISPONIBLES,
  ACTIVAR_PLATO,
  DESACTIVAR_PLATO,
} from "../graphql/operations";
import PlatoEditForm from "./detail/PlatoEditForm";
import PlatoIngredientes from "./detail/PlatoIngredientes";
import PlatoPrecios from "./detail/PlatoPrecios";
import { G, fmt } from "./platoUtils";

export default function PlatoDetailModal({ platoId, restauranteId, moneda }) {
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const { data, loading } = useQuery(GET_PLATO_DETALLE, {
    variables: { id: platoId },
    skip: !platoId,
    fetchPolicy: "cache-and-network",
  });

  // Ingredientes disponibles: globales + propios del restaurante
  const { data: iData } = useQuery(GET_INGREDIENTES_DISPONIBLES, {
    variables: { disponibles: restauranteId, activo: true },
    skip: !restauranteId,
  });

  const [activarPlato] = useMutation(ACTIVAR_PLATO, {
    refetchQueries: ["GetPlatosGerente", "GetPlatoDetalle"],
  });
  const [desactivarPlato] = useMutation(DESACTIVAR_PLATO, {
    refetchQueries: ["GetPlatosGerente", "GetPlatoDetalle"],
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  const plato = data?.plato;
  if (!plato) return null;

  const todosIngredientes = iData?.ingredientes ?? [];
  const disponibles = todosIngredientes.filter(
    (i) => !plato.ingredientes?.some((s) => s.ingredienteId === i.id),
  );

  // FIX CRÍTICO: filtra precios solo de este restaurante.
  // Sin este filtro el modal mostraba precios de todos los restaurantes
  // que tienen ese plato asignado (ej: ARS 35.000 de Argentina + COP de Colombia).
  const preciosDelRestaurante = (plato.precios ?? []).filter(
    (p) => p.restauranteId === restauranteId,
  );

  // El precio vigente del header también filtra por restaurante
  const vigente = preciosDelRestaurante.find((p) => p.estaVigente && p.activo);

  const handleTogglePlato = () => {
    const mutation = plato.activo ? desactivarPlato : activarPlato;
    mutation({ variables: { id: platoId } });
  };

  const abrirEdicion = () => {
    setEditForm({
      nombre: plato.nombre,
      descripcion: plato.descripcion,
      categoriaId: plato.categoriaId || "",
      imagen: plato.imagen || "",
    });
    setEditando(true);
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 overflow-hidden">
          {plato.imagen ? (
            <img
              src={plato.imagen}
              alt={plato.nombre}
              className="w-full h-full object-cover"
              onError={(e) => (e.target.style.display = "none")}
            />
          ) : (
            <ImageOff size={20} className="text-stone-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h2
              className="font-bold text-stone-900 text-xl leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {plato.nombre}
            </h2>
            {plato.categoriaNombre && (
              <span
                className="text-[10px] font-dm font-semibold px-2 py-1 rounded-full shrink-0"
                style={{
                  background: G[50],
                  color: G[500],
                  border: `1px solid ${G[100]}`,
                }}
              >
                {plato.categoriaNombre}
              </span>
            )}
          </div>
          <p className="text-sm font-dm text-stone-400 mt-1 line-clamp-2">
            {plato.descripcion}
          </p>
          {vigente ? (
            <p
              className="text-lg font-bold mt-2"
              style={{ fontFamily: "'Playfair Display', serif", color: G[500] }}
            >
              {fmt(vigente.precio, vigente.moneda || moneda)}
            </p>
          ) : (
            <p className="text-xs font-dm text-stone-400 italic mt-2">
              Sin precio vigente para este restaurante
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={abrirEdicion}
            title="Editar información"
            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleTogglePlato}
            title={plato.activo ? "Desactivar plato" : "Activar plato"}
            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all"
            style={
              plato.activo
                ? {
                    background: "#fef2f2",
                    borderColor: "#fecaca",
                    color: "#dc2626",
                  }
                : { background: G[50], borderColor: G[100], color: G[300] }
            }
          >
            {plato.activo ? (
              <ToggleRight size={13} />
            ) : (
              <ToggleLeft size={13} />
            )}
          </button>
        </div>
      </div>

      {/* Estado */}
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-dm font-bold px-2.5 py-1 rounded-full"
          style={
            plato.activo
              ? {
                  background: G[50],
                  color: G[500],
                  border: `1px solid ${G[100]}`,
                }
              : {
                  background: "#f3f4f6",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                }
          }
        >
          {plato.activo ? "ACTIVO" : "INACTIVO"}
        </span>
        <span className="text-[10px] font-dm text-stone-400">
          · Creado el{" "}
          {new Date(plato.fechaCreacion).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Edición inline */}
      {editando && editForm && (
        <PlatoEditForm
          platoId={platoId}
          editForm={editForm}
          setEditForm={setEditForm}
          onDone={() => setEditando(false)}
        />
      )}

      {/* Ingredientes */}
      <PlatoIngredientes
        platoId={platoId}
        ingredientes={plato.ingredientes ?? []}
        disponibles={disponibles}
      />

      {/* FIX: pasa solo los precios de este restaurante, no todos */}
      <PlatoPrecios
        platoId={platoId}
        restauranteId={restauranteId}
        precios={preciosDelRestaurante}
        moneda={moneda}
      />
    </div>
  );
}
