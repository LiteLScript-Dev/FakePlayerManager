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
String.prototype.format = function (args) {
    let result = this;
    if (arguments.length < 1) {
        return result;
    }

    let data = arguments; // 如果模板参数是数组
    if (arguments.length == 1 && typeof (args) == "object") {
        // 如果模板参数是对象
        data = args;
    }
    for (let key in data) {
        let value = data[key];
        if (undefined != value) {
            result = result.replaceAll("\\{" + key + "\\}", value);
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
        debug(`Load LangPack: ${path}`);
        this.pack = JSON.parse(content);
        this.ready = true;
    }

    getRaw(key) {
        if (!this.ready) {
            logger.error("LangPack is not ready");
            return key;
        }
        if (!this.pack.hasOwnProperty(key)) {
            logger.error("Key Not Found:" + key);
            return key;
        }
        return this.pack[key];
    }

    get(key, args) {
        if (!this.ready) {
            logger.error("LangPack is not ready");
            return key;
        }
        if (arguments.length > 2) {
            let temp = new Array(arguments.length - 1);
            for (var i = 0; i < temp.length; ++i) {
                temp[i] = arguments[i + 1];
            }
            return this.getRaw(key).format(...temp);
        }
        else if (arguments.length = 1)
            return this.getRaw(key).format(args);
        else
            return this.getRaw(key);
    }
}


module.exports
exports.LangPack = LangPack