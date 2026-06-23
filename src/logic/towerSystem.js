import towerFloors from '../data/towerFloors.json';
import { Notification } from '../components/Notification.js';
import { TowerShopSystem } from './towerShopSystem.js'; // Подключаем магазин башни

const STORAGE_KEY = 'towerProgress';
const FLOOR_CHECKPOINT_STEP = 5;
const TOWER_AUTO_DAMAGE_INTERVAL_MS = 5000;

export class TowerSystem {
  constructor(gameCore, telegram) {
    this.game = gameCore;
    this.telegram = telegram;
    this.floors = towerFloors;
    this.attackTimer = null;
    this.autoDamageTimer = null;
    this.resetState();

    // Инициализация магазина башни (тайника)
    this.towerShop = new TowerShopSystem(this);

    this.loadProgress();
    this.startEnemyLoop();
    this.startAutoDamageLoop();
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
    this.lastAutoDamageAt = Date.now();
    this.defeatedBosses = [];
    this.isCleared = false;

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

  getShopBonus(stat) {
    if (!this.towerShop || typeof this.towerShop.getTotalBonus !== 'function') {
      return 0;
    }

    return this.towerShop.getTotalBonus(stat);
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

    const recalculatedMaxHp = this.calculatePlayerMaxHp();
    if (!this.playerMaxHp || this.playerMaxHp < 1) {
      this.playerMaxHp = recalculatedMaxHp;
    } else if (this.playerMaxHp !== recalculatedMaxHp) {
      const hpRatio = this.playerMaxHp > 0 ? this.playerHp / this.playerMaxHp : 1;
      this.playerMaxHp = recalculatedMaxHp;
      this.playerHp = Math.min(this.playerMaxHp, Math.max(1, Math.round(this.playerMaxHp * hpRatio)));
    }

    if (!this.playerHp || this.playerHp > this.playerMaxHp) {
      this.playerHp = this.playerMaxHp;
    }
  }

  calculatePlayerMaxHp() {
    const clickValue = this.game.getClickValue();
    const autoIncome = this.game.getAutoIncome();
    const baseHp = Math.max(100, Math.round(100 + clickValue * 12 + autoIncome * 25 + this.highestFloor * 6));
    const bonusPercent = this.getShopBonus('hp_percent');
    return Math.max(100, Math.round(baseHp * (1 + bonusPercent / 100)));
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

  openShop() {
    if (!this.towerShop || typeof this.towerShop.open !== 'function') return;
    this.isShopOpen = true;
    this.towerShop.open();
    this.triggerUpdate();
  }

  closeShop() {
    if (!this.isShopOpen) return;
    this.isShopOpen = false;
    if (this.towerShop && typeof this.towerShop.close === 'function') this.towerShop.close();
    this.triggerUpdate();
  }

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
      if (!this.isOpen || this.isShopOpen || !this.currentEnemy || this.enemyHp <= 0 || this.playerHp <= 0) {
        return;
      }

      const now = Date.now();
      const slowPercent = Math.min(80, this.getShopBonus('enemy_slow'));
      const baseInterval = this.currentEnemy.attackIntervalMs || 2000;
      const interval = Math.round(baseInterval * (1 + slowPercent / 100));
      if (now - this.lastEnemyAttackAt < interval) {
        return;
      }

      this.lastEnemyAttackAt = now;
      this.applyEnemyAttack();
    }, 200);
  }

  startAutoDamageLoop() {
    if (this.autoDamageTimer) {
      clearInterval(this.autoDamageTimer);
    }

    this.autoDamageTimer = setInterval(() => {
      if (!this.isOpen || this.isShopOpen || !this.currentEnemy || this.enemyHp <= 0 || this.playerHp <= 0) {
        return;
      }

      const autoDamagePercent = this.getShopBonus('auto_damage');
      if (autoDamagePercent <= 0) {
        return;
      }

      const now = Date.now();
      if (now - this.lastAutoDamageAt < TOWER_AUTO_DAMAGE_INTERVAL_MS) {
        return;
      }

      this.lastAutoDamageAt = now;
      this.applyAutoDamage(autoDamagePercent);
    }, 250);
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
    const itemRegen = Math.max(0, Math.round(hoodValue * 20));
    const towerRegen = Math.max(0, Math.round(this.getShopBonus('regen_per_hit')));
    return itemRegen + towerRegen;
  }

  getAttackSummary(multiplier, sourceItemId, damage, isCrit = false, critMultiplier = 1) {
    return {
      damage,
      sourceItemId,
      isCrit,
      critMultiplier,
      isEternalClockActive: this.game.isEternalClockActive()
    };
  }

  applyAutoDamage(autoDamagePercent) {
    const baseDamage = this.game.getClickValue();
    const modifiers = this.getItemCombatModifiers();
    const damage = Math.max(1, Math.round((baseDamage + modifiers.flatDamage) * (autoDamagePercent / 100)));
    this.enemyHp = Math.max(0, this.enemyHp - damage);
    this.lastAttackSummary = this.getAttackSummary('auto_damage', 'tower_auto_damage', damage, false, autoDamagePercent / 100);

    import('../components/VisualEffects.js').then(({ VisualEffects }) => {
      const clicker = document.querySelector('.tower-clicker');
      if (clicker) {
        const rect = clicker.getBoundingClientRect();
        VisualEffects.showFloatingGain(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          damage,
          { sourceItemId: 'tower_auto_damage' }
        );
      }
    });

    if (this.enemyHp <= 0) {
      this.handleEnemyDefeat();
      return;
    }

    this.triggerUpdate();
  }

  handleAttackClick() {
    if (!this.isOpen) {
      this.open();
    }

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
    const towerDamageBonus = this.getShopBonus('damage_percent');
    const critChance = this.getShopBonus('crit_chance');
    const critDamageBonus = this.getShopBonus('crit_damage');
    let multiplier = this.game.isEternalClockActive() ? 3 : 1;
    let sourceItemId = null;
    let isCrit = false;
    let critMultiplier = 1;

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

    if (critChance > 0 && Math.random() < critChance / 100) {
      isCrit = true;
      critMultiplier = 2 + critDamageBonus / 100;
      multiplier *= critMultiplier;
      if (!sourceItemId) {
        sourceItemId = 'tower_crit_damage';
      }
    }

    const totalBaseDamage = (baseDamage + modifiers.flatDamage) * (1 + towerDamageBonus / 100);
    const damage = Math.max(1, Math.round(totalBaseDamage * multiplier));
    this.enemyHp = Math.max(0, this.enemyHp - damage);
    this.game.clickCounter = nextTowerClick;

    const regen = this.getRegenerationPerHit();
    if (regen > 0) {
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + regen);
    }

    this.lastAttackSummary = this.getAttackSummary(multiplier, sourceItemId, damage, isCrit, critMultiplier);

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

    const goldBonus = this.getShopBonus('gold_bonus');
    const shardBonus = this.getShopBonus('shard_bonus');
    const reward = Math.max(0, Math.round(enemy.reward * (1 + goldBonus / 100)));
    const shards = Math.max(0, Math.round(enemy.shards * (1 + shardBonus / 100)));

    this.game.addCurrency(reward);
    this.shadowShards += shards;

    if (enemy.type === 'boss' && !this.defeatedBosses.includes(enemy.enemyId)) {
      this.defeatedBosses.push(enemy.enemyId);
    }

    this.highestFloor = Math.max(this.highestFloor, this.currentFloor + 1);
    if (enemy.floor % FLOOR_CHECKPOINT_STEP === 0) {
      this.lastCheckpointFloor = enemy.floor;
      const checkpointHealPercent = this.getShopBonus('checkpoint_heal');
      if (checkpointHealPercent > 0) {
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + Math.round(this.playerMaxHp * (checkpointHealPercent / 100)));
      }
    }

    if (enemy.type === 'boss' || enemy.floor % FLOOR_CHECKPOINT_STEP === 0) {
      Notification.show('Вы нашли тайник! Можете открыть магазин башни.');
    }

    if (this.currentFloor >= this.floors[this.floors.length - 1].floor) {
      this.isCleared = true;
      const superReward = 10_000;
 
      this.game.addCurrency(superReward);

      Notification.show(`Башня откликнулась вам. НАГРАДА: ${superReward.toLocaleString('ru-RU')} Теней! и ${shards} осколков`);

      this.currentFloor = 1;
      this.lastCheckpointFloor = 1;
      this.playerMaxHp = this.calculatePlayerMaxHp();
      this.playerHp = this.playerMaxHp;
      this.enemyHp = 0;
      this.ensureFloorState();
      this.saveProgress();

      return;
    }

    Notification.show(`Этаж ${enemy.floor} очищен. Получено ${reward} Теней и ${shards} осколков.`);
    this.currentFloor += 1;
    this.playerMaxHp = this.calculatePlayerMaxHp();
    this.playerHp = Math.min(this.playerMaxHp, this.playerHp + Math.round(this.playerMaxHp * 0.2));
    this.enemyHp = 0;
    this.ensureFloorState();
    this.saveProgress();
  }

  handlePlayerDefeat() {
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

  resetShopUpgrades() {
    if (!this.towerShop || typeof this.towerShop.resetAll !== 'function') {
      return 0;
    }

    const refund = this.towerShop.resetAll();
    this.shadowShards += refund;
    this.playerMaxHp = this.calculatePlayerMaxHp();
    this.playerHp = Math.min(this.playerHp, this.playerMaxHp);
    this.ensureFloorState();
    this.saveProgress();
    this.triggerUpdate();
    return refund;
  }

  getFloorProgressPercent() {
    const totalFloors = this.floors.length;
    const isFinished = this.currentFloor > totalFloors;
    let floorProgress = 0;

    if (isFinished) {
      floorProgress = 100;
    } else {
      let completedFloors = this.currentFloor - 1;
      let currentFloorFraction = 0;

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
      isShopAvailable: this.currentEnemy?.type === 'boss' || this.currentFloor % FLOOR_CHECKPOINT_STEP === 0,
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
      lastAutoDamageAt: this.lastAutoDamageAt,
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
      this.lastAutoDamageAt = data.lastAutoDamageAt || Date.now();
      this.ensureFloorState();

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
