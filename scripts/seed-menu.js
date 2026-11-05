const producto = require('../src/models/producto');

// Precios en CENTAVOS (ej. $120.00 -> 12000)
const menu = [
  { nombre: 'Hamburguesa Clásica', categoria: 'hamburguesa', precio: 12000 },
  { nombre: 'Hamburguesa Doble', categoria: 'hamburguesa', precio: 15700 },
  { nombre: 'Hamburguesa Triple', categoria: 'hamburguesa', precio: 18000 },
  { nombre: 'Hamburguesa BBQ', categoria: 'hamburguesa', precio: 17500 },
  { nombre: 'Hamburguesa de Pollo', categoria: 'hamburguesa', precio: 14700 },

  { nombre: 'Hot Dog Clásico', categoria: 'hotdog', precio: 12000 },
  { nombre: 'Hot Dog Doble', categoria: 'hotdog', precio: 15700 },
  { nombre: 'Hot Dog Triple', categoria: 'hotdog', precio: 18000 },
  { nombre: 'Hot Dog BBQ', categoria: 'hotdog', precio: 17500 },
  { nombre: 'Hot Dog de Pollo', categoria: 'hotdog', precio: 14700 },

  { nombre: 'Boneless BBQ', categoria: 'boneless', precio: 9700 },
  { nombre: 'Boneless Mango Habanero', categoria: 'boneless', precio: 11500 },
  { nombre: 'Boneless Buffalo', categoria: 'boneless', precio: 9700 },
  { nombre: 'Boneless Tamarindo', categoria: 'boneless', precio: 10700 },
  { nombre: 'Boneless Lemon Pepper', categoria: 'boneless', precio: 11000 },

  { nombre: 'Té Santea 500ml', categoria: 'bebida', precio: 2500 },
  { nombre: 'Té Jazte 600ml', categoria: 'bebida', precio: 2500 },
  { nombre: 'Coca-Cola 600ml', categoria: 'bebida', precio: 3000 },
  { nombre: 'Agua de Sabor 500ml', categoria: 'bebida', precio: 2500 },
  { nombre: 'Agua de Sabor 1L', categoria: 'bebida', precio: 3500 },
];

let creados = 0;
for (const item of menu) {
  try {
    producto.crear(item);
    creados++;
  } catch (err) {
    console.error(`No se pudo crear "${item.nombre}": ${err.message}`);
  }
}
console.log(`Listo: ${creados} de ${menu.length} productos creados.`);
