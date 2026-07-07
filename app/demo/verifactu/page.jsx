'use client';

/* ============================================================
   DEMO VISUAL DE VERIFACTU  ·  ruta: /demo/verifactu
   Página NO enlazada (se accede escribiendo la URL).
   Vista previa estática de las pantallas de facturación.
   No guarda datos ni funciona: es solo para enseñar el diseño.
   ============================================================ */
export default function DemoVerifactu() {
  return (
    <div style={wrap}>
      <div style={container}>

        <div style={avisoDemo}>
          <b>Vista previa · demo</b> — así se verá el módulo VeriFactu cuando esté listo. Los datos son de ejemplo y aún no es funcional.
        </div>

        <h1 style={titulo}>Módulo VeriFactu — vista previa</h1>
        <p style={sub}>Facturación pensada para hostelería. Estas son las dos pantallas principales.</p>

        {/* ===================== PANTALLA 1: LISTA ===================== */}
        <div style={label}>Pantalla 1 · Lista de facturas</div>
        <div style={pantalla}>
          <div style={pHeader}>
            <div>
              <div style={pTitulo}>Facturas</div>
              <div style={pSub}>VeriFactu · La Tasca de Santi</div>
            </div>
            <div style={btnAccion}>+ Nueva factura</div>
          </div>

          <div style={metricRow}>
            <div style={metric}><div style={mLabel}>Facturado este mes</div><div style={mNum}>3.240 €</div></div>
            <div style={metric}><div style={mLabel}>Facturas emitidas</div><div style={mNum}>18</div></div>
            <div style={metric}><div style={mLabel}>Pendientes de cobro</div><div style={mNum}>2</div></div>
          </div>

          <div style={tabla}>
            <div style={{ ...tRow, ...tHead }}>
              <span>Número</span><span>Cliente</span><span style={{ textAlign: 'right' }}>Total</span><span style={{ textAlign: 'right' }}>Estado</span>
            </div>
            <div style={tRow}>
              <span style={tMut}>2026-018</span><span>Catering Boda García</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>1.520 €</span>
              <span style={{ textAlign: 'right' }}><span style={pillOk}>Emitida</span></span>
            </div>
            <div style={tRow}>
              <span style={tMut}>2026-017</span><span>Mesa 12 · comida empresa</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>284 €</span>
              <span style={{ textAlign: 'right' }}><span style={pillOk}>Emitida</span></span>
            </div>
            <div style={tRow}>
              <span style={tMut}>—</span><span>Evento cumpleaños Ruiz</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>640 €</span>
              <span style={{ textAlign: 'right' }}><span style={pillBorr}>Borrador</span></span>
            </div>
            <div style={{ ...tRow, borderBottom: 'none' }}>
              <span style={tMut}>2026-016</span><span>Menú del día · Grupo 8</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>96 €</span>
              <span style={{ textAlign: 'right' }}><span style={pillOk}>Emitida</span></span>
            </div>
          </div>
        </div>

        {/* ===================== PANTALLA 2: NUEVA FACTURA ===================== */}
        <div style={label}>Pantalla 2 · Nueva factura</div>
        <div style={pantalla}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={pTitulo}>Nueva factura</div>
            <span style={pillBorr}>Borrador</span>
          </div>

          <div style={bloque}>
            <div style={bloqueLabel}>DATOS DEL CLIENTE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div style={inputFake}>Catering Boda García</div>
              <div style={inputFake}>NIF: 12345678Z</div>
            </div>
            <div style={inputFake}>Calle Mayor 14, Móstoles</div>
          </div>

          <div style={bloque}>
            <div style={bloqueLabel}>AÑADIR RÁPIDO (atajos hostelería)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <span style={chip}>+ Menú del día</span>
              <span style={chip}>+ Consumición</span>
              <span style={chip}>+ Catering</span>
              <span style={chip}>+ Evento</span>
            </div>

            <div style={bloqueLabel}>CONCEPTOS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 80px 80px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <div style={inputFake}>Menú catering (40 pax)</div>
              <div style={{ ...inputFake, textAlign: 'center' }}>40</div>
              <div style={{ ...inputFake, textAlign: 'right' }}>30,00</div>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>1.200 €</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 80px 80px', gap: 8, alignItems: 'center' }}>
              <div style={inputFake}>Bebidas y café</div>
              <div style={{ ...inputFake, textAlign: 'center' }}>1</div>
              <div style={{ ...inputFake, textAlign: 'right' }}>320,00</div>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>320 €</span>
            </div>
          </div>

          <div style={totales}>
            <div style={totRow}><span style={{ color: '#5C6B61' }}>Base imponible</span><span>1.520,00 €</span></div>
            <div style={totRow}><span style={{ color: '#5C6B61' }}>IVA (10%)</span><span>152,00 €</span></div>
            <div style={{ ...totRow, borderTop: '1px solid #E2E0D2', paddingTop: 8, marginTop: 4, fontWeight: 700, fontSize: 17 }}>
              <span>Total</span><span>1.672,00 €</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={btnSec}>Guardar borrador</div>
            <div style={btnPrim}>Emitir factura</div>
          </div>
          <div style={notaPie}>Al emitir: se genera el QR y la huella (SHA-256), se asigna el número correlativo y la factura queda bloqueada.</div>
        </div>

        <div style={cierre}>
          Esto es una demostración del diseño. La versión funcional (guardar, emitir, generar PDF) está en desarrollo.
        </div>

      </div>
    </div>
  );
}

