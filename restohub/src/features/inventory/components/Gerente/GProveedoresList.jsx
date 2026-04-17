// src/features/inventory/components/gerente/GProveedoresList.jsx
//
// Gestión de proveedores para gerente_local — Modelo Opción-B (alcance por scope).
// · El gateway filtra automáticamente por JWT: el gerente ve GLOBAL + PAIS + CIUDAD + LOCAL(suyo).
// · El gerente crea siempre con alcance=LOCAL (automático).
// · Solo puede EDITAR/DESACTIVAR los proveedores que él mismo creó (LOCAL + creadoPorRestauranteId=suyo).
// · Proveedores externos (GLOBAL/PAIS/CIUDAD) son solo lectura con su etiqueta de alcance.
//
// Requiere en inventory/graphql/queries.js   → GET_PROVEEDORES con campos de alcance
// Requiere en inventory/graphql/mutations.js → CREAR_PROVEEDOR + ACTUALIZAR_PROVEEDOR actualizados
// (ver PATCH_queries_proveedores.js y PATCH_mutations_proveedores.js)

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Truck,
  Plus,
  Search,
  Globe,
  Phone,
  Mail,
  Coins,
  CheckCircle2,
  XCircle,
  Eye,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  MapPin,
  Building2,
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
import { useAuth } from "../../../../app/auth/AuthContext";
import { GET_MI_RESTAURANTE } from "../../../menu/components/Gerente/graphql/operations";

// ── Paleta ────────────────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

// ── Alcance meta ──────────────────────────────────────────────────────────
const ALCANCE_META = {
  GLOBAL: {
    label: "Global",
    bg: "#eff6ff",
    text: "#3b82f6",
    border: "#bfdbfe",
    icon: "🌐",
  },
  PAIS: {
    label: "País",
    bg: "#faf5ff",
    text: "#7c3aed",
    border: "#ddd6fe",
    icon: "🗺️",
  },
  CIUDAD: {
    label: "Ciudad",
    bg: "#fff7ed",
    text: "#ea580c",
    border: "#fed7aa",
    icon: "📍",
  },
  LOCAL: {
    label: "Propio",
    bg: G[50],
    text: G[300],
    border: G[100],
    icon: "🏠",
  },
};

function AlcanceBadge({ alcance }) {
  const m = ALCANCE_META[alcance] ?? ALCANCE_META.GLOBAL;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-dm font-semibold border"
      style={{ background: m.bg, color: m.text, borderColor: m.border }}
    >
      <span>{m.icon}</span>
      {m.label}
    </span>
  );
}

