// src/features/orders/components/Cajero/CCobrar.jsx
// Cajero — punto de venta (TPV).
// Flujo completo:
//   1. Lista de pedidos LISTOS del restaurante
//   2. Seleccionar pedido → ver ítems y total
//   3. Buscar cliente (opcional) → ver puntos disponibles
//   4. Aplicar descuento: cupón o canjear puntos
//   5. Seleccionar método de pago
//   6. Cobrar → acumular puntos al cliente si aplica
// Ruta: /caja

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  Banknote,
  CreditCard,
  Smartphone,
  Search,
  User,
  Tag,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
  Ticket,
  Coins,
  Receipt,
  ArrowLeft,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_PEDIDOS,
  GET_PEDIDO,
  ENTREGAR_PEDIDO,
} from "../../graphql/operations";
import {
  GET_PUNTOS_CLIENTE,
  ACUMULAR_PUNTOS,
  CANJEAR_PUNTOS,
} from "../../../loyalty/graphql/operations";
import {
  VALIDAR_CUPON,
  CANJEAR_CUPON,
} from "../../../loyalty/graphql/operations";
import {
  PageHeader,
  Button,
  Skeleton,
  EmptyState,
  Badge,
} from "../../../../shared/components/ui";
import { gql } from "@apollo/client";

