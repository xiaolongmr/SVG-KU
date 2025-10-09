/**
 * 设置功能模块
 * 处理用户设置和本地存储
 */

class SettingsManager {
  constructor() {
    // 初始化默认设置
    this.defaultSettings = {
      iconCdnUrl: 'https://cdn2.codesign.qq.com/icons/rz0WOY47RrQkP0W/latest/iconfont.js',
      siteName: 'Codesign图标库',
      siteIconClass: 'fa-cube'
    };

    // 初始化DOM元素引用
    this.initElements();

    // 绑定事件监听器
    this.bindEvents();

    // 检查并确保URL包含cdn参数
    this.ensureCdnParam();

    // 检查URL参数（CDN彩蛋功能）
    this.checkUrlParams();

    // 加载保存的设置
    this.loadSettings();
  }
  
  // 确保URL包含cdn参数，如果没有则自动添加
  ensureCdnParam() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      
      // 如果URL中已经包含cdn参数，不需要重定向
      if (urlParams.has('cdn')) {
        return;
      }
      
      // 获取当前设置的CDN URL或默认CDN URL
      let currentCdnUrl = this.defaultSettings.iconCdnUrl;
      
      // 尝试从本地存储获取设置（如果存在）
      try {
        const savedSettings = localStorage.getItem('iconLibrarySettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          currentCdnUrl = parsedSettings.iconCdnUrl || currentCdnUrl;
        }
      } catch (e) {
        console.warn('无法加载保存的设置，使用默认CDN:', e);
      }
      
