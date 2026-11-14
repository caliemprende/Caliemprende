"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type Song={id:string;title:string;artist:string;listen_url:string|null;created_at:string};
type Vote={id:string;user_id:string;song_id:string;week_start:string};
function currentWeekStart(){
 const d=new Date();const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);d.setHours(0,0,0,0);
 return d.toISOString().slice(0,10);
}
export default function SongOfTheWeek(){
 const [client,setClient]=useState<SupabaseClient|null>(null);
 const [user,setUser]=useState<User|null>(null);
 const [songs,setSongs]=useState<Song[]>([]);
 const [votes,setVotes]=useState<Vote[]>([]);
 const [title,setTitle]=useState("");const [artist,setArtist]=useState("");const [url,setUrl]=useState("");
 const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");
 const weekStart=useMemo(()=>currentWeekStart(),[]);
 const load=useCallback(async(c:SupabaseClient)=>{
  const [{data:s,error:se},{data:v,error:ve}]=await Promise.all([
   c.from("song_suggestions").select("id,title,artist,listen_url,created_at").order("created_at",{ascending:false}).limit(100),
   c.from("song_votes").select("id,user_id,song_id,week_start").eq("week_start",weekStart)
  ]);
  if(se||ve){setNotice("No se pudo cargar la votación. Es posible que falte ejecutar la migración de La voz de Cali en Supabase.");return;}
  setSongs((s||[]) as Song[]);setVotes((v||[]) as Vote[]);
 },[weekStart]);
 useEffect(()=>{
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!supabaseUrl||!key){setNotice("La votación estará disponible cuando conectemos Supabase.");return;}
  const c=createClient(supabaseUrl,key);setClient(c);
  c.auth.getSession().then(({data})=>setUser(data.session?.user??null));
  const {data:{subscription}}=c.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null));
  void load(c);return()=>subscription.unsubscribe();
 },[load]);
 const counts=useMemo(()=>votes.reduce<Record<string,number>>((a,v)=>{a[v.song_id]=(a[v.song_id]||0)+1;return a;},{}),[votes]);
 const winner=useMemo(()=>songs.filter(s=>(counts[s.id]||0)>0).sort((a,b)=>(counts[b.id]||0)-(counts[a.id]||0))[0]||null,[songs,counts]);
 const myVote=votes.find(v=>v.user_id===user?.id);
 async function suggest(e:React.FormEvent){
  e.preventDefault();if(!client||!user)return;setBusy(true);setNotice("");
  const cleanUrl=url.trim();
  if(cleanUrl&&!/^https:\/\//i.test(cleanUrl)){setNotice("El enlace debe comenzar por https://");setBusy(false);return;}
  const {error}=await client.from("song_suggestions").insert({user_id:user.id,title:title.trim(),artist:artist.trim(),listen_url:cleanUrl||null});
  setBusy(false);if(error){setNotice("No pudimos enviar la canción. "+error.message);return;}
  setTitle("");setArtist("");setUrl("");setNotice("¡Canción nominada! Ya puede recibir votos.");await load(client);
 }
 async function vote(songId:string){
  if(!client||!user)return;setBusy(true);setNotice("");
  const {error}=await client.from("song_votes").insert({user_id:user.id,song_id:songId,week_start:weekStart});
  setBusy(false);
  if(error){setNotice(error.code==="23505"?"Ya votaste esta semana. Tu voto está registrado.":"No pudimos registrar tu voto. "+error.message);await load(client);return;}
  setNotice("¡Voto registrado! Gracias por elegir la música de Cali.");await load(client);
 }
 return <section className="song-week-section" id="la-voz-de-cali"><div className="wrap">
  <div className="song-week-heading"><span className="tag">MÚSICA · PARTICIPACIÓN CALEÑA</span><h2>🎶 La voz de Cali</h2><p>¡La comunidad elige la canción de la semana! Propón una canción, vota por tu favorita y descubre cuál suena en Cali Emprende.</p></div>
  {winner&&<article className="song-winner"><span className="song-winner-label">🏆 LIDERA LA VOTACIÓN DE ESTA SEMANA</span><h3>{winner.title}</h3><p>{winner.artist}</p><strong>{counts[winner.id]||0} voto(s)</strong>{winner.listen_url&&<a href={winner.listen_url} target="_blank" rel="noreferrer">Escuchar canción ↗</a>}</article>}
  <div className="song-week-grid"><div className="song-voting-panel"><div className="song-panel-title"><h3>Vota por tu favorita</h3><span>Una votación por usuario cada semana</span></div>
   {songs.length===0?<p className="song-empty">Todavía no hay canciones nominadas. ¡Sé la primera persona en proponer una!</p>:<div className="song-list">{songs.map(song=><article className="song-option" key={song.id}><div className="song-note">♫</div><div className="song-option-info"><strong>{song.title}</strong><span>{song.artist}</span>{song.listen_url&&<a href={song.listen_url} target="_blank" rel="noreferrer">Escuchar ↗</a>}</div><div className="song-option-vote"><b>{counts[song.id]||0}</b><button type="button" disabled={!user||!!myVote||busy} onClick={()=>vote(song.id)}>{myVote?.song_id===song.id?"Tu voto ✓":myVote?"Ya votaste":"Votar"}</button></div></article>)}</div>}
   {!user&&<p className="song-login-note">Inicia sesión o crea tu cuenta en el Pasaporte Caleño para proponer canciones y votar. La lista y los resultados son públicos.</p>}
  </div>
  <div className="song-suggest-panel"><h3>🎤 Propón una canción</h3><p>¿Qué canción representa a Cali? Nomínala para que todos puedan elegirla.</p>{user?<form onSubmit={suggest} className="song-suggest-form"><label>Nombre de la canción<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Título de la canción"/></label><label>Artista<input required maxLength={120} value={artist} onChange={e=>setArtist(e.target.value)} placeholder="Nombre del artista"/></label><label>Enlace para escuchar (opcional)<input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..."/></label><button className="pill" disabled={busy}>{busy?"Enviando...":"Nominar canción"}</button></form>:<p className="song-login-note">Para nominar una canción necesitas iniciar sesión en el Pasaporte Caleño.</p>}</div></div>
  {notice&&<p className="song-notice" role="status">{notice}</p>}
  <p className="song-week-footnote">La canción que termine con más votos será la ganadora de la semana. Cali Emprende muestra enlaces para escuchar; no reproduce música protegida directamente.</p>
 </div></section>;
}
