import { useTema } from '../context/useTema';

export default function BotonTema() {
  const { esOscuro, alternar } = useTema();
  return (
    <button
      onClick={alternar}
      aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="p-2 rounded-md border border-border text-ink-muted hover:text-ink hover:bg-surface transition-colors"
    >
      {esOscuro ? '☀️' : '🌙'}
    </button>
  );
}
