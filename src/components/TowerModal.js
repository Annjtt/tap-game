import { Notification } from './Notification.js';
import { TowerShopModal } from './TowerShopModal.js';

export class TowerModal {
  constructor(towerSystem) {
    this.tower = towerSystem;
    this.isOpen = false;
    this.container = null;
    this.boundUpdate = (event) => this.render(event.detail);
    this.boundEnemyAttack = (event) => this.handleEnemyAttackVisual(event.detail);
  }

  show() {
    if (this.isOpen) {
      return;
    }

    this.isOpen = true;
    this.tower.open();

    this.container = document.createElement('div');
    this.container.className = 'tower-overlay';
    document.body.appendChild(this.container);

    document.addEventListener('towerStateChanged', this.boundUpdate);
    document.addEventListener('towerEnemyAttack', this.boundEnemyAttack);
    this.render(this.tower.getState());
  }

  hide() {
    if (!this.isOpen) {
      return;
    }

    document.removeEventListener('towerStateChanged', this.boundUpdate);
    document.removeEventListener('towerEnemyAttack', this.boundEnemyAttack);
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.isOpen = false;
    this.tower.close();
  }

  render(state) {
    if (!this.container) {
      return;
    }

    // Вёрстка подогнана под tower.css (1-374), убраны лишние оборачивающие блоки,
    // секции ужаты, чтобы весь контент максимально влезал в экран даже на мобильном.
    // Добавлены max-width/min-width, минимизирована вложенность, пересмотрены блоки hero/boss/footer.

    const enemy = state.currentEnemy;
    const enemyHpPercent = state.enemyMaxHp ? Math.max(0, Math.round((state.enemyHp / state.enemyMaxHp) * 100)) : 0;
    const playerHpPercent = state.playerMaxHp ? Math.max(0, Math.round((state.playerHp / state.playerMaxHp) * 100)) : 0;
    const floorTypeLabel = enemy?.type === 'boss' ? 'БОСС БАШНИ' : 'СТРАЖ ЭТАЖА';
    const heroAvatar = state.playerAvatar
      ? `<img src="${state.playerAvatar}" alt="${state.playerName}" class="tower-hero-avatar" />`
      : '<div class="tower-hero-avatar tower-hero-avatar--placeholder"><i class="fas fa-user"></i></div>';
    const bossGlyph = enemy?.type === 'boss' ? '☾' : '✦';

    this.container.innerHTML = `
      <div class="tower-modal tower-modal--arena-clone">
        <div class="tower-backdrop"></div>
        <div class="tower-app">
          <header class="tower-header-clone">
            <span class="tower-boss-kicker">${floorTypeLabel}</span>
            <div class="tower-boss-panel">
              <div class="tower-boss-panel-top">
                <span class="tower-boss-panel-name">${enemy?.name || 'Неизвестная Тень'}</span>
              </div>
              <div class="tower-boss-panel-bar">
                <div class="tower-boss-panel-bar-fill" style="width:${enemyHpPercent}%"></div>
              </div>
              <div class="tower-boss-panel-hp">${Math.round(state.enemyHp)} / ${Math.round(state.enemyMaxHp)}</div>
              <div class="tower-boss-panel-meta">Этаж ${state.currentFloor} · ${enemy?.reward || 0} Теней · ${enemy?.shards || 0} осколков</div>
            </div>
            <button type="button" class="tower-close-btn" id="close-tower-modal" title="Закрыть"><i class="fas fa-times"></i></button>
          </header>
          <main class="tower-game-area">
            <button 
              type="button" 
              class="tower-clicker${state.playerHp <= 0 || state.enemyHp <= 0 ? ' is-disabled' : ''}" 
              id="tower-attack-btn" 
              ${state.playerHp <= 0 || state.enemyHp <= 0 ? 'disabled' : ''}>
              <span class="tower-clicker-oreole"></span>
              <span class="tower-clicker-core"></span>
              <span class="tower-clicker-glyph">${bossGlyph}</span>
            </button>
          </main>
          <section class="tower-hero-panel">
            <div class="tower-hero-main">
              <div class="tower-hero-avatar-wrap">
                ${heroAvatar}
              </div>
              <div class="tower-hero-meta">
                <div class="tower-hero-name">${state.playerName}</div>
                <div class="tower-hero-subtitle">HP героя · чекпоинт ${state.checkpointFloor}</div>
              </div>
            </div>
            <div class="tower-hero-hp-block">
              <div class="tower-hero-hp-row">
                <span>HP</span>
                <span>${Math.round(state.playerHp)} / ${Math.round(state.playerMaxHp)}</span>
              </div>
              <div class="tower-hero-hp-bar">
                <div class="tower-hero-hp-fill" style="width:${playerHpPercent}%"></div>
              </div>
            </div>
          </section>
          <footer class="tower-arena-footer">
            <div class="tower-arena-progress">
              <div class="tower-arena-progress-row">
                <span>Прогресс цели</span>
                <span>${state.floorProgressPercent}%</span>
              </div>
              <div class="tower-arena-progress-bar">
                <div class="tower-arena-progress-fill" style="width:${state.floorProgressPercent}%"></div>
              </div>
            </div>
            <div class="tower-arena-actions">
              <button type="button" class="tower-secondary-btn" id="tower-refresh-btn">Собраться</button>
              <button type="button" class="tower-secondary-btn" id="tower-chest-btn">Тайник</button>
            </div>
          </footer>
        </div>
      </div>
    `;

    this.bindActions();
  }

