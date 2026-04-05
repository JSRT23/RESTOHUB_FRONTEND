export default function Footer() {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="max-w-7xl mx-auto px-6 py-10 grid gap-8 md:grid-cols-3 text-sm text-gray-500">
        {/* Brand */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">RestoHub</h2>
          <p>
            Plataforma de gestión para restaurantes moderna, escalable y pensada
            para equipos.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          <span className="text-gray-800 font-medium">Producto</span>
          <a className="hover:text-blue-600 transition">Funciones</a>
          <a className="hover:text-blue-600 transition">Precios</a>
          <a className="hover:text-blue-600 transition">Integraciones</a>
        </div>

        {/* Support */}
        <div className="flex flex-col gap-2">
          <span className="text-gray-800 font-medium">Soporte</span>
          <a className="hover:text-blue-600 transition">Ayuda</a>
          <a className="hover:text-blue-600 transition">Contacto</a>
          <a className="hover:text-blue-600 transition">Términos</a>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} RestoHub. Todos los derechos reservados.
      </div>
    </footer>
  );
}
