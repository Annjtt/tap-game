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
  
    /**
     * Показывает всплывающую индикацию награды (+число) с учетом предметных и временных эффектов.
     * @param {number} x
     * @param {number} y
     * @param {number|string} amount
     * @param {object} [options] - { sourceItemId, isEternalClockActive }
     */
    static showFloatingGain(x, y, amount, options = {}) {
      this.ensureFloatingGainStyles();

      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        return;
      }
      const roundedValue = Math.round(value);
      const randomTilt = (Math.random() * 26 - 3).toFixed(2);

      // По умолчанию цвет
      let color = '#f5f5f5';
      let textShadow = '0 0 4px rgba(0, 0, 0, 0.92), 0 0 10px rgba(65, 65, 65, 0.63)';
      let fontWeight = '700';
      let styleBoost = false;

      // Особые цвета: lightning_dagger, chaos_seal, super-ярко если eternal_clock
      if (options.isEternalClockActive) {
        // Эффект Этерна — особый яркий стиль
        color = '#fff200'; // очень ярко-жёлтый цвет самих букв
        textShadow = '0 0 16px rgb(111, 0, 255), 0 0 28px rgb(167, 19, 197), 0 0 60px #fff200, 0 0 95px #ff0080'; // добавлено больше glow
        fontWeight = '900';
        styleBoost = true;
      } else if (options.sourceItemId === 'lightning_dagger') {
        color = '#ffe021';
        textShadow = '0 0 8px rgba(135, 255, 249, 0.74), 0 0 18pxrgba(139, 228, 255, 0.73), 0 0 24pxrgba(255, 0, 234, 0.9)';
        fontWeight = '900';
      } else if (options.sourceItemId === 'chaos_seal') {
        color = '#b700ff'; // Ярко фиолетовый
        textShadow = '0 0 10px rgb(255, 2, 153), 0 0 28pxrgba(170, 2, 255, 0.78)';
        fontWeight = '900';
      }

      const floatingValue = document.createElement('div');
      floatingValue.textContent = `+${roundedValue}`;
      floatingValue.style.position = 'fixed';
      floatingValue.style.left = `${x}px`;
      floatingValue.style.top = `${y}px`;
      floatingValue.style.transform = 'translate(-50%, -10px)';
      floatingValue.style.setProperty('--floating-tilt', `${randomTilt}deg`);
      floatingValue.style.pointerEvents = 'none';
      floatingValue.style.zIndex = '9999';
      floatingValue.style.color = color;
      floatingValue.style.fontWeight = fontWeight;
      floatingValue.style.fontSize = styleBoost ? '22px' : '18px';
      floatingValue.style.textShadow = textShadow;
      floatingValue.style.animation = 'floatingGainRise 950ms ease-out forwards';
      if (styleBoost) {
        floatingValue.style.letterSpacing = '2px';
        floatingValue.style.filter = 'drop-shadow(0 0 10px #fff)';
      }

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
      this.createEffectOverlay(targetElement, 'images/effects/skull.gif', 2500);
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
      // Размер эффекта варьируется от 70 до 180px (большой разброс)
      const randomSize = Math.floor(Math.random() * (200 - 60 + 1)) + 20;
      effectImg.style.width = `${randomSize}px`;
      effectImg.style.height = `${randomSize}px`;
      effectImg.style.mixBlendMode = 'screen';

      // ✅ Рандомный поворот от -180 до 180 градусов
      const randomRotation = Math.floor(Math.random() * 360) - 180;
      effectImg.style.transform = `scale(5) rotate(${randomRotation}deg)`; // ✅ Добавлен поворот

      // Добавляем медленный поворот (анимацию) только самой картинки эффекта
      effectImg.style.animation = 'slow-effect-rotate 7s linear infinite';

      effectImg.style.pointerEvents = 'none';

      // Добавим если еще не добавлен keyframe анимации (чтобы не создавать дубликаты)
      if (!document.getElementById('slow-effect-rotate-keyframes')) {
        const style = document.createElement('style');
        style.id = 'slow-effect-rotate-keyframes';
        style.innerHTML = `
          @keyframes slow-effect-rotate {
            from { transform: scale(5) rotate(${randomRotation}deg);}
            to { transform: scale(5) rotate(${randomRotation + 360}deg);}
          }
        `;
        document.head.appendChild(style);
      }

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