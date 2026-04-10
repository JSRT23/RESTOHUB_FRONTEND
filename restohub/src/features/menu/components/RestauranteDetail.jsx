// src/features/restaurantes/components/RestauranteDetail.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Building2,
  MapPin,
  Coins,
  Tag,
  UtensilsCrossed,
  Info,
  BookOpen,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ChevronDown,
  DollarSign,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import {
  Breadcrumb,
  Skeleton,
  EmptyState,
} from "../../../shared/components/ui";
import {
  GET_RESTAURANTE,
  GET_MENU_RESTAURANTE,
  ACTUALIZAR_RESTAURANTE,
  ACTIVAR_RESTAURANTE,
  DESACTIVAR_RESTAURANTE,
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

// foco verde reutilizable
const fi = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
};
const fb = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};

// ── Modal editar ───────────────────────────────────────────────────────────
function EditarModal({ r, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: r.nombre,
    ciudad: r.ciudad || "",
    direccion: r.direccion || "",
  });
  const [error, setError] = useState("");
  const [actualizar, { loading }] = useMutation(ACTUALIZAR_RESTAURANTE);
  const cls =
    "w-full px-3.5 py-3 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all shadow-sm";

  const save = async () => {
    const { data } = await actualizar({ variables: { id: r.id, ...form } });
    if (!data?.actualizarRestaurante?.ok) {
      setError(data?.actualizarRestaurante?.error || "Error al guardar.");
      return;
    }
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1" style={{ background: G[900] }} />
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="font-semibold text-stone-900 text-lg"
          >
            Editar restaurante
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400 text-sm transition"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: "Nombre", key: "nombre", ph: "Nombre del restaurante" },
            { label: "Ciudad", key: "ciudad", ph: "Ciudad" },
            { label: "Dirección", key: "direccion", ph: "Dirección completa" },
          ].map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
                {f.label}
              </label>
              <input
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.ph}
                className={cls}
                onFocus={fi}
                onBlur={fb}
              />
            </div>
          ))}
          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
              <p className="text-xs font-dm text-red-600">{error}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-stone-100 bg-stone-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-dm font-semibold text-stone-500 bg-white border border-stone-200 hover:border-stone-300 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={loading}
            style={{ background: G[900] }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-dm font-bold text-white hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {loading && <Loader2 size={13} className="animate-spin" />} Guardar
            cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hero (columna izquierda — sticky) ─────────────────────────────────────
function RestauranteHero({ r, onEdit, onToggle, toggling }) {
  const flag = PAIS_FLAG[r.pais] || "🌎";
  const initials = getInitials(r.nombre);

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}
    >
      {/* Cover — iniciales, imagen cuando r.imagen exista */}
      <div
        className="relative h-48 flex items-center justify-center"
        style={{ background: G[50] }}
      >
        {r.imagen ? (
          <img
            src={r.imagen}
            alt={r.nombre}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{
              background: "white",
              color: G[500],
              border: `2px solid ${G[100]}`,
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
          >
            {initials}
          </div>
        )}
        {/* Línea de estado abajo del cover */}
        <div
          className="absolute bottom-0 inset-x-0 h-1"
          style={{ background: r.activo ? G[300] : "#d1d5db" }}
        />
        {/* Badge */}
        <div className="absolute top-3 right-3">
          <span
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
            className="text-[10px] font-dm font-bold px-3 py-1.5 rounded-full tracking-wide"
          >
            {r.activo ? "ACTIVO" : "INACTIVO"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-6 space-y-4">
        {/* País */}
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{flag}</span>
          <span className="text-xs font-dm text-stone-400 font-semibold uppercase tracking-wider">
            {r.pais}
          </span>
        </div>

        {/* Nombre */}
        <h1
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="text-3xl font-bold text-stone-900 leading-tight"
        >
          {r.nombre}
        </h1>

        {/* Separador */}
        <div className="h-px bg-stone-100" />

        {/* Detalles */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: G[50] }}
            >
              <MapPin size={12} style={{ color: G[300] }} />
            </div>
            <div>
              <p className="text-[10px] font-dm font-bold text-stone-400 uppercase tracking-wider mb-0.5">
                Ciudad
              </p>
              <p className="text-sm font-dm text-stone-700 font-medium">
                {r.ciudad || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: G[50] }}
            >
              <MapPin size={12} style={{ color: G[300] }} />
            </div>
            <div>
              <p className="text-[10px] font-dm font-bold text-stone-400 uppercase tracking-wider mb-0.5">
                Dirección
              </p>
              <p className="text-sm font-dm text-stone-700 font-medium">
                {r.direccion || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: G[50] }}
            >
              <Coins size={12} style={{ color: G[300] }} />
            </div>
            <div>
              <p className="text-[10px] font-dm font-bold text-stone-400 uppercase tracking-wider mb-0.5">
                Moneda
              </p>
              <p
                className="text-sm font-dm font-bold"
                style={{ color: G[300] }}
              >
                {r.moneda} · {MONEDA_NOMBRE[r.moneda] || r.moneda}
              </p>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="h-px bg-stone-100" />

        {/* Acciones */}
        <div className="space-y-2">
          <button
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                       text-sm font-dm font-semibold text-stone-600 bg-stone-50 border border-stone-200
                       hover:border-stone-300 hover:text-stone-900 transition-all"
          >
            <Pencil size={13} /> Editar información
          </button>

          <button
            onClick={onToggle}
            disabled={toggling}
            style={
              r.activo
                ? {
                    background: "#fef2f2",
                    color: "#dc2626",
                    borderColor: "#fecaca",
                  }
                : { background: G[50], color: G[300], borderColor: G[100] }
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                       text-sm font-dm font-semibold border transition-all disabled:opacity-50"
          >
            {toggling ? (
              <Loader2 size={13} className="animate-spin" />
            ) : r.activo ? (
              <ToggleRight size={13} />
            ) : (
              <ToggleLeft size={13} />
            )}
            {toggling
              ? "Procesando..."
              : r.activo
                ? "Desactivar restaurante"
                : "Activar restaurante"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab Info ───────────────────────────────────────────────────────────────
function TabInfo({ r }) {
  const flag = PAIS_FLAG[r.pais] || "🌎";
  const rows = [
    { label: "Nombre", value: r.nombre, Icon: Building2 },
    { label: "País", value: `${flag} ${r.pais}`, Icon: null },
    { label: "Ciudad", value: r.ciudad, Icon: MapPin },
    { label: "Dirección", value: r.direccion, Icon: MapPin },
    {
      label: "Moneda",
      value: `${r.moneda} · ${MONEDA_NOMBRE[r.moneda] || r.moneda}`,
      Icon: Coins,
    },
    { label: "Estado", value: null, Icon: ShieldCheck, badge: r.activo },
  ];

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: G[50] }}
        >
          <Info size={14} style={{ color: G[300] }} />
        </div>
        <h2
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="font-semibold text-stone-900 text-lg"
        >
          Información general
        </h2>
      </div>
      {/* Filas */}
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-center gap-4 px-5 py-4 ${i < rows.length - 1 ? "border-b border-stone-100" : ""}`}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: G[50] }}
          >
            {row.Icon ? (
              <row.Icon size={13} style={{ color: G[300] }} />
            ) : (
              <span className="text-sm">{flag}</span>
            )}
          </div>
          <span className="text-xs font-dm font-bold text-stone-400 uppercase tracking-wider w-24 shrink-0">
            {row.label}
          </span>
          {row.badge !== undefined ? (
            <span
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
              className="text-[10px] font-dm font-bold px-3 py-1.5 rounded-full tracking-wide"
            >
              {r.activo ? "ACTIVO" : "INACTIVO"}
            </span>
          ) : (
            <span className="text-sm font-dm text-stone-800 font-medium">
              {row.value || (
                <span className="text-stone-300 italic">Sin datos</span>
              )}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Plato row ──────────────────────────────────────────────────────────────
function PlatoRow({ plato, precio, moneda }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
          <UtensilsCrossed size={11} className="text-stone-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-dm font-semibold text-stone-800 truncate">
            {plato.nombre}
          </p>
          {plato.descripcion && (
            <p className="text-[11px] font-dm text-stone-400 truncate">
              {plato.descripcion}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <span
          style={
            plato.activo
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
          className="text-[9px] font-dm font-bold px-2 py-1 rounded-full"
        >
          {plato.activo ? "Activo" : "Inactivo"}
        </span>
        {precio ? (
          <span
            style={{ color: G[500] }}
            className="text-sm font-dm font-bold whitespace-nowrap"
          >
            {Number(precio.precio).toLocaleString("es-CO")} {moneda}
          </span>
        ) : (
          <span className="text-xs font-dm text-stone-300 italic">
            Sin precio
          </span>
        )}
      </div>
    </div>
  );
}

// ── Categoría accordion ────────────────────────────────────────────────────
function CategoriaAccordion({ grupo, moneda }) {
  const [open, setOpen] = useState(true);
  const { categoria, platos } = grupo;
  const conPrecio = platos.filter((p) => p.precio).length;

  return (
    <div className="border border-stone-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition-colors bg-stone-50/50"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: G[50] }}
          >
            <Tag size={12} style={{ color: G[300] }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-dm font-bold text-stone-800">
              {categoria.nombre}
            </p>
            {categoria.descripcion && (
              <p className="text-[11px] font-dm text-stone-400">
                {categoria.descripcion}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-dm font-bold px-2 py-1 rounded-full bg-stone-100 text-stone-500">
            {platos.length} plato{platos.length !== 1 ? "s" : ""}
          </span>
          <ChevronDown
            size={13}
            className={`text-stone-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div className="px-2 py-1.5 space-y-0.5 bg-white">
          {platos.length === 0 ? (
            <p className="text-xs font-dm text-stone-400 px-3 py-3 italic">
              Sin platos en esta categoría
            </p>
          ) : (
            platos.map(({ plato, precio }) => (
              <PlatoRow
                key={plato.id}
                plato={plato}
                precio={precio}
                moneda={moneda}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab Menú ───────────────────────────────────────────────────────────────
function TabMenu({ restauranteId }) {
  const { data, loading } = useQuery(GET_MENU_RESTAURANTE, {
    variables: { restauranteId },
    fetchPolicy: "cache-and-network",
  });

  if (loading)
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-stone-100 animate-pulse" />
        ))}
      </div>
    );

  const menu = data?.menuRestaurante;
  const categorias = menu?.categorias || [];
  const moneda = menu?.restaurante?.moneda || "COP";
  const totalPlatos = categorias.reduce((s, g) => s + g.platos.length, 0);
  const totalConPrecio = categorias.reduce(
    (s, g) => s + g.platos.filter((p) => p.precio).length,
    0,
  );

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: G[50] }}
        >
          <BookOpen size={14} style={{ color: G[300] }} />
        </div>
        <h2
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="font-semibold text-stone-900 text-lg flex-1"
        >
          Menú del restaurante
        </h2>
        <span className="text-xs font-dm text-stone-400 italic">
          Solo lectura
        </span>
      </div>

      <div className="p-5 space-y-4">
        {categorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center">
              <BookOpen size={20} className="text-stone-300" />
            </div>
            <p
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-stone-600 font-semibold"
            >
              Sin menú configurado
            </p>
            <p className="text-xs font-dm text-stone-400">
              El gerente debe crear las categorías y platos
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Categorías", value: categorias.length, icon: Tag },
                { label: "Platos", value: totalPlatos, icon: UtensilsCrossed },
                {
                  label: "Con precio",
                  value: totalConPrecio,
                  icon: DollarSign,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-stone-100 p-3 text-center bg-stone-50/50"
                >
                  <s.icon
                    size={13}
                    className="mx-auto mb-1"
                    style={{ color: G[300] }}
                  />
                  <p
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: G[900],
                    }}
                    className="text-xl font-bold"
                  >
                    {s.value}
                  </p>
                  <p className="text-[10px] font-dm text-stone-400 mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Banner */}
            <div
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border"
              style={{ background: `${G[50]}99`, borderColor: G[100] }}
            >
              <Info size={12} style={{ color: G[300] }} />
              <p className="text-[11px] font-dm" style={{ color: G[500] }}>
                El gerente gestiona platos, categorías y precios.
              </p>
            </div>

            {/* Acordeones */}
            <div className="space-y-2">
              {categorias.map((grupo) => (
                <CategoriaAccordion
                  key={grupo.categoria.id}
                  grupo={grupo}
                  moneda={moneda}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function RestauranteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editando, setEdit] = useState(false);
  const [toggling, setToggle] = useState(false);
  const [tab, setTab] = useState("info");

  const { data, loading, refetch } = useQuery(GET_RESTAURANTE, {
    variables: { id },
    fetchPolicy: "cache-and-network",
  });
  const [activar] = useMutation(ACTIVAR_RESTAURANTE);
  const [desactivar] = useMutation(DESACTIVAR_RESTAURANTE);

  const r = data?.restaurante;

  const handleToggle = async () => {
    setToggle(true);
    if (r.activo) {
      await desactivar({ variables: { id } });
    } else {
      await activar({ variables: { id } });
    }
    await refetch();
    setToggle(false);
  };

  if (loading)
    return (
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5 space-y-3">
          <div className="h-48 rounded-2xl bg-stone-200 animate-pulse" />
          <div className="h-64 rounded-2xl bg-stone-100 animate-pulse" />
        </div>
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <div className="h-48 rounded-2xl bg-stone-100 animate-pulse" />
          <div className="h-64 rounded-2xl bg-stone-100 animate-pulse" />
        </div>
      </div>
    );

  if (!r)
    return (
      <div className="max-w-7xl mx-auto p-4">
        <EmptyState
          icon={Building2}
          title="Restaurante no encontrado"
          action={
            <button
              onClick={() => navigate("/restaurantes")}
              style={{ background: G[900] }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-dm font-bold text-white hover:opacity-90 transition"
            >
              <ArrowLeft size={14} /> Volver a restaurantes
            </button>
          }
        />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Restaurantes", onClick: () => navigate("/restaurantes") },
          { label: r.nombre },
        ]}
      />

      <div className="grid grid-cols-12 gap-6">
        {/* ── Columna izquierda: Hero sticky ─────────────────────────── */}
        <div className="col-span-12 lg:col-span-5">
          <div className="lg:sticky lg:top-6">
            <RestauranteHero
              r={r}
              onEdit={() => setEdit(true)}
              onToggle={handleToggle}
              toggling={toggling}
            />
          </div>
        </div>

        {/* ── Columna derecha: tabs + contenido ───────────────────────── */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          {/* Selector de tabs */}
          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm w-fit">
            {[
              { key: "info", label: "Información", icon: Info },
              { key: "menu", label: "Menú", icon: BookOpen },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={
                  tab === t.key ? { background: G[900], color: "white" } : {}
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-dm font-semibold transition-all
                  ${tab === t.key ? "" : "text-stone-500 hover:bg-stone-50"}`}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenido */}
          {tab === "info" && <TabInfo r={r} />}
          {tab === "menu" && <TabMenu restauranteId={id} />}
        </div>
      </div>

      {/* Modal editar */}
      {editando && (
        <EditarModal
          r={r}
          onClose={() => setEdit(false)}
          onSaved={() => {
            setEdit(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
