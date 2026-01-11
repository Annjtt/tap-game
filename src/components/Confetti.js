export class Confetti {
    static show(card) {
      const colors = {
        A: '#6a0dad', // Фиолетовый
        B: '#cc0000', // Красный
        C: '#0066cc', // Синий
        D: '#ffffff', // Белый
        E: '#888888', // Серый
        F: '#777777',
        G: '#666666',
        H: '#555555'
      };
  
      const color = colors[card] || '#444444';
  
      // Находим центр экрана (где будет карточка)
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
  
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = color;
        confetti.style.opacity = Math.random() * 0.5 + 0.5;
        confetti.style.width = `${Math.random() * 25 + 10}px`; // 20–40px
        confetti.style.height = confetti.style.width;
        confetti.style.borderRadius = '50%';
        confetti.style.position = 'fixed';
        confetti.style.left = `${centerX}px`;
        confetti.style.top = `${centerY}px`;
        confetti.style.zIndex = '999';
  
        document.body.appendChild(confetti);
  
        // Случайное направление движения
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 250 + 250;
        const moveX = Math.cos(angle) * distance;
        const moveY = Math.sin(angle) * distance;
  
        // Анимация разлёта и исчезновения
        setTimeout(() => {
          confetti.style.transition = 'all 3s ease-out';
          confetti.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${Math.random() * 360}deg)`;
          confetti.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(confetti);
          }, 3000);
        }, 10);
      }
    }
  
    // ✅ Новый метод для конфети при распылении
    static showDisenchant() {
      const color = '#888888'; // Серый цвет для распыления
  
      // Находим центр экрана (где будет карточка)
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
  
      for (let i = 0; i < 20; i++) { // ✅ Меньше конфети
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = color;
        confetti.style.opacity = Math.random() * 0.4 + 0.3; // ✅ Меньше прозрачность
        confetti.style.width = `${Math.random() * 10 + 5}px`; // ✅ Меньше размер
        confetti.style.height = confetti.style.width;
        confetti.style.borderRadius = '50%';
        confetti.style.position = 'fixed';
        confetti.style.left = `${centerX}px`;
        confetti.style.top = `${centerY}px`;
        confetti.style.zIndex = '999';
  
        document.body.appendChild(confetti);
  
        // Случайное направление движения
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 50 + 150; // ✅ Меньше дальность
        const moveX = Math.cos(angle) * distance;
        const moveY = Math.sin(angle) * distance;
  
        // Анимация разлёта и исчезновения
        setTimeout(() => {
          confetti.style.transition = 'all 1.5s ease-out'; // ✅ Быстрее исчезают
          confetti.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${Math.random() * 360}deg)`;
          confetti.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(confetti);
          }, 1500); // ✅ Быстрее удаляются
        }, 10);
      }
    }
  }