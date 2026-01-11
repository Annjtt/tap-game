export function getRandomCard() {
    const chances = {
      A: 0.001,
      B: 0.005,
      C: 0.024,
      D: 0.05,
      E: 0.07,
      F: 0.10,
      G: 0.20,
      H: 0.55
    };
  
    const random = Math.random();
    let sum = 0;
  
    for (const [card, chance] of Object.entries(chances)) {
      sum += chance;
      if (random <= sum) {
        return card;
      }
    }
  
    return 'H'; // fallback
  }