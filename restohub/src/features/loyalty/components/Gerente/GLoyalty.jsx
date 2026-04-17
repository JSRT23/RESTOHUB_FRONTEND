// src/features/loyalty/components/Gerente/GLoyalty.jsx
// Gerente Local — módulo loyalty.
// Tabs: Promociones (ve globales + sus locales, crea locales) | Cupones | Puntos (consulta por cliente)

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../../../../app/auth/AuthContext";
import {
  Star,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Tag,
  Gift,
  Ticket,
  Users,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Globe,
  Building2,
  AlertTriangle,
  RefreshCw,
  Percent,
  Hash,
  Coins,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  GET_PROMOCIONES,
  CREAR_PROMOCION,
  ACTIVAR_PROMOCION,
  DESACTIVAR_PROMOCION,
  GET_CUPONES,
  CREAR_CUPON,
  GET_PUNTOS_CLIENTE,
} from "../../graphql/operations";
import {
  PageHeader,
  Button,
  EmptyState,
  Skeleton,
  Badge,
  Modal,
} from "../../../../shared/components/ui";

const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

const icls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-400 outline-none transition-all shadow-sm";
const fi = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
};
const fb = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-dm font-semibold text-stone-500">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const NIVEL_META = {
  bronce: { label: "Bronce", bg: "#fef3c7", text: "#d97706", icon: "🥉" },
  plata: { label: "Plata", bg: "#f1f5f9", text: "#64748b", icon: "🥈" },
  oro: { label: "Oro", bg: "#fefce8", text: "#ca8a04", icon: "🥇" },
  diamante: { label: "Diamante", bg: "#eff6ff", text: "#3b82f6", icon: "💎" },
};

const BENEFICIO_META = {
  descuento_pct: { label: "Descuento %", icon: Percent, color: "#3b82f6" },
  descuento_monto: { label: "Descuento fijo", icon: Coins, color: "#8b5cf6" },
  puntos_extra: { label: "Puntos extra", icon: Star, color: G[300] },
  regalo: { label: "Regalo", icon: Gift, color: "#ec4899" },
  "2x1": { label: "2×1", icon: Hash, color: "#f59e0b" },
};

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — PROMOCIONES
// ═══════════════════════════════════════════════════════════════════════════

