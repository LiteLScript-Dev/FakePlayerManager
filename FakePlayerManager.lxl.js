
// /\*\*\n     \* (.*)\n     \*/
// /** $1 */

const VERSION = [1, 1, 1];
const IS_BETA = false;
const AUTHOR = "xiaoqch";
const VERSION_STRING = VERSION.join(".") + (IS_BETA ? " Beta" : "");
const PLUGIN_NAME = "FakePlayerManager";
const PLUGIN_DESCRIPTION_KEY = "plugin.description";
const GITHUB_URL = "https://github.com/LiteLScript-Dev/FakePlayerManager"
const CURRENT_CONFIG_VERSION = 1;

const PluginDir = `plugins/${PLUGIN_NAME}/`;
const LanguageDir = `${PluginDir}Language/`;
const LangHelperPath = `${PluginDir}LangHelper.js`;
const FakePlayerControllerPath = `${PluginDir}FakePlayerController.js`;
const _ConfigFile = `${PluginDir}config.json`;

const ENABLE_CHAT_CONTROL = false;

logger.setTitle(PLUGIN_NAME);

// 颜色转换映射表
const colorMap = {
    "§0": "\x1b[38;2;000;000;000m", //BLACK
    "§1": "\x1b[38;2;000;000;170m", //DARK_BLUE
    "§2": "\x1b[38;2;000;170;000m", //DARK_GREEN
    "§3": "\x1b[38;2;000;170;170m", //DARK_AQUA
    "§4": "\x1b[38;2;170;000;000m", //DARK_RED
    "§5": "\x1b[38;2;170;000;170m", //DARK_PURPLE
    "§6": "\x1b[38;2;255;170;000m", //GOLD
    "§7": "\x1b[38;2;170;170;170m", //GRAY
    "§8": "\x1b[38;2;085;085;085m", //DARK_GRAY
    "§9": "\x1b[38;2;085;085;255m", //BLUE
    "§a": "\x1b[38;2;085;255;085m", //GREEN
    "§b": "\x1b[38;2;085;255;255m", //AQUA
    "§c": "\x1b[38;2;255;085;085m", //RED
    "§d": "\x1b[38;2;255;085;255m", //LIGHT_PURPLE
    "§e": "\x1b[38;2;255;255;085m", //YELLOW
    "§f": "\x1b[38;2;255;255;255m", //WHITE
    "§g": "\x1b[38;2;221;214;005m", //MINECOIN_GOLD
    // "§": "",                     //ESCAPE
    "§l": "\x1b[1m",                //BOLD
    "§o": "\x1b[3m",                //ITALIC
    "§k": "",                       //OBFUSCATED
    "§r": "\x1b[0m",                //RESET
    "": "",                         //NULL
}

