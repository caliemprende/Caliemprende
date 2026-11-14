"use client";
const badges=[
 {icon:"🌺",name:"Orgullo caleño",detail:"Descubre tu primera ruta cultural.",goal:"Primera ruta"},
 {icon:"🍍",name:"Sabor del Pacífico",detail:"Explora lugares de gastronomía local.",goal:"Ruta gastronómica"},
 {icon:"🎨",name:"Manos creadoras",detail:"Conoce artesanos y talento creativo.",goal:"Ruta de arte"},
 {icon:"🌿",name:"Explorador natural",detail:"Visita parques y miradores de Cali.",goal:"Ruta natural"}
];
const steps=[
 {number:"01",title:"Explora",detail:"Elige una ruta cultural o un lugar en el mapa."},
 {number:"02",title:"Visita",detail:"Recorre el lugar y marca tu visita en el pasaporte."},
 {number:"03",title:"Comparte",detail:"Guarda tu recuerdo y participa en la comunidad."},
 {number:"04",title:"Gana",detail:"Completa retos y consigue insignias. Los beneficios se habilitarán con comercios aliados."}
];
export default function RewardsHub(){
 return <section className="rewards-hub-section" id="recompensas"><div className="wrap">
  <div className="rewards-hero">
   <div className="rewards-mascot"><img src="/chontaduro.svg" alt="Chontaduro, guía de Cali Emprende"/><span>¡Hola, explorador!</span></div>
   <div className="rewards-copy"><span className="tag">PASAPORTE · CULTURA · PREMIOS</span><h2>Descubre Cali, colecciona experiencias <span>✨</span></h2><p>Tu chontaduro te acompaña por la ciudad. Explora lugares, conoce emprendimientos, comparte recuerdos y completa tu colección de insignias.</p><a className="pill" href="#pasaporte">Empezar mi pasaporte</a></div>
   <div className="rewards-stamp" aria-hidden="true">CALI<br/>100%<br/>NUESTRA</div>
  </div>
  <div className="rewards-how"><div className="rewards-section-title"><span className="tag">ASÍ FUNCIONA</span><h3>Cuatro pasos para vivir Cali</h3></div><div className="rewards-steps">{steps.map(s=><article key={s.number}><span>{s.number}</span><div><strong>{s.title}</strong><p>{s.detail}</p></div></article>)}</div></div>
  <div className="rewards-collection"><div className="rewards-section-title"><span className="tag">TU COLECCIÓN</span><h3>Insignias caleñas por descubrir</h3><p>Completa rutas y retos para ir construyendo tu colección.</p></div><div className="rewards-badges">{badges.map((b,i)=><article key={b.name} className="reward-badge-card"><div className={"reward-badge-art badge-art-"+i}><span>{b.icon}</span></div><div><strong>{b.name}</strong><p>{b.detail}</p><small>{b.goal}</small></div></article>)}</div></div>
  <div className="rewards-partners"><div className="partners-copy"><span className="tag">BENEFICIOS LOCALES</span><h3>Más experiencias, más apoyo al talento caleño</h3><p>Estamos preparando una red de comercios aliados para ofrecer promociones, detalles y experiencias especiales a quienes exploren Cali.</p><a className="pill" href="#registro">Quiero ser comercio aliado</a></div><div className="partners-perks"><div><span>☕</span><strong>Sabores locales</strong><small>Promociones en cafés y restaurantes aliados</small></div><div><span>🧵</span><strong>Hecho en Cali</strong><small>Beneficios en artesanías y productos locales</small></div><div><span>🎭</span><strong>Planes culturales</strong><small>Experiencias con emprendimientos creativos</small></div><p>Los beneficios y descuentos se anunciarán cuando cada comercio aliado confirme su participación. Aún no hay cupones activos.</p></div></div>
 </div></section>;
}
