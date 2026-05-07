// src/shared/components/Navbar.jsx
// CAMBIO: Los links del dropdown de usuario apuntan a rutas específicas del dashboard
//   Mi cuenta   → /perfil  (dashboard)
//   Mis cupones → /cupones (tab cupones)
//   Mis puntos  → /puntos  (tab puntos)
//   Mis pedidos → /perfil  (tab dashboard, donde se ven últimos movimientos)
import { useState, useEffect, useRef } from "react";
import { Link, useLocation as useRouterLocation } from "react-router-dom";
import { useCart } from "../../features/cart/context/CartContext";
import { useAuth } from "../../app/auth/AuthContext";
import { useLocation } from "../../app/auth/LocationContext";

const NavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    style={{
      display: "block",
      padding: "10px 14px",
      color: "rgba(255,255,255,0.75)",
      fontSize: "14px",
      fontWeight: 500,
      borderRadius: "8px",
      transition: "all 0.15s",
      fontFamily: "DM Sans, sans-serif",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,0.07)";
      e.currentTarget.style.color = "#fff";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.color = "rgba(255,255,255,0.75)";
    }}
  >
    {children}
  </Link>
);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);
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

  useEffect(() => {
    setMenuOpen(false);
    setUserOpen(false);
  }, [routerLoc.pathname]);

  useEffect(() => {
    const fn = (e) => {
      if (userRef.current && !userRef.current.contains(e.target))
        setUserOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const darkBg = !isHome || scrolled;

  const handleLogout = () => {
    setUserOpen(false);
    logout();
  };

  const IconCart = () => (
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
  );

  const IconChevron = ({ open }) => (
    <svg
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      style={{
        transition: "transform 0.2s",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );

  // Opciones del dropdown de usuario — ahora con rutas correctas
  const USER_MENU = [
    {
      to: "/perfil",
      label: "Mi cuenta",
      icon: (
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      to: "/puntos",
      label: "Mis puntos",
      icon: (
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      to: "/cupones",
      label: "Mis cupones",
      icon: (
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M2 10h20" />
        </svg>
      ),
    },
    {
      to: "/perfil",
      label: "Mis pedidos",
      icon: (
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
        </svg>
      ),
    },
  ];

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
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
            }}
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

          {/* Ubicación */}
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
              <span style={{ fontSize: "13px" }}>{country?.flag}</span>
              <span>{city}</span>
              <IconChevron open={false} />
            </button>
          )}

          {/* Derecha */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* Carrito */}
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
                flexShrink: 0,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.16)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.09)")
              }
            >
              <IconCart />
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

            {/* Usuario autenticado */}
            {isAuthenticated ? (
              <div ref={userRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setUserOpen((o) => !o)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 12px",
                    background: userOpen
                      ? "rgba(255,255,255,0.14)"
                      : "rgba(255,255,255,0.09)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "20px",
                    color: "rgba(255,255,255,0.88)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                    transition: "all 0.2s",
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--cream)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "var(--green)",
                      flexShrink: 0,
                    }}
                  >
                    {user?.nombre?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                  <span className="nav-user-name">
                    {user?.nombre?.split(" ")[0]}
                  </span>
                  <IconChevron open={userOpen} />
                </button>

                {userOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: 220,
                      background: "var(--green2)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      overflow: "hidden",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
                      animation: "fadeUp 0.15s ease",
                      zIndex: 200,
                    }}
                  >
                    {/* Header dropdown */}
                    <div
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#fff",
                          marginBottom: "2px",
                        }}
                      >
                        {user?.nombre}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        {user?.email}
                      </p>
                    </div>

                    {/* Links */}
                    <div style={{ padding: "6px" }}>
                      {USER_MENU.map(({ to, label, icon }) => (
                        <NavLink
                          key={label}
                          to={to}
                          onClick={() => setUserOpen(false)}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            {icon}
                            {label}
                          </span>
                        </NavLink>
                      ))}
                      <div
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                          margin: "6px 0",
                        }}
                      />
                      <button
                        onClick={handleLogout}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 14px",
                          background: "transparent",
                          border: "none",
                          color: "rgba(255,80,80,0.8)",
                          fontSize: "14px",
                          fontWeight: 500,
                          cursor: "pointer",
                          borderRadius: "8px",
                          fontFamily: "DM Sans, sans-serif",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(220,38,38,0.1)";
                          e.currentTarget.style.color = "rgb(255,100,100)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "rgba(255,80,80,0.8)";
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-cream"
                style={{ padding: "8px 18px", fontSize: "11px", flexShrink: 0 }}
              >
                Ingresar
              </Link>
            )}

            {/* Hamburguesa */}
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
                flexShrink: 0,
                border: "none",
                cursor: "pointer",
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

        {/* Menú móvil */}
        {menuOpen && (
          <div
            style={{
              background: "var(--green2)",
              padding: "8px 16px 16px",
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
                  padding: "10px 14px",
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
                {country?.flag} {city}, {country?.name} — Cambiar
              </button>
            )}
            <NavLink to="/" onClick={() => setMenuOpen(false)}>
              Inicio
            </NavLink>
            <NavLink to="/carrito" onClick={() => setMenuOpen(false)}>
              Carrito {count > 0 && `(${count})`}
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/perfil" onClick={() => setMenuOpen(false)}>
                  Mi cuenta
                </NavLink>
                <NavLink to="/puntos" onClick={() => setMenuOpen(false)}>
                  Mis puntos
                </NavLink>
                <NavLink to="/cupones" onClick={() => setMenuOpen(false)}>
                  Mis cupones
                </NavLink>
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,80,80,0.75)",
                    fontSize: "14px",
                    fontWeight: 500,
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                    borderRadius: "8px",
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
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

      <style>{`
        @media (max-width: 640px) {
          .nav-hamburger { display: flex !important; }
          .nav-user-name { display: none; }
        }
      `}</style>
    </>
  );
}
