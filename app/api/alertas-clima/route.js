import { geocodificarDireccion } from '../../../lib/geocodificar';
import { obtenerClimaNegocio } from '../../../lib/clima';

export async function POST(request) {
  const { direccion, lat, lon } = await request.json();

  if (lat && lon) {
    const clima = await obtenerClimaNegocio(lat, lon);
    return Response.json(clima);
  }

  if (!direccion) {
    return Response.json({ ok: false, error: 'Falta dirección o coordenadas.' }, { status: 400 });
  }

  const geo = await geocodificarDireccion(direccion);
  if (!geo.ok) {
    return Response.json(geo, { status: 400 });
  }

  const clima = await obtenerClimaNegocio(geo.lat, geo.lon);
  return Response.json({ ...clima, geo });
}