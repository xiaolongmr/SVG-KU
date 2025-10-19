/**
 * 主脚本文件 - 简化版本
 * 修复了所有用户反馈的问题
 */

// 基本变量
// 当前选中的图标对象，存储图标完整信息（ID、名称、SVG代码等）
let currentIcon = null;

// 是否处于全屏预览模式（全局变量，供多个函数访问）
let isFullscreenMode = false;

// 当前图标使用的主颜色，初始为空，将在使用时从图标原始属性获取
// 这个颜色会应用到图标整体或单个路径
let currentIconColor = '';

// Map对象，存储每个图标的整体颜色设置
// 键为图标ID，值为对应的颜色值
let iconColors = new Map();

// Map对象，存储图标的路径级颜色设置
// 外层Map键为图标ID，内层Map键为路径索引，值为该路径的颜色
let pathColors = new Map();

// 当前选中的路径索引，用于单个路径颜色编辑
// -1表示未选中任何路径（编辑整体颜色）
let selectedPathIndex = -1;

// 多路径选择集合，用于存储多个选中的路径索引
// 支持多选功能时使用

// 获取图标的原始主颜色
function getIconOriginalColor(icon) {
  if (!icon || !icon.paths || icon.paths.length === 0) {
    return '#409eff'; // 仅在完全无法获取原始颜色时使用蓝色作为后备
  }

  // 优先使用第一个有颜色的路径的填充色或描边色
  for (const path of icon.paths) {
    if (path.fill && path.fill !== 'none' && path.fill !== 'transparent' && path.fill.startsWith('#')) {
      return path.fill;
    }
    if (path.stroke && path.stroke !== 'none' && path.stroke !== 'transparent' && path.stroke.startsWith('#')) {
      return path.stroke;
    }
  }

  return '#409eff'; // 后备颜色
}
let selectedPaths = new Set();

// 记录通过详情页面修改过颜色的图标ID（高优先级）
// 用于区分主页和详情页的颜色修改优先级
let detailModifiedIcons = new Set();

// 同步开关状态，控制主页和详情页之间的颜色同步
let syncWithHomePage = true;

// 当前选中图标的SVG代码，用于复制、下载等功能
let currentSvgCode = '';

// 存储所有加载到页面的图标数据
let allIcons = [];

// 存储当前选中的多个图标的集合（用于批量操作）
let selectedIcons = new Set();

// 加载状态标志，用于控制加载动画和防止重复请求
let isLoading = false;

// 是否还有更多图标可以加载的标志
let hasMoreItems = true;

// 图标总数，用于分页和显示进度
let totalIconCount = 0;

// 当前页码，用于分页加载
let currentPage = 1;

// 初始每页显示的图标数量
let itemsPerPage = 30;

// 动态计算每页显示的图标数量 - 使用实际DOM元素尺寸
function calculateItemsPerPage() {
  // 获取视口尺寸
  const viewportHeight = window.innerHeight;

  // 尝试获取顶部导航和底部区域的实际高度
  let headerFooterHeight = 200; // 默认值作为备用

  // 获取顶部导航区域高度
  const header = document.querySelector('header, .navbar, #header');
  if (header) {
    headerFooterHeight = header.offsetHeight + 50; // 顶部高度 + 底部额外空间
  }

  // 计算可用内容区域高度
  const availableHeight = viewportHeight - headerFooterHeight;

  // 尝试获取图标网格的实际尺寸或第一个图标的实际尺寸
  let actualItemHeight = 140; // 默认值作为备用
  let actualIconsPerRow = 7;  // 默认值作为备用

  // 检查是否已经有图标显示在页面上
  const iconGrid = document.getElementById('iconGrid');
  if (iconGrid) {
    // 尝试获取网格的列数（如果CSS使用了grid布局）
    const gridComputedStyle = window.getComputedStyle(iconGrid);
    const gridTemplateColumns = gridComputedStyle.getPropertyValue('grid-template-columns');
    if (gridTemplateColumns) {
      // 计算grid布局中的列数
      const columnsMatch = gridTemplateColumns.match(/repeat\((\d+)/);
      if (columnsMatch && columnsMatch[1]) {
        actualIconsPerRow = parseInt(columnsMatch[1], 10);
      } else {
        // 如果不是repeat形式，则计算具体的列数
        const columnCount = gridTemplateColumns.split(' ').length;
        if (columnCount > 0) {
          actualIconsPerRow = columnCount;
        }
      }
    }
  }

  // 获取实际图标项的高度
  const firstIconItem = document.querySelector('.icon-display-container');
  if (firstIconItem) {
    actualItemHeight = firstIconItem.offsetHeight + 10; // 图标高度 + 间距
  }

  // 计算可见行数
  const visibleRows = Math.ceil(availableHeight / actualItemHeight);

  // 计算每页显示的图标数量，增加1行的缓冲以避免滚动触发
  const calculatedItems = Math.ceil((visibleRows + 1) * actualIconsPerRow);

  // 确保最小显示数量为30，最大不超过100（性能考虑）
  return Math.max(Math.min(calculatedItems, 100), 30);
}

// DOM元素
const iconModal = document.getElementById('iconModal');
const modalIconPreview = document.getElementById('modalIconPreview');
const svgCode = document.getElementById('svgCode');
const copySvgBtn = document.getElementById('copySvgBtn');
const downloadSvgBtn = document.getElementById('downloadSvgBtn');
const downloadPngBtn = document.getElementById('downloadPngBtn');
const copyDirectBtn = document.getElementById('copyDirectBtn');
const resetColorBtn = document.getElementById('resetColorBtn');
const copyImageBtn = document.getElementById('copyImageBtn');
const toast = document.getElementById('toast');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const modalIconName = document.getElementById('modalIconName');
const modalIconGroup = document.getElementById('modalIconGroup');
const searchInput = document.getElementById('searchInput');
const groupFilter = document.getElementById('groupFilter');
const refreshBtn = document.getElementById('refreshBtn');
const randomColorsBtn = document.getElementById('randomColorsBtn');
const resetAllColorsBtn = document.getElementById('resetAllColorsBtn');
const sizeOptions = document.getElementById('sizeOptions');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 初始化事件监听器
  initializeEventListeners();

  // 初次加载时，先使用默认值30个图标
  loadIcons(1, true); // 加载真实图标数据

  // 图标加载完成后，使用实际DOM元素尺寸重新计算并调整
  setTimeout(() => {
    const calculatedItemsPerPage = calculateItemsPerPage();
    if (calculatedItemsPerPage !== itemsPerPage && document.querySelector('.icon-display-container')) {
      console.log(`根据实际DOM调整每页显示数量: ${itemsPerPage} -> ${calculatedItemsPerPage}`);
      itemsPerPage = calculatedItemsPerPage;
      // 重新加载图标，使用计算后的每页显示数量
      currentPage = 1;
      hasMoreItems = true;
      loadIcons(1, true);
    }

    // 初始化图标详情预览区域的缩放和拖拽功能
    initIconPreviewZoom();

    // 初始化背景颜色切换功能
    initBackgroundColorChanger();
    // 初始化全屏预览功能
    initFullscreenPreview();

    // 检查URL参数中是否包含icon id，如果包含则打开对应图标详情
    checkUrlForIconId();
  }, 500);

  // 监听窗口大小变化，重新计算显示数量
  window.addEventListener('resize', throttle(() => {
    // 确保DOM元素已经渲染完成
    if (document.querySelector('.icon-display-container')) {
      const newItemsPerPage = calculateItemsPerPage();
      // 只有当显示数量变化超过20%时才重新加载图标
      const changePercentage = Math.abs(newItemsPerPage - itemsPerPage) / itemsPerPage;
      if (changePercentage > 0.2) {
        console.log(`窗口大小变化，调整每页显示数量: ${itemsPerPage} -> ${newItemsPerPage}`);
        itemsPerPage = newItemsPerPage;
        // 重新加载图标，使用新的每页显示数量
        currentPage = 1;
        hasMoreItems = true;
        loadIcons(1, true);
      }
    }
  }, 800)); // 增加节流时间，避免频繁触发
})

// 添加滚动加载事件
window.addEventListener('scroll', throttle(() => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
    loadMoreIcons();
  }
}, 200));

// 节流函数
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// 防抖函数
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

function initializeEventListeners() {
  // 搜索功能
  if (searchInput) {
    searchInput.addEventListener('input', debounce(searchIcons, 300));
  }

  // 分组筛选
  if (groupFilter) {
    groupFilter.addEventListener('change', searchIcons);
  }

  // 刷新按钮
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      currentPage = 1;
      hasMoreItems = true;
      loadIcons(1, true);
    });
  }

  // 随机颜色按钮
  if (randomColorsBtn) {
    randomColorsBtn.addEventListener('click', applyRandomColors);
  }

  // 重置所有颜色按钮
  if (resetAllColorsBtn) {
    resetAllColorsBtn.addEventListener('click', resetAllColors);
  }

  // 取消选择按钮
  const deselectAllBtn = document.getElementById('deselectAllBtn');
  if (deselectAllBtn) {
    deselectAllBtn.addEventListener('click', deselectAll);
  }

  // 下载选中按钮
  const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
  if (downloadSelectedBtn) {
    downloadSelectedBtn.addEventListener('click', () => {
      if (selectedIcons.size > 0) {
        openDownloadSettingsModal('selected');
      } else {
        showToast('请先选择要下载的图标', false);
      }
    });
  }

  // 下载全部按钮
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', () => {
      openDownloadSettingsModal('all');
    });
  }

  // 关闭下载设置模态框
  const closeDownloadModal = document.getElementById('closeDownloadModal');
  if (closeDownloadModal) {
    closeDownloadModal.addEventListener('click', closeDownloadSettingsModal);
  }

  // 点击模态框背景关闭
  const downloadSettingsModal = document.getElementById('downloadSettingsModal');
  if (downloadSettingsModal) {
    downloadSettingsModal.addEventListener('click', (e) => {
      if (e.target === downloadSettingsModal) {
        closeDownloadSettingsModal();
      }
    });
  }

  // 确认下载按钮
  const confirmDownloadBtn = document.getElementById('confirmDownloadBtn');
  if (confirmDownloadBtn) {
    confirmDownloadBtn.addEventListener('click', handleConfirmDownload);
  }

  // 取消下载按钮
  const cancelDownloadBtn = document.getElementById('cancelDownloadBtn');
  if (cancelDownloadBtn) {
    cancelDownloadBtn.addEventListener('click', closeDownloadSettingsModal);
  }

  // 加载用户保存的下载设置
  loadDownloadSettings();

  // 监听设置变化并保存
  const downloadForm = downloadSettingsModal;
  if (downloadForm) {
    downloadForm.addEventListener('change', saveDownloadSettings);
  }

  // 自定义尺寸功能初始化
  const customSizeInput = document.getElementById('customSizeInput');
  const customSizeDisplay = document.getElementById('customSizeDisplay');
  const applyCustomSizeBtn = document.getElementById('applyCustomSizeBtn');

  // 实时更新自定义尺寸显示
  if (customSizeInput && customSizeDisplay) {
    customSizeInput.addEventListener('input', () => {
      const size = customSizeInput.value.trim();
      customSizeDisplay.textContent = size || '?';
    });
  }

  // 应用自定义尺寸按钮点击事件
  if (applyCustomSizeBtn) {
    applyCustomSizeBtn.addEventListener('click', () => {
      applyCustomSize();
    });

    // 按下Enter键也可以应用自定义尺寸
    customSizeInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        applyCustomSize();
      }
    });
  }

  // 应用自定义尺寸的函数
  function applyCustomSize() {
    const size = parseInt(customSizeInput.value.trim());
    if (isNaN(size) || size < 1 || size > 2048) {
      showToast('请输入1-2048之间的有效数字', false);
      return;
    }

    // 检查是否已经有这个尺寸的选项
    let customOption = document.querySelector(`.size-option[data-size="${size}"]`);

    // 如果没有这个尺寸的选项，创建一个新的选项
    if (!customOption) {
      const sizeOptions = document.getElementById('sizeOptions');
      customOption = document.createElement('div');
      customOption.className = 'size-option px-3 py-1.5 border border-primary bg-primary/10 text-primary rounded-md cursor-pointer text-sm';
      customOption.dataset.size = size;
      customOption.textContent = `${size}x${size}`;

      // 插入到自定义尺寸输入框前面
      const customContainer = document.querySelector('.custom-size-container');
      sizeOptions.insertBefore(customOption, customContainer);
    }

    // 取消选中其他所有选项
    document.querySelectorAll('.size-option').forEach(option => {
      option.classList.remove('border-primary', 'bg-primary/10', 'text-primary');
      option.classList.add('border-neutral-200', 'hover:border-primary', 'hover:bg-primary/5', 'transition-basic');
    });

    // 选中自定义尺寸选项
    customOption.classList.add('border-primary', 'bg-primary/10', 'text-primary');
    customOption.classList.remove('border-neutral-200', 'hover:border-primary', 'hover:bg-primary/5', 'transition-basic');

    // 更新预览尺寸并显示提示
    selectedSize = size;
    updateIconPreviewSize(selectedSize);
    showToast(`已选择 ${selectedSize}x${selectedSize} 尺寸`);
  }

  // 尺寸选择器事件 - 支持多选
  if (sizeOptions) {
    sizeOptions.addEventListener('click', (e) => {
      // 忽略自定义尺寸输入框区域的点击
      if (e.target.closest('.custom-size-container')) {
        return;
      }

      const sizeOption = e.target.closest('.size-option');
      if (sizeOption) {
        // 切换选中状态（多选模式）
        if (sizeOption.classList.contains('border-primary')) {
          // 移除选中状态的Tailwind类
          sizeOption.classList.remove('border-primary', 'bg-primary/10', 'text-primary');
          // 添加默认状态的Tailwind类
          sizeOption.classList.add('border-neutral-200', 'hover:border-primary', 'hover:bg-primary/5', 'transition-basic');
        } else {
          // 添加选中状态的Tailwind类
          sizeOption.classList.add('border-primary', 'bg-primary/10', 'text-primary');
          // 移除默认状态的Tailwind类
          sizeOption.classList.remove('border-neutral-200', 'hover:border-primary', 'hover:bg-primary/5', 'transition-basic');
        }

        // 获取所有选中的尺寸
        const selectedSizes = Array.from(document.querySelectorAll('.size-option.border-primary'))
          .map(option => parseInt(option.dataset.size));

        if (selectedSizes.length > 0) {
          // 使用第一个选中的尺寸作为预览尺寸
          selectedSize = selectedSizes[0];
          updateIconPreviewSize(selectedSize);

          if (selectedSizes.length === 1) {
            showToast(`已选择 ${selectedSize}x${selectedSize} 尺寸`);
          } else {
            showToast(`已选择 ${selectedSizes.length} 个尺寸: ${selectedSizes.join('x, ')}x`);
          }
        } else {
          showToast('请至少选择一个尺寸', false);
          // 如果没有选中任何尺寸，默认选中64x64
          const defaultOption = document.querySelector('.size-option[data-size="64"]');
          if (defaultOption) {
            // 添加选中状态的Tailwind类
            defaultOption.classList.add('border-primary', 'bg-primary/10', 'text-primary');
            // 移除默认状态的Tailwind类
            defaultOption.classList.remove('border-neutral-200', 'hover:border-primary', 'hover:bg-primary/5', 'transition-basic');
            selectedSize = 64;
            updateIconPreviewSize(selectedSize);
          }
        }
      }
    });
  }

  // 下载多个尺寸的PNG并打包为ZIP
  async function downloadMultiplePNGAsZip(icon, svgCode, sizes) {
    try {
      // 检查JSZip是否可用
      if (typeof JSZip === 'undefined') {
        showToast('ZIP功能不可用，请刷新页面重试', false);
        return;
      }

      const zip = new JSZip();
      const iconName = icon.processedId || icon.id;

      // 为每个尺寸生成PNG
      for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i];
        try {
          showToast(`正在生成 ${size}x${size} PNG... (${i + 1}/${sizes.length})`, true);

          // 生成PNG blob
          const blob = await generatePNGBlob(svgCode, size, icon);

          // 添加到ZIP
          const fileName = `${iconName}_${size}x${size}.png`;
          zip.file(fileName, blob);

        } catch (error) {
          console.error(`生成 ${size}x${size} PNG失败:`, error);
          showToast(`${size}x${size} PNG生成失败，跳过`, false);
        }
      }

      // 生成ZIP文件
      showToast('正在打包ZIP文件...', true);
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // 下载ZIP文件
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${iconName}_${sizes.join('x_')}x.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      showToast(`ZIP文件已下载，包含 ${sizes.length} 个尺寸的PNG`);

    } catch (error) {
      console.error('ZIP打包失败:', error);
      showToast('ZIP打包失败，请重试', false);
    }
  }

  // 生成PNG Blob
  function generatePNGBlob(svgCode, size, icon) {
    return new Promise((resolve, reject) => {
      try {
        // 创建DOM元素来安全处理SVG，避免字符串操作转义问题
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = svgCode;
        let svgElement = tempDiv.querySelector('svg');

        // 如果没有找到SVG元素，创建一个新的
        if (!svgElement) {
          svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        }

        // 设置必要的属性
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgElement.setAttribute('viewBox', icon.viewBox || '0 0 1024 1024');
        svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // 移除固定宽高属性
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');

        // 获取完整的SVG代码
        const fullSvgCode = svgElement.outerHTML;

        // 创建图片元素
        const img = new Image();
        img.onload = () => {
          try {
            // 创建canvas
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // 解析viewBox获取原始宽高比
            let viewBoxMatch = fullSvgCode.match(/viewBox=["']([^"']+)["']/);
            let originalWidth = 1024, originalHeight = 1024;

            if (viewBoxMatch) {
              const viewBoxValues = viewBoxMatch[1].split(/\s+/);
              if (viewBoxValues.length >= 4) {
                originalWidth = parseFloat(viewBoxValues[2]) - parseFloat(viewBoxValues[0]);
                originalHeight = parseFloat(viewBoxValues[3]) - parseFloat(viewBoxValues[1]);
              }
            }

            // 计算保持宽高比的实际尺寸
            const aspectRatio = originalWidth / originalHeight;
            let drawWidth, drawHeight;

            if (aspectRatio > 1) {
              // 宽度较大，以宽度为准
              drawWidth = size;
              drawHeight = Math.round(size / aspectRatio);
            } else {
              // 高度较大或正方形，以高度为准
              drawHeight = size;
              drawWidth = Math.round(size * aspectRatio);
            }

            // 设置高质量渲染
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // 清除画布，确保透明背景
            ctx.clearRect(0, 0, size, size);

            // 添加内边距以防止图标被裁切
            const padding = size * 0.05; // 5%的内边距
            const finalDrawWidth = drawWidth - padding * 2;
            const finalDrawHeight = drawHeight - padding * 2;

            // 计算居中绘制的位置
            const xPos = Math.floor((size - finalDrawWidth) / 2);
            const yPos = Math.floor((size - finalDrawHeight) / 2);

            // 绘制图片到canvas，保持宽高比并居中
            ctx.drawImage(img, xPos, yPos, finalDrawWidth, finalDrawHeight);

            // 转换为blob
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('PNG生成失败'));
              }
            }, 'image/png', 1.0);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error('图片加载失败'));

        // 设置图片源
        const svgBlob = new Blob([fullSvgCode], { type: 'image/svg+xml;charset=utf-8' });
        img.src = URL.createObjectURL(svgBlob);

      } catch (error) {
        reject(error);
      }
    });
  }

  // 获取选中的尺寸数组
  function getSelectedSizes() {
    return Array.from(document.querySelectorAll('.size-option.border-primary'))
      .map(option => parseInt(option.dataset.size))
      .sort((a, b) => b - a); // 按从大到小排序
  }

  // 复制按钮事件
  if (copySvgBtn) {
    copySvgBtn.addEventListener('click', () => {
      if (currentIcon && svgCode) {
        // 获取原始SVG代码
        let originalCode = window.SyntaxHighlight ?
          window.SyntaxHighlight.getPlainTextCode(svgCode) :
          currentSvgCode;
        
        // 应用变换状态（旋转、镜像）到SVG代码
        originalCode = applyTransformToSvgCode(originalCode, currentIcon);

        // 压缩成一行：移除多余空白、换行和缩进
        const compressedCode = originalCode
          .replace(/\s+/g, ' ')  // 替换所有空白字符为单个空格
          .replace(/\s*<\s*/g, '<')  // 移除标签前的空白
          .replace(/\s*>\s*/g, '>')  // 移除标签后的空白
          .trim();

        copyToClipboard(compressedCode).then(success => {
          if (success) {
            // 保存按钮原始文本
            const originalText = copySvgBtn.textContent;
            // 修改按钮文本为"已复制"
            copySvgBtn.textContent = '已复制';
            // 添加视觉反馈样式
            copySvgBtn.classList.add('bg-green-600');

            showToast('SVG代码已压缩复制');

            // 2秒后恢复按钮原始状态
            setTimeout(() => {
              copySvgBtn.textContent = originalText;
              copySvgBtn.classList.remove('bg-green-600');
            }, 2000);
          } else {
            showToast('复制失败，请手动复制', false);
          }
        });
      }
    });
  }

  if (copyDirectBtn) {
    copyDirectBtn.addEventListener('click', () => {
      if (currentIcon && svgCode) {
        // 获取原始SVG代码
        let originalCode = window.SyntaxHighlight ?
          window.SyntaxHighlight.getPlainTextCode(svgCode) :
          currentSvgCode;

        // 压缩成一行：移除多余空白、换行和缩进
        const compressedCode = originalCode
          .replace(/\s+/g, ' ')  // 替换所有空白字符为单个空格
          .replace(/\s*<\s*/g, '<')  // 移除标签前的空白
          .replace(/\s*>\s*/g, '>')  // 移除标签后的空白
          .trim();

        copyToClipboard(compressedCode).then(success => {
          if (success) {
            // 保存按钮原始文本
            const originalText = copyDirectBtn.textContent;
            // 修改按钮文本为"已复制"
            copyDirectBtn.textContent = '已复制';
            // 添加视觉反馈样式
            copyDirectBtn.classList.add('bg-green-600');

            showToast('SVG代码已压缩复制');

            // 2秒后恢复按钮原始状态
            setTimeout(() => {
              copyDirectBtn.textContent = originalText;
              copyDirectBtn.classList.remove('bg-green-600');
            }, 2000);

            closeIconModal();
          } else {
            showToast('复制失败，请手动复制', false);
          }
        });
      }
    });
  }

  // 下载按钮事件
  if (downloadSvgBtn) {
    downloadSvgBtn.addEventListener('click', () => {
      if (currentIcon && window.DownloadManager) {
        // 获取当前显示的SVG元素（包含最新的颜色修改）
        const svgElement = modalIconPreview.querySelector('svg');
        let code;

        if (svgElement && window.svgColorManager) {
          // 使用SVGColorManager获取带颜色的SVG代码
          code = window.svgColorManager.getSVGWithColors(svgElement);
          console.log('downloadSvg: 使用SVGColorManager获取最新SVG代码');
        } else {
          // 降级到原有逻辑
          code = currentSvgCode || currentIcon.svgCode;
          console.log('downloadSvg: 使用降级SVG代码');
        }
        
        // 应用变换状态（旋转、镜像）到SVG代码
        code = applyTransformToSvgCode(code, currentIcon);

        window.DownloadManager.downloadSVG(currentIcon, code);
        showToast('SVG文件下载完成!');
      }
    });
  }

  if (downloadPngBtn) {
    downloadPngBtn.addEventListener('click', () => {
      if (currentIcon && window.DownloadManager) {
        const selectedSizes = getSelectedSizes();

        if (selectedSizes.length === 0) {
          showToast('请先选择至少一个尺寸', false);
          return;
        }

        // 临时保存当前选中状态
        const tempSelectedIndex = selectedPathIndex;

        // 临时清除选中状态以避免下载时包含选中框
        clearPathSelection();

        // 获取当前显示的SVG元素（包含最新的颜色修改，但不包含选中框）
        const svgElement = modalIconPreview.querySelector('svg');
        let code;

        if (svgElement && window.ColorManager) {
          // 使用ColorManager获取带颜色的SVG代码
          code = window.ColorManager.getSVGWithColors(svgElement);
          console.log('downloadPng: 使用ColorManager获取最新SVG代码');
        } else {
          // 降级到原有逻辑
          code = currentSvgCode || currentIcon.svgCode;
          console.log('downloadPng: 使用降级SVG代码');
        }
        
        // 应用变换状态（旋转、镜像）到SVG代码
        code = applyTransformToSvgCode(code, currentIcon);

        if (selectedSizes.length === 1) {
          // 单选：直接下载对应尺寸的PNG
          const size = selectedSizes[0];
          showToast(`正在生成 ${size}x${size} PNG文件...`, true);
          window.DownloadManager.downloadPNG(currentIcon, code, size).then(() => {
            showToast(`PNG文件 ${currentIcon.processedId || currentIcon.id}_${size}x${size}.png 已下载`);
          }).catch(() => {
            showToast('PNG下载失败', false);
          });
        } else {
          // 多选：打包ZIP下载
          showToast(`正在生成 ${selectedSizes.length} 个尺寸的PNG文件并打包...`, true);
          downloadMultiplePNGAsZip(currentIcon, code, selectedSizes);
        }

        // 恢复之前的选中状态（如果有的话）
        if (tempSelectedIndex >= 0) {
          setTimeout(() => {
            selectedPathIndex = tempSelectedIndex;
            const svgElement = modalIconPreview.querySelector('.icon-svg-element');
            if (svgElement) {
              const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
              if (elements[tempSelectedIndex]) {
                elements[tempSelectedIndex].style.outline = '1px dashed #f56c6c';
                elements[tempSelectedIndex].style.outlineOffset = '2px';
                elements[tempSelectedIndex].classList.add('path-selected');
              }
            }
          }, 100);
        }
      }
    });
  }

  // 重置颜色按钮
  if (resetColorBtn) {
    resetColorBtn.addEventListener('click', resetIconColor);
  }

  // 复制图片按钮
  if (copyImageBtn) {
    copyImageBtn.addEventListener('click', () => {
      if (currentIcon) {
        const selectedSizes = getSelectedSizes();

        if (selectedSizes.length === 0) {
          showToast('请先选择至少一个尺寸', false);
          return;
        }

        // 使用最大的尺寸进行复制
        const maxSize = selectedSizes[0]; // 已经按从大到小排序

        if (selectedSizes.length > 1) {
          showToast(`正在准备 ${maxSize}x${maxSize} PNG图片（最大尺寸）...`, true);
        } else {
          showToast(`正在准备 ${maxSize}x${maxSize} PNG图片...`, true);
        }

        copyImageToClipboard(maxSize).then(success => {
          if (success) {
            if (selectedSizes.length > 1) {
              showToast(`${maxSize}x${maxSize} PNG图片已复制到剪贴板（最大尺寸）`);
            } else {
              showToast(`${maxSize}x${maxSize} PNG图片已复制到剪贴板`);
            }
          } else {
            showToast('图片复制失败，请尝试下载后再复制', false);
          }
        }).catch(error => {
          console.error('复制图片失败:', error);
          showToast('图片复制失败，请尝试下载后再复制', false);
        });
      } else {
        showToast('请先选择一个图标', false);
      }
    });
  }

  // 随机路径颜色按钮
  const randomPathColorBtn = document.getElementById('randomPathColorBtn');
  if (randomPathColorBtn) {
    randomPathColorBtn.addEventListener('click', () => {
      if (!currentIcon) {
        showToast('请先选择一个图标', false);
        return;
      }

      console.log('randomPathColor: modalIconPreview元素:', modalIconPreview);

      // 尝试多种方式查找SVG元素
      let svgElement = modalIconPreview.querySelector('.icon-svg-element');
      if (!svgElement) {
        svgElement = modalIconPreview.querySelector('svg');
        console.log('randomPathColor: 使用svg标签查找到:', svgElement);
      }
      if (!svgElement) {
        svgElement = modalIconPreview.querySelector('[class*="svg"]');
        console.log('randomPathColor: 使用class包含svg查找到:', svgElement);
      }

      console.log('randomPathColor: 最终查找到的svgElement:', svgElement);

      // 如果还是没找到，输出modalIconPreview的完整HTML结构
      if (!svgElement) {
        console.log('randomPathColor: modalIconPreview的HTML结构:', modalIconPreview.innerHTML);
      }

      if (svgElement) {
        // 主要方案：使用原生DOM操作实现随机路径颜色
        console.log('randomPathColor: 使用原生DOM操作实现随机路径颜色');
        console.log('randomPathColor: 主要方案中的svgElement:', svgElement);
        const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
        console.log('randomPathColor: 找到的可着色元素:', elements, '数量:', elements.length);

        if (elements.length > 0) {
          let updatedCount = 0;
          const pathColorsMap = new Map();
          const gradientDefinitions = [];

          // 检查SVG是否已有defs元素
          let defsElement = svgElement.querySelector('defs');
          // 只有当原始SVG有defs元素时，才创建渐变
          const hasOriginalDefs = !!defsElement;

          elements.forEach((el, index) => {
            // 检查元素是否已经有渐变色
            const currentFill = el.getAttribute('fill');
            const hasGradient = currentFill && currentFill.startsWith('url(#');

            let fillValue;

            if (hasGradient) {
              // 对原有渐变色修改defs中的渐变定义
              console.log(`randomPathColor: 为路径 ${index} 修改现有渐变色定义，原渐变色: ${currentFill}`);

              // 提取渐变ID
              const gradientIdMatch = currentFill.match(/url\(#([^)]+)\)/);
              if (gradientIdMatch) {
                const gradientId = gradientIdMatch[1];
                const existingGradient = defsElement.querySelector(`#${gradientId}`);

                if (existingGradient && existingGradient.tagName === 'linearGradient') {
                  // 修改现有渐变的颜色
                  const stops = existingGradient.querySelectorAll('stop');
                  if (stops.length >= 2) {
                    const color1 = getRandomColor();
                    const color2 = getRandomColor();
                    stops[0].setAttribute('stop-color', color1);
                    stops[1].setAttribute('stop-color', color2);
                    console.log(`randomPathColor: 已修改渐变 ${gradientId} 的颜色为 ${color1} -> ${color2}`);
                  }
                }
              }

              fillValue = currentFill; // 保持原有的fill引用
              console.log(`randomPathColor: 保持路径 ${index} 的原有fill引用: ${fillValue}`);
            } else {
              // 对纯色元素进行随机上色
              // 如果原始SVG没有defs元素，则只使用纯色，不创建渐变色
              if (hasOriginalDefs) {
                // 原始有defs，可以使用渐变色
                const colorResult = getRandomColorOrGradient(currentIcon.id, index);

                if (typeof colorResult === 'object' && colorResult.url) {
                  // 新生成的渐变色
                  fillValue = colorResult.url;
                  gradientDefinitions.push(colorResult.definition);
                  // 将渐变定义添加到defs中
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = colorResult.definition;
                  const gradientElement = tempDiv.querySelector('linearGradient');
                  if (gradientElement) {
                    defsElement.appendChild(gradientElement);
                  }
                } else {
                  // 纯色
                  fillValue = colorResult;
                }
              } else {
                // 原始没有defs，只使用纯色
                fillValue = getRandomColor();
              }

              el.setAttribute('fill', fillValue);
              // 只有当元素原本有stroke属性且值不为none、transparent，并且不是空字符串时，才设置stroke
              const originalStroke = el.getAttribute('stroke');

              // 严格检查：只有当原始描边存在且有效（非none/transparent/空）时才设置描边
              if (originalStroke && originalStroke !== '' && originalStroke !== 'none' && originalStroke !== 'transparent') {
                // 使用与填充相同的随机颜色
                const randomColor = getRandomColor();
                el.setAttribute('stroke', randomColor);
                console.log(`设置描边颜色，原始描边值: ${originalStroke}，新值: ${randomColor}`);
              } else if (originalStroke) {
                console.log(`跳过设置描边，原始值为无效值: ${originalStroke}`);
              } else {
                // 如果元素原本没有描边属性，确保不会添加任何描边
                console.log(`跳过设置描边，元素原本没有描边属性`);
                // 确保不会意外添加描边
                if (el.hasAttribute('stroke')) {
                  console.warn(`警告: 元素虽然originalStroke为null但hasAttribute('stroke')为true，值为: ${el.getAttribute('stroke')}`);
                }
              }
            }

            pathColorsMap.set(index, fillValue);
            updatedCount++;
          });

          // 检查同步开关状态，决定是否同步到首页
          if (syncWithHomePage) {
            // 同时更新首页对应图标的颜色
            const homeIconContainer = document.querySelector(`.icon-display-container[data-icon-id="${currentIcon.id}"]`);
            if (homeIconContainer) {
              // 尝试多种方式查找首页SVG元素
              let homeIconSvg = homeIconContainer.querySelector('.icon-svg-element');
              if (!homeIconSvg) {
                homeIconSvg = homeIconContainer.querySelector('svg');
                console.log('randomPathColor: 首页使用svg标签查找到:', homeIconSvg);
              }
              if (!homeIconSvg) {
                homeIconSvg = homeIconContainer.querySelector('[class*="svg"]');
                console.log('randomPathColor: 首页使用class包含svg查找到:', homeIconSvg);
              }

              if (homeIconSvg) {
                // 确保首页SVG也有defs元素
                let homeDefsElement = homeIconSvg.querySelector('defs');
                if (!homeDefsElement) {
                  homeDefsElement = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                  homeIconSvg.insertBefore(homeDefsElement, homeIconSvg.firstChild);
                }

                // 同步渐变色修改到首页SVG
                const homeElements = homeIconSvg.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
                homeElements.forEach((el, index) => {
                  const pathColor = pathColorsMap.get(index);
                  if (pathColor) {
                    // 检查是否为渐变色
                    if (pathColor.startsWith('url(#')) {
                      // 对于渐变色，需要同步修改首页SVG中对应的渐变定义
                      const gradientIdMatch = pathColor.match(/url\(#([^)]+)\)/);
                      if (gradientIdMatch) {
                        const gradientId = gradientIdMatch[1];
                        const detailGradient = defsElement.querySelector(`#${gradientId}`);
                        const homeGradient = homeDefsElement.querySelector(`#${gradientId}`);

                        if (detailGradient && homeGradient) {
                          // 复制详情页面的渐变定义到首页
                          const detailStops = detailGradient.querySelectorAll('stop');
                          const homeStops = homeGradient.querySelectorAll('stop');

                          detailStops.forEach((detailStop, stopIndex) => {
                            if (homeStops[stopIndex]) {
                              homeStops[stopIndex].setAttribute('stop-color', detailStop.getAttribute('stop-color'));
                            }
                          });
                          console.log(`randomPathColor: 已同步渐变 ${gradientId} 到首页`);
                        }
                      }
                    } else {
                      // 对于纯色，直接设置fill属性
                      el.setAttribute('fill', pathColor);
                      // 只有当元素原本有stroke属性且值不为none、transparent，并且不是空字符串时，才设置stroke
                      const originalStroke = el.getAttribute('stroke');

                      // 严格检查：只有当原始描边存在且有效（非none/transparent/空）时才设置描边
                      if (originalStroke && originalStroke !== '' && originalStroke !== 'none' && originalStroke !== 'transparent') {
                        // 使用相同的随机颜色
                        el.setAttribute('stroke', getRandomColor());
                        console.log(`randomPathColor: 同步设置描边颜色 (原始描边值: ${originalStroke})`);
                      } else if (originalStroke) {
                        console.log(`randomPathColor: 跳过同步描边，原始值为无效值: ${originalStroke}`);
                      } else {
                        // 如果元素原本没有描边属性，确保不会添加任何描边
                        console.log(`randomPathColor: 跳过同步描边，元素原本没有描边属性`);
                        // 确保不会意外添加描边
                        if (el.hasAttribute('stroke')) {
                          console.warn(`警告: 首页元素虽然originalStroke为null但hasAttribute('stroke')为true，值为: ${el.getAttribute('stroke')}`);
                        }
                      }
                    }
                  }
                });
                console.log(`randomPathColor: 已同步更新首页图标`);
              } else {
                console.warn(`randomPathColor: 未找到首页图标 ${currentIcon.id} 的SVG元素`);
              }
            } else {
              console.warn(`randomPathColor: 未找到首页图标容器 ${currentIcon.id}`);
            }
          } else {
            console.log(`randomPathColor: 同步开关已关闭，跳过首页图标同步`);
          }

          // 更新全局状态
          pathColors.set(currentIcon.id, pathColorsMap)

          // 更新URL参数，确保颜色变化反映在URL中
          updateUrlWithIconInfo(currentIcon.id, getCurrentIconColorString());
          iconColors.delete(currentIcon.id); // 清除整体颜色

          updateSVGCodeDisplay();

          if (elements.length > 1) {
            showToast(`已为 ${elements.length} 个路径生成随机颜色`);
          } else {
            showToast('此图标只有一个路径，已应用随机颜色');
          }
        } else {
          showToast('未找到可着色的SVG元素', false);
        }
      } else {
        showToast('未找到SVG元素，请重试', false);
      }
    });
  }

  // 颜色选项点击事件将在openIconDetail中动态绑定

  // 模态框关闭
  if (closeModal) {
    closeModal.addEventListener('click', closeIconModal);
  }

  if (iconModal) {
    iconModal.addEventListener('click', (e) => {
      if (e.target === iconModal) {
        closeIconModal();
      }
    });
  }

  // 键盘事件
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeIconModal();
    } else if (e.key === 'ArrowLeft' && iconModal && !iconModal.classList.contains('pointer-events-none')) {
      // 左箭头键导航到上一个图标
      navigateToPrevIcon();
    } else if (e.key === 'ArrowRight' && iconModal && !iconModal.classList.contains('pointer-events-none')) {
      // 右箭头键导航到下一个图标
      navigateToNextIcon();
    }
  });

  // 左右导航按钮事件
  const prevIconBtn = document.getElementById('prevIconBtn');
  const nextIconBtn = document.getElementById('nextIconBtn');

  if (prevIconBtn) {
    prevIconBtn.addEventListener('click', navigateToPrevIcon);
  }

  if (nextIconBtn) {
    nextIconBtn.addEventListener('click', navigateToNextIcon);
  }

  // 同步开关事件监听器
  const syncCheckbox = document.getElementById('syncWithHomePage');
  if (syncCheckbox) {
    syncCheckbox.addEventListener('change', (e) => {
      syncWithHomePage = e.target.checked;
      console.log(`同步开关状态已更改为: ${syncWithHomePage ? '开启' : '关闭'}`);
      if (syncWithHomePage) {
        showToast('已开启与首页图标同步');
      } else {
        showToast('已关闭与首页图标同步');
      }
    });
  }
}

