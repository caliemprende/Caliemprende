"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const places = [
 {slug:"galeria-alameda",name:"Galería Alameda",kind:"Gastronomía y mercado",emoji:"🥭"},
 {slug:"gato-del-rio",name:"Gato del Río",kind:"Icono de Cali",emoji:"🐈"},
 {slug:"bulevar-del-rio",name:"Bulevar del Río",kind:"Paseo urbano",emoji:"🌇"},
 {slug:"capilla-san-antonio",name:"Capilla de San Antonio",kind:"Patrimonio",emoji:"⛪"},
 {slug:"cristo-rey",name:"Cristo Rey",kind:"Mirador",emoji:"🌄"},
 {slug:"parque-banderas",name:"Parque de las Banderas",kind:"Parque",emoji:"🌳"},
 {slug:"parque-del-perro",name:"Parque del Perro",kind:"Parque y gastronomía",emoji:"🐕"},
 {slug:"zoologico-cali",name:"Zoológico de Cali",kind:"Naturaleza",emoji:"🦋"},
 {slug:"loma-de-la-cruz",name:"Parque Artesanal Loma de la Cruz",kind:"Artesanías",emoji:"🎨"},
 {slug:"plazoleta-jairo-varela",name:"Plazoleta Jairo Varela",kind:"Cultura",emoji:"🎷"},
 {slug:"parque-del-ingenio",name:"Parque del Ingenio",kind:"Parque",emoji:"🌴"}
];
type Visit={place_slug:string;visited:boolean;photo_path:string|null;visited_at:string|null};
type Comment={id:string;place_slug:string;display_name:string;content:string;created_at:string};
type Reaction={place_slug:string;reaction:string;user_id:string};
const bucket="pasaporte-cali-privado";

