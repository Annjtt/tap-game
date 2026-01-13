import { Notification } from './Notification.js';
import { Confetti } from './Confetti.js';

export class CardsDisplay {
  static showCard(card, item, game) {
    // ✅ Показываем конфети
    Confetti.show(card);

    const container = document.createElement('div');
    container.className = 'card-overlay';

    const cardImage = `./src/assets/images/cards/${card.toLowerCase()}.png`;
    const itemImage = item.image;

    container.innerHTML = `
      <div class="card-modal">
        <div class="item-image-container">
          <img src="${itemImage}" alt="${item.name}" class="item-image" />
          <img src="${cardImage}" alt="${card}" class="card-badge" />
        </div>
        <h2>Выпала карта: ${card}</h2>
        <p>${item.name}</p>
        <p>${item.enhancedEffect}</p>
        <button id="disenchant-card" class="disenchant-btn">⚡ Распылить</button>
        <button id="close-card">Закрыть</button>
      </div>
    `;

    document.body.appendChild(container);

    // ✅ Функция закрытия модалки и добавления предмета - передаём game
    const closeAndAddItem = () => {
      game.addItem(item); // Добавляем предмет в инвентарь
      document.body.removeChild(container);
    };

    // Обработчик распыления
    document.getElementById('disenchant-card').addEventListener('click', () => {
      const compensation = CardsDisplay.getCompensation(item);
      game.addCurrency(compensation);
      document.body.removeChild(container);
      Notification.show(`Предмет распылен. Получено: ${compensation} Теней.`);
    });

    // Обработчик закрытия - добавляем предмет в инвентарь
    document.getElementById('close-card').addEventListener('click', () => {
      closeAndAddItem();
    });

    // Автообмен через 5 секунд
    setTimeout(() => {
      if (document.body.contains(container)) {
        closeAndAddItem();
      }
    }, 5000);
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