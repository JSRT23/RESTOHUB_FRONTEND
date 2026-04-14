// src/features/menu/components/Gerente/dashboard/GerenteDashboard.jsx
import { useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Coins,
  UtensilsCrossed,
  Tag,
  FlaskConical,
  ArrowRight,
  CheckCircle2,
  XCircle,
  DollarSign,
  ImageOff,
} from "lucide-react";
import { useAuth } from "../../../../../app/auth/AuthContext";
import { Skeleton } from "../../../../../shared/components/ui";
import {
  GET_MI_RESTAURANTE,
  GET_PLATOS_GERENTE,
  GET_PRECIOS_RESTAURANTE,
  GET_INGREDIENTES_GERENTE,
  GET_CATEGORIAS_GERENTE,
} from "../graphql/operations";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const PAIS_FLAG = {
  Colombia: "🇨🇴",
  México: "🇲🇽",
  Perú: "🇵🇪",
  Argentina: "🇦🇷",
  Chile: "🇨🇱",
  Ecuador: "🇪🇨",
  Bolivia: "🇧🇴",
  Venezuela: "🇻🇪",
  España: "🇪🇸",
  "Estados Unidos": "🇺🇸",
  Brasil: "🇧🇷",
};

const MONEDA_NOMBRE = {
  COP: "Peso colombiano",
  USD: "Dólar americano",
  EUR: "Euro",
  MXN: "Peso mexicano",
  PEN: "Sol peruano",
  ARS: "Peso argentino",
  CLP: "Peso chileno",
  BOB: "Boliviano",
  BRL: "Real brasileño",
};

function getInitials(nombre = "") {
  const words = nombre.split(" ").filter((w) => w.length > 2);
  return words.length >= 2
    ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
    : nombre.slice(0, 2).toUpperCase();
}

function KpiCard({ icon: Icon, label, value, sub, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-2xl border border-stone-200 p-5 hover:-translate-y-0.5 transition-all duration-200"
      style={{
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        borderTop: accent ? `2px solid ${G[300]}` : undefined,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: accent ? G[50] : "#f8fafc" }}
        >
          <Icon size={16} style={{ color: accent ? G[300] : "#94a3b8" }} />
        </div>
        {onClick && (
          <ArrowRight
            size={14}
            className="text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all"
          />
        )}
      </div>
      <p
        className="text-3xl font-bold leading-none mb-1"
        style={{
          fontFamily: "'Playfair Display', serif",
          color: accent ? G[500] : "#1c1917",
        }}
      >
        {value}
      </p>
      <p className="text-xs font-dm text-stone-400 font-semibold">{label}</p>
      {sub && (
        <p className="text-[10px] font-dm text-stone-300 mt-0.5">{sub}</p>
      )}
    </button>
  );
}