const Color = {
    get BLACK() {
        return Settings.color ? "§0" : "";
    },
    get DARK_BLUE() {
        return Settings.color ? "§1" : "";
    },
    get DARK_GREEN() {
        return Settings.color ? "§2" : "";
    },
    get DARK_AQUA() {
        return Settings.color ? "§3" : "";
    },
    get DARK_RED() {
        return Settings.color ? "§4" : "";
    },
    get DARK_PURPLE() {
        return Settings.color ? "§5" : "";
    },
    get GOLD() {
        return Settings.color ? "§6" : "";
    },
    get GRAY() {
        return Settings.color ? "§7" : "";
    },
    get DARK_GRAY() {
        return Settings.color ? "§8" : "";
    },
    get BLUE() {
        return Settings.color ? "§9" : "";
    },
    get GREEN() {
        return Settings.color ? "§a" : "";
    },
    get AQUA() {
        return Settings.color ? "§b" : "";
    },
    get RED() {
        return Settings.color ? "§c" : "";
    },
    get LIGHT_PURPLE() {
        return Settings.color ? "§d" : "";
    },
    get YELLOW() {
        return Settings.color ? "§e" : "";
    },
    get WHITE() {
        return Settings.color ? "§f" : "";
    },
    get MINECOIN_GOLD() {
        return Settings.color ? "§g" : "";
    },
    get BOLD() {
        return Settings.color ? "§l" : "";
    },
    get ITALIC() {
        return Settings.color ? "§o" : "";
    },
    get OBFUSCATED() {
        return Settings.color ? "§k" : "";
    },
    get RESET() {
        return Settings.color ? "§r" : "";
    },
    toConsoleColor(color) {
        return colorMap[color];
    },
    transformToConsole(str) {
        return str.replace(/§[0-9a-zA-Z]/g, (match) => {
            return Settings.consoleColor ? colorMap[match] : "";
        });
    },
    black(str) {
        return `${this.BLACK}${str}${this.RESET}`;
    },
    darkBlue(str) {
        return `${this.DARK_BLUE}${str}${this.RESET}`;
    },
    darkGreen(str) {
        return `${this.DARK_GREEN}${str}${this.RESET}`;
    },
    darkAqua(str) {
        return `${this.DARK_AQUA}${str}${this.RESET}`;
    },
    darkRed(str) {
        return `${this.DARK_RED}${str}${this.RESET}`;
    },
    darkPurple(str) {
        return `${this.DARK_PURPLE}${str}${this.RESET}`;
    },
    gold(str) {
        return `${this.GOLD}${str}${this.RESET}`;
    },
    gray(str) {
        return `${this.GRAY}${str}${this.RESET}`;
    },
    darkGray(str) {
        return `${this.DARK_GRAY}${str}${this.RESET}`;
    },
    blue(str) {
        return `${this.BLUE}${str}${this.RESET}`;
    },
    green(str) {
        return `${this.GREEN}${str}${this.RESET}`;
    },
    aqua(str) {
        return `${this.AQUA}${str}${this.RESET}`;
    },
    red(str) {
        return `${this.RED}${str}${this.RESET}`;
    },
    lightPurple(str) {
        return `${this.LIGHT_PURPLE}${str}${this.RESET}`;
    },
    yellow(str) {
        return `${this.YELLOW}${str}${this.RESET}`;
    },
    white(str) {
        return `${this.WHITE}${str}${this.RESET}`;
    },
    minecoinGold(str) {
        return `${this.MINECOIN_GOLD}${str}${this.RESET}`;
    },
    bold(str) {
        return `${this.BOLD}${str}${this.RESET}`;
    },
    italic(str) {
        return `${this.ITALIC}${str}${this.RESET}`;
    },
    obfuscated(str) {
        return `${this.OBFUSCATED}${str}${this.RESET}`;
    },
    reset(str) {
        return `${this.RESET}${str}${this.RESET}`;
    },
};

// 全局设置
var Settings = {
    /**
     * @type {Integer} 配置文件版本
     */
    configVersion: 0,
    /** @type {String} WebSocket服务器地址 */
    wsurl: "ws://localhost",
    /**
     * @type {Number} WebSocket服务器端口
     */
    port: 54321,
    /**
     * @type {Boolean} 是否允许管理员移除所有假人
     */
    allowRemoveAll: false,
    /**
     * @type {String} 默认的GUI界面
     */
    defaultGui: "menu",
    /**
     * @type {String} 默认的语言
     */
    language: "zh_CN",
    /**
     * @type {Number} 默认权限等级
     */
    permissionLevel: 1,
    /**
     * @type {Boolean} 是否启用调试模式
     */
    debugMode: IS_BETA,
    /**
     * @type {Boolean} 是否启用颜色
     */
    color: true,
    /**
     * @type {Boolean} 是否启用控制台颜色
     */
    consoleColor: true,
}
/**
 * @type {Conf} 配置文件
 */
