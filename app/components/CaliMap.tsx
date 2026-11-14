"use client";
import { useEffect, useMemo, useRef, useState } from "react";
type EventPoint={id:string;title:string;venue:string;latitude:number|null;longitude:number|null};
declare global { interface Window { L?: any } }
const landmarks=[
 {name:"Gato del Río",lat:3.4572,lng:-76.5395,kind:"Icono",category:"Cultura",description:"Escultura emblemática junto al río Cali; ideal para fotos y un paseo por la zona."},
 {name:"Bulevar del Río",lat:3.4519,lng:-76.5357,kind:"Paseo",category:"Paseos",description:"Recorre el centro, disfruta el espacio peatonal y observa la arquitectura de Cali."},
 {name:"Capilla de San Antonio",lat:3.4450,lng:-76.5430,kind:"Patrimonio",category:"Patrimonio",description:"Capilla histórica en una colina; visita también el barrio tradicional de San Antonio."},
 {name:"Cristo Rey",lat:3.4295,lng:-76.5500,kind:"Mirador",category:"Miradores",description:"Mirador panorámico para contemplar la ciudad. Consulta transporte y condiciones antes de subir."},
 {name:"Parque de las Banderas",lat:3.4215,lng:-76.5435,kind:"Parque",category:"Parques",description:"Espacio abierto de encuentro cerca del estadio y de escenarios deportivos."},
 {name:"Parque del Perro",lat:3.4250,lng:-76.5450,kind:"Parque y gastronomía",category:"Gastronomía",description:"Sector conocido por sus restaurantes, cafés y ambiente para salir a comer."},
 {name:"Zoológico de Cali",lat:3.4440,lng:-76.5480,kind:"Naturaleza",category:"Naturaleza",description:"Plan familiar para conocer fauna y aprender sobre conservación. Verifica horarios y entradas."},
 {name:"Parque Artesanal Loma de la Cruz",lat:3.4390,lng:-76.5310,kind:"Artesanías",category:"Artesanías",description:"Encuentra artesanías y expresiones culturales; revisa la programación antes de ir."},
 {name:"Plazoleta Jairo Varela",lat:3.4540,lng:-76.5320,kind:"Cultura",category:"Cultura",description:"Homenaje a la salsa y a Jairo Varela, en el corazón de la ciudad."},
 {name:"Parque del Ingenio",lat:3.3760,lng:-76.5400,kind:"Parque",category:"Parques",description:"Parque del sur de Cali para caminar, hacer ejercicio y descansar."},
 {name:"Galería Alameda",lat:3.434278,lng:-76.5353587,kind:"Gastronomía y mercado",category:"Gastronomía",description:"Mercado tradicional para descubrir frutas, sabores del Pacífico y cocina caleña."}
];
const categories=["Todos","Eventos","Patrimonio","Parques","Cultura","Gastronomía","Naturaleza","Artesanías","Miradores","Paseos"];
const colors:Record<string,string>={Eventos:"#e6007e",Patrimonio:"#7441a8",Parques:"#2d9b61",Cultura:"#e58a22",Gastronomía:"#d94d35",Naturaleza:"#168e9b",Artesanías:"#a46a36",Miradores:"#4169c1",Paseos:"#64748b"};
export default function CaliMap({events=[]}:{events?:EventPoint[]}){
 const mapRef=useRef<HTMLDivElement>(null);const mapInstance=useRef<any>(null);const layerRef=useRef<any>(null);
 const [active,setActive]=useState("Todos");
 const [mapReady,setMapReady]=useState(false);
 const filteredLandmarks=useMemo(()=>active==="Todos"?landmarks:landmarks.filter(p=>p.category===active),[active]);
 useEffect(()=>{
  let disposed=false;
  const load=async()=>{
   if(!document.querySelector('link[data-leaflet="yes"]')){const link=document.createElement("link");link.rel="stylesheet";link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";link.dataset.leaflet="yes";document.head.appendChild(link);}
   if(!window.L)await new Promise<void>((resolve,reject)=>{const existing=document.querySelector('script[data-leaflet="yes"]') as HTMLScriptElement|null;if(existing){existing.addEventListener("load",()=>resolve(),{once:true});if(window.L)resolve();return;}const script=document.createElement("script");script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";script.dataset.leaflet="yes";script.onload=()=>resolve();script.onerror=()=>reject(new Error("No se pudo cargar el mapa"));document.body.appendChild(script);});
   if(disposed||!mapRef.current||!window.L||mapInstance.current)return;
   const L=window.L;mapInstance.current=L.map(mapRef.current,{scrollWheelZoom:false}).setView([3.4372,-76.5225],12);
   L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(mapInstance.current);
   layerRef.current=L.layerGroup().addTo(mapInstance.current);setMapReady(true);
  };
  load().catch(()=>{if(mapRef.current)mapRef.current.innerHTML="No pudimos cargar el mapa. Intenta actualizar la página.";});
  return()=>{disposed=true;if(mapInstance.current){mapInstance.current.remove();mapInstance.current=null;layerRef.current=null;}};
 },[]);
 useEffect(()=>{
  if(!mapReady||!window.L||!layerRef.current||!mapInstance.current)return;
  const L=window.L;layerRef.current.clearLayers();const bounds:any[]=[];
  const add=(lat:number,lng:number,title:string,category:string,description:string,kind:string)=>{
   const color=colors[category]||"#e6007e";
   const icon=L.divIcon({className:"didactic-map-marker-wrap",html:'<span class="didactic-map-marker" style="--marker-color:'+color+'">'+(category==="Eventos"?"★":"●")+'</span>',iconSize:[30,38],iconAnchor:[15,19]});
   const popup='<div class="didactic-popup"><strong>'+title+'</strong><span>'+kind+'</span><p>'+description+'</p></div>';
   L.marker([lat,lng],{icon}).bindPopup(popup).addTo(layerRef.current);bounds.push([lat,lng]);
  };
  filteredLandmarks.forEach(p=>add(p.lat,p.lng,p.name,p.category,p.description,p.kind));
  if(active==="Todos"||active==="Eventos")events.forEach(e=>{if(e.latitude!=null&&e.longitude!=null)add(e.latitude,e.longitude,e.title,"Eventos","Evento en '+e.venue+'. Consulta los detalles y la fecha de la actividad.",e.venue);});
  if(bounds.length)mapInstance.current.fitBounds(bounds,{padding:[30,30],maxZoom:13});
 },[active,events,mapReady,filteredLandmarks]);
 function focusPlace(name:string){const p=landmarks.find(x=>x.name===name);if(p&&mapInstance.current){mapInstance.current.setView([p.lat,p.lng],15);layerRef.current.eachLayer((marker:any)=>{const ll=marker.getLatLng();if(Math.abs(ll.lat-p.lat)<0.00001&&Math.abs(ll.lng-p.lng)<0.00001)marker.openPopup();});}}
 return <div className="cali-map-shell">
  <div className="map-learning"><strong>🧭 Explora Cali paso a paso</strong><p>Elige una categoría para filtrar los puntos. Toca cada marcador para conocer qué puedes hacer allí. Acerca el mapa con dos dedos.</p></div>
  <div className="map-category-filters" aria-label="Filtrar lugares del mapa">{categories.map(c=><button key={c} type="button" className={active===c?"map-filter active":"map-filter"} onClick={()=>setActive(c)}>{c==="Todos"?"🌎":c==="Eventos"?"🎉":c==="Patrimonio"?"🏛️":c==="Parques"?"🌳":c==="Cultura"?"🎭":c==="Gastronomía"?"🍍":c==="Naturaleza"?"🦋":c==="Artesanías"?"🧵":c==="Miradores"?"🌄":"🚶"} {c}</button>)}</div>
  <div ref={mapRef} className="cali-map" role="application" aria-label="Mapa interactivo de Cali con filtros por categoría"/>
  <div className="map-legend">{Object.entries(colors).map(([name,color])=><span key={name}><i style={{background:color}}/>{name}</span>)}</div>
  <div className="map-explore-list"><strong>📍 Lugares para descubrir ({filteredLandmarks.length})</strong><div>{filteredLandmarks.map(p=><button type="button" key={p.name} onClick={()=>focusPlace(p.name)}>{p.name} <span>Ver en mapa ↗</span></button>)}</div></div>
  <p className="map-source-note">Los puntos son referencias orientativas. Confirma rutas, horarios y acceso antes de desplazarte.</p>
 </div>;
}
