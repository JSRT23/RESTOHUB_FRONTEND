// src/features/menu/components/RestauranteList.jsx
import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Building2,
  Coins,
  ArrowRight,
  Plus,
  Search,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  Globe,
  SlidersHorizontal,
} from "lucide-react";
import { GET_RESTAURANTES } from "../graphql/queries";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  EmptyState,
  Skeleton,
  StatCard,
} from "../../../shared/components/ui";

const MONEDA_LABEL = {
  COP: "Peso colombiano",
  USD: "Dólar",
  EUR: "Euro",
  MXN: "Peso mexicano",
  ARS: "Peso argentino",
  BRL: "Real brasileño",
  CLP: "Peso chileno",
};

// ── Skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-stone-200 shadow-card p-5 space-y-4">
      <div className="flex justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-4 w-28 mb-1.5" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="w-7 h-7 rounded-lg" />
            <Skeleton className="h-3 flex-1 max-w-[180px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── RestauranteCard ────────────────────────────────────────────────────────
function RestauranteCard({ r, index, onClick }) {
  const initials = r.nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const colors = [
    "bg-amber-50 text-amber-700 border-amber-200",
    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "bg-blue-50 text-blue-700 border-blue-200",
    "bg-violet-50 text-violet-700 border-violet-200",
    "bg-rose-50 text-rose-700 border-rose-200",
    "bg-orange-50 text-orange-700 border-orange-200",
  ];
  const color = colors[index % colors.length];

  return (
    <article
      onClick={onClick}
      className="group rounded-2xl bg-white border border-stone-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Accent top bar */}
      <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center font-playfair font-bold text-sm shrink-0 ${color}`}
            >
              {initials}
            </div>
            <div>
              <h2 className="font-playfair text-stone-900 font-semibold text-base leading-tight group-hover:text-amber-700 transition-colors line-clamp-1">
                {r.nombre}
              </h2>
              <p className="text-[10px] font-dm text-stone-400 mt-0.5">
                ID · {r.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <Badge variant={r.activo ? "green" : "red"} size="xs">
            {r.activo ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
            {r.activo ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4">
          {[
            { icon: MapPin, text: `${r.ciudad}, ${r.pais}` },
            { icon: Building2, text: r.direccion, truncate: true },
            {
              icon: Coins,
              text: `${r.moneda} · ${MONEDA_LABEL[r.moneda] ?? r.moneda}`,
            },
          ].map(({ icon: Icon, text, truncate }) => (
            <div key={text} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0">
                <Icon size={12} className="text-stone-400" />
              </div>
              <span
                className={`text-sm font-dm text-stone-500 ${truncate ? "truncate" : ""}`}
              >
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-stone-300 text-xs font-dm">
            <Globe size={11} />
            {r.pais}
          </div>
          <div className="flex items-center gap-1.5 text-amber-500 text-xs font-dm font-semibold group-hover:gap-2 transition-all">
            Ver detalles
            <ArrowRight
              size={12}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function RestaurantesList() {
  const { data, loading, error } = useQuery(GET_RESTAURANTES);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterActivo, setFilterActivo] = useState("all");

  const restaurantes = data?.restaurantes ?? [];
  const activos = restaurantes.filter((r) => r.activo).length;

  const filtered = restaurantes.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.nombre.toLowerCase().includes(q) ||
      r.ciudad.toLowerCase().includes(q) ||
      r.pais.toLowerCase().includes(q);
    const matchFilter =
      filterActivo === "all" ||
      (filterActivo === "activo" && r.activo) ||
      (filterActivo === "inactivo" && !r.activo);
    return matchSearch && matchFilter;
  });

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
          <XCircle size={20} className="text-red-400" />
        </div>
        <p className="font-dm text-stone-500 text-sm">{error.message}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Menu Service"
        title="Restaurantes"
        description="Gestiona todas las sedes de la cadena desde un solo lugar."
        action={
          <>
            <StatCard
              label="Total"
              value={restaurantes.length}
              icon={UtensilsCrossed}
            />
            <StatCard
              label="Activos"
              value={activos}
              icon={CheckCircle2}
              accent
            />
            <Button onClick={() => navigate("/restaurantes/new")}>
              <Plus size={15} strokeWidth={2.5} />
              Nuevo restaurante
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
          <Search size={14} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, ciudad o país..."
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-stone-300 hover:text-stone-500 transition text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200 shadow-sm">
          {[
            { v: "all", l: "Todos" },
            { v: "activo", l: "Activos" },
            { v: "inactivo", l: "Inactivos" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFilterActivo(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-dm font-medium transition-all ${
                filterActivo === v
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {search && (
        <p className="text-xs font-dm text-stone-400">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para{" "}
          <span className="text-amber-600 font-semibold">"{search}"</span>
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No hay restaurantes"
          description="Crea el primer restaurante de la cadena."
          action={
            <Button onClick={() => navigate("/restaurantes/new")}>
              <Plus size={14} />
              Nuevo restaurante
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r, i) => (
            <RestauranteCard
              key={r.id}
              r={r}
              index={i}
              onClick={() => navigate(`/restaurantes/${r.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
