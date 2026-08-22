import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { calcularRiesgo } from './riesgoAuditoria';

/**
 * PDF de la Auditoría de Seguridad — Gescobit
 * Genera un documento descargable a partir del estado del formulario.
 */

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: '#262626', fontFamily: 'Helvetica' },
  header: { marginBottom: 24, paddingBottom: 16, borderBottom: '1.5 solid #1a1a1a' },
  brand: { fontSize: 9, color: '#737373', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 700, color: '#1a1a1a' },
  subtitle: { fontSize: 11, color: '#525252', marginTop: 4 },
  riskBadge: { position: 'absolute', top: 40, right: 40, textAlign: 'right' },
  riskLabel: { fontSize: 8, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.5 },
  riskValue: { fontSize: 13, fontWeight: 700, marginTop: 2 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, paddingBottom: 4, borderBottom: '0.5 solid #e5e5e5' },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: '55%', color: '#404040', paddingRight: 8 },
  value: { width: '45%', fontWeight: 700, color: '#1a1a1a' },
  gridRow: { flexDirection: 'row', marginBottom: 3 },
  gridLabel: { width: '35%', color: '#737373', paddingRight: 10 },
  gridValue: { width: '65%', color: '#1a1a1a' },
  hallazgoBox: { marginBottom: 8, padding: 8, backgroundColor: '#fafafa', borderRadius: 4, borderLeft: '3 solid #a3a3a3' },
  hallazgoBoxAlto: { borderLeftColor: '#dc2626' },
  hallazgoBoxMedio: { borderLeftColor: '#d97706' },
  hallazgoBoxBajo: { borderLeftColor: '#16a34a' },
  hallazgoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  hallazgoArea: { fontWeight: 700, fontSize: 10 },
  hallazgoNivel: { fontSize: 8, textTransform: 'uppercase', fontWeight: 700, color: '#737373' },
  hallazgoDesc: { color: '#404040', lineHeight: 1.4 },
  table: { marginTop: 4 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#1a1a1a', paddingVertical: 5, paddingHorizontal: 6 },
  tableHeaderCell: { color: '#ffffff', fontSize: 8, fontWeight: 700, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottom: '0.5 solid #e5e5e5' },
  colSolucion: { width: '46%' },
  colHoras: { width: '14%' },
  colPrecio: { width: '18%' },
  colTipo: { width: '22%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1 solid #1a1a1a' },
  totalLabel: { fontSize: 11, fontWeight: 700 },
  totalValue: { fontSize: 13, fontWeight: 700 },
  resumenBox: { padding: 10, backgroundColor: '#fafafa', borderRadius: 4, lineHeight: 1.5, color: '#262626' },
  firmasRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  firmaBox: { width: '45%' },
  firmaLine: { borderTop: '0.5 solid #a3a3a3', marginTop: 30, paddingTop: 4 },
  firmaLabel: { fontSize: 8, color: '#737373', textTransform: 'uppercase' },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#a3a3a3', borderTop: '0.5 solid #e5e5e5', paddingTop: 8 },
  riesgoNota: { fontSize: 8, color: '#dc2626', fontStyle: 'italic', marginTop: 2, marginBottom: 4,},
});

const NIVEL_RIESGO = { alto: 3, medio: 2, bajo: 1 };
const SINO = (v) => (v === 'si' ? 'Sí' : v === 'no' ? 'No' : v === 'no_se' ? 'No lo sé' : 'Sin responder');
const nivelBoxStyle = (nivel) =>
  nivel === 'alto' ? styles.hallazgoBoxAlto : nivel === 'bajo' ? styles.hallazgoBoxBajo : styles.hallazgoBoxMedio;

