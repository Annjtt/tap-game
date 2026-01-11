import { CONFIG } from '../config.js';
import { Notification } from '../components/Notification.js';

export class GameCore {
  constructor() {
    this.currency = 0;
    this.clickValue = CONFIG.baseClickValue;
    this.items = [];
    this.autoIncome = 0;
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
    let base = this.clickValue;
    let bonus = 0;
  
    const activeItems = this.getActiveItemsByName();
  
    for (const item of Object.values(activeItems)) {
      if (item.stat === 'click') { // ✅ Проверяем stat
        bonus += item.enhancedValue || item.baseBonus; // ✅ Берём усиленное или базовое значение
      }
    }
  
    return base + bonus;
  }

  getAutoIncome() {
    let base = this.autoIncome;
    let bonus = 0;

    const activeItems = this.getActiveItemsByName();

    for (const item of Object.values(activeItems)) {
      if (item.stat === 'auto') {
        bonus += item.enhancedValue || item.baseBonus;
      }
    }

    return base + bonus;
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

  addItem(item) {
    // ✅ Проверяем, что у предмета есть карта
    if (!item.card) {
      console.warn('Предмет без карты:', item);
      return;
    }

    // ✅ Проверяем, есть ли уже предмет с таким именем
    const existingItem = this.items.find(i => i.name === item.name);

    if (existingItem) {
      // Сравниваем редкость: если новый редче — заменяем
      const newRank = this.getCardRank(item.card);
      const existingRank = this.getCardRank(existingItem.card);
      
      if (newRank < existingRank) {
        // Новый предмет более редкий - заменяем
        const index = this.items.indexOf(existingItem);
        this.items[index] = item;
        Notification.show(`Предмет "${item.name}" заменен на более редкий (${existingItem.card} → ${item.card})`);
      } else if (newRank > existingRank) {
        // Новый предмет менее редкий - не добавляем
        Notification.show(`У вас уже есть "${existingItem.name}" (${existingItem.card}). Новый предмет менее редкий (${item.card}).`);
      } else {
        // Одинаковая редкость - заменяем (обновляем)
        const index = this.items.indexOf(existingItem);
        this.items[index] = item;
      }
    } else {
      // Новый предмет - добавляем
      this.items.push(item);
    }

    this.updateStatsFromItems();
    this.triggerEvent('inventoryUpdated');
  }

  removeItem(item) {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items.splice(index, 1);
      this.updateStatsFromItems();
      this.triggerEvent('inventoryUpdated');
    }
  }

  updateStatsFromItems() {
    // Пересчитываем статы
    this.clickValue = CONFIG.baseClickValue; // сброс
    this.autoIncome = 0;

    const activeItems = this.getActiveItemsByName();

    for (const item of Object.values(activeItems)) {
      if (item.stat === 'click') {
        this.clickValue += item.enhancedValue || item.baseBonus;
      }
      if (item.stat === 'auto') {
        this.autoIncome += item.enhancedValue || item.baseBonus;
      }
    }
  }

  saveProgress() {
    const data = {
      currency: this.currency,
      clickValue: this.clickValue,
      autoIncome: this.getAutoIncome(),
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
      this.items = data.items || [];
      this.updateStatsFromItems(); // пересчитываем статы из предметов
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