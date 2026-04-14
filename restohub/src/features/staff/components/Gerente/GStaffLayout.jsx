// src/features/staff/components/Gerente/GStaffLayout.jsx
//
// Layout con tabs para el módulo Staff del gerente.
// Agrupa: Empleados, Turnos y Nómina bajo /gerente/staff/*
//
// Registrar en routes/index.jsx:
//   import GStaffLayout     from "../../features/staff/components/Gerente/GStaffLayout";
//   import GEmpleadosList   from "../../features/staff/components/Gerente/GEmpleadosList";
//   import GTurnosList      from "../../features/staff/components/Gerente/GTurnosList";
//   import GNomina          from "../../features/staff/components/Gerente/GNomina";
//
//   {
//     path: "gerente/staff",
//     element: <RoleRoute roles={["gerente_local"]}><GStaffLayout /></RoleRoute>,
//     children: [
//       { index: true, element: <Navigate to="empleados" replace /> },
//       { path: "empleados", element: <GEmpleadosList /> },
//       { path: "turnos",    element: <GTurnosList /> },
//       { path: "nomina",    element: <GNomina /> },
//     ],
//   },

import { NavLink, Outlet } from "react-router-dom";
import { Users, Clock, DollarSign } from "lucide-react";

const G = {
  50: "#DAF1DE",
  300: "#235347",
  900: "#051F20",
};

const TABS = [
  { to: "empleados", label: "Empleados", icon: Users },
  { to: "turnos", label: "Turnos", icon: Clock },
  { to: "nomina", label: "Nómina", icon: DollarSign },
];

export default function GStaffLayout() {
  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 bg-stone-100 rounded-2xl p-1 w-fit">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-dm font-semibold transition-all ${
                isActive
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Contenido de la tab activa */}
      <Outlet />
    </div>
  );
}
