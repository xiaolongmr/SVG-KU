/**
 * Photoshop接口模块
 * 负责与Photoshop的交互，包括图层创建、SVG导入等
 */

(function(window) {
    'use strict';
    
    /**
     * PS接口类
     */
    function PSInterface() {
        this.csInterface = new CSInterface();
        this.isInitialized = false;
        this.hostInfo = null;
        
        this.initialize();
    }
    
    /**
     * 初始化PS接口
     */
    PSInterface.prototype.initialize = function() {
        try {
            this.hostInfo = this.csInterface.getHostEnvironment();
            this.isInitialized = true;
            console.log('PS接口初始化成功:', this.hostInfo);
        } catch (error) {
            console.error('PS接口初始化失败:', error);
            this.isInitialized = false;
        }
    };
    
    /**
     * 检查PS是否可用
     * @returns {boolean} PS是否可用
     */
    PSInterface.prototype.isPhotoshopAvailable = function() {
        return this.isInitialized && this.hostInfo && 
               (this.hostInfo.appName === 'PHXS' || this.hostInfo.appName === 'PHSP');
    };
    
    /**
     * 发送图标到PS图层
     * @param {string} svgCode - SVG代码
     * @param {Object} iconInfo - 图标信息
     * @param {Object} options - 选项参数
     * @returns {Promise} 发送结果
     */
    PSInterface.prototype.sendIconToLayer = function(svgCode, iconInfo, options) {
        return new Promise((resolve, reject) => {
            if (!this.isPhotoshopAvailable()) {
                reject(new Error('Photoshop未启动或插件权限不足，请确保Photoshop已启动并授予插件权限'));
                return;
            }
            
            try {
                // 准备SVG数据
                const processedSvg = this.prepareSVGForPS(svgCode, options);
                
                // 生成图层名称
                const layerName = this.generateLayerName(iconInfo, options);
                
                // 构建JSX脚本
                const jsxScript = this.buildCreateLayerScript(processedSvg, layerName, options);
                
                // 执行JSX脚本
                this.csInterface.evalScript(jsxScript, (result) => {
                    try {
                        if (result && result.indexOf('Error') === -1) {
                            console.log('图标发送成功:', result);
                            resolve({
                                success: true,
                                layerName: layerName,
                                result: result
                            });
                        } else {
                            console.error('图标发送失败:', result);
                            reject(new Error(result || '发送图标到PS失败'));
                        }
                    } catch (error) {
                        console.error('处理PS返回结果失败:', error);
                        reject(error);
                    }
                });
                
            } catch (error) {
                console.error('发送图标到PS失败:', error);
                reject(error);
            }
        });
    };
    
    /**
     * 准备SVG数据供PS使用
     * @param {string} svgCode - 原始SVG代码
     * @param {Object} options - 选项参数
     * @returns {string} 处理后的SVG代码
     */
    PSInterface.prototype.prepareSVGForPS = function(svgCode, options) {
        options = options || {};
        
        // 创建临时DOM元素来处理SVG
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = svgCode;
        const svgElement = tempDiv.querySelector('svg');
        
        if (!svgElement) {
            throw new Error('无效的SVG代码');
        }
        
        // 确保SVG有正确的尺寸和viewBox
        const size = options.size || 256;
        svgElement.setAttribute('width', size);
        svgElement.setAttribute('height', size);
        
        if (!svgElement.getAttribute('viewBox')) {
            svgElement.setAttribute('viewBox', '0 0 1024 1024');
        }
        
        // 内联样式，确保颜色信息嵌入到SVG中
        this.inlineStyles(svgElement);
        
        return svgElement.outerHTML;
    };
    
    /**
     * 内联SVG样式
     * @param {Element} svgElement - SVG元素
     */
    PSInterface.prototype.inlineStyles = function(svgElement) {
        const elements = svgElement.querySelectorAll('*');
        elements.forEach(el => {
            // 确保fill和stroke属性直接设置在元素上
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.fill && computedStyle.fill !== 'none') {
                el.setAttribute('fill', computedStyle.fill);
            }
            if (computedStyle.stroke && computedStyle.stroke !== 'none') {
                el.setAttribute('stroke', computedStyle.stroke);
            }
        });
    };
    
    /**
     * 生成图层名称
     * @param {Object} iconInfo - 图标信息
     * @param {Object} options - 选项参数
     * @returns {string} 图层名称
     */
    PSInterface.prototype.generateLayerName = function(iconInfo, options) {
        let layerName = iconInfo.name || iconInfo.id || 'Icon';
        
        // 添加颜色标识
        if (options.colors) {
            const fillColor = options.colors.fill;
            if (fillColor && fillColor !== '#409eff') {
                layerName += ` (${fillColor})`;
            }
        }
        
        // 添加时间戳避免重名
        const timestamp = new Date().getTime().toString().slice(-4);
        layerName += ` ${timestamp}`;
        
        return layerName;
    };
    
    /**
     * 构建创建图层的JSX脚本
     * @param {string} svgCode - SVG代码
     * @param {string} layerName - 图层名称
     * @param {Object} options - 选项参数
     * @returns {string} JSX脚本代码
     */
    PSInterface.prototype.buildCreateLayerScript = function(svgCode, layerName, options) {
        // 转义SVG代码中的特殊字符
        const escapedSvg = svgCode.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
        
        const jsxScript = `
            try {
                // 确保有活动文档
                if (!app.documents.length) {
                    app.documents.add(UnitValue(1024, "px"), UnitValue(1024, "px"), 72, "New Document");
                }
                
                var doc = app.activeDocument;
                var originalRulerUnits = app.preferences.rulerUnits;
                app.preferences.rulerUnits = Units.PIXELS;
                
                // 创建新图层
                var layer = doc.artLayers.add();
                layer.name = "${layerName}";
                
                // 设置图层不透明度
                if (${options.opacity || 100} !== 100) {
                    layer.opacity = ${options.opacity || 100};
                }
                
                // 尝试导入SVG
                try {
                    // 方法1: 尝试使用智能对象导入
                    var svgFile = new File(Folder.temp + "/temp_icon.svg");
                    svgFile.open("w");
                    svgFile.write("${escapedSvg}");
                    svgFile.close();
                    
                    // 导入为智能对象
                    var desc = new ActionDescriptor();
                    desc.putPath(charIDToTypeID("null"), svgFile);
                    desc.putEnumerated(charIDToTypeID("FTcs"), charIDToTypeID("QCSt"), charIDToTypeID("Qcsa"));
                    desc.putUnitDouble(charIDToTypeID("Wdth"), charIDToTypeID("#Pxl"), ${options.size || 256});
                    desc.putUnitDouble(charIDToTypeID("Hght"), charIDToTypeID("#Pxl"), ${options.size || 256});
                    executeAction(charIDToTypeID("Plc "), desc, DialogModes.NO);
                    
                    // 清理临时文件
                    svgFile.remove();
                    
                    "图标已成功导入为智能对象图层: " + layer.name;
                    
                } catch (smartObjectError) {
                    // 方法2: 创建普通图层并添加注释
                    layer.name = "${layerName} (SVG)";
                    
                    // 在图层中添加SVG信息作为注释
                    var layerDesc = new ActionDescriptor();
                    layerDesc.putString(charIDToTypeID("Nm  "), layer.name);
                    layerDesc.putString(charIDToTypeID("Desc"), "SVG Icon Data: ${escapedSvg.substring(0, 200)}...");
                    
                    "图标已创建为普通图层: " + layer.name + " (注意: SVG数据已保存在图层描述中)";
                }
                
                // 恢复原始单位设置
                app.preferences.rulerUnits = originalRulerUnits;
                
            } catch (error) {
                "Error: " + error.toString();
            }
        `;
        
        return jsxScript;
    };
    
    /**
     * 批量发送图标到PS
     * @param {Array} iconDataArray - 图标数据数组
     * @returns {Promise} 批量发送结果
     */
    PSInterface.prototype.sendMultipleIconsToLayers = function(iconDataArray) {
        return new Promise((resolve, reject) => {
            if (!this.isPhotoshopAvailable()) {
                reject(new Error('Photoshop未启动或插件权限不足'));
                return;
            }
            
            let successCount = 0;
            let failedCount = 0;
            const results = [];
            
            // 递归处理每个图标
            const processNext = (index) => {
                if (index >= iconDataArray.length) {
                    // 所有图标处理完成
                    resolve({
                        success: successCount,
                        failed: failedCount,
                        results: results
                    });
                    return;
                }
                
                const iconData = iconDataArray[index];
                this.sendIconToLayer(iconData.svg, iconData.info, iconData.options)
                    .then(result => {
                        successCount++;
                        results.push({ success: true, icon: iconData.info, result: result });
                        processNext(index + 1);
                    })
                    .catch(error => {
                        failedCount++;
                        results.push({ success: false, icon: iconData.info, error: error.message });
                        processNext(index + 1);
                    });
            };
            
            processNext(0);
        });
    };
    
    /**
     * 获取PS文档信息
     * @returns {Promise} 文档信息
     */
    PSInterface.prototype.getDocumentInfo = function() {
        return new Promise((resolve, reject) => {
            if (!this.isPhotoshopAvailable()) {
                reject(new Error('Photoshop不可用'));
                return;
            }
            
            const jsxScript = `
                try {
                    if (app.documents.length > 0) {
                        var doc = app.activeDocument;
                        JSON.stringify({
                            name: doc.name,
                            width: doc.width.as("px"),
                            height: doc.height.as("px"),
                            resolution: doc.resolution,
                            colorMode: doc.mode.toString(),
                            layerCount: doc.layers.length
                        });
                    } else {
                        JSON.stringify({ error: "没有打开的文档" });
                    }
                } catch (error) {
                    "Error: " + error.toString();
                }
            `;
            
            this.csInterface.evalScript(jsxScript, (result) => {
                try {
                    const docInfo = JSON.parse(result);
                    resolve(docInfo);
                } catch (error) {
                    reject(new Error('获取文档信息失败: ' + result));
                }
            });
        });
    };
    
    /**
     * 显示成功消息
     * @param {string} message - 消息内容
     */
    PSInterface.prototype.showSuccessMessage = function(message) {
        if (window.showToast) {
            window.showToast(message, 'success');
        } else {
            console.log('Success:', message);
        }
    };
    
    /**
     * 显示错误消息
     * @param {string} message - 消息内容
     */
    PSInterface.prototype.showErrorMessage = function(message) {
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            console.error('Error:', message);
        }
    };
    
    // 创建全局实例
    window.psInterface = new PSInterface();
    
})(window);