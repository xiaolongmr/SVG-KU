/**
 * 下载管理模块
 * 处理SVG和PNG格式的单个和批量下载功能
 */

/**
 * 触发文件下载
 * @param {Blob} blob - 文件数据
 * @param {string} filename - 文件名
 */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 清理URL对象
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * 下载SVG文件
 * @param {Object} icon - 图标对象
 * @param {string} svgCode - SVG代码
 * @param {string} filename - 文件名（可选）
 */
function downloadSVG(icon, svgCode, filename = null) {
  const fileName = filename || `${icon.processedId || icon.id}.svg`;
  
  // 预处理SVG代码，确保包含必要的命名空间
  let processedSvgCode = svgCode;
  
  // 添加xmlns属性确保正确渲染
  if (!processedSvgCode.includes('xmlns=')) {
    processedSvgCode = processedSvgCode.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  
  // 添加xlink命名空间，解决xlink:href未定义的问题
  if (!processedSvgCode.includes('xmlns:xlink=') && processedSvgCode.includes('xlink:href')) {
    processedSvgCode = processedSvgCode.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }
  
  const blob = new Blob([processedSvgCode], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, fileName);
}

/**
 * 下载PNG文件
 * @param {Object} icon - 图标对象
 * @param {string} svgCode - SVG代码
 * @param {number} size - 图片尺寸
 * @param {string} filename - 文件名（可选）
 */
function downloadPNG(icon, svgCode, size = 512, filename = null) {
  return new Promise((resolve, reject) => {
    // 预处理SVG代码，确保正确的渲染
    let processedSvgCode = svgCode;
    
    // 解析viewBox获取原始宽高比
    let viewBoxMatch = processedSvgCode.match(/viewBox=["']([^"']+)["']/);
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
    
    const fileName = filename || `${icon.processedId || icon.id}_${canvasWidth}x${canvasHeight}.png`;
    
    // 确保SVG有正确的viewBox和尺寸属性
    if (!processedSvgCode.includes('viewBox')) {
      processedSvgCode = processedSvgCode.replace('<svg', `<svg viewBox="0 0 ${originalWidth} ${originalHeight}"`);
    }
    
    // 设置SVG的实际渲染尺寸
    processedSvgCode = processedSvgCode.replace(/width=["'][^"']*["']/g, `width="${canvasWidth}"`);
    processedSvgCode = processedSvgCode.replace(/height=["'][^"']*["']/g, `height="${canvasHeight}"`);
    
    // 如果没有宽高属性，添加它们
    if (!processedSvgCode.includes('width=')) {
      processedSvgCode = processedSvgCode.replace('<svg', `<svg width="${canvasWidth}"`);
    }
    if (!processedSvgCode.includes('height=')) {
      processedSvgCode = processedSvgCode.replace('<svg', `<svg height="${canvasHeight}"`);
    }
    
    // 添加xmlns属性确保正确渲染
    if (!processedSvgCode.includes('xmlns=')) {
      processedSvgCode = processedSvgCode.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    // 添加xlink命名空间，解决xlink:href未定义的问题
    if (!processedSvgCode.includes('xmlns:xlink=') && processedSvgCode.includes('xlink:href')) {
      processedSvgCode = processedSvgCode.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    
    // 处理描边问题：确保stroke-width有合适的值
    processedSvgCode = processedSvgCode.replace(/stroke-width="0"/g, 'stroke-width="1"');
    
    // 创建SVG数据URL，使用更安全的编码方式
    const svgBlob = new Blob([processedSvgCode], { type: 'image/svg+xml;charset=utf-8' });
    const svgDataUrl = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // 设置高质量渲染
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // 设置透明背景
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // 添加内边距以防止图标被裁切
      const padding = Math.max(canvasWidth, canvasHeight) * 0.05; // 5%的内边距
      const drawWidth = canvasWidth - padding * 2;
      const drawHeight = canvasHeight - padding * 2;
      
      // 绘制图像，保持原始宽高比并添加内边距
      ctx.drawImage(img, padding, padding, drawWidth, drawHeight);
      
      // 清理URL对象
      URL.revokeObjectURL(svgDataUrl);
      
      canvas.toBlob(blob => {
        if (blob) {
          triggerDownload(blob, fileName);
          resolve(true);
        } else {
          reject(new Error('PNG生成失败'));
        }
      }, 'image/png', 1.0); // 设置最高质量
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(svgDataUrl);
      reject(new Error('SVG加载失败'));
    };
    
    img.src = svgDataUrl;
  });
}

/**
 * 批量下载图标
 * @param {Array} icons - 图标数组
 * @param {Object} options - 下载选项
 */
function batchDownload(icons, options = {}) {
  const {
    format = 'svg', // 'svg' 或 'png'
    sizes = [512], // PNG尺寸数组
    useZip = true, // 是否打包为ZIP
    packagingOption = 'single-folder', // 打包选项：'by-icon', 'by-format-size', 'single-folder'
    onProgress = null, // 进度回调
    onComplete = null // 完成回调
  } = options;
  
  if (!useZip) {
    // 逐个下载，返回Promise
    return new Promise((resolve, reject) => {
      try {
        icons.forEach((icon, index) => {
          setTimeout(() => {
            try {
              // 处理SVG下载（svg格式或both格式）
              if (format === 'svg' || format === 'both') {
                downloadSVG(icon, icon.svgCode);
              }
              
              // 处理PNG下载（png格式或both格式）
              if (format === 'png' || format === 'both') {
                sizes.forEach(size => {
                  downloadPNG(icon, icon.svgCode, size);
                });
              }
              
              if (onProgress) {
                onProgress(index + 1, icons.length);
              }
              
              if (index === icons.length - 1) {
                if (onComplete) onComplete();
                resolve(true); // 所有下载完成
              }
            } catch (error) {
              console.error('单个图标下载失败:', error);
              if (index === icons.length - 1) {
                reject(error);
              }
            }
          }, index * 100); // 延迟下载避免浏览器限制
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // 使用ZIP打包（需要JSZip库）
  if (typeof JSZip === 'undefined') {
    console.error('JSZip库未加载，无法创建ZIP文件');
    return;
  }
  
  const zip = new JSZip();
  let completed = 0;
  // 计算总任务数：both格式需要同时处理SVG和PNG
  const total = icons.length * (format === 'both' ? (1 + sizes.length) : (format === 'png' ? sizes.length : 1));
  
  // 根据打包选项确定文件路径
  const getFilePath = (icon, filename, format, size = null) => {
    switch (packagingOption) {
      case 'by-icon':
        return `${icon.processedId || icon.id}/${filename}`;
      case 'by-format-size':
        if (format === 'svg') {
          return `svg/${filename}`;
        } else {
          return `png/${size}x${size}/${filename}`;
        }
      case 'single-folder':
      default:
        return filename;
    }
  };

  const processIcon = async (icon) => {
    try {
      // 处理SVG文件（svg格式或both格式）
      if (format === 'svg' || format === 'both') {
        const filename = `${icon.processedId || icon.id}.svg`;
        const filePath = getFilePath(icon, filename, 'svg');
        
        // 预处理SVG代码，确保包含必要的命名空间
        let processedSvgCode = icon.svgCode;
        
        // 添加xmlns属性确保正确渲染
        if (!processedSvgCode.includes('xmlns=')) {
          processedSvgCode = processedSvgCode.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        // 添加xlink命名空间，解决xlink:href未定义的问题
        if (!processedSvgCode.includes('xmlns:xlink=') && processedSvgCode.includes('xlink:href')) {
          processedSvgCode = processedSvgCode.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }
        
        zip.file(filePath, processedSvgCode);
        completed++;
        if (onProgress) onProgress(completed, total);
      }
      
      // 处理PNG文件（png格式或both格式）
      if (format === 'png' || format === 'both') {
        for (const size of sizes) {
          // 解析viewBox获取原始宽高比
          let viewBoxMatch = icon.svgCode.match(/viewBox=["']([^"']+)["']/);
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
            canvasWidth = size;
            canvasHeight = Math.round(size / aspectRatio);
          } else {
            canvasHeight = size;
            canvasWidth = Math.round(size * aspectRatio);
          }
          
          const filename = `${icon.processedId || icon.id}_${canvasWidth}x${canvasHeight}.png`;
          const filePath = getFilePath(icon, filename, 'png', `${canvasWidth}x${canvasHeight}`);
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          
          const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(icon.svgCode)));
          
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.clearRect(0, 0, canvasWidth, canvasHeight);
              
              // 添加内边距以防止图标被裁切
              const padding = Math.max(canvasWidth, canvasHeight) * 0.05; // 5%的内边距
              const drawWidth = canvasWidth - padding * 2;
              const drawHeight = canvasHeight - padding * 2;
              
              // 绘制图像，保持原始宽高比并添加内边距
              ctx.drawImage(img, padding, padding, drawWidth, drawHeight);
              canvas.toBlob(blob => {
                if (blob) {
                  zip.file(filePath, blob);
                }
                completed++;
                if (onProgress) onProgress(completed, total);
                resolve();
              }, 'image/png', 1.0);
            };
            img.onerror = resolve;
            img.src = svgDataUrl;
          });
        }
      }
    } catch (error) {
      console.error('处理图标失败:', error);
      completed++;
      if (onProgress) onProgress(completed, total);
    }
  };
  
  // 处理所有图标并返回Promise
  return Promise.all(icons.map(processIcon)).then(() => {
    // 生成ZIP文件
    return zip.generateAsync({ type: 'blob' }).then(blob => {
      const filename = `icons_${format}_${Date.now()}.zip`;
      triggerDownload(blob, filename);
      if (onComplete) onComplete();
      return true; // 返回成功标识
    });
  }).catch(error => {
    console.error('批量下载失败:', error);
    throw error; // 重新抛出错误以便上层处理
  });
}

// 导出函数供其他模块使用
window.DownloadManager = {
  triggerDownload,
  downloadSVG,
  downloadPNG,
  batchDownload
};