import{C as l,i as n,I as r,N as v}from"./index-Cp87Xtd6.js";class i{static showCard(a,e,d){l.show(a);const t=document.createElement("div");t.className="card-overlay";const o=n(`images/cards/${a.toLowerCase()}.png`),m=n(e.image);t.innerHTML=`
      <div class="card-modal">
        <div class="item-image-container">
          <img src="${m}" alt="${e.name}" class="item-image" />
          <img src="${o}" alt="${a}" class="card-badge" />
        </div>
        <div class="item-name">${e.name}</div>
        <div class="item-type-badge ${e.type}">${e.type==="active"?"Активный":"Пассивный"}</div>
        <div class="item-stats-block">
          ${r.getItemStatsHTML(e,d)}
        </div>
        <div class="item-effect">${e.enhancedEffect}</div>
        <button id="disenchant-card" class="disenchant-btn">Распылить</button>
        <button id="close-card">Закрыть</button>
      </div>
    `,document.body.appendChild(t);const s=()=>{d.addItem(e),document.body.removeChild(t)};document.getElementById("disenchant-card").addEventListener("click",()=>{const c=i.getCompensation(e);d.addCurrency(c),document.body.removeChild(t),v.show(`Предмет распылен. Получено: ${c} Теней.`)}),document.getElementById("close-card").addEventListener("click",()=>{s()}),setTimeout(()=>{document.body.contains(t)&&s()},9e4)}static getCompensation(a){return Math.floor({A:5e3,B:3e3,C:1500,D:800,E:500,F:300,G:150,H:50}[a.card]||50)}}export{i as CardsDisplay};
