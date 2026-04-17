// src/features/orders/components/Cocinero/CCocineroLayout.jsx
// Layout del cocinero — 3 tabs: Comandas · Stock · Mi turno
// Ruta base: /cocina

import { NavLink, Outlet } from "react-router-dom";
import { ChefHat, Package, Clock } from "lucide-react";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const TABS = [
  { to: "/cocina", label: "Comandas", icon: ChefHat, end: true },
  { to: "/cocina/stock", label: "Stock", icon: Package },
  { to: "/cocina/turno", label: "Mi turno", icon: Clock },
];

export default function CCocineroLayout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl w-fit">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-dm font-semibold transition-all ${
                isActive ? "" : "text-stone-500 hover:text-stone-800"
              }`
            }
            style={({ isActive }) =>
              isActive ? { background: G[900], color: "#fff" } : {}
            }
          >
            <Icon size={13} />
            {label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
