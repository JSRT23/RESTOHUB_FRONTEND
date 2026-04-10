// src/features/restaurantes/components/RestaurantesList.jsx
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  MapPin,
  Coins,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Building2,
  ArrowRight,
} from "lucide-react";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
} from "../../../shared/components/ui";
import {
  GET_RESTAURANTES,
  ACTIVAR_RESTAURANTE,
  DESACTIVAR_RESTAURANTE,
  ACTUALIZAR_RESTAURANTE,
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
  VES: "Bolívar venezolano",
  BRL: "Real brasileño",
};

function getInitials(nombre = "") {
  const words = nombre.split(" ").filter((w) => w.length > 2);
  return words.length >= 2
    ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
    : nombre.slice(0, 2).toUpperCase();
}

// ── Card ───────────────────────────────────────────────────────────────────
function RestauranteCard({ r, onToggle, onEdit, toggling }) {
  const navigate = useNavigate();
  const flag = PAIS_FLAG[r.pais] || "🌎";
  const initials = getInitials(r.nombre);

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col
                 hover:-translate-y-1 transition-all duration-300 group"
      style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}
    >
      {/* ── COVER — iniciales siempre, imagen si el modelo la tiene ────── */}
      <div
        className="relative h-44 shrink-0 overflow-hidden"
        style={{ background: G[50] }}
      >
        {/* Si el restaurante tiene imagen: <img src={r.imagen} className="w-full h-full object-cover" /> */}
        <div className="w-full h-full flex items-center justify-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm"
            style={{
              background: "white",
              color: G[500],
              border: `2px solid ${G[100]}`,
            }}
          >
            {initials}
          </div>
        </div>

        {/* Badge estado */}
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

        {/* Acciones — visibles al hover */}
        <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={() => onEdit(r)}
            className="w-8 h-8 rounded-xl bg-white border border-stone-200 shadow-sm
                       flex items-center justify-center text-stone-500
                       hover:text-stone-900 hover:border-stone-300 transition-all"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onToggle(r)}
            disabled={toggling === r.id}
            style={
              r.activo
                ? {
                    background: "#fef2f2",
                    color: "#dc2626",
                    borderColor: "#fecaca",
                  }
                : { background: G[50], color: G[300], borderColor: G[100] }
            }
            className="w-8 h-8 rounded-xl border shadow-sm flex items-center justify-center transition-all disabled:opacity-50"
          >
            {toggling === r.id ? (
              <Loader2 size={13} className="animate-spin" />
            ) : r.activo ? (
              <ToggleRight size={13} />
            ) : (
              <ToggleLeft size={13} />
            )}
          </button>
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-5">
        {/* Nombre */}
        <h3
          className="text-[22px] font-bold text-stone-900 leading-tight mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {r.nombre}
        </h3>

        {/* País */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-base leading-none">{flag}</span>
          <span className="text-xs font-dm text-stone-400">{r.pais}</span>
        </div>

        {/* Dirección */}
        <div className="flex items-start gap-1.5 mb-3">
          <MapPin size={12} className="text-stone-300 shrink-0 mt-0.5" />
          <p className="text-sm font-dm text-stone-500 leading-snug line-clamp-2">
            {[r.ciudad, r.direccion].filter(Boolean).join(" — ")}
          </p>
        </div>

        {/* Moneda */}
        <div className="flex items-center gap-1.5">
          <Coins size={12} style={{ color: G[300] }} />
          <span
            style={{ color: G[300] }}
            className="text-sm font-dm font-semibold"
          >
            {r.moneda} · {MONEDA_NOMBRE[r.moneda] || r.moneda}
          </span>
        </div>

        {/* Ver detalle */}
        <div className="mt-auto pt-4 flex justify-end border-t border-stone-100">
          <button
            onClick={() => navigate(`/restaurantes/${r.id}`)}
            className="flex items-center gap-1.5 text-sm font-dm font-semibold text-stone-400
                       hover:text-stone-900 transition-all group/link"
          >
            Ver detalle
            <ArrowRight
              size={14}
              className="group-hover/link:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Editar ───────────────────────────────────────────────────────────
function EditarModal({ restaurante: r, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: r.nombre,
    ciudad: r.ciudad || "",
    direccion: r.direccion || "",
  });
  const [error, setError] = useState("");
  const [actualizar, { loading }] = useMutation(ACTUALIZAR_RESTAURANTE);

  const fi = (e) => {
    e.target.style.borderColor = "transparent";
    e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
  };
  const fb = (e) => {
    e.target.style.borderColor = "#e2e8f0";
    e.target.style.boxShadow = "none";
  };
  const cls =
    "w-full px-3.5 py-3 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all shadow-sm";

  const handleSave = async () => {
    const { data } = await actualizar({ variables: { id: r.id, ...form } });
    const res = data?.actualizarRestaurante;
    if (!res?.ok) {
      setError(res?.error || "Error al guardar.");
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
            className="font-semibold text-stone-900 text-lg"
            style={{ fontFamily: "'Playfair Display', serif" }}
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
            onClick={handleSave}
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

// ── Main ───────────────────────────────────────────────────────────────────
export default function RestaurantesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [editando, setEditando] = useState(null);
  const [toggling, setToggling] = useState(null);

  const { data, loading, refetch } = useQuery(GET_RESTAURANTES, {
    fetchPolicy: "cache-and-network",
  });
  const [activar] = useMutation(ACTIVAR_RESTAURANTE);
  const [desactivar] = useMutation(DESACTIVAR_RESTAURANTE);

  const todos = data?.restaurantes || [];
  const restaurantes = todos.filter((r) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      r.nombre.toLowerCase().includes(q) ||
      r.ciudad?.toLowerCase().includes(q) ||
      r.pais?.toLowerCase().includes(q);
    const matchF =
      filtro === "todos" ? true : filtro === "activos" ? r.activo : !r.activo;
    return matchQ && matchF;
  });

  const handleToggle = async (r) => {
    setToggling(r.id);
    if (r.activo) {
      await desactivar({ variables: { id: r.id } });
    } else {
      await activar({ variables: { id: r.id } });
    }
    await refetch();
    setToggling(null);
  };

  const activos = todos.filter((r) => r.activo).length;
  const inactivos = todos.filter((r) => !r.activo).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Central"
        title="Restaurantes"
        description="Gestiona la red de restaurantes de la cadena"
        action={
          <Button
            onClick={() => navigate("/restaurantes/nuevo")}
            variant="primary"
            size="md"
          >
            <Plus size={15} /> Nuevo restaurante
          </Button>
        }
      />

      {/* Stats */}
      {!loading && todos.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { n: todos.length, l: "en total", style: {} },
            {
              n: activos,
              l: "activos",
              style: { background: `${G[50]}99`, borderColor: G[100] },
            },
            ...(inactivos > 0
              ? [{ n: inactivos, l: "inactivos", style: {} }]
              : []),
          ].map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-4 py-2.5 shadow-sm"
              style={s.style}
            >
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: s.style.borderColor ? G[500] : "#1c1917",
                }}
              >
                {s.n}
              </span>
              <span
                className="text-xs font-dm"
                style={{ color: s.style.borderColor ? G[300] : "#9ca3af" }}
              >
                {s.l}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, ciudad o país..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-700 placeholder:text-stone-300 outline-none shadow-sm transition-all"
            onFocus={(e) => {
              e.target.style.borderColor = "transparent";
              e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
          {["todos", "activos", "inactivos"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={filtro === f ? { background: G[900], color: "white" } : {}}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-dm font-semibold capitalize transition-all ${filtro === f ? "" : "text-stone-500 hover:bg-stone-50"}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-sm"
            >
              <Skeleton className="h-44 rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : restaurantes.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search ? "Sin resultados" : "Sin restaurantes"}
          description={
            search
              ? `No hay coincidencias con "${search}"`
              : "Crea el primer restaurante de la cadena"
          }
          action={
            !search && (
              <Button
                onClick={() => navigate("/restaurantes/nuevo")}
                variant="primary"
                size="sm"
              >
                <Plus size={13} /> Crear restaurante
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="text-xs font-dm text-stone-400">
            {restaurantes.length} restaurante
            {restaurantes.length !== 1 ? "s" : ""}
            {filtro !== "todos" ? ` ${filtro}` : ""}
            {search ? ` · "${search}"` : ""}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restaurantes.map((r) => (
              <RestauranteCard
                key={r.id}
                r={r}
                toggling={toggling}
                onToggle={handleToggle}
                onEdit={setEditando}
              />
            ))}
          </div>
        </>
      )}

      {editando && (
        <EditarModal
          restaurante={editando}
          onClose={() => setEditando(null)}
          onSaved={() => {
            setEditando(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
