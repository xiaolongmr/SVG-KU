/**
 * 颜色管理模块
 * 处理图标颜色选择、随机颜色生成、路径颜色管理等功能
 */

/**
 * 创建自定义颜色选择器
 * @param {string} containerId - 容器ID
 * @param {string} currentColor - 当前颜色值
 * @param {Function} onColorChange - 颜色变化回调函数
 */
function createCustomColorPicker(containerId, currentColor, onColorChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 清空容器
  container.innerHTML = '';

  // 创建颜色选择器容器
  const pickerContainer = document.createElement('div');
  pickerContainer.className = 'custom-color-picker';

  // 创建颜色输入框
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = currentColor;
  colorInput.className = 'color-input';

  // 创建颜色显示区域
  const colorDisplay = document.createElement('div');
  colorDisplay.className = 'color-display';
  colorDisplay.style.backgroundColor = currentColor;

  // 创建颜色值文本
  const colorText = document.createElement('span');
  colorText.className = 'color-text';
  colorText.textContent = currentColor.toUpperCase();

  // 组装元素
  pickerContainer.appendChild(colorInput);
  pickerContainer.appendChild(colorDisplay);
  pickerContainer.appendChild(colorText);
  container.appendChild(pickerContainer);

  // 绑定事件
  colorInput.addEventListener('change', (e) => {
    const newColor = e.target.value;
    colorDisplay.style.backgroundColor = newColor;
    colorText.textContent = newColor.toUpperCase();
    if (onColorChange) onColorChange(newColor);
  });

  return {
    setValue: (color) => {
      colorInput.value = color;
      colorDisplay.style.backgroundColor = color;
      colorText.textContent = color.toUpperCase();
    },
    getValue: () => colorInput.value
  };
}

/**
 * 生成随机颜色
 * @returns {string} 十六进制颜色值
 */
function generateRandomColor() {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
    '#10ac84', '#ee5253', '#0abde3', '#3742fa', '#2f3542',
    '#f368e0', '#feca57', '#48dbfb', '#0abde3', '#ff3838'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 为路径生成随机颜色
 * @param {number} pathCount - 路径数量
 * @returns {Map} 路径索引到颜色的映射
 */
function generateRandomPathColors(pathCount) {
  const pathColors = new Map();
  for (let i = 0; i < pathCount; i++) {
    pathColors.set(i, generateRandomColor());
  }
  return pathColors;
}

/**
 * 创建随机路径颜色按钮
 * @param {string} containerId - 容器ID
 * @param {Function} onRandomize - 随机化回调函数
 */
function createRandomPathColorButton(containerId, onRandomize) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const button = document.createElement('button');
  button.className = 'random-path-color-btn';
  button.innerHTML = '<i class="fa fa-random"></i> 路径随机上色';
  button.title = '为每个路径生成随机颜色';

  button.addEventListener('click', () => {
    if (onRandomize) onRandomize();
  });

  container.appendChild(button);
  return button;
}

/**
 * 检查颜色是否被用户修改过
 * @param {string} iconId - 图标ID
 * @param {Map} originalColors - 原始颜色映射
 * @param {Map} currentColors - 当前颜色映射
 * @returns {boolean} 是否被修改
 */
function isColorModified(iconId, originalColors, currentColors) {
  const originalColor = originalColors.get(iconId);
  const currentColor = currentColors.get(iconId);
  return originalColor !== currentColor;
}

/**
 * 检查路径颜色是否被修改过
 * @param {string} iconId - 图标ID
 * @param {Map} pathColors - 路径颜色映射
 * @returns {boolean} 是否被修改
 */
function isPathColorModified(iconId, pathColors) {
  const iconPathColors = pathColors.get(iconId);
  return iconPathColors && iconPathColors.size > 0;
}

