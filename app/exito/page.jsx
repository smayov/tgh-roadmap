export default function Exito() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0D3A28", fontFamily: "system-ui, sans-serif", padding: 20, textAlign: "center" }}>
      <div style={{ background: "#fff", padding: 40, borderRadius: 18, maxWidth: 420 }}>
        <div style={{ fontSize: 48 }}>✅</div>
        <h1 style={{ color: "#0D3A28", margin: "10px 0" }}>¡Pago realizado!</h1>
        <p style={{ color: "#5C6B61" }}>Gracias por contratar Tu Gestor Hostelero. (Prueba en modo test.)</p>
        <a href="/" style={{ display: "inline-block", marginTop: 16, background: "#1A6A48", color: "#fff", padding: "12px 22px", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>Volver al inicio</a>
      </div>
    </div>
  );
}