export default function CommunityPassport(){
 const [client,setClient]=useState<SupabaseClient|null>(null);
 const [user,setUser]=useState<User|null>(null);
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [displayName,setDisplayName]=useState("");
 const [mode,setMode]=useState<"login"|"signup">("signup");
 const [visits,setVisits]=useState<Visit[]>([]); const [comments,setComments]=useState<Comment[]>([]); const [reactions,setReactions]=useState<Reaction[]>([]);
 const [drafts,setDrafts]=useState<Record<string,string>>({}); const [photoUrls,setPhotoUrls]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(false); const [notice,setNotice]=useState("");
 useEffect(()=>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key){setNotice("Falta configurar Supabase para activar las cuentas y la comunidad.");return;}
  const supabase=createClient(url,key);setClient(supabase);
  supabase.auth.getSession().then(({data})=>setUser(data.session?.user??null));
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null));
  return()=>subscription.unsubscribe();
 },[]);
 async function refresh(){
  if(!client)return;
  const [{data:v,error:ve},{data:c,error:ce},{data:r,error:re}]=await Promise.all([
   client.from("place_visits").select("place_slug,visited,photo_path,visited_at"),
   client.from("place_comments").select("id,place_slug,display_name,content,created_at").order("created_at",{ascending:false}).limit(250),
   client.from("place_reactions").select("place_slug,reaction,user_id")
  ]);
  if(ve||ce||re){setNotice("No se pudo cargar la comunidad. Comprueba que la migración de Supabase esté aplicada.");return;}
  const vv=(v||[]) as Visit[];setVisits(vv);setComments((c||[]) as Comment[]);setReactions((r||[]) as Reaction[]);
  const urls:Record<string,string>={};
  for(const item of vv){if(item.photo_path){const {data}=await client.storage.from(bucket).createSignedUrl(item.photo_path,300);if(data?.signedUrl)urls[item.place_slug]=data.signedUrl;}}
  setPhotoUrls(urls);
 }
 useEffect(()=>{if(user&&client)refresh();else{setVisits([]);setPhotoUrls({});}},[user,client]);
 const visitedCount=visits.filter(v=>v.visited).length;
 const percent=Math.round(visitedCount/places.length*100);
 async function authenticate(e:React.FormEvent){
  e.preventDefault();if(!client)return;setBusy(true);setNotice("");
  const result=mode==="signup"
   ?await client.auth.signUp({email,password,options:{data:{display_name:displayName.trim()||email.split("@")[0]}}})
   :await client.auth.signInWithPassword({email,password});
  setBusy(false);
  if(result.error){setNotice(result.error.message);return;}
  if(mode==="signup"&&!result.data.session)setNotice("Te enviamos un correo para confirmar tu cuenta. Confirma el correo y luego inicia sesión.");
  else setNotice(mode==="signup"?"¡Cuenta creada! Ya puedes completar tu pasaporte.":"¡Bienvenido de nuevo!");
 }
 async function toggleVisit(placeSlug:string){
  if(!client||!user)return;
  const current=visits.find(v=>v.place_slug===placeSlug);const next=!current?.visited;
  const {error}=await client.from("place_visits").upsert({user_id:user.id,place_slug:placeSlug,visited:next,visited_at:next?new Date().toISOString():null},{onConflict:"user_id,place_slug"});
  if(error){setNotice("No pudimos guardar tu visita. "+error.message);return;}await refresh();
 }
 async function uploadPhoto(placeSlug:string,file?:File){
  if(!client||!user||!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5*1024*1024){setNotice("Usa una foto JPG, PNG o WEBP de máximo 5 MB.");return;}
  setBusy(true);const path=user.id+"/"+placeSlug+"-"+Date.now()+"."+file.type.split("/")[1];
  const {error}=await client.storage.from(bucket).upload(path,file,{upsert:true,contentType:file.type});
  if(error){setNotice("No pudimos guardar la foto. "+error.message);setBusy(false);return;}
  const current=visits.find(v=>v.place_slug===placeSlug);
  const {error:saveError}=await client.from("place_visits").upsert({user_id:user.id,place_slug:placeSlug,visited:true,visited_at:current?.visited_at||new Date().toISOString(),photo_path:path},{onConflict:"user_id,place_slug"});
  setBusy(false);if(saveError){setNotice("La foto se subió pero no pudimos asociarla a la visita.");return;}await refresh();
 }
 async function postComment(placeSlug:string){
  if(!client||!user)return;const content=(drafts[placeSlug]||"").trim();if(!content)return;
  const name=String(user.user_metadata?.display_name||user.email?.split("@")[0]||"Visitante").slice(0,40);
  const {error}=await client.from("place_comments").insert({user_id:user.id,place_slug:placeSlug,display_name:name,content});
  if(error){setNotice("No pudimos publicar el comentario. "+error.message);return;}
  setDrafts(s=>({...s,[placeSlug]:""}));await refresh();
 }
 async function react(placeSlug:string,reaction:string){
  if(!client||!user)return;
  const exists=reactions.some(r=>r.place_slug===placeSlug&&r.reaction===reaction&&r.user_id===user.id);
  const result=exists
   ?await client.from("place_reactions").delete().eq("place_slug",placeSlug).eq("reaction",reaction).eq("user_id",user.id)
   :await client.from("place_reactions").insert({user_id:user.id,place_slug:placeSlug,reaction});
  if(result.error){setNotice("No pudimos guardar tu reacción.");return;}await refresh();
 }
 const myPhotos=useMemo(()=>visits.filter(v=>v.photo_path),[visits]);
 return <section className="passport-section" id="pasaporte"><div className="passport-heading"><span className="tag">PASAPORTE CALEÑO</span><h2>Vive Cali, guarda tus recuerdos <span>🍊</span></h2><p>Marca los lugares que visitas, colecciona tus fotos privadas y comparte opiniones con la comunidad.</p></div>
 {!user?<div className="passport-auth"><div><h3>Únete a la comunidad</h3><p>Explora libremente. Para guardar tus visitas, subir fotos privadas o comentar, crea tu cuenta o inicia sesión.</p></div><form onSubmit={authenticate} className="passport-auth-form">
 {mode==="signup"&&<label>Cómo quieres aparecer<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Tu nombre o apodo" maxLength={40}/></label>}
 <label>Correo electrónico<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com"/></label>
 <label>Contraseña<input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/></label>
 <button className="pill" disabled={busy||!client}>{busy?"Procesando...":mode==="signup"?"Crear mi cuenta":"Iniciar sesión"}</button>
 <button type="button" className="text-button" onClick={()=>setMode(mode==="signup"?"login":"signup")}>{mode==="signup"?"Ya tengo cuenta · Iniciar sesión":"Crear una cuenta nueva"}</button>
 </form></div>:<div className="passport-userbar"><span>¡Hola, {String(user.user_metadata?.display_name||user.email?.split("@")[0])}! Este es tu pasaporte privado.</span><button className="text-button" onClick={()=>client?.auth.signOut()}>Cerrar sesión</button></div>}
 {notice&&<p className="passport-notice" role="status">{notice}</p>}
 <div className="passport-progress"><div className="passport-progress-top"><div><strong>{visitedCount} de {places.length}</strong><span> lugares visitados</span></div><b>{percent}%</b></div>
 <div className="chontaduro-track"><div className="chontaduro-line"><span className="chontaduro-fill" style={{width:percent+"%"}}/></div><span className="chontaduro-marker" style={{left:percent+"%"}} aria-label={"Progreso "+percent+" por ciento"}>🍊</span></div><small>¡Tu chontaduro avanza con cada lugar que descubres!</small></div>
 <div className="passport-grid">{places.map(place=>{
  const visit=visits.find(v=>v.place_slug===place.slug);const done=!!visit?.visited;
  const placeComments=comments.filter(c=>c.place_slug===place.slug);
  const counts=reactions.filter(r=>r.place_slug===place.slug);
  const my=counts.filter(r=>r.user_id===user?.id);
  return <article className="passport-place" key={place.slug}><div className="passport-place-top"><span className="passport-emoji">{place.emoji}</span><div><h3>{place.name}</h3><small>{place.kind}</small></div></div>
  <label className="visit-check"><input type="checkbox" checked={done} disabled={!user} onChange={()=>toggleVisit(place.slug)}/><span>{done?"¡Lugar visitado!":"Ya visité este lugar"}</span></label>
  {user&&<div className="private-photo"><label className="photo-upload">📷 {visit?.photo_path?"Cambiar mi foto":"Agregar mi foto"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>uploadPhoto(place.slug,e.target.files?.[0])}/></label>{photoUrls[place.slug]&&<img src={photoUrls[place.slug]} alt={"Recuerdo privado de "+place.name}/>}<small>Tu foto solo la puedes ver tú.</small></div>}
  <div className="place-social"><div className="reaction-row">{(["like","love","wow","useful"] as const).map((kind,i)=>{const icons=["👍","❤️","😍","💡"];const active=my.some(r=>r.reaction===kind);return <button key={kind} className={active?"reaction active":"reaction"} disabled={!user} onClick={()=>react(place.slug,kind)}>{icons[i]} {counts.filter(r=>r.reaction===kind).length}</button>;})}</div>
  <div className="place-comments"><strong>💬 Conversación ({placeComments.length})</strong>{placeComments.slice(0,4).reverse().map(c=><p className="place-comment" key={c.id}><b>{c.display_name}:</b> {c.content}</p>)}{placeComments.length>4&&<small>Mostrando los 4 comentarios más recientes.</small>}
  {user?<div className="comment-compose"><input value={drafts[place.slug]||""} maxLength={1000} onChange={e=>setDrafts(s=>({...s,[place.slug]:e.target.value}))} placeholder="Comparte tu experiencia..."/><button onClick={()=>postComment(place.slug)} disabled={!(drafts[place.slug]||"").trim()}>Publicar</button></div>:<small>Inicia sesión para reaccionar o comentar.</small>}</div></div>
  </article>;
 })}</div>
 {user&&myPhotos.length>0&&<div className="private-album"><h3>📸 Mis recuerdos privados</h3><p>Solo tú puedes ver estas fotos.</p><div className="private-album-grid">{myPhotos.map(v=>{const p=places.find(x=>x.slug===v.place_slug);return photoUrls[v.place_slug]?<figure key={v.place_slug}><img src={photoUrls[v.place_slug]} alt={"Mi foto de "+p?.name}/><figcaption>{p?.name}</figcaption></figure>:null;})}</div></div>}
 </section>;
}
