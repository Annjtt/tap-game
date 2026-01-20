import { Notification } from './Notification.js';
import { Confetti } from './Confetti.js';
import { img } from '../utils/imageHelper.js'; // ✅ Импортируем хелпер

export class CardsDisplay {
  static showCard(card, item, game) {
    console.log('CardsDisplay.showCard вызван', { card, item, game }); // ✅ Отладка
  
    Confetti.show(card);
  
    const container = document.createElement('div');
    container.className = 'card-overlay';
  
    // ✅ Используем хелпер для путей
    const cardImage = img(`images/cards/${card.toLowerCase()}.png`);
    const itemImage = img(item.image);
  
    container.innerHTML = `
      <div class="card-modal">
        <div class="item-image-container">
          <img src="${itemImage}" alt="${item.name}" class="item-image" />
          <img src="${cardImage}" alt="${card}" class="card-badge" />
        </div>
        <h2>${item.name}</h2>
        <p>Карта ранга: ${card}</p>
        <p>${item.enhancedEffect}</p>
        <button id="disenchant-card" class="disenchant-btn">Распылить</button>
        <button id="close-card">Закрыть</button>
      </div>
    `;
  
    document.body.appendChild(container);
  
    const closeAndAddItem = () => {
      console.log('Добавляем предмет:', item); // ✅ Отладка
      game.addItem(item);
      document.body.removeChild(container);
    };
  
    document.getElementById('disenchant-card').addEventListener('click', () => {
      const compensation = CardsDisplay.getCompensation(item);
      game.addCurrency(compensation);
      document.body.removeChild(container);
      Notification.show(`Предмет распылен. Получено: ${compensation} Теней.`);
    });
  
    document.getElementById('close-card').addEventListener('click', () => {
      console.log('Клик по кнопке "Закрыть"'); // ✅ Отладка
      closeAndAddItem();
    });
  
    setTimeout(() => {
      if (document.body.contains(container)) {
        console.log('Автозакрытие модалки'); // ✅ Отладка
        closeAndAddItem();
      }
    }, 10000);
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