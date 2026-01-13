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
    const currency = this.game.getCurrency();
    
    return upgrades.map(upgrade => {
      const isAffordable = currency >= upgrade.price;
      const isPurchased = upgrade.purchased && upgrade.type !== 'multiplier';
      const isOwned = upgrade.level > 0 && upgrade.type === 'multiplier';
      
      return `
        <div class="shop-item ${isAffordable ? 'affordable' : ''} ${isPurchased || isOwned ? 'purchased' : ''}">
          <div class="shop-item-icon">
            <i class="fas ${upgrade.icon}"></i>
          </div>
          <div class="shop-item-info">
            <h3>${upgrade.name}</h3>
            <p>${upgrade.description}</p>
            <div class="shop-item-price">Цена: ${upgrade.price} Теней</div>
            ${upgrade.level > 0 ? `<div class="shop-item-level">Уровень: ${upgrade.level}</div>` : ''}
          </div>
          <button class="buy-btn" data-id="${upgrade.id}" ${!isAffordable || isPurchased || isOwned ? 'disabled' : ''}>
            ${isPurchased || isOwned ? 'Куплено' : 'Купить'}
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