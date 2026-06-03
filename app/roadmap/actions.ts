"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const PASSWORD = process.env.ROADMAP_PASSWORD || "Privado242_vt";

export async function loginRoadmap(formData: FormData) {
  const pass = formData.get("password");
  if (typeof pass === "string" && pass === PASSWORD) {
    const store = await cookies();
    store.set("roadmap_ok", "1", { httpOnly: true, path: "/roadmap", maxAge: 60 * 60 * 8 });
  }
  redirect("/roadmap");
}