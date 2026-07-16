"use client";

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useRouter } from "next/navigation";

export default function Acceso() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { redirigirSegunEstado(data.user); return; }
      setCargando(false);
    });
  }, []);

  const registrar = async () => {
    setMsg("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setMsg("Error: " + error.message); return; }

    const nuevoUser = data.user;
    if (nuevoUser) {
      // Crear el negocio del usuario si aún no tiene uno
      const { data: negocioExistente } = await supabase
        .from("negocios")
        .select("id")
        .eq("propietario", nuevoUser.id)
        .maybeSingle();

      if (!negocioExistente) {
        await supabase.from("negocios").insert({
          propietario: nuevoUser.id,
          nombre: "Mi negocio",
        });
      }
    }
    setMsg("Cuenta creada. Ya puedes iniciar sesión.");
  };

  const entrar = async () => {
    setMsg("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMsg("Error: " + error.message); return; }
    await redirigirSegunEstado(data.user);
  };
const recuperar = async () => {
    setMsg("");
    if (!email) { setMsg("Error: escribe tu correo arriba y vuelve a pulsar."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://www.tugestorhostelero.es/recuperar",
    });
    if (error) { setMsg("Error: " + error.message); return; }
    setMsg("Te hemos enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.");
  };
  const salir = async () => { await supabase.auth.signOut(); setMsg(""); };

  // Decide a dónde llevar al usuario: panel si ya tiene módulos, catálogo si no.
  const redirigirSegunEstado = async (u) => {
    const { data: negocio } = await supabase
      .from("negocios")
      .select("id")
      .eq("propietario", u.id)
      .maybeSingle();

    if (negocio) {
      const { data: mods } = await supabase
        .from("modulos_activos")
        .select("id")
        .eq("negocio_id", negocio.id)
        .eq("estado", "activo")
        .limit(1);
      if (mods && mods.length > 0) { router.replace("/panel"); return; }
    }
    router.replace("/catalogo");
  };

  if (cargando) return <div style={wrap}><p style={{color:"#fff"}}>Cargando...</p></div>;



  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={{ color: "#0D3A28", marginBottom: 6 }}>Acceso</h1>
        <p style={{ color: "#5C6B61", marginBottom: 18, fontSize: 14 }}>Entra o crea tu cuenta.</p>
        <input style={input} type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={input} type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={entrar} style={btn}>Iniciar sesión</button>
        <button onClick={registrar} style={btnGhost}>Crear cuenta</button>
        <button onClick={entrar} style={btn}>Iniciar sesión</button>
        <button onClick={registrar} style={btnGhost}>Crear cuenta</button>
        <button onClick={recuperar} style={linkOlvido}>¿Olvidaste tu contraseña?</button>
        <button onClick={entrar} style={btn}>Iniciar sesión</button>
        <button onClick={registrar} style={btnGhost}>Crear cuenta</button>
        <button onClick={recuperar} style={linkOlvido}>¿Olvidaste tu contraseña?</button>
        {msg && <p style={{ marginTop: 14, fontSize: 14, color: msg.startsWith("Error") ? "#c0392b" : "#1A6A48" }}>{msg}</p>}
      </div>
    </div>
  );
}

const wrap = { minHeight: "100vh", display: "grid", placeItems: "center", background: "#0D3A28", fontFamily: "system-ui, sans-serif", padding: 20 };
const card = { background: "#fff", padding: 36, borderRadius: 18, width: 340, maxWidth: "92vw", boxShadow: "0 20px 50px rgba(0,0,0,.3)" };
const input = { width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #ccc", fontSize: 15, marginBottom: 12, boxSizing: "border-box" };
const btn = { width: "100%", padding: 12, borderRadius: 10, border: "none", background: "#1A6A48", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 };
const btnGhost = { width: "100%", padding: 12, borderRadius: 10, border: "1.5px solid #2E9E6B", background: "transparent", color: "#1A6A48", fontWeight: 700, fontSize: 15, cursor: "pointer" };
const linkOlvido = { width: "100%", marginTop: 14, background: "none", border: "none", color: "#5C6B61", fontSize: 13.5, textDecoration: "underline", cursor: "pointer" };