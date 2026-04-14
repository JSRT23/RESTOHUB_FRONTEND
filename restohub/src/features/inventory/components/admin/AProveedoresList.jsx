// src/features/inventory/components/Admin/AProveedoresList.jsx
//
// Gestión de proveedores para admin_central — Modelo Opción-B.
// · Admin puede crear proveedores con alcance GLOBAL / PAIS / CIUDAD / LOCAL.
// · Puede editar cualquier proveedor (incluidos LOCAL de cualquier restaurante).
// · Puede activar/desactivar cualquier proveedor.
// · Filtros: buscar, filtrar por alcance, filtrar por país.

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Truck,
  Plus,
  Search,
  Globe,
  MapPin,
  Building2,
  Phone,
  Mail,
  Coins,
  CheckCircle2,
  XCircle,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Filter,
} from "lucide-react";
import Swal from "sweetalert2";
import { GET_PROVEEDORES } from "../../graphql/queries";
import { CREAR_PROVEEDOR, ACTUALIZAR_PROVEEDOR } from "../../graphql/mutations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
  Modal,
} from "../../../../shared/components/ui";

// ── Paleta ─────────────────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

// ── Alcance meta ───────────────────────────────────────────────────────────
const ALCANCE_META = {
  GLOBAL: {
    label: "Global",
    bg: "#eff6ff",
    text: "#3b82f6",
    border: "#bfdbfe",
    emoji: "🌐",
    desc: "Visible para todos los restaurantes de la cadena.",
  },
  PAIS: {
    label: "País",
    bg: "#faf5ff",
    text: "#7c3aed",
    border: "#ddd6fe",
    emoji: "🗺️",
    desc: "Visible para restaurantes del país indicado.",
  },
  CIUDAD: {
    label: "Ciudad",
    bg: "#fff7ed",
    text: "#ea580c",
    border: "#fed7aa",
    emoji: "📍",
    desc: "Visible para restaurantes de esa ciudad.",
  },
  LOCAL: {
    label: "Local",
    bg: G[50],
    text: G[300],
    border: G[100],
    emoji: "🏠",
    desc: "Visible solo para el restaurante que lo creó.",
  },
};

// ── Catálogos ──────────────────────────────────────────────────────────────
const PAISES = [
  { label: "Colombia", flag: "🇨🇴" },
  { label: "México", flag: "🇲🇽" },
  { label: "Argentina", flag: "🇦🇷" },
  { label: "Brasil", flag: "🇧🇷" },
  { label: "Chile", flag: "🇨🇱" },
  { label: "Perú", flag: "🇵🇪" },
  { label: "Ecuador", flag: "🇪🇨" },
  { label: "Venezuela", flag: "🇻🇪" },
  { label: "España", flag: "🇪🇸" },
  { label: "Estados Unidos", flag: "🇺🇸" },
];

const MONEDAS = [
  { value: "COP", label: "COP — Peso colombiano" },
  { value: "USD", label: "USD — Dólar americano" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "MXN", label: "MXN — Peso mexicano" },
  { value: "ARS", label: "ARS — Peso argentino" },
  { value: "BRL", label: "BRL — Real brasileño" },
  { value: "CLP", label: "CLP — Peso chileno" },
  { value: "PEN", label: "PEN — Sol peruano" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const fi = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
};
const fb = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};
const icls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all shadow-sm";
const iclsS =
  "w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-dm text-stone-400 outline-none shadow-sm";

function getInitials(n = "") {
  const w = n.trim().split(/\s+/);
  return w.length >= 2
    ? (w[0][0] + w[1][0]).toUpperCase()
    : n.slice(0, 2).toUpperCase();
}
function flagFor(pais = "") {
  return (
    PAISES.find((p) => p.label.toLowerCase() === pais.toLowerCase())?.flag ??
    "🌐"
  );
}

function AlcanceBadge({ alcance }) {
  const m = ALCANCE_META[alcance] ?? ALCANCE_META.GLOBAL;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-dm font-semibold border"
      style={{ background: m.bg, color: m.text, borderColor: m.border }}
    >
      <span>{m.emoji}</span> {m.label}
    </span>
  );
}

function Field({ icon: Icon, label, required, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-dm font-semibold text-stone-500">
        {Icon && <Icon size={11} style={{ color: G[300] }} />}
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] font-dm text-stone-400">{hint}</p>}
    </div>
  );
}

