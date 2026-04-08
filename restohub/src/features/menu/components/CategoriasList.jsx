// src/features/menu/components/CategoriasList.jsx
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Tag, Plus, CheckCircle2, XCircle, Hash } from "lucide-react";
import { GET_CATEGORIAS } from "../graphql/queries";
import { CREATE_CATEGORIA, DESACTIVAR_CATEGORIA } from "../graphql/mutations";
import {
  Badge,
  Button,
  PageHeader,
  StatCard,
  Modal,
  Input,
} from "../../../shared/components/ui";

export default function CategoriasList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", orden: "0" });

  const { data, loading } = useQuery(GET_CATEGORIAS);
  const [crear, { loading: creando }] = useMutation(CREATE_CATEGORIA, {
    refetchQueries: ["GetCategorias"],
  });
  const [desactivar] = useMutation(DESACTIVAR_CATEGORIA, {
    refetchQueries: ["GetCategorias"],
  });

  const categorias = data?.categorias ?? [];
  const activas = categorias.filter((c) => c.activo).length;

  const handleCrear = async (e) => {
    e.preventDefault();
    const { data: res } = await crear({
      variables: { nombre: form.nombre, orden: parseInt(form.orden) || 0 },
    });
    if (res.crearCategoria.ok) {
      setModalOpen(false);
      setForm({ nombre: "", orden: "0" });
    }
  };

  return (
    <div className="space-y-6 font-dm">
      <PageHeader
        eyebrow="Menu Service"
        title="Categorías"
        description="Organiza el menú en categorías para una mejor experiencia."
        action={
          <div className="flex items-center gap-3">
            <StatCard label="Total" value={categorias.length} icon={Tag} />
            <StatCard
              label="Activas"
              value={activas}
              icon={CheckCircle2}
              accent
            />
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={14} />
              Nueva categoría
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-stone-100 animate-pulse border border-stone-200"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categorias.map((cat) => (
            <div
              key={cat.id}
              className="group flex items-center gap-4 p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 transition-all"
            >
              {/* Icono */}
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <Tag size={15} className="text-amber-600" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-playfair text-stone-900 font-semibold text-sm truncate">
                  {cat.nombre}
                </p>
                <span className="flex items-center gap-1 text-[10px] font-dm text-stone-400 mt-0.5">
                  <Hash size={9} />
                  orden {cat.orden}
                </span>
              </div>

              {/* Estado */}
              <div className="flex flex-col items-end gap-2">
                <Badge variant={cat.activo ? "green" : "red"} size="xs">
                  {cat.activo ? (
                    <CheckCircle2 size={9} />
                  ) : (
                    <XCircle size={9} />
                  )}
                  {cat.activo ? "Activa" : "Inactiva"}
                </Badge>

                {cat.activo && (
                  <button
                    onClick={() => desactivar({ variables: { id: cat.id } })}
                    className="text-[10px] font-dm text-stone-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                  >
                    Desactivar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva categoría"
        size="sm"
      >
        <form onSubmit={handleCrear} className="space-y-4">
          <Input
            label="Nombre"
            icon={Tag}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Entradas"
            required
          />
          <Input
            label="Orden"
            icon={Hash}
            type="number"
            value={form.orden}
            onChange={(e) => setForm({ ...form, orden: e.target.value })}
            placeholder="0"
            hint="Menor número = aparece primero en el menú"
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={creando}
              type="submit"
              disabled={!form.nombre.trim()}
            >
              Crear categoría
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