/* ===================== estilos ===================== */
const wrap = { minHeight: '100vh', background: '#F3F1E7', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px 16px', boxSizing: 'border-box' };
const container = { maxWidth: 760, margin: '0 auto' };

const avisoDemo = { background: '#FAEEDA', color: '#633806', borderRadius: 10, padding: '12px 16px', fontSize: 14, marginBottom: 20, lineHeight: 1.5 };
const titulo = { color: '#0D3A28', fontSize: 26, fontWeight: 800, margin: '0 0 4px' };
const sub = { color: '#5C6B61', fontSize: 15, margin: '0 0 24px' };

const label = { color: '#1A6A48', fontWeight: 700, fontSize: 14, margin: '24px 0 10px' };
const pantalla = { background: '#fff', border: '1px solid #E2E0D2', borderRadius: 14, padding: 20 };

const pHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 };
const pTitulo = { fontSize: 22, fontWeight: 700, color: '#15271C' };
const pSub = { fontSize: 13, color: '#5C6B61', marginTop: 2 };
const btnAccion = { background: '#1A6A48', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600 };

const metricRow = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 18 };
const metric = { background: '#F6F5EF', borderRadius: 8, padding: 14 };
const mLabel = { fontSize: 13, color: '#5C6B61' };
const mNum = { fontSize: 22, fontWeight: 800, color: '#15271C', marginTop: 4 };

const tabla = { border: '1px solid #E2E0D2', borderRadius: 10, overflow: 'hidden' };
const tRow = { display: 'grid', gridTemplateColumns: '90px 1fr 90px 90px', padding: '12px 14px', borderBottom: '1px solid #EDEBE0', fontSize: 14, alignItems: 'center', gap: 8 };
const tHead = { fontSize: 12, color: '#9A9A90', fontWeight: 600 };
const tMut = { color: '#5C6B61' };
const pillOk = { background: '#E1F5EE', color: '#0F6E56', fontSize: 12, padding: '3px 9px', borderRadius: 6 };
const pillBorr = { background: '#FAEEDA', color: '#854F0B', fontSize: 12, padding: '3px 9px', borderRadius: 6 };

const bloque = { background: '#F6F5EF', border: '1px solid #E2E0D2', borderRadius: 10, padding: 16, marginBottom: 12 };
const bloqueLabel = { fontSize: 12, color: '#9A9A90', fontWeight: 600, marginBottom: 10 };
const inputFake = { background: '#fff', border: '1px solid #E2E0D2', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#15271C' };
const chip = { border: '1.2px solid #2E9E6B', color: '#1A6A48', padding: '7px 13px', borderRadius: 20, fontSize: 13, background: '#fff' };

const totales = { background: '#F0EFE7', borderRadius: 10, padding: '14px 16px', marginBottom: 14 };
const totRow = { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#15271C', marginBottom: 6 };

const btnSec = { flex: 1, textAlign: 'center', border: '1.5px solid #2E9E6B', color: '#1A6A48', padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600 };
const btnPrim = { flex: 1, textAlign: 'center', background: '#1A6A48', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600 };
const notaPie = { fontSize: 13, color: '#7A857D', marginTop: 12 };

const cierre = { textAlign: 'center', color: '#7A857D', fontSize: 14, margin: '28px 0 10px' };
