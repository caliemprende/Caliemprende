"use client";
import { useCallback,useEffect,useMemo,useState } from "react";
import { createClient,type SupabaseClient,type User } from "@supabase/supabase-js";
type Restaurant={id:string;name:string;category:string;city:string;description:string;whatsapp:string};
type Vote={id:string;user_id:string;business_id:string;week_start:string};
function localWeekStart(){const d=new Date();const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,"0");const date=String(d.getDate()).padStart(2,"0");return y+"-"+m+"-"+date;}
export default function RestaurantOfTheWeek(){
 const [client,setClient]=useState<SupabaseClient|null>(null);const [user,setUser]=useState<User|null>(null);
 const [restaurants,setRestaurants]=useState<Restaurant[]>([]);const [votes,setVotes]=useState<Vote[]>([]);
 const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");
 const weekStart=useMemo(()=>localWeekStart(),[]);
 const load=useCallback(async(c:SupabaseClient)=>{
  const [{data:v,error:ve},{data:b,error:be}]=await Promise.all([
   c.from("restaurant_votes").select("id,user_id,business_id,week_start").eq("week_start",weekStart),
   fetch("/api/businesses").then(r=>r.json()).then(j=>({data:j.businesses||[],error:null})).catch(error=>({data:[],error}))
  ]);
  if(ve){setNotice("La votación de restaurantes necesita activar sus tablas en Supabase.");return;}
  if(be){setNotice("No pudimos cargar los restaurantes participantes.");return;}
  const approved=(b.data as Restaurant[]).filter(x=>["gastronomía","gastronomia","restaurantes"].includes((x.category||"").toLowerCase()));
  setRestaurants(approved);setVotes((v||[]) as Vote[]);
 },[weekStart]);
 useEffect(()=>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key){setNotice("La votación se activará al conectar Supabase.");return;}
  const c=createClient(url,key);setClient(c);
  c.auth.getSession().then(({data})=>setUser(data.session?.user??null));
  const {data:{subscription}}=c.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null));
  void load(c);return()=>subscription.unsubscribe();
 },[load]);
 const counts=useMemo(()=>votes.reduce<Record<string,number>>((a,v)=>{a[v.business_id]=(a[v.business_id]||0)+1;return a;},{}),[votes]);
 const ranked=useMemo(()=>[...restaurants].sort((a,b)=>(counts[b.id]||0)-(counts[a.id]||0)),[restaurants,counts]);
 const leader=ranked[0]&&(counts[ranked[0].id]||0)>0?ranked[0]:null;
 const myVote=votes.find(v=>v.user_id===user?.id);
 async function vote(id:string){
  if(!client||!user)return;setBusy(true);setNotice("");
  const {error}=await client.from("restaurant_votes").insert({user_id:user.id,business_id:id,week_start:weekStart});
  setBusy(false);
  if(error){setNotice(error.code==="23505"?"Tu voto de esta semana ya está registrado.":"No pudimos guardar tu voto. Verifica que la votación esté activada.");await load(client);return;}
  setNotice("¡Tu voto quedó registrado! Gracias por apoyar la gastronomía caleña.");await load(client);
 }
 return <section className="restaurant-week-section" id="sabor-de-cali"><div className="wrap">
  <div className="restaurant-week-heading"><span className="tag">VOTA Y APOYA LO LOCAL</span><h2>🍽️ El sabor de Cali</h2><p>Elige tu restaurante favorito de la ciudad. Cada semana destacaremos al negocio que reciba más votos.</p></div>
  {leader&&<article className="restaurant-leader"><span>🏆 RESTAURANTE QUE LIDERA ESTA SEMANA</span><h3>{leader.name}</h3><p>{leader.description||"Un negocio local recomendado por la comunidad."}</p><strong>{counts[leader.id]} votos</strong>{leader.whatsapp&&<a href={"https://wa.me/"+leader.whatsapp.replace(/\D/g,"")} target="_blank" rel="noreferrer">Contactar restaurante ↗</a>}</article>}
  <div className="restaurant-vote-panel"><div className="restaurant-vote-head"><h3>Vota por tu favorito</h3><span>Un voto por cuenta cada semana</span></div>
   {ranked.length===0?<div className="restaurant-no-results"><strong>Pronto tendremos restaurantes participantes.</strong><p>Los restaurantes aprobados en la categoría Gastronomía aparecerán aquí automáticamente.</p><a href="#registro">Registrar un restaurante</a></div>:<div className="restaurant-vote-list">{ranked.map((r,i)=>{const n=counts[r.id]||0;const max=Math.max(1,...Object.values(counts));return <article className="restaurant-vote-item" key={r.id}><div className="restaurant-vote-rank">{i===0?"🍴":String(i+1).padStart(2,"0")}</div><div className="restaurant-vote-info"><strong>{r.name}</strong><span>📍 {r.city}</span>{r.description&&<small>{r.description}</small>}<div className="restaurant-vote-bar"><i style={{width:(n/max*100)+"%"}}/></div></div><div className="restaurant-vote-action"><b>{n}</b><button type="button" disabled={!user||!!myVote||busy} onClick={()=>vote(r.id)}>{myVote?.business_id===r.id?"Tu voto ✓":myVote?"Ya votaste":"Votar"}</button></div></article>})}</div>}
   {!user&&<p className="restaurant-login-note">Para votar, inicia sesión o crea una cuenta en el Pasaporte Caleño. Puedes consultar los resultados sin registrarte.</p>}
   {user&&myVote&&<p className="restaurant-login-note">Ya participaste esta semana. Tu voto quedó registrado.</p>}
   {notice&&<p className="restaurant-vote-notice" role="status">{notice}</p>}
  </div><p className="restaurant-week-footnote">La votación se reinicia cada lunes. El resultado depende de los votos registrados en la semana actual. El premio o beneficio se anunciará cuando el restaurante ganador confirme su participación.</p>
 </div></section>;
}
