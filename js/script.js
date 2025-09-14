// SVG图标库 - JavaScript文件 (CSS版本)

// DOM 元素
const iconGrid = document.getElementById('iconGrid');
const iconCount = document.getElementById('iconCount');
const selectedCount = document.querySelector('#selectedCount .text-primary');
const selectedCountContainer = document.getElementById('selectedCount');
const searchInput = document.getElementById('searchInput');
const groupFilter = document.getElementById('groupFilter');
const refreshBtn = document.getElementById('refreshBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const iconModal = document.getElementById('iconModal');
const modalContent = iconModal?.querySelector('div');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const modalIconPreview = document.getElementById('modalIconPreview');
const modalIconName = document.getElementById('modalIconName');
const modalIconGroup = document.getElementById('modalIconGroup');
const svgCode = document.getElementById('svgCode');
const copySvgBtn = document.getElementById('copySvgBtn');
const downloadSvgBtn = document.getElementById('downloadSvgBtn');
const downloadPngBtn = document.getElementById('downloadPngBtn');
const copyDirectBtn = document.getElementById('copyDirectBtn');
const toast = document.getElementById('toast');
const colorPicker = document.getElementById('colorPicker');
const colorOptions = document.querySelectorAll('.color-option');
const downloadSettingsModal = document.getElementById('downloadSettingsModal');
const closeDownloadModal = document.getElementById('closeDownloadModal');
const cancelDownloadBtn = document.getElementById('cancelDownloadBtn');
const confirmDownloadBtn = document.getElementById('confirmDownloadBtn');
const exportSvg = document.getElementById('exportSvg');
const exportPng = document.getElementById('exportPng');
const exportSizes = document.querySelectorAll('input[name="exportSizes"]');
const batchColorPicker = document.getElementById('batchColorPicker');
const batchColorOptions = document.querySelectorAll('#downloadSettingsModal .color-option');
const useIndividualColors = document.getElementById('useIndividualColors');
const batchColorContainer = document.getElementById('batchColorContainer');
const pngConversionContainer = document.getElementById('pngConversionContainer');
const resetColorBtn = document.getElementById('resetColorBtn');
const randomColorsBtn = document.getElementById('randomColorsBtn');
const resetAllColorsBtn = document.getElementById('resetAllColorsBtn');
const selectedPathInfo = document.getElementById('selectedPathInfo');
const packagingOptions = document.querySelectorAll('input[name="packagingOption"]');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const loadingState = loadMoreContainer?.querySelector('.loading-state');
const endState = loadMoreContainer?.querySelector('.end-state');
const errorState = loadMoreContainer?.querySelector('.error-state');
const retryLoadBtn = document.getElementById('retryLoadBtn');
const copyImageBtn = document.getElementById('copyImageBtn');
const sizeOptions = document.getElementById('sizeOptions');
let selectedSize = 64;
let currentSvgCode = ''; // 存储当前显示的原始SVG代码

// 全局变量
let allIcons = [];
let currentIcon = null;
let currentIconColor = '#409eff';
let originalIconColors = new Map();
let iconColors = new Map();
let pathColors = new Map();
let selectedPathIndex = -1;
let selectedPathElement = null;
let selectedIcons = new Set();
let downloadType = 'selected';
let longPressTimer = null;
let isLoading = false;
let hasMoreItems = true;
let totalIconCount = 0;
let currentPage = 1;
const itemsPerPage = 30;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  initializeEventListeners();
  loadIcons(1, true);
  handleExternalStyles();
});

// 初始化DOM元素（已在顶部声明为常量，无需重复初始化）
function initializeElements() {
  // DOM元素已在文件顶部声明为常量
  // 这里可以进行一些额外的初始化工作
  console.log('DOM元素初始化完成');
}

// 初始化事件监听器
function initializeEventListeners() {
  // 搜索功能
  if (searchInput) {
    searchInput.addEventListener('input', debounce(searchIcons, 300));
  }
  
  // 筛选功能
  if (groupFilter) {
    groupFilter.addEventListener('change', searchIcons);
  }
  
  // 按钮事件
  if (refreshBtn) refreshBtn.addEventListener('click', () => loadIcons(1, true));
  if (downloadAllBtn) downloadAllBtn.addEventListener('click', () => openDownloadSettingsModal('all'));
  if (downloadSelectedBtn) downloadSelectedBtn.addEventListener('click', () => openDownloadSettingsModal('selected'));
  if (deselectAllBtn) deselectAllBtn.addEventListener('click', deselectAll);
  if (randomColorsBtn) randomColorsBtn.addEventListener('click', applyRandomColors);
  if (resetAllColorsBtn) resetAllColorsBtn.addEventListener('click', resetAllColors);
  
  // 模态框关闭按钮
  if (closeModal) {
    closeModal.addEventListener('click', closeIconModal);
  }
  
  // 模态框点击外部关闭
  if (iconModal) {
    iconModal.addEventListener('click', (e) => {
      if (e.target === iconModal) closeIconModal();
    });
  }
  
  if (closeDownloadModal) {
    closeDownloadModal.addEventListener('click', closeDownloadSettingsModal);
  }
  
  if (cancelDownloadBtn) {
    cancelDownloadBtn.addEventListener('click', closeDownloadSettingsModal);
  }
  
  // 下载模态框点击外部关闭
  if (downloadSettingsModal) {
    downloadSettingsModal.addEventListener('click', (e) => {
      if (e.target === downloadSettingsModal) closeDownloadSettingsModal();
    });
  }
  
  // 复制按钮
  if (copySvgBtn) {
    copySvgBtn.addEventListener('click', () => {
      if (currentIcon && svgCode) {
        const code = window.SyntaxHighlight ? 
          window.SyntaxHighlight.getPlainTextCode(svgCode) : 
          currentSvgCode;
        copyToClipboard(code).then(success => {
          if (success) showToast('SVG代码已复制');
          else showToast('复制失败，请手动复制', false);
        });
      }
    });
  }
  
  if (copyDirectBtn) {
    copyDirectBtn.addEventListener('click', () => {
      if (currentIcon && svgCode) {
        const code = window.SyntaxHighlight ? 
          window.SyntaxHighlight.getPlainTextCode(svgCode) : 
          currentSvgCode;
        copyToClipboard(code).then(success => {
          if (success) {
            showToast('SVG代码已复制');
            closeIconModal();
          } else {
            showToast('复制失败，请手动复制', false);
          }
        });
      }
    });
  }
  
  if (copyImageBtn) {
    copyImageBtn.addEventListener('click', () => {
      if (currentIcon) {
        showToast(`正在准备 ${selectedSize}x${selectedSize} 图片...`, true);
        copyImageToClipboard().then(success => {
          if (success) {
            showToast(`${selectedSize}x${selectedSize} PNG图片已复制到剪贴板`);
          } else {
            showToast('图片复制失败，请尝试下载后再复制', false);
          }
        });
      }
    });
  }
  
  // 下载SVG按钮
  if (downloadSvgBtn) {
    downloadSvgBtn.addEventListener('click', () => {
      if (currentIcon) {
        downloadSingleIcon(currentIcon, 'svg');
      }
    });
  }
  
  // 下载PNG按钮
  if (downloadPngBtn) {
    downloadPngBtn.addEventListener('click', () => {
      if (currentIcon) {
        downloadSingleIcon(currentIcon, 'png');
      }
    });
  }
  
  // 颜色选择器
  if (colorPicker) {
    colorPicker.addEventListener('input', (e) => {
      updateIconColor(e.target.value);
    });
  }
  
  // 预设颜色选择
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      const color = option.getAttribute('data-color');
      updateIconColor(color);
    });
  });
  
  // 尺寸选择器
  if (sizeOptions) {
    sizeOptions.addEventListener('click', (e) => {
      const sizeOption = e.target.closest('.size-option');
      if (sizeOption) {
        document.querySelectorAll('.size-option').forEach(option => {
          option.classList.remove('size-option-selected');
        });
        sizeOption.classList.add('size-option-selected');
        selectedSize = parseInt(sizeOption.dataset.size);
      }
    });
  }
  
  // 重置颜色按钮
  if (resetColorBtn) resetColorBtn.addEventListener('click', resetIconColor);
  
  // 随机路径颜色按钮
  const randomPathColorBtn = document.getElementById('randomPathColorBtn');
  if (randomPathColorBtn) {
    randomPathColorBtn.addEventListener('click', () => {
      if (currentIcon) {
        const svgElement = modalIconPreview.querySelector('.icon-svg-element');
        if (svgElement) {
          const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
          if (elements.length > 1) {
            // 为每个路径生成随机颜色
            const randomColors = window.ColorManager ? 
              window.ColorManager.generateRandomPathColors(elements.length) : 
              new Map();
            
            if (!pathColors.has(currentIcon.id)) {
              pathColors.set(currentIcon.id, new Map());
            }
            const iconPathColors = pathColors.get(currentIcon.id);
            
            elements.forEach((el, index) => {
              const randomColor = randomColors.get(index) || window.ColorManager?.generateRandomColor() || '#409eff';
              iconPathColors.set(index, randomColor);
              
              // 检查元素的原始状态
              const originalFill = el.getAttribute('fill');
              const originalStroke = el.getAttribute('stroke');
              
              // 根据原始状态决定处理方式
              if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
                // 有填充颜色的元素：更新填充颜色
                el.setAttribute('fill', randomColor);
              }
              
              if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
                // 有描边的元素：更新描边颜色
                el.setAttribute('stroke', randomColor);
              }
              
              // 如果元素既没有填充也没有描边，则根据情况处理
              if ((!originalFill || originalFill === 'none' || originalFill === 'transparent') &&
                  (!originalStroke || originalStroke === 'none' || originalStroke === 'transparent')) {
                // 对于完全没有颜色的元素，默认添加填充颜色
                el.setAttribute('fill', randomColor);
              }
            });
            
            updateSelectedPathInfo();
            showToast('已为所有路径生成随机颜色');
          } else {
            showToast('此图标只有一个路径，请使用整体颜色设置', false);
          }
        }
      }
    });
  }
  }
  
  // 确认下载按钮
  if (confirmDownloadBtn) {
    confirmDownloadBtn.addEventListener('click', batchDownloadIcons);
  }
  
  // ESC键关闭模态框
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (iconModal && !iconModal.classList.contains('hidden')) {
        closeIconModal();
      } else if (downloadSettingsModal && !downloadSettingsModal.classList.contains('hidden')) {
        closeDownloadSettingsModal();
      }
    }
  });
  
  // 滚动加载更多
  window.addEventListener('scroll', throttle(() => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
      loadMoreIcons();
    }
  }, 200));
}

