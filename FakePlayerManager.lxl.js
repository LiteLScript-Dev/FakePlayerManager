"use strict";

const Settings = {
    configVersion: 0,                       // 配置版本
    Common: {                               // 公共配置
        debugMode: false,                   // 是否开启调试模式
        color: true,                        // 是否开启颜色显示
        consoleColor: true,                 // 是否开启控制台颜色显示
        autoCheckUpdate: true,              // 是否自动检查更新
    },
    command: {                              // 命令配置
        FakePlayerManager: {                // 假人管理命令
            enabled: true,                  // 是否启用
            permission: 1,                  // 权限等级
            alias: "fpm",                   // 别名
        },
        FakePlayerGUI: {                    // 图形界面命令
            enabled: true,                  // 是否启用
            permission: 1,                  // 权限等级
            alias: "fpg",                   // 别名
        },
        FakePlayerControl: {                // 控制命令
            enabled: true,                  // 是否启用
            permission: 1,                  // 权限等级
            alias: "fpc",                   // 别名
        },
    },
    manager: {                              // 假人管理配置
        default: "LLFakePlayer",            // 默认假人类型
        LLFakePlayer: {                     // LLFakePlayer 配置(https://github.com/xiaoqch/LLFakePlayer)
            enabled: true,                  // 是否启用
        },
        ClientFakePlayer: {                 // ClientFakePlayer配置(https://github.com/ddf8196/FakePlayer)
            enabled: true,                  // 是否启用
            wsUrl: "ws://127.0.0.1:54321/", // websocket地址
            autoWhitelist: true,            // 是否自动白名单
        },
        BDSFakePlayer: {                    // BDSFakePlayer配置(gametest SimulatedPlayer)
            enabled: false,                 // 是否启用
        },
    },
}

class Version {
    /**
     * @param {string} version
     */
    constructor(version) {
        this.version = version;
        this.versionArray = version.split(".");
    }
    match(version) {
        let versionArray = version.split(".");
        for (let i = 0; i < this.versionArray.length; i++) {
            if (this.versionArray[i] != versionArray[i]) {
                return false;
            }
        }
        return true;
    }
    lessThan(version) {
        let versionArray = version.split(".");
        for (let i = 0; i < this.versionArray.length; i++) {
            if (this.versionArray[i] < versionArray[i]) {
                return true;
            } else if (this.versionArray[i] > versionArray[i]) {
                return false;
            }
        }
        return false;
    }
}

const PluginData = {
    /** 最后更新时间
     * @example
     * {aaa:123,bbb:456}
     */
    lastUpdateTime: {},
    /** 最后打开假人管理界面的版本号
     * @example
     * {"123412421":"1.2.3"}
     */
    lastOpenVersion: {},
}
const VERSION = [1, 3, 0];
const IS_BETA = false;
const AUTHOR = "xiaoqch";
const VERSION_STRING = VERSION.join(".") + (IS_BETA ? " Beta" : "");
const PLUGIN_NAME = "FakePlayerManager";
const PLUGIN_DESCRIPTION_KEY = "plugin.description";
const GITHUB_URL = "https://github.com/LiteLScript-Dev/FakePlayerManager"
const CURRENT_CONFIG_VERSION = 1;
const MINE_BBS_RESOURCE_ID = 2945;
const LOG_TITLE = PLUGIN_NAME.split("").map(c => c == c.toUpperCase() ? c : undefined).join("");
const DEBUG = Settings.Common.debugMode;
logger.setTitle(`${LOG_TITLE}${DEBUG ? " DEV" : ""}`)

let ServerStarted = false;
setTimeout(() => {
    ServerStarted = true;
}, 100);

function __debugbreak(time = 5000) {
    const stack = new Error("DebugBreak").stack.split("\n").filter((_, index) => index != 1).join("\n");
    logger.error(stack);
    const start = new Date();
    while (new Date() - start < time) { }
}

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function getCallerLine(skip = 0) {
    logger.setTitle("");
    const err = new Error();
    const stack = err.stack.split("\n");
    const line = stack[skip + 2];
    if (!line) return;
    let index = line.indexOf("plugins") + 8;
    if (index < 0) index = line.indexOf("at ") + 3;
    let end = line.indexOf(")", index);
    if (end < 0) end = line.length;
    return line.substring(index, end);
}

if (true) {
    const skip = 1;
    const oriLogger = {};
    Reflect.ownKeys(logger).forEach(key => Reflect.set(oriLogger, key, logger[key]));
    logger.debug = (...args) => oriLogger.debug(`\b\b[${getCallerLine(skip)}] `, ...args);
    logger.info = (...args) => oriLogger.info(`\b[${getCallerLine(skip)}] `, ...args);
    logger.warn = (...args) => oriLogger.warn(`\b[${getCallerLine(skip)}] `, ...args);
    logger.error = (...args) => oriLogger.error(`\b\b[${getCallerLine(skip)}] `, ...args);
}


