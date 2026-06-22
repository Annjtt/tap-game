import towerFloors from '../data/towerFloors.json';
import { Notification } from '../components/Notification.js';
import { TowerShopSystem } from './towerShopSystem.js'; // Подключаем магазин башни

const STORAGE_KEY = 'towerProgress';
const FLOOR_CHECKPOINT_STEP = 5;

export class TowerSystem {
  constructor(gameCore, telegram) {
    this.game = gameCore;
    this.telegram = telegram;
    this.floors = towerFloors;
    this.attackTimer = null;
    this.resetState();
    this.loadProgress();
    this.startEnemyLoop();

    // Инициализация магазина башни (тайника)
    this.towerShop = new TowerShopSystem(this);
  }

  resetState() {
    this.isOpen = false;
    this.isShopOpen = false; // Стейт магазина
    this.currentFloor = 1;
    this.highestFloor = 1;
    this.lastCheckpointFloor = 1;
    this.playerMaxHp = 100;
    this.playerHp = 100;
    this.enemyHp = 0;
    this.enemyMaxHp = 0;
    this.currentEnemy = null;
    this.lastAttackSummary = null;
    this.shadowShards = 0;
    this.lastEnemyAttackAt = Date.now();
    this.lastSavedAt = Date.now();
    this.defeatedBosses = [];
    this.isCleared = false;

    // Сброс инициализации магазина/тайника
    if (this.towerShop && typeof this.towerShop.resetShop === 'function') {
      this.towerShop.resetShop();
    }
  }

  getPlayerName() {
    return this.game.getPlayerDisplayName(this.telegram);
  }

  getPlayerAvatar() {
    return this.telegram?.initDataUnsafe?.user?.photo_url || '';
  }

  getCurrentFloorData() {
    return this.floors.find((floor) => floor.floor === this.currentFloor) || this.floors[this.floors.length - 1];
  }

  ensureFloorState() {
    const floor = this.getCurrentFloorData();
    if (!floor) {
      return;
    }

    this.currentEnemy = floor;
    this.enemyMaxHp = floor.maxHp;

    if (!this.enemyHp || this.enemyHp > this.enemyMaxHp) {
      this.enemyHp = this.enemyMaxHp;
    }

    if (!this.playerMaxHp || this.playerMaxHp < 1) {
      this.playerMaxHp = this.calculatePlayerMaxHp();
    }

    if (!this.playerHp || this.playerHp > this.playerMaxHp) {
      this.playerHp = this.playerMaxHp;
    }
  }

  calculatePlayerMaxHp() {
    const clickValue = this.game.getClickValue();
    const autoIncome = this.game.getAutoIncome();
    return Math.max(100, Math.round(100 + clickValue * 12 + autoIncome * 25 + this.highestFloor * 6));
  }

  getItemCombatModifiers() {
    const activeItems = this.game.getActiveItemsByName();
    return {
      flatDamage: Object.values(activeItems)
        .filter((item) => item.stat === 'click')
        .reduce((sum, item) => sum + (item.enhancedValue || item.baseBonus || 0), 0),
      lightning: activeItems['Кинжал молнии'],
      chaos: activeItems['Печать Хаоса'],
      clock: activeItems['Часы Этерна'],
      hood: activeItems['Капюшон Тени']
    };
  }

  open() {
    this.isOpen = true;
    this.playerMaxHp = this.calculatePlayerMaxHp();
    this.playerHp = Math.min(this.playerHp || this.playerMaxHp, this.playerMaxHp);
    this.ensureFloorState();
    this.triggerUpdate();
  }

  close() {
    this.isOpen = false;
    this.isShopOpen = false;
    this.saveProgress();
    this.triggerUpdate();
  }

  // Открыть магазин (тайник)
  openShop() {
    if (this.isShopOpen) return;
    if (!this.towerShop || typeof this.towerShop.open !== 'function') return;
    this.isShopOpen = true;
    this.towerShop.open();
    this.triggerUpdate();
  }

  // Закрыть магазин (тайник)
  closeShop() {
    if (!this.isShopOpen) return;
    this.isShopOpen = false;
    if (this.towerShop && typeof this.towerShop.close === 'function') this.towerShop.close();
    this.triggerUpdate();
  }

  // Для UI-кнопки открытия магазина (тайника)
  toggleShop() {
    if (this.isShopOpen) {
      this.closeShop();
    } else {
      this.openShop();
    }
  }

  startEnemyLoop() {
    if (this.attackTimer) {
      clearInterval(this.attackTimer);
    }

    this.attackTimer = setInterval(() => {
      // В магазине не атакуем
      if (!this.isOpen || this.isShopOpen || !this.currentEnemy || this.enemyHp <= 0 || this.playerHp <= 0) {
        return;
      }

      const now = Date.now();
      const interval = this.currentEnemy.attackIntervalMs || 2000;
      if (now - this.lastEnemyAttackAt < interval) {
        return;
      }

      this.lastEnemyAttackAt = now;
      this.applyEnemyAttack();
    }, 200);
  }

