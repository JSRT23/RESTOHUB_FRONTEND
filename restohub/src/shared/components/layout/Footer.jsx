// src/shared/components/layout/Footer.jsx
export default function Footer() {
  return (
    <footer className="border-t border-stone-100 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center">
            <span className="text-white font-black text-[9px]">R</span>
          </div>
          <span className="text-stone-400 font-dm text-xs">
            RestoHub ·{" "}
            <span className="text-amber-500">Management Platform</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-dm text-stone-400">
            v1.0.0 · Microservicios activos
          </span>
        </div>
        <p className="text-[10px] font-dm text-stone-300">
          © {new Date().getFullYear()} Universidad Cooperativa de Colombia
        </p>
      </div>
    </footer>
  );
}
