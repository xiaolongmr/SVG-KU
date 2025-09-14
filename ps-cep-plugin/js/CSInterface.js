/**
 * Adobe CEP CSInterface JavaScript Library
 * 简化版本，包含核心功能
 */

(function() {
    'use strict';
    
    /**
     * CSInterface类 - CEP插件的核心接口
     */
    function CSInterface() {
        this.THEME_COLOR_CHANGED_EVENT = "com.adobe.csxs.events.ThemeColorChanged";
    }
    
    /**
     * 获取系统路径
     */
    CSInterface.prototype.getSystemPath = function(pathType) {
        var path = window.__adobe_cep__.getSystemPath(pathType);
        return path;
    };
    
    /**
     * 执行JSX脚本
     * @param {string} script - JSX脚本代码
     * @param {function} callback - 回调函数
     */
    CSInterface.prototype.evalScript = function(script, callback) {
        if (callback === null || callback === undefined) {
            callback = function(result) {
                // 默认回调
            };
        }
        
        window.__adobe_cep__.evalScript(script, callback);
    };
    
    /**
     * 获取宿主环境信息
     */
    CSInterface.prototype.getHostEnvironment = function() {
        var hostEnv = window.__adobe_cep__.getHostEnvironment();
        return JSON.parse(hostEnv);
    };
    
    /**
     * 获取扩展信息
     */
    CSInterface.prototype.getExtensions = function() {
        var extensionIDs = window.__adobe_cep__.getExtensions();
        return JSON.parse(extensionIDs);
    };
    
    /**
     * 获取扩展ID
     */
    CSInterface.prototype.getExtensionID = function() {
        return window.__adobe_cep__.getExtensionId();
    };
    
    /**
     * 请求打开扩展
     */
    CSInterface.prototype.requestOpenExtension = function(extensionId, params) {
        window.__adobe_cep__.requestOpenExtension(extensionId, params);
    };
    
    /**
     * 获取网络偏好设置
     */
    CSInterface.prototype.getNetworkPreferences = function() {
        var result = window.__adobe_cep__.getNetworkPreferences();
        return JSON.parse(result);
    };
    
    /**
     * 设置扩展窗口大小
     */
    CSInterface.prototype.resizeContent = function(width, height) {
        window.__adobe_cep__.resizeContent(width, height);
    };
    
    /**
     * 分发事件
     */
    CSInterface.prototype.dispatchEvent = function(event) {
        if (typeof event.data == "object") {
            event.data = JSON.stringify(event.data);
        }
        
        window.__adobe_cep__.dispatchEvent(event);
    };
    
    /**
     * 添加事件监听器
     */
    CSInterface.prototype.addEventListener = function(type, listener, obj) {
        window.__adobe_cep__.addEventListener(type, listener, obj);
    };
    
    /**
     * 移除事件监听器
     */
    CSInterface.prototype.removeEventListener = function(type, listener, obj) {
        window.__adobe_cep__.removeEventListener(type, listener, obj);
    };
    
    /**
     * 获取应用程序名称
     */
    CSInterface.prototype.getApplicationID = function() {
        var hostEnv = this.getHostEnvironment();
        return hostEnv.appName;
    };
    
    /**
     * 获取当前API版本
     */
    CSInterface.prototype.getCurrentApiVersion = function() {
        return JSON.parse(window.__adobe_cep__.getCurrentApiVersion());
    };
    
    /**
     * 设置窗口标题
     */
    CSInterface.prototype.setWindowTitle = function(title) {
        window.__adobe_cep__.invokeSync("setWindowTitle", title);
    };
    
    /**
     * 获取窗口标题
     */
    CSInterface.prototype.getWindowTitle = function() {
        return window.__adobe_cep__.invokeSync("getWindowTitle", "");
    };
    
    /**
     * 系统路径类型枚举
     */
    CSInterface.SystemPath = {
        USER_DATA: "userData",
        COMMON_FILES: "commonFiles",
        MY_DOCUMENTS: "myDocuments",
        APPLICATION: "application",
        EXTENSION: "extension",
        HOST_APPLICATION: "hostApplication"
    };
    
    /**
     * 颜色类型枚举
     */
    CSInterface.ColorType = {
        RGB: "rgb",
        GRADIENT: "gradient",
        NONE: "none"
    };
    
    /**
     * UI颜色类型枚举
     */
    CSInterface.UIColorType = {
        PANEL_BACKGROUND_COLOR: "panelBackgroundColor",
        PANEL_FOREGROUND_COLOR: "panelForegroundColor",
        LIGHT_ACCENT_COLOR: "lightAccentColor",
        DARK_ACCENT_COLOR: "darkAccentColor"
    };
    
    /**
     * 创建CSEvent对象
     */
    function CSEvent(type, scope, appId, extensionId) {
        this.type = type;
        this.scope = scope || "GLOBAL";
        this.appId = appId;
        this.extensionId = extensionId;
        this.data = "";
    }
    
    // 导出到全局
    window.CSInterface = CSInterface;
    window.CSEvent = CSEvent;
    
})();