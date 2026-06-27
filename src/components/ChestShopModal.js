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

  static formatPrice(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(num);
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
            <div class="chest-price">Цена: ${ChestShopModal.formatPrice(chest.price)} Теней</div>
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

  openChestWithRestrictions(chest) {
    // Генерируем случайную карту в диапазоне
    const availableCards = this.getAvailableCards(chest.minCard, chest.maxCard);
    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    
    // Выбираем случайный предмет
    const items = [
      { id: "lightning_dagger", name: "Кинжал молнии", type: "active", baseBonus: 0.05, price: 5000, effect: "Прок: 5% шанс ×2 награду | Стат: +0.05 к силе нажатия (старт, скейлится с рангом)", stat: "click", image: "images/items/lightning_dagger.jpg" },
      { id: "chaos_seal", name: "Печать Хаоса", type: "active", baseBonus: 0.03, price: 8000, effect: "Прок: каждые 10 нажатий ×5 | Стат: +0.03 к силе нажатия (старт, скейлится с рангом)", stat: "click", image: "images/items/chaos_seal.jpg" },
      { id: "gloves_of_rage", name: "Перчатки Гнева", type: "passive", baseBonus: 5, price: 3000, effect: "Стат: +5 к силе нажатия × множитель магазина (старт, скейлится с рангом)", stat: "click", image: "images/items/gloves_of_rage.jpg" },
      { id: "eternal_clock", name: "Часы Этерна", type: "active", baseBonus: 0.1, price: 12000, effect: "Актив: ×3 на 10 сек (кулдаун 120с) | Стат: +0.1 к силе нажатия (старт, скейлится с рангом)", stat: "click", image: "images/items/eternal_clock.jpg" },
      { id: "shadow_hood", name: "Капюшон Тени", type: "passive", baseBonus: 0.05, price: 2000, effect: "Стат: +0.05 к авто-доходу (старт, скейлится с рангом)", stat: "auto", image: "images/items/shadow_hood.jpg" },
      { id: "scythe_of_gods", name: "Коса богов", type: "passive", baseBonus: 15, price: 10000, effect: "Стат: +15 к силе нажатия. Крит: +15% шанс, урон ×5.0 (старт, скейлится с рангом)", stat: "click", image: "images/items/scythe_of_gods.jpg" }
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
    // Единая система редкости (как в gameCore.js)
    const cardRanks = { 
      A: 0, // Наиболее редкая
      B: 1, 
      C: 2, 
      D: 3, 
      E: 4, 
      F: 5, 
      G: 6, 
      H: 7  // Наименее редкая
    };
    
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
    const chest = this._lastChest;
    import('./ChestOpeningAnimation.js').then(({ ChestOpeningAnimation }) => {
      ChestOpeningAnimation.play(chest, item, card, this.game).then(() => {
        import('./CardsDisplay.js').then(({ CardsDisplay }) => {
          CardsDisplay.showCard(card, item, this.game, () => this.buyChest(chest.id));
        });
      });
    });
  }

  buyChest(chestId) {
    const chest = this.chestTypes.find(c => c.id === chestId);
    if (!chest) { alert('Сундук не найден'); return; }
    if (this.game.getCurrency() < chest.price) { alert('Недостаточно Теней'); return; }
    this._lastChest = chest;
    this.game.addCurrency(-chest.price);
    if (this.game.questSystem) this.game.questSystem.onChestOpened();
    this.openChestWithRestrictions(chest);
    this.close();
  }

  close() {
    const overlay = document.querySelector('.chest-shop-overlay');
    if (overlay) {
      document.body.removeChild(overlay);
      this.isOpen = false;
    }
  }
}