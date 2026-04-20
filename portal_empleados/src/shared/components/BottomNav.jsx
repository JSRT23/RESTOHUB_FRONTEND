// portal_empleados/src/shared/components/BottomNav.jsx
import { NavLink } from "react-router-dom";

const IcoHome = ({ a }) => (
  <svg
    width="23"
    height="23"
    viewBox="0 0 24 24"
    fill={a ? "rgba(74,155,127,.15)" : "none"}
    stroke={a ? "#4A9B7F" : "#4A5C6A"}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);
const IcoClock = ({ a }) => (
  <svg
    width="23"
    height="23"
    viewBox="0 0 24 24"
    fill="none"
    stroke={a ? "#4A9B7F" : "#4A5C6A"}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);
const IcoUser = ({ a }) => (
  <svg
    width="23"
    height="23"
    viewBox="0 0 24 24"
    fill={a ? "rgba(74,155,127,.15)" : "none"}
    stroke={a ? "#4A9B7F" : "#4A5C6A"}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const TABS = [
  { to: "/inicio", label: "Inicio", Icon: IcoHome },
  { to: "/turnos", label: "Turnos", Icon: IcoClock },
  { to: "/perfil", label: "Perfil", Icon: IcoUser },
];

export default function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "430px",
        zIndex: 50,
        background: "rgba(6,20,27,.93)",
        backdropFilter: "blur(24px) saturate(1.3)",
        WebkitBackdropFilter: "blur(24px) saturate(1.3)",
        borderTop: "1px solid rgba(74,92,106,.3)",
        paddingBottom: "env(safe-area-inset-bottom,8px)",
      }}
    >
      <div style={{ display: "flex" }}>
        {TABS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} style={{ flex: 1, textDecoration: "none" }}>
            {({ isActive }) => (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "10px 0 2px",
                  gap: "4px",
                  transition: "transform .15s ease",
                  position: "relative",
                }}
              >
                {/* Indicador activo superior */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "28px",
                      height: "2px",
                      borderRadius: "0 0 3px 3px",
                      background: "#4A9B7F",
                      boxShadow:
                        "0 0 10px rgba(74,155,127,.8), 0 0 20px rgba(74,155,127,.4)",
                    }}
                  />
                )}
                {/* Fondo activo sutil */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      inset: "4px 12px",
                      borderRadius: "12px",
                      background: "rgba(74,155,127,.07)",
                    }}
                  />
                )}
                <div
                  style={{
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                    transition: "transform .15s",
                  }}
                >
                  <Icon a={isActive} />
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? "#4A9B7F" : "#4A5C6A",
                    letterSpacing: ".03em",
                    transition: "color .2s",
                  }}
                >
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
