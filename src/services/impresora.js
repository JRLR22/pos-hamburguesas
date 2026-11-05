const { printer: ThermalPrinter, types: PrinterTypes } = require('node-thermal-printer');

/**
 * Configuración de la impresora vía variables de entorno, para no
 * hardcodear la interfaz (cada negocio/impresora puede diferir).
 * Ejemplos de PRINTER_INTERFACE:
 *   Windows USB:  "printer:NombreDeLaImpresora"  (ver nombre en Panel de Control > Impresoras)
 *   Linux USB:    "usb:0x0483:0x070b" o "/dev/usb/lp0"
 *   Red/Ethernet: "tcp://192.168.1.50"
 */
function crearImpresora() {
  return new ThermalPrinter({
    type: PrinterTypes.EPSON, // compatible con la mayoría de impresoras térmicas genéricas
    interface: process.env.PRINTER_INTERFACE || 'printer:POS-58',
    options: { timeout: 3000 },
    removeSpecialCharacters: false,
    lineCharacter: '-',
  });
}

/**
 * Imprime un texto ya formateado (comanda o ticket).
 * Nunca lanza para arriba: un fallo de impresora NO debe tumbar la venta,
 * que ya quedó guardada en la base de datos antes de llegar aquí.
 */
async function imprimirTexto(texto) {
  try {
    const printer = crearImpresora();

    const conectada = await printer.isPrinterConnected();
    if (!conectada) {
      return { exito: false, error: 'Impresora no conectada o no encontrada' };
    }

    printer.alignCenter();
    printer.println(texto);
    printer.cut();

    await printer.execute();
    return { exito: true };
  } catch (err) {
    // Log para el negocio (revisar cable/papel), pero no interrumpe el flujo de venta
    console.error('Error al imprimir:', err.message);
    return { exito: false, error: err.message };
  }
}

module.exports = { imprimirTexto };
