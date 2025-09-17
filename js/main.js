/**
 * 主脚本文件 - 简化版本
 * 修复了所有用户反馈的问题
 */

// 基本变量
let currentIcon = null;
let currentIconColor = '#409eff';
let iconColors = new Map();
let pathColors = new Map();
let selectedPathIndex = -1;
// 优先级管理：记录哪些图标的颜色是通过详情页面修改的（高优先级）
let detailModifiedIcons = new Set();
// 同步开关状态
let syncWithHomePage = true;
let currentSvgCode = '';
let allIcons = [];
let selectedIcons = new Set();
let isLoading = false;
let hasMoreItems = true;
let totalIconCount = 0;
let currentPage = 1;
const itemsPerPage = 30;

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
  initializeEventListeners();
  loadIcons(1, true); // 加载真实图标数据
});

// 添加滚动加载事件
window.addEventListener('scroll', throttle(() => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
    loadMoreIcons();
  }
}, 200));

// 节流函数
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
  
  // 尺寸选择器事件 - 支持多选
  if (sizeOptions) {
    sizeOptions.addEventListener('click', (e) => {
      const sizeOption = e.target.closest('.size-option');
      if (sizeOption) {
        // 切换选中状态（多选模式）
        if (sizeOption.classList.contains('size-option-selected')) {
          sizeOption.classList.remove('size-option-selected');
        } else {
          sizeOption.classList.add('size-option-selected');
        }
        
        // 获取所有选中的尺寸
        const selectedSizes = Array.from(document.querySelectorAll('.size-option-selected'))
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
            defaultOption.classList.add('size-option-selected');
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
        // 创建完整的SVG代码
        const viewBox = icon.viewBox || '0 0 1024 1024';
        const fullSvgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}">${svgCode.replace(/<svg[^>]*>|<\/svg>/g, '')}</svg>`;
        
        // 创建图片元素
        const img = new Image();
        img.onload = () => {
          try {
            // 创建canvas
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // 绘制图片到canvas
            ctx.drawImage(img, 0, 0, size, size);
            
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
    return Array.from(document.querySelectorAll('.size-option-selected'))
      .map(option => parseInt(option.dataset.size))
      .sort((a, b) => b - a); // 按从大到小排序
  }
  
  // 复制按钮事件
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
        
        if (svgElement && window.svgColorManager) {
          // 使用SVGColorManager获取带颜色的SVG代码
          code = window.svgColorManager.getSVGWithColors(svgElement);
          console.log('downloadPng: 使用SVGColorManager获取最新SVG代码');
        } else {
          // 降级到原有逻辑
          code = currentSvgCode || currentIcon.svgCode;
          console.log('downloadPng: 使用降级SVG代码');
        }
        
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
      console.log('randomPathColor: window.svgColorManager状态:', window.svgColorManager);
      
      // 如果还是没找到，输出modalIconPreview的完整HTML结构
      if (!svgElement) {
        console.log('randomPathColor: modalIconPreview的HTML结构:', modalIconPreview.innerHTML);
      }
      
      if (svgElement && window.svgColorManager) {
        // 使用SVGColorManager应用随机路径颜色
        const success = window.svgColorManager.applyRandomPathColors(svgElement, currentIcon.id);
        
        if (success) {
          console.log(`randomPathColor: 详情页面随机路径颜色应用成功`);
          
          // 获取详情页面的颜色状态
          const colorState = window.svgColorManager.getColorState(currentIcon.id);
          console.log(`randomPathColor: 获取到颜色状态`, colorState);
          
          // 检查同步开关状态，决定是否同步到首页
          if (syncWithHomePage) {
            // 同时更新首页对应图标的颜色
            // 首先尝试使用原始ID查找首页图标
            console.log(`randomPathColor: 查找首页图标，原始ID: ${currentIcon.id}`);
            
            let homeIconContainer = document.querySelector(`.icon-display-container[data-icon-id="${currentIcon.id}"]`);
            if (!homeIconContainer) {
              // 如果原始ID找不到，尝试使用处理后的ID（去掉'icon-'前缀和分组后缀）
              const processedIconId = getOriginalNameWithoutPrefix(currentIcon.id);
              console.log(`randomPathColor: 原始ID未找到，尝试处理后ID: ${processedIconId}`);
              homeIconContainer = document.querySelector(`.icon-display-container[data-icon-id="${processedIconId}"]`);
              if (homeIconContainer) {
                console.log(`randomPathColor: 使用处理后ID找到首页图标容器`);
              }
            } else {
              console.log(`randomPathColor: 使用原始ID找到首页图标容器`);
            }
            
            if (homeIconContainer) {
            // 尝试多种方式查找SVG元素
            let homeIconSvg = homeIconContainer.querySelector('.icon-svg-element');
            if (!homeIconSvg) {
              // 如果找不到，尝试直接查找svg标签
              homeIconSvg = homeIconContainer.querySelector('svg');
              console.log(`randomPathColor: 使用svg标签查找到首页图标SVG元素`);
            }
            if (!homeIconSvg) {
              // 如果还是找不到，尝试查找任何包含SVG的元素
              const svgWrapper = homeIconContainer.querySelector('.icon-svg-wrapper');
              if (svgWrapper) {
                homeIconSvg = svgWrapper.querySelector('svg');
                console.log(`randomPathColor: 通过wrapper查找到首页图标SVG元素`);
              }
            }
            
            if (homeIconSvg) {
              if (colorState.pathColors.size > 0) {
                // 将路径颜色转换为数组
                const colorsArray = [];
                const maxIndex = Math.max(...colorState.pathColors.keys());
                for (let i = 0; i <= maxIndex; i++) {
                  colorsArray[i] = colorState.pathColors.get(i) || '#409eff';
                }
                console.log(`randomPathColor: 准备应用颜色数组到首页图标`, colorsArray);
                
                // 应用相同的路径颜色到首页图标
                const homeSuccess = window.svgColorManager.changePathColors(homeIconSvg, currentIcon.id, colorsArray);
                if (homeSuccess) {
                  console.log(`randomPathColor: 已同步更新首页图标 ${currentIcon.id} 的路径颜色`);
                } else {
                  console.warn(`randomPathColor: 首页图标 ${currentIcon.id} 路径颜色同步失败`);
                }
              } else {
                console.warn(`randomPathColor: 没有路径颜色数据可同步`);
              }
            } else {
              console.warn(`randomPathColor: 未找到首页图标 ${currentIcon.id} 的SVG元素`);
            }
            } else {
              console.warn(`randomPathColor: 未找到首页图标容器 ${currentIcon.id}`);
            }
          } else {
            console.log(`randomPathColor: 同步开关已关闭，跳过首页图标同步`);
          }
          
          // 更新全局状态（保持兼容性）
          if (colorState.pathColors.size > 0) {
            pathColors.set(currentIcon.id, colorState.pathColors);
            iconColors.delete(currentIcon.id); // 清除整体颜色
            console.log(`randomPathColor: 已更新全局状态`);
          }
          

          
          updateSVGCodeDisplay();
          
          // 获取路径数量并显示提示
          const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
          if (elements.length > 1) {
            showToast(`已为 ${elements.length} 个路径生成随机颜色`);
          } else {
            showToast('此图标只有一个路径，已应用随机颜色');
          }
        } else {
          showToast('随机颜色生成失败，请重试', false);
        }
      } else if (svgElement) {
        // 备用方案：使用原生DOM操作实现随机路径颜色
        console.warn('randomPathColor: SVGColorManager不可用，使用备用方案');
        console.log('randomPathColor: 备用方案中的svgElement:', svgElement);
        const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
        console.log('randomPathColor: 找到的可着色元素:', elements, '数量:', elements.length);
        
        if (elements.length > 0) {
          let updatedCount = 0;
          const pathColorsMap = new Map();
          const gradientDefinitions = [];
          
          // 确保SVG有defs元素用于存放渐变定义
          let defsElement = svgElement.querySelector('defs');
          if (!defsElement) {
            defsElement = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svgElement.insertBefore(defsElement, svgElement.firstChild);
          }
          
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
              // 对纯色元素进行随机上色（纯色或渐变色）
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
              
              el.setAttribute('fill', fillValue);
              // 只有当元素原本有stroke属性时才设置stroke，避免不必要的描边
              if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
                el.setAttribute('stroke', typeof colorResult === 'object' ? colorResult.url : colorResult);
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
                      if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
                        el.setAttribute('stroke', pathColor);
                      }
                    }
                  }
                });
                console.log(`randomPathColor: 已使用备用方案同步更新首页图标`);
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
          pathColors.set(currentIcon.id, pathColorsMap);
          iconColors.delete(currentIcon.id); // 清除整体颜色
          
          updateSVGCodeDisplay();
          
          if (elements.length > 1) {
            showToast(`已为 ${elements.length} 个路径生成随机颜色（备用方案）`);
          } else {
            showToast('此图标只有一个路径，已应用随机颜色（备用方案）');
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
    }
  });
  
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

