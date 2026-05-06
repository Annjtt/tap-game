export class VisualEffects {
    static ensureFloatingGainStyles() {
      if (document.getElementById('floating-gain-styles')) {
        return;
      }
  
      const style = document.createElement('style');
      style.id = 'floating-gain-styles';
      style.textContent = `
        @keyframes floatingGainRise {
          0% {
            transform: translate(-50%, -10px) scale(0.92) rotate(var(--floating-tilt, 0deg));
            opacity: 0;
          }
          15% {
            transform: translate(-50%, -20px) scale(1) rotate(var(--floating-tilt, 0deg));
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -78px) scale(1.03) rotate(var(--floating-tilt, 0deg));
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  
    static showFloatingGain(x, y, amount) {
      this.ensureFloatingGainStyles();
  
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        return;
      }
      const roundedValue = Math.round(value);
      const randomTilt = (Math.random() * 12 - 6).toFixed(2);
  
      const floatingValue = document.createElement('div');
      floatingValue.textContent = `+${roundedValue}`;
      floatingValue.style.position = 'fixed';
      floatingValue.style.left = `${x}px`;
      floatingValue.style.top = `${y}px`;
      floatingValue.style.transform = 'translate(-50%, -10px)';
      floatingValue.style.setProperty('--floating-tilt', `${randomTilt}deg`);
      floatingValue.style.pointerEvents = 'none';
      floatingValue.style.zIndex = '9999';
      floatingValue.style.color = '#f5f5f5';
      floatingValue.style.fontWeight = '700';
      floatingValue.style.fontSize = '16px';
      floatingValue.style.textShadow = '0 0 4px rgba(0, 0, 0, 0.9), 0 0 10px rgba(95, 158, 255, 0.55)';
      floatingValue.style.animation = 'floatingGainRise 650ms ease-out forwards';
  
      document.body.appendChild(floatingValue);
  
      setTimeout(() => {
        if (floatingValue.parentNode) {
          floatingValue.remove();
        }
      }, 700);
    }

    static showLightningEffect(targetElement) {
      this.createEffectOverlay(targetElement, 'images/effects/lightning.gif', 1500);
    }
  
    static showChaosEffect(targetElement) {
      this.createEffectOverlay(targetElement, 'images/effects/skull.gif', 1500);
    }

    static showEternalClockEffect(targetElement = null) {
      this.createEffectOverlay(targetElement, 'images/effects/eternal_clock.gif', 3500);
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
      overlay.style.zIndex = '-900';
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