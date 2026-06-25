import { Notification } from './Notification.js';

export class ProfileModal {
  constructor(gameCore, telegram, towerSystem) {
    this.game = gameCore;
    this.telegram = telegram;
    this.tower = towerSystem || null;
    this.isOpen = false;
    this.container = null;
  }

  show() {
    if (this.isOpen) {
      return;
    }

    this.isOpen = true;

    const user = this.telegram?.initDataUnsafe?.user;
    const playerName = this.game.getPlayerDisplayName(this.telegram);
    const avatarUrl = user?.photo_url || '';
    const username = user?.username || null;
    const userId = user?.id || null;

    const towerSection = this.tower ? `
      <div class="profile-stats">
        <h3>Башня Теней</h3>
        <div class="stat-item">
          <span class="stat-label">Этаж:</span>
          <span class="stat-value">${this.tower.getState().currentFloor}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Рекорд:</span>
          <span class="stat-value">${this.tower.getState().highestFloor}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Осколков:</span>
          <span class="stat-value">${this.tower.getShadowShards()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Базовый урон:</span>
          <span class="stat-value">${this.tower.getBaseTowerDamage().toFixed(2)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Макс. HP:</span>
          <span class="stat-value">${this.tower.getMaxHp()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Отхил с урона:</span>
          <span class="stat-value">${this.tower.getRegenPercent()}%</span>
        </div>
      </div>
      <button id="reset-tower-shop" class="reset-btn">
        <i class="fas fa-dungeon" style="margin-right: 6px;"></i>
        Сбросить улучшения башни
      </button>
 
    ` : '';

    this.container = document.createElement('div');
    this.container.className = 'profile-overlay';
    this.container.innerHTML = `
      <div class="profile-modal">
        <div class="profile-header">
          ${avatarUrl ? `<img src="${avatarUrl}" alt="Avatar" class="profile-avatar">` : '<div class="profile-avatar profile-avatar--placeholder"><i class="fas fa-user"></i></div>'}
          <div class="profile-info">
            <h2 class="profile-name">${playerName}</h2>
            ${username ? `<p class="profile-username">@${username}</p>` : ''}
            ${userId ? `<p class="profile-id">ID: ${userId}</p>` : ''}
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
        <button id="reset-shop" class="reset-btn">
          <i class="fas fa-store" style="margin-right: 6px;"></i>
          Сбросить улучшения
        </button> 

        ${towerSection}
          
        <button id="close-profile"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `;

    document.body.appendChild(this.container);
    this.bindActions();
  }

  hide() {
    if (!this.isOpen || !this.container) {
      return;
    }

    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.container = null;
    this.isOpen = false;
  }

  bindActions() {
    const closeBtn = this.container.querySelector('#close-profile');
    const resetBtn = this.container.querySelector('#reset-shop');
    const resetTowerBtn = this.container.querySelector('#reset-tower-shop');

    resetBtn?.addEventListener('click', () => {
      if (!this.game.shopSystem) {
        Notification.show('Система магазина недоступна');
        return;
      }
      const confirmMsg = 'Все улучшения магазина будут сброшены, Тени вернутся.';
      const tg = this.telegram;
      if (tg?.showConfirm) {
        tg.showConfirm(confirmMsg, (ok) => {
          if (!ok) return;
          const refund = this.game.shopSystem.resetAllUpgrades();
          Notification.show(`Улучшения сброшены. Возвращено: ${refund} Теней`);
          this.hide();
        });
      } else {
        const refund = this.game.shopSystem.resetAllUpgrades();
        Notification.show(`Улучшения сброшены. Возвращено: ${refund} Теней`);
        this.hide();
      }
    });

    resetTowerBtn?.addEventListener('click', () => {
      const confirmMsg = 'Все улучшения башни будут сброшены, осколки вернутся.';
      const tg = this.telegram;
      if (tg?.showConfirm) {
        tg.showConfirm(confirmMsg, (ok) => {
          if (!ok) return;
          const refund = this.tower.resetShopUpgrades();
          Notification.show(`Улучшения башни сброшены. Возвращено: ${refund} осколков`);
          this.hide();
        });
      } else {
        const refund = this.tower.resetShopUpgrades();
        Notification.show(`Улучшения башни сброшены. Возвращено: ${refund} осколков`);
        this.hide();
      }
    });

    closeBtn?.addEventListener('click', () => this.hide());
  }
}
