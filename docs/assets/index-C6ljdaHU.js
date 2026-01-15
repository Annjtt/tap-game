(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=t(s);fetch(s.href,i)}})();const p={baseClickValue:1,saveInterval:3e4};class l{static show(e,t=2e3){const n=document.createElement("div");n.className="notification",n.textContent=e,document.body.appendChild(n),setTimeout(()=>{n.classList.add("show")},10),setTimeout(()=>{n.classList.remove("show"),setTimeout(()=>{document.body.removeChild(n)},300)},t)}}class w{constructor(){this.currency=0,this.clickValue=p.baseClickValue,this.items=[],this.autoIncome=0,this.lastSave=Date.now(),this.bonusMultipliers={A:1,B:.8,C:.4,D:.3,E:.2,F:.15,G:.1,H:.05}}addCurrency(e){this.currency+=e,this.triggerEvent("currencyChanged")}getCurrency(){return this.currency}getClickValue(){let e=this.clickValue,t=0;const n=this.getActiveItemsByName();for(const s of Object.values(n))s.stat==="click"&&(t+=s.enhancedValue||s.baseBonus);return e+t}getAutoIncome(){let e=this.autoIncome,t=0;const n=this.getActiveItemsByName();for(const s of Object.values(n))s.stat==="auto"&&(t+=s.enhancedValue||s.baseBonus);return e+t}getActiveItemsByName(){const e={};for(const t of this.items){const n=t.name;if(!e[n])e[n]=t;else{const s=e[n].card,i=t.card;this.getCardRank(i)<this.getCardRank(s)&&(e[n]=t)}}return e}getCardRank(e){return{A:0,B:1,C:2,D:3,E:4,F:5,G:6,H:7}[e]||7}addItem(e){if(!e.card){console.warn("Предмет без карты:",e);return}const t=this.items.find(n=>n.name===e.name);if(t){const n=this.getCardRank(e.card),s=this.getCardRank(t.card);if(n<s){const i=this.getCompensationForItem(t);this.addCurrency(i);const a=this.items.indexOf(t);this.items[a]=e,l.show(`Предмет "${e.name}" заменен (${t.card} → ${e.card}). Компенсация: ${i} Теней`)}else if(n>s){const i=this.getCompensationForItem(e);this.addCurrency(i),l.show(`У вас уже есть "${t.name}" (${t.card}). Новый предмет менее редкий (${e.card}). Компенсация: ${i} Теней`)}else{const i=this.items.indexOf(t);this.items[i]=e}}else this.items.push(e);this.updateStatsFromItems(),this.triggerEvent("inventoryUpdated")}getCompensationForItem(e){return Math.floor({A:5e3,B:3e3,C:1500,D:800,E:500,F:300,G:150,H:50}[e.card]||50)}removeItem(e){const t=this.items.indexOf(e);t>-1&&(this.items.splice(t,1),this.updateStatsFromItems(),this.triggerEvent("inventoryUpdated"))}updateStatsFromItems(){this.clickValue=p.baseClickValue,this.autoIncome=0;const e=this.getActiveItemsByName();for(const t of Object.values(e))t.stat==="click"&&(this.clickValue+=t.enhancedValue||t.baseBonus),t.stat==="auto"&&(this.autoIncome+=t.enhancedValue||t.baseBonus)}saveProgress(){const e={currency:this.currency,clickValue:this.clickValue,autoIncome:this.getAutoIncome(),items:this.items,timestamp:Date.now()};localStorage.setItem("tapGameProgress",JSON.stringify(e))}loadProgress(){const e=localStorage.getItem("tapGameProgress");if(e){const t=JSON.parse(e);this.currency=t.currency||0,this.items=t.items||[],this.updateStatsFromItems(),this.triggerEvent("progressLoaded")}}triggerEvent(e){document.dispatchEvent(new CustomEvent(e,{detail:this}))}startAutoIncome(){setInterval(()=>{this.getAutoIncome()>0&&this.addCurrency(this.getAutoIncome())},1e3)}update(){}}function E(){const c={A:.001,B:.005,C:.024,D:.05,E:.07,F:.1,G:.2,H:.55},e=Math.random();let t=0;for(const[n,s]of Object.entries(c))if(t+=s,e<=t)return n;return"H"}const k=[{id:"lightning_dagger",name:"Кинжал молнии",type:"active",baseBonus:.05,price:5e3,effect:"Шанс 5% умножить награду за нажатие на 2",stat:"click",image:"images/items/lightning_dagger.jpg"},{id:"chaos_seal",name:"Печать Хаоса",type:"active",baseBonus:.03,price:8e3,effect:"Каждые 10 нажатий — x5 награды",stat:"click",image:"images/items/chaos_seal.jpg"},{id:"gloves_of_rage",name:"Перчатки Гнева",type:"passive",baseBonus:1,price:3e3,effect:"+1 Тень за нажатие",stat:"click",image:"images/items/gloves_of_rage.jpg"},{id:"eternal_clock",name:"Часы Этерна",type:"active",baseBonus:.1,price:12e3,effect:"На 10 секунд все нажатия дают x3",stat:"click",image:"images/items/eternal_clock.jpg"},{id:"shadow_hood",name:"Капюшон Тени",type:"passive",baseBonus:.05,price:2e3,effect:"+5% к авто-добыванию",stat:"auto",image:"images/items/shadow_hood.jpg"}];class L{constructor(e){this.game=e,this.cost=1e3}openChest(){if(this.game.getCurrency()<this.cost)return l.show("Недостаточно Теней!"),null;this.game.addCurrency(-this.cost);const e=E(),t=k.filter(o=>o.id!==void 0),n=t[Math.floor(Math.random()*t.length)],s=this.getBonusMultiplier(e),i=n.baseBonus*s,a={...n,card:e,bonusMultiplier:s,enhancedValue:i,enhancedEffect:`${n.effect} (+${Math.round(s*100)}%)`};return{card:e,item:a}}getBonusMultiplier(e){return{A:1,B:.8,C:.4,D:.3,E:.2,F:.15,G:.1,H:.05}[e]||.05}}class b{static show(e){const n={A:"#6a0dad",B:"#cc0000",C:"#0066cc",D:"#ffffff",E:"#888888",F:"#777777",G:"#666666",H:"#555555"}[e]||"#444444",s=window.innerWidth/2,i=window.innerHeight/2;for(let a=0;a<50;a++){const o=document.createElement("div");o.className="confetti",o.style.backgroundColor=n,o.style.opacity=Math.random()*.5+.5,o.style.width=`${Math.random()*25+10}px`,o.style.height=o.style.width,o.style.borderRadius="50%",o.style.position="fixed",o.style.left=`${s}px`,o.style.top=`${i}px`,o.style.zIndex="999",document.body.appendChild(o);const d=Math.random()*Math.PI*2,h=Math.random()*250+250,I=Math.cos(d)*h,$=Math.sin(d)*h;setTimeout(()=>{o.style.transition="all 3s ease-out",o.style.transform=`translate(${I}px, ${$}px) rotate(${Math.random()*360}deg)`,o.style.opacity="0",setTimeout(()=>{document.body.removeChild(o)},3e3)},10)}}static showDisenchant(){const e="#888888",t=window.innerWidth/2,n=window.innerHeight/2;for(let s=0;s<20;s++){const i=document.createElement("div");i.className="confetti",i.style.backgroundColor=e,i.style.opacity=Math.random()*.4+.3,i.style.width=`${Math.random()*10+5}px`,i.style.height=i.style.width,i.style.borderRadius="50%",i.style.position="fixed",i.style.left=`${t}px`,i.style.top=`${n}px`,i.style.zIndex="999",document.body.appendChild(i);const a=Math.random()*Math.PI*2,o=Math.random()*50+150,d=Math.cos(a)*o,h=Math.sin(a)*o;setTimeout(()=>{i.style.transition="all 1.5s ease-out",i.style.transform=`translate(${d}px, ${h}px) rotate(${Math.random()*360}deg)`,i.style.opacity="0",setTimeout(()=>{document.body.removeChild(i)},1500)},10)}}}function B(c){const e=c.startsWith("/")?c.slice(1):c,t="/tap-game/";return`${t.endsWith("/")?t:`${t}/`}${e}`}const m=B;class f{static showCard(e,t,n){b.show(e);const s=document.createElement("div");s.className="card-overlay";const i=m(`images/cards/${e.toLowerCase()}.png`),a=m(t.image);s.innerHTML=`
      <div class="card-modal">
        <div class="item-image-container">
          <img src="${a}" alt="${t.name}" class="item-image" />
          <img src="${i}" alt="${e}" class="card-badge" />
        </div>
        <h2>Выпала карта: ${e}</h2>
        <p>${t.name}</p>
        <p>${t.enhancedEffect}</p>
        <button id="disenchant-card" class="disenchant-btn">⚡ Распылить</button>
        <button id="close-card">Закрыть</button>
      </div>
    `,document.body.appendChild(s);const o=()=>{n.addItem(t),document.body.removeChild(s)};document.getElementById("disenchant-card").addEventListener("click",()=>{const d=f.getCompensation(t);n.addCurrency(d),document.body.removeChild(s),l.show(`Предмет распылен. Получено: ${d} Теней.`)}),document.getElementById("close-card").addEventListener("click",()=>{o()}),setTimeout(()=>{document.body.contains(s)&&o()},5e3)}static getCompensation(e){return Math.floor({A:5e3,B:3e3,C:1500,D:800,E:500,F:300,G:150,H:50}[e.card]||50)}}class g{static show(e,t){const n=document.createElement("div");n.className="item-overlay";const s=e.card?m(`images/cards/${e.card.toLowerCase()}.png`):"",i=m(e.image);n.innerHTML=`
      <div class="item-modal">
        <div class="item-image-container">
          <img src="${i}" alt="${e.name}" class="item-image" />
          ${s?`<img src="${s}" alt="${e.card}" class="card-badge" />`:""}
        </div>
        <div class="item-name">${e.name}</div>
        <div class="item-info">
          <div class="item-effect">${e.enhancedEffect}</div>
        </div>
        <button id="disenchant-item" class="disenchant-btn">⚡ Распылить</button>
        <button id="close-item-modal"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `,document.body.appendChild(n),document.getElementById("disenchant-item").addEventListener("click",()=>{const a=g.getCompensation(e);t.addCurrency(a),t.removeItem(e),b.showDisenchant(),document.body.removeChild(n),alert(`Предмет распылен. Получено: ${a} Теней.`)}),document.getElementById("close-item-modal").addEventListener("click",()=>{document.body.removeChild(n)})}static getCompensation(e){return Math.floor({A:5e3,B:3e3,C:1500,D:800,E:500,F:300,G:150,H:50}[e.card]||50)}}class S{constructor(e){this.game=e,this.isOpen=!1}show(){if(this.isOpen)return;this.isOpen=!0;const e=document.createElement("div");e.className="inventory-overlay",e.innerHTML=`
      <div class="inventory-modal">
        <h2 class="inventory-title"><i class="fas fa-backpack"></i> Инвентарь</h2>
        <div class="inventory-grid">
          ${this.renderSlots()}
        </div>
        <button id="close-inventory"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `,document.body.appendChild(e),this.updateSlotListeners(e);const t=()=>{this.isOpen&&this.refreshSlots(e)};document.addEventListener("inventoryUpdated",t),document.getElementById("close-inventory").addEventListener("click",()=>{document.removeEventListener("inventoryUpdated",t),document.body.removeChild(e),this.isOpen=!1})}updateSlotListeners(e){e.querySelectorAll(".inventory-slot").forEach((n,s)=>{n.replaceWith(n.cloneNode(!0));const i=e.querySelectorAll(".inventory-slot")[s];i&&this.game.items[s]&&i.addEventListener("click",()=>{const a=this.game.items[s];a&&g.show(a,this.game)})})}refreshSlots(e){const t=e.querySelector(".inventory-grid");t.innerHTML=this.renderSlots(),this.updateSlotListeners(e)}renderSlots(){const e=[];for(let t=0;t<20;t++){const n=this.game.items[t];if(n){const s=m(n.image);e.push(`
          <div class="inventory-slot" title="${n.name}">
            <img src="${s}" alt="${n.name}" class="item-icon" />
          </div>
        `)}else e.push('<div class="inventory-slot empty"></div>')}return e.join("")}}const y=[{id:"click_power_1",name:"Сила Нажатия I",description:"Увеличивает силу нажатия на 1",type:"click",value:1,price:100,icon:"fa-hand-point-up",maxLevel:5,priceIncrease:1.5},{id:"click_power_2",name:"Сила Нажатия II",description:"Увеличивает силу нажатия на 5",type:"click",value:5,price:500,icon:"fa-fist-raised",maxLevel:3,priceIncrease:2},{id:"auto_income_1",name:"Тени в Минуту I",description:"Даёт 0.1 Тени в секунду",type:"auto",value:.1,price:300,icon:"fa-clock",maxLevel:10,priceIncrease:1.3},{id:"auto_income_2",name:"Тени в Минуту II",description:"Даёт 0.5 Тени в секунду",type:"auto",value:.5,price:1500,icon:"fa-hourglass-half",maxLevel:5,priceIncrease:1.5},{id:"click_multiplier",name:"Умножитель Нажатия",description:"Увеличивает силу нажатия на 50%",type:"multiplier",value:1.5,price:1e3,icon:"fa-star",maxLevel:5,priceIncrease:2}];class x{constructor(e){this.game=e,this.upgrades=this.loadState()}loadState(){const e=localStorage.getItem("shopProgress");if(e)try{const t=JSON.parse(e);return y.map(n=>{const s=t.find(i=>i.id===n.id);return{...n,level:s?s.level:0,totalSpent:s?s.totalSpent:0}})}catch(t){console.error("Ошибка загрузки прогресса магазина:",t)}return y.map(t=>({...t,level:0,totalSpent:0}))}saveState(){const e=this.upgrades.map(t=>({id:t.id,level:t.level,totalSpent:t.totalSpent}));localStorage.setItem("shopProgress",JSON.stringify(e))}getCurrentPrice(e){return e.level===0?e.price:Math.floor(e.price*Math.pow(e.priceIncrease,e.level))}buyUpgrade(e){const t=this.upgrades.find(s=>s.id===e);if(!t)return l.show("Улучшение не найдено"),!1;if(t.level>=t.maxLevel)return l.show(`Максимальный уровень улучшения "${t.name}" достигнут`),!1;const n=this.getCurrentPrice(t);return this.game.getCurrency()<n?(l.show("Недостаточно Теней"),!1):(this.game.addCurrency(-n),t.level++,t.totalSpent+=n,this.applyUpgrade(t),this.saveState(),l.show(`${t.name} улучшен до уровня ${t.level}`),!0)}applyUpgrade(e){e.type==="click"?this.game.clickValue+=e.value:e.type==="auto"?this.game.autoIncome+=e.value:e.type==="multiplier"&&(this.game.clickValue=Math.round(this.game.clickValue*e.value))}getUpgrades(){return this.upgrades.map(e=>({...e,currentPrice:this.getCurrentPrice(e),canAfford:this.game.getCurrency()>=this.getCurrentPrice(e),progressPercent:e.level/e.maxLevel*100}))}}class M{constructor(e){this.game=e,this.shop=new x(e),this.isOpen=!1}show(){if(this.isOpen)return;this.isOpen=!0;const e=document.createElement("div");e.className="shop-overlay",e.innerHTML=`
      <div class="shop-modal">
        <h2 class="shop-title"><i class="fas fa-store"></i> Магазин</h2>
        <div class="shop-grid">
          ${this.renderUpgrades()}
        </div>
        <button id="close-shop"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `,document.body.appendChild(e),this.updateBuyButtons(e),document.getElementById("close-shop").addEventListener("click",()=>{document.body.removeChild(e),this.isOpen=!1})}renderUpgrades(){return this.shop.getUpgrades().map(t=>{const n=t.level/t.maxLevel*100,s=this.shop.getCurrentPrice(t);return`
        <div class="shop-item ${t.canAfford?"affordable":""} ${t.level>=t.maxLevel?"maxed":""}">
          <div class="shop-item-icon">
            <i class="fas ${t.icon}"></i>
          </div>
          <div class="shop-item-info">
            <h3>${t.name}</h3>
            <p>${t.description}</p>
            <div class="shop-item-price">Цена: ${s} Теней</div>
            
            <!-- Прогресс-бар -->
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${n}%"></div>
            </div>
            <div class="progress-text">${t.level}/${t.maxLevel}</div>
            
            <!-- Общая потраченная валюта -->
            ${t.totalSpent>0?`<div class="total-spent">Потрачено: ${t.totalSpent} Теней</div>`:""}
          </div>
          <button class="buy-btn" data-id="${t.id}" ${!t.canAfford||t.level>=t.maxLevel?"disabled":""}>
            ${t.level>=t.maxLevel?"Макс.":"Купить"}
          </button>
        </div>
      `}).join("")}updateBuyButtons(e){e.querySelectorAll(".buy-btn").forEach(n=>{n.addEventListener("click",s=>{const i=s.target.dataset.id;this.shop.buyUpgrade(i),setTimeout(()=>{const a=document.createElement("div");a.className="shop-overlay",a.innerHTML=`
            <div class="shop-modal">
              <h2 class="shop-title"><i class="fas fa-store"></i> Магазин</h2>
              <div class="shop-grid">
                ${this.renderUpgrades()}
              </div>
              <button id="close-shop"><i class="fas fa-times"></i> Закрыть</button>
            </div>
          `,e.parentElement.replaceChild(a,e),this.updateBuyButtons(a),document.getElementById("close-shop").addEventListener("click",()=>{document.body.removeChild(a),this.isOpen=!1}),e=a},100)})})}}class A{constructor(e,t){this.game=e,this.telegram=t}show(){const e=this.telegram?.initDataUnsafe?.user;if(!e){alert("Не удалось получить данные пользователя из Telegram");return}const t=document.createElement("div");t.className="profile-overlay",t.innerHTML=`
        <div class="profile-modal">
          <div class="profile-header">
            <img src="${e.photo_url||"https://via.placeholder.com/80"}" alt="Avatar" class="profile-avatar" onerror="this.src='https://via.placeholder.com/80'">
            <div class="profile-info">
              <h2 class="profile-name">${e.first_name} ${e.last_name||""}</h2>
              <p class="profile-username">@${e.username||"N/A"}</p>
              <p class="profile-id">ID: ${e.id}</p>
            </div>
          </div>
          
          <div class="profile-stats">
            <h3>📊 Статистика</h3>
            <div class="stat-item">
              <span class="stat-label">Валюта:</span>
              <span class="stat-value">${this.game.getCurrency().toFixed(2)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Сила нажатия:</span>
              <span class="stat-value">${this.game.getClickValue().toFixed(2)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Авто-доход:</span>
              <span class="stat-value">${this.game.getAutoIncome().toFixed(2)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Предметов в инвентаре:</span>
              <span class="stat-value">${this.game.items.length}</span>
            </div>
          </div>
          
          <button id="close-profile"><i class="fas fa-times"></i> Закрыть</button>
        </div>
      `,document.body.appendChild(t),document.getElementById("close-profile").addEventListener("click",()=>{document.body.removeChild(t)})}}const u=window.Telegram?.WebApp;u?(u.ready(),u.expand()):console.warn("Telegram Web App SDK не загружен");const r=new w;r.loadProgress();const O=document.getElementById("currency"),v=document.getElementById("clicker"),P=document.getElementById("open-chest"),N=document.getElementById("inventory-btn"),F=document.getElementById("shop"),_=document.getElementById("profile");function C(){O.textContent=T(r.getCurrency())}function T(c){return c>=1e6?(c/1e6).toFixed(2)+"M":c>=1e3?(c/1e3).toFixed(2)+"K":c.toFixed(2)}v.addEventListener("click",()=>{r.addCurrency(r.getClickValue()),G()});const V=new L(r);P.addEventListener("click",()=>{const c=V.openChest();c&&f.showCard(c.card,c.item,r)});const H=new S(r);N.addEventListener("click",()=>{H.show()});const D=new M(r);F.addEventListener("click",()=>{D.show()});const U=new A(r,u);_.addEventListener("click",()=>{U.show()});function G(){v.style.transform="scale(0.9)",setTimeout(()=>{v.style.transform="scale(1)"},100)}document.addEventListener("currencyChanged",C);setInterval(()=>{r.saveProgress()},p.saveInterval);r.startAutoIncome();C();console.log("🎮 Игра запущена. Нажимай!");