// 核心功能：从图标资源JS版获取图标
function loadIcons(page = 1, reset = false) {
  if (isLoading) return;

  isLoading = true;

  if (reset) {
    currentPage = 1;
    allIcons = [];
    selectedIcons.clear();
    updateSelectionUI();
    totalIconCount = 0;

    const iconGrid = document.getElementById('iconGrid');
    if (iconGrid) {
      iconGrid.innerHTML = `
        <div class="loading-container col-span-full flex items-center justify-center py-20">
          <div class="loading-content text-center">
            <div class="loading-spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="loading-text text-gray-600">加载图标中...</p>
          </div>
        </div>
      `;
    }
  }

  // 输出当前的每页显示数量到控制台，用于调试
  console.log(`当前每页显示图标数量: ${itemsPerPage}`);

  // 如果页面已经有图标，尝试再次精确计算每页显示数量
  if (!reset && document.querySelector('.icon-display-container')) {
    const refinedItemsPerPage = calculateItemsPerPage();
    if (Math.abs(refinedItemsPerPage - itemsPerPage) > 5) {
      console.log(`精确计算每页显示数量: ${itemsPerPage} -> ${refinedItemsPerPage}`);
      itemsPerPage = refinedItemsPerPage;
      // 重置并重新加载
      currentPage = 1;
      allIcons = [];
      selectedIcons.clear();
      updateSelectionUI();
      hasMoreItems = true;
      reset = true;

      // 更新图标网格
      const iconGrid = document.getElementById('iconGrid');
      if (iconGrid) {
        iconGrid.innerHTML = `
          <div class="loading-container col-span-full flex items-center justify-center py-20">
            <div class="loading-content text-center">
              <div class="loading-spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p class="loading-text text-gray-600">优化显示中...</p>
            </div>
          </div>
        `;
      }
    }
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
        const originalNameWithoutPrefix = id; // 保持原始ID用于分组判断
        const processedId = processIconName(id);
        const viewBox = symbol.getAttribute('viewBox') || '0 0 1024 1024';
        const content = symbol.innerHTML;
        const svgCode = `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;

        return { id, originalNameWithoutPrefix, processedId, viewBox, content, svgCode };
      });

      allIcons = [...allIcons, ...pageIcons];

      const iconCount = document.getElementById('iconCount');
      if (iconCount) iconCount.textContent = totalIconCount;

      if (reset) {
        renderIcons(allIcons);
      } else {
        const iconGrid = document.getElementById('iconGrid');
        if (iconGrid) {
          pageIcons.forEach(icon => {
            iconGrid.appendChild(createIconItem(icon));
          });
        }
      }

      if (!hasMoreItems) {
        showLoadState('end');
      }

      isLoading = false;
    } catch (error) {
      console.error('加载图标出错:', error);
      showLoadState('error');
      isLoading = false;
    }
  }, 300);
}

// 渲染图标列表
function renderIcons(icons) {
  const iconGrid = document.getElementById('iconGrid');
  if (!iconGrid) return;

  iconGrid.innerHTML = '';
  icons.forEach(icon => {
    iconGrid.appendChild(createIconItem(icon));
  });
}

// 显示加载状态
function showLoadState(state) {
  const loadMoreContainer = document.getElementById('loadMoreContainer');
  if (!loadMoreContainer) return;

  const loadingState = loadMoreContainer.querySelector('.loading-state');
  const endState = loadMoreContainer.querySelector('.end-state');
  const errorState = loadMoreContainer.querySelector('.error-state');

  // 隐藏所有状态
  [loadingState, endState, errorState].forEach(el => {
    if (el) el.classList.add('hidden');
  });

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
  }
}

// 加载更多图标
function loadMoreIcons() {
  if (!hasMoreItems || isLoading) return;
  loadIcons(currentPage + 1);
}

// 切换图标选择状态
function toggleIconSelection(iconId) {
  const container = document.querySelector(`.icon-display-container[data-icon-id="${iconId}"]`);

  if (selectedIcons.has(iconId)) {
    // 取消选择
    selectedIcons.delete(iconId);
    if (container) {
      container.classList.remove('selected');
      container.style.border = '';
      container.style.backgroundColor = '';
    }
  } else {
    // 选择
    selectedIcons.add(iconId);
    if (container) {
      container.classList.add('selected');
      container.style.border = '2px solid #409eff';
      container.style.backgroundColor = 'rgba(64, 158, 255, 0.1)';
    }
  }

  updateSelectionUI();
}

// 取消所有选择
function deselectAll() {
  selectedIcons.forEach(iconId => {
    const container = document.querySelector(`.icon-display-container[data-icon-id="${iconId}"]`);
    if (container) {
      container.classList.remove('selected');
      container.style.border = '';
      container.style.backgroundColor = '';
    }
  });
  selectedIcons.clear();
  updateSelectionUI();
}

// 更新选择状态UI
function updateSelectionUI() {
  const selectedCountContainer = document.getElementById('selectedCount');
  const selectedCount = document.querySelector('#selectedCount .text-primary');
  const deselectAllBtn = document.getElementById('deselectAllBtn');
  const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');

  if (selectedIcons.size > 0) {
    if (selectedCount) selectedCount.textContent = selectedIcons.size;
    if (selectedCountContainer) selectedCountContainer.classList.remove('hidden');
    if (deselectAllBtn) deselectAllBtn.classList.remove('hidden');
    if (downloadSelectedBtn) downloadSelectedBtn.classList.remove('hidden');
  } else {
    if (selectedCountContainer) selectedCountContainer.classList.add('hidden');
    if (deselectAllBtn) deselectAllBtn.classList.add('hidden');
    if (downloadSelectedBtn) downloadSelectedBtn.classList.add('hidden');
  }
}

// 图标分类和名称处理函数
function getIconGroup(iconId) {
  // 根据后缀判断分类
  if (iconId.endsWith('-x')) {
    return { type: 'linear', name: '线性图标' };
  } else if (iconId.endsWith('-m')) {
    return { type: 'filled', name: '面性图标' };
  } else if (iconId.endsWith('-jm')) {
    return { type: 'delicate', name: '精美图标' };
  } else if (iconId.endsWith('-sh')) {
    return { type: 'handdrawn', name: '手绘图标' };
  } else if (iconId.endsWith('-bp')) {
    return { type: 'flat', name: '扁平图标' };
  } else if (iconId.endsWith('-jy')) {
    return { type: 'minimal', name: '简约图标' };
  } else {
    return { type: 'other', name: '其他图标' };
  }
}

function processIconName(iconId) {
  let processed = iconId.replace(/^icon-/, '');
  // 移除所有分类后缀
  processed = processed.replace(/-x$/, '').replace(/-m$/, '').replace(/-jm$/, '').replace(/-sh$/, '').replace(/-bp$/, '').replace(/-jy$/, '');
  return processed;
}

function getOriginalNameWithoutPrefix(iconId) {
  // 去掉'icon-'前缀和分组后缀（如-jm, -x, -m等）
  let processedId = iconId.replace(/^icon-/, '');
  // 去掉常见的分组后缀
  processedId = processedId.replace(/-(jm|x|m|jy)$/, '');
  return processedId;
}

// 图标筛选功能
function filterIcons(icons) {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const groupType = groupFilter ? groupFilter.value : 'all';

  return icons.filter(icon => {
    const matchesSearch = !searchTerm || icon.processedId.toLowerCase().includes(searchTerm);
    const matchesGroup = groupType === 'all' || getIconGroup(icon.originalNameWithoutPrefix).type === groupType;
    return matchesSearch && matchesGroup;
  });
}

// 搜索图标
function searchIcons() {
  const filteredIcons = filterIcons(allIcons);
  renderIcons(filteredIcons);

  const iconCount = document.getElementById('iconCount');
  if (iconCount) {
    iconCount.textContent = filteredIcons.length;
  }
}

// 检查URL中是否包含icon id参数，如果包含则打开对应图标详情，并应用color参数
function checkUrlForIconId() {
  const urlParams = new URLSearchParams(window.location.search);
  const iconId = urlParams.get('id');
  const colorParam = urlParams.get('color');
  const rotateParam = urlParams.get('rotate');
  const mirrorParam = urlParams.get('mirror');

  if (iconId) {
    console.log(`检测到URL中的图标ID: ${iconId}`);
    if (colorParam) {
      console.log(`检测到URL中的颜色参数: ${colorParam}`);
      // 即使图标详情还没打开，也先从URL参数解析颜色信息并保存到全局状态
      // 这样当页面元素加载完成后，主页图标颜色就能正确显示
      preloadColorFromUrlParam(iconId, colorParam);
    }
    if (rotateParam) {
      console.log(`检测到URL中的旋转参数: ${rotateParam}`);
      // 设置全局旋转变量
      window.currentIconRotation = parseInt(rotateParam) || 0;
    }
    if (mirrorParam) {
      console.log(`检测到URL中的镜像参数: ${mirrorParam}`);
      // 解析镜像参数并设置全局镜像变量
      const mirrorParts = mirrorParam.split(',');
      if (mirrorParts.length === 2) {
        window.currentIconMirrorX = parseInt(mirrorParts[0]) || 1;
        window.currentIconMirrorY = parseInt(mirrorParts[1]) || 1;
      }
    }

    // 增加尝试次数和延迟时间，确保SVG资源有足够时间加载
    let attemptCount = 0;
    const maxAttempts = 5;

    function tryFindIcon() {
      attemptCount++;

      // 首先尝试从已加载的图标中查找
      let targetIcon = allIcons.find(icon => icon.id === iconId);

      // 如果在已加载的图标中找不到，则直接从SVG symbols中查找
      if (!targetIcon) {
        const svgContainer = document.querySelector('svg');
        if (svgContainer) {
          const symbol = svgContainer.querySelector(`symbol[id="${iconId}"]`);
          if (symbol) {
            // 确保创建完整的图标对象，包含所有必要属性
            const content = symbol.innerHTML;
            const svgCode = `<svg viewBox="${symbol.getAttribute('viewBox') || '0 0 1024 1024'}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;

            targetIcon = {
              id: symbol.id,
              originalNameWithoutPrefix: symbol.id,
              processedId: processIconName(symbol.id),
              viewBox: symbol.getAttribute('viewBox') || '0 0 1024 1024',
              content: content,
              svgCode: svgCode,
              symbol: symbol
            };
          }
        }
      }

      if (targetIcon) {
        console.log(`找到匹配的图标: ${targetIcon.id}`);

        // 先检查页面上是否已经有这个图标的DOM元素
        const homeIconElement = document.querySelector(`.icon-display-container[data-icon-id="${iconId}"]`);

        if (!homeIconElement && hasMoreItems) {
          // 如果页面上没有DOM元素且还有更多图标可加载，开始加载更多图标直到找到
          console.log(`URL中的图标 ${iconId} 不在当前页面DOM中，开始预加载`);

          const preloadForIconDetail = async () => {
            let loadAttempts = 0;
            const maxLoadAttempts = 20;

            while (loadAttempts < maxLoadAttempts && hasMoreItems) {
              loadAttempts++;

              // 加载更多图标
              loadMoreIcons();

              // 等待加载完成
              await new Promise(resolve => setTimeout(resolve, 1000));

              // 检查图标是否已加载到页面上
              if (document.querySelector(`.icon-display-container[data-icon-id="${iconId}"]`)) {
                console.log(`预加载成功，图标 ${iconId} 已加载到页面`);
                break;
              }
            }

            // 无论是否找到，都打开图标详情（openIconDetail函数会处理滚动）
            openIconDetail(targetIcon, colorParam, rotateParam, mirrorParam);
          };

          // 开始预加载过程
          preloadForIconDetail();
        } else {
          // 直接打开图标详情
          openIconDetail(targetIcon, colorParam, rotateParam, mirrorParam);
        }
      } else if (attemptCount < maxAttempts) {
        // 如果未找到图标且尝试次数未达上限，继续尝试
        setTimeout(tryFindIcon, 500 * attemptCount); // 递增延迟时间
      } else {
        console.warn(`经过${maxAttempts}次尝试后仍未找到ID为${iconId}的图标`);
        showToast(`未找到ID为${iconId}的图标`, false);
      }
    }

    // 开始尝试查找图标
    setTimeout(tryFindIcon, 500);
  }
}

// 更新URL中的图标ID、颜色、旋转角度和镜像参数，不添加到浏览器历史记录
function updateUrlWithIconInfo(iconId, colorString) {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set('id', iconId);
  if (colorString) {
    urlParams.set('color', colorString);
  } else {
    urlParams.delete('color');
  }

  // 添加旋转角度参数
  if (window.currentIconRotation && window.currentIconRotation !== 0) {
    urlParams.set('rotate', window.currentIconRotation);
  } else {
    urlParams.delete('rotate');
  }

  // 添加镜像参数
  // 将mirrorX和mirrorY组合成一个字符串，如"-1,1"表示只有水平镜像
  const mirrorValue = `${window.currentIconMirrorX},${window.currentIconMirrorY}`;
  if (mirrorValue !== "1,1") {
    urlParams.set('mirror', mirrorValue);
  } else {
    urlParams.delete('mirror');
  }

  // 构建新的URL
  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

  // 使用replace方法更新URL，不添加到浏览器历史记录
  window.history.replaceState(null, '', newUrl);
}

// 从URL中移除图标ID和颜色参数
function removeIconIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);

  // 移除所有图标相关参数
  if (urlParams.has('id')) {
    urlParams.delete('id');
  }
  if (urlParams.has('color')) {
    urlParams.delete('color');
  }
  if (urlParams.has('rotate')) {
    urlParams.delete('rotate');
  }
  if (urlParams.has('mirror')) {
    urlParams.delete('mirror');
  }

  // 构建新的URL
  const newUrl = urlParams.toString()
    ? `${window.location.pathname}?${urlParams.toString()}`
    : window.location.pathname;

  // 使用replace方法更新URL，不添加到浏览器历史记录
  window.history.replaceState(null, '', newUrl);
}

