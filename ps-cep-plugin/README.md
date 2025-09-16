# 飞草科技图标库 - CEP插件

这是一个为Adobe Photoshop开发的CEP（Common Extensibility Platform）插件，提供丰富的图标资源和便捷的图标管理功能。

## 功能特性

### 🎨 **核心功能**
- **图标浏览**：浏览数千个高质量图标
- **分类筛选**：按线性、面性、精美、手绘、扁平、简约等分类筛选
- **搜索功能**：快速搜索所需图标
- **颜色编辑**：实时调整图标颜色（填充色和描边色）
- **PS集成**：直接发送图标到Photoshop图层
- **PNG复制**：复制图标为PNG格式到剪贴板

### 🚀 **技术优势**
- **无网络限制**：CEP插件可以直接访问CDN资源，无CORS限制
- **完整PS集成**：使用JSX脚本实现完整的Photoshop操作
- **智能对象支持**：支持将SVG导入为智能对象
- **批量操作**：支持批量发送多个图标到PS
- **颜色保持**：确保发送到PS的图标保持编辑后的颜色

## 安装方法

### 方法一：手动安装

1. **复制插件文件**
   ```
   将整个 ps-cep-plugin 文件夹复制到以下目录：
   
   Windows:
   C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\
   
   macOS:
   /Library/Application Support/Adobe/CEP/extensions/
   ```

2. **启用调试模式**
   
   **Windows:**
   - 打开注册表编辑器（regedit）
   - 导航到：`HKEY_CURRENT_USER\Software\Adobe\CSXS.9`
   - 创建字符串值：`PlayerDebugMode`，值为：`1`
   
   **macOS:**
   ```bash
   defaults write com.adobe.CSXS.9 PlayerDebugMode 1
   ```

3. **重启Photoshop**
   - 完全关闭Photoshop
   - 重新启动Photoshop
   - 在菜单栏选择：窗口 > 扩展功能 > 飞草科技图标库

### 方法二：开发者安装

1. **安装Adobe Extension Manager**
2. **打包插件**
   ```bash
   # 使用Adobe的打包工具
   ZXPSignCmd -sign ps-cep-plugin ps-cep-plugin.zxp certificate.p12 password
   ```
3. **通过Extension Manager安装**

## 使用指南

### 基础操作

1. **浏览图标**
   - 插件启动后会自动加载图标库
   - 使用分类按钮筛选不同类型的图标
   - 在搜索框中输入关键词快速查找

2. **选择图标**
   - 单击图标进行单选
   - Ctrl+点击进行多选
   - 选中的图标会高亮显示

3. **编辑颜色**
   - 选择图标后，颜色编辑器会自动显示
   - 调整填充色和描边色
   - 使用随机颜色或重置为默认颜色

4. **发送到PS**
   - 选择图标后点击"发送到图层"按钮
   - 图标会作为新图层添加到当前文档
   - 支持批量发送多个图标

5. **复制PNG**
   - 选择图标后点击"复制PNG"按钮
   - PNG图片会复制到系统剪贴板
   - 可直接粘贴到其他应用程序

### 快捷键

- `Ctrl+C`：复制选中图标为PNG
- `Enter`：发送选中图标到PS图层
- `Escape`：清除所有选择

### 高级功能

1. **智能对象导入**
   - 插件会尝试将SVG导入为智能对象
   - 保持矢量特性，支持无损缩放
   - 如果失败会自动降级为普通图层

2. **颜色信息保持**
   - 在插件中编辑的颜色会完整传递到PS
   - SVG代码中会嵌入颜色信息
   - 确保PS中显示效果与插件预览一致

3. **批量处理**
   - 支持同时选择多个图标
   - 批量发送时会显示进度和结果统计
   - 失败的图标会有详细错误信息

## 技术架构

### 文件结构
```
ps-cep-plugin/
├── CSXS/
│   └── manifest.xml          # CEP插件配置文件
├── css/
│   └── styles.css           # 样式文件
├── js/
│   ├── CSInterface.js       # CEP接口库
│   ├── icon-loader.js       # 图标加载器
│   ├── color-manager.js     # 颜色管理器
│   ├── ps-interface.js      # PS接口模块
│   └── main.js             # 主应用逻辑
├── jsx/
│   └── ps-scripts.jsx      # PS脚本文件
├── icons/
│   ├── icon-normal.png     # 插件图标
│   └── ...                 # 其他图标文件
├── index.html              # 主界面
└── README.md              # 说明文档
```

### 核心模块

1. **图标加载器（icon-loader.js）**
   - 从CDN加载图标数据
   - 解析SVG symbols
   - 提供搜索和筛选功能

2. **颜色管理器（color-manager.js）**
   - 管理图标颜色编辑
   - 实时预览颜色变化
   - 生成带颜色的SVG代码

3. **PS接口模块（ps-interface.js）**
   - 与Photoshop交互
   - 执行JSX脚本
   - 处理图层创建和SVG导入

4. **主应用逻辑（main.js）**
   - 整合所有功能模块
   - 处理用户交互
   - 管理应用状态

## 故障排除

### 常见问题

1. **插件不显示**
   - 检查是否启用了调试模式
   - 确认插件文件夹位置正确
   - 重启Photoshop

2. **图标加载失败**
   - 检查网络连接
   - 确认防火墙设置
   - 查看浏览器控制台错误信息

3. **发送到PS失败**
   - 确保Photoshop文档已打开
   - 检查PS版本兼容性（支持PS 2021+）
   - 查看错误提示信息

4. **颜色显示不正确**
   - 检查SVG代码中的颜色属性
   - 确认颜色格式正确（十六进制）
   - 重置颜色后重试

### 调试方法

1. **启用开发者工具**
   - 右键插件面板选择"调试"
   - 使用Chrome开发者工具调试

2. **查看控制台日志**
   - 检查JavaScript错误
   - 查看网络请求状态
   - 分析性能问题

3. **JSX脚本调试**
   - 使用Photoshop的ExtendScript Toolkit
   - 在JSX代码中添加调试信息
   - 检查PS脚本执行结果

## 开发说明

### 环境要求
- Adobe Photoshop 2021+
- CEP 9.0+
- 现代浏览器内核

### 开发工具
- Adobe Extension Builder
- Chrome开发者工具
- ExtendScript Toolkit

### 自定义开发

1. **添加新功能**
   - 在对应模块中添加功能代码
   - 更新主应用逻辑
   - 测试功能完整性

2. **修改界面**
   - 编辑HTML结构
   - 调整CSS样式
   - 确保响应式布局

3. **扩展PS功能**
   - 在jsx文件中添加新的PS操作
   - 通过CSInterface调用JSX函数
   - 处理错误和异常情况

## 版本历史

### v1.0.0
- 初始版本发布
- 基础图标浏览和搜索功能
- 颜色编辑功能
- PS图层发送功能
- PNG复制功能

## 许可证

本插件遵循MIT许可证。详见LICENSE文件。

## 支持与反馈

如有问题或建议，请联系：
- 邮箱：support@feicao.tech
- 官网：https://feicao.tech

---

**飞草科技图标库CEP插件** - 让设计更高效！