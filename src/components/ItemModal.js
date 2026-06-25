import { Confetti } from './Confetti.js';
import { img } from '../utils/imageHelper.js';

export class ItemModal {
  static show(item, game) {
    const container = document.createElement('div');
    container.className = 'item-overlay';

    const cardImage = item.card ? img(`images/cards/${item.card.toLowerCase()}.png`) : '';
    const itemImage = img(item.image);

    container.innerHTML = `
      <div class="item-modal">
        <div class="item-image-container">
          <img src="${itemImage}" alt="${item.name}" class="item-image" />
          ${cardImage ? `<img src="${cardImage}" alt="${item.card}" class="card-badge" />` : ''}
        </div>
        <div class="item-name">${item.name}</div>
        <div class="item-type-badge ${item.type}">${item.type === 'active' ? 'Активный' : 'Пассивный'}</div>
        <div class="item-stats-block">
          ${ItemModal.getItemStatsHTML(item, game)}
        </div>
        <div class="item-effect">${item.enhancedEffect}</div>
        <button id="disenchant-item" class="disenchant-btn"> Распылить</button>
        <button id="close-item-modal"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `;

    document.body.appendChild(container);

    document.getElementById('disenchant-item').addEventListener('click', () => {
      const compensation = ItemModal.getCompensation(item);
      game.addCurrency(compensation);
      game.removeItem(item);

      Confetti.showDisenchant();

      document.body.removeChild(container);
      alert(`Предмет распылен. Получено: ${compensation} Теней.`);
    });

    document.getElementById('close-item-modal').addEventListener('click', () => {
      document.body.removeChild(container);
    });
  }

  static getItemStatsHTML(item, game) {
    const rankColor = ItemModal.getRankColor(item.card);
    const rows = [];

    if (item.stat === 'click') {
      rows.push(ItemModal.statRow('fa-bolt', 'Сила нажатия', `+${ItemModal.fmt(item.enhancedValue)}`, '#f0e68c'));
    } else if (item.stat === 'auto') {
      rows.push(ItemModal.statRow('fa-coins', 'Авто-доход', `+${ItemModal.fmt(item.enhancedValue)}`, '#f0e68c'));
    }

    switch (item.id) {
      case 'lightning_dagger':
        rows.push(ItemModal.statRow('fa-dice', 'Шанс прока', '5%', '#a29bfe'));
        rows.push(ItemModal.statRow('fa-bolt', 'Множитель прока', '×2', '#74b9ff'));
        break;
      case 'chaos_seal':
        rows.push(ItemModal.statRow('fa-sync-alt', 'Триггер', 'Каждые 10 нажатий', '#a29bfe'));
        rows.push(ItemModal.statRow('fa-bolt', 'Множитель', '×5', '#74b9ff'));
        break;
      case 'gloves_of_rage':
        rows.push(ItemModal.statRow('fa-store', 'Множитель магазина', `×${(game?.shopMultiplier || 1).toFixed(2)}`, '#a29bfe'));
        break;
      case 'eternal_clock':
        rows.push(ItemModal.statRow('fa-hourglass', 'Длительность', '10 сек', '#74b9ff'));
        rows.push(ItemModal.statRow('fa-clock', 'Кулдаун', '120 сек', '#a29bfe'));
        rows.push(ItemModal.statRow('fa-bolt', 'Активный множитель', '×3', '#f0e68c'));
        break;
      case 'scythe_of_gods': {
        const crit = game?.getItemCritValues();
        if (crit) {
          rows.push(ItemModal.statRow('fa-crosshairs', 'Крит. шанс', `+${crit.chance.toFixed(1)}%`, '#ff6b6b'));
          rows.push(ItemModal.statRow('fa-skull', 'Крит. урон', `×${crit.damage.toFixed(2)}`, '#ff6b6b'));
        }
        break;
      }
    }

    rows.push(ItemModal.statRow('fa-crown', 'Ранг', `<span style="color:${rankColor};font-weight:700;">${item.card}</span>`, rankColor));
    rows.push(ItemModal.statRow('fa-percent', 'Множитель ранга', `${ItemModal.fmtPercent(item.bonusMultiplier)}`, rankColor));

    return rows.join('');
  }

  static statRow(icon, label, value, color) {
    return `
      <div class="item-stat-row">
        <span class="item-stat-icon"><i class="fas ${icon}"></i></span>
        <span class="item-stat-label">${label}</span>
        <span class="item-stat-value" style="color:${color}">${value}</span>
      </div>
    `;
  }

  static fmt(v) {
    if (v >= 1) return v.toFixed(2);
    if (v >= 0.01) return v.toFixed(4);
    return v.toFixed(6);
  }

  static fmtPercent(v) {
    return `+${Math.round(v * 100)}%`;
  }

  static getRankColor(card) {
    const colors = { A: '#bb86fc', B: '#ff5252', C: '#448aff', D: '#e0e0e0', E: '#e0e0e0', F: '#e0e0e0', G: '#e0e0e0', H: '#e0e0e0' };
    return colors[card] || '#e0e0e0';
  }

  static getCompensation(item) {
    const multipliers = {
      A: 5000,
      B: 3000,
      C: 1500,
      D: 800,
      E: 500,
      F: 300,
      G: 150,
      H: 50
    };

    return Math.floor(multipliers[item.card] || 50);
  }
}
