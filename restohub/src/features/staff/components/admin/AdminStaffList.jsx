// src/features/staff/components/admin/AdminStaffList.jsx
//
// Admin Central — Vista global de staff  (solo lectura)
// ──────────────────────────────────────────────────────
// • Carga TODOS los restaurantes y cruza con empleados por restaurante.
// • Filtros: restaurante, rol, estado activo/inactivo, búsqueda libre.
// • Sin ninguna acción de escritura — el admin solo observa.
// • Paleta dark-stone coherente con el resto del panel admin.

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Users,
  Search,
  Building2,
  ChevronDown,
  UserCircle,
  Mail,
  Phone,
  Globe,
  Calendar,
  Briefcase,
  ShieldCheck,
  LayoutGrid,
  List,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
  Eye,
} from "lucide-react";
import { GET_EMPLEADOS } from "../../graphql/queries";
import { GET_RESTAURANTES } from "../../../menu/components/admin/graphql/operations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
} from "../../../../shared/components/ui";

// ── Paleta ─────────────────────────────────────────────────────────────────
const A = {
  50: "#f5f5f4", // stone-100
  100: "#e7e5e4", // stone-200
  300: "#a8a29e", // stone-400
  500: "#44403c", // stone-700
  700: "#292524", // stone-800
  900: "#1c1917", // stone-900
  accent: "#235347",
  accentLight: "#DAF1DE",
  accentMid: "#8EB69B",
};

// ── Constantes ─────────────────────────────────────────────────────────────
const ROLES_DISPLAY = {
  gerente: { label: "Gerente", variant: "blue" },
  gerente_local: { label: "Gerente", variant: "blue" },
  supervisor: { label: "Supervisor", variant: "blue" },
  cocinero: { label: "Cocinero", variant: "amber" },
  mesero: { label: "Mesero", variant: "green" },
  cajero: { label: "Cajero", variant: "default" },
  repartidor: { label: "Repartidor", variant: "default" },
  auxiliar: { label: "Auxiliar", variant: "muted" },
};

const ALL_ROLES = [
  { value: "", label: "Todos los roles" },
  { value: "gerente", label: "Gerente" },
  { value: "supervisor", label: "Supervisor" },
  { value: "cocinero", label: "Cocinero" },
  { value: "mesero", label: "Mesero" },
  { value: "cajero", label: "Cajero" },
  { value: "repartidor", label: "Repartidor" },
  { value: "auxiliar", label: "Auxiliar" },
];

const PAIS_FLAG = {
  CO: "🇨🇴",
  MX: "🇲🇽",
  AR: "🇦🇷",
  BR: "🇧🇷",
  CL: "🇨🇱",
  PE: "🇵🇪",
  EC: "🇪🇨",
  VE: "🇻🇪",
  ES: "🇪🇸",
  US: "🇺🇸",
};

const fmtFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ── Select reutilizable ────────────────────────────────────────────────────
function SelectFilter({ value, onChange, options, icon: Icon }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-8 pr-8 py-2.5 rounded-xl bg-white border border-stone-200
                   text-sm font-dm text-stone-700 outline-none shadow-sm cursor-pointer
                   hover:border-stone-300 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
      />
    </div>
  );
}