function Footer({ nombreNegocio }) {
  return (
    <View style={styles.footer} fixed>
      <Text>Gescobit · Auditoría de seguridad{nombreNegocio ? ` — ${nombreNegocio}` : ''}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export function AuditoriaPDF({ datos, alcance, accesos, datosRgpd, hallazgos, estimacion, plan, resumen, ACCESOS_ITEMS, DATOS_RGPD_ITEMS, totalEstimado }) {
  const { score, label: riesgoLabel, color: riesgoColor } = calcularRiesgo({ accesos, datosRgpd, ACCESOS_ITEMS, DATOS_RGPD_ITEMS });
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Gescobit</Text>
          <Text style={styles.title}>Auditoría de seguridad</Text>
          <Text style={styles.subtitle}>{datos.nombre || 'Negocio sin nombre'} · {fecha}</Text>
        </View>
        <View style={styles.riskBadge}>
          <Text style={styles.riskLabel}>Nivel de riesgo</Text>
          <Text style={[styles.riskValue, { color: riesgoColor }]}>{riesgoLabel}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del negocio</Text>
          {[
            ['Nombre', datos.nombre],
            ['Tipo de establecimiento', datos.tipo],
            ['Dirección', datos.direccion],
            ['Nº de empleados', datos.empleados],
            ['Contacto', datos.contacto],
          ].map(([label, value]) => (
            <View style={styles.row} key={label}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value || '—'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alcance y sistemas</Text>
          <View style={styles.gridRow}>
            <Text style={styles.gridLabel}>Sistemas identificados</Text>
            <Text style={styles.gridValue}>{alcance.sistemas.join(', ') || '—'}</Text>
          </View>
          <View style={styles.gridRow}>
            <Text style={styles.gridLabel}>Dispositivos con acceso</Text>
            <Text style={styles.gridValue}>{alcance.numDispositivos || '—'}</Text>
          </View>
          <View style={styles.gridRow}>
            <Text style={styles.gridLabel}>Empleados con acceso</Text>
            <Text style={styles.gridValue}>{alcance.numEmpleadosConAcceso || '—'}</Text>
          </View>
          <View style={styles.gridRow}>
            <Text style={styles.gridLabel}>Incidente previo</Text>
            <Text style={styles.gridValue}>{SINO(alcance.incidentePrevio)}</Text>
          </View>
        </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accesos y credenciales</Text>
            {ACCESOS_ITEMS.map((item) => (
              <View key={item.key}>
                <View style={styles.gridRow}>
                  <Text style={styles.gridLabel}>{item.label}</Text>
                  <Text style={styles.gridValue}>{SINO(accesos[item.key])}</Text>
                </View>
                {accesos[item.key] === 'no' && item.riesgo && (
                  <Text style={styles.riesgoNota}>⚠ {item.riesgo}</Text>
                )}
              </View>
            ))}
          </View>
        <View style={styles.section} break>
          <Text style={styles.sectionTitle}>Datos y RGPD</Text>
          {DATOS_RGPD_ITEMS.map((item) => (
            <View key={item.key}>
              <View style={styles.gridRow}>
                <Text style={styles.gridLabel}>{item.label}</Text>
                <Text style={styles.gridValue}>{SINO(datosRgpd[item.key])}</Text>
              </View>
              {datosRgpd[item.key] === 'no' && item.riesgo && (
                <Text style={styles.riesgoNota}>⚠ {item.riesgo}</Text>
              )}
            </View>
          ))}
        </View>

        {hallazgos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hallazgos</Text>
            {hallazgos.map((h) => (
              <View key={h.id} style={[styles.hallazgoBox, nivelBoxStyle(h.nivel)]}>
                <View style={styles.hallazgoHeader}>
                  <Text style={styles.hallazgoArea}>{h.area || 'Sin área'}</Text>
                  <Text style={styles.hallazgoNivel}>{h.nivel}</Text>
                </View>
                <Text style={styles.hallazgoDesc}>{h.descripcion || '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {estimacion.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estimación de la solución</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, styles.colSolucion]}>Solución propuesta</Text>
                <Text style={[styles.tableHeaderCell, styles.colHoras]}>Horas</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrecio]}>Precio</Text>
                <Text style={[styles.tableHeaderCell, styles.colTipo]}>Tipo de pago</Text>
              </View>
              {estimacion.map((e) => (
                <View style={styles.tableRow} key={e.id}>
                  <Text style={styles.colSolucion}>{e.solucionPropuesta || '—'}</Text>
                  <Text style={styles.colHoras}>{e.horas || '—'}</Text>
                  <Text style={styles.colPrecio}>{e.precio ? `${e.precio} €` : '—'}</Text>
                  <Text style={styles.colTipo}>{e.tipoPago === 'unico' ? 'Pago único' : 'Recurrente'}</Text>
                </View>
              ))}
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total estimado</Text>
              <Text style={styles.totalValue}>{Number(totalEstimado).toLocaleString('es-ES')} €</Text>
            </View>
          </View>
        )}

        {plan.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan de mejora</Text>
            {plan.map((p) => (
              <View style={styles.gridRow} key={p.id}>
                <Text style={styles.gridLabel}>{p.accion || '—'}</Text>
                <Text style={styles.gridValue}>Responsable: {p.responsable || '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {resumen.resumenEjecutivo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen ejecutivo</Text>
            <View style={styles.resumenBox}>
              <Text>{resumen.resumenEjecutivo}</Text>
            </View>
          </View>
        )}

        <View style={styles.firmasRow}>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine}>
              <Text style={styles.firmaLabel}>Firma cliente — {resumen.firmaCliente || 'pendiente'}</Text>
            </View>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine}>
              <Text style={styles.firmaLabel}>Firma Gescobit — {resumen.firmaGescobit || 'pendiente'}</Text>
            </View>
          </View>
        </View>

        <Footer nombreNegocio={datos.nombre} />
      </Page>
    </Document>
  );
}

/** Genera el PDF y dispara la descarga en el navegador */
export async function descargarAuditoriaPDF(props) {
  const blob = await pdf(<AuditoriaPDF {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `auditoria-${(props.datos.nombre || 'negocio').toLowerCase().replace(/\s+/g, '-')}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}