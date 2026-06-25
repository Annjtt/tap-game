import { ItemModal } from './ItemModal.js';
import { img } from '../utils/imageHelper.js';

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
        newSlot.addEventListener('click', (e) => {
          if (e.target.closest('.slot-tooltip')) return;
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

  getRankColor(card) {
    const colors = { A: '#bb86fc', B: '#ff5252', C: '#448aff', D: '#e0e0e0', E: '#e0e0e0', F: '#e0e0e0', G: '#e0e0e0', H: '#e0e0e0' };
    return colors[card] || '#e0e0e0';
  }

  renderSlots() {
    const slots = [];

    for (let i = 0; i < 20; i++) {
      const item = this.game.items[i];
      if (item) {
        const itemImage = img(item.image);
        const rankColor = this.getRankColor(item.card);
        let statPreview = '';

        if (item.stat === 'click') {
          statPreview = `<div class="tooltip-stat"><i class="fas fa-bolt"></i> +${ItemModal.fmt(item.enhancedValue)}</div>`;
        } else if (item.stat === 'auto') {
          statPreview = `<div class="tooltip-stat"><i class="fas fa-coins"></i> +${ItemModal.fmt(item.enhancedValue)}</div>`;
        }

        slots.push(`
          <div class="inventory-slot" data-index="${i}">
            <img src="${itemImage}" alt="${item.name}" class="item-icon" />
            <span class="slot-card-badge" style="background:${rankColor};color:#1a1a1a;">${item.card}</span>
            <div class="slot-tooltip">
              <div class="tooltip-name">${item.name}</div>
              <div class="tooltip-rank" style="color:${rankColor}">Ранг ${item.card}</div>
              <div class="tooltip-stats">
                ${statPreview}
              </div>
            </div>
          </div>
        `);
      } else {
        slots.push(`<div class="inventory-slot empty"></div>`);
      }
    }

    return slots.join('');
  }
}
