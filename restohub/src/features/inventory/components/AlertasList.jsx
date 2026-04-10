// src/features/inventory/components/AlertasList.jsx
import { useQuery, useMutation } from "@apollo/client/react";
import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingDown,
  AlertTriangle,
  Search,
  RefreshCw,
  Filter,
} from "lucide-react";
import Swal from "sweetalert2";
import { GET_ALERTAS } from "../graphql/queries";
import { RESOLVER_ALERTA, IGNORAR_ALERTA } from "../graphql/mutations";
import {
  Badge,
  Button,
  PageHeader,
  StatCard,
  Skeleton,
  EmptyState,
} from "../../../shared/components/ui";

// ── Config ─────────────────────────────────────────────────────────────────
const TIPO_CFG = {
  AGOTADO: {
    label: "Agotado",
    variant: "red",
    icon: XCircle,
    desc: "El ingrediente se ha agotado completamente.",
  },
  STOCK_BAJO: {
    label: "Stock bajo",
    variant: "amber",
    icon: TrendingDown,
    desc: "El nivel está por debajo del mínimo requerido.",
  },
  VENCIMIENTO: {
    label: "Vencimiento",
    variant: "blue",
    icon: Clock,
    desc: "Un lote está próximo a vencer o ya venció.",
  },
};

const ESTADO_CFG = {
  PENDIENTE: { label: "Pendiente", variant: "amber" },
  RESUELTO: { label: "Resuelto", variant: "green" },
  IGNORADO: { label: "Ignorado", variant: "default" },
};

