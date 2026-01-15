import upgrades from '../data/upgrades.json';
import { Notification } from '../components/Notification.js';

export class ShopSystem {
  constructor(gameCore) {
    this.game = gameCore;
    // Загружаем состояние магазина
    this.upgrades = this.loadState();
  }

  loadState() {
    const saved = localStorage.getItem('shopProgress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Восстанавливаем улучшения с сохранённым уровнем
        return upgrades.map(upgrade => {
          const savedUpgrade = parsed.find(s => s.id === upgrade.id);
          return {
            ...upgrade,
            level: savedUpgrade ? savedUpgrade.level : 0,
            totalSpent: savedUpgrade ? savedUpgrade.totalSpent : 0
          };
        });
      } catch (e) {
        console.error('Ошибка загрузки прогресса магазина:', e);
      }
    }
    // Если нет сохранения — начальный прогресс
    return upgrades.map(upgrade => ({
      ...upgrade,
      level: 0,
      totalSpent: 0
    }));
  }

  saveState() {
    const state = this.upgrades.map(upgrade => ({
      id: upgrade.id,
      level: upgrade.level,
      totalSpent: upgrade.totalSpent
    }));
    localStorage.setItem('shopProgress', JSON.stringify(state));
  }

  getCurrentPrice(upgrade) {
    if (upgrade.level === 0) {
      return upgrade.price;
    }
    return Math.floor(upgrade.price * Math.pow(upgrade.priceIncrease, upgrade.level));
  }

  buyUpgrade(upgradeId) {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    
    if (!upgrade) {
      Notification.show("Улучшение не найдено");
      return false;
    }

    if (upgrade.level >= upgrade.maxLevel) {
      Notification.show(`Максимальный уровень улучшения "${upgrade.name}" достигнут`);
      return false;
    }

    const price = this.getCurrentPrice(upgrade);

    if (this.game.getCurrency() < price) {
      Notification.show("Недостаточно Теней");
      return false;
    }

    this.game.addCurrency(-price);

    // Увеличиваем уровень
    upgrade.level++;
    upgrade.totalSpent += price;

    // Применяем эффект
    this.applyUpgrade(upgrade);

    // Сохраняем прогресс
    this.saveState();

    Notification.show(`${upgrade.name} улучшен до уровня ${upgrade.level}`);
    return true;
  }

  applyUpgrade(upgrade) {
    if (upgrade.type === 'click') {
      this.game.addShopClickBonus(upgrade.value);
    } else if (upgrade.type === 'auto') {
      this.game.addShopAutoBonus(upgrade.value);
    } else if (upgrade.type === 'multiplier') {
      // Для мультипликатора увеличиваем бонус к силе нажатия
      this.game.addShopMultiplier(upgrade.value);
    }
  }

  getUpgrades() {
    return this.upgrades.map(upgrade => ({
      ...upgrade,
      currentPrice: this.getCurrentPrice(upgrade),
      canAfford: this.game.getCurrency() >= this.getCurrentPrice(upgrade),
      progressPercent: (upgrade.level / upgrade.maxLevel) * 100
    }));
  }

  resetAllUpgrades() {
    let totalRefund = 0;
    
    // Считаем сумму возврата за все улучшения
    for (const upgrade of this.upgrades) {
      if (upgrade.level > 0) {
        // Пересчитываем потраченные деньги за все уровни
        for (let level = 0; level < upgrade.level; level++) {
          const priceAtLevel = Math.floor(upgrade.price * Math.pow(upgrade.priceIncrease, level));
          totalRefund += priceAtLevel;
        }
      }
    }
    
    // Сбрасываем все улучшения
    this.upgrades = this.upgrades.map(upgrade => ({
      ...upgrade,
      level: 0,
      totalSpent: 0
    }));
    
    // Возвращаем деньги игроку
    this.game.addCurrency(totalRefund);
    
    // Сохраняем прогресс
    this.saveState();
    
    // Сбрасываем бонусы в gameCore
    this.game.resetShopBonuses();
    
    return totalRefund;
  }
}