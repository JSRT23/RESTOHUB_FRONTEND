// portal_empleados/src/features/auth/LoginPage.jsx
// Mobile: card glassmorphism centrada (diseño original)
// Desktop ≥900px: dos columnas — panel izquierdo oscuro + formulario derecho grande

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/auth/AuthContext";
import { LOGIN_MUTATION } from "../turno/graphql/operations";

const ROLES_OK = ["mesero", "cocinero", "cajero", "repartidor", "supervisor"];

/* ── SVG Icons ──────────────────────────────────────────────────────────── */
const IcoMail = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="m2 7 10 7 10-7" />
  </svg>
);
const IcoLock = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="3" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IcoEyeOn = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IcoEyeOff = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const IcoAlert = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcoShield = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/* ── Formulario compartido ──────────────────────────────────────────────── */
function LoginForm({ large = false }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState("");

  const [doLogin, { loading }] = useMutation(LOGIN_MUTATION);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await doLogin({ variables: { email, password: pass } });
      const res = data?.login;
      if (!res?.ok) {
        setError(res?.error || "Credenciales inválidas");
        return;
      }
      const u = res.payload.usuario;
      if (!ROLES_OK.includes(u.rol)) {
        setError("Este portal es solo para empleados. Usa el TPV principal.");
        return;
      }
      login({ access_token: res.payload.accessToken, usuario: u });
      navigate(u.rol === "supervisor" ? "/kiosco" : "/inicio", {
        replace: true,
      });
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
  };

  const fBorder = (f) => (focused === f ? "#4A9B7F" : "rgba(74,92,106,.5)");
  const fShadow = (f) =>
    focused === f ? "0 0 0 3px rgba(74,155,127,.14)" : "none";
  const inputBg = large ? "rgba(37,55,69,.6)" : "#253745";
  const fs = large ? "17px" : "15px";
  const pad = large ? "16px 14px 16px 48px" : "13px 14px 13px 42px";

  return (
    <form
      onSubmit={submit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: large ? "18px" : "13px",
      }}
    >
      {/* Error */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            background: "rgba(229,115,115,.09)",
            border: "1px solid rgba(229,115,115,.28)",
            borderRadius: "12px",
            padding: "11px 13px",
          }}
        >
          <span style={{ color: "#E57373", flexShrink: 0, marginTop: "1px" }}>
            <IcoAlert />
          </span>
          <p
            style={{
              color: "#E57373",
              fontSize: "13px",
              margin: 0,
              lineHeight: "1.45",
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Email */}
      <div>
        <label
          style={{
            display: "block",
            color: "#9BA8AB",
            fontSize: large ? "12px" : "11px",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: ".08em",
            marginBottom: large ? "9px" : "7px",
          }}
        >
          Correo electrónico
        </label>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: focused === "email" ? "#4A9B7F" : "#4A5C6A",
              transition: "color .2s",
              pointerEvents: "none",
            }}
          >
            <IcoMail />
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused("")}
            placeholder="tu@correo.com"
            style={{
              width: "100%",
              background: inputBg,
              borderRadius: "13px",
              border: `1.5px solid ${fBorder("email")}`,
              boxShadow: fShadow("email"),
              padding: pad,
              color: "#CCD0CF",
              fontSize: fs,
              outline: "none",
              transition: "border-color .2s, box-shadow .2s",
            }}
          />
        </div>
      </div>

      {/* Password */}
      <div style={{ marginBottom: large ? "6px" : "0" }}>
        <label
          style={{
            display: "block",
            color: "#9BA8AB",
            fontSize: large ? "12px" : "11px",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: ".08em",
            marginBottom: large ? "9px" : "7px",
          }}
        >
          Contraseña
        </label>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: focused === "pass" ? "#4A9B7F" : "#4A5C6A",
              transition: "color .2s",
              pointerEvents: "none",
            }}
          >
            <IcoLock />
          </span>
          <input
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onFocus={() => setFocused("pass")}
            onBlur={() => setFocused("")}
            placeholder="••••••••"
            style={{
              width: "100%",
              background: inputBg,
              borderRadius: "13px",
              border: `1.5px solid ${fBorder("pass")}`,
              boxShadow: fShadow("pass"),
              padding: pad
                .replace(/14px$/, "44px")
                .replace(/13px 14px 13px 42px/, "13px 44px 13px 42px"),
              color: "#CCD0CF",
              fontSize: fs,
              outline: "none",
              transition: "border-color .2s, box-shadow .2s",
            }}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "#4A5C6A",
              cursor: "pointer",
              padding: "4px",
              lineHeight: 0,
              transition: "color .2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#9BA8AB")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#4A5C6A")}
          >
            {show ? <IcoEyeOff /> : <IcoEyeOn />}
          </button>
        </div>
      </div>

      {/* Botón */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: large ? "18px" : "14px",
          background: "linear-gradient(135deg,#4A9B7F,#2E7D62)",
          color: "#fff",
          border: "none",
          borderRadius: "14px",
          fontFamily: "inherit",
          fontSize: large ? "17px" : "15px",
          fontWeight: "700",
          cursor: loading ? "default" : "pointer",
          boxShadow: "0 4px 20px rgba(74,155,127,.35)",
          transition: "all .18s",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading && (
          <span
            style={{
              display: "inline-block",
              width: "18px",
              height: "18px",
              border: "2px solid rgba(255,255,255,.3)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "spin .7s linear infinite",
            }}
          />
        )}
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </form>
  );
}