// 预加载URL参数中的颜色信息，保存到全局状态
function preloadColorFromUrlParam(iconId, colorParam) {
  try {
    // 清除现有的路径颜色设置
    if (pathColors.has(iconId)) {
      pathColors.delete(iconId);
    }

    // 检查是否为单个路径颜色或整体颜色
    if (colorParam.startsWith('#')) {
      // 整体颜色格式: #123456
      const color = colorParam;
      iconColors.set(iconId, color);
      console.log(`预加载整体颜色: ${color} 到图标 ${iconId}`);
    } else {
      // 路径颜色格式: 0#123456,1,2#654321 或 1,2#123456,3#654321
      const pathColorMap = new Map();
      let hasPathColors = false;

      // 使用正则表达式全局匹配所有的路径-颜色对
      // 匹配格式如: 1#123456 或 1,2#123456
      const matches = colorParam.match(/(?:^|,)([\d,]+)#([0-9a-fA-F]{6})/g);

      if (matches) {
        matches.forEach(match => {
          // 移除开头可能的逗号
          const cleanMatch = match.startsWith(',') ? match.slice(1) : match;
          // 分割路径索引和颜色值
          const parts = cleanMatch.split('#');
          if (parts.length === 2) {
            const pathIndicesStr = parts[0];
            const color = `#${parts[1]}`;

            // 处理多个路径索引（用逗号分隔）
            const pathIndices = pathIndicesStr.split(',').map(index => parseInt(index));
            pathIndices.forEach(pathIndex => {
              pathColorMap.set(pathIndex, color);
              hasPathColors = true;
            });
          }
        });
      }
      console.log(`预加载图标 ${iconId} 的 ${pathColorMap.size} 个路径颜色`);

      // 如果有路径颜色，保存
      if (hasPathColors) {
        pathColors.set(iconId, pathColorMap);
      }
    }

    // 尝试立即更新主页图标颜色
    // 如果此时DOM还未完全加载，这个更新可能会失败，但稍后渲染时会再次应用
    setTimeout(() => {
      updateHomeIconColorFromUrl(iconId);
    }, 500);
  } catch (error) {
    console.error('预加载颜色参数失败:', error);
  }
}

// 从URL参数更新主页图标颜色
function updateHomeIconColorFromUrl(iconId) {
  // 查找主页上的图标容器
  const homeIconContainer = document.querySelector(`.icon-display-container[data-icon-id="${iconId}"]`);
  if (!homeIconContainer) {
    // 只在调试模式下显示警告
    // console.warn(`未找到主页图标 ${iconId}`);
    return;
  }

  // 查找主页图标中的SVG元素
  let homeIconSvg = homeIconContainer.querySelector('.icon-svg-element');
  if (!homeIconSvg) {
    homeIconSvg = homeIconContainer.querySelector('svg');
  }

  if (homeIconSvg) {
    // 应用已保存的颜色设置
    const iconColor = iconColors.get(iconId);
    const pathColorMap = pathColors.get(iconId);

    if (pathColorMap && pathColorMap.size > 0) {
      // 如果有路径级别的颜色设置
      const elements = homeIconSvg.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
      pathColorMap.forEach((color, index) => {
        if (elements[index]) {
          const element = elements[index];
          element.setAttribute('fill', color);
          // 如果元素有stroke属性，也同步更新
          if (element.hasAttribute('stroke') && element.getAttribute('stroke') !== 'none') {
            element.setAttribute('stroke', color);
          }
        }
      });
      console.log(`已从URL参数更新主页图标 ${iconId} 的路径颜色`);
    } else if (iconColor) {
      // 如果有整体颜色设置
      const elements = homeIconSvg.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
      elements.forEach(el => {
        if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') {
          el.setAttribute('fill', iconColor);
        }
        if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
          el.setAttribute('stroke', iconColor);
        }
      });
      console.log(`已从URL参数更新主页图标 ${iconId} 的整体颜色为 ${iconColor}`);
    }
  } else {
    console.warn(`未找到主页图标 ${iconId} 的SVG元素`);
  }
}

// 从预览图标SVG元素直接获取颜色字符串表示
function getCurrentIconColorString() {
  if (!currentIcon) return '';

  // 获取预览区域中的SVG元素
  const modalIconPreview = document.getElementById('modalIconPreview');
  if (!modalIconPreview) return '';

  // 查找SVG元素
  const svgElement = modalIconPreview.querySelector('svg');
  if (!svgElement) return '';

  // 获取所有有颜色的路径和形状元素
  const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
  if (elements.length === 0) return '';

  const colorToPathIndices = new Map(); // 颜色到路径索引的映射，用于优化相同颜色的路径表示

  elements.forEach((element, index) => {
    // 获取填充颜色，如果没有填充则尝试获取描边颜色
    let color = element.getAttribute('fill');
    if (!color || color === 'none') {
      color = element.getAttribute('stroke');
    }

    // 获取原始颜色（从currentIcon中获取，而不是使用硬编码的默认颜色）
    let originalColor = '';
    if (currentIcon.paths && currentIcon.paths[index]) {
      originalColor = currentIcon.paths[index].fill || currentIcon.paths[index].stroke || '';
    }

    // 如果找到颜色并且是有效的十六进制颜色格式，且与原始颜色不同
    if (color && color.startsWith('#') && color !== originalColor) {
      // 将路径索引添加到对应颜色的数组中
      if (!colorToPathIndices.has(color)) {
        colorToPathIndices.set(color, []);
      }
      colorToPathIndices.get(color).push(index);
    }
  });

  // 如果没有修改颜色的路径，返回空字符串
  if (colorToPathIndices.size === 0) {
    return '';
  }

  // 检查是否所有修改的路径都使用相同的颜色
  if (colorToPathIndices.size === 1) {
    const onlyColor = colorToPathIndices.keys().next().value;
    const pathIndices = colorToPathIndices.get(onlyColor);

    // 如果只有一个路径被修改颜色，使用简单格式
    if (pathIndices.length === 1) {
      return `${pathIndices[0]}#${onlyColor.replace('#', '')}`;
    }
  }

  // 构建颜色参数字符串
  const colorSegments = [];

  // 遍历每个颜色及其对应的路径索引
  colorToPathIndices.forEach((pathIndices, color) => {
    // 对路径索引进行排序，使URL参数更加一致
    pathIndices.sort((a, b) => a - b);

    // 移除颜色中的#前缀
    const colorValue = color.replace('#', '');

    // 优化：使用逗号分隔的路径索引和单个颜色值组合
    // 格式：1,2#颜色值，表示路径1和路径2都使用这个颜色
    const pathIndicesStr = pathIndices.join(',');
    colorSegments.push(`${pathIndicesStr}#${colorValue}`);
  });

  // 返回排序后的路径颜色字符串，使URL参数更加一致
  return colorSegments.sort((a, b) => {
    // 按第一个路径索引排序
    const firstIndexA = parseInt(a.split(',')[0].split('#')[0]);
    const firstIndexB = parseInt(b.split(',')[0].split('#')[0]);
    return firstIndexA - firstIndexB;
  }).join(',');
}

// 从URL参数中解析并应用颜色信息（在打开图标详情时使用）
function applyColorFromUrlParam(icon, colorParam) {
  try {
    // 先通过 preloadColorFromUrlParam 处理颜色参数保存
    preloadColorFromUrlParam(icon.id, colorParam);

    // 设置当前图标的颜色（用于详情页）
    const iconColor = iconColors.get(icon.id);
    const pathColorMap = pathColors.get(icon.id);

    if (pathColorMap && pathColorMap.size > 0) {
      // 如果有路径级别的颜色设置，使用第一个路径的颜色作为当前图标颜色
      const firstColor = pathColorMap.values().next().value;
      if (firstColor) {
        currentIconColor = firstColor;
      }
    } else if (iconColor) {
      currentIconColor = iconColor;
    }

    console.log(`应用颜色到图标详情: ${currentIconColor}`);
  } catch (error) {
    console.error('应用颜色参数失败:', error);
  }
}

function createIconItem(icon) {
  const container = document.createElement('div');
  // 确保保留icon-display-container类供JavaScript使用，同时添加Tailwind样式类
  container.className = 'icon-display-container cursor-pointer p-4 border rounded-lg transition-all relative bg-white';
  container.dataset.iconId = icon.id;

  // 添加分类标签
  const iconGroup = getIconGroup(icon.originalNameWithoutPrefix);
  const categoryLabel = document.createElement('div');
  categoryLabel.className = `group-badge group-${iconGroup.type}`;

  // 根据分类类型设置文本和标题
  if (iconGroup.type === 'linear') {
    categoryLabel.textContent = '线性';
    categoryLabel.title = '线性图标';
  } else if (iconGroup.type === 'filled') {
    categoryLabel.textContent = '面性';
    categoryLabel.title = '面性图标';
  } else if (iconGroup.type === 'delicate') {
    categoryLabel.textContent = '精美';
    categoryLabel.title = '精美图标';
  } else if (iconGroup.type === 'handdrawn') {
    categoryLabel.textContent = '手绘';
    categoryLabel.title = '手绘图标';
  } else if (iconGroup.type === 'flat') {
    categoryLabel.textContent = '扁平';
    categoryLabel.title = '扁平图标';
  } else if (iconGroup.type === 'minimal') {
    categoryLabel.textContent = '简约';
    categoryLabel.title = '简约图标';
  } else {
    categoryLabel.textContent = '其他';
    categoryLabel.title = '其他图标';
  }

  container.appendChild(categoryLabel);

  const svgWrapper = document.createElement('div');
  svgWrapper.className = 'icon-svg-wrapper w-10 h-10 mx-auto';

  const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgElement.className = 'icon-svg-element w-full h-full';
  svgElement.setAttribute('viewBox', icon.viewBox || '0 0 1024 1024');
  svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svgElement.innerHTML = icon.content;
  
  // 应用存储的变换状态（旋转、镜像）
  try {
    const iconTransformKey = `icon_transform_${icon.id}`;
    const storedData = localStorage.getItem(iconTransformKey);
    if (storedData) {
      const transformData = JSON.parse(storedData);
      if (transformData.rotation !== 0 || transformData.mirrorX !== 1 || transformData.mirrorY !== 1) {
        // 计算中心点
        const viewBox = svgElement.getAttribute('viewBox') || '0 0 1024 1024';
        const [x, y, width, height] = viewBox.split(' ').map(Number);
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 创建变换字符串
        let transform = '';
        transform += `translate(-${centerX}, -${centerY}) `;
        transform += `scale(${transformData.mirrorX}, ${transformData.mirrorY}) `;
        transform += `rotate(${transformData.rotation}) `;
        transform += `translate(${centerX}, ${centerY})`;
        
        // 创建g元素来包裹所有内容并应用变换
        const gElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gElement.setAttribute('transform', transform);
        
        // 将所有子元素移动到g元素中
        while (svgElement.firstChild) {
          if (svgElement.firstChild.nodeType === 1 && svgElement.firstChild.tagName !== 'style') {
            gElement.appendChild(svgElement.firstChild);
          } else {
            // 保留style标签等在svg根元素
            svgElement.appendChild(svgElement.firstChild);
          }
        }
        
        // 将g元素添加回svg
        svgElement.appendChild(gElement);
      }
    }
  } catch (error) {
    console.error(`应用图标变换状态失败: ${error.message}`);
  }

  // 使用SVGColorManager应用已保存的颜色
  if (window.svgColorManager) {
    // 初始化SVG并应用存储的颜色
    window.svgColorManager.initializeSVG(svgElement, icon.id);
    window.svgColorManager.applyStoredColors(svgElement, icon.id);
  } else {
    // 备用方案：使用原有逻辑
    const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
    const iconPathColors = pathColors.get(icon.id);
    const iconOverallColor = iconColors.get(icon.id);

    if (iconPathColors && iconPathColors.size > 0) {
      // 应用路径级颜色
      elements.forEach((el, index) => {
        const pathColor = iconPathColors.get(index);
        if (pathColor) {
          el.setAttribute('fill', pathColor);
          // 只有当元素原本有stroke属性且值不为none、transparent，并且不是空字符串时，才设置stroke
          const originalStroke = el.getAttribute('stroke');
          if (originalStroke && originalStroke !== '' && originalStroke !== 'none' && originalStroke !== 'transparent') {
            el.setAttribute('stroke', pathColor);
            console.log(`设置描边颜色，原始描边值: ${originalStroke}`);
          } else if (originalStroke) {
            console.log(`跳过设置描边，原始值为: ${originalStroke}`);
          } else {
            // 静默跳过，减少日志输出
          }
        }
      });
    } else if (iconOverallColor) {
      // 应用整体颜色
      elements.forEach(el => {
        el.setAttribute('fill', iconOverallColor);
        // 只有当元素原本有stroke属性且值不为none、transparent，并且不是空字符串时，才设置stroke
        const originalStroke = el.getAttribute('stroke');
        if (originalStroke && originalStroke !== '' && originalStroke !== 'none' && originalStroke !== 'transparent') {
          el.setAttribute('stroke', iconOverallColor);
          console.log(`设置描边颜色，原始描边值: ${originalStroke}`);
        } else if (originalStroke) {
          console.log(`跳过设置描边，原始值为: ${originalStroke}`);
        } else {
          console.log(`跳过设置描边，元素原本没有描边属性`);
        }
      });
    }
  }

  const nameLabel = document.createElement('div');
  nameLabel.className = 'icon-name-label text-center text-gray-600 font-medium truncate mt-2';
  nameLabel.textContent = icon.processedId || icon.id;

  svgWrapper.appendChild(svgElement);
  container.appendChild(svgWrapper);
  container.appendChild(nameLabel);

  // 点击事件 - 支持多选
  container.addEventListener('click', (e) => {
    // 检查是否按住Ctrl/Cmd键进行多选
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      toggleIconSelection(icon.id);
    } else {
      openIconDetail(icon);
    }
  });

  // 长按事件（移动端多选）
  let longPressTimer = null;
  container.addEventListener('mousedown', (e) => {
    longPressTimer = setTimeout(() => {
      toggleIconSelection(icon.id);
    }, 500);
  });

  container.addEventListener('mouseup', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

  container.addEventListener('mouseleave', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

  return container;
}

function openIconDetail(icon, colorParam, rotateParam, mirrorParam) {
  if (!iconModal) return;

  currentIcon = icon;
  // 获取图标颜色（如果有保存的颜色则使用，否则获取图标原始颜色）
  currentIconColor = iconColors.get(icon.id) || getIconOriginalColor(icon);

  // 如果提供了color参数，则解析并应用颜色
  if (colorParam) {
    applyColorFromUrlParam(icon, colorParam);
  }

  // 如果提供了rotate参数，则设置旋转状态
  if (rotateParam) {
    try {
      window.currentIconRotation = parseInt(rotateParam, 10);
      if (isNaN(window.currentIconRotation)) {
        window.currentIconRotation = 0;
      }
      console.log(`应用URL中的旋转参数: ${window.currentIconRotation}度`);
    } catch (error) {
      console.error('解析旋转参数失败:', error);
      window.currentIconRotation = 0;
    }
  } else {
    window.currentIconRotation = 0;
  }

  // 如果提供了mirror参数，则设置镜像状态
  if (mirrorParam) {
    try {
      const mirrorValues = mirrorParam.split(',');
      if (mirrorValues.length >= 2) {
        window.currentIconMirrorX = parseFloat(mirrorValues[0]) || 1;
        window.currentIconMirrorY = parseFloat(mirrorValues[1]) || 1;
        console.log(`应用URL中的镜像参数: X=${window.currentIconMirrorX}, Y=${window.currentIconMirrorY}`);
      }
    } catch (error) {
      console.error('解析镜像参数失败:', error);
      window.currentIconMirrorX = 1;
      window.currentIconMirrorY = 1;
    }
  } else {
    window.currentIconMirrorX = 1;
    window.currentIconMirrorY = 1;
  }
  
  // 从本地存储读取保存的图标调整状态
  // 注意：URL参数优先级高于本地存储，所以只有在没有URL参数时才尝试读取本地存储
  if (icon.id && !rotateParam && !mirrorParam) {
    try {
      const savedState = localStorage.getItem(`iconTransform_${icon.id}`);
      if (savedState) {
        const iconState = JSON.parse(savedState);
        window.currentIconScale = iconState.scale !== undefined ? iconState.scale : 1;
        window.currentIconX = iconState.x !== undefined ? iconState.x : 0;
        window.currentIconY = iconState.y !== undefined ? iconState.y : 0;
        window.currentIconRotation = iconState.rotation !== undefined ? iconState.rotation : 0;
        window.currentIconMirrorX = iconState.mirrorX !== undefined ? iconState.mirrorX : 1;
        window.currentIconMirrorY = iconState.mirrorY !== undefined ? iconState.mirrorY : 1;
        console.log('从本地存储恢复图标调整状态:', iconState);
      }
    } catch (error) {
      console.error('解析本地存储的图标状态失败:', error);
    }
  }

  // 在打开详情页前，先找到主页对应的图标元素并滚动到可见区域
  const scrollToIcon = () => {
    const homeIconContainer = document.querySelector(`.icon-display-container[data-icon-id="${icon.id}"]`);
    if (homeIconContainer) {
      // 平滑滚动到图标位置
      homeIconContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      console.log(`已滚动到主页图标 ${icon.id} 的位置`);
      return true;
    }
    return false;
  };

  // 先尝试直接滚动到图标
  if (scrollToIcon()) {
    // 如果图标已在当前页面，直接继续执行
  } else if (hasMoreItems && !isLoading) {
    // 如果图标不在当前页面且有更多内容可加载
    console.log(`图标 ${icon.id} 不在当前页面，开始滚动加载`);

    // 定义一个滚动加载函数，直到找到图标或没有更多内容
    const loadAndSearchForIcon = async () => {
      // 防止无限循环的最大尝试次数
      let maxScrollAttempts = 20;

      while (maxScrollAttempts > 0) {
        maxScrollAttempts--;

        // 加载更多图标
        loadMoreIcons();

        // 等待加载完成
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 再次尝试滚动到图标
        if (scrollToIcon()) {
          break;
        }

        // 如果没有更多图标可加载，退出循环
        if (!hasMoreItems) {
          console.log(`已加载所有图标，仍未找到图标 ${icon.id}`);
          break;
        }
      }
    };

    // 启动滚动加载过程
    loadAndSearchForIcon();
  }

  // 更新URL中的id参数和color参数，不添加到浏览器历史记录
  updateUrlWithIconInfo(icon.id, getCurrentIconColorString());

  // 初始化自定义颜色选择器
  try {
    if (window.ColorManager && typeof window.ColorManager.createCustomColorPicker === 'function') {
      window.ColorManager.createCustomColorPicker('customColorPicker', currentIconColor, (color) => {
        updateIconColor(color);
      });
    } else {
      // 如果ColorManager不可用，创建简单的颜色选择器
      createSimpleColorPicker('customColorPicker', currentIconColor);
    }
  } catch (error) {
    console.warn('颜色选择器初始化失败，使用备用方案:', error);
    createSimpleColorPicker('customColorPicker', currentIconColor);
  }

  selectedPathIndex = -1;

  // 重新绑定预设颜色选项事件
  setTimeout(() => {
    bindColorOptionEvents();
    bindPath2ColorEvents();
    // 初始化图标预览区域的滚轮缩放功能
    initIconPreviewZoom();

    // 应用全局缩放状态（如果存在）
    setTimeout(() => {
      if (modalIconPreview) {
        // 获取全局缩放和位置状态
        const scale = typeof window.currentIconScale !== 'undefined' ? window.currentIconScale : 1;
        const x = typeof window.currentIconX !== 'undefined' ? window.currentIconX : 0;
        const y = typeof window.currentIconY !== 'undefined' ? window.currentIconY : 0;

        // 应用缩放、位置和变换状态
        const rotation = typeof window.currentIconRotation !== 'undefined' ? window.currentIconRotation : 0;
        const mirrorX = typeof window.currentIconMirrorX !== 'undefined' ? window.currentIconMirrorX : 1;
        const mirrorY = typeof window.currentIconMirrorY !== 'undefined' ? window.currentIconMirrorY : 1;

        modalIconPreview.style.transform = `translate(${x}px, ${y}px) scale(${scale}) scaleX(${mirrorX}) scaleY(${mirrorY}) rotate(${rotation}deg)`;
        console.log(`openIconDetail: 应用缩放状态 ${scale}, 位置 (${x}, ${y}), 旋转 ${rotation}度, 镜像 X=${mirrorX}, Y=${mirrorY}`);

        // 重新更新鼠标样式和重置按钮可见性
        // 确保updateCursorStyle函数存在（该函数在initIconPreviewZoom中定义）
        if (typeof updateCursorStyle === 'function') {
          updateCursorStyle();
        } else {
          // 如果函数不存在，直接设置默认样式
          modalIconPreview.style.cursor = 'default';
          // 尝试直接调用updateResetButtonVisibility如果存在的话
          if (typeof updateResetButtonVisibility === 'function') {
            updateResetButtonVisibility();
          }
        }
      }
    }, 10);
  }, 100);

  if (modalTitle) modalTitle.textContent = `图标详情: ${icon.processedId || icon.id}`;
  // 设置图标名称，添加Font Awesome图标
  if (modalIconName) {
    modalIconName.innerHTML = `<i class="fa fa-font mr-2 text-primary"></i>${icon.processedId || icon.id}`;
  }

  // 设置图标分组信息，添加Font Awesome图标
  if (modalIconGroup) {
    const iconGroup = getIconGroup(icon.originalNameWithoutPrefix);
    // 根据分组类型选择不同的图标
    let groupIcon = 'fa-layer-group';
    if (iconGroup.type === 'linear') groupIcon = 'fa-sitemap';
    else if (iconGroup.type === 'filled') groupIcon = 'fa-cube';
    else if (iconGroup.type === 'delicate') groupIcon = 'fa-gem';
    else if (iconGroup.type === 'handdrawn') groupIcon = 'fa-pencil';
    else if (iconGroup.type === 'flat') groupIcon = 'fa-th';
    else if (iconGroup.type === 'minimal') groupIcon = 'fa-feather';

    modalIconGroup.innerHTML = `<i class="fa ${groupIcon} mr-2 text-primary"></i>${iconGroup.name}`;
  }

  if (modalIconPreview) {
    // 创建SVG预览
    const svgWrapper = document.createElement('div');
    svgWrapper.className = 'icon-svg-wrapper w-full h-full flex items-center justify-center';
    svgWrapper.style.overflow = 'visible';

    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.className = 'icon-svg-element';
    svgElement.setAttribute('viewBox', icon.viewBox || '0 0 1024 1024');
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgElement.setAttribute('width', '200');
    svgElement.setAttribute('height', '200');

    // 检查icon.content是否已经包含完整的SVG标签，如果是，则只提取内部内容
    let content = icon.content.trim();
    if (content.startsWith('<svg') && content.endsWith('</svg>')) {
      // 创建临时元素来解析SVG内容
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const tempSvg = tempDiv.querySelector('svg');
      if (tempSvg) {
        // 只使用SVG的内部内容，避免嵌套
        content = tempSvg.innerHTML;
      }
    }

    svgElement.innerHTML = content;

    svgWrapper.appendChild(svgElement);
    modalIconPreview.innerHTML = '';
    modalIconPreview.appendChild(svgWrapper);

    // 如果当前处于全屏模式，立即应用固定尺寸样式
    if (window.isFullscreenMode || isFullscreenMode) {
      // 确保SVG包装器保持正确样式
      svgWrapper.style.width = 'auto';
      svgWrapper.style.height = 'auto';
      svgWrapper.style.display = 'flex';
      svgWrapper.style.alignItems = 'center';
      svgWrapper.style.justifyContent = 'center';

      // 确保SVG元素保持固定尺寸
      const currentWidth = svgElement.getAttribute('width') || '200';
      const currentHeight = svgElement.getAttribute('height') || '200';
      svgElement.style.width = currentWidth + 'px';
      svgElement.style.height = currentHeight + 'px';
      svgElement.style.flexShrink = '0'; // 防止图标被压缩
    }

    // 获取SVG元素用于后续操作
    const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');

    // 使用SVGColorManager初始化并应用已保存的颜色
    if (window.svgColorManager) {
      window.svgColorManager.initializeSVG(svgElement, icon.id);
      window.svgColorManager.applyStoredColors(svgElement, icon.id);
    } else {
      // 备用方案：使用原有逻辑
      const iconPathColors = pathColors.get(icon.id);
      const iconOverallColor = iconColors.get(icon.id);

      if (iconPathColors && iconPathColors.size > 0) {
        // 应用路径级颜色
        elements.forEach((el, index) => {
          const pathColor = iconPathColors.get(index);
          if (pathColor) {
            el.setAttribute('fill', pathColor);
            // 只有当元素原本有stroke属性且值不为none、transparent，并且不是空字符串时，才设置stroke
            const originalStroke = el.getAttribute('stroke');
            if (originalStroke && originalStroke !== '' && originalStroke !== 'none' && originalStroke !== 'transparent') {
              el.setAttribute('stroke', pathColor);
              console.log(`设置描边颜色，原始描边值: ${originalStroke}`);
            } else if (originalStroke) {
              // 只在需要时显示
            } else {
              // 静默跳过，减少日志输出
            }
          }
        });
      } else if (iconOverallColor) {
        // 应用整体颜色
        elements.forEach(el => {
          el.setAttribute('fill', iconOverallColor);
          // 只有当元素原本有stroke属性且值不为none、transparent，并且不是空字符串时，才设置stroke
          const originalStroke = el.getAttribute('stroke');
          if (originalStroke && originalStroke !== '' && originalStroke !== 'none' && originalStroke !== 'transparent') {
            el.setAttribute('stroke', iconOverallColor);
            console.log(`设置描边颜色，原始描边值: ${originalStroke}`);
          } else if (originalStroke) {
            console.log(`跳过设置描边，原始值为: ${originalStroke}`);
          } else {
            console.log(`跳过设置描边，元素原本没有描边属性`);
          }
        });
      }
    }

    // 绑定路径点击事件
    elements.forEach((el, index) => {
      el.style.cursor = 'pointer';
      el.style.pointerEvents = 'auto';

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePathClick(e, index);
      });

      el.addEventListener('mouseenter', () => {
        if (selectedPathIndex !== index) {
          el.style.opacity = '0.7';
        }
      });

      el.addEventListener('mouseleave', () => {
        el.style.opacity = '1';
      });
    });
  }

  updateSVGCodeDisplay();

  // 根据路径数量控制帮助文本的显示
  const pathSelectionHelp = document.getElementById('pathSelectionHelp');
  const modalSvgElement = modalIconPreview.querySelector('svg');
  if (pathSelectionHelp && modalSvgElement) {
    const pathCount = modalSvgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse').length;
    // 只有当图标有多个路径时才显示帮助文本
    if (pathCount > 1) {
      pathSelectionHelp.classList.remove('hidden');
    } else {
      pathSelectionHelp.classList.add('hidden');
    }
  }

  // 显示模态框
  iconModal.classList.remove('opacity-0', 'pointer-events-none');

  // 添加动画效果
  const modalContent = iconModal.querySelector('div:not(.modal-nav-buttons)');
  if (modalContent) {
    modalContent.classList.remove('scale-95');
    modalContent.classList.add('scale-100');
  }

  // 初始化Reset按钮的显示状态
  updateIconResetBtnVisibility();
}

