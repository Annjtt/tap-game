import { CONFIG } from '../config.js';
import { Notification } from '../components/Notification.js';
import { TowerShopSystem } from './towerShopSystem.js';

const STORAGE_KEY = 'towerProgress';
const FLOOR_CHECKPOINT_STEP = CONFIG.towerInfinite.checkpointStep;
const BOSS_INTERVAL = CONFIG.towerInfinite.bossInterval;
const TOWER_AUTO_DAMAGE_INTERVAL_MS = 5000;

const NAME_PREFIXES = [
  'Тусклая', 'Погибающая', 'Изломанный', 'Грозовой', 'Дрожащий',
  'Безмолвный', 'Искажённый', 'Гнилой', 'Ветхий', 'Леденящий',
  'Кровоточащий', 'Пылающий', 'Беспокойный', 'Кремневый', 'Шепчущий',
  'Затаённый', 'Склочный', 'Багровый', 'Инейный', 'Мороковый',
  'Призрачный', 'Сумрачный', 'Обугленный', 'Жуткий', 'Скрипящий'
];

const NAME_NOUNS = [
  'Фантом', 'Осколок', 'Пастырь', 'Клык', 'Колокол',
  'Потрошитель', 'Пиявка', 'Страж', 'Зрак', 'Коготь',
  'Панцирь', 'Глас', 'Сгусток', 'Череп', 'Мох',
  'Гвоздь', 'Зеркало', 'Вериг', 'Шрам', 'Вихрь',
  'Прах', 'Саван', 'Злоба', 'Облик', 'Лабиринт'
];

function generateEnemyName(floor) {
  const poolSize = NAME_PREFIXES.length * NAME_NOUNS.length;
  const index = (floor - 1) % poolSize;
  const pIdx = index % NAME_PREFIXES.length;
  const nIdx = Math.floor(index / NAME_PREFIXES.length) % NAME_NOUNS.length;
  return `${NAME_PREFIXES[pIdx]} ${NAME_NOUNS[nIdx]}`;
}

function generateEnemyDescription(type, floor) {
  if (type === 'boss') {
    const bossTitles = [
      'Владыка', 'Хранитель', 'Повелитель', 'Страж',
    ];
    const title = bossTitles[(floor / BOSS_INTERVAL - 1) % bossTitles.length];
    return `${title} этажа ${floor}`;
  }
  const descTemplates = [
    `Порождение тьмы на этаже: ${floor}`,
    `Тень, застывшая между мирами. Этаж: ${floor}`,
    `Сущность, охраняющая этаж: ${floor}`,
    `Ужас этажа: ${floor}`,
    `Сгусток Мрака этажа: ${floor}`,
  ];
  return descTemplates[Math.floor((floor - 1) % descTemplates.length)];
}

function generateFloor(floorNumber) {
  const cfg = CONFIG.towerInfinite;
  const isBoss = floorNumber % BOSS_INTERVAL === 0;

  const rawHp = cfg.enemyBaseHp + Math.pow(floorNumber, cfg.enemyHpPow) * cfg.enemyHpScale;
  const rawDmg = cfg.enemyBaseDmg + Math.pow(floorNumber, cfg.enemyDmgPow) * cfg.enemyDmgScale;
  const rawInterval = Math.max(
    cfg.enemyIntervalMin,
    cfg.enemyIntervalBase - floorNumber * cfg.enemyIntervalFloorFactor
  );

  let reward;
  if (floorNumber <= cfg.rewardSwitchFloor) {
    reward = Math.round(cfg.rewardBase * Math.pow(cfg.rewardGrowth, floorNumber - 1));
  } else {
    const atSwitch = Math.round(cfg.rewardBase * Math.pow(cfg.rewardGrowth, cfg.rewardSwitchFloor - 1));
    reward = Math.round(atSwitch * Math.pow(cfg.rewardGrowthLate, floorNumber - cfg.rewardSwitchFloor));
  }
  const shards = Math.max(1, Math.floor(cfg.shardsBase + floorNumber * cfg.shardsPerFloor));

  if (isBoss) {
    return {
      floor: floorNumber,
      enemyId: `boss_f${floorNumber}`,
      name: `Король Теней этаж ${floorNumber}`,
      type: 'boss',
      maxHp: Math.round(rawHp * cfg.bossHpMultiplier),
      damage: Math.round(rawDmg * cfg.bossDmgMultiplier),
      attackIntervalMs: Math.round(rawInterval),
      reward: Math.round(reward * cfg.bossRewardMultiplier),
      shards: Math.max(1, Math.round(shards * cfg.bossShardMultiplier)),
      description: generateEnemyDescription('boss', floorNumber),
    };
  }

  return {
    floor: floorNumber,
    enemyId: `enemy_f${floorNumber}`,
    name: generateEnemyName(floorNumber),
    type: 'normal',
    maxHp: Math.round(rawHp),
    damage: Math.round(rawDmg),
    attackIntervalMs: Math.round(rawInterval),
    reward,
    shards,
    description: generateEnemyDescription('normal', floorNumber),
  };
}

