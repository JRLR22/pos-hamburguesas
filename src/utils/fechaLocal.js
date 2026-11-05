// Culiacán, Sinaloa: UTC-7 fijo todo el año (México eliminó el horario de
// verano en 2022 excepto en la franja fronteriza; Sinaloa no aplica).
const OFFSET_HORAS = -7;

/** Fragmento SQL: convierte una columna de fecha (guardada en UTC) a hora local */
const sqlLocal = (columna = 'fecha') => `datetime(${columna}, '${OFFSET_HORAS} hours')`;

/** SQLite guarda 'YYYY-MM-DD HH:MM:SS' en UTC pero sin 'Z'; sin normalizarlo,
 *  JavaScript lo interpretaría en la zona horaria de la PC. */
function parsearUTC(fecha) {
  if (fecha instanceof Date) return fecha;
  return new Date(/[TZ]/.test(fecha) ? fecha : `${fecha.replace(' ', 'T')}Z`);
}

/** Convierte un timestamp UTC de la DB a un Date "corrido" a hora local */
function aFechaLocal(fechaUTC) {
  return new Date(parsearUTC(fechaUTC).getTime() + OFFSET_HORAS * 60 * 60 * 1000);
}

/** 'YYYY-MM-DD' del día de HOY en Culiacán (para defaults de reportes) */
function hoyLocal() {
  return aFechaLocal(new Date()).toISOString().slice(0, 10);
}

/** 'DD/MM/YYYY HH:MM' en hora local, para comandas y tickets impresos */
function textoFechaLocal(fechaUTC) {
  const iso = aFechaLocal(fechaUTC).toISOString(); // YYYY-MM-DDTHH:MM:SS...
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)} ${iso.slice(11, 16)}`;
}

module.exports = { OFFSET_HORAS, sqlLocal, aFechaLocal, hoyLocal, textoFechaLocal };
