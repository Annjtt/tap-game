import { Notification } from './Notification.js';
import { QuestSystem } from '../logic/QuestSystem.js';
import { img } from '../utils/imageHelper.js';

const ACCORDION_KEY = 'profileAccordionSection';

export class ProfileModal {
  constructor(gameCore, telegram, towerSystem, questSystem) {
    this.game = gameCore;
    this.telegram = telegram;
    this.tower = towerSystem || null;
    this.isOpen = false;
    this.container = null;
    this.quests = questSystem;
    this._activeSection = localStorage.getItem(ACCORDION_KEY) || 'stats';
  }

  static getRankColor(card) {
    const colors = { A: '#bb86fc', B: '#ff5252', C: '#448aff', D: '#e0e0e0', E: '#e0e0e0', F: '#e0e0e0', G: '#e0e0e0', H: '#e0e0e0' };
    return colors[card] || '#e0e0e0';
  }

  show() {
    if (this.isOpen) return;
    this.isOpen = true;

    const user = this.telegram?.initDataUnsafe?.user;
    const playerName = this.game.getPlayerDisplayName(this.telegram);
    const avatarUrl = user?.photo_url || '';
    const username = user?.username || null;
    const userId = user?.id || null;

    const rank = this.quests.getRank();
    const rankColor = QuestSystem.getRankColor(rank);
    const rankImg = img(`images/cards/${rank.toLowerCase()}.png`);

    const critValues = this.game.getItemCritValues();
    const hasCrit = critValues.chance > 0;

    const towerCrit = this.tower ? (() => {
      const shopChance = this.tower.getShopBonus('crit_chance');
      const shopDamage = this.tower.getShopBonus('crit_damage');
      const mods = this.tower.getItemCombatModifiers();
      return {
        chance: shopChance + mods.scytheCritChance,
        multiplier: 2 + (shopDamage + mods.scytheCritDamage) / 100
      };
    })() : null;

    // — achievements (old quests renamed) —
    const achievements = this.quests.getAchievements();
    const achHtml = achievements.map(a => {
      const pct = Math.min(100, Math.round((a.current / a.target) * 100));
      const done = a.completed && a.claimed;
      const ready = a.completed && !a.claimed;
      const curStr = typeof a.current === 'number' && !Number.isInteger(a.current) && a.current < 1000
        ? a.current.toFixed(2) : QuestSystem.formatNum(a.current);
      const tgtStr = QuestSystem.formatNum(a.target);
      return `
        <div class="quest-item ${done ? 'quest--done' : ''} ${ready ? 'quest--ready' : ''}" data-ach-id="${a.id}">
          <div class="quest-icon"><i class="fas ${a.icon}"></i></div>
          <div class="quest-body">
            <div class="quest-name">${a.name}</div>
            <div class="quest-desc">${a.desc}</div>
            <div class="quest-progress">
              <div class="quest-bar-bg">
                <div class="quest-bar-fill" style="width:${pct}%"></div>
              </div>
              <span class="quest-pct">${done ? '✓' : `${curStr}/${tgtStr}`}</span>
            </div>
          </div>
          <div class="quest-reward">
            <span class="quest-reward-val">${a.reward}</span>
            <span class="quest-reward-icon"><i class="fas fa-gem"></i></span>
            ${ready ? '<button class="quest-claim-btn ach-claim"><i class="fas fa-check"></i></button>' : ''}
          </div>
        </div>
      `;
    }).join('');

    // — active quests —
    const activeQuests = this.quests.getActiveQuests();
    const aqHtml = activeQuests.map(q => {
      const canAccept = this.quests.canAccept(q.id);
      let btn = '';
      let cooldownHtml = '';
      if (q.status === 'available' && canAccept) {
        btn = '<button class="aq-btn aq-accept" data-aq-id="' + q.id + '">Принять</button>';
      } else if (q.status === 'active') {
        btn = '<button class="aq-btn aq-active" disabled>Выполняется…</button>';
      } else if (q.status === 'completed') {
        btn = '<button class="aq-btn aq-claim" data-aq-id="' + q.id + '">Забрать</button>';
      } else if (q.status === 'cooldown') {
        const rem = q.cooldownRemaining;
        const min = Math.floor(rem / 60000);
        const sec = Math.floor((rem % 60000) / 1000);
        cooldownHtml = `<span class="aq-cooldown">${min}:${String(sec).padStart(2, '0')}</span>`;
        btn = '<button class="aq-btn aq-cooldown-btn" disabled>Ожидание</button>';
      } else {
        btn = '<button class="aq-btn aq-accept" data-aq-id="' + q.id + '">Принять</button>';
      }
      const prog = q.status === 'active' ? q.progress : 0;
      return `
        <div class="aq-item" data-aq-id="${q.id}">
          <div class="aq-top">
            <div class="aq-icon"><i class="fas ${q.icon}"></i></div>
            <div class="aq-body">
              <div class="aq-name">${q.name}</div>
              <div class="aq-desc">${q.desc}</div>
            </div>
            <div class="aq-actions">
              ${cooldownHtml}
              ${btn}
            </div>
          </div>
          ${q.status === 'active' ? `
          <div class="aq-progress">
            <div class="quest-bar-bg">
              <div class="quest-bar-fill" style="width:${prog}%"></div>
            </div>
            <span class="aq-prog-text">${QuestSystem.formatNum(Math.min(q.current, q.target))}/${QuestSystem.formatNum(q.target)}</span>
          </div>` : ''}
          <div class="aq-reward-line">
            <i class="fas fa-gem"></i> ${q.reward}
          </div>
        </div>
      `;
    }).join('');

    // — medals —
    const allMedals = this.quests.getMedals();
    const medalProgress = this.quests.getMedalProgress();
    const achPct = Math.min(100, Math.round((medalProgress.done / medalProgress.total) * 100));
    const medalsHtml = `<div class="medals-grid">${allMedals.map((m, i) => {
      const c = m.earned ? rankColor : '#444';
      return `
        <div class="medal-item ${m.earned ? 'medal--earned' : 'medal--locked'}" data-medal-idx="${i}">
          <i class="fas ${m.icon}" style="color:${c}"></i>
          <span class="medal-name">${m.name}</span>
        </div>
      `;
    }).join('')}</div>`;
    const firstEarned = allMedals.findIndex(m => m.earned);
    const defaultMedalIdx = firstEarned >= 0 ? firstEarned : 0;
    const selectedMedal = allMedals[defaultMedalIdx];
    const medalsExtraHtml = `
      <div class="medal-progress-area">
        <div class="medal-progress-header">
          <span><i class="fas fa-trophy"></i> Достижения</span>
          <span class="medal-progress-count">${medalProgress.done} / ${medalProgress.total}</span>
        </div>
        <div class="quest-bar-bg">
          <div class="quest-bar-fill" style="width:${achPct}%"></div>
        </div>
        <div class="medal-progress-sub">Медалей получено: ${medalProgress.unlocked} / ${medalProgress.totalMedals}</div>
      </div>
      <div class="medal-desc-box" id="medal-desc">
        <div class="medal-desc-icon"><i class="fas ${selectedMedal.icon}" style="color:${selectedMedal.earned ? rankColor : '#444'}"></i></div>
        <div class="medal-desc-text">
          <div class="medal-desc-name">${selectedMedal.name}</div>
          <div class="medal-desc-body">${selectedMedal.desc}</div>
        </div>
      </div>
    `;

    const towerSection = this.tower ? `
      <h3><i class="fas fa-dungeon"></i> Башня Теней</h3>
      <div class="stat-item"><span class="stat-label"><i class="fas fa-layer-group"></i> Этаж:</span><span class="stat-value">${this.tower.getState().currentFloor}</span></div>
      <div class="stat-item"><span class="stat-label"><i class="fas fa-trophy"></i> Рекорд:</span><span class="stat-value">${this.tower.getState().highestFloor}</span></div>
      <div class="stat-item"><span class="stat-label"><i class="fas fa-gem"></i> Осколков:</span><span class="stat-value">${this.tower.getShadowShards()}</span></div>
      <div class="stat-item"><span class="stat-label"><i class="fas fa-bolt"></i> Базовый урон:</span><span class="stat-value">${this.tower.getBaseTowerDamage().toFixed(2)}</span></div>
      <div class="stat-item"><span class="stat-label"><i class="fas fa-heart"></i> Макс. HP:</span><span class="stat-value">${this.tower.getMaxHp()}</span></div>
      <div class="stat-item"><span class="stat-label"><i class="fas fa-heart-pulse"></i> Отхил с урона:</span><span class="stat-value">${this.tower.getRegenPercent()}%</span></div>
      <div class="stat-item"><span class="stat-label"><i class="fas fa-crosshairs"></i> Крит шанс:</span><span class="stat-value">${towerCrit.chance.toFixed(1)}%</span></div>
      <div class="stat-item"><span class="stat-label"><i class="fas fa-skull"></i> Крит урон:</span><span class="stat-value">×${towerCrit.multiplier.toFixed(2)}</span></div>
      <button id="reset-tower-shop" class="reset-btn"><i class="fas fa-dungeon"></i> Сбросить улучшения башни</button>
    ` : '';

    // stats content
    const statsHtml = `
      <div class="stat-item"><span class="stat-label"><i class="fas fa-coins"></i> Теней:</span><span class="stat-value" data-key="currency">${this.game.getCurrency().toFixed(2)}</span></div>
      <div class="stat-item"><span class="stat-label"><i class="fas fa-hand-pointer"></i> Сила нажатия:</span><span class="stat-value">${this.game.getClickValue().toFixed(2)}</span></div>
      <div class="stat-item"><span class="stat-label"><i class="fas fa-arrow-trend-up"></i> Авто-доход:</span><span class="stat-value">${this.game.getAutoIncome().toFixed(2)}</span></div>
      <div class="stat-item"><span class="stat-label"><i class="fas fa-box"></i> Предметов:</span><span class="stat-value">${this.game.items.length}</span></div>
      ${hasCrit ? `
        <div class="stat-item"><span class="stat-label"><i class="fas fa-crosshairs"></i> Крит шанс:</span><span class="stat-value">${critValues.chance.toFixed(1)}%</span></div>
        <div class="stat-item"><span class="stat-label"><i class="fas fa-skull"></i> Крит урон:</span><span class="stat-value">×${critValues.damage.toFixed(2)}</span></div>
      ` : ''}
      <button id="reset-shop" class="reset-btn"><i class="fas fa-store"></i> Сбросить улучшения</button>
      ${this.tower ? `<div class="tower-stats-inline">${towerSection}</div>` : ''}
    `;

    const sections = [
      { id: 'stats', label: 'Статистика', icon: 'fa-chart-simple', bodyClass: '', html: statsHtml },
      { id: 'active-quests', label: 'Активные квесты', icon: 'fa-scroll', bodyClass: '', html: aqHtml },
      { id: 'achievements', label: 'Достижения', icon: 'fa-trophy', bodyClass: '', html: achHtml },
      { id: 'medals', label: 'Награды', icon: 'fa-medal', bodyClass: '', html: medalsHtml + medalsExtraHtml }
    ];

    // one section open at a time
    sections.forEach(s => {
      if (s.id === this._activeSection) s.bodyClass = 'section-body--open';
    });

    this.container = document.createElement('div');
    this.container.className = 'profile-overlay';
    this.container.innerHTML = `
      <div class="profile-modal">
        <div class="profile-header">
          ${avatarUrl ? `<img src="${avatarUrl}" alt="Avatar" class="profile-avatar">` : '<div class="profile-avatar profile-avatar--placeholder"><i class="fas fa-user"></i></div>'}
          <div class="profile-info">
            <div class="profile-name-row">
              <h2 class="profile-name">${playerName}</h2>
              <img src="${rankImg}" alt="${rank}" class="profile-rank-badge" style="border-color:${rankColor}" title="Ранг ${rank}" />
            </div>
            ${username ? `<p class="profile-username">@${username}</p>` : ''}
            ${userId ? `<p class="profile-id">ID: ${userId}</p>` : ''}
          </div>
        </div>

        ${sections.map(s => `
          <div class="profile-section">
            <div class="section-header" data-section="${s.id}">
              <span><i class="fas ${s.icon}"></i> ${s.label}</span>
              <span class="section-arrow"><i class="fas fa-chevron-down"></i></span>
            </div>
            <div class="section-body ${s.bodyClass}" data-section-body="${s.id}">
              ${s.html}
            </div>
          </div>
        `).join('')}

        <button id="close-profile"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `;

    document.body.appendChild(this.container);
    this.bindActions();
    this.animateSection(this._activeSection);

    this._boundCurrencyUpdate = () => {
      const el = this.container?.querySelector('[data-key="currency"]');
      if (el) el.textContent = this.game.getCurrency().toFixed(2);
    };
    document.addEventListener('currencyChanged', this._boundCurrencyUpdate);
  }

