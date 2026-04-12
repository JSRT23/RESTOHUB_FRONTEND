// src/features/restaurantes/components/CrearGerenteForm.jsx
//
// Componente compartido de formulario para crear gerente.
// Usado en:
//   - CreateRestauranteWizard.jsx (Paso 3, después de crear el restaurante)
//   - RestauranteDetail.jsx (modal al pulsar "Asignar gerente")
//
// Props:
//   restaurante  → { id, nombre, pais }  — restaurante al que se asigna el gerente
//   onCreado()   → callback cuando se creó exitosamente (cierra modal / navega)
//   onOmitir()   → callback para omitir (solo wizard)
//   modoModal    → boolean — false = página completa, true = dentro de modal

import { useState } from "react";
import Swal from "sweetalert2";
import { useMutation } from "@apollo/client/react";
import {
  Loader2,
  User,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { REGISTRAR_GERENTE, CREAR_EMPLEADO_STAFF } from "./graphql/operations";

// ── Paleta ────────────────────────────────────────────────────────────────
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

// ── Mapa de nombres de país → código ISO 2 letras para staff_service ──────
const PAIS_CODE = {
  Colombia: "CO",
  México: "MX",
  Mexico: "MX",
  Perú: "PE",
  Peru: "PE",
  Argentina: "AR",
  Chile: "CL",
  Ecuador: "EC",
  Bolivia: "BO",
  Venezuela: "VE",
  España: "ES",
  España: "ES",
  "Estados Unidos": "US",
  Panama: "PA",
  Panamá: "PA",
  Brasil: "BR",
  // Códigos directos por si ya vienen en ISO
  CO: "CO",
  MX: "MX",
  PE: "PE",
  AR: "AR",
  CL: "CL",
  EC: "EC",
  BO: "BO",
  VE: "VE",
  ES: "ES",
  US: "US",
  PA: "PA",
  BR: "BR",
};

function getPaisCode(pais) {
  if (!pais) return "CO";
  return PAIS_CODE[pais] || pais.slice(0, 2).toUpperCase();
}

// ── Estilos de campo ──────────────────────────────────────────────────────
const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all shadow-sm";
const fi = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
};
const fb = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  hint,
  type = "text",
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputCls}
        onFocus={fi}
        onBlur={fb}
      />
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
      <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${inputCls} pr-10`}
          onFocus={fi}
          onBlur={fb}
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

// ── Componente principal ──────────────────────────────────────────────────
export default function CrearGerenteForm({
  restaurante,
  onCreado,
  onOmitir,
  modoModal = false,
}) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    documento: "",
    email: "",
    telefono: "",
    password: "",
    passwordConfirm: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const [registrarGerente] = useMutation(REGISTRAR_GERENTE);
  const [crearEmpleado] = useMutation(CREAR_EMPLEADO_STAFF);

  const handleCrear = async () => {
    // ── Validación ────────────────────────────────────────────────────────
    const { nombre, apellido, documento, email, password, passwordConfirm } =
      form;
    if (!nombre || !apellido || !documento || !email || !password) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        draggable: true,
        title: "Campos incompletos",
        text: "Nombre, apellido, documento, email y contraseña son obligatorios.",
        confirmButtonColor: G[900],
      });
      return;
    }
    if (password !== passwordConfirm) {
      Swal.fire({
        background: "#fff",
        icon: "warning",
        draggable: true,
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
        draggable: true,
        title: "Contraseña muy corta",
        text: "La contraseña debe tener al menos 8 caracteres.",
        confirmButtonColor: G[900],
      });
      return;
    }

    setLoading(true);
    const nombreCompleto = `${nombre} ${apellido}`.trim();

    try {
      // ── PASO A: crear usuario en auth_service ─────────────────────────
      const { data: d1 } = await registrarGerente({
        variables: {
          email,
          nombre: nombreCompleto,
          password,
          passwordConfirm,
          restauranteId: restaurante.id,
        },
      });

      const usr = d1?.registrarUsuario;
      if (!usr?.ok) {
        Swal.fire({
          background: "#fff",
          icon: "error",
          draggable: true,
          title: "Error al crear cuenta del gerente",
          text: usr?.error || "No se pudo crear el usuario en autenticación.",
          confirmButtonColor: G[900],
        });
        setLoading(false);
        return;
      }

      // ── PASO B: crear empleado en staff_service ───────────────────────
      const paisCode = getPaisCode(restaurante.pais);

      const { data: d2 } = await crearEmpleado({
        variables: {
          nombre: nombre,
          apellido: apellido,
          documento: documento,
          email: email,
          telefono: form.telefono || "",
          rol: "gerente", // staff_service usa "gerente", auth usa "gerente_local"
          pais: paisCode,
          restaurante: restaurante.id, // UUID del menu_service — staff resuelve el RestauranteLocal
        },
      });

      const emp = d2?.crearEmpleado;

      if (!emp?.ok) {
        // Auth OK pero staff falló → el gerente puede iniciar sesión pero sin perfil staff
        Swal.fire({
          background: "#fff",
          icon: "warning",
          draggable: true,
          title: "Gerente creado con advertencia",
          html: `
            <div style="font-family:'DM Sans',sans-serif;color:#78716c;line-height:1.6">
              <p><b style="color:#163832">${nombreCompleto}</b> ya puede iniciar sesión,
              pero hubo un error al registrarlo en Staff:</p>
              <p style="font-size:12px;color:#9ca3af;margin-top:6px">
                ${emp?.errores || "Error desconocido en staff_service"}
              </p>
            </div>`,
          footer: `<span style="font-family:'DM Sans',sans-serif;font-size:12px">
            Complétalo desde <b>Gestión › Staff</b> del restaurante
          </span>`,
          confirmButtonColor: G[900],
        });
        onCreado(); // igual cerramos y refrescamos
        return;
      }

      // ── Todo OK ───────────────────────────────────────────────────────
      await Swal.fire({
        background: "#fff",
        icon: "success",
        draggable: true,
        title: "¡Gerente creado exitosamente!",
        html: `
          <div style="font-family:'DM Sans',sans-serif;color:#78716c;text-align:center;line-height:1.8">
            <p><b style="color:#163832">${nombreCompleto}</b> es ahora el gerente de</p>
            <p style="font-size:20px;font-weight:700;color:#051F20;margin:4px 0">
              ${restaurante.nombre}
            </p>
            <p style="font-size:12px;color:#9ca3af">
              ${email} ya puede iniciar sesión
            </p>
          </div>`,
        confirmButtonColor: G[900],
        confirmButtonText: "Perfecto",
        timer: 4000,
        timerProgressBar: true,
      });

      onCreado();
    } catch (err) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        draggable: true,
        title: "Error inesperado",
        text: err.message || "Ocurrió un error. Intenta de nuevo.",
        confirmButtonColor: G[900],
      });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Banner del restaurante */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border"
        style={{ background: `${G[50]}99`, borderColor: G[100] }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: G[50] }}
        >
          <Building2 size={14} style={{ color: G[300] }} />
        </div>
        <div>
          <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
            Restaurante
          </p>
          <p className="text-sm font-dm font-bold" style={{ color: G[500] }}>
            {restaurante.nombre}
          </p>
        </div>
        <div
          className="ml-auto flex items-center gap-1.5 text-[10px] font-dm font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: G[50],
            color: G[500],
            border: `1px solid ${G[100]}`,
          }}
        >
          <ShieldCheck size={10} />
          Gerente local
        </div>
      </div>

      {/* Descripción */}
      {!modoModal && (
        <p className="text-sm font-dm text-stone-500">
          Crea la cuenta del gerente. Podrá iniciar sesión de inmediato y
          gestionar menú, inventario y staff de este restaurante.
        </p>
      )}

      {/* Campos del formulario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Nombre"
          value={form.nombre}
          onChange={set("nombre")}
          placeholder="Nombre"
          required
        />
        <Field
          label="Apellido"
          value={form.apellido}
          onChange={set("apellido")}
          placeholder="Apellido"
          required
        />
        <div className="sm:col-span-2">
          <Field
            label="Documento de identidad"
            value={form.documento}
            onChange={set("documento")}
            placeholder="Número de documento"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Correo electrónico"
            value={form.email}
            onChange={set("email")}
            placeholder="gerente@restaurante.com"
            type="email"
            required
            hint="Usará este email para iniciar sesión"
          />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Teléfono / WhatsApp"
            value={form.telefono}
            onChange={set("telefono")}
            placeholder="+57 300 123 4567"
            type="tel"
            hint="Opcional — para contacto directo con el gerente"
          />
        </div>
        <PasswordField
          label="Contraseña"
          value={form.password}
          onChange={set("password")}
          placeholder="Mínimo 8 caracteres"
          required
        />
        <PasswordField
          label="Confirmar contraseña"
          value={form.passwordConfirm}
          onChange={set("passwordConfirm")}
          placeholder="Repite la contraseña"
          required
        />
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between pt-2">
        {onOmitir && (
          <button
            onClick={onOmitir}
            className="text-xs font-dm text-stone-400 hover:text-stone-600 transition underline"
          >
            Omitir por ahora
          </button>
        )}
        <button
          onClick={handleCrear}
          disabled={loading}
          style={{ background: G[900] }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-dm font-bold text-white transition hover:opacity-90 disabled:opacity-40 ${!onOmitir ? "ml-auto" : ""}`}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Creando...
            </>
          ) : (
            <>
              <User size={14} /> Crear gerente
            </>
          )}
        </button>
      </div>
    </div>
  );
}
