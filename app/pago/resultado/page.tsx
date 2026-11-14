"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResultContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const status = params.get("status");

  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#fff7fb",fontFamily:"Arial,sans-serif"}}>
      <section style={{maxWidth:520,width:"100%",background:"#fff",padding:32,borderRadius:24,boxShadow:"0 12px 40px rgba(80,20,50,.10)",textAlign:"center"}}>
        <div style={{fontSize:42}}>🌺</div>
        <h1 style={{color:"#c21870"}}>Gracias por apoyar a Cali Emprende</h1>
        <p>Wompi nos está devolviendo el resultado de tu pago. La confirmación definitiva se realiza de forma segura cuando recibimos y validamos la notificación del pago.</p>
        {status && <p><strong>Estado informado por Wompi:</strong> {status}</p>}
        {id && <p style={{fontSize:12,color:"#666",overflowWrap:"anywhere"}}>Referencia de consulta: {id}</p>}
        <p>Si tu pago fue aprobado, actualizaremos tu publicación cuando la confirmación quede verificada. Si tienes dudas, conserva el comprobante de Wompi.</p>
        <a href="/" style={{display:"inline-block",marginTop:16,padding:"12px 22px",borderRadius:999,background:"#ed1688",color:"#fff",textDecoration:"none",fontWeight:700}}>Volver a Cali Emprende</a>
      </section>
    </main>
  );
}

export default function PaymentResultPage() {
  return <Suspense fallback={<main style={{padding:32}}>Consultando resultado…</main>}><ResultContent /></Suspense>;
}
