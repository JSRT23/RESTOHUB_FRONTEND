// src/features/orders/components/Mesero/MNuevoPedido.jsx
// Mesero — crear pedido.
// Flujo: seleccionar platos del menú → carrito lateral → confirmar → enviar.
// Ruta: /mesero

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Trash2,
  Send,
  Tag,
  ImageOff,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  StickyNote,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_PLATOS_DISPONIBLES,
  GET_PRECIOS_RESTAURANTE,
  GET_CATEGORIAS_GERENTE,
  GET_MI_RESTAURANTE,
} from "../../../menu/components/Gerente/graphql/operations";
import { CREAR_PEDIDO } from "../../graphql/operations";
import { EmptyState, Skeleton, Badge } from "../../../../shared/components/ui";

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

// ── Tarjeta de plato ───────────────────────────────────────────────────────
function PlatoCard({ plato, precio, moneda, cantidad, onAgregar, onQuitar }) {
  const [notaOpen, setNotaOpen] = useState(false);

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
        cantidad > 0
          ? "border-stone-300 shadow-md -translate-y-0.5"
          : "border-stone-200"
      }`}
      style={{
        boxShadow:
          cantidad > 0
            ? `0 4px 16px rgba(0,0,0,0.1), 0 0 0 2px ${G[100]}`
            : "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {/* Imagen */}
      <div className="relative h-32 bg-stone-100 overflow-hidden">
        {plato.imagen ? (
          <img
            src={plato.imagen}
            alt={plato.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={24} className="text-stone-300" />
          </div>
        )}
        {cantidad > 0 && (
          <div
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-dm text-white"
            style={{ background: G[300] }}
          >
            {cantidad}
          </div>
        )}
        {plato.categoriaNombre && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="default" size="xs">
              <Tag size={8} /> {plato.categoriaNombre}
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <p className="font-playfair text-stone-900 font-bold text-sm leading-tight">
            {plato.nombre}
          </p>
          {precio ? (
            <p
              className="font-dm font-bold text-base mt-0.5"
              style={{ color: G[300] }}
            >
              {fmtMoney(precio, moneda)}
            </p>
          ) : (
            <p className="text-[10px] font-dm text-red-400 mt-0.5">
              Sin precio asignado
            </p>
          )}
        </div>

        {/* Controles */}
        {precio ? (
          <div className="flex items-center gap-2">
            {cantidad > 0 ? (
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => onQuitar(plato)}
                  className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="flex-1 text-center text-sm font-dm font-bold text-stone-800">
                  {cantidad}
                </span>
                <button
                  onClick={() => onAgregar(plato, precio, moneda)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-colors"
                  style={{ background: G[300] }}
                >
                  <Plus size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAgregar(plato, precio, moneda)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-dm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: G[900] }}
              >
                <Plus size={12} /> Agregar
              </button>
            )}
          </div>
        ) : (
          <div className="py-2 text-center text-[10px] font-dm text-stone-300 rounded-xl bg-stone-50">
            No disponible
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ítem de carrito ────────────────────────────────────────────────────────
function CarritoItem({ item, onMas, onMenos, onNota, onEliminar }) {
  const [editNota, setEditNota] = useState(false);
  const [nota, setNota] = useState(item.notas ?? "");

  const guardarNota = () => {
    onNota(item.platoId, nota);
    setEditNota(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-dm font-semibold text-stone-800 truncate">
            {item.nombrePlato}
          </p>
          <p className="text-[10px] font-dm text-stone-400">
            {fmtMoney(item.precioUnitario, item.moneda)} × {item.cantidad}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onMenos(item.platoId)}
            className="w-6 h-6 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:bg-stone-100 transition-colors"
          >
            <Minus size={10} />
          </button>
          <span className="w-5 text-center text-xs font-bold font-dm text-stone-700">
            {item.cantidad}
          </span>
          <button
            onClick={() => onMas(item.platoId)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white transition-colors"
            style={{ background: G[300] }}
          >
            <Plus size={10} />
          </button>
          <button
            onClick={() => onEliminar(item.platoId)}
            className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors ml-1"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
      {/* Nota */}
      <div>
        {editNota ? (
          <div className="flex gap-1">
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: sin cebolla, extra salsa..."
              className="flex-1 text-xs font-dm px-2 py-1.5 rounded-lg border border-stone-200 outline-none"
              onKeyDown={(e) => e.key === "Enter" && guardarNota()}
              autoFocus
            />
            <button
              onClick={guardarNota}
              className="px-2 py-1.5 rounded-lg text-xs font-dm font-semibold text-white"
              style={{ background: G[300] }}
            >
              OK
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditNota(true)}
            className="flex items-center gap-1 text-[10px] font-dm text-stone-400 hover:text-stone-600 transition-colors"
          >
            <StickyNote size={10} />
            {item.notas ? (
              <span className="text-stone-600 italic">"{item.notas}"</span>
            ) : (
              "Agregar nota"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function MNuevoPedido() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [search, setSearch] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("all");
  const [carrito, setCarrito] = useState([]); // [{ platoId, nombrePlato, precioUnitario, moneda, cantidad, notas }]
  const [carritoOpen, setCarritoOpen] = useState(false);
  const [mesa, setMesa] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(null);

  // Queries
  const { data: restData } = useQuery(GET_MI_RESTAURANTE, {
    variables: { id: restauranteId },
    skip: !restauranteId,
  });
  const { data: catData } = useQuery(GET_CATEGORIAS_GERENTE, {
    variables: { activo: true },
  });
  const { data: platosData, loading: platosLoading } = useQuery(
    GET_PLATOS_DISPONIBLES,
    {
      variables: { disponibles: restauranteId, activo: true },
      skip: !restauranteId,
      fetchPolicy: "cache-and-network",
    },
  );
  const { data: preciosData } = useQuery(GET_PRECIOS_RESTAURANTE, {
    variables: { restauranteId },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  const [crearPedido] = useMutation(CREAR_PEDIDO);

  const restaurante = restData?.restaurante;
  const moneda = restaurante?.moneda ?? "COP";
  const categorias = catData?.categorias ?? [];
  const platos = platosData?.platos ?? [];
  const precios = preciosData?.precios ?? [];

  // Mapa platoId → precio vigente
  const preciosMap = useMemo(() => {
    const m = {};
    precios
      .filter((p) => p.estaVigente)
      .forEach((p) => {
        m[p.platoId] = p.precio;
      });
    return m;
  }, [precios]);

  // Platos filtrados
  const platosFiltrados = useMemo(() => {
    const q = search.toLowerCase().trim();
    return platos.filter((p) => {
      if (q && !p.nombre.toLowerCase().includes(q)) return false;
      if (categoriaActiva !== "all" && p.categoriaId !== categoriaActiva)
        return false;
      return true;
    });
  }, [platos, search, categoriaActiva]);

  // Helpers carrito
  const cantidadEnCarrito = (platoId) =>
    carrito.find((i) => i.platoId === platoId)?.cantidad ?? 0;
  const totalCarrito = carrito.reduce(
    (s, i) => s + i.precioUnitario * i.cantidad,
    0,
  );
  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0);

  const agregarAlCarrito = (plato, precio, moneda) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.platoId === plato.id);
      if (existe)
        return prev.map((i) =>
          i.platoId === plato.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      return [
        ...prev,
        {
          platoId: plato.id,
          nombrePlato: plato.nombre,
          precioUnitario: parseFloat(precio),
          moneda,
          cantidad: 1,
          notas: "",
        },
      ];
    });
    if (!carritoOpen) setCarritoOpen(true);
  };

  const quitarDelCarrito = (plato) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.platoId === plato.id);
      if (!existe || existe.cantidad <= 1)
        return prev.filter((i) => i.platoId !== plato.id);
      return prev.map((i) =>
        i.platoId === plato.id ? { ...i, cantidad: i.cantidad - 1 } : i,
      );
    });
  };

  const eliminarDelCarrito = (platoId) =>
    setCarrito((prev) => prev.filter((i) => i.platoId !== platoId));

  const actualizarNota = (platoId, notas) => {
    setCarrito((prev) =>
      prev.map((i) => (i.platoId === platoId ? { ...i, notas } : i)),
    );
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    setMesa("");
    setPedidoCreado(null);
  };

  const enviarPedido = async () => {
    if (carrito.length === 0) return;
    setEnviando(true);
    try {
      const { data } = await crearPedido({
        variables: {
          restauranteId,
          canal: "TPV",
          moneda,
          mesaId: mesa || null,
          detalles: carrito.map((i) => ({
            platoId: i.platoId,
            nombrePlato: i.nombrePlato,
            precioUnitario: i.precioUnitario,
            cantidad: i.cantidad,
            notas: i.notas || null,
          })),
        },
      });
      const resultado = data?.crearPedido;
      if (!resultado?.ok)
        throw new Error(resultado?.error ?? "No se pudo crear el pedido");
      const pedido = resultado.pedido;
      if (!pedido?.id) throw new Error("No se pudo crear el pedido");

      setPedidoCreado(pedido);
      await Swal.fire({
        background: "#fff",
        icon: "success",
        title: "¡Pedido enviado!",
        html: `<span style="font-family:'DM Sans';color:#78716c">Pedido <b>${pedido.numeroDia ? `#${pedido.numeroDia}` : `#${pedido.id.slice(-8).toUpperCase()}`}</b> enviado a cocina · ${fmtMoney(pedido.total, moneda)}</span>`,
        confirmButtonColor: G[900],
        confirmButtonText: "Nuevo pedido",
      });
      limpiarCarrito();
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1">
          <h1 className="font-playfair text-xl font-bold text-stone-900">
            {restaurante?.nombre ?? "Menú"}
          </h1>
          <p className="text-xs font-dm text-stone-400 mt-0.5">
            Selecciona platos para el pedido
          </p>
        </div>

        {/* Mesa */}
        <div className="flex items-center gap-2">
          <input
            value={mesa}
            onChange={(e) => setMesa(e.target.value)}
            placeholder="Mesa (opcional)"
            className="w-36 px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-700 placeholder:text-stone-300 outline-none"
          />
        </div>

        {/* Búsqueda */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-stone-200">
          <Search size={13} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar plato..."
            className="w-36 bg-transparent text-sm font-dm text-stone-700 placeholder:text-stone-300 outline-none"
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
      </div>

      {/* Filtro categorías */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setCategoriaActiva("all")}
          className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-dm font-semibold transition-all"
          style={
            categoriaActiva === "all"
              ? { background: G[900], color: "#fff" }
              : {
                  background: "#fff",
                  color: "#78716c",
                  border: "1px solid #e5e7eb",
                }
          }
        >
          Todos
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoriaActiva(c.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-dm font-semibold transition-all"
            style={
              categoriaActiva === c.id
                ? { background: G[900], color: "#fff" }
                : {
                    background: "#fff",
                    color: "#78716c",
                    border: "1px solid #e5e7eb",
                  }
            }
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {/* Grid platos + carrito */}
      <div className="flex gap-4 items-start">
        {/* Grid platos */}
        <div className="flex-1 min-w-0">
          {platosLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))}
            </div>
          ) : platosFiltrados.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title={search ? "Sin resultados" : "Sin platos disponibles"}
              description={
                search
                  ? `Sin platos que coincidan con "${search}".`
                  : "No hay platos con precio asignado en este restaurante."
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {platosFiltrados.map((plato) => (
                <PlatoCard
                  key={plato.id}
                  plato={plato}
                  precio={preciosMap[plato.id]}
                  moneda={moneda}
                  cantidad={cantidadEnCarrito(plato.id)}
                  onAgregar={agregarAlCarrito}
                  onQuitar={quitarDelCarrito}
                />
              ))}
            </div>
          )}
        </div>

        {/* Carrito — sticky lateral en desktop */}
        <div className="hidden lg:block w-72 shrink-0 sticky top-20">
          <div
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
          >
            {/* Header carrito */}
            <div
              className="flex items-center justify-between px-4 py-3.5 border-b border-stone-100"
              style={{ background: carrito.length > 0 ? G[50] : undefined }}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart size={14} style={{ color: G[300] }} />
                <span
                  className="text-sm font-dm font-bold"
                  style={{ color: G[900] }}
                >
                  Pedido {mesa && `· Mesa ${mesa}`}
                </span>
              </div>
              {carrito.length > 0 && (
                <span
                  className="text-[10px] font-dm font-bold px-2 py-1 rounded-full"
                  style={{ background: G[300], color: "#fff" }}
                >
                  {totalItems}
                </span>
              )}
            </div>

            {/* Items */}
            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {carrito.length === 0 ? (
                <div className="text-center py-6">
                  <ShoppingCart
                    size={24}
                    className="text-stone-200 mx-auto mb-2"
                  />
                  <p className="text-xs font-dm text-stone-300">
                    Agrega platos al pedido
                  </p>
                </div>
              ) : (
                carrito.map((item) => (
                  <CarritoItem
                    key={item.platoId}
                    item={item}
                    onMas={(id) =>
                      agregarAlCarrito(
                        { id, nombre: item.nombrePlato },
                        item.precioUnitario,
                        item.moneda,
                      )
                    }
                    onMenos={(id) => quitarDelCarrito({ id })}
                    onNota={actualizarNota}
                    onEliminar={eliminarDelCarrito}
                  />
                ))
              )}
            </div>

            {/* Total + enviar */}
            {carrito.length > 0 && (
              <div className="border-t border-stone-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-dm text-stone-500">Total</span>
                  <span
                    className="font-playfair text-lg font-bold"
                    style={{ color: G[900] }}
                  >
                    {fmtMoney(totalCarrito, moneda)}
                  </span>
                </div>
                <button
                  onClick={enviarPedido}
                  disabled={enviando}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-dm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: G[900] }}
                >
                  {enviando ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  {enviando ? "Enviando..." : "Enviar a cocina"}
                </button>
                <button
                  onClick={limpiarCarrito}
                  className="w-full py-2 rounded-xl text-xs font-dm text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Limpiar pedido
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carrito móvil — bottom bar */}
      {carrito.length > 0 && (
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-4 bg-white border-t border-stone-200"
          style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.1)" }}
        >
          <button
            onClick={() => setCarritoOpen(!carritoOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white"
            style={{ background: G[900] }}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={15} />
              <span className="text-sm font-dm font-bold">
                {totalItems} ítem{totalItems !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-playfair text-base font-bold">
                {fmtMoney(totalCarrito, moneda)}
              </span>
              {carritoOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronUp size={14} />
              )}
            </div>
          </button>

          {carritoOpen && (
            <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
              {carrito.map((item) => (
                <CarritoItem
                  key={item.platoId}
                  item={item}
                  onMas={(id) =>
                    agregarAlCarrito(
                      { id, nombre: item.nombrePlato },
                      item.precioUnitario,
                      item.moneda,
                    )
                  }
                  onMenos={(id) => quitarDelCarrito({ id })}
                  onNota={actualizarNota}
                  onEliminar={eliminarDelCarrito}
                />
              ))}
              <button
                onClick={enviarPedido}
                disabled={enviando}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-dm font-bold text-white mt-2"
                style={{ background: G[900] }}
              >
                {enviando ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {enviando ? "Enviando..." : "Enviar a cocina"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
