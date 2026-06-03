import { cookies } from "next/headers";
import Roadmaps from "../roadmaps";
import { loginRoadmap } from "./actions";

export default async function RoadmapPage() {
  const store = await cookies();
  const ok = store.get("roadmap_ok")?.value === "1";
  if (ok) {
    return <Roadmaps />;
  }
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#090806", fontFamily: "sans-serif" }}>
      <form action={loginRoadmap} style={{ background: "#1e1508", padding: 32, borderRadius: 14, width: 300, color: "#f4e4c0", display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 20, color: "#c88228" }}>Roadmap interno</h1>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>Introduce la contraseña para acceder.</p>
        <input name="password" type="password" placeholder="Contraseña" autoFocus
          style={{ padding: 10, borderRadius: 8, border: "1px solid #4a3a1a", background: "#0f0a04", color: "#fff" }} />
        <button type="submit" style={{ padding: 10, borderRadius: 8, border: "none", background: "#c88228", color: "#090806", fontWeight: 700, cursor: "pointer" }}>Entrar</button>
      </form>
    </div>
  );
}