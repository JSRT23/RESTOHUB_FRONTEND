// src/shared/components/layout/Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Layers } from "lucide-react";
import {
  UtensilsCrossed,
  Package,
  Menu,
  X,
  ChevronDown,
  Tag,
  FlaskConical,
  Building2,
  Warehouse,
  Truck,
  Archive,
  ShoppingCart,
  Bell,
  LayoutDashboard,
  Users,
  LogOut,
  UserCircle,
  ShieldCheck,
  Clock,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../../../app/auth/AuthContext";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  700: "#0B2B26",
  900: "#051F20",
};

// Normaliza el rol: "gerente" → "gerente_local" (auth_service puede devolver ambos)
function normalizeRol(rol) {
  if (rol === "gerente") return "gerente_local";
  return rol;
}

const NAV_CONFIG = {
  admin_central: [
    { label: "Restaurantes", href: "/restaurantes", icon: Building2 },
    { label: "Categorías", href: "/menu/categorias", icon: Tag },
    {
      label: "Inventario",
      icon: Package,
      children: [
        {
          label: "Dashboard",
          href: "/inventario",
          icon: LayoutDashboard,
          desc: "Vista general",
        },
        {
          label: "Stock",
          href: "/inventario/stock",
          icon: Package,
          desc: "Niveles",
        },
        {
          label: "Almacenes",
          href: "/inventario/almacenes",
          icon: Warehouse,
          desc: "Espacios",
        },
        {
          label: "Proveedores",
          href: "/inventario/proveedores",
          icon: Truck,
          desc: "Gestión",
        },
        {
          label: "Lotes",
          href: "/inventario/lotes",
          icon: Archive,
          desc: "Trazabilidad",
        },
        {
          label: "Órdenes",
          href: "/inventario/ordenes",
          icon: ShoppingCart,
          desc: "Compras",
        },
        {
          label: "Alertas",
          href: "/inventario/alertas",
          icon: Bell,
          desc: "Alertas",
        },
      ],
    },
    {
      label: "Gestión",
      icon: Users,
      children: [
        {
          label: "Usuarios",
          href: "/admin/usuarios",
          icon: Users,
          desc: "Todos los usuarios",
        },
        {
          label: "Staff",
          href: "/admin/staff",
          icon: UserCircle,
          desc: "Personal y turnos",
        },
      ],
    },
  ],

  gerente_local: [
    { label: "Dashboard", href: "/gerente", icon: LayoutDashboard },
    // ── Menú ───────────────────────────────────────────────────────────
    {
      label: "Menú",
      icon: UtensilsCrossed,
      children: [
        {
          label: "Platos",
          href: "/gerente/platos",
          icon: UtensilsCrossed,
          desc: "Catálogo y precios",
        },
        {
          label: "Ingredientes",
          href: "/gerente/ingredientes",
          icon: FlaskConical,
          desc: "Crear y gestionar",
        },
        {
          label: "Categorías",
          href: "/gerente/categorias",
          icon: Tag,
          desc: "Solo lectura",
        },
      ],
    },
    // ── Inventario ───────────────────────────────────────────────────────────
    {
      label: "Inventario",
      icon: Package,
      children: [
        {
          label: "Dashboard",
          href: "/gerente/inventario",
          icon: LayoutDashboard,
          desc: "Vista general",
        },
        {
          label: "Proveedores",
          href: "/gerente/proveedores",
          icon: Truck,
          desc: "Crear y gestionar",
        },
        {
          label: "Órdenes",
          href: "/gerente/ordenes",
          icon: ShoppingCart,
          desc: "Compras al proveedor",
        },
        {
          label: "Stock",
          href: "/gerente/stock",
          icon: Layers,
          desc: "Niveles actuales",
        },
        {
          label: "Lotes",
          href: "/gerente/lotes",
          icon: Archive,
          desc: "Trazabilidad",
        },
      ],
    },
    // ── Staff ───────────────────────────────────────────────────────────
    {
      label: "Mi equipo",
      icon: Users,
      children: [
        {
          label: "Empleados",
          href: "/gerente/staff/empleados",
          icon: UserCircle,
          desc: "Contratar y gestionar",
        },
        {
          label: "Turnos",
          href: "/gerente/staff/turnos",
          icon: Clock,
          desc: "Planificar horarios",
        },
        {
          label: "Nómina",
          href: "/gerente/staff/nomina",
          icon: DollarSign,
          desc: "Horas y períodos",
        },
      ],
    },
  ],
};

const ROL_LABEL = {
  admin_central: "Admin Central",
  gerente_local: "Gerente Local",
  gerente: "Gerente Local", // alias por si el backend devuelve "gerente"
  supervisor: "Supervisor",
  cocinero: "Cocinero",
  mesero: "Mesero",
  cajero: "Cajero",
  repartidor: "Repartidor",
};

