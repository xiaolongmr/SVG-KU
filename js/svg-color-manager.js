/**
 * SVG颜色管理器 - 基于SVG.js库
 * 提供专业的SVG颜色操作功能，替换原有的自制实现
 * 使用成熟的SVG.js库确保稳定性和兼容性
 */

class SVGColorManager {
  constructor() {
    this.iconColors = new Map(); // 存储图标整体颜色
    this.pathColors = new Map(); // 存储路径级颜色
    this.originalSVGs = new Map(); // 存储原始SVG内容
    this.svgStates = new Map(); // 存储SVG状态信息
  }

  /**
   * 初始化SVG元素，使其可以被SVG.js操作
   * @param {Element} svgElement - 原生SVG DOM元素
   * @param {string} iconId - 图标ID
   * @returns {Object} SVG.js实例
   */
  initializeSVG(svgElement, iconId) {
    if (!svgElement || !iconId) {
      console.warn('SVGColorManager: 无效的SVG元素或图标ID');
      return null;
    }

    try {
      // 保存原始SVG内容
      if (!this.originalSVGs.has(iconId)) {
        this.originalSVGs.set(iconId, svgElement.innerHTML);
      }

      // 创建SVG.js实例
      const svgInstance = SVG(svgElement);
      
      // 确保SVG有正确的viewBox
      if (!svgInstance.viewbox().width) {
        svgInstance.viewbox(0, 0, 1024, 1024);
      }

      return svgInstance;
    } catch (error) {
      console.error('SVGColorManager: 初始化SVG失败', error);
      return null;
    }
  }

