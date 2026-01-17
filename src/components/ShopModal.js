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
    this.container = document.createElement('div');
    this.container.className = 'shop-overlay';
    this.container.innerHTML = `
      <div class="shop-modal">
        <h2 class="shop-title"><i class="fas fa-store"></i> Магазин</h2>
        <div class="shop-grid">
          ${this.renderUpgrades()}
        </div>
        <button id="close-shop"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `;

    document.body.appendChild(this.container);

    // Добавляем обработчики для покупок
    this.updateBuyButtons();

    document.getElementById('close-shop').addEventListener('click', () => {
      document.body.removeChild(this.container);
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

  updateBuyButtons() {
    const buttons = this.container.querySelectorAll('.buy-btn');
    buttons.forEach(button => {
      const upgradeId = button.dataset.id;
      
      // Удаляем старый обработчик
      button.replaceWith(button.cloneNode(true));
      const newButton = this.container.querySelector(`[data-id="${upgradeId}"]`);
      
      newButton.addEventListener('click', (e) => {
        const clickedButton = e.target;
        const id = clickedButton.dataset.id;
        
        this.shop.buyUpgrade(id);
        
        // Обновляем только нужный элемент
        this.updateSingleItem(clickedButton);
      });
    });
  }

  updateSingleItem(button) {
    const upgradeId = button.dataset.id;
    const upgrade = this.shop.upgrades.find(u => u.id === upgradeId);
    const currentPrice = this.shop.getCurrentPrice(upgrade);
    
    // Обновляем кнопку
    if (upgrade.level >= upgrade.maxLevel) {
      button.textContent = 'Макс.';
      button.disabled = true;
    } else {
      button.textContent = 'Купить';
      button.disabled = !(this.game.getCurrency() >= currentPrice);
    }
    
    // Находим родительский элемент
    const itemElement = button.closest('.shop-item');
    
    // Обновляем уровень
    const levelIndicator = itemElement.querySelector('h3');
    const priceElement = itemElement.querySelector('.shop-item-price');
    const progressBar = itemElement.querySelector('.progress-fill');
    const progressText = itemElement.querySelector('.progress-text');
    const totalSpent = itemElement.querySelector('.total-spent');
    
    // Обновляем название с уровнем
    const originalName = upgrade.name;
    levelIndicator.innerHTML = `${originalName} <span class="level-indicator">Уровень ${upgrade.level}/${upgrade.maxLevel}</span>`;
    
    // Обновляем цену
    priceElement.textContent = `Цена: ${currentPrice} Теней`;
    
    // Обновляем прогресс-бар
    const progressPercent = (upgrade.level / upgrade.maxLevel) * 100;
    progressBar.style.width = `${progressPercent}%`;
    progressText.textContent = `${upgrade.level}/${upgrade.maxLevel}`;
    
    // Обновляем потраченные деньги
    if (upgrade.totalSpent > 0) {
      if (totalSpent) {
        totalSpent.textContent = `Потрачено: ${upgrade.totalSpent} Теней`;
      } else {
        const spentDiv = document.createElement('div');
        spentDiv.className = 'total-spent';
        spentDiv.textContent = `Потрачено: ${upgrade.totalSpent} Теней`;
        itemElement.querySelector('.progress-text').after(spentDiv);
      }
    }
    
    // Обновляем классы
    itemElement.classList.toggle('affordable', this.game.getCurrency() >= currentPrice);
    itemElement.classList.toggle('maxed', upgrade.level >= upgrade.maxLevel);
  }
}