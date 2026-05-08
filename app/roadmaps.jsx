"use client";
import { useState } from "react";

const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#090806}
.app{min-height:100vh;background:#090806;font-family:sans-serif;color:#f0ebe3;padding-bottom:60px;}
.hero{background:#1e1508;padding:40px 24px;text-align:center;border-bottom:1px solid #261c08;}
.hero h1{font-size:28px;font-weight:900;color:#f4e4c0;margin-bottom:8px;}
.hero h1 em{font-style:italic;color:#c88228;}
.hero p{color:#7a6a50;font-size:14px;max-width:480px;margin:0 auto;}
.tabs-wrap{padding:24px 20px 0;}
.tabs{display:flex;gap:6px;background:#110e06;border:1px solid #221808;border-radius:14px;padding:6px;}
.tab{flex:1;padding:12px 10px;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:#5a4a2e;text-align:center;}
.tab.active{background:linear-gradient(135deg,#c88228,#9e6010);color:#fff;}
.content{padding:24px 20px 0;}
.box{padding:20px;background:#150f05;border:1px solid #261c08;border-radius:14px;margin-bottom:20px;}
.box h2{font-size:18px;color:#f4e4c0;margin-bottom:8px;}
.box p{color:#6a5a40;font-size:13px;line-height:1.6;}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;}
.stat{background:#150f05;border:1px solid #221808;border-radius:12px;padding:16px 10px;text-align:center;}
.stat .val{font-size:24px;font-weight:700;color:#c88228;}
.stat .lbl{font-size:9px;color:#4a3a20;margin-top:4px;text-transform:uppercase;letter-spacing:1px;}
.phase{margin-bottom:12px;border:1px solid #221808;border-radius:14px;overflow:hidden;background:#100d06;}
.phase-hdr{display:flex;align-items:center;gap:12px;padding:16px;cursor:pointer;background:#150f05;}
.phase-num{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;}
.phase-meta{flex:1;}
.phase-meta h3{font-size:14px;font-weight:600;color:#f0e8d8;margin-bottom:2px;}
.phase-meta .dur{font-size:10px;color:#5a4a2e;text-transform:uppercase;letter-spacing:1px;}
.phase-body{padding:4px 16px 16px;}
.sprint{background:#1a1208;border:1px solid #261c08;border-radius:10px;padding:14px;margin-top:10px;}
.sprint h4{font-size:11px;font-weight:700;color:#c88228;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;}
.task{display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid #1a1208;font-size:13px;color:#907860;line-height:1.5;}
.task:last-child{border-bottom:none;}
.dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;margin-top:6px;}
.milestone-title{font-size:17px;color:#f4e4c0;margin:28px 0 16px;}
.ms{display:flex;margin-bottom:22px;}
.ms-left{width:36px;display:flex;flex-direction:column;align-items:center;flex-shrink:0;}
.ms-circle{width:12px;height:12px;border-radius:50%;border:2px solid #c88228;background:#090806;flex-shrink:0;margin-top:4px;}
.ms-line{width:2px;flex:1;background:#2a1a08;min-height:14px;}
.ms-right{flex:1;padding:0 0 0 10px;}
.ms-week{font-size:9px;font-weight:700;color:#c88228;text-transform:uppercase;letter-spacing:2px;margin-bottom:3px;}
.ms-name{font-size:13px;font-weight:600;color:#f0e8d8;margin-bottom:2px;}
.ms-desc{font-size:12px;color:#5a4a2e;line-height:1.5;}
.phone-wrap{display:flex;justify-content:center;margin:16px 0;}
.phone{width:180px;background:#0a0806;border:2px solid #3a2a10;border-radius:32px;padding:10px 7px 14px;}
.phone-notch{width:50px;height:6px;background:#1a1208;border-radius:6px;margin:0 auto 8px;}
.phone-screen{background:#150f05;border-radius:20px;overflow:hidden;}
.phone-bar{background:linear-gradient(135deg,#c88228,#7e4808);padding:12px 10px 8px;text-align:center;}
.phone-bar h5{font-size:10px;font-weight:700;color:#fff;}
.phone-bar p{font-size:8px;color:rgba(255,255,255,0.65);margin-top:2px;}
.live-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#40c065;margin-right:3px;}
.sgrid{display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:8px;}
.scard{background:#1e1508;border:1px solid #3a2a10;border-radius:8px;padding:8px;text-align:center;}
.scard .n{font-size:18px;font-weight:700;color:#c88228;}
.scard .l{font-size:7px;color:#5a4a2e;text-transform:uppercase;margin-top:1px;}
.elist{padding:4px 8px 8px;}
.erow{display:flex;align-items:center;gap:7px;padding:6px 7px;background:#1e1508;border-radius:7px;margin-bottom:4px;}
.av{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0;}
.en{font-size:8px;font-weight:600;color:#c8b08a;}
.er{font-size:7px;color:#5a4a2e;}
.edot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
`;

const vPhases = [
  {num:"01",title:"Analisis Legal y Arquitectura",dur:"Semanas 1-3",color:"#c88228",sprints:[{label:"Sprint 1",title:"Base legal y setup",tasks:["Estudio RD 1007/2023 y especificaciones tecnicas AEAT","Modelo de datos fiscal: tickets, lineas, impuestos, encadenamiento","Arquitectura FastAPI + Supabase + Railway, setup CI/CD","Entorno de pruebas sandbox de la AEAT"]}]},
  {num:"02",title:"Motor Verifactu - Hash y Firma",dur:"Semanas 4-7",color:"#4a9060",sprints:[{label:"Sprint 2",title:"Encadenamiento de registros",tasks:["Generacion de registros con hash encadenado SHA-256","Codigo QR de verificacion por ticket segun AEAT","Almacenamiento inmutable en Supabase con politicas RLS","Validacion automatica de integridad de la cadena"]},{label:"Sprint 3",title:"Conexion AEAT y firma",tasks:["Integracion con servicio web AEAT SOAP/REST","Firma electronica con certificado digital X.509","Gestion de respuestas: aceptado, rechazado, incidencia","Reintentos automaticos con backoff exponencial"]}]},
  {num:"03",title:"Gestion de Tickets y TPV",dur:"Semanas 8-11",color:"#5080c8",sprints:[{label:"Sprint 4",title:"Importacion de datos TPV",tasks:["Importador CSV/Excel de ventas desde TPV","Normalizacion automatica de productos e IVA","Historial de importaciones con trazabilidad","Deteccion de duplicados y alertas de inconsistencia"]},{label:"Sprint 5",title:"Visor de tickets y QR",tasks:["Visor con buscador avanzado: fecha, importe, mesa, estado","Previsualizacion del QR Verifactu por ticket","Exportacion de tickets en PDF con QR incrustado","Panel de errores AEAT con guia de resolucion"]}]},
  {num:"04",title:"Pruebas, Certificacion y Lanzamiento",dur:"Semanas 12-16",color:"#a04888",sprints:[{label:"Sprint 6",title:"Testing y validacion",tasks:["Tests en sandbox AEAT con todos los casos oficiales","Auditoria de integridad con 10.000 registros simulados","Pruebas de rendimiento: 500 tickets por minuto","Revision con asesoria fiscal especializada"]},{label:"Sprint 7",title:"Go-to-market",tasks:["Onboarding guiado: certificado, datos empresa, primer ticket","Dossier de cumplimiento legal para el restaurante","Panel de administracion multirestaurante","Monitorizacion 24/7 para primeros clientes"]}]},
];

const vMilestones = [
  {week:"Semana 3",name:"Arquitectura validada",desc:"Modelo de datos fiscal definido, entornos listos, equipo alineado con RD 1007/2023."},
  {week:"Semana 7",name:"Motor Verifactu operativo",desc:"Hashes SHA-256, encadenamiento y firma electronica funcionando en sandbox AEAT."},
  {week:"Semana 11",name:"Integracion TPV completa",desc:"Importacion CSV, visor de tickets y QR probados con datos reales."},
  {week:"Semana 14",name:"Certificacion AEAT superada",desc:"Todos los casos de prueba oficiales superados. Listo para produccion."},
  {week:"Semana 16",name:"Primer cliente en produccion",desc:"Facturacion verificada legalmente. Modulo vendible antes del vencimiento 2027."},
];

const ePhases = [
  {num:"01",title:"Arquitectura y Sistema de Roles",dur:"Semanas 1-3",color:"#c88228",sprints:[{label:"Sprint 1",title:"Base, roles y autenticacion",tasks:["Modelo de datos: empresa, sede, empleado, turno, ausencia, vacaciones","Sistema de roles: Propietario toda la red, Encargado su local, Empleado","Autenticacion segura con Supabase Auth + JWT + 2FA","App web responsiva para escritorio y movil con Next.js"]}]},
  {num:"02",title:"Control de Presencia y Fichajes",dur:"Semanas 4-7",color:"#4a9060",sprints:[{label:"Sprint 2",title:"Sistema de fichaje movil",tasks:["Fichaje de entrada y salida desde el movil con un solo toque","Geolocalizacion opcional para validar ubicacion en el local","Fichaje por codigo QR en tablet fija del establecimiento","Alertas push al encargado si alguien no ficha a su hora"]},{label:"Sprint 3",title:"Panel de presencia en tiempo real",tasks:["Dashboard del encargado: quien esta en el local ahora mismo","Estado por empleado: En turno, En pausa, Fuera, Incidencia","Historial de fichajes con edicion manual y trazabilidad","Exportacion de partes de horas a Excel para inspeccion laboral"]}]},
  {num:"03",title:"Vacaciones, Ausencias y Turnos",dur:"Semanas 8-11",color:"#5080c8",sprints:[{label:"Sprint 4",title:"Vacaciones y ausencias",tasks:["Solicitud de vacaciones desde la app del empleado en dos pasos","Aprobacion con notificacion push al encargado y confirmacion","Tipos de ausencia: baja medica, asunto propio, injustificada","Contador de dias disponibles segun convenio colectivo"]},{label:"Sprint 5",title:"Calendario y turnos",tasks:["Calendario mensual con toda la plantilla codificada por colores","Planificador semanal de turnos con drag and drop","Deteccion automatica de solapamientos y huecos de cobertura","Publicacion de turnos con notificacion push individual"]}]},
  {num:"04",title:"App Movil del Encargado y Analytics",dur:"Semanas 12-16",color:"#a04888",sprints:[{label:"Sprint 6",title:"PWA movil del encargado",tasks:["PWA instalable en iOS y Android sin App Store","Vista compacta de presencia: todos los empleados de un vistazo","Notificaciones push: ausencias, fichajes, solicitudes pendientes","Acciones rapidas: aprobar vacaciones, registrar incidencia"]},{label:"Sprint 7",title:"Informes legales",tasks:["Informe mensual de horas valido para Inspeccion de Trabajo","Calculo automatico de horas extra, nocturnas y festivos","KPIs: rotacion, absentismo y puntualidad por restaurante","Exportacion en formato Seguridad Social RDL 8/2019"]}]},
];

const eMilestones = [
  {week:"Semana 3",name:"Sistema de roles operativo",desc:"Propietario, encargado y empleado con accesos diferenciados y autenticacion segura."},
  {week:"Semana 7",name:"Fichaje en produccion",desc:"Empleados fichando desde el movil. Encargado viendo presencia en tiempo real."},
  {week:"Semana 11",name:"Vacaciones y turnos funcionando",desc:"Flujo completo solicitud, aprobacion y calendario actualizado automaticamente."},
  {week:"Semana 14",name:"PWA del encargado desplegada",desc:"Instalada en el movil del encargado con notificaciones push activas."},
  {week:"Semana 16",name:"Modulo certificado y vendible",desc:"Informes legales listos, cumplimiento RDL 8/2019 y primeros clientes activos."},
];

const employees = [
  {i:"CM",c:"#c88228",n:"Carlos M.",r:"Jefe de Sala",a:true,p:false},
  {i:"AR",c:"#4a9060",n:"Ana R.",r:"Cocinera",a:true,p:false},
  {i:"LP",c:"#5080c8",n:"Luis P.",r:"Camarero",a:false,p:true},
  {i:"MS",c:"#a04888",n:"Marta S.",r:"Camarera",a:false,p:false},
  {i:"PJ",c:"#606060",n:"Pedro J.",r:"Ayudante",a:false,p:false},
];

function Phase({phase}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="phase">
      <div className="phase-hdr" onClick={() => setOpen(!open)}>
        <div className="phase-num" style={{background:phase.color+"22",color:phase.color}}>{phase.num}</div>
        <div className="phase-meta">
          <h3>{phase.title}</h3>
          <span className="dur">{phase.dur}</span>
        </div>
        <span style={{color:"#3a2a10",fontSize:"11px"}}>{open ? "^" : "v"}</span>
      </div>
      {open && (
        <div className="phase-body">
          {phase.sprints.map((sp,si) => (
            <div key={si} className="sprint">
              <h4>{sp.label} - {sp.title}</h4>
              {sp.tasks.map((t,ti) => (
                <div key={ti} className="task">
                  <div className="dot" style={{background:phase.color}}/>
                  {t}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MilestoneList({items}) {
  return (
    <div>
      <div className="milestone-title">Hitos Clave</div>
      {items.map((m,i) => (
        <div key={i} className="ms">
          <div className="ms-left">
            <div className="ms-circle"/>
            {i < items.length-1 && <div className="ms-line"/>}
          </div>
          <div className="ms-right">
            <div className="ms-week">{m.week}</div>
            <div className="ms-name">{m.name}</div>
            <div className="ms-desc">{m.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="phone-wrap">
      <div className="phone">
        <div className="phone-notch"/>
        <div className="phone-screen">
          <div className="phone-bar">
            <h5>Tu Gestor Hostelero</h5>
            <p><span className="live-dot"/>Presencia en tiempo real</p>
          </div>
          <div className="sgrid">
            {[{n:"8",l:"Turno hoy"},{n:"4",l:"En local"},{n:"1",l:"En pausa"},{n:"3",l:"Fuera"}].map((s,i) => (
              <div key={i} className="scard">
                <div className="n">{s.n}</div>
                <div className="l">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="elist">
            {employees.map((e,i) => (
              <div key={i} className="erow">
                <div className="av" style={{background:e.c}}>{e.i}</div>
                <div style={{flex:1}}>
                  <div className="en">{e.n}</div>
                  <div className="er">{e.r}</div>
                </div>
                <div className="edot" style={{background:e.a?"#40c065":e.p?"#c8a030":"#3a2a10"}}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("v");
  return (
    <div>
      <style>{css}</style>
      <div className="app">
        <div className="hero">
          <h1>Roadmap de <em>Producto</em></h1>
          <p>Tu Gestor Hostelero - RS Global Suite</p>
        </div>
        <div className="tabs-wrap">
          <div className="tabs">
            <button className={tab==="v"?"tab active":"tab"} onClick={()=>setTab("v")}>Verifactu Fiscal</button>
            <button className={tab==="e"?"tab active":"tab"} onClick={()=>setTab("e")}>Gestion Empleados</button>
          </div>
        </div>
        <div className="content">
          {tab==="v" && (
            <div>
              <div className="box">
                <h2>Verifactu - Cumplimiento Fiscal</h2>
                <p>Modulo para que los restaurantes esten legalmente protegidos. Integracion con la AEAT, encadenamiento SHA-256 y QR por ticket.</p>
              </div>
              <div className="stats">
                <div className="stat"><div className="val">16</div><div className="lbl">Semanas</div></div>
                <div className="stat"><div className="val">7</div><div className="lbl">Sprints</div></div>
                <div className="stat"><div className="val">100%</div><div className="lbl">Legal</div></div>
              </div>
              {vPhases.map((ph,i) => <Phase key={i} phase={ph}/>)}
              <MilestoneList items={vMilestones}/>
            </div>
          )}
          {tab==="e" && (
            <div>
              <div className="box">
                <h2>Gestion Integral del Empleado</h2>
                <p>Control de presencia, fichajes, turnos, vacaciones y ausencias. El encargado gestiona todo desde su movil en tiempo real.</p>
              </div>
              <div className="stats">
                <div className="stat"><div className="val">16</div><div className="lbl">Semanas</div></div>
                <div className="stat"><div className="val">7</div><div className="lbl">Sprints</div></div>
                <div className="stat"><div className="val">PWA</div><div className="lbl">Movil</div></div>
              </div>
              <div className="box">
                <h2>Vista del Encargado - Tiempo Real</h2>
                <p>Desde su movil ve quien esta en el local, quien esta en pausa y quien no ha fichado.</p>
                <PhoneMock/>
              </div>
              {ePhases.map((ph,i) => <Phase key={i} phase={ph}/>)}
              <MilestoneList items={eMilestones}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}