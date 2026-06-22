class i{constructor(e,t){this.shop=e,this.tower=t,this.isOpen=!1,this.container=null,this.boundUpdate=()=>this.render()}show(){this.isOpen||(this.isOpen=!0,this.container=document.createElement("div"),this.container.className="tower-shop-overlay",document.body.appendChild(this.container),document.addEventListener("towerStateChanged",this.boundUpdate),this.render())}hide(){this.isOpen&&(document.removeEventListener("towerStateChanged",this.boundUpdate),this.container?.parentNode&&this.container.parentNode.removeChild(this.container),this.container=null,this.isOpen=!1)}render(){if(!this.container)return;const e=this.tower.getState(),t=this.shop.getAllItems(e.shadowShards);this.container.innerHTML=`
      <div class="tower-shop-modal">
        <div class="tower-shop-backdrop"></div>
        <div class="tower-shop-shell">
          <header class="tower-shop-header">
            <h2><i class="fas fa-vault"></i> Тайник Башни</h2>
            <div class="tower-shop-currency">
              <i class="fas fa-gem"></i>
              <span>${e.shadowShards}</span>
            </div>
            <button type="button" class="tower-shop-close" id="close-tower-shop"><i class="fas fa-times"></i></button>
          </header>

          <div class="tower-shop-grid">
            ${t.map(s=>this.renderItem(s)).join("")}
          </div>

          <button type="button" class="tower-shop-close-btn" id="close-tower-shop-btn">Закрыть</button>
        </div>
      </div>
    `,this.bindActions()}renderItem(e){const t=e.canAfford,s=e.level>=e.maxLevel,o=this.formatEffect(e);return`
      <div class="tower-shop-item ${s?"maxed":""} ${!t&&!s?"locked":""}">
        <div class="tower-shop-item-icon">
          <i class="fas fa-${this.getIcon(e.id)}"></i>
        </div>
        <div class="tower-shop-item-info">
          <h3>${e.name}</h3>
          <p class="tower-shop-item-desc">${e.description.replace("{value}",e.valuePerLevel)}</p>
          <div class="tower-shop-item-progress">
            <div class="tower-shop-progress-bar">
              <div class="tower-shop-progress-fill" style="width:${e.progressPercent}%"></div>
            </div>
            <span class="tower-shop-level">${e.level} / ${e.maxLevel}</span>
          </div>
          <p class="tower-shop-current-effect">Текущий эффект: ${o}</p>
        </div>
        <div class="tower-shop-item-buy">
          ${s?'<span class="tower-shop-maxed">МАКС</span>':`
              <button type="button" 
                class="tower-shop-buy-btn ${t?"":"disabled"}" 
                data-id="${e.id}" 
                ${t?"":"disabled"}>
                <i class="fas fa-gem"></i> ${e.currentCost}
              </button>
            `}
        </div>
      </div>
    `}formatEffect(e){if(e.level===0)return"нет";const t=e.effectValue;switch(e.stat){case"damage_percent":return`+${t}% урона`;case"hp_percent":return`+${t}% HP`;case"regen_per_hit":return`+${t} HP за удар`;case"crit_chance":return`${t}% шанс крита`;case"crit_damage":return`+${t}% крит. урон`;case"shard_bonus":return`+${t}% осколков`;case"gold_bonus":return`+${t}% теней`;case"enemy_slow":return`-${t}% скорость врага`;case"checkpoint_heal":return`+${t}% HP на чекпоинте`;case"auto_damage":return`${t}% авто-урон/5с`;default:return`${t}`}}getIcon(e){return{tower_damage:"sword",tower_hp:"heart",tower_regen:"tint",tower_crit_chance:"eye",tower_crit_damage:"bolt",tower_shard_bonus:"gem",tower_gold_bonus:"coins",tower_enemy_slow:"snowflake",tower_checkpoint_heal:"medkit",tower_auto_damage:"ghost"}[e]||"cube"}bindActions(){const e=this.container.querySelector("#close-tower-shop"),t=this.container.querySelector("#close-tower-shop-btn"),s=this.container.querySelectorAll(".tower-shop-buy-btn");e?.addEventListener("click",()=>this.hide()),t?.addEventListener("click",()=>this.hide()),s.forEach(o=>{o.addEventListener("click",r=>{const a=r.currentTarget.dataset.id;this.handleBuy(a)})})}handleBuy(e){const t=this.tower.getState(),s=this.shop.buyUpgrade(e,t.shadowShards);s.success&&(this.tower.shadowShards=s.newShards,this.tower.triggerUpdate(),this.render())}}export{i as TowerShopModal};