let conf = data.openConfig(_ConfigFile, 'json', JSON.stringify(Settings, null, 4));
let needUpdate = false;
for (let key in Settings) {
    let val = conf.get(key, undefined);
    if (val !== undefined) {
        Settings[key] = val;
    } else {
        logger.warn(`[Settings] "${key}" is not defined, use default value "${Settings[key]}".`);
        needUpdate = true;
    }
}
// 配置文件兼容更新处理
if (Settings.configVersion != CURRENT_CONFIG_VERSION || needUpdate) {
    if (Settings.configVersion == CURRENT_CONFIG_VERSION)
        logger.info("Update config file because missing some settings.");
    else
        logger.info(`Update config file from version ${Settings.configVersion} to ${CURRENT_CONFIG_VERSION}.`);
    switch (Settings.configVersion) {
        case 0: // 1.0.0
            /**
             * @type {Map<String, String>} 语言代码兼容表
             */
            const langCodeCompatible = {
                'cn': 'zh_CN',
                'en': 'en_US',
            }
            Settings.language = langCodeCompatible[Settings.language] ?? Settings.language;
            file.delete(`${PluginDir}lang.json`);
        default:
            break;
    }

    Settings.configVersion = CURRENT_CONFIG_VERSION;
    for (let key in Settings) {
        conf.set(key, Settings[key]);
    }

    conf.write(JSON.stringify(Settings, null, 4));
}
conf.close();

debug(`Settings: ${JSON.stringify(Settings)}`);


///////////////////////////////////// Global /////////////////////////////////////
const { LangPack } = require(LangHelperPath);

var Global = {
    /**
     * @type {LangPack} 语言包
     */
    langPack: new LangPack(LanguageDir, Settings.language),
    /**
     * @type {FakePlayerManager} 模拟玩家管理器
     */
    fpm: null,
    /**
     * @type {FakePlayerWebSocketController} 模拟玩家控制器
     */
    fpc: null,
};

const { FakePlayerWebSocketController, FakePlayerManager, FakePlayer} = require(FakePlayerControllerPath);

//////////////////////////////////// Translations ////////////////////////////////////
// 额外的函数以防止传回来值类型变成Object(未知原因)
function tr(_key, ..._args) {
    let rtn = Global.langPack.get(...arguments);
    if (typeof (rtn) != "string") {
        return rtn.toString();
    } else {
        return rtn;
    }
}
function debug(msg) {
    if (Settings.debugMode) {
        logger.warn(msg);
    }
}
function trError(_key, ..._args) {
    logger.error(Color.transformToConsole(tr(...arguments)));
}
function trInfo(_key, ..._args) {
    logger.info(Color.transformToConsole(tr(...arguments)));
}

function yellowExclude(str, chr = '/'){
    return str.split(chr).map(s=>Color.yellow(s)).join(chr);
}

const fpmHelpText = `
${Color.gold(`------${tr("help.fpm.title")}------`)}
${Color.green("fpg")} - ${Color.lightPurple(tr("help.fpg"))}
${Color.green("fpm")} ${yellowExclude("?/h/help")} - ${Color.lightPurple(tr("help.fpm.help"))}
${Color.green("fpg")} ${yellowExclude("h")} - ${Color.lightPurple(tr("help.fpg.help"))}
${Color.green("fpm")} ${yellowExclude("l/list")} - ${Color.lightPurple(tr("help.fpm.list"))}
${Color.green("fpm")} ${yellowExclude("a/add")} name [allowControl] [skin] - ${Color.lightPurple(tr("help.fpm.add"))}
${Color.green("fpm")} ${yellowExclude("r/remove")} name - ${Color.lightPurple(tr("help.fpm.remove"))}
${Color.green("fpm")} ${yellowExclude("s/state")} name - ${Color.lightPurple(tr("help.fpm.state"))}
${Color.green("fpm")} ${yellowExclude("ls/listState")} - ${Color.lightPurple(tr("help.fpm.listState"))}
${Color.green("fpm")} ${yellowExclude("c/connect")} name - ${Color.lightPurple(tr("help.fpm.connect"))}
${Color.green("fpm")} ${yellowExclude("d/disconnect")} name - ${Color.lightPurple(tr("help.fpm.disconnect"))}
${Color.green("fpm")} ${yellowExclude("ra/removeAll")} - ${Color.lightPurple(tr("help.fpm.removeAll"))}
${Color.green("fpm")} ${yellowExclude("ca/connectAll")} - ${Color.lightPurple(tr("help.fpm.connectAll"))}
${Color.green("fpm")} ${yellowExclude("da/disconnectAll")} - ${Color.lightPurple(tr("help.fpm.disconnectAll"))}
${Color.green("fpm")} ${yellowExclude("sc/setControl")} [name] [true/false] - ${Color.lightPurple(tr("help.fpm.setControl"))}
`

