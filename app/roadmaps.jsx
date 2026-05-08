import { useState } from "react";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#090806}
.app{min-height:100vh;background:#090806;font-family:'DM Sans',sans-serif;color:#f0ebe3;padding-bottom:60px;}
.hero{background:linear-gradient(160deg,#120e05 0%,#1e1508 60%,#120e05 100%);padding:44px 28px 36px;text-align:center;border-bottom:1px solid #261c08;position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% -10%,rgba(200,130,30,0.18) 0%,transparent 70%);}
.hero-eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(200,130,30,0.12);border:1px solid rgba(200,130,30,0.35);color:#c88228;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:5px 14px;border-radius:20px;margin-bottom:18px;position:relative;}
.hero h1{font-family:'Playfair Display',serif;font-size:clamp(26px,6vw,46px);font-weight:900;color:#f4e4c0;line-height:1.1;margin-bottom:10px;position:relative;}
.hero h1 em{font-style:italic;color:#c88228;}
.hero-sub{color:#7a6a50;font-size:14px;font-weight:300;max-width:480px;margin:0 auto;position:relative;line-height:1.6;}
.tabs-wrap{padding:28px 20px 0;}
.tabs{display:flex;gap:6px;background:#110e06;border:1px solid #221808;border-radius:16px;padding:6px;}
.tab{flex:1;padding:14px 10px;border:none;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .3s;background:transparent;color:#5a4a2e;text-align:center;line-height:1.4;}
.tab.active{background:linear-gradient(135deg,#c88228,#9e6010);color:#fff;box-shadow:0 4px 24px rgba(200,130,40,0.35);}
.tab-icon{font-size:20px;display:block;margin-bottom:5px;}
.content{padding:28px 20px 0;}
.section-header{padding:24px;background:linear-gradient(135deg,#150f05,#1e1508);border:1px solid #261c08;border-radius:18px;margin-bottom:24px;position:relative;overflow:hidden;}
.section-header::after{content:'';position:absolute;top:-40px;right:-40px;width:140px;height:140px;background:radial-gradient(circle,rgba(200,130,30,0.1),transparent 70%);border-radius:50%;}
.section-header h2{font-family:'Playfair Display',serif;font-size:20px;color:#f4e4c0;margin-bottom:8px;}
.section-header p{color:#6a5a40;font-size:13px;line-height:1.65;}
.law-pill{display:inline-flex;align-items:flex-start;gap:7px;background:rgba(200,70,40,0.12);border:1px solid rgba(200,70,40,0.3);border-radius:8px;padding:10px 14px;margin-top:14px;}
.law-pill-icon{font-size:16px;flex-shrink:0;margin-top:1px;}
.law-pill p{color:#e09080;font-size:12px;font-weight:500;line-height:1.5;}
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:24px;}
.stat{background:#150f05;border:1px solid #221808;border-radius:14px;padding:18px 10px;text-align:center;}
.stat .val{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#c88228;}
.stat .lbl{font-size:9px;color:#4a3a20;margin-top:4px;text-transform:uppercase;letter-spacing:1.5px;}
.phase{margin-bottom:14px;border:1px solid #221808;border-radius:16px;overflow:hidden;background:#100d06;transition:border-color .2s;}
.phase:hover{border-color:#3a2a10;}
.phase-hdr{display:flex;align-items:center;gap:14px;padding:18px;cursor:pointer;background:#150f05;}
.phase-num{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;}
.phase-meta{flex:1;}
.phase-meta h3{font-size:14px;font-weight:600;color:#f0e8d8;margin-bottom:3px;}
.phase-meta .dur{font-size:10px;color:#5a4a2e;letter-spacing:1.5px;text-transform:uppercase;}
.phase-chevron{font-size:11px;color:#3a2a10;transition:transform .3s;flex-shrink:0;}
.phase-chevron.open{transform:rotate(180deg);}
.phase-body{padding:4px 18px 18px;}
.sprint{background:#1a1208;border:1px solid #261c08;border-radius:12px;padding:16px;margin-top:12px;}
.sprint h4{font-size:11px;font-weight:700;color:#c88228;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;}
.task{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #1a1208;font-size:13px;color:#907860;line-height:1.5;}
.task:last-child{border-bottom:none;padding-bottom:0;}
.task-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;margin-top:6px;}
.screens-label{font-size:10px;font-weight:700;color:#3a2a10;letter-spacing:2.5px;text-transform:uppercase;margin:18px 0 10px;}
.screen-cards{display:flex;flex-direction:column;gap:8px;}
.screen-card{background:#0e0b05;border:1px solid #221808;border-radius:12px;overflow:hidden;}
.screen-topbar{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;}
.screen-topbar-title{font-size:11px;font-weight:700;color:#f0e8d8;}
.screen-topbar-dots{display:flex;gap:4px;}
.screen-topbar-dot{width:7px;height:7px;border-radius:50%;}
.screen-body{padding:12px;}
.screen-row{display:flex;align-items:center;gap:10px;padding:8px 10px;background:#1a1208;border-radius:8px;margin-bottom:6px;}
.screen-row:last-child{margin-bottom:0;}
.screen-row-ico{font-size:14px;flex-shrink:0;}
.screen-row-txt{flex:1;}
.screen-row-main{font-size:11px;font-weight:600;color:#c8b08a;}
.screen-row-sub{font-size:10px;color:#5a4a2e;}
.screen-badge{font-size:9px;font-weight:700;padding:2px 8px;border-radius:8px;flex-shrink:0;white-space:nowrap;}
.ok{background:rgba(50,180,80,0.15);color:#40c065;}
.warn{background:rgba(200,150,30,0.15);color:#c8a030;}
.err{background:rgba(200,60,40,0.15);color:#d06040;}
.info{background:rgba(50,120,200,0.15);color:#5090e0;}
.phone-section{padding:24px;background:linear-gradient(135deg,#150f05,#1e1508);border:1px solid #261c08;border-radius:18px;margin-bottom:24px;}
.phone-section h2{font-family:'Playfair Display',serif;font-size:18px;color:#f4e4c0;margin-bottom:6px;}
.phone-section p{color:#6a5a40;font-size:13px;line-height:1.5;margin-bottom:0;}
.phone-wrap{display:flex;justify-content:center;margin:20px 0 4px;}
.phone{width:190px;background:#0a0806;border:2.5px solid #3a2a10;border-radius:34px;padding:10px 7px 16px;box-shadow:0 24px 80px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.04),0 0 0 1px #201508;}
.phone-notch{width:56px;height:7px;background:#1a1208;border-radius:8px;margin:0 auto 8px;}
.phone-screen{background:#150f05;border-radius:22px;overflow:hidden;}
.phone-bar{background:linear-gradient(135deg,#c88228,#7e4808);padding:14px 12px 10px;text-align:center;}
.phone-bar h5{font-size:11px;font-weight:700;color:#fff;}
.phone-bar p{font-size:9px;color:rgba(255,255,255,0.65);margin-top:2px;}
.phone-live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#40c065;margin-right:4px;animation:blink 1.4s ease-in-out infinite;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0.3;}}
.status-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px;}
.status-card{background:#1e1508;border:1px solid #3a2a10;border-radius:10px;padding:10px 8px;text-align:center;}
.status-card .num{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#c88228;}
.status-card .lbl{font-size:8px;color:#5a4a2e;text-transform:uppercase;letter-spacing:1px;margin-top:2px;}
.emp-list{padding:4px 10px 10px;}
.emp-row{display:flex;align-items:center;gap:8px;padding:7px 8px;background:#1e1508;border-radius:8px;margin-bottom:5px;}
.emp-row:last-child{margin-bottom:0;}
.avatar{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;}
.emp-info{flex:1;}
.emp-name{font-size:9px;font-weight:600;color:#c8b08a;}
.emp-role{font-size:8px;color:#5a4a2e;}
.status-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.milestones-title{font-family:'Playfair Display',serif;font-size:18px;color:#f4e4c0;margin:32px 0 18px;}
.milestones{display:flex;flex-direction:column;}
.ms-row{display:flex;align-items:stretch;}
.ms-line{display:flex;flex-direction:column;align-items:center;width:38px;flex-shrink:0;}
.ms-circle{width:14px;height:14px;border-radius:50%;border:2px solid #c88228;background:#090806;flex-shrink:0;margin-top:5px;}
.ms-vline{width:2px;flex:1;min-height:16px;background:linear-gradient(180deg,#3a2a10,#1a1208);}
.ms-content{flex:1;padding:0 0 26px 8px;}
.ms-week{font-size:9px;font-weight:700;color:#c88228;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;}
.ms-title{font-size:14px;font-weight:600;color:#f0e8d8;margin-bottom:3px;}
.ms-desc{font-size:12px;color:#5a4a2e;line-height:1.55;}
`;

/* DATA */
const verifactuPhases = [
  {
    num:"01", title:"Análisis Legal y Arquitectura", duration:"Semanas 1–3", color:"#c88228",
    sprints:[{
      label:"Sprint 1", title:"Base legal y setup de proyecto",
      tasks:[
        "Estudio exhaustivo RD 1007/2023 y especificaciones técnicas AEAT",
        "Definición del modelo de datos fiscal: tickets, líneas, impuestos, encadenamiento",
        "Arquitectura FastAPI + Supabase + Railway · setup repositorio, entornos y CI/CD",
        "Configuración del entorno de pruebas sandbox de la AEAT",
      ]
    }],
    screens:[{
      title:"Dashboard Fiscal", gradient:["#c88228","#7e4808"],
      rows:[
        {ico:"📊", main:"Registros hoy", sub:"Tickets enviados a AEAT", badge:"847", cls:"ok"},
        {ico:"✅", main:"Aceptados AEAT", sub:"Correctamente validados", badge:"845", cls:"ok"},
        {ico:"⚠️", main:"Pendientes", sub:"En cola de envío", badge:"2", cls:"warn"},
        {ico:"⚙️", main:"Configuración", sub:"Certificado digital · NIF empresa", badge:"ACTIVO", cls:"info"},
      ]
    }]
  },
  {
    num:"02", title:"Motor Verifactu — Hash y Firma", duration:"Semanas 4–7", color:"#4a9060",
    sprints:[
      {
        label:"Sprint 2", title:"Encadenamiento y generación de registros",
        tasks:[
          "Generación de registros de facturación con hash encadenado SHA-256",
          "Código QR de verificación por ticket según especificación AEAT",
          "Almacenamiento inmutable de registros en Supabase con políticas RLS",
          "Validación automática de integridad de la cadena al arrancar el sistema",
        ]
      },
      {
        label:"Sprint 3", title:"Conexión AEAT y firma electrónica",
        tasks:[
          "Integración con el servicio web AEAT (SOAP/REST según versión publicada)",
          "Firma electrónica de mensajes con certificado digital X.509",
          "Gestión de respuestas: aceptado, rechazado, incidencia con código de error",
          "Reintentos automáticos con backoff exponencial ante fallos de red",
        ]
      }
    ],
    screens:[{
      title:"Cadena de Registros", gradient:["#4a9060","#2a5a38"],
      rows:[
        {ico:"🔗", main:"Registro #000847", sub:"Hash: a3f8…d92c · Firmado digitalmente", badge:"OK", cls:"ok"},
        {ico:"🔗", main:"Registro #000846", sub:"Hash: 7bc1…e401 · Encadenado", badge:"OK", cls:"ok"},
        {ico:"📡", main:"Último envío AEAT", sub:"hace 2 min · 200 ms de latencia", badge:"ACK", cls:"ok"},
        {ico:"🔑", main:"Certificado digital", sub:"Válido hasta dic 2026", badge:"ACTIVO", cls:"info"},
      ]
    }]
  },
  {
    num:"03", title:"Gestión de Tickets y TPV", duration:"Semanas 8–11", color:"#5080c8",
    sprints:[
      {
        label:"Sprint 4", title:"Importación de datos TPV",
        tasks:[
          "Importador CSV/Excel de ventas desde TPV (ElaCarta, Revo, LaFourchette, etc.)",
          "Normalización automática de productos, tipos de IVA e importes",
          "Historial de importaciones con trazabilidad completa por fichero",
          "Detección de duplicados y alertas de inconsistencia fiscal",
        ]
      },
      {
        label:"Sprint 5", title:"Visor de tickets y QR Verifactu",
        tasks:[
          "Visor de tickets con buscador avanzado: fecha, importe, mesa, estado",
          "Previsualización del QR Verifactu por ticket con verificación enlazada",
          "Exportación de tickets en PDF con QR incrustado (válido legalmente)",
          "Panel de errores AEAT con guía de resolución paso a paso por tipo",
        ]
      }
    ],
    screens:[{
      title:"Visor de Tickets", gradient:["#5080c8","#2a4898"],
      rows:[
        {ico:"🧾", main:"Ticket #847 · Mesa 12", sub:"21:34 · 67,80 € · IVA 21% · enviado", badge:"VALID", cls:"ok"},
        {ico:"🧾", main:"Ticket #846 · Barra", sub:"21:28 · 12,40 € · IVA 10% · enviado", badge:"VALID", cls:"ok"},
        {ico:"🧾", main:"Ticket #845 · Terraza", sub:"21:15 · 94,20 € · IVA 21% · enviado", badge:"VALID", cls:"ok"},
        {ico:"📱", main:"QR de Verificación", sub:"Generado · Compatible AEAT", badge:"LISTO", cls:"info"},
      ]
    }]
  },
  {
    num:"04", title:"Pruebas, Certificación y Lanzamiento", duration:"Semanas 12–16", color:"#a04888",
    sprints:[
      {
        label:"Sprint 6", title:"Testing fiscal y validación completa",
        tasks:[
          "Suite de tests en sandbox AEAT: todos los casos de uso del manual oficial",
          "Auditoría de integridad del encadenamiento con 10.000+ registros simulados",
          "Pruebas de rendimiento: 500 tickets/minuto sin degradación",
          "Revisión con asesoría fiscal especializada en hostelería española",
        ]
      },
      {
        label:"Sprint 7", title:"Go-to-market y primeros clientes",
        tasks:[
          "Onboarding guiado: carga de certificado, datos empresa, primer ticket de prueba",
          "Dossier de cumplimiento legal para el restaurante (documento entregable)",
          "Panel de administración multirestaurante para gestión de toda la red",
          "Monitorización 24/7 y soporte para los primeros clientes de pago",
        ]
      }
    ],
    screens:[{
      title:"Panel Multirestaurante", gradient:["#a04888","#6a1858"],
      rows:[
        {ico:"🏪", main:"La Tasca de Pepe", sub:"847 tickets · Compliant ✓", badge:"ACTIVO", cls:"ok"},
        {ico:"🏪", main:"Restaurante El Mar", sub:"1.204 tickets · Compliant ✓", badge:"ACTIVO", cls:"ok"},
        {ico:"🏪", main:"Bar Central Madrid", sub:"Configurando certificado…", badge:"SETUP", cls:"warn"},
        {ico:"📈", main:"Total red este mes", sub:"Todos los locales combinados", badge:"14.820", cls:"info"},
      ]
    }]
  }
];

const verifactuMilestones = [
  {week:"Semana 3", title:"Arquitectura validada", desc:"Modelo de datos fiscal definido, entornos listos, equipo alineado con la normativa RD 1007/2023."},
  {week:"Semana 7", title:"Motor Verifactu operativo", desc:"Hashes SHA-256, encadenamiento y firma electrónica funcionando correctamente en sandbox AEAT."},
  {week:"Semana 11", title:"Integración TPV completa", desc:"Importación CSV, visor de tickets, generación de QR y gestión de errores probados con datos reales."},
  {week:"Semana 14", title:"Certificación AEAT superada", desc:"Todos los casos de prueba oficiales superados. Sistema listo para entrar en producción."},
  {week:"Semana 16", title:"🚀 Primer cliente en producción", desc:"Facturación verificada legalmente. Módulo vendible y operativo antes del vencimiento legal 2027."},
];

const empleadosPhases = [
  {
    num:"01", title:"Arquitectura y Sistema de Roles", duration:"Semanas 1–3", color:"#c88228",
    sprints:[{
      label:"Sprint 1", title:"Base, roles y autenticación",
      tasks:[
        "Modelo de datos: empresa, sede, empleado, turno, ausencia, vacaciones, incidencia",
        "Sistema de roles: Propietario (toda la red) · Encargado (su local) · Empleado",
        "Autenticación segura con Supabase Auth + JWT + opción de 2FA",
        "App web responsiva optimizada para escritorio y móvil con Next.js",
      ]
    }],
    screens:[{
      title:"Acceso por Rol", gradient:["#c88228","#7e4808"],
      rows:[
        {ico:"👑", main:"Propietario", sub:"Acceso total · todos los locales y KPIs", badge:"ADMIN", cls:"ok"},
        {ico:"🧑‍💼", main:"Encargado", sub:"Su local · fichajes y turnos en tiempo real", badge:"MANAGER", cls:"info"},
        {ico:"👤", main:"Empleado", sub:"Fichar · ver mi turno · pedir vacaciones", badge:"USER", cls:"warn"},
        {ico:"🔒", main:"Seguridad 2FA", sub:"Doble factor disponible para todos los roles", badge:"SEGURO", cls:"ok"},
      ]
    }]
  },
  {
    num:"02", title:"Control de Presencia y Fichajes", duration:"Semanas 4–7", color:"#4a9060",
    sprints:[
      {
        label:"Sprint 2", title:"Sistema de fichaje móvil",
        tasks:[
          "Fichaje de entrada y salida desde el móvil del empleado con un solo toque",
          "Geolocalización opcional para validar que el fichaje es en el establecimiento",
          "Fichaje alternativo por código QR en tablet fija del local",
          "Alertas automáticas push al encargado si alguien no ficha a su hora",
        ]
      },
      {
        label:"Sprint 3", title:"Panel de presencia en tiempo real",
        tasks:[
          "Dashboard del encargado: quién está en el local en este momento",
          "Estado de cada empleado: En turno · En pausa · Fuera · Incidencia",
          "Historial de fichajes con edición manual justificada y trazabilidad de cambios",
          "Exportación de partes de horas a Excel (formato válido para inspección laboral)",
        ]
      }
    ],
    screens:[{
      title:"Presencia · Tiempo Real", gradient:["#4a9060","#2a5a38"],
      rows:[
        {ico:"🟢", main:"Carlos M. · Jefe de Sala", sub:"En turno desde 09:00 · 6h 14m acumuladas", badge:"ACTIVO", cls:"ok"},
        {ico:"🟢", main:"Ana R. · Cocinera", sub:"En turno desde 08:30 · 6h 44m acumuladas", badge:"ACTIVO", cls:"ok"},
        {ico:"🟡", main:"Luis P. · Camarero", sub:"En pausa desde las 14:45", badge:"PAUSA", cls:"warn"},
        {ico:"🔴", main:"Marta S. · Camarera", sub:"Turno 15:00 — aún no ha fichado", badge:"ALERTA", cls:"err"},
      ]
    }]
  },
  {
    num:"03", title:"Vacaciones, Ausencias y Turnos", duration:"Semanas 8–11", color:"#5080c8",
    sprints:[
      {
        label:"Sprint 4", title:"Gestión de vacaciones y ausencias",
        tasks:[
          "Solicitud de vacaciones desde la app del empleado: flujo de dos pasos",
          "Aprobación con notificación push al encargado y confirmación al empleado",
          "Tipos de ausencia: baja médica, asunto propio, ausencia injustificada, guardia",
          "Contador automático de días disponibles por empleado según convenio colectivo",
        ]
      },
      {
        label:"Sprint 5", title:"Calendario visual y planificación de turnos",
        tasks:[
          "Calendario mensual con vista de toda la plantilla codificada por colores",
          "Planificador semanal de turnos con drag & drop (arrastrar para reasignar)",
          "Detección automática de solapamientos y huecos de cobertura en el servicio",
          "Publicación de turnos con notificación push individual a cada empleado afectado",
        ]
      }
    ],
    screens:[{
      title:"Calendario de Plantilla", gradient:["#5080c8","#2a4898"],
      rows:[
        {ico:"📅", main:"Semana 23 · Junio 2025", sub:"8 empleados planificados · 3 turnos", badge:"PUBLICADO", cls:"ok"},
        {ico:"🏖️", main:"Vacaciones: Ana R.", sub:"15–22 Jun · Aprobadas por Carlos", badge:"OK", cls:"ok"},
        {ico:"🤒", main:"Baja médica: Pedro J.", sub:"Desde hoy · Parte enviado", badge:"BAJA", cls:"err"},
        {ico:"⚠️", main:"Cobertura insuficiente", sub:"Domingo 22 Jun · turno de tarde", badge:"REVISAR", cls:"warn"},
      ]
    }]
  },
  {
    num:"04", title:"App Móvil del Encargado y Analytics", duration:"Semanas 12–16", color:"#a04888",
    sprints:[
      {
        label:"Sprint 6", title:"PWA móvil optimizada para encargado",
        tasks:[
          "PWA instalable en iOS y Android (sin App Store, sin coste de publicación)",
          "Vista compacta de presencia: todos los empleados de un solo vistazo",
          "Notificaciones push: ausencias, alertas de fichaje, solicitudes pendientes de aprobar",
          "Acciones rápidas: aprobar vacaciones, registrar incidencia, contactar empleado",
        ]
      },
      {
        label:"Sprint 7", title:"Informes y cumplimiento laboral",
        tasks:[
          "Informe mensual de horas por empleado válido para la Inspección de Trabajo",
          "Cálculo automático de horas extra, horas nocturnas y festivos",
          "KPIs del local: rotación, absentismo y puntualidad con tendencia mensual",
          "Exportación en formato exigido por la Seguridad Social (RDL 8/2019)",
        ]
      }
    ],
    screens:[{
      title:"Analytics de Plantilla", gradient:["#a04888","#6a1858"],
      rows:[
        {ico:"📊", main:"Horas este mes · Junio", sub:"1.240 h contratadas · equipo completo", badge:"JUNIO", cls:"info"},
        {ico:"⏰", main:"Horas extra", sub:"34 h extra acumuladas · notificado", badge:"REVISAR", cls:"warn"},
        {ico:"📉", main:"Absentismo", sub:"2,1% este mes · dentro del umbral", badge:"OK", cls:"ok"},
        {ico:"🏆", main:"Puntualidad media", sub:"94% de fichajes realizados en hora", badge:"BIEN", cls:"ok"},
      ]
    }]
  }
];

const empleadosMilestones = [
  {week:"Semana 3", title:"Sistema de roles operativo", desc:"Propietario, encargado y empleado con accesos diferenciados, autenticación segura y 2FA activo."},
  {week:"Semana 7", title:"Fichaje en producción", desc:"Empleados fichando desde el móvil. Encargado viendo quién está en el local en tiempo real."},
  {week:"Semana 11", title:"Vacaciones y turnos funcionando", desc:"Flujo completo: solicitud → aprobación → calendario actualizado con notificación automática."},
  {week:"Semana 14", title:"PWA del encargado desplegada", desc:"Instalada en el móvil del encargado con notificaciones push y vista de presencia instantánea."},
  {week:"Semana 16", title:"🚀 Módulo certificado y vendible", desc:"Informes legales listos, cumplimiento RDL 8/2019 verificado y primeros clientes de pago activos."},
];

const phoneEmployees = [
  {initials:"CM", color:"#c88228", name:"Carlos M.", role:"Jefe de Sala", active:true},
  {initials:"AR", color:"#4a9060", name:"Ana R.", role:"Cocinera", active:true},
  {initials:"LP", color:"#5080c8", name:"Luis P.", role:"Camarero", active:false, paused:true},
  {initials:"MS", color:"#a04888", name:"Marta S.", role:"Camarera", active:false},
  {initials:"PJ", color:"#606060", name:"Pedro J.", role:"Ayudante cocina", active:false},
];

/* COMPONENTS */
function ScreenCard({screen}){
  return(
    <div className="screen-card">
      <div className="screen-topbar" style={{background:linear-gradient(135deg,${screen.gradient[0]},${screen.gradient[1]})}}>
        <span className="screen-topbar-title">{screen.title}</span>
        <div className="screen-topbar-dots">
          {["rgba(255,255,255,0.25)","rgba(255,255,255,0.4)","rgba(255,255,255,0.55)"].map((c,i)=>(
            <div key={i} className="screen-topbar-dot" style={{background:c}}/>
          ))}
        </div>
      </div>
      <div className="screen-body">
        {screen.rows.map((row,i)=>(
          <div key={i} className="screen-row">
            <span className="screen-row-ico">{row.ico}</span>
            <div className="screen-row-txt">
              <div className="screen-row-main">{row.main}</div>
              <div className="screen-row-sub">{row.sub}</div>
            </div>
            <span className={screen-badge ${row.cls}}>{row.badge}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneMock(){
  return(
    <div className="phone-wrap">
      <div className="phone">
        <div className="phone-notch"/>
        <div className="phone-screen">
          <div className="phone-bar">
            <h5>Tu Gestor Hostelero</h5>
            <p><span className="phone-live-dot"/>Presencia en tiempo real</p>
          </div>
          <div className="status-grid">
            {[{num:"8",lbl:"Turno hoy"},{num:"4",lbl:"En local"},{num:"1",lbl:"En pausa"},{num:"3",lbl:"Fuera"}].map((s,i)=>(
              <div key={i} className="status-card">
                <div className="num">{s.num}</div>
                <div className="lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
          <div className="emp-list">
            {phoneEmployees.map((e,i)=>(
              <div key={i} className="emp-row">
                <div className="avatar" style={{background:e.color}}>{e.initials}</div>
                <div className="emp-info">
                  <div className="emp-name">{e.name}</div>
                  <div className="emp-role">{e.role}</div>
                </div>
                <div className="status-dot" style={{
                  background: e.active?"#40c065": e.paused?"#c8a030":"#3a2a10"
                }}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Phase({phase, defaultOpen}){
  const [open, setOpen] = useState(defaultOpen||false);
  return(
    <div className="phase">
      <div className="phase-hdr" onClick={()=>setOpen(o=>!o)}>
        <div className="phase-num" style={{background:phase.color+"22",color:phase.color}}>{phase.num}</div>
        <div className="phase-meta">
          <h3>{phase.title}</h3>
          <span className="dur">{phase.duration}</span>
        </div>
        <span className={phase-chevron${open?" open":""}}>▼</span>
      </div>
      {open&&(
        <div className="phase-body">
          {phase.sprints.map((sp,si)=>(
            <div key={si} className="sprint">
              <h4>{sp.label} — {sp.title}</h4>
              {sp.tasks.map((t,ti)=>(
                <div key={ti} className="task">
                  <div className="task-dot" style={{background:phase.color}}/>
                  {t}
                </div>
              ))}
            </div>
          ))}
          <div className="screens-label">Pantallas incluidas en esta fase</div>
          <div className="screen-cards">
            {phase.screens.map((sc,si)=><ScreenCard key={si} screen={sc}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

function Milestones({items}){
  return(
    <div>
      <div className="milestones-title">Hitos Clave</div>
      <div className="milestones">
        {items.map((m,i)=>(
          <div key={i} className="ms-row">
            <div className="ms-line">
              <div className="ms-circle"/>
              {i<items.length-1&&<div className="ms-vline"/>}
            </div>
            <div className="ms-content">
              <div className="ms-week">{m.week}</div>
              <div className="ms-title">{m.title}</div>
              <div className="ms-desc">{m.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerifactuRoadmap(){
  return(
    <div className="content">
      <div className="section-header">
        <h2>Verifactu · Cumplimiento Fiscal</h2>
        <p>Módulo para que los restaurantes estén legalmente protegidos antes del vencimiento obligatorio. Integración directa con la AEAT, encadenamiento de registros SHA-256 y QR de verificación por ticket.</p>
        <div className="law-pill">
          <span className="law-pill-icon">⚖️</span>
          <p>Obligatorio para todo software de facturación en España · RD 1007/2023 · Objetivo: operativo antes del vencimiento legal 2025–2027</p>
        </div>
      </div>
      <div className="stats-row">
        <div className="stat"><div className="val">16</div><div className="lbl">Semanas</div></div>
        <div className="stat"><div className="val">7</div><div className="lbl">Sprints</div></div>
        <div className="stat"><div className="val">100%</div><div className="lbl">Legal</div></div>
      </div>
      {verifactuPhases.map((ph,i)=><Phase key={i} phase={ph} defaultOpen={i===0}/>)}
      <Milestones items={verifactuMilestones}/>
    </div>
  );
}

function EmpleadosRoadmap(){
  return(
    <div className="content">
      <div className="section-header">
        <h2>Gestión Integral del Empleado</h2>
        <p>Control de presencia, fichajes, turnos, vacaciones y ausencias. El encargado gestiona todo desde su móvil y ve el estado de cada empleado en tiempo real.</p>
        <div className="law-pill">
          <span className="law-pill-icon">📋</span>
          <p>Cumplimiento RDL 8/2019 — registro de jornada obligatorio en España · Exportación legal para la Inspección de Trabajo y la Seguridad Social</p>
        </div>
      </div>
      <div className="stats-row">
        <div className="stat"><div className="val">16</div><div className="lbl">Semanas</div></div>
        <div className="stat"><div className="val">7</div><div className="lbl">Sprints</div></div>
        <div className="stat"><div className="val">PWA</div><div className="lbl">Móvil</div></div>
      </div>
      <div className="phone-section">
        <h2>📱 Vista del Encargado · Tiempo Real</h2>
        <p>Desde su móvil, el encargado ve de un vistazo quién está en el local, quién está en pausa y quién no ha fichado aún.</p>
        <PhoneMock/>
      </div>
      {empleadosPhases.map((ph,i)=><Phase key={i} phase={ph} defaultOpen={i===0}/>)}
      <Milestones items={empleadosMilestones}/>
    </div>
  );
}

export default function App(){
  const [active, setActive] = useState("verifactu");
  return(
    <>
      <style>{css}</style>
      <div className="app">
        <div className="hero">
          <div className="hero-eyebrow">🍽️ Tu Gestor Hostelero · RS Global Suite</div>
          <h1>Roadmap de <em>Producto</em></h1>
          <p className="hero-sub">Plan técnico de desarrollo para los módulos de cumplimiento fiscal Verifactu y gestión integral de empleados con control móvil en tiempo real.</p>
        </div>
        <div className="tabs-wrap">
          <div className="tabs">
            <button className={tab${active==="verifactu"?" active":""}} onClick={()=>setActive("verifactu")}>
              <span className="tab-icon">⚖️</span>Verifactu<br/>Fiscal
            </button>
            <button className={tab${active==="empleados"?" active":""}} onClick={()=>setActive("empleados")}>
              <span className="tab-icon">👥</span>Gestión de<br/>Empleados
            </button>
          </div>
        </div>
        {active==="verifactu"?<VerifactuRoadmap/>:<EmpleadosRoadmap/>}
      </div>
    </>
  );
}