function createIconItem(icon) {
  const container = document.createElement('div');
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
  svgWrapper.className = 'icon-svg-wrapper w-10 h-10 mx-auto mb-2 ';
  
  const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgElement.className = 'icon-svg-element w-full h-full';
  svgElement.setAttribute('viewBox', icon.viewBox || '0 0 1024 1024');
  svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svgElement.innerHTML = icon.content;
  
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
          // 只有当元素原本有stroke属性时才设置stroke，避免不必要的描边
          if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
            el.setAttribute('stroke', pathColor);
          }
        }
      });
    } else if (iconOverallColor) {
      // 应用整体颜色
      elements.forEach(el => {
        el.setAttribute('fill', iconOverallColor);
        // 只有当元素原本有stroke属性时才设置stroke，避免不必要的描边
        if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
          el.setAttribute('stroke', iconOverallColor);
        }
      });
    }
  }
  
  const nameLabel = document.createElement('div');
  nameLabel.className = 'icon-name-label text-center text-gray-600 font-medium truncate';
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

function openIconDetail(icon) {
  if (!iconModal) return;
  
  currentIcon = icon;
  currentIconColor = iconColors.get(icon.id) || '#409eff';
  
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
  }, 100);
  
  if (modalTitle) modalTitle.textContent = `图标详情: ${icon.processedId || icon.id}`;
  if (modalIconName) modalIconName.textContent = icon.processedId || icon.id;
  
  // 设置图标分组信息
  if (modalIconGroup) {
    const iconGroup = getIconGroup(icon.originalNameWithoutPrefix);
    modalIconGroup.textContent = iconGroup.name;
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
    svgElement.innerHTML = icon.content;
    
    svgWrapper.appendChild(svgElement);
    modalIconPreview.innerHTML = '';
    modalIconPreview.appendChild(svgWrapper);
    
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
            // 只有当元素原本有stroke属性时才设置stroke，避免不必要的描边
            if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
              el.setAttribute('stroke', pathColor);
            }
          }
        });
      } else if (iconOverallColor) {
        // 应用整体颜色
        elements.forEach(el => {
          el.setAttribute('fill', iconOverallColor);
          // 只有当元素原本有stroke属性时才设置stroke，避免不必要的描边
          if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
            el.setAttribute('stroke', iconOverallColor);
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
  
  // 显示模态框
  iconModal.classList.remove('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    const modalContent = iconModal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.classList.remove('scale-95');
      modalContent.classList.add('scale-100');
    }
  }, 10);
}

