// src/features/restaurantes/components/CreateRestauranteWizard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
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
} from "../../../../shared/components/ui";
import { CREAR_RESTAURANTE } from "./graphql/operations";
import CrearGerenteForm from "./CrearGerenteForm";

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

// ── Componentes de campo ───────────────────────────────────────────────────
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
        className={cls}
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
          className={`${cls} pr-10`}
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
        className={`${cls} appearance-none cursor-pointer`}
        onFocus={fi}
        onBlur={fb}
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

// ── Paso 1: Datos ──────────────────────────────────────────────────────────
function Paso1({ form, onChange, onNext }) {
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
function Paso3({ restaurante, onDone }) {
  return (
    <CrearGerenteForm
      restaurante={restaurante}
      onCreado={onDone}
      onOmitir={onDone}
      modoModal={false}
    />
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function CreateRestauranteWizard() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(0);
  const [restauranteCreado, setRes] = useState(null);
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
    const { data } = await crearRestaurante({ variables: form });
    const res = data?.crearRestaurante;
    if (!res?.ok) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        draggable: true,
        title: "Error al crear restaurante",
        text: res?.error || "No se pudo crear el restaurante.",
        confirmButtonColor: G[900],
      });
      return;
    }
    Swal.fire({
      background: "#fff",
      icon: "success",
      draggable: true,
      title: "¡Restaurante creado exitosamente!",
      html: `<span style="font-family:'DM Sans',sans-serif;color:#78716c">
        <b style="color:#051F20">${res.restaurante.nombre}</b> fue registrado correctamente.<br/>Ahora crea su gerente.
      </span>`,
      confirmButtonColor: G[900],
      confirmButtonText: "Crear gerente",
      timer: 3000,
      timerProgressBar: true,
    });
    setRes(res.restaurante);
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

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
        <StepIndicator steps={PASOS} current={paso} />
      </div>

      <div
        className="bg-white rounded-2xl border border-stone-200"
        style={{
          boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
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
              onNext={() => setPaso(1)}
            />
          )}
          {paso === 1 && (
            <Paso2
              form={form}
              onBack={() => setPaso(0)}
              onConfirm={handleConfirm}
              loading={creando}
            />
          )}
          {paso === 2 && restauranteCreado && (
            <Paso3
              restaurante={restauranteCreado}
              onDone={() => navigate("/restaurantes")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
