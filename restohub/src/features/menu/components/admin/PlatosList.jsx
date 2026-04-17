// src/features/menu/components/admin/PlatosList.jsx
// Admin Central — catálogo de platos.
// Ve globales + de cualquier restaurante.
// Acciones: activar/desactivar, ver detalle (PlatoDetail existente).
// Crear nuevo plato → /menu/platos/nuevo (ruta a CreatePlato.jsx existente).

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  UtensilsCrossed,
  Tag,
  CheckCircle2,
  XCircle,
  Eye,
  ToggleLeft,
  ToggleRight,
  ImageOff,
  Globe,
  Building2,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";
import { GET_PLATOS } from "./graphql/queries";
import { GET_RESTAURANTES } from "./graphql/operations";
import { GET_CATEGORIAS } from "./graphql/categorias.operations";
import { ACTIVAR_PLATO, DESACTIVAR_PLATO } from "./graphql/mutations";
import {
  Badge,
  Button,
  PageHeader,
  EmptyState,
  Skeleton,
} from "../../../../shared/components/ui";

// ── Paleta ─────────────────────────────────────────────────────────────────
const A = {
  accent: "#D97706",
  accentLight: "#FEF3C7",
  900: "#1C1917",
};

function getInitials(n = "") {
  const w = n.trim().split(/\s+/);
  return w.length >= 2
    ? (w[0][0] + w[1][0]).toUpperCase()
    : n.slice(0, 2).toUpperCase();
}

