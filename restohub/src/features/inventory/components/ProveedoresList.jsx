// src/features/inventory/components/ProveedoresList.jsx
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Truck,
  Plus,
  Search,
  Globe,
  Phone,
  Mail,
  Coins,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { GET_PROVEEDORES } from "../graphql/queries";
import { CREAR_PROVEEDOR } from "../graphql/mutations";
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

const PAISES = [
  "Colombia",
  "México",
  "Argentina",
  "Brasil",
  "Chile",
  "España",
  "Estados Unidos",
  "Perú",
  "Ecuador",
  "Venezuela",
];
const MONEDAS = ["COP", "USD", "EUR", "MXN", "ARS", "BRL", "CLP", "PEN"];

// ── ProveedorCard ──────────────────────────────────────────────────────────
function ProveedorCard({ proveedor }) {
  return (
    <div className="rounded-2xl bg-white border border-stone-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-300" />
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
              <span className="font-playfair text-amber-600 font-bold text-sm">
                {proveedor.nombre[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-playfair text-stone-900 font-semibold text-sm leading-tight truncate">
                {proveedor.nombre}
              </p>
              <p className="text-[10px] font-dm text-stone-400 mt-0.5">
                {proveedor.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <Badge variant={proveedor.activo ? "green" : "red"} size="xs">
            {proveedor.activo ? (
              <CheckCircle2 size={9} />
            ) : (
              <XCircle size={9} />
            )}
            {proveedor.activo ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        {/* Info */}
        <div className="space-y-2">
          {[
            {
              icon: Globe,
              text:
                proveedor.pais +
                (proveedor.ciudad ? ` · ${proveedor.ciudad}` : ""),
            },
            proveedor.telefono && { icon: Phone, text: proveedor.telefono },
            proveedor.email && { icon: Mail, text: proveedor.email },
            {
              icon: Coins,
              text: `Moneda: ${proveedor.monedaPreferida ?? "—"}`,
            },
          ]
            .filter(Boolean)
            .map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0">
                  <Icon size={11} className="text-stone-400" />
                </div>
                <span className="text-xs font-dm text-stone-500 truncate">
                  {text}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ── ModalCrear ─────────────────────────────────────────────────────────────
function ModalCrearProveedor({ open, onClose }) {
  const [form, setForm] = useState({
    nombre: "",
    pais: "Colombia",
    ciudad: "",
    telefono: "",
    email: "",
    monedaPreferida: "COP",
  });
  const [crear, { loading }] = useMutation(CREAR_PROVEEDOR, {
    refetchQueries: ["GetProveedores"],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: res } = await crear({
      variables: {
        nombre: form.nombre,
        pais: form.pais,
        ciudad: form.ciudad || null,
        telefono: form.telefono || null,
        email: form.email || null,
        monedaPreferida: form.monedaPreferida || null,
      },
    });
    if (res.crearProveedor.ok) {
      onClose();
      setForm({
        nombre: "",
        pais: "Colombia",
        ciudad: "",
        telefono: "",
        email: "",
        monedaPreferida: "COP",
      });
    } else {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: res.crearProveedor.error,
        confirmButtonColor: "#F59E0B",
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo proveedor" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre del proveedor"
          icon={Truck}
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Ej: Carnes Premium S.A.S"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="País"
            icon={Globe}
            value={form.pais}
            onChange={(e) => setForm({ ...form, pais: e.target.value })}
          >
            {PAISES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Input
            label="Ciudad"
            icon={Globe}
            value={form.ciudad}
            onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
            placeholder="Ej: Bogotá"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Teléfono"
            icon={Phone}
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="+57 300 000 0000"
          />
          <Input
            label="Email"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="contacto@proveedor.com"
          />
        </div>

        <Select
          label="Moneda preferida"
          icon={Coins}
          value={form.monedaPreferida}
          onChange={(e) =>
            setForm({ ...form, monedaPreferida: e.target.value })
          }
        >
          {MONEDAS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={loading}
            type="submit"
            disabled={!form.nombre.trim()}
          >
            Crear proveedor
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ProveedoresList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("all");

  const { data, loading } = useQuery(GET_PROVEEDORES, {
    variables: { activo: filtro === "all" ? undefined : filtro === "activo" },
  });

  const proveedores = data?.proveedores ?? [];
  const activos = proveedores.filter((p) => p.activo).length;

  const filtered = proveedores.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.pais ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory Service"
        title="Proveedores"
        description="Gestiona los proveedores de insumos y materias primas de la cadena."
        action={
          <div className="flex items-center gap-2">
            <StatCard label="Total" value={proveedores.length} icon={Truck} />
            <StatCard
              label="Activos"
              value={activos}
              icon={CheckCircle2}
              accent
            />
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={14} />
              Nuevo proveedor
            </Button>
          </div>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
          <Search size={14} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o país..."
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200 shadow-sm">
          {[
            { v: "all", l: "Todos" },
            { v: "activo", l: "Activos" },
            { v: "inactivo", l: "Inactivos" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-dm font-medium transition-all ${filtro === v ? "bg-amber-500 text-white shadow-sm" : "text-stone-400 hover:text-stone-700"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Sin proveedores"
          description="Crea el primer proveedor de la cadena."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={14} />
              Nuevo proveedor
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProveedorCard key={p.id} proveedor={p} />
          ))}
        </div>
      )}

      <ModalCrearProveedor
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
