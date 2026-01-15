export class ProfileModal {
  constructor(gameCore, telegram) {
    this.game = gameCore;
    this.telegram = telegram;
  }

  show() {
    const user = this.telegram?.initDataUnsafe?.user;

    if (!user) {
      alert('Не удалось получить данные пользователя из Telegram');
      return;
    }

    const container = document.createElement('div');
    container.className = 'profile-overlay';
    container.innerHTML = `
      <div class="profile-modal">
        <div class="profile-header">
          <img src="${user.photo_url || 'https://via.placeholder.com/80'}" alt="Avatar" class="profile-avatar" onerror="this.src='https://via.placeholder.com/80'">
          <div class="profile-info">
            <h2 class="profile-name">${user.first_name} ${user.last_name || ''}</h2>
            <p class="profile-username">@${user.username || 'N/A'}</p>
            <p class="profile-id">ID: ${user.id}</p>
          </div>
        </div>
        
        <div class="profile-stats">
          <h3>Статистика</h3>
          <div class="stat-item">
            <span class="stat-label">Теней:</span>
            <span class="stat-value">${this.game.getCurrency().toFixed(2)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Сила нажатия:</span>
            <span class="stat-value">${this.game.getClickValue().toFixed(2)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Авто-доход:</span>
            <span class="stat-value">${this.game.getAutoIncome().toFixed(2)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Предметов в инвентаре:</span>
            <span class="stat-value">${this.game.items.length}</span>
          </div>
        </div>
        
        <button id="reset-shop" class="reset-btn">Сбросить улучшения</button>
        <button id="close-profile"><i class="fas fa-times"></i> Закрыть</button>
      </div>
    `;

    document.body.appendChild(container);

    // Обработчик сброса улучшений
    document.getElementById('reset-shop').addEventListener('click', () => {
      if (confirm('Вы уверены, что хотите сбросить все улучшения магазина? Вы получите все Тени за потраченные улучшения.')) {
        // Проверяем наличие shopSystem
        if (this.game.shopSystem) {
          const refund = this.game.shopSystem.resetAllUpgrades();
          alert(`Улучшения сброшены. Получено: ${refund} Теней`);
        } else {
          alert('Система магазина недоступна');
        }
      }
    });

    document.getElementById('close-profile').addEventListener('click', () => {
      document.body.removeChild(container);
    });
  }
}