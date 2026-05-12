// src/features/loyalty/components/admin/AdminLoyalty.jsx
import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Star,
  Ticket,
  Coins,
  Users,
  TrendingUp,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Globe,
  Tag,
  Percent,
  Gift,
  Hash,
  RefreshCw,
  ChevronDown,
  Award,
  BarChart3,
  Filter,
} from "lucide-react";
import { GET_PROMOCIONES, GET_CUPONES } from "../../graphql/operations";
import { GET_RESTAURANTES } from "../../../menu/components/admin/graphql/operations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
} from "../../../../shared/components/ui";
import { gql } from "@apollo/client";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

// Query de clientes con puntos — admin ve todos
const GET_CLIENTES_PUNTOS = gql`
  query GetClientesPuntos {
    clientes {
      id
      nombre
      apellido
      cedula
      email
      activo
    }
  }
`;

// Query de transacciones de puntos global
const GET_TRANSACCIONES_ADMIN = gql`
  query GetTransaccionesAdmin($tipo: String) {
    transaccionesPuntos(tipo: $tipo) {
      id
      clienteId
      tipo
      tipoDisplay
      puntos
      descripcion
      createdAt
    }
  }
`;

const fmtFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const BENEFICIO_META = {
  descuento_pct: { label: "Descuento %", icon: Percent, color: "#3b82f6" },
  descuento_monto: { label: "Descuento fijo", icon: Coins, color: "#8b5cf6" },
  puntos_extra: { label: "Puntos extra", icon: Star, color: G[300] },
  regalo: { label: "Regalo", icon: Gift, color: "#ec4899" },
  "2x1": { label: "2×1", icon: Hash, color: "#f59e0b" },
};

const NIVEL_META = {
  bronce: { label: "Bronce", icon: "🥉", bg: "#fef3c7", text: "#d97706" },
  plata: { label: "Plata", icon: "🥈", bg: "#f1f5f9", text: "#64748b" },
  oro: { label: "Oro", icon: "🥇", bg: "#fefce8", text: "#ca8a04" },
  diamante: { label: "Diamante", icon: "💎", bg: "#eff6ff", text: "#3b82f6" },
};

