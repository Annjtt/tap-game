(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=t(i);fetch(i.href,n)}})();const p={baseClickValue:1,saveInterval:3e4};class l{static show(e,t=2e3){const s=document.createElement("div");s.className="notification",s.textContent=e,document.body.appendChild(s),setTimeout(()=>{s.classList.add("show")},10),setTimeout(()=>{s.classList.remove("show"),setTimeout(()=>{document.body.removeChild(s)},300)},t)}}class w{constructor(){this.currency=0,this.baseClickValue=p.baseClickValue,this.items=[],this.baseAutoIncome=0,this.shopClickBonus=0,this.shopAutoBonus=0,this.shopMultiplier=1,this.lastSave=Date.now(),this.bonusMultipliers={A:1,B:.8,C:.4,D:.3,E:.2,F:.15,G:.1,H:.05}}addCurrency(e){this.currency+=e,this.triggerEvent("currencyChanged")}getCurrency(){return this.currency}getClickValue(){const e=this.baseClickValue,t=this.shopClickBonus*this.shopMultiplier;let s=0;const i=this.getActiveItemsByName();for(const n of Object.values(i))n.stat==="click"&&(s+=n.enhancedValue||n.baseBonus);return e+t+s}getAutoIncome(){const e=this.baseAutoIncome,t=this.shopAutoBonus*this.shopMultiplier;let s=0;const i=this.getActiveItemsByName();for(const n of Object.values(i))n.stat==="auto"&&(s+=n.enhancedValue||n.baseBonus);return e+t+s}addShopClickBonus(e){this.shopClickBonus+=e}addShopAutoBonus(e){this.shopAutoBonus+=e}addShopMultiplier(e){this.shopMultiplier*=e}resetShopBonuses(){this.shopClickBonus=0,this.shopAutoBonus=0,this.shopMultiplier=1}getActiveItemsByName(){const e={};for(const t of this.items){const s=t.name;if(!e[s])e[s]=t;else{const i=e[s].card,n=t.card;this.getCardRank(n)<this.getCardRank(i)&&(e[s]=t)}}return e}getCardRank(e){return{A:0,B:1,C:2,D:3,E:4,F:5,G:6,H:7}[e]||7}addItem(e){if(!e.card){console.warn("Предмет без карты:",e);return}const t=this.items.find(s=>s.name===e.name);if(t){const s=this.getCardRank(e.card),i=this.getCardRank(t.card);if(s<i){const n=this.getCompensationForItem(t);this.addCurrency(n);const o=this.items.indexOf(t);this.items[o]=e,l.show(`Предмет "${e.name}" заменен (${t.card} → ${e.card}). Компенсация: ${n} Теней`)}else if(s>i){const n=this.getCompensationForItem(e);this.addCurrency(n),l.show(`У вас уже есть "${t.name}" (${t.card}). Новый предмет менее редкий (${e.card}). Компенсация: ${n} Теней`)}else{const n=this.getCompensationForItem(t);this.addCurrency(n);const o=this.items.indexOf(t);this.items[o]=e,l.show(`Предмет "${e.name}" обновлен (${t.card} → ${e.card}). Компенсация: ${n} Теней`)}}else this.items.push(e);this.triggerEvent("inventoryUpdated")}getCompensationForItem(e){return Math.floor({A:5e3,B:3e3,C:1500,D:800,E:500,F:300,G:150,H:50}[e.card]||50)}removeItem(e){const t=this.items.indexOf(e);t>-1&&(this.items.splice(t,1),this.triggerEvent("inventoryUpdated"))}saveProgress(){const e={currency:this.currency,baseClickValue:this.baseClickValue,shopClickBonus:this.shopClickBonus,shopAutoBonus:this.shopAutoBonus,shopMultiplier:this.shopMultiplier,baseAutoIncome:this.baseAutoIncome,items:this.items,timestamp:Date.now()};localStorage.setItem("tapGameProgress",JSON.stringify(e))}loadProgress(){const e=localStorage.getItem("tapGameProgress");if(e){const t=JSON.parse(e);this.currency=t.currency||0,this.baseClickValue=t.baseClickValue||p.baseClickValue,this.shopClickBonus=t.shopClickBonus||0,this.shopAutoBonus=t.shopAutoBonus||0,this.shopMultiplier=t.shopMultiplier||1,this.baseAutoIncome=t.baseAutoIncome||0,this.items=t.items||[],this.triggerEvent("progressLoaded")}}triggerEvent(e){document.dispatchEvent(new CustomEvent(e,{detail:this}))}startAutoIncome(){setInterval(()=>{this.getAutoIncome()>0&&this.addCurrency(this.getAutoIncome())},1e3)}update(){}}function E(){const c={A:.001,B:.005,C:.024,D:.05,E:.07,F:.1,G:.2,H:.55},e=Math.random();let t=0;for(const[s,i]of Object.entries(c))if(t+=i,e<=t)return s;return"H"}const k=[{id:"lightning_dagger",name:"Кинжал молнии",type:"active",baseBonus:.05,price:5e3,effect:"Шанс 5% умножить награду за нажатие на 2",stat:"click",image:"images/items/lightning_dagger.jpg"},{id:"chaos_seal",name:"Печать Хаоса",type:"active",baseBonus:.03,price:8e3,effect:"Каждые 10 нажатий — x5 награды",stat:"click",image:"images/items/chaos_seal.jpg"},{id:"gloves_of_rage",name:"Перчатки Гнева",type:"passive",baseBonus:1,price:3e3,effect:"+1 Тень за нажатие",stat:"click",image:"images/items/gloves_of_rage.jpg"},{id:"eternal_clock",name:"Часы Этерна",type:"active",baseBonus:.1,price:12e3,effect:"На 10 секунд все нажатия дают x3",stat:"click",image:"images/items/eternal_clock.jpg"},{id:"shadow_hood",name:"Капюшон Тени",type:"passive",baseBonus:.05,price:2e3,effect:"+5% к авто-добыванию",stat:"auto",image:"images/items/shadow_hood.jpg"}];class M{constructor(e){this.game=e,this.cost=1e3}openChest(){if(this.game.getCurrency()<this.cost)return l.show("Недостаточно Теней!"),null;this.game.addCurrency(-this.cost);const e=E(),t=k.filter(a=>a.id!==void 0),s=t[Math.floor(Math.random()*t.length)],i=this.getBonusMultiplier(e),n=s.baseBonus*i,o={...s,card:e,bonusMultiplier:i,enhancedValue:n,enhancedEffect:`${s.effect} (+${Math.round(i*100)}%)`};return{card:e,item:o}}getBonusMultiplier(e){return{A:1,B:.8,C:.4,D:.3,E:.2,F:.15,G:.1,H:.05}[e]||.05}}class C{static show(e){const s={A:"#6a0dad",B:"#cc0000",C:"#0066cc",D:"#ffffff",E:"#888888",F:"#777777",G:"#666666",H:"#555555"}[e]||"#444444",i=window.innerWidth/2,n=window.innerHeight/2;for(let o=0;o<50;o++){const a=document.createElement("div");a.className="confetti",a.style.backgroundColor=s,a.style.opacity=Math.random()*.5+.5,a.style.width=`${Math.random()*25+10}px`,a.style.height=a.style.width,a.style.borderRadius="50%",a.style.position="fixed",a.style.left=`${i}px`,a.style.top=`${n}px`,a.style.zIndex="999",document.body.appendChild(a);const d=Math.random()*Math.PI*2,h=Math.random()*250+250,$=Math.cos(d)*h,B=Math.sin(d)*h;setTimeout(()=>{a.style.transition="all 3s ease-out",a.style.transform=`translate(${$}px, ${B}px) rotate(${Math.random()*360}deg)`,a.style.opacity="0",setTimeout(()=>{document.body.removeChild(a)},3e3)},10)}}static showDisenchant(){const e="#888888",t=window.innerWidth/2,s=window.innerHeight/2;for(let i=0;i<20;i++){const n=document.createElement("div");n.className="confetti",n.style.backgroundColor=e,n.style.opacity=Math.random()*.4+.3,n.style.width=`${Math.random()*10+5}px`,n.style.height=n.style.width,n.style.borderRadius="50%",n.style.position="fixed",n.style.left=`${t}px`,n.style.top=`${s}px`,n.style.zIndex="999",document.body.appendChild(n);const o=Math.random()*Math.PI*2,a=Math.random()*50+150,d=Math.cos(o)*a,h=Math.sin(o)*a;setTimeout(()=>{n.style.transition="all 1.5s ease-out",n.style.transform=`translate(${d}px, ${h}px) rotate(${Math.random()*360}deg)`,n.style.opacity="0",setTimeout(()=>{document.body.removeChild(n)},1500)},10)}}}function S(c){const e=c.startsWith("/")?c.slice(1):c,t="/tap-game/";return`${t.endsWith("/")?t:`${t}/`}${e}`}const m=S;class f{static showCard(e,t,s){C.show(e);const i=document.createElement("div");i.className="card-overlay";const n=m(`images/cards/${e.toLowerCase()}.png`),o=m(t.image);i.innerHTML=`
      <div class="card-modal">
        <div class="item-image-container">
          <img src="${o}" alt="${t.name}" class="item-image" />
          <img src="${n}" alt="${e}" class="card-badge" />
        </div>
        <h2>${t.name}</h2>
        <p>Карта ранга: ${e}</p>
        <p>${t.enhancedEffect}</p>
        <button id="disenchant-card" class="disenchant-btn">Распылить</button>
        <button id="close-card">Закрыть</button>
      </div>
    `,document.body.appendChild(i);const a=()=>{s.addItem(t),document.body.removeChild(i)};document.getElementById("disenchant-card").addEventListener("click",()=>{const d=f.getCompensation(t);s.addCurrency(d),document.body.removeChild(i),l.show(`Предмет распылен. Получено: ${d} Теней.`)}),document.getElementById("close-card").addEventListener("click",()=>{a()}),setTimeout(()=>{document.body.contains(i)&&a()},5e3)}static getCompensation(e){return Math.floor({A:5e3,B:3e3,C:1500,D:800,E:500,F:300,G:150,H:50}[e.card]||50)}}class g{static show(e,t){const s=document.createElement("div");s.className="item-overlay";const i=e.card?m(`images/cards/${e.card.toLowerCase()}.png`):"",n=m(e.image);s.innerHTML=`
      <div class="item-modal">
        <div class="item-image-container">
          <img src="${n}" alt="${e.name}" class="item-image" />
          ${i?`<img src="${i}" alt="${e.card}" class="card-badge" />`:""}
        </div>
        <div class="item-name">${e.name}</div>
        <div class="item-info">
          <div class="item-effect">${e.enhancedEffect}</div>
        </div>
        <button id="disenchant-item" class="disenchant-btn"> Распылить</button>
        <button id="close-item-modal"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `,document.body.appendChild(s),document.getElementById("disenchant-item").addEventListener("click",()=>{const o=g.getCompensation(e);t.addCurrency(o),t.removeItem(e),C.showDisenchant(),document.body.removeChild(s),alert(`Предмет распылен. Получено: ${o} Теней.`)}),document.getElementById("close-item-modal").addEventListener("click",()=>{document.body.removeChild(s)})}static getCompensation(e){return Math.floor({A:5e3,B:3e3,C:1500,D:800,E:500,F:300,G:150,H:50}[e.card]||50)}}class L{constructor(e){this.game=e,this.isOpen=!1}show(){if(this.isOpen)return;this.isOpen=!0;const e=document.createElement("div");e.className="inventory-overlay",e.innerHTML=`
      <div class="inventory-modal">
        <h2 class="inventory-title"><i class="fas fa-backpack"></i> Инвентарь</h2>
        <div class="inventory-grid">
          ${this.renderSlots()}
        </div>
        <button id="close-inventory"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `,document.body.appendChild(e),this.updateSlotListeners(e);const t=()=>{this.isOpen&&this.refreshSlots(e)};document.addEventListener("inventoryUpdated",t),document.getElementById("close-inventory").addEventListener("click",()=>{document.removeEventListener("inventoryUpdated",t),document.body.removeChild(e),this.isOpen=!1})}updateSlotListeners(e){e.querySelectorAll(".inventory-slot").forEach((s,i)=>{s.replaceWith(s.cloneNode(!0));const n=e.querySelectorAll(".inventory-slot")[i];n&&this.game.items[i]&&n.addEventListener("click",()=>{const o=this.game.items[i];o&&g.show(o,this.game)})})}refreshSlots(e){const t=e.querySelector(".inventory-grid");t.innerHTML=this.renderSlots(),this.updateSlotListeners(e)}renderSlots(){const e=[];for(let t=0;t<20;t++){const s=this.game.items[t];if(s){const i=m(s.image);e.push(`
          <div class="inventory-slot" title="${s.name}">
            <img src="${i}" alt="${s.name}" class="item-icon" />
          </div>
        `)}else e.push('<div class="inventory-slot empty"></div>')}return e.join("")}}const y=[{id:"click_power_1",name:"Сила Нажатия I",description:"Увеличивает силу нажатия на 1",type:"click",value:1,price:100,icon:"fa-hand-point-up",maxLevel:5,priceIncrease:1.5},{id:"click_power_2",name:"Сила Нажатия II",description:"Увеличивает силу нажатия на 5",type:"click",value:5,price:500,icon:"fa-fist-raised",maxLevel:3,priceIncrease:2},{id:"auto_income_1",name:"Тени в Минуту I",description:"Даёт 0.1 Тени в секунду",type:"auto",value:.1,price:300,icon:"fa-clock",maxLevel:10,priceIncrease:1.3},{id:"auto_income_2",name:"Тени в Минуту II",description:"Даёт 0.5 Тени в секунду",type:"auto",value:.5,price:1500,icon:"fa-hourglass-half",maxLevel:5,priceIncrease:1.5},{id:"click_multiplier",name:"Умножитель Нажатия",description:"Увеличивает силу нажатия на 50%",type:"multiplier",value:1.5,price:1e3,icon:"fa-star",maxLevel:5,priceIncrease:2}];class A{constructor(e){this.game=e,this.upgrades=this.loadState()}loadState(){const e=localStorage.getItem("shopProgress");if(e)try{const t=JSON.parse(e);return y.map(s=>{const i=t.find(n=>n.id===s.id);return{...s,level:i?i.level:0,totalSpent:i?i.totalSpent:0}})}catch(t){console.error("Ошибка загрузки прогресса магазина:",t)}return y.map(t=>({...t,level:0,totalSpent:0}))}saveState(){const e=this.upgrades.map(t=>({id:t.id,level:t.level,totalSpent:t.totalSpent}));localStorage.setItem("shopProgress",JSON.stringify(e))}getCurrentPrice(e){return e.level===0?e.price:Math.floor(e.price*Math.pow(e.priceIncrease,e.level))}buyUpgrade(e){const t=this.upgrades.find(i=>i.id===e);if(!t)return l.show("Улучшение не найдено"),!1;if(t.level>=t.maxLevel)return l.show(`Максимальный уровень улучшения "${t.name}" достигнут`),!1;const s=this.getCurrentPrice(t);return this.game.getCurrency()<s?(l.show("Недостаточно Теней"),!1):(this.game.addCurrency(-s),t.level++,t.totalSpent+=s,this.applyUpgrade(t),this.saveState(),l.show(`${t.name} улучшен до уровня ${t.level}`),!0)}applyUpgrade(e){e.type==="click"?this.game.addShopClickBonus(e.value):e.type==="auto"?this.game.addShopAutoBonus(e.value):e.type==="multiplier"&&this.game.addShopMultiplier(e.value)}getUpgrades(){return this.upgrades.map(e=>({...e,currentPrice:this.getCurrentPrice(e),canAfford:this.game.getCurrency()>=this.getCurrentPrice(e),progressPercent:e.level/e.maxLevel*100}))}resetAllUpgrades(){let e=0;for(const t of this.upgrades)if(t.level>0)for(let s=0;s<t.level;s++){const i=Math.floor(t.price*Math.pow(t.priceIncrease,s));e+=i}return this.upgrades=this.upgrades.map(t=>({...t,level:0,totalSpent:0})),this.game.addCurrency(e),this.saveState(),this.game.resetShopBonuses(),e}}class x{constructor(e){this.game=e,this.shop=new A(e),this.isOpen=!1}show(){if(this.isOpen)return;this.isOpen=!0;const e=document.createElement("div");e.className="shop-overlay",e.innerHTML=`
      <div class="shop-modal">
        <h2 class="shop-title"><i class="fas fa-store"></i> Магазин</h2>
        <div class="shop-grid">
          ${this.renderUpgrades()}
        </div>
        <button id="close-shop"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `,document.body.appendChild(e),this.updateBuyButtons(e),document.getElementById("close-shop").addEventListener("click",()=>{document.body.removeChild(e),this.isOpen=!1})}renderUpgrades(){return this.shop.getUpgrades().map(t=>{const s=t.level/t.maxLevel*100,i=this.shop.getCurrentPrice(t);return`
        <div class="shop-item ${t.canAfford?"affordable":""} ${t.level>=t.maxLevel?"maxed":""}">
          <div class="shop-item-icon">
            <i class="fas ${t.icon}"></i>
          </div>
          <div class="shop-item-info">
            <h3>${t.name}</h3>
            <p>${t.description}</p>
            <div class="shop-item-price">Цена: ${i} Теней</div>
            
            <!-- Прогресс-бар -->
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${s}%"></div>
            </div>
            <div class="progress-text">${t.level}/${t.maxLevel}</div>
            
            <!-- Общая потраченная валюта -->
            ${t.totalSpent>0?`<div class="total-spent">Потрачено: ${t.totalSpent} Теней</div>`:""}
          </div>
          <button class="buy-btn" data-id="${t.id}" ${!t.canAfford||t.level>=t.maxLevel?"disabled":""}>
            ${t.level>=t.maxLevel?"Макс.":"Купить"}
          </button>
        </div>
      `}).join("")}updateBuyButtons(e){e.querySelectorAll(".buy-btn").forEach(s=>{s.addEventListener("click",i=>{const n=i.target.dataset.id;this.shop.buyUpgrade(n),setTimeout(()=>{const o=document.createElement("div");o.className="shop-overlay",o.innerHTML=`
            <div class="shop-modal">
              <h2 class="shop-title"><i class="fas fa-store"></i> Магазин</h2>
              <div class="shop-grid">
                ${this.renderUpgrades()}
              </div>
              <button id="close-shop"><i class="fas fa-times"></i> Закрыть</button>
            </div>
          `,e.parentElement.replaceChild(o,e),this.updateBuyButtons(o),document.getElementById("close-shop").addEventListener("click",()=>{document.body.removeChild(o),this.isOpen=!1}),e=o},100)})})}}class O{constructor(e,t){this.game=e,this.telegram=t}show(){const e=this.telegram?.initDataUnsafe?.user;if(!e){alert("Не удалось получить данные пользователя из Telegram");return}const t=document.createElement("div");t.className="profile-overlay",t.innerHTML=`
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
          <h3>Статистика</h3>
          <div class="stat-item">
            <span class="stat-label">Теней:</span>
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
        
        <button id="reset-shop" class="reset-btn">Сбросить улучшения</button>
        <button id="close-profile"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `,document.body.appendChild(t),document.getElementById("reset-shop").addEventListener("click",()=>{if(confirm("Вы уверены, что хотите сбросить все улучшения магазина? Вы получите все Тени за потраченные улучшения."))if(this.game.shopSystem){const s=this.game.shopSystem.resetAllUpgrades();alert(`Улучшения сброшены. Получено: ${s} Теней`)}else alert("Система магазина недоступна")}),document.getElementById("close-profile").addEventListener("click",()=>{document.body.removeChild(t)})}}const u=window.Telegram?.WebApp;u?(u.ready(),u.expand()):console.warn("Telegram Web App SDK не загружен");const r=new w;r.loadProgress();const b=new x(r),P=b.shop;r.shopSystem=P;const N=document.getElementById("currency"),v=document.getElementById("clicker"),_=document.getElementById("open-chest"),T=document.getElementById("inventory-btn"),F=document.getElementById("shop"),H=document.getElementById("profile");function I(){N.textContent=D(r.getCurrency())}function D(c){return c>=1e6?(c/1e6).toFixed(2)+"M":c>=1e3?(c/1e3).toFixed(2)+"K":c.toFixed(2)}v.addEventListener("click",()=>{r.addCurrency(r.getClickValue()),R()});const U=new M(r);_.addEventListener("click",()=>{const c=U.openChest();c&&f.showCard(c.card,c.item,r)});const V=new L(r);T.addEventListener("click",()=>{V.show()});F.addEventListener("click",()=>{b.show()});const G=new O(r,u);H.addEventListener("click",()=>{G.show()});function R(){v.style.transform="scale(0.9)",setTimeout(()=>{v.style.transform="scale(1)"},100)}document.addEventListener("currencyChanged",I);setInterval(()=>{r.saveProgress()},p.saveInterval);r.startAutoIncome();I();console.log("🎮 Игра запущена. Нажимай!");
