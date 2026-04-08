// src/shared/components/ui/index.jsx
import { Loader2, ChevronRight } from "lucide-react";

// ── Tokens de color (light mode) ───────────────────────────────────────────
// amber-500  = #F59E0B  (acento principal)
// amber-600  = #D97706  (hover)
// stone-100  = #F5F5F4  (bg superficie)
// stone-200  = #E7E5E4  (bordes)
// stone-400  = #A8A29E  (texto muted)
// stone-700  = #44403C  (texto secundario)
// stone-900  = #1C1917  (texto primario)

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ children, variant = "default", size = "sm" }) {
  const variants = {
    default: "bg-stone-100 text-stone-500 border-stone-200",
    amber: "bg-amber-50  text-amber-700  border-amber-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50    text-red-600    border-red-200",
    blue: "bg-blue-50   text-blue-700   border-blue-200",
    muted: "bg-stone-50  text-stone-400  border-stone-200",
  };
  const sizes = {
    xs: "px-1.5 py-0.5 text-[9px] gap-1",
    sm: "px-2.5 py-1   text-[10px] gap-1.5",
    md: "px-3   py-1.5 text-xs gap-2",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full font-dm font-semibold border ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
}

// ── Button ─────────────────────────────────────────────────────────────────
export function Button({
  children,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  className = "",
  ...props
}) {
  const variants = {
    primary:
      "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200 hover:shadow-amber-300",
    secondary:
      "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300",
    ghost: "text-stone-500 hover:text-stone-800 hover:bg-stone-100",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
    outline:
      "bg-transparent border border-stone-200 text-stone-700 hover:border-amber-300 hover:text-amber-700",
    dark: "bg-stone-900 text-white hover:bg-stone-800",
  };
  const sizes = {
    xs: "px-2.5 py-1.5 text-[11px] gap-1",
    sm: "px-3   py-2   text-xs gap-1.5",
    md: "px-4   py-2.5 text-sm gap-2",
    lg: "px-5   py-3   text-sm gap-2.5",
  };
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl font-dm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={13} className="animate-spin" />}
      {children}
    </button>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────
export function Input({
  label,
  icon: Icon,
  hint,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-dm font-semibold text-stone-600">
          {Icon && <Icon size={11} className="text-amber-500" />}
          {label}
        </label>
      )}
      <input
        className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${error ? "border-red-300 ring-1 ring-red-200" : "border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"} text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all duration-150 shadow-sm ${className}`}
        {...props}
      />
      {hint && !error && (
        <p className="text-[11px] font-dm text-stone-400 pl-1">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] font-dm text-red-500 pl-1">{error}</p>
      )}
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────
export function Textarea({
  label,
  icon: Icon,
  hint,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-dm font-semibold text-stone-600">
          {Icon && <Icon size={11} className="text-amber-500" />}
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${error ? "border-red-300" : "border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"} text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all resize-none shadow-sm ${className}`}
        {...props}
      />
      {hint && !error && (
        <p className="text-[11px] font-dm text-stone-400 pl-1">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] font-dm text-red-500 pl-1">{error}</p>
      )}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────────────────
export function Select({
  label,
  icon: Icon,
  children,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-dm font-semibold text-stone-600">
          {Icon && <Icon size={11} className="text-amber-500" />}
          {label}
        </label>
      )}
      <select
        className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${error ? "border-red-300" : "border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"} text-sm font-dm text-stone-900 outline-none appearance-none transition-all cursor-pointer shadow-sm ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-[11px] font-dm text-red-500 pl-1">{error}</p>
      )}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({
  children,
  className = "",
  hover = false,
  accent = false,
  padding = true,
}) {
  return (
    <div
      className={`rounded-2xl bg-white border border-stone-200 shadow-card ${hover ? "hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" : ""} ${accent ? "border-t-2 border-t-amber-400" : ""} ${padding ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// ── PageHeader ─────────────────────────────────────────────────────────────
export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-4 h-0.5 bg-amber-500 rounded-full" />
            <span className="text-[10px] font-dm font-bold tracking-[0.18em] uppercase text-amber-600">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-stone-900 leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-stone-400 text-sm mt-1 font-dm">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2 flex-wrap">{action}</div>
      )}
    </div>
  );
}

// ── Breadcrumb ─────────────────────────────────────────────────────────────
export function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs font-dm text-stone-400 mb-5">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={12} className="text-stone-300" />}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="hover:text-stone-700 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-stone-700 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ── EmptyState ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50">
      <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center">
        <Icon size={22} className="text-stone-300" />
      </div>
      <div className="text-center">
        <p className="font-playfair text-stone-700 font-semibold text-lg">
          {title}
        </p>
        {description && (
          <p className="font-dm text-stone-400 text-sm mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
export function Skeleton({ className }) {
  return (
    <div className={`animate-pulse bg-stone-100 rounded-xl ${className}`} />
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, accent = false, trend }) {
  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-3 ${accent ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-stone-200 shadow-card"}`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? "bg-white/20" : "bg-amber-50 border border-amber-100"}`}
        >
          <Icon
            size={16}
            className={accent ? "text-white" : "text-amber-500"}
          />
        </div>
        {trend !== undefined && (
          <span
            className={`text-[10px] font-dm font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
          >
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <div>
        <p
          className={`font-playfair text-3xl font-bold ${accent ? "text-white" : "text-stone-900"}`}
        >
          {value}
        </p>
        <p
          className={`text-xs font-dm mt-0.5 ${accent ? "text-white/70" : "text-stone-400"}`}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = "md" }) {
  if (!open) return null;
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className={`relative w-full ${sizes[size]} rounded-2xl bg-white border border-stone-200 shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h2 className="font-playfair text-stone-900 font-semibold text-lg">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-stone-300 hover:text-stone-600 transition w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────
export function Divider({ label }) {
  if (!label) return <div className="h-px bg-stone-100" />;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-stone-100" />
      <span className="text-[10px] font-dm text-stone-300 uppercase tracking-widest">
        {label}
      </span>
      <div className="flex-1 h-px bg-stone-100" />
    </div>
  );
}

// ── StepIndicator ──────────────────────────────────────────────────────────
export function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-dm font-semibold transition-all ${
              i === current
                ? "bg-amber-500 text-white shadow-sm shadow-amber-200"
                : i < current
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-stone-100 text-stone-400"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i === current
                  ? "bg-white/20"
                  : i < current
                    ? "bg-emerald-100"
                    : "bg-stone-200"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </span>
            <span className="hidden sm:block">{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-px mx-1 ${i < current ? "bg-emerald-300" : "bg-stone-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