export class TowerSystem {
  constructor(gameCore, telegram) {
    this.game = gameCore;
    this.telegram = telegram;
    this.attackTimer = null;
    this.autoDamageTimer = null;
    this.resetState();

    this.towerShop = new TowerShopSystem();

    this.loadProgress();
  }

  resetState() {
    this.isOpen = false;
    this.isShopOpen = false;
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
    this.autoBattleActive = false;
    this.autoBattleTimer = null;

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
    return generateFloor(this.currentFloor);
  }

  getShopBonus(stat) {
    if (!this.towerShop || typeof this.towerShop.getTotalBonus !== 'function') {
      return 0;
    }
    return this.towerShop.getTotalBonus(stat);
  }

  getShadowShards() {
    return this.shadowShards;
  }

  addShadowShards(amount) {
    this.shadowShards += amount;
    document.dispatchEvent(new CustomEvent('shadowShardsUpdated'));
  }

  getBaseTowerDamage() {
    const baseDamage = this.game.getClickValue();
    const modifiers = this.getItemCombatModifiers();
    const towerDamageBonus = this.getShopBonus('damage_percent');
    return Math.max(1, (baseDamage + modifiers.flatDamage) * (1 + towerDamageBonus / 100));
  }

  getMaxHp() {
    return this.calculatePlayerMaxHp();
  }

  getRegenPercent() {
    return this.getRegenerationPercent();
  }

  ensureFloorState() {
    const floor = this.getCurrentFloorData();
    if (!floor) {
      return;
    }

    this.currentEnemy = floor;
    this.enemyMaxHp = floor.maxHp;

    // Compute final reward with shop bonuses for UI display
    const goldBonus = this.getShopBonus('gold_bonus');
    const shardBonus = this.getShopBonus('shard_bonus');
    this.currentEnemy.finalReward = Math.max(0, Math.round(floor.reward * (1 + goldBonus / 100)));
    this.currentEnemy.finalShards = Math.max(0, Math.round(floor.shards * (1 + shardBonus / 100)));

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
    const baseHp = Math.max(100, Math.round(100 + clickValue * 2 + autoIncome * 3 + this.highestFloor * 15));
    const bonusPercent = this.getShopBonus('hp_percent');
    return Math.max(100, Math.round(baseHp * (1 + bonusPercent / 100)));
  }

  getItemCombatModifiers() {
    const activeItems = this.game.getActiveItemsByName();
    const scythe = activeItems['Коса богов'];
    let scytheCritChance = 0;
    let scytheCritDamage = 0;
    if (scythe) {
      const rankMult = scythe.bonusMultiplier || 1;
      const value = 15 * rankMult;
      scytheCritChance = value;
      scytheCritDamage = value * 20;
    }
    return {
      flatDamage: Object.values(activeItems)
        .filter((item) => item.stat === 'click')
        .reduce((sum, item) => sum + (item.enhancedValue || item.baseBonus || 0), 0),
      lightning: activeItems['Кинжал молнии'],
      chaos: activeItems['Печать Хаоса'],
      clock: activeItems['Часы Этерна'],
      hood: activeItems['Капюшон Тени'],
      scytheCritChance,
      scytheCritDamage
    };
  }

