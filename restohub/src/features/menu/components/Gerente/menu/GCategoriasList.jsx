// src/features/components/gerente/menu/GCategoriasList.jsx
// El gerente solo puede VER las categorías globales.
// Las crea y gestiona únicamente el admin_central.
// Esta vista le permite saber qué categorías hay para asignarlas a sus platos.
import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { Tag, Search, Info, Lock } from "lucide-react";
import {
  GET_CATEGORIAS_GERENTE,
  GET_PLATOS_GERENTE,
} from "../graphql/operations";
import {
  PageHeader,
  Skeleton,
  EmptyState,
} from "../../../../../shared/components/ui";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const fi = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
};
const fb = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};

// ── CategoriaCard ──────────────────────────────────────────────────────────
function CategoriaCard({ cat, platosCount }) {
  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 overflow-hidden transition-all duration-200"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      <div
        className="h-1"
        style={{
          background: cat.activo
            ? `linear-gradient(90deg, ${G[300]}, ${G[100]})`
            : "#e5e7eb",
        }}
      />
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: cat.activo ? G[50] : "#f3f4f6" }}
            >
              <Tag
                size={16}
                style={{ color: cat.activo ? G[300] : "#9ca3af" }}
              />
            </div>
            <div>
              <p className="text-sm font-dm font-semibold text-stone-800">
                {cat.nombre}
              </p>
              {cat.orden && (
                <p className="text-[10px] font-dm text-stone-400 mt-0.5">
                  Orden: #{cat.orden}
                </p>
              )}
            </div>
          </div>
          <span
            className="text-[10px] font-dm font-bold px-2.5 py-1 rounded-full tracking-wide shrink-0"
            style={
              cat.activo
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
            {cat.activo ? "ACTIVA" : "INACTIVA"}
          </span>
        </div>

        {/* Platos en esta categoría */}
        <div className="px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
          <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
            Mis platos en esta cat.
          </p>
          <p
            className="text-lg font-bold"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: platosCount > 0 ? G[500] : "#9ca3af",
            }}
          >
            {platosCount}
          </p>
        </div>

        {/* Aviso solo lectura */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl border"
          style={{ background: "#fafafa", borderColor: "#e5e7eb" }}
        >
          <Lock size={10} className="text-stone-300 shrink-0" />
          <p className="text-[10px] font-dm text-stone-400">
            Gestionada por Admin Central
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function GCategoriasList() {
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todas");

  const { data: cData, loading } = useQuery(GET_CATEGORIAS_GERENTE, {
    fetchPolicy: "cache-and-network",
  });
  const { data: pData } = useQuery(GET_PLATOS_GERENTE);

  const categorias = cData?.categorias ?? [];
  const platos = pData?.platos ?? [];

  // Contar platos por categoría
  const platosPorCat = (catId) =>
    platos.filter((p) => p.categoriaId === catId).length;

  const activas = categorias.filter((c) => c.activo).length;
  const inactivas = categorias.filter((c) => !c.activo).length;

  const filtered = categorias
    .filter((c) => {
      const q = search.toLowerCase();
      const matchQ = !q || c.nombre.toLowerCase().includes(q);
      const matchF =
        filtro === "todas" ? true : filtro === "activas" ? c.activo : !c.activo;
      return matchQ && matchF;
    })
    .sort(
      (a, b) =>
        (a.orden ?? 999) - (b.orden ?? 999) || a.nombre.localeCompare(b.nombre),
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gerente · Menú"
        title="Categorías"
        description="Categorías globales del sistema. Solo lectura — el admin central las gestiona."
      />

      {/* Banner informativo */}
      <div
        className="flex items-start gap-3 px-4 py-3.5 rounded-2xl border"
        style={{ background: `${G[50]}99`, borderColor: G[100] }}
      >
        <Info size={15} style={{ color: G[300] }} className="shrink-0 mt-0.5" />
        <div>
          <p
            className="text-sm font-dm font-semibold"
            style={{ color: G[500] }}
          >
            Las categorías son globales y gestionadas por el Admin Central.
          </p>
          <p className="text-xs font-dm text-stone-500 mt-0.5">
            Puedes asignarlas a tus platos al crearlos o editarlos. Si necesitas
            una nueva categoría, contacta al administrador.
          </p>
        </div>
      </div>

      {/* Stats */}
      {!loading && categorias.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { n: categorias.length, l: "en total", s: {} },
            {
              n: activas,
              l: "activas",
              s: { background: `${G[50]}99`, borderColor: G[100] },
            },
            ...(inactivas > 0 ? [{ n: inactivas, l: "inactivas", s: {} }] : []),
          ].map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-4 py-2.5 shadow-sm"
              style={s.s}
            >
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: s.s.borderColor ? G[500] : "#1c1917",
                }}
              >
                {s.n}
              </span>
              <span
                className="text-xs font-dm"
                style={{ color: s.s.borderColor ? G[300] : "#9ca3af" }}
              >
                {s.l}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categoría..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-700 placeholder:text-stone-300 outline-none shadow-sm transition-all"
            onFocus={fi}
            onBlur={fb}
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
          {["todas", "activas", "inactivas"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={filtro === f ? { background: G[900], color: "white" } : {}}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-dm font-semibold capitalize transition-all ${filtro === f ? "" : "text-stone-500 hover:bg-stone-50"}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={search ? "Sin resultados" : "Sin categorías"}
          description={
            search
              ? `No hay categorías con "${search}"`
              : "El admin central aún no ha creado categorías"
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <CategoriaCard
              key={cat.id}
              cat={cat}
              platosCount={platosPorCat(cat.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