// ── Catálogos ─────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────
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
const iclsRO =
  "w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-dm text-stone-400 outline-none shadow-sm cursor-not-allowed";

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
function Field({ icon: Icon, label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-dm font-semibold text-stone-500">
        {Icon && <Icon size={11} style={{ color: G[300] }} />}
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Modal Crear / Editar / Ver ────────────────────────────────────────────
function ProveedorModal({ open, onClose, proveedor, restauranteId }) {
  const editando = !!proveedor;
  const esPropio =
    proveedor?.alcance === "LOCAL" &&
    proveedor?.creadoPorRestauranteId === restauranteId;
  const readOnly = editando && !esPropio;

  const INIT = {
    nombre: "",
    pais: "Colombia",
    ciudad: "",
    telefono: "",
    email: "",
    monedaPreferida: "COP",
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

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "El nombre es requerido",
        confirmButtonColor: G[900],
      });
      return;
    }
    try {
      let res;
      if (editando && esPropio) {
        const { data } = await actualizar({
          variables: {
            id: proveedor.id,
            nombre: form.nombre.trim() || undefined,
            pais: form.pais || undefined,
            ciudad: form.ciudad || null,
            telefono: form.telefono || null,
            email: form.email || null,
            monedaPreferida: form.monedaPreferida || null,
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
            alcance: "LOCAL",
            restauranteIdDestino: restauranteId,
          },
        });
        res = data?.crearProveedor;
      }
      if (!res?.ok) throw new Error(res?.error ?? "Error desconocido");
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: editando ? "Proveedor actualizado" : "¡Proveedor creado!",
        html: `<span style="font-family:'DM Sans';color:#78716c"><b>${form.nombre}</b> fue ${editando ? "actualizado" : "agregado"} correctamente.</span>`,
        confirmButtonColor: G[900],
        timer: 1800,
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

  const alcanceMeta = proveedor
    ? (ALCANCE_META[proveedor.alcance] ?? ALCANCE_META.GLOBAL)
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        readOnly
          ? proveedor.nombre
          : editando
            ? "Editar proveedor"
            : "Nuevo proveedor"
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Banner de contexto cuando se está viendo un proveedor */}
        {editando && (
          <div
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border"
            style={{
              background: alcanceMeta.bg,
              borderColor: alcanceMeta.border,
            }}
          >
            <span className="text-lg">{alcanceMeta.icon}</span>
            <div>
              <p
                className="text-xs font-dm font-semibold"
                style={{ color: alcanceMeta.text }}
              >
                Proveedor {alcanceMeta.label}
              </p>
              <p className="text-[10px] font-dm text-stone-500 mt-0.5">
                {readOnly
                  ? "Configurado por el administrador — solo lectura."
                  : "Proveedor local de tu restaurante — editable."}
              </p>
            </div>
          </div>
        )}

        {/* Nombre */}
        <Field icon={Building2} label="Nombre" required>
          <input
            className={readOnly ? iclsRO : icls}
            onFocus={readOnly ? undefined : fi}
            onBlur={readOnly ? undefined : fb}
            value={form.nombre}
            onChange={set("nombre")}
            placeholder="Ej: Carnes Premium S.A.S"
            readOnly={readOnly}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field icon={Globe} label="País">
            <select
              className={
                (readOnly ? iclsRO : icls) +
                " appearance-none" +
                (readOnly ? "" : " cursor-pointer")
              }
              onFocus={readOnly ? undefined : fi}
              onBlur={readOnly ? undefined : fb}
              value={form.pais}
              onChange={set("pais")}
              disabled={readOnly}
            >
              {PAISES.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.flag} {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field icon={MapPin} label="Ciudad">
            <input
              className={readOnly ? iclsRO : icls}
              onFocus={readOnly ? undefined : fi}
              onBlur={readOnly ? undefined : fb}
              value={form.ciudad}
              onChange={set("ciudad")}
              placeholder="Ej: Bogotá"
              readOnly={readOnly}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field icon={Phone} label="Teléfono">
            <input
              className={readOnly ? iclsRO : icls}
              onFocus={readOnly ? undefined : fi}
              onBlur={readOnly ? undefined : fb}
              value={form.telefono}
              onChange={set("telefono")}
              placeholder="+57 300…"
              readOnly={readOnly}
            />
          </Field>
          <Field icon={Mail} label="Email">
            <input
              type="email"
              className={readOnly ? iclsRO : icls}
              onFocus={readOnly ? undefined : fi}
              onBlur={readOnly ? undefined : fb}
              value={form.email}
              onChange={set("email")}
              placeholder="contacto@prov.com"
              readOnly={readOnly}
            />
          </Field>
        </div>

        <Field icon={Coins} label="Moneda preferida">
          <select
            className={
              (readOnly ? iclsRO : icls) +
              " appearance-none" +
              (readOnly ? "" : " cursor-pointer")
            }
            onFocus={readOnly ? undefined : fi}
            onBlur={readOnly ? undefined : fb}
            value={form.monedaPreferida}
            onChange={set("monedaPreferida")}
            disabled={readOnly}
          >
            {MONEDAS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>

        {/* Info pill al crear */}
        {!editando && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-dm"
            style={{ background: G[50], borderColor: G[100], color: G[300] }}
          >
            <span>🏠</span>
            <span>
              Se creará como proveedor <strong>local</strong> — solo visible
              para tu restaurante.
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {readOnly ? "Cerrar" : "Cancelar"}
          </Button>
          {!readOnly && (
            <Button
              size="sm"
              loading={loading}
              disabled={!form.nombre.trim()}
              onClick={handleSave}
            >
              {editando ? "Guardar cambios" : "Crear proveedor"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── ProveedorCard ─────────────────────────────────────────────────────────
function ProveedorCard({
  proveedor,
  onAbrir,
  onToggle,
  toggling,
  restauranteId,
}) {
  const esPropio =
    proveedor.alcance === "LOCAL" &&
    proveedor.creadoPorRestauranteId === restauranteId;
  const meta = ALCANCE_META[proveedor.alcance] ?? ALCANCE_META.GLOBAL;

  const info = [
    proveedor.ciudad
      ? { icon: MapPin, text: `${proveedor.ciudad}, ${proveedor.pais}` }
      : { icon: Globe, text: proveedor.pais },
    proveedor.telefono && { icon: Phone, text: proveedor.telefono },
    proveedor.email && { icon: Mail, text: proveedor.email },
    { icon: Coins, text: proveedor.monedaPreferida ?? "—" },
  ].filter(Boolean);

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:-translate-y-0.5 transition-all duration-200"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {/* Barra de color según alcance */}
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
          {/* Badges apilados */}
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
            onClick={() => onAbrir(proveedor)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-dm font-semibold text-stone-500 bg-stone-50 hover:bg-stone-100 transition-colors"
          >
            {esPropio ? <Pencil size={11} /> : <Eye size={11} />}
            {esPropio ? "Editar" : "Ver detalle"}
          </button>

          {esPropio ? (
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
          ) : (
            <div className="flex-1 flex items-center justify-center py-2 rounded-xl bg-stone-50 text-[10px] font-dm text-stone-300">
              Solo lectura
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function GProveedoresList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [modalProv, setModalProv] = useState(null); // null | "nuevo" | proveedor-obj
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("all"); // all | propio | externo
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
  const propios = proveedores.filter(
    (p) => p.alcance === "LOCAL" && p.creadoPorRestauranteId === restauranteId,
  );
  const externos = proveedores.filter(
    (p) =>
      !(p.alcance === "LOCAL" && p.creadoPorRestauranteId === restauranteId),
  );
  const activos = proveedores.filter((p) => p.activo).length;

  const base =
    filtro === "propio"
      ? propios
      : filtro === "externo"
        ? externos
        : proveedores;
  const filtered = base.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      (p.pais ?? "").toLowerCase().includes(q) ||
      (p.ciudad ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title="Proveedores"
        description="Ves los proveedores globales, de tu país/ciudad y los que tú creaste."
        action={
          <div className="flex items-center gap-2">
            {/* Leyenda compacta */}
            <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
              {Object.entries(ALCANCE_META).map(([k, m]) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-dm font-semibold border"
                  style={{
                    background: m.bg,
                    color: m.text,
                    borderColor: m.border,
                  }}
                >
                  {m.icon} {m.label}
                </span>
              ))}
            </div>
            <Button onClick={() => setModalProv("nuevo")}>
              <Plus size={14} /> Nuevo proveedor
            </Button>
          </div>
        }
      />

      {/* Stats strip */}
      <div className="flex items-center gap-3 text-xs font-dm text-stone-500">
        <span>
          <span className="font-semibold" style={{ color: G[300] }}>
            {propios.length}
          </span>{" "}
          propios
        </span>
        <span className="text-stone-300">·</span>
        <span>
          <span className="font-semibold text-blue-500">{externos.length}</span>{" "}
          del administrador
        </span>
        <span className="text-stone-300">·</span>
        <span>
          <span className="font-semibold text-stone-700">{activos}</span>{" "}
          activos
        </span>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
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
            placeholder="Buscar por nombre, país o ciudad…"
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
            { v: "all", l: "Todos", n: proveedores.length },
            { v: "propio", l: "Propios", n: propios.length },
            { v: "externo", l: "Externos", n: externos.length },
          ].map(({ v, l, n }) => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
              style={
                filtro === v
                  ? { background: G[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              {l}
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={
                  filtro === v
                    ? { background: "rgba(255,255,255,0.18)", color: "#fff" }
                    : { background: "#f5f5f4", color: "#a8a29e" }
                }
              >
                {n}
              </span>
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
          title={
            search
              ? "Sin resultados"
              : filtro === "propio"
                ? "Sin proveedores propios"
                : "Sin proveedores"
          }
          description={
            search
              ? `No hay proveedores que coincidan con "${search}".`
              : filtro === "propio"
                ? "Aún no has creado ningún proveedor propio para tu restaurante."
                : "El administrador aún no ha asignado proveedores para tu ciudad o país."
          }
          action={
            !search && (
              <Button onClick={() => setModalProv("nuevo")}>
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
                onAbrir={setModalProv}
                onToggle={handleToggle}
                toggling={toggling}
                restauranteId={restauranteId}
              />
            ))}
          </div>
        </>
      )}

      <ProveedorModal
        key={modalProv === "nuevo" ? "nuevo" : (modalProv?.id ?? "nuevo")}
        open={!!modalProv}
        onClose={() => setModalProv(null)}
        proveedor={modalProv === "nuevo" ? null : modalProv}
        restauranteId={restauranteId}
      />
    </div>
  );
}
