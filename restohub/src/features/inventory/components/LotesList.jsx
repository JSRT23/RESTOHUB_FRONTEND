// src/features/inventory/components/LotesList.jsx
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Archive,
  Plus,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CalendarClock,
  FlaskConical,
  Truck,
  Warehouse,
  ArrowRight,
} from "lucide-react";
import Swal from "sweetalert2";
import { GET_LOTES, GET_ALMACENES, GET_PROVEEDORES } from "../graphql/queries";
import { GET_INGREDIENTES } from "../../menu/graphql/queries";
import { REGISTRAR_LOTE } from "../graphql/mutations";
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
  StepIndicator,
  Divider,
} from "../../../shared/components/ui";

// ── helpers ────────────────────────────────────────────────────────────────
const ESTADO_CFG = {
  ACTIVO: { label: "Activo", variant: "green" },
  AGOTADO: { label: "Agotado", variant: "red" },
  VENCIDO: { label: "Vencido", variant: "red" },
  RETIRADO: { label: "Retirado", variant: "default" },
};

function diasLabel(dias) {
  if (dias === null || dias === undefined) return "—";
  if (dias < 0) return `Vencido hace ${Math.abs(dias)}d`;
  if (dias === 0) return "Vence hoy";
  return `${dias}d restantes`;
}

function diasVariant(dias, vencido) {
  if (vencido || dias < 0) return "red";
  if (dias <= 7) return "amber";
  if (dias <= 30) return "blue";
  return "green";
}