// ── Modal Crear / Editar ───────────────────────────────────────────────────
function ProveedorModal({ open, onClose, proveedor }) {
  const editando = !!proveedor;

  const INIT = {
    nombre: "",
    pais: "Colombia",
    ciudad: "",
    telefono: "",
    email: "",
    monedaPreferida: "COP",
    alcance: "GLOBAL",
    paisDestino: "",
    ciudadDestino: "",
  };

  const [form, setForm] = useState(
    proveedor
      ? {
          nombre: proveedor.nombre ?? "",
          pais: proveedor.pais ?? "Colombia",
          ciudad: proveedor.ciudad ?? "",
          telefono: proveedor.telefono ?? "",
          email: proveedor.email ?? "",
          monedaPreferida: proveedor.monedaPreferida ?? "COP",
          alcance: proveedor.alcance ?? "GLOBAL",
          paisDestino: proveedor.paisDestino ?? "",
          ciudadDestino: proveedor.ciudadDestino ?? "",
        }
      : { ...INIT },
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [crear, { loading: lc }] = useMutation(CREAR_PROVEEDOR, {
    refetchQueries: ["GetProveedores"],
  });
  const [actualizar, { loading: la }] = useMutation(ACTUALIZAR_PROVEEDOR, {
    refetchQueries: ["GetProveedores"],
  });
  const loading = lc || la;

  const needsPais = form.alcance === "PAIS" || form.alcance === "CIUDAD";
  const needsCiudad = form.alcance === "CIUDAD";

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      return Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "El nombre es requerido",
        confirmButtonColor: G[900],
      });
    }
    if (needsPais && !form.paisDestino) {
      return Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Selecciona el país destino",
        confirmButtonColor: G[900],
      });
    }
    if (needsCiudad && !form.ciudadDestino.trim()) {
      return Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Escribe la ciudad destino",
        confirmButtonColor: G[900],
      });
    }

    try {
      let res;
      if (editando) {
        const { data } = await actualizar({
          variables: {
            id: proveedor.id,
            nombre: form.nombre.trim() || undefined,
            pais: form.pais || undefined,
            ciudad: form.ciudad || null,
            telefono: form.telefono || null,
            email: form.email || null,
            monedaPreferida: form.monedaPreferida || null,
            alcance: form.alcance,
            paisDestino: needsPais ? form.paisDestino : null,
            ciudadDestino: needsCiudad ? form.ciudadDestino.trim() : null,
          },
        });
        res = data?.actualizarProveedor;
      } else {
        const { data } = await crear({
          variables: {
            nombre: form.nombre.trim(),
            pais: form.pais,
            ciudad: form.ciudad || null,
            telefono: form.telefono || null,
            email: form.email || null,
            monedaPreferida: form.monedaPreferida || null,
            alcance: form.alcance,
            paisDestino: needsPais ? form.paisDestino : null,
            ciudadDestino: needsCiudad ? form.ciudadDestino.trim() : null,
          },
        });
        res = data?.crearProveedor;
      }

      if (!res?.ok) throw new Error(res?.error ?? "Error desconocido");

      Swal.fire({
        background: "#fff",
        icon: "success",
        title: editando ? "Proveedor actualizado" : "¡Proveedor creado!",
        html: `<span style="font-family:'DM Sans';color:#78716c"><b>${form.nombre}</b> fue ${editando ? "actualizado" : "creado"} con alcance <b>${form.alcance}</b>.</span>`,
        confirmButtonColor: G[900],
        timer: 2000,
        timerProgressBar: true,
      });
      if (!editando) setForm({ ...INIT });
      onClose();
    } catch (err) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: err.message,
        confirmButtonColor: G[900],
      });
    }
  };

  const alcanceMeta = ALCANCE_META[form.alcance] ?? ALCANCE_META.GLOBAL;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? "Editar proveedor" : "Nuevo proveedor"}
      size="md"
    >
      <div className="space-y-4">
        {/* Selector de alcance — el campo más importante */}
        <Field icon={Globe} label="Alcance" required hint={alcanceMeta.desc}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(ALCANCE_META).map(([k, m]) => (
              <button
                key={k}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    alcance: k,
                    paisDestino: "",
                    ciudadDestino: "",
                  }))
                }
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all text-center"
                style={
                  form.alcance === k
                    ? { background: m.bg, borderColor: m.text, color: m.text }
                    : {
                        background: "#fafafa",
                        borderColor: "#e5e7eb",
                        color: "#9ca3af",
                      }
                }
              >
                <span className="text-base">{m.emoji}</span>
                <span className="text-[10px] font-dm font-bold">{m.label}</span>
              </button>
            ))}
          </div>
        </Field>

        {/* País destino — solo si aplica */}
        {needsPais && (
          <Field icon={Globe} label="País destino" required>
            <select
              className={icls + " appearance-none cursor-pointer"}
              onFocus={fi}
              onBlur={fb}
              value={form.paisDestino}
              onChange={set("paisDestino")}
            >
              <option value="">— Selecciona un país —</option>
              {PAISES.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.flag} {p.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        {/* Ciudad destino — solo si alcance=CIUDAD */}
        {needsCiudad && (
          <Field
            icon={MapPin}
            label="Ciudad destino"
            required
            hint="Escribe el nombre exacto de la ciudad (ej: Medellín, Bogotá)."
          >
            <input
              className={icls}
              onFocus={fi}
              onBlur={fb}
              value={form.ciudadDestino}
              onChange={set("ciudadDestino")}
              placeholder="Ej: Medellín"
            />
          </Field>
        )}

        {/* Datos del proveedor */}
        <div className="h-px bg-stone-100" />

        <Field icon={Building2} label="Nombre" required>
          <input
            className={icls}
            onFocus={fi}
            onBlur={fb}
            value={form.nombre}
            onChange={set("nombre")}
            placeholder="Ej: Distribuidora Carnes del Valle"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field icon={Globe} label="País del proveedor">
            <select
              className={icls + " appearance-none cursor-pointer"}
              onFocus={fi}
              onBlur={fb}
              value={form.pais}
              onChange={set("pais")}
            >
              {PAISES.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.flag} {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field icon={MapPin} label="Ciudad del proveedor">
            <input
              className={icls}
              onFocus={fi}
              onBlur={fb}
              value={form.ciudad}
              onChange={set("ciudad")}
              placeholder="Ej: Bogotá"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field icon={Phone} label="Teléfono">
            <input
              className={icls}
              onFocus={fi}
              onBlur={fb}
              value={form.telefono}
              onChange={set("telefono")}
              placeholder="+57 300…"
            />
          </Field>
          <Field icon={Mail} label="Email">
            <input
              type="email"
              className={icls}
              onFocus={fi}
              onBlur={fb}
              value={form.email}
              onChange={set("email")}
              placeholder="contacto@prov.com"
            />
          </Field>
        </div>

        <Field icon={Coins} label="Moneda preferida">
          <select
            className={icls + " appearance-none cursor-pointer"}
            onFocus={fi}
            onBlur={fb}
            value={form.monedaPreferida}
            onChange={set("monedaPreferida")}
          >
            {MONEDAS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
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
            disabled={!form.nombre.trim()}
            onClick={handleSave}
          >
            {editando ? "Guardar cambios" : "Crear proveedor"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── ProveedorCard ──────────────────────────────────────────────────────────
function ProveedorCard({ proveedor, onEditar, onToggle, toggling }) {
  const meta = ALCANCE_META[proveedor.alcance] ?? ALCANCE_META.GLOBAL;
  const info = [
    proveedor.ciudad
      ? { icon: MapPin, text: `${proveedor.ciudad}, ${proveedor.pais}` }
      : { icon: Globe, text: proveedor.pais },
    proveedor.telefono && { icon: Phone, text: proveedor.telefono },
    proveedor.email && { icon: Mail, text: proveedor.email },
    { icon: Coins, text: proveedor.monedaPreferida ?? "—" },
    // Destino si aplica
    proveedor.ciudadDestino && {
      icon: MapPin,
      text: `→ ${proveedor.ciudadDestino}`,
    },
    !proveedor.ciudadDestino &&
      proveedor.paisDestino && {
        icon: Globe,
        text: `→ ${proveedor.paisDestino}`,
      },
  ].filter(Boolean);

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:-translate-y-0.5 transition-all duration-200"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      <div
        className="h-1"
        style={{
          background: proveedor.activo
            ? `linear-gradient(90deg, ${meta.text}, ${meta.border})`
            : "linear-gradient(90deg,#d4d4d4,#e5e5e5)",
        }}
      />

      <div className="p-5 space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-sm font-playfair font-bold"
              style={{
                background: proveedor.activo ? meta.bg : "#f5f5f5",
                color: proveedor.activo ? meta.text : "#a8a29e",
              }}
            >
              {getInitials(proveedor.nombre)}
            </div>
            <div className="min-w-0">
              <p className="font-playfair text-stone-900 font-semibold text-sm leading-tight truncate">
                {proveedor.nombre}
              </p>
              <p className="text-[10px] font-dm text-stone-400 mt-0.5 flex items-center gap-1">
                <span>{flagFor(proveedor.pais)}</span>
                <span>{proveedor.pais}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <AlcanceBadge alcance={proveedor.alcance} />
            <Badge variant={proveedor.activo ? "green" : "default"} size="xs">
              {proveedor.activo ? (
                <>
                  <CheckCircle2 size={9} /> Activo
                </>
              ) : (
                <>
                  <XCircle size={9} /> Inactivo
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1.5">
          {info.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0">
                <Icon size={10} className="text-stone-400" />
              </div>
              <span className="text-xs font-dm text-stone-500 truncate">
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
          <button
            onClick={() => onEditar(proveedor)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-dm font-semibold text-stone-500 bg-stone-50 hover:bg-stone-100 transition-colors"
          >
            <Pencil size={11} /> Editar
          </button>
          <button
            onClick={() => onToggle(proveedor)}
            disabled={toggling === proveedor.id}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-dm font-semibold transition-colors disabled:opacity-50
              ${proveedor.activo ? "text-red-500 bg-red-50 hover:bg-red-100" : "bg-stone-50 hover:bg-stone-100"}`}
            style={!proveedor.activo ? { color: G[300] } : {}}
          >
            {toggling === proveedor.id ? (
              <Loader2 size={11} className="animate-spin" />
            ) : proveedor.activo ? (
              <>
                <ToggleLeft size={13} /> Desactivar
              </>
            ) : (
              <>
                <ToggleRight size={13} /> Activar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function AProveedoresList() {
  const [modal, setModal] = useState(null); // null | "nuevo" | proveedor-obj
  const [search, setSearch] = useState("");
  const [filtroAl, setFiltroAl] = useState("all"); // all | GLOBAL | PAIS | CIUDAD | LOCAL
  const [filtroPais, setFiltroPais] = useState(""); // país para filtrar
  const [toggling, setToggling] = useState(null);

  const { data, loading } = useQuery(GET_PROVEEDORES, {
    fetchPolicy: "cache-and-network",
  });

  const [actualizar] = useMutation(ACTUALIZAR_PROVEEDOR, {
    refetchQueries: ["GetProveedores"],
  });

  const handleToggle = async (p) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      title: p.activo ? "¿Desactivar proveedor?" : "¿Activar proveedor?",
      html: `<span style="font-family:'DM Sans';color:#78716c">Cambiarás el estado de <b>${p.nombre}</b>.</span>`,
      icon: p.activo ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: p.activo ? "#ef4444" : G[900],
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: p.activo ? "Sí, desactivar" : "Sí, activar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    setToggling(p.id);
    try {
      const { data: res } = await actualizar({
        variables: { id: p.id, activo: !p.activo },
      });
      if (!res?.actualizarProveedor?.ok)
        throw new Error(res?.actualizarProveedor?.error);
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: p.activo ? "Proveedor desactivado" : "Proveedor activado",
        timer: 1400,
        timerProgressBar: true,
        confirmButtonColor: G[900],
      });
    } catch (err) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: err.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setToggling(null);
    }
  };

  const proveedores = data?.proveedores ?? [];

  // Conteos por alcance
  const conteos = { all: proveedores.length };
  Object.keys(ALCANCE_META).forEach((k) => {
    conteos[k] = proveedores.filter((p) => p.alcance === k).length;
  });
  const paisesDisponibles = [
    ...new Set(proveedores.map((p) => p.pais).filter(Boolean)),
  ].sort();

  // Filtrado
  const base =
    filtroAl === "all"
      ? proveedores
      : proveedores.filter((p) => p.alcance === filtroAl);
  const byPais = filtroPais ? base.filter((p) => p.pais === filtroPais) : base;
  const filtered = byPais.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      (p.pais ?? "").toLowerCase().includes(q) ||
      (p.ciudad ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q) ||
      (p.ciudadDestino ?? "").toLowerCase().includes(q)
    );
  });

  const activos = proveedores.filter((p) => p.activo).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title="Proveedores"
        description="Gestión global de proveedores. Crea proveedores por alcance: global, país, ciudad o restaurante específico."
        action={
          <Button onClick={() => setModal("nuevo")}>
            <Plus size={14} /> Nuevo proveedor
          </Button>
        }
      />

      {/* Stats strip */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-dm text-stone-500">
        <span>
          <span className="font-semibold" style={{ color: G[300] }}>
            {proveedores.length}
          </span>{" "}
          total
        </span>
        <span className="text-stone-300">·</span>
        <span>
          <span className="font-semibold text-stone-700">{activos}</span>{" "}
          activos
        </span>
        {Object.entries(ALCANCE_META).map(([k, m]) => (
          <span key={k} className="text-stone-300 first-of-type:hidden">
            ·
          </span>
        ))}
        {Object.entries(ALCANCE_META).map(([k, m]) => (
          <span key={k}>
            <span style={{ color: m.text }} className="font-semibold">
              {conteos[k] ?? 0}
            </span>{" "}
            {m.label.toLowerCase()}
          </span>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Búsqueda */}
        <div
          className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 transition-all"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          onFocusCapture={(e) =>
            (e.currentTarget.style.boxShadow = `0 0 0 2px ${G[300]}`)
          }
          onBlurCapture={(e) =>
            (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)")
          }
        >
          <Search size={14} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, país, ciudad, email…"
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

        {/* Filtro por país */}
        {paisesDisponibles.length > 1 && (
          <select
            value={filtroPais}
            onChange={(e) => setFiltroPais(e.target.value)}
            className={iclsS + " w-auto min-w-[140px] cursor-pointer"}
          >
            <option value="">Todos los países</option>
            {paisesDisponibles.map((p) => (
              <option key={p} value={p}>
                {flagFor(p)} {p}
              </option>
            ))}
          </select>
        )}

        {/* Filtro por alcance */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200 overflow-x-auto">
          {[
            { v: "all", l: "Todos" },
            { v: "GLOBAL", l: "🌐" },
            { v: "PAIS", l: "🗺️" },
            { v: "CIUDAD", l: "📍" },
            { v: "LOCAL", l: "🏠" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltroAl(v)}
              title={v === "all" ? "Todos" : ALCANCE_META[v]?.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all whitespace-nowrap"
              style={
                filtroAl === v
                  ? { background: G[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              {l}
              {v !== "all" && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={
                    filtroAl === v
                      ? { background: "rgba(255,255,255,0.18)", color: "#fff" }
                      : { background: "#f5f5f4", color: "#a8a29e" }
                  }
                >
                  {conteos[v] ?? 0}
                </span>
              )}
              {v === "all" && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={
                    filtroAl === v
                      ? { background: "rgba(255,255,255,0.18)", color: "#fff" }
                      : { background: "#f5f5f4", color: "#a8a29e" }
                  }
                >
                  {proveedores.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-60 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={search ? "Sin resultados" : "Sin proveedores"}
          description={
            search
              ? `No hay proveedores que coincidan con "${search}".`
              : filtroAl !== "all"
                ? `No hay proveedores con alcance ${ALCANCE_META[filtroAl]?.label ?? filtroAl}.`
                : "Aún no has creado ningún proveedor. Crea uno para empezar."
          }
          action={
            !search && (
              <Button onClick={() => setModal("nuevo")}>
                <Plus size={14} /> Nuevo proveedor
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="text-xs font-dm text-stone-400 -mt-2">
            {filtered.length} proveedor{filtered.length !== 1 ? "es" : ""}
            {search && ` — "${search}"`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProveedorCard
                key={p.id}
                proveedor={p}
                onEditar={setModal}
                onToggle={handleToggle}
                toggling={toggling}
              />
            ))}
          </div>
        </>
      )}

      <ProveedorModal
        open={!!modal}
        onClose={() => setModal(null)}
        proveedor={modal === "nuevo" ? null : modal}
      />
    </div>
  );
}
