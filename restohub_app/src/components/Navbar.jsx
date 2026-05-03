import { useState, useEffect } from "react";
import { Link, useLocation as useRouterLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "../contexts/LocationContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const { city, country, setShowPicker } = useLocation();
  const routerLoc = useRouterLocation();
  const isHome = routerLoc.pathname === "/";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => setMenuOpen(false), [routerLoc.pathname]);

  const darkBg = !isHome || scrolled;

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: darkBg ? "var(--green2)" : "transparent",
          borderBottom: darkBg ? "1px solid rgba(255,255,255,0.07)" : "none",
          transition: "all 0.35s ease",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "68px",
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <div
              style={{
                width: 34,
                height: 34,
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
                letterSpacing: "-0.02em",
              }}
            >
              Resto<span style={{ color: "var(--cream)" }}>Hub</span>
            </span>
          </Link>

          {/* Location pill */}
          {city && (
            <button
              onClick={() => setShowPicker(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: "rgba(255,250,202,0.12)",
                border: "1px solid rgba(255,250,202,0.25)",
                borderRadius: "20px",
                color: "var(--cream)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,250,202,0.2)";
                e.currentTarget.style.borderColor = "rgba(255,250,202,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,250,202,0.12)";
                e.currentTarget.style.borderColor = "rgba(255,250,202,0.25)";
              }}
            >
              <span>{country?.flag}</span>
              <span>{city}</span>
              <svg
                width="10"
                height="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link
              to="/carrito"
              style={{
                position: "relative",
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.09)",
                borderRadius: "9px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.16)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.09)")
              }
            >
              <svg
                width="17"
                height="17"
                fill="none"
                stroke="rgba(255,255,255,0.82)"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {count > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 18,
                    height: 18,
                    background: "var(--cream)",
                    color: "var(--green)",
                    borderRadius: "50%",
                    fontSize: "9px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {count}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                <span
                  style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}
                >
                  Hola, {user?.nombre?.split(" ")[0]}
                </span>
                <button
                  onClick={logout}
                  className="btn-ghost-light"
                  style={{ padding: "7px 14px", fontSize: "11px" }}
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn-cream"
                style={{ padding: "8px 18px", fontSize: "11px" }}
              >
                Ingresar
              </Link>
            )}

            <button
              onClick={() => setMenuOpen((m) => !m)}
              className="nav-hamburger"
              style={{
                width: 38,
                height: 38,
                background: "rgba(255,255,255,0.09)",
                borderRadius: "9px",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                display: "none",
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 17,
                    height: 2,
                    background: "rgba(255,255,255,0.82)",
                    borderRadius: 2,
                    display: "block",
                    transform:
                      menuOpen && i === 0
                        ? "rotate(45deg) translate(5px,5px)"
                        : menuOpen && i === 2
                          ? "rotate(-45deg) translate(5px,-5px)"
                          : "none",
                    opacity: menuOpen && i === 1 ? 0 : 1,
                    transition: "all 0.2s",
                  }}
                />
              ))}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            style={{
              background: "var(--green2)",
              padding: "12px 20px 20px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {city && (
              <button
                onClick={() => {
                  setShowPicker(true);
                  setMenuOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  background: "rgba(255,250,202,0.1)",
                  border: "1px solid rgba(255,250,202,0.2)",
                  borderRadius: "10px",
                  color: "var(--cream)",
                  fontSize: "13px",
                  fontWeight: 600,
                  textAlign: "left",
                  fontFamily: "DM Sans, sans-serif",
                  marginBottom: "6px",
                  cursor: "pointer",
                }}
              >
                📍 {city}, {country?.name} — Cambiar
              </button>
            )}
            <Link
              to="/"
              style={{
                display: "block",
                padding: "11px 14px",
                color: "rgba(255,255,255,0.8)",
                fontSize: "14px",
              }}
            >
              Inicio
            </Link>
            <Link
              to="/carrito"
              style={{
                display: "block",
                padding: "11px 14px",
                color: "rgba(255,255,255,0.8)",
                fontSize: "14px",
              }}
            >
              Carrito{" "}
              {count > 0 && (
                <span style={{ color: "var(--cream)" }}>({count})</span>
              )}
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="btn-cream"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: "10px",
                }}
              >
                Ingresar
              </Link>
            )}
          </div>
        )}
      </nav>
      <style>{`@media (max-width: 640px) { .nav-hamburger { display: flex !important; } }`}</style>
    </>
  );
}
