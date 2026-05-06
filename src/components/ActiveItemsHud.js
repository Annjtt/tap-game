import { Notification } from './Notification.js';
import { VisualEffects } from './VisualEffects.js';

export class ActiveItemsHud {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.timerId = null;
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
        <img src="images/items/eternal_clock.jpg" alt="Часы Этерна" class="active-item-icon" />
        <div class="active-item-meta">
          <span class="active-item-name">Часы Этерна</span>
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

  updateClockStatus() {
    const status = this.container.querySelector('#eternal-clock-status');
    const button = this.container.querySelector('[data-item-id="eternal_clock"]');
    if (!status || !button) {
      return;
    }

    const remainingMs = this.game.getEternalClockRemainingMs();
    if (remainingMs > 0) {
      const seconds = (remainingMs / 1000).toFixed(1);
      status.textContent = `${seconds}с`;
      button.classList.add('active');
      button.disabled = true;
      return;
    }

    status.textContent = '';
    button.classList.remove('active');
    button.disabled = false;
  }

  handleClockClick() {
    const activated = this.game.activateEternalClock(10000);
    if (!activated) {
      return;
    }

    VisualEffects.showEternalClockEffect();
    Notification.show('Часы Этерна активированы! x3 на 10 секунд');
    this.updateClockStatus();
  }
}
