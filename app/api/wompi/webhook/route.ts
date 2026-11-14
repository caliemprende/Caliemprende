import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
export const runtime = "nodejs";

function valueAtPath(obj: any, path: string): unknown {
  return path.split(".").reduce((value: any, key: string) => value?.[key], obj);
}

export async function POST(req: Request) {
  try {
    const event = await req.json();
    if (event?.event !== "transaction.updated") return NextResponse.json({ received: true });

    const secret = event?.environment === "test"
      ? process.env.WOMPI_TEST_EVENTS_SECRET
      : process.env.WOMPI_EVENTS_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;
    if (!secret || !supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });

    const properties = event?.signature?.properties;
    const checksum = String(req.headers.get("x-event-checksum") || event?.signature?.checksum || "").toLowerCase();
    if (!Array.isArray(properties) || !checksum || !Number.isFinite(Number(event.timestamp))) {
      return NextResponse.json({ error: "Firma ausente o evento incompleto" }, { status: 400 });
    }

    const signedValues = properties.map((path: string) => {
      const value = valueAtPath(event.data, path);
      if (value === undefined || value === null) throw new Error("Missing signed property");
      return String(value);
    }).join("");
    const expected = createHash("sha256").update(signedValues + String(event.timestamp) + secret).digest("hex");
    const actualBuffer = Buffer.from(checksum, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const tx = event?.data?.transaction;
    if (!tx?.reference || !tx?.status || !Number.isInteger(tx?.amount_in_cents)) {
      return NextResponse.json({ error: "Transacción incompleta" }, { status: 400 });
    }

    const baseHeaders = { apikey: supabaseKey, Authorization: "Bearer " + supabaseKey, "Content-Type": "application/json", Prefer: "return=representation" };
    const lookup = await fetch(supabaseUrl + "/rest/v1/payment_attempts?reference=eq." + encodeURIComponent(tx.reference) + "&select=reference,business_id,plan,amount_in_cents,status", { headers: baseHeaders, cache: "no-store" });
    if (!lookup.ok) return NextResponse.json({ error: "No se pudo validar la referencia" }, { status: 502 });
    const attempts = await lookup.json();
    const attempt = attempts?.[0];
    if (!attempt || Number(attempt.amount_in_cents) !== tx.amount_in_cents || tx.currency !== "COP") {
      return NextResponse.json({ error: "La referencia o el monto no coinciden" }, { status: 409 });
    }

    const updated = await fetch(supabaseUrl + "/rest/v1/payment_attempts?reference=eq." + encodeURIComponent(tx.reference), {
      method: "PATCH", headers: baseHeaders,
      body: JSON.stringify({ status: tx.status, wompi_transaction_id: tx.id || null, updated_at: new Date().toISOString() })
    });
    if (!updated.ok) return NextResponse.json({ error: "No se pudo actualizar el pago" }, { status: 502 });

    if (tx.status === "APPROVED") {
      const business = await fetch(supabaseUrl + "/rest/v1/businesses?id=eq." + encodeURIComponent(attempt.business_id), {
        method: "PATCH", headers: baseHeaders,
        body: JSON.stringify({ plan: attempt.plan, status: "approved" })
      });
      if (!business.ok) return NextResponse.json({ error: "Pago validado; no se pudo actualizar el negocio" }, { status: 502 });
    }
    return NextResponse.json({ received: true, verified: true });
  } catch (error) {
    console.error("Wompi webhook error:", error);
    return NextResponse.json({ error: "Evento inválido" }, { status: 400 });
  }
}