// ── AlertaCard ──────────────────────────────────────────────────────────────
function AlertaCard({ alerta, onResolver, onIgnorar, resolving }) {
  const tipoCfg = TIPO_CFG[alerta.tipoAlerta] ?? TIPO_CFG.STOCK_BAJO;
  const estadoCfg = ESTADO_CFG[alerta.estado] ?? ESTADO_CFG.PENDIENTE;
  const TipoIcon = tipoCfg.icon;
  const pendiente = alerta.estado === "PENDIENTE";

  return (
    <div
      className={`rounded-2xl bg-white border transition-all duration-200 overflow-hidden ${
        pendiente
          ? "border-stone-200 shadow-card hover:shadow-card-hover"
          : "border-stone-100 opacity-70"
      }`}
    >
      <div
        className={`h-1 ${
          tipoCfg.variant === "red"
            ? "bg-red-400"
            : tipoCfg.variant === "amber"
              ? "bg-amber-400"
              : "bg-blue-400"
        }`}
      />
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                tipoCfg.variant === "red"
                  ? "bg-red-50 border-red-200"
                  : tipoCfg.variant === "amber"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-blue-50 border-blue-200"
              }`}
            >
              <TipoIcon
                size={15}
                className={
                  tipoCfg.variant === "red"
                    ? "text-red-500"
                    : tipoCfg.variant === "amber"
                      ? "text-amber-500"
                      : "text-blue-500"
                }
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="font-playfair text-stone-900 font-semibold text-sm">
                  {alerta.nombreIngrediente}
                </p>
                <Badge variant={tipoCfg.variant} size="xs">
                  {tipoCfg.label}
                </Badge>
              </div>
              <p className="text-[10px] font-dm text-stone-400">
                {tipoCfg.desc}
              </p>
            </div>
          </div>
          <Badge variant={estadoCfg.variant} size="xs">
            {estadoCfg.label}
          </Badge>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
            <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
              Nivel actual
            </p>
            <p className="font-playfair text-stone-900 font-bold text-lg mt-0.5">
              {alerta.nivelActual ?? "—"}
            </p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
            <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
              Nivel mínimo
            </p>
            <p className="font-playfair text-stone-700 font-bold text-lg mt-0.5">
              {alerta.nivelMinimo ?? "—"}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-1 text-[11px] font-dm text-stone-400">
          <div className="flex items-center justify-between">
            <span>Almacén</span>
            <span className="text-stone-600 font-medium">
              {alerta.almacenNombre ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Fecha alerta</span>
            <span className="text-stone-600 font-medium">
              {alerta.fechaAlerta
                ? new Date(alerta.fechaAlerta).toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
          {alerta.fechaResolucion && (
            <div className="flex items-center justify-between">
              <span>Resuelto</span>
              <span className="text-emerald-600 font-medium">
                {new Date(alerta.fechaResolucion).toLocaleDateString("es-CO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Acciones — solo si pendiente */}
        {pendiente && (
          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            <Button
              variant="ghost"
              size="xs"
              className="flex-1"
              onClick={() => onIgnorar(alerta)}
            >
              <XCircle size={12} />
              Ignorar
            </Button>
            <Button
              size="xs"
              className="flex-1"
              loading={resolving === alerta.id}
              onClick={() => onResolver(alerta)}
            >
              <CheckCircle2 size={12} />
              Resolver
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function AlertasList() {
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroEstado, setFiltroEstado] = useState("PENDIENTE");
  const [search, setSearch] = useState("");
  const [resolving, setResolving] = useState(null);

  const { data, loading, refetch } = useQuery(GET_ALERTAS, {
    variables: {
      tipo: filtroTipo === "all" ? undefined : filtroTipo,
      estado: filtroEstado === "all" ? undefined : filtroEstado,
    },
  });

  const [resolverAlerta] = useMutation(RESOLVER_ALERTA, {
    refetchQueries: ["GetAlertas"],
  });
  const [ignorarAlerta] = useMutation(IGNORAR_ALERTA, {
    refetchQueries: ["GetAlertas"],
  });

  const alertas = data?.alertasStock ?? [];

  const totalPendientes = alertas.filter(
    (a) => a.estado === "PENDIENTE",
  ).length;
  const agotados = alertas.filter(
    (a) => a.tipoAlerta === "AGOTADO" && a.estado === "PENDIENTE",
  ).length;
  const bajosMinimo = alertas.filter(
    (a) => a.tipoAlerta === "STOCK_BAJO" && a.estado === "PENDIENTE",
  ).length;
  const vencimientos = alertas.filter(
    (a) => a.tipoAlerta === "VENCIMIENTO" && a.estado === "PENDIENTE",
  ).length;

  const filtered = alertas.filter(
    (a) =>
      (a.nombreIngrediente ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (a.almacenNombre ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleResolver = async (alerta) => {
    setResolving(alerta.id);
    const { data: res } = await resolverAlerta({
      variables: { id: alerta.id },
    });
    setResolving(null);
    if (!res.resolverAlerta.ok) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: res.resolverAlerta.error,
        confirmButtonColor: "#F59E0B",
      });
    }
  };

  const handleIgnorar = async (alerta) => {
    const confirm = await Swal.fire({
      background: "#fff",
      icon: "question",
      iconColor: "#F59E0B",
      title: "¿Ignorar esta alerta?",
      html: `<span style="font-family:'DM Sans';color:#78716c">${alerta.nombreIngrediente} — ${TIPO_CFG[alerta.tipoAlerta]?.label ?? alerta.tipoAlerta}</span>`,
      showCancelButton: true,
      confirmButtonColor: "#F59E0B",
      cancelButtonColor: "#E7E5E4",
      confirmButtonText: "Sí, ignorar",
    });
    if (!confirm.isConfirmed) return;
    await ignorarAlerta({ variables: { id: alerta.id } });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory Service"
        title="Alertas de stock"
        description="Centro de alertas activas: agotados, stock bajo mínimo y vencimientos próximos."
        action={
          <div className="flex items-center gap-2">
            <StatCard
              label="Pendientes"
              value={totalPendientes}
              icon={Bell}
              accent={totalPendientes > 0}
            />
            <StatCard label="Agotados" value={agotados} icon={XCircle} />
            <StatCard
              label="Bajo mínimo"
              value={bajosMinimo}
              icon={TrendingDown}
            />
            <StatCard label="Vencimientos" value={vencimientos} icon={Clock} />
            <Button variant="secondary" onClick={() => refetch()}>
              <RefreshCw size={14} />
              Actualizar
            </Button>
          </div>
        }
      />

      {/* Resumen visual rápido */}
      {!loading && totalPendientes > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              tipo: "AGOTADO",
              count: agotados,
              label: "Ingredientes agotados",
              color: "bg-red-50 border-red-200",
              text: "text-red-600",
              bar: "bg-red-400",
            },
            {
              tipo: "STOCK_BAJO",
              count: bajosMinimo,
              label: "Bajo stock mínimo",
              color: "bg-amber-50 border-amber-200",
              text: "text-amber-600",
              bar: "bg-amber-400",
            },
            {
              tipo: "VENCIMIENTO",
              count: vencimientos,
              label: "Lotes por vencer",
              color: "bg-blue-50 border-blue-200",
              text: "text-blue-600",
              bar: "bg-blue-400",
            },
          ].map(({ tipo, count, label, color, text, bar }) => (
            <button
              key={tipo}
              onClick={() => {
                setFiltroTipo(tipo);
                setFiltroEstado("PENDIENTE");
              }}
              className={`rounded-2xl border p-4 text-left transition-all hover:scale-[1.02] ${color} ${filtroTipo === tipo ? "ring-2 ring-offset-1 ring-amber-400" : ""}`}
            >
              <p className={`font-playfair text-3xl font-bold ${text}`}>
                {count}
              </p>
              <p className="text-xs font-dm text-stone-500 mt-1">{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
          <Search size={14} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ingrediente o almacén..."
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
          />
        </div>

        {/* Tipo */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200 shadow-sm">
          {[
            { v: "all", l: "Todos" },
            { v: "AGOTADO", l: "Agotados" },
            { v: "STOCK_BAJO", l: "Stock bajo" },
            { v: "VENCIMIENTO", l: "Vencimientos" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltroTipo(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-dm font-medium transition-all whitespace-nowrap ${filtroTipo === v ? "bg-amber-500 text-white shadow-sm" : "text-stone-400 hover:text-stone-700"}`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Estado */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200 shadow-sm">
          {[
            { v: "PENDIENTE", l: "Pendientes" },
            { v: "RESUELTO", l: "Resueltas" },
            { v: "IGNORADO", l: "Ignoradas" },
            { v: "all", l: "Todas" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltroEstado(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-dm font-medium transition-all whitespace-nowrap ${filtroEstado === v ? "bg-stone-800 text-white shadow-sm" : "text-stone-400 hover:text-stone-700"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Acción masiva — resolver todas las pendientes */}
      {filtroEstado === "PENDIENTE" && filtered.length > 1 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm font-dm text-amber-700">
            <span className="font-semibold">
              {filtered.length} alertas pendientes
            </span>{" "}
            — puedes resolverlas individualmente.
          </p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-stone-200">
          <CheckCircle2 size={28} className="text-emerald-400 mb-3" />
          <p className="font-playfair text-stone-600 font-semibold">
            {filtroEstado === "PENDIENTE"
              ? "Sin alertas pendientes"
              : "Sin alertas en este filtro"}
          </p>
          <p className="text-stone-400 text-sm font-dm mt-1">
            {filtroEstado === "PENDIENTE"
              ? "Todo el inventario está en niveles correctos."
              : "Prueba con otros filtros."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <AlertaCard
              key={a.id}
              alerta={a}
              onResolver={handleResolver}
              onIgnorar={handleIgnorar}
              resolving={resolving}
            />
          ))}
        </div>
      )}
    </div>
  );
}