function updateSVGCodeDisplay() {
  if (!currentIcon || !svgCode) return;

  let svgCodeWithColor = currentIcon.svgCode;

  // 优先使用SVGColorManager获取带颜色的SVG代码
  const modalSvgElement = modalIconPreview.querySelector('svg');
  if (modalSvgElement && window.svgColorManager) {
    // 使用SVGColorManager获取带颜色的SVG代码
    svgCodeWithColor = window.svgColorManager.getSVGWithColors(modalSvgElement);
    console.log('updateSVGCodeDisplay: 使用SVGColorManager获取最新SVG代码');
  } else {
    // 检查是否使用原始颜色（用户未修改）
    const hasCustomColor = iconColors.has(currentIcon.id);
    const hasPathColors = pathColors.has(currentIcon.id) && pathColors.get(currentIcon.id).size > 0;

    if (hasCustomColor || hasPathColors) {
      // 应用用户设置的颜色
      const pathMap = pathColors.get(currentIcon.id);
      if (pathMap && pathMap.size > 0) {
        // 应用路径级颜色
        const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        tempSvg.innerHTML = svgCodeWithColor;
        const elements = tempSvg.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');

        elements.forEach((element, index) => {
          const pathColor = pathMap.get(index) || currentIconColor;
          // 设置填充颜色
          element.setAttribute('fill', pathColor === '#ffffff' ? '#000000' : pathColor);

          // 只在元素原始有描边属性时才设置描边颜色
          if (element.hasAttribute('stroke')) {
            const originalStroke = element.getAttribute('stroke');
            // 确保原始描边不是空值、none或transparent
            if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
              element.setAttribute('stroke', pathColor === '#ffffff' ? '#000000' : pathColor);
            }
          }
        });

        svgCodeWithColor = new XMLSerializer().serializeToString(tempSvg);
      } else {
        // 应用统一颜色
        const color = iconColors.get(currentIcon.id) || currentIconColor;
        svgCodeWithColor = svgCodeWithColor.replace(/fill="[^"]*"/g, `fill="${color}"`);
        // 不要直接替换所有stroke属性，避免给原本没有描边的元素添加描边
        // 只替换已有的、有实际值的描边属性
        const strokeRegex = /stroke="([^\"]+)"/g;
        svgCodeWithColor = svgCodeWithColor.replace(strokeRegex, (match, strokeValue) => {
          if (strokeValue && strokeValue !== 'none' && strokeValue !== 'transparent' && strokeValue !== '') {
            return `stroke="${color}"`;
          }
          return match; // 保留原始值
        });

        if (!svgCodeWithColor.includes(`fill="${color}"`)) {
          svgCodeWithColor = svgCodeWithColor.replace('<svg', `<svg fill="${color}"`);
        }
      }
    }
  }
  // 如果用户没有修改颜色，保持原始样子

  // 检测并移除嵌套的SVG标签
  if (svgCodeWithColor.includes('<svg') && svgCodeWithColor.includes('</svg>')) {
    // 创建临时元素来解析SVG内容
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = svgCodeWithColor;
    const tempSvg = tempDiv.querySelector('svg');
    if (tempSvg) {
      // 检查是否有嵌套SVG
      const nestedSvg = tempSvg.querySelector('svg');
      if (nestedSvg) {
        console.log('updateSVGCodeDisplay: 检测到嵌套SVG，提取内部SVG内容');
        // 创建新的临时SVG元素
        const cleanSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        // 复制原始SVG的属性
        Array.from(tempSvg.attributes).forEach(attr => {
          cleanSvg.setAttribute(attr.name, attr.value);
        });
        // 使用嵌套SVG的内部内容
        cleanSvg.innerHTML = nestedSvg.innerHTML;
        svgCodeWithColor = new XMLSerializer().serializeToString(cleanSvg);
      }
    }
  }

  const formattedCode = svgCodeWithColor
    .replace(/></g, '>\n<')
    .replace(/\n+/g, '\n')
    .trim();

  currentSvgCode = formattedCode;

  // 使用Prism.js进行语法高亮
  if (window.SyntaxHighlight) {
    window.SyntaxHighlight.applySyntaxHighlight(formattedCode, svgCode);
  } else {
    // 降级处理
    const codeElement = svgCode.querySelector('code') || svgCode;
    codeElement.textContent = formattedCode;
  }
}

function handlePathClick(event, index) {
  const isCtrlPressed = event.ctrlKey || event.metaKey; // 支持Ctrl键（Windows/Linux）和Cmd键（Mac）
  const isShiftPressed = event.shiftKey; // Shift键用于添加选中

  // Shift键 - 仅添加选中（加选）
  if (isShiftPressed) {
    selectedPaths.add(index);
    selectedPathIndex = index; // 更新最后选中的索引
  }
  // Ctrl键 - 仅取消选中（减选）
  else if (isCtrlPressed) {
    if (selectedPaths.has(index)) {
      selectedPaths.delete(index);
      // 如果删除后没有选中的路径，重置选中索引
      if (selectedPaths.size === 0) {
        selectedPathIndex = -1;
      }
    }
  }
  // 普通点击 - 清除之前选中，只选中当前路径
  else {
    selectedPaths.clear();
    selectedPaths.add(index);
    selectedPathIndex = index;
  }

  // 更新路径选择状态
  let svgElement = modalIconPreview.querySelector('.icon-svg-element');
  if (!svgElement) {
    svgElement = modalIconPreview.querySelector('svg');
    console.log(`handlePathClick: 使用svg标签查找到元素:`, svgElement);
  }

  if (svgElement) {
    console.log(`handlePathClick: 找到SVG元素，准备更新路径选中状态`);
    const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
    elements.forEach((el, i) => {
      if (selectedPaths.has(i)) {
        // 选中的路径：设置选中状态
        setPathSelectedState(el, i);
      } else {
        // 未选中的路径：清除样式和属性
        el.style.stroke = '';
        el.style.strokeDasharray = '';
        el.style.strokeWidth = '';
        el.removeAttribute('selected');
        el.classList.remove('selected');
        el.classList.remove('path-selected');
      }
    });
  }

  // 显示颜色选择器，传递所有选中的路径索引
  showPathColorPicker(event, Array.from(selectedPaths));

  // 显示提示信息
  const selectedCount = selectedPaths.size;
  if (selectedCount > 0) {
    const pathNumbers = Array.from(selectedPaths).map(idx => idx + 1).join(', ');

    // 显示操作提示 - 根据不同的选中状态显示不同的提示
    if (selectedCount === 1) {
      showToast(`已选中路径 ${pathNumbers}，按住Shift键加选，按住Ctrl键减选`);
    } else {
      showToast(`已选中 ${selectedCount} 个路径 (${pathNumbers})，点击颜色选择器修改颜色`);
    }
  }
}

// 获取SVG元素的实际计算颜色
function getComputedElementColor(element) {
  if (!element) return null;

  // 首先检查直接设置的填充颜色
  const fill = element.getAttribute('fill');
  if (fill && fill !== 'none' && fill !== 'transparent') {
    return fill;
  }

  // 然后检查直接设置的描边颜色
  const stroke = element.getAttribute('stroke');
  if (stroke && stroke !== 'none' && stroke !== 'transparent') {
    return stroke;
  }

  // 使用getComputedStyle获取计算后的颜色（考虑继承）
  const computedStyle = window.getComputedStyle(element);
  let computedColor = computedStyle.getPropertyValue('fill');

  // 如果计算后的填充颜色无效，尝试描边颜色
  if (!computedColor || computedColor === 'none' || computedColor === 'transparent') {
    computedColor = computedStyle.getPropertyValue('stroke');
  }

  // 转换颜色格式为十六进制（如果需要）
  return computedColor;
}

