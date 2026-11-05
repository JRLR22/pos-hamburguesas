# Frontend: POS Hamburguesas

Interfaz en React 19 + Vite + Tailwind CSS 4. La documentación completa del proyecto está en el [README principal](../README.md).

```bash
npm install
cp .env.example .env   # VITE_API_URL apunta al backend
npm run dev
```

## Estructura

```
src/
├── pages/       Login, Pos (caja), Cocina, Reportes, Admin
├── context/     sesión (usuario actual) y tema claro/oscuro
├── lib/
│   ├── api.js        cliente HTTP: access token en memoria y refresco automático en un solo vuelo
│   ├── useRecurso.js hook de carga de datos (polling opcional, ignora respuestas viejas)
│   ├── dinero.js     único punto de conversión centavos ↔ pesos
│   ├── fechas.js     formato de fechas en la zona del negocio
│   └── constantes.js catálogos compartidos (categorías, orígenes, métodos de pago)
└── components/
```
