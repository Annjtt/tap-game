export class VisualEffects {
    static showLightningEffect(targetElement) {
      this.createEffectOverlay(targetElement, 'images/effects/lightning.gif', 2000);
    }
  
    static showChaosEffect(targetElement) {
      this.createEffectOverlay(targetElement, 'images/effects/skull.gif', 1500);
    }
  
    static createEffectOverlay(targetElement, imageUrl, duration) {
      const existingOverlay = document.querySelector('.global-effect-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
  
      const overlay = document.createElement('div');
      overlay.className = 'global-effect-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '50%';
      overlay.style.left = '50%';
      overlay.style.transform = 'translate(-50%, -50%)';
      overlay.style.zIndex = '9999';
      overlay.style.pointerEvents = 'none';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      
      const effectImg = document.createElement('img');
      effectImg.src = imageUrl;
      effectImg.style.width = '100px';
      effectImg.style.height = '100px';
      
      // ✅ Рандомный поворот от -180 до 180 градусов
      const randomRotation = Math.floor(Math.random() * 360) - 180;
      effectImg.style.transform = `scale(5) rotate(${randomRotation}deg)`; // ✅ Добавлен поворот
      
      effectImg.style.animation = 'effectFadeIn 0.2s ease-out';
      effectImg.style.pointerEvents = 'none';
  
      overlay.appendChild(effectImg);
      document.body.appendChild(overlay);
  
      // Удаляем через время
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.remove();
        }
      }, duration);
    }
  }