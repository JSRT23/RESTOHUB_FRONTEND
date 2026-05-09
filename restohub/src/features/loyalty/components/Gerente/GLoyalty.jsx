// src/features/loyalty/components/Gerente/GLoyalty.jsx
// CAMBIO PRINCIPAL: ModalCrearCupon ahora tiene ClienteSelector en vez de input libre de UUID.
// Admin ve clientes de cualquier restaurante (pasa restauranteId al selector).
// Gerente solo ve clientes de su restaurante (usa su restauranteId automáticamente).

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  Star,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Tag,
  Gift,
  Ticket,
  Users,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Globe,
  Building2,
  AlertTriangle,
  Percent,
  Hash,
  Coins,
  User,
  X,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronDown,
  Award,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_PROMOCIONES,
  CREAR_PROMOCION,
  ACTIVAR_PROMOCION,
  DESACTIVAR_PROMOCION,
  GET_CUPONES,
  CREAR_CUPON,
  GET_PUNTOS_CLIENTE,
  GET_TRANSACCIONES,
} from "../../graphql/operations";
import { GET_CLIENTES_RESTAURANTE } from "../../../menu/components/admin/graphql/operations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
  Modal,
} from "../../../../shared/components/ui";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};
const icls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-400 outline-none transition-all shadow-sm";
const fi = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
};
const fb = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-dm font-semibold text-stone-500">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const NIVEL_META = {
  bronce: { label: "Bronce", bg: "#fef3c7", text: "#d97706", icon: "🥉" },
  plata: { label: "Plata", bg: "#f1f5f9", text: "#64748b", icon: "🥈" },
  oro: { label: "Oro", bg: "#fefce8", text: "#ca8a04", icon: "🥇" },
  diamante: { label: "Diamante", bg: "#eff6ff", text: "#3b82f6", icon: "💎" },
};
const BENEFICIO_META = {
  descuento_pct: { label: "Descuento %", icon: Percent, color: "#3b82f6" },
  descuento_monto: { label: "Descuento fijo", icon: Coins, color: "#8b5cf6" },
  puntos_extra: { label: "Puntos extra", icon: Star, color: G[300] },
  regalo: { label: "Regalo", icon: Gift, color: "#ec4899" },
  "2x1": { label: "2×1", icon: Hash, color: "#f59e0b" },
};

// ═══════════════════════════════════════════════════════════════
// SELECTOR DE CLIENTES — reemplaza el input de UUID
// ═══════════════════════════════════════════════════════════════

