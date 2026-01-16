import { getRandomCard } from '../utils/random.js';
import items from '../data/items.json';
import { Notification } from '../components/Notification.js';

export class ChestSystem {
  constructor(gameCore) {
    this.game = gameCore;
    this.cost = 1000;
  }

  openChest() {
    if (this.game.getCurrency() < this.cost) {
        Notification.show('Недостаточно Теней!');
      return null;
    }

    this.game.addCurrency(-this.cost);

    const card = getRandomCard();
    const itemPool = items.filter(item => item.id !== undefined);
    const randomItem = itemPool[Math.floor(Math.random() * itemPool.length)];

    const multiplier = this.getBonusMultiplier(card);
    const enhancedValue = randomItem.baseBonus * multiplier;

    const enhancedItem = {
      ...randomItem,
      card: card,
      bonusMultiplier: multiplier,
      enhancedValue: enhancedValue,
      enhancedEffect: `${randomItem.effect} (+${Math.round(multiplier * 100)}%)`
    };

    // ❌ НЕ добавляем предмет сразу - добавим после закрытия модалки

    return {
      card,
      item: enhancedItem
    };
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
}