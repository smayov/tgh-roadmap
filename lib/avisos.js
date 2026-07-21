import { Resend } from 'resend';

/**
 * Envía (si corresponde) el email de aviso de stock bajo mínimo para un negocio.
 * Devuelve { enviado: boolean, motivo?: string, error?: string, total?: number }
 */
export async function enviarAvisoStockNegocio(supabaseAdmin, negocio_id) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  // 1. Configuración de avisos
  const { data: config, error: errConfig } = await supabaseAdmin
    .from('configuracion_avisos')
    .select('*')
    .eq('negocio_id', negocio_id)
    .maybeSingle();

  if (errConfig) return { enviado: false, error: errConfig.message };
  if (!config || !config.email_activo || !config.email_destino) {
    return { enviado: false, motivo: 'Email no activado o sin destino configurado.' };
  }

  // 2. Nombre del negocio
  const { data: negocio } = await supabaseAdmin
    .from('negocios')
    .select('nombre')
    .eq('id', negocio_id)
    .maybeSingle();

  // 3. Productos bajo mínimo
  const { data: productos, error: errProd } = await supabaseAdmin
    .from('productos')
    .select('nombre, unidad, stock_actual, stock_minimo')
    .eq('negocio_id', negocio_id)
    .eq('activo', true);

  if (errProd) return { enviado: false, error: errProd.message };

  const bajoMinimo = (productos || []).filter((p) => p.stock_actual <= p.stock_minimo);
  if (bajoMinimo.length === 0) {
    return { enviado: false, motivo: 'Ningún producto bajo mínimo.' };
  }

  // 4. Construir y enviar el email
  const filasHtml = bajoMinimo
    .map(
      (p) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e0d2;">${p.nombre}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e0d2;text-align:right;">${p.stock_actual} ${p.unidad}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e0d2;text-align:right;color:#5c6b61;">mín. ${p.stock_minimo} ${p.unidad}</td>
      </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
      <div style="background:#0D3A28;padding:20px 24px;border-radius:12px 12px 0 0;">
        <div style="color:#fff;font-size:18px;font-weight:bold;">◆ Tu Gestor Hostelero</div>
        <div style="color:#BCE05A;font-size:13px;margin-top:2px;">Aviso de stock bajo mínimo</div>
      </div>
      <div style="border:1px solid #e2e0d2;border-top:none;border-radius:0 0 12px 12px;padding:20px 24px;">
        <p style="font-size:15px;color:#15271C;">
          Hola${negocio?.nombre ? `, ${negocio.nombre}` : ''} — tienes
          <b>${bajoMinimo.length} producto${bajoMinimo.length === 1 ? '' : 's'}</b> por debajo del stock mínimo:
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;">
          <thead>
            <tr style="background:#F3F1E7;">
              <th style="padding:8px 12px;text-align:left;">Producto</th>
              <th style="padding:8px 12px;text-align:right;">Stock actual</th>
              <th style="padding:8px 12px;text-align:right;">Mínimo</th>
            </tr>
          </thead>
          <tbody>${filasHtml}</tbody>
        </table>
        <p style="font-size:12px;color:#8FA79A;margin-top:20px;">
          Este es un aviso automático de tu módulo de Control de Stock. Entra en la app para revisarlo o hacer el pedido.
        </p>
      </div>
    </div>
  `;

  const { error: errEnvio } = await resend.emails.send({
    from: 'Tu Gestor Hostelero <avisos@avisos.tugestorhostelero.es>',
    to: config.email_destino,
    subject: `⚠️ ${bajoMinimo.length} producto${bajoMinimo.length === 1 ? '' : 's'} bajo mínimo de stock`,
    html,
  });

  if (errEnvio) return { enviado: false, error: errEnvio.message };

  return { enviado: true, total: bajoMinimo.length };
}
