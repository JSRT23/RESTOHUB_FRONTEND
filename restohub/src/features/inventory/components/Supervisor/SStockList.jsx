// src/features/inventory/components/Supervisor/SStockList.jsx
//
// Supervisor — vista operativa de inventario.
// SÍ puede:
//   · Ver stock de los almacenes de su restaurante
//   · Ver alertas de stock (agotado / bajo mínimo / por vencer)
//   · Resolver o ignorar alertas
//   · Ver lotes por vencer en los próximos N días
// NO puede:
//   · Ajustar stock (eso es del gerente)
//   · Crear almacenes ni proveedores
//   · Crear/enviar órdenes de compra
//
// Ruta: /supervisor/stock  (tab "Inventario" del supervisor)

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Archive,
  Warehouse,
  RefreshCw,
  Search,
  Clock,
  TrendingDown,
  ChevronRight,
  Bell,
  Eye,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_ALMACENES,
  GET_STOCK,
  GET_ALERTAS,
  GET_LOTES,
} from "../../graphql/queries";
import { RESOLVER_ALERTA, IGNORAR_ALERTA } from "../../graphql/mutations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
} from "../../../../shared/components/ui";

// ── Paleta ─────────────────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

// ── Helpers ────────────────────────────────────────────────────────────────
function NivelBar({ pct, agotado, bajo }) {
  const color = agotado ? "#ef4444" : bajo ? "#f59e0b" : G[300];
  const w = Math.min(100, Math.max(0, pct ?? 0));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${w}%`, background: color }}
        />
      </div>
      <span
        className="text-[10px] font-dm font-semibold w-8 text-right"
        style={{ color }}
      >
        {w.toFixed(0)}%
      </span>
    </div>
  );
}

function fmtFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN: STOCK
// ═══════════════════════════════════════════════════════════════════════════

function StockRow({ item }) {
  const agotado = item.estaAgotado;
  const bajo = !agotado && item.necesitaReposicion;

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${agotado ? "bg-red-500" : bajo ? "bg-amber-400" : "bg-emerald-500"}`}
          />
          <div>
            <p className="text-sm font-dm font-semibold text-stone-800 leading-tight">
              {item.nombreIngrediente}
            </p>
            <p className="text-[10px] font-dm text-stone-400 mt-0.5">
              {item.almacenNombre}
            </p>
          </div>
        </div>
      </td>

      <td className="py-3.5 px-3 text-sm font-dm text-stone-700">
        <span className="font-semibold">
          {parseFloat(item.cantidadActual).toFixed(2)}
        </span>
        <span className="text-stone-400 text-xs ml-1">{item.unidadMedida}</span>
      </td>

      <td className="py-3.5 px-3 min-w-[160px]">
        <div className="text-[10px] font-dm text-stone-400 mb-1">
          mín {parseFloat(item.nivelMinimo).toFixed(1)} · máx{" "}
          {parseFloat(item.nivelMaximo).toFixed(1)}
        </div>
        <NivelBar pct={item.porcentajeStock} agotado={agotado} bajo={bajo} />
      </td>

      <td className="py-3.5 pr-5 pl-3">
        <Badge variant={agotado ? "red" : bajo ? "amber" : "green"} size="xs">
          {agotado ? (
            <>
              <XCircle size={9} /> Agotado
            </>
          ) : bajo ? (
            <>
              <AlertTriangle size={9} /> Bajo mínimo
            </>
          ) : (
            <>
              <CheckCircle2 size={9} /> OK
            </>
          )}
        </Badge>
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN: ALERTAS
// ═══════════════════════════════════════════════════════════════════════════