function updateSVGCodeDisplay() {
  if (!currentIcon || !svgCode) return;
  
  let svgCodeWithColor = currentIcon.svgCode;
  
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
        element.setAttribute('fill', pathColor === '#ffffff' ? '#000000' : pathColor);
        element.setAttribute('stroke', pathColor === '#ffffff' ? '#000000' : pathColor);
      });
      
      svgCodeWithColor = new XMLSerializer().serializeToString(tempSvg);
    } else {
      // 应用统一颜色
      const color = iconColors.get(currentIcon.id) || currentIconColor;
      svgCodeWithColor = svgCodeWithColor.replace(/fill="[^"]*"/g, `fill="${color}"`);
      svgCodeWithColor = svgCodeWithColor.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
      
      if (!svgCodeWithColor.includes(`fill="${color}"`)) {
        svgCodeWithColor = svgCodeWithColor.replace('<svg', `<svg fill="${color}"`);
      }
    }
  }
  // 如果用户没有修改颜色，保持原始样子
  
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
  selectedPathIndex = index;
  
  // 更新路径选择状态 - 添加红色虚线外轮廓
  let svgElement = modalIconPreview.querySelector('.icon-svg-element');
  if (!svgElement) {
    svgElement = modalIconPreview.querySelector('svg');
    console.log(`handlePathClick: 使用svg标签查找到元素:`, svgElement);
  }
  
  if (svgElement) {
    console.log(`handlePathClick: 找到SVG元素，准备设置路径 ${index} 的选中状态`);
    const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
    elements.forEach((el, i) => {
      if (i === index) {
        // 选中的路径：使用统一函数设置选中状态
        setPathSelectedState(el, index);
        
        // 调试日志：确认属性设置
        console.log(`✅ 选中的元素:`, el);
        console.log(`✅ 元素标签名:`, el.tagName);
        console.log(`✅ 元素类名:`, el.className);
      } else {
        // 未选中的路径：清除样式和属性
        el.style.stroke = '';
        el.style.strokeDasharray = '';
        el.style.strokeWidth = '';
        el.removeAttribute('selected'); // 移除selected属性
        el.classList.remove('selected');
        el.classList.remove('path-selected');
      }
    });
  }
  
  // 直接弹出颜色选择器
  showPathColorPicker(event, index);
  
  showToast(`已选中路径 ${index + 1}，点击颜色选择器修改颜色`);
}

