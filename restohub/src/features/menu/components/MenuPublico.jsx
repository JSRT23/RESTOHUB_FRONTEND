// src/features/menu/components/MenuPublico.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import {
  ArrowLeft,
  ChevronRight,
  ImageOff,
  UtensilsCrossed,
  Coins,
  MapPin,
  Tag,
  AlertCircle,
  Clock,
} from "lucide-react";
import { GET_MENU_RESTAURANTE } from "../graphql/queries";
import { Skeleton, Badge } from "../../../shared/components/ui";

const fmt = (v, moneda = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(v);

// ── PlatoCard ──────────────────────────────────────────────────────────────
function PlatoCard({ plato }) {
  return (
    <div className="group flex gap-4 p-4 bg-white rounded-2xl border border-stone-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-default">
      {/* Imagen */}
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 flex items-center justify-center">
        {plato.imagen ? (
          <img
            src={plato.imagen}
            alt={plato.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <ImageOff size={20} className="text-stone-300" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-playfair text-stone-900 font-semibold text-base leading-tight">
          {plato.nombre}
        </h3>
        <p className="text-xs font-dm text-stone-400 mt-1 line-clamp-2 leading-relaxed">
          {plato.descripcion || "—"}
        </p>
      </div>

      {/* Precio */}
      <div className="text-right shrink-0 flex flex-col items-end justify-between">
        <p className="font-playfair text-amber-600 font-bold text-xl">
          {fmt(plato.precio, plato.moneda)}
        </p>
        <span className="text-[10px] font-dm text-stone-300">
          {plato.moneda}
        </span>
      </div>
    </div>
  );
}

// ── CategoriaSection ───────────────────────────────────────────────────────
function CategoriaSection({ categoria }) {
  return (
    <section id={`cat-${categoria.categoriaId}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-sm shadow-amber-200">
          <Tag size={14} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="font-playfair text-stone-900 font-bold text-xl">
            {categoria.nombre}
          </h2>
          <p className="text-[10px] font-dm text-stone-400">
            {categoria.platos.length} plato
            {categoria.platos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="hidden sm:block flex-1 h-px bg-stone-100 max-w-[200px]" />
      </div>

      <div className="space-y-3">
        {categoria.platos.map((p) => (
          <PlatoCard key={p.platoId} plato={p} />
        ))}
      </div>
    </section>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function MenuPublico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(GET_MENU_RESTAURANTE, {
    variables: { restauranteId: id },
  });

  if (loading)
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-36 rounded-2xl" />
        {[1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ))}
      </div>
    );

  if (error || !data?.menuRestaurante)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
          <AlertCircle size={20} className="text-red-400" />
        </div>
        <p className="font-playfair text-stone-700 font-semibold">
          Menú no disponible
        </p>
        <p className="text-stone-400 text-sm text-center max-w-xs font-dm">
          Este restaurante no tiene platos activos con precio vigente.
        </p>
        <button
          onClick={() => navigate(`/restaurantes/${id}`)}
          className="flex items-center gap-1.5 text-sm font-dm text-stone-400 hover:text-stone-700 transition"
        >
          <ArrowLeft size={13} />
          Volver al restaurante
        </button>
      </div>
    );

  const menu = data.menuRestaurante;
  const totalPlatos = menu.categorias.reduce((a, c) => a + c.platos.length, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-dm text-stone-400">
        <button
          onClick={() => navigate("/restaurantes")}
          className="hover:text-stone-700 transition"
        >
          Restaurantes
        </button>
        <ChevronRight size={11} className="text-stone-300" />
        <button
          onClick={() => navigate(`/restaurantes/${id}`)}
          className="hover:text-stone-700 transition"
        >
          {menu.nombre}
        </button>
        <ChevronRight size={11} className="text-stone-300" />
        <span className="text-stone-700 font-medium">Menú</span>
      </nav>

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-stone-900 to-stone-800 text-white">
        {/* Patrón decorativo */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #F59E0B 0%, transparent 50%), radial-gradient(circle at 80% 20%, #F59E0B 0%, transparent 40%)",
          }}
        />

        <div className="relative p-7 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
            <span className="font-playfair text-white font-black text-2xl sm:text-3xl">
              {menu.nombre[0]}
            </span>
          </div>

          <div className="flex-1">
            <p className="text-amber-400 text-xs font-dm font-bold tracking-[0.2em] uppercase mb-1">
              Menú del restaurante
            </p>
            <h1 className="font-playfair text-white text-3xl sm:text-4xl font-bold leading-tight mb-3">
              {menu.nombre}
            </h1>
            <div className="flex flex-wrap gap-4 text-white/60 text-xs font-dm">
              <span className="flex items-center gap-1.5">
                <MapPin size={11} />
                {menu.ciudad}, {menu.pais}
              </span>
              <span className="flex items-center gap-1.5">
                <Coins size={11} />
                {menu.moneda}
              </span>
              <span className="flex items-center gap-1.5">
                <UtensilsCrossed size={11} />
                {totalPlatos} platos
              </span>
            </div>
          </div>

          {/* Big stat */}
          <div className="sm:text-right">
            <p className="font-playfair text-5xl font-bold text-amber-400">
              {totalPlatos}
            </p>
            <p className="text-white/40 text-xs font-dm uppercase tracking-widest mt-1">
              platos
            </p>
          </div>
        </div>
      </div>

      {/* Índice de categorías */}
      {menu.categorias.length > 2 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-dm text-stone-400 mr-1">Ir a:</span>
          {menu.categorias.map((cat) => (
            <a
              key={cat.categoriaId}
              href={`#cat-${cat.categoriaId}`}
              className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-dm text-stone-600 hover:border-amber-300 hover:text-amber-700 shadow-sm transition-all"
            >
              {cat.nombre}
              <span className="ml-1.5 text-stone-300">{cat.platos.length}</span>
            </a>
          ))}
        </div>
      )}

      {/* Categorías */}
      {menu.categorias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-stone-200">
          <UtensilsCrossed size={28} className="text-stone-200 mb-3" />
          <p className="font-playfair text-stone-500 font-semibold">
            Menú vacío
          </p>
          <p className="text-stone-400 text-sm font-dm mt-1 text-center max-w-xs">
            No hay platos activos con precio asignado para este restaurante.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {menu.categorias.map((cat, i) => (
            <CategoriaSection
              key={cat.categoriaId ?? `otros-${i}`}
              categoria={cat}
            />
          ))}
        </div>
      )}
    </div>
  );
}
