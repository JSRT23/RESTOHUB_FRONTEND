// src/features/inventory/components/AlmacenesList.jsx
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import {
  Warehouse,
  Plus,
  Search,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { GET_ALMACENES } from "../graphql/queries";
import { GET_RESTAURANTES } from "../../menu/graphql/queries";
import { CREAR_ALMACEN } from "../graphql/mutations";
import Swal from "sweetalert2";
import {
  Badge,
  Button,
  PageHeader,
  StatCard,
  Skeleton,
  EmptyState,
  Modal,
  Input,
  Select,
} from "../../../shared/components/ui";

function AlmacenCard({ almacen, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group rounded-2xl bg-white border border-stone-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div
        className={`h-1 ${almacen.ingredientesBajoMinimo > 0 ? "bg-amber-400" : "bg-emerald-400"}`}
      />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center shrink-0">
              <Warehouse size={16} className="text-stone-400" />
            </div>
            <div className="min-w-0">
              <p className="font-playfair text-stone-900 font-semibold text-sm leading-tight truncate">
                {almacen.nombre}
              </p>
              {almacen.descripcion && (
                <p className="text-[10px] font-dm text-stone-400 mt-0.5 truncate">
                  {almacen.descripcion}
                </p>
              )}
            </div>
          </div>
          <Badge variant={almacen.activo ? "green" : "red"} size="xs">
            {almacen.activo ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
            {almacen.activo ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100">
            <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
              Ingredientes
            </p>
            <p className="font-playfair text-stone-900 font-bold text-xl mt-0.5">
              {almacen.totalIngredientes ?? 0}
            </p>
          </div>
          <div
            className={`px-3 py-2.5 rounded-xl border ${almacen.ingredientesBajoMinimo > 0 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}
          >
            <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
              Bajo mínimo
            </p>
            <p
              className={`font-playfair font-bold text-xl mt-0.5 ${almacen.ingredientesBajoMinimo > 0 ? "text-amber-600" : "text-emerald-600"}`}
            >
              {almacen.ingredientesBajoMinimo ?? 0}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <span className="text-[10px] font-dm text-stone-400 flex items-center gap-1">
            <Building2 size={10} />
            Rest. {almacen.restauranteId?.slice(0, 8)}...
          </span>
          <span className="text-xs font-dm font-semibold text-amber-600 flex items-center gap-1 group-hover:gap-1.5 transition-all">
            Ver stock <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </div>
  );
}

function ModalCrearAlmacen({ open, onClose }) {
  const [form, setForm] = useState({
    restauranteId: "",
    nombre: "",
    descripcion: "",
  });
  const { data: restData } = useQuery(GET_RESTAURANTES);
  const [crear, { loading }] = useMutation(CREAR_ALMACEN, {
    refetchQueries: ["GetAlmacenes"],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: res } = await crear({
      variables: {
        restauranteId: form.restauranteId,
        nombre: form.nombre,
        descripcion: form.descripcion || null,
      },
    });
    if (res.crearAlmacen.ok) {
      onClose();
      setForm({ restauranteId: "", nombre: "", descripcion: "" });
    } else {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: res.crearAlmacen.error,
        confirmButtonColor: "#F59E0B",
      });
    }
  };

  const restaurantes = restData?.restaurantes ?? [];

  return (
    <Modal open={open} onClose={onClose} title="Nuevo almacén" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Restaurante"
          icon={Building2}
          value={form.restauranteId}
          onChange={(e) => setForm({ ...form, restauranteId: e.target.value })}
        >
          <option value="">Selecciona un restaurante...</option>
          {restaurantes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre} — {r.ciudad}
            </option>
          ))}
        </Select>
        <Input
          label="Nombre del almacén"
          icon={Warehouse}
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Ej: Cuarto frío principal"
          required
        />
        <div className="space-y-1.5">
          <label className="text-xs font-dm font-semibold text-stone-600">
            Descripción (opcional)
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={3}
            placeholder="Descripción o notas del almacén..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none shadow-sm"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={loading}
            type="submit"
            disabled={!form.restauranteId || !form.nombre.trim()}
          >
            Crear almacén
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AlmacenesList() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [restauranteFiltro, setRestauranteFiltro] = useState("");

  const { data, loading } = useQuery(GET_ALMACENES, {
    variables: { restauranteId: restauranteFiltro || undefined },
  });
  const { data: restData } = useQuery(GET_RESTAURANTES);

  const almacenes = data?.almacenes ?? [];
  const restaurantes = restData?.restaurantes ?? [];
  const activos = almacenes.filter((a) => a.activo).length;
  const conAlertas = almacenes.filter(
    (a) => (a.ingredientesBajoMinimo ?? 0) > 0,
  ).length;
  const filtered = almacenes.filter((a) =>
    a.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory Service"
        title="Almacenes"
        description="Espacios de almacenamiento de insumos por restaurante."
        action={
          <div className="flex items-center gap-2">
            <StatCard label="Total" value={almacenes.length} icon={Warehouse} />
            <StatCard
              label="Con alertas"
              value={conAlertas}
              icon={AlertTriangle}
            />
            <StatCard
              label="Activos"
              value={activos}
              icon={CheckCircle2}
              accent
            />
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={14} />
              Nuevo almacén
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
          <Search size={14} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar almacén..."
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
          />
        </div>
        <select
          value={restauranteFiltro}
          onChange={(e) => setRestauranteFiltro(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all shadow-sm"
        >
          <option value="">Todos los restaurantes</option>
          {restaurantes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="Sin almacenes"
          description="Crea el primer almacén de la cadena."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={14} />
              Nuevo almacén
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <AlmacenCard
              key={a.id}
              almacen={a}
              onClick={() => navigate(`/inventario/stock?almacen=${a.id}`)}
            />
          ))}
        </div>
      )}

      <ModalCrearAlmacen open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
