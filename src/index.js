import { CONFIG } from './config.js';
import { GameCore } from './logic/gameCore.js';
import { InventoryModal } from './components/InventoryModal.js';
import { ShopModal } from './components/ShopModal.js';
import { ProfileModal } from './components/ProfileModal.js';
import { ChestShopModal } from './components/ChestShopModal.js';
import { VisualEffects } from './components/VisualEffects.js';
import { ActiveItemsHud } from './components/ActiveItemsHud.js';
import { TowerSystem } from './logic/towerSystem.js';
import { TowerModal } from './components/TowerModal.js';
import { QuestSystem } from './logic/QuestSystem.js';

// Инициализация Telegram
const Telegram = window.Telegram?.WebApp;

if (Telegram) {
  Telegram.ready();
  Telegram.expand();
} else {
  console.warn("Telegram Web App SDK не загружен");
}

// Создаём ядро игры
const game = new GameCore();
game.loadProgress();

// Создаём магазин и передаём его в gameCore
const shopModal = new ShopModal(game);
const shopSystem = shopModal.shop;
game.shopSystem = shopSystem;

// DOM элементы
const currencyDisplay = document.getElementById('currency');
const clicker = document.getElementById('clicker');
const openChestBtn = document.getElementById('open-chest');
const inventoryBtn = document.getElementById('inventory-btn');
const shopBtn = document.getElementById('shop');
const towerEntryBtn = document.getElementById('tower-entry-btn');
const profileBtn = document.getElementById('profile');

// Обновление валюты
function updateCurrencyDisplay() {
  currencyDisplay.textContent = formatNumber(game.getCurrency());
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
}

const towerSystem = new TowerSystem(game, Telegram);
const towerModal = new TowerModal(towerSystem, () => profileModal.show());

// Создаём систему квестов (после tower, чтобы передать ссылку)
const questSystem = new QuestSystem(game, towerSystem);
game.questSystem = questSystem;
questSystem.syncFromInventory();
questSystem.cleanActiveCooldowns();

// Обработчики событий
clicker.addEventListener('click', (event) => {
  // Устанавливаем позиционирование при первом клике
  if (getComputedStyle(clicker).position === 'static') {
    clicker.style.position = 'relative';
  }
  
  const clickSummary = game.handleClick();
  VisualEffects.showFloatingGain(event.clientX, event.clientY, clickSummary.amount, {
    sourceItemId: clickSummary.sourceItemId,
    isEternalClockActive: clickSummary.isEternalClockActive
  });
  animateClicker();
});

// ✅ Магазин сундуков
const chestShopModal = new ChestShopModal(game);

openChestBtn.addEventListener('click', () => {
  chestShopModal.show(); // Теперь открывает магазин сундуков
});

// Инвентарь
const inventoryModal = new InventoryModal(game);

inventoryBtn.addEventListener('click', () => {
  inventoryModal.show();
});

// Магазин
shopBtn.addEventListener('click', () => {
  shopModal.show();
});

if (towerEntryBtn) {
  towerEntryBtn.addEventListener('click', () => {
    towerModal.show();
  });
} else {
  console.warn('Кнопка входа в Башню Теней не найдена в DOM');
}

// Профиль - создаём после передачи shopSystem и questSystem
const profileModal = new ProfileModal(game, Telegram, towerSystem, questSystem);
const activeItemsHud = new ActiveItemsHud(game);
activeItemsHud.init();

profileBtn.addEventListener('click', () => {
  profileModal.show();
});

// Анимация клика
function animateClicker() {
  clicker.style.transform = 'scale(0.9)';
  setTimeout(() => {
    clicker.style.transform = 'scale(1)';
  }, 100);
}

// Слушаем изменения валюты
document.addEventListener('currencyChanged', updateCurrencyDisplay);

// Автосохранение
setInterval(() => {
  game.saveProgress();
  towerSystem.saveProgress();
}, CONFIG.saveInterval);

// Запускаем авто-доход
game.startAutoIncome();

// Первое обновление
updateCurrencyDisplay();

console.log('🎮 Игра запущена. Нажимай!');
