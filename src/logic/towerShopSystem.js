import towerShopItems from '../data/towerShop.json';
import { Notification } from '../components/Notification.js';

const STORAGE_KEY = 'towerShopProgress';

export class TowerShopSystem {
  constructor() {
    this.items = towerShopItems.map(item => ({
      ...item,
      level: 0,
      totalSpent: 0,
      isUnlocked: !item.unlockLevel, // Если нет порога разблокировки — доступно сразу
    }));
    this.hasResetBefore = false;
    this.isOpen = false;
    this.loadState();
  }

  loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.applyPersistentData(parsed);
      } catch (e) {
        console.error('Ошибка загрузки прогресса Тайника:', e);
      }
    }
  }

  applyPersistentData(parsed) {
    const hasResetFlag = typeof parsed.hasResetBefore === "boolean" ? parsed.hasResetBefore : false;
    this.hasResetBefore = hasResetFlag;
    const savedItems = Array.isArray(parsed) ? parsed : parsed.items || [];
    this.items = this.items.map(item => {
      const savedItem = savedItems.find(s => s.id === item.id) || {};
      return {
        ...item,
        level: savedItem.level || 0,
        totalSpent: savedItem.totalSpent || 0,
        isUnlocked: typeof savedItem.isUnlocked === "boolean"
          ? savedItem.isUnlocked
          : (item.unlockLevel ? false : true),
      };
    });
  }

  saveState() {
    const state = this.getPersistentData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  getPersistentData() {
    return {
      hasResetBefore: this.hasResetBefore,
      items: this.items.map(item => ({
        id: item.id,
        level: item.level,
        totalSpent: item.totalSpent,
        isUnlocked: item.isUnlocked,
      }))
    };
  }

  loadPersistentData(data) {
    if (!data) {
      return;
    }

    this.applyPersistentData(data);
    this.saveState();
  }

  resetShop() {
    this.items = towerShopItems.map(item => ({
      ...item,
      level: 0,
      totalSpent: 0,
      isUnlocked: !item.unlockLevel,
    }));
    this.hasResetBefore = false;
    this.isOpen = false;
    this.saveState();
  }

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  getState() {
    return {
      isOpen: this.isOpen,
      hasResetBefore: this.hasResetBefore,
      items: this.items.map(item => ({
        id: item.id,
        level: item.level,
        totalSpent: item.totalSpent,
        isUnlocked: item.isUnlocked,
      }))
    };
  }

  getCurrentCost(item) {
    if (item.level === 0) {
      return item.baseCost;
    }
    return Math.floor(item.baseCost * Math.pow(item.costMultiplier, item.level));
  }

  canAfford(item, shards) {
    return shards >= this.getCurrentCost(item) && item.level < item.maxLevel && item.isUnlocked;
  }

  getEffectValue(item) {
    if (typeof item.effectFn === "function") {
      return item.effectFn(item.level);
    }
    return item.valuePerLevel * item.level;
  }

  unlockItemIfNeeded(item, playerFloor) {
    if (!item.isUnlocked && item.unlockLevel && playerFloor >= item.unlockLevel) {
      item.isUnlocked = true;
      Notification.show(`Доступно новое улучшение: "${item.name}"!`);
      this.saveState();
      return true;
    }
    return false;
  }

  autoUnlockByFloor(playerFloor) {
    let changed = false;
    for (const item of this.items) {
      if (this.unlockItemIfNeeded(item, playerFloor)) {
        changed = true;
      }
    }
    if (changed) this.saveState();
  }

  buyUpgrade(itemId, shards) {
    const item = this.items.find(i => i.id === itemId);
    if (!item) {
      Notification.show('Улучшение не найдено');
      return { success: false, newShards: shards };
    }

    if (!item.isUnlocked) {
      Notification.show('Улучшение ещё не разблокировано');
      return { success: false, newShards: shards };
    }

    if (item.level >= item.maxLevel) {
      Notification.show(`Максимальный уровень "${item.name}" достигнут`);
      return { success: false, newShards: shards };
    }

    const cost = this.getCurrentCost(item);
    if (shards < cost) {
      Notification.show('Недостаточно осколков');
      return { success: false, newShards: shards };
    }

    item.level += 1;
    item.totalSpent += cost;
    this.saveState();

    Notification.show(`${item.name} улучшен до уровня ${item.level}${item.level === item.maxLevel ? ' (МАКС)' : ''}`);
    return { success: true, newShards: shards - cost };
  }

  getAllItems(shards, playerFloor = 1) {
    this.autoUnlockByFloor(playerFloor);
    return this.items.map(item => ({
      ...item,
      currentCost: this.getCurrentCost(item),
      canAfford: this.canAfford(item, shards),
      effectValue: this.getEffectValue(item),
      progressPercent: (item.level / item.maxLevel) * 100,
      isUnlocked: !!item.isUnlocked,
      unlockedAt: item.unlockLevel || 1,
    }));
  }

  getTotalBonus(stat) {
    return this.items
      .filter(i => i.stat === stat && i.isUnlocked)
      .reduce((sum, item) => sum + this.getEffectValue(item), 0);
  }

  resetAll() {
    let totalRefund = 0;
    for (const item of this.items) {
      if (item.level > 0) {
        for (let level = 0; level < item.level; level++) {
          const costAtLevel = Math.floor(item.baseCost * Math.pow(item.costMultiplier, level));
          totalRefund += costAtLevel;
        }
      }
    }
    this.items = this.items.map(item => ({
      ...item,
      level: 0,
      totalSpent: 0,
      isUnlocked: item.unlockLevel ? false : true
    }));
    this.hasResetBefore = true;
    this.saveState();
    Notification.show(`Все улучшения сброшены. Вернули ${totalRefund} потраченных осколков!`);
    return totalRefund;
  }

  resetUpgrade(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (!item || item.level <= 0) {
      Notification.show('Нечего сбрасывать');
      return 0;
    }
    let refund = 0;
    for (let level = 0; level < item.level; level++) {
      refund += Math.floor(item.baseCost * Math.pow(item.costMultiplier, level));
    }
    item.level = 0;
    item.totalSpent = 0;
    if (item.unlockLevel) item.isUnlocked = false;
    this.saveState();
    Notification.show(`Улучшение "${item.name}" сброшено. Возврат: ${refund} осколков.`);
    return refund;
  }

  getStoreSummary() {
    return this.items.map(item => ({
      name: item.name,
      level: item.level,
      max: item.maxLevel,
      isUnlocked: !!item.isUnlocked,
      unlockedAt: item.unlockLevel,
      nextCost: this.getCurrentCost(item),
      totalSpent: item.totalSpent,
      bonus: this.getEffectValue(item)
    }));
  }
}