// 规范化颜色格式，将rgb/rgba转换为十六进制
function normalizeColor(color) {
  if (!color || color === 'none' || color === 'transparent') return null;

  // 如果已经是十六进制格式，直接返回
  if (color.startsWith('#')) {
    return color.toLowerCase();
  }

  // 处理rgb/rgba格式
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`.toLowerCase();
  }

  return color.toLowerCase();
}

// 显示路径颜色选择器弹窗
function showPathColorPicker(event, pathIndices) {
  // 确保pathIndices是数组
  const pathIndexArray = Array.isArray(pathIndices) ? pathIndices : [pathIndices];

  // 如果没有选中任何路径，直接返回
  if (pathIndexArray.length === 0) {
    return;
  }

  // 移除已存在的颜色选择器
  const existingPicker = document.querySelector('.path-color-picker-popup');
  if (existingPicker) {
    existingPicker.remove();
  }

  // 从HTML模板创建颜色选择器弹窗
  const template = document.getElementById('pathColorPickerTemplate');
  const popup = document.importNode(template.content, true).querySelector('.path-color-picker-popup');

  // 设置弹窗位置
  popup.style.left = event.pageX + 'px';
  popup.style.top = event.pageY + 'px';

  // 获取当前颜色（使用第一个路径的颜色作为默认值）
  const firstPathIndex = pathIndexArray[0];

  // 尝试获取元素的实际颜色
  let currentPathColor = pathColors.get(currentIcon.id)?.get(firstPathIndex) || currentIconColor;

  // 尝试获取SVG元素的实际计算颜色
  const svgElement = modalIconPreview.querySelector('.icon-svg-element') || modalIconPreview.querySelector('svg');
  if (svgElement) {
    const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
    if (elements[firstPathIndex]) {
      const actualColor = getComputedElementColor(elements[firstPathIndex]);
      if (actualColor) {
        const normalizedColor = normalizeColor(actualColor);
        if (normalizedColor) {
          currentPathColor = normalizedColor;
        }
      }
    }
  }

  // 生成路径标签文本
  const pathLabels = pathIndexArray.length > 1
    ? `路径 ${pathIndexArray.map(idx => idx + 1).join(', ')} 颜色`
    : `路径 ${firstPathIndex + 1} 颜色`;

  // 设置弹窗内容
  popup.querySelector('.path-label').textContent = pathLabels;
  popup.querySelector('.path-color-input').value = currentPathColor;

  // 添加到文档
  document.body.appendChild(popup);

  // 绑定事件
  const colorInput = popup.querySelector('.path-color-input');
  const presetColorsContainer = popup.querySelector('#presetColorsContainer');
  const applyBtn = popup.querySelector('.apply-color-btn');
  const cancelBtn = popup.querySelector('.cancel-color-btn');

  // 定义预设颜色数组
  const presetColors = [
    { color: '#0078ff', name: '蓝色' },
    { color: '#303133', name: '深灰色' },
    { color: '#f56c6c', name: '红色' },
    { color: '#67c23a', name: '绿色' },
    { color: '#e6a23c', name: '橙色' },
    { color: '#ffffff', name: '白色' }

  ];

  // 动态生成预设颜色选项
  function generatePresetColors() {
    // 清空容器
    presetColorsContainer.innerHTML = '';

    // 为每个预设颜色创建DOM元素
    presetColors.forEach(preset => {
      const colorOption = document.createElement('div');
      colorOption.className = 'color-option w-6 h-6 rounded cursor-pointer border border-gray-300 relative';
      colorOption.style.backgroundColor = preset.color;
      colorOption.dataset.color = preset.color;
      colorOption.setAttribute('title', preset.name); // 添加颜色名称作为提示

      // 创建对号图标 - 根据背景颜色决定图标颜色
      const checkIcon = document.createElement('i');
      const isLightColor = preset.color === '#ffffff';
      const iconColorClass = isLightColor ? 'text-black' : 'text-white';
      checkIcon.className = `fa fa-check color-selected-icon absolute inset-0 flex items-center justify-center ${iconColorClass} opacity-0 transition-opacity duration-200`;

      // 将图标添加到颜色选项
      colorOption.appendChild(checkIcon);

      // 将颜色选项添加到容器
      presetColorsContainer.appendChild(colorOption);

      // 绑定点击事件
      colorOption.addEventListener('click', () => handleColorOptionClick(colorOption, preset.color));
    });

    // 返回所有颜色选项元素
    return popup.querySelectorAll('.color-option');
  }

  // 处理颜色选项点击
  function handleColorOptionClick(option, color) {
    colorInput.value = color;
    updateColorSelection(option);

    // 实时预览颜色变化 - 应用到所有选中路径
    pathIndexArray.forEach(index => {
      updateSelectedPathColor(color, index);
    });
  }

  // 更新颜色选择状态
  function updateColorSelection(option) {
    // 首先移除所有选项的选中状态
    const allOptions = popup.querySelectorAll('.color-option');
    allOptions.forEach(opt => {
      const icon = opt.querySelector('.color-selected-icon');
      if (icon) {
        icon.classList.add('opacity-0');
      }
    });

    // 如果提供了选项，则设置为选中状态
    if (option) {
      const icon = option.querySelector('.color-selected-icon');
      if (icon) {
        icon.classList.remove('opacity-0');
      }
    }
  }

  // 初始化预设颜色
  const colorOptions = generatePresetColors();

  // 初始化颜色选项选中状态 - 只有当当前颜色存在于预设颜色中时才选中
  function initializeColorSelection() {
    // 首先确保所有选项都不选中
    updateColorSelection(null);

    // 规范化当前路径颜色用于比较
    const normalizedCurrentColor = normalizeColor(currentPathColor);

    // 查找匹配的预设颜色
    const matchingColor = presetColors.find(preset => normalizeColor(preset.color) === normalizedCurrentColor);

    if (matchingColor) {
      // 找到匹配的预设颜色选项
      const matchingOption = Array.from(colorOptions).find(option =>
        normalizeColor(option.dataset.color) === normalizedCurrentColor
      );

      if (matchingOption) {
        updateColorSelection(matchingOption);
      }
    }
    // 如果不匹配任何预设颜色，保持所有选项不选中
  }

  // 初始化颜色选中状态
  initializeColorSelection();

  // 点击弹窗外部时清除选中状态
  function handleOutsideClick(e) {
    // 确保弹窗存在并且点击目标不在弹窗内
    if (popup && !popup.contains(e.target)) {
      // 根据需求：只要颜色选择弹窗不显示，就不应该显示红色虚线描边
      // 所以无论点击哪里，只要弹窗关闭，就清除路径选中状态
      clearPathSelection();

      document.removeEventListener('click', handleOutsideClick);
      popup.remove();
    }
  }

  // 延迟添加点击事件以避免立即触发
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 0);

  // 为弹窗添加点击事件，阻止事件冒泡，防止触发document的点击事件
  popup.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // 颜色输入框实时变化事件
  colorInput.addEventListener('input', (e) => {
    const color = e.target.value;
    const normalizedColor = normalizeColor(color);

    // 检查是否有预设颜色选项匹配当前输入的颜色（使用规范化的颜色进行比较）
    const matchingOption = Array.from(colorOptions).find(option =>
      normalizeColor(option.dataset.color) === normalizedColor
    );

    // 根据是否找到匹配的预设颜色来更新选中状态
    // 如果找不到匹配项，则不选中任何预设颜色
    updateColorSelection(matchingOption);

    // 实时预览颜色变化 - 应用到所有选中路径
    pathIndexArray.forEach(index => {
      updateSelectedPathColor(color, index);
    });
  });

  // 实时更新选中路径颜色的函数
  function updateSelectedPathColor(color, pathIndex) {
    const svgElement = modalIconPreview.querySelector('.icon-svg-element');
    if (svgElement && pathIndex >= 0) {
      const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
      if (elements[pathIndex]) {
        const element = elements[pathIndex];
        const finalColor = color; // 移除白色到黑色的转换，允许设置真正的白色

        // 检查元素的原始状态
        const originalFill = element.getAttribute('fill');
        const originalStroke = element.getAttribute('stroke');

        // 根据原始状态决定处理方式
        if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
          // 有填充颜色的元素：更新填充颜色
          element.setAttribute('fill', finalColor);
        }

        if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
          // 有描边的元素：更新描边颜色
          element.setAttribute('stroke', finalColor);
        }

        // 如果元素既没有填充也没有描边，则根据情况处理
        if ((!originalFill || originalFill === 'none' || originalFill === 'transparent') &&
          (!originalStroke || originalStroke === 'none' || originalStroke === 'transparent')) {
          // 对于完全没有颜色的元素，默认添加填充颜色
          element.setAttribute('fill', finalColor);
        }

        // 保持选中状态的视觉效果（使用统一函数设置红色虚线边框）
        setPathSelectedState(element, pathIndex);

        console.log(`实时预览: 路径 ${pathIndex} 颜色更新为 ${finalColor}，原始填充: ${originalFill}，原始描边: ${originalStroke}`);
      }
    }
  }

  // 应用颜色
  applyBtn.addEventListener('click', () => {
    const newColor = colorInput.value;

    // 存储颜色到Map中，确保永久保存颜色设置
    if (!pathColors.has(currentIcon.id)) {
      pathColors.set(currentIcon.id, new Map());
    }
    // 为所有选中路径保存新颜色
    pathIndexArray.forEach(index => {
      pathColors.get(currentIcon.id).set(index, newColor);
    });

    // 由于我们已经修改了updateIconColor函数以支持多个选中路径的更新，
    // 现在可以直接调用updateIconColor，它会自动处理所有选中路径的颜色更新
    updateIconColor(newColor);

    // 显示成功提示
    const pathNumbers = pathIndexArray.map(idx => idx + 1).join(', ');
    showToast(`路径 ${pathNumbers} 颜色已更新为 ${newColor}`);

    // 清除路径选中状态（移除红色虚线描边）
    clearPathSelection();

    // 隐藏弹窗
    document.removeEventListener('click', handleOutsideClick);
    popup.remove();
  });

  // 取消
  cancelBtn.addEventListener('click', () => {
    // 传入isReset=true，让updateIconColor根据pathColors正确恢复颜色
    updateIconColor(currentIconColor, true);

    // 清除路径选中状态（移除红色虚线描边）
    clearPathSelection();

    // 隐藏弹窗
    document.removeEventListener('click', handleOutsideClick);
    popup.remove();
  });

  // 已在前面添加了点击外部关闭的处理逻辑，此处不再重复添加

  // 添加拖拽功能
  makeColorPickerDraggable(popup);
}

/**
 * 使颜色选择器弹窗可拖拽（支持鼠标和触摸事件）
 * @param {HTMLElement} popup - 颜色选择器弹窗元素
 */
function makeColorPickerDraggable(popup) {
  let isDragging = false;
  let offsetX, offsetY;

  // 获取标题元素（已在HTML模板中定义好样式和拖拽图标）
  const titleElement = popup.querySelector('label.cursor-move');

  // 尝试从localStorage中恢复位置
  const savedPosition = localStorage.getItem('colorPickerPosition');
  if (savedPosition) {
    try {
      const { x, y } = JSON.parse(savedPosition);
      // 确保恢复的位置在视口范围内
      const maxX = window.innerWidth - popup.offsetWidth;
      const maxY = window.innerHeight - popup.offsetHeight;
      const safeX = Math.max(0, Math.min(x, maxX));
      const safeY = Math.max(0, Math.min(y, maxY));
      popup.style.left = safeX + 'px';
      popup.style.top = safeY + 'px';
    } catch (e) {
      console.error('恢复颜色选择器位置失败:', e);
    }
  }

  // 开始拖拽的通用函数
  function startDragging(clientX, clientY, target) {
    // 确保点击的是弹窗本身、标题或拖拽图标
    if (target === popup || target === titleElement ||
      target.classList.contains('drag-handle') || target.closest('.drag-handle')) {
      isDragging = true;
      const rect = popup.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;

      // 提升z-index以避免拖拽时被遮挡
      popup.style.zIndex = '1001';

      // 添加拖动时的样式
      popup.style.cursor = 'grabbing';
      if (titleElement) titleElement.style.cursor = 'grabbing';
    }
  }

  // 移动弹窗的通用函数
  function movePopup(clientX, clientY) {
    if (!isDragging) return;

    // 计算新位置
    let newX = clientX - offsetX;
    let newY = clientY - offsetY;

    // 确保弹窗不会移出视口
    const maxX = window.innerWidth - popup.offsetWidth;
    const maxY = window.innerHeight - popup.offsetHeight;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    popup.style.left = newX + 'px';
    popup.style.top = newY + 'px';

    // 确保移动时保持拖拽样式
    popup.style.cursor = 'grabbing';
    if (titleElement) titleElement.style.cursor = 'grabbing';
  }

  // 结束拖拽的通用函数
  function endDragging() {
    if (isDragging) {
      isDragging = false;
      // 恢复样式
      popup.style.cursor = 'default';
      if (titleElement) titleElement.style.cursor = 'move';

      // 保存位置到localStorage
      const x = parseInt(popup.style.left);
      const y = parseInt(popup.style.top);
      localStorage.setItem('colorPickerPosition', JSON.stringify({ x, y }));

      // 恢复z-index
      popup.style.zIndex = '50';
    }
  }

  // ===== 鼠标事件支持 =====
  // 添加拖动区域（标题和整个弹窗都可以拖动）
  popup.addEventListener('mousedown', function (e) {
    startDragging(e.clientX, e.clientY, e.target);
  });

  // 监听鼠标移动
  document.addEventListener('mousemove', function (e) {
    movePopup(e.clientX, e.clientY);
  });

  // 监听鼠标释放
  document.addEventListener('mouseup', endDragging);

  // ===== 触摸事件支持（手机端）=====
  // 触摸开始事件
  popup.addEventListener('touchstart', function (e) {
    // 只处理单指触摸
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      startDragging(touch.clientX, touch.clientY, e.target);
      // 阻止默认行为，防止页面滚动
      e.preventDefault();
    }
  }, { passive: false }); // passive: false 允许在touchstart中使用preventDefault

  // 触摸移动事件
  document.addEventListener('touchmove', function (e) {
    // 只处理单指触摸
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      movePopup(touch.clientX, touch.clientY);
      // 如果正在拖拽，阻止默认行为
      if (isDragging) {
        e.preventDefault();
      }
    }
  }, { passive: false }); // passive: false 允许在touchmove中使用preventDefault

  // 触摸结束事件
  document.addEventListener('touchend', endDragging);

  // 触摸取消事件（当触摸被中断时，如电话打入）
  document.addEventListener('touchcancel', endDragging);

  // 防止拖拽过程中触发文本选择
  popup.addEventListener('selectstart', function (e) {
    e.preventDefault();
  });

  // 防止在弹窗内的输入框或按钮点击时触发拖拽
  const interactiveElements = popup.querySelectorAll('input, button');
  interactiveElements.forEach(element => {
    // 鼠标事件
    element.addEventListener('mousedown', function (e) {
      e.stopPropagation(); // 阻止冒泡，防止触发弹窗的mousedown事件
    });

    // 触摸事件
    element.addEventListener('touchstart', function (e) {
      e.stopPropagation(); // 阻止冒泡，防止触发弹窗的touchstart事件
    });
  });
}

// 清除路径选中状态
/**
 * 设置SVG路径元素的选中状态（红色虚线描边）
 * @param {Element} element - 要设置选中状态的SVG元素
 * @param {number} index - 路径索引（用于日志）
 */
function setPathSelectedState(element, index) {
  // 设置选中状态的红色虚线描边
  element.setAttribute('selected', 'true');
  element.style.stroke = 'rgb(255, 0, 0)';

  // 默认值，更细的描边和更小的虚线间隔
  let strokeWidth = '0.5px';
  let strokeDasharray = '1.5';

  // 获取SVG元素
  let svgElement = element.closest('svg');
  if (svgElement) {
    // 获取viewBox属性
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      // 解析viewBox值 [x, y, width, height]
      const viewBoxValues = viewBox.split(/\s+/).filter(Boolean).map(parseFloat);
      if (viewBoxValues.length >= 4) {
        const [, , width, height] = viewBoxValues;
        // 计算viewBox对角线长度作为参考尺寸
        const diagonal = Math.sqrt(width * width + height * height);

        // 根据对角线长度计算相对描边宽度和虚线间隔
        const referenceDiagonal = 50 * Math.sqrt(2); // 50x50 viewBox的对角线
        // 使用0.5作为基础描边宽度
        strokeWidth = `${0.5 * (diagonal / referenceDiagonal)}px`;
        // 使用1.5作为基础虚线间隔
        strokeDasharray = Math.max(1.5, Math.round(1.5 * (diagonal / referenceDiagonal))).toString();

        // 获取当前图标预览的缩放比例（如果存在）
        let currentScale = 1;
        // 尝试从modalIconPreview元素获取当前缩放比例
        if (typeof window.currentIconScale !== 'undefined') {
          currentScale = window.currentIconScale;
        } else if (typeof initIconPreviewZoom !== 'undefined') {
          // 尝试查找预览容器并获取transform样式
          const previewContainer = document.getElementById('modalIconPreview');
          if (previewContainer && previewContainer.style.transform) {
            const transformMatch = previewContainer.style.transform.match(/scale\(([^)]+)\)/);
            if (transformMatch && transformMatch[1]) {
              currentScale = parseFloat(transformMatch[1]) || 1;
            }
          }
        }

        // 根据当前缩放比例调整描边宽度和虚线间隔
        // 当缩小时，需要增加描边宽度和虚线间隔以保持可见性
        // 当放大时，需要减小描边宽度和虚线间隔以避免过于粗重
        const adjustedStrokeWidth = parseFloat(strokeWidth) / currentScale;
        const adjustedDasharray = parseFloat(strokeDasharray) / currentScale;

        strokeWidth = `${Math.max(0.2, adjustedStrokeWidth)}px`; // 最小不小于0.2px
        strokeDasharray = Math.max(0.5, Math.round(adjustedDasharray * 10) / 10).toString(); // 最小不小于0.5

        console.log(`setPathSelectedState: viewBox=${viewBox}, 当前缩放比例=${currentScale}, 计算的描边宽度=${strokeWidth}, 虚线间隔=${strokeDasharray}`);
      }
    }
  }

  element.style.strokeWidth = strokeWidth;
  element.style.strokeDasharray = strokeDasharray;
  element.classList.add('selected');
  element.classList.add('path-selected');

  console.log(`✅ 路径 ${index} 已设置选中状态（红色虚线描边，使用相对描边宽度）`);
}

/**
 * 清除SVG路径的选中状态
 * @param {boolean} clearAll - 是否清除所有选中状态（包括selectedPaths）
 */
function clearPathSelection(clearAll = true) {
  selectedPathIndex = -1;

  // 如果需要清除所有选中状态
  if (clearAll) {
    selectedPaths.clear();
  }

  let svgElement = modalIconPreview.querySelector('.icon-svg-element');
  if (!svgElement) {
    svgElement = modalIconPreview.querySelector('svg');
    console.log(`clearPathSelection: 使用svg标签查找到元素:`, svgElement);
  }

  if (svgElement) {
    console.log(`clearPathSelection: 找到SVG元素，准备清除所有路径的选中状态`);
    const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
    console.log(`clearPathSelection: 找到 ${elements.length} 个可清除的元素`);

    elements.forEach((el, index) => {
      // 只有在清除所有选中状态或该路径不在选中集合中时才清除样式
      if (clearAll || !selectedPaths.has(index)) {
        const hadSelected = el.hasAttribute('selected');

        // 清除直接设置的CSS样式
        el.style.stroke = '';
        el.style.strokeDasharray = '';
        el.style.strokeWidth = '';
        // 清除selected属性
        el.removeAttribute('selected');
        // 清除类名
        el.classList.remove('selected');

        if (hadSelected) {
          console.log(`✅ 清除了路径 ${index} 的selected属性和样式`);
        }
        el.classList.remove('path-selected');
      }
    });
  }
}

function updateIconColor(color, isReset = false) {
  if (!currentIcon) {
    console.warn('updateIconColor: 没有选中的图标');
    return;
  }

  console.log(`updateIconColor: 开始更新图标 ${currentIcon.id} 的颜色为 ${color}, selectedPathIndex=${selectedPathIndex}, 选中路径数量=${selectedPaths.size}`);
  currentIconColor = color;

  // 更新自定义颜色选择器显示
  const customPicker = document.querySelector('#customColorPicker .color-input');
  if (customPicker) {
    customPicker.value = color;
  }

  // 使用SVGColorManager更新模态框预览
  console.log(`updateIconColor: modalIconPreview状态:`, modalIconPreview);
  console.log(`updateIconColor: modalIconPreview的HTML:`, modalIconPreview ? modalIconPreview.innerHTML : 'null');

  let svgElement = modalIconPreview.querySelector('.icon-svg-element');
  console.log(`updateIconColor: 查找.icon-svg-element结果:`, svgElement);

  // 如果找不到，尝试其他选择器
  if (!svgElement) {
    svgElement = modalIconPreview.querySelector('svg');
    console.log(`updateIconColor: 尝试svg标签查找:`, svgElement);

    if (!svgElement) {
      const allSvgElements = modalIconPreview.querySelectorAll('*');
      console.log(`updateIconColor: modalIconPreview中所有元素:`, allSvgElements);
    }
  }

  if (svgElement) {
    console.log(`updateIconColor: 最终使用的SVG元素:`, svgElement);
    console.log(`updateIconColor: 找到SVG元素，selectedPathIndex=${selectedPathIndex}`);

    // 强制使用原生DOM操作确保颜色更新
    const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
    console.log(`updateIconColor: 找到 ${elements.length} 个可着色元素`);

    // 检查是否有多个路径被选中（修复多选减选上色问题）
    if (selectedPaths && selectedPaths.size > 0 && selectedPaths.size < elements.length) {
      console.log(`updateIconColor: 检测到有 ${selectedPaths.size} 个路径被选中，更新所有选中路径的颜色`);
      // 遍历所有选中的路径
      selectedPaths.forEach(index => {
        if (elements[index]) {
          const element = elements[index];

          // 获取当前路径应该使用的颜色
          // 如果是恢复原始颜色（isReset为true）或没有传入新颜色，则使用pathColors中保存的颜色
          let finalColor;
          if (isReset || !color) {
            finalColor = pathColors.get(currentIcon.id)?.get(index) || currentIconColor;
          } else {
            // 否则使用传入的新颜色
            finalColor = color; // 允许设置真正的白色
          }

          console.log(`updateIconColor: 修改选中路径 ${index}，原颜色: ${element.getAttribute('fill')}，新颜色: ${finalColor}`);

          // 无条件设置fill属性，确保颜色总是能生效
          element.setAttribute('fill', finalColor);
          console.log(`updateIconColor: 已设置路径 ${index} 的fill属性为 ${finalColor}`);

          // 对于stroke属性，仍然只在元素原本有stroke属性时才设置，避免不必要的描边
          const originalStroke = element.getAttribute('stroke');
          if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
            element.setAttribute('stroke', finalColor);
            console.log(`updateIconColor: 同时更新了stroke属性`);
          } else {
            // 确保移除默认的黑色描边，避免影响显示效果
            element.setAttribute('stroke', 'none');
            console.log(`updateIconColor: 已设置stroke为none，确保只显示填充色`);
          }

          // 确保选中状态保持（使用统一函数设置选中状态）
          setPathSelectedState(element, index);
        }
      });

      // 强制触发整个SVG重新渲染
      svgElement.style.display = 'none';
      svgElement.offsetHeight; // 触发重排
      svgElement.style.display = '';
    } else if (selectedPathIndex >= 0 && elements[selectedPathIndex]) {
      // 修改单个路径（保持原有逻辑，用于单选情况）
      const element = elements[selectedPathIndex];

      // 获取当前路径应该使用的颜色
      // 如果是恢复原始颜色（isReset为true）或没有传入新颜色，则使用pathColors中保存的颜色
      let finalColor;
      if (isReset || !color) {
        finalColor = pathColors.get(currentIcon.id)?.get(selectedPathIndex) || currentIconColor;
      } else {
        // 否则使用传入的新颜色
        finalColor = color; // 允许设置真正的白色
      }

      console.log(`updateIconColor: 修改单个路径 ${selectedPathIndex}，原颜色: ${element.getAttribute('fill')}，新颜色: ${finalColor}`);

      // 无条件设置fill属性，确保颜色总是能生效
      element.setAttribute('fill', finalColor);
      console.log(`updateIconColor: 已设置路径 ${selectedPathIndex} 的fill属性为 ${finalColor}`);

      // 对于stroke属性，仍然只在元素原本有stroke属性时才设置，避免不必要的描边
      const originalStroke = element.getAttribute('stroke');
      if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
        element.setAttribute('stroke', finalColor);
        console.log(`updateIconColor: 同时更新了stroke属性`);
      } else {
        // 确保移除默认的黑色描边，避免影响显示效果
        element.setAttribute('stroke', 'none');
        console.log(`updateIconColor: 已设置stroke为none，确保只显示填充色`);
      }

      // 强制触发重新渲染
      element.style.display = 'none';
      element.offsetHeight; // 触发重排
      element.style.display = '';

      // 确保选中状态保持（使用统一函数设置选中状态）
      setPathSelectedState(element, selectedPathIndex);

      console.log(`updateIconColor: 路径 ${selectedPathIndex} 颜色更新完成，当前fill: ${element.getAttribute('fill')}`);
    } else {
      // 修改所有元素
      console.log(`updateIconColor: 修改所有元素颜色为 ${color}`);
      elements.forEach((el, index) => {
        const finalColor = color; // 允许设置真正的白色
        const originalFill = el.getAttribute('fill');

        // 检查元素原本是否有填充颜色
        if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
          el.setAttribute('fill', finalColor);
        }

        // 只有当元素原本有stroke属性时才设置stroke，避免不必要的描边
        const originalStroke = el.getAttribute('stroke');
        if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
          el.setAttribute('stroke', finalColor);
        }

        console.log(`updateIconColor: 元素 ${index} 颜色从 ${originalFill} 更新为 ${finalColor}`);
      });

      // 强制触发整个SVG重新渲染
      svgElement.style.display = 'none';
      svgElement.offsetHeight; // 触发重排
      svgElement.style.display = '';
    }

    // 尝试使用SVGColorManager作为补充
    if (window.svgColorManager) {
      console.log(`updateIconColor: 尝试使用SVGColorManager进行补充更新`);
      const success = window.svgColorManager.changeColor(
        svgElement,
        currentIcon.id,
        color,
        selectedPathIndex
      );

      if (success) {
        console.log(`updateIconColor: SVGColorManager更新成功`);
      } else {
        console.warn(`updateIconColor: SVGColorManager更新失败，但DOM操作已完成`);
      }
    }
  } else {
    console.error('updateIconColor: 未找到SVG元素');
    showToast('未找到图标元素，请重试', false);
    return;
  }

  // 检查同步开关状态，决定是否同步到首页
  if (syncWithHomePage) {
    // 同时更新首页对应图标的颜色，使用更健壮的查找逻辑
    let homeIconContainer = document.querySelector(`.icon-display-container[data-icon-id="${currentIcon.id}"]`);

    // 如果找不到原始ID的图标，尝试使用处理后的ID
    if (!homeIconContainer) {
      const processedIconId = currentIcon.id.replace(/^icon-/, '').replace(/-x$/, '').replace(/-m$/, '');
      console.log(`updateIconColor: 原始ID未找到，尝试处理后ID: ${processedIconId}`);
      homeIconContainer = document.querySelector(`.icon-display-container[data-icon-id="${processedIconId}"]`);
    }

    if (homeIconContainer) {
      console.log(`updateIconColor: 找到首页图标容器`);

      // 使用多种策略查找SVG元素
      let homeIconSvg = homeIconContainer.querySelector('.icon-svg-element');

      if (!homeIconSvg) {
        // 尝试直接查找svg标签
        homeIconSvg = homeIconContainer.querySelector('svg');
        console.log(`updateIconColor: 使用svg标签查找到首页图标SVG元素`);
      }

      if (!homeIconSvg) {
        // 尝试通过wrapper查找
        const svgWrapper = homeIconContainer.querySelector('.icon-svg-wrapper');
        if (svgWrapper) {
          homeIconSvg = svgWrapper.querySelector('svg');
          console.log(`updateIconColor: 通过wrapper查找到首页图标SVG元素`);
        }
      }

      if (homeIconSvg) {
        if (window.svgColorManager) {
          const success = window.svgColorManager.changeColor(
            homeIconSvg,
            currentIcon.id,
            color,
            selectedPathIndex
          );
          if (success) {
            console.log(`updateIconColor: 已同步更新首页图标 ${currentIcon.id} 的颜色`);
          } else {
            console.warn(`updateIconColor: 首页图标 ${currentIcon.id} 颜色同步失败`);
          }
        } else {
          // 备用方案：使用原生DOM操作
          console.warn('updateIconColor: SVGColorManager不可用，使用备用方案更新首页图标');
          const homeElements = homeIconSvg.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');

          if (selectedPathIndex >= 0 && homeElements[selectedPathIndex]) {
            // 修改单个路径
            const element = homeElements[selectedPathIndex];
            const finalColor = color; // 允许设置真正的白色
            element.setAttribute('fill', finalColor);
            // 只有当元素原本有stroke属性时才设置stroke，避免不必要的描边
            if (element.hasAttribute('stroke') && element.getAttribute('stroke') !== 'none') {
              element.setAttribute('stroke', finalColor);
            }
          } else {
            // 修改所有元素
            homeElements.forEach(el => {
              const finalColor = color; // 允许设置真正的白色
              el.setAttribute('fill', finalColor);
              // 只有当元素原本有stroke属性时才设置stroke，避免不必要的描边
              if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
                el.setAttribute('stroke', finalColor);
              }
            });
          }
          console.log(`updateIconColor: 已使用备用方案同步更新首页图标 ${currentIcon.id}`);
        }
      } else {
        // 如果找不到SVG元素，记录首页图标容器的结构以帮助调试
        if (homeIconContainer) {
          console.warn(`updateIconColor: 未找到首页图标 ${currentIcon.id} 的SVG元素，容器结构:`, homeIconContainer.innerHTML);
          // 尝试获取所有可能的元素
          const allElements = Array.from(homeIconContainer.querySelectorAll('*')).map(el => el.tagName);
          console.warn(`updateIconColor: 首页图标容器中的元素标签:`, allElements);
        } else {
          console.warn(`updateIconColor: 未找到首页图标 ${currentIcon.id} 的SVG元素`);
        }
      }
    } else {
      console.warn(`updateIconColor: 未找到首页图标容器 ${currentIcon.id}，使用了ID: ${currentIcon.id}`);
    }
  } else {
    console.log(`updateIconColor: 同步开关已关闭，跳过首页图标同步`);
  }

  // 更新全局颜色状态（保持兼容性）
  if (selectedPathIndex >= 0) {
    if (!pathColors.has(currentIcon.id)) {
      pathColors.set(currentIcon.id, new Map());
    }
    pathColors.get(currentIcon.id).set(selectedPathIndex, color);
  } else {
    iconColors.set(currentIcon.id, color);
    if (isReset) {
      pathColors.delete(currentIcon.id);
    }
  }

  // 标记为详情页面修改（高优先级）
  detailModifiedIcons.add(currentIcon.id);
  console.log(`updateIconColor: 图标 ${currentIcon.id} 已标记为详情页面修改（高优先级）`);

  updateSVGCodeDisplay();
  console.log(`updateIconColor: 已更新图标 ${currentIcon.id} 的颜色为 ${color}`);

  // 更新URL中的color参数
  if (currentIcon) {
    const colorString = getCurrentIconColorString();
    updateUrlWithIconInfo(currentIcon.id, colorString);
    console.log(`updateIconColor: 已更新URL中的color参数为: ${colorString}`);
  }
}

// updateIconItemColor函数已被SVGColorManager替代，不再需要

function resetIconColor() {
  if (!currentIcon) {
    console.warn('resetIconColor: 没有选中的图标');
    return;
  }

  console.log(`resetIconColor: 开始重置图标 ${currentIcon.id} 的颜色`);

  // 尝试多种方式查找SVG元素
  let svgElement = modalIconPreview.querySelector('.icon-svg-element');
  if (!svgElement) {
    svgElement = modalIconPreview.querySelector('svg');
  }

  if (svgElement) {
    // 直接恢复原始SVG内容
    console.log(`resetIconColor: 找到详情页面SVG元素，开始重置`);
    const iconData = allIcons.find(icon => icon.id === currentIcon.id);
    if (iconData && iconData.content) {
      // 保存当前SVG的属性
      const width = svgElement.getAttribute('width');
      const height = svgElement.getAttribute('height');
      const viewBox = svgElement.getAttribute('viewBox');

      // 检查iconData.content是否已经包含完整的SVG标签，如果是，则只提取内部内容
      let content = iconData.content.trim();
      if (content.startsWith('<svg') && content.endsWith('</svg>')) {
        // 创建临时元素来解析SVG内容
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const tempSvg = tempDiv.querySelector('svg');
        if (tempSvg) {
          // 只使用SVG的内部内容，避免嵌套
          content = tempSvg.innerHTML;
        }
      }

      // 重置内容
      svgElement.innerHTML = content;

      // 恢复重要属性
      if (width) svgElement.setAttribute('width', width);
      if (height) svgElement.setAttribute('height', height);
      if (viewBox) svgElement.setAttribute('viewBox', viewBox);

      console.log(`resetIconColor: 详情页面SVG重置成功`);
    } else {
      console.warn(`resetIconColor: 未找到图标 ${currentIcon.id} 的原始数据`);
      showToast('重置失败：未找到原始图标数据', false);
      return;
    }

    // 重新绑定路径点击事件
    const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
    elements.forEach((el, index) => {
      el.style.cursor = 'pointer';
      el.style.pointerEvents = 'auto';
      el.style.outline = 'none';

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePathClick(e, index);
      });
    });
  } else {
    console.warn('resetIconColor: 未找到SVG元素');
    showToast('重置失败：未找到SVG元素', false);
    return;
  }

  // 重置首页图标显示
  const homeIconContainer = document.querySelector(`.icon-display-container[data-icon-id="${currentIcon.id}"]`);
  if (homeIconContainer) {
    let homeIconSvg = homeIconContainer.querySelector('.icon-svg-element');
    if (!homeIconSvg) {
      homeIconSvg = homeIconContainer.querySelector('svg');
    }

    if (homeIconSvg) {
      // 直接恢复原始SVG内容
      const iconData = allIcons.find(icon => icon.id === currentIcon.id);
      if (iconData && iconData.content) {
        // 保存当前SVG的属性
        const width = homeIconSvg.getAttribute('width');
        const height = homeIconSvg.getAttribute('height');
        const viewBox = homeIconSvg.getAttribute('viewBox');

        // 检查iconData.content是否已经包含完整的SVG标签，如果是，则只提取内部内容
        let content = iconData.content.trim();
        if (content.startsWith('<svg') && content.endsWith('</svg>')) {
          // 创建临时元素来解析SVG内容
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = content;
          const tempSvg = tempDiv.querySelector('svg');
          if (tempSvg) {
            // 只使用SVG的内部内容，避免嵌套
            content = tempSvg.innerHTML;
          }
        }

        // 重置内容
        homeIconSvg.innerHTML = content;

        // 恢复重要属性
        if (width) homeIconSvg.setAttribute('width', width);
        if (height) homeIconSvg.setAttribute('height', height);
        if (viewBox) homeIconSvg.setAttribute('viewBox', viewBox);

        console.log(`resetIconColor: 已重置首页图标 ${currentIcon.id} 的颜色`);
      } else {
        console.warn(`resetIconColor: 未找到首页图标 ${currentIcon.id} 的原始数据`);
      }
    } else {
      console.warn(`resetIconColor: 未找到首页图标 ${currentIcon.id} 的SVG元素`);
    }
  } else {
    console.warn(`resetIconColor: 未找到首页图标容器 ${currentIcon.id}`);
  }

  // 清除全局颜色状态
  iconColors.delete(currentIcon.id);
  pathColors.delete(currentIcon.id);
  selectedPathIndex = -1;

  // 从高优先级列表中移除（重置后不再是详情页面修改）
  detailModifiedIcons.delete(currentIcon.id);
  console.log(`resetIconColor: 图标 ${currentIcon.id} 已从高优先级列表中移除`);

  // 重置为默认颜色（不是固定的蓝色，而是原始状态）
  currentIconColor = getIconOriginalColor(currentIcon); // 重置为图标原始颜色

  // 更新自定义颜色选择器为默认值
  const customPicker = document.querySelector('#customColorPicker .color-input');
  if (customPicker) {
    customPicker.value = getIconOriginalColor(currentIcon);
  }

  updateSVGCodeDisplay();
  showToast('已重置为原始颜色');
  console.log(`resetIconColor: 已重置图标 ${currentIcon.id} 的颜色`);

  // 更新URL中的color参数，重置后移除颜色信息
  if (currentIcon) {
    updateUrlWithIconInfo(currentIcon.id, '');
    console.log(`resetIconColor: 已更新URL，移除color参数`);
  }
}

function navigateToPrevIcon() {
  if (!currentIcon || allIcons.length === 0) return;

  // 获取当前图标在allIcons数组中的索引
  const currentIndex = allIcons.findIndex(icon => icon.id === currentIcon.id);

  if (currentIndex > 0) {
    // 如果不是第一个图标，显示上一个图标
    const prevIcon = allIcons[currentIndex - 1];
    openIconDetail(prevIcon);
  } else {
    // 如果是第一个图标，显示最后一个图标（循环）
    const lastIcon = allIcons[allIcons.length - 1];
    openIconDetail(lastIcon);
  }
}

function navigateToNextIcon() {
  if (!currentIcon || allIcons.length === 0) return;

  // 获取当前图标在allIcons数组中的索引
  const currentIndex = allIcons.findIndex(icon => icon.id === currentIcon.id);

  if (currentIndex < allIcons.length - 1) {
    // 如果不是最后一个图标，显示下一个图标
    const nextIcon = allIcons[currentIndex + 1];
    openIconDetail(nextIcon);
  } else {
    // 如果是最后一个图标，显示第一个图标（循环）
    const firstIcon = allIcons[0];
    openIconDetail(firstIcon);
  }
}

function closeIconModal(resetTransform = true) {
  if (iconModal) {
    // 保存当前图标调整状态到本地存储
    if (currentIcon && currentIcon.id) {
      const iconState = {
        scale: window.currentIconScale || 1,
        x: window.currentIconX || 0,
        y: window.currentIconY || 0,
        rotation: window.currentIconRotation || 0,
        mirrorX: window.currentIconMirrorX || 1,
        mirrorY: window.currentIconMirrorY || 1,
        timestamp: Date.now()
      };
      localStorage.setItem(`iconTransform_${currentIcon.id}`, JSON.stringify(iconState));
      console.log('图标调整状态已保存到本地存储:', iconState);
    }
    
    // 移除URL中的id参数
    removeIconIdFromUrl();
    // 添加动画效果
    const modalContent = iconModal.querySelector('div:not(.modal-nav-buttons)');
    if (modalContent) {
      modalContent.classList.remove('scale-100');
      modalContent.classList.add('scale-95');
    }

    // 延迟隐藏模态框，等待动画完成
    setTimeout(() => {
      iconModal.classList.add('opacity-0', 'pointer-events-none');
    }, 200);

    // 重置图标预览区域的变换状态
    if (modalIconPreview && resetTransform) {
      // 重置所有变换状态
      modalIconPreview.style.transform = 'translate(0px, 0px) scale(1) scaleX(1) scaleY(1) rotate(0deg)';
      modalIconPreview.style.transition = '';
      modalIconPreview.style.cursor = 'default';
      console.log('图标预览变换状态已重置');

      // 重置全局变量
      window.currentIconScale = 1;
      window.currentIconX = 0;
      window.currentIconY = 0;
      window.currentIconRotation = 0;
      window.currentIconMirrorX = 1;
      window.currentIconMirrorY = 1;

      // 清空自定义旋转输入框
      const customRotateInput = document.getElementById('customRotateInput');
      if (customRotateInput) {
        customRotateInput.value = '';
      }
    }

    // 清除当前图标的高优先级标记，使其在首页可以被随机上色
    if (currentIcon && currentIcon.id) {
      detailModifiedIcons.delete(currentIcon.id);
      console.log(`closeIconModal: 已清除图标 ${currentIcon.id} 的高优先级标记`);
    }

    // 清除路径选中状态
    selectedPathIndex = -1;
    clearPathSelection();
  }
}

// 随机颜色和重置功能
function applyRandomColors() {
  try {
    // 获取当前页面显示的图标
    const displayedIcons = document.querySelectorAll('.icon-display-container');
    let updatedCount = 0;

    if (displayedIcons.length === 0) {
      showToast('页面中没有找到图标，请先加载图标', false);
      return;
    }

    // 清除路径颜色，使用整体颜色
    pathColors.clear();

    displayedIcons.forEach((container, index) => {
      try {
        const iconId = container.dataset.iconId;

        // 检查优先级：跳过已经在详情页面修改过的图标
        if (detailModifiedIcons.has(iconId)) {
          console.log(`applyRandomColors: 跳过图标 ${iconId}，因为它已在详情页面修改过（高优先级）`);
          return;
        }

        // 尝试多种方式查找SVG元素
        let svgElement = container.querySelector('.icon-svg-element');
        if (!svgElement) {
          // 备用查找方式
          svgElement = container.querySelector('svg');
        }

        if (iconId && svgElement) {
          const randomColor = getRandomColor();
          let success = false;

          // 使用原生方法实现随机颜色
          const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');

          if (elements.length > 0) {
            elements.forEach(el => {
              // 使用智能颜色处理逻辑
              const shouldProcessFill = shouldProcessElementColor(el, 'fill');
              const shouldProcessStroke = shouldProcessElementColor(el, 'stroke');

              if (shouldProcessFill) {
                const originalFill = el.getAttribute('fill');
                if (!originalFill || originalFill === 'none' || originalFill === 'transparent') {
                  const parentG = el.closest('g[fill]');
                  if (parentG) {
                    parentG.setAttribute('fill', randomColor);
                  } else {
                    el.setAttribute('fill', randomColor);
                  }
                } else {
                  el.setAttribute('fill', randomColor);
                }
              }

              if (shouldProcessStroke) {
                const originalStroke = el.getAttribute('stroke');
                if (!originalStroke || originalStroke === 'none' || originalStroke === 'transparent') {
                  const parentG = el.closest('g[stroke]');
                  if (parentG) {
                    parentG.setAttribute('stroke', randomColor);
                  } else {
                    el.setAttribute('stroke', randomColor);
                  }
                } else {
                  el.setAttribute('stroke', randomColor);
                }
              }
            });
            success = true;
          }

          if (success) {
            // 更新全局状态
            iconColors.set(iconId, randomColor);
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(`处理图标 ${index} 时出错:`, error);
      }
    });

    if (updatedCount === 0) {
      showToast('未能更新任何图标颜色，请检查图标是否正确加载', false);
    } else {
      showToast(`已为 ${updatedCount} 个图标应用随机颜色`);
      console.log(`applyRandomColors: 成功更新 ${updatedCount} 个图标`);
    }
  } catch (error) {
    console.error('应用随机颜色时出错:', error);
    showToast('应用随机颜色时发生错误', false);
  }
}

function resetAllColors() {
  try {
    // 重置页面中所有图标的颜色为原始颜色
    const displayedIcons = document.querySelectorAll('.icon-display-container');
    let resetCount = 0;

    if (displayedIcons.length === 0) {
      showToast('页面中没有找到图标，请先加载图标', false);
      return;
    }

    displayedIcons.forEach((container, index) => {
      try {
        const iconId = container.dataset.iconId;

        // 尝试多种方式查找SVG元素
        let svgElement = container.querySelector('.icon-svg-element');
        if (!svgElement) {
          // 备用查找方式
          svgElement = container.querySelector('svg');
        }

        if (iconId && svgElement) {
          // 直接恢复原始SVG内容
          const iconData = allIcons.find(icon => icon.id === iconId);
          if (iconData && iconData.content) {
            // 保存当前SVG的属性
            const width = svgElement.getAttribute('width');
            const height = svgElement.getAttribute('height');
            const viewBox = svgElement.getAttribute('viewBox');

            // 重置内容
            svgElement.innerHTML = iconData.content;

            // 恢复重要属性
            if (width) svgElement.setAttribute('width', width);
            if (height) svgElement.setAttribute('height', height);
            if (viewBox) svgElement.setAttribute('viewBox', viewBox);

            resetCount++;
          }
        }
      } catch (error) {
        console.error(`重置图标 ${index} 时出错:`, error);
      }
    });

    // 清除全局颜色状态
    iconColors.clear();
    pathColors.clear();

    if (resetCount === 0) {
      showToast('未能重置任何图标颜色，请检查图标是否正确加载', false);
    } else {
      showToast(`已重置 ${resetCount} 个图标颜色为原始颜色`);
      console.log(`resetAllColors: 成功重置 ${resetCount} 个图标`);
    }
  } catch (error) {
    console.error('重置颜色时出错:', error);
    showToast('重置颜色时发生错误', false);
  }
}

// 更新图标预览尺寸
function updateIconPreviewSize(size) {
  if (!modalIconPreview) return;

  const svgElement = modalIconPreview.querySelector('.icon-svg-element');
  if (svgElement) {
    // 更新SVG元素的尺寸
    svgElement.setAttribute('width', size);
    svgElement.setAttribute('height', size);

    // 更新容器样式以适应新尺寸
    const svgWrapper = modalIconPreview.querySelector('.icon-svg-wrapper');
    if (svgWrapper) {
      // 检查是否处于全屏模式
      if (window.isFullscreenMode || isFullscreenMode) {
        // 全屏模式下使用auto尺寸和flex布局确保图标居中且不被压缩
        svgWrapper.style.width = 'auto';
        svgWrapper.style.height = 'auto';
        svgWrapper.style.display = 'flex';
        svgWrapper.style.alignItems = 'center';
        svgWrapper.style.justifyContent = 'center';
      } else {
        // 非全屏模式下使用固定尺寸
        svgWrapper.style.width = size + 'px';
        svgWrapper.style.height = size + 'px';
      }
    }

    // 确保预览容器居中显示
    modalIconPreview.style.display = 'flex';
    modalIconPreview.style.alignItems = 'center';
    modalIconPreview.style.justifyContent = 'center';

    // 在全屏模式下，确保SVG元素使用固定像素尺寸且不被压缩
    if (window.isFullscreenMode || isFullscreenMode) {
      svgElement.style.width = size + 'px';
      svgElement.style.height = size + 'px';
      svgElement.style.flexShrink = '0'; // 防止图标被压缩
    }
  }
}

// 复制PNG到剪贴板
function copyImageToClipboard(size = null) {
  if (!currentIcon) {
    return Promise.resolve(false);
  }

  // 如果没有指定尺寸，使用选中的尺寸或默认尺寸
  if (!size) {
    const selectedSizes = getSelectedSizes();
    size = selectedSizes.length > 0 ? selectedSizes[0] : 512;
  }

  return new Promise((resolve) => {
    try {
      // 复制下载PNG的逻辑：优先从DOM获取当前显示的SVG元素（包含最新的颜色修改）
      const svgElement = modalIconPreview.querySelector('svg');
      let svgCode;

      if (svgElement && window.ColorManager) {
        // 使用ColorManager获取带颜色的SVG代码
        svgCode = window.ColorManager.getSVGWithColors(svgElement);
        console.log('copyImageToClipboard: 使用ColorManager获取最新SVG代码');
      } else {
        // 降级到原有逻辑
        svgCode = currentSvgCode || currentIcon.svgCode;
        console.log('copyImageToClipboard: 使用降级SVG代码');
      }

      // 确保获取到了SVG代码
      if (!svgCode) {
        console.error('无效的SVG代码: 空');
        resolve(false);
        return;
      }

      // 确保SVG有正确的viewBox和尺寸属性
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = svgCode;
      const tempSvgElement = tempDiv.querySelector('svg');

      if (tempSvgElement) {
        // 设置viewBox
        const viewBox = currentIcon.viewBox || '0 0 1024 1024';
        if (!tempSvgElement.getAttribute('viewBox')) {
          tempSvgElement.setAttribute('viewBox', viewBox);
        }

        // 移除固定尺寸设置，让viewBox控制比例
        if (tempSvgElement.hasAttribute('width')) {
          tempSvgElement.removeAttribute('width');
        }
        if (tempSvgElement.hasAttribute('height')) {
          tempSvgElement.removeAttribute('height');
        }

        // 确保preserveAspectRatio
        if (!tempSvgElement.getAttribute('preserveAspectRatio')) {
          tempSvgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }

        // 重要：不要为根SVG设置fill属性，避免覆盖内部元素的颜色
        // 移除可能存在的fill属性，让内部元素的颜色正确显示
        if (tempSvgElement.hasAttribute('fill')) {
          tempSvgElement.removeAttribute('fill');
        }

        svgCode = tempSvgElement.outerHTML;
      }

      // 解析viewBox获取原始宽高比（与下载PNG保持一致）
      let viewBoxMatch = svgCode.match(/viewBox=["']([^"']+)["']/);
      let originalWidth = 1024, originalHeight = 1024;

      if (viewBoxMatch) {
        const viewBoxValues = viewBoxMatch[1].split(/\s+/);
        if (viewBoxValues.length >= 4) {
          originalWidth = parseFloat(viewBoxValues[2]) - parseFloat(viewBoxValues[0]);
          originalHeight = parseFloat(viewBoxValues[3]) - parseFloat(viewBoxValues[1]);
        }
      }

      // 计算保持宽高比的实际尺寸
      const aspectRatio = originalWidth / originalHeight;
      let canvasWidth, canvasHeight;

      if (aspectRatio > 1) {
        // 宽度较大，以宽度为准
        canvasWidth = size;
        canvasHeight = Math.round(size / aspectRatio);
      } else {
        // 高度较大或正方形，以高度为准
        canvasHeight = size;
        canvasWidth = Math.round(size * aspectRatio);
      }

      console.log('copyImageToClipboard: 已处理SVG并应用与预览一致的颜色设置');

      // 创建临时canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = size;
      canvas.height = size;

      // 清除画布，确保透明背景（与下载PNG保持一致）
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 创建SVG数据URL - 使用更安全的编码方式
      const svgBlob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
      const svgDataUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      // 设置crossOrigin属性，避免潜在的跨域问题
      img.crossOrigin = 'anonymous';

      img.onload = function () {
        try {
          // 添加内边距以防止图标被裁切
          const padding = size * 0.05; // 5%的内边距
          const finalDrawWidth = canvasWidth - padding * 2;
          const finalDrawHeight = canvasHeight - padding * 2;

          // 计算居中绘制的位置
          const xPos = Math.floor((canvas.width - finalDrawWidth) / 2);
          const yPos = Math.floor((canvas.height - finalDrawHeight) / 2);

          // 绘制图像 - 保持宽高比并居中
          ctx.drawImage(img, xPos, yPos, finalDrawWidth, finalDrawHeight);

          // 清理临时URL
          URL.revokeObjectURL(svgDataUrl);

          // 转换为blob并复制到剪贴板
          canvas.toBlob(async (blob) => {
            if (blob) {
              try {
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                resolve(true);
              } catch (error) {
                console.error('复制到剪贴板失败:', error);
                // 添加备选方案：尝试使用execCommand方法
                try {
                  const imgDataUrl = canvas.toDataURL('image/png');
                  const tempImg = new Image();
                  tempImg.onload = function () {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = size;
                    tempCanvas.height = size;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

                    // 添加内边距以防止图标被裁切
                    const padding = size * 0.05; // 5%的内边距
                    const finalDrawWidth = canvasWidth - padding * 2;
                    const finalDrawHeight = canvasHeight - padding * 2;

                    // 计算居中绘制的位置
                    const xPos = Math.floor((tempCanvas.width - finalDrawWidth) / 2);
                    const yPos = Math.floor((tempCanvas.height - finalDrawHeight) / 2);

                    // 确保以正确的宽高比绘制
                    tempCtx.drawImage(tempImg, xPos, yPos, finalDrawWidth, finalDrawHeight);

                    tempCanvas.toBlob((fallbackBlob) => {
                      if (fallbackBlob) {
                        // 这里只是模拟成功，因为execCommand在现代浏览器可能被废弃
                        console.log('尝试备选复制方案');
                        resolve(true);
                      } else {
                        resolve(false);
                      }
                    });
                  };
                  tempImg.src = imgDataUrl;
                } catch (fallbackError) {
                  console.error('备选复制方案失败:', fallbackError);
                  resolve(false);
                }
              }
            } else {
              console.error('Canvas转换为blob失败');
              // 创建简单的后备图像
              try {
                // 使用图标当前颜色或默认蓝色
                const iconColor = iconColors.get(currentIcon.id) || getIconOriginalColor(currentIcon);
                ctx.fillStyle = iconColor; // 允许设置真正的白色
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                canvas.toBlob((fallbackBlob) => {
                  if (fallbackBlob) {
                    try {
                      const item = new ClipboardItem({ 'image/png': fallbackBlob });
                      navigator.clipboard.write([item]);
                      resolve(true);
                    } catch (fallbackError) {
                      console.error('后备图像复制失败:', fallbackError);
                      resolve(false);
                    }
                  } else {
                    resolve(false);
                  }
                });
              } catch (fallbackError) {
                console.error('创建后备图像失败:', fallbackError);
                resolve(false);
              }
            }
          }, 'image/png');
        } catch (drawError) {
          console.error('Canvas绘制失败:', drawError);
          URL.revokeObjectURL(svgDataUrl);
          resolve(false);
        }
      };

      img.onerror = (error) => {
        console.error('SVG图像加载失败:', error);
        URL.revokeObjectURL(svgDataUrl);

        // 添加错误时的后备方案：创建一个带有颜色的简单矩形
        try {
          // 使用图标当前颜色或默认蓝色
          const iconColor = iconColors.get(currentIcon.id) || getIconOriginalColor(currentIcon);
          ctx.fillStyle = iconColor; // 允许设置真正的白色
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            if (blob) {
              try {
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]);
                resolve(true);
              } catch (clipError) {
                console.error('后备图像复制失败:', clipError);
                resolve(false);
              }
            } else {
              resolve(false);
            }
          }, 'image/png');
        } catch (fallbackError) {
          console.error('SVG加载失败，后备方案也失败:', fallbackError);
          resolve(false);
        }
      };

      img.src = svgDataUrl;
    } catch (error) {
      console.error('复制PNG失败:', error);
      resolve(false);
    }
  });
}

// 下载设置模态框
function openDownloadSettingsModal(type) {
  const downloadSettingsModal = document.getElementById('downloadSettingsModal');
  if (downloadSettingsModal) {
    // 移除隐藏类，显示模态框
    downloadSettingsModal.classList.remove('opacity-0', 'pointer-events-none');

    // 设置下载类型
    window.downloadType = type;

    // 更新模态框标题
    const modalTitle = downloadSettingsModal.querySelector('h3');
    if (modalTitle) {
      if (type === 'selected') {
        modalTitle.textContent = `下载选中的 ${selectedIcons.size} 个图标`;
      } else {
        modalTitle.textContent = `下载全部 ${allIcons.length} 个图标`;
      }
    }

    // 添加动画效果
    const modalContent = downloadSettingsModal.querySelector('div');
    if (modalContent) {
      modalContent.classList.remove('scale-95');
      modalContent.classList.add('scale-100');
    }
  }
}

function closeDownloadSettingsModal() {
  const downloadSettingsModal = document.getElementById('downloadSettingsModal');
  if (downloadSettingsModal) {
    // 添加动画效果
    const modalContent = downloadSettingsModal.querySelector('div');
    if (modalContent) {
      modalContent.classList.remove('scale-100');
      modalContent.classList.add('scale-95');
    }

    // 隐藏模态框
    downloadSettingsModal.classList.add('opacity-0', 'pointer-events-none');
  }
}

// 处理确认下载
function handleConfirmDownload() {
  try {
    // 获取下载设置
    const settings = getDownloadSettings();

    // 验证设置
    if (!settings.exportSvg && !settings.exportPng) {
      showToast('请至少选择一种导出格式', false);
      return;
    }

    if (settings.exportPng && settings.sizes.length === 0) {
      showToast('导出PNG格式时请至少选择一种尺寸', false);
      return;
    }

    // 保存用户设置
    saveDownloadSettings();

    // 获取要下载的图标
    const iconsToDownload = window.downloadType === 'selected'
      ? Array.from(selectedIcons).map(id => allIcons.find(icon => icon.id === id)).filter(Boolean)
      : allIcons;

    if (iconsToDownload.length === 0) {
      showToast('没有可下载的图标', false);
      return;
    }

    // 关闭模态框
    closeDownloadSettingsModal();

    // 开始下载
    startBatchDownload(iconsToDownload, settings);

  } catch (error) {
    console.error('下载失败:', error);
    showToast('下载失败，请重试', false);
  }
}

// 获取下载设置
function getDownloadSettings() {
  const exportSvg = document.getElementById('exportSvg')?.checked || false;
  const exportPng = document.getElementById('exportPng')?.checked || false;

  const sizeCheckboxes = document.querySelectorAll('input[name="exportSizes"]:checked');
  const sizes = Array.from(sizeCheckboxes).map(cb => parseInt(cb.value));

  const packagingOption = document.querySelector('input[name="packagingOption"]:checked')?.value || 'by-format-size';
  const useIndividualColors = document.getElementById('useIndividualColors')?.checked || false;
  const batchColor = document.getElementById('batchColorPicker')?.value || (currentIcon ? getIconOriginalColor(currentIcon) : '#409eff');

  return {
    exportSvg,
    exportPng,
    sizes,
    packagingOption,
    useIndividualColors,
    batchColor
  };
}

// 保存下载设置到本地存储
function saveDownloadSettings() {
  try {
    const settings = getDownloadSettings();
    localStorage.setItem('svgku_download_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('保存下载设置失败:', error);
  }
}

// 从本地存储加载下载设置
function loadDownloadSettings() {
  try {
    const savedSettings = localStorage.getItem('svgku_download_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);

      // 应用保存的设置
      const exportSvg = document.getElementById('exportSvg');
      const exportPng = document.getElementById('exportPng');
      const useIndividualColors = document.getElementById('useIndividualColors');
      const batchColorPicker = document.getElementById('batchColorPicker');

      if (exportSvg) exportSvg.checked = settings.exportSvg;
      if (exportPng) exportPng.checked = settings.exportPng;
      if (useIndividualColors) useIndividualColors.checked = settings.useIndividualColors;
      if (batchColorPicker) batchColorPicker.value = settings.batchColor;

      // 设置尺寸选择
      const sizeCheckboxes = document.querySelectorAll('input[name="exportSizes"]');
      sizeCheckboxes.forEach(cb => {
        cb.checked = settings.sizes.includes(parseInt(cb.value));
      });

      // 设置打包选项
      const packagingRadios = document.querySelectorAll('input[name="packagingOption"]');
      packagingRadios.forEach(radio => {
        radio.checked = radio.value === settings.packagingOption;
      });
    }
  } catch (error) {
    console.error('加载下载设置失败:', error);
  }
}

// 开始批量下载
function startBatchDownload(icons, settings) {
  showToast('正在准备下载...', true);

  // 使用DownloadManager进行批量下载
  if (window.DownloadManager) {
    // 为每个图标准备带颜色和变换的SVG代码
    const processedIcons = icons.map(icon => {
      let svgCode = icon.svgCode;

      // 根据用户设置决定颜色处理方式
      if (settings.useIndividualColors) {
        // 使用个性化颜色：优先从DOM获取，降级到手动处理
        // 改进的选择器逻辑，支持多种可能的元素位置
        let iconElement = document.querySelector(`[data-icon-id="${icon.id}"]`);

        // 如果直接通过ID找不到，尝试在iconGrid中查找
        if (!iconElement) {
          iconElement = document.getElementById('iconGrid')?.querySelector(`[data-icon-id="${icon.id}"]`);
        }

        // 再尝试更宽泛的查找
        if (!iconElement) {
          const allIconElements = document.querySelectorAll('[data-icon-id]');
          for (let el of allIconElements) {
            if (el.getAttribute('data-icon-id') === icon.id) {
              iconElement = el;
              break;
            }
          }
        }

        if (iconElement && window.ColorManager) {
          const svgElement = iconElement.querySelector('svg');
          if (svgElement) {
            // 使用ColorManager获取带颜色的SVG代码
            try {
              svgCode = window.ColorManager.getSVGWithColors(svgElement);
              console.log(`批量下载: 成功获取图标 ${icon.id} 的SVG颜色代码`);
            } catch (error) {
              console.error(`批量下载: 获取SVG颜色代码失败 ${icon.id}:`, error);
              // 出错时继续使用降级处理
            }
          } else {
            console.log(`批量下载: 图标 ${icon.id} 元素中未找到SVG子元素`);
            // 降级到个性化颜色处理逻辑
            if (iconColors.has(icon.id)) {
              const color = iconColors.get(icon.id);
              svgCode = applySingleColorToSVG(svgCode, color);
            } else if (pathColors.has(icon.id)) {
              // 应用路径级颜色
              svgCode = applyPathColorsToSVG(svgCode, pathColors.get(icon.id));
            }
          }
        } else {
          console.log(`批量下载: 图标 ${icon.id} 未找到DOM元素或ColorManager不可用，使用个性化颜色处理`);
          // 降级到个性化颜色处理逻辑
          if (iconColors.has(icon.id)) {
            const color = iconColors.get(icon.id);
            svgCode = applySingleColorToSVG(svgCode, color);
          } else if (pathColors.has(icon.id)) {
            // 应用路径级颜色
            svgCode = applyPathColorsToSVG(svgCode, pathColors.get(icon.id));
          }
        }
      } else {
        // 使用统一的批量颜色：强制应用，不使用DOM中的个性化颜色
        console.log(`批量下载: 图标 ${icon.id} 应用统一批量颜色 ${settings.batchColor}`);
        svgCode = applySingleColorToSVG(svgCode, settings.batchColor);
      }

      // 从localStorage获取该图标的变换状态并应用
      // 先从localStorage获取变换状态
      let iconTransformKey = `icon_transform_${icon.id}`;
      let transformData = null;
      try {
        const storedData = localStorage.getItem(iconTransformKey);
        if (storedData) {
          transformData = JSON.parse(storedData);
          console.log(`批量下载: 图标 ${icon.id} 应用变换状态: 旋转=${transformData.rotation}°, 镜像X=${transformData.mirrorX}, 镜像Y=${transformData.mirrorY}`);
          
          // 临时保存当前全局变换状态
          const tempRotation = window.currentIconRotation;
          const tempMirrorX = window.currentIconMirrorX;
          const tempMirrorY = window.currentIconMirrorY;
          
          // 设置当前图标变换状态
          window.currentIconRotation = transformData.rotation || 0;
          window.currentIconMirrorX = transformData.mirrorX || 1;
          window.currentIconMirrorY = transformData.mirrorY || 1;
          
          // 应用变换
          svgCode = applyTransformToSvgCode(svgCode, icon);
          
          // 恢复全局变换状态
          window.currentIconRotation = tempRotation;
          window.currentIconMirrorX = tempMirrorX;
          window.currentIconMirrorY = tempMirrorY;
        }
      } catch (error) {
        console.error(`获取图标变换状态失败: ${error.message}`);
      }
      
      return {
        ...icon,
        svgCode: svgCode
      };
    });

    const downloadOptions = {
      format: settings.exportSvg && settings.exportPng ? 'both' : (settings.exportSvg ? 'svg' : 'png'),
      sizes: settings.sizes,
      useZip: true,
      packagingOption: settings.packagingOption,
      onProgress: (current, total) => {
        showToast(`下载进度: ${current}/${total}`, true);
      },
      onComplete: () => {
        showToast('下载完成!');
      }
    };

    // 正确的调用方式：第一个参数是处理过的icons数组，第二个参数是options对象
    window.DownloadManager.batchDownload(processedIcons, downloadOptions)
      .then(() => {
        showToast('下载完成!');
      })
      .catch((error) => {
        console.error('批量下载失败:', error);
        showToast('下载失败，请重试', false);
      });
  } else {
    showToast('下载功能不可用，请刷新页面重试', false);
  }
}

// 应用单一颜色到SVG
function applySingleColorToSVG(svgCode, color) {
  if (!color) return svgCode; // 允许设置白色

  // 创建临时DOM元素来处理SVG
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = svgCode;
  const svgElement = tempDiv.querySelector('svg');

  if (svgElement) {
    // 保持原始的viewBox和其他重要属性
    const originalViewBox = svgElement.getAttribute('viewBox');
    const originalWidth = svgElement.getAttribute('width');
    const originalHeight = svgElement.getAttribute('height');
    const originalPreserveAspectRatio = svgElement.getAttribute('preserveAspectRatio');

    const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
    elements.forEach(element => {
      // 检查元素原本是否有填充颜色
      const originalFill = element.getAttribute('fill');

      // 只对原本有填充颜色的元素设置新的填充颜色
      // 排除 'none'、'transparent' 和空值
      if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
        element.setAttribute('fill', color);
      }

      // 只有当元素原本就有stroke属性时才设置stroke颜色
      const originalStroke = element.getAttribute('stroke');
      if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
        element.setAttribute('stroke', color);
      }
    });

    // 确保重要属性不丢失
    if (originalViewBox) svgElement.setAttribute('viewBox', originalViewBox);
    if (originalWidth) svgElement.setAttribute('width', originalWidth);
    if (originalHeight) svgElement.setAttribute('height', originalHeight);
    if (originalPreserveAspectRatio) svgElement.setAttribute('preserveAspectRatio', originalPreserveAspectRatio);

    let result = svgElement.outerHTML;

    // 确保包含必要的命名空间
    if (!result.includes('xmlns=')) {
      result = result.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!result.includes('xmlns:xlink=') && result.includes('xlink:href')) {
      result = result.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    return result;
  }

  return svgCode;
}

// 应用路径级颜色到SVG
function applyPathColorsToSVG(svgCode, pathColorMap) {
  if (!pathColorMap || pathColorMap.size === 0) return svgCode;

  // 创建临时DOM元素来处理SVG
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = svgCode;
  const svgElement = tempDiv.querySelector('svg');

  if (svgElement) {
    // 保持原始的viewBox和其他重要属性
    const originalViewBox = svgElement.getAttribute('viewBox');
    const originalWidth = svgElement.getAttribute('width');
    const originalHeight = svgElement.getAttribute('height');
    const originalPreserveAspectRatio = svgElement.getAttribute('preserveAspectRatio');

    const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
    elements.forEach((element, index) => {
      const pathColor = pathColorMap.get(index);
      if (pathColor) { // 允许设置白色
        // 检查元素原本是否有填充颜色
        const originalFill = element.getAttribute('fill');

        // 只对原本有填充颜色的元素设置新的填充颜色
        // 排除 'none'、'transparent' 和空值
        if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
          element.setAttribute('fill', pathColor);
        }

        // 只有当元素原本就有stroke属性时才设置stroke颜色
        const originalStroke = element.getAttribute('stroke');
        if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
          element.setAttribute('stroke', pathColor);
        }
      }
    });

    // 确保重要属性不丢失
    if (originalViewBox) svgElement.setAttribute('viewBox', originalViewBox);
    if (originalWidth) svgElement.setAttribute('width', originalWidth);
    if (originalHeight) svgElement.setAttribute('height', originalHeight);
    if (originalPreserveAspectRatio) svgElement.setAttribute('preserveAspectRatio', originalPreserveAspectRatio);

    let result = svgElement.outerHTML;

    // 确保包含必要的命名空间
    if (!result.includes('xmlns=')) {
      result = result.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!result.includes('xmlns:xlink=') && result.includes('xlink:href')) {
      result = result.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    return result;
  }

  return svgCode;
}

// 工具函数
function showToast(message, isSuccess = true) {
  if (!toast) return;

  toast.textContent = message;
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white z-50 transition-all duration-300 ${isSuccess ? 'bg-green-500' : 'bg-red-500'
    }`;

  toast.classList.remove('translate-y-10', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
  }, 2000);
}

