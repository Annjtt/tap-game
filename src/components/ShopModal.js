import { ShopSystem } from '../logic/shopSystem.js';

export class ShopModal {
  constructor(gameCore) {
    this.game = gameCore;
    this.shop = new ShopSystem(gameCore);
    this.isOpen = false;
  }

  show() {
    if (this.isOpen) return;

    this.isOpen = true;
    const container = document.createElement('div');
    container.className = 'shop-overlay';
    container.innerHTML = `
      <div class="shop-modal">
        <h2 class="shop-title"><i class="fas fa-store"></i> Магазин</h2>
        <div class="shop-grid">
          ${this.renderUpgrades()}
        </div>
        <button id="close-shop"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `;

    document.body.appendChild(container);

    // Добавляем обработчики для покупок
    this.updateBuyButtons(container);

    document.getElementById('close-shop').addEventListener('click', () => {
      document.body.removeChild(container);
      this.isOpen = false;
    });
  }

  renderUpgrades() {
    const upgrades = this.shop.getUpgrades();
    
    return upgrades.map(upgrade => {
      const progressPercent = (upgrade.level / upgrade.maxLevel) * 100;
      const currentPrice = this.shop.getCurrentPrice(upgrade);
      
      return `
        <div class="shop-item ${upgrade.canAfford ? 'affordable' : ''} ${upgrade.level >= upgrade.maxLevel ? 'maxed' : ''}">
          <div class="shop-item-icon">
            <i class="fas ${upgrade.icon}"></i>
          </div>
          <div class="shop-item-info">
            <h3>${upgrade.name}</h3>
            <p>${upgrade.description}</p>
            <div class="shop-item-price">Цена: ${currentPrice} Теней</div>
            
            <!-- Прогресс-бар -->
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <div class="progress-text">${upgrade.level}/${upgrade.maxLevel}</div>
            
            <!-- Общая потраченная валюта -->
            ${upgrade.totalSpent > 0 ? `<div class="total-spent">Потрачено: ${upgrade.totalSpent} Теней</div>` : ''}
          </div>
          <button class="buy-btn" data-id="${upgrade.id}" ${!upgrade.canAfford || upgrade.level >= upgrade.maxLevel ? 'disabled' : ''}>
            ${upgrade.level >= upgrade.maxLevel ? 'Макс.' : 'Купить'}
          </button>
        </div>
      `;
    }).join('');
  }

  updateBuyButtons(container) {
    const buttons = container.querySelectorAll('.buy-btn');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const upgradeId = e.target.dataset.id;
        this.shop.buyUpgrade(upgradeId);
        
        // Обновляем интерфейс
        setTimeout(() => {
          const newContainer = document.createElement('div');
          newContainer.className = 'shop-overlay';
          newContainer.innerHTML = `
            <div class="shop-modal">
              <h2 class="shop-title"><i class="fas fa-store"></i> Магазин</h2>
              <div class="shop-grid">
                ${this.renderUpgrades()}
              </div>
              <button id="close-shop"><i class="fas fa-times"></i> Закрыть</button>
            </div>
          `;
          
          const parent = container.parentElement;
          parent.replaceChild(newContainer, container);
          this.updateBuyButtons(newContainer);
          
          document.getElementById('close-shop').addEventListener('click', () => {
            document.body.removeChild(newContainer);
            this.isOpen = false;
          });
          
          container = newContainer;
        }, 100);
      });
    });
  }
}