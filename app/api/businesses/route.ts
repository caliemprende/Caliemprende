import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ businesses: [] });
  try {
    const response = await fetch(url + "/rest/v1/businesses?select=id,name,category,city,description,whatsapp&status=eq.approved&order=created_at.desc&limit=100", {
      headers: { apikey: key, Authorization: "Bearer " + key },
      next: { revalidate: 60 }
    });
    if (!response.ok) {
      console.error("Supabase public catalog:", response.status, await response.text());
      return NextResponse.json({ businesses: [] });
    }
    return NextResponse.json({ businesses: await response.json() });
  } catch {
    return NextResponse.json({ businesses: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const category = String(body.category || "").trim();
    const city = String(body.city || "Cali").trim();
    const whatsappInput = String(body.whatsapp || "").trim();
    const whatsapp = whatsappInput.replace(/[^0-9]/g, "");
    const email = String(body.email || "").trim().toLowerCase();
    const description = String(body.description || "").trim();
    const plan = String(body.plan || "Gratis");
    const allowedPlans = new Set(["Gratis", "Emprendedor", "Destacado"]);
    if (!name || !category || !city || !whatsapp || !email) return NextResponse.json({ error: "Completa todos los campos obligatorios." }, { status: 400 });
    if (name.length > 100 || description.length > 1000 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Revisa los datos ingresados." }, { status: 400 });
    if (!allowedPlans.has(plan)) return NextResponse.json({ error: "Plan no válido." }, { status: 400 });
    if (plan !== "Gratis") return NextResponse.json({ error: "Los planes pagos aún no están habilitados. Selecciona Gratis para enviar tu solicitud." }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !key) return NextResponse.json({ error: "La conexión segura con la base de datos aún no está configurada." }, { status: 503 });
    const response = await fetch(supabaseUrl + "/rest/v1/businesses", {
      method: "POST",
      headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ name, category, city, whatsapp, email, description, plan: "Gratis", status: "pending" })
    });
    if (!response.ok) {
      console.error("Supabase businesses insert:", response.status, await response.text());
      return NextResponse.json({ error: "No pudimos guardar el registro. Verifica que el esquema de Supabase esté instalado." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, business: (await response.json())?.[0] || null }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No pudimos procesar el registro." }, { status: 500 });
  }
}