// ── LoteCard ───────────────────────────────────────────────────────────────
function LoteCard({ lote }) {
  const cfg = ESTADO_CFG[lote.estado] ?? ESTADO_CFG.ACTIVO;
  const dv = diasVariant(lote.diasParaVencer, lote.estaVencido);
  const pct =
    lote.cantidadRecibida > 0
      ? Math.min(
          (parseFloat(lote.cantidadActual) /
            parseFloat(lote.cantidadRecibida)) *
            100,
          100,
        )
      : 0;

  return (
    <div className="rounded-2xl bg-white border border-stone-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div
        className={`h-1 ${lote.estaVencido ? "bg-red-400" : lote.diasParaVencer <= 7 ? "bg-amber-400" : "bg-emerald-400"}`}
      />
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="font-playfair text-stone-900 font-semibold text-sm">
                {lote.ingredienteId?.slice(0, 8) ?? "Ingrediente"}
              </p>
              <Badge variant={cfg.variant} size="xs">
                {cfg.label}
              </Badge>
            </div>
            <p className="text-[10px] font-dm text-stone-400 font-mono">
              Lote: {lote.numeroLote}
            </p>
          </div>
          <Badge variant={dv} size="xs">
            <Clock size={9} />
            {diasLabel(lote.diasParaVencer)}
          </Badge>
        </div>

        {/* Stock bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-dm">
            <span className="text-stone-400">Cantidad</span>
            <span className="font-semibold text-stone-700">
              {parseFloat(lote.cantidadActual).toFixed(3)} /{" "}
              {parseFloat(lote.cantidadRecibida).toFixed(3)} {lote.unidadMedida}
            </span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${lote.estaVencido ? "bg-red-400" : pct < 30 ? "bg-amber-400" : "bg-emerald-400"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] font-dm text-stone-400 text-right">
            {Math.round(pct)}% restante
          </p>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-dm">
          <div className="px-2.5 py-2 rounded-lg bg-stone-50 border border-stone-100">
            <p className="text-stone-400 mb-0.5">Recepción</p>
            <p className="text-stone-700 font-semibold">
              {lote.fechaRecepcion
                ? new Date(lote.fechaRecepcion).toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "short",
                  })
                : "—"}
            </p>
          </div>
          <div
            className={`px-2.5 py-2 rounded-lg border ${lote.estaVencido ? "bg-red-50 border-red-200" : lote.diasParaVencer <= 7 ? "bg-amber-50 border-amber-200" : "bg-stone-50 border-stone-100"}`}
          >
            <p className="text-stone-400 mb-0.5">Vencimiento</p>
            <p
              className={`font-semibold ${lote.estaVencido ? "text-red-600" : lote.diasParaVencer <= 7 ? "text-amber-600" : "text-stone-700"}`}
            >
              {lote.fechaVencimiento
                ? new Date(lote.fechaVencimiento).toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "short",
                    year: "2-digit",
                  })
                : "—"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[10px] font-dm text-stone-400">
          <span className="flex items-center gap-1">
            <Warehouse size={9} />
            {lote.almacenNombre ?? "—"}
          </span>
          <span className="flex items-center gap-1">
            <Truck size={9} />
            {lote.proveedorNombre ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── ModalRegistrarLote ─────────────────────────────────────────────────────
function ModalRegistrarLote({ open, onClose }) {
  const [form, setForm] = useState({
    ingredienteId: "",
    almacenId: "",
    proveedorId: "",
    numeroLote: "",
    fechaVencimiento: "",
    fechaProduccion: "",
    cantidadRecibida: "",
    unidadMedida: "kg",
  });

  const { data: ingData } = useQuery(GET_INGREDIENTES, {
    variables: { activo: true },
  });
  const { data: almData } = useQuery(GET_ALMACENES);
  const { data: provData } = useQuery(GET_PROVEEDORES, {
    variables: { activo: true },
  });
  const [registrar, { loading }] = useMutation(REGISTRAR_LOTE, {
    refetchQueries: ["GetLotes"],
  });

  const ingredientes = ingData?.ingredientes ?? [];
  const almacenes = almData?.almacenes ?? [];
  const proveedores = provData?.proveedores ?? [];

  const ing = ingredientes.find((i) => i.id === form.ingredienteId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: res } = await registrar({
      variables: {
        ingredienteId: form.ingredienteId,
        almacenId: form.almacenId,
        proveedorId: form.proveedorId,
        numeroLote: form.numeroLote,
        fechaVencimiento: form.fechaVencimiento,
        fechaProduccion: form.fechaProduccion || null,
        cantidadRecibida: parseFloat(form.cantidadRecibida),
        unidadMedida: ing?.unidadMedida ?? form.unidadMedida,
      },
    });
    if (res.registrarLote.ok) {
      onClose();
      setForm({
        ingredienteId: "",
        almacenId: "",
        proveedorId: "",
        numeroLote: "",
        fechaVencimiento: "",
        fechaProduccion: "",
        cantidadRecibida: "",
        unidadMedida: "kg",
      });
    } else {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: res.registrarLote.error,
        confirmButtonColor: "#F59E0B",
      });
    }
  };

  const canSubmit =
    form.ingredienteId &&
    form.almacenId &&
    form.proveedorId &&
    form.numeroLote &&
    form.fechaVencimiento &&
    parseFloat(form.cantidadRecibida) > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar lote de ingrediente"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Ingrediente"
            icon={FlaskConical}
            value={form.ingredienteId}
            onChange={(e) =>
              setForm({ ...form, ingredienteId: e.target.value })
            }
          >
            <option value="">Selecciona...</option>
            {ingredientes.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre} ({i.unidadMedida})
              </option>
            ))}
          </Select>
          <Select
            label="Almacén destino"
            icon={Warehouse}
            value={form.almacenId}
            onChange={(e) => setForm({ ...form, almacenId: e.target.value })}
          >
            <option value="">Selecciona...</option>
            {almacenes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </Select>
        </div>

        <Select
          label="Proveedor"
          icon={Truck}
          value={form.proveedorId}
          onChange={(e) => setForm({ ...form, proveedorId: e.target.value })}
        >
          <option value="">Selecciona...</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} ({p.pais})
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Número de lote"
            value={form.numeroLote}
            onChange={(e) => setForm({ ...form, numeroLote: e.target.value })}
            placeholder="Ej: LOT-2026-001"
            required
          />
          <Input
            label="Cantidad recibida"
            type="number"
            step="0.001"
            min="0.001"
            value={form.cantidadRecibida}
            onChange={(e) =>
              setForm({ ...form, cantidadRecibida: e.target.value })
            }
            placeholder={`En ${ing?.unidadMedida ?? "und"}`}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de producción (opcional)"
            type="date"
            value={form.fechaProduccion}
            onChange={(e) =>
              setForm({ ...form, fechaProduccion: e.target.value })
            }
          />
          <Input
            label="Fecha de vencimiento"
            type="date"
            value={form.fechaVencimiento}
            onChange={(e) =>
              setForm({ ...form, fechaVencimiento: e.target.value })
            }
            required
          />
        </div>

        {form.fechaVencimiento && (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-dm ${
              new Date(form.fechaVencimiento) < new Date()
                ? "bg-red-50 border border-red-200 text-red-600"
                : "bg-emerald-50 border border-emerald-200 text-emerald-700"
            }`}
          >
            <CalendarClock size={12} />
            {new Date(form.fechaVencimiento) < new Date()
              ? "⚠ La fecha de vencimiento ya pasó"
              : `Vence el ${new Date(form.fechaVencimiento).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}`}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={loading}
            type="submit"
            disabled={!canSubmit}
          >
            Registrar lote
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function LotesList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [porVencer, setPorVencer] = useState("");

  const { data, loading } = useQuery(GET_LOTES, {
    variables: {
      estado: filtroEstado === "all" ? undefined : filtroEstado,
      porVencer: porVencer ? parseInt(porVencer) : undefined,
    },
  });

  const lotes = data?.lotes ?? [];
  const activos = lotes.filter((l) => l.estado === "ACTIVO").length;
  const vencidos = lotes.filter((l) => l.estaVencido).length;
  const porVencer7 = lotes.filter(
    (l) => !l.estaVencido && l.diasParaVencer <= 7,
  ).length;

  const filtered = lotes.filter(
    (l) =>
      (l.numeroLote ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.almacenNombre ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.proveedorNombre ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory Service"
        title="Lotes de ingredientes"
        description="Trazabilidad completa por lote: proveedor, vencimiento y cantidades."
        action={
          <div className="flex items-center gap-2">
            <StatCard
              label="Activos"
              value={activos}
              icon={CheckCircle2}
              accent
            />
            <StatCard
              label="Por vencer"
              value={porVencer7}
              icon={AlertTriangle}
            />
            <StatCard label="Vencidos" value={vencidos} icon={XCircle} />
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={14} />
              Registrar lote
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
            placeholder="Buscar por lote, almacén o proveedor..."
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200 shadow-sm">
          {[
            { v: "all", l: "Todos" },
            { v: "ACTIVO", l: "Activos" },
            { v: "VENCIDO", l: "Vencidos" },
            { v: "AGOTADO", l: "Agotados" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltroEstado(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-dm font-medium transition-all whitespace-nowrap ${filtroEstado === v ? "bg-amber-500 text-white shadow-sm" : "text-stone-400 hover:text-stone-700"}`}
            >
              {l}
            </button>
          ))}
        </div>

        <select
          value={porVencer}
          onChange={(e) => setPorVencer(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-600 outline-none appearance-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all shadow-sm"
        >
          <option value="">Todos los vencimientos</option>
          <option value="7">Vencen en 7 días</option>
          <option value="15">Vencen en 15 días</option>
          <option value="30">Vencen en 30 días</option>
        </select>
      </div>

      {/* Alertas banner si hay vencidos/por vencer */}
      {(vencidos > 0 || porVencer7 > 0) && !loading && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            vencidos > 0
              ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <AlertTriangle
            size={15}
            className={vencidos > 0 ? "text-red-500" : "text-amber-500"}
          />
          <p
            className={`text-sm font-dm ${vencidos > 0 ? "text-red-700" : "text-amber-700"}`}
          >
            {vencidos > 0
              ? `⚠ ${vencidos} lote(s) vencido(s). Retíralos del inventario.`
              : `${porVencer7} lote(s) vencen en menos de 7 días.`}
          </p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Sin lotes"
          description="Registra el primer lote de ingrediente."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={14} />
              Registrar lote
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => (
            <LoteCard key={l.id} lote={l} />
          ))}
        </div>
      )}

      <ModalRegistrarLote
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
