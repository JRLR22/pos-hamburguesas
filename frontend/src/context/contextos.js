import { createContext } from 'react';

// Separados de los providers para que Fast Refresh funcione (un archivo .jsx = solo componentes)
export const SesionContext = createContext(null);
export const TemaContext = createContext(null);
