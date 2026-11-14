import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
export const runtime = "nodejs";
function authorized(req:Request){
 const expected=process.env.ADMIN_PASSWORD||"";
 const supplied=req.headers.get("x-admin-password")||"";
 if(!expected||!supplied)return false;
 const a=Buffer.from(expected),b=Buffer.from(supplied);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export async function GET(req:Request){
 if(!authorized(req))return NextResponse.json({error:"Contraseña incorrecta."},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)return NextResponse.json({error:"Falta configurar la conexión segura."},{status:503});
 const r=await fetch(url+"/rest/v1/businesses?select=id,name,category,city,whatsapp,email,description,plan,status,created_at&order=created_at.desc&limit=200",{headers:{apikey:key,Authorization:"Bearer "+key},cache:"no-store"});
 if(!r.ok)return NextResponse.json({error:"No pudimos consultar los negocios."},{status:502});
 return NextResponse.json({businesses:await r.json()});
}
export async function PATCH(req:Request){
 if(!authorized(req))return NextResponse.json({error:"Contraseña incorrecta."},{status:401});
 try{
  const {id,status}=await req.json();
  if(typeof id!=="string"||!["approved","rejected","pending"].includes(status))return NextResponse.json({error:"Solicitud no válida."},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)return NextResponse.json({error:"Falta configurar la conexión segura."},{status:503});
  const r=await fetch(url+"/rest/v1/businesses?id=eq."+encodeURIComponent(id),{method:"PATCH",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({status})});
  if(!r.ok)return NextResponse.json({error:"No pudimos actualizar el negocio."},{status:502});
  return NextResponse.json({business:(await r.json())?.[0]||null});
 }catch{return NextResponse.json({error:"No pudimos procesar la solicitud."},{status:400});}
}