// 工具函数：防抖
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 工具函数：节流
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// 生成鲜艳的随机颜色
function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.random() * 30;
  const lightness = 40 + Math.random() * 20;
  
  function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  
  return hslToHex(hue, saturation, lightness);
}

// 显示提示框
function showToast(message, isSuccess = true) {
  if (!toast) return;
  
  toast.textContent = '';
  toast.classList.remove('bg-secondary', 'bg-red-500', 'bg-primary');
  toast.classList.add(isSuccess ? 'bg-secondary' : 'bg-red-500');
  
  toast.innerHTML = `
    <i class="fa ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  
  toast.classList.remove('translate-y-10', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
  }, 2000);
}

// 复制文本到剪贴板
function copyToClipboard(text) {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(err => {
      console.error('复制失败:', err);
      return false;
    });
}

// 复制图片到剪贴板
function copyImageToClipboard() {
  if (!currentIcon || !modalIconPreview) return false;
  
  const tempContainer = document.createElement('div');
  tempContainer.className = 'temp-conversion-container';
  tempContainer.style.width = `${selectedSize}px`;
  tempContainer.style.height = `${selectedSize}px`;
  tempContainer.style.backgroundColor = 'transparent';
  
  const svgElement = modalIconPreview.querySelector('.icon-svg-element').cloneNode(true);
  
  // 获取用户设置的颜色（优先级：路径颜色 > 图标颜色 > 默认颜色）
  const iconColor = iconColors.get(currentIcon.id) || currentIconColor;
  const pathMap = pathColors.get(currentIcon.id);
  
  const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
  elements.forEach((el, index) => {
    // 优先使用路径级颜色，其次使用图标颜色
    const elementColor = (pathMap && pathMap.get(index)) || iconColor;
    
    // 设置颜色，避免使用黑色除非用户明确选择了黑色
    const finalColor = elementColor === '#ffffff' ? '#000000' : elementColor;
    el.setAttribute('fill', finalColor);
    el.setAttribute('stroke', finalColor);
  });
  
  svgElement.setAttribute('width', selectedSize);
  svgElement.setAttribute('height', selectedSize);
  tempContainer.appendChild(svgElement);
  document.body.appendChild(tempContainer);
  
  return html2canvas(tempContainer, {
    backgroundColor: null,
    scale: 1,
    logging: false,
    useCORS: true,
    allowTaint: false,
    taintTest: true
  }).then(canvas => {
    return new Promise((resolve) => {
      canvas.toBlob(blob => {
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          resolve(true);
        }).catch(err => {
          console.error('复制图片失败:', err);
          resolve(false);
        }).finally(() => {
          document.body.removeChild(tempContainer);
        });
      }, 'image/png');
    });
  }).catch(err => {
    console.error('图片转换失败:', err);
    document.body.removeChild(tempContainer);
    return false;
  });
}

// 获取图标分组信息
function getIconGroup(iconId) {
  if (iconId.endsWith('-x')) {
    return { type: 'linear', name: '线性图标' };
  } else if (iconId.endsWith('-m')) {
    return { type: 'filled', name: '面性图标' };
  } else {
    return { type: 'other', name: '其他图标' };
  }
}

// 处理图标名称
function processIconName(iconId) {
  let processed = iconId.replace(/^icon-/, '');
  processed = processed.replace(/-x$/, '').replace(/-m$/, '');
  return processed;
}

// 获取原始图标名称
function getOriginalNameWithoutPrefix(iconId) {
  return iconId.replace(/^icon-/, '');
}

// 创建单个图标元素
function createIconItem(icon) {
  const container = document.createElement('div');
  container.className = 'icon-display-container';
  container.dataset.iconId = icon.id;
  
  const group = getIconGroup(icon.originalNameWithoutPrefix);
  const iconColor = iconColors.get(icon.id) || '#409eff';
  originalIconColors.set(icon.id, iconColor);
  
  // 创建SVG包装器
  const svgWrapper = document.createElement('div');
  svgWrapper.className = 'icon-svg-wrapper';
  
  // 创建SVG元素
  const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgElement.className = 'icon-svg-element';
  svgElement.setAttribute('viewBox', icon.viewBox || '0 0 1024 1024');
  svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svgElement.innerHTML = icon.content;
  
  // 创建名称标签
  const nameLabel = document.createElement('div');
  nameLabel.className = 'icon-name-label';
  nameLabel.textContent = icon.processedId;
  nameLabel.title = icon.processedId;
  
  // 创建分组标签
  const groupBadge = document.createElement('span');
  groupBadge.className = `group-badge group-${group.type}`;
  groupBadge.textContent = group.type === 'linear' ? '线性' : group.type === 'filled' ? '面性' : '其他';
  
  // 组装元素
  svgWrapper.appendChild(svgElement);
  container.appendChild(groupBadge);
  container.appendChild(svgWrapper);
  container.appendChild(nameLabel);
  
  // 处理选中状态
  if (selectedIcons.has(icon.id)) {
    container.classList.add('icon-selected');
    const selectionBadge = document.createElement('span');
    selectionBadge.className = 'selection-badge';
    selectionBadge.textContent = '✓';
    container.appendChild(selectionBadge);
  }
  
  // 应用颜色
  updateIconItemColor(container, icon.id);
  
  // 事件处理
  container.addEventListener('click', (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    
    if (e.ctrlKey || e.metaKey) {
      toggleIconSelection(icon.id);
      e.stopPropagation();
    } else {
      openIconDetail(icon);
    }
  });
  
  container.addEventListener('touchstart', () => {
    longPressTimer = setTimeout(() => {
      toggleIconSelection(icon.id);
      showToast(selectedIcons.has(icon.id) ? '已添加到选择' : '已从选择中移除');
    }, 500);
  });
  
  container.addEventListener('touchend', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      openIconDetail(icon);
    }
  });
  
  return container;
}

// JS版本：更新图标项颜色
function updateIconItemColor(container, iconId) {
  const svgElement = container.querySelector('.icon-svg-element');
  if (!svgElement) return;
  
  const color = iconColors.get(iconId) || '#409eff';
  const pathMap = pathColors.get(iconId);
  const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
  
  if (pathMap && pathMap.size > 0) {
    // 如果有路径颜色映射，使用各自的颜色
    elements.forEach((el, index) => {
      const pathColor = pathMap.get(index) || color;
      const finalColor = pathColor === '#ffffff' ? '#000000' : pathColor;
      
      // 检查元素的原始状态
      const originalFill = el.getAttribute('fill');
      const originalStroke = el.getAttribute('stroke');
      
      // 根据原始状态决定处理方式
      if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
        el.setAttribute('fill', finalColor);
      }
      
      if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
        el.setAttribute('stroke', finalColor);
      }
      
      // 如果元素既没有填充也没有描边，则根据情况处理
      if ((!originalFill || originalFill === 'none' || originalFill === 'transparent') &&
          (!originalStroke || originalStroke === 'none' || originalStroke === 'transparent')) {
        el.setAttribute('fill', finalColor);
      }
    });
  } else {
    // 否则使用统一颜色
    elements.forEach(el => {
      const finalColor = color === '#ffffff' ? '#000000' : color;
      
      // 检查元素的原始状态
      const originalFill = el.getAttribute('fill');
      const originalStroke = el.getAttribute('stroke');
      
      // 根据原始状态决定处理方式
      if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
        el.setAttribute('fill', finalColor);
      }
      
      if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
        el.setAttribute('stroke', finalColor);
      }
      
      // 如果元素既没有填充也没有描边，则根据情况处理
      if ((!originalFill || originalFill === 'none' || originalFill === 'transparent') &&
          (!originalStroke || originalStroke === 'none' || originalStroke === 'transparent')) {
        el.setAttribute('fill', finalColor);
      }
    });
  }
}

// 更新选中状态UI
function updateSelectionUI() {
  const count = selectedIcons.size;
  
  if (selectedCount) selectedCount.textContent = count;
  
  if (count > 0) {
    selectedCountContainer?.classList.remove('hidden');
    downloadSelectedBtn?.classList.remove('hidden');
    deselectAllBtn?.classList.remove('hidden');
  } else {
    selectedCountContainer?.classList.add('hidden');
    downloadSelectedBtn?.classList.add('hidden');
    deselectAllBtn?.classList.add('hidden');
  }
  
  // 更新所有图标的选中状态
  document.querySelectorAll('.icon-display-container').forEach(container => {
    const iconId = container.dataset.iconId;
    if (selectedIcons.has(iconId)) {
      container.classList.add('icon-selected');
      if (!container.querySelector('.selection-badge')) {
        const selectionBadge = document.createElement('span');
        selectionBadge.className = 'selection-badge';
        selectionBadge.textContent = '✓';
        container.appendChild(selectionBadge);
      }
    } else {
      container.classList.remove('icon-selected');
      const badge = container.querySelector('.selection-badge');
      if (badge) {
        badge.remove();
      }
    }
  });
}

// 切换图标选中状态
function toggleIconSelection(iconId, forceState = null) {
  if (forceState === true) {
    selectedIcons.add(iconId);
  } else if (forceState === false) {
    selectedIcons.delete(iconId);
  } else {
    if (selectedIcons.has(iconId)) {
      selectedIcons.delete(iconId);
    } else {
      selectedIcons.add(iconId);
    }
  }
  
  updateSelectionUI();
}

// 取消所有选中
function deselectAll() {
  selectedIcons.clear();
  updateSelectionUI();
  showToast('已取消所有选择');
}

// 为所有图标应用随机颜色
function applyRandomColors() {
  const iconItems = document.querySelectorAll('.icon-display-container');
  if (iconItems.length === 0) {
    showToast('没有找到图标元素', false);
    return;
  }
  
  iconItems.forEach(item => {
    const iconId = item.dataset.iconId;
    if (iconId) {
      // 为整个图标设置一个主颜色
      const mainColor = getRandomColor();
      iconColors.set(iconId, mainColor);
      
      // 为每个路径设置不同的随机颜色
      const svgElement = item.querySelector('.icon-svg-element');
      if (svgElement) {
        const pathElements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
        if (pathElements.length > 1) {
          // 如果有多个路径，为每个路径设置不同颜色
          const pathMap = new Map();
          pathElements.forEach((el, index) => {
            const pathColor = getRandomColor();
            pathMap.set(index, pathColor);
          });
          pathColors.set(iconId, pathMap);
        } else {
          // 如果只有一个路径，清除路径颜色映射
          pathColors.delete(iconId);
        }
      }
      
      updateIconItemColor(item, iconId);
    }
  });
  showToast(`已为 ${iconItems.length} 个图标应用随机颜色`);
}

// 重置所有图标颜色为默认值
function resetAllColors() {
  document.querySelectorAll('.icon-display-container').forEach(container => {
    const iconId = container.dataset.iconId;
    const defaultColor = originalIconColors.get(iconId) || '#409eff';
    iconColors.set(iconId, defaultColor);
    // 清除路径颜色映射
    pathColors.delete(iconId);
    updateIconItemColor(container, iconId);
  });
  showToast('已重置所有图标颜色为默认值');
}

// JS版本：加载并显示图标
function loadIcons(page = 1, reset = false) {
  if (isLoading) return;
  
  isLoading = true;
  
  if (reset) {
    currentPage = 1;
    allIcons = [];
    selectedIcons.clear();
    updateSelectionUI();
    totalIconCount = 0;
    
    iconGrid.innerHTML = `
      <div class="loading-container">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p class="loading-text">加载图标中...</p>
        </div>
      </div>
    `;
  } else {
    showLoadState('loading');
  }
  
  setTimeout(() => {
    try {
      // JS版本：从SVG symbols中获取图标
      const svgContainer = document.querySelector('svg');
      if (!svgContainer) {
        showToast('未找到图标资源，请确保JS版本已正确加载', false);
        showLoadState('error');
        isLoading = false;
        return;
      }
      
      const symbols = Array.from(svgContainer.querySelectorAll('symbol'));
      totalIconCount = symbols.length;
      
      const totalPages = Math.ceil(symbols.length / itemsPerPage);
      
      if (!reset) {
        currentPage = page;
      }
      
      hasMoreItems = currentPage < totalPages;
      
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageSymbols = symbols.slice(startIndex, endIndex);
      
      const pageIcons = pageSymbols.map(symbol => {
        const id = symbol.id;
        const originalNameWithoutPrefix = getOriginalNameWithoutPrefix(id);
        const processedId = processIconName(id);
        const viewBox = symbol.getAttribute('viewBox') || '0 0 1024 1024';
        const content = symbol.innerHTML;
        const svgCode = `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
        
        return { id, originalNameWithoutPrefix, processedId, viewBox, content, svgCode };
      });
      
      allIcons = [...allIcons, ...pageIcons];
      
      if (iconCount) iconCount.textContent = totalIconCount;
      
      if (reset) {
        renderIcons(allIcons);
      } else {
        pageIcons.forEach(icon => {
          iconGrid.appendChild(createIconItem(icon));
        });
      }
      
      if (!hasMoreItems) {
        showLoadState('end');
      } else {
        setTimeout(() => {
          if (!isLoading && loadMoreContainer) {
            loadMoreContainer.classList.add('hidden');
          }
        }, 1000);
      }
      
      isLoading = false;
    } catch (error) {
      console.error('加载图标出错:', error);
      showLoadState('error');
      isLoading = false;
    }
  }, 800);
}

