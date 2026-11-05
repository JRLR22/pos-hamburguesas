const { calcularSubtotal, calcularTotal } = require('../src/services/calculos');
const { generarComanda, generarTicket } = require('../src/services/comanda');

describe('calcularSubtotal', () => {
  test('producto simple sin extras', () => {
    expect(calcularSubtotal(12000, [], 1)).toBe(12000);
  });

  test('suma los extras antes de multiplicar por la cantidad', () => {
    // (120.00 + 15.00 + 0.00) * 3 = 405.00
    const extras = [
      { nombre: 'Queso', precio: 1500 },
      { nombre: 'Salsa', precio: 0 },
    ];
    expect(calcularSubtotal(12000, extras, 3)).toBe(40500);
  });

  test('nunca produce decimales aunque el precio sea "feo"', () => {
    expect(calcularSubtotal(15700, [{ nombre: 'Tocino', precio: 2350 }], 7)).toBe(126350);
  });

  test('rechaza cantidad cero o negativa', () => {
    expect(() => calcularSubtotal(12000, [], 0)).toThrow();
    expect(() => calcularSubtotal(12000, [], -2)).toThrow();
  });

  test('rechaza precios con decimales (deben venir en centavos enteros)', () => {
    expect(() => calcularSubtotal(120.5, [], 1)).toThrow();
    expect(() => calcularSubtotal(12000, [{ nombre: 'X', precio: 15.5 }], 1)).toThrow();
  });
});

describe('calcularTotal', () => {
  test('suma todas las líneas', () => {
    expect(calcularTotal([{ subtotal: 12000 }, { subtotal: 40500 }, { subtotal: 2500 }])).toBe(55000);
  });

  test('pedido vacío da cero', () => {
    expect(calcularTotal([])).toBe(0);
  });
});

const pedidoEjemplo = {
  id: 42,
  fecha: '2026-09-16 18:30:00',
  total: 27000,
  metodo_pago: 'efectivo',
  items: [
    {
      cantidad: 2,
      producto_nombre: 'Hamburguesa Clásica',
      subtotal: 24000,
      extras: [{ nombre: 'Queso', precio: 1500 }],
    },
    { cantidad: 1, producto_nombre: 'Coca-Cola 600ml', subtotal: 3000, extras: [] },
  ],
};

describe('comanda de cocina', () => {
  test('incluye productos y cantidades', () => {
    const texto = generarComanda(pedidoEjemplo);
    expect(texto).toContain('COMANDA #42');
    expect(texto).toContain('2 x Hamburguesa Clásica');
    expect(texto).toContain('+ Queso');
  });

  test('NO muestra precios ni el total (regla del negocio)', () => {
    const texto = generarComanda(pedidoEjemplo);
    expect(texto).not.toMatch(/\$/);
    expect(texto).not.toContain('TOTAL');
  });

  test('imprime la hora de Culiacán, no la UTC guardada en la BD', () => {
    // 18:30 UTC = 11:30 en Sinaloa (UTC-7)
    expect(generarComanda(pedidoEjemplo)).toContain('16/09/2026 11:30');
  });

  test('marca los pedidos de apps de reparto', () => {
    expect(generarComanda({ ...pedidoEjemplo, origen: 'uber_eats' })).toContain('** UBER EATS **');
    expect(generarComanda({ ...pedidoEjemplo, origen: 'local' })).not.toContain('**');
  });
});

describe('ticket del cliente', () => {
  test('muestra total y forma de pago', () => {
    const texto = generarTicket(pedidoEjemplo);
    expect(texto).toContain('TICKET #42');
    expect(texto).toContain('$270.00');
    expect(texto).toContain('efectivo');
  });
});
