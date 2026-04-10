// src/shared/components/layout/Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  Package,
  Search,
  Menu,
  X,
  ChevronDown,
  Tag,
  FlaskConical,
  Building2,
  Warehouse,
  Truck,
  AlertTriangle,
  Archive,
  ShoppingCart,
  Bell,
  LayoutDashboard,
  BarChart2,
} from "lucide-react";

// ── Datos de navegación ────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: "Restaurantes",
    href: "/restaurantes",
    icon: Building2,
  },
  {
    label: "Menú",
    icon: UtensilsCrossed,
    children: [
      {
        label: "Platos",
        href: "/menu/platos",
        icon: UtensilsCrossed,
        desc: "Catálogo de platos",
      },
      {
        label: "Categorías",
        href: "/menu/categorias",
        icon: Tag,
        desc: "Organización del menú",
      },
      {
        label: "Ingredientes",
        href: "/menu/ingredientes",
        icon: FlaskConical,
        desc: "Materias primas del menú",
      },
    ],
  },
  {
    label: "Inventario",
    icon: Package,
    children: [
      {
        label: "Dashboard",
        href: "/inventario",
        icon: LayoutDashboard,
        desc: "Vista general y alertas",
      },
      {
        label: "Stock",
        href: "/inventario/stock",
        icon: Package,
        desc: "Niveles de ingredientes",
      },
      {
        label: "Almacenes",
        href: "/inventario/almacenes",
        icon: Warehouse,
        desc: "Espacios de almacenamiento",
      },
      {
        label: "Proveedores",
        href: "/inventario/proveedores",
        icon: Truck,
        desc: "Gestión de proveedores",
      },
      {
        label: "Lotes",
        href: "/inventario/lotes",
        icon: Archive,
        desc: "Trazabilidad por lote",
      },
      {
        label: "Órdenes",
        href: "/inventario/ordenes",
        icon: ShoppingCart,
        desc: "Órdenes de compra",
      },
      {
        label: "Alertas",
        href: "/inventario/alertas",
        icon: Bell,
        desc: "Alertas de stock",
      },
    ],
  },
];

// ── DropdownMenu ───────────────────────────────────────────────────────────
function DropdownMenu({ item, onClose }) {
  const location = useLocation();
  return (
    <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-white border border-stone-200 shadow-xl shadow-stone-200/80 overflow-hidden z-50">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                active
                  ? "bg-amber-50 border border-amber-200"
                  : "hover:bg-stone-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  active
                    ? "bg-amber-100 border border-amber-200"
                    : "bg-stone-100 border border-stone-200 group-hover:bg-amber-50 group-hover:border-amber-200"
                }`}
              >
                <Icon
                  size={13}
                  className={
                    active
                      ? "text-amber-600"
                      : "text-stone-400 group-hover:text-amber-500"
                  }
                />
              </div>
              <div>
                <p
                  className={`text-sm font-dm font-semibold ${active ? "text-amber-700" : "text-stone-700"}`}
                >
                  {child.label}
                </p>
                {child.desc && (
                  <p className="text-[10px] font-dm text-stone-400">
                    {child.desc}
                  </p>
                )}
              </div>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
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
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = item.href
    ? location.pathname === item.href ||
      (item.href !== "/" && location.pathname.startsWith(item.href))
    : item.children?.some((c) => location.pathname.startsWith(c.href));

  if (item.href) {
    return (
      <Link
        to={item.href}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-dm font-medium transition-all ${
          isActive
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
        }`}
      >
        <item.icon size={13} />
        {item.label}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-dm font-medium transition-all ${
          isActive
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
        }`}
      >
        <item.icon size={13} />
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

// ── MobileMenu ─────────────────────────────────────────────────────────────
function MobileMenu({ open, onClose }) {
  const location = useLocation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-stone-100">
        <span className="font-playfair text-stone-900 font-bold text-xl">
          RestoHub
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center"
        >
          <X size={16} className="text-stone-500" />
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <div key={item.label}>
            {item.href ? (
              <Link
                to={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-50 transition-all"
              >
                <item.icon size={15} className="text-stone-400" />
                <span className="font-dm font-semibold text-stone-700 text-sm">
                  {item.label}
                </span>
              </Link>
            ) : (
              <>
                <div className="flex items-center gap-2 px-4 py-2 mt-2">
                  <item.icon size={12} className="text-amber-500" />
                  <span className="text-[10px] font-dm font-bold tracking-[0.15em] uppercase text-amber-600">
                    {item.label}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {item.children?.map((child) => {
                    const active =
                      location.pathname === child.href ||
                      (child.href !== "/" &&
                        location.pathname.startsWith(child.href));
                    return (
                      <Link
                        key={child.href}
                        to={child.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${active ? "bg-amber-50 text-amber-700" : "hover:bg-stone-50 text-stone-600"}`}
                      >
                        <child.icon
                          size={13}
                          className={
                            active ? "text-amber-500" : "text-stone-300"
                          }
                        />
                        <span className="font-dm text-sm">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Navbar ────────────────────────────────────────────────────────────
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 h-16 bg-white/90 backdrop-blur-md border-b border-stone-100 shadow-sm">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm shadow-amber-200">
              <UtensilsCrossed size={14} className="text-white" />
            </div>
            <span className="font-playfair text-stone-900 font-bold text-lg tracking-tight">
              RestoHub
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Avatar placeholder */}
            <div className="hidden sm:flex w-8 h-8 rounded-full bg-amber-100 border border-amber-200 items-center justify-center">
              <span className="font-playfair text-amber-700 font-bold text-xs">
                A
              </span>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center"
            >
              <Menu size={16} className="text-stone-500" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
