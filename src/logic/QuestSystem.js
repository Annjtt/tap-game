import { Notification } from '../components/Notification.js';

const ACHIEVEMENTS = [
  { id: 'ach_click_100', type: 'click', target: 100, reward: 5, name: 'Новичок', desc: 'Сделайте 100 кликов', icon: 'fa-hand-pointer' },
  { id: 'ach_click_1000', type: 'click', target: 1000, reward: 20, name: 'Трудяга', desc: 'Сделайте 1 000 кликов', icon: 'fa-hand-pointer' },
  { id: 'ach_click_5000', type: 'click', target: 5000, reward: 50, name: 'Неутомимый', desc: 'Сделайте 5 000 кликов', icon: 'fa-hand-pointer' },
  { id: 'ach_click_25000', type: 'click', target: 25000, reward: 150, name: 'Легенда клика', desc: 'Сделайте 25 000 кликов', icon: 'fa-hand-pointer' },
  { id: 'ach_chest_3', type: 'chests_opened', target: 3, reward: 5, name: 'Любопытный', desc: 'Откройте 3 сундука', icon: 'fa-box-open' },
  { id: 'ach_chest_10', type: 'chests_opened', target: 10, reward: 20, name: 'Кладоискатель', desc: 'Откройте 10 сундуков', icon: 'fa-box-open' },
  { id: 'ach_chest_25', type: 'chests_opened', target: 25, reward: 50, name: 'Расхититель', desc: 'Откройте 25 сундуков', icon: 'fa-box-open' },
  { id: 'ach_chest_50', type: 'chests_opened', target: 50, reward: 100, name: 'Король сундуков', desc: 'Откройте 50 сундуков', icon: 'fa-box-open' },
  { id: 'ach_collect_1', type: 'unique_items', target: 1, reward: 3, name: 'Знаток', desc: 'Соберите 1 вид предмета', icon: 'fa-cubes' },
  { id: 'ach_collect_2', type: 'unique_items', target: 2, reward: 10, name: 'Любитель', desc: 'Соберите 2 вида предметов', icon: 'fa-cubes' },
  { id: 'ach_collect_4', type: 'unique_items', target: 4, reward: 30, name: 'Ценитель', desc: 'Соберите 4 вида предметов', icon: 'fa-cubes' },
  { id: 'ach_collect_6', type: 'unique_items', target: 6, reward: 75, name: 'Коллекционер', desc: 'Соберите все 6 видов предметов', icon: 'fa-cubes' },
  { id: 'ach_disenchant_3', type: 'disenchants', target: 3, reward: 5, name: 'Распылитель', desc: 'Распылите 3 предмета', icon: 'fa-recycle' },
  { id: 'ach_disenchant_10', type: 'disenchants', target: 10, reward: 15, name: 'Разрушитель', desc: 'Распылите 10 предметов', icon: 'fa-recycle' },
  { id: 'ach_disenchant_25', type: 'disenchants', target: 25, reward: 40, name: 'Демонтажник', desc: 'Распылите 25 предметов', icon: 'fa-recycle' },
  { id: 'ach_earn_1000', type: 'earned', target: 1000, reward: 5, name: 'Богач', desc: 'Заработайте 1 000 Теней', icon: 'fa-coins' },
  { id: 'ach_earn_50000', type: 'earned', target: 50000, reward: 30, name: 'Магнат', desc: 'Заработайте 50 000 Теней', icon: 'fa-coins' },
  { id: 'ach_earn_1m', type: 'earned', target: 1000000, reward: 150, name: 'Теневой король', desc: 'Заработайте 1 000 000 Теней', icon: 'fa-crown' }
];

