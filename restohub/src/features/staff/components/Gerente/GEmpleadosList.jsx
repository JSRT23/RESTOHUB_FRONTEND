// src/features/staff/components/Gerente/GEmpleadosList.jsx
//
// v2 — Mejoras:
//   1. El gerente NO puede editarse ni desactivarse a sí mismo.
//   2. Crear empleado = 2 pasos: auth_service (cuenta) + staff_service (perfil).
//   3. Reactivar → modal que solo pide fecha de contratación, luego activa.
//   4. Editar → solo nombre, apellido, teléfono, rol. Doc/email inmutables.
//   5. SweetAlert2 en todas las acciones.

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Users,
  Plus,
  Search,
  UserCircle,
  Phone,
  Mail,
  Globe,
  Calendar,
  FileText,
  ChevronDown,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
  Modal,
} from "../../../../shared/components/ui";
import { GET_EMPLEADOS } from "../../graphql/queries";
import {
  REGISTRAR_USUARIO_EMPLEADO,
  CREAR_EMPLEADO,
  EDITAR_EMPLEADO,
  EDITAR_FECHA_CONTRATACION,
  DESACTIVAR_EMPLEADO,
  ACTIVAR_EMPLEADO,
  DESACTIVAR_USUARIO_AUTH,
  ACTIVAR_USUARIO_AUTH,
} from "../../graphql/mutations";

// ── Paleta ─────────────────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

// ── Constantes ─────────────────────────────────────────────────────────────
// Roles que el gerente puede asignar (no puede crear otros gerentes)
const ROLES_GERENTE = [
  { value: "supervisor", label: "Supervisor" },
  { value: "cocinero", label: "Cocinero" },
  { value: "mesero", label: "Mesero" },
  { value: "cajero", label: "Cajero" },
  { value: "repartidor", label: "Repartidor" },
  { value: "auxiliar", label: "Auxiliar" },
];

const PAISES = [
  { label: "Colombia", code: "CO", flag: "🇨🇴" },
  { label: "México", code: "MX", flag: "🇲🇽" },
  { label: "Argentina", code: "AR", flag: "🇦🇷" },
  { label: "Brasil", code: "BR", flag: "🇧🇷" },
  { label: "Chile", code: "CL", flag: "🇨🇱" },
  { label: "Perú", code: "PE", flag: "🇵🇪" },
  { label: "Ecuador", code: "EC", flag: "🇪🇨" },
  { label: "Venezuela", code: "VE", flag: "🇻🇪" },
  { label: "España", code: "ES", flag: "🇪🇸" },
  { label: "Estados Unidos", code: "US", flag: "🇺🇸" },
];

const ROL_VARIANT = {
  supervisor: "blue",
  cocinero: "amber",
  mesero: "green",
  cajero: "default",
  repartidor: "default",
  auxiliar: "muted",
  gerente: "blue",
  gerente_local: "blue",
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fi = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
};
const fb = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};
const cls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all shadow-sm";

function getInitials(nombre = "", apellido = "") {
  return ((nombre[0] ?? "") + (apellido[0] ?? "")).toUpperCase() || "??";
}

function flagFor(pais = "") {
  return (
    PAISES.find(
      (p) =>
        p.label.toLowerCase() === pais.toLowerCase() ||
        p.code.toLowerCase() === pais.toLowerCase(),
    )?.flag ?? "🌐"
  );
}

function paisCode(pais = "") {
  return (
    PAISES.find(
      (p) =>
        p.label.toLowerCase() === pais.toLowerCase() ||
        p.code.toLowerCase() === pais.toLowerCase(),
    )?.code ?? pais.slice(0, 2).toUpperCase()
  );
}

function fmtFecha(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Field wrapper ──────────────────────────────────────────────────────────
function Field({ icon: Icon, label, required, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-dm font-semibold text-stone-500">
        {Icon && <Icon size={11} style={{ color: G[300] }} />}
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] font-dm text-stone-400 pl-1">{hint}</p>
      )}
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder, required }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-dm font-semibold text-stone-500">
        <Lock size={11} style={{ color: G[300] }} />
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className={cls + " pr-10"}
          onFocus={fi}
          onBlur={fb}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

