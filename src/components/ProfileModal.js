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
          <span class="stat-label">Похождений башни:</span>
          <span class="stat-value">${this.tower.getTowerRunCount()}</span>
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
          <span class="stat-label">Восстановление HP/удар:</span>
          <span class="stat-value">+${this.tower.getRegenPerHit()}</span>
        </div>
      </div>
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

        ${towerSection}
        
        <button id="reset-shop" class="reset-btn">Сбросить улучшения</button>
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

    resetBtn?.addEventListener('click', () => {
      if (confirm('Вы уверены, что хотите сбросить все улучшения магазина? Вы получите все Тени за потраченные улучшения.')) {
        if (this.game.shopSystem) {
          const refund = this.game.shopSystem.resetAllUpgrades();
          alert(`Улучшения сброшены. Получено: ${refund} Теней`);
        } else {
          alert('Система магазина недоступна');
        }
      }
    });

    closeBtn?.addEventListener('click', () => this.hide());
  }
}
