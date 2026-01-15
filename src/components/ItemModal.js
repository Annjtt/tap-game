import { Confetti } from './Confetti.js';
import { img } from '../utils/imageHelper.js'; // ✅ Импортируем хелпер

export class ItemModal {
  static show(item, game) {
    const container = document.createElement('div');
    container.className = 'item-overlay';

    // ✅ Используем хелпер для путей
    const cardImage = item.card ? img(`images/cards/${item.card.toLowerCase()}.png`) : '';
    const itemImage = img(item.image);

    container.innerHTML = `
      <div class="item-modal">
        <div class="item-image-container">
          <img src="${itemImage}" alt="${item.name}" class="item-image" />
          ${cardImage ? `<img src="${cardImage}" alt="${item.card}" class="card-badge" />` : ''}
        </div>
        <div class="item-name">${item.name}</div>
        <div class="item-info">
          <div class="item-effect">${item.enhancedEffect}</div>
        </div>
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