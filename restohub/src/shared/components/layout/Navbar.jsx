import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow">
            R
          </div>
          <span className="font-semibold text-gray-800 text-lg">RestoHub</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a className="hover:text-blue-600 transition">Dashboard</a>
          <a className="hover:text-blue-600 transition">Restaurantes</a>
          <a className="hover:text-blue-600 transition">Pedidos</a>
          <a className="hover:text-blue-600 transition">Menú</a>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden lg:block">
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* User */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-700">Admin</p>
              <p className="text-xs text-gray-400">admin@restohub.com</p>
            </div>

            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-sm font-bold shadow">
              A
            </div>
          </div>

          {/* Mobile button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-6 pb-4 space-y-3 text-sm text-gray-600">
          <a className="block hover:text-blue-600">Dashboard</a>
          <a className="block hover:text-blue-600">Restaurantes</a>
          <a className="block hover:text-blue-600">Pedidos</a>
          <a className="block hover:text-blue-600">Menú</a>
        </div>
      )}
    </header>
  );
}
