import { ItemModal } from './ItemModal.js';
import { img } from '../utils/imageHelper.js'; // ✅ Импортируем хелпер

export class InventoryModal {
  constructor(gameCore) {
    this.game = gameCore;
    this.isOpen = false;
  }

  show() {
    if (this.isOpen) return;

    this.isOpen = true;
    const container = document.createElement('div');
    container.className = 'inventory-overlay';
    container.innerHTML = `
      <div class="inventory-modal">
        <h2 class="inventory-title"><i class="fas fa-backpack"></i> Инвентарь</h2>
        <div class="inventory-grid">
          ${this.renderSlots()}
        </div>
        <button id="close-inventory"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `;

    document.body.appendChild(container);

    this.updateSlotListeners(container);

    const updateHandler = () => {
      if (this.isOpen) {
        this.refreshSlots(container);
      }
    };

    document.addEventListener('inventoryUpdated', updateHandler);

    document.getElementById('close-inventory').addEventListener('click', () => {
      document.removeEventListener('inventoryUpdated', updateHandler);
      document.body.removeChild(container);
      this.isOpen = false;
    });
  }

  updateSlotListeners(container) {
    const slots = container.querySelectorAll('.inventory-slot');
    slots.forEach((slot, index) => {
      slot.replaceWith(slot.cloneNode(true));
      const newSlot = container.querySelectorAll('.inventory-slot')[index];

      if (newSlot && this.game.items[index]) {
        newSlot.addEventListener('click', () => {
          const item = this.game.items[index];
          if (item) {
            ItemModal.show(item, this.game);
          }
        });
      }
    });
  }

  refreshSlots(container) {
    const grid = container.querySelector('.inventory-grid');
    grid.innerHTML = this.renderSlots();
    this.updateSlotListeners(container);
  }

  renderSlots() {
    const slots = [];

    for (let i = 0; i < 20; i++) {
      const item = this.game.items[i];
      if (item) {
        // ✅ Используем хелпер для путей
        const itemImage = img(item.image);
        slots.push(`
          <div class="inventory-slot" title="${item.name}">
            <img src="${itemImage}" alt="${item.name}" class="item-icon" />
          </div>
        `);
      } else {
        slots.push(`<div class="inventory-slot empty"></div>`);
      }
    }

    return slots.join('');
  }
}