// Query ligera para obtener imágenes de platos (fallback si imagenPlato no viene en el detalle)
const GET_PLATOS_IMG = gql`
  query GetPlatosImg($disponibles: ID, $activo: Boolean) {
    platos(disponibles: $disponibles, activo: $activo) {
      id
      imagen
    }
  }
`;

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const fmtMoney = (n, moneda = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(n ?? 0);
const fmtHora = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const METODOS_PAGO = [
  { id: "efectivo", label: "Efectivo", icon: Banknote, color: "#16a34a" },
  { id: "tarjeta", label: "Tarjeta", icon: CreditCard, color: "#2563eb" },
  { id: "nequi", label: "Nequi", icon: Smartphone, color: "#7c3aed" },
  { id: "daviplata", label: "Daviplata", icon: Smartphone, color: "#dc2626" },
  {
    id: "transferencia",
    label: "Transferencia",
    icon: Receipt,
    color: "#0891b2",
  },
];

// Puntos que se acumulan: 1 pto por cada 1000 COP
const calcularPuntos = (total, moneda) => {
  if (moneda === "COP") return Math.floor(total / 1000);
  if (moneda === "USD") return Math.floor(total * 3);
  return Math.floor(total);
};

// ── Lista de pedidos listos ────────────────────────────────────────────────
function ListaPedidosListos({ pedidos, loading, onSeleccionar }) {
  const [search, setSearch] = useState("");

  const filtrados = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return pedidos;
    return pedidos.filter(
      (p) =>
        String(p.numeroDia ?? "").includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.mesaId && p.mesaId.toLowerCase().includes(q)),
    );
  }, [pedidos, search]);

  if (loading)
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );

  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 max-w-sm"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <Search size={13} className="text-stone-300 shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por # pedido o mesa..."
          className="flex-1 bg-transparent text-sm font-dm text-stone-800 placeholder:text-stone-300 outline-none"
        />
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="Sin pedidos para cobrar"
          description="Los pedidos aparecen aquí cuando cocina los marca como listos."
        />
      ) : (
        <div className="space-y-2">
          {filtrados.map((p) => (
            <button
              key={p.id}
              onClick={() => onSeleccionar(p)}
              className="w-full flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-stone-200 hover:border-stone-300 hover:-translate-y-0.5 transition-all text-left group"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: G[50] }}
              >
                <Banknote size={16} style={{ color: G[300] }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg">
                    {p.numeroDia
                      ? `Pedido #${p.numeroDia}`
                      : `#${p.id.slice(-8).toUpperCase()}`}
                  </span>
                  {p.mesaId && (
                    <Badge variant="muted" size="xs">
                      <Tag size={8} /> Mesa
                    </Badge>
                  )}
                  <Badge variant="green" size="xs">
                    <CheckCircle2 size={9} /> Listo
                  </Badge>
                </div>
                <p className="text-xs font-dm text-stone-400 mt-1">
                  {fmtHora(p.fechaCreacion)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-playfair text-lg font-bold text-stone-900">
                  {fmtMoney(p.total, p.moneda)}
                </p>
              </div>
              <ChevronRight
                size={14}
                className="text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Panel de cobro ─────────────────────────────────────────────────────────
function PanelCobro({ pedidoId, onVolver, restauranteId }) {
  const { user } = useAuth();

  const [clienteId, setClienteId] = useState("");
  const [clienteBuscado, setClienteBuscado] = useState("");
  const [codigoCupon, setCodigoCupon] = useState("");
  const [cuponValidado, setCuponValidado] = useState(null);
  const [puntosACanjear, setPuntosACanjear] = useState(0);
  const [metodoPago, setMetodoPago] = useState("");
  const [cobrando, setCobrando] = useState(false);
  const [validandoCupon, setValidandoCupon] = useState(false);

  // Pedido completo
  const { data: pedidoData, loading: pedidoLoading } = useQuery(GET_PEDIDO, {
    variables: { id: pedidoId },
    fetchPolicy: "cache-and-network",
  });

  // Imágenes de platos — para mostrar en el detalle del pedido
  const { data: platosImgData } = useQuery(GET_PLATOS_IMG, {
    variables: { disponibles: restauranteId, activo: true },
    skip: !restauranteId,
    fetchPolicy: "cache-first",
  });
  const imagenMap = useMemo(() => {
    const map = {};
    (platosImgData?.platos ?? []).forEach((p) => {
      map[p.id] = p.imagen;
    });
    return map;
  }, [platosImgData]);

  // Puntos del cliente (si se buscó)
  const {
    data: puntosData,
    loading: puntosLoading,
    refetch: refetchPuntos,
  } = useQuery(GET_PUNTOS_CLIENTE, {
    variables: { clienteId: clienteBuscado },
    skip: !clienteBuscado,
    fetchPolicy: "network-only",
  });

  // Validar cupón
  const { data: cuponData, refetch: refetchCupon } = useQuery(VALIDAR_CUPON, {
    variables: { codigo: codigoCupon.trim().toUpperCase() },
    skip: true, // solo se llama manualmente
    fetchPolicy: "network-only",
  });

  const [acumularPuntos] = useMutation(ACUMULAR_PUNTOS);
  const [canjearPuntos] = useMutation(CANJEAR_PUNTOS);
  const [canjearCupon] = useMutation(CANJEAR_CUPON);
  const [entregarPedido] = useMutation(ENTREGAR_PEDIDO, {
    refetchQueries: ["GetPedidos"],
  });

  const pedido = pedidoData?.pedido;
  const puntosCliente = puntosData?.puntosCliente;
  const moneda = pedido?.moneda ?? "COP";

  // Cálculo de descuentos y total
  const descuentoCupon = cuponValidado
    ? cuponValidado.tipoDescuento === "porcentaje"
      ? Math.round(((pedido?.total ?? 0) * cuponValidado.valorDescuento) / 100)
      : cuponValidado.valorDescuento
    : 0;

  const valorPorPunto = moneda === "COP" ? 10 : 0.003; // 10 COP / punto
  const descuentoPuntos = Math.round(puntosACanjear * valorPorPunto);
  const totalDescuentos = descuentoCupon + descuentoPuntos;
  const totalFinal = Math.max(0, (pedido?.total ?? 0) - totalDescuentos);
  const puntosAGanar = calcularPuntos(totalFinal, moneda);

  const puntosDisponibles = puntosCliente?.saldo ?? 0;
  const maxPuntosCanjeables = Math.min(
    puntosDisponibles,
    Math.floor(((pedido?.total ?? 0) * 0.3) / valorPorPunto), // max 30% con puntos
  );

  const handleBuscarCliente = () => {
    if (!clienteId.trim()) return;
    setClienteBuscado(clienteId.trim());
  };

  const handleValidarCupon = async () => {
    if (!codigoCupon.trim()) return;
    setValidandoCupon(true);
    try {
      const { data } = await refetchCupon({
        codigo: codigoCupon.trim().toUpperCase(),
      });
      const cupon = data?.validarCupon;
      if (!cupon?.disponible) {
        Swal.fire({
          background: "#fff",
          icon: "warning",
          title: "Cupón no válido",
          text: "El cupón no existe, ya fue usado o está vencido.",
          confirmButtonColor: G[900],
        });
        return;
      }
      setCuponValidado(cupon);
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setValidandoCupon(false);
    }
  };

  const handleCobrar = async () => {
    if (!metodoPago || !pedido) return;
    setCobrando(true);
    try {
      // 1. Canjear cupón si aplica
      if (cuponValidado) {
        await canjearCupon({
          variables: { id: cuponValidado.id, pedidoId: pedido.id },
        });
      }

      // 2. Canjear puntos si aplica
      if (puntosACanjear > 0 && clienteBuscado) {
        await canjearPuntos({
          variables: {
            clienteId: clienteBuscado,
            puntos: puntosACanjear,
            pedidoId: pedido.id,
            descripcion: "Canje en cobro",
          },
        });
      }

      // 3. Entregar el pedido (LISTO → ENTREGADO)

      // 4. Acumular puntos al cliente
      if (clienteBuscado && puntosAGanar > 0) {
        await acumularPuntos({
          variables: {
            clienteId: clienteBuscado,
            puntos: puntosAGanar,
            pedidoId: pedido.id,
            restauranteId,
            descripcion: `Compra #${pedido.id.slice(-8).toUpperCase()}`,
          },
        });
      }

      // 5. Marcar como entregado
      await entregarPedido({
        variables: {
          id: pedido.id,
          metodoPago,
          descripcion: `Cobrado · ${METODOS_PAGO.find((m) => m.id === metodoPago)?.label ?? metodoPago}`,
        },
      });

      await Swal.fire({
        background: "#fff",
        icon: "success",
        title: "¡Cobro exitoso!",
        html: `
          <div style="font-family:'DM Sans';color:#78716c;text-align:left;line-height:1.8">
            <p>Pedido <b>${pedido.numeroDia ? `#${pedido.numeroDia}` : `#${pedido.id.slice(-8).toUpperCase()}`}</b></p>
            <p>Total cobrado: <b>${fmtMoney(totalFinal, moneda)}</b></p>
            <p>Método: <b>${METODOS_PAGO.find((m) => m.id === metodoPago)?.label}</b></p>
            ${
              clienteBuscado && puntosAGanar > 0
                ? `<p style="color:${G[300]}">+${puntosAGanar} puntos acumulados</p>`
                : ""
            }
          </div>`,
        confirmButtonColor: G[900],
        confirmButtonText: "Nuevo cobro",
      });
      onVolver();
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error al cobrar",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setCobrando(false);
    }
  };

  if (pedidoLoading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  if (!pedido) return null;

  const icls =
    "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all";
  const fi = (e) => {
    e.target.style.borderColor = "transparent";
    e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
  };
  const fb = (e) => {
    e.target.style.borderColor = "#e2e8f0";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="space-y-5">
      {/* Volver */}
      <button
        onClick={onVolver}
        className="flex items-center gap-1.5 text-sm font-dm font-semibold text-stone-500 hover:text-stone-800 transition-colors"
      >
        <ArrowLeft size={14} /> Volver a pedidos
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Columna izquierda — Ítems del pedido */}
        <div className="space-y-4">
          <div
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            <div
              className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between"
              style={{ background: G[50] }}
            >
              <span
                className="text-sm font-dm font-bold"
                style={{ color: G[900] }}
              >
                {pedido.numeroDia
                  ? `Pedido #${pedido.numeroDia}`
                  : `Pedido #${pedido.id.slice(-8).toUpperCase()}`}
              </span>
              <span className="text-[10px] font-dm text-stone-400">
                {fmtHora(pedido.fechaCreacion)}
              </span>
            </div>
            <div className="divide-y divide-stone-100">
              {pedido.detalles?.map((d) => {
                const img = d.imagenPlato || imagenMap[d.platoId];
                return (
                  <div key={d.id} className="flex items-stretch gap-0">
                    {/* Imagen cuadrada grande */}
                    <div
                      className="w-24 h-24 shrink-0 overflow-hidden relative"
                      style={{ background: "#f5f5f4" }}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={d.nombrePlato}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg,${G[50]},${G[100]}33)`,
                          }}
                        >
                          <span className="text-3xl">🍽</span>
                        </div>
                      )}
                      {/* Badge cantidad sobre la imagen */}
                      <span
                        className="absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ background: G[900] }}
                      >
                        {d.cantidad}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between">
                      <div>
                        <p className="text-sm font-dm font-bold text-stone-900 leading-snug">
                          {d.nombrePlato}
                        </p>
                        {d.notas && (
                          <p className="text-[11px] font-dm text-amber-600 italic mt-0.5 truncate">
                            "{d.notas}"
                          </p>
                        )}
                      </div>
                      <div className="flex items-end justify-between gap-2 mt-1">
                        <div>
                          <p className="text-[11px] font-dm text-stone-400">
                            {fmtMoney(d.precioUnitario, moneda)} c/u
                          </p>
                          {d.cantidad > 1 && (
                            <p className="text-[10px] font-dm text-stone-400">
                              {d.cantidad} ×{" "}
                              {fmtMoney(d.precioUnitario, moneda)}
                            </p>
                          )}
                        </div>
                        <p className="font-playfair text-base font-bold text-stone-900 shrink-0">
                          {fmtMoney(d.subtotal, moneda)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className="px-4 py-3 border-t border-stone-100 flex items-center justify-between"
              style={{ background: "#fafafa" }}
            >
              <span className="text-sm font-dm font-semibold text-stone-500">
                Subtotal
              </span>
              <span
                className="font-playfair text-xl font-bold"
                style={{ color: G[900] }}
              >
                {fmtMoney(pedido.total, moneda)}
              </span>
            </div>
          </div>

          {/* Descuentos aplicados */}
          {(descuentoCupon > 0 || descuentoPuntos > 0) && (
            <div
              className="px-4 py-3 rounded-xl border space-y-1.5"
              style={{ background: G[50], borderColor: G[100] }}
            >
              {descuentoCupon > 0 && (
                <div className="flex items-center justify-between text-sm font-dm">
                  <span
                    className="flex items-center gap-1.5"
                    style={{ color: G[300] }}
                  >
                    <Ticket size={12} /> Cupón {cuponValidado.codigo}
                  </span>
                  <span className="font-semibold" style={{ color: G[300] }}>
                    -{fmtMoney(descuentoCupon, moneda)}
                  </span>
                </div>
              )}
              {descuentoPuntos > 0 && (
                <div className="flex items-center justify-between text-sm font-dm">
                  <span
                    className="flex items-center gap-1.5"
                    style={{ color: G[300] }}
                  >
                    <Coins size={12} /> {puntosACanjear} puntos canjeados
                  </span>
                  <span className="font-semibold" style={{ color: G[300] }}>
                    -{fmtMoney(descuentoPuntos, moneda)}
                  </span>
                </div>
              )}
              <div
                className="flex items-center justify-between pt-1 border-t"
                style={{ borderColor: G[100] }}
              >
                <span
                  className="text-sm font-dm font-bold"
                  style={{ color: G[900] }}
                >
                  Total a cobrar
                </span>
                <span
                  className="font-playfair text-2xl font-bold"
                  style={{ color: G[300] }}
                >
                  {fmtMoney(totalFinal, moneda)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha — Cliente, descuentos y cobro */}
        <div className="space-y-4">
          {/* Buscar cliente */}
          <div
            className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <p className="text-xs font-dm font-bold text-stone-500 uppercase tracking-wide">
              Cliente (opcional)
            </p>
            <div className="flex gap-2">
              <input
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuscarCliente()}
                placeholder="UUID del cliente..."
                className={icls + " flex-1"}
                onFocus={fi}
                onBlur={fb}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleBuscarCliente}
                disabled={!clienteId.trim()}
              >
                <Search size={13} />
              </Button>
            </div>

            {puntosLoading && (
              <p className="text-xs font-dm text-stone-400">Buscando...</p>
            )}

            {puntosCliente && (
              <div className="space-y-2">
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: G[50], border: `1px solid ${G[100]}` }}
                >
                  <div className="flex items-center gap-2">
                    <Coins size={13} style={{ color: G[300] }} />
                    <span
                      className="text-sm font-dm font-semibold"
                      style={{ color: G[500] }}
                    >
                      {puntosCliente.saldo.toLocaleString("es-CO")} puntos
                    </span>
                  </div>
                  <Badge variant="green" size="xs">
                    {puntosCliente.nivelDisplay}
                  </Badge>
                </div>

                {puntosDisponibles > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-dm text-stone-500">
                      Canjear puntos (máx {maxPuntosCanjeables.toLocaleString()}{" "}
                      = {fmtMoney(maxPuntosCanjeables * valorPorPunto, moneda)})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={maxPuntosCanjeables}
                      step="10"
                      value={puntosACanjear}
                      onChange={(e) =>
                        setPuntosACanjear(
                          Math.min(
                            maxPuntosCanjeables,
                            parseInt(e.target.value) || 0,
                          ),
                        )
                      }
                      className={icls}
                      onFocus={fi}
                      onBlur={fb}
                    />
                  </div>
                )}

                {puntosAGanar > 0 && (
                  <p
                    className="text-xs font-dm font-semibold"
                    style={{ color: G[300] }}
                  >
                    <Star size={10} className="inline mr-1" />
                    El cliente ganará +{puntosAGanar} puntos con esta compra
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Cupón */}
          <div
            className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <p className="text-xs font-dm font-bold text-stone-500 uppercase tracking-wide">
              Cupón de descuento
            </p>
            {cuponValidado ? (
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: G[50], border: `1px solid ${G[100]}` }}
              >
                <div className="flex items-center gap-2">
                  <Ticket size={13} style={{ color: G[300] }} />
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: G[300] }}
                  >
                    {cuponValidado.codigo}
                  </span>
                  <span className="text-xs font-dm text-stone-500">
                    -
                    {cuponValidado.tipoDescuento === "porcentaje"
                      ? `${cuponValidado.valorDescuento}%`
                      : fmtMoney(cuponValidado.valorDescuento, moneda)}
                  </span>
                </div>
                <button
                  onClick={() => setCuponValidado(null)}
                  className="text-stone-300 hover:text-stone-500 transition-colors"
                >
                  <XCircle size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={codigoCupon}
                  onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleValidarCupon()}
                  placeholder="Código del cupón..."
                  className={icls + " flex-1 font-mono"}
                  onFocus={fi}
                  onBlur={fb}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleValidarCupon}
                  loading={validandoCupon}
                  disabled={!codigoCupon.trim()}
                >
                  Aplicar
                </Button>
              </div>
            )}
          </div>

          {/* Método de pago */}
          <div
            className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <p className="text-xs font-dm font-bold text-stone-500 uppercase tracking-wide">
              Método de pago
            </p>
            <div className="grid grid-cols-3 gap-2">
              {METODOS_PAGO.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => setMetodoPago(id)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: metodoPago === id ? color : "#e5e7eb",
                    background: metodoPago === id ? `${color}10` : "#fff",
                    boxShadow:
                      metodoPago === id ? `0 0 0 2px ${color}33` : "none",
                  }}
                >
                  <Icon
                    size={18}
                    style={{ color: metodoPago === id ? color : "#a8a29e" }}
                  />
                  <span
                    className="text-[10px] font-dm font-semibold"
                    style={{ color: metodoPago === id ? color : "#a8a29e" }}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Botón cobrar */}
          <button
            onClick={handleCobrar}
            disabled={!metodoPago || cobrando}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-base font-dm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: G[900], boxShadow: `0 4px 20px ${G[900]}44` }}
          >
            {cobrando ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Procesando...
              </>
            ) : (
              <>
                <Banknote size={18} /> Cobrar {fmtMoney(totalFinal, moneda)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function CCobrar() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  const { data, loading, refetch } = useQuery(GET_PEDIDOS, {
    variables: { restauranteId, estado: "LISTO" },
    fetchPolicy: "cache-and-network",
    pollInterval: 20000,
  });

  const pedidos = data?.pedidos ?? [];

  if (pedidoSeleccionado)
    return (
      <PanelCobro
        pedidoId={pedidoSeleccionado.id}
        restauranteId={restauranteId}
        onVolver={() => {
          setPedidoSeleccionado(null);
          refetch();
        }}
      />
    );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Cajero"
        title="Cobrar"
        description="Pedidos listos para cobro — actualización cada 20 segundos."
        action={
          <div className="flex items-center gap-2">
            {pedidos.length > 0 && (
              <span
                className="flex items-center gap-1.5 text-xs font-dm font-semibold px-3 py-1.5 rounded-xl border"
                style={{
                  background: G[50],
                  borderColor: G[100],
                  color: G[300],
                }}
              >
                <CheckCircle2 size={12} />
                {pedidos.length} listo{pedidos.length !== 1 ? "s" : ""}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />
      <ListaPedidosListos
        pedidos={pedidos}
        loading={loading}
        onSeleccionar={setPedidoSeleccionado}
      />
    </div>
  );
}
