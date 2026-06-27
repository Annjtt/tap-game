import{i,I as l}from"./index-ow5xmOEA.js";class v{static showCard(d,e,a,c){const t=document.createElement("div");t.className="card-overlay";const n=i(`images/cards/${d.toLowerCase()}.png`),o=i(e.image);t.innerHTML=`
      <div class="card-modal">
        <div class="item-image-container">
          <img src="${o}" alt="${e.name}" class="item-image" />
          <img src="${n}" alt="${d}" class="card-badge" />
        </div>
        <div class="item-name">${e.name}</div>
        <div class="item-type-badge ${e.type}">${e.type==="active"?"Активный":"Пассивный"}</div>
        <div class="item-stats-block">
          ${l.getItemStatsHTML(e,a)}
        </div>
        <div class="item-effect">${e.enhancedEffect}</div>
        <button id="reopen-card" class="disenchant-btn">Открыть снова</button>
        <button id="close-card">Закрыть</button>
      </div>
    `,document.body.appendChild(t);const s=()=>{a.addItem(e),document.body.removeChild(t)};document.getElementById("reopen-card").addEventListener("click",()=>{a.addItem(e),document.body.removeChild(t),typeof c=="function"&&c()}),document.getElementById("close-card").addEventListener("click",()=>{s()}),setTimeout(()=>{document.body.contains(t)&&s()},9e4)}static getCompensation(d){return Math.floor({A:5e3,B:3e3,C:1500,D:800,E:500,F:300,G:150,H:50}[d.card]||50)}}export{v as CardsDisplay};
