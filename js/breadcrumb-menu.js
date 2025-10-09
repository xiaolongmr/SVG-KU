/**
 * 面包屑菜单交互功能
 * 作者：小张
 * GitHub: https://github.com/xiaolongmr
 */

// 面包屑菜单配置信息 - 可根据需求调整以下参数
const BREADCRUMB_CONFIG = {
  // 弹出距离配置
  radius: 80,
  // 角度配置
  startAngle: 0,
  endAngle: 120,
  // 按钮配置
  buttonCount: 4,
  // 按钮样式配置
  buttonStyles: {
    backgroundColor: '#409eff',
    activeBackgroundColor: '#ff4d4f',
    color: '#fff',
    activeColor: '#fff'
  },
  // 动画效果配置
  animation: {
    effectName: 'popAnimation1',
    // 各种动画效果的配置
    effects: {
      // 弹出动画1 - 原始效果，弹簧弹出
      popAnimation1: {
        openDelay: 50,
        closeDelay: 30,
        openDuration: 500,
        closeDuration: 200,
        openTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        closeTimingFunction: 'ease-in',
        initialTransform: 'scale(0)',
        finalTransform: 'scale(1)'
      },
      // 弹出动画2 - 旋转弹出效果
      popAnimation2: {
        openDelay: 70,
        closeDelay: 40,
        openDuration: 600,
        closeDuration: 250,
        openTimingFunction: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        closeTimingFunction: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        initialTransform: 'scale(0) rotate(-180deg)',
        finalTransform: 'scale(1) rotate(0deg)'
      },
      // 弹出动画3 - 波浪式弹出效果
      popAnimation3: {
        openDelay: 30,
        closeDelay: 20,
        openDuration: 400,
        closeDuration: 300,
        openTimingFunction: 'ease-out',
        closeTimingFunction: 'ease-in',
        initialTransform: 'translateY(20px) opacity(0)',
        finalTransform: 'translateY(0) opacity(1)'
      },
      // 弹出动画4 - 脉冲放大效果
      popAnimation4: {
        openDelay: 40,
        closeDelay: 35,
        openDuration: 700,
        closeDuration: 300,
        openTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        closeTimingFunction: 'ease-in-out',
        initialTransform: 'scale(0)',
        finalTransform: 'scale(1)'
      },
      // 弹出动画5 - 滚动弹出效果
      popAnimation5: {
        openDelay: 100,
        closeDelay: 50,
        openDuration: 900,
        closeDuration: 400,
        openTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        closeTimingFunction: 'ease-in-out',
        initialTransform: 'scale(0)',
        finalTransform: 'scale(1)',
        isRollingAnimation: true
      },
      // 弹出动画6 - 波浪弹跳效果
      popAnimation6: {
        openDelay: 60,
        closeDelay: 40,
        openDuration: 800,
        closeDuration: 350,
        openTimingFunction: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        closeTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        initialTransform: 'translateY(30px) scale(0.8)',
        finalTransform: 'translateY(0) scale(1)'
      },
      // 弹出动画7 - 分步缩放效果
      popAnimation7: {
        openDelay: 80,
        closeDelay: 30,
        openDuration: 600,
        closeDuration: 250,
        openTimingFunction: 'ease-out',
        closeTimingFunction: 'ease-in',
        initialTransform: 'scale(0.3)',
        finalTransform: 'scale(1)'
      },
      // 弹出动画8 - 扩散旋转效果
      popAnimation8: {
        openDelay: 90,
        closeDelay: 45,
        openDuration: 700,
        closeDuration: 400,
        openTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        closeTimingFunction: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        initialTransform: 'translate(-50%, -50%) scale(0) rotate(0deg)',
        finalTransform: 'scale(1) rotate(360deg)'
      },
      // 弹出动画9 - 旋转弹出效果
      popAnimation9: {
        openDelay: 200,
        closeDelay: 80,
        openDuration: 1200,
        closeDuration: 800,
        openTimingFunction: 'cubic-bezier(0.34, 1.1, 0.64, 1)',
        closeTimingFunction: 'cubic-bezier(0.44, 0.1, 0.55, 0.9)',
        initialTransform: 'scale(0)',
        finalTransform: 'scale(1)',
        isRollingAnimation: true
      }
    },
    // 面包屑按钮本身的动画配置
    buttonTransform: {
      enabled: true,
      openRotate: 90,
      openScale: 1.1,
      closeRotate: 0,
      closeScale: 1
    }
  }
};

