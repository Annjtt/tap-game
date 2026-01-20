import{C as r,i as c,N as m}from"./index-enhqW2IE.js";class d{static showCard(o,e,n){console.log("CardsDisplay.showCard вызван",{card:o,item:e,game:n}),r.show(o);const t=document.createElement("div");t.className="card-overlay";const i=c(`images/cards/${o.toLowerCase()}.png`),l=c(e.image);t.innerHTML=`
      <div class="card-modal">
        <div class="item-image-container">
          <img src="${l}" alt="${e.name}" class="item-image" />
          <img src="${i}" alt="${o}" class="card-badge" />
        </div>
        <h2>${e.name}</h2>
        <p>Карта ранга: ${o}</p>
        <p>${e.enhancedEffect}</p>
        <button id="disenchant-card" class="disenchant-btn">Распылить</button>
        <button id="close-card">Закрыть</button>
      </div>
    `,document.body.appendChild(t);const s=()=>{console.log("Добавляем предмет:",e),n.addItem(e),document.body.removeChild(t)};document.getElementById("disenchant-card").addEventListener("click",()=>{const a=d.getCompensation(e);n.addCurrency(a),document.body.removeChild(t),m.show(`Предмет распылен. Получено: ${a} Теней.`)}),document.getElementById("close-card").addEventListener("click",()=>{console.log('Клик по кнопке "Закрыть"'),s()}),setTimeout(()=>{document.body.contains(t)&&(console.log("Автозакрытие модалки"),s())},1e4)}static getCompensation(o){return Math.floor({A:5e3,B:3e3,C:1500,D:800,E:500,F:300,G:150,H:50}[o.card]||50)}}export{d as CardsDisplay};
