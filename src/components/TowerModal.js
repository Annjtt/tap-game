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

    if (!this.container.firstElementChild) {
      this.container.innerHTML = this.getTemplate();
      this.bindActions();
    }

    this.updateState(state);
  }

  getTemplate() {
    return `
      <div class="tower-modal tower-modal--arena-clone">
        <div class="tower-backdrop"></div>
        <div class="tower-app">
          <header class="tower-header-clone">
            <span class="tower-boss-kicker"></span>
            <div class="tower-boss-panel">
              <div class="tower-boss-panel-top">
                <span class="tower-boss-panel-name"></span>
              </div>
              <div class="tower-boss-panel-bar">
                <div class="tower-boss-panel-bar-fill"></div>
              </div>
              <div class="tower-boss-panel-hp"></div>
              <div class="tower-boss-panel-meta"></div>
            </div>
            <button type="button" class="tower-close-btn" id="close-tower-modal" title="Закрыть"><i class="fas fa-times"></i></button>
          </header>
          <main class="tower-game-area">
            <button type="button" class="tower-clicker" id="tower-attack-btn">
              <span class="tower-clicker-oreole"></span>
              <span class="tower-clicker-core"></span>
              <span class="tower-clicker-glyph"></span>
            </button>
          </main>
          <section class="tower-hero-panel">
            <div class="tower-hero-main">
              <div class="tower-hero-avatar-wrap"></div>
              <div class="tower-hero-meta">
                <div class="tower-hero-name"></div>
                <div class="tower-hero-subtitle">
                  <span class="tower-shop-currency" style="display:inline-flex;align-items:center;gap:5px;font-size:0.95em;padding:2px 2px 2px 2px;line-height:1.1;height:25px;min-width:0;background:transparent;">
                    <i class="fas fa-gem" style="font-size:1em;"></i>
                    <span class="tower-shadow-shards"></span>
                  </span>
                  <span class="tower-checkpoint-floor"></span>
                </div>
              </div>
            </div>
            <div class="tower-hero-hp-block">
              <div class="tower-hero-hp-row">
                <span>HP</span>
                <span class="tower-hero-hp-text"></span>
              </div>
              <div class="tower-hero-hp-bar">
                <div class="tower-hero-hp-fill"></div>
              </div>
            </div>
          </section>
          <footer class="tower-arena-footer">
            <div class="tower-arena-progress">
              <div class="tower-arena-progress-row">
                <span>Прогресс башни</span>
                <span class="tower-floor-progress-text"></span>
              </div>
              <div class="tower-arena-progress-bar">
                <div class="tower-arena-progress-fill"></div>
              </div>
            </div>
            <div class="tower-arena-actions">
              <button type="button" class="tower-secondary-btn" id="tower-refresh-btn">Лечение</button>
              <button type="button" class="tower-secondary-btn" id="tower-chest-btn">Тайник</button>
            </div>
          </footer>
        </div>
      </div>
    `;
  }

  updateState(state) {
    const enemy = state.currentEnemy;
    const enemyHpPercent = state.enemyMaxHp ? Math.max(0, Math.round((state.enemyHp / state.enemyMaxHp) * 100)) : 0;
    const playerHpPercent = state.playerMaxHp ? Math.max(0, Math.round((state.playerHp / state.playerMaxHp) * 100)) : 0;
    const floorTypeLabel = enemy?.type === 'boss' ? 'БОСС БАШНИ' : 'СТРАЖ ЭТАЖА';
    // Теперь глифы будут заданы через css, оставляем поле пустым —
    const bossGlyph = '';
    const avatarWrap = this.container.querySelector('.tower-hero-avatar-wrap');
    const heroAvatar = state.playerAvatar
      ? `<img src="${state.playerAvatar}" alt="${state.playerName}" class="tower-hero-avatar" />`
      : '<div class="tower-hero-avatar tower-hero-avatar--placeholder"><i class="fas fa-user"></i></div>';

    avatarWrap.innerHTML = heroAvatar;
    this.container.querySelector('.tower-boss-kicker').textContent = floorTypeLabel;
    this.container.querySelector('.tower-boss-panel-name').textContent = enemy?.name || 'Неизвестная Тень';
    this.container.querySelector('.tower-boss-panel-bar-fill').style.width = `${enemyHpPercent}%`;
    this.container.querySelector('.tower-boss-panel-hp').textContent = `${Math.round(state.enemyHp)} / ${Math.round(state.enemyMaxHp)}`;
    this.container.querySelector('.tower-boss-panel-meta').textContent = `Этаж ${state.currentFloor} · ${enemy?.reward || 0} Теней · ${enemy?.shards || 0} осколков`;
    this.container.querySelector('.tower-clicker-glyph').textContent = bossGlyph;
    this.container.querySelector('.tower-hero-name').textContent = state.playerName;
    this.container.querySelector('.tower-shadow-shards').textContent = state.shadowShards;
    this.container.querySelector('.tower-checkpoint-floor').textContent = `· Свеча: ${state.checkpointFloor} этаж`;
    this.container.querySelector('.tower-hero-hp-text').textContent = `${Math.round(state.playerHp)} / ${Math.round(state.playerMaxHp)}`;
    this.container.querySelector('.tower-hero-hp-fill').style.width = `${playerHpPercent}%`;
    this.container.querySelector('.tower-floor-progress-text').textContent = `${state.floorProgressPercent}%`;
    this.container.querySelector('.tower-arena-progress-fill').style.width = `${state.floorProgressPercent}%`;

    const attackBtn = this.container.querySelector('#tower-attack-btn');
    const isDisabled = state.playerHp <= 0 || state.enemyHp <= 0;
    attackBtn.classList.toggle('is-disabled', isDisabled);
    attackBtn.disabled = isDisabled;
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
    this.tower.openShop();

    import('./TowerShopModal.js').then(({ TowerShopModal }) => {
      if (!this.towerShopModal) {
        this.towerShopModal = new TowerShopModal(this.tower.towerShop, this.tower);
      }
      this.towerShopModal.show();
    });
  }
}
