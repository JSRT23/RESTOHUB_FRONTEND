// src/features/staff/components/Supervisor/SSupervisorLayout.jsx
// Layout raíz del supervisor — 3 tabs: Pedidos · Staff · Inventario
// Ruta base: /supervisor

import { NavLink, Outlet } from "react-router-dom";
import { ClipboardList, Users, Package } from "lucide-react";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const TABS = [
  { to: "/supervisor/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/supervisor/staff", label: "Staff", icon: Users },
  { to: "/supervisor/stock", label: "Inventario", icon: Package },
];

export default function SSupervisorLayout() {
  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl w-fit">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
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
