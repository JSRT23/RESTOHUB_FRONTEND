// src/shared/components/layout/Navbar.jsx
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  ShoppingBag,
  Package,
  Tag,
  FlaskConical,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Restaurantes",
    icon: UtensilsCrossed,
    to: "/restaurantes",
    single: true,
  },
  {
    label: "Menú",
    icon: ShoppingBag,
    children: [
      { label: "Platos", icon: UtensilsCrossed, to: "/menu/platos" },
      { label: "Categorías", icon: Tag, to: "/menu/categorias" },
      { label: "Ingredientes", icon: FlaskConical, to: "/menu/ingredientes" },
    ],
  },
  {
    label: "Inventario",
    icon: Package,
    to: "/inventario",
    single: true,
  },
];

function DropdownMenu({ group, onClose }) {
  return (
    <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl border border-stone-200 shadow-lg shadow-stone-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="p-1.5 space-y-0.5">
        {group.children.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-dm transition-all ${
                isActive
                  ? "bg-amber-50 text-amber-700 font-semibold"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              }`
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();

  const toggleDropdown = (label) =>
    setOpenDropdown(openDropdown === label ? null : label);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm shadow-amber-200">
              <UtensilsCrossed
                size={16}
                className="text-white"
                strokeWidth={2.5}
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-playfair text-stone-900 font-bold text-lg leading-none block">
                RestoHub
              </span>
              <span className="text-[9px] font-dm font-semibold tracking-[0.15em] uppercase text-amber-500 leading-none">
                Management
              </span>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_GROUPS.map((group) => {
              if (group.single) {
                return (
                  <NavLink
                    key={group.to}
                    to={group.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-dm font-medium transition-all ${
                        isActive
                          ? "bg-amber-50 text-amber-700"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                      }`
                    }
                  >
                    <group.icon size={15} />
                    {group.label}
                  </NavLink>
                );
              }
              return (
                <div key={group.label} className="relative">
                  <button
                    onClick={() => toggleDropdown(group.label)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-dm font-medium transition-all ${
                      openDropdown === group.label
                        ? "bg-amber-50 text-amber-700"
                        : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    <group.icon size={15} />
                    {group.label}
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-150 ${openDropdown === group.label ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openDropdown === group.label && (
                    <DropdownMenu
                      group={group}
                      onClose={() => setOpenDropdown(null)}
                    />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-400 text-xs font-dm hover:border-stone-300 transition-all">
              <Search size={13} />
              <span>Buscar...</span>
              <span className="ml-4 text-[10px] bg-stone-200 text-stone-500 rounded-md px-1.5 py-0.5">
                ⌘K
              </span>
            </button>

            {/* Bell */}
            <button className="relative w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-all">
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-dm font-semibold text-stone-800 leading-none">
                  Admin
                </p>
                <p className="text-[10px] font-dm text-stone-400 leading-none mt-0.5">
                  Gerente
                </p>
              </div>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-600"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpenDropdown(null)}
        />
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden fixed top-16 inset-x-0 z-40 bg-white border-b border-stone-200 shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {NAV_GROUPS.map((group) => {
              if (group.single) {
                return (
                  <NavLink
                    key={group.to}
                    to={group.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-dm font-medium transition-all ${
                        isActive
                          ? "bg-amber-50 text-amber-700"
                          : "text-stone-600 hover:bg-stone-50"
                      }`
                    }
                  >
                    <group.icon size={16} />
                    {group.label}
                  </NavLink>
                );
              }
              return (
                <div key={group.label}>
                  <p className="px-3 py-1 text-[10px] font-dm font-bold uppercase tracking-widest text-stone-400">
                    {group.label}
                  </p>
                  {group.children.map(({ label, icon: Icon, to }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-dm transition-all ml-2 ${
                          isActive
                            ? "bg-amber-50 text-amber-700 font-semibold"
                            : "text-stone-600 hover:bg-stone-50"
                        }`
                      }
                    >
                      <Icon size={15} />
                      {label}
                    </NavLink>
                  ))}
                </div>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
