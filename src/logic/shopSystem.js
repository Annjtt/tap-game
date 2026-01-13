import upgrades from '../data/upgrades.json';
import { Notification } from '../components/Notification.js';

export class ShopSystem {
  constructor(gameCore) {
    this.game = gameCore;
    this.upgrades = upgrades.map(upgrade => ({
      ...upgrade,
      purchased: false,
      level: 0
    }));
  }

  buyUpgrade(upgradeId) {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    
    if (!upgrade) {
      Notification.show("Улучшение не найдено");
      return false;
    }

    if (upgrade.purchased && upgrade.type !== 'multiplier') {
      Notification.show("Это улучшение уже куплено");
      return false;
    }

    if (this.game.getCurrency() < upgrade.price) {
      Notification.show("Недостаточно Теней");
      return false;
    }

    this.game.addCurrency(-upgrade.price);

    if (upgrade.type === 'multiplier') {
      // Для мультипликаторов увеличиваем уровень
      upgrade.level++;
      this.applyMultiplierUpgrade(upgrade);
    } else {
      upgrade.purchased = true;
      this.applyUpgrade(upgrade);
    }

    Notification.show(`Куплено: ${upgrade.name}`);
    return true;
  }

  applyUpgrade(upgrade) {
    if (upgrade.type === 'click') {
      this.game.clickValue += upgrade.value;
    } else if (upgrade.type === 'auto') {
      this.game.autoIncome += upgrade.value;
    }
  }

  applyMultiplierUpgrade(upgrade) {
    // Применяем мультипликатор ко всей силе нажатия
    this.game.clickValue = Math.round(this.game.clickValue * upgrade.value);
  }

  getUpgrades() {
    return this.upgrades;
  }
}