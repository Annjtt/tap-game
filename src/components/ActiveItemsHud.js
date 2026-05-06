import { Notification } from './Notification.js';
import { VisualEffects } from './VisualEffects.js';

export class ActiveItemsHud {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.timerId = null;
    this.COOLDOWN_MS = 120000; // 120 секунд
    this.EFFECT_MS = 10000; // 10 секунд активный эффект (как раньше)
    this.lastUsedKey = 'eternal_clock:lastUsed';
  }

  init() {
    this.createContainer();
    this.bindEvents();
    this.render();
    this.startTimer();
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'active-items-hud';
    document.body.appendChild(this.container);
  }

  bindEvents() {
    document.addEventListener('inventoryUpdated', () => this.render());
    document.addEventListener('progressLoaded', () => this.render());
    document.addEventListener('eternalClockStateChanged', () => this.render());
  }

  startTimer() {
    this.timerId = setInterval(() => {
      if (this.game.hasItem('eternal_clock')) {
        this.updateClockStatus();
      }
    }, 100);
  }

  render() {
    const hasClock = this.game.hasItem('eternal_clock');
    this.container.style.display = hasClock ? 'flex' : 'none';

    if (!hasClock) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <button type="button" class="active-item-btn ${this.game.isEternalClockActive() ? 'active' : ''}" data-item-id="eternal_clock">
        <img src="images/items/icon_item/eternal_clock.svg" alt="Часы Этерна" class="active-item-icon" />
        <div class="active-item-meta">
          <span class="active-item-name">Часы</span>
          <span class="active-item-name">Этерна</span>
          <span class="active-item-status" id="eternal-clock-status"></span>
        </div>
      </button>
    `;

    const button = this.container.querySelector('[data-item-id="eternal_clock"]');
    if (button) {
      button.addEventListener('click', () => this.handleClockClick());
    }

    this.updateClockStatus();
  }

  // Получить ms до конца перезарядки (0 если готов)
  getCooldownRemainingMs() {
    const lastUsed = Number(localStorage.getItem(this.lastUsedKey)) || 0;
    const now = Date.now();
    const elapsedSinceLastUse = now - lastUsed;
    if (elapsedSinceLastUse >= this.COOLDOWN_MS) {
      return 0;
    }
    return this.COOLDOWN_MS - elapsedSinceLastUse;
  }

  // Получить ms до конца активного эффекта
  getEffectRemainingMs() {
    return this.game.getEternalClockRemainingMs();
  }

  updateClockStatus() {
    const status = this.container.querySelector('#eternal-clock-status');
    const button = this.container.querySelector('[data-item-id="eternal_clock"]');
    if (!status || !button) {
      return;
    }

    const effectRemainingMs = this.getEffectRemainingMs();
    const cooldownRemainingMs = this.getCooldownRemainingMs();

    if (effectRemainingMs > 0) {
      // Эффект сейчас активен
      const seconds = (effectRemainingMs / 1000).toFixed(1);
      status.textContent = `${seconds}с`;
      button.classList.add('active');
      button.disabled = true;
      return;
    } else if (cooldownRemainingMs > 0) {
      // Перезарядка (но эффект не активен)
      const cooldownSec = (cooldownRemainingMs / 1000).toFixed(1);
      status.textContent = `cooldown: ${cooldownSec}с`;
      button.classList.remove('active');
      button.disabled = true;
      return;
    }

    // Готов к использованию
    status.textContent = '';
    button.classList.remove('active');
    button.disabled = false;
  }

  handleClockClick() {
    // Не даём использовать в перезарядке
    if (this.getCooldownRemainingMs() > 0) {
      Notification.show('Перезарядка предмета!');
      return;
    }

    const activated = this.game.activateEternalClock(this.EFFECT_MS);
    if (!activated) {
      return;
    }

    // Сохраняем момент использования (для cooldown)
    localStorage.setItem(this.lastUsedKey, Date.now().toString());

    VisualEffects.showEternalClockEffect();
    Notification.show('Часы Этерна активированы! x3 на 10 секунд');
    this.updateClockStatus();
  }
}
