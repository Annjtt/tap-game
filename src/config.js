export const CONFIG = {
    // Валюта
    currencyName: 'Тень',
    baseClickValue: 1,
    baseAutoIncome: 0.5,
  
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
      A: 'images/cards/a.png',
      B: 'images/cards/b.png',
      C: 'images/cards/c.png',
      D: 'images/cards/d.png',
      E: 'images/cards/e.png',
      F: 'images/cards/f.png',
      G: 'images/cards/g.png',
      H: 'images/cards/h.png',
    },
  
    // Башня: процедурная генерация
    towerInfinite: {
      bossInterval: 10,
      checkpointStep: 5,
      // HP врага: baseHP + floor^pow * scaleHP
      // floor 1: ~1100, floor 10: ~4k, floor 25: ~13k, floor 50: ~36k, floor 100: ~100k
      enemyBaseHp: 1000,
      enemyHpScale: 100,
      enemyHpPow: 1.5,
      // Урон врага: baseDmg + floor^pow * scaleDmg
      // floor 1: ~17, floor 10: ~112, floor 25: ~337, floor 50: ~792, floor 100: ~2k
      enemyBaseDmg: 12,
      enemyDmgScale: 5,
      enemyDmgPow: 1.3,
      // Интервал атаки: от max до min
      enemyIntervalBase: 2200,
      enemyIntervalMin: 800,
      enemyIntervalFloorFactor: 12,
      // Множители босса
      bossHpMultiplier: 3,
      bossDmgMultiplier: 2,
      bossRewardMultiplier: 3,
      bossShardMultiplier: 2,
      // Награда: до 13 этажа быстрый рост, после — медленный
      // floor 1: 2k, floor 13: 10.7k, floor 25: 23k, floor 50: 100k, floor 100: 2.8M
      rewardBase: 2000,
      rewardGrowth: 1.15,
      rewardGrowthLate: 1.07,
      rewardSwitchFloor: 13,
      // Осколки: base + floor * perFloor
      shardsBase: 1,
      shardsPerFloor: 0.15,
    },

    // Сохранение
    saveInterval: 30000, // 30 сек
  };