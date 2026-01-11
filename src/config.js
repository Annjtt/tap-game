export const CONFIG = {
    // Валюта
    currencyName: 'Тень',
    baseClickValue: 1,
  
    // Шансы на карты (оптимизировано)
    cardChances: {
      A: 0.001,  // 0.1%
      B: 0.005,  // 0.5%
      C: 0.024,  // 2.4%
      D: 0.05,   // 5%
      E: 0.07,   // 7%
      F: 0.10,   // 10%
      G: 0.20,   // 20%
      H: 0.55,   // 55%
    },
  
    // Цены
    chestCost: 1000,
  
    // Пути к изображениям
    cardImages: {
      A: './assets/images/cards/a.png',
      B: './assets/images/cards/b.png',
      C: './assets/images/cards/c.png',
      D: './assets/images/cards/d.png',
      E: './assets/images/cards/e.png',
      F: './assets/images/cards/f.png',
      G: './assets/images/cards/g.png',
      H: './assets/images/cards/h.png',
    },
  
    // Сохранение
    saveInterval: 30000, // 30 сек
  };