  hide() {
    if (!this.isOpen || !this.container) return;
    if (this._boundCurrencyUpdate) {
      document.removeEventListener('currencyChanged', this._boundCurrencyUpdate);
      this._boundCurrencyUpdate = null;
    }
    if (this.container.parentNode) this.container.parentNode.removeChild(this.container);
    this.container = null;
    this.isOpen = false;
  }

  /** Animate all .stat-value elements inside the given section body */
  animateSection(sectionId) {
    const body = this.container?.querySelector(`[data-section-body="${sectionId}"]`);
    if (!body) return;
    const items = body.querySelectorAll('.stat-value');
    items.forEach(el => {
      const text = el.textContent.trim();
      const match = text.match(/^[×]?([\d.]+)(%?)$/);
      if (!match) return;
      const prefix = text.startsWith('×') ? '×' : '';
      const suffix = match[2] || '';
      const target = parseFloat(match[1]);
      const decimals = (match[1].split('.')[1] || '').length;
      el.dataset.target = target;
      el.textContent = prefix + (decimals > 0 ? '0.' + '0'.repeat(decimals) : '0');
      this.animateValue(el, target, 600, prefix, suffix, decimals);
    });
  }

  animateValue(element, target, duration, prefix, suffix, decimals) {
    let start;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      if (element.parentNode) element.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else if (element.parentNode) element.textContent = prefix + target.toFixed(decimals) + suffix;
    };
    requestAnimationFrame(step);
  }

  _toggleSection(sectionId) {
    if (sectionId === this._activeSection) {
      // Toggle off
      const body = this.container.querySelector(`[data-section-body="${sectionId}"]`);
      if (body) body.classList.remove('section-body--open');
      this._activeSection = null;
      localStorage.removeItem(ACCORDION_KEY);
    } else {
      // Close previous
      if (this._activeSection) {
        const prev = this.container.querySelector(`[data-section-body="${this._activeSection}"]`);
        if (prev) prev.classList.remove('section-body--open');
      }
      // Open new
      const body = this.container.querySelector(`[data-section-body="${sectionId}"]`);
      if (body) body.classList.add('section-body--open');
      this._activeSection = sectionId;
      localStorage.setItem(ACCORDION_KEY, sectionId);
      this.animateSection(sectionId);
    }
  }

  bindActions() {
    this.container.querySelector('#close-profile')?.addEventListener('click', () => this.hide());

    this.container.querySelectorAll('.section-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        this._toggleSection(hdr.dataset.section);
      });
    });

    this.container.querySelector('#reset-shop')?.addEventListener('click', () => {
      if (!this.game.shopSystem) { Notification.show('Система магазина недоступна'); return; }
      const doReset = () => {
        const refund = this.game.shopSystem.resetAllUpgrades();
        Notification.show(`Улучшения сброшены. Возвращено: ${refund} Теней`);
        this.hide();
      };
      if (this.telegram?.showConfirm) this.telegram.showConfirm('Все улучшения магазина будут сброшены, Тени вернутся.', (ok) => { if (ok) doReset(); });
      else doReset();
    });

    const towerResetBtn = this.container.querySelector('#reset-tower-shop');
    if (towerResetBtn) {
      towerResetBtn.addEventListener('click', () => {
        const doReset = () => {
          const refund = this.tower.resetShopUpgrades();
          Notification.show(`Улучшения башни сброшены. Возвращено: ${refund} осколков`);
          this.hide();
        };
        if (this.telegram?.showConfirm) this.telegram.showConfirm('Все улучшения башни будут сброшены, осколки вернутся.', (ok) => { if (ok) doReset(); });
        else doReset();
      });
    }

    // Achievements claim
    this.container.querySelectorAll('.ach-claim').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = btn.closest('[data-ach-id]');
        const id = item?.dataset.achId;
        if (id && this.quests.claimAchievement(id)) {
          item.classList.remove('quest--ready');
          item.classList.add('quest--done');
          btn.remove();
        }
      });
    });

    // Active quest accept
    this.container.querySelectorAll('.aq-accept').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.aqId;
        if (id && this.quests.acceptQuest(id)) {
          this._rebuildActiveQuests();
        }
      });
    });

    // Active quest claim
    this.container.querySelectorAll('.aq-claim').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.aqId;
        if (id && this.quests.claimActiveQuest(id)) {
          this._rebuildActiveQuests();
        }
      });
    });

    // Medal selection
    this.container.querySelectorAll('.medal-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(el.dataset.medalIdx, 10);
        const allMedals = this.quests.getMedals();
        const m = allMedals[idx];
        if (!m) return;
        const rc = QuestSystem.getRankColor(this.quests.getRank());
        const descBox = this.container.querySelector('#medal-desc');
        if (descBox) {
          descBox.innerHTML = `
            <div class="medal-desc-icon"><i class="fas ${m.icon}" style="color:${m.earned ? rc : '#444'}"></i></div>
            <div class="medal-desc-text">
              <div class="medal-desc-name">${m.name}</div>
              <div class="medal-desc-body">${m.desc}</div>
            </div>
          `;
        }
        this.container.querySelectorAll('.medal-item').forEach(x => x.classList.remove('medal--selected'));
        el.classList.add('medal--selected');
      });
    });
  }

  _rebuildActiveQuests() {
    const body = this.container?.querySelector('[data-section-body="active-quests"]');
    if (!body) return;
    const qs = this.quests.getActiveQuests();
    body.innerHTML = qs.map(q => {
      const canAccept = this.quests.canAccept(q.id);
      let btn = '';
      let cooldownHtml = '';
      if (q.status === 'available' && canAccept) {
        btn = '<button class="aq-btn aq-accept" data-aq-id="' + q.id + '">Принять</button>';
      } else if (q.status === 'active') {
        btn = '<button class="aq-btn aq-active" disabled>Выполняется…</button>';
      } else if (q.status === 'completed') {
        btn = '<button class="aq-btn aq-claim" data-aq-id="' + q.id + '">Забрать</button>';
      } else if (q.status === 'cooldown') {
        const rem = q.cooldownRemaining;
        const min = Math.floor(rem / 60000);
        const sec = Math.floor((rem % 60000) / 1000);
        cooldownHtml = `<span class="aq-cooldown">${min}:${String(sec).padStart(2, '0')}</span>`;
        btn = '<button class="aq-btn aq-cooldown-btn" disabled>Ожидание</button>';
      } else {
        btn = '<button class="aq-btn aq-accept" data-aq-id="' + q.id + '">Принять</button>';
      }
      const prog = q.status === 'active' ? q.progress : 0;
      return `
        <div class="aq-item" data-aq-id="${q.id}">
          <div class="aq-top">
            <div class="aq-icon"><i class="fas ${q.icon}"></i></div>
            <div class="aq-body">
              <div class="aq-name">${q.name}</div>
              <div class="aq-desc">${q.desc}</div>
            </div>
            <div class="aq-actions">
              ${cooldownHtml}
              ${btn}
            </div>
          </div>
          ${q.status === 'active' ? `
          <div class="aq-progress">
            <div class="quest-bar-bg">
              <div class="quest-bar-fill" style="width:${prog}%"></div>
            </div>
            <span class="aq-prog-text">${QuestSystem.formatNum(Math.min(q.current, q.target))}/${QuestSystem.formatNum(q.target)}</span>
          </div>` : ''}
          <div class="aq-reward-line">
            <i class="fas fa-gem"></i> ${q.reward}
          </div>
        </div>
      `;
    }).join('');

    // Re-bind buttons
    body.querySelectorAll('.aq-accept').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.quests.acceptQuest(btn.dataset.aqId)) this._rebuildActiveQuests();
      });
    });
    body.querySelectorAll('.aq-claim').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.quests.claimActiveQuest(btn.dataset.aqId)) this._rebuildActiveQuests();
      });
    });
  }
}
