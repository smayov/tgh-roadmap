"use client";

export default function Landing() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
:root{
  --bg:#F3F1E7; --card:#FFFFFF; --ink:#15271C;
  --green-900:#0D3A28; --green-700:#1A6A48; --green-500:#2E9E6B;
  --lime:#BCE05A; --teal:#199E94; --muted:#5C6B61; --line:#E2E0D2;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Hanken Grotesk',sans-serif;color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased;line-height:1.55;overflow-x:hidden;
  background-image:radial-gradient(circle at 12% -5%,rgba(46,158,107,.12),transparent 45%),radial-gradient(circle at 95% 0%,rgba(25,158,148,.10),transparent 42%);}
h1,h2,.brand{font-family:'Bricolage Grotesque',sans-serif;letter-spacing:-.02em}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
header{padding:18px 0}
nav{display:flex;align-items:center;gap:18px;flex-wrap:wrap;row-gap:12px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.12rem}
.mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--green-700),var(--green-500));display:grid;place-items:center;color:#fff;font-size:.9rem}
.links{display:flex;gap:22px;margin-left:14px}
.links a{color:var(--muted);text-decoration:none;font-weight:600;font-size:.95rem}
.links a:hover{color:var(--green-700)}
.nav-cta{margin-left:auto;display:flex;align-items:center;gap:12px}
.btn{border:none;border-radius:12px;padding:11px 20px;font-family:inherit;font-weight:700;font-size:.95rem;cursor:pointer;text-decoration:none;display:inline-block}
.btn-primary{background:var(--green-700);color:#fff}
.btn-primary:hover{background:var(--green-900)}
.btn-ghost{background:transparent;color:var(--green-700);border:1.5px solid var(--green-500);padding:9.5px 18px}
.btn-ghost:hover{background:rgba(46,158,107,.08)}
.hero{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center;padding:64px 0 40px}
.hero .pill{display:inline-block;background:var(--lime);color:var(--green-900);font-weight:700;font-size:.8rem;padding:6px 14px;border-radius:100px;margin-bottom:18px}
.hero h1{font-size:2.9rem;line-height:1.08;font-weight:800;color:var(--green-900)}
.hero p.sub{font-size:1.15rem;color:var(--muted);margin-top:18px;max-width:30em}
.hero-cta{display:flex;gap:14px;margin-top:28px;flex-wrap:wrap}
.btn-lg{padding:14px 26px;font-size:1.02rem}
.hero .note{margin-top:18px;font-size:.9rem;color:var(--muted)}
.hero .note b{color:var(--green-700)}
.preview{background:var(--card);border:1px solid var(--line);border-radius:22px;box-shadow:0 30px 60px -30px rgba(13,58,40,.4);padding:16px}
.pv-bar{display:flex;align-items:center;gap:10px;padding:8px 6px 14px;border-bottom:1px solid var(--line)}
.pv-bar .mark{width:24px;height:24px;border-radius:7px;font-size:.7rem}
.pv-bar b{font-size:.92rem}
.pv-ava{margin-left:auto;width:28px;height:28px;border-radius:50%;background:var(--teal);color:#fff;display:grid;place-items:center;font-weight:700;font-size:.72rem}
.pv-health{display:flex;align-items:center;gap:12px;background:rgba(46,158,107,.12);border-radius:14px;padding:14px 16px;margin:16px 0}
.pv-health .dot{width:34px;height:34px;border-radius:50%;background:var(--green-500);color:#fff;display:grid;place-items:center;font-weight:800}
.pv-health small{display:block;color:var(--green-700);font-weight:600;font-size:.78rem}
.pv-health strong{color:var(--green-900);font-size:1rem}
.pv-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pv-c{border:1px solid var(--line);border-radius:14px;padding:14px}
.pv-c span{font-size:.78rem;color:var(--muted)}
.pv-c b{display:block;font-family:'Bricolage Grotesque';font-weight:800;font-size:1.45rem;color:var(--green-900);margin-top:2px}
.pv-c em{font-style:normal;font-size:.8rem;color:var(--green-500);font-weight:700}
.pv-foot{text-align:center;font-size:.74rem;color:var(--muted);margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}
.values{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:30px 0 70px}
.val{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px}
.val .ic{font-size:1.5rem}
.val h3{font-family:'Bricolage Grotesque';font-weight:700;font-size:1.1rem;margin:10px 0 6px;color:var(--green-900)}
.val p{color:var(--muted);font-size:.95rem}
footer{border-top:1px solid var(--line);padding:26px 0;color:var(--muted);font-size:.88rem;text-align:center}
@media(max-width:860px){
  .hero{grid-template-columns:1fr;gap:32px;padding:40px 0 24px}
  .hero h1{font-size:2.2rem}
  .values{grid-template-columns:1fr}
  .links{display:none}
  .brand{font-size:1rem}
  .nav-cta{gap:8px}
  .btn{padding:9px 14px;font-size:.88rem}
}
      `}} />

      <div className="wrap">
        <header>
          <nav>
            <div className="brand"><span className="mark">◆</span> Tu Gestor Hostelero</div>
            <div className="links">
              <a href="/planes">Módulos</a>
              <a href="/planes">Precios</a>
            </div>
            <div className="nav-cta">
              <a href="/acceso" className="btn btn-ghost">Acceder</a>
              <a href="/planes" className="btn btn-primary">Ver planes</a>
            </div>
          </nav>
        </header>

        <section className="hero">
          <div>
            <span className="pill">📊 Incluye gratis el panel de Salud Financiera</span>
            <h1>Tu negocio hostelero, en regla y bajo control.</h1>
            <p className="sub">Cumple con VeriFactu, controla tus números y fideliza a tus clientes. Sin hojas de cálculo y sin sustos con Hacienda.</p>
            <div className="hero-cta">
              <a href="/planes" className="btn btn-primary btn-lg">Ver planes desde 15 €/mes</a>
              <a href="/acceso" className="btn btn-ghost btn-lg">Ya soy cliente</a>
            </div>
            <p className="note">Elige solo los módulos que necesitas. <b>Sin permanencia.</b></p>
          </div>

          <div className="preview" aria-label="Vista previa de la app">
            <div className="pv-bar">
              <span className="mark">◆</span><b>Tu Gestor Hostelero</b>
              <span className="pv-ava">ST</span>
            </div>
            <div className="pv-health">
              <span className="dot">✓</span>
              <div><small>Salud del negocio · este mes</small><strong>Vas bien: ventas al alza</strong></div>
            </div>
            <div className="pv-cards">
              <div className="pv-c"><span>Ventas del mes</span><b>12.400 €</b><em>↑ +8%</em></div>
              <div className="pv-c"><span>Coste de personal</span><b>34%</b><em>controlado</em></div>
            </div>
            <div className="pv-foot">Vista de ejemplo · así se verá tu panel cuando entres</div>
          </div>
        </section>

        <section className="values">
          <div className="val">
            <div className="ic">🧾</div>
            <h3>Cumple con VeriFactu</h3>
            <p>Facturación legal lista para la obligatoriedad de Hacienda, sin que tengas que entender la letra pequeña.</p>
          </div>
          <div className="val">
            <div className="ic">🌿</div>
            <h3>Fácil, sin líos</h3>
            <p>Pensado para el bar de barrio, no para un máster en gestión. Lo entiendes de un vistazo.</p>
          </div>
          <div className="val">
            <div className="ic">💶</div>
            <h3>Precio claro</h3>
            <p>Desde 15 €/mes y solo lo que uses. Sin presupuestos opacos ni sorpresas.</p>
          </div>
        </section>

        <footer>
          Tu Gestor Hostelero · tugestorhostelero.es — Hecho para la hostelería.
        </footer>
      </div>
    </>
  );
}