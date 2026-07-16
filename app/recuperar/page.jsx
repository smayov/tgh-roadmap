'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';

/* ============================================================
   PÁGINA DE RECUPERACIÓN DE CONTRASEÑA  ·  ruta: /recuperar
   El usuario llega aquí desde el enlace del email.
   Supabase le crea una sesión temporal al abrir el enlace,
   y aquí solo tiene que escribir su nueva contraseña.
   ============================================================ */
export default function Recuperar() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [msg, setMsg] = useState('');
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Al abrir el enlace del email, Supabase deja una sesión temporal.
    // Si no hay sesión, es que el enlace no es válido o ha caducado.
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setMsg('Error: el enlace no es válido o ha caducado. Solicita uno nuevo desde la página de acceso.');
      }
      setCargando(false);
    });
  }, []);

  const guardar = async () => {
    setMsg('');
    if (password.length < 6) { setMsg('Error: la contraseña debe tener al menos 6 caracteres.'); return; }
    if (password !== password2) { setMsg('Error: las dos contraseñas no coinciden.'); return; }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setMsg('Error: ' + error.message); return; }

    setListo(true);
    setMsg('Contraseña actualizada correctamente.');
  };

  if (cargando) return <div style={wrap}><p style={{ color: '#B7C7BE' }}>Cargando…</p></div>;

  if (listo) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <h1 style={{ color: '#0D3A28', marginBottom: 8 }}>Contraseña actualizada</h1>
          <p style={{ color: '#5C6B61', marginBottom: 22, fontSize: 14 }}>Ya puedes entrar con tu nueva contraseña.</p>
          <button onClick={() => router.push('/acceso')} style={btn}>Ir a iniciar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={{ color: '#0D3A28', marginBottom: 6 }}>Nueva contraseña</h1>
        <p style={{ color: '#5C6B61', marginBottom: 18, fontSize: 14 }}>Escribe tu nueva contraseña dos veces.</p>

        <input style={input} type="password" placeholder="Nueva contraseña" value={password}
               onChange={(e) => setPassword(e.target.value)} />
        <input style={input} type="password" placeholder="Repite la contraseña" value={password2}
               onChange={(e) => setPassword2(e.target.value)} />

        <button onClick={guardar} style={btn}>Guardar contraseña</button>
        <button onClick={() => router.push('/acceso')} style={btnGhost}>Volver</button>

        {msg && <p style={{ marginTop: 14, fontSize: 14, color: msg.startsWith('Error') ? '#c0392b' : '#1A6A48' }}>{msg}</p>}
      </div>
    </div>
  );
}

const wrap = { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0D3A28', fontFamily: 'system-ui, sans-serif', padding: 20 };
const card = { background: '#fff', padding: 36, borderRadius: 18, width: 340, maxWidth: '92vw', boxShadow: '0 20px 50px rgba(0,0,0,.3)', textAlign: 'center' };
const input = { width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid #ccc', fontSize: 15, marginBottom: 12, boxSizing: 'border-box' };
const btn = { width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#1A6A48', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 10 };
const btnGhost = { width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #2E9E6B', background: 'transparent', color: '#1A6A48', fontWeight: 700, fontSize: 15, cursor: 'pointer' };