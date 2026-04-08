// restohub/src/features/menu/components/CreateRestaurante.jsx
import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Building2,
  MapPin,
  Home,
  Coins,
  Globe,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { CREATE_RESTAURANTE } from "../graphql/mutations";

const MONEDAS = [
  { value: "COP", label: "COP — Peso colombiano" },
  { value: "USD", label: "USD — Dólar estadounidense" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "MXN", label: "MXN — Peso mexicano" },
  { value: "ARS", label: "ARS — Peso argentino" },
  { value: "BRL", label: "BRL — Real brasileño" },
  { value: "CLP", label: "CLP — Peso chileno" },
];

// ── Field component ────────────────────────────────────────────────────────
function Field({ label, icon: Icon, children, hint }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs font-dm font-semibold tracking-wide uppercase text-[#666]">
        <Icon size={11} className="text-[#C9A84C]" />
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] font-dm text-[#444] pl-1">{hint}</p>}
    </div>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────
function Input({ value, onChange, placeholder, required, name }) {
  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-[#1E1E20]
                 text-sm font-dm text-white placeholder:text-[#333]
                 outline-none
                 focus:border-[#C9A84C]/40 focus:bg-[#141416]
                 hover:border-[#2A2A2C]
                 transition-all duration-150"
    />
  );
}

// ── Select ─────────────────────────────────────────────────────────────────
function Select({ value, onChange, name, children }) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-[#1E1E20]
                 text-sm font-dm text-white
                 outline-none appearance-none
                 focus:border-[#C9A84C]/40 focus:bg-[#141416]
                 hover:border-[#2A2A2C]
                 transition-all duration-150
                 cursor-pointer"
    >
      {children}
    </select>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function CreateRestaurante() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    pais: "",
    ciudad: "",
    direccion: "",
    moneda: "COP",
  });

  const [createRestaurante, { loading }] = useMutation(CREATE_RESTAURANTE, {
    refetchQueries: ["GetRestaurantes"],
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await createRestaurante({ variables: form });

      if (data.crearRestaurante.ok) {
        await Swal.fire({
          background: "#0D0D0F",
          color: "#F0EDE8",
          icon: "success",
          iconColor: "#C9A84C",
          title: "Restaurante creado",
          html: `<span style="font-family:'DM Sans',sans-serif;color:#888">${form.nombre} — ${form.ciudad}, ${form.pais}</span>`,
          confirmButtonColor: "#C9A84C",
          confirmButtonText: "Ver restaurantes",
        });
        navigate("/restaurantes");
      } else {
        Swal.fire({
          background: "#0D0D0F",
          color: "#F0EDE8",
          icon: "error",
          iconColor: "#ef4444",
          title: "Error",
          text: data.crearRestaurante.error,
          confirmButtonColor: "#C9A84C",
        });
      }
    } catch (err) {
      Swal.fire({
        background: "#0D0D0F",
        color: "#F0EDE8",
        icon: "error",
        title: "Error inesperado",
        text: err.message,
        confirmButtonColor: "#C9A84C",
      });
    }
  };

  const isComplete = Object.values(form).every((v) => v.trim() !== "");

  return (
    <div className="font-dm max-w-2xl mx-auto">
      {/* ── Breadcrumb ── */}
      <button
        onClick={() => navigate("/restaurantes")}
        className="flex items-center gap-2 text-[#555] hover:text-[#888] transition-colors text-sm mb-6 group"
      >
        <ArrowLeft
          size={14}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        Volver a restaurantes
      </button>

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-px bg-[#C9A84C]" />
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C9A84C]">
            Nuevo registro
          </span>
        </div>
        <h1 className="font-playfair text-3xl font-bold text-white">
          Crear restaurante
        </h1>
        <p className="text-[#555] text-sm mt-1.5">
          Completa la información para registrar una nueva sede en la cadena.
        </p>
      </div>

      {/* ── Card ── */}
      <div className="rounded-2xl border border-[#1E1E20] bg-[#0D0D0F] overflow-hidden">
        {/* Top accent */}
        <div className="h-px bg-gradient-to-r from-[#C9A84C] via-[#C9A84C]/30 to-transparent" />

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre */}
          <Field label="Nombre del restaurante" icon={Building2}>
            <Input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: RestoHub Central Bogotá"
              required
            />
          </Field>

          {/* País + Ciudad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="País" icon={Globe}>
              <Input
                name="pais"
                value={form.pais}
                onChange={handleChange}
                placeholder="Ej: Colombia"
                required
              />
            </Field>
            <Field label="Ciudad" icon={MapPin}>
              <Input
                name="ciudad"
                value={form.ciudad}
                onChange={handleChange}
                placeholder="Ej: Bogotá"
                required
              />
            </Field>
          </div>

          {/* Dirección */}
          <Field
            label="Dirección"
            icon={Home}
            hint="Incluye calle, número y referencias útiles."
          >
            <Input
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              placeholder="Ej: Calle 10 # 20-30, Local 5"
              required
            />
          </Field>

          {/* Moneda */}
          <Field label="Moneda" icon={Coins}>
            <Select name="moneda" value={form.moneda} onChange={handleChange}>
              {MONEDAS.map(({ value, label }) => (
                <option key={value} value={value} className="bg-[#141416]">
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          {/* Divider */}
          <div className="h-px bg-[#1E1E20]" />

          {/* Preview pill */}
          {isComplete && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#C9A84C]/5 border border-[#C9A84C]/15">
              <CheckCircle2 size={14} className="text-[#C9A84C] shrink-0" />
              <p className="text-xs font-dm text-[#C9A84C]/80">
                <span className="font-semibold text-[#C9A84C]">
                  {form.nombre}
                </span>
                {" — "}
                {form.ciudad}, {form.pais} · {form.moneda}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate("/restaurantes")}
              className="px-4 py-2.5 rounded-xl text-sm font-dm font-medium text-[#555]
                         hover:text-[#888] hover:bg-[#141416]
                         border border-transparent hover:border-[#1E1E20]
                         transition-all duration-150"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || !isComplete}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                         bg-[#C9A84C] text-[#0A0A0B]
                         font-dm font-semibold text-sm
                         shadow-lg shadow-[#C9A84C]/20
                         hover:bg-[#E8C96A] hover:shadow-[#C9A84C]/30
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} strokeWidth={2.5} />
                  Crear restaurante
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
