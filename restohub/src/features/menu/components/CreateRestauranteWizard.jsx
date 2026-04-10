// src/features/restaurantes/components/CreateRestauranteWizard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import {
  Building2,
  MapPin,
  Coins,
  User,
  Mail,
  Lock,
  ChevronRight,
  Check,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import {
  PageHeader,
  StepIndicator,
  Breadcrumb,
} from "../../../shared/components/ui";
import {
  CREAR_RESTAURANTE,
  REGISTRAR_GERENTE,
  CREAR_EMPLEADO_GERENTE,
} from "../graphql/operations";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const PASOS = ["Datos del restaurante", "Confirmación", "Crear gerente"];

const MONEDAS = ["COP", "USD", "EUR", "MXN", "PEN", "ARS", "CLP", "BOB", "VES"];
const PAISES = [
  "Colombia",
  "México",
  "Perú",
  "Argentina",
  "Chile",
  "Ecuador",
  "Bolivia",
  "Venezuela",
  "España",
  "Estados Unidos",
];

// ── Field helpers ──────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, required, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3.5 py-3 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all shadow-sm"
        onFocus={(e) => {
          e.target.style.borderColor = "transparent";
          e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e2e8f0";
          e.target.style.boxShadow = "none";
        }}
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
          className="w-full px-3.5 pr-10 py-3 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all shadow-sm"
          onFocus={(e) => {
            e.target.style.borderColor = "transparent";
            e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.boxShadow = "none";
          }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3.5 py-3 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 outline-none appearance-none cursor-pointer transition-all shadow-sm"
        onFocus={(e) => {
          e.target.style.borderColor = "transparent";
          e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e2e8f0";
          e.target.style.boxShadow = "none";
        }}
      >
        <option value="">Seleccionar...</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function ErrorBox({ text }) {
  if (!text) return null;
  return (
    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
      <p className="text-sm font-dm text-red-600">{text}</p>
    </div>
  );
}

// ── Paso 1: Datos del restaurante ──────────────────────────────────────────
function Paso1({ form, onChange, onNext, error }) {
  const valid =
    form.nombre && form.pais && form.ciudad && form.direccion && form.moneda;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Field
            label="Nombre del restaurante"
            value={form.nombre}
            onChange={(e) => onChange("nombre", e.target.value)}
            placeholder="Ej: RestoHub Centro"
            required
          />
        </div>
        <SelectField
          label="País"
          value={form.pais}
          onChange={(e) => onChange("pais", e.target.value)}
          options={PAISES}
          required
        />
        <Field
          label="Ciudad"
          value={form.ciudad}
          onChange={(e) => onChange("ciudad", e.target.value)}
          placeholder="Ej: Bogotá"
          required
        />
        <div className="sm:col-span-2">
          <Field
            label="Dirección"
            value={form.direccion}
            onChange={(e) => onChange("direccion", e.target.value)}
            placeholder="Ej: Calle 80 #15-32, Local 4"
            required
          />
        </div>
        <SelectField
          label="Moneda"
          value={form.moneda}
          onChange={(e) => onChange("moneda", e.target.value)}
          options={MONEDAS}
          required
        />
      </div>

      <ErrorBox text={error} />

      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          disabled={!valid}
          style={{ background: G[900] }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-dm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          Continuar <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Paso 2: Confirmación ───────────────────────────────────────────────────
function Paso2({ form, onBack, onConfirm, loading }) {
  const rows = [
    { icon: Building2, label: "Nombre", value: form.nombre },
    { icon: MapPin, label: "País", value: form.pais },
    { icon: MapPin, label: "Ciudad", value: form.ciudad },
    { icon: MapPin, label: "Dirección", value: form.direccion },
    { icon: Coins, label: "Moneda", value: form.moneda },
  ];
  return (
    <div className="space-y-5">
      <p className="text-sm font-dm text-stone-500">
        Revisa los datos antes de crear el restaurante.
      </p>

      <div className="rounded-2xl border border-stone-200 overflow-hidden">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={`flex items-center gap-3 px-4 py-3.5 ${i < rows.length - 1 ? "border-b border-stone-100" : ""}`}
          >
            <div
              style={{ background: G[50] }}
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            >
              <r.icon size={13} style={{ color: G[300] }} />
            </div>
            <span className="text-xs font-dm font-semibold text-stone-400 w-24 shrink-0">
              {r.label}
            </span>
            <span className="text-sm font-dm text-stone-800 font-medium">
              {r.value}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{ background: `${G[50]}99`, borderColor: G[100] }}
        className="rounded-xl border px-4 py-3"
      >
        <p className="text-xs font-dm" style={{ color: G[500] }}>
          <span className="font-semibold">Siguiente paso:</span> crearás al
          gerente de este restaurante. Podrá iniciar sesión de inmediato.
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-dm font-semibold text-stone-500 bg-white border border-stone-200 hover:border-stone-300 transition-all"
        >
          <ArrowLeft size={14} /> Atrás
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{ background: G[900] }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-dm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          Crear restaurante
        </button>
      </div>
    </div>
  );
}

// ── Paso 3: Crear gerente ──────────────────────────────────────────────────
function Paso3({ restaurante, onDone, onSkip }) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [registrarGerente, { loading: l1 }] = useMutation(REGISTRAR_GERENTE);
  const [crearEmpleado, { loading: l2 }] = useMutation(CREAR_EMPLEADO_GERENTE);
  const loading = l1 || l2;

  const handleCrear = async () => {
    setError("");
    if (form.password !== form.passwordConfirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!form.nombre || !form.email || !form.password) {
      setError("Todos los campos son requeridos.");
      return;
    }

    // 1) Crear usuario en auth_service
    const { data: d1 } = await registrarGerente({
      variables: {
        email: form.email,
        nombre: form.nombre,
        password: form.password,
        passwordConfirm: form.passwordConfirm,
        restauranteId: restaurante.id,
      },
    });
    const usr = d1?.registrarUsuario;
    if (!usr?.ok) {
      setError(usr?.error || "Error al crear el usuario gerente.");
      return;
    }

    // 2) Crear empleado en staff_service
    const { data: d2 } = await crearEmpleado({
      variables: {
        nombre: form.nombre,
        email: form.email,
        rol: "gerente_local",
        restauranteId: restaurante.id,
        userId: usr.usuario.id,
      },
    });
    const emp = d2?.crearEmpleado;
    if (!emp?.ok) {
      setError(
        "Usuario creado pero falló el registro en staff. Puedes completarlo desde Gestión > Staff.",
      );
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="text-center py-8 space-y-4">
        <div
          style={{ background: G[50] }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
        >
          <ShieldCheck size={30} style={{ color: G[300] }} />
        </div>
        <div>
          <h3
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-xl font-bold text-stone-900"
          >
            ¡Todo listo!
          </h3>
          <p className="text-sm font-dm text-stone-500 mt-1">
            Restaurante y gerente creados correctamente.
          </p>
          <p className="text-xs font-dm mt-2" style={{ color: G[300] }}>
            {form.email} puede iniciar sesión ahora.
          </p>
        </div>
        <button
          onClick={onDone}
          style={{ background: G[900] }}
          className="mx-auto flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-dm font-bold text-white transition hover:opacity-90"
        >
          Ver restaurantes <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Contexto */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-50 border border-stone-200">
        <Building2 size={14} style={{ color: G[300] }} />
        <div>
          <p className="text-xs font-dm text-stone-400">Restaurante creado</p>
          <p className="text-sm font-dm font-semibold text-stone-800">
            {restaurante.nombre}
          </p>
        </div>
      </div>

      <p className="text-sm font-dm text-stone-500">
        Crea el gerente que administrará este restaurante. Podrá iniciar sesión
        de inmediato.
      </p>

      <div className="space-y-4">
        <Field
          label="Nombre completo"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Nombre del gerente"
          required
        />
        <Field
          label="Correo electrónico"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="gerente@restaurante.com"
          required
          hint="Usará este email para iniciar sesión"
        />
        <PasswordField
          label="Contraseña"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Mínimo 8 caracteres"
          required
        />
        <PasswordField
          label="Confirmar contraseña"
          value={form.passwordConfirm}
          onChange={(e) =>
            setForm({ ...form, passwordConfirm: e.target.value })
          }
          placeholder="Repite la contraseña"
          required
        />
      </div>

      <ErrorBox text={error} />

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onSkip}
          className="text-xs font-dm text-stone-400 hover:text-stone-600 transition underline"
        >
          Omitir por ahora
        </button>
        <button
          onClick={handleCrear}
          disabled={loading}
          style={{ background: G[900] }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-dm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <User size={14} />
          )}
          Crear gerente
        </button>
      </div>
    </div>
  );
}

// ── Main Wizard ────────────────────────────────────────────────────────────
export default function CreateRestauranteWizard() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(0);
  const [error, setError] = useState("");
  const [restauranteCreado, setRestauranteCreado] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    pais: "",
    ciudad: "",
    direccion: "",
    moneda: "",
  });

  const handleChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const [crearRestaurante, { loading: creando }] =
    useMutation(CREAR_RESTAURANTE);

  const handleConfirm = async () => {
    setError("");
    const { data } = await crearRestaurante({ variables: form });
    const res = data?.crearRestaurante;
    if (!res?.ok) {
      setError(res?.error || "Error al crear el restaurante.");
      return;
    }
    setRestauranteCreado(res.restaurante);
    setPaso(2);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { label: "Restaurantes", onClick: () => navigate("/restaurantes") },
          { label: "Nuevo restaurante" },
        ]}
      />

      <PageHeader
        eyebrow="Admin Central"
        title="Nuevo restaurante"
        description="Completa los tres pasos para dejar todo listo"
      />

      {/* Stepper */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
        <StepIndicator steps={PASOS} current={paso} />
      </div>

      {/* Card principal */}
      <div
        className="bg-white rounded-2xl border border-stone-200 shadow-sm"
        style={{
          boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        {/* Header del paso */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
          <div
            style={{ background: G[50] }}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
          >
            {paso === 0 && <Building2 size={15} style={{ color: G[300] }} />}
            {paso === 1 && <Check size={15} style={{ color: G[300] }} />}
            {paso === 2 && <User size={15} style={{ color: G[300] }} />}
          </div>
          <div>
            <p className="text-xs font-dm text-stone-400">
              Paso {paso + 1} de 3
            </p>
            <p className="text-sm font-dm font-semibold text-stone-800">
              {PASOS[paso]}
            </p>
          </div>
        </div>

        <div className="p-6">
          {paso === 0 && (
            <Paso1
              form={form}
              onChange={handleChange}
              onNext={() => {
                setError("");
                setPaso(1);
              }}
              error={error}
            />
          )}
          {paso === 1 && (
            <Paso2
              form={form}
              onBack={() => setPaso(0)}
              onConfirm={handleConfirm}
              loading={creando}
              error={error}
            />
          )}
          {paso === 2 && restauranteCreado && (
            <Paso3
              restaurante={restauranteCreado}
              onDone={() => navigate("/restaurantes")}
              onSkip={() => navigate("/restaurantes")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
