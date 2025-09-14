/**
 * SVG代码语法高亮模块
 * 使用Prism.js库实现专业的代码高亮显示
 */

// 初始化Prism.js配置
if (typeof Prism !== 'undefined') {
  // 配置Prism.js自动加载器
  Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/';
}

/**
 * 应用SVG代码语法高亮
 * @param {string} svgCode - 原始SVG代码
 * @param {HTMLElement} container - 显示容器元素
 */
function applySyntaxHighlight(svgCode, container) {
  if (!container) return;
  
  // 获取或创建code元素
  let codeElement = container.querySelector('code');
  if (!codeElement) {
    codeElement = document.createElement('code');
    codeElement.className = 'language-markup';
    container.appendChild(codeElement);
  }
  
  // 设置代码内容
  codeElement.textContent = svgCode;
  
  // 应用Prism.js高亮
  if (typeof Prism !== 'undefined') {
    Prism.highlightElement(codeElement);
  }
}

/**
 * 获取纯文本代码（用于复制功能）
 * @param {HTMLElement} container - 显示容器元素
 * @returns {string} 纯文本代码
 */
function getPlainTextCode(container) {
  if (!container) return '';
  
  const codeElement = container.querySelector('code');
  if (!codeElement) return '';
  
  return codeElement.textContent || '';
}

// 导出函数供其他模块使用
window.SyntaxHighlight = {
  applySyntaxHighlight,
  getPlainTextCode
};