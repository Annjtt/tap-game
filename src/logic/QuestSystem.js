import { Notification } from '../components/Notification.js';

const ACHIEVEMENTS = [
  { id: 'ach_click_100', type: 'click', target: 100, reward: 5, name: 'Новичок', desc: 'Сделайте 100 кликов', icon: 'fa-hand-pointer' },
  { id: 'ach_click_1000', type: 'click', target: 1000, reward: 15, name: 'Трудяга', desc: 'Сделайте 1 000 кликов', icon: 'fa-hand-pointer' },
  { id: 'ach_click_5000', type: 'click', target: 5000, reward: 30, name: 'Неутомимый', desc: 'Сделайте 5 000 кликов', icon: 'fa-hand-pointer' },
  { id: 'ach_click_25000', type: 'click', target: 25000, reward: 75, name: 'Легенда клика', desc: 'Сделайте 25 000 кликов', icon: 'fa-hand-pointer' },
  { id: 'ach_item_1', type: 'items_total', target: 1, reward: 3, name: 'Коллекционер', desc: 'Соберите 1 предмет', icon: 'fa-box' },
  { id: 'ach_item_5', type: 'items_total', target: 5, reward: 10, name: 'Энтузиаст', desc: 'Соберите 5 предметов', icon: 'fa-box' },
  { id: 'ach_item_10', type: 'items_total', target: 10, reward: 25, name: 'Собиратель', desc: 'Соберите 10 предметов', icon: 'fa-box' },
  { id: 'ach_disenchant_1', type: 'disenchants', target: 1, reward: 2, name: 'Распылитель', desc: 'Распылите 1 предмет', icon: 'fa-recycle' },
  { id: 'ach_disenchant_5', type: 'disenchants', target: 5, reward: 8, name: 'Разрушитель', desc: 'Распылите 5 предметов', icon: 'fa-recycle' },
  { id: 'ach_earn_1000', type: 'earned', target: 1000, reward: 5, name: 'Богач', desc: 'Заработайте 1 000 Теней', icon: 'fa-coins' },
  { id: 'ach_earn_50000', type: 'earned', target: 50000, reward: 25, name: 'Магнат', desc: 'Заработайте 50 000 Теней', icon: 'fa-coins' },
  { id: 'ach_earn_1m', type: 'earned', target: 1000000, reward: 100, name: 'Теневой король', desc: 'Заработайте 1 000 000 Теней', icon: 'fa-crown' }
];

const MEDALS = [
  { id: 'medal_1', icon: 'fa-star', name: 'Начало пути', desc: 'Выполните 1 достижение', req: a => a >= 1 },
  { id: 'medal_3', icon: 'fa-star', name: 'Странник', desc: 'Выполните 3 достижения', req: a => a >= 3 },
  { id: 'medal_6', icon: 'fa-star', name: 'Герой', desc: 'Выполните 6 достижений', req: a => a >= 6 },
  { id: 'medal_9', icon: 'fa-crown', name: 'Легенда', desc: 'Выполните 9 достижений', req: a => a >= 9 },
  { id: 'medal_all', icon: 'fa-skull', name: 'Абсолют', desc: `Выполните все ${ACHIEVEMENTS.length} достижений`, req: a => a >= ACHIEVEMENTS.length }
];

const ACTIVE_QUESTS = [
  { id: 'act_click_500', type: 'click', target: 500, reward: 3, name: 'Щелкун', desc: 'Сделайте 500 кликов', icon: 'fa-hand-pointer', cooldown: 900000 },
  { id: 'act_earn_5000', type: 'earned', target: 5000, reward: 5, name: 'Добытчик', desc: 'Заработайте 5 000 Теней', icon: 'fa-coins', cooldown: 1800000 },
  { id: 'act_item_3', type: 'items_total', target: 3, reward: 4, name: 'Охотник за сокровищами', desc: 'Соберите 3 предмета', icon: 'fa-box', cooldown: 1200000 },
  { id: 'act_disenchant_5', type: 'disenchants', target: 5, reward: 4, name: 'Разборщик', desc: 'Распылите 5 предметов', icon: 'fa-recycle', cooldown: 1800000 },
  { id: 'act_tower_5', type: 'tower_floors', target: 5, reward: 8, name: 'Высотник', desc: 'Пройдите 5 этажей башни', icon: 'fa-dungeon', cooldown: 3600000 }
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
    /** @type {Object.<string, {state:'active'|'completed'|'cooldown', current:number, acceptedAt:number, claimedAt:number}>} */
    this.activeState = {};
    this.load();
  }

  // ─── ranks ────────────────────────────────────────────

  getRank() {
    const n = this.achievementsCompleted.length;
    if (n >= ACHIEVEMENTS.length) return 'A';
    if (n >= 9) return 'B';
    if (n >= 6) return 'C';
    if (n >= 4) return 'D';
    if (n >= 2) return 'E';
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
        const cur = this.getAchievementProgress(q.type);
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

    this.activeState[q.id] = { state: 'active', current: 0, acceptedAt: Date.now(), claimedAt: 0 };
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
      const cur = this.getAchievementProgress(q.type);
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

  // ─── event hooks ──────────────────────────────────────

  onClick() {
    this.totalClicks++;
    this.checkAchievements();
    this.checkActiveQuests();
  }

  onItemCollected() {
    this.totalItemsCollected++;
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

  onFloorReached(floor) {
    if (floor > this.totalTowerFloors) {
      this.totalTowerFloors = floor;
      this.checkActiveQuests();
    }
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
      this.activeState = data.activeState || {};
    } catch (e) { /* ignore */ }
  }
}
