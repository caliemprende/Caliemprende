import { NextResponse } from "next/server";
export const runtime = "nodejs";
const allowedPlans = new Set(["Gratis","Publicación","Destacado"]);
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const category = String(body.category || "").trim();
    const city = String(body.city || "Cali").trim();
    const whatsapp = String(body.whatsapp || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const description = String(body.description || "").trim();
    const plan = String(body.plan || "Gratis");
    if (!name || !category || !city || !whatsapp || !email) return NextResponse.json({error:"Completa todos los campos obligatorios."},{status:400});
    if (name.length>100 || description.length>1000 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({error:"Revisa los datos ingresados."},{status:400});
    if (!allowedPlans.has(plan)) return NextResponse.json({error:"Plan no válido."},{status:400});
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({error:"La conexión con la base de datos aún no está configurada."},{status:503});
    const response = await fetch(url + "/rest/v1/businesses", {
      method:"POST",
      headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"return=representation"},
      body:JSON.stringify({name,category,city,whatsapp,email,description,plan,status:"pending"})
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Supabase businesses insert:",response.status,detail);
      return NextResponse.json({error:"No pudimos guardar el registro. La base de datos necesita la configuración inicial."},{status:502});
    }
    return NextResponse.json({ok:true,business:(await response.json())?.[0]||null},{status:201});
  } catch {
    return NextResponse.json({error:"No pudimos procesar el registro."},{status:500});
  }
}
