export class Notification {
    static show(message, duration = 2000) {
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = message;
  
      document.body.appendChild(notification);
  
      // Показываем
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
  
      // Удаляем через duration
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, duration);
    }
  }