// 获取当前选中的动画效果配置
function getCurrentAnimationEffect() {
  return BREADCRUMB_CONFIG.animation.effects[BREADCRUMB_CONFIG.animation.effectName] ||
    BREADCRUMB_CONFIG.animation.effects.popAnimation1;
}

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function () {
  // 获取元素
  const breadcrumbBtn = document.getElementById('breadcrumbBtn');
  const breadcrumbItems = document.getElementById('breadcrumbItems');
  const breadcrumbSettingsBtn = document.getElementById('settingsBtn');
  const commentBtn = document.getElementById('breadcrumbCommentBtn');
  const loginBtn = document.getElementById('breadcrumbLoginBtn');
  const donationBtn = document.getElementById('breadcrumbDonationBtn');

  // 菜单状态
  let menuOpen = false;

  // 菜单项位置配置 - 根据配置参数动态生成
  // 使用精确的三角函数计算，确保按钮在指定角度范围内均匀分布
  const menuItemsConfig = [];

  // 计算角度间隔
  const angleInterval = BREADCRUMB_CONFIG.buttonCount > 1 ?
    (BREADCRUMB_CONFIG.endAngle - BREADCRUMB_CONFIG.startAngle) / (BREADCRUMB_CONFIG.buttonCount - 1) : 0;

  // 生成菜单项配置
  const buttons = [breadcrumbSettingsBtn, commentBtn, loginBtn, donationBtn];
  buttons.slice(0, BREADCRUMB_CONFIG.buttonCount).forEach((button, index) => {
    const angle = BREADCRUMB_CONFIG.startAngle + (index * angleInterval);
    // 转换为弧度
    const radians = Math.PI * angle / 180;

    // 计算坐标位置
    // 注意：向上为0度，向左上角度增加，所以x坐标为负，y坐标为负
    const left = -BREADCRUMB_CONFIG.radius * Math.sin(radians);
    const top = -BREADCRUMB_CONFIG.radius * Math.cos(radians);

    menuItemsConfig.push({
      el: button,
      left: left,
      top: top,
      angle: angle // 保存角度信息，便于调试
    });
  });

  // 重置所有按钮位置
  function resetButtonPositions() {
    const currentEffect = getCurrentAnimationEffect();

    menuItemsConfig.forEach(config => {
      config.el.style.left = '0';
      config.el.style.top = '0';

      // 根据当前动画效果设置不同的初始状态
      if (currentEffect.initialTransform.includes('opacity')) {
        // 对于有opacity的动画效果
        config.el.style.opacity = '0';
        config.el.style.transform = 'translateY(20px)';
      } else if (currentEffect.initialTransform.includes('rotate')) {
        // 对于有rotate的动画效果
        config.el.style.opacity = '0';
        config.el.style.transform = 'scale(0) rotate(-180deg)';
      } else {
        // 默认效果
        config.el.style.opacity = '0';
        config.el.style.transform = 'scale(0)';
      }
    });
  }

  // 初始化面包屑按钮的默认样式
  function initBreadcrumbButtonStyle() {
    breadcrumbBtn.style.backgroundColor = BREADCRUMB_CONFIG.buttonStyles.backgroundColor;
    breadcrumbBtn.style.color = BREADCRUMB_CONFIG.buttonStyles.color;
    // 添加过渡效果，使背景颜色变化更平滑
    breadcrumbBtn.style.transition = 'background-color 0.3s ease, color 0.3s ease, transform 0.3s ease';
  }

  // 打开/关闭菜单
  function toggleMenu() {
    menuOpen = !menuOpen;

    // 切换菜单显示状态
    if (menuOpen) {
      // 显示容器
      breadcrumbItems.style.opacity = '1';
      breadcrumbItems.style.pointerEvents = 'auto';

      // 获取当前动画效果配置
      const currentEffect = getCurrentAnimationEffect();

      // 添加面包屑按钮背景颜色变化
      breadcrumbBtn.style.transition = `background-color ${currentEffect.openDuration / 2}ms ease, color ${currentEffect.openDuration / 2}ms ease`;
      breadcrumbBtn.style.backgroundColor = BREADCRUMB_CONFIG.buttonStyles.activeBackgroundColor;
      breadcrumbBtn.style.color = BREADCRUMB_CONFIG.buttonStyles.activeColor;

      // 添加面包屑按钮动画效果
      if (BREADCRUMB_CONFIG.animation.buttonTransform.enabled) {
        const btnAnimConfig = BREADCRUMB_CONFIG.animation.buttonTransform;
        breadcrumbBtn.style.transition += `, transform ${currentEffect.openDuration / 2}ms ${currentEffect.openTimingFunction}`;
        breadcrumbBtn.style.transform = `rotate(${btnAnimConfig.openRotate}deg) scale(${btnAnimConfig.openScale})`;
      }

      // 将面包屑图标从fa-bars切换为fa-times，添加图标过渡动画
      const iconElement = breadcrumbBtn.querySelector('i');
      if (iconElement.classList.contains('fa-bars')) {
        iconElement.style.transition = `transform ${currentEffect.openDuration}ms ${currentEffect.openTimingFunction}`;
        iconElement.style.transform = 'rotate(90deg) scale(0)';

        // 使用setTimeout确保动画效果可见
        setTimeout(() => {
          iconElement.classList.remove('fa-bars');
          iconElement.classList.add('fa-times');
          iconElement.style.transform = 'rotate(0deg) scale(1)';
        }, currentEffect.openDuration / 2);
      }

      // 重置按钮位置
      resetButtonPositions();

      // 显示菜单项，使用动画
      // 处理特殊的滚动动画
      if (currentEffect.isRollingAnimation) {
        // 滚动动画逻辑：
        // 1. 先显示第一个按钮
        // 2. 然后其他按钮从第一个按钮的位置沿着圆周滚动到各自位置

        // 显示第一个按钮
        const firstConfig = menuItemsConfig[0];
        firstConfig.el.style.transition = `all ${currentEffect.openDuration / 2}ms ${currentEffect.openTimingFunction}`;
        firstConfig.el.style.opacity = '1';
        firstConfig.el.style.transform = 'scale(1)';
        firstConfig.el.style.left = firstConfig.left + 'px';
        firstConfig.el.style.top = firstConfig.top + 'px';

        // 为其他按钮添加滚动动画
        menuItemsConfig.slice(1).forEach((config, index) => {
          // 使用setTimeout创建动画序列
          setTimeout(() => {
            // 先让按钮出现在第一个按钮的位置

            // 重置按钮状态
            config.el.style.opacity = '1';
            config.el.style.transition = 'none';
            config.el.style.transform = 'none';
            config.el.style.left = firstConfig.left + 'px';
            config.el.style.top = firstConfig.top + 'px';

            // 强制重排以应用初始状态
            void config.el.offsetHeight;

            // 特殊处理动画9 - 旋转弹出效果
            if (currentEffect.effectName === 'popAnimation9') {
              // 获取面包屑按钮和容器的位置信息
              const breadcrumbRect = breadcrumbBtn.getBoundingClientRect();
              const containerRect = breadcrumbItems.getBoundingClientRect();

              // 计算面包屑按钮在容器中的中心点
              const centerX = breadcrumbRect.left - containerRect.left + breadcrumbRect.width / 2;
              const centerY = breadcrumbRect.top - containerRect.top + breadcrumbRect.height / 2;

              // 计算按钮的初始位置（第一个按钮的位置）
              const startX = firstConfig.left;
              const startY = firstConfig.top;

              // 计算目标位置
              const endX = config.left;
              const endY = config.top;

              // 计算从面包屑中心到初始位置的向量
              const startCenterX = startX - centerX;
              const startCenterY = startY - centerY;

              // 计算从面包屑中心到目标位置的向量
              const endCenterX = endX - centerX;
              const endCenterY = endY - centerY;

              // 计算初始角度和目标角度
              const startAngle = Math.atan2(startCenterY, startCenterX);
              const endAngle = Math.atan2(endCenterY, endCenterX);

              // 计算逆时针旋转角度（确保所有按钮都能正确旋转）
              let rotationAngle = (endAngle - startAngle) * 180 / Math.PI;
              // 确保是逆时针方向且经过最短路径
              if (rotationAngle < 0) rotationAngle += 360;

              console.log('Button:', index + 1, 'Rotation angle:', rotationAngle);

              // 强制重排
              void config.el.offsetHeight;

              // 应用动画 - 旋转并移动到目标位置
              config.el.style.transition = `transform ${currentEffect.openDuration}ms ${currentEffect.openTimingFunction}`;

              // 核心动画：设置旋转中心为面包屑按钮中心点
              config.el.style.transformOrigin = `${centerX - startX}px ${centerY - startY}px`;

              // 应用旋转变换
              config.el.style.transform = `rotate(${rotationAngle}deg)`;

              // 动画完成后设置为最终位置
              setTimeout(() => {
                // 先设置为没有过渡效果，直接到目标位置
                config.el.style.transition = 'none';
                config.el.style.transform = 'none';
                config.el.style.transformOrigin = '50% 50%'; // 重置变换原点

                // 确保按钮在正确的位置
                config.el.style.left = config.left + 'px';
                config.el.style.top = config.top + 'px';

                // 强制重排
                void config.el.offsetHeight;

                // 恢复过渡效果，以便用户交互时有反馈
                config.el.style.transition = 'all 0.3s ease';
              }, currentEffect.openDuration);
            } else {
              // 动画5的标准滚动处理
              // 计算旋转角度
              let rotationAngle = 0;
              const targetX = firstConfig.left + (config.left - firstConfig.left);
              const targetY = firstConfig.top + (config.top - firstConfig.top);
              rotationAngle = Math.atan2(targetY - (firstConfig.top + 20), targetX - (firstConfig.left + 20)) * 180 / Math.PI;

              // 设置过渡效果
              config.el.style.transition = `left ${currentEffect.openDuration}ms ${currentEffect.openTimingFunction}, top ${currentEffect.openDuration}ms ${currentEffect.openTimingFunction}, transform ${currentEffect.openDuration}ms ${currentEffect.openTimingFunction}`;
              config.el.style.transform = `scale(1) rotate(${rotationAngle}deg)`;
              config.el.style.left = config.left + 'px';
              config.el.style.top = config.top + 'px';

              // 动画完成后重置状态
              setTimeout(() => {
                config.el.style.transition = 'transform 0.1ms';
                config.el.style.transformOrigin = 'center center';
                config.el.style.transform = 'scale(1) rotate(0deg)';
              }, currentEffect.openDuration);
            }
          }, (index + 1) * currentEffect.openDelay);
        });
      } else {
        // 标准动画逻辑
        menuItemsConfig.forEach((config, index) => {
          // 延迟应用动画，产生依次弹出的效果
          setTimeout(() => {
            // 使用配置中的动画参数
            config.el.style.transition = `all ${currentEffect.openDuration}ms ${currentEffect.openTimingFunction}`;

            // 根据当前动画效果设置不同的变换属性
            if (currentEffect.initialTransform.includes('opacity')) {
              // 对于有opacity的动画效果
              config.el.style.opacity = '1';
              config.el.style.transform = 'translateY(0)';
            } else if (currentEffect.initialTransform.includes('rotate')) {
              // 对于有rotate的动画效果
              config.el.style.opacity = '1';
              config.el.style.transform = 'scale(1) rotate(0deg)';
            } else {
              // 默认效果
              config.el.style.opacity = '1';
              config.el.style.transform = 'scale(1)';
            }

            config.el.style.left = config.left + 'px';
            config.el.style.top = config.top + 'px';
          }, index * currentEffect.openDelay);
        });
      }
    } else {
      // 获取当前动画效果配置
      const currentEffect = getCurrentAnimationEffect();

      // 隐藏菜单项，使用动画
      // 处理特殊的滚动动画关闭逻辑
      if (currentEffect.isRollingAnimation) {
        // 滚动动画关闭逻辑：
        // 1. 先将所有按钮滚动到第一个按钮的位置（对于动画9，需要实现向右旋转的效果）
        // 2. 然后同时隐藏所有按钮

        const firstConfig = menuItemsConfig[0];

        // 如果是动画9，实现特殊的关闭逻辑：从目标位置逆时针旋转回第一个按钮位置
        if (currentEffect.effectName === 'popAnimation9' && currentEffect.isRollingAnimation) {
          // 动画9的关闭逻辑 - 所有按钮逆时针旋转回第一个按钮位置
          const breadcrumbRect = breadcrumbBtn.getBoundingClientRect();
          const containerRect = breadcrumbItems.getBoundingClientRect();

          // 计算面包屑按钮在容器中的中心点
          const centerX = breadcrumbRect.left - containerRect.left + breadcrumbRect.width / 2;
          const centerY = breadcrumbRect.top - containerRect.top + breadcrumbRect.height / 2;

          // 获取第一个按钮配置
          const firstButtonConfig = menuItemsConfig[0];

          // 为除第一个以外的所有按钮设置关闭动画
          menuItemsConfig.slice(1).forEach((config, index) => {
            // 计算从面包屑中心到当前位置的向量
            const currentCenterX = config.left - centerX;
            const currentCenterY = config.top - centerY;

            // 计算从面包屑中心到第一个按钮位置的向量
            const firstCenterX = firstButtonConfig.left - centerX;
            const firstCenterY = firstButtonConfig.top - centerY;

            // 计算当前角度和目标角度（第一个按钮的位置）
            const currentAngle = Math.atan2(currentCenterY, currentCenterX);
            const firstAngle = Math.atan2(firstCenterY, firstCenterX);

            // 设置旋转中心为面包屑按钮的中心点（相对于按钮自身）
            config.el.style.transformOrigin = `${centerX - config.left}px ${centerY - config.top}px`;

            setTimeout(() => {
              // 计算逆时针旋转角度，从当前位置旋转回第一个按钮位置
              let rotationAngle = (firstAngle - currentAngle) * 180 / Math.PI;
              if (rotationAngle < 0) rotationAngle += 360;

              console.log('Close rotation angle:', rotationAngle);

              // 应用关闭动画 - 逆时针旋转回第一个按钮位置
              config.el.style.transition = `transform ${currentEffect.closeDuration}ms ${currentEffect.closeTimingFunction}`;
              config.el.style.transform = `rotate(${rotationAngle}deg)`;

              // 动画完成后隐藏
              setTimeout(() => {
                config.el.style.transition = 'opacity 200ms ease-out';
                config.el.style.opacity = '0';

                setTimeout(() => {
                  config.el.style.display = 'none';
                  config.el.style.transform = 'none';
                  config.el.style.transformOrigin = '50% 50%';
                }, 200);
              }, currentEffect.closeDuration);
            }, index * currentEffect.closeDelay);
          });

          // 最后隐藏第一个按钮
          setTimeout(() => {
            firstButtonConfig.el.style.transition = `all ${currentEffect.closeDuration}ms ${currentEffect.closeTimingFunction}`;
            firstButtonConfig.el.style.opacity = '0';
            firstButtonConfig.el.style.transform = 'scale(0.8)';

            setTimeout(() => {
              firstButtonConfig.el.style.display = 'none';
              firstButtonConfig.el.style.transform = 'none';
            }, currentEffect.closeDuration);
          }, menuItemsConfig.length * currentEffect.closeDelay);
        } else {
          // 其他滚动动画的标准关闭逻辑
          // 先将所有按钮滚动到第一个按钮的位置
          menuItemsConfig.slice(1).forEach((config, index) => {
            setTimeout(() => {
              config.el.style.transition = `all ${currentEffect.closeDuration / 2}ms ${currentEffect.closeTimingFunction}`;
              config.el.style.left = firstConfig.left + 'px';
              config.el.style.top = firstConfig.top + 'px';
            }, index * currentEffect.closeDelay);
          });
        }

        // 然后同时隐藏所有按钮
        const lastDelay = (menuItemsConfig.length - 1) * currentEffect.closeDelay + (currentEffect.effectName === 'popAnimation9' ? 800 : currentEffect.closeDuration / 2);
        setTimeout(() => {
          menuItemsConfig.forEach(config => {
            config.el.style.transition = `all ${currentEffect.closeDuration / 2}ms ${currentEffect.closeTimingFunction}`;
            config.el.style.opacity = '0';
            config.el.style.transform = 'scale(0)';
            config.el.style.transformOrigin = 'center center'; // 重置transform-origin
            config.el.style.left = '0';
            config.el.style.top = '0';
          });
        }, lastDelay);
      } else {
        // 标准关闭动画逻辑
        menuItemsConfig.forEach((config, index) => {
          // 反向顺序隐藏
          setTimeout(() => {
            config.el.style.transition = `all ${currentEffect.closeDuration}ms ${currentEffect.closeTimingFunction}`;

            // 根据当前动画效果设置不同的变换属性
            if (currentEffect.initialTransform.includes('opacity')) {
              // 对于有opacity的动画效果
              config.el.style.opacity = '0';
              config.el.style.transform = 'translateY(20px)';
            } else if (currentEffect.initialTransform.includes('rotate')) {
              // 对于有rotate的动画效果
              config.el.style.opacity = '0';
              config.el.style.transform = 'scale(0) rotate(-180deg)';
            } else if (currentEffect.initialTransform.includes('translate(-50%, -50%)')) {
              // 对于有特殊位移和旋转的动画效果（如popAnimation8）
              config.el.style.opacity = '0';
              config.el.style.transform = 'translate(-50%, -50%) scale(0) rotate(0deg)';
            } else if (currentEffect.initialTransform.includes('translateY')) {
              // 对于有垂直位移的动画效果
              config.el.style.opacity = '0';
              config.el.style.transform = currentEffect.initialTransform;
            } else {
              // 默认效果
              config.el.style.opacity = '0';
              config.el.style.transform = 'scale(0)';
            }

            config.el.style.left = '0';
            config.el.style.top = '0';
          }, (menuItemsConfig.length - 1 - index) * currentEffect.closeDelay);
        });
      }

      // 恢复面包屑按钮背景颜色
      breadcrumbBtn.style.transition = `background-color ${currentEffect.closeDuration}ms ease, color ${currentEffect.closeDuration}ms ease`;
      breadcrumbBtn.style.backgroundColor = BREADCRUMB_CONFIG.buttonStyles.backgroundColor;
      breadcrumbBtn.style.color = BREADCRUMB_CONFIG.buttonStyles.color;

      // 添加面包屑按钮动画效果
      if (BREADCRUMB_CONFIG.animation.buttonTransform.enabled) {
        const btnAnimConfig = BREADCRUMB_CONFIG.animation.buttonTransform;
        breadcrumbBtn.style.transition += `, transform ${currentEffect.closeDuration}ms ${currentEffect.closeTimingFunction}`;
        breadcrumbBtn.style.transform = `rotate(${btnAnimConfig.closeRotate}deg) scale(${btnAnimConfig.closeScale})`;
      }

      // 将面包屑图标从fa-times切换回fa-bars，添加图标过渡动画
      const iconElement = breadcrumbBtn.querySelector('i');
      if (iconElement.classList.contains('fa-times')) {
        iconElement.style.transition = `transform ${currentEffect.closeDuration / 2}ms ${currentEffect.closeTimingFunction}`;
        iconElement.style.transform = 'rotate(90deg) scale(0)';

        // 使用setTimeout确保动画效果可见
        setTimeout(() => {
          iconElement.classList.remove('fa-times');
          iconElement.classList.add('fa-bars');
          iconElement.style.transform = 'rotate(0deg) scale(1)';
        }, currentEffect.closeDuration / 2);
      }

      // 完全隐藏容器
      setTimeout(() => {
        breadcrumbItems.style.opacity = '0';
        breadcrumbItems.style.pointerEvents = 'none';
      }, 300);
    }
  }

  // 初始化按钮位置
  resetButtonPositions();

  // 初始化面包屑按钮样式
  initBreadcrumbButtonStyle();

  // 点击面包屑按钮切换菜单
  breadcrumbBtn.addEventListener('click', toggleMenu);

  // 设置按钮点击事件 - 只保留设置按钮的功能
  breadcrumbSettingsBtn.addEventListener('click', function () {
    // 打开设置模态框，使用与详情页弹窗相同的显示逻辑
    const settingsModal = document.getElementById('settingsModal');
    settingsModal.classList.remove('opacity-0', 'pointer-events-none');
    const modalContent = settingsModal.querySelector('div');
    if (modalContent) {
      modalContent.classList.remove('scale-95');
      modalContent.classList.add('scale-100');
    }

    // 防止背景滚动
    document.body.style.overflow = 'hidden';

    // 关闭面包屑菜单
    if (menuOpen) {
      toggleMenu();
    }
  });

  // 按钮点击事件 - 先关闭菜单
  function buttonClick() {
    if (menuOpen) {
      toggleMenu();
    }
  }

  // 给按钮添加点击事件 - 先关闭菜单
  commentBtn.addEventListener('click', buttonClick);
  loginBtn.addEventListener('click', buttonClick);
  donationBtn.addEventListener('click', buttonClick);

  // 点击页面其他地方关闭菜单
  document.addEventListener('click', function (e) {
    if (!breadcrumbBtn.contains(e.target) &&
      !breadcrumbItems.contains(e.target) &&
      menuOpen) {
      toggleMenu();
    }
  });

  // 初始化弹窗功能
  initModals();
});