  /**
   * 修改SVG颜色
   * @param {Element} svgElement - SVG DOM元素
   * @param {string} iconId - 图标ID
   * @param {string} color - 目标颜色
   * @param {number} pathIndex - 路径索引（-1表示全部路径）
   * @returns {boolean} 操作是否成功
   */
  changeColor(svgElement, iconId, color, pathIndex = -1) {
    const svgInstance = this.initializeSVG(svgElement, iconId);
    if (!svgInstance) return false;

    try {
      // 获取所有可着色的元素
      const elements = svgInstance.find('path, rect, circle, polygon, polyline, line, ellipse');
      
      if (elements.length === 0) {
        console.warn('SVGColorManager: 未找到可着色的SVG元素');
        return false;
      }

      // 处理白色颜色（转换为黑色以确保可见性）
      const finalColor = color === '#ffffff' ? '#000000' : color;

      if (pathIndex >= 0 && pathIndex < elements.length) {
        // 修改单个路径颜色
        const element = elements[pathIndex];
        
        // 检查元素原本是否有填充颜色
        const originalFill = element.node.getAttribute('fill');
        if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
          element.fill(finalColor);
        }
        
        // 只有当元素原本有stroke属性时才设置stroke，避免不必要的描边
        const originalStroke = element.node.getAttribute('stroke');
        if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
          element.stroke(finalColor);
        }
        
        // 保存路径颜色状态
        if (!this.pathColors.has(iconId)) {
          this.pathColors.set(iconId, new Map());
        }
        this.pathColors.get(iconId).set(pathIndex, finalColor);
        
        console.log(`SVGColorManager: 已修改路径 ${pathIndex} 颜色为 ${finalColor}`);
      } else {
        // 修改所有路径颜色
        elements.forEach(element => {
          // 检查元素原本是否有填充颜色
          const originalFill = element.node.getAttribute('fill');
          if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
            element.fill(finalColor);
          }
          
          // 只有当元素原本有stroke属性时才设置stroke，避免不必要的描边
          const originalStroke = element.node.getAttribute('stroke');
          if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
            element.stroke(finalColor);
          }
        });
        
        // 保存整体颜色状态
        this.iconColors.set(iconId, finalColor);
        
        // 清除路径级颜色（因为设置了整体颜色）
        this.pathColors.delete(iconId);
        
        console.log(`SVGColorManager: 已修改所有路径颜色为 ${finalColor}`);
      }

      return true;
    } catch (error) {
      console.error('SVGColorManager: 修改颜色失败', error);
      return false;
    }
  }

  /**
   * 批量修改路径颜色
   * @param {Element} svgElement - SVG DOM元素
   * @param {string} iconId - 图标ID
   * @param {Array} colors - 颜色数组
   * @returns {boolean} 操作是否成功
   */
  changePathColors(svgElement, iconId, colors) {
    if (!Array.isArray(colors) || colors.length === 0) {
      console.warn('SVGColorManager: 无效的颜色数组');
      return false;
    }

    const svgInstance = this.initializeSVG(svgElement, iconId);
    if (!svgInstance) return false;

    try {
      const elements = svgInstance.find('path, rect, circle, polygon, polyline, line, ellipse');
      
      if (elements.length === 0) {
        console.warn('SVGColorManager: 未找到可着色的SVG元素');
        return false;
      }

      // 初始化路径颜色映射
      if (!this.pathColors.has(iconId)) {
        this.pathColors.set(iconId, new Map());
      }
      const pathColorMap = this.pathColors.get(iconId);

      // 为每个路径应用对应颜色
      elements.forEach((element, index) => {
        if (index < colors.length && colors[index]) {
          const finalColor = colors[index] === '#ffffff' ? '#000000' : colors[index];
          
          // 检查元素的原始状态
          const originalFill = element.node.getAttribute('fill');
          const originalStroke = element.node.getAttribute('stroke');
          
          // 根据原始状态决定处理方式
          if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
            // 有填充颜色的元素：更新填充颜色
            element.fill(finalColor);
          }
          
          if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
            // 有描边的元素：更新描边颜色
            element.stroke(finalColor);
          }
          
          // 如果元素既没有填充也没有描边，则根据情况处理
          if ((!originalFill || originalFill === 'none' || originalFill === 'transparent') &&
              (!originalStroke || originalStroke === 'none' || originalStroke === 'transparent')) {
            // 对于完全没有颜色的元素，默认添加填充颜色
            element.fill(finalColor);
          }
          
          pathColorMap.set(index, finalColor);
        }
      });

      // 清除整体颜色（因为设置了路径级颜色）
      this.iconColors.delete(iconId);

      console.log(`SVGColorManager: 已批量修改 ${Math.min(elements.length, colors.length)} 个路径颜色`);
      return true;
    } catch (error) {
      console.error('SVGColorManager: 批量修改颜色失败', error);
      return false;
    }
  }

  /**
   * 检查元素是否应该处理颜色（包括继承的颜色）
   * @param {Element} element - SVG元素
   * @param {string} attribute - 颜色属性名（'fill' 或 'stroke'）
   * @returns {boolean} 是否应该处理
   */
  shouldProcessElementColor(element, attribute) {
    // 检查元素自身的属性
    const ownValue = element.getAttribute(attribute);
    
    // 如果元素有明确的颜色值（非none、transparent），则处理
    if (ownValue && ownValue !== 'none' && ownValue !== 'transparent') {
      return true;
    }
    
    // 如果元素没有自己的颜色属性，检查是否从父级继承
    if (!ownValue || ownValue === 'none' || ownValue === 'transparent') {
      // 查找有相应属性的父级<g>元素
      const parentG = element.closest(`g[${attribute}]`);
      if (parentG) {
        const parentValue = parentG.getAttribute(attribute);
        if (parentValue && parentValue !== 'none' && parentValue !== 'transparent') {
          return true;
        }
      }
      
      // 对于既没有自身颜色也没有父级颜色的元素，需要进一步判断
     if (attribute === 'fill') {
       // 检查元素是否有stroke属性，如果只有stroke，则不应该添加fill
       const ownStroke = element.getAttribute('stroke');
       const parentGStroke = element.closest('g[stroke]');
       const hasStroke = (ownStroke && ownStroke !== 'none' && ownStroke !== 'transparent') ||
                        (parentGStroke && parentGStroke.getAttribute('stroke') && 
                         parentGStroke.getAttribute('stroke') !== 'none' && 
                         parentGStroke.getAttribute('stroke') !== 'transparent');
       
       // 如果元素有stroke但没有fill，则不应该添加fill（保持线性风格）
       if (hasStroke) {
         return false;
       }
       
       // 如果元素既没有fill也没有stroke，则当作需要fill处理
       return true;
     }
    }
    
    return false;
  }

  /**
   * 生成随机颜色
   * @returns {string} 十六进制颜色值
   */
  generateRandomColor() {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
      '#10ac84', '#ee5253', '#0abde3', '#3742fa', '#2f3542',
      '#f368e0', '#feca57', '#48dbfb', '#0abde3', '#ff3838',
      '#a55eea', '#26de81', '#fd79a8', '#fdcb6e', '#6c5ce7'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * 随机化SVG中所有的渐变定义
   * @param {Element} svgElement - SVG DOM元素
   * @param {Element} defsElement - defs DOM元素
   */
  randomizeAllGradients(svgElement, defsElement) {
    try {
      // 查找所有的linearGradient和radialGradient元素
      const allGradients = defsElement.querySelectorAll('linearGradient, radialGradient');
      
      if (allGradients.length === 0) {
        console.log('SVGColorManager: 未找到任何渐变定义');
        return;
      }

      console.log(`SVGColorManager: 找到 ${allGradients.length} 个渐变定义，开始随机化`);

      allGradients.forEach((gradient, index) => {
        const gradientId = gradient.getAttribute('id');
        const gradientType = gradient.tagName;
        
        // 获取当前渐变的所有stop元素
        const stops = gradient.querySelectorAll('stop');
        
        if (stops.length === 0) {
          console.warn(`SVGColorManager: 渐变 ${gradientId} 没有stop元素`);
          return;
        }

        // 生成2-3个随机颜色（根据stop数量决定）
        const stopCount = Math.max(2, Math.min(3, stops.length));
        const randomColors = [];
        
        // 生成不重复的随机颜色
        for (let i = 0; i < stopCount; i++) {
          let newColor;
          do {
            newColor = this.generateRandomColor();
          } while (randomColors.includes(newColor));
          randomColors.push(newColor);
        }

        console.log(`SVGColorManager: 为${gradientType} ${gradientId} 生成随机颜色:`, randomColors);

        // 将随机颜色分配给stop元素
        for (let i = 0; i < stops.length && i < randomColors.length; i++) {
          stops[i].setAttribute('stop-color', randomColors[i]);
        }
        
        // 如果stop数量超过生成的颜色数量，用最后一个颜色填充
        if (stops.length > randomColors.length) {
          const lastColor = randomColors[randomColors.length - 1];
          for (let i = randomColors.length; i < stops.length; i++) {
            stops[i].setAttribute('stop-color', lastColor);
          }
        }

        // 强制刷新渐变渲染
        this.forceGradientRefresh(svgElement, gradient, gradientId);
      });

      console.log(`SVGColorManager: 已完成所有渐变的随机化`);
    } catch (error) {
      console.error('SVGColorManager: 随机化渐变失败', error);
    }
  }

  /**
   * 强制刷新渐变渲染
   * @param {Element} svgElement - SVG DOM元素
   * @param {Element} gradientElement - 渐变元素
   * @param {string} gradientId - 渐变ID
   */
  forceGradientRefresh(svgElement, gradientElement, gradientId) {
    try {
      // 使用更强的刷新机制来确保渐变色变化立即可见
      // 方法1: 重新创建渐变元素
      const newGradient = gradientElement.cloneNode(true);
      gradientElement.parentNode.replaceChild(newGradient, gradientElement);
      
      // 方法2: 强制SVG重新渲染
      const svgDisplay = svgElement.style.display;
      svgElement.style.display = 'none';
      svgElement.offsetHeight; // 触发重排
      svgElement.style.display = svgDisplay || '';
      
      // 方法3: 使用requestAnimationFrame确保渲染完成
      requestAnimationFrame(() => {
        // 额外的渲染刷新
        const parentElement = svgElement.parentElement;
        if (parentElement) {
          parentElement.style.transform = 'translateZ(0)';
          requestAnimationFrame(() => {
            parentElement.style.transform = '';
          });
        }
      });
      
      console.log(`SVGColorManager: 已强制刷新渐变 ${gradientId} 的渲染`);
    } catch (error) {
      console.error(`SVGColorManager: 刷新渐变 ${gradientId} 失败`, error);
    }
  }

  /**
   * 强制全局SVG刷新
   * @param {Element} svgElement - SVG DOM元素
   */
  forceGlobalSVGRefresh(svgElement) {
    try {
      // 方法1: 强制重排和重绘（安全的方式）
      svgElement.style.display = 'none';
      svgElement.offsetHeight; // 触发重排
      svgElement.style.display = '';
      
      // 方法2: 修改SVG的关键属性强制重新渲染
      const currentViewBox = svgElement.getAttribute('viewBox');
      if (currentViewBox) {
        svgElement.removeAttribute('viewBox');
        svgElement.offsetHeight; // 触发重排
        svgElement.setAttribute('viewBox', currentViewBox);
      }
      
      // 方法3: 使用requestAnimationFrame确保渲染完成
      requestAnimationFrame(() => {
        const parentElement = svgElement.parentElement;
        if (parentElement) {
          parentElement.style.transform = 'translateZ(0)';
          requestAnimationFrame(() => {
            parentElement.style.transform = '';
          });
        }
      });
      
      console.log('SVGColorManager: 已执行全局SVG刷新');
    } catch (error) {
      console.error('SVGColorManager: 全局SVG刷新失败', error);
    }
  }

  /**
   * 为SVG的所有路径生成随机颜色（支持渐变色处理）
   * @param {Element} svgElement - SVG DOM元素
   * @param {string} iconId - 图标ID
   * @returns {boolean} 操作是否成功
   */
  applyRandomPathColors(svgElement, iconId) {
    const svgInstance = this.initializeSVG(svgElement, iconId);
    if (!svgInstance) return false;

    try {
      const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
      
      if (elements.length === 0) {
        console.warn('SVGColorManager: 未找到可着色的SVG元素');
        return false;
      }

      // 确保SVG有defs元素
      let defsElement = svgElement.querySelector('defs');
      if (!defsElement) {
        defsElement = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svgElement.insertBefore(defsElement, svgElement.firstChild);
      }

      // 新增功能：自动检测并随机化所有渐变定义
      this.randomizeAllGradients(svgElement, defsElement);

      const pathColorsMap = new Map();
      let updatedCount = 0;

      elements.forEach((el, index) => {
        // 检查元素是否已经有渐变色
        const currentFill = el.getAttribute('fill');
        const hasGradient = currentFill && currentFill.startsWith('url(#');
        
        console.log(`SVGColorManager: 检查路径 ${index}, 当前fill: ${currentFill}, 是否为渐变: ${hasGradient}`);
        
        let fillValue;
        
        if (hasGradient) {
          // 渐变色路径：由于已经在全局随机化中处理过所有渐变，这里只需保持引用
          fillValue = currentFill; // 保持原有的fill引用
          console.log(`SVGColorManager: 路径 ${index} 使用渐变色 ${currentFill}，已在全局随机化中处理`);
        } else {
          // 检查元素原本是否有填充颜色
          const originalFill = el.getAttribute('fill');
          const originalStroke = el.getAttribute('stroke');
          
          // 检查是否应该处理这个元素的颜色
          const shouldProcessFill = this.shouldProcessElementColor(el, 'fill');
          const shouldProcessStroke = this.shouldProcessElementColor(el, 'stroke');
          
          if (shouldProcessFill) {
            fillValue = this.generateRandomColor();
            
            // 如果元素没有自己的fill属性，检查是否需要修改父级
            if (!originalFill || originalFill === 'none' || originalFill === 'transparent') {
              const parentG = el.closest('g[fill]');
              if (parentG) {
                parentG.setAttribute('fill', fillValue);
                console.log(`SVGColorManager: 为路径 ${index} 的父级<g>设置随机填充颜色: ${fillValue}`);
              } else {
                el.setAttribute('fill', fillValue);
                console.log(`SVGColorManager: 为路径 ${index} 设置随机填充颜色: ${fillValue}`);
              }
            } else {
              el.setAttribute('fill', fillValue);
              console.log(`SVGColorManager: 为路径 ${index} 设置随机填充颜色: ${fillValue}`);
            }
          } else {
            // 保持原本没有填充颜色的元素不变
            fillValue = originalFill || 'none';
            console.log(`SVGColorManager: 跳过路径 ${index}，无需处理填充颜色`);
          }
          
          // 对于有描边的元素，生成独立的随机颜色给描边
          if (shouldProcessStroke) {
            const strokeColor = this.generateRandomColor();
            
            if (!originalStroke || originalStroke === 'none' || originalStroke === 'transparent') {
              const parentG = el.closest('g[stroke]');
              if (parentG) {
                parentG.setAttribute('stroke', strokeColor);
                console.log(`SVGColorManager: 为路径 ${index} 的父级<g>设置随机描边颜色: ${strokeColor}`);
              } else {
                el.setAttribute('stroke', strokeColor);
                console.log(`SVGColorManager: 为路径 ${index} 设置随机描边颜色: ${strokeColor}`);
              }
            } else {
              el.setAttribute('stroke', strokeColor);
              console.log(`SVGColorManager: 为路径 ${index} 设置随机描边颜色: ${strokeColor}`);
            }
          }
        }
        
        pathColorsMap.set(index, fillValue);
        updatedCount++;
      });

      // 更新内部状态
      if (!this.svgStates.has(iconId)) {
        this.svgStates.set(iconId, { pathColors: new Map(), iconColor: null });
      }
      this.svgStates.get(iconId).pathColors = pathColorsMap;
      this.svgStates.get(iconId).iconColor = null; // 清除整体颜色

      console.log(`SVGColorManager: 已为 ${updatedCount} 个路径应用随机颜色（包含渐变色处理）`);
      return true;
    } catch (error) {
      console.error('SVGColorManager: 应用随机路径颜色失败', error);
      return false;
    }
  }

  /**
   * 重置SVG颜色到原始状态
   * @param {Element} svgElement - SVG DOM元素
   * @param {string} iconId - 图标ID
   * @returns {boolean} 操作是否成功
   */
  resetColor(svgElement, iconId) {
    if (!svgElement || !iconId) {
      console.warn('SVGColorManager: 无效的SVG元素或图标ID');
      return false;
    }

    try {
      // 获取原始SVG内容
      const originalSVG = this.originalSVGs.get(iconId);
      if (originalSVG) {
        svgElement.innerHTML = originalSVG;
      }

      // 清除颜色状态
      this.iconColors.delete(iconId);
      this.pathColors.delete(iconId);

      console.log(`SVGColorManager: 已重置图标 ${iconId} 的颜色`);
      return true;
    } catch (error) {
      console.error('SVGColorManager: 重置颜色失败', error);
      return false;
    }
  }

  /**
   * 获取SVG的当前颜色状态
   * @param {string} iconId - 图标ID
   * @returns {Object} 颜色状态信息
   */
  getColorState(iconId) {
    // 优先从svgStates获取状态，兼容旧的pathColors
    const svgState = this.svgStates.get(iconId);
    const pathColors = svgState ? svgState.pathColors : (this.pathColors.get(iconId) || new Map());
    const overallColor = svgState ? svgState.iconColor : (this.iconColors.get(iconId) || null);
    
    return {
      overallColor: overallColor,
      pathColors: pathColors,
      hasCustomColors: pathColors.size > 0 || overallColor !== null
    };
  }

  /**
   * 应用已保存的颜色状态到SVG元素
   * @param {Element} svgElement - SVG DOM元素
   * @param {string} iconId - 图标ID
   * @returns {boolean} 操作是否成功
   */
  applyStoredColors(svgElement, iconId) {
    const colorState = this.getColorState(iconId);
    
    if (!colorState.hasCustomColors) {
      return true; // 没有自定义颜色，保持原样
    }

    const svgInstance = this.initializeSVG(svgElement, iconId);
    if (!svgInstance) return false;

    try {
      const elements = svgInstance.find('path, rect, circle, polygon, polyline, line, ellipse');
      
      if (colorState.pathColors.size > 0) {
        // 应用路径级颜色
        elements.forEach((element, index) => {
          const pathColor = colorState.pathColors.get(index);
          if (pathColor) {
            // 检查元素的原始状态
            const originalFill = element.node.getAttribute('fill');
            const originalStroke = element.node.getAttribute('stroke');
            
            // 根据原始状态决定处理方式
            if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
              // 有填充颜色的元素：更新填充颜色
              element.fill(pathColor);
            }
            
            if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
              // 有描边的元素：更新描边颜色
              element.stroke(pathColor);
            }
            
            // 如果元素既没有填充也没有描边，则根据情况处理
            if ((!originalFill || originalFill === 'none' || originalFill === 'transparent') &&
                (!originalStroke || originalStroke === 'none' || originalStroke === 'transparent')) {
              // 对于完全没有颜色的元素，默认添加填充颜色
              element.fill(pathColor);
            }
          }
        });
      } else if (colorState.overallColor) {
        // 应用整体颜色
        elements.forEach(element => {
          // 检查元素的原始状态
          const originalFill = element.node.getAttribute('fill');
          const originalStroke = element.node.getAttribute('stroke');
          
          // 根据原始状态决定处理方式
          if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
            // 有填充颜色的元素：更新填充颜色
            element.fill(colorState.overallColor);
          }
          
          if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
            // 有描边的元素：更新描边颜色
            element.stroke(colorState.overallColor);
          }
          
          // 如果元素既没有填充也没有描边，则根据情况处理
          if ((!originalFill || originalFill === 'none' || originalFill === 'transparent') &&
              (!originalStroke || originalStroke === 'none' || originalStroke === 'transparent')) {
            // 对于完全没有颜色的元素，默认添加填充颜色
            element.fill(colorState.overallColor);
          }
        });
      }

      return true;
    } catch (error) {
      console.error('SVGColorManager: 应用存储的颜色失败', error);
      return false;
    }
  }

  /**
   * 获取SVG的当前颜色代码（用于导出）
   * @param {Element} svgElement - SVG DOM元素
   * @returns {string} 包含颜色信息的SVG代码
   */
  getSVGWithColors(svgElement) {
    if (!svgElement) {
      console.warn('SVGColorManager: 无效的SVG元素');
      return '';
    }

    try {
      // 获取完整的SVG代码
      const svgCode = svgElement.outerHTML;
      
      // 确保SVG包含viewBox属性
      if (!svgCode.includes('viewBox')) {
        return svgCode.replace('<svg', '<svg viewBox="0 0 1024 1024"');
      }
      
      return svgCode;
    } catch (error) {
      console.error('SVGColorManager: 获取SVG代码失败', error);
      return '';
    }
  }

  /**
   * 清除所有颜色状态
   */
  clearAllColors() {
    this.iconColors.clear();
    this.pathColors.clear();
    console.log('SVGColorManager: 已清除所有颜色状态');
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      totalIcons: this.originalSVGs.size,
      iconsWithOverallColor: this.iconColors.size,
      iconsWithPathColors: this.pathColors.size,
      totalCustomizedIcons: new Set([...this.iconColors.keys(), ...this.pathColors.keys()]).size
    };
  }
}

// 检查SVG.js是否加载
if (typeof SVG === 'undefined') {
  console.error('SVGColorManager: SVG.js库未加载，请检查CDN链接');
  window.svgColorManager = null;
} else {
  console.log('SVGColorManager: SVG.js库已成功加载，版本:', SVG.version || 'unknown');
  // 创建全局实例
  window.svgColorManager = new SVGColorManager();
  console.log('SVGColorManager: 基于SVG.js的颜色管理器已加载');
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SVGColorManager;
}