  applyEnemyAttack() {
    const defenseRatio = this.getDefenseRatio();
    const rawDamage = this.currentEnemy.damage;
    const damage = Math.max(1, Math.round(rawDamage * (1 - defenseRatio)));
    this.playerHp = Math.max(0, this.playerHp - damage);

    if (this.playerHp <= 0) {
      this.handlePlayerDefeat();
      return;
    }

    this.lastEnemyAttackDamage = damage;
    this.triggerUpdate();

    document.dispatchEvent(new CustomEvent('towerEnemyAttack', { detail: { damage } }));
  }

  getDefenseRatio() {
    const modifiers = this.getItemCombatModifiers();
    const hoodValue = modifiers.hood ? (modifiers.hood.enhancedValue || modifiers.hood.baseBonus || 0) : 0;
    return Math.min(0.35, hoodValue * 0.8);
  }

  getRegenerationPerHit() {
    const modifiers = this.getItemCombatModifiers();
    const hoodValue = modifiers.hood ? (modifiers.hood.enhancedValue || modifiers.hood.baseBonus || 0) : 0;
    return Math.max(0, Math.round(hoodValue * 20));
  }

  handleAttackClick() {
    if (!this.isOpen) {
      this.open();
    }

    // Если магазин (тайник) открыт, атака невозможна
    if (this.isShopOpen) {
      Notification.show('В тайнике нельзя сражаться');
      return null;
    }

    this.ensureFloorState();

    if (this.playerHp <= 0) {
      Notification.show('Герой ослаб. Восстановитесь и попробуйте снова.');
      return null;
    }

    if (!this.currentEnemy || this.enemyHp <= 0) {
      return null;
    }

    const baseDamage = this.game.getClickValue();
    const modifiers = this.getItemCombatModifiers();
    let multiplier = this.game.isEternalClockActive() ? 3 : 1;
    let sourceItemId = null;

    if (modifiers.lightning && Math.random() < 0.05) {
      multiplier *= 2;
      sourceItemId = 'lightning_dagger';
      this.game.showLightningEffect();
    }

    const nextTowerClick = (this.game.clickCounter || 0) + 1;
    if (modifiers.chaos && nextTowerClick % 10 === 0) {
      multiplier *= 5;
      sourceItemId = 'chaos_seal';
      this.game.showChaosEffect();
    }

    const damage = Math.max(1, Math.round((baseDamage + modifiers.flatDamage) * multiplier));
    this.enemyHp = Math.max(0, this.enemyHp - damage);
    this.game.clickCounter = nextTowerClick;

    const regen = this.getRegenerationPerHit();
    if (regen > 0) {
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + regen);
    }

    this.lastAttackSummary = {
      damage,
      sourceItemId,
      isEternalClockActive: this.game.isEternalClockActive()
    };

    if (this.enemyHp <= 0) {
      this.handleEnemyDefeat();
    }