// 显示加载状态
function showLoadState(state) {
  if (!loadMoreContainer) return;
  
  loadMoreContainer.classList.remove('hidden');
  
  // 隐藏所有状态
  if (loadingState) loadingState.classList.add('hidden');
  if (endState) endState.classList.add('hidden');
  if (errorState) errorState.classList.add('hidden');
  
  // 显示对应状态
  switch (state) {
    case 'loading':
      if (loadingState) loadingState.classList.remove('hidden');
      break;
    case 'end':
      if (endState) endState.classList.remove('hidden');
      break;
    case 'error':
      if (errorState) errorState.classList.remove('hidden');
      break;
    default:
      loadMoreContainer.classList.add('hidden');
  }
}

// 渲染图标列表
function renderIcons(icons) {
  const filteredIcons = filterIcons(icons);
  
  if (filteredIcons.length === 0) {
    iconGrid.innerHTML = `
      <div class="loading-container">
        <div class="loading-content">
          <p class="loading-text">没有找到匹配的图标</p>
        </div>
      </div>
    `;
    return;
  }
  
  iconGrid.innerHTML = '';
  filteredIcons.forEach(icon => {
    iconGrid.appendChild(createIconItem(icon));
  });
  
  if (!hasMoreItems) {
    showLoadState('end');
  } else {
    if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
  }
}