// 颜色映射表
const ColorMap = {
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
    console: false,
    get BLACK() {
        return Settings.Common.color ? "§0" : "";
    },
    get DARK_BLUE() {
        return Settings.Common.color ? "§1" : "";
    },
    get DARK_GREEN() {
        return Settings.Common.color ? "§2" : "";
    },
    get DARK_AQUA() {
        return Settings.Common.color ? "§3" : "";
    },
    get DARK_RED() {
        return Settings.Common.color ? "§4" : "";
    },
    get DARK_PURPLE() {
        return Settings.Common.color ? "§5" : "";
    },
    get GOLD() {
        return Settings.Common.color ? "§6" : "";
    },
    get GRAY() {
        return Settings.Common.color ? "§7" : "";
    },
    get DARK_GRAY() {
        return Settings.Common.color ? "§8" : "";
    },
    get BLUE() {
        return Settings.Common.color ? "§9" : "";
    },
    get GREEN() {
        return Settings.Common.color ? "§a" : "";
    },
    get AQUA() {
        return Settings.Common.color ? "§b" : "";
    },
    get RED() {
        return Settings.Common.color ? "§c" : "";
    },
    get LIGHT_PURPLE() {
        return Settings.Common.color ? "§d" : "";
    },
    get YELLOW() {
        return Settings.Common.color ? "§e" : "";
    },
    get WHITE() {
        return Settings.Common.color ? "§f" : "";
    },
    get MINECOIN_GOLD() {
        return Settings.Common.color ? "§g" : "";
    },
    get BOLD() {
        return Settings.Common.color ? "§l" : "";
    },
    get ITALIC() {
        return Settings.Common.color ? "§o" : "";
    },
    get OBFUSCATED() {
        return Settings.Common.color ? "§k" : "";
    },
    get RESET() {
        return Settings.Common.color ? "§r" : "";
    },
    toConsoleCode(color) {
        return ColorMap[color];
    },
    toConsole(str) {
        return str.replace(/§[0-9a-zA-Z]/g, (match) => {
            return Settings.Common.consoleColor ? ColorMap[match] : "";
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
let ConsoleColor = Object.assign({}, Color);
Reflect.ownKeys(Color).forEach((key) => {
    if (typeof Color[key] === "string") {
        Reflect.defineProperty(ConsoleColor, key, {
            value: ColorMap[Color[key]],
            enumerable: true,
        });
        if (DEBUG) logger.info(`${ConsoleColor[key]}${key}${ColorMap[Color.RESET]}`);
    }
});


/**
 *
 * @param  {...string} args
 * @returns
 */
function tr(...args) {
    args[0] = args[0].split(".").pop();
    args[0] = `_${args[0]}`.replace(/[_.]\w/g, (match) => {
        return ` ${match.slice(1).toUpperCase()}`;
    });
    return args.join(" ").substring(1);
}
const debug = logger.info;
const trInfo = (...args) => logger.info(tr(...args));
const trError = (...args) => logger.error(tr(...args));

function logError(msg, e, player) {
    try {
        let errorMessage = null;
        let stack = null;
        if (e instanceof Object) {
            if (e.message) errorMessage = e.message;
            if (e.stack) stack = e.stack;
            if (DEBUG) stack = Error.getFixedStack(stack);
        } else if (typeof (e) == "string") {
            errorMessage = e;
        } else if (typeof (e) === "undefined") {
            errorMessage = null;
        } else {
            errorMessage = JSON.stringify(e);
        }
        if (player) {
            if (typeof player == "string")
                player = mc.getPlayer(player);
            if (player)
                player.tell(`${Color.RED}${msg}: ${errorMessage ?? ""}${Color.RESET}`);
        }
        logger.error(`${msg}: ${errorMessage ?? ""}`);
        if (stack) {
            logger.error(stack);
        }
    } catch (e) {
        logger.error(`[logError] ${e.message}`);
        logger.error(`[logError] ${e.stack}`);
    }
}


// ============================== Fake Command ==============================

if (!mc.newCommand) {
    class ParamType {
        static Bool = "Bool";           //bool
        static Int = "Int";             //int
        static Float = "Float";         //float
        static String = "String";       //std::string
        static Actor = "Actor";         //CommandSelector<Actor>
        static Player = "Player";       //CommandSelector<Player>
        static BlockPos = "BlockPos";   //CommandPosition
        static Vec3 = "Vec3";           //CommandPositionFloat
        static RawText = "RawText";     //CommandRawText
        static Message = "Message";     //CommandMessage
        static JsonValue = "JsonValue"; //Json::Value
        static Item = "Item";           //CommandItem
        static Block = "Block";         //Block const*
        static Effect = "Effect";       //MobEffect const*
        static Enum = "Enum";           //ENUM
        static SoftEnum = "SoftEnum";   //SOFT_ENUM
        static ActorType = "ActorType"; //ActorDefinitionIdentifier const*
        static Command = "Command";     //std::unique_ptr<Command>
    }
    class PermType {
        static Any = "Any";
        static GameMasters = "GameMasters";
        static Admin = "Admin";
        static HostPlayer = "HostPlayer";
        static Console = "Console";
        static Internal = "Internal";
    }
    class OriginType {
        static Player = "Player";
        static Block = "Block";
        static MinecartBlock = "MinecartBlock";
        static DevConsole = "DevConsole";
        static Test = "Test";
        static AutomationPlayer = "AutomationPlayer";
        static ClientAutomation = "ClientAutomation";
        static Server = "Server";
        static Actor = "Actor";
        static Virtual = "Virtual";
        static GameArgument = "GameArgument";
        static ActorServer = "ActorServer";
        static Precompiled = "Precompiled";
        static GameDirectorEntity = "GameDirectorEntity";
        static Script = "Script";
        static ExecuteContext = "ExecuteContext";
        static DedicatedServer = "DedicatedServer";
    }
    class CommandOrigin {
        constructor(player = undefined) {
            this._player = _player;
        }
        get type() {
            return player ? OriginType.Player : OriginType.Console;
        }
        get name() {
            return this.player ? this.player.name : "Server";
        }
        get pos() {
            return this.player ? this.player.pos : mc.newFloatPos(0, 0, 0, 0);
        }
        get blockPos() {
            return this.player ? this.player.blockPos : mc.newIntPos(0, 0, 0, 0);
        }
        get entity() {
            return this.player;
        }
        get player() {
            return this._player;
        }
    }
    class CommandOutput {
        constructor(player = undefined) {
            this._player = _player;
        }
        get player() {
            return this._player;
        }
        success(...msg) {
            if (this._player) this._player.tell(msg.join(" "));
            else logger.info(...msg);
        }
        error(...msg) {
            if (this._player) this._player.tell(Color.red(msg.join(" ")));
            else logger.error(...msg);
        }
        addMessage(...msg) {
            success(...msg);
        }
    }
    class Command {
        constructor(name, desc, perm = PermType.Any, flag = 0, alias = undefined) {
            this.name = name;
            this.desc = desc;
            this.perm = perm;
            this.flag = flag;
            this.alias = alias;
            this.enums = {};
            this.params = {};
            this.overloads = [];
        }
        setAlias(alias) {
            this.alias = alias;
        }
        setEnum(name, values) {
            this.enums[name] = values;
        }
        mandatory(name, type, enumName = undefined, identifier = undefined, enumOptions = undefined) {
            this.params[name] = {
                type: type,
                enumName: enumName,
                identifier: identifier,
                enumOptions: enumOptions,
                optional: false,
            };
        }
        optional(name, type, enumName = undefined, identifier = undefined, enumOptions = undefined) {
            this.params[name] = {
                type: type,
                enumName: enumName,
                identifier: identifier,
                enumOptions: enumOptions,
                optional: true,
            };
        }
        overload(params) {
            this.overloads.push(params);
        }
        setCallback(callback) {
            this.callback = callback;
        }
        getOverloadParamCountRange(overload) {
            const params = overload.forEach(name => this.params[name]);
            let min = 0;
            let max = 0;
            for (let i = 0; i < params.length; i++) {
                const paramLen = params[i].type == ParamType.RawText ? Number.MAX_VALUE : 1;
                if (!params[i].optional)
                    min++;
                max += paramLen;
            }
            return [min, max];
        }
        parseParams(params) {
            let result = {};
            let posibleOverloads = this.overloads.forEach(overload => {
                const [min, max] = this.getOverloadParamCountRange(overload);
                if (params.length >= min && params.length <= max)
                    posibleOverloads.push(overload);
            });
            if (posibleOverloads.length == 0)
                return;
        }
        onExecute(...args) {
            const player = args.length == 2 ? args[0] : undefined;
            const params = args.length == 2 ? args[1] : args[0];
            const origin = new CommandOrigin(player);
            const output = new CommandOutput(player);
            let results = this.parseParams(params);
            try {
                results = this.callback(this, origin, output, results);
            } catch (e) {
                logError(`[Command] ${this.name}`, e, player);
                output.error(`Error: ${e.message}`);
            }
        }
        setup(callback = undefined) {
            if (callback) this.callback = callback;
            mc.regConsoleCmd(this.name, this.desc, onExecute);
            mc.regPlayerCmd(this.name, this.desc, onExecute);
            if (this.alias) {
                mc.regConsoleCmd(this.alias, this.desc, onExecute);
                mc.regPlayerCmd(this.alias, this.desc, onExecute);
            }
        }

    }
    mc.newCommand = function (name, desc, perm = PermType.Any, flag = 0, alias = undefined) {
        return new Command(name, desc, perm, flag, alias);
    }
}

// ================================== Enum ==================================

const FakePlayerOperation = {
    Login: tr("fakeplayer.operation.login"),
    Logout: tr("fakeplayer.operation.logout"),
    Add: tr("fakeplayer.operation.add"),
    Remove: tr("fakeplayer.operation.remove"),
    TurnOnChatControl: tr("fakeplayer.operation.turn_on_chat_control"),
    TurnOffChatControl: tr("fakeplayer.operation.turn_off_chat_control"),
    Navigate: tr("fakeplayer.operation.navigate"),
    DestoryBlock: tr("fakeplayer.operation.destroy_block"),
    LookAt: tr("fakeplayer.operation.look_at"),
    UseItem: tr("fakeplayer.operation.use_item"),
}
const FakePlayerState = {
    Unknown: tr("fakeplayer.state.unknown"),
    Online: tr("fakeplayer.state.online"),
    Offline: tr("fakeplayer.state.offline"),
}

// =============================== FakePlayer ===============================

class FakePlayerBase {

    /** @type {String} 假人皮肤 */
    skin = 'steve';
    /** @type {ControllerBase} Websocket 控制器 */
    controller;
    /** @type {String} 假人名称 */
    name;
    /** @type {FakePlayerState} 假人状态 */
    state;
    /** @type {Integer} 假人最后更新时间戳 */
    lastUpdateTime = 0;
    /** 假人
     * @param {WebSocketController} Websocket 控制器
     * @param {String} name 假人名称
     * @param {STATE} state 假人状态
     * @param {Boolean} allowChatControl 是否允许聊天控制
     */
    constructor(controller, name, state) {
        this.name = name;
        this.state = state;
        this.controller = controller;
    }
    /** @type {Player} 假人玩家对象 */
    get player() {
        if (!ServerStarted) return;
        return mc.getPlayer(this.name);
    }
    /** @type {String} XUID */
    get xuid() { return this.player?.xuid; }

    /** 登陆假人
     * @returns {boolean|Promise<boolean>} 登陆成功返回 true，否则返回 false
     */
    login() {
        return this.controller.login(this.name);
    }
    /** 登出假人
     * @returns {boolean|Promise<boolean>} 登出成功返回 true，否则返回 false
     */
    logout() {
        return this.controller.logout(this.name);
    }
    /** 移除假人
     * @returns {boolean|Promise<boolean>} 移除成功返回 true，否则返回 false
     */
    remove() {
        return this.controller.remove(this.name);
    }
    /** 添加假人
     * @returns {boolean|Promise<boolean>} 添加成功返回 true，否则返回 false
     */
    add() {
        return this.controller.add(this.name);
    }
    update() {
        this.lastUpdateTime = Date.now();
    }



    /** @type {String} 假人状态格式化字符串 */
    get stateStr() {
        // key of STATE
        return Object.keys(FakePlayerState).find(key => FakePlayerState[key] === this.state);
    }
    get stateStrWithColor() {
        switch (this.state) {
            case FakePlayerState.Online:
                return `${Color.GREEN}${this.stateStr}${Color.RESET}`;
            case FakePlayerState.Offline:
                return `${Color.RED}${this.stateStr}${Color.RESET}`;
            default:
                return this.stateStr;
        }
    }
    get type() {
        return this.constructor.name;
    }
    get typeStr() {
        return this.constructor.name.substring(0, this.constructor.name.length - 10);
    }
    get displayStr() {
        return `${this.typeStr} - ${this.name} - ${this.stateStrWithColor}`;
    }
    get online() {
        return this.state === FakePlayerState.Online;
    }
    getOperations() {
        return [
            this.state === FakePlayerState.Online ? FakePlayerOperation.Logout : FakePlayerOperation.Login,
            FakePlayerOperation.Remove,
        ]
    }
    onOperation(operation) {
        switch (operation) {
            case FakePlayerOperation.Login:
                return this.login();
            case FakePlayerOperation.Logout:
                return this.logout();
            case FakePlayerOperation.Remove:
                return this.remove();
            default:
                throw new Error(`Unknown operation ${operation}`);
        }
    }

    toString() {
        return `${this.constructor.name}<${this.name}>`;
    }
    toJSON() {
        let obj = {};
        for (let key of Object.keys(this)) {
            if (key === 'controller')
                obj[key] = this[key].name;
            else
                obj[key] = this[key];
        }
        return obj;
    }
}

class ClientFakePlayer extends FakePlayerBase {
    constructor(controller, name, state, allowChatControl = true, skin = 'steve') {
        super(controller, name, state);
        this._allowChatControl = allowChatControl;
    }

    get displayStr() {
        return super.displayStr;
    }
    get allowChatControl() {
        return this._allowChatControl;
    }
    /** 设置假人聊天控制
     * @returns {Promise<{name:string, success:boolean, reason:string}>} 设置结果
     */
    async setChatControl(allowChatControl) {
        return this.controller.setChatControl(this.name, allowChatControl);
    }
    /** 启用假人聊天控制
     * @returns {Promise<{name:string, success:boolean, reason:string}>} 设置结果
     */
    async trunOnControl() {
        return this.setChatControl(true);
    }
    /** 禁用假人聊天控制
     * @returns {Promise<{name:string, success:boolean, reason:string}>} 设置结果
     */
    async trunOffControl() {
        return this.setChatControl(false);
    }
    getOperations() {
        logger.warn(`${this.name} getOperations`);
        return super.getOperations().concat([
            this.allowChatControl ? FakePlayerOperation.TurnOffChatControl : FakePlayerOperation.TurnOnChatControl,
        ]);
    }
    onOperation(operation) {
        switch (operation) {
            case FakePlayerOperation.TurnOnChatControl:
                return this.trunOnControl();
            case FakePlayerOperation.TurnOffChatControl:
                return this.trunOffControl();
            default:
                return super.onOperation(operation);
        }
    }
}

class LLFakePlayer extends FakePlayerBase {
    constructor(controller, name, state, info = {}) {
        super(controller, name, state);
        for (let key in info) {
            if (!Reflect.has(this, key)) {
                this[key] = info[key];
            }
        }
    }

    get displayStr() {
        return super.displayStr;
    }

    getOperations() {
        return super.getOperations().concat([
        ]);
    }
    onOperation(operation) {
        switch (operation) {
            default:
                return super.onOperation(operation);
        }
    }
}

class BDSFakePlayer extends FakePlayerBase {
    constructor(controller, name) {
        super(controller, name, FakePlayerState.Online);
    }
    getOperations() {
        return super.getOperations().concat([
        ]);
    }
    onOperation(operation) {
        switch (operation) {
            default:
                return super.onOperation(operation);
        }
    }
}

// ============================== Controller ==============================

/**
 * FakePlayer Controller Base
 * @description 控制器基类
 */
class ControllerBase {
    static get enabled() {
        const config = Settings.manager;
        const name = this.FakePlayerTypeName;
        return config[name].enabled === true;
    }
    static EventType = {
        Add: 0,
        Remove: 1,
        Login: 2,
        Logout: 3,
    };

    static OperationType = {
        list: 0,
        add: 1,
        login: 2,
        logout: 3,
        remove: 4,
        loginAll: 5,
        logoutAll: 6,
        removeAll: 7,
        version: 8,
        getState: 9,
        getAllState: 10,
    };
    static FakePlayerTypeName = FakePlayerBase.name;

    /** 假人控制器构造函数
     * @param {{}} config 配置
     */
    constructor(config) {
        if (!config) {
            throw new Error('config is required');
        }
        if (!config.enabled) {
            throw new Error('enabled is required');
        }
        this.config = config;
    }
    get agentInstalled() {
        return AgentHelperBase.ready;
    }
    get isAsync() {
        return false;
    }

    async init() {
        await this.refreshData();
    }
    async refreshData() {
        throw new Error(`${this._name} not implement refreshData`);
    }
    get name() { return this.constructor.name; };
    get ready() { return this._ready; }
    set ready(value) { this._ready = value; }
    /** @returns {Map<string, FakePlayerBase>} 假人列表 */
    get fakePlayers() {
        if (this._fakePlayers === undefined)
            this._fakePlayers = new Map();
        return this._fakePlayers;
    }
    set fakePlayers(value) { this._fakePlayers = value; }

    getFakePlayer(name) {
        return this.fakePlayers[name];
    }

    /** @param {ControllerBase.EventType} type 事件类型
     * @param {Function<string>} callback 回调函数
     */
    listen(type, callback) {
        switch (type) {
            case ControllerBase.EventType.Add:
                this.onAddCallback = callback;
                break;
            case ControllerBase.EventType.Remove:
                this.onRemoveCallback = callback;
                break
            case ControllerBase.EventType.Login:
                this.onLoginCallback = callback;
                break;
            case ControllerBase.EventType.Logout:
                this.onLogoutCallback = callback;
                break;
            default:
                trError(`${this.name}.listen() type:${type} is not implemented.`);
        }
    }

    onAdd(name) {
        this.onAddCallback?.(name);
    }
    onRemove(name) {
        this.onRemoveCallback?.(name);
        delete this.fakePlayers[name];
    }
    onLogin(name) {
        if (this.fakePlayers[name])
            this.fakePlayers[name].state = FakePlayerState.Online;
        this.onLoginCallback?.(name);
    }
    onLogout(name) {
        if (this.fakePlayers[name])
            this.fakePlayers[name].state = FakePlayerState.Offline;
        this.onLogoutCallback?.(name);
    }

    //========= Control APIs =========
    list() {
        throw new Error(`${this.name}.list() is not implemented`);
    }
    add(_name, _skin = "Steve") {
        throw new Error(`${this.name}.add() is not implemented`);
    }
    login(_name) {
        throw new Error(`${this.name}.login() is not implemented`);
    }
    logout(_name) {
        throw new Error(`${this.name}.logout() is not implemented`);
    }
    remove(_name) {
        throw new Error(`${this.name}.remove() is not implemented`);
    }
    /** 登陆该控制器的所有假人
     * @returns {Promise<void>}
     */
    loginAll() {
        let list = [];
        for (let name in this.fakePlayers) {
            const fp = this.fakePlayers[name];
            if (!fp.online && fp.login()) {
                list.push(name);
            }
        }
        return list;
    }
    logoutAll() {
        // logger.error(`${this.name}.logoutAll() is not implemented`);
        let list = [];
        for (let name in this.fakePlayers) {
            const fp = this.fakePlayers[name];
            if (fp.online && fp.logout()) {
                list.push(name);
            }
        }
        return list;
    }
    removeAll() {
        // logger.error(`${this.name}.removeAll() is not implemented`);
        let list = [];
        for (let name in this.fakePlayers) {
            const fp = this.fakePlayers[name];
            if (fp.remove()) {
                list.push(name);
            }
        }
        return list;
    }
    version() {
        throw new Error(`${this.name}.version() is not implemented`);
    }
    getState(_name) {
        throw new Error(`${this.name}.getState() is not implemented`);
    }
    getAllState() {
        let states = {};
        for (let name of this.list()) {
            states[name] = this.getState(name);
        }
        return states;
    }
}
/**
 * WebSocket FakePlayer Controller
 * @description WebSocket控制器，用于控制FakePlayer客户端的假人
 */
class WebSocketController extends ControllerBase {
    /** @type {Map<String,Function>} 回调函数集合 */
    callbacks = {};
    /** @type {WSClient} WebSocket 实例 */
    wsc = null;
    static MessageType = {
        List: "list",
        Add: "add",
        Remove: "remove",
        Login: "connect",
        Logout: "disconnect",
        GetState: "getState",
        GetAllState: "getState_all",
        RemoveAll: "remove_all",
        LoginAll: "connect_all",
        LogoutAll: "disconnect_all",
        SetChatControl: "setChatControl",
    }
    static FakePlayerTypeName = ClientFakePlayer.name;
    /** @type {string} WebSocket 地址 */
    get wsUrl() {
        return this.config.wsUrl;
    }

    /** WebSocketController
     * @param {{enabled:boolean,wsUrl:string}} config 配置
     */
    constructor(config) {
        super(config);
        this.wsc = network.newWebSocket();

        this.wsc.listen("onTextReceived", this.onTextReceived.bind(this));
        this.wsc.listen("onBinaryReceived", this.onBinaryReceived.bind(this));
        this.wsc.listen("onError", this.onError.bind(this));
        this.wsc.listen("onLostConnection", this.onLostConnection.bind(this));
    }
    async init() {
        if (DEBUG) debug(`WebSocketController.init(), config: ${JSON.stringify(this.config)}`);
        const result = await this.connectWebsocket();
        if (!result) {
            throw new Error(`WebSocketController: ${this.wsUrl} connect failed.\nPlease check the FakePlayer Client is running and WebSocket server is enabled.`);
        }
        await super.init();
        if (DEBUG) debug(`WebSocketController.init ${this.wsUrl} success.`);
        this.ready = true;
    }
    async refreshData() {
        const allState = await this.getAllState();
        this.fakePlayers = new Map();
        // {"aabb":{"state":6,"allowChatControl":false,"skin":"steve"}}
        for (let name in allState) {
            //连接中: 0,已连接: 1,断开连接中: 2,已断开连接: 3,重新连接中: 4,停止中: 5,已停止: 6
            const OnlineStates = [0, 1];
            const online = OnlineStates.includes(allState[name].state) ? FakePlayerState.Online : FakePlayerState.Offline;
            this.fakePlayers[name] = new ClientFakePlayer(this, name, online, allState[name].allowChatControl, allState[name].skin);
        }
    }
    get ready() {
        return super.ready && this.wsc.status === WSClient.Open;
    }
    set ready(value) {
        super.ready = value;
    }
    get isAsync() {
        return true;
    }
    

    //========= AllowList =========
    addAllowList(name) {
        if(!this.config.autoWhitelist) return;
        let res = mc.runcmdEx(`whitelist add "${name}"`);
        if (!res.success)
            logger.debug(res.output);
        return res.success;
    }
    removeAllowList(name) {
        if(!this.config.autoWhitelist) return;
        let res = mc.runcmdEx(`whitelist remove "${name}"`);
        if (!res.success)
            logger.debug(res.output);
        return res.success;
    }

    onAdd(name) {
        this.addAllowList(name);
        this.fakePlayers[name] = new ClientFakePlayer(this, name, FakePlayerState.Offline, false, "steve");
        (async () => {
            const state = await this.getState(name);
            this.fakePlayers[name]._allowChatControl = state.allowChatControl;
            this.fakePlayers[name].skin = state.skin;
        })();
        super.onAdd(name);
    }
    onRemove(name) {
        this.removeAllowList(name);
        super.onRemove(name);
    }

    /** 异步连接
     * @returns {Promise<Boolean>} 是否连接成功
     */
    async connectWebsocket() {
        if (DEBUG) debug(`WebSocketController.connectWebsocket ${this.wsUrl}`);
        if (this.ready)
            return true;
        return new Promise((resolve, reject) => {
            let result = this.wsc.connectAsync(this.wsUrl, (success) => {
                this.ready = success;
                resolve(success);
            });
            if (!result)
                reject(new Error(`Fail to connect to ${this.wsUrl}`));
        });
    }

    /** 获取格式化后的回调消息
     * @param {String} response 回调消息
     * @returns {String} 格式化后的回调消息
     */
    getResponseStr(response) {
        return getResponseStr(response);
    }

    getResDataStr(...args) {
        return getResDataStr(...args);
    }

    //========= Callback =========
    /** 回调控制
     * @param {Integer} id 回调ID
     * @param {Object} msg 回调消息
     */
    onCallback(id, msg) {
        if (this.hasCallback(id)) {
            this.callbacks[id](msg);
            delete this.callbacks[id];
        } else {
            logger.info(`WebSocketController received message with unknown callback id: ${id}`);
            logger.info(msg);
        }
    }

    /** 假人客户端 WebSocket 事件监听
     * @param {String} evType 事件类型
     * @param {{name:string, state: STATES?}} evData 事件数据
     */
    onEvent(evType, { name, state }) {
        switch (evType) {
            case WebSocketController.MessageType.Add:
                this.onAdd(name);
                break;
            case WebSocketController.MessageType.Remove:
                this.onRemove(name);
                break
            case WebSocketController.MessageType.Login:
                this.onLogin(name);
                break
            case WebSocketController.MessageType.Logout:
                this.onLogout(name);
                break
            default:
                throw new Error(`Unknown event type: ${evType}`);
        }
    }



    //========= OnMessage =========
    /** 默认消息处理
     * @param {String} msg 消息
     */
    defaultOnMessage(msg) {
        logger.info(msg);
    }
    /** WebSocket 文本消息处理
     * @param {String} str 消息
     */
    onTextReceived(str) {
        let msg = JSON.parse(str);
        if (DEBUG) debug(`${ConsoleColor.green("<<")} ${JSON.stringify(msg)}`);
        if (Object.prototype.hasOwnProperty.call(msg, 'event')) {
            this.onEvent(msg.event, msg.data);
        } else if (Object.prototype.hasOwnProperty.call(msg, 'id')) {
            this.onCallback(msg.id, msg);
        } else {
            this.defaultOnMessage(msg);
        }
    }

    /** waitForReady
     * @param {Number} timeout 超时时间
     * @returns {Promise<Boolean>} 是否连接成功
     */
    async waitForReady(timeout = 5000) {
        this.wsc.shutdown();
        return new Promise((resolve, reject) => {
            this.connectWebsocket().then(resolve).catch(reject);
            wait(timeout).then(() => {
                logger.info("Test connection timeout");
                resolve(this.ready)
            });
        });
    }

    /** WebSocket 二进制消息处理
     * @param {ByteBuffer} data 二进制消息
     */
    onBinaryReceived(data) {
        trInfo("ws.receive.bin", data.toString())
    }

    /** WebSocket 错误处理
     * @param {String} msg 错误消息
     */
    onError(msg) {
        trError('ws.error.on_error', { msg: msg });
    }

    /** WebSocket 连接断开处理
     * @param {Integer} code 错误代码
     */
    onLostConnection(code) {
        this.ready = false;
        if (this.manager) {
            logger.error(`Lost connection to ${this.wsUrl}`);
            this.manager.ready = false;
        }
        trError('ws.error.lost_connection', { code: code });
        this.connectWebsocket().then((result) => {
            if (!result)
                trError('ws.error.connect', { code: this.wsc.errorCode() });
        }).catch((err) => {
            logError("Error in Reconnect Websocket in onLostConnection", err);
        });
    }

    //========= sendMsg =========
    hasCallback(id) {
        return Object.prototype.hasOwnProperty.call(this.callbacks, id);
    }
    /** 生成回调ID
     * @returns {Integer} 回调ID
     */
    genPacketId() {
        let id = system.randomGuid();
        while (this.hasCallback(id)) {
            id = system.randomGuid();
        }
        return id;
    }
    _addCallback(id, callback) {
        if (callback && !this.hasCallback(id))
            this.callbacks[id] = callback
        else
            throw new Error("Error in addCallback, callback is null or already exists");
    }
    _removeCallback(id) {
        if (this.hasCallback(id))
            delete this.callbacks[id]
    }

    /** 发送请求
     * @param {{type: string, id: Integer, data: object?}} msg data to send
     * @returns {Promise<{type: string, data: object}>} 回调消息
     */
    async send(msg, timeout = 5000) {
        if (DEBUG) debug(`${ConsoleColor.green(">>")} ${JSON.stringify(msg)}`);
        if (!this.ready) {
            if (!await this.connectWebsocket()) {
                if (DEBUG) debug(`Error in send, connect websocket failed, msg: ${JSON.stringify(msg)}`);
                throw new Error(tr("ws.error.send", { code: this.wsc.errorCode() }));
            }
        }
        const id = this.genPacketId();
        return Promise.race([
            (async () => {
                await wait(timeout);
                this._removeCallback(id);
                throw new Error("Error in send, timeout");
            })(),
            new Promise((resolve, reject) => {
                msg.id = id;
                this._addCallback(id, resolve);
                let success = this.wsc.send(JSON.stringify(msg));
                if (!success) {
                    if (DEBUG) logger.error(tr("ws.error.send", { code: this.wsc.errorCode() }));
                    reject(new Error(tr("ws.error.send", { code: this.wsc.errorCode() })));
                    this._removeCallback(id);
                    (async () => {
                        await wait(1000);
                        await this.connectWebsocket();
                    })();
                }
            }),
        ]);
    }

    //========= WebSocket Api =========
    /** 获取假人列表
     * @returns {Promise<string[]>} 假人列表
     */
    async list() {
        const msg = {
            type: WebSocketController.MessageType.List,
        }
        const { type, data: { list } } = await this.send(msg);
        return list;
    }
    /**
     * @param {string} name 假人名称
     * @param {boolean} allowChatControl 是否允许聊天控制
     * @param {string} skin 假人皮肤
     * @returns {Promise<{name:string, success:boolean, reason: string}>} 返回结果
     */
    async add(name, allowChatControl = false, skin = "steve") {
        this.addAllowList(name);
        let msg = {
            type: WebSocketController.MessageType.Add,
            data: {
                name: name,
                skin: skin,
                allowChatControl: allowChatControl,
            }
        }
        const { type, data: { success, reason } } = await this.send(msg);
        if (!success) throw new Error(`Error in add, reason: ${reason}`);
        return success;
    }
    /** 移除假人
     * @param {string} name 假人名称
     * @returns {Promise<{name:string, success:boolean, reason: string}>} 返回结果
     */
    async remove(name) {
        this.removeAllowList(name);
        let msg = {
            type: WebSocketController.MessageType.Remove,
            data: {
                name: name,
            }
        }
        const { type, data: { success, reason } } = await this.send(msg);
        if (!success) throw new Error(`Error in remove, reason: ${reason}`);
        return success;
    }
    /** 获取假人状态
     * @param {string} name 假人名称
     * @returns {Promise<{name:string, success:boolean, reason: string, state: STATES}>} 返回结果
     */
    async getState(name) {
        let msg = {
            type: WebSocketController.MessageType.GetState,
            data: {
                name: name,
            }
        }
        const { type, data: data } = await this.send(msg);
        return data;
    }
    /** 获取所有假人状态
     * @returns {Promise<{name: {state: STATES, allowChatControl: boolean}}[]>} 返回结果
     */
    async getAllState() {
        let msg = {
            type: WebSocketController.MessageType.GetAllState,
        }
        const { type, data: { playersData } } = await this.send(msg);
        return playersData;
    }
    /** 断开假人连接
     * @param {string} name 假人名称
     * @returns {Promise<{name:string, success:boolean, reason: string?}>} 返回结果
     */
    async logout(name) {
        let msg = {
            type: WebSocketController.MessageType.Logout,
            data: {
                name: name,
            }
        }
        const { type, data: { success, reason } } = await this.send(msg);
        if (!success) throw new Error(`Error in logout, reason: ${reason}`);
        return success;
    }
    /** 连接假人
     * @param {string} name 假人名称
     * @returns {Promise<{name:string, success:boolean, reason: string?}>} 返回结果
     */
    async login(name) {
        let msg = {
            type: WebSocketController.MessageType.Login,
            data: {
                name: name,
            }
        }
        const { type, data: { success, reason } } = await this.send(msg);
        if (!success) throw new Error(`Error in login, reason: ${reason}`);
        return success;
    }
    /** 移除所有假人
     * @returns {Promise<string[]>} 返回结果
     */
    async removeAll() {
        const names = await this.list();
        names.forEach(this.removeAllowList.bind(this));
        let msg = {
            type: WebSocketController.MessageType.RemoveAll,
        }
        const { type, data: { list: list } } = await this.send(msg);
        return list;
    }
    /** 连接所有假人
     * @returns {Promise<string[]>} 返回结果
     */
    async loginAll() {
        let msg = {
            type: WebSocketController.MessageType.LoginAll,
        }
        const { type, data: { list: list } } = await this.send(msg);
        return list;
    }
    /** 断开所有假人连接
     * @returns {Promise<string[]>} 返回结果
     */
    async logoutAll() {
        let msg = {
            type: WebSocketController.MessageType.LogoutAll,
        }
        const { type, data: { list: list } } = await this.send(msg);
        return list;
    }
    /** 设置假人聊天控制
     * @param {string} name 假人名称
     * @param {boolean} allowChatControl 是否允许聊天控制
     * @returns {Promise<{name:string, success:boolean, reason: string}>} 返回结果
     */
    async setChatControl(name, allowChatControl) {
        let msg = {
            type: WebSocketController.MessageType.SetChatControl,
            data: {
                name: name,
                allowChatControl: allowChatControl,
            }
        }
        const { type, data: { success, reason } } = await this.send(msg);
        if (!success) throw new Error(`Error in setChatControl, reason: ${reason}`);
        return success;
    }
}

/**
 * LLFakePlayer API
 * @description RemoteCall API for LLFakePlayer Plugin
 */
class FPAPI {
    static LLFAKEPLAYER_NAMESPACE = "FakePlayerAPI";
    static EventType = {
        Add: "add",
        Remove: "remove",
        Login: "login",
        Logout: "logout",
        Change: "change",
    }
    static get ready() {
        return ll.hasExported(FPAPI.LLFAKEPLAYER_NAMESPACE, "getVersion");
    }
    static import(name) {
        return ll.import(FPAPI.LLFAKEPLAYER_NAMESPACE, name);
    }

    /** @type {()=>int[]} 获取假人插件版本 */
    static getVersion = FPAPI.import("getVersion");

    /** @type {()=>string} 获取假人插件版本字符串 */
    static getVersionString = FPAPI.import("getVersionString");

    /** @type {()=>Player[]} 获取在线假人列表 */
    static getOnlineList = FPAPI.import("getOnlineList");

    /** 获取假人状态
     * @type {(name:string)=>JSON} 获取所有假人状态json
     * @example
     * {"autoLogin":false,"lastUpdateTime":1654343697,"name":"ll","online":true,"skinId":"","uuid":"bc79f145-a0c0-345b-8ccd-b5b8bc9abcbb","xuid":"17870283321406351356"}
     */
    static getStateJson = FPAPI.import("getStateJson");

    /** 获取所有假人状态
     * @type {()=>JSON} 获取所有假人状态json
     * @example
     * {"aa":{"autoLogin":false,"lastUpdateTime":1654343697,"name":"aa","online":true,"skinId":"","uuid":"7fc23593-0abc-3441-9249-7a20ba246f08","xuid":"17870283321406328828"},"ll":{"autoLogin":false,"lastUpdateTime":1654343697,"name":"ll","online":true,"skinId":"","uuid":"bc79f145-a0c0-345b-8ccd-b5b8bc9abcbb","xuid":"17870283321406351356"}}
     */
    static getAllStateJson = FPAPI.import("getAllStateJson");

    /** @type {()=>string[]} 获取假人列表 */
    static list = FPAPI.import("list");

    /** @type {(name:string)=>boolean} 获取假人列表 */
    static create = FPAPI.import("create");

    /** @type {(name:string,pos:IntPos,dimid:Number)=>Player} 创建假人，并在指定位置上线 */
    static createAt = FPAPI.import("createAt");

    /** @type {(name: string)=>Player?} 上线假人 */
    static login = FPAPI.import("login");

    /** @type {(name: string)=>boolean} 下线假人 */
    static logout = FPAPI.import("logout");

    /** @type {(string)=>boolean} 移除假人 */
    static remove = FPAPI.import("remove");

    /** @type {()=>string[]} 上线所有假人 */
    static loginAll = FPAPI.import("loginAll");

    /** @type {()=>string[]} 下线所有假人 */
    static logoutAll = FPAPI.import("logoutAll");

    /** @type {()=>string[]} 移除所有假人 */
    static removeAll = FPAPI.import("removeAll");

    /** @param {(type:EventType,name:string)=>void} callback 假人事件回调 */
    static subscribeEvent(callback) {
        const callbackName = "onFakePlayerEvent";
        ll.export(callback, PLUGIN_NAME, callbackName);
        const subscribeEventImpl = FPAPI.import("subscribeEvent");
        subscribeEventImpl(PLUGIN_NAME, callbackName);

    }
}
class AGAPI {
    static REMOTE_CALL_NAMESPACE = "OperationAgentAPI";
    static get ready() {
        return ll.hasExported(AGAPI.REMOTE_CALL_NAMESPACE, "getVersion");
    }
    static import(name) {
        return ll.import(AGAPI.REMOTE_CALL_NAMESPACE, name);
    }
    static getVersion = AGAPI.import("getVersion");
    static getVersionString = AGAPI.import("getVersionString");
    static setAgent = AGAPI.import("setAgent");
    static getAgent = AGAPI.import("getAgent");
    static listAgent = AGAPI.import("listAgent");
    static removeAgent = AGAPI.import("removeAgent");
}


/**
 * LLFakePlayer Controller
 * @description LLFakePlayer控制器，用于控制LLFakePlayer插件的假人
 */
class LLFakePlayerController extends ControllerBase {
    static FakePlayerTypeName = LLFakePlayer.name;
    constructor(config) {
        super(config);
    }
    /**
     * @param {Map<string,any>} state 参数
     */
    playerFromState(state) {
        const onlineState = state.online ? FakePlayerState.Online : FakePlayerState.Offline;
        let info = state;
        return new LLFakePlayer(this, state.name, onlineState, info);
    }
    async init() {
        if (!FPAPI.ready) {
            throw new Error("LLFakePlayer not ready, maybe plugin not installed");
        }
        await super.init();
        FPAPI.subscribeEvent(this.onFakePlayerEvent.bind(this));
        this.ready = true;
    }

    async refreshData() {
        const list = this.getAllState();
        if (!list) return;
        if (DEBUG) debug(`LLFakePlayerController.refreshData: ${JSON.stringify(list)}`);
        this.fakePlayers = new Map();
        for (let name in list) {
            this.fakePlayers[name] = this.playerFromState(list[name]);
        }
    }

    get ready() { return FPAPI.ready && super.ready; }
    set ready(value) { super.ready = value; }

    onFakePlayerEvent(type, name) {
        if (DEBUG) logger.info(`${this.name}.onFakePlayerEvent() -> type:${type}, name:${name}`);
        switch (type) {
            case FPAPI.EventType.Add:
                this.onAdd(name);
                break;
            case FPAPI.EventType.Remove:
                this.onRemove(name);
                break;
            case FPAPI.EventType.Login:
                this.onLogin(name);
                break;
            case FPAPI.EventType.Logout:
                this.onLogout(name);
                break;
            case FPAPI.EventType.Change:
                this.onChange(name);
                break;
            default:
                logger.debug(`${this.name}.onFakePlayerEvent() -> unknown event type: ${type}`);
                break;
        }
        return true;
    }

    onAdd(name) {
        const state = this.getState(name);
        if (state) {
            this.fakePlayers[name] = this.playerFromState(state);
        }
        super.onAdd(name);
    }

    onChange(name) {
        const state = this.getState(name);
        if (!state) return;
        const fp = this.fakePlayers[name];
        fp.state = state.online ? FakePlayerState.Online : FakePlayerState.Offline;
        fp.autoLogin = state.autoLogin;
        fp.skinId = state.skinId;
        fp.uuid = state.uuid;
        fp.xuid = state.xuid;
        fp.name = state.name;
        // super.onChange(name);
    }

    list() {
        return FPAPI.list();
    }
    add(name, _skin = "Steve") {
        return FPAPI.create(name);
    }
    login(name) {
        return FPAPI.login(name);
    }
    logout(name) {
        return FPAPI.logout(name);
    }
    remove(name) {
        return FPAPI.remove(name);
    }
    version() {
        return FPAPI.getVersionString();
    }
    getState(name) {
        return JSON.parse(FPAPI.getStateJson(name));
    }
    getAllState() {
        return JSON.parse(FPAPI.getAllStateJson());
    }
}

/**
 * @description SimulatedPlayer Controller
 */
class SimulatedPlayerController extends ControllerBase {
    static FakePlayerTypeName = BDSFakePlayer.name;
    constructor(config) {
        super(config);
        if (!Object.prototype.hasOwnProperty.call(mc, "spawnSimulatedPlayer"))
            throw new Error("LLSE version is too low, do not support SimulatedPlayer");
    }

    async init() {
        if (!Object.prototype.hasOwnProperty.call(mc, "spawnSimulatedPlayer")) {
            throw new Error("LLSE version is too low, do not support SimulatedPlayer");
        }
        await super.init();
        this.initListener();
        this.ready = true;
    }

    async refreshData() {
        const list = this.list();
        this.fakePlayers = new Map();
        for (let name of list) {
            this.fakePlayers[name] = new BDSFakePlayer(this, name);
        }
    }

    get ready() {
        return Object.prototype.hasOwnProperty.call(mc, "spawnSimulatedPlayer") && super.ready;
    }
    set ready(value) { super.ready = value; }

    initListener() {
        mc.listen("onJoin", player => {
            if (player.isSimulatedPlayer()) {
                if (FPAPI.ready && FPAPI.list().includes(player.name))
                    return true;
                this.fakePlayers[player.name] = new BDSFakePlayer(this, player.name);
                this.onAdd(player.name);
                this.onLogin(player.name);
            }
            return true;
        });
        if (ll.requireVersion(2, 2, 6)) {
            mc.listen("onLeft", player => {
                if (player.isSimulatedPlayer()) {
                    if (FPAPI.ready && FPAPI.list().includes(player.name))
                        return true;
                    this.onLogout(player.name);
                    this.onRemove(player.name);
                    delete this.fakePlayers[player.name];
                }
                return true;
            });
        } else {
            setInterval(() => {
                const onlinePlayers = mc.getOnlinePlayers().map(p => p.name);
                for (let name in this.fakePlayers) {
                    if (!onlinePlayers.includes(name)) {
                        this.onLogout(name);
                        this.onRemove(name);
                        delete this.fakePlayers[name];
                    }
                }
            }, 1 * 1000);
        }
    }

    list() {
        let list = [];
        if (!ServerStarted) return list;
        let llFakePlayerList = FPAPI.ready ? FPAPI.getOnlineList() : [];
        llFakePlayerList = llFakePlayerList.map(llFakePlayer => llFakePlayer.name);
        mc.getOnlinePlayers().forEach(p => {
            if (p.isSimulatedPlayer() && !llFakePlayerList.includes(p.name))
                list.push(p.name);
        });
        return list;
    }
    add(name) {
        if (!ServerStarted) return false;
        if (mc.getOnlinePlayers().some(p => p.name === name))
            return false;
        if (FPAPI.ready && FPAPI.list().includes(name))
            return false;
        return mc.spawnSimulatedPlayer(name)?.name === name;
    }
    login(name) {
        return this.add(name);
    }
    logout(name) {
        return this.remove(name);
    }
    remove(name) {
        if (!ServerStarted) return;
        let sp = mc.getPlayer(name);
        if (sp) {
            logger.info(`${this.name}.remove(${name})`);
            sp.simulateDisconnect();
            return true;
        }
        return false;
    }
    version() {
        return [0, 0, 0];
    }
}

class AgentHelperBase {
    static get ready() {
        // logger.error("force to return false");
        // return false;
        if (AgentHelperBase._ready === undefined) {
            try {
                let res = mc.runcmdEx('opagent version');
                if (res && res.success) {
                    AgentHelperBase._ready = true;
                } else {
                    AgentHelperBase._ready = false;
                }
            } catch (e) {
                AgentHelperBase._ready = false;
            }
        }
        return AgentHelperBase._ready;
    }
    constructor(player) {
        this.player = player;
    }
    set player(value) {
        this._name = value.name;
    }
    get player() {
        return mc.getPlayer(this._name);
    }
    get name() {
        return this._name;
    }
    get infomation() {
        const target = this.getAgentTarget();
        let info;
        if (target) {
            info = tr('form.agent.current', target);
        } else {
            info = tr('form.agent.current.none');
        }
        if (Settings.Common.color)
            info = `${Color.YELLOW}${info}${Color.RESET}`;
        return info;
    }
    hasAgent() {
        return this.getAgentTarget() !== null;
    }
    static listAgent() {
        throw new Error(`${this.name}.listAgent() -> not implemented`);
    }
    listAgent = () => this.constructor.listAgent();
    agentFor(name) {
        throw new Error(`${this.name}.agentFor() -> not implemented`);
    }
    cancelAgent() {
        throw new Error(`${this.name}.cancelAgent() -> not implemented`);
    }
    getAgentTarget() {
        throw new Error(`${this.name}.getAgentTarget() -> not implemented`);
    }


}

/**
 * OperationAgent 插件相关 API
 */
class CommandAgentHelper extends AgentHelperBase {
    constructor(player) {
        super(player);
    }

    /** 获取代理数据
     * @returns {{agent: string, target: string}[]}
     */
    static listAgent() {
        let res = mc.runcmdEx(`opagent list`);
        if (DEBUG) debug(JSON.stringify(res));
        if (res.success) {
            let list = [];
            let lines = res.output.split('\n');
            for (let [index, line] of lines.entries()) {
                if (index == 0)
                    continue;
                let { agent, target } = line.match(/^(.+?)\s*->\s*(.+?)$/) || [];
                if (agent && target) {
                    list.push({ agent, target });
                }
            }
            return list;
        } else {
            return [];
        }
    }
    /** 设置假人代理
     * @param {String} agentName 代理名称
     * @param {String} targetName 代理目标名称
     * @returns {Boolean} 是否成功
     */
    agentFor(targetName) {
        let res = mc.runcmdEx(`opagent set "${targetName}" "${this.name}"`);
        return res.success;
    }
    /** 取消假人代理
     * @param {String} agentName 代理名称
     * @returns {Boolean} 是否成功
     * @example
     * let success = fpm.cancelAgent(name);
     * if (success) {
     *    console.log(`${name} 取消代理成功`);
     * } else {
     *   console.log(`${name} 取消代理失败`);
     * }
     */
    cancelAgent() {
        let res = mc.runcmdEx(`opagent clear "${this.name}"`);
        if (DEBUG) debug(JSON.stringify(res));
        if (res.success)
            return true;

        let agentList = this.listAgent();
        let agentName;
        for (let { agent, target } of agentList) {
            if (target == this.name) {
                agentName = agent;
                break;
            } else if (agent == this.name) {
                agentName = target;
                break;
            }
        }
        if (agentName) {
            let res = mc.runcmdEx(`opagent clear ${agentName}`);
            if (DEBUG) debug(JSON.stringify(res));
            return res.success;
        }
        return false;
    }
    /** 获取假人代理
     * @param {String} name 假人名称
     * @returns {String} 代理名称
     */
    getAgentTarget() {
        if (this._targetName !== undefined) return this._targetName;
        let res = mc.runcmdEx(`opagent query "${this.name}"`);
        if (DEBUG) debug(JSON.stringify(res));
        if (res.success) {
            this._targetName = res.output.split('\n')[0].split(' -> ')[1];
        } else {
            this._targetName = null;
        }
        return this._targetName;
    }
}


class RemoteCallAgentHelper extends AgentHelperBase {
    constructor(player) {
        super(player);
    }
}

function getAgentHelper(player) {
    return new CommandAgentHelper(player);
}

class FakePlayerFormHelper {
    /** 假人管理表单
     * @param {FakePlayerManager} manager 假人管理器
     * @param {Player} player 玩家对象
     */
    constructor(manager, player) {
        this.manager = manager;
        this.player = player;
        this.xuid = player.xuid;
    }

    get player() {
        if (!ServerStarted) return;
        return mc.getPlayer(this.xuid);
    }
    set player(player) {
        if (player && player.xuid) {
            this.xuid = player.xuid;
            this.name = player.name;
        }
    }

    tell(msg) {
        if (this.player) {
            this.player.tell(msg);
        } else {
            logger.error(`Error to tell ${this.name} ${msg}, player not found`);
        }
    }
    success(msg) {
        this.tell(`${Color.GREEN}${msg}${Color.RESET}`);
    }
    error(msg) {
        this.tell(`${Color.RED}${msg}${Color.RESET}`);
    }

    /** 异步发送表单
     * @param {SimpleForm|CustomForm} form 表单
     * @returns {Promise<{player:Player,id:Integer?,data:Array<any>?}>} 表单结果
     * @example
     * let form = new SimpleForm();
     * form.addButton("按钮1", "按钮1的描述");
     * form.addButton("按钮2", "按钮2的描述");
     * const {player,id} = await this.sendForm(form);
     */
    async sendForm(form) {
        return new Promise((resolve, reject) => {
            if (this.player) {
                let res = this.player.sendForm(form, (player, dataOrId) => {
                    // 输出 dataOrId 的实例类型
                    if (DEBUG) debug(form.constructor.name);
                    if (form instanceof LLSE_SimpleForm) {
                        if (DEBUG) debug(`${this.name} send form ${form.constructor.name}, return id: ${dataOrId}`);
                        resolve({ player, id: dataOrId });
                    } else {
                        if (DEBUG) debug(`${this.name} send form ${form.constructor.name}, return data: ${dataOrId}`);
                        resolve({ player, data: dataOrId });
                    }
                });
                if (!res) {
                    logger.error(`Error to send form ${form.constructor.name} to ${this.name}`);
                    reject(new Error('sendForm failed'));
                }
            } else {
                logger.error(`Error to send form ${form.constructor.name} to ${this.name}, player not found`);
                reject(new Error(`Error to Send Form ${this.name}`));
            }
        });
    }

    /** 假人操作按钮 */
    static Operations = {
        Add: tr('form.op.add'),
        Remove: tr('form.op.remove'),
        Login: tr('form.op.login'),
        Logout: tr('form.op.logout'),
        LoginAll: tr('form.op.login_all'),
        LogoutAll: tr('form.op.logout_all'),
        RemoveAll: tr('form.op.remove_all'),
        TrunOnControl: tr('form.op.turn_on_control'),
        TrunOffControl: tr('form.op.turn_off_control'),
        SetAgent: tr('form.op.set_agent'),
        CancelAgent: tr('form.op.cancel_agent'),
        AgentFor: tr('form.op.agent_for'),
        // Control: tr('form.op.control'),
        Unknown: tr('form.op.unknown'),
        Cancel: tr('form.cancel'),
    }
    /** 表单菜单按钮 */
    static FormType = {
        List: tr('form.menu.list'),
        Quick: tr('form.menu.quick'),
        Agent: tr('form.menu.agent'),
        Control: tr('form.menu.control'),
        Teleport: tr('form.menu.teleport'),
    }

    /** 表单菜单按钮 */
    get Operations() { return FakePlayerFormHelper.Operations; }
    /** 表单菜单按钮 */
    get FormType() { return FakePlayerFormHelper.FormType; }
    getAdditionalOps() {
        let additionalOps = [this.Operations.Add, this.Operations.LoginAll, this.Operations.LogoutAll];
        if (Settings.allowRemoveAll) {
            additionalOps.push(this.Operations.RemoveAll);
        }
        return additionalOps;
    }

    /** 发送列表表单
     * @param {String} title 标题
     * @param {String} content 内容
     * @param {Array<String>} btnsText 按钮文本
     * @returns {Promise<{player:Player,id:Integer?,data:Array<any>?}>} 表单结果
     */
    async sendListForm(title, content, btnsText) {
        let listForm = mc.newSimpleForm();
        if (title) listForm.setTitle(title);
        if (content) listForm.setContent(content);
        btnsText.forEach(text => listForm.addButton(text));
        return this.sendForm(listForm);
    }

    /** 发送选择假人表单
     * @param {String} title 标题
     * @param {String} content 内容
     * @param {(fp:FakePlayerBase)=>boolean|string|null} textBuilder 按钮文本生成器
     * @param {(a: FakePlayerBase, b: FakePlayerBase) => number} compareFn 按钮文本生成器
     * @returns {Promise<FakePlayerBase?>} 表单结果
     */
    async selectFakePlayer(title, content, textBuilder = undefined, compareFn = undefined) {
        const fps = this.manager.fakePlayerList;
        let filtered = [];
        logger.info(`${JSON.stringify(fps, null, 4)}`);
        let btnsText = [];
        if (compareFn) fps.sort(compareFn);
        logger.info(`${JSON.stringify(fps, null, 4)}`);
        for (let player of fps) {
            let res = textBuilder ? textBuilder(player) : player.displayStr;
            if (res != null) {
                btnsText.push(typeof res === 'string' ? res : player.displayStr);
                filtered.push(player);
            }
        }
        let { player, id } = await this.sendListForm(title, content, btnsText);
        if (id >= 0 && id < filtered.length) {
            return filtered[id];
        }
        return null;
    }

    /** 发送表单
     * @param {string} title 标题
     * @param {string} content 内容
     * @param {[string,boolean][]} switches 开关
     */
    async sendSwitchsForm(title, content, switches) {
        let switchsForm = mc.newCustomForm();
        switchsForm.setTitle(title);
        switchsForm.addLabel(content);
        switches.forEach(([text, defaultValue]) => switchsForm.addSwitch(text, defaultValue));
        let { data } = await this.sendForm(switchsForm);
        if (data != null)
            data = data.splice(1);
        logger.debug(`${this.name} send switchs form, data: ${JSON.stringify(data)}`);
        return { data };
    }

    /** 发送假人列表表单 */
    async sendFPListForm() {
        let title = tr('form.list.title') + '-' + VERSION_STRING;
        let content = tr('form.list.content');
        if (Settings.Common.color) content = Color.yellow(content);
        let fps = this.manager.fakePlayerList;
        let fpText = fps.map(fp => fp.displayStr);

        let additionalOps = this.getAdditionalOps();
        let additionalOpsText = additionalOps;
        let btnsText = fpText.concat(additionalOpsText);
        const { id } = await this.sendListForm(title, content, btnsText);

        if (id == null) {
            if (DEBUG)
                this.tell(this.Operations.Cancel);
            return;
        }
        if (DEBUG) debug(`${this.name} send list form, operation: ${btnsText[id]}`);
        if (id < fps.length) {
            await this.sendOperateForm(fps[id]);
        } else {
            let data;
            switch (additionalOps[id - fps.length]) {
                case this.Operations.Add:
                    await this.sendAddForm();
                    break;
                case this.Operations.LoginAll:
                    data = await this.controller.loginAll();
                    this.tell(getResponseStr({ type: "login_all", data: { list: data } }));
                    break;
                case this.Operations.LogoutAll:
                    data = await this.controller.logoutAll();
                    this.tell(getResponseStr({ type: "logout_all", data: { list: data } }));
                    break;
                case this.Operations.RemoveAll:
                    data = await this.controller.removeAll();
                    this.tell(getResponseStr({ type: "remove_all", data: { list: data } }));
                    break;
                default:
                    logger.error(this.Operations.Unknown);
                    this.tell(this.Operations.Unknown);
                    if (DEBUG) throw new Error(this.Operations.Unknown);
                    break;
            }
        }
    }
    /** 发送操作表单
     * @param {String|FakePlayerBase} fpName 假人名称
     */
    async sendOperateForm(fakePlayer) {
        let opForm = mc.newSimpleForm();
        opForm.setTitle(tr('form.op.title'));
        const fp = (fakePlayer instanceof FakePlayerBase) ? fakePlayer : this.manager.getFakePlayer(fakePlayer);
        let content = fp.displayStr;
        if (Settings.Common.color)
            content = `${Color.YELLOW}${content}${Color.RESET}`;
        opForm.setContent(`${content}\n${JSON.stringify(fp)}`);
        let ops = fp.getOperations();
        ops.map(op => { opForm.addButton(op); });
        const { id } = await this.sendForm(opForm)
        if (id == null) {
            if (DEBUG) this.tell(this.Operations.Cancel);
            return;
        }
        if (DEBUG) debug(`selected operation ${ops[id]} in operate form`);
        const result = await fp.onOperation(ops[id]);
        if (result)
            this.success(`操作成功：${ops[id]} fp: ${fp.name}`);
        else
            this.error(`操作失败：${ops[id]} fp: ${fp.name}`);

    }

    /** 发送添加假人表单 */
    async sendAddForm() {
        let skins = ['steve', 'alex'];
        let addForm = mc.newCustomForm();
        addForm.setTitle(tr('form.add.title'));
        addForm.addInput(tr('form.add.input_name'));
        addForm.addDropdown(tr('form.add.select_skin'), skins);
        addForm.addSwitch(tr('form.add.allow_control'), true);
        addForm.addSwitch(tr('form.add.auto_teleport'), false);
        addForm.addSwitch(tr('form.add.auto_agent'), false);
        const { data } = await this.sendForm(addForm);
        if (data == null) {
            if (DEBUG)
                this.tell(this.Operations.Cancel);
            return;
        }
        let fp = new FakePlayerBase();
        fp.name = data[0];
        fp.controller = this.controller;
        fp.skin = skins[data[1]];
        fp.allowChatControl = data[2];
        const addResult = await fp.add();
        this.tell(getResponseStr({ type: "add", data: addResult }));
        if (data[3]) addTpQuery(fp.name, this.player.pos);
        if (data[4]) addAgentQuery(fp.name, this.player.name);
    }

    /** 发送快速上下线表单 */
    async sendQuickForm() {
        const title = tr('form.quick.title');
        const content = `${Color.YELLOW}${tr('form.quick.content')}${Color.RESET}`;
        /** @type {FakePlayerBase[]} */
        const fps = this.manager.fakePlayerList;
        let switchs = fps.map(fp => [fp.displayStr, fp.online]);
        const { data } = await this.sendSwitchsForm(title, content, switchs);
        if (data == null) {
            if (DEBUG) this.tell(this.Operations.Cancel);
            return;
        }
        data.forEach((online, index) => {
            if (online != fps[index].online) {
                if (online)
                    fps[index].login();
                else
                    fps[index].logout();
            }
        });
    }

    /** 发送代理设置表单 */
    async sendAgentForm() {
        if (AgentHelperBase.ready == false) {
            this.error(tr('form.agent.error.not_ready'));
            return;
        }
        let helper = getAgentHelper(this.player);
        const target = helper.getAgentTarget();
        if (DEBUG) debug(`agent target is ${target}`);
        let title = tr('form.agent.title') + '-' + VERSION_STRING;
        const fp = await this.selectFakePlayer(title, helper.infomation, fp => {
            if (!fp.online) return;
            return (fp.name == target) ? this.Operations.CancelAgent : fp.name;
        }, (a, b) => {
            if (a.name == target) return -1;
            if (b.name == target) return 1;
            return a.lastUpdateTime - b.lastUpdateTime;
        });
        if (!fp) {
            if (DEBUG) this.tell(this.Operations.Cancel);
            return;
        }
        if (fp.name == target) {
            helper.cancelAgent();
            this.success(tr('form.agent.success.remove'));
        } else {
            helper.agentFor(fp.name);
            this.success(tr('form.agent.success.set'));
        }
    }

    /** 发送传送请求表单 */
    async sendTeleportForm() {
        let title = tr('form.teleport.title') + '-' + VERSION_STRING;
        let content = tr('form.teleport.content');
        if (Settings.Common.color)
            content = `${Color.YELLOW}${content}${Color.RESET}`;
        const fp = await this.selectFakePlayer(title, content, fp => fp.online);
        if (fp == null) {
            if (DEBUG) this.success(this.Operations.Cancel);
            return;
        }

        const player = fp.player;
        if (player?.teleport(this.player.pos)) {
            this.success(tr('form.teleport.success'));
        } else {
            this.error(tr('form.teleport.fail'));
        }
    }

    /** 发送菜单 */
    async sendMenuForm() {
        let menus = [this.FormType.List, this.FormType.Quick, this.FormType.Teleport/*, this.FormType.Control*/];
        if (AgentHelperBase.ready) {
            menus.push(this.FormType.Agent);
        }
        menus = menus.concat(this.getAdditionalOps())
        let title = tr('form.menu.title') + VERSION_STRING;
        let content = this.manager.getControllerStatus({ includeDisabled: true }).join('\n');

        const { id } = await this.sendListForm(title, content, menus);
        if (id == null) {
            if (DEBUG)
                this.tell(this.Operations.Cancel);
            return;
        }
        let list;
        switch (menus[id]) {
            case this.FormType.Agent:
                return this.sendAgentForm();
            case this.FormType.Control:
                return this.sendControlForm();
            case this.FormType.List:
                return this.sendFPListForm();
            case this.FormType.Quick:
                return this.sendQuickForm();
            case this.FormType.Teleport:
                return this.sendTeleportForm();
            case this.Operations.Add:
                await this.sendAddForm();
                break;
            case this.Operations.LoginAll:
                list = await this.manager.loginAll();
                break;
            case this.Operations.LogoutAll:
                list = await this.controller.logoutAll();
                break;
            case this.Operations.RemoveAll:
                list = await this.controller.removeAll();
                break;
            default:
                this.error(Color.red(this.Operations.Unknown));
                if (DEBUG) throw new Error(this.Operations.Unknown);
                break;
        }
    }

}

/**
 * @description 假人管理
 */
class FakePlayerManager {
    /** @type {ControllerBase[]} 假人控制器 */
    controllers = [];

    /** 假人管理
     * @param {{default:string,LLFakePlayer:{},,...}} config 配置
     */
    constructor(config) {
        this.config = config;
        this.controllers = [];
    }
    /** 获取所有假人控制器
     * @returns {ControllerBase[]} 假人控制器
     */
    getAllControllerTypes() {
        return [
            LLFakePlayerController,
            WebSocketController,
            SimulatedPlayerController
        ];
        let types = [];
        let objStack = []
        function iter(obj) {
            objStack.push(obj);
            for (let key of Reflect.ownKeys(obj)) {
                logger.warn(keyStack.join('.'), '.', key, " = ", obj[key])
                if (obj[key] instanceof ControllerBase) {
                    types.push(obj[key]);
                } else if (typeof obj[key] === 'object') {
                    if (objStack.indexOf(obj[key]) === -1) {
                        keyStack.push(key);
                        iter(obj[key]);
                        keyStack.pop();
                    }
                }
            }
            objStack.pop();
        }
        logger.info(LLFakePlayerController)
        iter(globalThis);
        return types;
    }
    /** 初始化控制器
     * @param {Function<ControllerBase} controllerType 控制器
     */
    async initAndAddController(controllerType) {
        const controller = new controllerType(this.config[controllerType.FakePlayerTypeName]);
        await controller.init();
        if (controller.ready) {
            this.addController(controller);
        } else {
            throw new Error(`${controller.name} is not ready`);
        }
    }
    /**
     *
     * @param {{console:boolean,includeDisabled:boolean}} param0
     * @returns
     */
    getControllerStatus({
        console = false,
        includeDisabled = false
    } = {}) {
        const ColorHelper = console ? ConsoleColor : Color;
        let statusStrList = [];
        let controllerTypes = this.getAllControllerTypes();
        if (!includeDisabled) controllerTypes = controllerTypes.filter(c => c.enabled);
        for (let c of controllerTypes) {
            let color = ColorHelper.GRAY;
            let state = tr('controller.status.disabled');
            if (c.enabled) {
                const controller = manager.getController(c);
                color = controller?.ready ? ColorHelper.GREEN : ColorHelper.RED;
                state = controller?.ready ? tr('controller.status.ready') : tr('controller.status.error');
            }
            statusStrList.push(`${color}${c.FakePlayerTypeName}(${state})${ColorHelper.RESET}`);
        }
        return statusStrList;
    }

    async init() {
        const controllerTypes = this.getAllControllerTypes();
        const enabledControllers = controllerTypes.filter(c => c.enabled)
        const promises = enabledControllers.map(c => this.initAndAddController(c));
        const results = await Promise.allSettled(promises);
        for (let index in results) {
            if (results[index].status == 'rejected') {
                logger.error(`Fail to init ${enabledControllers[index].name}\n${results[index].reason.stack}`);
            }
        }

        logger.info('FakePlayerManager controllers status:');
        logger.info(this.getControllerStatus({ console: true, includeDisabled: true }));

        logger.error(new Error("Test Code").stack);
        const simc = this.getController(SimulatedPlayerController);
        const llc = this.getController(LLFakePlayerController);
        const clic = this.getController(WebSocketController);
        if (simc) simc.add("SimulatedPlayer");
        if (llc) llc.add("LLFakePlayer");
        if (clic) clic.add("ClientFakePlayer");
    }
    /** 添加假人控制器
     * @param {ControllerBase} controller 假人控制器
     */
    addController(controller) {
        controller.listen(ControllerBase.EventType.Add, this.onAdd.bind(this, controller));
        controller.listen(ControllerBase.EventType.Remove, this.onRemove.bind(this, controller));
        controller.listen(ControllerBase.EventType.Login, this.onLogin.bind(this, controller));
        controller.listen(ControllerBase.EventType.Logout, this.onLogout.bind(this, controller));
        this.controllers.push(controller);
    }
    /** 获取假人控制器
     * @param {string|Function} name
     */
    getController(name) {
        return this.controllers.find(c => c.constructor == name || c.name == name || c.constructor.FakePlayerTypeName == name);
    }

    /** @type {boolean} 是否准备就绪 */
    get ready() {
        if (this.controllers.length == 0)
            return false;
        return this.controllers.every(c => c.ready);
    }
    /** @type {FakePlayerBase[]} 假人列表 */
    get fakePlayerList() {
        let list = [];
        this.controllers.forEach(c => {
            for (let name in c.fakePlayers) {
                list.push(c.fakePlayers[name]);
            }
        });
        return list;
    }

    /** 获取假人对象
     * @param {String} name 假人名称
     * @returns {FakePlayerBase} 假人对象
     */
    getFakePlayer(name) {
        for (let fp of this.fakePlayerList) {
            if (fp.name == name)
                return fp;
        }
        return null;
    }

    /** 刷新假人数据 */
    async refreshData() {
        for (let c of this.controllers) {
            await c.refreshData();
        }
    }


    //========= APIs =========
    list() {
        return this.fakePlayerList;
    }
    /** 登陆所有假人
     * @returns {Promise<string[]>} 登陆结果
     * @memberof FakePlayerManager
     */
    async loginAll() {
        let list = [];
        for (let c of this.controllers) {
            list = list.concat(await c.loginAll());
        }
        return list;
    }

    //========= Form Api =========
    sendListForm(player) {
        (async () => {
            if (!this.ready) {
                if (DEBUG) debug('FakePlayerManager is not ready, waiting...');
                else logger.error('FakePlayerManager is not ready');
                await this.refreshData();
            } else {
                await this.refreshData();
            }
            let formHelper = new FakePlayerFormHelper(this, player);
            await formHelper.sendFPListForm();
        })().catch(e => {
            logError('sendListForm', e, player);
        });
    }
    sendQuickForm(player) {
        (async () => {
            if (!this.ready) {
                await this.refreshData();
            } else {
                this.refreshData();
            }
            let formHelper = new FakePlayerFormHelper(this, player);
            await formHelper.sendQuickForm();
        })().catch(e => {
            logError('sendQuickForm', e, player);
        });
    }
    sendControlForm(player) {
        (async () => {
            if (!this.ready) {
                await this.refreshData();
            } else {
                this.refreshData();
            }
            let formHelper = new FakePlayerFormHelper(this, player);
            await formHelper.sendControlForm();
        })().catch(e => {
            logError('sendControlForm', e, player);
        });
    }
    sendMenuForm(player) {
        (async () => {
            this.refreshData();
            let formHelper = new FakePlayerFormHelper(this, player);
            await formHelper.sendMenuForm();
        })().catch(e => {
            logError('sendMenuForm', e, player);
        });
    }
    sendAgentForm(player) {
        (async () => {
            if (!this.ready) {
                await this.refreshData();
            } else {
                this.refreshData();
            }
            let formHelper = new FakePlayerFormHelper(this, player);
            await formHelper.sendAgentForm();
        })().catch(e => {
            logError('sendAgentForm', e, player);
        });
    }
    sendAddForm(player) {
        let formHelper = new FakePlayerFormHelper(this, player);
        formHelper.sendAddForm().catch(e => {
            logError('sendAddForm', e, player);
        });
    }
    sendTeleportForm(player) {
        (async () => {
            if (!this.ready) {
                await this.refreshData();
            } else {
                this.refreshData();
            }
            let formHelper = new FakePlayerFormHelper(this, player);
            await formHelper.sendTeleportForm();
        })().catch(e => {
            logError('sendTeleportForm', e, player);
        });
    }

    hasController(name) {
        return this.controllers.some(c => c.name == name);
    }
    getAdditionalOps() {
        let ops = [];
        for (let c of this.controllers) {
            ops = ops.concat(c.getAdditionalOps());
        }
        return ops;
    }



    //========= Listener =========
    /** 添加假人回调
     * @param {ControllerBase} controller 控制器
     * @param {String} name 假人名称
     */
    onAdd(controller, name) {
        if (DEBUG) logger.info(`${controller.name} 添加了假人 ${name}`);
        const fp = this.getFakePlayer(name);
        if (fp.lastUpdateTime > 0) {
            logger.warn(`${controller.name} 尝试添加假人 ${name}，但是已经存在于 ${fp.controller.name} 中`);
        }
        controller.fakePlayers[name]?.update();
    }
    /** 移除假人回调
     * @param {ControllerBase} controller 控制器
     * @param {String} name 假人名称
     */
    onRemove(controller, name) {
        if (DEBUG) logger.info(`${controller.name} 移除了假人 ${name}`);
    }
    /** 假人登陆回调
     * @param {ControllerBase} controller 控制器
     * @param {String} name 假人名称
     */
    onLogin(controller, name) {
        if (DEBUG) logger.info(`${controller.name} 假人 ${name} 登录了`);
        controller.fakePlayers[name]?.update();
    }
    /** 假人登出回调
     * @param {ControllerBase} controller 控制器
     * @param {String} name 假人名称
     */
    onLogout(controller, name, state) {
        if (DEBUG) logger.info(`${controller.name} 假人 ${name} 断开了`);
        controller.fakePlayers[name]?.update();
    }

}

const MessageSystem = new class MessageSystem {
    messages = {};
    constructor() {
        this.listeners = {};
    }
    MessageType = {
        ForAllPlayer: 'ForAllPlayer',
        ForPlayer: 'ForPlayer',
    }
    addMessage(type, message, xuids = []) {
        const id = system.randomGuid();
        this.messages[id] = {
            type,
            message,
            xuids,
        };
        return id;
    }
    removeMessage(id) {
        delete this.messages[id];
    }
    getMessage(id) {
        return this.messages[id];
    }
    popMessageForPlayer(player) {
        const xuid = player instanceof String ? player : player.xuid;
        let list = [];
        const needRemove = [];
        for (let id in this.messages) {
            let message = this.messages[id];
            switch (message.type) {
                case this.MessageType.ForAllPlayer:
                    if (!message.xuids.includes(xuid)) {
                        list.push(message);
                        message.xuids.push(xuid);
                    }
                    break;
                case this.MessageType.ForPlayer:
                    if (message.xuids.includes(xuid)) {
                        list.push(message);
                        message.xuids.splice(message.xuids.indexOf(xuid), 1);
                        if (message.xuids.length == 0) {
                            needRemove.push(id);
                        }
                    }
                    break;
            }
        }
        const messages = list.map(m => m.message);
        for (let id of needRemove) {
            this.removeMessage(id);
        }
        return messages;
    }
}();


class CommandOutput {
    constructor(player = undefined) {
        this._player = player;
    }
    get player() {
        return this._player;
    }
    success(...msg) {
        if (this._player) this._player.tell(Color.green(msg.join(" ")));
        else logger.info(ConsoleColor.GREEN, ...msg, ConsoleColor.RESET);
    }
    error(...msg) {
        if (this._player) this._player.tell(Color.red(msg.join(" ")));
        else logger.error(...msg);
    }
    addMessage(...msg) {
        success(...msg);
    }
}
class BlockPos {
    x = 0;
    y = 0;
    z = 0;
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static from(player) {
        return new BlockPos(player.pos.x, player.pos.y, player.pos.z);
    }
    toIntPos(dimid = 0) {
        return mc.newIntPos(this.x, this.y, this.z, dimid);
    }
    toFloatPos(dimid = 0) {
        return mc.newFloatPos(this.x, this.y, this.z, dimid);
    }
}
function buildFollowPath(player, sp) {
    const stepDistance = 10;
    let path = [];
    const pos = BlockPos.from(player);
    const target = BlockPos.from(sp);
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const dy = target.y - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const step = Math.ceil(distance / stepDistance);
    for (let i = 0; i < step; i++) {
        const x = pos.x + dx / step * i;
        const y = pos.y + dy / step * i;
        const z = pos.z + dz / step * i;
        path.push(new BlockPos(x, y, z));
    }
    return path.map(p => p.toFloatPos());
}

function getNextPos(player, sp) {
    const distance = 5;
    const pos = BlockPos.from(sp);
    const target = BlockPos.from(player);
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const dy = target.y - pos.y;
    const x = Math.abs(dx) < distance ? target.x : pos.x + dx / Math.abs(dx) * distance;
    const y = Math.abs(dy) < distance ? target.y : pos.y + dy / Math.abs(dy) * distance;
    const z = Math.abs(dz) < distance ? target.z : pos.z + dz / Math.abs(dz) * distance;
    return new BlockPos(x, y, z).toFloatPos();
}



IntPos.prototype.toJSON = function () {
    return [this.x, this.y, this.z, this.dimid];
}

const TaskType = {
    Fight: 'Fight',
}


class CommandManager {
    /** 指令管理器
     * @param {FakePlayerManager} manager 假人管理器
     */
    constructor(manager) {
        this.config = Settings.command;
        this.manager = manager;
        this.commands = {};
        this.listeners = {};
        this.config.FakePlayerGUI.onlyPlayer = true;
    }
    onManagerCommand(player, args) {
        if (DEBUG) logger.info(`${player?.name} 执行 Manager 指令，参数： ${args?.join(' ')}`);
        // logger.error(`remove ${FPAPI.removeAll()}`);
        // logger.warn(`logout all: ${FPAPI.logoutAll()}`);
        for (let controller of this.manager.controllers) {
            let fpAndStatesStr = []
            for (const name in controller.fakePlayers) {
                const fp = controller.fakePlayers[name];
                const online = fp.state == FakePlayerState.Online;
                const fpAndStateStr = `${fp.name}(${online ? 'Online' : 'Offline'})`;
                if (online) {
                    fpAndStatesStr.push(Color.green(fpAndStateStr));
                } else {
                    fpAndStatesStr.push(Color.red(fpAndStateStr));
                }
            }
            logger.info(Color.toConsole(`${controller.name}: ${fpAndStatesStr.join(', ')}`));
        }
    }

    openGUI(player, formType, ...args) {
        let error = '';
        switch (formType.toLowerCase()) {
            case 'h':
            case 'help':
            case '?':
                error = sendHelpForm(player);
                break;
            case 'q':
            case 'quick':
                error = this.manager.sendQuickForm(player);
                break
            case 'l':
            case 'list':
                error = this.manager.sendListForm(player);
                break
            case 'm':
            case 'menu':
                error = this.manager.sendMenuForm(player);
                break
            case 'ct':
            case 'control':
                error = this.manager.sendControlForm(player);
                break
            case 'a':
            case 'agent':
                error = this.manager.sendAgentForm(player);
                break
            case 'add':
                error = this.manager.sendAddForm(player);
                break
            case 't':
            case 'teleport':
                error = this.manager.sendTeleportForm(player);
                break
            default:
                error = this.manager.sendMenuForm(player);
        }
        return error;
    }
    onGuiCommand(player, args) {
        if (!player) return;
        if (DEBUG) logger.info(`${player?.name} 执行 GUI 指令，参数： ${args?.join(' ')}`);
        if (DEBUG) {
            logger.setPlayer(player);
            logger.info(`${player?.name} send fpg ${args?.join(' ')}`);
            logger.info(`${this.manager.controllers.length} controllers`);
        }
        try {
            const operation = args[0]?.toLowerCase() ?? 'list';
            this.openGUI(player, operation, ...args.slice(1));
        } catch (e) {
            logger.error(e.stack);
        }
    }
    checkArgCount(output, args, count) {
        if (args.length < count) {
            output.error(`参数不足，需要 ${count} 个参数`);
            return false;
        }
        return true;
    }
    static timer = undefined;
    onControlCommand(player, args) {
        if (DEBUG) logger.info(`${player?.name} 执行 Control 指令，参数： ${args?.join(' ')}`);
        const output = new CommandOutput(player);
        if (!this.checkArgCount(output, args, 2))
            return;
        const sp = mc.getPlayer(args[0]);
        if (!sp) {
            output.error(`未找到玩家 ${args[0]}`);
            return;
        }
        const op = args[1];
        switch (op) {
            case 'follow':
            case 'f':
                if (this.constructor.timer) clearInterval(this.constructor.timer);
                let sleep = 0;
                this.constructor.timer = setInterval(() => {
                    if (!player || !sp) {
                        clearInterval(this.constructor.timer);
                        this.constructor.timer = undefined;
                        return;
                    }
                    const entt = sp.getEntityFromViewVector(2);
                    if (entt) {
                        // output.success(`${sp.name} Attack ${player.name}`);
                        sp.simulateAttack();
                        sp.simulateJump();
                    }
                    const ppos = player.pos;
                    const sppos = sp.pos;
                    const distance = (ppos.x - sppos.x) ** 2 + (ppos.y - sppos.y) ** 2 + (ppos.z - sppos.z) ** 2;
                    if (distance < 12) {
                        sleep = 0;
                    }
                    if (sleep > 0) {
                        sleep--;
                        return;
                    }
                    if (distance > 12) {
                        const nextPos = getNextPos(player, sp);
                        // output.success(`${sp.name} Navigate To ${player.name} ${nextPos.x.toFixed(2)} ${nextPos.y.toFixed(2)} ${nextPos.z.toFixed(2)}`);
                        sp.simulateNavigateTo(nextPos);
                        sleep = 10;
                        return;
                    }
                    // output.success(`${sp.name} Look At ${player.name}`);
                    sp.simulateLookAt(player);
                    sleep = 2;
                }, 50);
        }
    }
    registerCommand(name, config) {
        const callback = {
            FakePlayerManager: this.onManagerCommand.bind(this),
            FakePlayerGUI: this.onGuiCommand.bind(this),
            FakePlayerControl: this.onControlCommand.bind(this),
        }[name];
        const desc = {
            FakePlayerManager: tr('command.description.manager'),
            FakePlayerGUI: tr('command.description.gui'),
            FakePlayerControl: tr('command.description.control'),
        }[name];
        if (!callback) {
            throw new Error(`指令 ${name} 未定义`);
        }
        const commandName = name.toLowerCase();
        if (config.onlyPlayer === undefined || config.onlyPlayer == false) {
            mc.regConsoleCmd(commandName, desc, callback.bind(this, undefined));
            if (config.alias?.length)
                mc.regConsoleCmd(config.alias, desc, callback.bind(this, undefined));
        }
        mc.regPlayerCmd(commandName, desc, callback, config.permission);
        if (config.alias?.length)
            mc.regPlayerCmd(config.alias, desc, callback, config.permission);
    }
    registerCommands() {
        for (let name in this.config) {
            const config = this.config[name];
            if (config.enabled) {
                if (DEBUG) logger.info(`register command ${name}`);
                this.registerCommand(name, config);
            }
        }
    }
}

const manager = new FakePlayerManager(Settings.manager);
const command = new CommandManager(manager);
command.registerCommands();

logger.warn(manager.toString())
manager.init().then(() => {
    logger.info('FakePlayerManager 初始化完成');
}).catch(e => {
    logger.error('FakePlayerManager 初始化失败', e.stack);
});


if (false) {

    /**
     * @param {Function} func sync函数
     * @returns {Function} 包装后的sync函数
     */
    function sync_to_async(func) {
        return function (...args) {
            return new Promise((resolve, reject) => {
                func((err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }, ...args);
            });
        }
    }

    /**
     * @param {Function} func async函数
     * @returns {Function} sync函数
     */
    function async_to_sync(func) {
        return function (callback, ...args) {
            func(...args).then(data => {
                callback(null, data);
            }).catch(err => {
                callback(err);
            });
        };
    }


    // ============================== Test Code ==============================
    let players = async_to_sync(controllerC.list.bind(controllerC))((err, list) => {
        if (err) {
            logger.error(`list error: \n${err.stack}`);
            return;
        }
        logger.info("Get player list:", list);
    });
    logger.warn(`test`);
    try {
        logger.warn(`FakePlayerManager: ${players.length} fake players found`);
        logger.warn(`test`);
    } catch (err) {
        logger.error(`test`);
    }
    function js_direct_call() {
        return ["aaa", "bbb"];
    }
    ll.export(js_direct_call, "direct_call");
    const direct_func = ll.import("direct_call");
    function js_export_call() { direct_func(); };
    function dll_export_call() { FPAPI.list() };
    function script_x_call() { mc.getBDSVersion() };

    function testLogTime(func, ...args) {
        const start = Date.now();
        const count = 100000;
        for (let i = 0; i < count; i++)
            func(...args);
        const end = Date.now();
        // toFixed
        const time = (end - start) / count * 1000;
        logger.warn(`func: ${func.name},\t time: ${time.toFixed(3)}ns`);
    }


    setTimeout(() => {
        return;
        testLogTime(js_direct_call);
        testLogTime(js_export_call);
        testLogTime(dll_export_call);
        testLogTime(script_x_call);
        logger.info(`===============================================`);
        testLogTime(js_direct_call);
        testLogTime(js_export_call);
        testLogTime(dll_export_call);
        testLogTime(script_x_call);
        logger.info(`===============================================`);
        testLogTime(js_direct_call);
        testLogTime(js_export_call);
        testLogTime(dll_export_call);
        testLogTime(script_x_call);
    }, 500);
    // logger.warn(`players: ${players.join(', ')}`);
}

if (false) {
    let func = () => {
        logger.warn(`test`);
    }
    ll.export((...args) => {
        func(...args)
    }, "Test")
    ll.import("Test")();
    func = (num) => {
        logger.warn(`new test ${num}`);
    }
    ll.import("Test")(11451);
}

if (DEBUG) {
    logger.info(ConsoleColor)
    logger.warn(`${ConsoleColor.AQUA}ConsoleColor.AQUA!${ConsoleColor.RESET}`);
    logger.warn(`${Color.AQUA}Color.AQUA!${Color.RESET}`);
    logger.warn(ConsoleColor.aqua("ConsoleColor.aqua"))
    logger.warn(Color.aqua("Color.aqua"))
    logger.error(typeof Color.aqua)
}