// ── Dropdown ───────────────────────────────────────────────────────────────
function DropdownMenu({ item, onClose }) {
  const location = useLocation();
  return (
    <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-white border border-stone-200 shadow-xl overflow-hidden z-50">
      <div className="p-1.5">
        {item.children.map((child) => {
          const Icon = child.icon;
          const active =
            location.pathname === child.href ||
            (child.href !== "/" && location.pathname.startsWith(child.href));
          return (
            <Link
              key={child.href}
              to={child.href}
              onClick={onClose}
              style={
                active
                  ? { background: G[50], borderLeft: `2px solid ${G[300]}` }
                  : {}
              }
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                ${active ? "" : "hover:bg-stone-50 border-l-2 border-transparent"}`}
            >
              <div
                style={active ? { background: G[50], color: G[300] } : {}}
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all
                  ${active ? "" : "bg-stone-100 text-stone-400 group-hover:bg-stone-200"}`}
              >
                <Icon size={12} />
              </div>
              <div>
                <p
                  style={active ? { color: G[500] } : {}}
                  className={`text-sm font-dm font-semibold ${active ? "" : "text-stone-600 group-hover:text-stone-800"}`}
                >
                  {child.label}
                </p>
                {child.desc && (
                  <p className="text-[10px] font-dm text-stone-400">
                    {child.desc}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── NavItem ────────────────────────────────────────────────────────────────
function NavItem({ item }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const isActive = item.href
    ? location.pathname === item.href || location.pathname.startsWith(item.href)
    : item.children?.some((c) => location.pathname.startsWith(c.href));

  if (item.href) {
    return (
      <Link
        to={item.href}
        style={
          isActive
            ? { color: G[500], background: G[50], borderColor: `${G[300]}44` }
            : {}
        }
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-dm font-medium transition-all border
          ${isActive ? "" : "text-stone-500 border-transparent hover:bg-stone-50 hover:text-stone-800"}`}
      >
        <item.icon size={13} style={isActive ? { color: G[300] } : {}} />
        {item.label}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        style={
          isActive
            ? { color: G[500], background: G[50], borderColor: `${G[300]}44` }
            : {}
        }
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-dm font-medium transition-all border
          ${isActive ? "" : "text-stone-500 border-transparent hover:bg-stone-50 hover:text-stone-800"}`}
      >
        <item.icon size={13} style={isActive ? { color: G[300] } : {}} />
        {item.label}
        <ChevronDown
          size={11}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <DropdownMenu item={item} onClose={() => setOpen(false)} />}
    </div>
  );
}

// ── UserMenu ───────────────────────────────────────────────────────────────
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const initials =
    user?.nombre
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-all"
      >
        <div
          style={{ background: G[900], color: G[50] }}
          className="w-7 h-7 rounded-lg flex items-center justify-center font-dm font-bold text-xs shrink-0"
        >
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-dm font-semibold text-stone-700 leading-tight">
            {user?.nombre?.split(" ")[0]}
          </p>
          <p style={{ color: G[300] }} className="text-[10px] font-dm">
            {ROL_LABEL[user?.rol] || user?.rol}
          </p>
        </div>
        <ChevronDown
          size={11}
          className={`text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white border border-stone-200 shadow-xl overflow-hidden z-50">
          <div className="border-b border-stone-100 px-4 py-3">
            <p className="text-sm font-dm font-semibold text-stone-800 truncate">
              {user?.nombre}
            </p>
            <p className="text-xs font-dm text-stone-400 truncate">
              {user?.email}
            </p>
            <div
              style={{
                background: G[50],
                color: G[500],
                border: `1px solid ${G[100]}`,
              }}
              className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg text-[10px] font-dm font-semibold"
            >
              <ShieldCheck size={10} />
              {ROL_LABEL[user?.rol] || user?.rol}
            </div>
          </div>
          <div className="p-1.5">
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-dm font-medium text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut size={13} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MobileMenu ─────────────────────────────────────────────────────────────
function MobileMenu({ open, onClose, navItems, user, onLogout }) {
  const location = useLocation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between px-5 h-16 border-b border-stone-100">
        <span
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="font-bold text-xl text-stone-900"
        >
          RestoHub
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center"
        >
          <X size={16} className="text-stone-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <div key={item.label}>
            {item.href ? (
              <Link
                to={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-50 transition-all text-stone-600"
              >
                <item.icon size={15} className="text-stone-400" />
                <span className="font-dm font-semibold text-sm">
                  {item.label}
                </span>
              </Link>
            ) : (
              <>
                <div className="flex items-center gap-2 px-4 py-2 mt-2">
                  <item.icon size={12} style={{ color: G[300] }} />
                  <span
                    style={{ color: G[300] }}
                    className="text-[10px] font-dm font-bold tracking-[0.15em] uppercase"
                  >
                    {item.label}
                  </span>
                </div>
                {item.children?.map((child) => {
                  const active = location.pathname.startsWith(child.href);
                  return (
                    <Link
                      key={child.href}
                      to={child.href}
                      onClick={onClose}
                      style={active ? { color: G[500], background: G[50] } : {}}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all
                        ${active ? "" : "text-stone-500 hover:bg-stone-50"}`}
                    >
                      <child.icon
                        size={13}
                        style={active ? { color: G[300] } : {}}
                        className={active ? "" : "text-stone-300"}
                      />
                      <span className="font-dm text-sm">{child.label}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-stone-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{ background: G[900], color: G[50] }}
              className="w-9 h-9 rounded-xl flex items-center justify-center font-dm font-bold text-sm"
            >
              {user?.nombre?.[0] || "U"}
            </div>
            <div>
              <p className="text-sm font-dm font-semibold text-stone-800">
                {user?.nombre}
              </p>
              <p style={{ color: G[300] }} className="text-[11px] font-dm">
                {ROL_LABEL[user?.rol] || user?.rol}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-dm text-red-500 hover:bg-red-50 border border-red-100 transition"
          >
            <LogOut size={12} />
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Navbar ────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Normaliza "gerente" → "gerente_local" por si el auth_service devuelve el alias corto
  const rol = normalizeRol(user?.rol);
  const navItems = NAV_CONFIG[rol] || NAV_CONFIG.admin_central;

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 h-16 bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div
              style={{ background: G[900] }}
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
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
              className="font-bold text-lg tracking-tight text-stone-900"
            >
              RestoHub
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            {user && <UserMenu user={user} onLogout={handleLogout} />}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center"
            >
              <Menu size={16} className="text-stone-500" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navItems={navItems}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}