// 筛选图标
function filterIcons(icons) {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const groupType = groupFilter ? groupFilter.value : 'all';
  
  return icons.filter(icon => {
    const matchesSearch = !searchTerm || icon.processedId.toLowerCase().includes(searchTerm);
    const matchesGroup = groupType === 'all' || getIconGroup(icon.originalNameWithoutPrefix).type === groupType;
    return matchesSearch && matchesGroup;
  });
}

// 加载更多图标
function loadMoreIcons() {
  if (isLoading || !hasMoreItems) return;
  loadIcons(currentPage + 1);
}

// 搜索图标
function searchIcons() {
  renderIcons(allIcons);
}

// 打开图标详情模态框
function openIconDetail(icon) {
  if (!iconModal) return;
  
  currentIcon = icon;
  currentIconColor = iconColors.get(icon.id) || '#409eff';
  
  // 初始化自定义颜色选择器
  if (window.ColorManager) {
    window.ColorManager.createCustomColorPicker('customColorPicker', currentIconColor, (color) => {
      updateIconColor(color);
    });
  }
  
  selectedPathIndex = -1;
  selectedPathElement = null;
  
  const group = getIconGroup(icon.originalNameWithoutPrefix);
  
  if (modalTitle) modalTitle.textContent = `图标详情: ${icon.processedId}`;
  if (modalIconName) modalIconName.textContent = icon.processedId;
  if (modalIconGroup) modalIconGroup.textContent = group.name;
  
  if (modalIconPreview) {
    // 创建与首页相同的SVG结构
    const svgWrapper = document.createElement('div');
    svgWrapper.className = 'icon-svg-wrapper';
    svgWrapper.style.width = '100%';
    svgWrapper.style.height = '100%';
    svgWrapper.style.overflow = 'visible';
    
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.className = 'icon-svg-element';
    svgElement.setAttribute('viewBox', icon.viewBox || '0 0 1024 1024');
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgElement.innerHTML = icon.content;
    
    svgWrapper.appendChild(svgElement);
    modalIconPreview.innerHTML = '';
    modalIconPreview.appendChild(svgWrapper);
    
    // 应用与首页相同的颜色逻辑
   const modalSvgElement = modalIconPreview.querySelector('.icon-svg-element');
   if (modalSvgElement) {
     const pathMap = pathColors.get(icon.id);
     const elements = modalSvgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
     
     elements.forEach((el, index) => {
       const pathColor = pathMap?.get(index) || currentIconColor;
       el.setAttribute('fill', pathColor === '#ffffff' ? '#000000' : pathColor);
       el.setAttribute('stroke', pathColor === '#ffffff' ? '#000000' : pathColor);
       
       // 确保路径可以被选中
       el.style.cursor = 'pointer';
       el.style.pointerEvents = 'auto';
       
       // 移除旧的事件监听器
       el.removeEventListener('click', handlePathClick);
       el.removeEventListener('mouseenter', handlePathHover);
       el.removeEventListener('mouseleave', handlePathLeave);
       
       // 添加新的路径点击事件
       el.addEventListener('click', (e) => {
         e.stopPropagation();
         handlePathClick(e, index);
       });
       
       // 添加悬停效果
       el.addEventListener('mouseenter', () => {
         if (selectedPathIndex !== index) {
           el.classList.add('path-hover');
         }
       });
       
       el.addEventListener('mouseleave', () => {
         el.classList.remove('path-hover');
       });
     });
   }
   
   // 更新选中路径信息显示
   updateSelectedPathInfo();
  }
  
  updateSelectedPathInfo();
  
  // 重置尺寸选择为默认值
  document.querySelectorAll('.size-option').forEach(option => {
    option.classList.remove('size-option-selected');
    if (option.dataset.size === '64') {
      option.classList.add('size-option-selected');
      selectedSize = 64;
    }
  });
  
  let svgCodeWithColor = currentIcon.svgCode;
  
  const pathMap = pathColors.get(icon.id) || new Map();
  if (pathMap.size > 0) {
    const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    tempSvg.innerHTML = svgCodeWithColor;
    const elements = tempSvg.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
    
    elements.forEach((el, index) => {
      const pathColor = pathMap.get(index);
      if (pathColor) {
        el.setAttribute('fill', pathColor === '#ffffff' ? '#000000' : pathColor);
        el.setAttribute('stroke', pathColor === '#ffffff' ? '#000000' : pathColor);
      }
    });
    
    svgCodeWithColor = new XMLSerializer().serializeToString(tempSvg);
  } else {
    svgCodeWithColor = svgCodeWithColor.replace(/fill="[^"]*"/g, `fill="${currentIconColor}"`);
    svgCodeWithColor = svgCodeWithColor.replace(/stroke="[^"]*"/g, `stroke="${currentIconColor}"`);
    
    if (!svgCodeWithColor.includes(`fill="${currentIconColor}"`)) {
      svgCodeWithColor = svgCodeWithColor.replace('<svg', `<svg fill="${currentIconColor}"`);
    }
  }
  
  // 使用图标原始viewBox或默认值
  const viewBox = icon.viewBox || '0 0 1024 1024';
  svgCodeWithColor = svgCodeWithColor.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`);
  
  const formattedCode = svgCodeWithColor
    .replace(/></g, '>\n<')
    .replace(/([{}])/g, '\n$1\n')
    .replace(/\n+/g, '\n')
    .trim();
    
  // 存储原始代码用于复制功能
  currentSvgCode = formattedCode;
  
  // 使用Prism.js进行语法高亮
  if (svgCode && window.SyntaxHighlight) {
    window.SyntaxHighlight.applySyntaxHighlight(formattedCode, svgCode);
  }
  
  // 显示模态框 - 使用与备份版本相同的方式
  iconModal.classList.remove('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    if (modalContent) {
      modalContent.classList.remove('scale-95');
      modalContent.classList.add('scale-100');
    }
  }, 10);
}

// 关闭图标详情模态框
function closeIconModal() {
  if (!iconModal || !modalContent) return;
  
  modalContent.classList.remove('scale-100');
  modalContent.classList.add('scale-95');
  setTimeout(() => {
    iconModal.classList.add('opacity-0', 'pointer-events-none');
    currentIcon = null;
    selectedPathIndex = -1;
    selectedPathElement = null;
  }, 200);
}

// 点击外部关闭模态框
function closeModalOnOutsideClick(e) {
  if (e.target === iconModal) {
    closeIconModal();
  }
}

// 更新模态框图标颜色
function updateModalIconColor() {
  if (!modalIconPreview) return;
  
  const svgElement = modalIconPreview.querySelector('.icon-svg-element');
  if (!svgElement) return;
  
  const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
  
  elements.forEach((el, index) => {
    const pathColor = pathColors.get(`${currentIcon.id}-${index}`) || currentIconColor;
    el.setAttribute('fill', pathColor === '#ffffff' ? '#000000' : pathColor);
    el.setAttribute('stroke', pathColor === '#ffffff' ? '#000000' : pathColor);
    
    // 添加点击事件
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectPath(index, el);
    });
  });
}

// 选择路径
function selectPath(index, element) {
  // 清除之前的选择
  if (selectedPathElement) {
    selectedPathElement.style.outline = 'none';
  }
  
  selectedPathIndex = index;
  selectedPathElement = element;
  
  // 高亮选中的路径
  element.style.outline = '2px solid #409eff';
  element.style.outlineOffset = '2px';
  
  updatePathSelection();
}

// 更新选中路径信息显示
function updateSelectedPathInfo() {
  if (!selectedPathInfo) return;
  
  if (selectedPathIndex === -1) {
    selectedPathInfo.innerHTML = '<span>未选择任何路径，点击预览图中的路径进行选择</span>';
  } else {
    const elements = modalIconPreview.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
    const element = elements[selectedPathIndex];
    if (element) {
      selectedPathInfo.innerHTML = `<span>已选择: ${element.tagName.toLowerCase()} #${selectedPathIndex + 1}</span>`;
    } else {
      selectedPathInfo.innerHTML = '<span>所选路径不存在</span>';
    }
  }
}

