// src/features/menu/components/Gerente/platos/GPlatosList.jsx
import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { UtensilsCrossed, Plus, Search, Eye, ImageOff } from "lucide-react";
import {
  GET_PLATOS_GERENTE,
  GET_PRECIOS_RESTAURANTE,
  GET_CATEGORIAS_GERENTE,
  GET_MI_RESTAURANTE,
} from "../graphql/operations";
import {
  PageHeader,
  Button,
  Skeleton,
  EmptyState,
  Modal,
} from "../../../../../shared/components/ui";
import { useAuth } from "../../../../../app/auth/AuthContext";
import CreatePlatoWizard from "./CreatePlatoWizard";
import PlatoDetailModal from "./PlatoDetailModal";
import { G, fmt } from "./platoUtils";

export default function GPlatosList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [search, setSearch] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("all");
  const [filtroCat, setFiltroCat] = useState("all");
  const [modoCrear, setModoCrear] = useState(false);
  const [platoSelecto, setPlatoSelecto] = useState(null);

  const { data: pData, loading } = useQuery(GET_PLATOS_GERENTE, {
    variables: { restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });
  // Query separada de precios — el endpoint platos(restauranteId) no los incluye
  const { data: preciosData } = useQuery(GET_PRECIOS_RESTAURANTE, {
    variables: { restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });
  const { data: cData } = useQuery(GET_CATEGORIAS_GERENTE);
  const { data: rData } = useQuery(GET_MI_RESTAURANTE, {
    variables: { id: restauranteId },
    skip: !restauranteId,
  });

  const platos = pData?.platos ?? [];
  const cats = cData?.categorias ?? [];
  const moneda = rData?.restaurante?.moneda || "COP";

  // Índice platoId → precio vigente activo
  const precioVigenteIdx = {};
  for (const p of preciosData?.precios ?? []) {
    if (p.estaVigente && p.activo) {
      precioVigenteIdx[p.platoId] = p;
    }
  }

  const activos = platos.filter((p) => p.activo).length;
  const conPrecio = platos.filter((p) => !!precioVigenteIdx[p.id]).length;

  const fi = (e) => {
    e.target.style.borderColor = "transparent";
    e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
  };
  const fb = (e) => {
    e.target.style.borderColor = "#e2e8f0";
    e.target.style.boxShadow = "none";
  };

  const filtered = platos.filter((p) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      (p.descripcion || "").toLowerCase().includes(q);
    const matchA =
      filtroActivo === "all"
        ? true
        : filtroActivo === "activo"
          ? p.activo
          : !p.activo;
    const matchC = filtroCat === "all" ? true : p.categoriaId === filtroCat;
    return matchQ && matchA && matchC;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gerente · Menú"
        title="Platos"
        description="Gestiona el catálogo de platos de tu restaurante."
        action={
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 border"
              style={{ background: `${G[50]}99`, borderColor: G[100] }}
            >
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: G[500],
                }}
              >
                {conPrecio}
              </span>
              <span className="text-xs font-dm" style={{ color: G[300] }}>
                con precio
              </span>
            </div>
            <Button
              onClick={() => setModoCrear(true)}
              variant="primary"
              size="md"
            >
              <Plus size={15} /> Nuevo plato
            </Button>
          </div>
        }
      />

      {/* Stats */}
      {!loading && platos.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { n: platos.length, l: "en total", h: false },
            { n: activos, l: "activos", h: true },
            { n: platos.length - activos, l: "inactivos", h: false },
          ]
            .filter((s) => s.n > 0)
            .map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-4 py-2.5 shadow-sm"
                style={
                  s.h ? { background: `${G[50]}99`, borderColor: G[100] } : {}
                }
              >
                <span
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: s.h ? G[500] : "#1c1917",
                  }}
                >
                  {s.n}
                </span>
                <span
                  className="text-xs font-dm"
                  style={{ color: s.h ? G[300] : "#9ca3af" }}
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
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar plato..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm placeholder:text-stone-400 outline-none shadow-sm transition-all"
            onFocus={fi}
            onBlur={fb}
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
          {[
            { v: "all", l: "Todos" },
            { v: "activo", l: "Activos" },
            { v: "inactivo", l: "Inactivos" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltroActivo(v)}
              style={
                filtroActivo === v ? { background: G[900], color: "white" } : {}
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-dm font-medium transition-all ${filtroActivo === v ? "" : "text-stone-400 hover:text-stone-700"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <select
          value={filtroCat}
          onChange={(e) => setFiltroCat(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none shadow-sm"
          onFocus={fi}
          onBlur={fb}
        >
          <option value="all">Todas las categorías</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Sin platos"
          description={
            search
              ? `Sin resultados para "${search}"`
              : "Crea el primer plato de tu restaurante"
          }
          action={
            !search && (
              <Button
                onClick={() => setModoCrear(true)}
                variant="primary"
                size="sm"
              >
                <Plus size={13} /> Nuevo plato
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[40px_1fr_auto_auto_auto] gap-4 px-4 py-2">
            <span />
            <span className="text-[10px] font-dm font-semibold uppercase tracking-widest text-stone-400">
              Plato
            </span>
            <span className="text-[10px] font-dm font-semibold uppercase tracking-widest text-stone-400">
              Precio
            </span>
            <span className="text-[10px] font-dm font-semibold uppercase tracking-widest text-stone-400">
              Estado
            </span>
            <span className="text-[10px] font-dm font-semibold uppercase tracking-widest text-stone-400">
              Acc.
            </span>
          </div>
          {filtered.map((p) => {
            const vigente = precioVigenteIdx[p.id];
            return (
              <div
                key={p.id}
                className="group grid grid-cols-[40px_1fr_auto_auto_auto] gap-4 items-center px-4 py-3 rounded-xl border border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50 transition-all duration-150"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                  {p.imagen ? (
                    <img
                      src={p.imagen}
                      alt={p.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ) : (
                    <ImageOff size={13} className="text-stone-300" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="font-semibold text-stone-800 text-sm truncate"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {p.nombre}
                    </p>
                    {p.categoriaNombre && (
                      <span
                        className="text-[9px] font-dm px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: G[50],
                          color: G[500],
                          border: `1px solid ${G[100]}`,
                        }}
                      >
                        {p.categoriaNombre}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-dm text-stone-400 truncate mt-0.5">
                    {p.descripcion}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {vigente ? (
                    <p
                      className="text-sm font-bold font-dm"
                      style={{ color: G[300] }}
                    >
                      {fmt(vigente.precio, vigente.moneda || moneda)}
                    </p>
                  ) : (
                    <span className="text-[11px] font-dm text-stone-400 italic">
                      Sin precio
                    </span>
                  )}
                </div>
                <span
                  className="text-[10px] font-dm font-bold px-2.5 py-1 rounded-full shrink-0"
                  style={
                    p.activo
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
                  {p.activo ? "ACTIVO" : "INACTIVO"}
                </span>
                <button
                  onClick={() => setPlatoSelecto(p.id)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 bg-white border border-stone-200 hover:border-stone-300 hover:text-stone-700 transition-all shadow-sm shrink-0"
                >
                  <Eye size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modoCrear}
        onClose={() => setModoCrear(false)}
        title="Nuevo plato"
        size="lg"
      >
        <CreatePlatoWizard
          onClose={() => setModoCrear(false)}
          onCreado={() => setModoCrear(false)}
          restauranteId={restauranteId}
          moneda={moneda}
        />
      </Modal>

      <Modal
        open={!!platoSelecto}
        onClose={() => setPlatoSelecto(null)}
        title="Detalle del plato"
        size="lg"
      >
        {platoSelecto && (
          <PlatoDetailModal
            platoId={platoSelecto}
            restauranteId={restauranteId}
            moneda={moneda}
          />
        )}
      </Modal>
    </div>
  );
}
