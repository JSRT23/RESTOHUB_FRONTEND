// restohub_app/src/features/auth/pages/LoginPage.jsx
//
// CAMBIOS vs original:
// 1. Panel izquierdo: SOLO imagen de fondo + overlay oscuro suave.
//    Removido: logo RestoHub arriba, copy central con features, © abajo.
//    El panel es pura fotografía inmersiva — el texto vive en el panel derecho.
// 2. Bug: doble `return;` en CartPage (movido a su propio archivo).

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { useAuth } from "../../../app/auth/AuthContext";
import { swalSuccess, swalError } from "../../../shared/utils/swal";
import {
  MUTATION_LOGIN,
  MUTATION_AUTO_REGISTRO,
  MUTATION_VERIFICAR_CODIGO,
  MUTATION_REENVIAR_CODIGO,
} from "../queries";

const TIPOS_DOC = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "PA", label: "Pasaporte" },
  { value: "NIT", label: "NIT" },
  { value: "OT", label: "Otro" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [nombre, setNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [pass2Val, setPass2Val] = useState("");
  const [pass2Confirm, setPass2Confirm] = useState("");
  const [cedula, setCedula] = useState("");
  const [tipoDoc, setTipoDoc] = useState("CC");
  const [telefono, setTelefono] = useState("");

  const [codigo, setCodigo] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [doLogin] = useMutation(MUTATION_LOGIN);
  const [doRegistro] = useMutation(MUTATION_AUTO_REGISTRO);
  const [doVerificar] = useMutation(MUTATION_VERIFICAR_CODIGO);
  const [doReenviar] = useMutation(MUTATION_REENVIAR_CODIGO);

  const inp = {
    width: "100%",
    padding: "12px 14px",
    background: "var(--bg2)",
    border: "1.5px solid var(--border2)",
    borderRadius: "10px",
    color: "var(--text)",
    fontSize: "14px",
    fontFamily: "DM Sans, sans-serif",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };
  const focus = (e) => (e.target.style.borderColor = "var(--green)");
  const blur = (e) => (e.target.style.borderColor = "var(--border2)");

  const Label = ({ children, optional }) => (
    <label
      style={{
        display: "block",
        fontSize: "10px",
        fontWeight: 700,
        color: "var(--text3)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: "6px",
      }}
    >
      {children}
      {optional && (
        <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 4 }}>
          (opcional)
        </span>
      )}
    </label>
  );

  const Spinner = () => (
    <span
      style={{
        width: 15,
        height: 15,
        border: "2px solid rgba(255,255,255,0.3)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        display: "inline-block",
      }}
    />
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Completa todos los campos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await doLogin({ variables: { email, password } });
      const res = data?.login;
      if (!res?.ok) {
        if (res?.codigo === "EMAIL_NO_VERIFICADO") {
          setPendingEmail(email);
          setStep("verificar");
        } else {
          setError(res?.error || "Error al iniciar sesión.");
        }
      } else {
        const p = res.payload;
        login(p.accessToken, p.refreshToken, p.usuario);
        navigate("/");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
    setLoading(false);
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    if (!nombre || !regEmail || !pass2Val || !pass2Confirm) {
      setError("Completa los campos obligatorios.");
      return;
    }
    if (pass2Val !== pass2Confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (pass2Val.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const vars = {
        email: regEmail,
        nombre,
        password: pass2Val,
        passwordConfirm: pass2Confirm,
      };
      if (cedula.trim()) {
        vars.cedula = cedula.trim();
        vars.tipoDocumento = tipoDoc;
      }
      if (telefono.trim()) vars.telefono = telefono.trim();
      const { data } = await doRegistro({ variables: vars });
      const res = data?.autoRegistro;
      if (!res?.ok) {
        setError(res?.error || "Error al registrarse.");
      } else {
        setPendingEmail(regEmail);
        setStep("verificar");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
    setLoading(false);
  };

  const handleVerificar = async (e) => {
    e.preventDefault();
    if (!codigo || codigo.length < 4) {
      setError("Ingresa el código de verificación.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await doVerificar({
        variables: { email: pendingEmail, codigo },
      });
      const res = data?.verificarCodigo;
      if (!res?.ok) {
        setError(res?.error || "Código inválido.");
      } else {
        await swalSuccess(
          "¡Email verificado!",
          "Tu cuenta está activa. Ahora puedes ingresar.",
        );
        setStep("login");
        setCodigo("");
      }
    } catch {
      setError("Error de conexión.");
    }
    setLoading(false);
  };

  const handleReenviar = async () => {
    try {
      await doReenviar({ variables: { email: pendingEmail } });
      await swalSuccess("Código enviado", `Revisá tu correo ${pendingEmail}.`);
    } catch {
      await swalError("Error", "No pudimos reenviar el código.");
    }
  };

  const switchTab = (s) => {
    setStep(s);
    setError("");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* ── Panel izquierdo: SOLO IMAGEN ── */}
      <div
        className="login-panel"
        style={{
          flex: "0 0 48%",
          position: "relative",
          display: "none",
          backgroundImage:
            "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=90')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay suave — solo oscurece un poco para que la foto respire */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(7,45,32,0.18) 0%, rgba(7,45,32,0.28) 100%)",
          }}
        />
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          background: "var(--bg)",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            animation: "fadeUp 0.4s ease",
          }}
        >
          {/* Logo visible solo en móvil (panel izquierdo oculto) */}
          <div
            className="login-logo-mobile"
            style={{ textAlign: "center", marginBottom: "28px" }}
          >
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "var(--green)",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="var(--cream)"
                  strokeWidth="2.8"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 11l19-9-9 19-2-8-8-2z" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--green)",
                }}
              >
                Resto<span style={{ color: "var(--green-lt)" }}>Hub</span>
              </span>
            </Link>
          </div>

          {/* Encabezado */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            {step !== "verificar" ? (
              <>
                <h1
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "26px",
                    color: "var(--text)",
                    marginBottom: "6px",
                  }}
                >
                  {step === "login" ? "Bienvenido de vuelta" : "Crear cuenta"}
                </h1>
                <p style={{ color: "var(--text2)", fontSize: "14px" }}>
                  {step === "login"
                    ? "Ingresa para pedir tu comida favorita"
                    : "Únete y empieza a pedir"}
                </p>
              </>
            ) : (
              <>
                <h1
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "24px",
                    color: "var(--text)",
                    marginBottom: "6px",
                  }}
                >
                  Verifica tu correo
                </h1>
                <p
                  style={{
                    color: "var(--text2)",
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  Enviamos un código a <strong>{pendingEmail}</strong>
                </p>
              </>
            )}
          </div>

          {/* Tabs */}
          {step !== "verificar" && (
            <div
              style={{
                display: "flex",
                background: "var(--bg2)",
                borderRadius: "12px",
                padding: "4px",
                marginBottom: "24px",
                gap: "4px",
              }}
            >
              {[
                ["login", "Ingresar"],
                ["registro", "Registrarse"],
              ].map(([s, label]) => (
                <button
                  key={s}
                  onClick={() => switchTab(s)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "9px",
                    background: step === s ? "#fff" : "transparent",
                    border: "none",
                    color: step === s ? "var(--text)" : "var(--text3)",
                    fontSize: "13px",
                    fontWeight: step === s ? 700 : 500,
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                    boxShadow:
                      step === s ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ── LOGIN ── */}
          {step === "login" && (
            <form
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <Label>Correo electrónico</Label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                  required
                />
              </div>
              <div>
                <Label>Contraseña</Label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                  required
                />
              </div>
              {error && <ErrBox msg={error} />}
              <button
                type="submit"
                disabled={loading}
                className="btn-green"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: "4px",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? <Spinner /> : "Ingresar"}
              </button>
            </form>
          )}

          {/* ── REGISTRO ── */}
          {step === "registro" && (
            <form
              onSubmit={handleRegistro}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <Label>Nombre completo</Label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                  required
                />
              </div>
              <div>
                <Label>Correo electrónico</Label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                  required
                />
              </div>
              <div>
                <Label>
                  Documento de identidad{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      textTransform: "none",
                      fontSize: "9px",
                    }}
                  >
                    (opcional)
                  </span>
                </Label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    value={tipoDoc}
                    onChange={(e) => setTipoDoc(e.target.value)}
                    style={{
                      ...inp,
                      width: "auto",
                      flexShrink: 0,
                      paddingRight: "10px",
                    }}
                    onFocus={focus}
                    onBlur={blur}
                  >
                    {TIPOS_DOC.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.value}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={cedula}
                    onChange={(e) =>
                      setCedula(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Número de documento"
                    style={{ ...inp, flex: 1 }}
                    onFocus={focus}
                    onBlur={blur}
                    inputMode="numeric"
                    maxLength={15}
                  />
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text3)",
                    marginTop: "5px",
                  }}
                >
                  Necesario para acumular puntos en compras presenciales.
                </p>
              </div>
              <div>
                <Label optional>Teléfono</Label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+57 300 000 0000"
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <Label>Contraseña</Label>
                  <input
                    type="password"
                    value={pass2Val}
                    onChange={(e) => setPass2Val(e.target.value)}
                    placeholder="••••••••"
                    style={inp}
                    onFocus={focus}
                    onBlur={blur}
                    required
                  />
                </div>
                <div>
                  <Label>Confirmar</Label>
                  <input
                    type="password"
                    value={pass2Confirm}
                    onChange={(e) => setPass2Confirm(e.target.value)}
                    placeholder="••••••••"
                    style={inp}
                    onFocus={focus}
                    onBlur={blur}
                    required
                  />
                </div>
              </div>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text3)",
                  lineHeight: 1.5,
                }}
              >
                Al registrarte aceptas nuestros{" "}
                <span style={{ color: "var(--green)", cursor: "pointer" }}>
                  Términos de servicio
                </span>{" "}
                y{" "}
                <span style={{ color: "var(--green)", cursor: "pointer" }}>
                  Política de privacidad
                </span>
                .
              </p>
              {error && <ErrBox msg={error} />}
              <button
                type="submit"
                disabled={loading}
                className="btn-green"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: "4px",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? <Spinner /> : "Crear cuenta gratis"}
              </button>
            </form>
          )}

          {/* ── VERIFICAR CÓDIGO ── */}
          {step === "verificar" && (
            <form
              onSubmit={handleVerificar}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: "var(--green-dim2)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <svg
                    width="30"
                    height="30"
                    fill="none"
                    stroke="var(--green)"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
              </div>
              <div>
                <Label>Código de verificación</Label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) =>
                    setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  maxLength={6}
                  style={{
                    ...inp,
                    textAlign: "center",
                    fontSize: "24px",
                    fontWeight: 700,
                    letterSpacing: "0.3em",
                  }}
                  onFocus={focus}
                  onBlur={blur}
                  autoFocus
                  required
                />
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text3)",
                    marginTop: "6px",
                    textAlign: "center",
                  }}
                >
                  El código expira en 15 minutos
                </p>
              </div>
              {error && <ErrBox msg={error} />}
              <button
                type="submit"
                disabled={loading}
                className="btn-green"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? <Spinner /> : "Verificar código"}
              </button>
              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={handleReenviar}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--green)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  Reenviar código
                </button>
                <span style={{ color: "var(--text3)", fontSize: "13px" }}>
                  {" "}
                  ·{" "}
                </span>
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text3)",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  Volver
                </button>
              </div>
            </form>
          )}

          <p
            style={{
              textAlign: "center",
              marginTop: "20px",
              fontSize: "13px",
              color: "var(--text3)",
            }}
          >
            <Link to="/" style={{ color: "var(--green)", fontWeight: 600 }}>
              ← Explorar como invitado
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .login-panel { display: block !important; }
          .login-logo-mobile { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function ErrBox({ msg }) {
  return (
    <div
      style={{
        padding: "10px 13px",
        background: "rgba(220,38,38,0.06)",
        border: "1px solid rgba(220,38,38,0.18)",
        borderRadius: "8px",
        color: "#dc2626",
        fontSize: "13px",
        lineHeight: 1.4,
      }}
    >
      {msg}
    </div>
  );
}