// 添加路径悬停效果
function setupPathHoverEffects() {
  if (!modalIconPreview) return;
  
  const elements = modalIconPreview.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
  
  elements.forEach((el, index) => {
    el.addEventListener('mouseenter', () => {
      if (selectedPathIndex !== index) {
        el.classList.add('path-hover');
      }
    });
    
    el.addEventListener('mouseleave', () => {
      if (selectedPathIndex !== index) {
        el.classList.remove('path-hover');
      }
    });
  });
}

// 处理路径点击事件
function handlePathClick(event, index) {
  event.stopPropagation();
  
  const elements = modalIconPreview.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
  
  if (selectedPathIndex === index) {
    // 取消选择
    selectedPathIndex = -1;
    selectedPathElement = null;
    elements.forEach(el => el.classList.remove('selected-path'));
  } else {
    // 选择新路径
    if (selectedPathElement) {
      selectedPathElement.classList.remove('selected-path');
    }
    
    selectedPathIndex = index;
    selectedPathElement = elements[index];
    
    if (selectedPathElement) {
      selectedPathElement.classList.add('selected-path');
      
      // 获取当前路径的颜色
      const pathMap = pathColors.get(currentIcon.id) || new Map();
      const pathColor = pathMap.get(index) || currentIconColor;
      if (colorPicker) colorPicker.value = pathColor;
    }
  }
  
  updateSelectedPathInfo();
}

// 添加路径悬停效果
function setupPathHoverEffects() {
  if (!modalIconPreview) return;
  
  const elements = modalIconPreview.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
  
  elements.forEach((el, index) => {
    el.addEventListener('mouseenter', () => {
      if (selectedPathIndex !== index) {
        el.classList.add('path-hover');
      }
    });
    
    el.addEventListener('mouseleave', () => {
      if (selectedPathIndex !== index) {
        el.classList.remove('path-hover');
      }
    });
  });
}

// 计算SVG的最佳viewBox
function calculateOptimalViewBox(svgContent) {
  const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  tempSvg.innerHTML = svgContent;
  
  const elements = tempSvg.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
  
  if (elements.length === 0) {
    return "-10 -10 120 120";
  }
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  elements.forEach(el => {
    try {
      if (el.tagName === 'path' && el.getAttribute('d')) {
        const bbox = getPathBBox(el.getAttribute('d'));
        if (bbox) {
          minX = Math.min(minX, bbox.minX);
          minY = Math.min(minY, bbox.minY);
          maxX = Math.max(maxX, bbox.maxX);
          maxY = Math.max(maxY, bbox.maxY);
        }
      }
      
      const bbox = el.getBBox();
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.width);
      maxY = Math.max(maxY, bbox.y + bbox.height);
    } catch (e) {
      console.warn("无法计算边界框:", e);
    }
  });
  
  if (minX === Infinity) {
    return "-10 -10 120 120";
  }
  
  const padding = 10;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  return `${minX} ${minY} ${width} ${height}`;
}

// 从路径数据解析边界框
function getPathBBox(d) {
  try {
    const points = [];
    const numbers = d.match(/-?\d+(\.\d+)?/g).map(Number);
    
    for (let i = 0; i < numbers.length; i += 2) {
      if (numbers[i+1] !== undefined) {
        points.push({x: numbers[i], y: numbers[i+1]});
      }
    }
    
    if (points.length === 0) return null;
    
    let minX = points[0].x, minY = points[0].y;
    let maxX = points[0].x, maxY = points[0].y;
    
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    
    return {minX, minY, maxX, maxY};
  } catch (e) {
    console.warn("解析路径边界失败:", e);
    return null;
  }
}

