import { useContext } from 'react';
import { TemaContext } from './contextos';

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error('useTema debe usarse dentro de <TemaProvider>');
  return ctx;
}
