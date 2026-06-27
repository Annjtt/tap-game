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
     * @param {object} [options] - { sourceItemId, isEternalClockActive, isEnemyAttack, isHeal }
     */
    static showFloatingGain(x, y, amount, options = {}) {
      this.ensureFloatingGainStyles();

      const value = Number(amount);
      if (!Number.isFinite(value) || value === 0) {
        return;
      }
      const roundedValue = Math.round(Math.abs(value));
      const randomTilt = (Math.random() * 26 - 3).toFixed(2);
      const isEnemyAttack = options.isEnemyAttack === true;
      const isHeal = options.isHeal === true;
      const isAutoBattle = options.isAutoBattle === true;
      const isAutoBattleHeal = options.isAutoBattleHeal === true;
      const isAutoBattleCrit = options.isAutoBattleCrit === true;

      // По умолчанию цвет
      let color = isEnemyAttack ? '#ff4242' : '#f5f5f5';
      let textShadow = isEnemyAttack
        ? '0 0 4px rgba(0, 0, 0, 0.92), 0 0 10px rgba(255, 66, 66, 0.8)'
        : '0 0 4px rgba(0, 0, 0, 0.92), 0 0 10px rgba(65, 65, 65, 0.63)';
      let fontWeight = '700';
      let styleBoost = false;
      let prefix = isEnemyAttack ? '' : '+';

      // Особые цвета
      if (isAutoBattleCrit) {
        color = '#ff4400';
        textShadow = '0 0 8px #ff4400, 0 0 20px rgba(255, 68, 0, 0.7)';
        fontWeight = '900';
        prefix = '';
      } else if (isAutoBattleHeal) {
        color = '#41d87c';
        textShadow = '0 0 8px rgba(65, 216, 124, 0.8), 0 0 16px rgba(165, 245, 158, 0.6)';
        fontWeight = '800';
        prefix = '+';
      } else if (options.isEternalClockActive && !isEnemyAttack) {
        color = '#fff200';
        textShadow = '0 0 16px rgb(111, 0, 255), 0 0 28px rgb(85, 8, 100), 0 0 60px #fff200, 0 0 95px #ff0080';
        fontWeight = '900';
        styleBoost = true;
      } else if (options.sourceItemId === 'lightning_dagger' && !isEnemyAttack) {
        color = '#64d8ff';
        textShadow = '0 0 2px #000, 0 0 4px #000, 0 0 10px rgba(100, 216, 255, 0.8)';
        fontWeight = '900';
      } else if (options.sourceItemId === 'chaos_seal' && !isEnemyAttack) {
        color = '#b700ff';
        textShadow = '0 0 10px rgb(105, 0, 63), 0 0 28px rgba(125, 0, 187, 0.78)';
        fontWeight = '900';
      } else if ((options.sourceItemId === 'tower_crit_damage' || options.sourceItemId === 'scythe_crit') && !isEnemyAttack) {
        color = '#ff7a18';
        textShadow = '0 0 10px rgba(214, 39, 27, 0.9), 0 0 22px rgba(255, 208, 0, 0.75)';
        fontWeight = '900';
      } else if (options.sourceItemId === 'tower_auto_damage' && !isEnemyAttack) {
        color = '#7cf7ff';
        textShadow = '0 0 8px rgba(124, 247, 255, 0.85), 0 0 20px rgba(130, 150, 255, 0.6)';
        fontWeight = '800';
      } else if (isHeal) {
        color = '#41d87c';
        textShadow = '0 0 8px rgba(65, 216, 124, 0.8), 0 0 16px rgba(165, 245, 158, 0.6)';
        fontWeight = '800';
        prefix = '+';
      } else if (isAutoBattle) {
        color = '#ffffff';
        textShadow = '0 0 4px rgba(0, 0, 0, 0.92), 0 0 10px rgba(255, 255, 255, 0.3)';
        fontWeight = '600';
        prefix = '';
      }

      const floatingValue = document.createElement('div');
      floatingValue.textContent = `${prefix}${roundedValue}`;
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
      this.createEffectOverlay(targetElement, 'images/effects/lightning.gif', 2500);
    }
  
    static showChaosEffect(targetElement) {
      this.createEffectOverlay(targetElement, 'images/effects/skull.gif', 3000);
    }

    static showCritEffect(targetElement) {
      if (!targetElement) return;
      const rect = targetElement.getBoundingClientRect();

      // Orange burst ring
      if (!document.getElementById('crit-burst-keyframes')) {
        const style = document.createElement('style');
        style.id = 'crit-burst-keyframes';
        style.innerHTML = `
          @keyframes crit-burst {
            0% { width: 0; height: 0; opacity: 1; }
            100% { width: 220px; height: 220px; opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      const burst = document.createElement('div');
      burst.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top + rect.height / 2}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 122, 24, 0.5), transparent);
        pointer-events: none;
        z-index: 9997;
        transform: translate(-50%, -50%);
        animation: crit-burst 0.5s ease-out forwards;
      `;
      document.body.appendChild(burst);
      setTimeout(() => burst.remove(), 600);
    }

    static showEternalClockEffect(targetElement = null) {
      this.createEffectOverlay(targetElement, 'images/effects/eternal_clock.gif', 5000);
    }
  
    static createEffectOverlay(targetElement, imageUrl, duration) {
      const existingOverlay = document.querySelector('.global-effect-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }

      const isLightning = imageUrl.includes('lightning');
      const isTowerOpen = !!document.querySelector('.tower-overlay');

      // Compute center position: clicker center or viewport center fallback
      let centerX, centerY;
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
      } else {
        centerX = window.innerWidth / 2;
        centerY = window.innerHeight / 2;
      }

      const overlay = document.createElement('div');
      overlay.className = 'global-effect-overlay';
      overlay.style.pointerEvents = 'none';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';

      if (isTowerOpen && !isLightning) {
        // Tower: append inside tower-overlay, behind clicker (z-index: 0 < z-index: 1)
        const towerOverlay = document.querySelector('.tower-overlay');
        const towerRect = towerOverlay.getBoundingClientRect();
        overlay.style.position = 'absolute';
        overlay.style.left = (centerX - towerRect.left) + 'px';
        overlay.style.top = (centerY - towerRect.top) + 'px';
        overlay.style.transform = 'translate(-50%, -50%)';
        overlay.style.zIndex = '0';
        towerOverlay.appendChild(overlay);
      } else {
        // Main game or lightning: fixed at clicker position
        overlay.style.position = 'fixed';
        overlay.style.left = centerX + 'px';
        overlay.style.top = centerY + 'px';
        overlay.style.transform = 'translate(-50%, -50%)';
        overlay.style.zIndex = isLightning ? '9998' : '-900';
        document.body.appendChild(overlay);
      }
      
      const effectImg = document.createElement('img');
      effectImg.src = imageUrl;
      // Размер эффекта варьируется от 70 до 180px (большой разброс)
      const randomSize = Math.floor(Math.random() * (200 - 70 + 1)) + 20;
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

      // Удаляем через время
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.remove();
        }
      }, duration);
    }
  }