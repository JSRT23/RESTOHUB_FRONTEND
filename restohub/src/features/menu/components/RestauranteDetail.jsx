// restohub/src/features/menu/components/RestauranteDetail.jsx
import { useQuery } from "@apollo/client/react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Coins,
  Globe,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  Tag,
  Package,
  ChevronRight,
  AlertCircle,
  Clock,
  ImageOff,
} from "lucide-react";
import { Badge, Skeleton } from "../../../shared/components/ui";
import { GET_RESTAURANTE, GET_PRECIOS } from "../graphql/queries";

// ── InfoRow ────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-stone-400" />
      </div>
      <div>
        <p className="text-[10px] font-dm font-semibold uppercase tracking-wider text-stone-400">
          {label}
        </p>
        <p className="text-sm font-dm text-stone-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── PrecioSimpleCard ───────────────────────────────────────────────────────
function PrecioSimpleCard({ precio }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 transition-all">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-playfair text-stone-900 font-semibold">
          {new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: precio.moneda || "COP",
            maximumFractionDigits: 0,
          }).format(precio.precio)}
        </p>
        <p className="text-[10px] font-dm text-stone-400 mt-0.5">
          {precio.restauranteNombre} · desde{" "}
          {new Date(precio.fechaInicio).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <Badge variant={precio.estaVigente ? "amber" : "default"} size="xs">
        {precio.estaVigente ? "Vigente" : "No vigente"}
      </Badge>
      <Badge variant={precio.activo ? "green" : "red"} size="xs">
        {precio.activo ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
        {precio.activo ? "Activo" : "Inactivo"}
      </Badge>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function RestauranteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: rData,
    loading: rLoading,
    error: rError,
  } = useQuery(GET_RESTAURANTE, { variables: { id } });

  const { data: pData, loading: pLoading } = useQuery(GET_PRECIOS, {
    variables: { restauranteId: id },
    skip: !id,
  });

  const loading = rLoading || pLoading;

  if (loading) {
    return (
      <div className="font-dm space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (rError || !rData?.restaurante) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-dm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
          <AlertCircle className="text-red-400" size={24} />
        </div>
        <p className="font-playfair text-stone-900 text-lg font-semibold">
          Restaurante no encontrado
        </p>
        <p className="text-sm font-dm text-stone-400">
          {rError?.message ?? "No se pudo cargar el restaurante."}
        </p>
        <button
          onClick={() => navigate("/restaurantes")}
          className="flex items-center gap-2 text-sm font-dm text-stone-400 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft size={13} />
          Volver
        </button>
      </div>
    );
  }

  const r = rData.restaurante;
  const precios = pData?.precios ?? [];
  const vigentes = precios.filter((p) => p.activo && p.estaVigente).length;

  return (
    <div className="font-dm max-w-6xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/restaurantes")}
        className="flex items-center gap-2 text-stone-400 hover:text-stone-700 transition-colors text-sm group"
      >
        <ArrowLeft
          size={14}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        Restaurantes
        <ChevronRight size={12} className="text-stone-300" />
        <span className="text-stone-600">{r.nombre}</span>
      </button>

      {/* Top section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info card */}
        <div className="lg:col-span-1 rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-card">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-300" />
          <div className="p-5">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <span className="font-playfair text-amber-600 font-bold text-lg">
                  {r.nombre[0]}
                </span>
              </div>
              <div>
                <h1 className="font-playfair text-stone-900 font-bold text-xl leading-tight">
                  {r.nombre}
                </h1>
                <p className="text-[10px] font-dm text-stone-400 mt-0.5">
                  {r.id.slice(0, 16)}...
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <InfoRow
                icon={MapPin}
                label="Ubicación"
                value={`${r.ciudad}, ${r.pais}`}
              />
              <InfoRow icon={Building2} label="Dirección" value={r.direccion} />
              <InfoRow icon={Coins} label="Moneda" value={r.moneda} />
              <InfoRow icon={Globe} label="País" value={r.pais} />
            </div>

            <div className="h-px bg-stone-100 mb-4" />

            <div className="flex items-center justify-between">
              <span className="text-xs font-dm text-stone-400">Estado</span>
              <Badge variant={r.activo ? "green" : "red"} size="xs">
                {r.activo ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                {r.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <button
              onClick={() => navigate(`/restaurantes/${id}/menu`)}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <UtensilsCrossed size={14} />
              Ver menú
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4 content-start">
          {[
            {
              label: "Precios registrados",
              value: precios.length,
              icon: UtensilsCrossed,
            },
            { label: "Vigentes", value: vigentes, icon: CheckCircle2 },
            { label: "Moneda", value: r.moneda, icon: Coins },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-col gap-2 shadow-card"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Icon size={14} className="text-amber-500" />
              </div>
              <div>
                <p className="font-playfair text-2xl font-bold text-stone-900">
                  {value}
                </p>
                <p className="text-[11px] font-dm text-stone-400 mt-0.5">
                  {label}
                </p>
              </div>
            </div>
          ))}

          {/* Auditoría */}
          <div className="sm:col-span-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
            <p className="text-[10px] font-dm font-semibold tracking-widest uppercase text-stone-400 mb-3">
              Auditoría
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
                  Creado
                </p>
                <p className="text-sm font-dm text-stone-600 mt-1">
                  {r.fechaCreacion
                    ? new Date(r.fechaCreacion).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-dm text-stone-400 uppercase tracking-wider">
                  Actualizado
                </p>
                <p className="text-sm font-dm text-stone-600 mt-1">
                  {r.fechaActualizacion
                    ? new Date(r.fechaActualizacion).toLocaleDateString(
                        "es-CO",
                        { day: "2-digit", month: "long", year: "numeric" },
                      )
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Precios section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-px bg-amber-500" />
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-amber-600">
                Menú del restaurante
              </span>
            </div>
            <h2 className="font-playfair text-xl font-bold text-stone-900">
              Precios registrados
            </h2>
          </div>
          <span className="text-sm font-dm text-stone-400">
            {precios.length} precio{precios.length !== 1 ? "s" : ""}
          </span>
        </div>

        {precios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50">
            <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center">
              <UtensilsCrossed size={20} className="text-stone-300" />
            </div>
            <p className="font-dm text-stone-400 text-sm">
              Este restaurante no tiene precios registrados aún.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {precios.map((precio) => (
              <PrecioSimpleCard key={precio.id} precio={precio} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
