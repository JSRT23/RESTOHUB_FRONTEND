// src/features/inventory/components/admin/AAlertasStock.jsx
// Admin Central — alertas de stock de toda la cadena.
// Filtros: restaurante, tipo, estado (pendiente/resuelta).
// Puede resolver e ignorar alertas directamente.

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Bell,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Clock,
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import Swal from "sweetalert2";
import { GET_ALERTAS, GET_ALMACENES } from "../../graphql/queries";
import { RESOLVER_ALERTA, IGNORAR_ALERTA } from "../../graphql/mutations";
import { GET_RESTAURANTES } from "../../../menu/components/admin/graphql/operations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
} from "../../../../shared/components/ui";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const TIPO_META = {
  STOCK_BAJO: {
    label: "Stock bajo",
    bg: "#fffbeb",
    text: "#d97706",
    border: "#fde68a",
    icon: AlertTriangle,
    variant: "amber",
  },
  VENCIMIENTO: {
    label: "Por vencer",
    bg: "#fff7ed",
    text: "#ea580c",
    border: "#fed7aa",
    icon: Clock,
    variant: "amber",
  },
  AGOTADO: {
    label: "Agotado",
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
    icon: XCircle,
    variant: "red",
  },
};

function fmtFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Fila de alerta ─────────────────────────────────────────────────────────
function AlertaRow({ alerta, restaurante, onResolver, onIgnorar, toggling }) {
  const meta = TIPO_META[alerta.tipoAlerta] ?? TIPO_META.STOCK_BAJO;
  const Icon = meta.icon;
  const resuelta = alerta.estado === "RESUELTA" || alerta.estado === "IGNORADA";
  const cargando = toggling === alerta.id;

  return (
    <tr
      className={`border-b border-stone-100 hover:bg-stone-50/60 transition-colors ${resuelta ? "opacity-50" : ""}`}
    >
      {/* Tipo + ingrediente */}
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: meta.bg }}
          >
            <Icon size={12} style={{ color: meta.text }} />
          </div>
          <div>
            <p className="text-sm font-dm font-semibold text-stone-800 leading-tight">
              {alerta.nombreIngrediente ?? "—"}
            </p>
            <p className="text-[10px] font-dm text-stone-400 mt-0.5">
              {alerta.almacenNombre}
            </p>
          </div>
        </div>
      </td>

      {/* Restaurante */}
      <td className="py-3.5 px-3">
        <p className="text-xs font-dm font-semibold text-stone-700 truncate max-w-[130px]">
          {restaurante?.nombre ?? "—"}
        </p>
        <p className="text-[10px] font-dm text-stone-400">
          {restaurante?.ciudad ?? ""}
        </p>
      </td>

      {/* Tipo */}
      <td className="py-3.5 px-3">
        <Badge variant={meta.variant} size="xs">
          {meta.label}
        </Badge>
      </td>

      {/* Nivel */}
      <td className="py-3.5 px-3 hidden md:table-cell">
        {alerta.nivelActual != null ? (
          <div>
            <p
              className="text-xs font-dm font-semibold"
              style={{ color: meta.text }}
            >
              {parseFloat(alerta.nivelActual).toFixed(2)}
            </p>
            {alerta.nivelMinimo != null && (
              <p className="text-[10px] font-dm text-stone-400">
                mín: {parseFloat(alerta.nivelMinimo).toFixed(2)}
              </p>
            )}
          </div>
        ) : (
          <span className="text-stone-300 text-xs">—</span>
        )}
      </td>

      {/* Fecha */}
      <td className="py-3.5 px-3 hidden lg:table-cell">
        <p className="text-[11px] font-dm text-stone-500">
          {fmtFecha(alerta.fechaAlerta)}
        </p>
        {alerta.fechaResolucion && (
          <p className="text-[10px] font-dm text-emerald-600 mt-0.5">
            ✓ {fmtFecha(alerta.fechaResolucion)}
          </p>
        )}
      </td>

      {/* Estado + acciones */}
      <td className="py-3.5 pr-5 pl-3">
        {resuelta ? (
          <Badge
            variant={alerta.estado === "RESUELTA" ? "green" : "default"}
            size="xs"
          >
            {alerta.estado === "RESUELTA" ? (
              <>
                <CheckCircle2 size={9} /> Resuelta
              </>
            ) : (
              <>
                <EyeOff size={9} /> Ignorada
              </>
            )}
          </Badge>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onResolver(alerta)}
              disabled={cargando}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-dm font-semibold border transition-colors disabled:opacity-50"
              style={{ background: G[50], borderColor: G[100], color: G[300] }}
              title="Marcar como resuelta"
            >
              <CheckCircle2 size={10} /> Resolver
            </button>
            <button
              onClick={() => onIgnorar(alerta)}
              disabled={cargando}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-dm font-semibold border border-stone-200 text-stone-500 bg-stone-50 hover:bg-stone-100 transition-colors disabled:opacity-50"
              title="Ignorar alerta"
            >
              <EyeOff size={10} /> Ignorar
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function AAlertasStock() {
  const [search, setSearch] = useState("");
  const [filtroRestaurante, setFiltroRestaurante] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [mostrarResueltas, setMostrarResueltas] = useState(false);
  const [toggling, setToggling] = useState(null);

  const { data, loading, refetch } = useQuery(GET_ALERTAS, {
    variables: mostrarResueltas ? {} : { estado: "PENDIENTE" },
    fetchPolicy: "cache-and-network",
  });

  const { data: almData } = useQuery(GET_ALMACENES, {
    variables: filtroRestaurante ? { restauranteId: filtroRestaurante } : {},
    fetchPolicy: "cache-and-network",
  });

  const { data: restData } = useQuery(GET_RESTAURANTES);

  const [resolverAlerta] = useMutation(RESOLVER_ALERTA, {
    refetchQueries: ["GetAlertas"],
  });
  const [ignorarAlerta] = useMutation(IGNORAR_ALERTA, {
    refetchQueries: ["GetAlertas"],
  });

  const alertas = data?.alertasStock ?? [];
  const almacenes = almData?.almacenes ?? [];
  const restaurantes = restData?.restaurantes ?? [];

  // Map almacén → restauranteId
  const almacenRestauranteMap = useMemo(() => {
    const m = {};
    almacenes.forEach((a) => (m[a.id] = a.restauranteId));
    return m;
  }, [almacenes]);

  const restaurantesMap = useMemo(() => {
    const m = {};
    restaurantes.forEach((r) => (m[r.id] = r));
    return m;
  }, [restaurantes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return alertas.filter((a) => {
      if (q) {
        const match =
          (a.nombreIngrediente ?? "").toLowerCase().includes(q) ||
          (a.almacenNombre ?? "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filtroTipo !== "all" && a.tipoAlerta !== filtroTipo) return false;
      if (filtroRestaurante) {
        // alertas tienen restauranteId directo en el schema
        const restId = a.restauranteId || almacenRestauranteMap[a.almacen];
        if (restId !== filtroRestaurante) return false;
      }
      return true;
    });
  }, [alertas, search, filtroTipo, filtroRestaurante, almacenRestauranteMap]);

  // KPIs
  const pendientes = alertas.filter((a) => a.estado === "PENDIENTE").length;
  const criticas = alertas.filter(
    (a) => a.tipoAlerta === "AGOTADO" && a.estado === "PENDIENTE",
  ).length;
  const advertencias = alertas.filter(
    (a) => a.tipoAlerta !== "AGOTADO" && a.estado === "PENDIENTE",
  ).length;

  const handleResolver = async (alerta) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      icon: "question",
      title: "¿Marcar como resuelta?",
      html: `<span style="font-family:'DM Sans';color:#78716c">Alerta de <b>${alerta.nombreIngrediente}</b> en ${alerta.almacenNombre}.</span>`,
      showCancelButton: true,
      confirmButtonColor: G[900],
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: "Sí, resolver",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    setToggling(alerta.id);
    try {
      const { data: res } = await resolverAlerta({
        variables: { id: alerta.id },
      });
      if (!res?.resolverAlerta?.ok)
        throw new Error(res?.resolverAlerta?.error ?? "Error");
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setToggling(null);
    }
  };

  const handleIgnorar = async (alerta) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      icon: "warning",
      title: "¿Ignorar esta alerta?",
      html: `<span style="font-family:'DM Sans';color:#78716c">La alerta de <b>${alerta.nombreIngrediente}</b> se marcará como ignorada y no aparecerá en el panel.</span>`,
      showCancelButton: true,
      confirmButtonColor: "#d97706",
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: "Sí, ignorar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    setToggling(alerta.id);
    try {
      const { data: res } = await ignorarAlerta({
        variables: { id: alerta.id },
      });
      if (!res?.ignorarAlerta?.ok)
        throw new Error(res?.ignorarAlerta?.error ?? "Error");
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title="Alertas de stock"
        description="Alertas de toda la cadena — ingredientes agotados, bajo mínimo y por vencer."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarResueltas((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-dm font-semibold border transition-all ${
                mostrarResueltas
                  ? "bg-stone-100 border-stone-300 text-stone-700"
                  : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
              }`}
            >
              {mostrarResueltas ? <Eye size={12} /> : <EyeOff size={12} />}
              {mostrarResueltas ? "Ocultar resueltas" : "Ver resueltas"}
            </button>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Pendientes",
            n: pendientes,
            bg: pendientes > 0 ? "#fffbeb" : G[50],
            text: pendientes > 0 ? "#d97706" : G[300],
            border: pendientes > 0 ? "#fde68a" : G[100],
            icon: (
              <Bell
                size={14}
                className={pendientes > 0 ? "text-amber-400" : ""}
                style={{ color: pendientes === 0 ? G[100] : undefined }}
              />
            ),
          },
          {
            label: "Críticas (agotado)",
            n: criticas,
            bg: criticas > 0 ? "#fef2f2" : "#f5f5f4",
            text: criticas > 0 ? "#dc2626" : "#a8a29e",
            border: criticas > 0 ? "#fecaca" : "#e5e5e5",
            icon: (
              <XCircle
                size={14}
                className={criticas > 0 ? "text-red-400" : "text-stone-300"}
              />
            ),
          },
          {
            label: "Advertencias",
            n: advertencias,
            bg: advertencias > 0 ? "#fffbeb" : "#f5f5f4",
            text: advertencias > 0 ? "#d97706" : "#a8a29e",
            border: advertencias > 0 ? "#fde68a" : "#e5e5e5",
            icon: (
              <AlertTriangle
                size={14}
                className={
                  advertencias > 0 ? "text-amber-400" : "text-stone-300"
                }
              />
            ),
          },
        ].map(({ label, n, bg, text, border, icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-3.5 rounded-2xl border"
            style={{
              background: bg,
              borderColor: border,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            {icon}
            <div>
              <p
                className="text-xl font-playfair font-bold"
                style={{ color: text }}
              >
                {n}
              </p>
              <p
                className="text-[10px] font-dm font-semibold"
                style={{ color: text }}
              >
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div
          className="flex items-center gap-2.5 flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl bg-white border border-stone-200"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          onFocusCapture={(e) =>
            (e.currentTarget.style.boxShadow = `0 0 0 2px ${G[300]}`)
          }
          onBlurCapture={(e) =>
            (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)")
          }
        >
          <Search size={13} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ingrediente o almacén..."
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-stone-300 hover:text-stone-500 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={filtroRestaurante}
          onChange={(e) => setFiltroRestaurante(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none cursor-pointer"
        >
          <option value="">Todos los restaurantes</option>
          {restaurantes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>

        {/* Filtro tipo */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
          {[
            { v: "all", l: "Todos" },
            { v: "AGOTADO", l: "Agotados" },
            { v: "STOCK_BAJO", l: "Stock bajo" },
            { v: "VENCIMIENTO", l: "Vencimiento" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltroTipo(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all whitespace-nowrap"
              style={
                filtroTipo === v
                  ? { background: G[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Contador */}
      {!loading && (
        <p className="text-xs font-dm text-stone-400 -mt-2">
          {filtered.length} alerta{filtered.length !== 1 ? "s" : ""}
          {filtroTipo !== "all" &&
            ` · ${TIPO_META[filtroTipo]?.label ?? filtroTipo}`}
          {search && ` — "${search}"`}
        </p>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={
            pendientes === 0 && !mostrarResueltas
              ? "Sin alertas pendientes"
              : "Sin resultados"
          }
          description={
            pendientes === 0 && !mostrarResueltas
              ? "Toda la cadena está en orden. No hay alertas activas."
              : "No hay alertas que coincidan con los filtros actuales."
          }
        />
      ) : (
        <div
          className="bg-white border border-stone-200 rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  {[
                    { l: "Ingrediente · Almacén", cls: "pl-5 pr-3" },
                    { l: "Restaurante", cls: "px-3" },
                    { l: "Tipo", cls: "px-3" },
                    { l: "Nivel", cls: "px-3 hidden md:table-cell" },
                    { l: "Fecha", cls: "px-3 hidden lg:table-cell" },
                    { l: "Acción", cls: "pr-5 pl-3" },
                  ].map(({ l, cls }) => (
                    <th
                      key={l}
                      className={`py-3 text-left text-[10px] font-dm font-semibold text-stone-400 uppercase tracking-wide ${cls}`}
                    >
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <AlertaRow
                    key={a.id}
                    alerta={a}
                    restaurante={
                      restaurantesMap[a.restauranteId] ??
                      restaurantesMap[almacenRestauranteMap[a.almacen]]
                    }
                    onResolver={handleResolver}
                    onIgnorar={handleIgnorar}
                    toggling={toggling}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