const fpgHelpText = `${Color.green("fpg")} - ${Color.lightPurple(tr("help.fpg"))}
${Color.green("fpg")} ${yellowExclude("h/help")} - ${Color.lightPurple(tr("help.fpg.help"))}
${Color.green("fpg")} ${yellowExclude("l/list")} - ${Color.lightPurple(tr("help.fpg.list"))}
${Color.green("fpg")} ${yellowExclude("q/quick")} - ${Color.lightPurple(tr("help.fpg.quick"))}
${Color.green("fpg")} ${yellowExclude("m/menu")} - ${Color.lightPurple(tr("help.fpg.menu"))}
${Color.green("fpg")} ${yellowExclude("a/agent")} - ${Color.lightPurple(tr("help.fpg.agent"))}
`


mc.listen("onServerStarted", function () {
    setTimeout(() => {
        Global.fpc = new FakePlayerWebSocketController(Settings.wsurl, Settings.port);
        Global.fpm = new FakePlayerManager(Global.fpc);
        fpm = Global.fpm;
        fpc = Global.fpc;
    }, 100);
});

//////////////////////////////// Command ////////////////////////////////
let fpm = Global.fpm;
let fpc = Global.fpc;

function sendHelpForm(player) {
    let helpForm = mc.newSimpleForm();
    helpForm.setTitle(tr('help.fpg.title') + ' - ' + VERSION_STRING);
    helpForm.setContent(fpgHelpText);
    player.sendForm(helpForm, _ => { });
}

function openGUI(player, formType) {
    switch (formType.toLowerCase()) {
        case 'h':
        case 'help':
        case '?':
            error = sendHelpForm(player);
            break;
        case 'q':
        case 'quick':
            error = fpm.sendQuickForm(player);
            break
        case 'l':
        case 'list':
            error = fpm.sendListForm(player);
            break
        case 'm':
        case 'menu':
            error = fpm.sendMenuForm(player);
            break
        case 'ct':
        case 'control':
            error = fpm.sendControlForm(player);
            break
        case 'a':
        case 'agent':
            error = fpm.sendAgentForm(player);
            break
        case 'add':
            error = fpm.sendAddForm(player);
            break
        case 't':
        case 'teleport':
            error = fpm.sendTeleportForm(player);
            break
        default:
            error = fpm.sendMenuForm(player);
    }
    return error;
}

mc.regPlayerCmd('fpg', tr('command.fpg.description'), function (player, args) {
    let formType = args[0] ?? Settings.defaultGui
    let error = openGUI(player, formType);
    if (error) {
        player.tell(error);
    }
}, Settings.permissionLevel);

function logResponse(response, plName) {
    let str = fpc.getResponseStr(response);
    let pl = plName ? mc.getPlayer(plName) : null;
    if (pl) {
        pl.tell(str);
    } else {
        Color.transformToConsole(str).split('\n').forEach(s => logger.info(s));
    }
}

