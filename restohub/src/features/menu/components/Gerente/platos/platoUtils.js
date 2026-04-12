// src/features/gerente/menu/platos/platoUtils.js

export const G = {
  50: "#DAF1DE",
  100: "#8EB69B",
  300: "#235347",
  500: "#163832",
  900: "#051F20",
};

export const fmt = (v, moneda = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(v);

export const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-dm text-stone-900 placeholder:text-stone-400 outline-none transition-all shadow-sm";

export const fi = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = `0 0 0 2px ${G[300]}`;
};

export const fb = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};
