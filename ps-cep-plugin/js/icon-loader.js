/**
 * 图标加载器模块
 * 负责从CDN加载图标数据并解析SVG symbols
 */

(function(window) {
    'use strict';
    
    /**
     * 图标加载器类
     */
    function IconLoader() {
        this.iconData = [];
        this.categories = {
            all: { name: '全部', count: 0 },
            linear: { name: '线性图标', count: 0 },
            filled: { name: '面性图标', count: 0 },
            delicate: { name: '精美图标', count: 0 },
            handdrawn: { name: '手绘图标', count: 0 },
            flat: { name: '扁平图标', count: 0 },
            minimal: { name: '简约图标', count: 0 },
            other: { name: '其他图标', count: 0 }
        };
        this.isLoaded = false;
        this.loadPromise = null;
    }
    
    /**
     * 加载图标数据
     * @returns {Promise} 加载Promise
     */
    IconLoader.prototype.loadIcons = function() {
        if (this.loadPromise) {
            return this.loadPromise;
        }
        
        this.loadPromise = new Promise((resolve, reject) => {
            // 创建script标签加载图标资源
            const script = document.createElement('script');
            script.src = 'https://cdn2.codesign.qq.com/icons/rz0WOY47RrQkP0W/latest/iconfont.js';
            script.onload = () => {
                try {
                    // 等待一小段时间确保SVG插入到DOM
                    setTimeout(() => {
                        this.parseIconData();
                        this.isLoaded = true;
                        resolve(this.iconData);
                    }, 100);
                } catch (error) {
                    console.error('解析图标数据失败:', error);
                    reject(error);
                }
            };
            script.onerror = () => {
                const error = new Error('加载图标资源失败');
                console.error(error);
                reject(error);
            };
            
            document.head.appendChild(script);
        });
        
        return this.loadPromise;
    };
    
    /**
     * 解析图标数据
     */
    IconLoader.prototype.parseIconData = function() {
        const svgContainer = document.querySelector('svg');
        if (!svgContainer) {
            throw new Error('未找到SVG容器');
        }
        
        const symbols = svgContainer.querySelectorAll('symbol');
        console.log(`找到 ${symbols.length} 个图标symbols`);
        
        this.iconData = Array.from(symbols).map(symbol => {
            const id = symbol.id;
            const viewBox = symbol.getAttribute('viewBox') || '0 0 1024 1024';
            const content = symbol.innerHTML;
            const svgCode = `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
            
            // 处理图标名称
            const name = this.processIconName(id);
            
            // 获取分类信息
            const category = this.getIconCategory(id);
            
            // 生成关键词
            const keywords = this.generateKeywords(id, name);
            
            return {
                id: id,
                name: name,
                category: category,
                viewBox: viewBox,
                content: content,
                svg: svgCode,
                keywords: keywords,
                originalColors: {
                    fill: '#409eff',
                    stroke: 'none'
                }
            };
        });
        
        // 更新分类计数
        this.updateCategoryCounts();
        
        console.log(`成功解析 ${this.iconData.length} 个图标`);
    };
    
    /**
     * 处理图标名称
     * @param {string} iconId - 图标ID
     * @returns {string} 处理后的名称
     */
    IconLoader.prototype.processIconName = function(iconId) {
        let processed = iconId.replace(/^icon-/, '');
        // 移除所有分类后缀
        processed = processed.replace(/-x$/, '').replace(/-m$/, '').replace(/-jm$/, '')
                           .replace(/-sh$/, '').replace(/-bp$/, '').replace(/-jy$/, '');
        return processed.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    /**
     * 获取图标分类
     * @param {string} iconId - 图标ID
     * @returns {string} 分类名称
     */
    IconLoader.prototype.getIconCategory = function(iconId) {
        if (iconId.endsWith('-x')) {
            return 'linear';
        } else if (iconId.endsWith('-m')) {
            return 'filled';
        } else if (iconId.endsWith('-jm')) {
            return 'delicate';
        } else if (iconId.endsWith('-sh')) {
            return 'handdrawn';
        } else if (iconId.endsWith('-bp')) {
            return 'flat';
        } else if (iconId.endsWith('-jy')) {
            return 'minimal';
        } else {
            return 'other';
        }
    };
    
    /**
     * 生成关键词
     * @param {string} iconId - 图标ID
     * @param {string} name - 图标名称
     * @returns {Array} 关键词数组
     */
    IconLoader.prototype.generateKeywords = function(iconId, name) {
        const keywords = [
            iconId,
            name.toLowerCase(),
            iconId.replace(/[-_]/g, ' '),
            iconId.replace(/[-_]/g, '')
        ];
        
        // 添加分类关键词
        const category = this.getIconCategory(iconId);
        if (this.categories[category]) {
            keywords.push(this.categories[category].name);
        }
        
        return [...new Set(keywords)]; // 去重
    };
    
    /**
     * 更新分类计数
     */
    IconLoader.prototype.updateCategoryCounts = function() {
        // 重置计数
        Object.keys(this.categories).forEach(key => {
            if (key !== 'all') {
                this.categories[key].count = 0;
            }
        });
        
        // 统计各分类数量
        this.iconData.forEach(icon => {
            if (this.categories[icon.category]) {
                this.categories[icon.category].count++;
            }
        });
        
        // 设置全部分类的总数
        this.categories.all.count = this.iconData.length;
    };
    
    /**
     * 根据关键词搜索图标
     * @param {string} keyword - 搜索关键词
     * @returns {Array} 匹配的图标数组
     */
    IconLoader.prototype.searchIcons = function(keyword) {
        if (!keyword || keyword.trim() === '') {
            return this.iconData;
        }
        
        const searchTerm = keyword.toLowerCase().trim();
        return this.iconData.filter(icon => {
            return icon.name.toLowerCase().includes(searchTerm) ||
                   icon.id.toLowerCase().includes(searchTerm) ||
                   icon.keywords.some(kw => kw.toLowerCase().includes(searchTerm));
        });
    };
    
    /**
     * 根据分类筛选图标
     * @param {string} category - 分类名称
     * @returns {Array} 筛选后的图标数组
     */
    IconLoader.prototype.filterIconsByCategory = function(category) {
        if (category === 'all') {
            return this.iconData;
        }
        return this.iconData.filter(icon => icon.category === category);
    };
    
    /**
     * 根据ID获取图标
     * @param {string} id - 图标ID
     * @returns {Object|null} 图标对象
     */
    IconLoader.prototype.getIconById = function(id) {
        return this.iconData.find(icon => icon.id === id) || null;
    };
    
    /**
     * 获取所有图标数据
     * @returns {Array} 图标数组
     */
    IconLoader.prototype.getAllIcons = function() {
        return this.iconData;
    };
    
    /**
     * 获取分类信息
     * @returns {Object} 分类对象
     */
    IconLoader.prototype.getCategories = function() {
        return this.categories;
    };
    
    /**
     * 检查是否已加载
     * @returns {boolean} 是否已加载
     */
    IconLoader.prototype.isIconsLoaded = function() {
        return this.isLoaded;
    };
    
    // 创建全局实例
    window.iconLoader = new IconLoader();
    
})(window);