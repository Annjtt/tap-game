import { CONFIG } from '../config.js';
import { Notification } from '../components/Notification.js';

export class GameCore {
  constructor() {
    this.currency = 0;
    this.baseClickValue = CONFIG.baseClickValue; // ✅ Отдельно базовая сила
    this.items = [];
    this.baseAutoIncome = 0; // ✅ Отдельно базовый авто-доход
    
    // ✅ Бонусы из магазина
    this.shopClickBonus = 0;
    this.shopAutoBonus = 0;
    this.shopMultiplier = 1; // ✅ Мультипликатор (умножает общую силу)
    
    this.lastSave = Date.now();
    this.bonusMultipliers = {
      A: 1.0,
      B: 0.8,
      C: 0.4,
      D: 0.3,
      E: 0.2,
      F: 0.15,
      G: 0.1,
      H: 0.05
    };
  }

  addCurrency(amount) {
    this.currency += amount;
    this.triggerEvent('currencyChanged');
  }

  getCurrency() {
    return this.currency;
  }

  getClickValue() {
    // база + (улучшения × мультипликатор) + предметы
    const base = this.baseClickValue;
    const shopWithMultiplier = this.shopClickBonus * this.shopMultiplier;
    
    let itemBonus = 0;
    const activeItems = this.getActiveItemsByName();

    for (const item of Object.values(activeItems)) {
      if (item.stat === 'click') {
        itemBonus += item.enhancedValue || item.baseBonus;
      }
    }

    return base + shopWithMultiplier + itemBonus;
  }

  getAutoIncome() {
    // база + (улучшения × мультипликатор) + предметы
    const base = this.baseAutoIncome;
    const shopWithMultiplier = this.shopAutoBonus * this.shopMultiplier;
    
    let itemBonus = 0;
    const activeItems = this.getActiveItemsByName();

    for (const item of Object.values(activeItems)) {
      if (item.stat === 'auto') {
        itemBonus += item.enhancedValue || item.baseBonus;
      }
    }

    return base + shopWithMultiplier + itemBonus;
  }

  // ✅ Методы для магазина
  addShopClickBonus(value) {
    this.shopClickBonus += value;
  }

  addShopAutoBonus(value) {
    this.shopAutoBonus += value;
  }

  addShopMultiplier(value) {
    this.shopMultiplier *= value;
  }

  // ✅ Метод для сброса бонусов магазина
  resetShopBonuses() {
    this.shopClickBonus = 0;
    this.shopAutoBonus = 0;
    this.shopMultiplier = 1;
  }

  // ✅ Получаем активные предметы по имени (самая редкая карта)
  getActiveItemsByName() {
    const activeItems = {};

    for (const item of this.items) {
      const name = item.name;

      if (!activeItems[name]) {
        activeItems[name] = item;
      } else {
        // Сравниваем редкость: A > B > C > ... > H
        const currentCard = activeItems[name].card;
        const newCard = item.card;

        if (this.getCardRank(newCard) < this.getCardRank(currentCard)) {
          activeItems[name] = item;
        }
      }
    }

    return activeItems;
  }

  // ✅ Возвращает ранг карты (чем меньше число — тем выше редкость)
  getCardRank(card) {
    const ranks = {
      A: 0,
      B: 1,
      C: 2,
      D: 3,
      E: 4,
      F: 5,
      G: 6,
      H: 7
    };

    return ranks[card] || 7;
  }

// Замени весь метод addItem на этот:
addItem(item) {
  console.log('gameCore.addItem вызван', item);
  
  // Проверяем, что у предмета есть карта
  if (!item.card) {
    console.warn('Предмет без карты:', item);
    return;
  }

  // Проверяем, есть ли уже предмет с ТАКИМ ЖЕ ИМЕНЕМ
  const existingItem = this.items.find(i => i.name === item.name);
  console.log('Найден существующий предмет:', existingItem);

  if (existingItem) {
    // Единая система редкости
    const cardRanks = { 
      A: 0, B: 1, C: 2, D: 3, 
      E: 4, F: 5, G: 6, H: 7 
    };
    
    const newRank = cardRanks[item.card];
    const existingRank = cardRanks[existingItem.card];
    
    console.log('Сравниваем редкость:', {
      newItem: item.name,
      newCard: item.card,
      newRank: newRank,
      existingItem: existingItem.name,
      existingCard: existingItem.card,
      existingRank: existingRank
    });

    if (newRank < existingRank) {
      // Новый предмет БОЛЕЕ редкий - заменяем и даём компенсацию за старый
      console.log('НОВЫЙ предмет редче СТАРОГО - ЗАМЕНЯЕМ');
      const compensation = this.getCompensationForItem(existingItem);
      this.addCurrency(compensation);
      const index = this.items.indexOf(existingItem);
      this.items[index] = item;
      Notification.show(`Предмет "${item.name}" заменен (${existingItem.card} → ${item.card}). Компенсация: ${compensation} Теней`);
    } else {
      // Новый предмет МЕНЕЕ редкий или ОДИНАКОВЫЙ - компенсация за НОВЫЙ
      console.log('НОВЫЙ предмет менее редкий или одинаковый - компенсация за НОВЫЙ');
      const compensation = this.getCompensationForItem(item);
      this.addCurrency(compensation);
      Notification.show(`У вас уже есть "${existingItem.name}" (${existingItem.card}). Новый предмет (${item.card}) менее редкий. Компенсация: ${compensation} Теней`);
    }
  } else {
    console.log('Добавляем НОВЫЙ предмет');
    // Новый предмет - добавляем
    this.items.push(item);
  }

  this.triggerEvent('inventoryUpdated');
}

  // ✅ Новая функция для компенсации
  getCompensationForItem(item) {
    const multipliers = {
      A: 5000,
      B: 3000,
      C: 1500,
      D: 800,
      E: 500,
      F: 300,
      G: 150,
      H: 50
    };

    return Math.floor(multipliers[item.card] || 50);
  }

  removeItem(item) {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items.splice(index, 1);
      this.triggerEvent('inventoryUpdated');
    }
  }

  saveProgress() {
    const data = {
      currency: this.currency,
      baseClickValue: this.baseClickValue,
      shopClickBonus: this.shopClickBonus,
      shopAutoBonus: this.shopAutoBonus,
      shopMultiplier: this.shopMultiplier,
      baseAutoIncome: this.baseAutoIncome,
      items: this.items,
      timestamp: Date.now(),
    };
    localStorage.setItem('tapGameProgress', JSON.stringify(data));
  }

  loadProgress() {
    const saved = localStorage.getItem('tapGameProgress');
    if (saved) {
      const data = JSON.parse(saved);
      this.currency = data.currency || 0;
      this.baseClickValue = data.baseClickValue || CONFIG.baseClickValue;
      this.shopClickBonus = data.shopClickBonus || 0;
      this.shopAutoBonus = data.shopAutoBonus || 0;
      this.shopMultiplier = data.shopMultiplier || 1;
      this.baseAutoIncome = data.baseAutoIncome || 0;
      this.items = data.items || [];
      this.triggerEvent('progressLoaded');
    }
  }

  triggerEvent(eventName) {
    document.dispatchEvent(new CustomEvent(eventName, { detail: this }));
  }

  startAutoIncome() {
    setInterval(() => {
      if (this.getAutoIncome() > 0) {
        this.addCurrency(this.getAutoIncome());
      }
    }, 1000);
  }

  update() {}
}