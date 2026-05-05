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

// Iconos SVG del panel izquierdo
const IcoCupon2 = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    stroke="var(--cream)"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M2 10h20" />
  </svg>
);
const IcoStar2 = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    stroke="var(--cream)"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IcoMenu2 = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    stroke="var(--cream)"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M3 12h18M3 6h18M3 18h18" />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [pass2, setPass2] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const [doLogin] = useMutation(MUTATION_LOGIN);
  const [doRegistro] = useMutation(MUTATION_AUTO_REGISTRO);
  const [doVerificar] = useMutation(MUTATION_VERIFICAR_CODIGO);
  const [doReenviar] = useMutation(MUTATION_REENVIAR_CODIGO);
  const [loading, setLoading] = useState(false);

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
        navigate("/"); // Quedarse en la app, no forzar /perfil
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
    setLoading(false);
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    if (!nombre || !email || !password || !pass2) {
      setError("Completa todos los campos.");
      return;
    }
    if (password !== pass2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await doRegistro({
        variables: { email, nombre, password, passwordConfirm: pass2 },
      });
      const res = data?.autoRegistro;
      if (!res?.ok) {
        setError(res?.error || "Error al registrarse.");
      } else {
        setPendingEmail(email);
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

  const Label = ({ children }) => (
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
    </label>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* ── Panel izquierdo — foto + contenido ── */}
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
        {/* Overlay verde */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(7,45,32,0.88) 0%, rgba(7,45,32,0.52) 50%, rgba(7,45,32,0.82) 100%)",
          }}
        />
        {/* Contenido */}
        <div
          style={{
            position: "relative",
            height: "100%",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "44px 48px",
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: "var(--cream)",
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
                stroke="var(--green)"
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
                color: "#fff",
              }}
            >
              Resto<span style={{ color: "var(--cream)" }}>Hub</span>
            </span>
          </Link>

          {/* Copy */}
          <div>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "clamp(28px,3vw,42px)",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.15,
                marginBottom: "18px",
              }}
            >
              La mejor
              <br />
              experiencia
              <br />
              gastronómica.
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.58)",
                lineHeight: 1.7,
                maxWidth: "300px",
                marginBottom: "32px",
              }}
            >
              Accede a restaurantes premium, acumula puntos y disfruta de
              promociones exclusivas.
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {[
                [<IcoCupon2 key="cu" />, "Cupones exclusivos"],
                [<IcoStar2 key="st" />, "Puntos de fidelización"],
                [<IcoMenu2 key="mn" />, "Menús completos"],
              ].map(([ic, tx]) => (
                <div
                  key={tx}
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "9px",
                      background: "rgba(255,250,202,0.12)",
                      border: "1px solid rgba(255,250,202,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {ic}
                  </div>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.65)",
                      fontWeight: 500,
                    }}
                  >
                    {tx}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>
            © {new Date().getFullYear()} RestoHub
          </p>
        </div>
      </div>

      {/* ── Panel derecho — formulario (sin logo, ya está en el izquierdo y en el navbar) ── */}
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
          {/* Encabezado del form */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            {step !== "verificar" && (
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
            )}
            {step === "verificar" && (
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
                  onClick={() => {
                    setStep(s);
                    setError("");
                  }}
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
                    transition: "all 0.2s",
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

          {/* Form Login */}
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

          {/* Form Registro */}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                  required
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    value={pass2}
                    onChange={(e) => setPass2(e.target.value)}
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

          {/* Verificar código */}
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
                  onClick={() => setStep("login")}
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

      <style>{`@media (min-width: 768px) { .login-panel { display: flex !important; } }`}</style>
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