// ── Modal: Crear empleado (auth + staff) ───────────────────────────────────
function ModalCrear({ open, onClose, restauranteId, restaurantePais }) {
  const today = new Date().toISOString().split("T")[0];
  const INIT = {
    nombre: "",
    apellido: "",
    documento: "",
    email: "",
    telefono: "",
    password: "",
    passwordConfirm: "",
    rol: "mesero",
    pais: "Colombia",
    fechaContratacion: today,
  };
  const [form, setForm] = useState(INIT);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [registrarAuth] = useMutation(REGISTRAR_USUARIO_EMPLEADO);
  const [crearStaff] = useMutation(CREAR_EMPLEADO, {
    refetchQueries: ["GetEmpleados"],
  });

  const handleSave = async () => {
    const {
      nombre,
      apellido,
      documento,
      email,
      password,
      passwordConfirm,
      rol,
      pais,
    } = form;
    if (
      !nombre ||
      !apellido ||
      !documento ||
      !email ||
      !password ||
      !rol ||
      !pais
    ) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Campos requeridos",
        text: "Completa todos los campos obligatorios.",
        confirmButtonColor: G[900],
      });
      return;
    }
    if (password !== passwordConfirm) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Contraseñas no coinciden",
        text: "Verifica que ambas contraseñas sean iguales.",
        confirmButtonColor: G[900],
      });
      return;
    }
    if (password.length < 8) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Contraseña muy corta",
        text: "La contraseña debe tener al menos 8 caracteres.",
        confirmButtonColor: G[900],
      });
      return;
    }

    setLoading(true);
    const nombreCompleto = `${nombre.trim()} ${apellido.trim()}`;
    let empleadoIdCreado = null;

    try {
      // ── Paso 1: crear perfil en staff_service primero ───────────────────
      // Necesitamos el empleado.id antes de llamar a auth_service,
      // porque auth_service exige empleadoId para roles operativos.
      const { data: d1 } = await crearStaff({
        variables: {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          documento: documento.trim(),
          email: email.trim(),
          telefono: form.telefono || null,
          rol,
          pais: paisCode(form.pais),
          restaurante: restauranteId,
          fechaContratacion: form.fechaContratacion || null,
        },
      });

      const staff = d1?.crearEmpleado;
      if (!staff?.ok) {
        Swal.fire({
          background: "#fff",
          icon: "error",
          title: "Error al registrar empleado",
          text: staff?.errores?.[0] ?? "No se pudo crear el perfil en staff.",
          confirmButtonColor: G[900],
        });
        setLoading(false);
        return;
      }

      empleadoIdCreado = staff.empleado?.id;

      // ── Paso 2: crear cuenta en auth_service (sin empleadoId, igual que gerente) ─
      const { data: d2 } = await registrarAuth({
        variables: {
          email: email.trim(),
          nombre: nombreCompleto,
          password,
          passwordConfirm,
          rol,
          restauranteId,
        },
      });

      const auth = d2?.registrarUsuario;
      if (!auth?.ok) {
        // Staff OK pero auth falló — avisamos, el perfil existe pero no puede iniciar sesión.
        // El admin puede crear la cuenta manualmente más adelante.
        Swal.fire({
          background: "#fff",
          icon: "warning",
          title: "Perfil creado, cuenta pendiente",
          html: `<div style="font-family:'DM Sans',sans-serif;color:#78716c;line-height:1.6">
            <p><b style="color:#163832">${nombreCompleto}</b> fue registrado en el equipo,
            pero no se pudo crear su cuenta de acceso:</p>
            <p style="font-size:12px;color:#9ca3af;margin-top:6px">${auth?.error ?? "Error desconocido en auth_service"}</p>
            <p style="font-size:12px;color:#9ca3af;margin-top:4px">El empleado aparecerá en la lista pero no podrá iniciar sesión hasta que se cree su cuenta.</p>
          </div>`,
          confirmButtonColor: G[900],
        });
        setForm(INIT);
        onClose();
        setLoading(false);
        return;
      }

      // ── Todo OK ─────────────────────────────────────────────────────────
      await Swal.fire({
        background: "#fff",
        icon: "success",
        title: "¡Empleado creado!",
        html: `<div style="font-family:'DM Sans',sans-serif;color:#78716c;text-align:center;line-height:1.8">
          <p><b style="color:#163832">${nombreCompleto}</b> fue agregado al equipo.</p>
          <p style="font-size:12px;color:#9ca3af">${email.trim()} ya puede iniciar sesión</p>
        </div>`,
        confirmButtonColor: G[900],
        timer: 2500,
        timerProgressBar: true,
      });
      setForm(INIT);
      onClose();
    } catch (err) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error inesperado",
        text: err.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Nuevo empleado" size="md">
      <div className="space-y-4">
        {/* Nombre y apellido */}
        <div className="grid grid-cols-2 gap-3">
          <Field icon={UserCircle} label="Nombre" required>
            <input
              className={cls}
              onFocus={fi}
              onBlur={fb}
              value={form.nombre}
              onChange={set("nombre")}
              placeholder="Ej: Carlos"
            />
          </Field>
          <Field icon={UserCircle} label="Apellido" required>
            <input
              className={cls}
              onFocus={fi}
              onBlur={fb}
              value={form.apellido}
              onChange={set("apellido")}
              placeholder="Ej: Rodríguez"
            />
          </Field>
        </div>

        {/* Documento y teléfono */}
        <div className="grid grid-cols-2 gap-3">
          <Field icon={FileText} label="Documento" required>
            <input
              className={cls}
              onFocus={fi}
              onBlur={fb}
              value={form.documento}
              onChange={set("documento")}
              placeholder="Cédula o ID"
            />
          </Field>
          <Field icon={Phone} label="Teléfono">
            <input
              className={cls}
              onFocus={fi}
              onBlur={fb}
              value={form.telefono}
              onChange={set("telefono")}
              placeholder="+57 300 000 0000"
            />
          </Field>
        </div>

        {/* Email */}
        <Field
          icon={Mail}
          label="Correo electrónico"
          required
          hint="Lo usará para iniciar sesión en la plataforma"
        >
          <input
            type="email"
            className={cls}
            onFocus={fi}
            onBlur={fb}
            value={form.email}
            onChange={set("email")}
            placeholder="empleado@restaurante.com"
          />
        </Field>

        {/* Contraseñas */}
        <div className="grid grid-cols-2 gap-3">
          <PasswordField
            label="Contraseña"
            value={form.password}
            onChange={set("password")}
            placeholder="Mín. 8 caracteres"
            required
          />
          <PasswordField
            label="Confirmar"
            value={form.passwordConfirm}
            onChange={set("passwordConfirm")}
            placeholder="Repite la contraseña"
            required
          />
        </div>

        {/* Rol y país */}
        <div className="grid grid-cols-2 gap-3">
          <Field icon={ShieldCheck} label="Rol" required>
            <div className="relative">
              <select
                className={cls + " appearance-none cursor-pointer pr-8"}
                onFocus={fi}
                onBlur={fb}
                value={form.rol}
                onChange={set("rol")}
              >
                {ROLES_GERENTE.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
            </div>
          </Field>
          <Field icon={Globe} label="País" required>
            <div className="relative">
              <select
                className={cls + " appearance-none cursor-pointer pr-8"}
                onFocus={fi}
                onBlur={fb}
                value={form.pais}
                onChange={set("pais")}
              >
                {PAISES.map((p) => (
                  <option key={p.code} value={p.label}>
                    {p.flag} {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
            </div>
          </Field>
        </div>

        {/* Fecha contratación */}
        <Field icon={Calendar} label="Fecha de contratación">
          <input
            type="date"
            className={cls}
            onFocus={fi}
            onBlur={fb}
            value={form.fechaContratacion}
            onChange={set("fechaContratacion")}
          />
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
          <Button size="sm" loading={loading} onClick={handleSave}>
            Crear empleado
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal: Editar empleado ─────────────────────────────────────────────────
function ModalEditar({ open, onClose, empleado }) {
  // Inicializar vacío — useEffect sincroniza cada vez que cambia el empleado.
  // Sin useEffect, useState solo se inicializa en el primer render y el modal
  // muestra siempre los datos del primer empleado que se abrió.
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    rol: "mesero",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (empleado) {
      setForm({
        nombre: empleado.nombre ?? "",
        apellido: empleado.apellido ?? "",
        telefono: empleado.telefono ?? "",
        rol: empleado.rol ?? "mesero",
      });
    }
  }, [empleado?.id]);

  const [editar, { loading }] = useMutation(EDITAR_EMPLEADO, {
    refetchQueries: ["GetEmpleados"],
  });

  if (!open || !empleado) return null;

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        title: "Nombre y apellido son requeridos",
        confirmButtonColor: G[900],
      });
      return;
    }

    const confirm = await Swal.fire({
      background: "#fff",
      icon: "question",
      title: "¿Guardar cambios?",
      html: `<span style="font-family:'DM Sans';color:#78716c">Se actualizarán los datos de <b>${empleado.nombre} ${empleado.apellido}</b>.</span>`,
      showCancelButton: true,
      confirmButtonColor: G[900],
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      const { data } = await editar({
        variables: {
          empleadoId: empleado.id,
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          telefono: form.telefono || null,
          rol: form.rol,
        },
      });
      const res = data?.editarEmpleado;
      if (!res?.ok) throw new Error(res?.errores?.[0] || "Error al editar");
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "¡Cambios guardados!",
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Editar — ${empleado.nombre} ${empleado.apellido}`}
      size="sm"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field icon={UserCircle} label="Nombre" required>
            <input
              className={cls}
              onFocus={fi}
              onBlur={fb}
              value={form.nombre}
              onChange={set("nombre")}
            />
          </Field>
          <Field icon={UserCircle} label="Apellido" required>
            <input
              className={cls}
              onFocus={fi}
              onBlur={fb}
              value={form.apellido}
              onChange={set("apellido")}
            />
          </Field>
        </div>

        <Field icon={Phone} label="Teléfono">
          <input
            className={cls}
            onFocus={fi}
            onBlur={fb}
            value={form.telefono}
            onChange={set("telefono")}
            placeholder="+57 300 000 0000"
          />
        </Field>

        <Field icon={ShieldCheck} label="Rol">
          <div className="relative">
            <select
              className={cls + " appearance-none cursor-pointer pr-8"}
              onFocus={fi}
              onBlur={fb}
              value={form.rol}
              onChange={set("rol")}
            >
              {ROLES_GERENTE.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            />
          </div>
        </Field>

        {/* Campos inmutables — solo info */}
        <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 space-y-2">
          <p className="text-[10px] font-dm font-semibold text-stone-400 uppercase tracking-wide flex items-center gap-1">
            <Lock size={9} /> Datos de registro — no editables
          </p>
          {[
            { label: "Documento", value: empleado.documento },
            { label: "Email", value: empleado.email },
            {
              label: "País",
              value: `${flagFor(empleado.pais)} ${empleado.pais}`,
            },
          ].map((r) => (
            <div key={r.label} className="flex justify-between">
              <span className="text-xs font-dm text-stone-400">{r.label}</span>
              <span className="text-xs font-dm text-stone-600">{r.value}</span>
            </div>
          ))}
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
          <Button size="sm" loading={loading} onClick={handleSave}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal: Reactivar empleado ──────────────────────────────────────────────
function ModalReactivar({ open, onClose, empleado }) {
  const today = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = useState(today);
  const [loading, setLoading] = useState(false);

  const [activar] = useMutation(ACTIVAR_EMPLEADO, {
    refetchQueries: ["GetEmpleados"],
  });
  const [editarFecha] = useMutation(EDITAR_FECHA_CONTRATACION, {
    refetchQueries: ["GetEmpleados"],
  });
  const [activarAuthMut] = useMutation(ACTIVAR_USUARIO_AUTH);

  if (!open || !empleado) return null;

  const handleReactivar = async () => {
    const confirm = await Swal.fire({
      background: "#fff",
      icon: "question",
      title: `¿Reactivar a ${empleado.nombre}?`,
      html: `<span style="font-family:'DM Sans';color:#78716c">Se reincorporará al equipo y recuperará acceso al sistema.</span>`,
      showCancelButton: true,
      confirmButtonColor: G[900],
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Sí, reactivar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      // 1. Activar en staff_service
      const { data: d1 } = await activar({
        variables: { empleadoId: empleado.id },
      });
      if (!d1?.activarEmpleado?.ok)
        throw new Error(
          d1?.activarEmpleado?.errores?.[0] || "Error al activar",
        );

      // 2. Activar en auth_service — restaura el acceso al login
      await activarAuthMut({ variables: { email: empleado.email } });

      // 3. Actualizar fecha de contratación
      if (fecha) {
        await editarFecha({
          variables: { empleadoId: empleado.id, fechaContratacion: fecha },
        });
      }

      await Swal.fire({
        background: "#fff",
        icon: "success",
        title: "¡Empleado reactivado!",
        html: `<span style="font-family:'DM Sans';color:#78716c"><b>${empleado.nombre} ${empleado.apellido}</b> vuelve al equipo y puede iniciar sesión.</span>`,
        confirmButtonColor: G[900],
        timer: 1800,
        timerProgressBar: true,
      });
      onClose();
    } catch (err) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: err.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reactivar — ${empleado.nombre} ${empleado.apellido}`}
      size="sm"
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs font-dm text-amber-700">
            Este empleado está <strong>inactivo</strong>. Al reactivarlo podrá
            operar de nuevo en el sistema.
          </p>
        </div>

        <Field
          icon={Calendar}
          label="Nueva fecha de contratación"
          hint="Deja la fecha de hoy si es una reincorporación inmediata"
        >
          <input
            type="date"
            className={cls}
            onFocus={fi}
            onBlur={fb}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </Field>

        {/* Info del empleado */}
        <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 space-y-1.5">
          {[
            { label: "Email", value: empleado.email },
            { label: "Documento", value: empleado.documento },
            { label: "Rol actual", value: empleado.rolDisplay || empleado.rol },
          ].map((r) => (
            <div key={r.label} className="flex justify-between">
              <span className="text-xs font-dm text-stone-400">{r.label}</span>
              <span className="text-xs font-dm text-stone-600">{r.value}</span>
            </div>
          ))}
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
          <Button size="sm" loading={loading} onClick={handleReactivar}>
            <RefreshCw size={13} /> Reactivar empleado
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Tarjeta de empleado ────────────────────────────────────────────────────
function EmpleadoCard({
  emp,
  esMismo,
  onEdit,
  onDesactivar,
  onReactivar,
  toggling,
}) {
  const initials = getInitials(emp.nombre, emp.apellido);
  const rolV = ROL_VARIANT[emp.rol] ?? "default";

  return (
    <div
      className={`bg-white rounded-2xl border border-stone-200 p-4 flex gap-4 items-start transition-all hover:shadow-sm ${!emp.activo ? "opacity-60" : ""}`}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-dm font-bold flex-shrink-0"
        style={{ background: G[50], color: G[500] }}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-dm font-semibold text-stone-800 leading-tight">
                {emp.nombre} {emp.apellido}
              </p>
              {esMismo && (
                <span
                  className="text-[10px] font-dm font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: G[50],
                    color: G[300],
                    border: `1px solid ${G[100]}`,
                  }}
                >
                  Tú
                </span>
              )}
            </div>
            <p className="text-xs font-dm text-stone-400 mt-0.5">{emp.email}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant={rolV}>{emp.rolDisplay || emp.rol}</Badge>
            {!emp.activo && <Badge variant="red">Inactivo</Badge>}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {emp.telefono && (
            <span className="flex items-center gap-1 text-xs font-dm text-stone-400">
              <Phone size={11} /> {emp.telefono}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs font-dm text-stone-400">
            <Globe size={11} /> {flagFor(emp.pais)} {emp.pais}
          </span>
          <span className="flex items-center gap-1 text-xs font-dm text-stone-400">
            <Calendar size={11} /> desde {fmtFecha(emp.fechaContratacion)}
          </span>
          <span className="flex items-center gap-1 text-xs font-dm text-stone-400">
            <FileText size={11} /> {emp.documento}
          </span>
        </div>
      </div>

      {/* Acciones — bloqueadas si es el propio gerente */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        {esMismo ? (
          <div className="px-2 py-1.5 rounded-lg text-[10px] font-dm text-stone-300 text-center leading-tight">
            Solo el
            <br />
            admin
            <br />
            te edita
          </div>
        ) : (
          <>
            {emp.activo && (
              <button
                onClick={() => onEdit(emp)}
                className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
            )}
            <button
              onClick={() =>
                emp.activo ? onDesactivar(emp) : onReactivar(emp)
              }
              disabled={toggling === emp.id}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-40"
              title={emp.activo ? "Desactivar" : "Reactivar"}
            >
              {toggling === emp.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : emp.activo ? (
                <ToggleRight size={14} style={{ color: G[300] }} />
              ) : (
                <ToggleLeft size={14} />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function GEmpleadosList() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroActivo, setFiltroActivo] = useState("activos");
  const [showCrear, setShowCrear] = useState(false);
  const [empleadoEdit, setEmpleadoEdit] = useState(null);
  const [empleadoReactivar, setEmpleadoReactivar] = useState(null);
  const [toggling, setToggling] = useState(null);

  const activoBool =
    filtroActivo === "activos"
      ? true
      : filtroActivo === "inactivos"
        ? false
        : undefined;

  const { data, loading, error } = useQuery(GET_EMPLEADOS, {
    variables: {
      restauranteId,
      rol: filtroRol !== "todos" ? filtroRol : undefined,
      activo: activoBool,
    },
    skip: !restauranteId,
    fetchPolicy: "cache-and-network",
  });

  const [desactivar] = useMutation(DESACTIVAR_EMPLEADO, {
    refetchQueries: ["GetEmpleados"],
  });
  const [desactivarAuth] = useMutation(DESACTIVAR_USUARIO_AUTH);
  const [activarAuth] = useMutation(ACTIVAR_USUARIO_AUTH);

  // El backend devuelve todos los empleados del restaurante incluyendo
  // al gerente (rol "gerente" o "gerente_local"). El gerente local NO
  // puede gestionar a otros gerentes — eso es exclusivo del admin_central.
  const ROLES_GERENTE_ROL = ["gerente", "gerente_local"];
  const empleados = (data?.empleados ?? []).filter(
    (e) => !ROLES_GERENTE_ROL.includes(e.rol),
  );

  const filtrados = empleados.filter((e) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(q) ||
      e.apellido.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.documento.toLowerCase().includes(q)
    );
  });

  const handleDesactivar = async (emp) => {
    const confirm = await Swal.fire({
      background: "#fff",
      icon: "warning",
      title: `¿Desactivar a ${emp.nombre} ${emp.apellido}?`,
      html: `<span style="font-family:'DM Sans';color:#78716c">Perderá acceso al sistema inmediatamente. Puedes reactivarlo cuando quieras.</span>`,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    setToggling(emp.id);
    try {
      // Desactivar en staff_service
      const { data: dStaff } = await desactivar({
        variables: { empleadoId: emp.id },
      });
      const resStaff = dStaff?.desactivarEmpleado;
      if (!resStaff?.ok)
        throw new Error(resStaff?.errores?.[0] || "Error en staff");

      // Desactivar en auth_service — revoca el acceso al login
      const { data: dAuth } = await desactivarAuth({
        variables: { email: emp.email },
      });
      const resAuth = dAuth?.desactivarUsuario;

      if (!resAuth?.ok) {
        // Staff desactivado OK pero auth falló — igual mostramos éxito parcial
        Swal.fire({
          background: "#fff",
          icon: "warning",
          title: "Desactivado con advertencia",
          html: `<span style="font-family:'DM Sans';color:#78716c">${emp.nombre} fue desactivado del equipo, pero su acceso al sistema puede seguir activo temporalmente.<br><small style="color:#9ca3af">${resAuth?.error ?? ""}</small></span>`,
          confirmButtonColor: G[900],
        });
      } else {
        Swal.fire({
          background: "#fff",
          icon: "success",
          title: "Empleado desactivado",
          html: `<span style="font-family:'DM Sans';color:#78716c">${emp.nombre} ${emp.apellido} ya no tiene acceso al sistema.</span>`,
          timer: 1800,
          showConfirmButton: false,
        });
      }
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

  const activos = empleados.filter((e) => e.activo).length;
  const totalRoles = [...new Set(empleados.map((e) => e.rol))].length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi equipo"
        subtitle={`${activos} activos · ${empleados.length} en total`}
        icon={Users}
        action={
          <Button size="sm" onClick={() => setShowCrear(true)}>
            <Plus size={14} /> Nuevo empleado
          </Button>
        }
      />

      {/* KPIs */}
      {!loading && empleados.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Activos", value: activos, color: G[300] },
            {
              label: "Inactivos",
              value: empleados.length - activos,
              color: "#dc2626",
            },
            { label: "Roles distintos", value: totalRoles, color: G[500] },
          ].map((k) => (
            <div
              key={k.label}
              className="bg-white rounded-2xl border border-stone-200 px-4 py-3"
            >
              <p
                className="text-2xl font-dm font-bold"
                style={{ color: k.color }}
              >
                {k.value}
              </p>
              <p className="text-xs font-dm text-stone-400 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-800 placeholder:text-stone-400 outline-none shadow-sm"
            placeholder="Buscar por nombre, email o documento…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="relative">
          <select
            className="pl-3.5 pr-8 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-700 outline-none shadow-sm appearance-none cursor-pointer"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <option value="todos">Todos los roles</option>
            {ROLES_GERENTE.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
        </div>

        <div className="relative">
          <select
            className="pl-3.5 pr-8 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-700 outline-none shadow-sm appearance-none cursor-pointer"
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value)}
          >
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
            <option value="todos">Todos</option>
          </select>
          <ChevronDown
            size={13}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Contenido */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <p className="text-sm font-dm text-red-600">
            Error al cargar empleados: {error.message}
          </p>
        </div>
      )}

      {!loading && !error && filtrados.length === 0 && (
        <EmptyState
          icon={Users}
          title={
            busqueda ? "Sin resultados" : "Aún no tienes empleados registrados"
          }
          description={
            busqueda
              ? "Prueba con otro nombre, email o documento."
              : "Crea el primer empleado de tu equipo."
          }
          action={
            !busqueda && (
              <Button size="sm" onClick={() => setShowCrear(true)}>
                <Plus size={14} /> Nuevo empleado
              </Button>
            )
          }
        />
      )}

      {!loading && filtrados.length > 0 && (
        <div className="space-y-3">
          {filtrados.map((emp) => (
            <EmpleadoCard
              key={emp.id}
              emp={emp}
              esMismo={
                emp.id === user?.empleadoId ||
                emp.email?.toLowerCase() === user?.email?.toLowerCase()
              }
              onEdit={setEmpleadoEdit}
              onDesactivar={handleDesactivar}
              onReactivar={setEmpleadoReactivar}
              toggling={toggling}
            />
          ))}
          <p className="text-xs font-dm text-stone-400 text-center pt-1">
            {filtrados.length} empleado{filtrados.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Modales */}
      <ModalCrear
        open={showCrear}
        onClose={() => setShowCrear(false)}
        restauranteId={restauranteId}
        restaurantePais={user?.restaurantePais}
      />

      <ModalEditar
        open={!!empleadoEdit}
        onClose={() => setEmpleadoEdit(null)}
        empleado={empleadoEdit}
      />

      <ModalReactivar
        open={!!empleadoReactivar}
        onClose={() => setEmpleadoReactivar(null)}
        empleado={empleadoReactivar}
      />
    </div>
  );
}
