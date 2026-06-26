import { CONFIG } from '../config.js';
import { Notification } from '../components/Notification.js';

export class GameCore {
  constructor() {
    this.currency = 0;
    this.baseClickValue = CONFIG.baseClickValue; // ✅ Отдельно базовая сила
    this.items = [];
    this.baseAutoIncome = CONFIG.baseAutoIncome; // ✅ Отдельно базовый авто-доход

    // ✅ Бонусы из магазина
    this.shopClickBonus = 0;
    this.shopAutoBonus = 0;
    this.shopMultiplier = 1; // ✅ Мультипликатор (умножает общую силу)
    this.clickCounter = 0;
    this.lastChaosEffect = 0;
    
    this.lastSave = Date.now();
    this.eternalClockActiveUntil = 0;
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
    if (this.questSystem && amount > 0) this.questSystem.onEarn(amount);
    this.triggerEvent('currencyChanged');
  }

  getCurrency() {
    return this.currency;
  }

  getClickValue() {
    // база + (улучшения + предметы) × мультипликатор
    const base = this.baseClickValue;

    let itemBonus = 0;
    const activeItems = this.getActiveItemsByName();

    for (const item of Object.values(activeItems)) {
      if (item.stat === 'click') {
        itemBonus += item.enhancedValue || item.baseBonus;
      }
    }

    const shopWithMultiplier = (this.shopClickBonus + itemBonus) * this.shopMultiplier;

    return base + shopWithMultiplier;
  }

  getItemCritValues() {
    const activeItems = this.getActiveItemsByName();
    for (const item of Object.values(activeItems)) {
      if (item.id === 'scythe_of_gods') {
        const rankMult = item.bonusMultiplier || 1;
        const effectiveValue = 15 * rankMult;
        return {
          chance: effectiveValue,
          damage: 2 + effectiveValue * 0.2
        };
      }
    }
    return { chance: 0, damage: 1 };
  }

  handleClick() {
    this.clickCounter = (this.clickCounter || 0) + 1;
    if (this.questSystem) this.questSystem.onClick();
    const effectSummary = this.checkActiveEffects();
    let amount = this.getClickValue() * effectSummary.multiplier;
    let sourceItemId = effectSummary.sourceItemId;

    const critValues = this.getItemCritValues();
    if (critValues.chance > 0 && Math.random() < critValues.chance / 100) {
      amount *= critValues.damage;
      if (!sourceItemId) {
        sourceItemId = 'scythe_crit';
      }
      this.showCritEffect();
    }

    this.addCurrency(Math.round(amount));
    return {
      amount: Math.round(amount),
      sourceItemId,
      isEternalClockActive: effectSummary.isEternalClockActive
    };
  }

  getPlayerDisplayName(telegram) {
    const user = telegram?.initDataUnsafe?.user;
    if (!user) {
      return 'Странник Тени';
    }

    return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Странник Тени';
  }

  checkActiveEffects() {
    const activeItems = this.getActiveItemsByName();
    let multiplier = this.isEternalClockActive() ? 3 : 1;
    let sourceItemId = null;
    
    for (const item of Object.values(activeItems)) {
      if (item.id === 'lightning_dagger' && item.type === 'active') {
        // Шанс 5% умножить награду за нажатие на 2
        if (Math.random() < 0.05) {
          this.showLightningEffect();
          multiplier *= 2;
          sourceItemId = 'lightning_dagger';
        }
      }
      
      if (item.id === 'chaos_seal' && item.type === 'active') {
        // Каждые 10 нажатий — x5 награды
        if (this.clickCounter % 10 === 0 && this.clickCounter !== this.lastChaosEffect) {
          this.lastChaosEffect = this.clickCounter;
          this.showChaosEffect();
          multiplier *= 5;
          sourceItemId = 'chaos_seal';
        }
      }
    }
    
    return {
      multiplier,
      sourceItemId,
      isEternalClockActive: this.isEternalClockActive()
    };
  }

  _getActiveClicker() {
    const inTower = document.querySelector('.tower-overlay');
    return inTower
      ? document.querySelector('.tower-clicker')
      : document.getElementById('clicker');
  }

  showLightningEffect() {
    import('../components/VisualEffects.js').then(({ VisualEffects }) => {
      const clicker = this._getActiveClicker();
      if (clicker) {
        if (getComputedStyle(clicker).position === 'static') {
          clicker.style.position = 'relative';
        }
        VisualEffects.showLightningEffect(clicker);
      }
    });
  }

  showChaosEffect() {
    import('../components/VisualEffects.js').then(({ VisualEffects }) => {
      const clicker = this._getActiveClicker();
      if (clicker) {
        if (getComputedStyle(clicker).position === 'static') {
          clicker.style.position = 'relative';
        }
        VisualEffects.showChaosEffect(clicker);
      }
    });
  }

  showCritEffect() {
    import('../components/VisualEffects.js').then(({ VisualEffects }) => {
      const clicker = this._getActiveClicker();
      if (clicker) {
        if (getComputedStyle(clicker).position === 'static') {
          clicker.style.position = 'relative';
        }
        VisualEffects.showCritEffect(clicker);
      }
    });
  }
  
  hasItem(itemId) {
    return this.items.some((item) => item.id === itemId);
  }

  isEternalClockActive() {
    return this.getEternalClockRemainingMs() > 0;
  }

  getEternalClockRemainingMs() {
    return Math.max(0, this.eternalClockActiveUntil - Date.now());
  }

  activateEternalClock(durationMs = 10000) {
    if (!this.hasItem('eternal_clock')) {
      return false;
    }

    if (this.isEternalClockActive()) {
      return false;
    }

    this.eternalClockActiveUntil = Date.now() + durationMs;
    this.triggerEvent('eternalClockStateChanged');

    setTimeout(() => {
      this.triggerEvent('eternalClockStateChanged');
    }, durationMs + 50);

    return true;
  }
  

  getAutoIncome() {
    // база + улучшения × ослабленный множитель + предметы
    const base = this.baseAutoIncome;
    const autoMultiplier = 1 + (this.shopMultiplier - 1) * 0.25;
    const shopWithMultiplier = this.shopAutoBonus * autoMultiplier;

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

// Метод addItem
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
  if (this.questSystem) this.questSystem.onItemCollected();
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
      if (this.questSystem) this.questSystem.onDisenchant();
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
      eternalClockActiveUntil: this.eternalClockActiveUntil,
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
      this.eternalClockActiveUntil = data.eternalClockActiveUntil || 0;
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