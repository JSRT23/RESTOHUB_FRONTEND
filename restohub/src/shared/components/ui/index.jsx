// src/shared/components/ui/index.jsx
import { Loader2, ChevronRight } from "lucide-react";

// Acentos verdes sobre blanco
const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  700: "#0B2B26",
  900: "#051F20",
};

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ children, variant = "default", size = "sm" }) {
  const variants = {
    default: "bg-stone-100 text-stone-500 border border-stone-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    red: "bg-red-50 text-red-600 border border-red-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    muted: "bg-stone-50 text-stone-400 border border-stone-200",
  };
  const sizes = {
    xs: "px-1.5 py-0.5 text-[9px] gap-1",
    sm: "px-2.5 py-1 text-[10px] gap-1.5",
    md: "px-3 py-1.5 text-xs gap-2",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full font-dm font-semibold ${variants[variant] || variants.default} ${sizes[size]}`}
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
  const base =
    "inline-flex items-center justify-center rounded-xl font-dm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary: `text-white hover:opacity-90`,
    secondary: `bg-white text-stone-600 border border-stone-200 hover:border-[${G[300]}] hover:text-[${G[300]}]`,
    ghost: `text-stone-500 hover:text-stone-800 hover:bg-stone-50`,
    danger: `bg-red-50 text-red-600 border border-red-200 hover:bg-red-100`,
    outline: `bg-transparent border text-stone-600 hover:text-[${G[300]}]`,
    dark: `bg-stone-900 text-white hover:bg-stone-800`,
  };

  const sizes = {
    xs: "px-2.5 py-1.5 text-[11px] gap-1",
    sm: "px-3 py-2 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-5 py-3 text-sm gap-2.5",
  };

  // Estilos inline para el verde (evitar purge de Tailwind con valores dinámicos)
  const inlineStyle =
    variant === "primary"
      ? { background: G[900] }
      : variant === "secondary" || variant === "outline"
        ? {}
        : {};

  return (
    <button
      disabled={disabled || loading}
      style={inlineStyle}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
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
        <label className="flex items-center gap-1.5 text-xs font-dm font-semibold text-stone-500">
          {Icon && <Icon size={11} style={{ color: G[300] }} />}
          {label}
        </label>
      )}
      <input
        className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${error ? "border-red-300" : "border-stone-200"} text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all shadow-sm ${className}`}
        onFocus={(e) => {
          e.target.style.borderColor = "transparent";
          e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "#fca5a5" : "#e2e8f0";
          e.target.style.boxShadow = "none";
        }}
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
        <label className="flex items-center gap-1.5 text-xs font-dm font-semibold text-stone-500">
          {Icon && <Icon size={11} style={{ color: G[300] }} />}
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${error ? "border-red-300" : "border-stone-200"} text-sm font-dm text-stone-900 placeholder:text-stone-300 outline-none transition-all resize-none shadow-sm ${className}`}
        onFocus={(e) => {
          e.target.style.borderColor = "transparent";
          e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e2e8f0";
          e.target.style.boxShadow = "none";
        }}
        {...props}
      />
      {hint && (
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
        <label className="flex items-center gap-1.5 text-xs font-dm font-semibold text-stone-500">
          {Icon && <Icon size={11} style={{ color: G[300] }} />}
          {label}
        </label>
      )}
      <select
        className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${error ? "border-red-300" : "border-stone-200"} text-sm font-dm text-stone-900 outline-none appearance-none cursor-pointer transition-all shadow-sm ${className}`}
        onFocus={(e) => {
          e.target.style.borderColor = "transparent";
          e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e2e8f0";
          e.target.style.boxShadow = "none";
        }}
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
      style={accent ? { borderTop: `2px solid ${G[300]}` } : {}}
      className={`rounded-2xl bg-white border border-stone-200 shadow-sm
        ${hover ? "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" : ""}
        ${padding ? "p-5" : ""}
        ${className}`}
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
            <div
              style={{ background: G[300] }}
              className="w-4 h-0.5 rounded-full"
            />
            <span
              style={{ color: G[300] }}
              className="text-[10px] font-dm font-bold tracking-[0.18em] uppercase"
            >
              {eyebrow}
            </span>
          </div>
        )}
        <h1
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="text-2xl md:text-3xl font-bold text-stone-900 leading-tight"
        >
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
              className="hover:text-stone-700 transition"
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
        <p
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="text-stone-700 font-semibold text-lg"
        >
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
export function StatCard({ label, value, icon: Icon, accent = false }) {
  return (
    <div
      style={accent ? { borderColor: G[300], background: `${G[50]}55` } : {}}
      className={`rounded-2xl border p-4 flex flex-col gap-3 bg-white ${!accent ? "border-stone-200 shadow-sm" : ""}`}
    >
      <div
        style={{ background: accent ? `${G[50]}` : "#f8fafc" }}
        className="w-9 h-9 rounded-xl flex items-center justify-center border border-stone-100"
      >
        <Icon size={16} style={{ color: accent ? G[300] : "#94a3b8" }} />
      </div>
      <div>
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            color: accent ? G[500] : "#1c1917",
          }}
          className="text-3xl font-bold"
        >
          {value}
        </p>
        <p className="text-xs font-dm text-stone-400 mt-0.5">{label}</p>
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
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className={`relative w-full ${sizes[size]} rounded-2xl bg-white border border-stone-200 shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: G[900] }} className="h-1" />
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h2
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-stone-900 font-semibold text-lg"
            >
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
            style={
              i === current
                ? { background: G[900], color: "white" }
                : i < current
                  ? {
                      background: "#f0fdf4",
                      color: "#16a34a",
                      border: "1px solid #bbf7d0",
                    }
                  : {
                      background: "#f8fafc",
                      color: "#94a3b8",
                      border: "1px solid #e2e8f0",
                    }
            }
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-dm font-semibold transition-all"
          >
            <span
              style={
                i === current
                  ? { background: "rgba(255,255,255,0.2)" }
                  : { background: i < current ? "#dcfce7" : "#f1f5f9" }
              }
              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
            >
              {i < current ? "✓" : i + 1}
            </span>
            <span className="hidden sm:block">{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-px mx-1 ${i < current ? "bg-emerald-200" : "bg-stone-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
