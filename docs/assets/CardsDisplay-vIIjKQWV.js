import{C as r,i as d,N as l}from"./index-CUDCSYtq.js";class s{static showCard(t,e,a){r.show(t);const n=document.createElement("div");n.className="card-overlay";const i=d(`images/cards/${t.toLowerCase()}.png`),m=d(e.image);n.innerHTML=`
      <div class="card-modal">
        <div class="item-image-container">
          <img src="${m}" alt="${e.name}" class="item-image" />
          <img src="${i}" alt="${t}" class="card-badge" />
        </div>
        <h2>${e.name}</h2>
        <p>Карта ранга: ${t}</p>
        <p>${e.enhancedEffect}</p>
        <button id="disenchant-card" class="disenchant-btn">Распылить</button>
        <button id="close-card">Закрыть</button>
      </div>
    `,document.body.appendChild(n);const o=()=>{a.addItem(e),document.body.removeChild(n)};document.getElementById("disenchant-card").addEventListener("click",()=>{const c=s.getCompensation(e);a.addCurrency(c),document.body.removeChild(n),l.show(`Предмет распылен. Получено: ${c} Теней.`)}),document.getElementById("close-card").addEventListener("click",()=>{o()}),setTimeout(()=>{document.body.contains(n)&&o()},5e3)}static getCompensation(t){return Math.floor({A:5e3,B:3e3,C:1500,D:800,E:500,F:300,G:150,H:50}[t.card]||50)}}export{s as CardsDisplay};
