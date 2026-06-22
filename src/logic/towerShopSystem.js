import towerShopItems from '../data/towerShop.json';
import { Notification } from '../components/Notification.js';

const STORAGE_KEY = 'towerShopProgress';

export class TowerShopSystem {
  constructor() {
    this.items = towerShopItems.map(item => ({
      ...item,
      level: 0,
      totalSpent: 0
    }));
    this.loadState();
  }

  loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.items = this.items.map(item => {
          const savedItem = parsed.find(s => s.id === item.id);
          return {
            ...item,
            level: savedItem?.level || 0,
            totalSpent: savedItem?.totalSpent || 0
          };
        });
      } catch (e) {
        console.error('Ошибка загрузки прогресса Тайника:', e);
      }
    }
  }

  saveState() {
    const state = this.items.map(item => ({
      id: item.id,
      level: item.level,
      totalSpent: item.totalSpent
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  getCurrentCost(item) {
    if (item.level === 0) {
      return item.baseCost;
    }
    return Math.floor(item.baseCost * Math.pow(item.costMultiplier, item.level));
  }

  canAfford(item, shards) {
    return shards >= this.getCurrentCost(item) && item.level < item.maxLevel;
  }

  getEffectValue(item) {
    return item.valuePerLevel * item.level;
  }

  buyUpgrade(itemId, shards) {
    const item = this.items.find(i => i.id === itemId);
    if (!item) {
      Notification.show('Улучшение не найдено');
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

    item.level++;
    item.totalSpent += cost;
    this.saveState();

    Notification.show(`${item.name} улучшен до уровня ${item.level}`);
    return { success: true, newShards: shards - cost };
  }

  getAllItems(shards) {
    return this.items.map(item => ({
      ...item,
      currentCost: this.getCurrentCost(item),
      canAfford: this.canAfford(item, shards),
      effectValue: this.getEffectValue(item),
      progressPercent: (item.level / item.maxLevel) * 100
    }));
  }

  getTotalBonus(stat) {
    const item = this.items.find(i => i.stat === stat);
    return item ? this.getEffectValue(item) : 0;
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
      totalSpent: 0
    }));
    this.saveState();
    return totalRefund;
  }
}