function copyToClipboard(text) {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(err => {
      console.error('复制失败:', err);
      return false;
    });
}

function getRandomColor() {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
    '#10ac84', '#ee5253', '#0abde3', '#3742fa', '#2f3542'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 检查元素是否应该处理颜色（包括继承的颜色）
 * @param {Element} element - SVG元素
 * @param {string} attribute - 颜色属性名（'fill' 或 'stroke'）
 * @returns {boolean} 是否应该处理
 */
function shouldProcessElementColor(element, attribute) {
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
 * 生成随机渐变色或纯色
 * @param {string} iconId - 图标ID，用于生成唯一的渐变ID
 * @param {number} pathIndex - 路径索引，用于生成唯一的渐变ID
 * @returns {string} 返回渐变色URL或纯色值
 */
function getRandomColorOrGradient(iconId, pathIndex) {
  // 30%概率生成渐变色，70%概率生成纯色
  const useGradient = Math.random() < 0.3;

  if (useGradient) {
    return createRandomGradient(iconId, pathIndex);
  } else {
    return getRandomColor();
  }
}

/**
 * 创建随机渐变色
 * @param {string} iconId - 图标ID
 * @param {number} pathIndex - 路径索引
 * @returns {string} 渐变色URL
 */
function createRandomGradient(iconId, pathIndex) {
  const gradientId = `gradient_${iconId}_${pathIndex}_${Date.now()}`;
  const color1 = getRandomColor();
  const color2 = getRandomColor();

  // 随机选择渐变方向
  const directions = [
    { x1: '0%', y1: '0%', x2: '100%', y2: '0%' }, // 水平
    { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }, // 垂直
    { x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, // 对角线
    { x1: '100%', y1: '0%', x2: '0%', y2: '100%' }, // 反对角线
  ];
  const direction = directions[Math.floor(Math.random() * directions.length)];

  // 创建渐变定义
  const gradientDef = `
    <defs>
      <linearGradient id="${gradientId}" x1="${direction.x1}" y1="${direction.y1}" x2="${direction.x2}" y2="${direction.y2}">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
      </linearGradient>
    </defs>
  `;

  return {
    url: `url(#${gradientId})`,
    definition: gradientDef,
    id: gradientId
  };
}

// 导出函数供全局使用
// 创建简单的颜色选择器（备用方案）
function createSimpleColorPicker(containerId, currentColor) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const pickerContainer = document.createElement('div');
  pickerContainer.className = 'custom-color-picker';

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = currentColor;
  colorInput.className = 'color-input';

  const colorDisplay = document.createElement('div');
  colorDisplay.className = 'color-display';
  colorDisplay.style.backgroundColor = currentColor;

  const colorText = document.createElement('span');
  colorText.className = 'color-text';
  colorText.textContent = currentColor.toUpperCase();

  pickerContainer.appendChild(colorInput);
  pickerContainer.appendChild(colorDisplay);
  pickerContainer.appendChild(colorText);
  container.appendChild(pickerContainer);

  colorInput.addEventListener('change', (e) => {
    const newColor = e.target.value;
    colorDisplay.style.backgroundColor = newColor;
    colorText.textContent = newColor.toUpperCase();
    updateIconColor(newColor);
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

// 绑定颜色选项事件
function bindColorOptionEvents() {
  const colorOptions = document.querySelectorAll('.color-option');
  colorOptions.forEach(option => {
    // 移除旧的事件监听器
    option.replaceWith(option.cloneNode(true));
  });

  // 重新获取元素并绑定事件
  const newColorOptions = document.querySelectorAll('.color-option');
  newColorOptions.forEach(option => {
    option.addEventListener('click', () => {
      const color = option.dataset.color;
      if (color) {
        updateIconColor(color);

        // 更新自定义颜色选择器的值
        const customPicker = document.querySelector('#customColorPicker .color-input');
        if (customPicker) {
          customPicker.value = color;
          const colorDisplay = document.querySelector('#customColorPicker .color-display');
          const colorText = document.querySelector('#customColorPicker .color-text');
          if (colorDisplay) colorDisplay.style.backgroundColor = color;
          if (colorText) colorText.textContent = color.toUpperCase();
        }
      }
    });
  });
}

// 绑定路径2颜色选择器事件
function bindPath2ColorEvents() {
  const path2ColorOptions = document.querySelectorAll('.path2-color-option');
  path2ColorOptions.forEach(option => {
    // 移除旧的事件监听器
    option.replaceWith(option.cloneNode(true));
  });

  // 重新获取元素并绑定事件
  const newPath2ColorOptions = document.querySelectorAll('.path2-color-option');
  newPath2ColorOptions.forEach(option => {
    option.addEventListener('click', () => {
      const color = option.dataset.color;

      // 检查是否有选中的路径
      if (selectedPathIndex < 0) {
        showToast('请先点击预览图标中的路径来选择要修改的路径', false);
        return;
      }

      // 应用颜色到选中的路径
      updateIconColor(color);

      // 更新选中状态
      newPath2ColorOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');

      // 清除路径选中状态
      clearPathSelection();

      showToast(`已应用颜色 ${color} 到路径 ${selectedPathIndex + 1}`);
    });
  });
}

// 图标预览区域缩放和拖拽功能（支持滚轮、触摸缩放和拖拽移动）
function initIconPreviewZoom() {
  if (!modalIconPreview) {
    console.warn('initIconPreviewZoom: modalIconPreview元素不存在');
    return;
  }

  // 检查是否已有全局缩放比例，如果有则使用它，否则初始化为1
  if (typeof window.currentIconScale === 'undefined') {
    window.currentIconScale = 1;
  }
  let currentScale = window.currentIconScale;
  const minScale = 0.5;
  const maxScale = 5;
  const scaleStep = 0.1;

  // 检查是否已有全局位置变量，如果有则使用它们，否则初始化为0
  if (typeof window.currentIconX === 'undefined') {
    window.currentIconX = 0;
  }
  if (typeof window.currentIconY === 'undefined') {
    window.currentIconY = 0;
  }

  // 拖拽相关变量
  let currentX = window.currentIconX;
  let currentY = window.currentIconY;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialX = 0;
  let initialY = 0;

  // 获取容器边界
  const previewContainer = modalIconPreview.closest('.detail-preview-container');
  if (!previewContainer) {
    console.warn('initIconPreviewZoom: detail-preview-container元素不存在');
    return;
  }

  // 检查图标尺寸是否超过容器尺寸的函数
  function isIconOverflowingContainer() {
    // 首先尝试获取SVG元素
    const svgElement = modalIconPreview.querySelector('.icon-svg-element') ||
      modalIconPreview.querySelector('svg') ||
      modalIconPreview.querySelector('img[src$=".svg"]');

    // 使用正确的容器引用 - 直接使用预览区域的父容器或最近的detail-preview-container
    const previewContainer = modalIconPreview.parentElement ||
      document.querySelector('.detail-preview-container');

    if (!svgElement || !previewContainer) {
      // 图标溢出检查: 找不到SVG元素或预览容器
      return false;
    }

    // 获取容器的实际尺寸
    const containerRect = previewContainer.getBoundingClientRect();

    // 获取SVG的实际渲染尺寸
    const renderedRect = svgElement.getBoundingClientRect();
    const renderedWidth = renderedRect.width;
    const renderedHeight = renderedRect.height;

    // 增加日志输出以便调试
    // console.log(`图标溢出检查: 容器尺寸=${containerRect.width}x${containerRect.height}, 实际渲染尺寸=${renderedWidth}x${renderedHeight}`);
    // console.log(`当前缩放比例: ${currentScale}`);

    // 考虑当前缩放比例，计算渲染后的实际尺寸
    // 这里使用实际渲染尺寸乘以当前缩放比例
    // 但要注意，如果SVG已经应用了transform，getBoundingClientRect会返回变换后的尺寸
    const effectiveWidth = renderedWidth * (currentScale || 1);
    const effectiveHeight = renderedHeight * (currentScale || 1);

    // 更宽松的边距计算，确保能够正确触发拖拽
    const margin = 10; // 留出10px的边距
    const isOverflowing = effectiveWidth > containerRect.width - margin ||
      effectiveHeight > containerRect.height - margin;

    // console.log(`计算后的有效尺寸=${effectiveWidth}x${effectiveHeight}, 是否溢出=${isOverflowing}, 阈值=${containerRect.width - margin}x${containerRect.height - margin}`);
    return isOverflowing;
  }

  // 移除之前的事件监听器（如果存在）
  modalIconPreview.removeEventListener('wheel', handleIconZoom);
  modalIconPreview.removeEventListener('mousedown', handleMouseDown);
  modalIconPreview.removeEventListener('mousemove', handleMouseMove);
  modalIconPreview.removeEventListener('mouseup', handleMouseUp);
  modalIconPreview.removeEventListener('touchstart', handleTouchStart);
  modalIconPreview.removeEventListener('touchmove', handleTouchMove);
  modalIconPreview.removeEventListener('touchend', handleTouchEnd);

  // 添加滚轮事件监听器
  modalIconPreview.addEventListener('wheel', handleIconZoom, { passive: false });

  // 添加鼠标拖拽事件监听器
  modalIconPreview.addEventListener('mousedown', handleMouseDown, { passive: false });
  document.addEventListener('mousemove', handleMouseMove, { passive: false });
  document.addEventListener('mouseup', handleMouseUp, { passive: false });

  // 触摸缩放相关变量
  let initialDistance = 0;
  let initialScale = 1;
  let isZooming = false;

  // 触摸点击判断相关变量
  let touchStartTime = 0;
  let touchMoved = false;
  let touchDuration = 0;
  const touchMoveThreshold = 15; // 移动超过15px才认为是拖拽（增加阈值）
  const touchTimeThreshold = 300; // 触摸超过300ms才开始拖拽（增加时间阈值）

  // 添加触摸事件监听器
  modalIconPreview.addEventListener('touchstart', handleTouchStart, { passive: false });
  modalIconPreview.addEventListener('touchmove', handleTouchMove, { passive: false });
  modalIconPreview.addEventListener('touchend', handleTouchEnd, { passive: false });

  function handleIconZoom(event) {
    // 阻止默认的页面滚动行为
    event.preventDefault();
    event.stopPropagation();

    // 计算缩放方向
    const delta = event.deltaY > 0 ? -scaleStep : scaleStep;
    const newScale = Math.max(minScale, Math.min(maxScale, currentScale + delta));

    applyScale(newScale);
  }

  // 鼠标拖拽处理函数
  function handleMouseDown(event) {
    // 只处理左键点击
    if (event.button !== 0) return;

    // 只有当图标尺寸超过容器尺寸时才允许拖拽
    if (!isIconOverflowingContainer()) return;

    event.preventDefault();
    isDragging = true;

    // 更新cursor样式
    modalIconPreview.style.cursor = 'grabbing';

    // 记录拖拽起始位置
    startX = event.clientX;
    startY = event.clientY;
    initialX = currentX;
    initialY = currentY;

    console.log('开始鼠标拖拽（图标超过容器尺寸）');
  }

  function handleMouseMove(event) {
    if (!isDragging) return;

    event.preventDefault();

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    currentX = initialX + deltaX;
    currentY = initialY + deltaY;

    applyTransform();
  }

  function handleMouseUp(event) {
    if (!isDragging) return;

    isDragging = false;
    // 根据图标是否超过容器尺寸设置鼠标样式
    updateCursorStyle();
    console.log('结束鼠标拖拽');
  }

  function handleTouchStart(event) {
    // 检查触摸是否在modalIconPreview元素内
    const touch = event.touches[0];
    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    const isInPreviewArea = modalIconPreview.contains(elementUnderTouch) || elementUnderTouch === modalIconPreview;

    // 只处理预览区域内的触摸事件
    if (!isInPreviewArea) {
      return;
    }

    if (event.touches.length === 2) {
      // 双指缩放
      event.preventDefault();

      isZooming = true;
      isDragging = false; // 停止拖拽
      initialScale = currentScale;

      // 计算两个触摸点之间的距离
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
    } else if (event.touches.length === 1) {
      // 单指触摸 - 记录初始状态，但不立即开始拖拽
      touchStartTime = Date.now();
      touchMoved = false;
      isDragging = false; // 确保初始状态不是拖拽

      startX = touch.clientX;
      startY = touch.clientY;
      initialX = currentX;
      initialY = currentY;

      console.log('触摸开始，等待判断操作类型');
    }
  }

  function handleTouchMove(event) {
    // 检查触摸是否在modalIconPreview元素内
    const touch = event.touches[0];
    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    const isInPreviewArea = modalIconPreview.contains(elementUnderTouch) || elementUnderTouch === modalIconPreview;

    if (event.touches.length === 2 && isZooming && isInPreviewArea) {
      // 双指缩放 - 只在预览区域内处理
      event.preventDefault();

      // 计算当前两个触摸点之间的距离
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      // 计算缩放比例
      const scaleRatio = currentDistance / initialDistance;
      const newScale = Math.max(minScale, Math.min(maxScale, initialScale * scaleRatio));

      applyScale(newScale, false); // 触摸时不显示toast
    } else if (event.touches.length === 1 && isInPreviewArea) {
      const deltaX = Math.abs(touch.clientX - startX);
      const deltaY = Math.abs(touch.clientY - startY);
      const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // 检查是否移动超过阈值
      if (moveDistance > touchMoveThreshold) {
        touchMoved = true;

        // 简化拖拽判断：只要图标超过容器尺寸且移动距离足够，就开始拖拽
        if (isIconOverflowingContainer() && !isDragging) {
          isDragging = true;
          isZooming = false;
          // 记录拖拽起始位置
          initialX = currentX;
          initialY = currentY;
          startX = touch.clientX;
          startY = touch.clientY;
          console.log('开始触摸拖拽（图标超过容器尺寸）');
        }
      }

      // 只有在确认拖拽状态且图标超过容器尺寸时才执行拖拽操作
      if (isDragging && isIconOverflowingContainer()) {
        event.preventDefault();
        event.stopPropagation();

        currentX = initialX + (touch.clientX - startX);
        currentY = initialY + (touch.clientY - startY);

        applyTransform();
      }
    }
  }

  function handleTouchEnd(event) {
    const touchDuration = Date.now() - touchStartTime;

    if (isZooming && event.touches.length < 2) {
      isZooming = false;

      // 显示最终缩放比例
      const scalePercentage = Math.round(currentScale * 100);
      showToast(`图标缩放: ${scalePercentage}%`, true);
    }

    if (isDragging && event.touches.length === 0) {
      isDragging = false;
      console.log('结束触摸拖拽');
    }

    // 如果是短时间的触摸且没有移动，确保是点击操作
    if (event.touches.length === 0 && !touchMoved && !isDragging && !isZooming) {
      if (touchDuration < touchTimeThreshold) {
        console.log('检测到点击事件，允许正常处理');
        // 确保不会触发任何拖拽相关的变换
        // 保持当前位置不变
      }
    }

    // 重置触摸状态
    if (event.touches.length === 0) {
      touchMoved = false;
      touchStartTime = 0;
      // 确保拖拽状态被清除
      if (!isZooming) {
        isDragging = false;
      }
    }
  }

  // 统一的变换应用函数
  function applyTransform() {
    // 只有在确实需要变换时才应用
    if (isDragging || isZooming || currentScale !== 1) {
      // 获取旋转和镜像状态，确保它们正确应用到transform中
      const rotation = window.currentIconRotation || 0;
      const mirrorX = window.currentIconMirrorX || 1;
      const mirrorY = window.currentIconMirrorY || 1;

      // 应用完整的变换，包括位移、缩放、镜像和旋转
      const transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale}) scaleX(${mirrorX}) scaleY(${mirrorY}) rotate(${rotation}deg)`;
      modalIconPreview.style.transform = transform;
      modalIconPreview.style.transformOrigin = 'center center';

      // 根据图标是否超过容器尺寸设置鼠标样式
      if (!isDragging) {
        updateCursorStyle();
      }
      // 更新返回中心点按钮的可见性
      updateResetButtonVisibility();
    }
  }

  function applyScale(newScale, showToastMsg = true) {
    // 只有当缩放值发生变化时才更新
    if (newScale !== currentScale) {
      currentScale = newScale;
      // 更新全局变量，供setPathSelectedState函数和其他函数访问
      window.currentIconScale = currentScale;
      window.currentIconX = currentX;
      window.currentIconY = currentY;

      // 当缩放到1时，重置位移
      if (currentScale === 1) {
        currentX = 0;
        currentY = 0;
      }

      // 应用变换
      applyTransform();

      // 添加过渡效果使缩放更平滑
      modalIconPreview.style.transition = 'transform 0.1s ease-out';

      // 显示当前缩放比例的提示
      if (showToastMsg) {
        const scalePercentage = Math.round(currentScale * 100);
        showToast(`图标缩放: ${scalePercentage}%`, true);
      }

      console.log(`图标预览缩放: ${Math.round(currentScale * 100)}%`);

      // 更新返回中心点按钮的可见性
      updateResetButtonVisibility();

      // 重新设置所有选中路径的样式，以适应新的缩放比例
      const selectedPaths = modalIconPreview.querySelectorAll('[selected="true"]');
      selectedPaths.forEach((path, index) => {
        setPathSelectedState(path, index);
      });
    }
  }

  // 获取返回中心点按钮
  const resetIconPositionBtn = document.getElementById('resetIconPositionBtn');

  // 重置缩放和位移的函数（可选，供其他地方调用）
  window.resetIconPreviewZoom = function () {
    currentScale = 1;
    currentX = 0;
    currentY = 0;
    // 更新全局变量
    window.currentIconScale = 1;
    window.currentIconX = 0;
    window.currentIconY = 0;

    // 保留当前的旋转和镜像状态
    const rotation = window.currentIconRotation || 0;
    const mirrorX = window.currentIconMirrorX || 1;
    const mirrorY = window.currentIconMirrorY || 1;

    // 应用完整的变换，只重置位置和缩放，保留旋转和镜像
    modalIconPreview.style.transform = `translate(0px, 0px) scale(1) scaleX(${mirrorX}) scaleY(${mirrorY}) rotate(${rotation}deg)`;
    modalIconPreview.style.transition = 'transform 0.2s ease-out';
    // 更新鼠标样式和返回按钮可见性
    updateCursorStyle();
    showToast('图标缩放和位置已重置', true);
  };

  // 为返回中心点按钮添加点击事件
  if (resetIconPositionBtn) {
    resetIconPositionBtn.addEventListener('click', resetIconPreviewZoom);
  }

  // 检查图标是否超出预览区域边界
  function isIconOutOfBounds() {
    // 当图标位置不在中心点或缩放比例大于1时认为超出边界
    return currentX !== 0 || currentY !== 0 || currentScale > 1;
  }

  // 获取全屏预览按钮
  const toggleFullscreenBtn = document.getElementById('toggleFullscreenBtn');

  // 获取图标调整按钮和面板
  const iconAdjustBtn = document.getElementById('iconAdjustBtn');
  const iconAdjustPanel = document.getElementById('iconAdjustPanel');
  const iconResetBtn = document.getElementById('iconResetBtn');

  // 全局变量存储当前图标变换状态
  window.currentIconRotation = 0; // 当前旋转角度
  window.currentIconMirrorX = 1; // X轴镜像比例（1或-1）
  window.currentIconMirrorY = 1; // Y轴镜像比例（1或-1）

  // 检查图标是否有旋转或镜像调整
  window.hasIconAdjustments = function () {
    return window.currentIconRotation !== 0 ||
      window.currentIconMirrorX !== 1 ||
      window.currentIconMirrorY !== 1;
  }

  // 更新Reset按钮的显示状态
  window.updateIconResetBtnVisibility = function () {
    const iconResetBtn = document.getElementById('iconResetBtn');
    if (iconResetBtn) {
      if (window.hasIconAdjustments()) {
        iconResetBtn.classList.remove('hidden');
      } else {
        iconResetBtn.classList.add('hidden');
      }
    }
  }

  // 重置图标旋转和镜像状态
  window.resetIconAdjustments = function () {
    // 保存当前的位置和缩放状态
    const currentScale = window.currentIconScale || 1;
    const currentX = window.currentIconX || 0;
    const currentY = window.currentIconY || 0;

    // 重置旋转和镜像状态
    window.currentIconRotation = 0;
    window.currentIconMirrorX = 1;
    window.currentIconMirrorY = 1;

    // 应用变换，保留位置和缩放
    if (modalIconPreview) {
      modalIconPreview.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale}) scaleX(1) scaleY(1) rotate(0deg)`;
      modalIconPreview.style.transition = 'transform 0.2s ease-out';
    }

    // 更新Reset按钮的显示状态
    window.updateIconResetBtnVisibility();

    // 更新旋转输入框
    const customRotateInput = document.getElementById('customRotateInput');
    if (customRotateInput) {
      customRotateInput.value = '';
    }

    // 更新URL参数，移除旋转和镜像信息
    updateUrlWithIconInfo(currentIcon.id, getCurrentIconColorString());

    showToast('图标旋转和镜像已重置', true);
  }

  // 为Reset按钮添加点击事件
  if (iconResetBtn) {
    iconResetBtn.addEventListener('click', window.resetIconAdjustments);
  }

  // 更新返回中心点按钮的显示状态（调整按钮始终显示）
  function updateResetButtonVisibility() {
    if (!resetIconPositionBtn) return;

    const isOutOfBounds = isIconOutOfBounds();

    if (isOutOfBounds) {
      resetIconPositionBtn.classList.remove('opacity-0', 'pointer-events-none');
      resetIconPositionBtn.classList.add('opacity-100');
    } else {
      resetIconPositionBtn.classList.add('opacity-0', 'pointer-events-none');
      resetIconPositionBtn.classList.remove('opacity-100');
    }
  }

  // 为预览区域添加鼠标移入和移出事件
  if (previewContainer) {
    previewContainer.addEventListener('mouseenter', () => {
      if (toggleFullscreenBtn) {
        toggleFullscreenBtn.classList.remove('opacity-0', 'pointer-events-none');
        toggleFullscreenBtn.classList.add('opacity-100');
      }
      // 调整按钮始终显示，无需在此处理
    });

    previewContainer.addEventListener('mouseleave', () => {
      if (toggleFullscreenBtn) {
        toggleFullscreenBtn.classList.add('opacity-0', 'pointer-events-none');
        toggleFullscreenBtn.classList.remove('opacity-100');
      }
      // 调整按钮始终显示，无需在此处理
    });
  }

  // 更新鼠标指针样式的函数
  function updateCursorStyle() {
    modalIconPreview.style.cursor = isIconOverflowingContainer() ? 'grab' : 'default';
    // 同时更新返回中心点按钮的可见性
    updateResetButtonVisibility();
  }

  // 监听窗口大小变化，更新鼠标指针样式
  window.addEventListener('resize', updateCursorStyle);

  // 初始更新鼠标指针样式
  updateCursorStyle();

  // 初始化图标调整功能
  initIconAdjustment();

  // 图标预览缩放和拖拽功能已初始化（支持滚轮、触摸缩放和拖拽移动）
}

// 初始化图标调整功能
// 重置旋转角度函数
function resetIconRotation() {
  window.currentIconRotation = 0;
  showToast('已重置旋转角度', true);
  updateIconTransform();
  updateIconResetBtnVisibility();

  // 清空自定义旋转输入框
  const customRotateInput = document.getElementById('customRotateInput');
  if (customRotateInput) {
    customRotateInput.value = '';
  }
}

// 重置镜像方式函数
function resetIconMirror() {
  window.currentIconMirrorX = 1;
  window.currentIconMirrorY = 1;
  showToast('已重置镜像方式', true);
  updateIconTransform();
  updateIconResetBtnVisibility();
}

function initIconAdjustment() {
  // 初始化全局变换变量，确保在使用前有默认值
  window.currentIconRotation = window.currentIconRotation || 0;
  window.currentIconMirrorX = window.currentIconMirrorX || 1;
  window.currentIconMirrorY = window.currentIconMirrorY || 1;
  window.currentIconScale = window.currentIconScale || 1;
  window.currentIconX = window.currentIconX || 0;
  window.currentIconY = window.currentIconY || 0;

  // 从URL参数读取旋转角度和镜像状态
  try {
    const urlParams = new URLSearchParams(window.location.search);

    // 读取旋转角度
    const rotateParam = urlParams.get('rotate');
    if (rotateParam) {
      const angle = parseInt(rotateParam);
      if (!isNaN(angle) && angle >= -360 && angle <= 360) {
        window.currentIconRotation = angle;
        console.log('从URL参数加载旋转角度:', angle);
      }
    }

    // 读取镜像状态
    const mirrorParam = urlParams.get('mirror');
    if (mirrorParam) {
      const [mirrorX, mirrorY] = mirrorParam.split(',').map(val => parseInt(val));
      if (!isNaN(mirrorX) && (mirrorX === 1 || mirrorX === -1) &&
        !isNaN(mirrorY) && (mirrorY === 1 || mirrorY === -1)) {
        window.currentIconMirrorX = mirrorX;
        window.currentIconMirrorY = mirrorY;
        console.log('从URL参数加载镜像状态:', { mirrorX, mirrorY });
      }
    }
  } catch (error) {
    console.error('从URL参数读取图标变换状态时出错:', error);
  }

  console.log('初始化变换变量:', {
    rotation: window.currentIconRotation,
    mirrorX: window.currentIconMirrorX,
    mirrorY: window.currentIconMirrorY,
    scale: window.currentIconScale,
    translateX: window.currentIconX,
    translateY: window.currentIconY
  });

  // 使用全局变量以便于调试
  window.iconAdjustBtn = document.getElementById('iconAdjustBtn');
  window.iconAdjustPanel = document.getElementById('iconAdjustPanel');

  // 声明控制按钮的引用变量
  const rotateBtns = document.querySelectorAll('.rotate-btn');
  const customRotateInput = document.getElementById('customRotateInput');
  const mirrorBtns = document.querySelectorAll('.mirror-btn');
  const resetRotationBtn = document.getElementById('resetRotationBtn');
  const resetMirrorBtn = document.getElementById('resetMirrorBtn');

  // 确保变量正确引用
  console.log('初始化图标调整功能:', {
    iconAdjustBtn: window.iconAdjustBtn,
    iconAdjustPanel: window.iconAdjustPanel,
    rotateBtns: rotateBtns,
    customRotateInput: customRotateInput,
    mirrorBtns: mirrorBtns,
    hasButton: !!window.iconAdjustBtn,
    hasPanel: !!window.iconAdjustPanel
  });

  // 确保面板默认是隐藏的
  if (window.iconAdjustPanel) {
    window.iconAdjustPanel.classList.add('hidden');
    console.log('调整面板默认设置为隐藏');
  }

  // 添加点击事件处理
  if (window.iconAdjustBtn && window.iconAdjustPanel) {
    // 先移除可能存在的事件监听器，避免重复绑定
    window.iconAdjustBtn.onclick = null;

    // 使用onclick属性而非addEventListener，避免重复绑定
    window.iconAdjustBtn.onclick = function (event) {
      // 阻止默认行为和冒泡
      event.preventDefault();
      event.stopPropagation();

      // 直接控制hidden类的移除与添加
      const isHidden = window.iconAdjustPanel.classList.contains('hidden');
      console.log('点击调整按钮，当前状态:', { isHidden });

      if (isHidden) {
        // 显示面板
        window.iconAdjustPanel.classList.remove('hidden');
        console.log('移除hidden类，显示面板');
      } else {
        // 隐藏面板
        window.iconAdjustPanel.classList.add('hidden');
        console.log('添加hidden类，隐藏面板');
      }
    };

    // 移除点击外部区域自动隐藏面板的功能
    // 用户现在只能通过点击调整按钮来控制面板的显隐
    console.log('面板显隐模式: 仅通过调整按钮控制');

    // 预设旋转角度按钮事件
    rotateBtns.forEach(btn => {
      // 先移除可能存在的事件监听器
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // 阻止冒泡，防止触发文档点击事件
        const angle = parseInt(newBtn.getAttribute('data-angle'));
        console.log('点击旋转按钮，角度:', angle);
        rotateIcon(angle);
      });
    });

    // 自定义旋转角度输入
    if (customRotateInput) {
      // 清除可能存在的事件监听器
      const newInput = customRotateInput.cloneNode(true);
      customRotateInput.parentNode.replaceChild(newInput, customRotateInput);

      newInput.addEventListener('change', (event) => {
        event.stopPropagation(); // 阻止冒泡
        let angle = parseInt(newInput.value);
        console.log('自定义旋转角度输入:', angle);
        if (!isNaN(angle) && angle >= -360 && angle <= 360) {
          // 自定义度数应该是相对于初始状态的绝对角度
          rotateIcon(angle, true);
        } else {
          showToast('请输入-360到360之间的有效数字', false);
        }
      });

      // 回车键确认自定义角度
      newInput.addEventListener('keyup', (e) => {
        e.stopPropagation(); // 阻止冒泡
        if (e.key === 'Enter') {
          newInput.dispatchEvent(new Event('change'));
        }
      });
    }

    // 镜像按钮事件
    mirrorBtns.forEach(btn => {
      // 先移除可能存在的事件监听器
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // 阻止冒泡，防止触发文档点击事件
        const mirrorType = newBtn.getAttribute('data-mirror');
        console.log('点击镜像按钮，类型:', mirrorType);
        applyMirror(mirrorType);
      });
    });

    // 重置旋转角度按钮事件
    if (resetRotationBtn) {
      resetRotationBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // 阻止冒泡，防止触发文档点击事件
        console.log('点击重置旋转角度按钮');
        resetIconRotation();
      });
    }

    // 重置镜像方式按钮事件
    if (resetMirrorBtn) {
      resetMirrorBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // 阻止冒泡，防止触发文档点击事件
        console.log('点击重置镜像方式按钮');
        resetIconMirror();
      });
    }

    console.log('图标调整功能初始化完成，所有事件监听器已绑定');
  }
  else {
    console.warn('图标调整功能初始化失败，找不到必要的DOM元素');
  }
}