const MEDALS = (() => {
  const total = ACHIEVEMENTS.length;
  const step = total / 7;
  const G = Math.ceil(step * 1);
  const F = Math.ceil(step * 2);
  const E = Math.ceil(step * 3);
  const D = Math.ceil(step * 4);
  return [
    { id: 'medal_1', icon: 'fa-sun', name: 'Начало пути', desc: `Выполните ${G} достижения`, req: a => a >= G },
    { id: 'medal_3', icon: 'fa-compass', name: 'Странник', desc: `Выполните ${F} достижений`, req: a => a >= F },
    { id: 'medal_6', icon: 'fa-shield-halved', name: 'Герой', desc: `Выполните ${E} достижений`, req: a => a >= E },
    { id: 'medal_9', icon: 'fa-crown', name: 'Легенда', desc: `Выполните ${D} достижений`, req: a => a >= D },
    { id: 'medal_all', icon: 'fa-skull', name: 'Абсолют', desc: `Выполните все ${total} достижений`, req: a => a >= total }
  ];
})();

const ACTIVE_QUESTS = [
  { id: 'act_click_500', type: 'click', target: 500, reward: 6, name: 'Щелкун', desc: 'Сделайте 500 кликов', icon: 'fa-hand-pointer', cooldown: 900000 },
  { id: 'act_earn_5000', type: 'earned', target: 5000, reward: 10, name: 'Добытчик', desc: 'Заработайте 5 000 Теней', icon: 'fa-coins', cooldown: 1800000 },
  { id: 'act_chest_3', type: 'chests_opened', target: 3, reward: 8, name: 'Сундучник', desc: 'Откройте 3 сундука', icon: 'fa-box-open', cooldown: 1200000 },
  { id: 'act_disenchant_5', type: 'disenchants', target: 5, reward: 8, name: 'Разборщик', desc: 'Распылите 5 предметов', icon: 'fa-recycle', cooldown: 1800000 },
  { id: 'act_tower_10', type: 'tower_floors', target: 10, reward: 16, name: 'Высотник', desc: 'Пройдите 10 этажей башни', icon: 'fa-dungeon', cooldown: 3600000 }
];

const STORAGE_KEY = 'tapGameQuests';

export class QuestSystem {
  constructor(game, tower) {
    this.game = game;
    this.tower = tower;
    this.achievementsCompleted = [];
    this.achievementsClaimed = [];
    this.totalClicks = 0;
    this.totalDisenchants = 0;
    this.totalItemsCollected = 0;
    this.totalEarned = 0;
    this.totalTowerFloors = 0;
    this.totalChestsOpened = 0;
    this.collectedUniqueItems = [];
    /** @type {Object.<string, {state:'active'|'completed'|'cooldown', current:number, acceptedAt:number, claimedAt:number}>} */
    this.activeState = {};
    this.load();
  }

  // ─── ranks ────────────────────────────────────────────

  getRank() {
    const n = this.achievementsCompleted.length;
    const total = ACHIEVEMENTS.length;
    if (n >= total) return 'A';
    const step = total / 7;
    if (n >= Math.ceil(step * 6)) return 'B';
    if (n >= Math.ceil(step * 5)) return 'C';
    if (n >= Math.ceil(step * 4)) return 'D';
    if (n >= Math.ceil(step * 3)) return 'E';
    if (n >= Math.ceil(step * 2)) return 'F';
    if (n >= Math.ceil(step * 1)) return 'G';
    return 'H';
  }

  static getRankColor(card) {
    const colors = { A: '#bb86fc', B: '#ff5252', C: '#448aff', D: '#e0e0e0', E: '#e0e0e0', F: '#e0e0e0', G: '#e0e0e0', H: '#e0e0e0' };
    return colors[card] || '#e0e0e0';
  }

  // ─── achievements ─────────────────────────────────────

  getAchievementProgress(type) {
    switch (type) {
      case 'click': return this.totalClicks;
      case 'items_total': return this.totalItemsCollected;
      case 'disenchants': return this.totalDisenchants;
      case 'earned': return this.totalEarned;
      case 'tower_floors': return this.totalTowerFloors;
      case 'chests_opened': return this.totalChestsOpened;
      case 'unique_items': return this.collectedUniqueItems.length;
      default: return 0;
    }
  }

