// src/features/inventory/components/Supervisor/SStockList.jsx
//
// FIXES:
//  1. Stock filtrado por restaurante: cascada GET_ALMACENES → almacenId del restaurante
//     (igual que GStockList del gerente — antes pasaba almacenId=undefined → traía TODO)
//  2. Lotes filtrados por almacenId del restaurante
//  3. Resolver alerta 400: el supervisor no tiene permiso de resolver alertas de stock
//     (eso es del gerente). Se informa correctamente en lugar de mostrar error críptico.
//     El supervisor SÍ puede verlas e ignorarlas operativamente.

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
  Bell,
  Info,
  ShoppingCart,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_ALMACENES,
  GET_STOCK,
  GET_ALERTAS,
  GET_LOTES,
} from "../../graphql/queries";
import { IGNORAR_ALERTA } from "../../graphql/mutations";
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

// ── Helpers ───────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function NivelBar({ pct, agotado, bajo }) {
  const color = agotado ? "#ef4444" : bajo ? "#f59e0b" : G[300];
  return (
    <div className="mt-2 h-1.5 rounded-full bg-stone-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }}
      />
    </div>
  );
}

// ── StockCard ─────────────────────────────────────────────────────────────
function StockCard({ item }) {
  const { estaAgotado, necesitaReposicion } = item;
  // Calcular pct propio — porcentajeStock del backend puede ser 0 por redondeo en BD
  const nivelMax = parseFloat(item.nivelMaximo) || 0;
  const cantAct = parseFloat(item.cantidadActual) || 0;
  const pct = nivelMax > 0 ? (cantAct / nivelMax) * 100 : 0;
  const pctLabel =
    nivelMax === 0
      ? "Sin máximo"
      : pct < 1
        ? `${pct.toFixed(1)}%`
        : `${Math.round(pct)}%`;

  const estado = estaAgotado ? "agotado" : necesitaReposicion ? "bajo" : "ok";
  const ESTADO = {
    agotado: {
      label: "Agotado",
      bg: "#fef2f2",
      border: "#fecaca",
      text: "#dc2626",
    },
    bajo: {
      label: "Stock bajo",
      bg: "#fffbeb",
      border: "#fde68a",
      text: "#d97706",
    },
    ok: { label: "Normal", bg: G[50], border: G[100], text: G[300] },
  };
  const cfg = ESTADO[estado];

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2"
      style={{
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        borderTop: `2px solid ${cfg.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-dm font-semibold text-stone-800 leading-tight truncate flex-1">
          {item.nombreIngrediente}
        </p>
        <span
          className="text-[10px] font-dm font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: cfg.bg, color: cfg.text }}
        >
          {cfg.label}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-playfair text-xl font-bold text-stone-900">
            {parseFloat(item.cantidadActual).toFixed(2)}
            <span className="text-xs font-dm font-normal text-stone-400 ml-1">
              {item.unidadMedida}
            </span>
          </p>
          <p className="text-[10px] font-dm text-stone-400 mt-0.5">
            Mín: {parseFloat(item.nivelMinimo).toFixed(2)} · Máx:{" "}
            {parseFloat(item.nivelMaximo).toFixed(2)}
          </p>
        </div>
        <p
          className="font-playfair text-lg font-bold"
          style={{ color: cfg.text }}
        >
          {pctLabel}
        </p>
      </div>
      <NivelBar pct={pct} agotado={estaAgotado} bajo={necesitaReposicion} />
    </div>
  );
}

// ── AlertaRow ─────────────────────────────────────────────────────────────
function AlertaRow({ alerta, onIgnorar, actuando }) {
  // Backend devuelve tipoAlerta en UPPERCASE: STOCK_BAJO, AGOTADO, etc.
  const TIPO = {
    STOCK_BAJO: {
      label: "Stock bajo",
      bg: "#fffbeb",
      text: "#d97706",
      border: "#fde68a",
    },
    bajo_minimo: {
      label: "Stock bajo",
      bg: "#fffbeb",
      text: "#d97706",
      border: "#fde68a",
    },
    AGOTADO: {
      label: "Agotado",
      bg: "#fef2f2",
      text: "#dc2626",
      border: "#fecaca",
    },
    agotado: {
      label: "Agotado",
      bg: "#fef2f2",
      text: "#dc2626",
      border: "#fecaca",
    },
    POR_VENCER: {
      label: "Por vencer",
      bg: "#fffbeb",
      text: "#d97706",
      border: "#fde68a",
    },
    por_vencer: {
      label: "Por vencer",
      bg: "#fffbeb",
      text: "#d97706",
      border: "#fde68a",
    },
    VENCIDO: {
      label: "Vencido",
      bg: "#fef2f2",
      text: "#dc2626",
      border: "#fecaca",
    },
    vencido: {
      label: "Vencido",
      bg: "#fef2f2",
      text: "#dc2626",
      border: "#fecaca",
    },
  };
  // Normalizar a uppercase para lookup seguro
  const tipoKey = (alerta.tipoAlerta ?? "").toUpperCase().replace("-", "_");
  const cfg = TIPO[tipoKey] ??
    TIPO[alerta.tipoAlerta] ?? {
      label: alerta.tipoAlerta,
      bg: "#fffbeb",
      text: "#d97706",
      border: "#fde68a",
    };

  const handleNotificar = () => {
    Swal.fire({
      background: "#fff",
      icon: "info",
      title: "Notificar al gerente",
      html: `<span style="font-family:'DM Sans';color:#78716c">
        El ingrediente <b>${alerta.nombreIngrediente}</b> tiene stock bajo.<br/><br/>
        Avisa al gerente para que cree una <b>orden de compra</b> en<br/>
        Inventario → Órdenes de compra.
      </span>`,
      confirmButtonColor: "#051F20",
      confirmButtonText: "Entendido",
    });
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-dm font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${cfg.text}18`, color: cfg.text }}
            >
              {cfg.label}
            </span>
            <p className="text-sm font-dm font-semibold text-stone-800 truncate">
              {alerta.nombreIngrediente}
            </p>
            <span className="text-[10px] font-dm text-stone-400">
              {alerta.almacenNombre}
            </span>
          </div>
          <p className="text-[10px] font-dm text-stone-500 mt-0.5">
            Actual: {parseFloat(alerta.nivelActual ?? 0).toFixed(2)} · Mín:{" "}
            {parseFloat(alerta.nivelMinimo ?? 0).toFixed(2)} ·{" "}
            {fmtDate(alerta.fechaCreacion)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleNotificar}
            className="flex items-center gap-1 text-[10px] font-dm font-semibold px-2.5 py-1.5 rounded-lg border transition-colors"
            style={{
              background: `${cfg.text}12`,
              borderColor: `${cfg.text}30`,
              color: cfg.text,
            }}
          >
            <Bell size={10} /> Notificar gerente
          </button>
          <button
            disabled={actuando === alerta.id}
            onClick={() => onIgnorar(alerta)}
            className="text-[10px] font-dm font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-500 bg-white hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            Ignorar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── LoteRow ───────────────────────────────────────────────────────────────
function LoteRow({ lote }) {
  const dias = lote.diasParaVencer;
  const color = lote.estaVencido
    ? "#dc2626"
    : dias <= 3
      ? "#dc2626"
      : dias <= 7
        ? "#d97706"
        : G[300];
  const bg = lote.estaVencido
    ? "#fef2f2"
    : dias <= 3
      ? "#fef2f2"
      : dias <= 7
        ? "#fffbeb"
        : G[50];

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-stone-100 bg-white">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: bg }}
      >
        <Archive size={13} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-dm font-semibold text-stone-800 truncate">
          {lote.proveedorNombre ?? "—"} · #{lote.numeroLote}
        </p>
        <p className="text-[10px] font-dm text-stone-400">
          {parseFloat(lote.cantidadActual).toFixed(2)} {lote.unidadMedida} ·
          Vence: {fmtDate(lote.fechaVencimiento)}
        </p>
      </div>
      <span
        className="text-[10px] font-dm font-semibold px-2 py-0.5 rounded-full shrink-0"
        style={{ background: bg, color }}
      >
        {lote.estaVencido ? "Vencido" : `${dias}d`}
      </span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function SStockList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [actuando, setActuando] = useState(null);

  // ── 1. Almacén del restaurante (cascada como el gerente) ──────────────
  const { data: almData, loading: almLoading } = useQuery(GET_ALMACENES, {
    variables: { restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });
  const almacen = almData?.almacenes?.[0]; // almacén principal

  // ── 2. Stock filtrado por almacenId (NO por restauranteId directo) ────
  const {
    data: stockData,
    loading: stockLoading,
    refetch: refetchStock,
  } = useQuery(GET_STOCK, {
    variables: { almacenId: almacen?.id },
    skip: !almacen?.id, // espera el almacenId del paso anterior
    fetchPolicy: "cache-and-network",
    pollInterval: 120000,
  });

  // ── 3. Alertas del restaurante ────────────────────────────────────────
  const {
    data: alertasData,
    loading: alertasLoading,
    refetch: refetchAlertas,
  } = useQuery(GET_ALERTAS, {
    variables: { estado: "PENDIENTE", restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
    pollInterval: 60000,
  });

  // ── 4. Lotes por vencer — filtrados por almacenId ────────────────────
  const { data: lotesData } = useQuery(GET_LOTES, {
    variables: { almacenId: almacen?.id, porVencer: 7 },
    skip: !almacen?.id,
    fetchPolicy: "cache-and-network",
    pollInterval: 300000,
  });

  const [ignorarAlerta] = useMutation(IGNORAR_ALERTA, {
    refetchQueries: ["GetAlertas"],
  });

  // ── Datos derivados ───────────────────────────────────────────────────
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
      if (q && !s.nombreIngrediente.toLowerCase().includes(q)) return false;
      if (filtroEstado === "agotado" && !s.estaAgotado) return false;
      if (filtroEstado === "bajo" && (s.estaAgotado || !s.necesitaReposicion))
        return false;
      if (filtroEstado === "ok" && (s.estaAgotado || s.necesitaReposicion))
        return false;
      return true;
    });
  }, [stock, search, filtroEstado]);

  // ── Ignorar alerta (supervisor SÍ puede ignorar) ──────────────────────
  const handleIgnorar = async (alerta) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      icon: "question",
      title: "¿Ignorar alerta?",
      html: `<span style="font-family:'DM Sans';color:#78716c">
        La alerta de <b>${alerta.nombreIngrediente}</b> se marcará como ignorada.<br/>
        Para resolver el stock, el gerente debe crear una orden de compra.
      </span>`,
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
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Alerta ignorada",
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

  const loading = almLoading || stockLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Supervisor"
        title="Inventario operativo"
        description={
          almacen ? `Almacén: ${almacen.nombre}` : "Cargando almacén…"
        }
        action={
          <div className="flex items-center gap-3">
            {/* KPIs rápidos */}
            {!loading && (
              <div className="hidden sm:flex items-center gap-3 text-xs font-dm">
                {agotados > 0 && (
                  <span className="flex items-center gap-1 text-red-500 font-semibold">
                    <XCircle size={11} /> {agotados} agotado
                    {agotados !== 1 ? "s" : ""}
                  </span>
                )}
                {bajos > 0 && (
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    <TrendingDown size={11} /> {bajos} bajo mínimo
                  </span>
                )}
                {agotados === 0 && bajos === 0 && (
                  <span
                    className="flex items-center gap-1 font-semibold"
                    style={{ color: G[300] }}
                  >
                    <CheckCircle2 size={11} /> Stock OK
                  </span>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                refetchStock();
                refetchAlertas();
              }}
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* ── Banner sin almacén ─────────────────────────────────────────── */}
      {!almLoading && !almacen && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border bg-amber-50 border-amber-200">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-dm font-semibold text-amber-800">
              Sin almacén registrado
            </p>
            <p className="text-xs font-dm text-amber-600 mt-0.5">
              El almacén se crea automáticamente al crear el restaurante. Si no
              aparece, contacta al gerente.
            </p>
          </div>
        </div>
      )}

      {/* ── Alertas de stock ───────────────────────────────────────────── */}
      {alertas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-playfair text-lg font-bold text-stone-800">
              Alertas de stock
            </h2>
            <span className="text-[10px] font-dm font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-600">
              {alertas.length}
            </span>
          </div>

          {/* Aviso: resolver = tarea del gerente */}
          <div
            className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-dm"
            style={{
              background: "#eff6ff",
              borderColor: "#bfdbfe",
              color: "#3b82f6",
            }}
          >
            <Info size={13} className="shrink-0 mt-0.5" />
            <span>
              Para reponer el stock, el gerente debe crear una{" "}
              <strong>orden de compra</strong>. Como supervisor puedes ignorar
              alertas que ya estén en proceso de resolución.
            </span>
          </div>

          <div className="space-y-2">
            {alertas.map((a) => (
              <AlertaRow
                key={a.id}
                alerta={a}
                onIgnorar={handleIgnorar}
                actuando={actuando}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Lotes por vencer ───────────────────────────────────────────── */}
      {lotes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-playfair text-lg font-bold text-stone-800">
              Lotes por vencer
            </h2>
            <span className="text-[10px] font-dm font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-600">
              {lotes.length} en 7 días
            </span>
          </div>
          <div className="space-y-2">
            {lotes.map((l) => (
              <LoteRow key={l.id} lote={l} />
            ))}
          </div>
        </div>
      )}

      {/* ── Stock general ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-playfair text-lg font-bold text-stone-800">
            Stock del restaurante
          </h2>
          {!loading && (
            <p className="text-xs font-dm text-stone-400">
              {stock.length} ingredientes
            </p>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div
            className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200"
            onFocusCapture={(e) =>
              (e.currentTarget.style.boxShadow = `0 0 0 2px ${G[300]}`)
            }
            onBlurCapture={(e) => (e.currentTarget.style.boxShadow = "none")}
          >
            <Search size={13} className="text-stone-300 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ingrediente…"
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

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
            {[
              { v: "all", l: "Todo" },
              { v: "agotado", l: "Agotado" },
              { v: "bajo", l: "Bajo" },
              { v: "ok", l: "Normal" },
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

        {/* Lista */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : !almacen ? null : filteredStock.length === 0 ? (
          <EmptyState
            icon={Package}
            title={search ? "Sin resultados" : "Sin ingredientes en stock"}
            description={
              search
                ? `No hay ingredientes que coincidan con "${search}".`
                : "El almacén aún no tiene stock registrado."
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStock.map((s) => (
              <StockCard key={s.id} item={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