  open() {
    this.isOpen = true;
    this.playerMaxHp = this.calculatePlayerMaxHp();
    this.playerHp = Math.min(this.playerHp || this.playerMaxHp, this.playerMaxHp);
    this.ensureFloorState();
    this.startEnemyLoop();
    this.startAutoDamageLoop();
    this.triggerUpdate();
  }

  close() {
    this.isOpen = false;
    this.isShopOpen = false;
    this.deactivateAutoBattle();
    if (this.attackTimer) {
      clearInterval(this.attackTimer);
      this.attackTimer = null;
    }
    if (this.autoDamageTimer) {
      clearInterval(this.autoDamageTimer);
      this.autoDamageTimer = null;
    }
    this.saveProgress();
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

  getRegenerationPercent() {
    const modifiers = this.getItemCombatModifiers();
    const hoodValue = modifiers.hood ? (modifiers.hood.enhancedValue || modifiers.hood.baseBonus || 0) : 0;
    const itemRegen = Math.max(0, hoodValue * 20);
    const towerRegen = Math.max(0, this.getShopBonus('regen_per_hit'));
    return itemRegen + towerRegen;
  }

  // ─── auto-battle ──────────────────────────────────────

  getAutoBattleConfig() {
    return {
      unlocked: this.getShopBonus('auto_speed') > 0,
      speed: this.getShopBonus('auto_speed'),
      damagePct: this.getShopBonus('auto_damage_pct'),
      lifestealPct: this.getShopBonus('auto_lifesteal')
    };
  }

  activateAutoBattle() {
    if (this.autoBattleActive) return false;
    const cfg = this.getAutoBattleConfig();
    if (!cfg.unlocked) return false;
    this.autoBattleActive = true;
    this._startAutoBattleLoop();
    return true;
  }

  deactivateAutoBattle() {
    this.autoBattleActive = false;
    if (this.autoBattleTimer) {
      clearInterval(this.autoBattleTimer);
      this.autoBattleTimer = null;
    }
  }

  _startAutoBattleLoop() {
    if (this.autoBattleTimer) clearInterval(this.autoBattleTimer);
    const cfg = this.getAutoBattleConfig();
    const interval = Math.max(200, Math.round(1000 / cfg.speed));
    this.autoBattleTimer = setInterval(() => {
      if (!this.isOpen || this.isShopOpen || !this.currentEnemy || this.enemyHp <= 0 || this.playerHp <= 0) {
        if (this.playerHp <= 0) this.deactivateAutoBattle();
        return;
      }
      const summary = this.handleAttackClick(true);
      if (summary && summary.damage > 0) {
        const c = this.getAutoBattleConfig();
        let lifeHeal = 0;
        if (c.lifestealPct > 0) {
          lifeHeal = Math.max(1, Math.round(summary.damage * c.lifestealPct / 100));
          this.playerHp = Math.min(this.playerMaxHp, this.playerHp + lifeHeal);
        }
        document.dispatchEvent(new CustomEvent('towerAutoAttack', {
          detail: { damage: summary.damage, sourceItemId: summary.sourceItemId, isCrit: summary.isCrit, lifesteal: lifeHeal }
        }));
      }
    }, interval);
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

    const regenPercent = this.getRegenerationPercent();
    if (regenPercent > 0) {
      const heal = Math.max(1, Math.round(damage * regenPercent / 100));
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + heal);
    }

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

  handleAttackClick(isAuto = false) {
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
    const shopCritChance = this.getShopBonus('crit_chance');
    const shopCritDamage = this.getShopBonus('crit_damage');
    const totalCritChance = shopCritChance + modifiers.scytheCritChance;
    const totalCritDamageBonus = shopCritDamage + modifiers.scytheCritDamage;
    let multiplier = this.game.isEternalClockActive() ? 3 : 1;
    let sourceItemId = null;
    let isCrit = false;
    let critMultiplier = 1;

    if (!isAuto && modifiers.lightning && Math.random() < 0.05) {
      multiplier *= 2;
      sourceItemId = 'lightning_dagger';
      this.game.showLightningEffect();
    } else if (isAuto && modifiers.lightning && Math.random() < 0.05) {
      multiplier *= 2;
      sourceItemId = 'lightning_dagger';
    }

    const nextTowerClick = (this.game.clickCounter || 0) + 1;
    if (!isAuto && modifiers.chaos && nextTowerClick % 10 === 0) {
      multiplier *= 5;
      sourceItemId = 'chaos_seal';
      this.game.showChaosEffect();
    } else if (isAuto && modifiers.chaos && nextTowerClick % 10 === 0) {
      multiplier *= 5;
      sourceItemId = 'chaos_seal';
    }

    if (totalCritChance > 0 && Math.random() < totalCritChance / 100) {
      isCrit = true;
      critMultiplier = 2 + totalCritDamageBonus / 100;
      multiplier *= critMultiplier;
      if (!sourceItemId) {
        sourceItemId = modifiers.scytheCritChance > 0 ? 'scythe_crit' : 'tower_crit_damage';
      }
    }

    // Apply auto-battle damage % if from auto
    if (isAuto) {
      const cfg = this.getAutoBattleConfig();
      multiplier *= (cfg.damagePct / 100);
    }

    const totalBaseDamage = (baseDamage + modifiers.flatDamage) * (1 + towerDamageBonus / 100);
    const damage = Math.max(1, Math.round(totalBaseDamage * multiplier));
    this.enemyHp = Math.max(0, this.enemyHp - damage);
    this.game.clickCounter = nextTowerClick;
    if (!isAuto && this.game.questSystem) this.game.questSystem.onClick();

    if (!isAuto) {
      const regenPercent = this.getRegenerationPercent();
      if (regenPercent > 0) {
        const heal = Math.max(1, Math.round(damage * regenPercent / 100));
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + heal);
      }
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

    this.currentFloor += 1;
    this.playerMaxHp = this.calculatePlayerMaxHp();
    this.playerHp = Math.min(this.playerMaxHp, this.playerHp + Math.round(this.playerMaxHp * 0.2));
    this.enemyHp = 0;
    this.ensureFloorState();
    if (this.game && this.game.questSystem) {
      this.game.questSystem.onFloorReached(this.currentFloor);
    }
    this.saveProgress();
  }

  handlePlayerDefeat() {
    this.deactivateAutoBattle();
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
    const floor = this.currentFloor;
    const nextBoss = Math.ceil(floor / BOSS_INTERVAL) * BOSS_INTERVAL;
    const floorsSinceLastBoss = (floor - 1) % BOSS_INTERVAL;
    const progress = (floorsSinceLastBoss / BOSS_INTERVAL) * 100;
    return Math.max(0, Math.min(100, Math.round(progress)));
  }

  getState() {
    this.ensureFloorState();

    let shopState = null;
    if (this.towerShop && typeof this.towerShop.getState === 'function') {
      shopState = this.towerShop.getState();
    }

    const floor = this.currentFloor;
    const nextBoss = Math.ceil(floor / BOSS_INTERVAL) * BOSS_INTERVAL;
    const floorsToBoss = nextBoss - floor;

    return {
      isOpen: this.isOpen,
      isShopOpen: this.isShopOpen,
      isShopAvailable: this.currentEnemy?.type === 'boss' || floor % FLOOR_CHECKPOINT_STEP === 0,
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
      floorProgressPercent: this.getFloorProgressPercent(),
      floorsToBoss,
      nextBoss,
      autoBattleActive: this.autoBattleActive,
      autoBattleConfig: this.getAutoBattleConfig(),
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
