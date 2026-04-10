// src/features/auth/components/LoginPage.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Mail,
  Lock,
} from "lucide-react";
import { useAuth } from "../../../app/auth/AuthContext";
import {
  LOGIN_MUTATION,
  VERIFICAR_CODIGO_MUTATION,
  REENVIAR_CODIGO_MUTATION,
} from "../graphql/mutations";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  700: "#0B2B26",
  900: "#051F20",
};

// ── Field ──────────────────────────────────────────────────────────────────
function Field({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300">
          <Icon size={15} />
        </div>
        <input
          type={isPass && show ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full pl-10 pr-10 py-3 rounded-xl text-sm font-dm text-stone-800 placeholder:text-stone-300 bg-white border border-stone-200 outline-none transition-all"
          onFocus={(e) => {
            e.target.style.borderColor = "transparent";
            e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.boxShadow = "none";
          }}
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── PrimaryButton ──────────────────────────────────────────────────────────
function PrimaryButton({
  children,
  loading,
  disabled,
  type = "button",
  onClick,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      style={{ background: G[900] }}
      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-dm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-40"
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// ── ErrorMsg ───────────────────────────────────────────────────────────────
function ErrorMsg({ text }) {
  if (!text) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
      <p className="text-xs font-dm text-red-600">{text}</p>
    </div>
  );
}

// ── Vista: Login ───────────────────────────────────────────────────────────
function LoginForm({ onEmailNoVerificado }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [doLogin, { loading }] = useMutation(LOGIN_MUTATION);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { data } = await doLogin({ variables: { email, password } });
    const res = data?.login;
    if (!res?.ok) {
      if (res?.codigo === "EMAIL_NO_VERIFICADO") {
        onEmailNoVerificado(email);
        return;
      }
      setError(res?.error || "Credenciales inválidas.");
      return;
    }
    login({
      access_token: res.payload.accessToken,
      refresh_token: res.payload.refreshToken,
      usuario: res.payload.usuario,
    });
    navigate(from, { replace: true });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="Correo electrónico"
        icon={Mail}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="usuario@restohub.com"
        autoComplete="email"
      />
      <Field
        label="Contraseña"
        icon={Lock}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-stone-300 cursor-pointer"
            style={{ accentColor: G[500] }}
          />
          <span className="text-xs font-dm text-stone-400">Recuérdame</span>
        </label>
      </div>

      <ErrorMsg text={error} />

      <PrimaryButton type="submit" loading={loading}>
        Iniciar sesión <ArrowRight size={14} />
      </PrimaryButton>
    </form>
  );
}

// ── Vista: Verificar código (solo si email no verificado) ─────────────────
function VerificarCodigoForm({ email, onBack, codigoDev }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [reenvios, setReenvios] = useState(0);

  const [verificar, { loading: verLoading }] = useMutation(
    VERIFICAR_CODIGO_MUTATION,
  );
  const [reenviar, { loading: reenvLoading }] = useMutation(
    REENVIAR_CODIGO_MUTATION,
  );

  const handleVerificar = async (e) => {
    e.preventDefault();
    setError("");
    const { data } = await verificar({ variables: { email, codigo } });
    const res = data?.verificarCodigo;
    if (!res?.ok) {
      const msgs = {
        CODIGO_EXPIRADO: "El código expiró. Solicita uno nuevo.",
        INTENTOS_AGOTADOS: "Demasiados intentos. Solicita un nuevo código.",
        CODIGO_INCORRECTO: `Código incorrecto. ${res.intentosRestantes ?? ""} intento(s) restante(s).`,
        SIN_CODIGO: "No hay código activo. Solicita uno nuevo.",
      };
      setError(msgs[res.codigoError] || res.error || "Código inválido.");
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      onBack();
    }, 1800);
  };

  const handleReenviar = async () => {
    await reenviar({ variables: { email } });
    setReenvios((r) => r + 1);
    setCodigo("");
    setError("");
  };

  return (
    <form onSubmit={handleVerificar} className="space-y-4">
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200">
        <Mail size={13} className="text-stone-300 shrink-0" />
        <p className="text-sm font-dm text-stone-600 truncate">{email}</p>
      </div>

      {codigoDev && (
        <div
          style={{ borderColor: G[100], background: `${G[50]}99` }}
          className="rounded-xl px-4 py-3 border text-center"
        >
          <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider mb-1">
            Código de desarrollo
          </p>
          <p
            style={{ color: G[500], letterSpacing: "0.4em" }}
            className="text-2xl font-bold font-mono"
          >
            {codigoDev}
          </p>
        </div>
      )}

      {success ? (
        <div style={{ color: G[300] }} className="text-center py-6 space-y-2">
          <ShieldCheck size={36} className="mx-auto" />
          <p className="font-dm font-semibold">
            ¡Email verificado! Ya puedes iniciar sesión.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-dm font-semibold text-stone-500 uppercase tracking-wider">
              Código de 6 dígitos
            </label>
            <input
              value={codigo}
              onChange={(e) =>
                setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              placeholder="000000"
              className="w-full py-4 rounded-xl text-center text-2xl font-bold font-mono tracking-[0.5em] bg-white border border-stone-200 outline-none transition-all text-stone-800 placeholder:text-stone-200"
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

          <ErrorMsg text={error} />

          <PrimaryButton
            type="submit"
            loading={verLoading}
            disabled={codigo.length !== 6}
          >
            Verificar código <ShieldCheck size={14} />
          </PrimaryButton>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-dm text-stone-400 hover:text-stone-600 transition"
            >
              ← Volver
            </button>
            <button
              type="button"
              onClick={handleReenviar}
              disabled={reenvLoading}
              style={{ color: G[300] }}
              className="flex items-center gap-1.5 text-xs font-dm hover:opacity-80 transition disabled:opacity-40"
            >
              <RotateCcw size={11} />
              Reenviar código {reenvios > 0 && `(${reenvios})`}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [vista, setVista] = useState("login");
  const [emailPending, setEmail] = useState("");
  const [codigoDev, setCodigoDev] = useState(null);

  const titulos = {
    login: { h: "Bienvenido", sub: "Accede a tu panel de gestión" },
    verificar: {
      h: "Verifica tu correo",
      sub: "Ingresa el código que recibiste",
    },
  };
  const t = titulos[vista];

  return (
    <div
      className="min-h-screen flex font-dm"
      style={{ background: "#e8e8e6" }}
    >
      {/* Panel izquierdo */}
      <div
        style={{ background: G[900] }}
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ background: G[50] }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
          >
            <span
              style={{ color: G[900], fontFamily: "'Playfair Display', serif" }}
              className="font-black text-lg"
            >
              R
            </span>
          </div>
          <span
            style={{ color: G[50], fontFamily: "'Playfair Display', serif" }}
            className="font-bold text-xl"
          >
            RestoHub
          </span>
        </div>

        <div className="space-y-6">
          <div
            style={{ background: G[700], borderColor: G[500] }}
            className="rounded-2xl border p-6"
          >
            <p
              style={{ color: G[50], fontFamily: "'Playfair Display', serif" }}
              className="text-2xl font-bold leading-snug"
            >
              Centro de control para la operación de tu restaurante
            </p>

            <p
              style={{ color: G[100] }}
              className="text-sm font-dm leading-relaxed mt-2"
            >
              Supervisa ventas, gestiona pedidos, controla inventario y coordina
              tu equipo en tiempo real desde una sola plataforma.
            </p>
          </div>
          {[
            "Control total de pedidos y ventas en tiempo real",
            "Gestión de inventario y abastecimiento",
            "Administración de personal y turnos",
          ].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div
                style={{ background: G[500] }}
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              >
                <ShieldCheck size={12} style={{ color: G[50] }} />
              </div>
              <span style={{ color: G[100] }} className="text-sm font-dm">
                {f}
              </span>
            </div>
          ))}
        </div>

        <p style={{ color: G[500] }} className="text-[11px] font-dm">
          © {new Date().getFullYear()} Universidad Cooperativa de Colombia
        </p>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo móvil */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div
              style={{ background: G[900] }}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
            >
              <span
                style={{
                  color: G[50],
                  fontFamily: "'Playfair Display', serif",
                }}
                className="font-black text-sm"
              >
                R
              </span>
            </div>
            <span
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="font-bold text-lg text-stone-900"
            >
              RestoHub
            </span>
          </div>

          {/* Card con relieve */}
          <div
            className="rounded-2xl bg-white border border-stone-200 p-7"
            style={{
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
            }}
          >
            <div className="mb-7">
              <h1
                style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-2xl font-bold text-stone-900"
              >
                {t.h}
              </h1>
              <p className="text-sm text-stone-400 font-dm mt-1">{t.sub}</p>
            </div>

            {vista === "login" && (
              <LoginForm
                onEmailNoVerificado={(e) => {
                  setEmail(e);
                  setVista("verificar");
                }}
              />
            )}
            {vista === "verificar" && (
              <VerificarCodigoForm
                email={emailPending}
                codigoDev={codigoDev}
                onBack={() => {
                  setVista("login");
                  setCodigoDev(null);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
