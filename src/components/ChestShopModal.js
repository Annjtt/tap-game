import { img } from '../utils/imageHelper.js';
import chestTypes from '../data/chestTypes.json';

export class ChestShopModal {
  constructor(gameCore) {
    this.game = gameCore;
    this.chestTypes = chestTypes;
    this.isOpen = false;
  }

  show() {
    if (this.isOpen) return;

    this.isOpen = true;
    const container = document.createElement('div');
    container.className = 'chest-shop-overlay';
    container.innerHTML = `
      <div class="chest-shop-modal">
        <h2 class="chest-shop-title"></i> Chest shop</h2>
        <div class="chest-shop-grid">
          ${this.renderChests()}
        </div>
        <button id="close-chest-shop"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `;

    document.body.appendChild(container);

    // Добавляем обработчики для покупки сундуков
    this.updateChestButtons(container);

    document.getElementById('close-chest-shop').addEventListener('click', () => {
      document.body.removeChild(container);
      this.isOpen = false;
    });
  }

  renderChests() {
    return this.chestTypes.map(chest => {
      const canAfford = this.game.getCurrency() >= chest.price;
      
      return `
        <div class="chest-item ${canAfford ? 'affordable' : ''}">
          <div class="chest-image-container">
            <img src="${img(chest.image)}" alt="${chest.name}" class="chest-image" />
          </div>
          <div class="chest-info">
            <h3>${chest.name}</h3>
            <p>${chest.description}</p>
            <div class="chest-price">Цена: ${chest.price} Теней</div>
          </div>
          <button class="buy-chest-btn" data-id="${chest.id}" ${!canAfford ? 'disabled' : ''}>
            Купить
          </button>
        </div>
      `;
    }).join('');
  }

  updateChestButtons(container) {
    const buttons = container.querySelectorAll('.buy-chest-btn');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const chestId = e.target.dataset.id;
        this.buyChest(chestId);
      });
    });
  }

  buyChest(chestId) {
    const chest = this.chestTypes.find(c => c.id === chestId);
    
    if (!chest) {
      alert('Сундук не найден');
      return;
    }

    if (this.game.getCurrency() < chest.price) {
      alert('Недостаточно Теней');
      return;
    }

    this.game.addCurrency(-chest.price);
    
    // Открываем сундук с ограничениями по редкости
    this.openChestWithRestrictions(chest);
    
    // Закрываем магазин
    this.close();
  }

  openChestWithRestrictions(chest) {
    // Генерируем случайную карту в диапазоне
    const availableCards = this.getAvailableCards(chest.minCard, chest.maxCard);
    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    
    // Выбираем случайный предмет
    const items = [
      { id: "lightning_dagger", name: "Кинжал молнии", type: "active", baseBonus: 0.05, price: 5000, effect: "Шанс 5% умножить награду за нажатие на 2", stat: "click", image: "images/items/lightning_dagger.jpg" },
      { id: "chaos_seal", name: "Печать Хаоса", type: "active", baseBonus: 0.03, price: 8000, effect: "Каждые 10 нажатий — x5 награды", stat: "click", image: "images/items/chaos_seal.jpg" },
      { id: "gloves_of_rage", name: "Перчатки Гнева", type: "passive", baseBonus: 1, price: 3000, effect: "+1 Тень за нажатие", stat: "click", image: "images/items/gloves_of_rage.jpg" },
      { id: "eternal_clock", name: "Часы Этерна", type: "active", baseBonus: 0.1, price: 12000, effect: "На 10 секунд все нажатия дают x3", stat: "click", image: "images/items/eternal_clock.jpg" },
      { id: "shadow_hood", name: "Капюшон Тени", type: "passive", baseBonus: 0.05, price: 2000, effect: "+5% к авто-добыванию", stat: "auto", image: "images/items/shadow_hood.jpg" }
    ];
    
    const randomItem = items[Math.floor(Math.random() * items.length)];
    
    // Применяем усиление от карты
    const multiplier = this.getBonusMultiplier(randomCard);
    const enhancedValue = randomItem.baseBonus * multiplier;

    const enhancedItem = {
      ...randomItem,
      card: randomCard,
      bonusMultiplier: multiplier,
      enhancedValue: enhancedValue,
      enhancedEffect: `${randomItem.effect} (+${Math.round(multiplier * 100)}%)`
    };

    // Показываем результат
    this.showChestResult(randomCard, enhancedItem);
  }

  getAvailableCards(minCard, maxCard) {
    const cardRanks = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7 };
    const minRank = cardRanks[minCard];
    const maxRank = cardRanks[maxCard];
    
    return Object.keys(cardRanks)
      .filter(card => cardRanks[card] >= minRank && cardRanks[card] <= maxRank);
  }

  getBonusMultiplier(card) {
    const multipliers = {
      A: 1.0,
      B: 0.8,
      C: 0.4,
      D: 0.3,
      E: 0.2,
      F: 0.15,
      G: 0.1,
      H: 0.05
    };

    return multipliers[card] || 0.05;
  }

  showChestResult(card, item) {
    import('./CardsDisplay.js').then(({ CardsDisplay }) => {
      CardsDisplay.showCard(card, item, this.game);
    });
  }

  close() {
    const overlay = document.querySelector('.chest-shop-overlay');
    if (overlay) {
      document.body.removeChild(overlay);
      this.isOpen = false;
    }
  }
}