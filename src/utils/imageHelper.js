/**
 * Генерирует путь к изображению с учетом BASE_URL
 * Работает локально (BASE_URL = '/') и на GitHub Pages (BASE_URL = '/tap-game/')
 * 
 * @param {string} path - Путь относительно public/ 
 *   Примеры:
 *   - 'images/cards/a.png'
 *   - '/images/cards/a.png' (ведущий слеш будет удален)
 * @returns {string} Полный путь с учетом BASE_URL
 * 
 * @example
 * getImagePath('images/cards/a.png')
 * // Локально: '/images/cards/a.png'
 * // GitHub Pages: '/tap-game/images/cards/a.png'
 */
export function getImagePath(path) {
    // Убираем ведущий слеш, если есть
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Получаем BASE_URL (установлен в vite.config.js)
    const base = import.meta.env.BASE_URL || '/';
    
    // Убеждаемся, что base заканчивается на слеш
    const baseWithSlash = base.endsWith('/') ? base : `${base}/`;
    
    return `${baseWithSlash}${cleanPath}`;
  }
  
  /**
   * Короткий alias для удобства
   */
  export const img = getImagePath;