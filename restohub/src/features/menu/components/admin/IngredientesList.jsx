// src/features/menu/components/IngredientesList.jsx
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Package,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Plus,
} from "lucide-react";
import { GET_INGREDIENTES } from "../../graphql/queries";
import { CREATE_INGREDIENTE } from "../../graphql/mutations";
import {
  Badge,
  Button,
  PageHeader,
  StatCard,
  Modal,
  Input,
  Select,
} from "../../../../shared/components/ui";

const UNIDADES = [
  { value: "kg", label: "Kilogramo (kg)" },
  { value: "g", label: "Gramo (g)" },
  { value: "l", label: "Litro (l)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "und", label: "Unidad (und)" },
  { value: "por", label: "Porción (por)" },
];

export default function IngredientesList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    unidadMedida: "und",
    descripcion: "",
  });

  const { data, loading } = useQuery(GET_INGREDIENTES);
  const [crear, { loading: creando }] = useMutation(CREATE_INGREDIENTE, {
    refetchQueries: ["GetIngredientes"],
  });

  const ingredientes = data?.ingredientes ?? [];
  const activos = ingredientes.filter((i) => i.activo).length;

  const filtered = ingredientes.filter((i) =>
    i.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCrear = async (e) => {
    e.preventDefault();
    const { data: res } = await crear({
      variables: {
        nombre: form.nombre,
        unidadMedida: form.unidadMedida,
        descripcion: form.descripcion || null,
      },
    });
    if (res.crearIngrediente.ok) {
      setModalOpen(false);
      setForm({ nombre: "", unidadMedida: "und", descripcion: "" });
    }
  };

  return (
    <div className="space-y-6 font-dm">
      <PageHeader
        eyebrow="Menu Service"
        title="Ingredientes"
        description="Catálogo global de ingredientes sincronizado con inventory_service vía RabbitMQ."
        action={
          <div className="flex items-center gap-3">
            <StatCard
              label="Total"
              value={ingredientes.length}
              icon={Package}
            />
            <StatCard
              label="Activos"
              value={activos}
              icon={CheckCircle2}
              accent
            />
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={14} />
              Nuevo ingrediente
            </Button>
          </div>
        }
      />

      {/* 🔍 Search limpio */}
      <div className="flex items-center gap-2.5 max-w-sm px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] focus-within:border-[#C9A84C]/40 focus-within:ring-2 focus-within:ring-[#C9A84C]/10 transition-all">
        <Package size={13} className="text-[#9CA3AF] shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ingrediente..."
          className="flex-1 bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none font-dm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-[#F3F4F6] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((ing) => (
            <div
              key={ing.id}
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#C9A84C]/40 hover:shadow-sm transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                <FlaskConical size={14} className="text-[#6B7280]" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-dm text-[#111827] font-medium truncate">
                  {ing.nombre}
                </p>
                <p className="text-[10px] font-dm text-[#6B7280] mt-0.5">
                  {ing.unidadMedida}
                </p>
              </div>

              <Badge variant={ing.activo ? "green" : "red"} size="xs">
                {ing.activo ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* 🧾 Modal elegante */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo ingrediente"
        size="sm"
      >
        <form onSubmit={handleCrear} className="space-y-4">
          <Input
            label="Nombre"
            icon={Package}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Carne Angus"
            required
          />

          <Select
            label="Unidad de medida"
            icon={FlaskConical}
            value={form.unidadMedida}
            onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })}
          >
            {UNIDADES.map(({ value, label }) => (
              <option
                key={value}
                value={value}
                className="bg-white text-[#111827]"
              >
                {label}
              </option>
            ))}
          </Select>

          <Input
            label="Descripción (opcional)"
            icon={Package}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Descripción breve..."
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setModalOpen(false)}
              className="text-[#6B7280] hover:text-[#111827]"
            >
              Cancelar
            </Button>

            <Button
              size="sm"
              loading={creando}
              type="submit"
              disabled={!form.nombre.trim()}
            >
              Crear ingrediente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
