// PS插件工具模块 - 为未来Photoshop插件开发预留接口
// 遵循Adobe UXP/CEP架构规范，确保与PS 2021+版本兼容

/**
 * PS插件核心接口类
 * 提供图标发送、图层管理、尺寸设置等核心功能
 */
class PSPluginUtils {
  constructor() {
    this.isConnected = false;
    this.psVersion = null;
    this.supportedFormats = ['svg', 'png'];
    this.defaultSize = 64;
    this.maxSize = 1024;
  }

  /**
   * 初始化PS连接
   * @returns {Promise<boolean>} 连接是否成功
   */
  async psInitialize() {
    try {
      // 检测PS是否运行
      if (typeof window.require !== 'undefined') {
        // CEP环境检测
        const csInterface = window.require('lib/CSInterface');
        this.isConnected = csInterface && csInterface.hostEnvironment;
      } else if (typeof window.uxp !== 'undefined') {
        // UXP环境检测
        this.isConnected = window.uxp && window.uxp.host;
      }

      if (this.isConnected) {
        console.log('PS插件连接成功');
        return true;
      } else {
        console.warn('PS未启动或插件权限不足');
        return false;
      }
    } catch (error) {
      console.error('PS连接初始化失败:', error);
      return false;
    }
  }

  /**
   * 发送图标到PS图层
   * @param {Object} iconData - 图标数据对象
   * @param {string} iconData.id - 图标ID
   * @param {string} iconData.svgCode - SVG代码（含颜色信息）
   * @param {string} iconData.name - 图标名称
   * @param {Object} options - 发送选项
   * @param {number} options.size - 图标尺寸（像素）
   * @param {number} options.opacity - 透明度（0-100）
   * @param {string} options.blendMode - 混合模式
   * @returns {Promise<Object>} 发送结果
   */
  async psSendToLayer(iconData, options = {}) {
    try {
      // 参数校验
      if (!iconData || !iconData.svgCode) {
        throw new Error('图标数据不完整');
      }

      // 默认选项
      const config = {
        size: options.size || this.defaultSize,
        opacity: options.opacity || 100,
        blendMode: options.blendMode || 'normal',
        ...options
      };

      // 校验颜色数据完整性
      const validatedSvg = this._validateSvgColors(iconData.svgCode);

      // 生成图层名称：图标ID + 颜色标识
      const layerName = this._generateLayerName(iconData.id, iconData.svgCode);

      // 准备发送数据（JSON格式，确保兼容性）
      const sendData = {
        type: 'svg-icon',
        id: iconData.id,
        name: iconData.name || iconData.id,
        svgContent: validatedSvg,
        layerName: layerName,
        size: config.size,
        opacity: config.opacity,
        blendMode: config.blendMode,
        timestamp: Date.now()
      };

      // 模拟PS接口调用（实际实现时替换为真实PS API）
      const result = await this._mockPSLayerCreation(sendData);

      return {
        success: true,
        layerId: result.layerId,
        layerName: layerName,
        message: `图标 ${iconData.name} 已成功添加到PS图层`
      };

    } catch (error) {
      console.error('发送到PS失败:', error);
      return {
        success: false,
        error: error.message,
        message: '发送失败，请确保PS已启动并授予插件权限'
      };
    }
  }

  /**
   * 获取PS图层信息
   * @returns {Promise<Array>} 图层列表
   */
  async psGetLayerInfo() {
    try {
      if (!this.isConnected) {
        await this.psInitialize();
      }

      // 模拟获取图层信息（实际实现时替换为真实PS API）
      return await this._mockGetLayers();
    } catch (error) {
      console.error('获取图层信息失败:', error);
      return [];
    }
  }

  /**
   * 设置图标尺寸
   * @param {string} layerId - 图层ID
   * @param {number} size - 新尺寸
   * @returns {Promise<boolean>} 设置是否成功
   */
  async psSetIconSize(layerId, size) {
    try {
      if (size < 16 || size > this.maxSize) {
        throw new Error(`尺寸必须在16-${this.maxSize}像素之间`);
      }

      // 模拟尺寸设置（实际实现时替换为真实PS API）
      const result = await this._mockSetLayerSize(layerId, size);
      return result.success;
    } catch (error) {
      console.error('设置图标尺寸失败:', error);
      return false;
    }
  }

