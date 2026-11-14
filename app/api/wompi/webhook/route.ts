import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
export const runtime = "nodejs";
function getPath(obj:any,path:string):any{return path.split(".").reduce((v,k)=>v?.[k],obj);}
export async function POST(req:Request){
 try{
  const event=await req.json();
  if(event?.event!=="transaction.updated") return NextResponse.json({received:true});
  const secret=process.env.WOMPI_EVENTS_SECRET;
  if(!secret) return NextResponse.json({error:"Webhook no configurado"},{status:503});
  const props=event?.signature?.properties;
  const received=String(event?.signature?.checksum||req.headers.get("x-event-checksum")||"").toLowerCase();
  if(!Array.isArray(props)||!received) return NextResponse.json({error:"Firma ausente"},{status:400});
  const raw=props.map((p:string)=>String(getPath(event.data,p)??"")).join("")+String(event.timestamp)+secret;
  const calculated=createHash("sha256").update(raw).digest("hex").toLowerCase();
  const a=Buffer.from(calculated,"hex"),b=Buffer.from(received,"hex");
  if(a.length!==b.length||!timingSafeEqual(a,b)) return NextResponse.json({error:"Firma inválida"},{status:401});
  const tx=event?.data?.transaction;
  if(!tx?.reference || !tx?.status) return NextResponse.json({error:"Transacción incompleta"},{status:400});
  // El registro de pago se completa al añadir la tabla payment_attempts en Supabase.
  // No se activa ningún plan sin validar referencia, monto y negocio contra esa tabla.
  console.info("Wompi event verified", {reference:tx.reference,status:tx.status,amount:tx.amount_in_cents});
  return NextResponse.json({received:true,verified:true});
 }catch{return NextResponse.json({error:"Evento inválido"},{status:400});}
}
