/**
 * 颜色管理器模块
 * 负责图标颜色编辑和管理
 */

(function(window) {
    'use strict';
    
    /**
     * 颜色管理器类
     */
    function ColorManager() {
        this.currentIcon = null;
        this.iconColors = new Map(); // 存储每个图标的颜色设置
        this.defaultColors = {
            fill: '#409eff',
            stroke: '#000000'
        };
        
        this.initializeEventListeners();
    }
    
    /**
     * 初始化事件监听器
     */
    ColorManager.prototype.initializeEventListeners = function() {
        // 填充颜色变化
        const fillColorInput = document.getElementById('fillColor');
        const fillColorText = document.getElementById('fillColorText');
        
        if (fillColorInput && fillColorText) {
            fillColorInput.addEventListener('change', (e) => {
                fillColorText.value = e.target.value;
                this.updateIconColor('fill', e.target.value);
            });
            
            fillColorText.addEventListener('change', (e) => {
                const color = this.validateColor(e.target.value);
                if (color) {
                    fillColorInput.value = color;
                    this.updateIconColor('fill', color);
                } else {
                    e.target.value = fillColorInput.value;
                }
            });
        }
        
        // 描边颜色变化
        const strokeColorInput = document.getElementById('strokeColor');
        const strokeColorText = document.getElementById('strokeColorText');
        
        if (strokeColorInput && strokeColorText) {
            strokeColorInput.addEventListener('change', (e) => {
                strokeColorText.value = e.target.value;
                this.updateIconColor('stroke', e.target.value);
            });
            
            strokeColorText.addEventListener('change', (e) => {
                const color = this.validateColor(e.target.value);
                if (color) {
                    strokeColorInput.value = color;
                    this.updateIconColor('stroke', color);
                } else {
                    e.target.value = strokeColorInput.value;
                }
            });
        }
        
        // 随机颜色按钮
        const randomColorBtn = document.getElementById('randomColorBtn');
        if (randomColorBtn) {
            randomColorBtn.addEventListener('click', () => {
                this.applyRandomColors();
            });
        }
        
        // 重置颜色按钮
        const resetColorBtn = document.getElementById('resetColorBtn');
        if (resetColorBtn) {
            resetColorBtn.addEventListener('click', () => {
                this.resetColors();
            });
        }
    };
    
    /**
     * 设置当前编辑的图标
     * @param {Object} icon - 图标对象
     */
    ColorManager.prototype.setCurrentIcon = function(icon) {
        this.currentIcon = icon;
        
        // 获取或创建图标的颜色设置
        let colors = this.iconColors.get(icon.id);
        if (!colors) {
            colors = {
                fill: icon.originalColors.fill || this.defaultColors.fill,
                stroke: icon.originalColors.stroke || this.defaultColors.stroke
            };
            this.iconColors.set(icon.id, colors);
        }
        
        // 更新颜色编辑器界面
        this.updateColorEditor(colors);
        
        // 显示颜色编辑器
        this.showColorEditor();
    };
    
    /**
     * 更新颜色编辑器界面
     * @param {Object} colors - 颜色对象
     */
    ColorManager.prototype.updateColorEditor = function(colors) {
        const fillColorInput = document.getElementById('fillColor');
        const fillColorText = document.getElementById('fillColorText');
        const strokeColorInput = document.getElementById('strokeColor');
        const strokeColorText = document.getElementById('strokeColorText');
        
        if (fillColorInput && fillColorText) {
            fillColorInput.value = colors.fill;
            fillColorText.value = colors.fill;
        }
        
        if (strokeColorInput && strokeColorText) {
            strokeColorInput.value = colors.stroke;
            strokeColorText.value = colors.stroke;
        }
    };
    
    /**
     * 显示颜色编辑器
     */
    ColorManager.prototype.showColorEditor = function() {
        const colorEditor = document.getElementById('colorEditor');
        if (colorEditor) {
            colorEditor.classList.remove('hidden');
        }
    };
    
    /**
     * 隐藏颜色编辑器
     */
    ColorManager.prototype.hideColorEditor = function() {
        const colorEditor = document.getElementById('colorEditor');
        if (colorEditor) {
            colorEditor.classList.add('hidden');
        }
        this.currentIcon = null;
    };
    
    /**
     * 更新图标颜色
     * @param {string} type - 颜色类型 ('fill' 或 'stroke')
     * @param {string} color - 颜色值
     */
    ColorManager.prototype.updateIconColor = function(type, color) {
        if (!this.currentIcon) return;
        
        // 更新颜色存储
        let colors = this.iconColors.get(this.currentIcon.id);
        if (!colors) {
            colors = { ...this.defaultColors };
            this.iconColors.set(this.currentIcon.id, colors);
        }
        colors[type] = color;
        
        // 更新图标显示
        this.applyColorsToIcon(this.currentIcon.id, colors);
    };
    
    /**
     * 应用颜色到图标
     * @param {string} iconId - 图标ID
     * @param {Object} colors - 颜色对象
     */
    ColorManager.prototype.applyColorsToIcon = function(iconId, colors) {
        const iconElement = document.querySelector(`[data-icon-id="${iconId}"]`);
        if (!iconElement) return;
        
        const svgElement = iconElement.querySelector('svg');
        if (!svgElement) return;
        
        // 应用填充颜色
        const fillElements = svgElement.querySelectorAll('path, circle, rect, polygon, ellipse');
        fillElements.forEach(el => {
            if (!el.getAttribute('fill') || el.getAttribute('fill') !== 'none') {
                el.setAttribute('fill', colors.fill);
            }
        });
        
        // 应用描边颜色
        const strokeElements = svgElement.querySelectorAll('[stroke]');
        strokeElements.forEach(el => {
            if (el.getAttribute('stroke') !== 'none') {
                el.setAttribute('stroke', colors.stroke);
            }
        });
    };
    
    /**
     * 应用随机颜色
     */
    ColorManager.prototype.applyRandomColors = function() {
        if (!this.currentIcon) return;
        
        const randomFill = this.generateRandomColor();
        const randomStroke = this.generateRandomColor();
        
        // 更新颜色编辑器
        this.updateColorEditor({
            fill: randomFill,
            stroke: randomStroke
        });
        
        // 更新图标颜色
        this.updateIconColor('fill', randomFill);
        this.updateIconColor('stroke', randomStroke);
    };
    
    /**
     * 重置颜色
     */
    ColorManager.prototype.resetColors = function() {
        if (!this.currentIcon) return;
        
        const defaultColors = {
            fill: this.currentIcon.originalColors.fill || this.defaultColors.fill,
            stroke: this.currentIcon.originalColors.stroke || this.defaultColors.stroke
        };
        
        // 更新颜色编辑器
        this.updateColorEditor(defaultColors);
        
        // 更新图标颜色
        this.updateIconColor('fill', defaultColors.fill);
        this.updateIconColor('stroke', defaultColors.stroke);
    };
    
    /**
     * 生成随机颜色
     * @returns {string} 十六进制颜色值
     */
    ColorManager.prototype.generateRandomColor = function() {
        const colors = [
            '#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399',
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
            '#10ac84', '#ee5a24', '#0984e3', '#6c5ce7', '#a29bfe'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };
    
    /**
     * 验证颜色值
     * @param {string} color - 颜色值
     * @returns {string|null} 有效的颜色值或null
     */
    ColorManager.prototype.validateColor = function(color) {
        // 简单的十六进制颜色验证
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (hexRegex.test(color)) {
            return color;
        }
        
        // 尝试使用CSS颜色名称
        const testElement = document.createElement('div');
        testElement.style.color = color;
        if (testElement.style.color) {
            return color;
        }
        
        return null;
    };
    
    /**
     * 获取当前图标的颜色
     * @returns {Object|null} 颜色对象
     */
    ColorManager.prototype.getCurrentColors = function() {
        if (!this.currentIcon) return null;
        return this.iconColors.get(this.currentIcon.id) || null;
    };
    
    /**
     * 获取图标的SVG代码（包含颜色）
     * @param {string} iconId - 图标ID（可选，默认使用当前图标）
     * @returns {string} SVG代码
     */
    ColorManager.prototype.getIconSvgWithColors = function(iconId) {
        const targetIconId = iconId || (this.currentIcon ? this.currentIcon.id : null);
        if (!targetIconId) return '';
        
        const icon = window.iconLoader.getIconById(targetIconId);
        if (!icon) return '';
        
        const colors = this.iconColors.get(targetIconId);
        if (!colors) return icon.svg;
        
        // 创建临时DOM元素来处理SVG
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = icon.svg;
        const svgElement = tempDiv.querySelector('svg');
        
        if (svgElement) {
            // 应用颜色
            const fillElements = svgElement.querySelectorAll('path, circle, rect, polygon, ellipse');
            fillElements.forEach(el => {
                if (!el.getAttribute('fill') || el.getAttribute('fill') !== 'none') {
                    el.setAttribute('fill', colors.fill);
                }
            });
            
            const strokeElements = svgElement.querySelectorAll('[stroke]');
            strokeElements.forEach(el => {
                if (el.getAttribute('stroke') !== 'none') {
                    el.setAttribute('stroke', colors.stroke);
                }
            });
            
            return svgElement.outerHTML;
        }
        
        return icon.svg;
    };
    
    /**
     * 获取图标的颜色信息
     * @param {string} iconId - 图标ID
     * @returns {Object} 颜色对象
     */
    ColorManager.prototype.getIconColors = function(iconId) {
        return this.iconColors.get(iconId) || null;
    };
    
    // 创建全局实例
    window.colorManager = new ColorManager();
    
})(window);