function ClienteSelector({
  value,
  onChange,
  onSelect,
  placeholder = "Buscar cliente...",
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null); // objeto cliente seleccionado

  // Lazy query — solo busca cuando el usuario escribe
  const [buscarClientes, { data, loading }] = useLazyQuery(
    GET_CLIENTES_RESTAURANTE,
    {
      fetchPolicy: "network-only",
    },
  );

  const handleSearch = useCallback(
    (q) => {
      setSearch(q);
      setOpen(true);
      if (q.trim().length >= 1) {
        // NO filtramos por restauranteId porque los clientes se registran globalmente
        // (AutoRegistroView crea Cliente sin restaurante_id asignado).
        // Buscamos por texto: nombre, cédula o email.
        buscarClientes({ variables: { search: q.trim() } });
      }
    },
    [buscarClientes],
  );

  const clientes = data?.clientes ?? [];

  const handleSelect = (cliente) => {
    setSelected(cliente);
    onChange(cliente.id);
    if (onSelect) onSelect(cliente); // callback extra para TabPuntos
    setSearch("");
    setOpen(false);
  };

  const handleClear = () => {
    setSelected(null);
    onChange("");
    setSearch("");
  };

  // Si hay cliente seleccionado, mostrar chip
  if (selected) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white shadow-sm"
        style={{ borderColor: G[100] }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: G[50] }}
        >
          <User size={12} style={{ color: G[300] }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-dm font-semibold text-stone-800 truncate">
            {selected.nombre} {selected.apellido}
          </p>
          <p className="text-[10px] font-dm text-stone-400">
            {selected.tipoDocumento} {selected.cedula}
            {selected.email && ` · ${selected.email}`}
          </p>
        </div>
        <button
          onClick={handleClear}
          className="w-6 h-6 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400 transition shrink-0"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white shadow-sm border-stone-200 transition-all"
        style={
          open ? { borderColor: G[300], boxShadow: `0 0 0 2px ${G[300]}` } : {}
        }
      >
        <Search size={13} className="text-stone-300 shrink-0" />
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm font-dm text-stone-800 placeholder:text-stone-300 outline-none"
        />
        {loading && (
          <Loader2 size={12} className="text-stone-300 animate-spin shrink-0" />
        )}
      </div>

      {open && search.trim().length >= 1 && (
        <div
          className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden"
          style={{ maxHeight: "220px", overflowY: "auto" }}
        >
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-xs font-dm text-stone-400">
              <Loader2 size={12} className="animate-spin" /> Buscando...
            </div>
          ) : clientes.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3">
              <Users size={12} className="text-stone-300" />
              <p className="text-xs font-dm text-stone-400">
                Sin clientes que coincidan con "{search}"
              </p>
            </div>
          ) : (
            clientes.map((c) => (
              <button
                key={c.id}
                onMouseDown={() => handleSelect(c)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-left border-b border-stone-100 last:border-b-0"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: G[50] }}
                >
                  <User size={11} style={{ color: G[300] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-dm font-semibold text-stone-800 truncate">
                    {c.nombre} {c.apellido}
                  </p>
                  <p className="text-[10px] font-dm text-stone-400 truncate">
                    {c.tipoDocumento} {c.cedula}
                    {c.email ? ` · ${c.email}` : ""}
                    {c.telefono ? ` · ${c.telefono}` : ""}
                  </p>
                </div>
                {!c.activo && (
                  <span className="text-[9px] font-dm font-bold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-400 shrink-0">
                    INACTIVO
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Hint cuando no hay texto */}
      {!open && !search && (
        <p className="text-[11px] font-dm text-stone-400 mt-1 pl-1">
          Escribe nombre, cédula o email para buscar. Deja vacío para cupón
          genérico.
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 1 — PROMOCIONES (igual que antes)
// ═══════════════════════════════════════════════════════════════

function ModalCrearPromocion({ open, onClose, restauranteId }) {
  const INIT = {
    nombre: "",
    descripcion: "",
    tipoBeneficio: "descuento_pct",
    valor: "",
    puntosBonus: "",
    fechaInicio: "",
    fechaFin: "",
  };
  const [form, setForm] = useState({ ...INIT });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const [crear, { loading }] = useMutation(CREAR_PROMOCION, {
    refetchQueries: ["GetPromociones"],
  });

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.fechaInicio || !form.fechaFin) return;
    try {
      const variables = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion || null,
        alcance: "local",
        restauranteId,
        tipoBeneficio: form.tipoBeneficio,
        valor:
          form.tipoBeneficio !== "puntos_extra"
            ? parseFloat(form.valor) || 0
            : 0,
        puntosBonus:
          form.tipoBeneficio === "puntos_extra"
            ? parseInt(form.puntosBonus) || 0
            : 0,
        fechaInicio: new Date(form.fechaInicio).toISOString(),
        fechaFin: new Date(form.fechaFin).toISOString(),
      };
      const { data } = await crear({ variables });
      if (!data?.crearPromocion?.ok)
        throw new Error(data?.crearPromocion?.error ?? "Error");
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Promoción creada",
        timer: 1500,
        timerProgressBar: true,
        confirmButtonColor: G[900],
      });
      onClose();
      setForm({ ...INIT });
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    }
  };

  const necesitaValor = !["puntos_extra"].includes(form.tipoBeneficio);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva promoción local"
      size="md"
    >
      <div className="space-y-4">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-dm"
          style={{ background: G[50], borderColor: G[100], color: G[300] }}
        >
          <Building2 size={12} /> Se creará como promoción local — solo visible
          para tu restaurante.
        </div>
        <Field label="Nombre" required>
          <input
            value={form.nombre}
            onChange={set("nombre")}
            placeholder="Ej: 2×1 los martes..."
            className={icls}
            onFocus={fi}
            onBlur={fb}
          />
        </Field>
        <Field label="Descripción (opcional)">
          <input
            value={form.descripcion}
            onChange={set("descripcion")}
            placeholder="Describe la promoción..."
            className={icls}
            onFocus={fi}
            onBlur={fb}
          />
        </Field>
        <Field label="Tipo de beneficio" required>
          <select
            value={form.tipoBeneficio}
            onChange={set("tipoBeneficio")}
            className={icls + " appearance-none cursor-pointer"}
            onFocus={fi}
            onBlur={fb}
          >
            <option value="descuento_pct">Descuento porcentual (%)</option>
            <option value="descuento_monto">Descuento en monto fijo</option>
            <option value="puntos_extra">Puntos extra</option>
            <option value="regalo">Producto de regalo</option>
            <option value="2x1">2×1</option>
          </select>
        </Field>
        {necesitaValor && (
          <Field
            label={
              form.tipoBeneficio === "descuento_pct"
                ? "Porcentaje (%)"
                : "Monto"
            }
            required
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.valor}
              onChange={set("valor")}
              placeholder={
                form.tipoBeneficio === "descuento_pct" ? "Ej: 15" : "Ej: 5000"
              }
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
        )}
        {form.tipoBeneficio === "puntos_extra" && (
          <Field label="Puntos bonus a otorgar" required>
            <input
              type="number"
              min="1"
              step="1"
              value={form.puntosBonus}
              onChange={set("puntosBonus")}
              placeholder="Ej: 100"
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha inicio" required>
            <input
              type="datetime-local"
              value={form.fechaInicio}
              onChange={set("fechaInicio")}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
          <Field label="Fecha fin" required>
            <input
              type="datetime-local"
              value={form.fechaFin}
              onChange={set("fechaFin")}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={loading}
            disabled={
              !form.nombre.trim() || !form.fechaInicio || !form.fechaFin
            }
            onClick={handleSave}
          >
            Crear promoción
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PromocionCard({ promo, onToggle, toggling, restauranteId }) {
  // Como restauranteId no viene en el response, una promo local ya es del restaurante del gerente
  const esPropia = promo.alcance === "local";
  const beneficio =
    BENEFICIO_META[promo.tipoBeneficio] ?? BENEFICIO_META.descuento_pct;
  const BenIcon = beneficio.icon;
  const ahora = new Date();
  const inicio = new Date(promo.fechaInicio);
  const fin = new Date(promo.fechaFin);
  const vigente = promo.activa && inicio <= ahora && fin >= ahora;
  const vencida = fin < ahora;

  return (
    <div
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
              : `linear-gradient(90deg,${beneficio.color}88,${beneficio.color}44)`,
        }}
      />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${beneficio.color}18` }}
            >
              <BenIcon size={15} style={{ color: beneficio.color }} />
            </div>
            <div className="min-w-0">
              <p className="font-dm text-stone-900 font-semibold text-sm truncate">
                {promo.nombre}
              </p>
              <p
                className="text-[10px] font-dm"
                style={{ color: beneficio.color }}
              >
                {beneficio.label}
                {promo.tipoBeneficio === "descuento_pct" &&
                  ` · ${promo.valor}%`}
                {promo.tipoBeneficio === "descuento_monto" &&
                  ` · -${promo.valor}`}
                {promo.tipoBeneficio === "puntos_extra" &&
                  ` · +${promo.puntosBonus} pts`}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-dm font-semibold px-2 py-1 rounded-full ${promo.alcance === "global" ? "bg-blue-50 text-blue-600" : ""}`}
              style={
                promo.alcance === "local"
                  ? { background: G[50], color: G[300] }
                  : {}
              }
            >
              {promo.alcance === "global" ? (
                <>
                  <Globe size={9} /> Global
                </>
              ) : (
                <>
                  <Building2 size={9} /> Local
                </>
              )}
            </span>
            <Badge
              variant={vigente ? "green" : vencida ? "red" : "default"}
              size="xs"
            >
              {vigente ? (
                <>
                  <CheckCircle2 size={9} /> Activa
                </>
              ) : vencida ? (
                <>
                  <XCircle size={9} /> Vencida
                </>
              ) : (
                <>
                  <AlertTriangle size={9} /> Inactiva
                </>
              )}
            </Badge>
          </div>
        </div>
        {promo.descripcion && (
          <p className="text-[11px] font-dm text-stone-400 line-clamp-2">
            {promo.descripcion}
          </p>
        )}
        <div className="flex items-center gap-2 text-[10px] font-dm text-stone-400">
          <CalendarDays size={10} />
          {inicio.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
          })}{" "}
          →{" "}
          {fin.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-stone-100">
          {/* totalAplicaciones no expuesto en el gateway — omitido */}
          {esPropia ? (
            <button
              onClick={() => onToggle(promo)}
              disabled={toggling === promo.id}
              className={`flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${promo.activa ? "border-red-200 text-red-600 bg-red-50 hover:bg-red-100" : "border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100"}`}
            >
              {toggling === promo.id ? (
                <Loader2 size={11} className="animate-spin" />
              ) : promo.activa ? (
                <>
                  <ToggleLeft size={13} /> Desactivar
                </>
              ) : (
                <>
                  <ToggleRight size={13} /> Activar
                </>
              )}
            </button>
          ) : (
            <span className="text-[10px] font-dm text-stone-300">
              Solo lectura
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TabPromociones({ restauranteId }) {
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("all");
  const [toggling, setToggling] = useState(null);

  const { data, loading } = useQuery(GET_PROMOCIONES, {
    variables: { restauranteId },
    fetchPolicy: "cache-and-network",
  });
  const [activar] = useMutation(ACTIVAR_PROMOCION, {
    refetchQueries: ["GetPromociones"],
  });
  const [desactivar] = useMutation(DESACTIVAR_PROMOCION, {
    refetchQueries: ["GetPromociones"],
  });

  const promociones = data?.promociones ?? [];
  // El backend ya filtra por restaurante; todas las locales son del restaurante del gerente
  const propias = promociones.filter((p) => p.alcance === "local");
  const globales = promociones.filter((p) => p.alcance === "global");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return promociones.filter((p) => {
      if (q && !p.nombre.toLowerCase().includes(q)) return false;
      if (filtro === "local" && p.alcance !== "local") return false;
      if (filtro === "global" && p.alcance !== "global") return false;
      if (filtro === "activa" && !p.activa) return false;
      return true;
    });
  }, [promociones, search, filtro, restauranteId]);

  const handleToggle = async (promo) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      title: promo.activa ? "¿Desactivar promoción?" : "¿Activar promoción?",
      html: `<span style="font-family:'DM Sans';color:#78716c">Cambiarás el estado de <b>${promo.nombre}</b>.</span>`,
      icon: promo.activa ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: promo.activa ? "#ef4444" : G[900],
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: promo.activa ? "Desactivar" : "Activar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    setToggling(promo.id);
    try {
      const mutation = promo.activa ? desactivar : activar;
      const { data: res } = await mutation({ variables: { id: promo.id } });
      const r = promo.activa ? res?.desactivarPromocion : res?.activarPromocion;
      if (!r?.ok) throw new Error(r?.error ?? "Error");
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="text-xs font-dm text-stone-500">
          <span className="font-bold" style={{ color: G[300] }}>
            {propias.length}
          </span>{" "}
          propias ·{" "}
          <span className="font-bold text-blue-600">{globales.length}</span>{" "}
          globales visibles
        </div>
        <Button size="sm" onClick={() => setModal(true)}>
          <Plus size={13} /> Nueva promoción
        </Button>
      </div>
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
            placeholder="Buscar promoción..."
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
          {[
            { v: "all", l: "Todas" },
            { v: "local", l: "Propias" },
            { v: "global", l: "Globales" },
            { v: "activa", l: "Activas" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
              style={
                filtro === v
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
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Star}
          title={search ? "Sin resultados" : "Sin promociones"}
          description={
            search
              ? `Sin coincidencias para "${search}".`
              : "Crea tu primera promoción local."
          }
          action={
            !search && (
              <Button size="sm" onClick={() => setModal(true)}>
                <Plus size={13} /> Nueva
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PromocionCard
              key={p.id}
              promo={p}
              onToggle={handleToggle}
              toggling={toggling}
              restauranteId={restauranteId}
            />
          ))}
        </div>
      )}
      <ModalCrearPromocion
        open={modal}
        onClose={() => setModal(false)}
        restauranteId={restauranteId}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 2 — CUPONES (con ClienteSelector)
// ═══════════════════════════════════════════════════════════════

function ModalCrearCupon({ open, onClose, restauranteId }) {
  const INIT = {
    clienteId: "",
    tipoDescuento: "porcentaje",
    valorDescuento: "",
    limiteUso: "1",
    fechaInicio: "",
    fechaFin: "",
    codigo: "",
  };
  const [form, setForm] = useState({ ...INIT });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [crear, { loading }] = useMutation(CREAR_CUPON, {
    refetchQueries: ["GetCupones"],
  });

  const handleSave = async () => {
    if (
      !form.tipoDescuento ||
      !form.valorDescuento ||
      !form.fechaInicio ||
      !form.fechaFin
    )
      return;
    try {
      const { data } = await crear({
        variables: {
          clienteId: form.clienteId || null,
          tipoDescuento: form.tipoDescuento,
          valorDescuento: parseFloat(form.valorDescuento),
          limiteUso: parseInt(form.limiteUso) || 1,
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin,
          codigo: form.codigo || null,
        },
      });
      if (!data?.crearCupon?.ok)
        throw new Error(data?.crearCupon?.error ?? "Error");
      await Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Cupón creado",
        html: `<span style="font-family:'DM Sans';color:#78716c">Código: <b>${data.crearCupon.cupon.codigo}</b></span>`,
        confirmButtonColor: G[900],
      });
      onClose();
      setForm({ ...INIT });
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo cupón" size="sm">
      <div className="space-y-4">
        {/* Selector de cliente — reemplaza el input de UUID */}
        <Field label="Cliente (opcional — vacío = cupón genérico)">
          <ClienteSelector
            value={form.clienteId}
            onChange={(id) => setForm((f) => ({ ...f, clienteId: id }))}
            placeholder="Buscar por nombre, cédula o email..."
          />
        </Field>

        {/* Aviso cupón genérico */}
        {!form.clienteId && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-dm border"
            style={{
              background: "#fffbeb",
              borderColor: "#fde68a",
              color: "#d97706",
            }}
          >
            <AlertTriangle size={11} />
            Sin cliente seleccionado el cupón será genérico — cualquiera puede
            usarlo.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo descuento" required>
            <select
              value={form.tipoDescuento}
              onChange={set("tipoDescuento")}
              className={icls + " appearance-none cursor-pointer"}
              onFocus={fi}
              onBlur={fb}
            >
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="monto_fijo">Monto fijo</option>
            </select>
          </Field>
          <Field
            label={form.tipoDescuento === "porcentaje" ? "Porcentaje" : "Monto"}
            required
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.valorDescuento}
              onChange={set("valorDescuento")}
              placeholder={form.tipoDescuento === "porcentaje" ? "15" : "5000"}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Límite de usos">
            <input
              type="number"
              min="1"
              value={form.limiteUso}
              onChange={set("limiteUso")}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
          <Field label="Código (vacío = auto)">
            <input
              value={form.codigo}
              onChange={set("codigo")}
              placeholder="PROMO2024"
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha inicio" required>
            <input
              type="date"
              value={form.fechaInicio}
              onChange={set("fechaInicio")}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
          <Field label="Fecha fin" required>
            <input
              type="date"
              value={form.fechaFin}
              onChange={set("fechaFin")}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={loading}
            disabled={
              !form.valorDescuento || !form.fechaInicio || !form.fechaFin
            }
            onClick={handleSave}
          >
            Crear cupón
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TabCupones({ restauranteId }) {
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");

  const { data, loading } = useQuery(GET_CUPONES, {
    fetchPolicy: "cache-and-network",
  });

  const cupones = data?.cupones ?? [];
  const filtered = cupones.filter((c) =>
    c.codigo.toLowerCase().includes(search.toLowerCase()),
  );
  const disponibles = cupones.filter((c) => c.disponible).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-dm text-stone-500">
          <span className="font-bold" style={{ color: G[300] }}>
            {disponibles}
          </span>{" "}
          disponibles ·{" "}
          <span className="font-bold text-stone-600">{cupones.length}</span> en
          total
        </span>
        <Button size="sm" onClick={() => setModal(true)}>
          <Plus size={13} /> Nuevo cupón
        </Button>
      </div>

      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 max-w-sm"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <Search size={13} className="text-stone-300 shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código..."
          className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Sin cupones"
          description="Crea el primer cupón para tus clientes."
          action={
            <Button size="sm" onClick={() => setModal(true)}>
              <Plus size={13} /> Nuevo
            </Button>
          }
        />
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                {["Código", "Tipo", "Valor", "Usos", "Vigencia", "Estado"].map(
                  (l) => (
                    <th
                      key={l}
                      className="py-2.5 px-4 text-left text-[10px] font-dm font-semibold text-stone-400 uppercase tracking-wide first:pl-5 last:pr-5"
                    >
                      {l}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors"
                >
                  <td className="py-3 pl-5 pr-4">
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-stone-100 text-stone-700">
                      {c.codigo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-dm text-stone-600">
                    {c.tipoDescuentoDisplay}
                  </td>
                  <td className="py-3 px-4 text-xs font-dm font-semibold text-stone-800">
                    {c.tipoDescuento === "porcentaje"
                      ? `${c.valorDescuento}%`
                      : `$${c.valorDescuento}`}
                  </td>
                  <td className="py-3 px-4 text-xs font-dm text-stone-500">
                    {c.usosActuales}/{c.limiteUso}
                  </td>
                  <td className="py-3 px-4 text-[10px] font-dm text-stone-400">
                    hasta{" "}
                    {new Date(c.fechaFin).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 pr-5 pl-4">
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
                          <XCircle size={9} /> No disponible
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

      <ModalCrearCupon
        open={modal}
        onClose={() => setModal(false)}
        restauranteId={restauranteId}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 3 — PUNTOS con búsqueda por cédula/nombre y movimientos
// ═══════════════════════════════════════════════════════════════

// Progreso hacia el siguiente nivel
const NIVEL_PROGRESO = {
  bronce: { next: "plata", puntosNext: 500, color: "#d97706" },
  plata: { next: "oro", puntosNext: 1500, color: "#64748b" },
  oro: { next: "diamante", puntosNext: 5000, color: "#ca8a04" },
  diamante: { next: null, puntosNext: null, color: "#3b82f6" },
};

function NivelBadge({ nivel }) {
  const meta = NIVEL_META[nivel] ?? NIVEL_META.bronce;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-dm font-bold px-3 py-1.5 rounded-full"
      style={{
        background: meta.bg,
        color: meta.text,
        border: `1.5px solid ${meta.text}33`,
      }}
    >
      {meta.icon} {meta.label}
    </span>
  );
}

function BarraProgreso({ saldo, nivel }) {
  const prog = NIVEL_PROGRESO[nivel];
  if (!prog || !prog.puntosNext) {
    return (
      <div
        className="flex items-center gap-2 text-xs font-dm"
        style={{ color: prog?.color ?? G[300] }}
      >
        <Award size={13} /> Nivel máximo alcanzado
      </div>
    );
  }
  const pct = Math.min(100, Math.round((saldo / prog.puntosNext) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-dm text-stone-400">
        <span>{saldo.toLocaleString("es-CO")} pts</span>
        <span>
          → {prog.next} · {prog.puntosNext.toLocaleString("es-CO")} pts
        </span>
      </div>
      <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg,${G[300]},${G[100]})`,
          }}
        />
      </div>
      <p className="text-[10px] font-dm text-stone-400">
        {pct}% hacia {prog.next}
      </p>
    </div>
  );
}

function MovimientoRow({ mov }) {
  const esAcumulacion = mov.puntos > 0;
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 last:border-b-0 hover:bg-stone-50/50 transition-colors">
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${esAcumulacion ? "bg-emerald-50" : "bg-red-50"}`}
      >
        {esAcumulacion ? (
          <ArrowUpRight size={13} className="text-emerald-500" />
        ) : (
          <ArrowDownRight size={13} className="text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-dm font-semibold text-stone-700 truncate">
          {mov.tipoDisplay || mov.tipo}
        </p>
        {mov.descripcion && (
          <p className="text-[10px] font-dm text-stone-400 truncate">
            {mov.descripcion}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p
          className={`text-sm font-dm font-bold ${esAcumulacion ? "text-emerald-600" : "text-red-500"}`}
        >
          {esAcumulacion ? "+" : ""}
          {mov.puntos?.toLocaleString("es-CO") ?? (mov.puntosDisplay || "—")}
        </p>
        <p className="text-[10px] font-dm text-stone-300">
          {new Date(mov.createdAt).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
          })}
        </p>
      </div>
    </div>
  );
}

function TabPuntos() {
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null); // objeto cliente
  const [skipPuntos, setSkipPuntos] = useState(true);
  const [skipMovs, setSkipMovs] = useState(true);
  const [mostrarMovs, setMostrarMovs] = useState(false);

  const { data: dataPuntos, loading: loadingPuntos } = useQuery(
    GET_PUNTOS_CLIENTE,
    {
      variables: { clienteId: clienteSeleccionado?.id ?? "" },
      skip: skipPuntos,
      fetchPolicy: "network-only",
    },
  );

  const { data: dataMovs, loading: loadingMovs } = useQuery(GET_TRANSACCIONES, {
    variables: { clienteId: clienteSeleccionado?.id ?? "" },
    skip: skipMovs,
    fetchPolicy: "network-only",
  });

  const handleSeleccionar = (cliente) => {
    setClienteSeleccionado(cliente);
    setSkipPuntos(false);
    setSkipMovs(false);
    setMostrarMovs(false);
  };

  const handleLimpiar = () => {
    setClienteSeleccionado(null);
    setSkipPuntos(true);
    setSkipMovs(true);
    setMostrarMovs(false);
  };

  const cuenta = dataPuntos?.puntosCliente;
  const nivelMeta = cuenta
    ? (NIVEL_META[cuenta.nivel] ?? NIVEL_META.bronce)
    : null;
  const movs = dataMovs?.transaccionesPuntos ?? [];
  const acumulados = movs
    .filter((m) => m.puntos > 0)
    .reduce((s, m) => s + m.puntos, 0);
  const canjeados = movs
    .filter((m) => m.puntos < 0)
    .reduce((s, m) => s + Math.abs(m.puntos), 0);

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Buscador de cliente */}
      <div className="space-y-2">
        <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
          Buscar cliente
        </label>
        {clienteSeleccionado ? (
          /* Cliente seleccionado — chip con opción de cambiar */
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-white"
            style={{
              borderColor: G[100],
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                background: G[50],
                color: G[500],
                fontFamily: "'Playfair Display',serif",
              }}
            >
              {(clienteSeleccionado.nombre || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-dm font-semibold text-stone-800">
                {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
              </p>
              <p className="text-[11px] font-dm text-stone-400">
                {clienteSeleccionado.tipoDocumento} {clienteSeleccionado.cedula}
                {clienteSeleccionado.email && ` · ${clienteSeleccionado.email}`}
              </p>
            </div>
            <button
              onClick={handleLimpiar}
              className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400 transition shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <ClienteSelector
            value=""
            onChange={() => {}}
            onSelect={handleSeleccionar}
            placeholder="Buscar por nombre, cédula o email..."
          />
        )}
      </div>

      {/* Loading */}
      {!skipPuntos && loadingPuntos && (
        <div className="space-y-3">
          <div className="h-28 rounded-2xl bg-stone-100 animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-stone-100 animate-pulse"
              />
            ))}
          </div>
        </div>
      )}

      {/* Sin cuenta */}
      {!skipPuntos && !loadingPuntos && clienteSeleccionado && !cuenta && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50">
          <XCircle size={16} className="text-stone-400 shrink-0" />
          <div>
            <p className="text-sm font-dm font-semibold text-stone-600">
              Sin cuenta de puntos
            </p>
            <p className="text-[11px] font-dm text-stone-400">
              {clienteSeleccionado.nombre} todavía no ha acumulado puntos en
              ninguna compra.
            </p>
          </div>
        </div>
      )}

      {/* Tarjeta de estadísticas */}
      {cuenta && nivelMeta && !loadingPuntos && (
        <div className="space-y-4">
          {/* Hero puntos + nivel */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
          >
            <div
              className="relative px-6 py-5"
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
              <div className="relative flex items-center justify-between">
                <div>
                  <p
                    className="text-[10px] font-dm font-bold tracking-[0.2em] uppercase mb-1"
                    style={{ color: G[100] }}
                  >
                    Saldo actual
                  </p>
                  <p
                    className="text-4xl font-bold text-white leading-none"
                    style={{ fontFamily: "'Playfair Display',serif" }}
                  >
                    {cuenta.saldo.toLocaleString("es-CO")}
                    <span
                      className="text-lg font-dm font-normal ml-2"
                      style={{ color: `${G[100]}cc` }}
                    >
                      pts
                    </span>
                  </p>
                </div>
                <NivelBadge nivel={cuenta.nivel} />
              </div>
            </div>
            {/* Barra de progreso */}
            <div className="bg-white px-6 py-4 border-b border-stone-100">
              <BarraProgreso saldo={cuenta.saldo} nivel={cuenta.nivel} />
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Total histórico",
                value: cuenta.puntosTotalesHistoricos.toLocaleString("es-CO"),
                unit: "pts",
                color: G[300],
                bg: G[50],
                border: G[100],
              },
              {
                label: "Acumulados",
                value: acumulados.toLocaleString("es-CO"),
                unit: "pts",
                color: "#16a34a",
                bg: "#f0fdf4",
                border: "#bbf7d0",
              },
              {
                label: "Canjeados",
                value: canjeados.toLocaleString("es-CO"),
                unit: "pts",
                color: "#dc2626",
                bg: "#fef2f2",
                border: "#fecaca",
              },
            ].map(({ label, value, unit, color, bg, border }) => (
              <div
                key={label}
                className="p-4 rounded-2xl border"
                style={{ background: bg, borderColor: border }}
              >
                <p
                  className="text-[10px] font-dm font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color }}
                >
                  {label}
                </p>
                <p
                  className="text-xl font-bold leading-none"
                  style={{ fontFamily: "'Playfair Display',serif", color }}
                >
                  {value}
                </p>
                <p className="text-[10px] font-dm mt-0.5" style={{ color }}>
                  {unit}
                </p>
              </div>
            ))}
          </div>

          {/* Movimientos */}
          <div
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
          >
            <button
              onClick={() => setMostrarMovs((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Clock size={14} style={{ color: G[300] }} />
                <span className="text-sm font-dm font-semibold text-stone-800">
                  Movimientos
                </span>
                {loadingMovs && (
                  <Loader2 size={12} className="text-stone-400 animate-spin" />
                )}
                {!loadingMovs && movs.length > 0 && (
                  <span className="text-[10px] font-dm font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                    {movs.length}
                  </span>
                )}
              </div>
              <ChevronDown
                size={14}
                className={`text-stone-400 transition-transform ${mostrarMovs ? "rotate-180" : ""}`}
              />
            </button>

            {mostrarMovs && (
              <div className="border-t border-stone-100">
                {loadingMovs ? (
                  <div className="p-4 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-12 rounded-xl bg-stone-100 animate-pulse"
                      />
                    ))}
                  </div>
                ) : movs.length === 0 ? (
                  <div className="flex items-center gap-2.5 px-5 py-4">
                    <XCircle size={13} className="text-stone-300" />
                    <p className="text-xs font-dm text-stone-400">
                      Sin movimientos registrados.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {movs.map((mov) => (
                      <MovimientoRow key={mov.id} mov={mov} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-[10px] font-dm text-stone-300 text-right">
            Actualizado:{" "}
            {new Date(cuenta.ultimaActualizacion).toLocaleString("es-CO")}
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

const TABS = [
  { id: "promociones", label: "Promociones", icon: Star },
  { id: "cupones", label: "Cupones", icon: Ticket },
  { id: "puntos", label: "Puntos", icon: Coins },
];

export default function GLoyalty() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;
  const [tab, setTab] = useState("promociones");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Loyalty"
        title="Fidelización"
        description="Gestiona tus promociones locales, cupones y consulta puntos de clientes."
      />

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

      {tab === "promociones" && (
        <TabPromociones restauranteId={restauranteId} />
      )}
      {tab === "cupones" && <TabCupones restauranteId={restauranteId} />}
      {tab === "puntos" && <TabPuntos />}
    </div>
  );
}