// 打开下载设置模态框
function openDownloadSettingsModal(type) {
  if (!downloadSettingsModal) return;
  
  downloadType = type;
  
  if (type === 'selected' && selectedIcons.size === 0) {
    showToast('请先选择要下载的图标', false);
    return;
  }
  
  // 更新模态框标题和信息
  const title = downloadSettingsModal.querySelector('h3');
  if (title) {
    title.textContent = type === 'all' ? '下载全部图标' : '下载选中图标';
  }
  
  const count = type === 'all' ? allIcons.length : selectedIcons.size;
  const countElement = downloadSettingsModal.querySelector('.download-count');
  if (countElement) {
    countElement.textContent = `共 ${count} 个图标`;
  }
  
  // 显示模态框 - 使用与图标详情相同的方式
  downloadSettingsModal.classList.remove('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    const modalContent = downloadSettingsModal.querySelector('div');
    if (modalContent) {
      modalContent.classList.remove('scale-95');
      modalContent.classList.add('scale-100');
    }
  }, 10);
}

// 关闭下载设置模态框
function closeDownloadSettingsModal() {
  if (!downloadSettingsModal) return;
  
  const modalContent = downloadSettingsModal.querySelector('div');
  if (modalContent) {
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
  }
  setTimeout(() => {
    downloadSettingsModal.classList.add('opacity-0', 'pointer-events-none');
  }, 200);
}

// 批量下载图标
function batchDownloadIcons() {
  const exportSvgFormat = exportSvg?.checked || false;
  const exportPngFormat = exportPng?.checked || false;
  
  const sizes = Array.from(exportSizes || [])
    .filter(checkbox => checkbox.checked)
    .map(checkbox => parseInt(checkbox.value));
  
  const packagingOption = document.querySelector('input[name="packagingOption"]:checked')?.value || 'by-icon';
  
  if (!exportSvgFormat && !exportPngFormat) {
    showToast('请至少选择一种导出格式', false);
    return;
  }
  
  if (exportPngFormat && sizes.length === 0) {
    showToast('导出PNG格式时请至少选择一种尺寸', false);
    return;
  }
  
  const useIndividual = useIndividualColors?.checked || true;
  const batchColor = batchColorPicker?.value || '#409eff';
  
  closeDownloadSettingsModal();
  
  let iconsToDownload;
  if (downloadType === 'selected') {
    iconsToDownload = allIcons.filter(icon => selectedIcons.has(icon.id));
    if (iconsToDownload.length === 0) {
      showToast('请先选择要下载的图标', false);
      return;
    }
  } else {
    iconsToDownload = filterIcons(allIcons);
    const maxIcons = 50;
    if (iconsToDownload.length > maxIcons) {
      iconsToDownload = iconsToDownload.slice(0, maxIcons);
      showToast(`一次最多下载 ${maxIcons} 个图标，已自动截断`, false);
    }
  }
  
  // 准备图标数据，应用颜色设置
  const processedIcons = iconsToDownload.map(icon => {
    let svgCode = icon.svgCode;
    
    // 检查是否使用原始颜色（用户未修改）
    const useOriginalColor = !window.ColorManager?.isColorModified(icon.id, originalIconColors, iconColors) && 
                             !window.ColorManager?.isPathColorModified(icon.id, pathColors);
    
    if (!useOriginalColor) {
      // 应用用户设置的颜色
      if (useIndividual) {
        const pathMap = pathColors.get(icon.id);
        const iconColor = iconColors.get(icon.id) || batchColor;
        
        if (pathMap && pathMap.size > 0) {
          // 应用路径级颜色
          const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          tempSvg.innerHTML = svgCode;
          const elements = tempSvg.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
          
          elements.forEach((element, index) => {
            const pathColor = pathMap.get(index) || iconColor;
            element.setAttribute('fill', pathColor === '#ffffff' ? '#000000' : pathColor);
            element.setAttribute('stroke', pathColor === '#ffffff' ? '#000000' : pathColor);
          });
          
          svgCode = new XMLSerializer().serializeToString(tempSvg);
        } else {
          // 应用统一颜色
          svgCode = svgCode.replace(/fill="[^"]*"/g, `fill="${iconColor}"`);
          svgCode = svgCode.replace(/stroke="[^"]*"/g, `stroke="${iconColor}"`);
          if (!svgCode.includes(`fill="${iconColor}"`)) {
            svgCode = svgCode.replace('<svg', `<svg fill="${iconColor}"`);
          }
        }
      } else {
        // 使用统一批量颜色
        svgCode = svgCode.replace(/fill="[^"]*"/g, `fill="${batchColor}"`);
        svgCode = svgCode.replace(/stroke="[^"]*"/g, `stroke="${batchColor}"`);
        if (!svgCode.includes(`fill="${batchColor}"`)) {
          svgCode = svgCode.replace('<svg', `<svg fill="${batchColor}"`);
        }
      }
    }
    
    return {
      ...icon,
      svgCode
    };
  });
  
  // 使用DownloadManager进行下载
  if (window.DownloadManager) {
    if (exportSvgFormat) {
      window.DownloadManager.batchDownload(processedIcons, {
        format: 'svg',
        useZip: packagingOption === 'zip',
        onProgress: (current, total) => {
          showToast(`下载进度: ${current}/${total}`, true);
        },
        onComplete: () => {
          showToast('SVG文件下载完成!');
        }
      });
    }
    
    if (exportPngFormat) {
      window.DownloadManager.batchDownload(processedIcons, {
        format: 'png',
        sizes: sizes,
        useZip: packagingOption === 'zip',
        onProgress: (current, total) => {
          showToast(`PNG生成进度: ${current}/${total}`, true);
        },
        onComplete: () => {
          showToast('PNG文件下载完成!');
        }
      });
    }
  } else {
    showToast('下载模块未加载，请刷新页面重试', false);
  }
}

// 处理外部样式
function handleExternalStyles() {
  // 处理外部CSS样式，确保SVG在不同环境下正确显示
  const externalStyles = document.querySelectorAll('link[rel="stylesheet"], style');
  
  externalStyles.forEach(styleElement => {
    if (styleElement.href && styleElement.href.includes('font')) {
      // 处理字体相关的外部样式
      console.log('检测到字体样式:', styleElement.href);
    }
  });
}
              
              const img = new Image();
              img.onload = function() {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = size;
                tempCanvas.height = size;
                
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(img, 0, 0, size, size);
                
                tempCanvas.toBlob(blob => {
                  let filePath;
                  if (packagingOption === 'by-icon') {
                    filePath = `${icon.processedId}/${icon.processedId}_${size}x${size}.png`;
                  } else {
                    filePath = `png-${size}x${size}/${icon.processedId}.png`;
                  }
                  
                  zip.file(filePath, blob);
                  resolve();
                });
              };
              img.src = svgDataUrl;
            } catch (err) {
              console.error(`处理PNG图标 ${icon.processedId} (${size}x${size}) 失败:`, err);
              resolve();
            }
          }, iconIndex * 100 + sizeIndex * 50);
        }));
      });
    }
    
    return iconPromises;
  });
  
  Promise.all(promises).then(() => {
    zip.generateAsync({ type: 'blob' }, (metadata) => {
      console.log(`打包进度: ${metadata.percent.toFixed(2)}%`);
    }).then((content) => {
      const fileName = `${downloadType === 'selected' ? 'selected' : 'filtered'}-icons-${new Date().getTime()}.zip`;
      saveAs(content, fileName);
      showToast(`已成功打包并下载 ${totalFiles} 个文件`);
    }).catch(err => {
      console.error('打包失败:', err);
      showToast('打包下载失败，请重试', false);
    });
  });
}

