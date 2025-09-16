/**
 * CEP插件主应用逻辑
 * 整合图标加载、颜色管理、PS接口等功能
 */

(function(window) {
    'use strict';
    
    /**
     * 主应用类
     */
    function IconLibraryApp() {
        this.currentCategory = 'all';
        this.currentSearchTerm = '';
        this.selectedIcons = new Set();
        this.filteredIcons = [];
        this.isLoading = false;
        
        this.initializeApp();
    }
    
    /**
     * 初始化应用
     */
    IconLibraryApp.prototype.initializeApp = function() {
        console.log('初始化飞草科技图标库CEP插件...');
        
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.loadIcons();
            });
        } else {
            this.setupEventListeners();
            this.loadIcons();
        }
    };
    
    /**
     * 设置事件监听器
     */
    IconLibraryApp.prototype.setupEventListeners = function() {
        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const searchTerm = searchInput ? searchInput.value : '';
                this.handleSearch(searchTerm);
            });
        }
        
        // 分类筛选
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-category');
                this.handleCategoryFilter(category);
            });
        });
        
        // 复制PNG按钮
        const copyPngBtn = document.getElementById('copyPngBtn');
        if (copyPngBtn) {
            copyPngBtn.addEventListener('click', () => {
                this.copyIconAsPng();
            });
        }
        
        // 发送到图层按钮
        const sendToLayerBtn = document.getElementById('sendToLayerBtn');
        if (sendToLayerBtn) {
            sendToLayerBtn.addEventListener('click', () => {
                this.sendIconToPhotoshop();
            });
        }
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    };
    
    /**
     * 加载图标
     */
    IconLibraryApp.prototype.loadIcons = function() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        window.iconLoader.loadIcons()
            .then((iconData) => {
                this.filteredIcons = iconData;
                this.renderIconGrid();
                this.updateCategoryButtons();
                this.updateStatusBar();
                this.isLoading = false;
                console.log(`成功加载 ${iconData.length} 个图标`);
            })
            .catch((error) => {
                console.error('加载图标失败:', error);
                this.showError('图标加载失败: ' + error.message);
                this.isLoading = false;
            });
    };
    
    /**
     * 显示加载状态
     */
    IconLibraryApp.prototype.showLoadingState = function() {
        const iconGrid = document.getElementById('iconGrid');
        if (iconGrid) {
            iconGrid.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>加载图标中...</p>
                </div>
            `;
        }
    };
    
    /**
     * 渲染图标网格
     */
    IconLibraryApp.prototype.renderIconGrid = function() {
        const iconGrid = document.getElementById('iconGrid');
        if (!iconGrid) return;
        
        if (this.filteredIcons.length === 0) {
            iconGrid.innerHTML = `
                <div class="loading-state">
                    <p>未找到匹配的图标</p>
                </div>
            `;
            return;
        }
        
        iconGrid.innerHTML = '';
        
        this.filteredIcons.forEach(icon => {
            const iconElement = this.createIconElement(icon);
            iconGrid.appendChild(iconElement);
        });
    };
    
    /**
     * 创建图标元素
     * @param {Object} icon - 图标数据
     * @returns {HTMLElement} 图标DOM元素
     */
    IconLibraryApp.prototype.createIconElement = function(icon) {
        const container = document.createElement('div');
        container.className = 'icon-item';
        container.setAttribute('data-icon-id', icon.id);
        container.setAttribute('data-category', icon.category);
        
        // 添加分类标签
        const categoryLabel = document.createElement('div');
        categoryLabel.className = `category-badge category-${icon.category}`;
        
        const categoryNames = {
            linear: '线性',
            filled: '面性',
            delicate: '精美',
            handdrawn: '手绘',
            flat: '扁平',
            minimal: '简约',
            other: '其他'
        };
        
        categoryLabel.textContent = categoryNames[icon.category] || '其他';
        categoryLabel.title = categoryNames[icon.category] + '图标';
        container.appendChild(categoryLabel);
        
        // 创建SVG容器
        const svgWrapper = document.createElement('div');
        svgWrapper.className = 'icon-svg';
        
        // 创建SVG元素
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = icon.svg;
        const svgElement = tempDiv.querySelector('svg');
        
        if (svgElement) {
            svgElement.setAttribute('width', '32');
            svgElement.setAttribute('height', '32');
            svgWrapper.appendChild(svgElement);
        }
        
        // 创建图标名称
        const iconName = document.createElement('div');
        iconName.className = 'icon-name';
        iconName.textContent = icon.name;
        
        // 组装元素
        container.appendChild(svgWrapper);
        container.appendChild(iconName);
        
        // 添加点击事件
        container.addEventListener('click', (e) => {
            this.handleIconClick(icon, e);
        });
        
        return container;
    };
    
    /**
     * 处理图标点击事件
     * @param {Object} icon - 图标数据
     * @param {Event} event - 点击事件
     */
    IconLibraryApp.prototype.handleIconClick = function(icon, event) {
        const iconElement = event.currentTarget;
        
        // 检查是否是多选模式（Ctrl键）
        if (event.ctrlKey || event.metaKey) {
            this.toggleIconSelection(icon, iconElement);
        } else {
            // 单选模式
            this.selectSingleIcon(icon, iconElement);
        }
        
        // 更新界面状态
        this.updateUIState();
    };
    
    /**
     * 切换图标选择状态
     * @param {Object} icon - 图标数据
     * @param {HTMLElement} iconElement - 图标DOM元素
     */
    IconLibraryApp.prototype.toggleIconSelection = function(icon, iconElement) {
        if (this.selectedIcons.has(icon.id)) {
            this.selectedIcons.delete(icon.id);
            iconElement.classList.remove('selected');
        } else {
            this.selectedIcons.add(icon.id);
            iconElement.classList.add('selected');
        }
    };
    
    /**
     * 选择单个图标
     * @param {Object} icon - 图标数据
     * @param {HTMLElement} iconElement - 图标DOM元素
     */
    IconLibraryApp.prototype.selectSingleIcon = function(icon, iconElement) {
        // 清除所有选择
        this.clearAllSelections();
        
        // 选择当前图标
        this.selectedIcons.add(icon.id);
        iconElement.classList.add('selected');
        
        // 设置颜色编辑器
        if (window.colorManager && typeof window.colorManager.setCurrentIcon === 'function') {
            window.colorManager.setCurrentIcon(icon);
        }
    };
    
    /**
     * 清除所有选择
     */
    IconLibraryApp.prototype.clearAllSelections = function() {
        this.selectedIcons.clear();
        
        const selectedElements = document.querySelectorAll('.icon-item.selected');
        selectedElements.forEach(el => {
            el.classList.remove('selected');
        });
        
        // 隐藏颜色编辑器
        if (window.colorManager && typeof window.colorManager.hideColorEditor === 'function') {
            window.colorManager.hideColorEditor();
        }
    };
    
    /**
     * 处理搜索
     * @param {string} searchTerm - 搜索词
     */
    IconLibraryApp.prototype.handleSearch = function(searchTerm) {
        this.currentSearchTerm = searchTerm;
        this.applyFilters();
    };
    
    /**
     * 处理分类筛选
     * @param {string} category - 分类名称
     */
    IconLibraryApp.prototype.handleCategoryFilter = function(category) {
        this.currentCategory = category;
        
        // 更新分类按钮状态
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-category') === category) {
                btn.classList.add('active');
            }
        });
        
        this.applyFilters();
    };
    
    /**
     * 应用筛选条件
     */
    IconLibraryApp.prototype.applyFilters = function() {
        let icons = window.iconLoader.getAllIcons();
        
        // 应用分类筛选
        if (this.currentCategory !== 'all') {
            icons = window.iconLoader.filterIconsByCategory(this.currentCategory);
        }
        
        // 应用搜索筛选
        if (this.currentSearchTerm) {
            icons = window.iconLoader.searchIcons(this.currentSearchTerm).filter(icon => {
                return this.currentCategory === 'all' || icon.category === this.currentCategory;
            });
        }
        
        this.filteredIcons = icons;
        this.renderIconGrid();
        this.updateStatusBar();
    };
    
    /**
     * 更新分类按钮
     */
    IconLibraryApp.prototype.updateCategoryButtons = function() {
        const categories = window.iconLoader.getCategories();
        const categoryBtns = document.querySelectorAll('.category-btn');
        
        categoryBtns.forEach(btn => {
            const category = btn.getAttribute('data-category');
            if (categories[category]) {
                const count = categories[category].count;
                btn.textContent = `${categories[category].name} (${count})`;
            }
        });
    };
    
    /**
     * 更新状态栏
     */
    IconLibraryApp.prototype.updateStatusBar = function() {
        const iconCount = document.getElementById('iconCount');
        const selectedCount = document.getElementById('selectedCount');
        
        if (iconCount) {
            iconCount.textContent = `共 ${this.filteredIcons.length} 个图标`;
        }
        
        if (selectedCount) {
            if (this.selectedIcons.size > 0) {
                selectedCount.textContent = `已选择 ${this.selectedIcons.size} 个`;
                selectedCount.classList.remove('hidden');
            } else {
                selectedCount.classList.add('hidden');
            }
        }
    };
    
    /**
     * 更新UI状态
     */
    IconLibraryApp.prototype.updateUIState = function() {
        const hasSelection = this.selectedIcons.size > 0;
        
        // 更新按钮状态
        const copyPngBtn = document.getElementById('copyPngBtn');
        const sendToLayerBtn = document.getElementById('sendToLayerBtn');
        
        if (copyPngBtn) {
            copyPngBtn.disabled = !hasSelection;
        }
        
        if (sendToLayerBtn) {
            sendToLayerBtn.disabled = !hasSelection;
            sendToLayerBtn.textContent = this.selectedIcons.size > 1 ? 
                `发送${this.selectedIcons.size}个图标到图层` : '发送到图层';
        }
        
        this.updateStatusBar();
    };
    
    /**
     * 复制图标为PNG
     */
    IconLibraryApp.prototype.copyIconAsPng = function() {
        if (this.selectedIcons.size === 0) {
            this.showError('请先选择图标');
            return;
        }
        
        if (this.selectedIcons.size > 1) {
            this.showError('批量PNG复制暂不支持，请选择单个图标');
            return;
        }
        
        const iconId = Array.from(this.selectedIcons)[0];
        const icon = this.getIconById(iconId);
        
        if (!icon) {
            this.showError('未找到选中的图标');
            return;
        }
        
        // 获取带颜色的SVG代码
        let svgCode = icon.svg;
        if (window.colorManager && typeof window.colorManager.getIconSvgWithColors === 'function') {
            svgCode = window.colorManager.getIconSvgWithColors(iconId) || svgCode;
        }
        
        this.convertSvgToPngAndCopy(svgCode, 256)
            .then(success => {
                if (success) {
                    this.showSuccess('PNG图片已复制到剪贴板');
                } else {
                    this.showError('PNG复制失败');
                }
            })
            .catch(error => {
                console.error('复制PNG失败:', error);
                this.showError('复制失败，请重试');
            });
    };
    
    /**
     * 将SVG转换为PNG并复制到剪贴板
     * @param {string} svgCode - SVG代码
     * @param {number} size - 图片尺寸
     * @returns {Promise<boolean>} 是否成功
     */
    IconLibraryApp.prototype.convertSvgToPngAndCopy = function(svgCode, size) {
        return new Promise((resolve) => {
            try {
                // 创建canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = size;
                canvas.height = size;
                
                // 创建SVG数据URL
                const svgBlob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
                const svgDataUrl = URL.createObjectURL(svgBlob);
                
                const img = new Image();
                img.onload = function() {
                    try {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        URL.revokeObjectURL(svgDataUrl);
                        
                        canvas.toBlob(async (blob) => {
                            if (blob && navigator.clipboard && navigator.clipboard.write) {
                                try {
                                    const item = new ClipboardItem({ 'image/png': blob });
                                    await navigator.clipboard.write([item]);
                                    resolve(true);
                                } catch (error) {
                                    console.error('复制到剪贴板失败:', error);
                                    resolve(false);
                                }
                            } else {
                                resolve(false);
                            }
                        }, 'image/png');
                    } catch (drawError) {
                        console.error('Canvas绘制失败:', drawError);
                        URL.revokeObjectURL(svgDataUrl);
                        resolve(false);
                    }
                };
                
                img.onerror = () => {
                    URL.revokeObjectURL(svgDataUrl);
                    resolve(false);
                };
                
                img.src = svgDataUrl;
            } catch (error) {
                console.error('转换PNG失败:', error);
                resolve(false);
            }
        });
    };
    
    /**
     * 发送图标到Photoshop
     */
    IconLibraryApp.prototype.sendIconToPhotoshop = function() {
        if (this.selectedIcons.size === 0) {
            this.showError('请先选择图标');
            return;
        }
        
        // 检查PS是否可用
        if (!window.psInterface.isPhotoshopAvailable()) {
            this.showError('请确保Photoshop已启动并授予插件权限');
            return;
        }
        
        // 显示加载状态
        const sendBtn = document.getElementById('sendToLayerBtn');
        const originalText = sendBtn.textContent;
        sendBtn.textContent = '发送中...';
        sendBtn.disabled = true;
        
        if (this.selectedIcons.size === 1) {
            this.sendSingleIcon()
                .then(() => {
                    sendBtn.textContent = originalText;
                    sendBtn.disabled = false;
                })
                .catch(() => {
                    sendBtn.textContent = originalText;
                    sendBtn.disabled = false;
                });
        } else {
            this.sendMultipleIcons()
                .then(() => {
                    sendBtn.textContent = originalText;
                    sendBtn.disabled = false;
                })
                .catch(() => {
                    sendBtn.textContent = originalText;
                    sendBtn.disabled = false;
                });
        }
    };
    
    /**
     * 发送单个图标
     */
    IconLibraryApp.prototype.sendSingleIcon = function() {
        return new Promise((resolve, reject) => {
            const iconId = Array.from(this.selectedIcons)[0];
            const icon = this.getIconById(iconId);
            
            if (!icon) {
                this.showError('未找到选中的图标');
                reject(new Error('图标未找到'));
                return;
            }
            
            // 获取带颜色的SVG代码
            let svgCode = icon.svg;
            let colors = icon.originalColors;
            
            if (window.colorManager) {
                const iconColors = window.colorManager.getIconColors(iconId);
                if (iconColors) {
                    colors = iconColors;
                    svgCode = window.colorManager.getIconSvgWithColors(iconId) || svgCode;
                }
            }
            
            // 发送到PS
            window.psInterface.sendIconToLayer(svgCode, icon, {
                colors: colors,
                size: 256
            })
            .then(result => {
                this.showSuccess(`图标 "${icon.name}" 已成功发送到Photoshop图层`);
                resolve(result);
            })
            .catch(error => {
                console.error('发送图标失败:', error);
                this.showError(error.message || '发送图标到Photoshop失败');
                reject(error);
            });
        });
    };
    
    /**
     * 批量发送图标
     */
    IconLibraryApp.prototype.sendMultipleIcons = function() {
        return new Promise((resolve, reject) => {
            const iconDataArray = [];
            
            this.selectedIcons.forEach(iconId => {
                const icon = this.getIconById(iconId);
                if (icon) {
                    let svgCode = icon.svg;
                    let colors = icon.originalColors;
                    
                    if (window.colorManager) {
                        const iconColors = window.colorManager.getIconColors(iconId);
                        if (iconColors) {
                            colors = iconColors;
                            svgCode = window.colorManager.getIconSvgWithColors(iconId) || svgCode;
                        }
                    }
                    
                    iconDataArray.push({
                        svg: svgCode,
                        info: icon,
                        options: {
                            colors: colors,
                            size: 256
                        }
                    });
                }
            });
            
            if (iconDataArray.length === 0) {
                this.showError('未找到有效的图标数据');
                reject(new Error('无效数据'));
                return;
            }
            
            window.psInterface.sendMultipleIconsToLayers(iconDataArray)
                .then(results => {
                    if (results.failed > 0) {
                        this.showError(`批量发送完成：成功${results.success}个，失败${results.failed}个`);
                    } else {
                        this.showSuccess(`成功发送${results.success}个图标到Photoshop图层`);
                    }
                    resolve(results);
                })
                .catch(error => {
                    console.error('批量发送失败:', error);
                    this.showError('批量发送失败: ' + error.message);
                    reject(error);
                });
        });
    };
    
    /**
     * 处理键盘快捷键
     * @param {KeyboardEvent} event - 键盘事件
     */
    IconLibraryApp.prototype.handleKeyboardShortcuts = function(event) {
        // Ctrl+C: 复制PNG
        if ((event.ctrlKey || event.metaKey) && event.key === 'c' && this.selectedIcons.size > 0) {
            event.preventDefault();
            this.copyIconAsPng();
        }
        
        // Enter: 发送到图层
        if (event.key === 'Enter' && this.selectedIcons.size > 0) {
            event.preventDefault();
            this.sendIconToPhotoshop();
        }
        
        // Escape: 清除选择
        if (event.key === 'Escape') {
            this.clearAllSelections();
            this.updateUIState();
        }
    };
    
    /**
     * 根据ID获取图标数据
     * @param {string} iconId - 图标ID
     * @returns {Object|null} 图标数据
     */
    IconLibraryApp.prototype.getIconById = function(iconId) {
        return this.filteredIcons.find(icon => icon.id === iconId) || 
               window.iconLoader.getIconById(iconId);
    };
    
    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} wait - 等待时间
     * @returns {Function} 防抖后的函数
     */
    IconLibraryApp.prototype.debounce = function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    
    /**
     * 显示成功消息
     * @param {string} message - 消息内容
     */
    IconLibraryApp.prototype.showSuccess = function(message) {
        this.showToast(message, 'success');
    };
    
    /**
     * 显示错误消息
     * @param {string} message - 消息内容
     */
    IconLibraryApp.prototype.showError = function(message) {
        this.showToast(message, 'error');
    };
    
    /**
     * 显示提示框
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     */
    IconLibraryApp.prototype.showToast = function(message, type) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        const messageEl = toast.querySelector('.toast-message');
        if (messageEl) {
            messageEl.textContent = message;
        } else {
            toast.textContent = message;
        }
        
        toast.className = `toast ${type || ''} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };
    
    // 创建全局实例
    window.iconLibraryApp = new IconLibraryApp();
    
    // 导出showToast函数供其他模块使用
    window.showToast = function(message, type) {
        if (window.iconLibraryApp) {
            window.iconLibraryApp.showToast(message, type);
        }
    };
    
    console.log('飞草科技图标库CEP插件初始化完成');
    
})(window);