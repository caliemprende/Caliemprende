"use client";
import { useEffect, useRef } from "react";
type EventPoint={id:string;title:string;venue:string;latitude:number|null;longitude:number|null};
declare global { interface Window { L?: any } }
const landmarks=[
 {name:"Gato del Río",lat:3.4572,lng:-76.5395,kind:"Icono"},
 {name:"Bulevar del Río",lat:3.4519,lng:-76.5357,kind:"Paseo"},
 {name:"Capilla de San Antonio",lat:3.4450,lng:-76.5430,kind:"Patrimonio"},
 {name:"Cristo Rey",lat:3.4295,lng:-76.5500,kind:"Mirador"},
 {name:"Parque de las Banderas",lat:3.4215,lng:-76.5435,kind:"Parque"},
 {name:"Parque del Perro",lat:3.4250,lng:-76.5450,kind:"Parque"},
 {name:"Zoológico de Cali",lat:3.4440,lng:-76.5480,kind:"Naturaleza"},
 {name:"Parque Artesanal Loma de la Cruz",lat:3.4390,lng:-76.5310,kind:"Artesanías"},
 {name:"Plazoleta Jairo Varela",lat:3.4540,lng:-76.5320,kind:"Cultura"},
 {name:"Parque del Ingenio",lat:3.3760,lng:-76.5400,kind:"Parque"},
 {name:"Galería Alameda",lat:3.434278,lng:-76.5353587,kind:"Gastronomía y mercado"}
];
export default function CaliMap({events=[]}:{events?:EventPoint[]}){
 const mapRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  let map:any,disposed=false;
  const load=async()=>{
   if(!document.querySelector('link[data-leaflet="yes"]')){
    const link=document.createElement("link");link.rel="stylesheet";link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";link.dataset.leaflet="yes";document.head.appendChild(link);
   }
   if(!window.L){
    await new Promise<void>((resolve,reject)=>{
     const existing=document.querySelector('script[data-leaflet="yes"]') as HTMLScriptElement|null;
     if(existing){existing.addEventListener("load",()=>resolve(),{once:true});if(window.L)resolve();return;}
     const script=document.createElement("script");script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";script.dataset.leaflet="yes";script.onload=()=>resolve();script.onerror=()=>reject(new Error("No se pudo cargar el mapa"));document.body.appendChild(script);
    });
   }
   if(disposed||!mapRef.current||!window.L)return;
   const L=window.L;map=L.map(mapRef.current,{scrollWheelZoom:false}).setView([3.4372,-76.5225],12);
   L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
   const bounds:any[]=[];
   landmarks.forEach(place=>{const marker=L.marker([place.lat,place.lng]).addTo(map);marker.bindPopup('<strong>'+place.name+'</strong><br/>'+place.kind);bounds.push([place.lat,place.lng]);});
   events.forEach(event=>{if(event.latitude!=null&&event.longitude!=null){const marker=L.marker([event.latitude,event.longitude]).addTo(map);marker.bindPopup('<strong>📍 '+event.title+'</strong><br/>'+event.venue);bounds.push([event.latitude,event.longitude]);}});
   if(bounds.length)map.fitBounds(bounds,{padding:[24,24],maxZoom:12});
  };
  load().catch(()=>{if(mapRef.current)mapRef.current.innerHTML="No pudimos cargar el mapa. Intenta actualizar la página.";});
  return()=>{disposed=true;if(map)map.remove();};
 },[JSON.stringify(events)]);
 return <div className="cali-map-shell"><div ref={mapRef} className="cali-map" role="application" aria-label="Mapa de Cali con eventos y sitios emblemáticos"/><div className="map-legend"><span><i className="legend-event"/> Evento publicado</span><span><i className="legend-place"/> Lugares emblemáticos y parques</span></div></div>;
}