  getAchievements() {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      current: this.getAchievementProgress(a.type),
      completed: this.achievementsCompleted.includes(a.id),
      claimed: this.achievementsClaimed.includes(a.id)
    }));
  }

  getMedals() {
    const n = this.achievementsCompleted.length;
    return MEDALS.map(m => ({ ...m, earned: m.req(n) }));
  }

  getMedalProgress() {
    const done = this.achievementsCompleted.length;
    const total = ACHIEVEMENTS.length;
    const unlocked = MEDALS.filter(m => m.req(done)).length;
    return { done, total, unlocked, totalMedals: MEDALS.length };
  }

  static formatNum(n) {
    if (typeof n !== 'number') return '0';
    if (Number.isInteger(n)) return n.toLocaleString('ru-RU');
    if (n >= 1000) return Math.round(n).toLocaleString('ru-RU');
    return n.toFixed(2);
  }

  checkAchievements() {
    let changed = false;
    ACHIEVEMENTS.forEach(a => {
      if (this.achievementsCompleted.includes(a.id)) return;
      if (this.getAchievementProgress(a.type) >= a.target) {
        this.achievementsCompleted.push(a.id);
        Notification.show(`Достижение: ${a.name}!`);
        changed = true;
      }
    });
    if (changed) this.save();
  }

  claimAchievement(id) {
    if (this.achievementsClaimed.includes(id)) return false;
    if (!this.achievementsCompleted.includes(id)) return false;
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return false;
    this.achievementsClaimed.push(id);
    if (this.tower) {
      this.tower.addShadowShards(ach.reward);
      Notification.show(`Награда получена: ${ach.reward} осколков`);
    }
    this.save();
    return true;
  }

  // ─── active quests ────────────────────────────────────

  /** Returns array of active quests with runtime state injected */
  getActiveQuests() {
    return ACTIVE_QUESTS.map(q => {
      const s = this.activeState[q.id];
      const base = { ...q, current: 0, status: 'available', cooldownRemaining: 0, progress: 0 };

      if (!s) return { ...base, status: 'available', current: this.getAchievementProgress(q.type) };

      if (s.state === 'active') {
        const total = this.getAchievementProgress(q.type);
        const cur = Math.max(0, total - (s.current || 0));
        return { ...base, status: 'active', current: cur, progress: Math.min(100, (cur / q.target) * 100) };
      }

      if (s.state === 'completed') {
        return { ...base, status: 'completed', current: q.target, progress: 100 };
      }

      if (s.state === 'cooldown') {
        const elapsed = Date.now() - s.claimedAt;
        const remaining = Math.max(0, q.cooldown - elapsed);
        return { ...base, status: 'cooldown', cooldownRemaining: remaining, current: 0, progress: 0 };
      }

      return base;
    });
  }

  acceptQuest(id) {
    const q = ACTIVE_QUESTS.find(x => x.id === id);
    if (!q) return false;
    if (this.activeState[q.id]) return false; // already active/completed/cooldown

    this.activeState[q.id] = { state: 'active', current: this.getAchievementProgress(q.type), acceptedAt: Date.now(), claimedAt: 0 };
    this.save();
    Notification.show(`Квест принят: ${q.name}`);
    return true;
  }

  /** Called externally when progress is made – checks if active quests are now complete */
  checkActiveQuests() {
    let changed = false;
    ACTIVE_QUESTS.forEach(q => {
      const s = this.activeState[q.id];
      if (!s || s.state !== 'active') return;
      const cur = this.getAchievementProgress(q.type) - (s.current || 0);
      if (cur >= q.target) {
        s.state = 'completed';
        Notification.show(`Квест выполнен: ${q.name}!`);
        changed = true;
      }
    });
    if (changed) this.save();
  }

  claimActiveQuest(id) {
    const q = ACTIVE_QUESTS.find(x => x.id === id);
    if (!q) return false;
    const s = this.activeState[q.id];
    if (!s || s.state !== 'completed') return false;

    s.state = 'cooldown';
    s.claimedAt = Date.now();

    if (this.tower) {
      this.tower.addShadowShards(q.reward);
      Notification.show(`Награда получена: ${q.reward} осколков`);
    }
    this.save();
    return true;
  }

  /** Returns true if the quest can be accepted right now */
  canAccept(id) {
    const q = ACTIVE_QUESTS.find(x => x.id === id);
    if (!q) return false;
    const s = this.activeState[q.id];
    if (!s) return true;
    if (s.state === 'active' || s.state === 'completed') return false;
    if (s.state === 'cooldown') {
      return Date.now() - s.claimedAt >= q.cooldown;
    }
    return true;
  }

  /** Clean up expired cooldowns and remove stale state */
  cleanActiveCooldowns() {
    let changed = false;
    ACTIVE_QUESTS.forEach(q => {
      const s = this.activeState[q.id];
      if (!s) return;
      if (s.state === 'cooldown' && Date.now() - s.claimedAt >= q.cooldown) {
        delete this.activeState[q.id];
        changed = true;
      }
    });
    if (changed) this.save();
  }

  /** Sync counters from existing game state on startup */
  syncFromInventory() {
    if (!this.game) return;
    // unique items from inventory
    if (this.game.items) {
      this.game.items.forEach(item => {
        if (item.name && !this.collectedUniqueItems.includes(item.name)) {
          this.collectedUniqueItems.push(item.name);
        }
      });
      this.totalItemsCollected = Math.max(this.totalItemsCollected, this.game.items.length);
    }
    // clicks from game clickCounter (accurate lifetime count)
    if (this.game.clickCounter) {
      this.totalClicks = Math.max(this.totalClicks, this.game.clickCounter);
    }
    // tower floors counter — preserved from save, not synced from current floor
    // (no achievements use this type; only active quests track it)
    // validate saved achievements against actual progress
    this.achievementsCompleted = this.achievementsCompleted.filter(id => {
      const a = ACHIEVEMENTS.find(x => x.id === id);
      return a && this.getAchievementProgress(a.type) >= a.target;
    });
    this.achievementsClaimed = this.achievementsClaimed.filter(id => {
      return this.achievementsCompleted.includes(id);
    });
  }

  // ─── event hooks ──────────────────────────────────────

  onClick() {
    this.totalClicks++;
    this.checkAchievements();
    this.checkActiveQuests();
  }

  onItemCollected(itemName) {
    this.totalItemsCollected++;
    if (itemName && !this.collectedUniqueItems.includes(itemName)) {
      this.collectedUniqueItems.push(itemName);
    }
    this.checkAchievements();
    this.checkActiveQuests();
  }

  onChestOpened() {
    this.totalChestsOpened++;
    this.checkAchievements();
    this.checkActiveQuests();
  }

  onDisenchant() {
    this.totalDisenchants++;
    this.checkAchievements();
    this.checkActiveQuests();
  }

  onEarn(amount) {
    if (amount > 0) {
      this.totalEarned = Math.round((this.totalEarned + amount) * 100) / 100;
      this.checkAchievements();
      this.checkActiveQuests();
    }
  }

  onFloorReached() {
    this.totalTowerFloors++;
    this.checkActiveQuests();
  }

  // ─── save / load ──────────────────────────────────────

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        achievementsCompleted: this.achievementsCompleted,
        achievementsClaimed: this.achievementsClaimed,
        totalClicks: this.totalClicks,
        totalDisenchants: this.totalDisenchants,
        totalItemsCollected: this.totalItemsCollected,
        totalEarned: this.totalEarned,
        totalTowerFloors: this.totalTowerFloors,
        totalChestsOpened: this.totalChestsOpened,
        collectedUniqueItems: this.collectedUniqueItems,
        activeState: this.activeState
      }));
    } catch (e) { /* ignore */ }
  }

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!data) return;
      this.achievementsCompleted = data.achievementsCompleted || [];
      this.achievementsClaimed = data.achievementsClaimed || [];
      this.totalClicks = data.totalClicks || 0;
      this.totalDisenchants = data.totalDisenchants || 0;
      this.totalItemsCollected = data.totalItemsCollected || 0;
      this.totalEarned = data.totalEarned || 0;
      this.totalTowerFloors = data.totalTowerFloors || 0;
      this.totalChestsOpened = data.totalChestsOpened || 0;
      this.collectedUniqueItems = data.collectedUniqueItems || [];
      this.activeState = data.activeState || {};
    } catch (e) { /* ignore */ }
  }
}
