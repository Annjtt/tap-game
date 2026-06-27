import { Confetti } from './Confetti.js';
import { img } from '../utils/imageHelper.js';
import itemsData from '../data/items.json';

export class ChestOpeningAnimation {
  static getRankColor(card) {
    const colors = { A: '#bb86fc', B: '#ff5252', C: '#448aff', D: '#e0e0e0', E: '#e0e0e0', F: '#e0e0e0', G: '#e0e0e0', H: '#e0e0e0' };
    return colors[card] || '#e0e0e0';
  }

  static getRandomRank() {
    const ranks = ['H', 'H', 'H', 'H', 'H', 'G', 'G', 'G', 'F', 'F', 'E', 'D', 'C', 'B', 'A'];
    return ranks[Math.floor(Math.random() * ranks.length)];
  }

  static generateFillerItems(count) {
    const items = [];
    for (let i = 0; i < count; i++) {
      const base = itemsData[Math.floor(Math.random() * itemsData.length)];
      const rank = this.getRandomRank();
      items.push({ ...base, card: rank });
    }
    return items;
  }

  static createSparkle(container, color, delay) {
    const size = Math.random() * 8 + 4;
    const sparkle = document.createElement('div');
    sparkle.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 10 10">
      <polygon points="5,0 6.5,3.5 10,5 6.5,6.5 5,10 3.5,6.5 0,5 3.5,3.5" fill="${color}" opacity="0.8"/>
    </svg>`;
    const el = sparkle.firstElementChild;
    el.style.position = 'absolute';
    el.style.left = `${Math.random() * 80 + 10}%`;
    el.style.top = `${Math.random() * 80 + 10}%`;
    el.style.animation = `sparkleFloat ${Math.random() * 1.5 + 1.5}s ease-out ${delay}s forwards`;
    el.style.opacity = '0';
    container.appendChild(el);
  }

  static play(chest, item, card, game) {
    return new Promise((resolve) => {
      const rankColor = this.getRankColor(card);
      const overlay = document.createElement('div');
      overlay.className = 'chest-opening-overlay';
      document.body.appendChild(overlay);

      for (let i = 0; i < 12; i++) {
        this.createSparkle(overlay, rankColor, Math.random() * 0.6);
      }

      const chestImg = img(chest.image);
      overlay.innerHTML = `
        <div class="chest-opening-center">
          <div class="chest-glow-ring" style="--glow-color: ${chest.color || '#888'}"></div>
          <div class="chest-opening-chest">
            <img src="${chestImg}" alt="${chest.name}" />
          </div>
          <div class="chest-opening-label">Открытие...</div>
        </div>
      `;

      const chestEl = overlay.querySelector('.chest-opening-chest');

      setTimeout(() => {
        chestEl.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease';
        chestEl.style.transform = 'scale(1.6)';
        chestEl.style.opacity = '0';

        const glowRing = overlay.querySelector('.chest-glow-ring');
        glowRing.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        glowRing.style.transform = 'scale(2.5)';
        glowRing.style.opacity = '0';

        const label = overlay.querySelector('.chest-opening-label');
        if (label) label.style.display = 'none';

        setTimeout(() => {
          overlay.querySelector('.chest-opening-center').remove();
          this.startSlotPhase(overlay, item, card, rankColor, () => {
            setTimeout(() => {
              overlay.remove();
              resolve();
            }, 400);
          });
        }, 450);
      }, 900);
    });
  }

  static startSlotPhase(overlay, finalItem, finalCard, rankColor, onComplete) {
    const fillerItems = this.generateFillerItems(20);
    const allItems = [...fillerItems, { ...finalItem, card: finalCard }];

    const slotCenter = document.createElement('div');
    slotCenter.className = 'slot-center';
    overlay.appendChild(slotCenter);

    slotCenter.innerHTML = `
      <div class="slot-window" id="slot-window">
        <div class="slot-stage" id="slot-stage">
          <div class="slot-item-display">
            <img src="${img(allItems[0].image)}" class="slot-item-img" id="slot-img" />
            <span class="slot-item-name" id="slot-name">${allItems[0].name}</span>
            <span class="slot-item-rank" id="slot-rank" style="color: ${this.getRankColor(allItems[0].card)}">${allItems[0].card}</span>
          </div>
        </div>
      </div>
      <div class="slot-label">Определяем предмет...</div>
    `;

    const stage = slotCenter.querySelector('#slot-stage');
    const imgEl = slotCenter.querySelector('#slot-img');
    const nameEl = slotCenter.querySelector('#slot-name');
    const rankEl = slotCenter.querySelector('#slot-rank');
    const label = slotCenter.querySelector('.slot-label');
    const windowEl = slotCenter.querySelector('#slot-window');

    const totalDuration = 2200;
    const startTime = performance.now();
    let currentIdx = 0;

    const renderItem = (idx) => {
      const si = allItems[idx];
      if (!si) return;
      const isFinal = idx === allItems.length - 1;

      imgEl.src = img(si.image);
      imgEl.alt = si.name;
      nameEl.textContent = si.name;
      const c = this.getRankColor(si.card);
      rankEl.textContent = si.card;
      rankEl.style.color = c;

      if (isFinal) {
        rankEl.style.fontSize = '1.3rem';
        nameEl.style.color = c;
        nameEl.style.fontWeight = '700';
      } else {
        rankEl.style.fontSize = '0.9rem';
        nameEl.style.color = '';
        nameEl.style.fontWeight = '';
      }
    };

    const tick = () => {
      stage.style.transform = 'scale(0.95)';
      stage.style.opacity = '0.7';
      setTimeout(() => {
        stage.style.transform = 'scale(1)';
        stage.style.opacity = '1';
      }, 80);
    };

    const step = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const targetIdx = Math.floor(eased * (allItems.length - 1));

      if (targetIdx !== currentIdx) {
        currentIdx = targetIdx;
        renderItem(currentIdx);
        tick();
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        currentIdx = allItems.length - 1;
        renderItem(currentIdx);

        if (label) label.textContent = '';

        windowEl.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
        windowEl.style.boxShadow = `0 0 50px ${rankColor}, inset 0 0 25px ${rankColor}33`;
        windowEl.style.borderColor = rankColor;

        stage.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
        stage.style.transform = 'scale(1.05)';

        for (let i = 0; i < 8; i++) {
          this.createSparkle(overlay, rankColor, Math.random() * 0.3);
        }

        Confetti.show(finalCard);

        setTimeout(() => {
          onComplete();
        }, 800);
      }
    };

    requestAnimationFrame(step);
  }
}
