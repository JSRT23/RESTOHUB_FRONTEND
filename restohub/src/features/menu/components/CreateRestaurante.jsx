import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Building2, MapPin, Home, Coins, Globe } from "lucide-react";
import { CREATE_RESTAURANTE } from "../graphql/createRestaurante";

export default function CreateRestaurante() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    pais: "",
    direccion: "",
    ciudad: "",
    moneda: "",
  });

  const [createRestaurante, { loading }] = useMutation(CREATE_RESTAURANTE, {
    refetchQueries: ["GetRestaurantes"],
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await createRestaurante({
        variables: form,
      });

      if (data.crearRestaurante.ok) {
        await Swal.fire({
          icon: "success",
          title: "Restaurante creado",
          html: `
            <b>${form.nombre}</b><br/>
            ${form.ciudad}, ${form.pais}
          `,
          confirmButtonColor: "#2563eb",
        });

        navigate("/restaurantes");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.crearRestaurante.error,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: err.message,
      });
    }
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-10">
      <div className="w-full max-w-2xl">
        {/* Card */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Crear restaurante
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Completa la información para registrar un nuevo restaurante
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Nombre
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                <Building2 className="h-4 w-4 text-gray-400" />
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Restaurante Central"
                  className="w-full outline-none text-sm"
                  required
                />
              </div>
            </div>

            {/* País y Ciudad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  País
                </label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <input
                    name="pais"
                    value={form.pais}
                    onChange={handleChange}
                    placeholder="Ej: Colombia"
                    className="w-full outline-none text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Ciudad
                </label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <input
                    name="ciudad"
                    value={form.ciudad}
                    onChange={handleChange}
                    placeholder="Ej: Medellín"
                    className="w-full outline-none text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Dirección
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                <Home className="h-4 w-4 text-gray-400" />
                <input
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  placeholder="Ej: Calle 10 #20-30"
                  className="w-full outline-none text-sm"
                  required
                />
              </div>
            </div>

            {/* Moneda */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Moneda
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                <Coins className="h-4 w-4 text-gray-400" />
                <input
                  name="moneda"
                  value={form.moneda}
                  onChange={handleChange}
                  placeholder="Ej: COP"
                  className="w-full outline-none text-sm"
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate("/restaurantes")}
                className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creando..." : "Crear restaurante"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