// ── Fila de plato ──────────────────────────────────────────────────────────
function PlatoRow({ plato, onToggle, onView, toggling, restaurantesMap }) {
  const esGlobal = !plato.restauranteId;
  const restaurante = plato.restauranteId
    ? restaurantesMap[plato.restauranteId]
    : null;

  return (
    <div className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 transition-all duration-150">
      {/* Imagen o iniciales */}
      <div className="w-11 h-11 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
        {plato.imagen ? (
          <img
            src={plato.imagen}
            alt={plato.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-playfair text-xs font-bold text-stone-400">
            {getInitials(plato.nombre)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-playfair text-stone-900 font-semibold text-sm truncate">
            {plato.nombre}
          </p>
          {plato.categoriaNombre && (
            <Badge variant="muted" size="xs">
              <Tag size={8} /> {plato.categoriaNombre}
            </Badge>
          )}
        </div>
        <p className="text-[11px] font-dm text-stone-400 truncate mt-0.5">
          {plato.descripcion}
        </p>
      </div>

      {/* Scope */}
      <span
        className="hidden md:inline-flex items-center gap-1 text-[10px] font-dm font-semibold px-2 py-1 rounded-full shrink-0"
        style={
          esGlobal
            ? { background: "#eff6ff", color: "#3b82f6" }
            : { background: "#f0fdf4", color: "#16a34a" }
        }
      >
        {esGlobal ? (
          <>
            <Globe size={9} /> Global
          </>
        ) : (
          <>
            <Building2 size={9} /> {restaurante?.nombre ?? "Restaurante"}
          </>
        )}
      </span>

      {/* Estado */}
      <Badge variant={plato.activo ? "green" : "default"} size="xs">
        {plato.activo ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
        {plato.activo ? "Activo" : "Inactivo"}
      </Badge>

      {/* Fecha creación */}
      <span className="hidden lg:block text-[11px] font-dm text-stone-400 shrink-0">
        {plato.fechaCreacion
          ? new Date(plato.fechaCreacion).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—"}
      </span>

      {/* Acciones */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onView(plato.id)}
          className="w-8 h-8 rounded-lg bg-stone-50 hover:bg-stone-100 flex items-center justify-center transition-colors"
          title="Ver detalle"
        >
          <Eye size={13} className="text-stone-500" />
        </button>
        <button
          onClick={() => onToggle(plato)}
          disabled={toggling === plato.id}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${
            plato.activo
              ? "bg-red-50 hover:bg-red-100"
              : "bg-stone-50 hover:bg-stone-100"
          }`}
          title={plato.activo ? "Desactivar" : "Activar"}
        >
          {toggling === plato.id ? (
            <Loader2 size={12} className="animate-spin text-stone-400" />
          ) : plato.activo ? (
            <ToggleRight size={15} className="text-red-500" />
          ) : (
            <ToggleLeft size={15} className="text-stone-400" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function PlatosList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filtroScope, setFiltroScope] = useState("all");
  const [filtroActivo, setFiltroActivo] = useState("all");
  const [filtroCat, setFiltroCat] = useState("all");
  const [toggling, setToggling] = useState(null);

  const { data, loading } = useQuery(GET_PLATOS, {
    fetchPolicy: "cache-and-network",
  });
  const { data: catData } = useQuery(GET_CATEGORIAS);
  const { data: restData } = useQuery(GET_RESTAURANTES);

  const [activarPlato] = useMutation(ACTIVAR_PLATO, {
    refetchQueries: ["GetPlatos"],
  });
  const [desactivarPlato] = useMutation(DESACTIVAR_PLATO, {
    refetchQueries: ["GetPlatos"],
  });

  const platos = data?.platos ?? [];
  const categorias = catData?.categorias ?? [];
  const restaurantes = restData?.restaurantes ?? [];

  const restaurantesMap = useMemo(() => {
    const m = {};
    restaurantes.forEach((r) => (m[r.id] = r));
    return m;
  }, [restaurantes]);

  const globales = platos.filter((p) => !p.restauranteId).length;
  const activos = platos.filter((p) => p.activo).length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return platos.filter((p) => {
      if (
        q &&
        !p.nombre.toLowerCase().includes(q) &&
        !(p.descripcion ?? "").toLowerCase().includes(q)
      )
        return false;
      if (filtroScope === "global" && p.restauranteId) return false;
      if (filtroScope === "restaurante" && !p.restauranteId) return false;
      if (filtroActivo === "activo" && !p.activo) return false;
      if (filtroActivo === "inactivo" && p.activo) return false;
      if (filtroCat !== "all" && p.categoriaId !== filtroCat) return false;
      return true;
    });
  }, [platos, search, filtroScope, filtroActivo, filtroCat]);

  const handleToggle = async (plato) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      title: plato.activo ? "¿Desactivar plato?" : "¿Activar plato?",
      html: `<span style="font-family:'DM Sans';color:#78716c">Cambiarás el estado de <b>${plato.nombre}</b>.</span>`,
      icon: plato.activo ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: plato.activo ? "#ef4444" : A[900],
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: plato.activo ? "Desactivar" : "Activar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    setToggling(plato.id);
    try {
      const mutation = plato.activo ? desactivarPlato : activarPlato;
      const { data: res } = await mutation({ variables: { id: plato.id } });
      const result = plato.activo ? res?.desactivarPlato : res?.activarPlato;
      if (!result?.ok) throw new Error(result?.error ?? "Error");
    } catch (err) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: err.message,
        confirmButtonColor: A[900],
      });
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Menú"
        title="Platos"
        description="Catálogo global — globales para toda la cadena o específicos por restaurante."
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-xs font-dm text-stone-500">
              <span>
                <span className="font-bold text-blue-600">{globales}</span>{" "}
                globales
              </span>
              <span className="text-stone-300">·</span>
              <span>
                <span className="font-bold" style={{ color: A.accent }}>
                  {activos}
                </span>{" "}
                activos
              </span>
            </div>
            <Button onClick={() => navigate("/menu/platos/nuevo")}>
              <Plus size={14} /> Nuevo plato
            </Button>
          </div>
        }
      />

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Búsqueda */}
        <div
          className="flex items-center gap-2.5 flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 transition-all"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          onFocusCapture={(e) =>
            (e.currentTarget.style.boxShadow = `0 0 0 2px ${A.accent}`)
          }
          onBlurCapture={(e) =>
            (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)")
          }
        >
          <Search size={13} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar plato..."
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

        {/* Categoría */}
        <select
          value={filtroCat}
          onChange={(e) => setFiltroCat(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none cursor-pointer"
        >
          <option value="all">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        {/* Scope */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
          {[
            { v: "all", l: "Todos" },
            { v: "global", l: "Globales" },
            { v: "restaurante", l: "Por restaurante" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltroScope(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
              style={
                filtroScope === v
                  ? { background: A[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              {l}
            </button>
          ))}
        </div>

        {/* Estado */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
          {[
            { v: "all", l: "Todos" },
            { v: "activo", l: "Activos" },
            { v: "inactivo", l: "Inactivos" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltroActivo(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
              style={
                filtroActivo === v
                  ? { background: A.accent, color: "#fff" }
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
          {filtered.length} plato{filtered.length !== 1 ? "s" : ""}
          {search && ` — "${search}"`}
        </p>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={search ? "Sin resultados" : "Sin platos"}
          description={
            search
              ? `No hay platos que coincidan con "${search}".`
              : "Crea el primer plato del catálogo global."
          }
          action={
            !search && (
              <Button onClick={() => navigate("/menu/platos/nuevo")}>
                <Plus size={14} /> Nuevo plato
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          {/* Cabecera */}
          <div className="flex items-center gap-4 px-4 py-2">
            <div className="w-11 shrink-0" />
            <span className="flex-1 text-[10px] font-dm font-semibold uppercase tracking-widest text-stone-400">
              Plato
            </span>
            <span className="hidden md:block w-24 text-[10px] font-dm font-semibold uppercase tracking-widest text-stone-400">
              Alcance
            </span>
            <span className="w-16 text-[10px] font-dm font-semibold uppercase tracking-widest text-stone-400">
              Estado
            </span>
            <span className="hidden lg:block w-24 text-[10px] font-dm font-semibold uppercase tracking-widest text-stone-400">
              Creado
            </span>
            <span className="w-16 text-[10px] font-dm font-semibold uppercase tracking-widest text-stone-400 text-right">
              Acciones
            </span>
          </div>

          {filtered.map((p) => (
            <PlatoRow
              key={p.id}
              plato={p}
              toggling={toggling}
              onToggle={handleToggle}
              onView={(id) => navigate(`/menu/platos/${id}`)}
              restaurantesMap={restaurantesMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}