// 导出函数供其他模块使用
window.ColorManager = {
  createCustomColorPicker,
  generateRandomColor,
  generateRandomPathColors,
  createRandomPathColorButton,
  isColorModified,
  isPathColorModified,

  /**
   * 获取带颜色的SVG代码
   * @param {SVGElement} svgElement - SVG元素
   * @returns {string} 带颜色的SVG代码
   */
  getSVGWithColors: function (svgElement) {
    if (!svgElement) return '';

    // 克隆SVG元素以避免修改原始元素
    const clonedSvg = svgElement.cloneNode(true);

    // 获取图标ID
    const iconId = svgElement.closest('[data-icon-id]')?.getAttribute('data-icon-id');

    // 如果找到了图标ID，应用存储的颜色
    if (iconId) {
      this.applyStoredColors(clonedSvg, iconId);
    }

    // 返回完整的SVG代码
    return new XMLSerializer().serializeToString(clonedSvg);
  },

  /**
   * 初始化SVG元素
   * @param {SVGElement} svgElement - SVG元素
   * @param {string} iconId - 图标ID
   */
  initializeSVG: function (svgElement, iconId) {
    // 这个方法主要是为了接口一致性，实际初始化在应用颜色时进行
    console.log(`初始化SVG元素: ${iconId}`);
  },

  /**
   * 应用存储的颜色到SVG元素
   * @param {SVGElement} svgElement - SVG元素
   * @param {string} iconId - 图标ID
   */
  applyStoredColors: function (svgElement, iconId) {
    if (!svgElement || !window.pathColors || !window.iconColors) return;

    const pathMap = window.pathColors.get(iconId);
    const iconColor = window.iconColors.get(iconId);
    const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');

    if (pathMap && pathMap.size > 0) {
      // 应用路径级颜色
      elements.forEach((element, index) => {
        const pathColor = pathMap.get(index);
        if (pathColor) {
          // 检查原始填充状态，只在需要时设置填充颜色
          const originalFill = element.getAttribute('fill');
          if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
            element.setAttribute('fill', pathColor); // 允许设置真正的白色
          }

          // 严格确保：只有当元素原本就有stroke属性且值不为none时，才修改stroke颜色
          // 不添加额外的stroke属性
          const originalStroke = element.getAttribute('stroke');
          if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
            element.setAttribute('stroke', pathColor); // 允许设置真正的白色
          }
        }
      });
    } else if (iconColor) {
      // 应用统一颜色
      elements.forEach(element => {
        // 只对原本有填充颜色的元素设置新的填充颜色
        const originalFill = element.getAttribute('fill');
        if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
          element.setAttribute('fill', iconColor); // 允许设置真正的白色
        }

        // 严格确保：只有当元素原本就有stroke属性且值不为none时，才修改stroke颜色
        // 不添加额外的stroke属性
        const originalStroke = element.getAttribute('stroke');
        if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
          element.setAttribute('stroke', iconColor); // 允许设置真正的白色
        }
      });
    }
  },

  /**
   * 更改SVG元素的颜色
   * @param {SVGElement} svgElement - SVG元素
   * @param {string} iconId - 图标ID
   * @param {string} color - 颜色值
   * @param {number} pathIndex - 路径索引（可选）
   * @returns {boolean} 是否成功
   */
  changeColor: function (svgElement, iconId, color, pathIndex) {
    if (!svgElement || !color) return false;

    try {
      const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');

      if (pathIndex !== undefined && pathIndex >= 0 && pathIndex < elements.length) {
        // 更新单个路径颜色
        const element = elements[pathIndex];

        // 检查原始填充状态，只在需要时设置填充颜色
        const originalFill = element.getAttribute('fill');
        if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
          element.setAttribute('fill', color); // 允许设置真正的白色
        }

        // 严格确保：只有当元素原本就有stroke属性且值不为none时，才修改stroke颜色
        // 不添加额外的stroke属性
        const originalStroke = element.getAttribute('stroke');
        if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
          element.setAttribute('stroke', color); // 允许设置真正的白色
        }
      } else {
        // 更新所有路径颜色
        elements.forEach(element => {
          const originalFill = element.getAttribute('fill');
          if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
            element.setAttribute('fill', color); // 允许设置真正的白色
          }

          const originalStroke = element.getAttribute('stroke');
          if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
            element.setAttribute('stroke', color); // 允许设置真正的白色
          }
        });
      }

      return true;
    } catch (error) {
      console.error('更改SVG颜色失败:', error);
      return false;
    }
  }
};