// 旋转图标函数
// @param {number} angle - 旋转角度
// @param {boolean} isAbsolute - 是否为绝对角度（相对于初始状态），默认为false（相对于当前状态）
function rotateIcon(angle, isAbsolute = false) {
  if (isAbsolute) {
    // 直接设置为指定角度（从初始状态开始）
    window.currentIconRotation = angle % 360;
    // 确保角度为正数
    if (window.currentIconRotation < 0) {
      window.currentIconRotation += 360;
    }
    showToast(`已设置旋转角度为${angle}°`, true);
  } else {
    // 累加旋转角度（相对于当前状态）
    window.currentIconRotation = (window.currentIconRotation + angle) % 360;
    // 确保角度为正数
    if (window.currentIconRotation < 0) {
      window.currentIconRotation += 360;
    }
    showToast(`已旋转${angle}°`, true);
  }
  updateIconTransform();
  window.updateIconResetBtnVisibility();
}

// 应用镜像函数
function applyMirror(type) {
  switch (type) {
    case 'horizontal':
      window.currentIconMirrorX = window.currentIconMirrorX * -1;
      showToast(window.currentIconMirrorX === -1 ? '已应用左右镜像' : '已取消左右镜像', true);
      break;
    case 'vertical':
      window.currentIconMirrorY = window.currentIconMirrorY * -1;
      showToast(window.currentIconMirrorY === -1 ? '已应用上下镜像' : '已取消上下镜像', true);
      break;
    case 'both':
      window.currentIconMirrorX = window.currentIconMirrorX * -1;
      window.currentIconMirrorY = window.currentIconMirrorY * -1;
      showToast('已应用上下左右镜像', true);
      break;
  }
  updateIconTransform();
  updateIconResetBtnVisibility();
}

