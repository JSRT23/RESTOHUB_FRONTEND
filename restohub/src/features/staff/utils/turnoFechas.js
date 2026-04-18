// src/features/staff/utils/turnoFechas.js
// Helpers de fecha para queries de turnos.
// El staff_service filtra con fecha__gte / fecha__lte sobre DateField o DateTimeField.
// Formato seguro confirmado: "YYYY-MM-DD" para fechaDesde/fechaHasta (como usa GTurnosList).
// Para crear turno usa ISO completo sin Z: "YYYY-MM-DDTHH:MM:SS".

const pad = (n) => String(n).padStart(2, "0");

/** Convierte Date a ISO local SIN zona: "2026-04-17T11:46:00" */
export function toLocalISO(date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

/** Solo fecha "YYYY-MM-DD" — formato confirmado que acepta el backend para filtros */
function toDateStr(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Inicio del día de hoy como "YYYY-MM-DD" */
export function inicioHoy() {
  return toDateStr(new Date());
}

/** Fin del día de hoy como "YYYY-MM-DD" */
export function finHoy() {
  return toDateStr(new Date());
}

/** Inicio de la semana actual (lunes) como "YYYY-MM-DD" */
export function inicioSemana() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toDateStr(d);
}

/** Fin en N semanas como "YYYY-MM-DD" */
export function finSemanas(n = 2) {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + n * 7 - 1);
  return toDateStr(d);
}
