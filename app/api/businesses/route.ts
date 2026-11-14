import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ businesses: [] });
  try {
    const response = await fetch(url + "/rest/v1/businesses?select=id,name,category,city,description,whatsapp,image_urls,instagram_url&status=eq.approved&order=created_at.desc&limit=100", {
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
    const body = await req.formData();
    const name = String(body.get("name") || "").trim();
    const category = String(body.get("category") || "").trim();
    const city = String(body.get("city") || "Cali").trim();
    const whatsappInput = String(body.get("whatsapp") || "").trim();
    const whatsapp = whatsappInput.replace(/[^0-9]/g, "");
    const email = String(body.get("email") || "").trim().toLowerCase();
    const description = String(body.get("description") || "").trim();
    const plan = String(body.get("plan") || "Gratis");
    const allowedPlans = new Set(["Gratis", "Emprendedor", "Destacado"]);
    if (!name || !category || !city || !whatsapp || !email) return NextResponse.json({ error: "Completa todos los campos obligatorios." }, { status: 400 });
    if (name.length > 100 || description.length > 1000 || city.length > 80 || whatsapp.length < 10 || whatsapp.length > 15 || !email.includes("@") || !email.includes(".")) return NextResponse.json({ error: "Revisa el nombre, ciudad, WhatsApp y correo. El WhatsApp debe incluir entre 10 y 15 dígitos." }, { status: 400 });
    if (!allowedPlans.has(plan)) return NextResponse.json({ error: "Plan no válido." }, { status: 400 });
    if (plan !== "Gratis") return NextResponse.json({ error: "Los planes pagos aún no están habilitados. Selecciona Gratis para enviar tu solicitud." }, { status: 400 });
    const instagramUrl = String(body.get("instagram_url") || "").trim();
    if (instagramUrl && (!(instagramUrl.startsWith("https://instagram.com/") || instagramUrl.startsWith("https://www.instagram.com/")) || instagramUrl.length > 300)) return NextResponse.json({ error: "Ingresa un enlace válido de Instagram." }, { status: 400 });
    const photos = body.getAll("photos").filter((item): item is File => item instanceof File && item.size > 0);
    if (photos.length > 3 || photos.some(file => !["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 3*1024*1024)) return NextResponse.json({ error: "Puedes subir hasta 3 fotos JPG, PNG o WEBP de máximo 3 MB cada una." }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !key) return NextResponse.json({ error: "La conexión segura con la base de datos aún no está configurada." }, { status: 503 });
    const imageUrls: string[] = [];
    for (const file of photos) {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const objectPath = crypto.randomUUID() + "." + extension;
      const upload = await fetch(supabaseUrl + "/storage/v1/object/business-photos/" + objectPath, { method: "POST", headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": file.type, "x-upsert": "false" }, body: await file.arrayBuffer() });
      if (!upload.ok) return NextResponse.json({ error: "No pudimos subir las fotos. Verifica que el almacenamiento de imágenes esté configurado." }, { status: 502 });
      imageUrls.push(supabaseUrl + "/storage/v1/object/public/business-photos/" + objectPath);
    }
    const response = await fetch(supabaseUrl + "/rest/v1/businesses", {
      method: "POST",
      headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ name, category, city, whatsapp, email, description, plan: "Gratis", status: "pending", instagram_url: instagramUrl || null, image_urls: imageUrls })
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
