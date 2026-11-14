"use client";
import { useState } from "react";
const routes=[
 {id:"sabores",icon:"🍍",title:"Sabores del Pacífico",tone:"food",tag:"Gastronomía",intro:"Descubre ingredientes, mercados y cocina tradicional caleña.",stops:["Galería Alameda","Barrio San Antonio","Parque del Perro"],business:"Restaurantes, cafés, repostería y mercados locales",challenge:"Prueba un sabor nuevo y guarda una foto de tu experiencia."},
 {id:"memoria",icon:"🏛️",title:"Cali: memoria y patrimonio",tone:"heritage",tag:"Historia y patrimonio",intro:"Camina por rincones históricos y conoce relatos de la ciudad.",stops:["Bulevar del Río","Iglesia La Ermita","Plazoleta Jairo Varela","San Antonio"],business:"Guías, artesanos, tiendas de recuerdos y experiencias culturales",challenge:"Encuentra un detalle arquitectónico y compártelo."},
 {id:"arte",icon:"🎨",title:"Arte, salsa y artesanías",tone:"art",tag:"Cultura caleña",intro:"Conecta con el arte, la música y el talento creativo local.",stops:["Parque Artesanal Loma de la Cruz","Gato del Río","Plazoleta Jairo Varela"],business:"Artesanos, moda local, academias de baile y emprendimientos creativos",challenge:"Descubre una creación local y etiqueta al emprendimiento."},
 {id:"verde",icon:"🌿",title:"Cali natural y panorámica",tone:"nature",tag:"Naturaleza y miradores",intro:"Disfruta espacios verdes y vistas para conocer otra cara de Cali.",stops:["Zoológico de Cali","Cristo Rey","Parque del Ingenio"],business:"Experiencias al aire libre, cafés y servicios turísticos",challenge:"Toma una foto de un paisaje y completa un sello del pasaporte."}
];
export default function CulturalRoutes(){
 const [expanded,setExpanded]=useState("sabores");
 return <section className="cultural-routes-section" id="rutas-culturales"><div className="wrap">
  <div className="section-head"><div><span className="tag">CULTURA · TURISMO · ECONOMÍA LOCAL</span><h2 style={{marginTop:12}}>Cali se vive por rutas <span aria-hidden="true">🌺</span></h2><p>Elige una experiencia, descubre lugares y encuentra emprendimientos locales durante el recorrido.</p></div></div>
  <div className="cultural-routes-grid">{routes.map(route=><article className={"cultural-route-card "+route.tone} key={route.id}>
   <div className="cultural-route-top"><span className="cultural-route-icon">{route.icon}</span><span className="tag">{route.tag}</span></div>
   <h3>{route.title}</h3><p>{route.intro}</p>
   <button className="route-toggle" type="button" aria-expanded={expanded===route.id} onClick={()=>setExpanded(expanded===route.id?"":route.id)}>{expanded===route.id?"Ocultar recorrido":"Ver recorrido"} <span>{expanded===route.id?"−":"+"}</span></button>
   {expanded===route.id&&<div className="route-details"><strong>Paradas sugeridas</strong><ol>{route.stops.map(stop=><li key={stop}>{stop}</li>)}</ol><div className="route-business"><strong>Emprendimientos para descubrir</strong><span>{route.business}</span></div><div className="route-challenge">🎯 Reto del pasaporte: {route.challenge}</div></div>}
   <a className="route-business-link" href="#explorar">Explorar negocios relacionados ↗</a>
  </article>)}</div>
  <div className="route-owner-cta"><div><strong>¿Tu negocio hace parte de la cultura caleña?</strong><p>Regístralo gratis y conecta con personas que están explorando la ciudad.</p></div><a className="pill" href="#registro">Sumar mi emprendimiento</a></div>
 </div></section>;
}