// ── StatCard ───────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color, bg, border }) {
  return (
    <div
      className="bg-white rounded-2xl border p-5 space-y-3"
      style={{
        borderColor: border ?? "#e7e5e4",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: bg ?? G[50] }}
      >
        <Icon size={18} style={{ color: color ?? G[300] }} />
      </div>
      <div>
        <p
          className="text-3xl font-bold leading-none"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: color ?? G[500],
          }}
        >
          {value}
        </p>
        <p className="text-xs font-dm font-semibold text-stone-500 mt-1">
          {label}
        </p>
        {sub && (
          <p className="text-[10px] font-dm text-stone-400 mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Tab: Dashboard ─────────────────────────────────────────────────────────
function TabDashboard({ promociones, cupones }) {
  const totalPromociones = promociones.length;
  const promoActivas = promociones.filter((p) => {
    const ahora = new Date();
    return (
      p.activa &&
      new Date(p.fechaInicio) <= ahora &&
      new Date(p.fechaFin) >= ahora
    );
  }).length;
  const promoGlobales = promociones.filter(
    (p) => p.alcance === "global",
  ).length;
  const promoLocales = promociones.filter((p) => p.alcance === "local").length;

  const totalCupones = cupones.length;
  const cuponesDisponibles = cupones.filter((c) => c.disponible).length;
  const cuponesUsados = cupones.filter((c) => c.usosActuales > 0).length;
  const usosTotal = cupones.reduce((s, c) => s + (c.usosActuales ?? 0), 0);

  // Promociones más usadas (por tipo de beneficio)
  const porTipo = useMemo(() => {
    const m = {};
    promociones.forEach((p) => {
      m[p.tipoBeneficio] = (m[p.tipoBeneficio] ?? 0) + 1;
    });
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [promociones]);

  // Cupones más usados
  const topCupones = useMemo(
    () =>
      [...cupones]
        .filter((c) => c.usosActuales > 0)
        .sort((a, b) => b.usosActuales - a.usosActuales)
        .slice(0, 8),
    [cupones],
  );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Star}
          label="Promociones totales"
          value={totalPromociones}
          sub={`${promoActivas} activas ahora`}
          color={G[300]}
          bg={G[50]}
          border={G[100]}
        />
        <KpiCard
          icon={Globe}
          label="Globales / Locales"
          value={`${promoGlobales} / ${promoLocales}`}
          sub="distribución de alcance"
          color="#3b82f6"
          bg="#eff6ff"
          border="#bfdbfe"
        />
        <KpiCard
          icon={Ticket}
          label="Cupones totales"
          value={totalCupones}
          sub={`${cuponesDisponibles} disponibles`}
          color="#7c3aed"
          bg="#faf5ff"
          border="#ddd6fe"
        />
        <KpiCard
          icon={TrendingUp}
          label="Total usos de cupones"
          value={usosTotal}
          sub={`${cuponesUsados} cupones utilizados`}
          color="#d97706"
          bg="#fffbeb"
          border="#fde68a"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por tipo de beneficio */}
        <div
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
            <BarChart3 size={14} style={{ color: G[300] }} />
            <h3 className="text-sm font-dm font-bold text-stone-800">
              Promociones por tipo de beneficio
            </h3>
          </div>
          <div className="p-5 space-y-3">
            {porTipo.length === 0 ? (
              <p className="text-xs font-dm text-stone-400 italic text-center py-4">
                Sin datos
              </p>
            ) : (
              porTipo.map(([tipo, count]) => {
                const meta =
                  BENEFICIO_META[tipo] ?? BENEFICIO_META.descuento_pct;
                const Icon = meta.icon;
                const pct = Math.round((count / totalPromociones) * 100);
                return (
                  <div key={tipo} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={12} style={{ color: meta.color }} />
                        <span className="text-xs font-dm text-stone-600">
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-dm font-bold text-stone-700">
                          {count}
                        </span>
                        <span className="text-[10px] font-dm text-stone-400">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top cupones más usados */}
        <div
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
            <Award size={14} style={{ color: "#7c3aed" }} />
            <h3 className="text-sm font-dm font-bold text-stone-800">
              Cupones más usados
            </h3>
          </div>
          <div className="divide-y divide-stone-100">
            {topCupones.length === 0 ? (
              <p className="text-xs font-dm text-stone-400 italic text-center py-8">
                Ningún cupón ha sido usado aún
              </p>
            ) : (
              topCupones.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={
                      i === 0
                        ? { background: "#fef3c7", color: "#d97706" }
                        : i === 1
                          ? { background: "#f1f5f9", color: "#64748b" }
                          : i === 2
                            ? { background: "#fef9ee", color: "#ca8a04" }
                            : { background: "#f5f5f4", color: "#a8a29e" }
                    }
                  >
                    {i + 1}
                  </span>
                  <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg flex-1 truncate">
                    {c.codigo}
                  </span>
                  <span className="text-xs font-dm text-stone-500 shrink-0">
                    {c.tipoDescuento === "porcentaje"
                      ? `${c.valorDescuento}%`
                      : `$${c.valorDescuento}`}
                  </span>
                  <div className="text-right shrink-0">
                    <span
                      className="text-sm font-dm font-bold"
                      style={{ color: "#7c3aed" }}
                    >
                      {c.usosActuales}
                    </span>
                    <span className="text-[10px] font-dm text-stone-400 ml-1">
                      usos
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Resumen visual promociones activas vs inactivas */}
      <div
        className="bg-white rounded-2xl border border-stone-200 p-5"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
      >
        <h3 className="text-sm font-dm font-bold text-stone-800 mb-4">
          Estado general del programa
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Promociones activas",
              value: promoActivas,
              color: G[300],
              bg: G[50],
              border: G[100],
            },
            {
              label: "Promociones vencidas",
              value: promociones.filter(
                (p) => new Date(p.fechaFin) < new Date(),
              ).length,
              color: "#dc2626",
              bg: "#fef2f2",
              border: "#fecaca",
            },
            {
              label: "Cupones disponibles",
              value: cuponesDisponibles,
              color: "#7c3aed",
              bg: "#faf5ff",
              border: "#ddd6fe",
            },
            {
              label: "Cupones agotados",
              value: cupones.filter((c) => !c.disponible).length,
              color: "#a8a29e",
              bg: "#f5f5f4",
              border: "#e5e5e5",
            },
          ].map(({ label, value, color, bg, border }) => (
            <div
              key={label}
              className="rounded-xl p-4 border text-center"
              style={{ background: bg, borderColor: border }}
            >
              <p
                className="text-2xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif", color }}
              >
                {value}
              </p>
              <p
                className="text-[10px] font-dm font-semibold mt-1"
                style={{ color }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Promociones ───────────────────────────────────────────────────────
function TabPromociones({ promociones, loading, restaurantes }) {
  const [search, setSearch] = useState("");
  const [filtroAlcance, setFiltroAlcance] = useState("all");
  const [filtroRestaurante, setFiltroRestaurante] = useState("all");

  const fi = (e) => {
    e.target.style.borderColor = "transparent";
    e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
  };
  const fb = (e) => {
    e.target.style.borderColor = "#e2e8f0";
    e.target.style.boxShadow = "none";
  };

  const ahora = new Date();

  const filtradas = useMemo(() => {
    const q = search.toLowerCase().trim();
    return promociones.filter((p) => {
      if (q && !p.nombre.toLowerCase().includes(q)) return false;
      if (filtroAlcance !== "all" && p.alcance !== filtroAlcance) return false;
      return true;
    });
  }, [promociones, search, filtroAlcance]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar promoción..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-700 placeholder:text-stone-300 outline-none shadow-sm transition-all"
            onFocus={fi}
            onBlur={fb}
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl">
          {[
            { v: "all", l: "Todas" },
            { v: "global", l: "Globales" },
            { v: "local", l: "Locales" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltroAlcance(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
              style={
                filtroAlcance === v
                  ? { background: G[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Sin promociones"
          description="No hay promociones que coincidan."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map((p) => {
            const meta =
              BENEFICIO_META[p.tipoBeneficio] ?? BENEFICIO_META.descuento_pct;
            const BIcon = meta.icon;
            const inicio = new Date(p.fechaInicio);
            const fin = new Date(p.fechaFin);
            const vigente = p.activa && inicio <= ahora && fin >= ahora;
            const vencida = fin < ahora;
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:-translate-y-0.5 transition-all duration-200"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
              >
                <div
                  className="h-1"
                  style={{
                    background: vigente
                      ? `linear-gradient(90deg,${G[300]},${G[100]})`
                      : vencida
                        ? "linear-gradient(90deg,#d4d4d4,#e5e5e5)"
                        : `linear-gradient(90deg,${meta.color}88,${meta.color}44)`,
                  }}
                />
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${meta.color}18` }}
                      >
                        <BIcon size={14} style={{ color: meta.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-dm font-semibold text-stone-800 truncate">
                          {p.nombre}
                        </p>
                        <p
                          className="text-[10px] font-dm"
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                          {p.tipoBeneficio === "descuento_pct" &&
                            ` · ${p.valor}%`}
                          {p.tipoBeneficio === "descuento_monto" &&
                            ` · -${p.valor}`}
                          {p.tipoBeneficio === "puntos_extra" &&
                            ` · +${p.puntosBonus} pts`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className="text-[10px] font-dm font-semibold px-2 py-0.5 rounded-full"
                        style={
                          p.alcance === "global"
                            ? { background: "#eff6ff", color: "#3b82f6" }
                            : { background: G[50], color: G[300] }
                        }
                      >
                        {p.alcance === "global" ? "Global" : "Local"}
                      </span>
                      <Badge
                        variant={
                          vigente ? "green" : vencida ? "red" : "default"
                        }
                        size="xs"
                      >
                        {vigente ? "Activa" : vencida ? "Vencida" : "Inactiva"}
                      </Badge>
                    </div>
                  </div>
                  {p.descripcion && (
                    <p className="text-[11px] font-dm text-stone-400 line-clamp-2">
                      {p.descripcion}
                    </p>
                  )}
                  <p className="text-[10px] font-dm text-stone-400">
                    {fmtFecha(p.fechaInicio)} → {fmtFecha(p.fechaFin)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab: Cupones ───────────────────────────────────────────────────────────
function TabCupones({ cupones, loading }) {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");

  const fi = (e) => {
    e.target.style.borderColor = "transparent";
    e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
  };
  const fb = (e) => {
    e.target.style.borderColor = "#e2e8f0";
    e.target.style.boxShadow = "none";
  };

  const filtrados = useMemo(() => {
    const q = search.toLowerCase().trim();
    return cupones.filter((c) => {
      if (q && !c.codigo.toLowerCase().includes(q)) return false;
      if (filtroEstado === "disponibles" && !c.disponible) return false;
      if (filtroEstado === "agotados" && c.disponible) return false;
      return true;
    });
  }, [cupones, search, filtroEstado]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-700 placeholder:text-stone-300 outline-none shadow-sm transition-all"
            onFocus={fi}
            onBlur={fb}
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl">
          {[
            { v: "all", l: "Todos" },
            { v: "disponibles", l: "Disponibles" },
            { v: "agotados", l: "Agotados" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltroEstado(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
              style={
                filtroEstado === v
                  ? { background: G[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs font-dm text-stone-400">
        {filtrados.length} cupón{filtrados.length !== 1 ? "es" : ""}
        {search && ` · "${search}"`}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Sin cupones"
          description="No hay cupones que coincidan."
        />
      ) : (
        <div
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                {["Código", "Tipo", "Valor", "Usos", "Vigencia", "Estado"].map(
                  (l) => (
                    <th
                      key={l}
                      className="py-2.5 px-3 text-left text-[10px] font-dm font-semibold text-stone-400 uppercase tracking-wide first:pl-5 last:pr-5"
                    >
                      {l}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60 transition-colors"
                >
                  <td className="py-3 pl-5 pr-3">
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-stone-100 text-stone-700">
                      {c.codigo}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs font-dm text-stone-600">
                    {c.tipoDescuentoDisplay}
                  </td>
                  <td className="py-3 px-3 text-xs font-dm font-semibold text-stone-800">
                    {c.tipoDescuento === "porcentaje"
                      ? `${c.valorDescuento}%`
                      : `$${c.valorDescuento}`}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-1.5 rounded-full bg-stone-100 overflow-hidden"
                        style={{ width: "40px" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (c.usosActuales / c.limiteUso) * 100)}%`,
                            background: c.disponible ? G[300] : "#dc2626",
                          }}
                        />
                      </div>
                      <span className="text-xs font-dm text-stone-500">
                        {c.usosActuales}/{c.limiteUso}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[10px] font-dm text-stone-400">
                    hasta {fmtFecha(c.fechaFin)}
                  </td>
                  <td className="py-3 pr-5 pl-3">
                    <Badge
                      variant={c.disponible ? "green" : "default"}
                      size="xs"
                    >
                      {c.disponible ? (
                        <>
                          <CheckCircle2 size={9} /> Disponible
                        </>
                      ) : (
                        <>
                          <XCircle size={9} /> Agotado
                        </>
                      )}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Tab: Clientes ──────────────────────────────────────────────────────────
function TabClientes({ loading }) {
  const [search, setSearch] = useState("");

  const { data, loading: cLoading } = useQuery(GET_CLIENTES_PUNTOS, {
    fetchPolicy: "cache-and-network",
  });

  const fi = (e) => {
    e.target.style.borderColor = "transparent";
    e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
  };
  const fb = (e) => {
    e.target.style.borderColor = "#e2e8f0";
    e.target.style.boxShadow = "none";
  };

  const clientes = data?.clientes ?? [];
  const activos = clientes.filter((c) => c.activo).length;

  const filtrados = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
        (c.cedula && c.cedula.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)),
    );
  }, [clientes, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { n: clientes.length, l: "en total", h: false },
          { n: activos, l: "activos", h: true },
        ].map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2.5 shadow-sm"
            style={
              s.h
                ? { borderColor: G[100], background: `${G[50]}99` }
                : { borderColor: "#e7e5e4" }
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

      <div className="relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, cédula o email..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-700 placeholder:text-stone-300 outline-none shadow-sm transition-all"
          onFocus={fi}
          onBlur={fb}
        />
      </div>

      {cLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin clientes"
          description="No hay clientes registrados en la plataforma."
        />
      ) : (
        <div
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                {["Cliente", "Cédula", "Email", "Estado"].map((l) => (
                  <th
                    key={l}
                    className="py-2.5 px-3 text-left text-[10px] font-dm font-semibold text-stone-400 uppercase tracking-wide first:pl-5 last:pr-5"
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60 transition-colors"
                >
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: G[50], color: G[500] }}
                      >
                        {(c.nombre?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-dm font-semibold text-stone-800">
                          {c.nombre} {c.apellido}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs font-dm text-stone-500">
                    {c.cedula ?? "—"}
                  </td>
                  <td className="py-3 px-3 text-xs font-dm text-stone-500">
                    {c.email ?? "—"}
                  </td>
                  <td className="py-3 pr-5 pl-3">
                    <Badge variant={c.activo ? "green" : "default"} size="xs">
                      {c.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "promociones", label: "Promociones", icon: Star },
  { id: "cupones", label: "Cupones", icon: Ticket },
  { id: "clientes", label: "Clientes", icon: Users },
];

export default function AdminLoyalty() {
  const [tab, setTab] = useState("dashboard");

  const {
    data: promoData,
    loading: promoLoading,
    refetch,
  } = useQuery(GET_PROMOCIONES, {
    fetchPolicy: "cache-and-network",
  });

  const { data: cuponData, loading: cuponLoading } = useQuery(GET_CUPONES, {
    fetchPolicy: "cache-and-network",
  });

  const promociones = promoData?.promociones ?? [];
  const cupones = cuponData?.cupones ?? [];

  const totalActivas = promociones.filter((p) => {
    const ahora = new Date();
    return (
      p.activa &&
      new Date(p.fechaInicio) <= ahora &&
      new Date(p.fechaFin) >= ahora
    );
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Central"
        title="Loyalty Global"
        description="Vista consolidada de promociones, cupones y clientes de toda la cadena."
        action={
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} />
          </Button>
        }
      />

      {/* Resumen rápido en el header */}
      {!promoLoading && !cuponLoading && (
        <div className="flex items-center gap-3 flex-wrap">
          {[
            {
              n: promociones.length,
              l: "promociones",
              color: G[300],
              bg: `${G[50]}99`,
              border: G[100],
            },
            {
              n: totalActivas,
              l: "activas ahora",
              color: "#16a34a",
              bg: "#f0fdf499",
              border: "#bbf7d0",
            },
            {
              n: cupones.length,
              l: "cupones",
              color: "#7c3aed",
              bg: "#faf5ff99",
              border: "#ddd6fe",
            },
            {
              n: cupones.filter((c) => c.disponible).length,
              l: "disponibles",
              color: "#d97706",
              bg: "#fffbeb99",
              border: "#fde68a",
            },
          ].map((s) => (
            <div
              key={s.l}
              className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2.5 shadow-sm"
              style={{ borderColor: s.border, background: s.bg }}
            >
              <span
                className="text-xl font-bold"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: s.color,
                }}
              >
                {s.n}
              </span>
              <span className="text-xs font-dm" style={{ color: s.color }}>
                {s.l}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-dm font-semibold transition-all"
            style={
              tab === id
                ? { background: G[900], color: "#fff" }
                : { color: "#78716c" }
            }
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <TabDashboard promociones={promociones} cupones={cupones} />
      )}
      {tab === "promociones" && (
        <TabPromociones promociones={promociones} loading={promoLoading} />
      )}
      {tab === "cupones" && (
        <TabCupones cupones={cupones} loading={cuponLoading} />
      )}
      {tab === "clientes" && <TabClientes />}
    </div>
  );
}