function AlertaRow({ alerta, onResolver, onIgnorar, actuando }) {
  const tipo = {
    STOCK_BAJO: {
      label: "Stock bajo",
      bg: "#fffbeb",
      text: "#d97706",
      border: "#fde68a",
      Icon: TrendingDown,
    },
    VENCIMIENTO: {
      label: "Vencimiento",
      bg: "#fff7ed",
      text: "#ea580c",
      border: "#fed7aa",
      Icon: Clock,
    },
    AGOTADO: {
      label: "Agotado",
      bg: "#fef2f2",
      text: "#dc2626",
      border: "#fecaca",
      Icon: XCircle,
    },
  }[alerta.tipoAlerta] ?? {
    label: alerta.tipoAlerta,
    bg: G[50],
    text: G[300],
    border: G[100],
    Icon: Bell,
  };

  const { Icon } = tipo;
  const loading = actuando === alerta.id;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all"
      style={{ background: tipo.bg, borderColor: tipo.border }}
    >
      <Icon
        size={14}
        style={{ color: tipo.text }}
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-dm font-semibold"
            style={{ color: tipo.text }}
          >
            {tipo.label}
          </span>
          <span className="text-xs font-dm text-stone-600 truncate">
            {alerta.nombreIngrediente ?? alerta.ingredienteId}
          </span>
          {alerta.almacenNombre && (
            <span className="text-[10px] font-dm text-stone-400">
              · {alerta.almacenNombre}
            </span>
          )}
        </div>
        <p className="text-[10px] font-dm text-stone-400 mt-0.5">
          Nivel actual: {alerta.nivelActual} · Mínimo: {alerta.nivelMinimo}
          {" · "}
          {fmtFecha(alerta.fechaAlerta)}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onResolver(alerta)}
          disabled={loading}
          className="flex items-center gap-1 text-[10px] font-dm font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 bg-white hover:bg-stone-50 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="w-3 h-3 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircle2 size={10} />
          )}
          Resolver
        </button>
        <button
          onClick={() => onIgnorar(alerta)}
          disabled={loading}
          className="text-[10px] font-dm text-stone-400 hover:text-stone-600 px-2 py-1.5 transition-colors disabled:opacity-50"
        >
          Ignorar
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN: LOTES POR VENCER
// ═══════════════════════════════════════════════════════════════════════════