  bindActions() {
    const closeBtn = this.container.querySelector('#close-tower-modal');
    const attackBtn = this.container.querySelector('#tower-attack-btn');
    const refreshBtn = this.container.querySelector('#tower-refresh-btn');
    const chestBtn = this.container.querySelector('#tower-chest-btn');

    closeBtn?.addEventListener('click', () => this.hide());
    attackBtn?.addEventListener('click', (event) => this.handleAttack(event));
    refreshBtn?.addEventListener('click', () => this.handleRefresh());
    chestBtn?.addEventListener('click', () => this.handleChest());
  }

  handleEnemyAttackVisual(detail) {
    if (!this.container) return;
    const clicker = this.container.querySelector('.tower-clicker');
    if (!clicker) return;

    clicker.classList.add('tower-clicker-enemy-hit');
    setTimeout(() => clicker.classList.remove('tower-clicker-enemy-hit'), 300);

    import('./VisualEffects.js').then(({ VisualEffects }) => {
      const rect = clicker.getBoundingClientRect();
      VisualEffects.showFloatingGain(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        `-${detail.damage}`,
        { isEnemyAttack: true }
      );
    });
  }

  handleAttack(event) {
    const attackTarget = event.currentTarget;
    attackTarget.classList.remove('tower-clicker-hit');
    void attackTarget.offsetWidth;
    attackTarget.classList.add('tower-clicker-hit');

    setTimeout(() => {
      attackTarget.classList.remove('tower-clicker-hit');
    }, 180);

    const summary = this.tower.handleAttackClick();
    if (!summary) {
      return;
    }

    import('./VisualEffects.js').then(({ VisualEffects }) => {
      VisualEffects.showFloatingGain(
        event.clientX,
        event.clientY,
        summary.damage,
        {
          sourceItemId: summary.sourceItemId,
          isEternalClockActive: summary.isEternalClockActive
        }
      );
    });
  }

  handleRefresh() {
    const state = this.tower.getState();
    if (state.playerHp >= state.playerMaxHp) {
      Notification.show('Силы уже на пределе.');
      return;
    }

    const oldHp = this.tower.playerHp;
    this.tower.playerMaxHp = this.tower.calculatePlayerMaxHp();
    this.tower.playerHp = Math.min(this.tower.playerMaxHp, this.tower.playerHp + Math.round(this.tower.playerMaxHp * 0.25));
    const healAmount = this.tower.playerHp - oldHp;
    this.tower.triggerUpdate();

    import('./VisualEffects.js').then(({ VisualEffects }) => {
      const clicker = this.container?.querySelector('.tower-clicker');
      if (clicker) {
        const rect = clicker.getBoundingClientRect();
        VisualEffects.showFloatingGain(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          healAmount,
          { isHeal: true }
        );
      }
    });

    Notification.show('Вы переводите дух. Часть сил восстановлена.');
  }

  handleChest() {
    import('./TowerShopModal.js').then(({ TowerShopModal }) => {
      if (!this.towerShopModal) {
        this.towerShopModal = new TowerShopModal(this.tower.towerShop, this.tower);
      }
      this.towerShopModal.show();
    });
  }
}
