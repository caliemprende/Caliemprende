import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ events: [] });
  try {
    const r = await fetch(url + "/rest/v1/events?select=id,title,category,description,venue,starts_at,ticket_url,latitude,longitude&published=eq.true&starts_at=gte." + encodeURIComponent(new Date().toISOString()) + "&order=starts_at.asc&limit=30", {
      headers: { apikey: key, Authorization: "Bearer " + key }, next: { revalidate: 300 }
    });
    if (!r.ok) return NextResponse.json({ events: [] });
    return NextResponse.json({ events: await r.json() });
  } catch { return NextResponse.json({ events: [] }); }
}