// 显示路径颜色选择器弹窗
function showPathColorPicker(event, pathIndex) {
  // 移除已存在的颜色选择器
  const existingPicker = document.querySelector('.path-color-picker-popup');
  if (existingPicker) {
    existingPicker.remove();
  }
  
  // 创建颜色选择器弹窗
  const popup = document.createElement('div');
  popup.className = 'path-color-picker-popup fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4';
  popup.style.left = event.pageX + 'px';
  popup.style.top = event.pageY + 'px';
  
  // 获取当前路径颜色
  const currentPathColor = pathColors.get(currentIcon.id)?.get(pathIndex) || currentIconColor;
  
  popup.innerHTML = `
    <div class="mb-2">
      <label class="block text-sm font-medium text-gray-700 mb-1">路径 ${pathIndex + 1} 颜色</label>
      <input type="color" class="path-color-input w-full h-8 rounded border cursor-pointer" value="${currentPathColor}">
    </div>
    <div class="flex gap-1 flex-wrap mb-3">
      <div class="color-option w-6 h-6 rounded cursor-pointer border border-gray-300" style="background-color: #409eff;" data-color="#409eff"></div>
      <div class="color-option w-6 h-6 rounded cursor-pointer border border-gray-300" style="background-color: #303133;" data-color="#303133"></div>
      <div class="color-option w-6 h-6 rounded cursor-pointer border border-gray-300" style="background-color: #f56c6c;" data-color="#f56c6c"></div>
      <div class="color-option w-6 h-6 rounded cursor-pointer border border-gray-300" style="background-color: #67c23a;" data-color="#67c23a"></div>
      <div class="color-option w-6 h-6 rounded cursor-pointer border border-gray-300" style="background-color: #e6a23c;" data-color="#e6a23c"></div>
    </div>
    <div class="flex gap-2">
      <button class="apply-color-btn px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">应用</button>
      <button class="cancel-color-btn px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400">取消</button>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // 绑定事件
  const colorInput = popup.querySelector('.path-color-input');
  const colorOptions = popup.querySelectorAll('.color-option');
  const applyBtn = popup.querySelector('.apply-color-btn');
  const cancelBtn = popup.querySelector('.cancel-color-btn');
  
  // 颜色选项点击事件
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      const color = option.dataset.color;
      colorInput.value = color;
      // 实时预览颜色变化
      updateSelectedPathColor(color, pathIndex);
    });
  });
  
  // 颜色输入框实时变化事件
  colorInput.addEventListener('input', (e) => {
    const color = e.target.value;
    // 实时预览颜色变化
    updateSelectedPathColor(color, pathIndex);
  });
  
  // 实时更新选中路径颜色的函数
  function updateSelectedPathColor(color, pathIndex) {
    const svgElement = modalIconPreview.querySelector('.icon-svg-element');
    if (svgElement && selectedPathIndex >= 0) {
      const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
      if (elements[selectedPathIndex]) {
        const element = elements[selectedPathIndex];
        const finalColor = color === '#ffffff' ? '#000000' : color;
        
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
    updateIconColor(newColor);
    // 立即清除路径选中状态
    clearPathSelection();
    popup.remove();
    showToast(`路径 ${pathIndex + 1} 颜色已更新为 ${newColor}`);
  });
  
  // 取消
  cancelBtn.addEventListener('click', () => {
    popup.remove();
  });
  
  // 点击外部关闭
  document.addEventListener('click', function closePopup(e) {
    if (!popup.contains(e.target)) {
      popup.remove();
      document.removeEventListener('click', closePopup);
    }
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
  element.style.strokeDasharray = '2';
  element.style.strokeWidth = '0.5px';
  element.classList.add('selected');
  element.classList.add('path-selected');
  
  console.log(`✅ 路径 ${index} 已设置选中状态（红色虚线描边）`);
}

/**
 * 清除SVG路径的选中状态
 */
function clearPathSelection() {
  selectedPathIndex = -1;
  
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
    });
  }
}

function updateIconColor(color, isReset = false) {
  if (!currentIcon) {
    console.warn('updateIconColor: 没有选中的图标');
    return;
  }
  
  console.log(`updateIconColor: 开始更新图标 ${currentIcon.id} 的颜色为 ${color}, selectedPathIndex=${selectedPathIndex}`);
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
    
    if (selectedPathIndex >= 0 && elements[selectedPathIndex]) {
       // 修改单个路径
       const element = elements[selectedPathIndex];
       const finalColor = color === '#ffffff' ? '#000000' : color;
       
       console.log(`updateIconColor: 修改路径 ${selectedPathIndex}，原颜色: ${element.getAttribute('fill')}，新颜色: ${finalColor}`);
       
       // 检查元素原本是否有填充颜色
       const originalFill = element.getAttribute('fill');
       if (originalFill && originalFill !== 'none' && originalFill !== 'transparent') {
         // 实时更新选中path的fill属性
         element.setAttribute('fill', finalColor);
       }
       
       // 只有当元素原本有stroke属性时才设置stroke，避免不必要的描边
       const originalStroke = element.getAttribute('stroke');
       if (originalStroke && originalStroke !== 'none' && originalStroke !== 'transparent') {
         element.setAttribute('stroke', finalColor);
         console.log(`updateIconColor: 同时更新了stroke属性`);
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
        const finalColor = color === '#ffffff' ? '#000000' : color;
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
    // 同时更新首页对应图标的颜色
    const homeIconContainer = document.querySelector(`.icon-display-container[data-icon-id="${currentIcon.id}"]`);
    if (homeIconContainer) {
    const homeIconSvg = homeIconContainer.querySelector('.icon-svg-element');
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
          const finalColor = color === '#ffffff' ? '#000000' : color;
          element.setAttribute('fill', finalColor);
          // 只有当元素原本有stroke属性时才设置stroke，避免不必要的描边
          if (element.hasAttribute('stroke') && element.getAttribute('stroke') !== 'none') {
            element.setAttribute('stroke', finalColor);
          }
        } else {
          // 修改所有元素
          homeElements.forEach(el => {
            const finalColor = color === '#ffffff' ? '#000000' : color;
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
      console.warn(`updateIconColor: 未找到首页图标 ${currentIcon.id} 的SVG元素`);
    }
    } else {
      console.warn(`updateIconColor: 未找到首页图标容器 ${currentIcon.id}`);
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
    if (window.svgColorManager) {
      console.log(`resetIconColor: 找到详情页面SVG元素，开始重置`);
      const success = window.svgColorManager.resetColor(svgElement, currentIcon.id);
      if (!success) {
        console.error('resetIconColor: SVG颜色重置失败');
        showToast('颜色重置失败，请重试', false);
        return;
      }
      console.log(`resetIconColor: 详情页面SVG重置成功`);
    } else {
      // 备用方案：直接恢复原始SVG内容
      console.warn('resetIconColor: SVGColorManager不可用，使用备用方案');
      const iconData = allIcons.find(icon => icon.id === currentIcon.id);
      if (iconData && iconData.content) {
        svgElement.innerHTML = iconData.content;
        console.log(`resetIconColor: 使用备用方案重置成功`);
      } else {
        console.warn(`resetIconColor: 未找到图标 ${currentIcon.id} 的原始数据`);
        showToast('重置失败：未找到原始图标数据', false);
        return;
      }
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
      if (window.svgColorManager) {
        const success = window.svgColorManager.resetColor(homeIconSvg, currentIcon.id);
        if (success) {
          console.log(`resetIconColor: 已重置首页图标 ${currentIcon.id} 的颜色`);
        } else {
          console.warn(`resetIconColor: 首页图标 ${currentIcon.id} 重置失败`);
        }
      } else {
        // 备用方案：直接恢复原始SVG内容
        console.warn('resetIconColor: SVGColorManager不可用，使用备用方案重置首页图标');
        const iconData = allIcons.find(icon => icon.id === currentIcon.id);
        if (iconData && iconData.content) {
          homeIconSvg.innerHTML = iconData.content;
          console.log(`resetIconColor: 使用备用方案重置首页图标成功`);
        } else {
          console.warn(`resetIconColor: 未找到首页图标 ${currentIcon.id} 的原始数据`);
        }
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
  currentIconColor = '#409eff'; // 这只是界面显示的默认值
  
  // 更新自定义颜色选择器为默认值
  const customPicker = document.querySelector('#customColorPicker .color-input');
  if (customPicker) {
    customPicker.value = '#409eff';
  }
  
  updateSVGCodeDisplay();
  showToast('已重置为原始颜色');
  console.log(`resetIconColor: 已重置图标 ${currentIcon.id} 的颜色`);
}

function closeIconModal() {
  if (iconModal) {
    iconModal.classList.add('opacity-0', 'pointer-events-none');
    const modalContent = iconModal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.classList.add('scale-95');
      modalContent.classList.remove('scale-100');
    }
    
    // 重置图标预览区域的缩放和位移状态
    if (modalIconPreview) {
      modalIconPreview.style.transform = 'translate(0px, 0px) scale(1)';
      modalIconPreview.style.transition = '';
      modalIconPreview.style.cursor = 'default';
      console.log('图标预览缩放和位移状态已重置');
    }
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
          let randomColor;
          let success = false;
          
          if (window.svgColorManager) {
            randomColor = window.svgColorManager.generateRandomColor();
            success = window.svgColorManager.changeColor(svgElement, iconId, randomColor);
            
            // 强制更新DOM以确保颜色变化立即显示
            if (success) {
              const elements = svgElement.querySelectorAll('path, rect, circle, polygon, polyline, line, ellipse');
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
            }
          } else {
            // 备用方案：使用原生方法
            console.warn('applyRandomColors: SVGColorManager不可用，使用备用方案');
            randomColor = getRandomColor();
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
          }
          
          if (success) {
            // 更新全局状态（保持兼容性）
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
    
    if (!window.svgColorManager) {
      showToast('SVG颜色管理器未加载，请刷新页面重试', false);
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
          let success = false;
          
          if (window.svgColorManager) {
            success = window.svgColorManager.resetColor(svgElement, iconId);
          } else {
            // 备用方案：直接恢复原始SVG内容
            console.warn('resetAllColors: SVGColorManager不可用，使用备用方案');
            const iconData = allIcons.find(icon => icon.id === iconId);
            if (iconData && iconData.content) {
              svgElement.innerHTML = iconData.content;
              success = true;
            }
          }
          
          if (success) {
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
    
    // 清除SVGColorManager中的颜色状态
    if (window.svgColorManager) {
      window.svgColorManager.clearAllColors();
    }
    
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
      svgWrapper.style.width = size + 'px';
      svgWrapper.style.height = size + 'px';
    }
    
    // 确保预览容器居中显示
    modalIconPreview.style.display = 'flex';
    modalIconPreview.style.alignItems = 'center';
    modalIconPreview.style.justifyContent = 'center';
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
      // 获取当前显示的SVG元素（包含最新的颜色修改）
      const svgElement = modalIconPreview.querySelector('svg');
      let svgCodeToUse;
      
      if (svgElement && window.svgColorManager) {
        // 使用SVGColorManager获取带颜色的SVG代码
        svgCodeToUse = window.svgColorManager.getSVGWithColors(svgElement);
        console.log('copyImageToClipboard: 使用SVGColorManager获取最新SVG代码');
      } else {
        // 降级到原有逻辑
        svgCodeToUse = currentIcon.content || currentIcon.svgCode;
        console.log('copyImageToClipboard: 使用降级SVG代码');
      }
      
      // 确保SVG代码是完整的
      if (!svgCodeToUse || !svgCodeToUse.includes('<svg')) {
        console.error('无效的SVG代码:', svgCodeToUse);
        resolve(false);
        return;
      }
      
      // SVGColorManager已经处理了颜色，无需重复应用
      
      // 确保SVG有正确的viewBox和尺寸属性
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = svgCodeToUse;
      const tempSvgElement = tempDiv.querySelector('svg');
      
      if (tempSvgElement) {
        // 设置viewBox
        const viewBox = currentIcon.viewBox || '0 0 1024 1024';
        tempSvgElement.setAttribute('viewBox', viewBox);
        
        // 设置SVG尺寸
        tempSvgElement.setAttribute('width', size);
        tempSvgElement.setAttribute('height', size);
        
        // 确保preserveAspectRatio
        tempSvgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        svgCodeToUse = tempSvgElement.outerHTML;
      }
      
      // 创建临时canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = size;
      canvas.height = size;
      
      // 创建SVG数据URL - 使用更安全的编码方式
      const svgBlob = new Blob([svgCodeToUse], { type: 'image/svg+xml;charset=utf-8' });
      const svgDataUrl = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = function() {
        try {
          // 设置透明背景
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // 绘制图像 - 保持宽高比
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
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
                resolve(false);
              }
            } else {
              console.error('Canvas转换为blob失败');
              resolve(false);
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
        resolve(false);
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
  const batchColor = document.getElementById('batchColorPicker')?.value || '#409eff';
  
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
    // 为每个图标准备带颜色的SVG代码
    const processedIcons = icons.map(icon => {
      let svgCode = icon.svgCode;
      
      // 根据用户设置决定颜色处理方式
      if (settings.useIndividualColors) {
        // 使用个性化颜色：优先从DOM获取，降级到手动处理
        const iconElement = document.querySelector(`[data-icon-id="${icon.id}"]`);
        if (iconElement && window.svgColorManager) {
          const svgElement = iconElement.querySelector('svg');
          if (svgElement) {
            // 使用SVGColorManager获取带颜色的SVG代码
            svgCode = window.svgColorManager.getSVGWithColors(svgElement);
            console.log(`批量下载: 使用SVGColorManager获取图标 ${icon.id} 的个性化SVG代码`);
          } else {
            console.log(`批量下载: 图标 ${icon.id} 未找到SVG元素，使用个性化颜色处理逻辑`);
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
          console.log(`批量下载: 图标 ${icon.id} 未找到DOM元素或SVGColorManager不可用，使用个性化颜色处理逻辑`);
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
  if (!color || color === '#ffffff') return svgCode;
  
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
      if (pathColor && pathColor !== '#ffffff') {
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
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white z-50 transition-all duration-300 ${
    isSuccess ? 'bg-green-500' : 'bg-red-500'
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
  
  let currentScale = 1;
  const minScale = 0.5;
  const maxScale = 3;
  const scaleStep = 0.1;
  
  // 拖拽相关变量
  let currentX = 0;
  let currentY = 0;
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
    
    event.preventDefault();
    isDragging = true;
    
    startX = event.clientX;
    startY = event.clientY;
    initialX = currentX;
    initialY = currentY;
    
    modalIconPreview.style.cursor = 'grabbing';
    console.log('开始鼠标拖拽');
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
    modalIconPreview.style.cursor = currentScale > 1 ? 'grab' : 'default';
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
      const touchDuration = Date.now() - touchStartTime;
      
      // 检查是否移动超过阈值
      if (moveDistance > touchMoveThreshold) {
        touchMoved = true;
        
        // 更严格的拖拽判断：必须在缩放状态下，且移动距离足够，且触摸时间足够长
        if (currentScale > 1 && !isDragging && touchDuration > touchTimeThreshold) {
          isDragging = true;
          isZooming = false;
          console.log('开始触摸拖拽（严格判断）');
        }
      }
      
      // 只有在确认拖拽状态下才阻止默认事件和执行拖拽操作
      if (isDragging) {
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
      const transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
      modalIconPreview.style.transform = transform;
      modalIconPreview.style.transformOrigin = 'center center';
      
      // 根据缩放状态设置鼠标样式
      if (!isDragging) {
        modalIconPreview.style.cursor = currentScale > 1 ? 'grab' : 'default';
      }
    }
  }
  
  function applyScale(newScale, showToastMsg = true) {
    // 只有当缩放值发生变化时才更新
    if (newScale !== currentScale) {
      currentScale = newScale;
      
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
    }
  }
  
  // 重置缩放和位移的函数（可选，供其他地方调用）
  window.resetIconPreviewZoom = function() {
    currentScale = 1;
    currentX = 0;
    currentY = 0;
    modalIconPreview.style.transform = 'translate(0px, 0px) scale(1)';
    modalIconPreview.style.transition = 'transform 0.2s ease-out';
    modalIconPreview.style.cursor = 'default';
    showToast('图标缩放和位置已重置', true);
  };
  
  console.log('图标预览缩放和拖拽功能已初始化（支持滚轮、触摸缩放和拖拽移动）');
}

window.IconLibrary = {
  showToast,
  updateIconColor,
  resetIconColor,
  openIconDetail
};

console.log('Main.js loaded successfully!');