// ── Stat chip ──────────────────────────────────────────────────────────────
function StatChip({ n, label, accent }) {
  return (
    <div
      className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2.5 shadow-sm"
      style={
        accent
          ? { borderColor: A.accentMid, background: `${A.accentLight}88` }
          : { borderColor: A[100] }
      }
    >
      <span
        className="text-2xl font-bold"
        style={{
          fontFamily: "'Playfair Display', serif",
          color: accent ? A.accent : A[900],
        }}
      >
        {n}
      </span>
      <span
        className="text-xs font-dm"
        style={{ color: accent ? A.accent : A[300] }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Tarjeta de empleado (vista grid) ──────────────────────────────────────
function EmpleadoCard({ emp }) {
  const rol = ROLES_DISPLAY[emp.rol] ?? {
    label: emp.rolDisplay ?? emp.rol,
    variant: "default",
  };
  return (
    <div
      className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md
                 hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
            style={{ background: emp.activo ? A.accent : A[300] }}
          >
            {emp.nombre?.[0]?.toUpperCase()}
            {emp.apellido?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate font-dm">
              {emp.nombre} {emp.apellido}
            </p>
            <p className="text-xs text-stone-400 truncate font-dm">
              {PAIS_FLAG[emp.pais] ?? ""} {emp.pais}
            </p>
          </div>
        </div>
        <Badge variant={rol.variant} size="sm">
          {rol.label}
        </Badge>
      </div>

      {/* Restaurante */}
      <div className="flex items-center gap-1.5 text-xs text-stone-500 font-dm">
        <Building2 size={11} className="text-stone-300 flex-shrink-0" />
        <span className="truncate">{emp.restauranteNombre ?? "—"}</span>
      </div>

      {/* Contacto */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-dm">
          <Mail size={11} className="text-stone-300 flex-shrink-0" />
          <span className="truncate">{emp.email}</span>
        </div>
        {emp.telefono && (
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-dm">
            <Phone size={11} className="text-stone-300 flex-shrink-0" />
            <span>{emp.telefono}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <div className="flex items-center gap-1.5 text-xs text-stone-400 font-dm">
          <Calendar size={10} />
          <span>{fmtFecha(emp.fechaContratacion)}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-dm font-medium px-2 py-0.5 rounded-full ${
            emp.activo
              ? "bg-emerald-50 text-emerald-700"
              : "bg-stone-100 text-stone-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${emp.activo ? "bg-emerald-500" : "bg-stone-300"}`}
          />
          {emp.activo ? "Activo" : "Inactivo"}
        </span>
      </div>
    </div>
  );
}

// ── Fila de empleado (vista lista) ────────────────────────────────────────
function EmpleadoRow({ emp }) {
  const rol = ROLES_DISPLAY[emp.rol] ?? {
    label: emp.rolDisplay ?? emp.rol,
    variant: "default",
  };
  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/70 transition-colors group">
      <td className="py-3 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: emp.activo ? A.accent : A[300] }}
          >
            {emp.nombre?.[0]}
            {emp.apellido?.[0]}
          </div>
          <div>
            <p className="text-sm font-dm font-semibold text-stone-800">
              {emp.nombre} {emp.apellido}
            </p>
            <p className="text-xs text-stone-400 font-dm">{emp.documento}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-3">
        <Badge variant={rol.variant} size="sm">
          {rol.label}
        </Badge>
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-1.5 text-xs text-stone-600 font-dm">
          <Building2 size={11} className="text-stone-300" />
          <span className="truncate max-w-[160px]">
            {emp.restauranteNombre ?? "—"}
          </span>
        </div>
      </td>
      <td className="py-3 px-3 text-xs text-stone-500 font-dm">{emp.email}</td>
      <td className="py-3 px-3 text-xs text-stone-400 font-dm">
        {PAIS_FLAG[emp.pais] ?? ""} {emp.pais}
      </td>
      <td className="py-3 px-3 text-xs text-stone-400 font-dm">
        {fmtFecha(emp.fechaContratacion)}
      </td>
      <td className="py-3 pr-5 pl-3">
        <span
          className={`inline-flex items-center gap-1 text-xs font-dm font-medium px-2 py-0.5 rounded-full ${
            emp.activo
              ? "bg-emerald-50 text-emerald-700"
              : "bg-stone-100 text-stone-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${emp.activo ? "bg-emerald-500" : "bg-stone-300"}`}
          />
          {emp.activo ? "Activo" : "Inactivo"}
        </span>
      </td>
    </tr>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function AdminStaffList() {
  const [search, setSearch] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [restFiltro, setRestFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activos");
  const [vista, setVista] = useState("grid"); // "grid" | "lista"

  // ── Datos: restaurantes (para el selector) ────────────────────────────
  const { data: dataRest } = useQuery(GET_RESTAURANTES, {
    fetchPolicy: "cache-and-network",
  });

  // ── Datos: empleados ─────────────────────────────────────────────────
  // El admin pasa restauranteId y rol opcionales; sin ellos trae todo.
  const queryVars = useMemo(() => {
    const vars = {};
    if (restFiltro) vars.restauranteId = restFiltro;
    if (rolFiltro) vars.rol = rolFiltro;
    // activo: solo cuando el filtro es explícito
    if (estadoFiltro === "activos") vars.activo = true;
    if (estadoFiltro === "inactivos") vars.activo = false;
    return vars;
  }, [restFiltro, rolFiltro, estadoFiltro]);

  const { data, loading, refetch } = useQuery(GET_EMPLEADOS, {
    variables: queryVars,
    fetchPolicy: "cache-and-network",
  });

  const todos = data?.empleados ?? [];

  // Búsqueda libre en el cliente (nombre, apellido, email, doc)
  const empleados = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return todos;
    return todos.filter(
      (e) =>
        `${e.nombre} ${e.apellido}`.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.documento?.toLowerCase().includes(q),
    );
  }, [todos, search]);

  // ── Stats ──────────────────────────────────────────────────────────────
  const totalActivos = todos.filter((e) => e.activo).length;
  const totalInactivos = todos.filter((e) => !e.activo).length;

  // Distribución por rol para el encabezado
  const porRol = useMemo(() => {
    const m = {};
    todos.forEach((e) => {
      const k = e.rol === "gerente_local" ? "gerente" : e.rol;
      m[k] = (m[k] ?? 0) + 1;
    });
    return m;
  }, [todos]);

  // ── Opciones de restaurante para el select ────────────────────────────
  const restOpciones = useMemo(() => {
    const base = [{ value: "", label: "Todos los restaurantes" }];
    const lista = (dataRest?.restaurantes ?? []).map((r) => ({
      value: r.id,
      label: `${r.nombre} — ${r.ciudad}`,
    }));
    return [...base, ...lista];
  }, [dataRest]);

  const estadoOpciones = [
    { value: "activos", label: "Activos" },
    { value: "inactivos", label: "Inactivos" },
    { value: "todos", label: "Todos" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Admin Central"
        title="Staff global"
        description="Vista consolidada de todo el equipo de la cadena — solo lectura"
        action={
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-dm font-medium"
              style={{ background: `${A.accentLight}99`, color: A.accent }}
            >
              <Eye size={12} />
              Solo lectura
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              title="Recargar"
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* Stats */}
      {!loading && todos.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <StatChip n={todos.length} label="en total" />
          {totalActivos > 0 && (
            <StatChip n={totalActivos} label="activos" accent />
          )}
          {totalInactivos > 0 && (
            <StatChip n={totalInactivos} label="inactivos" />
          )}

          {/* Desglose por rol */}
          {Object.entries(porRol).length > 0 && (
            <div className="flex items-center gap-2 flex-wrap ml-2 pl-2 border-l border-stone-200">
              {Object.entries(porRol)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([rol, n]) => {
                  const rd = ROLES_DISPLAY[rol];
                  return (
                    <span
                      key={rol}
                      className="text-xs font-dm text-stone-500 bg-white border border-stone-200
                                 rounded-lg px-2.5 py-1 shadow-sm"
                    >
                      <span className="font-semibold text-stone-700">{n}</span>{" "}
                      {rd?.label ?? rol}
                      {n !== 1 ? "s" : ""}
                    </span>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, email o documento..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200
                       text-sm font-dm text-stone-700 placeholder:text-stone-300 outline-none
                       shadow-sm transition-all"
            onFocus={(e) => {
              e.target.style.borderColor = "transparent";
              e.target.style.boxShadow = `0 0 0 2px ${A.accent}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "";
              e.target.style.boxShadow = "";
            }}
          />
        </div>

        {/* Filtro restaurante */}
        <SelectFilter
          value={restFiltro}
          onChange={setRestFiltro}
          options={restOpciones}
          icon={Building2}
        />

        {/* Filtro rol */}
        <SelectFilter
          value={rolFiltro}
          onChange={setRolFiltro}
          options={ALL_ROLES}
          icon={Briefcase}
        />

        {/* Filtro estado */}
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
          {estadoOpciones.map((op) => (
            <button
              key={op.value}
              onClick={() => setEstadoFiltro(op.value)}
              style={
                estadoFiltro === op.value
                  ? { background: A[900], color: "white" }
                  : {}
              }
              className={`px-3.5 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all ${
                estadoFiltro === op.value
                  ? ""
                  : "text-stone-500 hover:bg-stone-50"
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>

        {/* Toggle vista */}
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm ml-auto">
          <button
            onClick={() => setVista("grid")}
            style={
              vista === "grid" ? { background: A[900], color: "white" } : {}
            }
            className={`p-1.5 rounded-lg transition-all ${
              vista === "grid" ? "" : "text-stone-400 hover:bg-stone-50"
            }`}
            title="Vista tarjetas"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setVista("lista")}
            style={
              vista === "lista" ? { background: A[900], color: "white" } : {}
            }
            className={`p-1.5 rounded-lg transition-all ${
              vista === "lista" ? "" : "text-stone-400 hover:bg-stone-50"
            }`}
            title="Vista lista"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Contador de resultados */}
      {!loading && todos.length > 0 && (
        <p className="text-xs font-dm text-stone-400 -mt-2">
          {empleados.length} empleado{empleados.length !== 1 ? "s" : ""}
          {rolFiltro
            ? ` · ${ROLES_DISPLAY[rolFiltro]?.label ?? rolFiltro}`
            : ""}
          {restFiltro
            ? ` · ${
                restOpciones.find((r) => r.value === restFiltro)?.label ??
                restFiltro
              }`
            : ""}
          {search ? ` · "${search}"` : ""}
        </p>
      )}

      {/* Contenido principal */}
      {loading ? (
        vista === "grid" ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-stone-100"
              >
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-44 ml-auto" />
              </div>
            ))}
          </div>
        )
      ) : empleados.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            search || rolFiltro || restFiltro
              ? "Sin resultados"
              : "Sin empleados"
          }
          description={
            search || rolFiltro || restFiltro
              ? "Intenta ajustar los filtros de búsqueda"
              : "No hay empleados registrados en la cadena aún"
          }
        />
      ) : vista === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {empleados.map((emp) => (
            <EmpleadoCard key={emp.id} emp={emp} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                {[
                  "Empleado",
                  "Rol",
                  "Restaurante",
                  "Email",
                  "País",
                  "Contratación",
                  "Estado",
                ].map((h) => (
                  <th
                    key={h}
                    className={`py-3 text-left text-xs font-dm font-semibold text-stone-400 uppercase tracking-wide
                      ${h === "Empleado" ? "pl-5 pr-3" : h === "Estado" ? "pr-5 pl-3" : "px-3"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp) => (
                <EmpleadoRow key={emp.id} emp={emp} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Banner solo-lectura al pie */}
      {!loading && empleados.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-dm"
          style={{ background: `${A.accentLight}66`, color: A.accent }}
        >
          <ShieldCheck size={14} />
          <span>
            Vista de solo lectura. Para crear o editar empleados, accede con una
            cuenta de <strong>gerente_local</strong>.
          </span>
        </div>
      )}
    </div>
  );
}
