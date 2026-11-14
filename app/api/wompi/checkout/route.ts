import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
export const runtime = "nodejs";

const prices: Record<string, number> = { "Publicación": 5000, "Destacado": 25500 };

export async function POST(req: Request) {
  try {
    const { plan, email, businessId } = await req.json();
    if (!prices[plan] || typeof email !== "string" || !email.includes("@") || typeof businessId !== "string") {
      return NextResponse.json({ error: "Selecciona un plan pago y registra primero tu negocio." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;
    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    if (!supabaseUrl || !supabaseKey || !publicKey || !integritySecret) {
      return NextResponse.json({ error: "Los pagos aún no están habilitados. Falta completar la configuración segura." }, { status: 503 });
    }

    const amount = prices[plan] * 100;
    const reference = "CE-" + randomUUID().replace(/-/g, "").slice(0, 24);
    const signature = createHash("sha256").update(reference + amount + "COP" + integritySecret).digest("hex");

    const insert = await fetch(supabaseUrl + "/rest/v1/payment_attempts", {
      method: "POST",
      headers: { apikey: supabaseKey, Authorization: "Bearer " + supabaseKey, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ reference, business_id: businessId, plan, amount_in_cents: amount, currency: "COP", status: "PENDING" })
    });
    if (!insert.ok) {
      console.error("Supabase payment attempt insert:", insert.status, await insert.text());
      return NextResponse.json({ error: "No pudimos preparar el pago. Verifica que el esquema de Supabase esté instalado." }, { status: 502 });
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://cali-emprende.vercel.app";
    const params = new URLSearchParams({
      "public-key": publicKey, currency: "COP", "amount-in-cents": String(amount),
      reference, "signature:integrity": signature, "redirect-url": origin + "/pago/resultado"
    });
    return NextResponse.json({ checkoutUrl: "https://checkout.wompi.co/p/?" + params.toString(), reference });
  } catch {
    return NextResponse.json({ error: "No fue posible iniciar el pago." }, { status: 500 });
  }
}