function ModalCrearPromocion({ open, onClose, restauranteId }) {
  const INIT = {
    nombre: "",
    descripcion: "",
    tipoBeneficio: "descuento_pct",
    valor: "",
    puntosBonus: "",
    fechaInicio: "",
    fechaFin: "",
  };
  const [form, setForm] = useState({ ...INIT });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [crear, { loading }] = useMutation(CREAR_PROMOCION, {
    refetchQueries: ["GetPromociones"],
  });

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.fechaInicio || !form.fechaFin) return;
    try {
      const variables = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion || null,
        alcance: "local",
        restauranteId,
        tipoBeneficio: form.tipoBeneficio,
        valor:
          form.tipoBeneficio !== "puntos_extra"
            ? parseFloat(form.valor) || 0
            : 0,
        puntosBonus:
          form.tipoBeneficio === "puntos_extra"
            ? parseInt(form.puntosBonus) || 0
            : 0,
        fechaInicio: new Date(form.fechaInicio).toISOString(),
        fechaFin: new Date(form.fechaFin).toISOString(),
      };
      const { data } = await crear({ variables });
      if (!data?.crearPromocion?.ok)
        throw new Error(data?.crearPromocion?.error ?? "Error");
      Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Promoción creada",
        timer: 1500,
        timerProgressBar: true,
        confirmButtonColor: G[900],
      });
      onClose();
      setForm({ ...INIT });
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    }
  };

  const necesitaValor = !["puntos_extra"].includes(form.tipoBeneficio);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva promoción local"
      size="md"
    >
      <div className="space-y-4">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-dm"
          style={{ background: G[50], borderColor: G[100], color: G[300] }}
        >
          <Building2 size={12} /> Se creará como promoción local — solo visible
          para tu restaurante.
        </div>

        <Field label="Nombre" required>
          <input
            value={form.nombre}
            onChange={set("nombre")}
            placeholder="Ej: 2×1 los martes, Descuento happy hour..."
            className={icls}
            onFocus={fi}
            onBlur={fb}
          />
        </Field>

        <Field label="Descripción (opcional)">
          <input
            value={form.descripcion}
            onChange={set("descripcion")}
            placeholder="Describe la promoción a los clientes..."
            className={icls}
            onFocus={fi}
            onBlur={fb}
          />
        </Field>

        <Field label="Tipo de beneficio" required>
          <select
            value={form.tipoBeneficio}
            onChange={set("tipoBeneficio")}
            className={icls + " appearance-none cursor-pointer"}
            onFocus={fi}
            onBlur={fb}
          >
            <option value="descuento_pct">Descuento porcentual (%)</option>
            <option value="descuento_monto">Descuento en monto fijo</option>
            <option value="puntos_extra">Puntos extra</option>
            <option value="regalo">Producto de regalo</option>
            <option value="2x1">2×1</option>
          </select>
        </Field>

        {necesitaValor && (
          <Field
            label={
              form.tipoBeneficio === "descuento_pct"
                ? "Porcentaje (%)"
                : "Monto de descuento"
            }
            required
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.valor}
              onChange={set("valor")}
              placeholder={
                form.tipoBeneficio === "descuento_pct"
                  ? "Ej: 15 (= 15%)"
                  : "Ej: 5000"
              }
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
        )}

        {form.tipoBeneficio === "puntos_extra" && (
          <Field label="Puntos bonus a otorgar" required>
            <input
              type="number"
              min="1"
              step="1"
              value={form.puntosBonus}
              onChange={set("puntosBonus")}
              placeholder="Ej: 100"
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha inicio" required>
            <input
              type="datetime-local"
              value={form.fechaInicio}
              onChange={set("fechaInicio")}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
          <Field label="Fecha fin" required>
            <input
              type="datetime-local"
              value={form.fechaFin}
              onChange={set("fechaFin")}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={loading}
            disabled={
              !form.nombre.trim() || !form.fechaInicio || !form.fechaFin
            }
            onClick={handleSave}
          >
            Crear promoción
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PromocionCard({ promo, onToggle, toggling, restauranteId }) {
  const esPropia =
    promo.alcance === "local" && promo.restauranteId === restauranteId;
  const beneficio =
    BENEFICIO_META[promo.tipoBeneficio] ?? BENEFICIO_META.descuento_pct;
  const BenIcon = beneficio.icon;

  const ahora = new Date();
  const inicio = new Date(promo.fechaInicio);
  const fin = new Date(promo.fechaFin);
  const vigente = promo.activa && inicio <= ahora && fin >= ahora;
  const vencida = fin < ahora;

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:-translate-y-0.5 transition-all duration-200"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      <div
        className="h-1"
        style={{
          background: vigente
            ? `linear-gradient(90deg,${G[300]},${G[100]})`
            : vencida
              ? "linear-gradient(90deg,#d4d4d4,#e5e5e5)"
              : `linear-gradient(90deg,${beneficio.color}88,${beneficio.color}44)`,
        }}
      />

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${beneficio.color}18` }}
            >
              <BenIcon size={15} style={{ color: beneficio.color }} />
            </div>
            <div className="min-w-0">
              <p className="font-dm text-stone-900 font-semibold text-sm truncate">
                {promo.nombre}
              </p>
              <p
                className="text-[10px] font-dm"
                style={{ color: beneficio.color }}
              >
                {beneficio.label}
                {promo.tipoBeneficio === "descuento_pct" &&
                  ` · ${promo.valor}%`}
                {promo.tipoBeneficio === "descuento_monto" &&
                  ` · -${promo.valor}`}
                {promo.tipoBeneficio === "puntos_extra" &&
                  ` · +${promo.puntosBonus} pts`}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-dm font-semibold px-2 py-1 rounded-full
              ${promo.alcance === "global" ? "bg-blue-50 text-blue-600" : promo.alcance === "local" ? "text-emerald-700" : "bg-purple-50 text-purple-600"}`}
              style={
                promo.alcance === "local"
                  ? { background: G[50], color: G[300] }
                  : {}
              }
            >
              {promo.alcance === "global" ? (
                <>
                  <Globe size={9} /> Global
                </>
              ) : promo.alcance === "local" ? (
                <>
                  <Building2 size={9} /> Local
                </>
              ) : (
                <>
                  <Tag size={9} /> {promo.alcanceDisplay}
                </>
              )}
            </span>
            <Badge
              variant={vigente ? "green" : vencida ? "red" : "default"}
              size="xs"
            >
              {vigente ? (
                <>
                  <CheckCircle2 size={9} /> Activa
                </>
              ) : vencida ? (
                <>
                  <XCircle size={9} /> Vencida
                </>
              ) : (
                <>
                  <AlertTriangle size={9} /> Inactiva
                </>
              )}
            </Badge>
          </div>
        </div>

        {promo.descripcion && (
          <p className="text-[11px] font-dm text-stone-400 line-clamp-2">
            {promo.descripcion}
          </p>
        )}

        <div className="flex items-center gap-2 text-[10px] font-dm text-stone-400">
          <CalendarDays size={10} />
          {inicio.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
          })}{" "}
          →{" "}
          {fin.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-stone-100">
          <span className="text-[10px] font-dm text-stone-400">
            {promo.totalAplicaciones ?? 0} aplicacion
            {promo.totalAplicaciones !== 1 ? "es" : ""}
          </span>

          {esPropia ? (
            <button
              onClick={() => onToggle(promo)}
              disabled={toggling === promo.id}
              className={`flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                promo.activa
                  ? "border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                  : "border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100"
              }`}
            >
              {toggling === promo.id ? (
                <Loader2 size={11} className="animate-spin" />
              ) : promo.activa ? (
                <>
                  <ToggleLeft size={13} /> Desactivar
                </>
              ) : (
                <>
                  <ToggleRight size={13} /> Activar
                </>
              )}
            </button>
          ) : (
            <span className="text-[10px] font-dm text-stone-300">
              Solo lectura
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TabPromociones({ restauranteId }) {
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("all");
  const [toggling, setToggling] = useState(null);

  const { data, loading } = useQuery(GET_PROMOCIONES, {
    variables: { restauranteId },
    fetchPolicy: "cache-and-network",
  });
  const [activar] = useMutation(ACTIVAR_PROMOCION, {
    refetchQueries: ["GetPromociones"],
  });
  const [desactivar] = useMutation(DESACTIVAR_PROMOCION, {
    refetchQueries: ["GetPromociones"],
  });

  const promociones = data?.promociones ?? [];
  const propias = promociones.filter(
    (p) => p.alcance === "local" && p.restauranteId === restauranteId,
  );
  const globales = promociones.filter((p) => p.alcance === "global");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return promociones.filter((p) => {
      if (q && !p.nombre.toLowerCase().includes(q)) return false;
      if (
        filtro === "local" &&
        !(p.alcance === "local" && p.restauranteId === restauranteId)
      )
        return false;
      if (filtro === "global" && p.alcance !== "global") return false;
      if (filtro === "activa" && !p.activa) return false;
      return true;
    });
  }, [promociones, search, filtro, restauranteId]);

  const handleToggle = async (promo) => {
    const { isConfirmed } = await Swal.fire({
      background: "#fff",
      title: promo.activa ? "¿Desactivar promoción?" : "¿Activar promoción?",
      html: `<span style="font-family:'DM Sans';color:#78716c">Cambiarás el estado de <b>${promo.nombre}</b>.</span>`,
      icon: promo.activa ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: promo.activa ? "#ef4444" : G[900],
      cancelButtonColor: "#e5e7eb",
      confirmButtonText: promo.activa ? "Desactivar" : "Activar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    setToggling(promo.id);
    try {
      const mutation = promo.activa ? desactivar : activar;
      const { data: res } = await mutation({ variables: { id: promo.id } });
      const r = promo.activa ? res?.desactivarPromocion : res?.activarPromocion;
      if (!r?.ok) throw new Error(r?.error ?? "Error");
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="text-xs font-dm text-stone-500">
          <span className="font-bold" style={{ color: G[300] }}>
            {propias.length}
          </span>{" "}
          propias ·{" "}
          <span className="font-bold text-blue-600">{globales.length}</span>{" "}
          globales visibles
        </div>
        <Button size="sm" onClick={() => setModal(true)}>
          <Plus size={13} /> Nueva promoción
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          onFocusCapture={(e) =>
            (e.currentTarget.style.boxShadow = `0 0 0 2px ${G[300]}`)
          }
          onBlurCapture={(e) =>
            (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)")
          }
        >
          <Search size={13} className="text-stone-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar promoción..."
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200">
          {[
            { v: "all", l: "Todas" },
            { v: "local", l: "Propias" },
            { v: "global", l: "Globales" },
            { v: "activa", l: "Activas" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-dm font-semibold transition-all"
              style={
                filtro === v
                  ? { background: G[900], color: "#fff" }
                  : { color: "#78716c" }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Star}
          title={search ? "Sin resultados" : "Sin promociones"}
          description={
            search
              ? `Sin coincidencias para "${search}".`
              : "Crea tu primera promoción local."
          }
          action={
            !search && (
              <Button size="sm" onClick={() => setModal(true)}>
                <Plus size={13} /> Nueva
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PromocionCard
              key={p.id}
              promo={p}
              onToggle={handleToggle}
              toggling={toggling}
              restauranteId={restauranteId}
            />
          ))}
        </div>
      )}

      <ModalCrearPromocion
        open={modal}
        onClose={() => setModal(false)}
        restauranteId={restauranteId}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — CUPONES
// ═══════════════════════════════════════════════════════════════════════════

function ModalCrearCupon({ open, onClose }) {
  const INIT = {
    clienteId: "",
    tipoDescuento: "porcentaje",
    valorDescuento: "",
    limiteUso: "1",
    fechaInicio: "",
    fechaFin: "",
    codigo: "",
  };
  const [form, setForm] = useState({ ...INIT });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [crear, { loading }] = useMutation(CREAR_CUPON, {
    refetchQueries: ["GetCupones"],
  });

  const handleSave = async () => {
    if (
      !form.tipoDescuento ||
      !form.valorDescuento ||
      !form.fechaInicio ||
      !form.fechaFin
    )
      return;
    try {
      const { data } = await crear({
        variables: {
          clienteId: form.clienteId || null,
          tipoDescuento: form.tipoDescuento,
          valorDescuento: parseFloat(form.valorDescuento),
          limiteUso: parseInt(form.limiteUso) || 1,
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin,
          codigo: form.codigo || null,
        },
      });
      if (!data?.crearCupon?.ok)
        throw new Error(data?.crearCupon?.error ?? "Error");
      await Swal.fire({
        background: "#fff",
        icon: "success",
        title: "Cupón creado",
        html: `<span style="font-family:'DM Sans';color:#78716c">Código: <b>${data.crearCupon.cupon.codigo}</b></span>`,
        confirmButtonColor: G[900],
      });
      onClose();
      setForm({ ...INIT });
    } catch (e) {
      Swal.fire({
        background: "#fff",
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: G[900],
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo cupón" size="sm">
      <div className="space-y-4">
        <Field label="Cliente (vacío = cupón genérico)">
          <input
            value={form.clienteId}
            onChange={set("clienteId")}
            placeholder="UUID del cliente..."
            className={icls}
            onFocus={fi}
            onBlur={fb}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo de descuento" required>
            <select
              value={form.tipoDescuento}
              onChange={set("tipoDescuento")}
              className={icls + " appearance-none cursor-pointer"}
              onFocus={fi}
              onBlur={fb}
            >
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="monto_fijo">Monto fijo</option>
            </select>
          </Field>
          <Field
            label={form.tipoDescuento === "porcentaje" ? "Porcentaje" : "Monto"}
            required
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.valorDescuento}
              onChange={set("valorDescuento")}
              placeholder={form.tipoDescuento === "porcentaje" ? "15" : "5000"}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Límite de usos">
            <input
              type="number"
              min="1"
              value={form.limiteUso}
              onChange={set("limiteUso")}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
          <Field label="Código (vacío = auto)">
            <input
              value={form.codigo}
              onChange={set("codigo")}
              placeholder="PROMO2024"
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha inicio" required>
            <input
              type="date"
              value={form.fechaInicio}
              onChange={set("fechaInicio")}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
          <Field label="Fecha fin" required>
            <input
              type="date"
              value={form.fechaFin}
              onChange={set("fechaFin")}
              className={icls}
              onFocus={fi}
              onBlur={fb}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={loading}
            disabled={
              !form.valorDescuento || !form.fechaInicio || !form.fechaFin
            }
            onClick={handleSave}
          >
            Crear cupón
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TabCupones() {
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");

  const { data, loading } = useQuery(GET_CUPONES, {
    fetchPolicy: "cache-and-network",
  });

  const cupones = data?.cupones ?? [];
  const filtered = cupones.filter((c) =>
    c.codigo.toLowerCase().includes(search.toLowerCase()),
  );
  const disponibles = cupones.filter((c) => c.disponible).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-dm text-stone-500">
          <span className="font-bold" style={{ color: G[300] }}>
            {disponibles}
          </span>{" "}
          disponibles ·{" "}
          <span className="font-bold text-stone-600">{cupones.length}</span> en
          total
        </span>
        <Button size="sm" onClick={() => setModal(true)}>
          <Plus size={13} /> Nuevo cupón
        </Button>
      </div>

      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 max-w-sm"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <Search size={13} className="text-stone-300 shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código..."
          className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Sin cupones"
          description="Crea el primer cupón para tus clientes."
          action={
            <Button size="sm" onClick={() => setModal(true)}>
              <Plus size={13} /> Nuevo
            </Button>
          }
        />
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                {["Código", "Tipo", "Valor", "Usos", "Vigencia", "Estado"].map(
                  (l) => (
                    <th
                      key={l}
                      className="py-2.5 px-4 text-left text-[10px] font-dm font-semibold text-stone-400 uppercase tracking-wide first:pl-5 last:pr-5"
                    >
                      {l}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors"
                >
                  <td className="py-3 pl-5 pr-4">
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-stone-100 text-stone-700">
                      {c.codigo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-dm text-stone-600">
                    {c.tipoDescuentoDisplay}
                  </td>
                  <td className="py-3 px-4 text-xs font-dm font-semibold text-stone-800">
                    {c.tipoDescuento === "porcentaje"
                      ? `${c.valorDescuento}%`
                      : `$${c.valorDescuento}`}
                  </td>
                  <td className="py-3 px-4 text-xs font-dm text-stone-500">
                    {c.usosActuales}/{c.limiteUso}
                  </td>
                  <td className="py-3 px-4 text-[10px] font-dm text-stone-400">
                    hasta{" "}
                    {new Date(c.fechaFin).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 pr-5 pl-4">
                    <Badge
                      variant={c.disponible ? "green" : "default"}
                      size="xs"
                    >
                      {c.disponible ? (
                        <>
                          <CheckCircle2 size={9} /> Disponible
                        </>
                      ) : (
                        <>
                          <XCircle size={9} /> No disponible
                        </>
                      )}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalCrearCupon open={modal} onClose={() => setModal(false)} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 — PUNTOS (consulta por cliente)
// ═══════════════════════════════════════════════════════════════════════════

function TabPuntos() {
  const [clienteId, setClienteId] = useState("");
  const [buscar, setBuscar] = useState("");
  const [skip, setSkip] = useState(true);

  const { data, loading, error } = useQuery(GET_PUNTOS_CLIENTE, {
    variables: { clienteId: buscar },
    skip,
    fetchPolicy: "network-only",
  });

  const handleBuscar = () => {
    if (!clienteId.trim()) return;
    setBuscar(clienteId.trim());
    setSkip(false);
  };

  const cuenta = data?.puntosCliente;
  const nivelMeta = cuenta
    ? (NIVEL_META[cuenta.nivel] ?? NIVEL_META.bronce)
    : null;

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex gap-2">
        <div
          className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          <Users size={13} className="text-stone-300 shrink-0" />
          <input
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
            placeholder="UUID del cliente..."
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-300 outline-none font-dm"
          />
        </div>
        <Button onClick={handleBuscar} disabled={!clienteId.trim()}>
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            "Consultar"
          )}
        </Button>
      </div>

      {!skip && !loading && !cuenta && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50">
          <XCircle size={14} className="text-stone-400" />
          <p className="text-sm font-dm text-stone-500">
            Este cliente aún no tiene cuenta de puntos.
          </p>
        </div>
      )}

      {cuenta && nivelMeta && (
        <div
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <div
            className="h-1"
            style={{ background: `linear-gradient(90deg,${G[300]},${G[100]})` }}
          />
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-dm text-stone-400 mb-1">Cliente</p>
                <p className="font-mono text-xs text-stone-500 break-all">
                  {cuenta.clienteId}
                </p>
              </div>
              <span
                className="text-3xl font-playfair font-bold"
                style={{ color: G[300] }}
              >
                {cuenta.saldo.toLocaleString("es-CO")}
                <span className="text-sm font-dm font-normal text-stone-400 ml-1">
                  pts
                </span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-3 rounded-xl border"
                style={{
                  background: nivelMeta.bg,
                  borderColor: `${nivelMeta.text}33`,
                }}
              >
                <p
                  className="text-[10px] font-dm font-semibold mb-1"
                  style={{ color: nivelMeta.text }}
                >
                  {nivelMeta.icon} Nivel actual
                </p>
                <p
                  className="text-lg font-playfair font-bold"
                  style={{ color: nivelMeta.text }}
                >
                  {nivelMeta.label}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-stone-100 bg-stone-50">
                <p className="text-[10px] font-dm font-semibold text-stone-400 mb-1">
                  Histórico total
                </p>
                <p className="text-lg font-playfair font-bold text-stone-700">
                  {cuenta.puntosTotalesHistoricos.toLocaleString("es-CO")}
                  <span className="text-xs font-dm font-normal text-stone-400 ml-1">
                    pts
                  </span>
                </p>
              </div>
            </div>

            <p className="text-[10px] font-dm text-stone-400">
              Últ. actualización:{" "}
              {new Date(cuenta.ultimaActualizacion).toLocaleString("es-CO")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: "promociones", label: "Promociones", icon: Star },
  { id: "cupones", label: "Cupones", icon: Ticket },
  { id: "puntos", label: "Puntos", icon: Coins },
];

export default function GLoyalty() {
  const { user } = useAuth();
  const restauranteId = user?.restauranteId;
  const [tab, setTab] = useState("promociones");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Loyalty"
        title="Fidelización"
        description="Gestiona tus promociones locales, cupones y consulta puntos de clientes."
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-dm font-semibold transition-all"
            style={
              tab === id
                ? { background: G[900], color: "#fff" }
                : { color: "#78716c" }
            }
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {tab === "promociones" && (
        <TabPromociones restauranteId={restauranteId} />
      )}
      {tab === "cupones" && <TabCupones />}
      {tab === "puntos" && <TabPuntos />}
    </div>
  );
}
