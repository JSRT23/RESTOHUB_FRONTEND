import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 700));
    if (email && password) {
      login("demo-token-123", {
        nombre: email.split("@")[0],
        email,
        rol: "cliente",
      });
      navigate("/");
    } else setError("Completa todos los campos.");
    setLoading(false);
  };

  const inp = {
    width: "100%",
    padding: "12px 14px",
    background: "var(--bg2)",
    border: "1.5px solid var(--border2)",
    borderRadius: "10px",
    color: "var(--text)",
    fontSize: "14px",
    transition: "border-color 0.2s",
  };

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", background: "var(--bg)" }}
    >
      {/* Panel izquierdo — foto + overlay verde */}
      <div
        className="login-panel"
        style={{
          display: "none",
          flex: "0 0 48%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=90') center/cover`,
            filter: "brightness(0.3)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(160deg, rgba(7,45,32,0.95) 0%, rgba(10,56,40,0.75) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            padding: "52px 52px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Link
            to="/"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: "var(--cream)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
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
          <div>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "36px",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.2,
                marginBottom: "16px",
              }}
            >
              La mejor experiencia gastronómica.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>
              Accede a los mejores restaurantes de tu ciudad y realiza tus
              pedidos en segundos.
            </p>
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)" }}>
            © {new Date().getFullYear()} RestoHub
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            animation: "fadeUp 0.4s ease",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
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
                  stroke="#fff"
                  strokeWidth="2.5"
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
                  color: "var(--text)",
                }}
              >
                Resto<span style={{ color: "var(--green)" }}>Hub</span>
              </span>
            </Link>
            <h1
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "26px",
                color: "var(--text)",
                marginBottom: "5px",
              }}
            >
              Bienvenido de vuelta
            </h1>
            <p style={{ color: "var(--text2)", fontSize: "13px" }}>
              Ingresa para pedir tu comida favorita
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div>
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
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                style={inp}
                onFocus={(e) => (e.target.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
                required
              />
            </div>
            <div>
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
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inp}
                onFocus={(e) => (e.target.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
                required
              />
            </div>
            {error && (
              <div
                style={{
                  padding: "9px 13px",
                  background: "rgba(220,38,38,0.06)",
                  border: "1px solid rgba(220,38,38,0.18)",
                  borderRadius: "8px",
                  color: "#dc2626",
                  fontSize: "13px",
                }}
              >
                {error}
              </div>
            )}
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
              {loading ? (
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
              ) : (
                "Ingresar"
              )}
            </button>
          </form>
          <p
            style={{
              textAlign: "center",
              marginTop: "20px",
              fontSize: "13px",
              color: "var(--text3)",
            }}
          >
            ¿Sin cuenta?{" "}
            <Link to="/" style={{ color: "var(--green)", fontWeight: 600 }}>
              Explorar como invitado
            </Link>
          </p>
        </div>
      </div>
      <style>{`@media (min-width: 768px) { .login-panel { display: block !important; } }`}</style>
    </div>
  );
}
