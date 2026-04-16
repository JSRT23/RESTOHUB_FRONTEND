// src/features/staff/components/admin/AdminUsuariosList.jsx
//
// Admin Central — Gestión de cuentas de usuario
// ──────────────────────────────────────────────
// Cruza auth_service (cuentas) con staff_service (empleados) por email.
// Detecta y resuelve desincronías: cuenta activa + empleado inactivo y vice-versa.
// Acciones disponibles:
//   • Activar / desactivar cuenta auth
//   • Vincular empleado_id si quedó vacío (autovinculado desde la vista)
// Sin creación de usuarios (eso lo hace el gerente o el wizard de restaurante).

import { useState, useMemo } from "react";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  ShieldCheck,
  ShieldOff,
  Search,
  Building2,
  Mail,
  Briefcase,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Link2,
  Link2Off,
  Loader2,
  Users,
  ToggleLeft,
  ToggleRight,
  Eye,
  Filter,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
} from "../../../../shared/components/ui";
import { GET_EMPLEADOS } from "../../graphql/queries";
import {
  DESACTIVAR_USUARIO_AUTH,
  ACTIVAR_USUARIO_AUTH,
} from "../../graphql/mutations";

// ── GraphQL nuevas operaciones ─────────────────────────────────────────────

const GET_USUARIOS = gql`
  query GetUsuarios($rol: String, $activo: Boolean, $restauranteId: ID) {
    usuarios(rol: $rol, activo: $activo, restauranteId: $restauranteId) {
      id
      email
      nombre
      rol
      restauranteId
      empleadoId
      activo
      emailVerificado
    }
  }
`;

const VINCULAR_EMPLEADO_ID = gql`
  mutation VincularEmpleadoId($email: String!, $empleadoId: ID!) {
    vincularEmpleadoId(email: $email, empleadoId: $empleadoId) {
      ok
      error
    }
  }
`;

// ── Paleta ─────────────────────────────────────────────────────────────────
const A = {
  accent: "#235347",
  accentLight: "#DAF1DE",
  accentMid: "#8EB69B",
  900: "#1c1917",
  700: "#292524",
  500: "#44403c",
  300: "#a8a29e",
  100: "#e7e5e4",
  50: "#f5f5f4",
};

// ── Constantes ─────────────────────────────────────────────────────────────
const ROLES_LABEL = {
  admin_central: "Admin Central",
  gerente_local: "Gerente",
  supervisor: "Supervisor",
  cocinero: "Cocinero",
  mesero: "Mesero",
  cajero: "Cajero",
  repartidor: "Repartidor",
  auxiliar: "Auxiliar",
};

const ROL_VARIANT = {
  admin_central: "blue",
  gerente_local: "blue",
  supervisor: "blue",
  cocinero: "amber",
  mesero: "green",
  cajero: "default",
  repartidor: "default",
  auxiliar: "muted",
};

const ROLES_FILTRO = [
  { value: "", label: "Todos los roles" },
  { value: "admin_central", label: "Admin Central" },
  { value: "gerente_local", label: "Gerente" },
  { value: "supervisor", label: "Supervisor" },
  { value: "cocinero", label: "Cocinero" },
  { value: "mesero", label: "Mesero" },
  { value: "cajero", label: "Cajero" },
  { value: "repartidor", label: "Repartidor" },
  { value: "auxiliar", label: "Auxiliar" },
];

// Estado de sincronía entre auth y staff
const getSyncStatus = (usuario, empleado) => {
  // admin_central no tiene empleado en staff — siempre sincronizado
  if (usuario.rol === "admin_central") return "ok";

  if (!empleado) {
    // Cuenta sin empleado vinculado (empleadoId vacío y no encontrado por email)
    return usuario.activo ? "sin_empleado" : "ok";
  }

  const authActivo = usuario.activo;
  const staffActivo = empleado.activo;

  if (authActivo === staffActivo) return "ok";
  if (authActivo && !staffActivo) return "cuenta_activa_empleado_inactivo";
  if (!authActivo && staffActivo) return "cuenta_inactiva_empleado_activo";
  return "ok";
};