    this.triggerUpdate();
    return this.lastAttackSummary;
  }

  handleEnemyDefeat() {
    const enemy = this.currentEnemy;
    if (!enemy) {
      return;
    }

    this.game.addCurrency(enemy.reward);
    this.shadowShards += enemy.shards;

    if (enemy.type === 'boss' && !this.defeatedBosses.includes(enemy.enemyId)) {
      this.defeatedBosses.push(enemy.enemyId);
    }

    this.highestFloor = Math.max(this.highestFloor, this.currentFloor + 1);
    if (enemy.floor % FLOOR_CHECKPOINT_STEP === 0) {
      this.lastCheckpointFloor = enemy.floor;
    }

    // Открыть магазин (тайник) после прохождения каждого 5-го этажа или босса
    if (enemy.type === 'boss' || enemy.floor % FLOOR_CHECKPOINT_STEP === 0) {
      this.openShop();
      Notification.show('Вы нашли тайник! Посетите магазин башни.');
    }

    // Добавьте супернаграду за прохождение 10 этажей и босса (последний этаж)
    if (this.currentFloor >= this.floors[this.floors.length - 1].floor) {
      this.isCleared = true;
      // Супернаграда
      const superReward = 100_000;
      this.game.addCurrency(superReward);

      Notification.show(`Башня откликнулась вам. СУПЕР НАГРАДА: ${superReward.toLocaleString('ru-RU')} Теней! (и ещё ${enemy.shards} осколков)`);

      // Сбросить башню на начало
      this.currentFloor = 1;
      this.lastCheckpointFloor = 1;
      this.playerMaxHp = this.calculatePlayerMaxHp();
      this.playerHp = this.playerMaxHp;
      this.enemyHp = 0;
      this.ensureFloorState();
      this.saveProgress();

      return;
    }

    // Награда за обычный этаж/босса (но не за полный цикл)
    Notification.show(`Этаж ${enemy.floor} очищен. Получено ${enemy.reward} Теней и ${enemy.shards} осколков.`);
    this.currentFloor += 1;
    this.playerMaxHp = this.calculatePlayerMaxHp();
    this.playerHp = Math.min(this.playerMaxHp, this.playerHp + Math.round(this.playerMaxHp * 0.2));
    this.enemyHp = 0;
    this.ensureFloorState();
    this.saveProgress();
  }

  handlePlayerDefeat() {
    // Всегда возвращаться на первый этаж при поражении
    this.currentFloor = 1;
    this.lastCheckpointFloor = 1;
    this.playerMaxHp = this.calculatePlayerMaxHp();
    this.playerHp = this.playerMaxHp;
    this.enemyHp = 0;
    this.ensureFloorState();
    this.saveProgress();
    Notification.show(`Башня отвергла вас. Возврат на этаж 1.`);
    this.triggerUpdate();
  }

  getFloorProgressPercent() {
    // Показывает прогресс прохождения всей башни в процентах.
    // Башня из 10 этажей (или сколько реально есть в this.floors)
    const totalFloors = this.floors.length;
    const isFinished = this.currentFloor > totalFloors;
    let floorProgress = 0;

    // Суммарный прогресс: сколько этажей завершено плюс прогресс на текущем
    if (isFinished) {
      // Всё пройдено
      floorProgress = 100;
    } else {
      // Текущий этаж -- не полностью зачтён пока босс не убит
      // user должен видеть ровно ХХ% закончено из totalFloors: (currentFloor-1) + прогресс текущего этажа
      let completedFloors = this.currentFloor - 1;
      let currentFloorFraction = 0; // от 0 до 1

      if (this.enemyMaxHp && this.enemyHp >= 0 && this.enemyHp <= this.enemyMaxHp) {
        currentFloorFraction = (this.enemyMaxHp - this.enemyHp) / this.enemyMaxHp;
        currentFloorFraction = Math.max(0, Math.min(1, currentFloorFraction));
      }

      floorProgress = ((completedFloors + currentFloorFraction) / totalFloors) * 100;
    }
    return Math.max(0, Math.min(100, Math.round(floorProgress)));
  }

  getState() {
    this.ensureFloorState();

    let shopState = null;
    if (this.towerShop && typeof this.towerShop.getState === 'function') {
      shopState = this.towerShop.getState();
    }

    return {
      isOpen: this.isOpen,
      isShopOpen: this.isShopOpen,
      currentFloor: this.currentFloor,
      highestFloor: this.highestFloor,
      checkpointFloor: this.lastCheckpointFloor,
      playerName: this.getPlayerName(),
      playerAvatar: this.getPlayerAvatar(),
      playerHp: this.playerHp,
      playerMaxHp: this.playerMaxHp,
      enemyHp: this.enemyHp,
      enemyMaxHp: this.enemyMaxHp,
      currentEnemy: this.currentEnemy,
      shadowShards: this.shadowShards,
      lastAttackSummary: this.lastAttackSummary,
      isCleared: this.isCleared,
      floorProgressPercent: this.getFloorProgressPercent(),
      shopState
    };
  }

  saveProgress() {
    let shopData = null;
    if (this.towerShop && typeof this.towerShop.getPersistentData === 'function') {
      shopData = this.towerShop.getPersistentData();
    }

    const payload = {
      currentFloor: this.currentFloor,
      highestFloor: this.highestFloor,
      lastCheckpointFloor: this.lastCheckpointFloor,
      playerHp: this.playerHp,
      playerMaxHp: this.playerMaxHp,
      enemyHp: this.enemyHp,
      enemyMaxHp: this.enemyMaxHp,
      shadowShards: this.shadowShards,
      defeatedBosses: this.defeatedBosses,
      isCleared: this.isCleared,
      lastEnemyAttackAt: this.lastEnemyAttackAt,
      timestamp: Date.now(),
      shop: shopData
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      this.ensureFloorState();
      return;
    }

    try {
      const data = JSON.parse(saved);
      this.currentFloor = data.currentFloor || 1;
      this.highestFloor = data.highestFloor || this.currentFloor;
      this.lastCheckpointFloor = data.lastCheckpointFloor || 1;
      this.playerMaxHp = data.playerMaxHp || this.calculatePlayerMaxHp();
      this.playerHp = data.playerHp || this.playerMaxHp;
      this.enemyHp = data.enemyHp || 0;
      this.enemyMaxHp = data.enemyMaxHp || 0;
      this.shadowShards = data.shadowShards || 0;
      this.defeatedBosses = Array.isArray(data.defeatedBosses) ? data.defeatedBosses : [];
      this.isCleared = Boolean(data.isCleared);
      this.lastEnemyAttackAt = data.lastEnemyAttackAt || Date.now();
      this.ensureFloorState();

      // Восстанавливаем прогресс магазина (тайника), если есть
      if (this.towerShop && typeof this.towerShop.loadPersistentData === 'function' && data.shop) {
        this.towerShop.loadPersistentData(data.shop);
      }
    } catch (error) {
      console.error('Не удалось загрузить прогресс башни:', error);
      this.ensureFloorState();
    }
  }

  triggerUpdate() {
    document.dispatchEvent(new CustomEvent('towerStateChanged', { detail: this.getState() }));
  }
}