      // 从CDN URL中提取cdn参数值
      // 例如从 'https://cdn2.codesign.qq.com/icons/rz0WOY47RrQkP0W/latest/iconfont.js' 中提取 'rz0WOY47RrQkP0W'
      const cdnMatch = currentCdnUrl.match(/\/icons\/([^\/]+)\//);
      let cdnParam = 'rz0WOY47RrQkP0W'; // 默认值
      
      if (cdnMatch && cdnMatch[1]) {
        cdnParam = cdnMatch[1];
      }
      
      // 添加cdn参数到URL
      urlParams.set('cdn', cdnParam);
      
      // 构建新的URL
      const newUrl = `${window.location.pathname}?${urlParams.toString()}${window.location.hash}`;
      
      // 重定向到新URL
      console.log(`URL中没有cdn参数，自动添加并跳转: ${newUrl}`);
      window.location.replace(newUrl);
    } catch (error) {
      console.error('确保URL包含cdn参数时出错:', error);
    }
  }

  // 初始化DOM元素引用
  initElements() {
    // 设置相关元素
    this.settingsBtn = document.getElementById('settingsBtn');
    this.settingsModal = document.getElementById('settingsModal');
    this.closeSettingsModal = document.getElementById('closeSettingsModal');
    this.settingsForm = document.getElementById('settingsForm');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    this.resetSettingsBtn = document.getElementById('resetSettingsBtn');

    // 表单字段
    this.iconCdnUrlInput = document.getElementById('iconCdnUrl');
    this.siteNameInput = document.getElementById('siteName');
    this.siteIconClassInput = document.getElementById('siteIconClass');

    // 网站名称和图标元素
    this.siteNameElement = document.querySelector('header h1');
    this.siteIconElement = document.getElementById('siteIconContainer');
  }

  // 绑定事件监听器
  bindEvents() {
    // 设置面板显示/隐藏事件
    // 点击设置按钮时触发 - 已在breadcrumb-menu.js中处理
    this.closeSettingsModal?.addEventListener('click', () => this.hideSettingsModal());

    // 保存和重置设置按钮
    this.saveSettingsBtn?.addEventListener('click', () => this.saveSettings());
    this.resetSettingsBtn?.addEventListener('click', () => this.resetSettings());

    // 点击模态框外部关闭
    this.settingsModal?.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.hideSettingsModal();
    });

    // 阻止点击模态框内容时关闭模态框
    const settingsModalContent = this.settingsModal?.querySelector('div');
    settingsModalContent?.addEventListener('click', (e) => e.stopPropagation());

    // 监听键盘事件
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideSettingsModal();
      }
    });
  }

  // 显示设置模态框
  showSettingsModal() {
    this.updateFormFields();
    // 使用与详情页弹窗相同的显示逻辑
    this.settingsModal.classList.remove('opacity-0', 'pointer-events-none');
    const modalContent = this.settingsModal.querySelector('div');
    if (modalContent) {
      modalContent.classList.remove('scale-95');
      modalContent.classList.add('scale-100');
    }
    document.body.style.overflow = 'hidden';
  }

  // 隐藏设置模态框
  hideSettingsModal() {
    // 使用与详情页弹窗相同的隐藏逻辑
    const modalContent = this.settingsModal.querySelector('div');
    if (modalContent) {
      modalContent.classList.remove('scale-100');
      modalContent.classList.add('scale-95');
    }
    
    // 延迟隐藏模态框，等待动画完成
    setTimeout(() => {
      this.settingsModal.classList.add('opacity-0', 'pointer-events-none');
    }, 200);
    document.body.style.overflow = '';
  }

  // 更新表单字段
  updateFormFields() {
    const settings = this.getSettings();

    if (this.iconCdnUrlInput) this.iconCdnUrlInput.value = settings.iconCdnUrl || '';
    if (this.siteNameInput) this.siteNameInput.value = settings.siteName || '';
    if (this.siteIconClassInput) this.siteIconClassInput.value = settings.siteIconClass || '';
  }

  // 保存设置
  saveSettings() {
    const newSettings = {
      iconCdnUrl: this.iconCdnUrlInput?.value.trim() || this.defaultSettings.iconCdnUrl,
      siteName: this.siteNameInput?.value.trim() || this.defaultSettings.siteName,
      siteIconClass: this.siteIconClassInput?.value.trim() || this.defaultSettings.siteIconClass
    };

    // 保存到本地存储
    localStorage.setItem('iconLibrarySettings', JSON.stringify(newSettings));

    // 应用新设置
    this.applySettings(newSettings);

    // 更新URL中的cdn参数以匹配新设置
    this.updateUrlCdnParam(newSettings.iconCdnUrl);

    // 显示保存成功提示
    window.IconLibrary?.showToast('设置已保存');

    // 关闭模态框
    this.hideSettingsModal();
  }
  
  // 更新URL中的cdn参数
  updateUrlCdnParam(newCdnUrl) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      
      // 从新的CDN URL中提取cdn参数值
      const cdnMatch = newCdnUrl.match(/\/icons\/([^\/]+)\//);
      let cdnParam = 'rz0WOY47RrQkP0W'; // 默认值
      
      if (cdnMatch && cdnMatch[1]) {
        cdnParam = cdnMatch[1];
      }
      
      // 更新cdn参数值
      if (urlParams.get('cdn') !== cdnParam) {
        urlParams.set('cdn', cdnParam);
        
        // 构建新的URL
        const newUrl = `${window.location.pathname}?${urlParams.toString()}${window.location.hash}`;
        
        // 重定向到新URL
        console.log(`更新URL中的cdn参数: ${newUrl}`);
        window.location.replace(newUrl);
      }
    } catch (error) {
      console.error('更新URL中的cdn参数时出错:', error);
    }
  }

  // 重置设置
  resetSettings() {
    // 确认重置
    if (confirm('确定要重置所有设置吗？这将恢复为默认值。')) {
      // 清除本地存储
      localStorage.removeItem('iconLibrarySettings');

      // 应用默认设置
      this.applySettings(this.defaultSettings);

      // 更新表单
      this.updateFormFields();

      // 显示重置成功提示
      window.IconLibrary?.showToast('设置已重置为默认值');
    }
  }

  // 获取设置（从本地存储或默认值）
  getSettings() {
    try {
      const savedSettings = localStorage.getItem('iconLibrarySettings');
      return savedSettings ? { ...this.defaultSettings, ...JSON.parse(savedSettings) } : this.defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.defaultSettings;
    }
  }

  // 加载设置
  loadSettings() {
    const settings = this.getSettings();
    this.applySettings(settings);
  }

  // 应用设置
  applySettings(settings) {
    // 应用图标库CDN（如果已更改）
    if (settings.iconCdnUrl && settings.iconCdnUrl !== this.defaultSettings.iconCdnUrl) {
      this.loadCustomIconCdn(settings.iconCdnUrl);
    }

    // 应用网站名称和标题
    const siteName = settings.siteName || this.defaultSettings.siteName;
    if (this.siteNameElement) {
      this.siteNameElement.textContent = siteName;
    }
    // 同步更新页面标题
    if (document.title) {
      document.title = siteName;
    }

    // 应用网站图标
    if (this.siteIconElement) {
      const iconValue = settings.siteIconClass || this.defaultSettings.siteIconClass;

      // 清空容器
      this.siteIconElement.innerHTML = '';

      // 检查是否是图片URL
      if (iconValue.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) || iconValue.match(/^https?:\/\/.+/i)) {
        // 如果是URL，创建img标签
        const imgElement = document.createElement('img');
        imgElement.src = iconValue;
        imgElement.alt = '网站图标';
        imgElement.className = 'w-10 h-10 object-contain relative z-10';

        // 添加到容器
        this.siteIconElement.appendChild(imgElement);

        // 更新favicon
        this.updateFavicon(iconValue);
      } else {
        // 如果是图标类名，创建i标签
        const iElement = document.createElement('i');
        iElement.className = `fa ${iconValue} text-primary relative z-10 text-2xl`;

        // 添加到容器
        this.siteIconElement.appendChild(iElement);

        // 对于图标类名，重置favicon为默认值
        this.resetFavicon();
      }
    }
  }

  // 更新favicon
  updateFavicon(iconUrl) {
    // 查找现有的favicon
    let favicon = document.querySelector('link[rel="icon"]');

    if (!favicon) {
      // 如果不存在，创建新的favicon元素
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }

    // 更新favicon的href
    favicon.href = iconUrl;

    // 根据文件扩展名设置type属性
    const extension = iconUrl.split('.').pop()?.toLowerCase();
    if (extension === 'ico') {
      favicon.type = 'image/x-icon';
    } else if (extension === 'svg') {
      favicon.type = 'image/svg+xml';
    } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) {
      favicon.type = `image/${extension}`;
    }
  }

  // 将Font Awesome图标转换为Base64图片并设置为favicon
  resetFavicon() {
    // 查找现有的favicon
    let favicon = document.querySelector('link[rel="icon"]');

    if (!favicon) {
      // 如果不存在，创建新的favicon元素
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }

    // 获取当前设置的网站图标类名
    const currentSettings = this.getSettings();
    const iconClass = currentSettings.siteIconClass || this.defaultSettings.siteIconClass;

    // 使用更可靠的方法将Font Awesome图标转换为base64
    this.createFontAwesomeIconAsBase64(iconClass)
      .then(base64Url => {
        // 设置favicon
        favicon.href = base64Url;
        favicon.type = 'image/png';
        console.log('Font Awesome图标已成功转换为favicon');
      })
      .catch(error => {
        // 如果转换失败，回退到默认favicon
        console.warn('Font Awesome图标转换失败:', error, '使用默认favicon');
        favicon.href = '/favicon/favicon.ico';
        favicon.type = 'image/x-icon';
      });
  }

  /**
     * 动态获取Font Awesome图标的Unicode字符
     * @param {string} iconClass - 图标类名
     * @returns {string} Unicode字符
     */
  getFontAwesomeIconUnicode(iconClass) {
    try {
      // 创建临时元素
      const tempElement = document.createElement('i');

      // 确保正确设置多个类名
      let iconType = 'solid'; // 默认类型从regular改为solid
      if (typeof iconClass === 'string') {
        // 处理可能的多个类名，如 "fa-solid fa-face-grin-squint-tears"
        const classes = iconClass.trim().split(/\s+/);

        // 确定图标类型 - 支持更多类型
        if (classes.includes('fa-regular')) iconType = 'regular';
        else if (classes.includes('fa-light')) iconType = 'light';
        else if (classes.includes('fa-thin')) iconType = 'thin';
        else if (classes.includes('fa-duotone')) iconType = 'duotone';
        else if (classes.includes('fa-brands')) iconType = 'brands';

        // 应用所有类名
        classes.forEach(cls => {
          if (cls) tempElement.classList.add(cls);
        });
      }

      tempElement.style.position = 'absolute';
      tempElement.style.left = '-9999px';
      tempElement.style.visibility = 'hidden';

      // 根据图标类型设置不同的字体权重
      let fontWeight = '900'; // 默认solid的权重
      switch (iconType) {
        case 'regular':
          fontWeight = '400';
          break;
        case 'light':
          fontWeight = '300';
          break;
        case 'thin':
          fontWeight = '100';
          break;
        case 'brands':
          fontWeight = '400';
          break;
        case 'duotone':
          fontWeight = '900';
          break;
      }

      tempElement.style.fontFamily = '"Font Awesome 6 Pro", "Font Awesome 6 Free", sans-serif';
      tempElement.style.fontWeight = fontWeight;

      // 添加到DOM
      document.body.appendChild(tempElement);

      // 获取计算后的内容
      let unicode = '';

      // 强制重排以确保样式应用
      tempElement.offsetWidth; // 触发重排

      // 方法1: 直接从元素中获取textContent（如果Font Awesome已经加载并应用了）
      unicode = tempElement.textContent;

      // 方法2: 如果方法1失败，尝试使用DOM API获取伪元素内容
      if (!unicode || unicode.trim() === '') {
        // 尝试获取::before伪元素的content
        const style = window.getComputedStyle(tempElement, '::before');
        let content = style.getPropertyValue('content');

        if (content && content !== 'none' && content !== 'normal') {
          // 移除引号并解析
          unicode = content.replace(/['"]/g, '');

          // 处理转义序列
          if (unicode.match(/^\\u[0-9a-fA-F]{4}$/)) {
            unicode = String.fromCodePoint(parseInt(unicode.substring(2), 16));
          }
        }
      }

      // 清理临时元素
      document.body.removeChild(tempElement);

      // 如果仍然没有找到，返回一个默认图标
      return unicode || '❓';
    } catch (error) {
      console.error('获取Font Awesome图标Unicode失败:', error);
      return '❓'; // 返回一个默认问号图标
    }
  }

  // 使用SVG方法创建Font Awesome图标的Base64图片，优化以减少空白padding
  createFontAwesomeIconAsBase64(iconClass) {
    return new Promise((resolve, reject) => {
      try {
        // 动态获取Font Awesome图标的Unicode字符
        const unicode = this.getFontAwesomeIconUnicode(iconClass);

        // 判断图标类型（solid、regular、light、thin等）
        let iconType = 'solid'; // 默认从regular改为solid
        if (iconClass && iconClass.includes('fa-regular')) iconType = 'regular';
        else if (iconClass && iconClass.includes('fa-light')) iconType = 'light';
        else if (iconClass && iconClass.includes('fa-thin')) iconType = 'thin';
        else if (iconClass && iconClass.includes('fa-brands')) iconType = 'brands';
        else if (iconClass && iconClass.includes('fa-duotone')) iconType = 'duotone';
        else if (iconClass && iconClass.includes('fa-solid')) iconType = 'solid';

        // 根据图标类型设置不同的字体权重
        let fontWeight = '900'; // 默认solid的权重
        switch (iconType) {
          case 'regular':
            fontWeight = '400';
            break;
          case 'light':
            fontWeight = '300';
            break;
          case 'thin':
            fontWeight = '100';
            break;
          case 'brands':
            fontWeight = '400';
            break;
          case 'duotone':
            fontWeight = '900';
            break;
        }

        // 创建canvas，使用紧凑尺寸减少空白
        const canvas = document.createElement('canvas');
        const fontSize = 32; // 适中的字体大小
        const padding = 2; // 最小化padding，但保留一点空间确保图标完整显示

        // 根据字体大小设置canvas尺寸，减去padding
        canvas.width = fontSize + padding * 2;
        canvas.height = fontSize + padding * 2;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }

        // 设置透明背景
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 对于表情类图标，我们需要调整字体设置
        const isEmoji = iconClass && iconClass.includes('face-');
        if (isEmoji) {
          ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Font Awesome 6 Pro", "Font Awesome 6 Free", sans-serif`;
        } else {
          ctx.font = `${fontWeight} ${fontSize}px "Font Awesome 6 Pro", "Font Awesome 6 Free", sans-serif`;
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#409eff'; // 主题色

        // 绘制图标在canvas中心，考虑到padding
        const x = canvas.width / 2;
        const y = isEmoji ? canvas.height / 2 + 1 : canvas.height / 2; // 表情图标微调
        ctx.fillText(unicode, x, y);

        // 获取base64数据
        const base64Url = canvas.toDataURL('image/png');
        resolve(base64Url);
      } catch (error) {
        console.error('创建Font Awesome图标Base64失败:', error);
        reject(error);
      }
    });
  }

  // 加载自定义图标CDN
  loadCustomIconCdn(cdnUrl) {
    // 查找现有图标库脚本
    const existingIconScript = document.querySelector('script[src*="iconfont.js"]');

    if (existingIconScript) {
      // 如果URL相同，不重新加载
      if (existingIconScript.src === cdnUrl) return;

      // 移除现有脚本
      existingIconScript.remove();
    }

    // 创建新脚本元素
    const script = document.createElement('script');
    script.src = cdnUrl;
    script.onload = () => {
      console.log('Custom icon library loaded successfully');
      window.IconLibrary?.showToast('图标库已更新');

      // 重新加载图标（假设存在这样的函数）
      if (window.loadIcons) {
        window.loadIcons();
      }
    };
    script.onerror = () => {
      console.error('Failed to load custom icon library');
      window.IconLibrary?.showToast('图标库加载失败，请检查URL', true);

      // 恢复默认图标库
      setTimeout(() => {
        this.loadCustomIconCdn(this.defaultSettings.iconCdnUrl);
        this.iconCdnUrlInput.value = this.defaultSettings.iconCdnUrl;
      }, 1000);
    };

    // 添加到页面
    document.head.appendChild(script);
  }

  // 检查URL参数（CDN彩蛋功能）
  checkUrlParams() {
    try {
      // 获取URL中的查询参数
      const urlParams = new URLSearchParams(window.location.search);
      const cdnParam = urlParams.get('cdn');

      // 如果URL中包含cdn参数
      if (cdnParam) {
        // 构建完整的CDN URL
        const customCdnUrl = 'https://cdn2.codesign.qq.com/icons/' + cdnParam + '/latest/iconfont.js';

        console.log('检测到CDN参数: ' + cdnParam + '，将使用自定义CDN: ' + customCdnUrl);

        // 强制使用自定义CDN（不更新本地存储）
        this.loadCustomIconCdn(customCdnUrl);

        // 更新表单中的CDN地址显示
        if (this.iconCdnUrlInput) {
          this.iconCdnUrlInput.value = customCdnUrl;
        }

        // 显示CDN切换提示
        window.IconLibrary?.showToast('已切换到自定义图标库');
      }
    } catch (error) {
      console.error('解析URL参数时出错:', error);
    }
  }
}

// 在页面加载完成后初始化设置管理器
document.addEventListener('DOMContentLoaded', function () {
  // 延迟初始化以确保DOM完全加载
  setTimeout(function () {
    window.settingsManager = new SettingsManager();
  }, 100);
});