// 处理外部样式冲突
function handleExternalStyles() {
  const handleCDStyle = () => {
    const cdStyle = document.getElementById('_CD_STYLE');
    if (cdStyle) {
      cdStyle.remove();
      console.log('已移除_CD_STYLE样式');
    }
  };
  
  handleCDStyle();
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.id === '_CD_STYLE') {
          handleCDStyle();
        }
      });
    });
  });
  
  observer.observe(document.head, { childList: true, subtree: true });
  observer.observe(document.body, { childList: true, subtree: true });
}

// 更新图标颜色
function updateIconColor(color, isReset = false) {
  if (!currentIcon) return;
  
  currentIconColor = color;
  iconColors.set(currentIcon.id, color);
  
  if (colorPicker) {
    colorPicker.value = color;
  }
  
  // 更新模态框中的SVG颜色
  const svgElement = modalIconPreview.querySelector('.icon-svg-element');
  if (svgElement) {
    const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
    
    if (selectedPathIndex === -1 || isReset) {
      // 更新整个图标的颜色
      elements.forEach(el => {
        const finalColor = color === '#ffffff' ? '#000000' : color;
        
        // 检查元素的原始状态
        const originalFill = el.getAttribute('fill');
        const originalStroke = el.getAttribute('stroke');
        
        // 根据原始状态决定处理方式
        if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
          el.setAttribute('fill', finalColor);
        }
        
        if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
          el.setAttribute('stroke', finalColor);
        }
        
        // 如果元素既没有填充也没有描边，则根据情况处理
        if ((!originalFill || originalFill === 'none' || originalFill === 'transparent') &&
            (!originalStroke || originalStroke === 'none' || originalStroke === 'transparent')) {
          el.setAttribute('fill', finalColor);
        }
      });
    } else {
      // 只更新选中路径的颜色
      const selectedElement = elements[selectedPathIndex];
      if (selectedElement) {
        const finalColor = color === '#ffffff' ? '#000000' : color;
        
        // 检查元素的原始状态
        const originalFill = selectedElement.getAttribute('fill');
        const originalStroke = selectedElement.getAttribute('stroke');
        
        // 根据原始状态决定处理方式
        if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
          selectedElement.setAttribute('fill', finalColor);
        }
        
        if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
          selectedElement.setAttribute('stroke', finalColor);
        }
        
        // 如果元素既没有填充也没有描边，则根据情况处理
        if ((!originalFill || originalFill === 'none' || originalFill === 'transparent') &&
            (!originalStroke || originalStroke === 'none' || originalStroke === 'transparent')) {
          selectedElement.setAttribute('fill', finalColor);
        }
        
        // 保存路径颜色
        let pathMap = pathColors.get(currentIcon.id) || new Map();
        pathMap.set(selectedPathIndex, color);
        pathColors.set(currentIcon.id, pathMap);
      }
    }
  }
  
  // 更新列表中的图标颜色
  const iconItem = document.querySelector(`.icon-display-container[data-icon-id="${currentIcon.id}"]`);
  if (iconItem) {
    updateIconItemColor(iconItem, currentIcon.id);
  }
  
  // 更新SVG代码
  if (svgCode && currentIcon.svgCode) {
    let modifiedSvgCode = currentIcon.svgCode;
    
    const pathMap = pathColors.get(currentIcon.id);
    if (pathMap && pathMap.size > 0 && !isReset) {
      // 如果有路径级颜色，应用到SVG代码
      const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      tempSvg.innerHTML = modifiedSvgCode;
      const elements = tempSvg.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
      
      elements.forEach((element, index) => {
        const pathColor = pathMap.get(index) || color;
        element.setAttribute('fill', pathColor === '#ffffff' ? '#000000' : pathColor);
        element.setAttribute('stroke', pathColor === '#ffffff' ? '#000000' : pathColor);
      });
      
      modifiedSvgCode = new XMLSerializer().serializeToString(tempSvg);
    } else {
      // 应用统一颜色
      modifiedSvgCode = modifiedSvgCode.replace(/fill="[^"]*"/g, `fill="${color}"`);
      modifiedSvgCode = modifiedSvgCode.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
      
      if (!modifiedSvgCode.includes(`fill="${color}"`)) {
        modifiedSvgCode = modifiedSvgCode.replace('<svg', `<svg fill="${color}"`);
      }
    }
    
    // 格式化并应用语法高亮
    const formattedCode = modifiedSvgCode
      .replace(/></g, '>\n<')
      .replace(/([{}])/g, '\n$1\n')
      .replace(/\n+/g, '\n')
      .trim();
    
    // 存储原始代码用于复制功能
    currentSvgCode = formattedCode;
    
    // 使用Prism.js进行语法高亮
    if (window.SyntaxHighlight) {
      window.SyntaxHighlight.applySyntaxHighlight(formattedCode, svgCode);
    }
  }
}

// 重置图标颜色
function resetIconColor() {
  if (!currentIcon) return;
  
  const originalColor = originalIconColors.get(currentIcon.id) || '#409eff';
  updateIconColor(originalColor, true);
  
  // 清除路径颜色映射
  pathColors.delete(currentIcon.id);
  
  // 重置路径选择状态
  selectedPathIndex = -1;
  selectedPathElement = null;
  
  // 清除所有路径的选中样式
  const svgElement = modalIconPreview.querySelector('.icon-svg-element');
  if (svgElement) {
    const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
    elements.forEach(el => {
      el.classList.remove('selected-path');
    });
  }
  
  // 更新选中路径信息显示
  updateSelectedPathInfo();
  
  // 更新首页对应图标的颜色
  const iconItem = document.querySelector(`.icon-display-container[data-icon-id="${currentIcon.id}"]`);
  if (iconItem) {
    updateIconItemColor(iconItem, currentIcon.id);
  }
  
  showToast('颜色已重置为默认值');
}

// PS插件相关功能（预留接口）
/**
 * 发送当前图标到PS图层
 * @param {Object} icon - 图标数据
 * @param {Object} options - 发送选项
 */
async function psSendCurrentIcon(icon = null, options = {}) {
  const targetIcon = icon || currentIcon;
  if (!targetIcon) {
    showToast('请先选择一个图标', false);
    return;
  }

  try {
    // 检查PS插件工具是否可用
    if (typeof window.psUtils === 'undefined') {
      showToast('PS插件工具未加载', false);
      return;
    }

    // 准备图标数据，包含当前颜色信息
    let svgCodeWithColors = targetIcon.svgCode;
    const pathMap = pathColors.get(targetIcon.id);
    
    if (pathMap && pathMap.size > 0) {
      // 应用路径级颜色
      const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      tempSvg.innerHTML = svgCodeWithColors;
      const elements = tempSvg.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
      
      elements.forEach((element, index) => {
        const pathColor = pathMap.get(index) || currentIconColor;
        element.setAttribute('fill', pathColor === '#ffffff' ? '#000000' : pathColor);
        element.setAttribute('stroke', pathColor === '#ffffff' ? '#000000' : pathColor);
      });
      
      svgCodeWithColors = new XMLSerializer().serializeToString(tempSvg);
    } else {
      // 应用统一颜色
      const color = iconColors.get(targetIcon.id) || currentIconColor;
      svgCodeWithColors = svgCodeWithColors.replace(/fill="[^"]*"/g, `fill="${color}"`);
      svgCodeWithColors = svgCodeWithColors.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
      
      if (!svgCodeWithColors.includes(`fill="${color}"`)) {
        svgCodeWithColors = svgCodeWithColors.replace('<svg', `<svg fill="${color}"`);
      }
    }

    const iconData = {
      id: targetIcon.id,
      name: targetIcon.processedId,
      svgCode: svgCodeWithColors
    };

    const sendOptions = {
      size: selectedSize || 64,
      opacity: 100,
      ...options
    };

    showToast('正在发送到PS...', true);
    const result = await window.psUtils.psSendToLayer(iconData, sendOptions);
    
    if (result.success) {
      showToast(`图标已发送到PS图层: ${result.layerName}`);
    } else {
      showToast(result.message || '发送失败', false);
    }
    
    return result;
  } catch (error) {
    console.error('发送到PS失败:', error);
    showToast('发送到PS失败，请检查PS连接', false);
    return { success: false, error: error.message };
  }
}

