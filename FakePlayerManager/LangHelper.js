/* eslint-disable no-undef */
// Language Helper for FakePlayer Manageer
// Author xiaoqch
// Please use this plugin with https://github.com/ddf8196/FakePlayer

//LiteXLoader Dev Helper
/// <reference path="c:\Users\xiaoqch\.vscode\extensions\moxicat.lxldevhelper-0.1.3/Library/JS/Api.js" /> 

/**
 * 替换所有匹配exp的字符串为指定字符串
 * @param exp 被替换部分的正则
 * @param newStr 替换成的字符串
 */
String.prototype.replaceAll = function (exp, newStr) {
    return this.replace(new RegExp(exp, "gm"), newStr);
};

/**
 * 原型：字符串格式化
 * @param args 格式化参数值
 */
String.prototype.format = function (...args) {
    let result = this;
    if (arguments.length < 1) {
        return result;
    }

    let data = args; // 如果模板参数是数组
    if (arguments.length == 1 && typeof (args[0]) == "object") {
        // 如果模板参数是对象
        data = args[0];
    }

    for (let key in data) {
        let value = data[key];
        if (undefined != value) {
            result = result.replaceAll(`\\{${key}\\}`, value);
        }
    }
    return result;
}



class LangPack {
    defaultLang = 'zh_CN';
    constructor(dir, language = null) {
        let path = dir + `${language}.json`;
        if (!file.exists(path)) {
            path = dir + `${this.defaultLang}.json`;
        }
        if (!file.exists(path))
            throw new Error(`${path} not found`);
        let content = File.readFrom(path);

        if (!content)
            throw new Error(`${path} read error`);
        if (Settings.debugMode) debug(`Load LangPack: ${path}`);
        this.pack = JSON.parse(content);
        this.ready = true;
    }

    getRaw(key) {
        if (!this.ready) {
            logger.error("LangPack is not ready");
            if (Settings.debugMode) throw new Error("LangPack is not ready");
            return key;
        }
        if (!Object.prototype.hasOwnProperty.call(this.pack, key)) {
            logger.error("Key Not Found:" + key);
            if (Settings.debugMode) throw new Error("Key Not Found:" + key);
            return key;
        }
        return this.pack[key];
    }

    get(key, ...args) {
        if (!this.ready) {
            logger.error("LangPack is not ready");
            if (Settings.debugMode) throw new Error("LangPack is not ready");
            return key;
        }
        if (args.length > 0)
            return this.getRaw(key).format(...args);
        else
            return this.getRaw(key);
    }
}

//////////////////////////////////// Self Test ////////////////////////////////////

/**
 * sync all key from src to dest, if key not exist in dest, add it and use src translation
 * make suce keys of src is complete before call this function
 * @param {string} srcLang source language code
 * @param {string} destLang destination language code
 */
// eslint-disable-next-line no-unused-vars
function syncTo(srcLang, destLang) {
    if (!Settings.debugMode) {
        logger.error("syncTo is not allowed in release mode");
        return;
    }
    let srcFile = pathJoin(LanguageDir, `${srcLang}.json`);
    let srcContent = File.readFrom(srcFile);
    let srcJson = JSON.parse(srcContent);
    let destFile = pathJoin(LanguageDir, `${destLang}.json`);
    let destContent = File.readFrom(destFile);
    let destJson = JSON.parse(destContent);
    destContent = srcContent;
    for (let key in srcJson) {
        // "key" : "srcValue" -> "key" : "destValue"
        let reg = new RegExp(`"${key}"\\s*:\\s*".*"`, "gm");
        // logger.info(`reg: ${reg}`);
        if (destJson[key]) {
            destContent = destContent.replace(reg, `"${key}": ${JSON.stringify(`${destJson[key]}`)}`);
        }
    }
    File.writeTo(pathJoin(LanguageDir, `${destLang}_new.json`), destContent);
}

if (Settings.debugMode) {
    setTimeout(() => {
        logger.success("Start LangPack self check");
        let mainJsPath = `${PluginsDir}/FakePlayerManager.lxl.js`;
        let controllerJsPath = `${PluginDir}/FakePlayerController.js`;
        logger.info(`MainJsPath: ${mainJsPath}, ControllerJsPath: ${controllerJsPath}`);
        let mainJs = file.readFrom(mainJsPath);
        let controllerJs = file.readFrom(controllerJsPath);
        let trMethods = ['tr', 'trError', 'trInfo'];
        let reg = `(?<=[^\\w](${trMethods.join('|')})\\(\\s*['"])(.*?)(?=['"](\\s*,.*?)?\\s*\\))`;
        logger.info(`Reg: ${reg}`);
        mainJs.match(new RegExp(reg, 'g')).forEach(key => {
            if (key == '_key') return;
            try {
                logger.success(`${key}: ${tr(key)}`);
            } catch (e) {
                logger.error(`${key}: ${e.message}`);
                // 打印 key 所在行
                let line = mainJs.split(key)[0].split('\n').length;
                logger.error(`${key} line: ${line}`);
            }
        });
        controllerJs.match(new RegExp(reg, 'g')).forEach(key => {
            if (key == '_key') return;
            try {
                logger.success(`${key}: ${tr(key)}`);
            } catch (e) {
                logger.error(`${key}: ${e.message}`);
                // 打印 key 所在行
                let line = controllerJs.split(key)[0].split('\n').length;
                logger.error(`${key} line: ${line}`);
            }
        });

        // syncTo("zh_CN", "en_US");
    }, 0);
}

module.exports = { LangPack };