// 初始化弹窗功能
function initModals() {
  // 获取按钮元素
  const commentBtn = document.getElementById('breadcrumbCommentBtn');
  const loginBtn = document.getElementById('breadcrumbLoginBtn');
  const donationBtn = document.getElementById('breadcrumbDonationBtn');

  // 获取弹窗元素
  const commentModal = document.getElementById('commentModal');
  const loginModal = document.getElementById('loginModal');
  const donationModal = document.getElementById('donationModal');

  // 获取关闭按钮
  const closeCommentModal = document.getElementById('closeCommentModal');
  const closeLoginModal = document.getElementById('closeLoginModal');
  const closeDonationModal = document.getElementById('closeDonationModal');

  // 获取打赏相关元素
  const donationOptions = document.querySelectorAll('.donation-option');
  const donationOptionsContainer = document.getElementById('donationOptions');
  const donationThanks = document.getElementById('donationThanks');
  const thanksMessage = document.getElementById('thanksMessage');
  const paymentQRCode = document.getElementById('paymentQRCode');

  // 初始化Twikoo评论系统
  if (window.twikoo) {
    twikoo.init({
      envId: 'https://twikookaishu.z-l.top', // 环境ID
      el: '#twikoo', // 容器元素
      // region: 'ap-guangzhou', // 环境地域，可选
      path: location.href,
      // 用于区分不同文章的自定义路径，可选
      // lang: 'zh-CN', // 语言，可选，zh-CN 或 en-US
    });
  }

  // 评论按钮点击事件
  if (commentBtn) {
    commentBtn.addEventListener('click', () => {
      openModal(commentModal);
    });
  }

  // 登录按钮点击事件
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      openModal(loginModal);
    });
  }

  // 打赏按钮点击事件
  if (donationBtn) {
    donationBtn.addEventListener('click', () => {
      resetDonationModal();
      openModal(donationModal);
    });
  }

  // 关闭按钮事件
  if (closeCommentModal) {
    closeCommentModal.addEventListener('click', () => closeModal(commentModal));
  }
  if (closeLoginModal) {
    closeLoginModal.addEventListener('click', () => closeModal(loginModal));
  }
  if (closeDonationModal) {
    closeDonationModal.addEventListener('click', () => closeModal(donationModal));
  }

  // 打赏选项点击事件
  if (donationOptions && donationOptions.length > 0) {
    donationOptions.forEach(option => {
      option.addEventListener('click', () => {
        const type = option.dataset.type;
        let message = '';

        // 设置感谢信息
        switch (type) {
          case 'cola':
            message = '您送了一杯冰可乐！';
            break;
          case 'chicken':
            message = '您加了一只大鸡腿！';
            break;
          case 'flower':
            message = '请我吃疯狂星期四！';
            break;
        }

        if (thanksMessage) {
          thanksMessage.textContent = message;
        }
        if (donationOptionsContainer) {
          donationOptionsContainer.classList.add('hidden');
        }
        if (donationThanks) {
          donationThanks.classList.remove('hidden');
        }

        // 2秒后显示收款码
        setTimeout(() => {
          if (paymentQRCode) {
            paymentQRCode.classList.remove('hidden');
          }
        }, 2000);
      });
    });
  }

  // 添加点击外部关闭弹窗功能
  [commentModal, loginModal, donationModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    }
  });

  // 打开弹窗
  function openModal(modal) {
    if (!modal) return;

    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';

    // 强制重排以触发动画
    void modal.offsetHeight;

    // 找到弹窗内容容器
    const modalContent = modal.querySelector('div[class*="transform scale-95"]');
    if (modalContent) {
      modalContent.style.transform = 'scale(1)';
    }

    // 阻止页面滚动
    document.body.style.overflow = 'hidden';
  }

  // 关闭弹窗
  function closeModal(modal) {
    if (!modal) return;

    // 找到弹窗内容容器
    const modalContent = modal.querySelector('div[class*="transform scale"]');
    if (modalContent) {
      modalContent.style.transform = 'scale(0.95)';
    }

    // 等待动画完成后隐藏
    setTimeout(() => {
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';

      // 恢复页面滚动
      document.body.style.overflow = '';
    }, 300);
  }

  // 重置打赏弹窗
  function resetDonationModal() {
    const donationOptionsContainer = document.getElementById('donationOptions');
    const donationThanks = document.getElementById('donationThanks');
    const paymentQRCode = document.getElementById('paymentQRCode');

    if (donationOptionsContainer) {
      donationOptionsContainer.classList.remove('hidden');
    }
    if (donationThanks) {
      donationThanks.classList.add('hidden');
    }
    if (paymentQRCode) {
      paymentQRCode.classList.add('hidden');
    }
  }
}

// 注：initModals已经在主函数中调用，无需重复初始化