function LoteRow({ lote }) {
  const dias = lote.diasParaVencer;
  const urgente = dias !== null && dias <= 3;
  const proximo = dias !== null && dias > 3 && dias <= 7;

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
      <td className="py-3 pl-5 pr-3">
        <p className="text-sm font-dm font-semibold text-stone-800">
          {lote.ingredienteNombre}
        </p>
        <p className="text-[10px] font-dm text-stone-400 mt-0.5">
          Lote: {lote.numeroLote}
        </p>
      </td>
      <td className="py-3 px-3 text-sm font-dm text-stone-600">
        {lote.almacenNombre}
      </td>
      <td className="py-3 px-3 text-sm font-dm text-stone-600">
        {parseFloat(lote.cantidadActual).toFixed(2)} {lote.unidadMedida}
      </td>
      <td className="py-3 px-3 text-sm font-dm text-stone-600">
        {fmtFecha(lote.fechaVencimiento)}
      </td>
      <td className="py-3 pr-5 pl-3">
        {dias !== null ? (
          <span
            className="text-xs font-dm font-semibold px-2 py-1 rounded-full"
            style={
              urgente
                ? { background: "#fef2f2", color: "#dc2626" }
                : proximo
                  ? { background: "#fffbeb", color: "#d97706" }
                  : { background: G[50], color: G[300] }
            }
          >
            {dias === 0 ? "Hoy" : dias < 0 ? "Vencido" : `${dias} días`}
          </span>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

export default function SStockList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [filtroAlmacen, setFiltroAlmacen] = useState("");
  const [actuando, setActuando] = useState(null);

  // Almacenes del restaurante
  const { data: almData } = useQuery(GET_ALMACENES, {
    variables: { restauranteId },
    fetchPolicy: "cache-and-network",
  });

  // Stock
  const {
    data: stockData,
    loading: stockLoading,
    refetch: refetchStock,
  } = useQuery(GET_STOCK, {
    variables: { almacenId: filtroAlmacen || undefined },
    fetchPolicy: "cache-and-network",
    pollInterval: 120000,
  });

  // Alertas pendientes
  const {
    data: alertasData,
    loading: alertasLoading,
    refetch: refetchAlertas,
  } = useQuery(GET_ALERTAS, {
    variables: { estado: "PENDIENTE", restauranteId },
    fetchPolicy: "cache-and-network",
    pollInterval: 60000,
  });

  // Lotes por vencer en 7 días
  const { data: lotesData, loading: lotesLoading } = useQuery(GET_LOTES, {
    variables: { porVencer: 7 },
    fetchPolicy: "cache-and-network",
    pollInterval: 300000,
  });

  const [resolverAlerta] = useMutation(RESOLVER_ALERTA, {
    refetchQueries: ["GetAlertas"],
  });
  const [ignorarAlerta] = useMutation(IGNORAR_ALERTA, {
    refetchQueries: ["GetAlertas"],
  });

  const almacenes = almData?.almacenes ?? [];
  const stock = stockData?.stock ?? [];
  const alertas = alertasData?.alertasStock ?? [];
  const lotes = (lotesData?.lotes ?? []).filter(
    (l) => !l.estaVencido && l.diasParaVencer != null && l.diasParaVencer <= 7,
  );

  const agotados = stock.filter((s) => s.estaAgotado).length;
  const bajos = stock.filter(
    (s) => !s.estaAgotado && s.necesitaReposicion,
  ).length;

  const filteredStock = useMemo(() => {
    const q = search.toLowerCase().trim();
    return stock.filter((s) => {
      if (
        q &&
        !s.nombreIngrediente.toLowerCase().includes(q) &&
        !s.almacenNombre.toLowerCase().includes(q)
      )
        return false;
      if (filtroAlmacen && s.almacen !== filtroAlmacen) return false;
      if (filtroEstado === "agotado" && !s.estaAgotado) return false;
      if (filtroEstado === "bajo" && (s.estaAgotado || !s.necesitaReposicion))
        return false;
      if (filtroEstado === "ok" && (s.estaAgotado || s.necesitaReposicion))
        return false;
      return true;
    });
  }, [stock, search, filtroAlmacen, filtroEstado]);

  const handleResolver = async (alerta) => {
    setActuando(alerta.id);
    try {
      const { data } = await resolverAlerta({ variables: { id: alerta.id } });
      if (!data?.resolverAlerta?.ok)
        throw new Error(data?.resolverAlerta?.error ?? "Error");
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Alerta resuelta",
        timer: 1200,
        timerProgressBar: true,
        confirmButtonColor: G[900],
      });
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setActuando(null);
    }
  };

  const handleIgnorar = async (alerta) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      title: "¿Ignorar alerta?",
      text: "La alerta se marcará como ignorada y no aparecerá más.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: G[900],
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: "Ignorar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    setActuando(alerta.id);
    try {
      const { data } = await ignorarAlerta({ variables: { id: alerta.id } });
      if (!data?.ignorarAlerta?.ok)
        throw new Error(data?.ignorarAlerta?.error ?? "Error");
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setActuando(null);
    }
  };

  const refetch = () => {
    refetchStock();
    refetchAlertas();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Supervisor"
        title="Inventario"
        description="Stock de tu restaurante — alertas, niveles y lotes próximos a vencer."
        action={
          <div className="flex items-center gap-2">
            {(agotados > 0 || alertas.length > 0) && (
              <span
                className="hidden sm:flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-xl border"
                style={{
                  background: "#fef2f2",
                  borderColor: "#fecaca",
                  color: "#dc2626",
                }}
              >
                <AlertTriangle size={12} />
                {agotados > 0 &&
                  `${agotados} agotado${agotados !== 1 ? "s" : ""}`}
                {agotados > 0 && alertas.length > 0 && " · "}
                {alertas.length > 0 &&
                  `${alertas.length} alerta${alertas.length !== 1 ? "s" : ""}`}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              title="Recargar"
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Agotados",
            n: agotados,
            style:
              agotados > 0
                ? { background: "#fef2f2", borderColor: "#fecaca" }
                : { background: "#f5f5f4", borderColor: "#e5e5e5" },
            textColor: agotados > 0 ? "#dc2626" : "#a8a29e",
            filter: "agotado",
          },
          {
            label: "Bajo mínimo",
            n: bajos,
            style:
              bajos > 0
                ? { background: "#fffbeb", borderColor: "#fde68a" }
                : { background: "#f5f5f4", borderColor: "#e5e5e5" },
            textColor: bajos > 0 ? "#d97706" : "#a8a29e",
            filter: "bajo",
          },
          {
            label: "Lotes por vencer",
            n: lotes.length,
            style:
              lotes.length > 0
                ? { background: "#fff7ed", borderColor: "#fed7aa" }
                : { background: G[50], borderColor: G[100] },
            textColor: lotes.length > 0 ? "#ea580c" : G[300],
            filter: null,
          },
        ].map(({ label, n, style, textColor, filter }) => (
          <button
            key={label}
            onClick={() =>
              filter &&
              setFiltroEstado(filtroEstado === filter ? "all" : filter)
            }
            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${filter ? "hover:-translate-y-0.5" : "cursor-default"}`}
            style={{ ...style, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <div>
              <p
                className="text-2xl font-playfair font-bold"
                style={{ color: textColor }}
              >
                {n}
              </p>
              <p
                className="text-[10px] font-dm font-semibold"
                style={{ color: textColor }}
              >
                {label}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* ══ ALERTAS ══ */}
      {alertas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-playfair text-lg font-bold text-stone-800">
              Alertas de stock
            </h2>
            <span
              className="text-[10px] font-dm font-semibold px-2 py-1 rounded-full"
              style={{ background: "#fef2f2", color: "#dc2626" }}
            >
              {alertas.length}
            </span>
          </div>
          {alertasLoading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : (
            <div className="space-y-2">
              {alertas.map((a) => (
                <AlertaRow
                  key={a.id}
                  alerta={a}
                  onResolver={handleResolver}
                  onIgnorar={handleIgnorar}
                  actuando={actuando}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══ STOCK ══ */}
      <section className="space-y-4">
        <h2 className="font-playfair text-lg font-bold text-stone-800">
          Niveles de stock
        </h2>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div
            className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200"
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

          {almacenes.length > 1 && (
            <select
              value={filtroAlmacen}
              onChange={(e) => setFiltroAlmacen(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none cursor-pointer"
            >
              <option value="">Todos los almacenes</option>
              {almacenes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
            {[
              { v: "all", l: "Todos" },
              { v: "agotado", l: "Agotados" },
              { v: "bajo", l: "Bajo mínimo" },
              { v: "ok", l: "OK" },
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

        {stockLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : filteredStock.length === 0 ? (
          <EmptyState
            icon={Package}
            title={search ? "Sin resultados" : "Sin stock registrado"}
            description={
              search
                ? `Sin coincidencias para "${search}".`
                : "No hay stock registrado en tu restaurante."
            }
          />
        ) : (
          <div
            className="bg-white border border-stone-200 rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  {["Ingrediente · Almacén", "Cantidad", "Nivel", "Estado"].map(
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
                {filteredStock.map((item) => (
                  <StockRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ══ LOTES POR VENCER ══ */}
      {lotes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="font-playfair text-lg font-bold text-stone-800">
              Lotes próximos a vencer
            </h2>
            <span
              className="text-[10px] font-dm font-semibold px-2 py-1 rounded-full"
              style={{ background: "#fff7ed", color: "#ea580c" }}
            >
              próximos 7 días
            </span>
          </div>

          {lotesLoading ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : (
            <div
              className="bg-white border border-stone-200 rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    {[
                      "Ingrediente",
                      "Almacén",
                      "Cantidad",
                      "Vence",
                      "Días",
                    ].map((l) => (
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
                  {lotes.map((l) => (
                    <LoteRow key={l.id} lote={l} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
