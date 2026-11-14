import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
export const runtime = "nodejs";
function authorized(req:Request) {
 const expected=process.env.ADMIN_PASSWORD||"", supplied=req.headers.get("x-admin-password")||"";
 if(!expected||!supplied)return false;
 const a=Buffer.from(expected),b=Buffer.from(supplied);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export async function POST(req:Request) {
 if(!authorized(req))return NextResponse.json({error:"Contraseña incorrecta."},{status:401});
 try {
  const body=await req.json();
  const title=String(body.title||"").trim(),category=String(body.category||"Cultura").trim(),description=String(body.description||"").trim(),venue=String(body.venue||"").trim(),starts_at=String(body.starts_at||""),ticket_url=String(body.ticket_url||"").trim();\n  const latitude=body.latitude===""||body.latitude==null?null:Number(body.latitude),longitude=body.longitude===""||body.longitude==null?null:Number(body.longitude);
  if(!title||!venue||!starts_at||!Number.isFinite(Date.parse(starts_at)))return NextResponse.json({error:"Completa el nombre, lugar y fecha del evento."},{status:400});
  if((latitude===null)!==(longitude===null)|| (latitude!==null&&(!Number.isFinite(latitude)||latitude < -90||latitude>90)) || (longitude!==null&&(!Number.isFinite(longitude)||longitude < -180||longitude>180)))return NextResponse.json({error:"Las coordenadas deben ser válidas y estar completas."},{status:400});\n  if(ticket_url&&!/^https:\/\//i.test(ticket_url))return NextResponse.json({error:"El enlace debe comenzar por https://."},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)return NextResponse.json({error:"Falta configurar la conexión segura."},{status:503});
  const r=await fetch(url+"/rest/v1/events",{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({title,category,description,venue,starts_at,ticket_url:ticket_url||null,latitude,longitude,published:true})});
  if(!r.ok)return NextResponse.json({error:"No pudimos guardar el evento. Verifica que la tabla events esté creada en Supabase."},{status:502});
  return NextResponse.json({event:(await r.json())?.[0]||null},{status:201});
 } catch {return NextResponse.json({error:"No pudimos procesar el evento."},{status:400});}
}