  /**
   * 批量发送图标到PS
   * @param {Array} iconList - 图标数据数组
   * @param {Object} options - 批量发送选项
   * @returns {Promise<Object>} 批量发送结果
   */
  async psBatchSendToLayers(iconList, options = {}) {
    try {
      const results = [];
      const errors = [];

      for (let i = 0; i < iconList.length; i++) {
        const icon = iconList[i];
        try {
          const result = await this.psSendToLayer(icon, {
            ...options,
            // 为每个图标添加位置偏移，避免重叠
            offsetX: (i % 5) * (options.size || this.defaultSize + 20),
            offsetY: Math.floor(i / 5) * (options.size || this.defaultSize + 20)
          });

          if (result.success) {
            results.push(result);
          } else {
            errors.push({ icon: icon.id, error: result.error });
          }
        } catch (error) {
          errors.push({ icon: icon.id, error: error.message });
        }

        // 添加延迟，避免PS过载
        if (i < iconList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return {
        success: errors.length === 0,
        totalSent: results.length,
        totalErrors: errors.length,
        results: results,
        errors: errors,
        message: `成功发送 ${results.length} 个图标，${errors.length} 个失败`
      };
    } catch (error) {
      console.error('批量发送失败:', error);
      return {
        success: false,
        error: error.message,
        message: '批量发送失败'
      };
    }
  }

  // 私有方法：校验SVG颜色数据
  _validateSvgColors(svgCode) {
    try {
      // 确保SVG包含颜色信息
      if (!svgCode.includes('fill=') && !svgCode.includes('stroke=')) {
        // 如果没有颜色信息，添加默认颜色
        svgCode = svgCode.replace('<svg', '<svg fill="#409eff"');
      }

      // 移除透明或空颜色
      // 对于fill属性，如果明确有fill属性但值为空/transparent/none，则设置默认颜色
      svgCode = svgCode.replace(/fill="(transparent|none|)"/g, 'fill="#409eff"');
      // 对于stroke属性，只替换已有的、但值为空/transparent/none的情况，不主动添加新的stroke属性
      svgCode = svgCode.replace(/stroke="(transparent|none|)"/g, 'stroke="none"');

      return svgCode;
    } catch (error) {
      console.warn('SVG颜色校验失败，使用默认颜色:', error);
      return svgCode.replace('<svg', '<svg fill="#409eff"');
    }
  }

  // 私有方法：生成图层名称
  _generateLayerName(iconId, svgCode) {
    try {
      // 提取主要颜色作为标识
      const colorMatch = svgCode.match(/fill="(#[0-9a-fA-F]{6})"/)
      const colorId = colorMatch ? colorMatch[1].substring(1, 4) : 'def';
      return `icon-${iconId}-${colorId}`;
    } catch (error) {
      return `icon-${iconId}-default`;
    }
  }

  // 模拟方法：PS图层创建（实际开发时替换为真实API）
  async _mockPSLayerCreation(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          layerId: `layer_${Date.now()}`,
          success: true
        });
      }, 200);
    });
  }

  // 模拟方法：获取图层信息（实际开发时替换为真实API）
  async _mockGetLayers() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'layer_1', name: 'icon-home-409', type: 'svg-icon' },
          { id: 'layer_2', name: 'icon-user-f56', type: 'svg-icon' }
        ]);
      }, 100);
    });
  }

  // 模拟方法：设置图层尺寸（实际开发时替换为真实API）
  async _mockSetLayerSize(layerId, size) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, layerId, newSize: size });
      }, 150);
    });
  }
}

// 创建全局PS插件实例
const psUtils = new PSPluginUtils();

// 导出PS插件接口（支持模块化和全局使用）
if (typeof module !== 'undefined' && module.exports) {
  // Node.js环境
  module.exports = { PSPluginUtils, psUtils };
} else {
  // 浏览器环境
  window.PSPluginUtils = PSPluginUtils;
  window.psUtils = psUtils;
}

// 自动初始化（在PS环境中）
if (typeof window !== 'undefined' && (window.require || window.uxp)) {
  psUtils.psInitialize().then(connected => {
    if (connected) {
      console.log('PS插件工具已就绪');
    }
  });
}