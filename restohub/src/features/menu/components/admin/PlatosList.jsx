// restohub/src/features/menu/components/PlatosList.jsx
import { useState } from "react";
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
} from "lucide-react";
import Swal from "sweetalert2";
import { GET_PLATOS, GET_CATEGORIAS } from "../../graphql/queries";
import { ACTIVAR_PLATO, DESACTIVAR_PLATO } from "../../graphql/mutations";
import {
  Badge,
  Button,
  PageHeader,
  EmptyState,
  Skeleton,
  StatCard,
} from "../../../../shared/components/ui";

// ── PlatoRow ───────────────────────────────────────────────────────────────
function PlatoRow({ plato, onToggle, onView, toggling }) {
  return (
    <div
      className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-stone-200 bg-white
                    hover:border-stone-300 hover:bg-stone-50 transition-all duration-150"
    >
      {/* Imagen */}
      <div className="w-11 h-11 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
        {plato.imagen ? (
          <img
            src={plato.imagen}
            alt={plato.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageOff size={14} className="text-stone-300" />
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
              <Tag size={8} />
              {plato.categoriaNombre}
            </Badge>
          )}
        </div>
        <p className="text-[11px] font-dm text-stone-400 truncate mt-0.5">
          {plato.descripcion}
        </p>
      </div>

      {/* Estado */}
      <Badge variant={plato.activo ? "green" : "red"} size="xs">
        {plato.activo ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
        {plato.activo ? "Activo" : "Inactivo"}
      </Badge>

      {/* Fecha */}
      <span className="hidden lg:block text-[11px] font-dm text-stone-400 shrink-0">
        {plato.fechaCreacion
          ? new Date(plato.fechaCreacion).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—"}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={() => onView(plato.id)}>
          <Eye size={13} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          loading={toggling === plato.id}
          onClick={() => onToggle(plato)}
        >
          {plato.activo ? (
            <ToggleRight size={15} className="text-emerald-500" />
          ) : (
            <ToggleLeft size={15} className="text-stone-400" />
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function PlatosList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterActivo, setFilterActivo] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [toggling, setToggling] = useState(null);

  const { data, loading } = useQuery(GET_PLATOS);
  const { data: catData } = useQuery(GET_CATEGORIAS);
  const [activarPlato] = useMutation(ACTIVAR_PLATO, {
    refetchQueries: ["GetPlatos"],
  });
  const [desactivarPlato] = useMutation(DESACTIVAR_PLATO, {
    refetchQueries: ["GetPlatos"],
  });

  const platos = data?.platos ?? [];
  const categorias = catData?.categorias ?? [];
  const activos = platos.filter((p) => p.activo).length;

  const filtered = platos.filter((p) => {
    const matchSearch =
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.descripcion || "").toLowerCase().includes(search.toLowerCase());
    const matchActivo =
      filterActivo === "all" ||
      (filterActivo === "activo" && p.activo) ||
      (filterActivo === "inactivo" && !p.activo);
    const matchCat = filterCat === "all" || p.categoriaId === filterCat;
    return matchSearch && matchActivo && matchCat;
  });

  const handleToggle = async (plato) => {
    setToggling(plato.id);
    try {
      const mutation = plato.activo ? desactivarPlato : activarPlato;
      const { data } = await mutation({ variables: { id: plato.id } });
      const result = plato.activo ? data.desactivarPlato : data.activarPlato;
      if (!result.ok) throw new Error(result.error);
    } catch (e) {
      Swal.fire({
        background: "#ffffff",
        color: "#1C1917",
        icon: "error",
        iconColor: "#ef4444",
        title: "Error",
        text: e.message,
        confirmButtonColor: "#F59E0B",
      });
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 font-dm">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-dm">
      {/* Header */}
      <PageHeader
        eyebrow="Menu Service"
        title="Platos"
        description="Catálogo global de platos de la cadena."
        action={
          <div className="flex items-center gap-3">
            <StatCard
              label="Total"
              value={platos.length}
              icon={UtensilsCrossed}
            />
            <StatCard
              label="Activos"
              value={activos}
              icon={CheckCircle2}
              accent
            />
            <Button onClick={() => navigate("/menu/platos/new")}>
              <Plus size={14} strokeWidth={2.5} />
              Nuevo plato
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
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
              className="text-stone-300 hover:text-stone-500 transition text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Estado pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
          {[
            { v: "all", l: "Todos" },
            { v: "activo", l: "Activos" },
            { v: "inactivo", l: "Inactivos" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFilterActivo(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-dm font-medium transition-all ${
                filterActivo === v
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Categoría */}
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
        >
          <option value="all">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No hay platos"
          description="Crea el primer plato del catálogo."
          action={
            <Button onClick={() => navigate("/menu/platos/new")}>
              <Plus size={14} />
              Nuevo plato
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {/* Table header */}
          <div className="grid grid-cols-[44px_1fr_auto_auto_auto] gap-4 px-4 py-2">
            <span />
            <span className="text-[10px] font-dm font-semibold uppercase tracking-widest text-stone-400">
              Plato
            </span>
            <span className="text-[10px] font-dm font-semibold uppercase tracking-widest text-stone-400">
              Estado
            </span>
            <span className="hidden lg:block text-[10px] font-dm font-semibold uppercase tracking-widest text-stone-400">
              Creado
            </span>
            <span className="text-[10px] font-dm font-semibold uppercase tracking-widest text-stone-400">
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
