import { CONFIG } from './config.js';
import { GameCore } from './logic/gameCore.js';
import { ChestSystem } from './logic/chestSystem.js';
import { CardsDisplay } from './components/CardsDisplay.js';
import { InventoryModal } from './components/InventoryModal.js';
import { ShopModal } from './components/ShopModal.js';
import { ProfileModal } from './components/ProfileModal.js';

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

// Создаём магазин
const shopModal = new ShopModal(game);
const shopSystem = shopModal.shop;

// Передаём систему магазина в gameCore
game.shopSystem = shopSystem;

// DOM элементы
const currencyDisplay = document.getElementById('currency');
const clicker = document.getElementById('clicker');
const openChestBtn = document.getElementById('open-chest');
const inventoryBtn = document.getElementById('inventory-btn');
const shopBtn = document.getElementById('shop');
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

// Обработчики событий
clicker.addEventListener('click', () => {
  game.addCurrency(game.getClickValue());
  animateClicker();
});

// Система сундуков
const chestSystem = new ChestSystem(game);

openChestBtn.addEventListener('click', () => {
  const result = chestSystem.openChest();
  if (result) {
    CardsDisplay.showCard(result.card, result.item, game);
  }
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

// Профиль
const profileModal = new ProfileModal(game, Telegram);

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
}, CONFIG.saveInterval);

// Запускаем авто-доход
game.startAutoIncome();

// Первое обновление
updateCurrencyDisplay();

console.log('🎮 Игра запущена. Нажимай!');