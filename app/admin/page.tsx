"use client";
import { useCallback, useState } from "react";
type Business={id:string;name:string;category:string;city:string;whatsapp:string;email:string;description:string|null;plan:string;status:string;created_at:string};
type Payment={id:string;reference:string;business_id:string|null;plan:string;amount_in_cents:number;currency:string;status:string;wompi_transaction_id:string|null;created_at:string;updated_at:string};
export default function AdminPage(){
 const [password,setPassword]=useState("");
 const [authenticated,setAuthenticated]=useState(false);
 const [businesses,setBusinesses]=useState<Business[]>([]);
 const [payments,setPayments]=useState<Payment[]>([]);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState("");
 const [filter,setFilter]=useState("pending");
 const [section,setSection]=useState("businesses");
 const [eventForm,setEventForm]=useState({title:"",category:"Cultura",description:"",venue:"",starts_at:"",ticket_url:""});
 const [eventMessage,setEventMessage]=useState("");
 const load=useCallback(async(secret:string)=>{
  setError("");
  const r=await fetch("/api/admin/businesses",{headers:{"x-admin-password":secret},cache:"no-store"});
  const j=await r.json();if(!r.ok)throw new Error(j.error||"No se pudo cargar el panel.");
  setBusinesses(j.businesses||[]);setPayments(j.payments||[]);setAuthenticated(true);
 },[]);
 async function login(e:React.FormEvent){e.preventDefault();try{await load(password);}catch(err){setError(err instanceof Error?err.message:"Error de acceso.");}}
 async function changeStatus(id:string,status:string){
  setBusy(id);setError("");
  try{const r=await fetch("/api/admin/businesses",{method:"PATCH",headers:{"Content-Type":"application/json","x-admin-password":password},body:JSON.stringify({id,status})});const j=await r.json();if(!r.ok)throw new Error(j.error||"No se pudo actualizar.");setBusinesses(old=>old.map(b=>b.id===id?{...b,status}:b));}
  catch(err){setError(err instanceof Error?err.message:"Error al actualizar.");}finally{setBusy("");}
 }
 const shown=businesses.filter(b=>filter==="all"||b.status===filter);
 const label=(s:string)=>s==="approved"?"Aprobado":s==="rejected"?"Rechazado":"Pendiente";
 const money=(cents:number,currency:string)=>new Intl.NumberFormat("es-CO",{style:"currency",currency:currency||"COP",maximumFractionDigits:0}).format(cents/100);
 return <main style={{minHeight:"100vh",background:"#fff5fa",padding:"32px 16px",color:"#241e2b"}}>
 <div style={{maxWidth:1000,margin:"0 auto"}}>
 <a href="/" style={{color:"#df2685",fontWeight:800,textDecoration:"none"}}>✦ Cali Emprende</a>
 <h1 style={{fontSize:32,margin:"18px 0 6px"}}>Panel de administración</h1>
 <p style={{color:"#716a75",marginTop:0}}>Gestiona solicitudes, publicaciones y pagos de los emprendimientos.</p>
 {!authenticated?<form onSubmit={login} style={{background:"white",padding:24,borderRadius:20,maxWidth:440,boxShadow:"0 8px 30px #251b2810"}}>
 <label style={{display:"block",fontWeight:700}}>Contraseña de administración</label>
 <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" style={{width:"100%",padding:14,border:"1px solid #ddd",borderRadius:12,margin:"10px 0 16px",fontSize:16}}/>
 <button style={{background:"#e92b8b",color:"white",border:0,borderRadius:30,padding:"13px 22px",fontWeight:800,fontSize:16}}>Entrar</button>
 </form>:<>
 <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"22px 0"}}>
 <button onClick={()=>setSection("businesses")} style={{border:"1px solid #e7dce3",borderRadius:30,padding:"10px 18px",background:section==="businesses"?"#e92b8b":"white",color:section==="businesses"?"white":"#302936",fontWeight:800}}>Negocios ({businesses.length})</button>
 <button onClick={()=>setSection("events")} style={{border:"1px solid #e7dce3",borderRadius:30,padding:"10px 18px",background:section==="events"?"#e92b8b":"white",color:section==="events"?"white":"#302936",fontWeight:800}}>Eventos</button>\n <button onClick={()=>setSection("payments")} style={{border:"1px solid #e7dce3",borderRadius:30,padding:"10px 18px",background:section==="payments"?"#e92b8b":"white",color:section==="payments"?"white":"#302936",fontWeight:800}}>Pagos ({payments.length})</button>
 <button onClick={()=>load(password).catch(e=>setError(e.message))} style={{marginLeft:"auto",border:"1px solid #ddd",borderRadius:30,padding:"10px 16px",background:"white"}}>Actualizar</button>
 </div>
 {section==="events"?<section style={{background:"white",padding:24,borderRadius:18,marginTop:18}}>\n <h2 style={{marginTop:0}}>Publicar un evento en Cali</h2><p style={{color:"#716a75"}}>Los eventos publicados aparecerán en la sección “Qué hacer en Cali”.</p>\n <form onSubmit={async e=>{e.preventDefault();setBusy("event");setEventMessage("");try{const r=await fetch("/api/admin/events",{method:"POST",headers:{"Content-Type":"application/json","x-admin-password":password},body:JSON.stringify(eventForm)});const j=await r.json();if(!r.ok)throw new Error(j.error||"No se pudo publicar el evento.");setEventMessage("¡Evento publicado! Ya puede aparecer en la página.");setEventForm({title:"",category:"Cultura",description:"",venue:"",starts_at:"",ticket_url:""});}catch(err){setEventMessage(err instanceof Error?err.message:"Error al publicar.");}finally{setBusy("");}}} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>\n <label style={{display:"grid",gap:6,fontWeight:700}}>Nombre del evento<input required value={eventForm.title} onChange={e=>setEventForm({...eventForm,title:e.target.value})} style={{padding:12,border:"1px solid #ddd",borderRadius:10}}/></label>\n <label style={{display:"grid",gap:6,fontWeight:700}}>Categoría<select value={eventForm.category} onChange={e=>setEventForm({...eventForm,category:e.target.value})} style={{padding:12,border:"1px solid #ddd",borderRadius:10}}>{["Cultura","Concierto","Feria","Festival","Gastronomía","Familia","Deporte","Otro"].map(v=><option key={v}>{v}</option>)}</select></label>\n <label style={{display:"grid",gap:6,fontWeight:700}}>Lugar<input required value={eventForm.venue} onChange={e=>setEventForm({...eventForm,venue:e.target.value})} style={{padding:12,border:"1px solid #ddd",borderRadius:10}}/></label>\n <label style={{display:"grid",gap:6,fontWeight:700}}>Fecha y hora<input required type="datetime-local" value={eventForm.starts_at} onChange={e=>setEventForm({...eventForm,starts_at:e.target.value})} style={{padding:12,border:"1px solid #ddd",borderRadius:10}}/></label>\n <label style={{display:"grid",gap:6,fontWeight:700,gridColumn:"1/-1"}}>Descripción<textarea rows={3} value={eventForm.description} onChange={e=>setEventForm({...eventForm,description:e.target.value})} style={{padding:12,border:"1px solid #ddd",borderRadius:10}}/></label>\n <label style={{display:"grid",gap:6,fontWeight:700,gridColumn:"1/-1"}}>Enlace de información o entradas (opcional)<input type="url" value={eventForm.ticket_url} onChange={e=>setEventForm({...eventForm,ticket_url:e.target.value})} placeholder="https://" style={{padding:12,border:"1px solid #ddd",borderRadius:10}}/></label>\n <div><button disabled={busy==="event"} style={{background:"#e92b8b",color:"white",border:0,borderRadius:30,padding:"12px 20px",fontWeight:800}}>{busy==="event"?"Publicando...":"Publicar evento"}</button></div></form>\n {eventMessage&&<p role="status" style={{background:"#fff2e9",padding:12,borderRadius:10}}>{eventMessage}</p>}\n </section>:section==="businesses"?<>
 <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"18px 0"}}>
 {["pending","approved","rejected","all"].map(s=><button key={s} onClick={()=>setFilter(s)} style={{border:"1px solid #e7dce3",borderRadius:30,padding:"9px 16px",background:filter===s?"#e92b8b":"white",color:filter===s?"white":"#302936",fontWeight:700}}>{s==="all"?"Todos":label(s)} ({s==="all"?businesses.length:businesses.filter(b=>b.status===s).length})</button>)}
 </div>
 {shown.length===0?<div style={{background:"white",padding:24,borderRadius:16}}>No hay negocios en esta sección.</div>:shown.map(b=><article key={b.id} style={{background:"white",padding:20,borderRadius:18,marginBottom:14,boxShadow:"0 5px 20px #251b2808"}}>
 <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><h2 style={{fontSize:21,margin:"0 0 6px"}}>{b.name}</h2><span style={{color:"#756d79"}}>{b.category} · {b.city} · {b.plan}</span></div><strong style={{color:b.status==="approved"?"#14804a":b.status==="rejected"?"#b42318":"#a15c00"}}>{label(b.status)}</strong></div>
 <p style={{margin:"12px 0 6px"}}>{b.description||"Sin descripción"}</p><p style={{color:"#655e69",fontSize:14,margin:"4px 0"}}>WhatsApp: {b.whatsapp} · Correo: {b.email}</p>
 <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}>
 <button disabled={!!busy} onClick={()=>changeStatus(b.id,"approved")} style={{background:"#13834b",color:"white",border:0,borderRadius:24,padding:"10px 16px",fontWeight:700,opacity:busy?0.6:1}}>Aprobar y publicar</button>
 <button disabled={!!busy} onClick={()=>changeStatus(b.id,"rejected")} style={{background:"#fff0f0",color:"#a52222",border:"1px solid #f0caca",borderRadius:24,padding:"10px 16px",fontWeight:700}}>Rechazar</button>
 {b.status!=="pending"&&<button disabled={!!busy} onClick={()=>changeStatus(b.id,"pending")} style={{background:"white",border:"1px solid #ddd",borderRadius:24,padding:"10px 16px"}}>Dejar pendiente</button>}
 </div></article>)}
 </>:<>
 {payments.length===0?<div style={{background:"white",padding:24,borderRadius:16}}>Todavía no hay intentos de pago registrados.</div>:payments.map(p=><article key={p.id} style={{background:"white",padding:20,borderRadius:18,marginBottom:12}}>
 <div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><strong>{p.plan}</strong><strong style={{color:p.status==="APPROVED"?"#14804a":p.status==="DECLINED"?"#b42318":"#a15c00"}}>{p.status}</strong></div>
 <div style={{fontSize:25,fontWeight:800,color:"#df2685",margin:"8px 0"}}>{money(p.amount_in_cents,p.currency)}</div>
 <p style={{fontSize:14,color:"#6f6873",overflowWrap:"anywhere",margin:"4px 0"}}>Referencia: {p.reference}</p>
 <p style={{fontSize:14,color:"#6f6873",margin:"4px 0"}}>ID de negocio: {p.business_id||"No asociado"}</p>
 <p style={{fontSize:13,color:"#8a828d",margin:"8px 0 0"}}>Creado: {new Date(p.created_at).toLocaleString("es-CO")}</p>
 </article>)}
 </>}
 </>}
 {error&&<p role="alert" style={{background:"#fff0f0",color:"#a52222",padding:14,borderRadius:12,marginTop:16}}>{error}</p>}
 </div></main>;
}
