"use client";
import { useCallback, useState } from "react";

type Business = { id:string; name:string; category:string; city:string; whatsapp:string; email:string; description:string|null; plan:string; status:string; created_at:string };
export default function AdminPage() {
  const [password,setPassword]=useState("");
  const [authenticated,setAuthenticated]=useState(false);
  const [businesses,setBusinesses]=useState<Business[]>([]);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState("");
  const [filter,setFilter]=useState("pending");

  const load=useCallback(async (secret:string) => {
    setError("");
    const r=await fetch("/api/admin/businesses",{headers:{"x-admin-password":secret},cache:"no-store"});
    const j=await r.json();
    if(!r.ok) throw new Error(j.error||"No se pudo cargar el panel.");
    setBusinesses(j.businesses||[]);
    setAuthenticated(true);
  },[]);

  async function login(e:React.FormEvent){e.preventDefault();try{await load(password);}catch(err){setError(err instanceof Error?err.message:"Error de acceso.");}}
  async function changeStatus(id:string,status:string){
    setBusy(id);setError("");
    try{
      const r=await fetch("/api/admin/businesses",{method:"PATCH",headers:{"Content-Type":"application/json","x-admin-password":password},body:JSON.stringify({id,status})});
      const j=await r.json();if(!r.ok)throw new Error(j.error||"No se pudo actualizar.");
      setBusinesses(old=>old.map(b=>b.id===id?{...b,status}:b));
    }catch(err){setError(err instanceof Error?err.message:"Error al actualizar.");}
    finally{setBusy("");}
  }
  const shown=businesses.filter(b=>filter==="all"||b.status===filter);
  const label=(s:string)=>s==="approved"?"Aprobado":s==="rejected"?"Rechazado":"Pendiente";
  return <main style={{minHeight:"100vh",background:"#fff5fa",padding:"32px 16px",color:"#241e2b"}}>
    <div style={{maxWidth:1000,margin:"0 auto"}}>
      <a href="/" style={{color:"#df2685",fontWeight:800,textDecoration:"none"}}>✦ Cali Emprende</a>
      <h1 style={{fontSize:32,margin:"18px 0 6px"}}>Panel de administración</h1>
      <p style={{color:"#716a75",marginTop:0}}>Revisa solicitudes y decide qué negocios aparecen en el directorio.</p>
      {!authenticated ? <form onSubmit={login} style={{background:"white",padding:24,borderRadius:20,maxWidth:440,boxShadow:"0 8px 30px #251b2810"}}>
        <label style={{display:"block",fontWeight:700}}>Contraseña de administración</label>
        <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" style={{width:"100%",padding:14,border:"1px solid #ddd",borderRadius:12,margin:"10px 0 16px",fontSize:16}}/>
        <button style={{background:"#e92b8b",color:"white",border:0,borderRadius:30,padding:"13px 22px",fontWeight:800,fontSize:16}}>Entrar</button>
      </form> : <>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"22px 0"}}>
          {["pending","approved","rejected","all"].map(s=><button key={s} onClick={()=>setFilter(s)} style={{border:"1px solid #e7dce3",borderRadius:30,padding:"9px 16px",background:filter===s?"#e92b8b":"white",color:filter===s?"white":"#302936",fontWeight:700}}>{s==="all"?"Todos":label(s)} ({s==="all"?businesses.length:businesses.filter(b=>b.status===s).length})</button>)}
          <button onClick={()=>load(password).catch(e=>setError(e.message))} style={{marginLeft:"auto",border:"1px solid #ddd",borderRadius:30,padding:"9px 16px",background:"white"}}>Actualizar</button>
        </div>
        {shown.length===0?<div style={{background:"white",padding:24,borderRadius:16}}>No hay negocios en esta sección.</div>:shown.map(b=><article key={b.id} style={{background:"white",padding:20,borderRadius:18,marginBottom:14,boxShadow:"0 5px 20px #251b2808"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
            <div><h2 style={{fontSize:21,margin:"0 0 6px"}}>{b.name}</h2><span style={{color:"#756d79"}}>{b.category} · {b.city} · {b.plan}</span></div>
            <strong style={{color:b.status==="approved"?"#14804a":b.status==="rejected"?"#b42318":"#a15c00"}}>{label(b.status)}</strong>
          </div>
          <p style={{margin:"12px 0 6px"}}>{b.description||"Sin descripción"}</p>
          <p style={{color:"#655e69",fontSize:14,margin:"4px 0"}}>WhatsApp: {b.whatsapp} · Correo: {b.email}</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}>
            <button disabled={!!busy} onClick={()=>changeStatus(b.id,"approved")} style={{background:"#13834b",color:"white",border:0,borderRadius:24,padding:"10px 16px",fontWeight:700,opacity:busy?0.6:1}}>Aprobar y publicar</button>
            <button disabled={!!busy} onClick={()=>changeStatus(b.id,"rejected")} style={{background:"#fff0f0",color:"#a52222",border:"1px solid #f0caca",borderRadius:24,padding:"10px 16px",fontWeight:700}}>Rechazar</button>
            {b.status!=="pending"&&<button disabled={!!busy} onClick={()=>changeStatus(b.id,"pending")} style={{background:"white",border:"1px solid #ddd",borderRadius:24,padding:"10px 16px"}}>Dejar pendiente</button>}
          </div>
        </article>)}
      </>}
      {error&&<p role="alert" style={{background:"#fff0f0",color:"#a52222",padding:14,borderRadius:12,marginTop:16}}>{error}</p>}
    </div>
  </main>;
}