const SYNC_META = {
  ok: {
    label: "Sincronizado",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  sin_empleado: {
    label: "Sin vínculo staff",
    color: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
    icon: Link2Off,
  },
  cuenta_activa_empleado_inactivo: {
    label: "Cuenta activa · empleado inactivo",
    color: "text-red-700",
    bg: "bg-red-50",
    dot: "bg-red-500",
    icon: AlertTriangle,
  },
  cuenta_inactiva_empleado_activo: {
    label: "Cuenta inactiva · empleado activo",
    color: "text-orange-700",
    bg: "bg-orange-50",
    dot: "bg-orange-400",
    icon: AlertTriangle,
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
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

function StatChip({ n, label, accent, warn }) {
  return (
    <div
      className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2.5 shadow-sm"
      style={
        warn
          ? { borderColor: "#fca5a5", background: "#fff5f5" }
          : accent
            ? { borderColor: A.accentMid, background: `${A.accentLight}88` }
            : { borderColor: A[100] }
      }
    >
      <span
        className="text-2xl font-bold"
        style={{
          fontFamily: "'Playfair Display', serif",
          color: warn ? "#dc2626" : accent ? A.accent : A[900],
        }}
      >
        {n}
      </span>
      <span
        className="text-xs font-dm"
        style={{ color: warn ? "#dc2626" : accent ? A.accent : A[300] }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Fila de usuario ────────────────────────────────────────────────────────
function UsuarioRow({
  usuario,
  empleado,
  onToggleAuth,
  onVincular,
  vinculando,
  toggling,
}) {
  const sync = getSyncStatus(usuario, empleado);
  const meta = SYNC_META[sync];
  const SyncIcon = meta.icon;
  const tieneEmpleado = !!empleado;

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
      {/* Avatar + nombre + email */}
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: usuario.activo ? A.accent : A[300] }}
          >
            {usuario.nombre?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-sm font-dm font-semibold text-stone-800 leading-tight">
              {usuario.nombre}
            </p>
            <p className="text-xs text-stone-400 font-dm flex items-center gap-1">
              <Mail size={10} />
              {usuario.email}
            </p>
          </div>
        </div>
      </td>

      {/* Rol */}
      <td className="py-3.5 px-3">
        <Badge variant={ROL_VARIANT[usuario.rol] ?? "default"} size="sm">
          {ROLES_LABEL[usuario.rol] ?? usuario.rol}
        </Badge>
      </td>

      {/* Restaurante (solo para roles scoped) */}
      <td className="py-3.5 px-3">
        {empleado?.restauranteNombre ? (
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-dm">
            <Building2 size={11} className="text-stone-300 flex-shrink-0" />
            <span className="truncate max-w-[160px]">
              {empleado.restauranteNombre}
            </span>
          </div>
        ) : (
          <span className="text-xs text-stone-300 font-dm">—</span>
        )}
      </td>

      {/* Estado cuenta auth */}
      <td className="py-3.5 px-3">
        <div className="flex flex-col gap-1">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-dm font-medium px-2.5 py-1 rounded-full w-fit ${
              usuario.activo
                ? "bg-emerald-50 text-emerald-700"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${usuario.activo ? "bg-emerald-500" : "bg-stone-400"}`}
            />
            {usuario.activo ? "Activa" : "Inactiva"}
          </span>
          {!usuario.emailVerificado && (
            <span className="text-[10px] text-amber-600 font-dm flex items-center gap-1">
              <AlertTriangle size={9} /> Email sin verificar
            </span>
          )}
        </div>
      </td>

      {/* Estado staff / vínculo */}
      <td className="py-3.5 px-3">
        {usuario.rol === "admin_central" ? (
          <span className="text-xs text-stone-300 font-dm">N/A</span>
        ) : tieneEmpleado ? (
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-dm font-medium px-2.5 py-1 rounded-full w-fit ${
                empleado.activo
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${empleado.activo ? "bg-emerald-500" : "bg-stone-400"}`}
              />
              {empleado.activo ? "Empleado activo" : "Empleado inactivo"}
            </span>
            {!usuario.empleadoId && (
              <span className="text-[10px] text-amber-500 font-dm">
                ID no vinculado
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-stone-400 font-dm italic">
            Sin perfil staff
          </span>
        )}
      </td>

      {/* Sincronía */}
      <td className="py-3.5 px-3">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-dm font-medium px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}
        >
          <SyncIcon size={11} />
          {meta.label}
        </span>
      </td>

      {/* Acciones */}
      <td className="py-3.5 pr-5 pl-3">
        <div className="flex items-center gap-2 justify-end">
          {/* Vincular empleado_id si falta */}
          {!usuario.empleadoId && tieneEmpleado && (
            <button
              onClick={() => onVincular(usuario, empleado)}
              disabled={vinculando === usuario.id}
              className="flex items-center gap-1.5 text-xs font-dm font-medium px-2.5 py-1.5
                         rounded-lg border border-amber-200 text-amber-700 bg-amber-50
                         hover:bg-amber-100 disabled:opacity-50 transition-colors"
              title="Vincular empleado_id en auth"
            >
              {vinculando === usuario.id ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Link2 size={11} />
              )}
              Vincular
            </button>
          )}

          {/* Toggle cuenta auth — no sobre admin_central */}
          {usuario.rol !== "admin_central" && (
            <button
              onClick={() => onToggleAuth(usuario, empleado)}
              disabled={toggling === usuario.id}
              className={`flex items-center gap-1.5 text-xs font-dm font-medium px-2.5 py-1.5
                          rounded-lg border transition-colors disabled:opacity-50 ${
                            usuario.activo
                              ? "border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                              : "border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100"
                          }`}
              title={usuario.activo ? "Desactivar cuenta" : "Activar cuenta"}
            >
              {toggling === usuario.id ? (
                <Loader2 size={11} className="animate-spin" />
              ) : usuario.activo ? (
                <ToggleLeft size={13} />
              ) : (
                <ToggleRight size={13} />
              )}
              {usuario.activo ? "Desactivar" : "Activar"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function AdminUsuariosList() {
  const [search, setSearch] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [syncFiltro, setSyncFiltro] = useState("todos"); // todos | desincronizados
  const [toggling, setToggling] = useState(null);
  const [vinculando, setVinculando] = useState(null);

  // ── Queries ───────────────────────────────────────────────────────────
  const {
    data: dataUsuarios,
    loading: loadingU,
    refetch: refetchU,
  } = useQuery(GET_USUARIOS, {
    variables: rolFiltro ? { rol: rolFiltro } : {},
    fetchPolicy: "cache-and-network",
  });

  const {
    data: dataEmpleados,
    loading: loadingE,
    refetch: refetchE,
  } = useQuery(GET_EMPLEADOS, {
    variables: {}, // admin → sin restricción → todos
    fetchPolicy: "cache-and-network",
  });

  // ── Mutations ─────────────────────────────────────────────────────────
  const [desactivarAuth] = useMutation(DESACTIVAR_USUARIO_AUTH);
  const [activarAuth] = useMutation(ACTIVAR_USUARIO_AUTH);
  const [vincularId] = useMutation(VINCULAR_EMPLEADO_ID);

  const loading = loadingU || loadingE;

  // ── Cruce auth ↔ staff por email ──────────────────────────────────────
  const empleadosByEmail = useMemo(() => {
    const m = {};
    (dataEmpleados?.empleados ?? []).forEach((e) => {
      if (e.email) m[e.email.toLowerCase()] = e;
    });
    return m;
  }, [dataEmpleados]);

  const usuarios = useMemo(() => {
    return (dataUsuarios?.usuarios ?? []).map((u) => ({
      usuario: u,
      empleado: empleadosByEmail[u.email?.toLowerCase()] ?? null,
    }));
  }, [dataUsuarios, empleadosByEmail]);

  // ── Filtros ───────────────────────────────────────────────────────────
  const filas = useMemo(() => {
    const q = search.toLowerCase().trim();
    return usuarios.filter(({ usuario, empleado }) => {
      if (q) {
        const hayMatch =
          usuario.nombre?.toLowerCase().includes(q) ||
          usuario.email?.toLowerCase().includes(q) ||
          empleado?.restauranteNombre?.toLowerCase().includes(q) ||
          empleado?.documento?.toLowerCase().includes(q);
        if (!hayMatch) return false;
      }
      if (syncFiltro === "desincronizados") {
        const s = getSyncStatus(usuario, empleado);
        if (s === "ok") return false;
      }
      return true;
    });
  }, [usuarios, search, syncFiltro]);

  // ── Stats ──────────────────────────────────────────────────────────────
  const totalActivos = (dataUsuarios?.usuarios ?? []).filter(
    (u) => u.activo,
  ).length;
  const totalDesincronizados = usuarios.filter(
    ({ usuario, empleado }) => getSyncStatus(usuario, empleado) !== "ok",
  ).length;

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleToggleAuth = async (usuario, empleado) => {
    const accion = usuario.activo ? "desactivar" : "activar";
    const sinc = getSyncStatus(usuario, empleado);

    // Alerta de advertencia si hay desincronía
    const advertencia =
      sinc !== "ok" && sinc !== "sin_empleado"
        ? `<p class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
           ⚠️ Esta cuenta tiene un estado desincronizado con el perfil de staff.
         </p>`
        : "";

    const { isConfirmed } = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} cuenta?`,
      html: `
        <p class="text-stone-600 text-sm">
          ${
            accion === "desactivar"
              ? `<strong>${usuario.nombre}</strong> perderá acceso al sistema inmediatamente.`
              : `<strong>${usuario.nombre}</strong> recuperará acceso al sistema.`
          }
        </p>
        ${advertencia}
      `,
      icon: accion === "desactivar" ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText:
        accion === "desactivar" ? "Sí, desactivar" : "Sí, activar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: accion === "desactivar" ? "#dc2626" : A.accent,
    });

    if (!isConfirmed) return;

    setToggling(usuario.id);
    try {
      const mutation = usuario.activo ? desactivarAuth : activarAuth;
      const { data } = await mutation({ variables: { email: usuario.email } });
      const result = data?.desactivarUsuario ?? data?.activarUsuario;

      if (result?.ok) {
        await Swal.fire({
          icon: "success",
          title: `Cuenta ${accion === "desactivar" ? "desactivada" : "activada"}`,
          text: `La cuenta de ${usuario.nombre} fue ${accion === "desactivar" ? "desactivada" : "activada"} correctamente.`,
          timer: 2000,
          showConfirmButton: false,
        });
        refetchU();
      } else {
        throw new Error(result?.error ?? "Error desconocido");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message ?? "No se pudo completar la operación.",
      });
    } finally {
      setToggling(null);
    }
  };

  const handleVincular = async (usuario, empleado) => {
    const { isConfirmed } = await Swal.fire({
      title: "Vincular empleado_id",
      html: `
        <p class="text-stone-600 text-sm">
          Se asignará el ID de staff de <strong>${empleado.nombre} ${empleado.apellido}</strong>
          a la cuenta auth de <strong>${usuario.email}</strong>.
        </p>
        <p class="text-xs text-stone-400 mt-2">
          Esto permite que el sistema reconozca correctamente al empleado en operaciones de turno y asistencia.
        </p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Vincular",
      cancelButtonText: "Cancelar",
      confirmButtonColor: A.accent,
    });

    if (!isConfirmed) return;

    setVinculando(usuario.id);
    try {
      const { data } = await vincularId({
        variables: { email: usuario.email, empleadoId: empleado.id },
      });

      if (data?.vincularEmpleadoId?.ok) {
        await Swal.fire({
          icon: "success",
          title: "Vinculado",
          text: "El empleado_id fue asignado correctamente.",
          timer: 2000,
          showConfirmButton: false,
        });
        refetchU();
        refetchE();
      } else {
        throw new Error(data?.vincularEmpleadoId?.error ?? "Error desconocido");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error al vincular",
        text: err.message,
      });
    } finally {
      setVinculando(null);
    }
  };

  const refetch = () => {
    refetchU();
    refetchE();
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Admin Central"
        title="Usuarios del sistema"
        description="Cuentas de acceso · estado auth vs. perfil staff"
        action={
          <Button variant="ghost" size="sm" onClick={refetch} title="Recargar">
            <RefreshCw size={14} />
          </Button>
        }
      />

      {/* Stats */}
      {!loading && (dataUsuarios?.usuarios?.length ?? 0) > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <StatChip n={dataUsuarios.usuarios.length} label="cuentas en total" />
          <StatChip n={totalActivos} label="cuentas activas" accent />
          {totalDesincronizados > 0 && (
            <StatChip n={totalDesincronizados} label="desincronizadas" warn />
          )}
        </div>
      )}

      {/* Banner desincronías */}
      {!loading && totalDesincronizados > 0 && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl border text-sm font-dm"
          style={{
            borderColor: "#fca5a5",
            background: "#fff5f5",
            color: "#991b1b",
          }}
        >
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {totalDesincronizados} cuenta
              {totalDesincronizados !== 1 ? "s" : ""} con estado inconsistente
            </p>
            <p className="text-xs mt-0.5 text-red-600">
              Hay cuentas activas con empleado inactivo o viceversa. Revísalas y
              sincroniza manualmente si corresponde.
            </p>
          </div>
          <button
            onClick={() => setSyncFiltro("desincronizados")}
            className="ml-auto flex-shrink-0 text-xs font-semibold underline hover:no-underline"
          >
            Ver solo estas
          </button>
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
            placeholder="Nombre, email o restaurante..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200
                       text-sm font-dm text-stone-700 placeholder:text-stone-300
                       outline-none shadow-sm transition-all"
            onFocus={(e) => {
              e.target.style.boxShadow = `0 0 0 2px ${A.accent}`;
              e.target.style.borderColor = "transparent";
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = "";
              e.target.style.borderColor = "";
            }}
          />
        </div>

        {/* Filtro rol */}
        <SelectFilter
          value={rolFiltro}
          onChange={setRolFiltro}
          options={ROLES_FILTRO}
          icon={Briefcase}
        />

        {/* Filtro sincronía */}
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
          {[
            { v: "todos", l: "Todos" },
            { v: "desincronizados", l: "Desincronizados" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setSyncFiltro(v)}
              style={
                syncFiltro === v ? { background: A[900], color: "white" } : {}
              }
              className={`px-3.5 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all ${
                syncFiltro === v ? "" : "text-stone-500 hover:bg-stone-50"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Contador */}
      {!loading && (dataUsuarios?.usuarios?.length ?? 0) > 0 && (
        <p className="text-xs font-dm text-stone-400 -mt-2">
          {filas.length} usuario{filas.length !== 1 ? "s" : ""}
          {rolFiltro ? ` · ${ROLES_LABEL[rolFiltro] ?? rolFiltro}` : ""}
          {syncFiltro === "desincronizados" ? " · solo desincronizados" : ""}
          {search ? ` · "${search}"` : ""}
        </p>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3.5 border-b border-stone-100"
            >
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-32 rounded-full" />
            </div>
          ))}
        </div>
      ) : filas.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            search || rolFiltro || syncFiltro === "desincronizados"
              ? "Sin resultados"
              : "Sin usuarios"
          }
          description={
            syncFiltro === "desincronizados"
              ? "Todas las cuentas están sincronizadas con staff ✓"
              : "Ajusta los filtros para ver resultados"
          }
          action={
            syncFiltro === "desincronizados" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSyncFiltro("todos")}
              >
                Ver todos
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  {[
                    { l: "Usuario", cls: "pl-5 pr-3" },
                    { l: "Rol", cls: "px-3" },
                    { l: "Restaurante", cls: "px-3" },
                    { l: "Cuenta auth", cls: "px-3" },
                    { l: "Perfil staff", cls: "px-3" },
                    { l: "Sincronía", cls: "px-3" },
                    { l: "Acciones", cls: "pr-5 pl-3 text-right" },
                  ].map(({ l, cls }) => (
                    <th
                      key={l}
                      className={`py-3 text-left text-xs font-dm font-semibold text-stone-400 uppercase tracking-wide ${cls}`}
                    >
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map(({ usuario, empleado }) => (
                  <UsuarioRow
                    key={usuario.id}
                    usuario={usuario}
                    empleado={empleado}
                    onToggleAuth={handleToggleAuth}
                    onVincular={handleVincular}
                    toggling={toggling}
                    vinculando={vinculando}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leyenda */}
      {!loading && filas.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-xs font-dm text-stone-400 pt-1">
          {Object.entries(SYNC_META).map(([k, m]) => {
            const Icon = m.icon;
            return (
              <span key={k} className={`flex items-center gap-1.5 ${m.color}`}>
                <Icon size={11} />
                {m.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
