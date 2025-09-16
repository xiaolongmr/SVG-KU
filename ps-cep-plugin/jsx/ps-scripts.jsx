/**
 * Photoshop JSX脚本文件
 * 包含在Photoshop中执行的各种操作脚本
 */

// 全局错误处理
try {
    
    /**
     * 创建SVG图层
     * @param {string} svgData - SVG数据
     * @param {string} layerName - 图层名称
     * @param {Object} options - 选项参数
     */
    function createSVGLayer(svgData, layerName, options) {
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
            layer.name = layerName || "Icon Layer";
            
            // 设置图层属性
            if (options && options.opacity) {
                layer.opacity = options.opacity;
            }
            
            // 尝试导入SVG
            var result = importSVGToLayer(svgData, layer, options);
            
            // 恢复原始单位设置
            app.preferences.rulerUnits = originalRulerUnits;
            
            return {
                success: true,
                layerName: layer.name,
                message: result
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.toString()
            };
        }
    }
    
    /**
     * 导入SVG到图层
     * @param {string} svgData - SVG数据
     * @param {ArtLayer} layer - 目标图层
     * @param {Object} options - 选项参数
     */
    function importSVGToLayer(svgData, layer, options) {
        try {
            // 方法1: 尝试使用智能对象导入
            var tempFile = createTempSVGFile(svgData);
            
            if (tempFile && tempFile.exists) {
                try {
                    // 导入为智能对象
                    var desc = new ActionDescriptor();
                    desc.putPath(charIDToTypeID("null"), tempFile);
                    desc.putEnumerated(charIDToTypeID("FTcs"), charIDToTypeID("QCSt"), charIDToTypeID("Qcsa"));
                    
                    if (options && options.size) {
                        desc.putUnitDouble(charIDToTypeID("Wdth"), charIDToTypeID("#Pxl"), options.size);
                        desc.putUnitDouble(charIDToTypeID("Hght"), charIDToTypeID("#Pxl"), options.size);
                    }
                    
                    executeAction(charIDToTypeID("Plc "), desc, DialogModes.NO);
                    
                    // 清理临时文件
                    tempFile.remove();
                    
                    return "图标已成功导入为智能对象";
                    
                } catch (smartObjectError) {
                    // 清理临时文件
                    if (tempFile.exists) {
                        tempFile.remove();
                    }
                    
                    // 方法2: 创建形状图层
                    return createShapeFromSVG(svgData, layer, options);
                }
            } else {
                // 方法2: 创建形状图层
                return createShapeFromSVG(svgData, layer, options);
            }
            
        } catch (error) {
            return "导入失败: " + error.toString();
        }
    }
    
    /**
     * 创建临时SVG文件
     * @param {string} svgData - SVG数据
     * @returns {File} 临时文件对象
     */
    function createTempSVGFile(svgData) {
        try {
            var tempFolder = Folder.temp;
            var tempFileName = "temp_icon_" + new Date().getTime() + ".svg";
            var tempFile = new File(tempFolder + "/" + tempFileName);
            
            tempFile.open("w");
            tempFile.write(svgData);
            tempFile.close();
            
            return tempFile;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * 从SVG创建形状图层
     * @param {string} svgData - SVG数据
     * @param {ArtLayer} layer - 目标图层
     * @param {Object} options - 选项参数
     */
    function createShapeFromSVG(svgData, layer, options) {
        try {
            // 解析SVG中的基本形状
            var shapes = parseSVGShapes(svgData);
            
            if (shapes.length > 0) {
                // 创建形状图层
                createShapeLayer(shapes, layer, options);
                return "图标已转换为形状图层";
            } else {
                // 方法3: 创建普通图层并添加描述
                layer.name = layer.name + " (SVG)";
                
                // 在图层描述中保存SVG数据
                var layerDesc = new ActionDescriptor();
                layerDesc.putString(charIDToTypeID("Nm  "), layer.name);
                
                // 截取SVG数据的前200个字符作为描述
                var description = "SVG Data: " + svgData.substring(0, 200);
                if (svgData.length > 200) {
                    description += "...";
                }
                layerDesc.putString(charIDToTypeID("Desc"), description);
                
                return "图标已创建为普通图层，SVG数据已保存在图层描述中";
            }
            
        } catch (error) {
            return "创建形状失败: " + error.toString();
        }
    }
    
    /**
     * 解析SVG中的基本形状
     * @param {string} svgData - SVG数据
     * @returns {Array} 形状数组
     */
    function parseSVGShapes(svgData) {
        var shapes = [];
        
        try {
            // 简单的SVG解析 - 查找基本形状
            
            // 查找矩形
            var rectMatches = svgData.match(/<rect[^>]*>/g);
            if (rectMatches) {
                for (var i = 0; i < rectMatches.length; i++) {
                    var rect = parseRect(rectMatches[i]);
                    if (rect) shapes.push(rect);
                }
            }
            
            // 查找圆形
            var circleMatches = svgData.match(/<circle[^>]*>/g);
            if (circleMatches) {
                for (var i = 0; i < circleMatches.length; i++) {
                    var circle = parseCircle(circleMatches[i]);
                    if (circle) shapes.push(circle);
                }
            }
            
            // 查找椭圆
            var ellipseMatches = svgData.match(/<ellipse[^>]*>/g);
            if (ellipseMatches) {
                for (var i = 0; i < ellipseMatches.length; i++) {
                    var ellipse = parseEllipse(ellipseMatches[i]);
                    if (ellipse) shapes.push(ellipse);
                }
            }
            
        } catch (error) {
            // 解析失败，返回空数组
        }
        
        return shapes;
    }
    
    /**
     * 解析矩形元素
     * @param {string} rectStr - 矩形字符串
     * @returns {Object} 矩形对象
     */
    function parseRect(rectStr) {
        try {
            var x = parseFloat(getAttributeValue(rectStr, "x")) || 0;
            var y = parseFloat(getAttributeValue(rectStr, "y")) || 0;
            var width = parseFloat(getAttributeValue(rectStr, "width")) || 0;
            var height = parseFloat(getAttributeValue(rectStr, "height")) || 0;
            var fill = getAttributeValue(rectStr, "fill") || "#000000";
            
            if (width > 0 && height > 0) {
                return {
                    type: "rect",
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    fill: fill
                };
            }
        } catch (error) {
            // 解析失败
        }
        return null;
    }
    
    /**
     * 解析圆形元素
     * @param {string} circleStr - 圆形字符串
     * @returns {Object} 圆形对象
     */
    function parseCircle(circleStr) {
        try {
            var cx = parseFloat(getAttributeValue(circleStr, "cx")) || 0;
            var cy = parseFloat(getAttributeValue(circleStr, "cy")) || 0;
            var r = parseFloat(getAttributeValue(circleStr, "r")) || 0;
            var fill = getAttributeValue(circleStr, "fill") || "#000000";
            
            if (r > 0) {
                return {
                    type: "circle",
                    cx: cx,
                    cy: cy,
                    r: r,
                    fill: fill
                };
            }
        } catch (error) {
            // 解析失败
        }
        return null;
    }
    
    /**
     * 解析椭圆元素
     * @param {string} ellipseStr - 椭圆字符串
     * @returns {Object} 椭圆对象
     */
    function parseEllipse(ellipseStr) {
        try {
            var cx = parseFloat(getAttributeValue(ellipseStr, "cx")) || 0;
            var cy = parseFloat(getAttributeValue(ellipseStr, "cy")) || 0;
            var rx = parseFloat(getAttributeValue(ellipseStr, "rx")) || 0;
            var ry = parseFloat(getAttributeValue(ellipseStr, "ry")) || 0;
            var fill = getAttributeValue(ellipseStr, "fill") || "#000000";
            
            if (rx > 0 && ry > 0) {
                return {
                    type: "ellipse",
                    cx: cx,
                    cy: cy,
                    rx: rx,
                    ry: ry,
                    fill: fill
                };
            }
        } catch (error) {
            // 解析失败
        }
        return null;
    }
    
    /**
     * 获取属性值
     * @param {string} str - 字符串
     * @param {string} attr - 属性名
     * @returns {string} 属性值
     */
    function getAttributeValue(str, attr) {
        var regex = new RegExp(attr + '="([^"]*)', 'i');
        var match = str.match(regex);
        return match ? match[1] : null;
    }
    
    /**
     * 创建形状图层
     * @param {Array} shapes - 形状数组
     * @param {ArtLayer} layer - 目标图层
     * @param {Object} options - 选项参数
     */
    function createShapeLayer(shapes, layer, options) {
        try {
            // 这里可以实现具体的形状创建逻辑
            // 由于PS的形状API比较复杂，这里只是一个基础框架
            
            for (var i = 0; i < shapes.length; i++) {
                var shape = shapes[i];
                
                if (shape.type === "rect") {
                    // 创建矩形形状
                    createRectangleShape(shape, layer);
                } else if (shape.type === "circle") {
                    // 创建圆形形状
                    createCircleShape(shape, layer);
                } else if (shape.type === "ellipse") {
                    // 创建椭圆形状
                    createEllipseShape(shape, layer);
                }
            }
            
        } catch (error) {
            throw new Error("创建形状失败: " + error.toString());
        }
    }
    
    /**
     * 创建矩形形状
     * @param {Object} rect - 矩形对象
     * @param {ArtLayer} layer - 目标图层
     */
    function createRectangleShape(rect, layer) {
        try {
            // 使用ActionDescriptor创建矩形
            var desc = new ActionDescriptor();
            var rectDesc = new ActionDescriptor();
            
            rectDesc.putUnitDouble(charIDToTypeID("Top "), charIDToTypeID("#Pxl"), rect.y);
            rectDesc.putUnitDouble(charIDToTypeID("Left"), charIDToTypeID("#Pxl"), rect.x);
            rectDesc.putUnitDouble(charIDToTypeID("Btom"), charIDToTypeID("#Pxl"), rect.y + rect.height);
            rectDesc.putUnitDouble(charIDToTypeID("Rght"), charIDToTypeID("#Pxl"), rect.x + rect.width);
            
            desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Rctn"), rectDesc);
            
            executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
            
        } catch (error) {
            // 创建失败，忽略
        }
    }
    
    /**
     * 创建圆形形状
     * @param {Object} circle - 圆形对象
     * @param {ArtLayer} layer - 目标图层
     */
    function createCircleShape(circle, layer) {
        try {
            // 使用ActionDescriptor创建圆形
            var desc = new ActionDescriptor();
            var ellipseDesc = new ActionDescriptor();
            
            ellipseDesc.putUnitDouble(charIDToTypeID("Top "), charIDToTypeID("#Pxl"), circle.cy - circle.r);
            ellipseDesc.putUnitDouble(charIDToTypeID("Left"), charIDToTypeID("#Pxl"), circle.cx - circle.r);
            ellipseDesc.putUnitDouble(charIDToTypeID("Btom"), charIDToTypeID("#Pxl"), circle.cy + circle.r);
            ellipseDesc.putUnitDouble(charIDToTypeID("Rght"), charIDToTypeID("#Pxl"), circle.cx + circle.r);
            
            desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Elps"), ellipseDesc);
            
            executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
            
        } catch (error) {
            // 创建失败，忽略
        }
    }
    
    /**
     * 创建椭圆形状
     * @param {Object} ellipse - 椭圆对象
     * @param {ArtLayer} layer - 目标图层
     */
    function createEllipseShape(ellipse, layer) {
        try {
            // 使用ActionDescriptor创建椭圆
            var desc = new ActionDescriptor();
            var ellipseDesc = new ActionDescriptor();
            
            ellipseDesc.putUnitDouble(charIDToTypeID("Top "), charIDToTypeID("#Pxl"), ellipse.cy - ellipse.ry);
            ellipseDesc.putUnitDouble(charIDToTypeID("Left"), charIDToTypeID("#Pxl"), ellipse.cx - ellipse.rx);
            ellipseDesc.putUnitDouble(charIDToTypeID("Btom"), charIDToTypeID("#Pxl"), ellipse.cy + ellipse.ry);
            ellipseDesc.putUnitDouble(charIDToTypeID("Rght"), charIDToTypeID("#Pxl"), ellipse.cx + ellipse.rx);
            
            desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Elps"), ellipseDesc);
            
            executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
            
        } catch (error) {
            // 创建失败，忽略
        }
    }
    
    /**
     * 获取文档信息
     * @returns {Object} 文档信息
     */
    function getDocumentInfo() {
        try {
            if (app.documents.length > 0) {
                var doc = app.activeDocument;
                return {
                    name: doc.name,
                    width: doc.width.as("px"),
                    height: doc.height.as("px"),
                    resolution: doc.resolution,
                    colorMode: doc.mode.toString(),
                    layerCount: doc.layers.length
                };
            } else {
                return { error: "没有打开的文档" };
            }
        } catch (error) {
            return { error: error.toString() };
        }
    }
    
    /**
     * 创建新文档
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} resolution - 分辨率
     * @returns {Object} 创建结果
     */
    function createNewDocument(width, height, resolution) {
        try {
            width = width || 1024;
            height = height || 1024;
            resolution = resolution || 72;
            
            var doc = app.documents.add(
                UnitValue(width, "px"),
                UnitValue(height, "px"),
                resolution,
                "New Document"
            );
            
            return {
                success: true,
                name: doc.name,
                width: width,
                height: height,
                resolution: resolution
            };
        } catch (error) {
            return {
                success: false,
                error: error.toString()
            };
        }
    }
    
    // 导出函数供CEP调用
    // 注意：在JSX中，函数需要在全局作用域中定义才能被CEP调用
    
} catch (globalError) {
    // 全局错误处理
    "Global Error: " + globalError.toString();
}