/* ── Orbs de fondo ──────────────────────────────────────────────────────── */
const Orbs = () => (
  <>
    <div
      style={{
        position: "absolute",
        top: "-100px",
        right: "-100px",
        width: "320px",
        height: "320px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle,rgba(74,155,127,.1) 0%,transparent 65%)",
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: "-80px",
        left: "-80px",
        width: "280px",
        height: "280px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle,rgba(74,92,106,.13) 0%,transparent 65%)",
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        position: "absolute",
        top: "40%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: "200px",
        height: "200px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle,rgba(74,155,127,.04) 0%,transparent 70%)",
        pointerEvents: "none",
      }}
    />
  </>
);

export default function LoginPage() {
  return (
    <>
      {/* ── MOBILE: igual al diseño original ─────────────────────────────── */}
      <div
        className="lp-mobile"
        style={{
          minHeight: "100svh",
          background:
            "linear-gradient(155deg,#06141B 0%,#11212D 55%,#06141B 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "28px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Orbs />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "22px",
              background: "linear-gradient(145deg,#4A9B7F,#253745)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow:
                "0 8px 32px rgba(74,155,127,.28), 0 2px 8px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08)",
            }}
          >
            <span
              style={{
                fontSize: "26px",
                fontWeight: "800",
                color: "#CCD0CF",
                fontFamily: "Georgia,serif",
                letterSpacing: "-1px",
              }}
            >
              R
            </span>
          </div>
          <h1
            style={{
              color: "#CCD0CF",
              fontSize: "24px",
              fontWeight: "700",
              margin: "0 0 4px",
              letterSpacing: "-.4px",
            }}
          >
            RestoHub
          </h1>
          <p
            style={{
              color: "#9BA8AB",
              fontSize: "13px",
              margin: 0,
              letterSpacing: ".02em",
            }}
          >
            Portal de empleados
          </p>
        </div>

        {/* Card glassmorphism */}
        <div
          style={{
            width: "100%",
            maxWidth: "370px",
            background: "rgba(17,33,45,.88)",
            backdropFilter: "blur(28px) saturate(1.3)",
            border: "1px solid rgba(74,92,106,.38)",
            borderRadius: "24px",
            padding: "26px 22px",
            boxShadow:
              "0 24px 60px rgba(0,0,0,.55), 0 4px 16px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.05)",
          }}
        >
          <h2
            style={{
              color: "#CCD0CF",
              fontSize: "17px",
              fontWeight: "600",
              margin: "0 0 20px",
              letterSpacing: "-.1px",
            }}
          >
            Iniciar sesión
          </h2>
          <LoginForm large={false} />
        </div>

        <p
          style={{
            color: "#4A5C6A",
            fontSize: "12px",
            marginTop: "18px",
            textAlign: "center",
            lineHeight: "1.6",
          }}
        >
          Meseros · Cocineros · Cajeros · Repartidores · Supervisores
        </p>
      </div>

      {/* ── DESKTOP / KIOSCO ≥900px: dos columnas ────────────────────────── */}
      <div
        className="lp-desktop"
        style={{
          minHeight: "100svh",
          background:
            "linear-gradient(155deg,#06141B 0%,#11212D 55%,#06141B 100%)",
          display: "flex",
        }}
      >
        {/* Panel izquierdo — branding */}
        <div
          style={{
            width: "420px",
            flexShrink: 0,
            background: "rgba(6,20,27,.7)",
            backdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(74,92,106,.25)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 44px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Orbs locales */}
          <div
            style={{
              position: "absolute",
              top: "-60px",
              right: "-60px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle,rgba(74,155,127,.12) 0%,transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-40px",
              left: "-40px",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle,rgba(74,92,106,.15) 0%,transparent 65%)",
              pointerEvents: "none",
            }}
          />

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "15px",
                background: "linear-gradient(145deg,#4A9B7F,#253745)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(74,155,127,.3)",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#CCD0CF",
                  fontFamily: "Georgia,serif",
                }}
              >
                R
              </span>
            </div>
            <div>
              <p
                style={{
                  color: "#CCD0CF",
                  fontWeight: "700",
                  fontSize: "20px",
                  margin: 0,
                  letterSpacing: "-.2px",
                }}
              >
                RestoHub
              </p>
              <p style={{ color: "#4A5C6A", fontSize: "12px", margin: 0 }}>
                Portal de empleados
              </p>
            </div>
          </div>

          {/* Copy central */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div
              style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(74,92,106,.3)",
                borderRadius: "20px",
                padding: "28px 24px",
              }}
            >
              <p
                style={{
                  color: "#CCD0CF",
                  fontSize: "22px",
                  fontWeight: "700",
                  margin: "0 0 10px",
                  lineHeight: "1.35",
                  fontFamily: "Georgia,serif",
                }}
              >
                Control de asistencia en tiempo real
              </p>
              <p
                style={{
                  color: "#9BA8AB",
                  fontSize: "14px",
                  margin: 0,
                  lineHeight: "1.6",
                }}
              >
                Registra entradas y salidas con QR, gestiona turnos y supervisa
                a tu equipo desde una sola pantalla.
              </p>
            </div>

            {/* Features */}
            {[
              ["📱", "Escaneo QR desde cualquier celular"],
              ["⚡", "Registro instantáneo — sin fricciones"],
              ["🔔", "Alertas automáticas de inasistencia"],
              ["📋", "Historial completo del día en pantalla"],
            ].map(([ico, txt]) => (
              <div
                key={txt}
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    flexShrink: 0,
                    background: "rgba(74,155,127,.12)",
                    border: "1px solid rgba(74,155,127,.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                  }}
                >
                  {ico}
                </div>
                <span
                  style={{
                    color: "#9BA8AB",
                    fontSize: "14px",
                    lineHeight: "1.4",
                  }}
                >
                  {txt}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IcoShield />
            <p style={{ color: "#4A5C6A", fontSize: "12px", margin: 0 }}>
              Acceso restringido · Solo personal operativo
            </p>
          </div>
        </div>

        {/* Panel derecho — formulario grande */}
        <div
          className="lp-desktop-inner"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "52px 64px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Orbs />

          <div
            style={{ width: "100%", maxWidth: "480px", position: "relative" }}
          >
            {/* Encabezado grande */}
            <div style={{ marginBottom: "36px" }}>
              <h2
                style={{
                  color: "#CCD0CF",
                  fontSize: "34px",
                  fontWeight: "700",
                  margin: "0 0 8px",
                  letterSpacing: "-.6px",
                  lineHeight: 1.2,
                }}
              >
                Bienvenido de vuelta
              </h2>
              <p style={{ color: "#9BA8AB", fontSize: "16px", margin: 0 }}>
                Accede para iniciar tu turno
              </p>
            </div>

            {/* Card glassmorphism grande */}
            <div
              style={{
                background: "rgba(17,33,45,.75)",
                backdropFilter: "blur(32px) saturate(1.4)",
                border: "1px solid rgba(74,92,106,.4)",
                borderRadius: "28px",
                padding: "40px 36px",
                boxShadow:
                  "0 32px 80px rgba(0,0,0,.5), 0 4px 16px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.06)",
              }}
            >
              <LoginForm large={true} />
            </div>

            <p
              style={{
                color: "#4A5C6A",
                fontSize: "13px",
                marginTop: "20px",
                textAlign: "center",
                lineHeight: "1.6",
              }}
            >
              Meseros · Cocineros · Cajeros · Repartidores · Supervisores
            </p>
          </div>
        </div>
      </div>

      {/* ── Media queries ────────────────────────────────────────────────── */}
      <style>{`
        .lp-mobile  { display: flex !important; }
        .lp-desktop { display: none !important; }
        @media (min-width: 900px) {
          .lp-mobile  { display: none  !important; }
          .lp-desktop { display: flex  !important; }
        }
      `}</style>
    </>
  );
}