// 更新图标变换（旋转和镜像）
function updateIconTransform() {
  const modalIconPreview = document.getElementById('modalIconPreview');
  if (!modalIconPreview) return;

  // 获取当前的缩放和位移值
  const scale = window.currentIconScale || 1;
  const translateX = window.currentIconX || 0;
  const translateY = window.currentIconY || 0;
  const rotation = window.currentIconRotation || 0;
  const mirrorX = window.currentIconMirrorX || 1;
  const mirrorY = window.currentIconMirrorY || 1;

  // 应用完整的变换
  modalIconPreview.style.transition = 'transform 0.2s ease-out';
  modalIconPreview.style.transform =
    `translate(${translateX}px, ${translateY}px) ` +
    `scale(${scale}) ` +
    `scaleX(${mirrorX}) scaleY(${mirrorY}) ` +
    `rotate(${rotation}deg)`;

  // 更新URL参数，保持当前图标ID和颜色不变
  if (currentIcon && currentIcon.id) {
    updateUrlWithIconInfo(currentIcon.id, getCurrentIconColorString());
  }
}

/**
 * 将变换状态（旋转、镜像等）应用到SVG代码中
 * @param {string} svgCode - 原始SVG代码
 * @param {Object} icon - 图标对象
 * @returns {string} - 应用变换后的SVG代码
 */
function applyTransformToSvgCode(svgCode, icon) {
  // 获取当前的变换状态
  const rotation = window.currentIconRotation || 0;
  const mirrorX = window.currentIconMirrorX || 1;
  const mirrorY = window.currentIconMirrorY || 1;
  
  // 如果没有变换，直接返回原代码
  if (rotation === 0 && mirrorX === 1 && mirrorY === 1) {
    return svgCode;
  }
  
  try {
    // 创建临时元素来解析和修改SVG
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = svgCode;
    const svgElement = tempDiv.querySelector('svg');
    
    if (!svgElement) return svgCode;
    
    // 获取当前的viewBox
    let viewBox = svgElement.getAttribute('viewBox') || '0 0 1024 1024';
    let [x, y, width, height] = viewBox.split(' ').map(Number);
    
    // 计算中心点
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 创建g元素来包裹所有内容并应用变换
    let gElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // 将所有子元素移动到g元素中
    while (svgElement.firstChild) {
      if (svgElement.firstChild.nodeType === 1 && svgElement.firstChild.tagName !== 'style') {
        gElement.appendChild(svgElement.firstChild);
      } else {
        // 保留style标签等在svg根元素
        svgElement.appendChild(svgElement.firstChild);
      }
    }
    
    // 设置变换属性
    let transform = '';
    
    // 先平移到原点
    transform += `translate(-${centerX}, -${centerY}) `;
    
    // 应用镜像
    if (mirrorX !== 1 || mirrorY !== 1) {
      transform += `scale(${mirrorX}, ${mirrorY}) `;
    }
    
    // 应用旋转
    if (rotation !== 0) {
      transform += `rotate(${rotation}) `;
    }
    
    // 平移回中心点
    transform += `translate(${centerX}, ${centerY})`;
    
    gElement.setAttribute('transform', transform);
    
    // 将g元素添加回svg
    svgElement.appendChild(gElement);
    
    // 更新viewBox以适应旋转后的内容（如果需要）
    if (rotation % 180 !== 0) {
      // 对于非90度倍数的旋转，可能需要调整viewBox
      const diagonal = Math.sqrt(width * width + height * height);
      const newX = centerX - diagonal / 2;
      const newY = centerY - diagonal / 2;
      svgElement.setAttribute('viewBox', `${newX} ${newY} ${diagonal} ${diagonal}`);
    }
    
    // 返回修改后的SVG代码
    return new XMLSerializer().serializeToString(svgElement);
  } catch (error) {
    console.error('应用变换到SVG代码失败:', error);
    return svgCode;
  }
}
function initFullscreenPreview() {
  const toggleFullscreenBtn = document.getElementById('toggleFullscreenBtn');
  const previewContainer = document.querySelector('.detail-preview-container');
  const modalContent = document.querySelector('#iconModal > div');
  const modalIconPreview = document.getElementById('modalIconPreview');
  const iconModal = document.getElementById('iconModal'); // 获取模态框元素

  if (!toggleFullscreenBtn || !previewContainer || !modalContent) return;

  // 使用全局的isFullscreenMode变量
  let originalStyles = {};
  let originalModalStyles = {};
  let originalIconPreviewStyles = {};
  let originalBodyOverflow = document.body.style.overflow;

  toggleFullscreenBtn.addEventListener('click', () => {
    toggleFullscreenPreview();
  });

  // 切换全屏预览模式
  function toggleFullscreenPreview() {
    if (isFullscreenMode) {
      // 退出全屏模式
      exitFullscreenMode();
    } else {
      // 进入全屏模式
      enterFullscreenMode();
    }

    // 更新按钮图标
    updateFullscreenButtonIcon();
  }

  // 进入全屏模式 - 使用网站内全屏展示
  function enterFullscreenMode() {
    if (isFullscreenMode) return;

    // 保存原始样式
    originalStyles = {
      position: previewContainer.style.position,
      width: previewContainer.style.width,
      height: previewContainer.style.height,
      padding: previewContainer.style.padding,
      borderRadius: previewContainer.style.borderRadius,
      backgroundColor: previewContainer.style.backgroundColor,
      backgroundImage: previewContainer.style.backgroundImage,
      backgroundSize: previewContainer.style.backgroundSize,
      backgroundPosition: previewContainer.style.backgroundPosition,
      zIndex: previewContainer.style.zIndex,
      boxShadow: previewContainer.style.boxShadow
    };

    originalModalStyles = {
      padding: modalContent.style.padding,
      backgroundColor: modalContent.style.backgroundColor,
      maxWidth: modalContent.style.maxWidth,
      maxHeight: modalContent.style.maxHeight,
      borderRadius: modalContent.style.borderRadius,
      boxShadow: modalContent.style.boxShadow
    };

    originalIconPreviewStyles = {
      maxHeight: modalIconPreview.style.maxHeight,
      height: modalIconPreview.style.height,
      overflow: modalIconPreview.style.overflow
    };

    // 隐藏页面滚动条
    document.body.style.overflow = 'hidden';

    // 调整模态框内容和图标预览区域样式，实现网站内全屏效果
    modalContent.style.padding = '0';
    modalContent.style.backgroundColor = 'rgba(255, 255, 255, 1)'; // 不透明背景
    modalContent.style.maxWidth = '100vw';
    modalContent.style.maxHeight = '100vh';
    modalContent.style.borderRadius = '0';
    modalContent.style.boxShadow = 'none';
    // 确保模态框内容真正充满
    modalContent.style.width = '100vw';
    modalContent.style.height = '100vh';
    modalContent.style.overflow = 'hidden';

    // 调整预览容器为网站内全屏 - 确保容器充满但图标尺寸固定
    previewContainer.style.position = 'fixed';
    previewContainer.style.width = '100vw';
    previewContainer.style.height = '100vh';
    previewContainer.style.padding = '20px'; // 保留一些内边距
    previewContainer.style.borderRadius = '0';
    previewContainer.style.zIndex = '9999';
    previewContainer.style.left = '0';
    previewContainer.style.top = '0';
    previewContainer.style.margin = '0';
    previewContainer.style.boxShadow = 'none';
    previewContainer.style.overflow = 'hidden';

    // 调整图标预览区域 - 确保容器充满屏幕但保持图标居中显示
    modalIconPreview.style.maxHeight = '100vh';
    modalIconPreview.style.height = '100vh';
    modalIconPreview.style.overflow = 'hidden'; // 防止内部滚动条
    modalIconPreview.style.width = '100%';
    // 确保图标居中显示
    modalIconPreview.style.display = 'flex';
    modalIconPreview.style.alignItems = 'center';
    modalIconPreview.style.justifyContent = 'center';

    // 确保SVG包装器的样式不会导致图标缩放
    const svgWrapper = modalIconPreview.querySelector('.icon-svg-wrapper');
    if (svgWrapper) {
      svgWrapper.style.width = 'auto'; // 让包装器根据内容调整宽度
      svgWrapper.style.height = 'auto'; // 让包装器根据内容调整高度
      svgWrapper.style.display = 'flex';
      svgWrapper.style.alignItems = 'center';
      svgWrapper.style.justifyContent = 'center';
    }

    // 确保SVG元素保持固定尺寸 - 使用当前设置的尺寸或默认200
    const svgElement = modalIconPreview.querySelector('.icon-svg-element');
    if (svgElement) {
      // 获取当前尺寸，如果没有则使用默认值200
      const currentWidth = svgElement.getAttribute('width') || '200';
      const currentHeight = svgElement.getAttribute('height') || '200';
      // 明确设置固定尺寸
      svgElement.style.width = currentWidth + 'px';
      svgElement.style.height = currentHeight + 'px';
      svgElement.style.flexShrink = '0'; // 防止图标被压缩
    }

    // 确保模态框本身也调整为全屏
    if (iconModal) {
      iconModal.style.maxWidth = '100vw';
      iconModal.style.maxHeight = '100vh';
      iconModal.style.width = '100vw';
      iconModal.style.height = '100vh';
    }

    // 添加拖拽和缩放功能
    addDragAndScaleFunctionality();

    // 设置全局变量
    window.isFullscreenMode = true;
    isFullscreenMode = true;
  }

  // 退出全屏模式
  function exitFullscreenMode() {
    if (!isFullscreenMode) return;

    // 保存用户在全屏模式下修改的背景颜色
    const currentBackgroundColor = previewContainer.style.backgroundColor;
    const currentBackgroundImage = previewContainer.style.backgroundImage;
    const currentBackgroundSize = previewContainer.style.backgroundSize;
    const currentBackgroundPosition = previewContainer.style.backgroundPosition;

    // 恢复原始样式，但保留背景色相关设置
    previewContainer.style.position = originalStyles.position;
    previewContainer.style.width = originalStyles.width;
    previewContainer.style.height = originalStyles.height;
    previewContainer.style.padding = originalStyles.padding;
    previewContainer.style.borderRadius = originalStyles.borderRadius;
    // 使用当前背景色而不是恢复原始背景色
    previewContainer.style.backgroundColor = currentBackgroundColor;
    previewContainer.style.backgroundImage = currentBackgroundImage;
    previewContainer.style.backgroundSize = currentBackgroundSize;
    previewContainer.style.backgroundPosition = currentBackgroundPosition;
    previewContainer.style.zIndex = originalStyles.zIndex;
    previewContainer.style.boxShadow = originalStyles.boxShadow;
    previewContainer.style.left = '';
    previewContainer.style.top = '';
    previewContainer.style.margin = '';
    previewContainer.style.overflow = ''; // 恢复原始溢出设置

    // 恢复模态框内容
    modalContent.style.padding = originalModalStyles.padding;
    modalContent.style.backgroundColor = originalModalStyles.backgroundColor;
    modalContent.style.maxWidth = originalModalStyles.maxWidth;
    modalContent.style.maxHeight = originalModalStyles.maxHeight;
    modalContent.style.borderRadius = originalModalStyles.borderRadius;
    modalContent.style.boxShadow = originalModalStyles.boxShadow;
    // 恢复宽度和高度
    modalContent.style.width = '';
    modalContent.style.height = '';
    modalContent.style.overflow = '';

    // 恢复图标预览区域
    modalIconPreview.style.maxHeight = originalIconPreviewStyles.maxHeight;
    modalIconPreview.style.height = originalIconPreviewStyles.height;
    modalIconPreview.style.overflow = originalIconPreviewStyles.overflow;
    modalIconPreview.style.width = ''; // 恢复原始宽度设置

    // 恢复模态框本身
    if (iconModal) {
      iconModal.style.maxWidth = '';
      iconModal.style.maxHeight = '';
      iconModal.style.width = '';
      iconModal.style.height = '';
    }

    // 恢复页面滚动条
    document.body.style.overflow = originalBodyOverflow;

    // 移除拖拽和缩放功能
    removeDragAndScaleFunctionality();

    // 设置全局变量
    window.isFullscreenMode = false;
    isFullscreenMode = false;
  }

  // 更新全屏按钮图标
  function updateFullscreenButtonIcon() {
    const iconElement = toggleFullscreenBtn.querySelector('i');
    if (iconElement) {
      if (isFullscreenMode) {
        iconElement.classList.remove('fa-expand');
        iconElement.classList.add('fa-compress');
      } else {
        iconElement.classList.remove('fa-compress');
        iconElement.classList.add('fa-expand');
      }
    }
  }

  // 添加拖拽和缩放功能
  function addDragAndScaleFunctionality() {
    const svgElement = modalIconPreview.querySelector('.icon-svg-element');
    if (!svgElement) return;

    // 设置初始样式
    svgElement.style.cursor = 'grab';
    svgElement.style.transition = 'transform 0.1s ease-out';

    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;
    let translateX = 0;
    let translateY = 0;
    let scale = 1;
    let lastDistance = 0;

    // 鼠标按下事件
    svgElement.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // 只允许左键拖拽

      isDragging = true;
      svgElement.style.cursor = 'grabbing';

      initialX = e.clientX - translateX;
      initialY = e.clientY - translateY;
    });

    // 鼠标移动事件
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      translateX = currentX;
      translateY = currentY;

      updateTransform();
    });

    // 鼠标松开事件
    document.addEventListener('mouseup', () => {
      isDragging = false;
      svgElement.style.cursor = 'grab';
    });

    // 鼠标滚轮缩放事件
    svgElement.addEventListener('wheel', (e) => {
      e.preventDefault();

      // 计算鼠标位置相对于SVG元素的中心点
      const rect = svgElement.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // 计算缩放前的鼠标相对于SVG的位置比例
      const mouseRatioX = mouseX / (rect.width * scale);
      const mouseRatioY = mouseY / (rect.height * scale);

      // 应用缩放
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      scale = Math.max(0.1, Math.min(10, scale * scaleFactor));

      // 调整平移以保持鼠标位置不变
      const newWidth = rect.width * scale;
      const newHeight = rect.height * scale;

      translateX = mouseX - (newWidth * mouseRatioX);
      translateY = mouseY - (newHeight * mouseRatioY);

      updateTransform();
    });

    // 触摸事件处理（移动端支持）
    svgElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        // 单点触摸 - 拖拽
        const touch = e.touches[0];
        isDragging = true;
        initialX = touch.clientX - translateX;
        initialY = touch.clientY - translateY;
      } else if (e.touches.length === 2) {
        // 双点触摸 - 缩放
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      }
    });

    svgElement.addEventListener('touchmove', (e) => {
      e.preventDefault();

      if (e.touches.length === 1 && isDragging) {
        // 拖拽处理
        const touch = e.touches[0];
        currentX = touch.clientX - initialX;
        currentY = touch.clientY - initialY;

        translateX = currentX;
        translateY = currentY;

        updateTransform();
      } else if (e.touches.length === 2) {
        // 缩放处理
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);

        if (lastDistance > 0) {
          const scaleFactor = distance / lastDistance;
          scale = Math.max(0.1, Math.min(10, scale * scaleFactor));
          updateTransform();
        }

        lastDistance = distance;
      }
    });

    svgElement.addEventListener('touchend', () => {
      isDragging = false;
      lastDistance = 0;
    });

    // 更新元素变换
    function updateTransform() {
      svgElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    // 添加键盘事件支持（方向键移动，+/-缩放）
    function handleKeyDown(e) {
      const moveAmount = 10;
      const scaleAmount = 0.1;

      // 阻止在全屏模式下页面滚动
      if (isFullscreenMode && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ')) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowLeft':
          translateX -= moveAmount;
          break;
        case 'ArrowRight':
          translateX += moveAmount;
          break;
        case 'ArrowUp':
          translateY -= moveAmount;
          break;
        case 'ArrowDown':
          translateY += moveAmount;
          break;
        case '+':
        case '=':
          scale = Math.min(10, scale + scaleAmount);
          break;
        case '-':
        case '_':
          scale = Math.max(0.1, scale - scaleAmount);
          break;
        case '0':
          // 重置缩放和平移
          translateX = 0;
          translateY = 0;
          scale = 1;
          break;
        case 'Escape':
          // ESC键退出全屏
          if (isFullscreenMode) {
            e.preventDefault(); // 阻止浏览器默认行为
            exitFullscreenMode();
            updateFullscreenButtonIcon();
          }
          break;
        default:
          return; // 不处理其他键
      }

      updateTransform();
    }

    // 保存事件处理函数引用以便移除
    svgElement._handleKeyDown = handleKeyDown;
    document.addEventListener('keydown', handleKeyDown);
  }

  // 移除拖拽和缩放功能
  function removeDragAndScaleFunctionality() {
    const svgElement = modalIconPreview.querySelector('.icon-svg-element');
    if (!svgElement) return;

    // 移除事件监听器
    document.removeEventListener('keydown', svgElement._handleKeyDown);

    // 移除SVG元素上的事件监听器（使用匿名函数的副本）
    const clonedSvg = svgElement.cloneNode(true);
    svgElement.parentNode.replaceChild(clonedSvg, svgElement);

    // 恢复原始样式
    clonedSvg.style.transform = '';
    clonedSvg.style.cursor = '';
    clonedSvg.style.transition = '';

    // 清除保存的事件处理函数引用
    delete svgElement._handleKeyDown;
  }

  // 当模态框关闭时，确保退出全屏模式
  document.addEventListener('click', (e) => {
    if ((e.target === document.getElementById('iconModal') || e.target.closest('.close-modal')) && isFullscreenMode) {
      exitFullscreenMode();
      updateFullscreenButtonIcon();
    }
  });

  // 确保窗口大小变化时调整样式，避免滚动条问题
  window.addEventListener('resize', () => {
    if (isFullscreenMode) {
      // 确保全屏模式下没有滚动条
      document.body.style.overflow = 'hidden';
      modalIconPreview.style.overflow = 'hidden';
      previewContainer.style.overflow = 'hidden';
      modalContent.style.overflow = 'hidden';

      // 更新所有全屏容器的尺寸以适应窗口变化
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 更新预览容器尺寸
      previewContainer.style.width = `${viewportWidth}px`;
      previewContainer.style.height = `${viewportHeight}px`;

      // 更新模态框内容尺寸
      modalContent.style.width = `${viewportWidth}px`;
      modalContent.style.height = `${viewportHeight}px`;
      modalContent.style.maxWidth = `${viewportWidth}px`;
      modalContent.style.maxHeight = `${viewportHeight}px`;

      // 更新图标预览区域尺寸 - 但保持图标居中
      modalIconPreview.style.width = '100%';
      modalIconPreview.style.height = `${viewportHeight}px`;
      modalIconPreview.style.maxHeight = `${viewportHeight}px`;
      // 确保图标始终居中显示
      modalIconPreview.style.display = 'flex';
      modalIconPreview.style.alignItems = 'center';
      modalIconPreview.style.justifyContent = 'center';

      // 更新模态框本身尺寸
      if (iconModal) {
        iconModal.style.width = `${viewportWidth}px`;
        iconModal.style.height = `${viewportHeight}px`;
        iconModal.style.maxWidth = `${viewportWidth}px`;
        iconModal.style.maxHeight = `${viewportHeight}px`;
      }

      // 确保SVG包装器保持正确样式，不影响图标尺寸
      const svgWrapper = modalIconPreview.querySelector('.icon-svg-wrapper');
      if (svgWrapper) {
        svgWrapper.style.width = 'auto';
        svgWrapper.style.height = 'auto';
        svgWrapper.style.display = 'flex';
        svgWrapper.style.alignItems = 'center';
        svgWrapper.style.justifyContent = 'center';
      }

      // 重要：明确保持SVG元素的固定尺寸，不随窗口变化而变化
      const svgElement = modalIconPreview.querySelector('.icon-svg-element');
      if (svgElement) {
        // 获取当前尺寸，如果没有则使用默认值200
        const currentWidth = svgElement.getAttribute('width') || '200';
        const currentHeight = svgElement.getAttribute('height') || '200';
        // 明确设置固定尺寸，防止被窗口大小影响
        svgElement.style.width = currentWidth + 'px';
        svgElement.style.height = currentHeight + 'px';
        svgElement.style.flexShrink = '0'; // 防止图标被压缩
      }
    }
  });
}

// 背景颜色切换功能
function initBackgroundColorChanger() {
  const changeBgBtn = document.getElementById('changeBackgroundColorBtn');
  const previewContainer = document.querySelector('.detail-preview-container');
  const modalIconPreview = document.getElementById('modalIconPreview');

  if (!changeBgBtn || !previewContainer) return;

  // 确保detail-preview-container有相对定位，以便按钮的绝对定位生效
  previewContainer.style.position = 'relative';

  // 定义颜色选项 - 一行四个显示，浅蓝色排第二位
  const colorOptions = [
    { name: '透明网格', value: 'grid' },
    { name: '浅蓝色', value: '#e5f3fd' },
    { name: '白色', value: '#ffffff' },
    { name: '超浅灰', value: '#f8f9fa' },
    { name: '浅灰', value: '#e9ecef' },
    { name: '中灰', value: '#adb5bd' },
    { name: '深灰', value: '#6c757d' },
    { name: '近黑', value: '#343a40' }
  ];

  // 当前背景类型
  let currentBgType = 'grid';

  // 创建颜色选择面板
  let colorPanel = null;

  changeBgBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // 如果面板已存在，切换显示状态
    if (colorPanel) {
      colorPanel.remove();
      colorPanel = null;
      return;
    }

    // 创建颜色选择面板
    colorPanel = document.createElement('div');
    colorPanel.className = 'absolute bottom-12 right-3 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 w-auto';
    colorPanel.innerHTML = `
      <div class="text-xs text-gray-500 px-2 py-1 font-medium">选择背景颜色</div>
      <div class="grid grid-cols-4 gap-2 mt-1">
        ${colorOptions.map(color => `
          <button 
            data-color="${color.value}"
            class="color-option flex items-center justify-center w-10 h-10 rounded-md transition-colors border hover:border-primary ${currentBgType === color.value ? 'ring-2 ring-primary ring-offset-1' : ''}"
            title="${color.name}"
          >
            ${color.value === 'grid' ?
        '<div class="w-7 h-7 bg-white bg-[linear-gradient(45deg,#eee_25%,transparent_0,transparent_75%,#eee_0),linear-gradient(45deg,#eee_25%,transparent_0,transparent_75%,#eee_0)] bg-[size:10px_10px] bg-[position:0_0,5px_5px] rounded-full"></div>' :
        `<div class="w-7 h-7 rounded-full" style="background-color: ${color.value}"></div>`
      }
          </button>
        `).join('')}
      </div>
    `;

    // 添加到previewContainer中（按钮的父容器）
    previewContainer.appendChild(colorPanel);

    // 为颜色选项添加点击事件
    colorPanel.querySelectorAll('.color-option').forEach(button => {
      button.addEventListener('click', () => {
        const color = button.dataset.color;
        changePreviewBackground(color);

        // 更新选中状态
        colorPanel.querySelectorAll('.color-option').forEach(btn => {
          btn.classList.remove('ring-2', 'ring-primary', 'ring-offset-1');
        });
        button.classList.add('ring-2', 'ring-primary', 'ring-offset-1');

        // 关闭面板
        setTimeout(() => {
          colorPanel.remove();
          colorPanel = null;
        }, 200);
      });
    });
  });

  // 点击其他地方关闭面板
  document.addEventListener('click', () => {
    if (colorPanel) {
      colorPanel.remove();
      colorPanel = null;
    }
  });

  // 阻止点击面板内部时关闭面板
  document.addEventListener('click', (e) => {
    if (e.target.closest('.color-option') || e.target.closest('#changeBackgroundColorBtn')) {
      e.stopPropagation();
    }
  });

  // 改变预览背景
  function changePreviewBackground(color) {
    currentBgType = color;

    if (color === 'grid') {
      // 恢复默认网格背景
      previewContainer.style.background = '';
      previewContainer.style.backgroundColor = '';
      previewContainer.style.backgroundImage = '';
      previewContainer.style.backgroundSize = '';
      previewContainer.style.backgroundPosition = '';
    } else {
      // 设置纯色背景
      previewContainer.style.backgroundColor = color;
      previewContainer.style.backgroundImage = 'none';
      previewContainer.style.backgroundSize = '';
      previewContainer.style.backgroundPosition = '';
    }
  }
}

// 复制当前URL到剪贴板
function copyCurrentUrl() {
  // 获取当前完整URL
  const currentUrl = window.location.href;

  // 使用现代API复制到剪贴板
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(currentUrl).then(() => {
      // 显示复制成功提示
      showToast('链接已复制到剪贴板！');
      console.log('URL已成功复制到剪贴板');

      // 临时更改按钮样式以提供视觉反馈
      const copyBtn = document.getElementById('copyUrlBtn');
      if (copyBtn) {
        // 保存原始内容
        const originalContent = copyBtn.innerHTML;
        // 替换为成功状态，保持相同的样式规格
        copyBtn.innerHTML = '<i class="fa-solid fa-check text-[1.9em]"></i><span class="hidden sm:inline">已复制</span>';
        // 直接设置为成功颜色，不再经过中间状态
        copyBtn.classList.add('text-green-600');
        copyBtn.classList.remove('text-neutral-400', 'hover:text-primary');

        // 1.5秒后恢复按钮原始状态
        setTimeout(() => {
          copyBtn.innerHTML = originalContent;
          copyBtn.classList.remove('text-green-600');
          copyBtn.classList.add('text-neutral-400', 'hover:text-primary');
        }, 1500);
      }
    }).catch(err => {
      console.error('复制失败:', err);
      showToast('复制失败，请手动复制URL');
    });
  } else {
    // 降级方案：使用传统方法复制
    const textArea = document.createElement('textarea');
    textArea.value = currentUrl;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      showToast('链接已复制到剪贴板！');
      console.log('URL已成功复制到剪贴板（传统方法）');
    } catch (err) {
      console.error('复制失败:', err);
      showToast('复制失败，请手动复制URL');
    }

    document.body.removeChild(textArea);
  }
}

window.IconLibrary = {
  showToast,
  updateIconColor,
  resetIconColor,
  openIconDetail,
  copyCurrentUrl
};

// 页面加载完成后，尝试应用URL参数中的颜色到主页图标
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const iconId = urlParams.get('id');
  const colorParam = urlParams.get('color');

  if (iconId && colorParam) {
    console.log(`页面完全加载后，尝试应用颜色到主页图标: ${iconId}`);
    // 确保预加载颜色信息
    if (typeof preloadColorFromUrlParam === 'function') {
      preloadColorFromUrlParam(iconId, colorParam);
    }
    // 延迟一点时间再次尝试更新主页图标颜色，确保DOM元素完全渲染
    setTimeout(() => {
      if (typeof updateHomeIconColorFromUrl === 'function') {
        updateHomeIconColorFromUrl(iconId);
      }
    }, 1000);
  }

  // 绑定URL复制按钮的点击事件
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  if (copyUrlBtn) {
    copyUrlBtn.addEventListener('click', copyCurrentUrl);
    console.log('URL复制按钮点击事件已绑定');
  }
});

console.log('Main.js loaded successfully!');