/**
 * 批量发送选中图标到PS
 */
async function psSendSelectedIcons() {
  if (selectedIcons.size === 0) {
    showToast('请先选择要发送的图标', false);
    return;
  }

  try {
    if (typeof window.psUtils === 'undefined') {
      showToast('PS插件工具未加载', false);
      return;
    }

    const iconsToSend = allIcons.filter(icon => selectedIcons.has(icon.id));
    const iconDataList = iconsToSend.map(icon => {
      let svgCodeWithColors = icon.svgCode;
      const pathMap = pathColors.get(icon.id);
      
      if (pathMap && pathMap.size > 0) {
        const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        tempSvg.innerHTML = svgCodeWithColors;
        const elements = tempSvg.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
        
        elements.forEach((element, index) => {
          const pathColor = pathMap.get(index) || '#409eff';
          element.setAttribute('fill', pathColor === '#ffffff' ? '#000000' : pathColor);
          element.setAttribute('stroke', pathColor === '#ffffff' ? '#000000' : pathColor);
        });
        
        svgCodeWithColors = new XMLSerializer().serializeToString(tempSvg);
      } else {
        const color = iconColors.get(icon.id) || '#409eff';
        svgCodeWithColors = svgCodeWithColors.replace(/fill="[^"]*"/g, `fill="${color}"`);
        svgCodeWithColors = svgCodeWithColors.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
      }

      return {
        id: icon.id,
        name: icon.processedId,
        svgCode: svgCodeWithColors
      };
    });

    showToast(`正在批量发送 ${iconDataList.length} 个图标到PS...`, true);
    const result = await window.psUtils.psBatchSendToLayers(iconDataList, {
      size: selectedSize || 64
    });
    
    if (result.success) {
      showToast(`成功发送 ${result.totalSent} 个图标到PS`);
    } else {
      showToast(`发送完成：${result.totalSent} 成功，${result.totalErrors} 失败`, false);
    }
    
    return result;
  } catch (error) {
    console.error('批量发送到PS失败:', error);
    showToast('批量发送失败，请检查PS连接', false);
    return { success: false, error: error.message };
  }
}

// 单个图标下载功能
function downloadSingleIcon(icon, format) {
  if (!icon) {
    showToast('请先选择一个图标', false);
    return;
  }

  try {
    if (format === 'svg') {
      // 下载SVG格式
      let svgCode = icon.svgCode;
      
      // 应用当前颜色设置
      const pathMap = pathColors.get(icon.id);
      if (pathMap && pathMap.size > 0) {
        // 应用路径级颜色
        const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        tempSvg.innerHTML = svgCode;
        const elements = tempSvg.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
        
        elements.forEach((element, index) => {
          const pathColor = pathMap.get(index) || currentIconColor;
          element.setAttribute('fill', pathColor === '#ffffff' ? '#000000' : pathColor);
          element.setAttribute('stroke', pathColor === '#ffffff' ? '#000000' : pathColor);
        });
        
        svgCode = new XMLSerializer().serializeToString(tempSvg);
      } else {
        // 应用统一颜色
        const color = iconColors.get(icon.id) || currentIconColor;
        svgCode = svgCode.replace(/fill="[^"]*"/g, `fill="${color}"`);
        svgCode = svgCode.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
        
        if (!svgCode.includes(`fill="${color}"`)) {
          svgCode = svgCode.replace('<svg', `<svg fill="${color}"`);
        }
      }
      
      // 创建下载链接
      const blob = new Blob([svgCode], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${icon.processedId}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast(`SVG文件 ${icon.processedId}.svg 已下载`);
      
    } else if (format === 'png') {
      // 下载PNG格式
      showToast(`正在生成 ${selectedSize}x${selectedSize} PNG文件...`, true);
      
      let svgCode = icon.svgCode;
      
      // 应用当前颜色设置
      const pathMap = pathColors.get(icon.id);
      if (pathMap && pathMap.size > 0) {
        const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        tempSvg.innerHTML = svgCode;
        const elements = tempSvg.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
        
        elements.forEach((element, index) => {
          const pathColor = pathMap.get(index) || currentIconColor;
          element.setAttribute('fill', pathColor === '#ffffff' ? '#000000' : pathColor);
          element.setAttribute('stroke', pathColor === '#ffffff' ? '#000000' : pathColor);
        });
        
        svgCode = new XMLSerializer().serializeToString(tempSvg);
      } else {
        const color = iconColors.get(icon.id) || currentIconColor;
        svgCode = svgCode.replace(/fill="[^"]*"/g, `fill="${color}"`);
        svgCode = svgCode.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
      }
      
      // 创建完整的SVG代码
      const fullSvgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox || '0 0 1024 1024'}" width="${selectedSize}" height="${selectedSize}">${svgCode.replace(/<svg[^>]*>|<\/svg>/g, '')}</svg>`;
      
      // 转换为PNG
      const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(fullSvgCode)));
      
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = selectedSize;
        canvas.height = selectedSize;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, selectedSize, selectedSize);
        
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${icon.processedId}_${selectedSize}x${selectedSize}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          showToast(`PNG文件 ${icon.processedId}_${selectedSize}x${selectedSize}.png 已下载`);
        });
      };
      
      img.onerror = function() {
        showToast('PNG生成失败，请重试', false);
      };
      
      img.src = svgDataUrl;
    }
  } catch (error) {
    console.error('下载失败:', error);
    showToast('下载失败，请重试', false);
  }
}

// SVG代码语法高亮函数
function applySvgSyntaxHighlight(svgCode) {
  return svgCode
    // 高亮标签名
    .replace(/(<\/?)(\w+)/g, '$1<span class="svg-tag">$2</span>')
    // 高亮属性名
    .replace(/(\w+)(=)/g, '<span class="svg-attribute">$1</span><span class="svg-bracket">$2</span>')
    // 高亮属性值（双引号）
    .replace(/="([^"]*)"/g, '<span class="svg-bracket">=</span><span class="svg-string">"$1"</span>')
    // 高亮括号
    .replace(/([<>])/g, '<span class="svg-bracket">$1</span>')
    // 转义HTML实体
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// 导出主要函数供全局使用
window.IconLibrary = {
  loadIcons,
  searchIcons,
  toggleIconSelection,
  deselectAll,
  applyRandomColors,
  resetAllColors,
  showToast,
  updateIconColor,
  resetIconColor,
  // PS插件接口
  psSendCurrentIcon,
  psSendSelectedIcons
};