function handleCmd(args, player = null) {
    let plName = player ? player.name : null
    switch (args[0]) {
        case 'l':
        case 'list':
            fpm.controller.list(callback = response => logResponse(response, plName));
            break;
        case 'a':
        case 'add':
            let fp = new FakePlayer(fpc, args[1]);
            // fp.controller=fpc;
            // fp.name=args[1];
            if (args.hasOwnProperty(2)) fp.allowChatControl = args[2];
            if (args.hasOwnProperty(3)) fp.skin = args[3];
            fp.add(response => logResponse(response, plName));
            // if (player) tpQuery[args[1]] = player.pos;
            break;
        case 'r':
        case 'remove':
            fpm.controller.remove(args[1], callback = response => logResponse(response, plName));
            break;
        case 's':
        case 'state':
            fpm.controller.getState(args[1], callback = response => logResponse(response, plName));
            break;
        case 'sa':
        case 'stateAll':
        case 'ls':
        case 'listState':
            fpm.controller.getAllState(callback = response => logResponse(response, plName));
            break;
        case 'd':
        case 'disconnect':
            fpm.controller.disconnect(args[1], callback = response => logResponse(response, plName));
            break;
        case 'c':
        case 'connect':
            fpm.controller.connect(args[1], callback = response => logResponse(response, plName));
            break;
        case 'ra':
        case 'removeAll':
            if (allowRemoveAll)
                fpm.controller.removeAll(callback = response => logResponse(response, plName));
            else {
                let msg = tr('command.remove.disable');
                if (player) player.tell(msg);
                else logger.info(msg);
            }
            break;
        case 'ca':
        case 'connectAll':
            fpm.controller.connectAll(callback = response => logResponse(response, plName));
            break;
        case 'da':
        case 'disconnectAll':
            fpm.controller.disconnectAll(callback = response => logResponse(response, plName));
            break;
        case 'sc':
        case 'setControl':
            fpm.controller.setChatControl(args[1], args[2], callback = response => logResponse(response, plName));
            break;
        case '?':
        case 'h':
        case 'help':
            if (player) player.tell(fpmHelpText);
            else Color.transformToConsole(fpmHelpText).split('\n').forEach(s => logger.info(s));
            break;
        case 'g':
        case 'gui':
            if (player) {
                let error = openGUI(player, Settings.defaultGui);
                if (error) player.tell(error);
            }
            else trError('command.only_player');
            break;
        default:
            let msg = tr('command.unknown');
            if (player) player.tell(msg);
            else logger.error(msg);
    }
}

mc.regPlayerCmd('fpm', tr('command.fpm.description'), function (player, args) {
    handleCmd(args, player);
}, Settings.permissionLevel);

mc.regConsoleCmd('fpm', tr('command.fpm.description'), function (args) {
    handleCmd(args);
});

///////////////////////////////////// Test //////////////////////////////////////
if (Settings.debugMode) {
    logger.warn('Debug mode is on. Please use this mode only for testing.');
    // 测试所有语言的本地化键名一致
    let langKeys = {};
    file.getFilesList(LanguageDir).forEach(fileName => {
        let content = JSON.parse(file.readFrom(LanguageDir + fileName));
        langKeys[fileName.replace('.json', '')] = new Set(Object.keys(content));
    });
    let allKeys = new Set();
    for (let key in langKeys) {
        langKeys[key].forEach(key => allKeys.add(key));
    }
    for (let lang in langKeys) {
        let missingKeys = [];
        for (let key of allKeys) {
            if (!langKeys[lang].has(key)) {
                missingKeys.push(key);
            }
        }
        if (missingKeys.length > 0) {
            logger.error('Language file ' + lang + ' is missing keys: ' + missingKeys.join(', '));
        } else {
            logger.info(Color.transformToConsole(`${Color.GREEN}Language file ${lang} is complete.${Color.RESET}`));
        }
    }
}

//////////////////////////////////// Finished ////////////////////////////////////

ll.registerPlugin(PLUGIN_NAME, tr(PLUGIN_DESCRIPTION_KEY), VERSION,
    {
        "Author": AUTHOR,
        "Github": GITHUB_URL,
    });
    
trInfo('plugin.loaded', `${Color.GREEN}${PLUGIN_NAME}${Color.RESET}`, VERSION_STRING, AUTHOR);
