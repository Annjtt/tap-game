import { Notification } from './Notification.js';

export class TowerShopModal {
  constructor(towerShopSystem, towerSystem) {
    this.shop = towerShopSystem;
    this.tower = towerSystem;
    this.isOpen = false;
    this.container = null;
    this.boundUpdate = () => this.render();
  }

  show() {
    if (this.isOpen) {
      return;
    }

    this.isOpen = true;
    this.container = document.createElement('div');
    this.container.className = 'tower-shop-overlay';
    document.body.appendChild(this.container);

    document.addEventListener('towerStateChanged', this.boundUpdate);
    this.render();
  }

  hide() {
    if (!this.isOpen) {
      return;
    }

    document.removeEventListener('towerStateChanged', this.boundUpdate);
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.isOpen = false;
  }

  render() {
    if (!this.container) return;

    const state = this.tower.getState();
    const items = this.shop.getAllItems(state.shadowShards);

    this.container.innerHTML = `
      <div class="tower-shop-modal">
        <div class="tower-shop-backdrop"></div>
        <div class="tower-shop-shell">
          <header class="tower-shop-header">
            <h2><i class="fas fa-vault"></i> Тайник Башни</h2>
            <div class="tower-shop-currency">
              <i class="fas fa-gem"></i>
              <span>${state.shadowShards}</span>
            </div>
            <button type="button" class="tower-shop-close" id="close-tower-shop"><i class="fas fa-times"></i></button>
          </header>

          <div class="tower-shop-grid">
            ${items.map(item => this.renderItem(item)).join('')}
          </div>

          <button type="button" class="tower-shop-close-btn" id="close-tower-shop-btn">Закрыть</button>
        </div>
      </div>
    `;

    this.bindActions();
  }

  renderItem(item) {
    const canAfford = item.canAfford;
    const isMaxLevel = item.level >= item.maxLevel;
    const effectText = this.formatEffect(item);

    return `
      <div class="tower-shop-item ${isMaxLevel ? 'maxed' : ''} ${!canAfford && !isMaxLevel ? 'locked' : ''}">
        <div class="tower-shop-item-icon">
          <i class="fas fa-${this.getIcon(item.id)}"></i>
        </div>
        <div class="tower-shop-item-info">
          <h3>${item.name}</h3>
          <p class="tower-shop-item-desc">${item.description.replace('{value}', item.valuePerLevel)}</p>
          <div class="tower-shop-item-progress">
            <div class="tower-shop-progress-bar">
              <div class="tower-shop-progress-fill" style="width:${item.progressPercent}%"></div>
            </div>
            <span class="tower-shop-level">${item.level} / ${item.maxLevel}</span>
          </div>
          <p class="tower-shop-current-effect">Текущий эффект: ${effectText}</p>
        </div>
        <div class="tower-shop-item-buy">
          ${isMaxLevel
            ? '<span class="tower-shop-maxed">МАКС</span>'
            : `
              <button type="button" 
                class="tower-shop-buy-btn ${!canAfford ? 'disabled' : ''}" 
                data-id="${item.id}" 
                ${!canAfford ? 'disabled' : ''}>
                <i class="fas fa-gem"></i> ${item.currentCost}
              </button>
            `
          }
        </div>
      </div>
    `;
  }

  formatEffect(item) {
    if (item.level === 0) return 'нет';
    const val = item.effectValue;
    switch (item.stat) {
      case 'damage_percent': return `+${val}% урона`;
      case 'hp_percent': return `+${val}% HP`;
      case 'regen_per_hit': return `+${val} HP за удар`;
      case 'crit_chance': return `${val}% шанс крита`;
      case 'crit_damage': return `+${val}% крит. урон`;
      case 'shard_bonus': return `+${val}% осколков`;
      case 'gold_bonus': return `+${val}% теней`;
      case 'enemy_slow': return `-${val}% скорость врага`;
      case 'checkpoint_heal': return `+${val}% HP на чекпоинте`;
      case 'auto_damage': return `${val}% авто-урон/5с`;
      default: return `${val}`;
    }
  }

  getIcon(id) {
    const icons = {
      tower_damage: 'sword',
      tower_hp: 'heart',
      tower_regen: 'tint',
      tower_crit_chance: 'eye',
      tower_crit_damage: 'bolt',
      tower_shard_bonus: 'gem',
      tower_gold_bonus: 'coins',
      tower_enemy_slow: 'snowflake',
      tower_checkpoint_heal: 'medkit',
      tower_auto_damage: 'ghost'
    };
    return icons[id] || 'cube';
  }

  bindActions() {
    const closeBtn = this.container.querySelector('#close-tower-shop');
    const closeBtn2 = this.container.querySelector('#close-tower-shop-btn');
    const buyBtns = this.container.querySelectorAll('.tower-shop-buy-btn');

    closeBtn?.addEventListener('click', () => this.hide());
    closeBtn2?.addEventListener('click', () => this.hide());

    buyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = e.currentTarget.dataset.id;
        this.handleBuy(itemId);
      });
    });
  }

  handleBuy(itemId) {
    const state = this.tower.getState();
    const result = this.shop.buyUpgrade(itemId, state.shadowShards);
    if (result.success) {
      this.tower.shadowShards = result.newShards;
      this.tower.triggerUpdate();
      this.render();
    }
  }
}