// precioVigenteIdx viene del padre — platoId → precio vigente
function PlatoRow({ plato, moneda, precioVigenteIdx }) {
  const precio = precioVigenteIdx[plato.id];
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-50 transition-colors">
      <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
        {plato.imagen ? (
          <img
            src={plato.imagen}
            alt={plato.nombre}
            className="w-full h-full object-cover"
            onError={(e) => (e.target.style.display = "none")}
          />
        ) : (
          <ImageOff size={11} className="text-stone-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-dm font-semibold text-stone-800 truncate">
          {plato.nombre}
        </p>
        {plato.categoriaNombre && (
          <p className="text-[10px] font-dm text-stone-400">
            {plato.categoriaNombre}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        {precio ? (
          <p className="text-sm font-dm font-bold" style={{ color: G[300] }}>
            {Number(precio.precio).toLocaleString("es-CO")}{" "}
            {precio.moneda || moneda}
          </p>
        ) : (
          <span className="text-[10px] font-dm text-stone-300 italic">
            Sin precio
          </span>
        )}
        <div className="flex items-center justify-end gap-1 mt-0.5">
          {plato.activo ? (
            <CheckCircle2 size={9} className="text-emerald-500" />
          ) : (
            <XCircle size={9} className="text-red-400" />
          )}
          <span className="text-[9px] font-dm text-stone-400">
            {plato.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GerenteDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const restauranteId = user?.restauranteId;

  const { data: rData, loading: rLoading } = useQuery(GET_MI_RESTAURANTE, {
    variables: { id: restauranteId },
    skip: !restauranteId,
  });
  const { data: pData } = useQuery(GET_PLATOS_GERENTE, {
    variables: { restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });
  // FIX: precios por separado — el endpoint de lista no los incluye en platos
  const { data: preciosData } = useQuery(GET_PRECIOS_RESTAURANTE, {
    variables: { restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });
  const { data: iData } = useQuery(GET_INGREDIENTES_GERENTE, {
    variables: { restauranteId },
    skip: !restauranteId,
  });
  const { data: cData } = useQuery(GET_CATEGORIAS_GERENTE);

  const r = rData?.restaurante;
  const platos = pData?.platos ?? [];
  const ings = iData?.ingredientes ?? [];
  const cats = cData?.categorias ?? [];
  const activos = platos.filter((p) => p.activo).length;

  // Índice platoId → precio vigente activo — fuente única de verdad para precios
  const precioVigenteIdx = {};
  for (const p of preciosData?.precios ?? []) {
    if (p.estaVigente && p.activo) {
      precioVigenteIdx[p.platoId] = p;
    }
  }
  const conPrecio = platos.filter((p) => !!precioVigenteIdx[p.id]).length;

  const ingsActivos = ings.filter((i) => i.activo).length;

  // "Usados en platos": ingredientes que aparecen en al menos un precio vigente
  // No podemos leer plato.ingredientes desde la lista, así que usamos los
  // ingredientes activos del restaurante como proxy razonable hasta tener
  // el endpoint de detalle. Si querés el número exacto, abrí el detalle.
  // Por ahora mostramos los activos como indicador de disponibilidad.
  const ingsUsados = ingsActivos;

  if (rLoading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="w-4 h-0.5 rounded-full"
            style={{ background: G[300] }}
          />
          <span
            className="text-[10px] font-dm font-bold tracking-[0.18em] uppercase"
            style={{ color: G[300] }}
          >
            Panel del gerente
          </span>
        </div>
        <h1
          className="text-2xl md:text-3xl font-bold text-stone-900 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Bienvenido, {user?.nombre?.split(" ")[0]}
        </h1>
        <p className="text-stone-400 text-sm mt-1 font-dm">
          Vista general de tu restaurante y estado del menú
        </p>
      </div>

      {/* Hero restaurante */}
      {r && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
        >
          <div
            className="relative h-36 flex items-center px-8 gap-6"
            style={{
              background: `linear-gradient(135deg, ${G[900]} 0%, ${G[500]} 100%)`,
            }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 80% 50%, ${G[50]} 0%, transparent 60%)`,
              }}
            />
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 relative"
              style={{
                background: G[50],
                color: G[500],
                fontFamily: "'Playfair Display', serif",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              }}
            >
              {getInitials(r.nombre)}
            </div>
            <div className="relative">
              <p
                className="text-[10px] font-dm font-bold tracking-[0.2em] uppercase mb-1"
                style={{ color: G[100] }}
              >
                {PAIS_FLAG[r.pais] || "🌎"} {r.pais}
              </p>
              <h2
                className="text-2xl font-bold text-white leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {r.nombre}
              </h2>
              <p
                className="text-sm font-dm mt-0.5"
                style={{ color: `${G[100]}cc` }}
              >
                {[r.ciudad, r.direccion].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="ml-auto relative">
              <div
                className="text-right px-4 py-2 rounded-xl border"
                style={{
                  borderColor: `${G[300]}66`,
                  background: `${G[900]}88`,
                }}
              >
                <p
                  className="text-[9px] font-dm uppercase tracking-widest"
                  style={{ color: G[100] }}
                >
                  Moneda
                </p>
                <p className="text-lg font-bold font-dm text-white">
                  {r.moneda}
                </p>
                <p
                  className="text-[9px] font-dm"
                  style={{ color: `${G[100]}99` }}
                >
                  {MONEDA_NOMBRE[r.moneda] || r.moneda}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border-t border-stone-100 px-8 py-3 flex items-center gap-6 flex-wrap">
            {[
              { icon: MapPin, label: r.ciudad || "—" },
              { icon: Building2, label: r.direccion || "—" },
              {
                icon: Coins,
                label: `${r.moneda} · ${MONEDA_NOMBRE[r.moneda] || r.moneda}`,
              },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon size={12} style={{ color: G[300] }} />
                <span className="text-xs font-dm text-stone-500">{label}</span>
              </div>
            ))}
            <div className="ml-auto">
              <span
                className="text-[10px] font-dm font-bold px-3 py-1.5 rounded-full tracking-wide"
                style={
                  r.activo
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
                {r.activo ? "ACTIVO" : "INACTIVO"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={UtensilsCrossed}
          label="Platos totales"
          value={platos.length}
          sub={`${activos} activos`}
          accent
          onClick={() => navigate("/gerente/platos")}
        />
        <KpiCard
          icon={DollarSign}
          label="Con precio vigente"
          value={conPrecio}
          sub={`de ${platos.length} platos`}
          onClick={() => navigate("/gerente/platos")}
        />
        <KpiCard
          icon={FlaskConical}
          label="Ingredientes"
          value={ings.length}
          sub={`${ingsActivos} activos`}
          onClick={() => navigate("/gerente/ingredientes")}
        />
        <KpiCard
          icon={Tag}
          label="Categorías"
          value={cats.filter((c) => c.activo).length}
          sub="globales activas"
          onClick={() => navigate("/gerente/categorias")}
        />
      </div>

      {/* 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos platos */}
        <div
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div
                  className="w-3 h-0.5 rounded-full"
                  style={{ background: G[300] }}
                />
                <span
                  className="text-[9px] font-dm font-bold tracking-[0.2em] uppercase"
                  style={{ color: G[300] }}
                >
                  Menú
                </span>
              </div>
              <h2
                className="font-bold text-stone-900"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Platos recientes
                <span className="text-stone-400 text-sm font-dm ml-2">
                  ({platos.length})
                </span>
              </h2>
            </div>
            <button
              onClick={() => navigate("/gerente/platos")}
              className="flex items-center gap-1.5 text-xs font-dm font-semibold"
              style={{ color: G[300] }}
            >
              Ver todos <ArrowRight size={11} />
            </button>
          </div>
          <div className="p-2">
            {platos.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <UtensilsCrossed size={20} className="text-stone-200" />
                <p className="text-stone-400 text-sm font-dm">Sin platos aún</p>
                <button
                  onClick={() => navigate("/gerente/platos")}
                  className="text-xs font-dm font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{ color: G[300], background: G[50] }}
                >
                  + Crear primer plato
                </button>
              </div>
            ) : (
              platos
                .slice(0, 6)
                .map((p) => (
                  <PlatoRow
                    key={p.id}
                    plato={p}
                    moneda={r?.moneda || "COP"}
                    precioVigenteIdx={precioVigenteIdx}
                  />
                ))
            )}
          </div>
        </div>

        {/* Ingredientes + Categorías */}
        <div className="space-y-4">
          <div
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: G[50] }}
                >
                  <FlaskConical size={13} style={{ color: G[300] }} />
                </div>
                <h3 className="text-sm font-dm font-bold text-stone-800">
                  Ingredientes
                </h3>
              </div>
              <button
                onClick={() => navigate("/gerente/ingredientes")}
                className="text-xs font-dm font-semibold"
                style={{ color: G[300] }}
              >
                Gestionar <ArrowRight size={10} className="inline ml-0.5" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                { label: "Total", value: ings.length, color: "text-stone-900" },
                {
                  label: "Activos",
                  value: ingsActivos,
                  color: "text-emerald-600",
                },
                {
                  label: "Inactivos",
                  value: ings.length - ingsActivos,
                  color: "text-stone-400",
                },
                {
                  label: "Disponibles",
                  value: ingsActivos,
                  color: "text-stone-700",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100"
                >
                  <p
                    className={`text-xl font-bold font-dm ${color}`}
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {value}
                  </p>
                  <p className="text-[10px] font-dm text-stone-400 mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: G[50] }}
                >
                  <Tag size={13} style={{ color: G[300] }} />
                </div>
                <h3 className="text-sm font-dm font-bold text-stone-800">
                  Categorías globales
                </h3>
              </div>
              <button
                onClick={() => navigate("/gerente/categorias")}
                className="text-xs font-dm font-semibold"
                style={{ color: G[300] }}
              >
                Ver <ArrowRight size={10} className="inline ml-0.5" />
              </button>
            </div>
            <div className="px-4 py-3 flex flex-wrap gap-2">
              {cats.slice(0, 8).map((c) => (
                <span
                  key={c.id}
                  className="text-[10px] font-dm font-semibold px-2.5 py-1 rounded-full"
                  style={
                    c.activo
                      ? {
                          background: G[50],
                          color: G[500],
                          border: `1px solid ${G[100]}`,
                        }
                      : {
                          background: "#f3f4f6",
                          color: "#9ca3af",
                          border: "1px solid #e5e7eb",
                        }
                  }
                >
                  {c.nombre}
                </span>
              ))}
              {cats.length === 0 && (
                <p className="text-stone-400 text-xs font-dm italic">
                  Sin categorías
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
