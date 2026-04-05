import { useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Building2,
  Coins,
  ArrowRight,
  Plus,
  AlertCircle,
} from "lucide-react";
import { GET_RESTAURANTES } from "../graphql/getRestaurantes";

export default function RestaurantesList() {
  const { data, loading, error } = useQuery(GET_RESTAURANTES);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-gray-500">
          Cargando restaurantes...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 shadow-sm">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">
            Error al cargar los restaurantes: {error.message}
          </span>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <span className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
            Restaurantes
          </span>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Gestión de restaurantes
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-gray-500 sm:text-base">
            Administra todos los restaurantes registrados dentro de la
            plataforma RestoHub.
          </p>
        </div>

        {/* 🔥 BOTÓN CON NAVEGACIÓN */}
        <button
          onClick={() => navigate("/restaurantes/new")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30"
        >
          <Plus className="h-4 w-4" />
          Nuevo restaurante
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {data.restaurantes.map((r) => (
          <article
            key={r.id}
            className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl"
          >
            {/* Glow */}
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-blue-50 opacity-0 blur-2xl transition group-hover:opacity-100" />

            {/* Header */}
            <div className="relative mb-6 flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-gray-900 transition group-hover:text-blue-600">
                  {r.nombre}
                </h2>

                <p className="text-xs uppercase tracking-wide text-gray-400">
                  ID {r.id.slice(0, 8)}
                </p>
              </div>

              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  r.activo
                    ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                    : "bg-red-50 text-red-600 ring-1 ring-red-100"
                }`}
              >
                <span
                  className={`mr-2 h-2 w-2 rounded-full ${
                    r.activo ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                {r.activo ? "Activo" : "Inactivo"}
              </span>
            </div>

            {/* Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-gray-100 p-2 text-gray-500">
                  <MapPin className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Ubicación
                  </p>
                  <p className="text-sm text-gray-700">
                    {r.ciudad}, {r.pais}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-gray-100 p-2 text-gray-500">
                  <Building2 className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Dirección
                  </p>
                  <p className="text-sm text-gray-700">{r.direccion}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-gray-100 p-2 text-gray-500">
                  <Coins className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Moneda
                  </p>
                  <p className="text-sm text-gray-700">{r.moneda}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
              <span className="text-xs text-gray-400">
                Última actualización reciente
              </span>

              <button className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700">
                Ver detalles
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
