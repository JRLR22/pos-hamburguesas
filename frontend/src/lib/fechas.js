// Culiacán, Sinaloa: UTC-7 todo el año (misma zona que America/Mazatlan).
const ZONA = 'America/Mazatlan';

/** 'YYYY-MM-DD' de hoy en la zona del negocio (en-CA ya formatea así) */
export function hoyLocal() {
  return new Date().toLocaleDateString('en-CA', { timeZone: ZONA });
}

/** SQLite guarda 'YYYY-MM-DD HH:MM:SS' en UTC sin 'Z'; hay que normalizarlo
 *  antes de que el navegador lo interprete, o la hora sale corrida. */
export function horaLocal(fechaSQLite) {
  const iso = /[TZ]/.test(fechaSQLite) ? fechaSQLite : `${fechaSQLite.replace(' ', 'T')}Z`;
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: ZONA });
}
