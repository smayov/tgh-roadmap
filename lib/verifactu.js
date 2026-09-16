import crypto from 'node:crypto';

export function normalizarImporte(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) throw new Error('Importe no válido.');
  return Math.round(numero * 100) / 100;
}

export function normalizarLineas(lineas) {
  if (!Array.isArray(lineas) || lineas.length === 0) {
    throw new Error('La factura debe tener al menos una línea.');
  }

  return lineas.map((linea, indice) => {
    const descripcion = String(linea.descripcion || '').trim();
    const cantidad = Number(linea.cantidad);
    const precioUnitario = normalizarImporte(linea.precio_unitario);
    const tipoIva = Number(linea.tipo_iva);

    if (!descripcion) throw new Error(`Falta la descripción de la línea ${indice + 1}.`);
    if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error(`Cantidad no válida en la línea ${indice + 1}.`);
    if (!Number.isFinite(tipoIva) || tipoIva < 0 || tipoIva > 100) throw new Error(`IVA no válido en la línea ${indice + 1}.`);

    const base = normalizarImporte(cantidad * precioUnitario);
    const cuotaIva = normalizarImporte(base * tipoIva / 100);

    return {
      descripcion,
      cantidad,
      precio_unitario: precioUnitario,
      tipo_iva: tipoIva,
      base,
      cuota_iva: cuotaIva,
      total: normalizarImporte(base + cuotaIva),
    };
  });
}

export function calcularTotales(lineas) {
  const base = normalizarImporte(lineas.reduce((total, linea) => total + linea.base, 0));
  const iva = normalizarImporte(lineas.reduce((total, linea) => total + linea.cuota_iva, 0));
  return { base, iva, total: normalizarImporte(base + iva) };
}

export function generarHuella({ negocioId, numero, fecha, cliente, lineas, totales, huellaAnterior }) {
  const contenido = JSON.stringify({
    negocio_id: negocioId,
    numero,
    fecha,
    cliente: cliente || null,
    lineas,
    totales,
    huella_anterior: huellaAnterior || null,
  });

  return crypto.createHash('sha256').update(contenido, 'utf8').digest('hex');
}

export function validarCliente(cliente) {
  if (!cliente || typeof cliente !== 'object') return null;

  const nombre = String(cliente.nombre || '').trim();
  const nif = String(cliente.nif || '').trim().toUpperCase();
  const direccion = String(cliente.direccion || '').trim();

  if (!nombre) throw new Error('Falta el nombre del cliente.');
  if (!nif) throw new Error('Falta el NIF del cliente.');

  return { nombre, nif, direccion: direccion || null };
}
