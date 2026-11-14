import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
export const runtime = "nodejs";
const prices:Record<string,number> = {"Publicación":5000,"Destacado":25500};
export async function POST(req:Request){
 try{
  const {plan,email,businessId}=await req.json();
  if(!prices[plan] || typeof email!=="string" || !email.includes("@")) return NextResponse.json({error:"Plan o correo no válido."},{status:400});
  const pub=process.env.WOMPI_PUBLIC_KEY;
  const integrity=process.env.WOMPI_INTEGRITY_SECRET;
  if(!pub || !integrity) return NextResponse.json({error:"Los pagos aún no están habilitados. Estamos terminando la configuración segura."},{status:503});
  const amount=prices[plan]*100;
  const reference="CE-"+randomUUID().replace(/-/g,"").slice(0,20);
  const signature=createHash("sha256").update(reference+amount+"COP"+integrity).digest("hex");
  const origin=process.env.NEXT_PUBLIC_SITE_URL || "https://cali-emprende.vercel.app";
  const params=new URLSearchParams({"public-key":pub,currency:"COP","amount-in-cents":String(amount),reference,"signature:integrity":signature,"redirect-url":origin+"/pago/resultado"});
  if(businessId) params.set("customer-data:legal-id",String(businessId).slice(0,30));
  return NextResponse.json({checkoutUrl:"https://checkout.wompi.co/p/?"+params.toString(),reference});
 }catch{return NextResponse.json({error:"No fue posible iniciar el pago."},{status:500});}
}
