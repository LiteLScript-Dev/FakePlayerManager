/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// Controller for FakePlayer Manageer
// Author xiaoqch
// Please use this plugin with https://github.com/ddf8196/FakePlayer

//LiteXLoader Dev Helper
/// <reference path="c:\Users\xiaoqch\.vscode\extensions\moxicat.lxldevhelper-0.1.8/Library/JS/Api.js" /> 

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

////////////////////////////////// Global Config /////////////////////////////////
const lastestOnlineTimePath = `${PluginDir}/lastOnlineTimes.json`;

/**
 * 是否为支持获取所有假人状态的假人客户端版本
 * @type Boolean
 */
let isNewFPVersion = true;
/**
 * 假人代理插件是否已安装
 * @type Boolean
 */
let agentInstalled = false;

////////////////////////////////// I18n /////////////////////////////////
// extern function tr(_key, ..._args);
// extern function trInfo(_key, ..._args);
// extern function trError(_key, ..._args);

////////////////////////////////// Constant /////////////////////////////////
// const STATES=['连接中', '已连接', '断开连接中','已断开连接', '重新连接中', '停止中', '已停止']
/**
 * 假人连接状态
 * @type Integer
 */
const STATES = {
    Connecting: 0,
    Connected: 1,
    Disconnecting: 2,
    Disconnected: 3,
    Reconnecting: 4,
    Stopping: 5,
    Stopped: 6
}

/**
 * 获取状态翻译文本
 * @param {STATES} state 状态
 * @param {Boolean} color 是否需要颜色
 * @returns {String} 翻译文本
 */
function getStateStr(state, color = false) {
    if (!Settings.color) color = false;
    // return "§00§11§22§33§44§55§66§77§88§99§aa§bb§cc§dd§ee§ff§gg§hh";
    switch (state) {
        case STATES.Connecting:
            if (color)
                return `§l§e${tr('fp.state.connecting')}§r`;
            return tr('fp.state.connecting');
        case STATES.Connected:
            if (color)
                return `§l§9${tr('fp.state.connected')}§r`;
            return tr('fp.state.connected');
        case STATES.Disconnecting:
            if (color)
                return `§c${tr('fp.state.disconnecting')}§r`;
            return tr('fp.state.disconnecting');
        case STATES.Disconnected:
            if (color)
                return `§l§c${tr('fp.state.disconnected')}§r`;
            return tr('fp.state.disconnected');
        case STATES.Reconnecting:
            if (color)
                return `§l§e${tr('fp.state.reconnecting')}§r`;
            return tr('fp.state.reconnecting');
        case STATES.Stopping:
            if (color)
                return `§c${tr('fp.state.stopping')}§r`;
            return tr('fp.state.stopping');
        case STATES.Stopped:
            if (color)
                return `§l§c${tr('fp.state.stopped')}§r`;
            return tr('fp.state.stopped');
        default:
            if (color)
                return `§k${tr('fp.state.unknown')}§r`;
            return tr('fp.state.unknown');
    }
}

/**
 * 表单菜单按钮
 * @type {Map<String, String>}
 */
const FORM_MENU = {
    List: tr('form.menu.list'),
    Quick: tr('form.menu.quick'),
    Agent: tr('form.menu.agent'),
    Control: tr('form.menu.control'),
    Teleport: tr('form.menu.teleport'),
}

/**
 * 获取格式化的 Websocket 回调消息
 * @param {Object} msg 状态
 * @returns {String} 翻译文本
 */
function getResponseStr(msg) {
    if (!msg) {
        return tr('ws.response.null');
    }
    if (!msg.type || !Object.prototype.hasOwnProperty.call(msg, 'data')) {
        return tr('ws.response.unknown', msg);
    }
    switch (msg.type) {
        case "list":
            return tr('ws.response.list', Color.gold(msg.data.list.length), msg.data.list.map(name => Color.green(name)).join(', '));
        case "add":
            if (msg.data.success) return tr('ws.response.add', Color.green(msg.data.name));
            else return Color.red(tr('ws.response.add.fail', msg.data.name, msg.data.reason));
        case "remove":
            if (msg.data.success) return tr('ws.response.remove', Color.green(msg.data.name));
            else return Color.red(tr('ws.response.remove.fail', msg.data.name, msg.data.reason));
        case "getState":
            if (msg.data.success) return tr('ws.response.get_state', Color.green(msg.data.name), getStateStr(msg.data.state, true));
            else return Color.red(tr('ws.response.get_state.fail', msg.data.name, msg.data.reason));
        case "getState_all": {
            let allStateStr = Color.yellow(tr('ws.response.get_all_state.first'));
            let playersData = msg.data.playersData;
            for (let playerName in playersData) {
                let data = playersData[playerName];
                allStateStr += "\n" + tr('ws.response.get_all_state.item', Color.green(playerName), getStateStr(data.state, true), data.allowChatControl);
            }
            return allStateStr;
        }
        case "disconnect":
            if (msg.data.success) return tr('ws.response.disconnect', Color.green(msg.data.name));
            else return Color.red(tr('ws.response.disconnect.fail', msg.data.name, msg.data.reason));
        case "connect":
            if (msg.data.success) return tr('ws.response.connect', Color.green(msg.data.name));
            else return Color.red(tr('ws.response.connect.fail', msg.data.name, msg.data.reason));
        case "remove_all":
            return tr('ws.response.remove_all', msg.data.list.map(name => Color.green(name)).join(', '));
        case "disconnect_all":
            return tr('ws.response.disconnect_all', msg.data.list.map(name => Color.green(name)).join(', '));
        case "connect_all":
            return tr('ws.response.connect_all', msg.data.list.map(name => Color.green(name)).join(', '));
        case "setChatControl":
            if (msg.data.success) return tr('ws.response.set_chat_control', Color.green(msg.data.name));
            else return Color.red(tr('ws.response.set_chat_control.fail', msg.data.name, msg.data.reason));
        default:
            // if(Settings.debugMode) throw new Error(`Unknown type: ${msg.type}`);
            return Color.red(tr('ws.response.unknown', JSON.stringify(msg)));
    }
}

/**
 * 
 * @param {string} type 数据类型
 * @param {object|any[]} data 根据数据类型而定
 */
function getResDataStr(type, data) {
    switch (type) {
        case "list":
            return getResponseStr({ type: "list", data: { list: data } });
        case "add":
            return getResponseStr({ type: "add", data: data });
        case "remove":
            return getResponseStr({ type: "remove", data: data });
        case "getState":
            return getResponseStr({ type: "getState", data: data });
        case "getState_all":
            return getResponseStr({ type: "getState_all", data: { playersData: data } });
        case "disconnect":
            return getResponseStr({ type: "disconnect", data: data });
        case "connect":
            return getResponseStr({ type: "connect", data: data });
        case "remove_all":
            return getResponseStr({ type: "remove_all", data: { list: data } });
        case "disconnect_all":
            return getResponseStr({ type: "disconnect_all", data: { list: data } });
        case "connect_all":
            return getResponseStr({ type: "connect_all", data: { list: data } });
        case "setChatControl":
            return getResponseStr({ type: "setChatControl", data: data });
        default:
            return getResponseStr({ type: "unknown", data: data });
    }
}

////////////////////////////////// Variable /////////////////////////////////
/**
 * 传送请求列表
 * @type Array<FakePlayer>
 */
let tpQuery = {};
/**
 * 代理请求列表
 * @type Array<FakePlayer>
 */
let agentQuery = {};

/**
 * 添加传送请求
 * @param {String} name 假人名称
 * @param {FloatPos} pos 传送位置
 */
function addTpQuery(name, pos) {
    tpQuery[name] = { x: pos.x, y: pos.y, z: pos.z, dimid: pos.dimid };
}

/**
 * 添加代理请求
 * @param {String} masterName 假人名称
 * @param {String} agentName 代理假人名称
 */
function addAgentQuery(masterName, agentName) {
    agentQuery[masterName] = agentName;
}

mc.listen("onJoin", function (player) {
    if (tpQuery && Object.prototype.hasOwnProperty.call(tpQuery, player.name)) {
        let pos = tpQuery[player.name];
        player.teleport(pos.x, pos.y, pos.z, pos.dimid);
        delete tpQuery[player.name];
    }
    if (agentQuery && Object.prototype.hasOwnProperty.call(agentQuery, player.name)) {
        let masterName = agentQuery[player.name];
        let master = mc.getPlayer(masterName);
        if (master) {
            let res = mc.runcmdEx('opagent set "' + player.name + '" "' + masterName + '"');
            if (res.success) {
                player.tell(tr('form.agent.set.success'));
            }
            else {
                player.tell(Color.red(tr('form.agent.set.fail')));
            }
        }
        delete agentQuery[player.name];
    }
    FakePlayerManager.onPlayerJoin(player);
});

mc.listen("onLeft", function (player) {
    FakePlayerManager.onPlayerLeft(player);
});


class FakePlayerGroup {
    /** @type {string} 分组名 */
    name = '';
    /** @type {FakePlayer[]} 假人列表 */
    fakePlayers = [];
    /**
     * 创建假人组
     * @param {string} name 名称
     * @param {FakePlayer[]} fakePlayers 假人列表
     */
    constructor(name, fakePlayers) {
        this.name = name;
        this.fakePlayers = fakePlayers;
    }
    /**
     * 连接分组
     * @returns {success:boolean, list:{name:string, success:boolean, reason:string}[]} 连接结果
     */
    async connect() {
        let resulltList = [];
        for (let fakePlayer of this.fakePlayers) {
            let res = await fakePlayer.connect();
            resulltList.push(res);
        }
        return { success: resulltList.length === this.fakePlayers.length, list: resulltList };
    }
    /**
     * 断开分组
     * @returns {success:boolean, list:{name:string, success:boolean, reason:string}[]} 断开结果
     */
    async disconnect() {
        let resulltList = [];
        for (let fakePlayer of this.fakePlayers) {
            let res = await fakePlayer.disconnect();
            resulltList.push(res);
        }
        return { success: resulltList.length === this.fakePlayers.length, list: resulltList };
    }
}


class FakePlayer {
    /**
     * @type {String} 假人皮肤
     */
    skin = 'steve';
    /**
     * @type {FakePlayerWebSocketController} Websocket 控制器
     */
    controller;
    /**
     * @type {String} 假人名称
     */
    name;
    /**
     * @type {String} 假人状态
     */
    state;
    /**
     * @type {Boolean} 是否允许聊天控制
     */
    allowChatControl;
    /**
     * @type {Integer} 假人最后在线时间
     */
    lastOnline;
    /**
     * @type {FakePlayerGroup} 假人分组
     */
    ownerGroup;
    /**
     * 假人
     * @param {FakePlayerWebSocketController} Websocket 控制器
     * @param {String} name 假人名称
     * @param {STATES} state 假人状态
     * @param {Boolean} allowChatControl 是否允许聊天控制
     */
    constructor(controller, name, state, allowChatControl) {
        this.name = name;
        this.state = state;
        this.allowChatControl = allowChatControl;
        this.controller = controller;
    }
    /**
     * @type {Player} 假人玩家对象
     */
    get player() {
        return mc.getPlayer(this.name);
    }
    /**
     * @type {String} XUID
     */
    get xuid() {
        if (this.player)
            return this.player.xuid;
        return '';
    }
    /**
     * @type {String} 假人状态格式化字符串
     */
    get stateStr() {
        return getStateStr(this.state);
    }
    get stateStrWithColor() {
        return getStateStr(this.state, true);
    }

    /**
     * 连接假人
     * @returns {Promise<{name:string, success:boolean, reason:string}>} 连接结果
     */
    async connect() {
        return await this.controller.connect(this.name);
    }
    /**
     * 连接假人组
     * @returns {Promise<string[]>} 连接成功的假人列表
     */
    async connectGroup() {
        return this.ownerGroup.connect();
    }
    /**
     * 断开假人连接
     * @returns {Promise<{name:string, success:boolean, reason:string}>} 断开结果
     */
    async disconnect() {
        return this.controller.disconnect(this.name);
    }
    /**
     * 移除假人
     * @returns {Promise<{name:string, success:boolean, reason:string}>} 移除结果
     */
    async remove() {
        return this.controller.remove(this.name);
    }
    /**
     * 设置假人聊天控制
     * @returns {Promise<{name:string, success:boolean, reason:string}>} 设置结果
     */
    async setChatControl(allowChatControl) {
        return this.controller.setChatControl(this.name, allowChatControl);
    }
    /**
     * 启用假人聊天控制
     * @returns {Promise<{name:string, success:boolean, reason:string}>} 设置结果
     */
    async trunOnControl() {
        return this.setChatControl(true);
    }
    /**
     * 禁用假人聊天控制
     * @returns {Promise<{name:string, success:boolean, reason:string}>} 设置结果
     */
    async trunOffControl() {
        return this.setChatControl(false);
    }
    /**
     * 添加假人
     * @returns {Promise<{name:string, success:boolean, reason:string}>} 添加结果
     */
    async add() {
        return this.controller.add(this.name, this.allowChatControl, this.skin);
    }
    /**
     * 设置假人代理
     * @param {String} player 玩家名称
     * @return {Boolean} 是否成功
     */
    setAgent(player) {
        return this.controller.manager.setAgent(this.name, player);
    }
    /**
     * 取消假人代理
     * @return {Boolean} 是否成功
     */
    cancelAgent() {
        let agent = this.getAgent();
        if (agent) {
            return this.controller.manager.cancelAgent(agent);
        }
        return false;
    }
    /**
     * 获取假人代理
     * @return {String} 代理玩家名称
     */
    getAgent() {
        for (let { agent, target } of this.controller.manager.listAgent()) {
            if (target === this.name) {
                return agent;
            }
        }
        return null;
    }
    set agent(player) {
        if (Settings.debugMode) debug(`${this.name} set agent ${player}`);
        if (player) {
            this.setAgent(player);
        } else {
            this.cancelAgent();
        }
    }
    get agent() {
        return this.getAgent();
    }
}

class FakePlayerFormHelper {
    /**
     * 假人管理表单
     * @param {FakePlayerManager} fakePlayerManager 假人管理器
     * @param {Player} player 玩家对象
     */
    constructor(fakePlayerManager, player) {
        this.manager = fakePlayerManager;
        this.controller = this.manager.controller;
        this.player = player;
        this.xuid = player.xuid;
    }

    get player() {
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

    /**
     * 异步发送表单
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
                    if (Settings.debugMode) debug(form.constructor.name);
                    if (form instanceof LLSE_SimpleForm) {
                        if (Settings.debugMode) debug(`${this.name} send form ${form.constructor.name} id: ${dataOrId}`);
                        resolve({ player, id: dataOrId });
                    } else {
                        if (Settings.debugMode) debug(`${this.name} send form ${form.constructor.name} data: ${dataOrId}`);
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

    /**
     * @type {String} 假人操作按钮
     */
    OPERATIONS = {
        Add: tr('form.op.add'),
        Remove: tr('form.op.remove'),
        Connect: tr('form.op.connect'),
        Disconnect: tr('form.op.disconnect'),
        ConnectAll: tr('form.op.connect_all'),
        DisconnectAll: tr('form.op.disconnect_all'),
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
    /**
     * 发送列表表单
     * @param {String} title 标题
     * @param {String} content 内容
     * @param {Array<String>} btnsText 按钮文本
     * @returns {Promise<{player:Player,id:Integer?,data:Array<any>?}>} 表单结果
     */
    async sendListForm(title, content, btnsText) {
        let listForm = mc.newSimpleForm();
        if (title) listForm.setTitle(title);
        if (content) listForm.setContent(content);
        btnsText.forEach(text => {
            listForm.addButton(text);
        });
        return this.sendForm(listForm);
    }

    /**
     * 发送假人列表表单
     * @returns {Promise<{player:Player,id:Integer?,data:Array<any>?}>} 表单结果
     */
    async sendFPListForm() {
        let title = tr('form.list.title') + '-' + VERSION_STRING;
        let content = isNewFPVersion ? tr('form.list.content') : tr('form.list.content.old');
        if (Settings.color)
            content = Color.yellow(content);
        let fpNames = this.manager.getNameList();
        let additionalOps = [this.OPERATIONS.Add, this.OPERATIONS.ConnectAll, this.OPERATIONS.DisconnectAll];
        if (Settings.allowRemoveAll) {
            additionalOps.push(this.OPERATIONS.RemoveAll);
        }
        let fpText = [];
        fpNames.forEach(fpName => {
            let fp = this.manager.getFakePlayer(fpName);
            let stateStr = fp.stateStr;
            if (Settings.color) {
                switch (fp.state) {
                    case STATES.Connected:
                        stateStr = `${Color.DARK_GREEN}${stateStr}${Color.RESET}`;
                        break;
                    case STATES.Stopped:
                    case STATES.Disconnected:
                        stateStr = `${Color.DARK_RED}${stateStr}${Color.RESET}`;
                        break;
                    default:
                        stateStr = `${Color.GOLD}${stateStr}${Color.RESET}`;
                        break;
                }
            }
            let str = `${Color.DARK_BLUE}${fpName}${Color.RESET} - ${stateStr}`;
            if (isNewFPVersion) {
                str += ' - ';
                str += fp.allowChatControl ? `${Color.DARK_GREEN}${tr('form.control.on')}${Color.RESET}` : `${Color.DARK_RED}${tr('form.control.off')}${Color.RESET}`;
            }
            fpText.push(str);
        })
        let btnsText = fpText.concat(additionalOps.map(op => `${Color.DARK_BLUE}${Color.BOLD}${op}${Color.RESET}`));
        const { id } = await this.sendListForm(title, content, btnsText);

        if (id == null) {
            if (Settings.debugMode)
                this.tell(this.OPERATIONS.Cancel);
            return;
        }
        if (Settings.debugMode) debug(`${this.name} send list form, operation: ${btnsText[id]}`);
        if (id < fpNames.length) {
            await this.sendOperateForm(fpNames[id]);
        } else {
            let data;
            switch (additionalOps[id - fpNames.length]) {
                case this.OPERATIONS.Add:
                    await this.sendAddForm();
                    break;
                case this.OPERATIONS.ConnectAll:
                    data = await this.controller.connectAll();
                    this.tell(getResponseStr({ type: "connect_all", data: { list: data } }));
                    break;
                case this.OPERATIONS.DisconnectAll:
                    data = await this.controller.disconnectAll();
                    this.tell(getResponseStr({ type: "disconnect_all", data: { list: data } }));
                    break;
                case this.OPERATIONS.RemoveAll:
                    data = await this.controller.removeAll();
                    this.tell(getResponseStr({ type: "remove_all", data: { list: data } }));
                    break;
                default:
                    logger.error(this.OPERATIONS.Unknown);
                    this.tell(this.OPERATIONS.Unknown);
                    if (Settings.debugMode) throw new Error(this.OPERATIONS.Unknown);
                    break;
            }
        }
    }
    /**
     * 发送操作表单
     * @param {String} fpName 假人名称
     */
    async sendOperateForm(fpName) {
        let opForm = mc.newSimpleForm();
        opForm.setTitle(tr('form.op.title'));
        let fp = this.manager.getFakePlayer(fpName);
        let content = fpName + ' - ' + fp.stateStrWithColor;
        if (isNewFPVersion) {
            content += ' - ';
            content += fp.allowChatControl ? tr('form.control.on') : tr('form.control.off');
        }
        if (Settings.color)
            content = `${Color.YELLOW}${content}${Color.RESET}`;
        opForm.setContent(content);

        let ops = [];
        if (fp.state == STATES.Connected) {
            ops.push(this.OPERATIONS.Disconnect);
        } else if (fp.state == STATES.Stopped) {
            ops.push(this.OPERATIONS.Connect);
        } else {
            ops.push(this.OPERATIONS.Connect);
            ops.push(this.OPERATIONS.Disconnect);
        }
        if (isNewFPVersion) {
            if (fp.allowChatControl) {
                ops.push(this.OPERATIONS.TrunOffControl);
            } else {
                ops.push(this.OPERATIONS.TrunOnControl);
            }
        } else {
            ops.push(this.OPERATIONS.TrunOnControl);
            ops.push(this.OPERATIONS.TrunOffControl);
        }
        ops = ops.concat([this.OPERATIONS.Remove]);
        if (agentInstalled && fp.state == STATES.Connected) {
            ops.push(this.OPERATIONS.AgentFor);
        }
        ops.forEach(op => {
            opForm.addButton(op);
        })
        const { id } = await this.sendForm(opForm)
        if (id == null) {
            if (Settings.debugMode)
                this.tell(this.OPERATIONS.Cancel);
            return;
        }
        let data;
        if (Settings.debugMode) debug(`selected operation ${ops[id]} in operate form`);
        switch (ops[id]) {
            case this.OPERATIONS.Connect:
                data = await this.controller.connect(fpName);
                this.tell(getResponseStr({ type: "connect", data }));
                break;
            case this.OPERATIONS.Disconnect:
                data = await this.controller.disconnect(fpName);
                this.tell(getResponseStr({ type: "disconnect", data }));
                break;
            case this.OPERATIONS.TrunOnControl:
                data = await this.controller.setChatControl(fpName, true);
                this.tell(getResponseStr({ type: "setChatControl", data }));
                break;
            case this.OPERATIONS.TrunOffControl:
                data = await this.controller.setChatControl(fpName, false);
                this.tell(getResponseStr({ type: "setChatControl", data }));
                break;
            case this.OPERATIONS.Remove:
                data = await this.controller.remove(fpName);
                this.tell(getResponseStr({ type: "remove", data }));
                break;
            case this.OPERATIONS.AgentFor:
                if (!fp.setAgent(this.player)) {
                    this.tell(tr('form.agent.set.fail'));
                }
                break;
            default:
                logger.error(this.OPERATIONS.Unknown);
                this.tell(this.OPERATIONS.Unknown);
                if (Settings.debugMode) throw new Error(this.OPERATIONS.Unknown);
                break;
        }
    }

    /**
     * 发送添加假人表单
     */
    async sendAddForm() {
        let skins = ['steve', 'alex'];
        let addForm = mc.newCustomForm();
        addForm.setTitle(tr('form.add.title'));
        addForm.addInput(tr('form.add.input_name'));
        addForm.addDropdown(tr('form.add.select_skin'), skins);
        addForm.addSwitch(tr('form.add.allow_control'), true);
        addForm.addSwitch(tr('form.add.auto_teleport'), true);
        addForm.addSwitch(tr('form.add.auto_agent'), true);
        const { data } = await this.sendForm(addForm);
        if (data == null) {
            if (Settings.debugMode)
                this.tell(this.OPERATIONS.Cancel);
            return;
        }
        let fp = new FakePlayer();
        fp.name = data[0];
        fp.controller = this.controller;
        fp.skin = skins[data[1]];
        fp.allowChatControl = data[2];
        const addResult = await fp.add();
        this.tell(getResponseStr({ type: "add", data: addResult }));
        if (data[3]) addTpQuery(fp.name, this.player.pos);
        if (data[4]) addAgentQuery(fp.name, this.player.name);
    }

    /**
     * 发送快速上下线表单
     */
    async sendQuickForm() {
        let quickForm = mc.newCustomForm();
        quickForm.setTitle(tr('form.quick.title'));
        quickForm.addLabel(`${Color.YELLOW}${tr('form.quick.content')}${Color.RESET}`);
        let fpNames = this.manager.getNameList();
        fpNames.forEach(fpName => {
            let connected = this.manager.getState(fpName) == STATES.Connected;
            let stateStr = this.manager.getStateStr(fpName);
            if (Settings.color) {
                fpName = `${connected ? Color.GREEN : Color.RED}${fpName}${Color.RESET}`;
                stateStr = `${connected ? Color.GREEN : Color.RED}${stateStr}${Color.RESET}`;
            }
            let text = `${fpName} - ${stateStr}`;
            quickForm.addSwitch(text, connected);
        })
        const { data } = await this.sendForm(quickForm)
        if (data == null) {
            if (Settings.debugMode)
                this.tell(this.OPERATIONS.Cancel);
            return;
        }
        for (let index = 0; index < data.length - 1; ++index) {
            let select = data[index + 1];
            let fp = this.manager.getFakePlayer(fpNames[index]);
            let isConnected = fp.state == STATES.Connected;
            if (select != isConnected) {
                if (select) {
                    fp.connect();
                } else {
                    fp.disconnect();
                }
            }
        }
    }

    /**
     * 发送代理设置表单
     */
    async sendAgentForm() {
        let target = this.manager.getAgentTarget(this.name);
        if (Settings.debugMode) debug(`agent target is ${target}`);
        let agentMsg;
        if (target) {
            agentMsg = tr('form.agent.current') + target;
        } else {
            agentMsg = tr('form.agent.current.none');
        }
        if (Settings.color)
            agentMsg = `${Color.YELLOW}${agentMsg}${Color.RESET}`;
        let title = tr('form.agent.title') + '-' + VERSION_STRING;
        let fpNames = this.manager.getNameList();
        let onlineList = [];
        fpNames.forEach(fpName => {
            if (this.manager.getState(fpName) == STATES.Connected) {
                onlineList.push(fpName);
            }
        })
        let ops = [];
        if (target) {
            ops.push(this.OPERATIONS.CancelAgent);
        }
        // let btnsText = onlineList.concat(ops);
        let btnsText = ops.concat(onlineList);
        const { id } = await this.sendListForm(title, agentMsg, btnsText);
        if (id == null) {
            if (Settings.debugMode)
                this.tell(this.OPERATIONS.Cancel);
            return;
        }
        if (id < ops.length) {
            switch (ops[id]) {
                case this.OPERATIONS.CancelAgent:
                    if (this.manager.cancelAgent(this.player.name)) {
                        this.tell(tr('form.agent.cancel.success'));
                    } else {
                        this.tell(Color.red(tr('form.agent.cancel.fail')));
                    }
                    break;
                default:
                    logger.error(this.OPERATIONS.Unknown);
                    this.tell(Color.red(this.OPERATIONS.Unknown));
                    if (Settings.debugMode) throw new Error(this.OPERATIONS.Unknown);
            }
        } else {
            let res = this.manager.setAgent(this.player.name, onlineList[id - ops.length]);
            if (res) {
                this.tell(tr('form.agent.set.success'));
            } else {
                this.tell(Color.red(tr('form.agent.set.fail')));
            }
        }
    }

    /**
     * 发送传送请求表单
     */
    async sendTeleportForm() {
        let title = tr('form.teleport.title') + '-' + VERSION_STRING;
        let content = tr('form.teleport.content');
        if (Settings.color)
            content = `${Color.YELLOW}${content}${Color.RESET}`;
        let fpNames = this.manager.getNameList();
        let onlineList = [];
        fpNames.forEach(fpName => {
            if (this.manager.getState(fpName) == STATES.Connected) {
                onlineList.push(fpName);
            }
        })
        // let btnsText = onlineList.concat(ops)
        const { id } = await this.sendListForm(title, content, onlineList);
        if (id == null) {
            if (Settings.debugMode)
                this.tell(this.OPERATIONS.Cancel);
            return;
        }
        let fp = mc.getPlayer(onlineList[id]);
        fp.teleport(this.player.pos);
    }

    /**
     * 发送菜单
     */
    async sendMenuForm() {
        let menus = [FORM_MENU.List, FORM_MENU.Quick, FORM_MENU.Teleport/*, FORM_MENU.Control*/];
        if (agentInstalled) {
            menus.push(FORM_MENU.Agent);
        }
        menus = menus.concat([this.OPERATIONS.Add, this.OPERATIONS.ConnectAll, this.OPERATIONS.DisconnectAll])
        if (Settings.allowRemoveAll) {
            menus.push(this.OPERATIONS.RemoveAll);
        }
        let menuForm = mc.newSimpleForm();
        menuForm.setTitle(tr('form.menu.title') + VERSION_STRING);
        let content = tr('form.menu.content');
        if (Settings.color)
            content = `${Color.YELLOW}${content}${Color.RESET}`;
        menuForm.setContent(content);
        menus.forEach(menu => {
            menuForm.addButton(menu);
        })
        const { id } = await this.sendForm(menuForm);
        if (id == null) {
            if (Settings.debugMode)
                this.tell(this.OPERATIONS.Cancel);
            return;
        }
        if(!this.manager.ready){
            throw new Error('FakePlayerManager is not ready');
        }
        let msg;
        switch (menus[id]) {
            case FORM_MENU.Agent:
                await this.sendAgentForm();
                break;
            case FORM_MENU.Control:
                await this.sendControlForm();
                break;
            case FORM_MENU.List:
                await this.sendFPListForm();
                break;
            case FORM_MENU.Quick:
                await this.sendQuickForm();
                break;
            case FORM_MENU.Teleport:
                await this.sendTeleportForm();
                break;
            case this.OPERATIONS.Add:
                await this.sendAddForm();
                break;
            case this.OPERATIONS.ConnectAll:
                msg = await this.controller.connectAll();
                this.tell(getResDataStr('connect_all', msg));
                break;
            case this.OPERATIONS.DisconnectAll:
                msg = await this.controller.disconnectAll();
                this.tell(getResDataStr('disconnect_all', msg));
                break;
            case this.OPERATIONS.RemoveAll:
                msg = await this.controller.removeAll();
                this.tell(getResDataStr('remove_all', msg));
                break;
            default:
                logger.error(this.OPERATIONS.Unknown);
                this.tell(Color.red(this.OPERATIONS.Unknown));
                if (Settings.debugMode) throw new Error(this.OPERATIONS.Unknown);
                break;
        }
    }
    CONTROL_MENU = {
        VERSION: 'version',
        HELP: 'help',
        POSITION: 'position',
        INVENTORY: 'inventory',
        SELECTED: 'selected',
        DROP: 'drop',
        DROP_SLOT: 'drop_slot',
        DROP_ALL: 'drop_all',
        SYNC_START: 'sync_start',
        SYNC_STOP: 'sync_stop',
    }
    /**
     * 发送聊天控制表单
     */
    async sendControlForm() {
        let title = tr('form.control.title') + '-' + VERSION_STRING;
        let content = tr('form.control.content');
        if (Settings.color)
            content = `${Color.YELLOW}${content}${Color.RESET}`;
        let btnsText = Object.values(this.CONTROL_MENU);
        await this.sendListForm(title, content, btnsText, (player, id) => {
            if (id == null) {
                if (Settings.debugMode)
                    this.tell(this.OPERATIONS.Cancel);
                return;
            }
            switch (btnsText[id]) {
                case this.CONTROL_MENU.HELP:
                    this.tell(tr('form.control.op.help'));
                    break;
                case this.CONTROL_MENU.POSITION:
                    this.tell(tr('form.control.op.position'));
                    break;
                case this.CONTROL_MENU.INVENTORY:
                    this.tell(tr('form.control.op.inventory'));
                    break;
                case this.CONTROL_MENU.SELECTED:
                    this.tell(tr('form.control.op.selected'));
                    break;
                case this.CONTROL_MENU.DROP:
                    this.tell(tr('form.control.op.drop'));
                    break;
                case this.CONTROL_MENU.DROP_SLOT:
                    this.tell(tr('form.control.op.drop_slot'));
                    break;
                case this.CONTROL_MENU.DROP_ALL:
                    this.tell(tr('form.control.op.drop_all'));
                    break;
                case this.CONTROL_MENU.SYNC_START:
                    this.tell(tr('form.control.op.sync_start'));
                    break;
                case this.CONTROL_MENU.SYNC_STOP:
                    this.tell(tr('form.control.op.sync_stop'));
                    break;
                case this.CONTROL_MENU.VERSION:
                    this.tell(tr('form.control.op.version'));
                    break;
                default:
                    logger.error(this.OPERATIONS.Unknown);
                    this.tell(Color.red(this.OPERATIONS.Unknown));
                    if (Settings.debugMode) throw new Error(this.OPERATIONS.Unknown);
                    break;
            }
        });
    }
}

class FakePlayerManager {
    /**
     * @type {Boolean} 是否已经初始化
     */
    ready = false;
    /**
     * @type {FakePlayerWebSocketController} 假人控制器
     */
    controller;
    /**
     * @type {Map<String, FakePlayer>} 假人列表
     */
    fakePlayers = {};
    /**
     * @type {Array<FakePlayerManager>} 假人管理器列表
     */
    static Instances = [];
    /**
     * @type {Map<String, Integer>}
     */
    static lastOnlineTimes = {};

    /**
     * 假人管理
     * @param {Object} controller WebSocket地址
     */
    constructor(controller) {
        this.controller = controller;
        if (FakePlayerManager.Instances.length == 0) {
            FakePlayerManager.loadLastOnlineTimes();
        }
        this.init();
        FakePlayerManager.Instances.push(this);
    }
    init() {
        this.controller.listen(FakePlayerController.EventType.Add, this.onAdd.bind(this));
        this.controller.listen(FakePlayerController.EventType.Remove, this.onRemove.bind(this));
        this.controller.listen(FakePlayerController.EventType.Connect, this.onConnect.bind(this));
        this.controller.listen(FakePlayerController.EventType.Disconnect, this.onDisconnect.bind(this));
        this.controller.listen(FakePlayerController.EventType.SetChatControl, this.onSetChatControl.bind(this));
        isNewFPVersion = true;
        if (this.controller.ready) {
            this.refreshData();
        }
    }

    //========= Form Api =========
    sendListForm(player) {
        (async () => {
            if (!this.ready) {
                if (Settings.debugMode) debug('FakePlayerManager is not ready, waiting...');
                logger.error('FakePlayerManager is not ready');
                await this.refreshData();
            } else {
                this.refreshData();
            }
            let fh = new FakePlayerFormHelper(this, player);
            await fh.sendFPListForm();
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
            let fh = new FakePlayerFormHelper(this, player);
            await fh.sendQuickForm();
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
            let fh = new FakePlayerFormHelper(this, player);
            await fh.sendControlForm();
        })().catch(e => {
            logError('sendControlForm', e, player);
        });
    }
    sendMenuForm(player) {
        (async () => {
            this.refreshData();
            let fh = new FakePlayerFormHelper(this, player);
            await fh.sendMenuForm();
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
            let fh = new FakePlayerFormHelper(this, player);
            await fh.sendAgentForm();
        })().catch(e => {
            logError('sendAgentForm', e, player);
        });
    }
    sendAddForm(player) {
        let fh = new FakePlayerFormHelper(this, player);
        fh.sendAddForm().catch(e => {
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
            let fh = new FakePlayerFormHelper(this, player);
            await fh.sendTeleportForm();
        })().catch(e => {
            logError('sendTeleportForm', e, player);
        });
    }

    //========= Event Api =========
    static setLastOnlineTime(playerName, time = Date.now()) {
        this.Instances.forEach(instance => {
            let fp = instance.getFakePlayer(playerName);
            if (fp) {
                fp.lastOnlineTime = time;
                this.lastOnlineTimes[playerName] = time;
            }
        });
    }
    static onPlayerJoin(player) {
        this.setLastOnlineTime(player.name);
    }
    static onPlayerLeft(player) {
        this.setLastOnlineTime(player.name);
        this.saveLastOnlineTimes();
    }
    static loadLastOnlineTimes() {
        let f = File.readFrom(lastestOnlineTimePath);
        if (f) {
            this.lastOnlineTimes = JSON.parse(f);
            if (Settings.debugMode) debug(`loadLastOnlineTimes: ${JSON.stringify(this.lastOnlineTimes)}`);
        } else {
            if (Settings.debugMode) debug(`loadLastOnlineTimes: ${lastestOnlineTimePath} not found`);
        }
    }
    static saveLastOnlineTimes() {
        File.writeTo(lastestOnlineTimePath, JSON.stringify(this.lastOnlineTimes));
        if (Settings.debugMode) debug(`saveLastOnlineTimes: ${JSON.stringify(this.lastOnlineTimes)}`);
    }

    //========= Player Api =========
    /**
     * 加载假人数据
     * @param {Map<String,Any>} datas 假人数据
     */
    loadData(datas) {
        this.fakePlayers = {};
        for (let name in datas) {
            let data = datas[name];
            let fp = new FakePlayer(this.controller, name, data.state, data.allowChatControl);
            fp.skin = data.skin;
            let time = FakePlayerManager.lastOnlineTimes[name];
            if (time) {
                fp.lastOnlineTime = time;
            }
            this.fakePlayers[name] = fp;
        }
    }
    /**
     * 获取假人对象
     * @param {String} fpName 假人名称
     * @returns {FakePlayer}
     */
    getFakePlayer(fpName) {
        return this.fakePlayers[fpName];
    }
    /**
     * 获取假人列表
     * @returns {Array<String>} 假人名称列表
     */
    getNameList() {
        // 发送按最后在线时间排序的列表
        let list = [];
        for (let name in this.fakePlayers) {
            list.push(name);
        }
        let needUpdateTime = false;
        list.sort((a, b) => {
            let aTime = this.fakePlayers[a].lastOnlineTime;
            if (!aTime) {
                aTime = 0;
                FakePlayerManager.setLastOnlineTime(a, 0);
                needUpdateTime = true;
            }
            let bTime = this.fakePlayers[b].lastOnlineTime;
            if (!bTime) {
                bTime = 0;
                FakePlayerManager.setLastOnlineTime(b, 0);
                needUpdateTime = true;
            }
            if (aTime == bTime) {
                return 0;
            }
            return aTime > bTime ? -1 : 1;
        });
        if (needUpdateTime) {
            FakePlayerManager.saveLastOnlineTimes();
        }
        return list;
    }

    /**
     * 获取假人状态
     * @param {String} name 假人名称
     * @returns {STATES} 假人状态
     */
    getState(name) {
        let fp = this.getFakePlayer(name);
        return fp ? fp.state : null;
    }
    /**
     * 获取假人状态
     * @param {String} name 假人名称
     * @returns {String} 假人状态描述
     */
    getStateStr(name, color = false) {
        return getStateStr(this.getState(name), color);
    }
    isAllowChatControl(name) {
        let fp = this.getFakePlayer(name);
        return fp ? fp.allowChatControl : false;
    }
    /**
     * 刷新假人数据
     * @param {Function} callback 回调函数
     */
    async refreshData() {
        let data = await this.controller.getAllState();
        this.loadData(data);
        this.ready = true;
    }
    /**
     * 获取代理数据
     * @returns {{agent: string, target: string}[]}
     */
    listAgent() {
        let res = mc.runcmdEx(`opagent list`);
        if (Settings.debugMode) debug(JSON.stringify(res));
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
    /**
     * 设置假人代理
     * @param {String} agentName 代理名称
     * @param {String} targetName 代理目标名称
     * @returns {Boolean} 是否成功
     */
    setAgent(agentName, targetName) {
        let res = mc.runcmdEx(`opagent set ${targetName} ${agentName}`);
        return res.success;
    }
    /**
     * 取消假人代理
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
    cancelAgent(name) {
        let res = mc.runcmdEx(`opagent clear ${name}`);
        if (Settings.debugMode) debug(JSON.stringify(res));
        if (res.success)
            return true;

        let agentList = this.listAgent();
        let agentName;
        for (let { agent, target } of agentList) {
            if (target == name) {
                agentName = agent;
                break;
            } else if (agent == name) {
                agentName = target;
                break;
            }
        }
        if (agentName) {
            let res = mc.runcmdEx(`opagent clear ${agentName}`);
            if (Settings.debugMode) debug(JSON.stringify(res));
            return res.success;
        }
        return false;
    }
    /**
     * 获取假人代理
     */
    getAgentTarget(agentName) {
        let res = mc.runcmdEx(`opagent query ${agentName}`);
        if (Settings.debugMode) debug(JSON.stringify(res));
        if (res.success) {
            return res.output.split('\n')[0].split(' -> ')[1];
        }
        return null;
    }

    //========= WS Api =========
    /**
     * 重新连接 WebSocket
     */
    async connectWebsocket() {
        return this.controller.connectWebsocket();
    }

    //========= Listener =========
    /**
     * 添加假人监听
     * @param {String} fpName 假人名称
     * @param {STATES} state 假人状态
     * @returns 是否添加成功
     */
    onAdd(fpName, state) {
        FakePlayerManager.setLastOnlineTime(fpName);
        // 为了获取聊天控制开关，刷新所有假人数据
        this.refreshData();
    }
    /**
     * 移除假人监听
     * @param {String} fpName 假人名称
     */
    onRemove(fpName) {
        delete this.fakePlayers[fpName];
        delete FakePlayerManager.lastOnlineTimes[fpName];
    }
    /**
     * 假人连接监听
     * @param {String} fpName 假人名称
     * @param {STATES} state 假人状态
     */
    onConnect(fpName, state) {
        let fp = this.getFakePlayer(fpName);
        if (fp) {
            fp.state = state;
            FakePlayerManager.setLastOnlineTime(fpName);
        } else {
            this.refreshData();
        }
    }
    /**
     * 假人断开监听
     * @param {String} fpName 假人名称
     * @param {STATES} state 假人状态
     */
    onDisconnect(fpName, state) {
        let fp = this.getFakePlayer(fpName);
        if (fp) {
            fp.state = state;
            FakePlayerManager.setLastOnlineTime(fpName);
        } else {
            this.refreshData();
        }
    }
    /**
     * 假人设置聊天控制监听
     * @param {String} fpName 假人名称
     * @param {Boolean} allow 允许聊天控制
     */
    onSetChatControl(fpName, allow) {
        if (Settings.debugMode) debug(`${fpName} 设置聊天控制 ${allow}`);
        this.refreshData();
    }
}

//////////////////////////////////////// Controller ////////////////////////////////////////
class FakePlayerController {
    /**
     * @type {FakePlayerManager} 假人管理器
     */
    manager;
    /**
     * @type {Boolean} 是否已连接
     */
    _ready = false;
    constructor() {
    }

    get ready() {
        return this._ready;
    }

    set ready(value) {
        this._ready = value;
        if (value && this.manager) {
            this.manager.refreshData();
        }
    }

    static EventType = {
        Add: 'add',
        Remove: 'remove',
        Connect: 'connect',
        Disconnect: 'disconnect',
        SetChatControl: 'set_chat_control'
    }

    static OperationType = {
        List: 'list',
        Add: 'add',
        Remove: 'remove',
        GetState: 'getState',
        GetAllState: 'getState_all',
        Connect: 'connect',
        Disconnect: 'disconnect',
        RemoveAll: 'remove_all',
        ConnectAll: 'connect_all',
        DisconnectAll: 'disconnect_all',
        SetChatControl: 'setChatControl',
    }
}

class FakePlayerWebSocketController extends FakePlayerController {
    /**
     * @type {Map<String,Function>} 回调函数集合
     */
    callbacks = {};
    /**
     * @type {WSClient} WebSocket 实例
     */
    wsc = null;

    /**
     * FakePlayerWebSocketController
     * @param {String} url WebSocket地址
     * @param {Integer} port WebSocket端口
     */
    constructor(url, port) {
        super();
        this.wsc = network.newWebSocket();
        try {
            let res = mc.runcmdEx('opagent version');
            if (res && res.success) {
                agentInstalled = true;
            }
        } catch (e) {
            agentInstalled = false;
        }
        this.wsc.listen("onTextReceived", this.onTextReceived.bind(this));
        this.wsc.listen("onBinaryReceived", this.onBinaryReceived.bind(this));
        this.wsc.listen("onError", this.onError.bind(this));
        this.wsc.listen("onLostConnection", this.onLostConnection.bind(this));
        this.wsAddress = url + ":" + port;
        if (Settings.debugMode) debug(`FakePlayerWebSocketController: ${this.wsAddress}`);
        this.connectWebsocket().then((result) => {
            if (!result)
                trError('ws.error.connect', { code: this.wsc.errorCode() });
        }).catch(e => {
            this.ready = false;
            logger.error(`Error in connecting to ${this.wsAddress}: ${e}`);
        });
    }

    get ready() {
        if (Settings.debugMode) debug(`FakePlayerWebSocketController state: ${this._ready}`);
        return this.wsc.status === WSClient.Open;
    }
    set ready(value) { }

    /**
     * 异步连接
     * @returns {Promise<Boolean>} 是否连接成功
     */
    async connectWebsocket() {
        if (this.ready)
            return true;
		return new Promise((resolve, reject) => {
			let result = this.wsc.connectAsync(this.wsAddress, (success) => {
				this.ready = success;
				resolve(success);
			});
			if (!result)
				reject(new Error(`Fail to connect to ${this.wsAddress}`));
		});
    }

    /**
     * 获取格式化后的回调消息
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
    /**
     * 回调控制
     * @param {Integer} id 回调ID
     * @param {Object} msg 回调消息
     */
    onCallback(id, msg) {
        if (this.hasCallback(id)) {
            this.callbacks[id](msg);
            delete this.callbacks[id];
        } else {
            logger.info(Color.transformToConsole(getResponseStr(msg)));
        }
    }

    //========= Event =========
    /**
     * 添加假人客户端 WebSocket 消息监听
     * @param {string} type 事件类型
     * @param {Function<{name:string,state:STATES?}>} callback 回调函数
     */
    listen(type, callback) {
        switch (type) {
            case FakePlayerController.EventType.Add:
                this.onAdd = callback
                break;
            case FakePlayerController.EventType.Remove:
                this.onRemove = callback
                break
            case FakePlayerController.EventType.Connect:
                this.onConnect = callback
                break;
            case FakePlayerController.EventType.Disconnect:
                this.onDisonnect = callback
                break
            case FakePlayerController.EventType.SetChatControl:
                this.onSetChatControl = callback
                break
            default:
                trError('ws.error.listen.unknown_type')
        }
    }

    /**
     * 假人客户端 WebSocket 事件监听
     * @param {String} evType 事件类型
     * @param {{name:string, state: STATES?}} evData 事件数据
     */
    onEvent(evType, { name, state }) {
        switch (evType) {
            case FakePlayerController.EventType.Add:
                if (this.onAdd)
                    this.onAdd(name, state);
                break;
            case FakePlayerController.EventType.Remove:
                if (this.onRemove)
                    this.onRemove(name);
                break
            case FakePlayerController.EventType.Connect:
                if (this.onConnect)
                    this.onConnect(name, state);
                break
            case FakePlayerController.EventType.Disconnect:
                if (this.onDisonnect)
                    this.onDisonnect(name, state);
                break
            case FakePlayerController.EventType.SetChatControl:
                if (this.onSetChatControl)
                    this.onSetChatControl();
                break
            default:
                trError('ws.error.event.unknown_type', { type: evType })
        }
    }

    //========= OnMessage =========
    /**
     * 默认消息处理
     * @param {String} msg 消息
     */
    defaultOnMessage(msg) {
        logger.info(msg);
    }
    /**
     * WebSocket 文本消息处理
     * @param {String} str 消息
     */
    onTextReceived(str) {
        let msg = JSON.parse(str);
        if (Settings.debugMode) debug(`<<\n${JSON.stringify(msg, null, 4)}`);
        if (Object.prototype.hasOwnProperty.call(msg, 'type') && msg.type == "setChatControl") {
            this.onEvent(FakePlayerController.EventType.SetChatControl, { name: msg.data.name });
        }
        if (Object.prototype.hasOwnProperty.call(msg, 'event')) {
            this.onEvent(msg.event, msg.data);
        } else if (Object.prototype.hasOwnProperty.call(msg, 'id')) {
            this.onCallback(msg.id, msg);
        } else {
            this.defaultOnMessage(msg);
        }
    }

    /**
     * waitForReady
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

    /**
     * WebSocket 二进制消息处理
     * @param {ByteBuffer} data 二进制消息
     */
    onBinaryReceived(data) {
        trInfo("ws.receive.bin", data.toString())
    }

    /**
     * WebSocket 错误处理
     * @param {String} msg 错误消息
     */
    onError(msg) {
        trError('ws.error.on_error', { msg: msg });
    }

    /**
     * WebSocket 连接断开处理
     * @param {Integer} code 错误代码
     */
    onLostConnection(code) {
        this.ready = false;
        if (this.manager) {
            logger.error(Color.transformToConsole(`Lost connection to ${this.wsAddress}`));
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
    /**
     * 生成回调ID
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
    }
    _removeCallback(id) {
        if (this.hasCallback(id))
            delete this.callbacks[id]
    }

    /**
     * 发送请求
     * @param {{type: string, id: Integer, data: object}} msg data to send
     * @returns {Promise<{type: string, data: object}>} 回调消息
     */
    async send(msg) {
        if (Settings.debugMode) debug(`>>\n${JSON.stringify(msg, null, 4)}`);
        if (!this.ready) {
            if (!await this.connectWebsocket()) {
                if (Settings.debugMode) logError("Error in send msg", msg);
                new Error(tr("ws.error.send", { code: this.wsc.errorCode() }));
            }
        }
        return new Promise((resolve, reject) => {
            const id = this.genPacketId();
            msg.id = id;
            this._addCallback(id, resolve);
            let success = this.wsc.send(JSON.stringify(msg));
            if (!success) {
                if (Settings.debugMode) logger.error(tr("ws.error.send", { code: this.wsc.errorCode() }));
                reject(tr("ws.error.send", { code: this.wsc.errorCode() }));
                this._removeCallback(id);
                (async () => {
                    await wait(1000);
                    await this.connectWebsocket();
                })();
            }
        });
    }

    //========= AllowList =========
    addAllowList(name) {
        let res = mc.runcmdEx('allowlist add "' + name + '"')
        if (!res.success) {
            logger.info(res.output);
        }
    }
    removeAllowList(name) {
        let res = mc.runcmdEx('allowlist remove "' + name + '"')
        if (!res.success) {
            logger.info(res.output);
        }
    }
    removeAllAllowList() {
        for (let name in players) {
            this.removeAllowList(name);
        }
    }

    //========= WebSocket Api =========
    /**
     * 获取假人列表
     * @returns {Promise<string[]>} 假人列表
     */
    async list() {
        const msg = {
            type: FakePlayerController.OperationType.List,
        }
        const { type, data: { list } } = await this.send(msg);
        return list;
    }
    /**
     * 
     * @param {string} name 假人名称
     * @param {boolean} allowChatControl 是否允许聊天控制
     * @param {string} skin 假人皮肤
     * @returns {Promise<{name:string, success:boolean, resaon: string}>} 返回结果
     */
    async add(name, allowChatControl = false, skin = "steve") {
        this.addAllowList(name);
        let msg = {
            type: FakePlayerController.OperationType.Add,
            data: {
                name: name,
                skin: skin,
                allowChatControl: allowChatControl,
            }
        }
        let { type, data } = await this.send(msg);
        return data;
    }
    /**
     * 移除假人
     * @param {string} name 假人名称
     * @returns {Promise<{name:string, success:boolean, resaon: string}>} 返回结果
     */
    async remove(name) {
        this.removeAllowList(name);
        let msg = {
            type: FakePlayerController.OperationType.Remove,
            data: {
                name: name,
            }
        }
        const { type, data } = await this.send(msg);
        return data;
    }
    /**
     * 获取假人状态
     * @param {string} name 假人名称 
     * @returns {Promise<{name:string, success:boolean, resaon: string, state: STATES}>} 返回结果
     */
    async getState(name) {
        let msg = {
            type: FakePlayerController.OperationType.GetState,
            data: {
                name: name,
            }
        }
        const { type, data: data } = await this.send(msg);
        return data;
    }
    /**
     * 获取所有假人状态
     * @returns {Promise<{name: {state: STATES, allowChatControl: boolean}}[]>} 返回结果
     */
    async getAllState() {
        let msg = {
            type: FakePlayerController.OperationType.GetAllState,
        }
        const { type, data: { playersData } } = await this.send(msg);
        return playersData;
    }
    /**
     * 断开假人连接
     * @param {string} name 假人名称
     * @returns {Promise<{name:string, success:boolean, resaon: string?}>} 返回结果
     */
    async disconnect(name) {
        let msg = {
            type: FakePlayerController.OperationType.Disconnect,
            data: {
                name: name,
            }
        }
        const { type, data } = await this.send(msg);
        return data;
    }
    /**
     * 连接假人
     * @param {string} name 假人名称
     * @returns {Promise<{name:string, success:boolean, resaon: string?}>} 返回结果
     */
    async connect(name) {
        let msg = {
            type: FakePlayerController.OperationType.Connect,
            data: {
                name: name,
            }
        }
        const { type, data } = await this.send(msg);
        return data;
    }
    /**
     * 移除所有假人
     * @returns {Promise<{list: string[]}>} 返回结果
     */
    async removeAll() {
        this.removeAllAllowList();
        let msg = {
            type: FakePlayerController.OperationType.RemoveAll,
        }
        const { type, data: { list } } = await this.send(msg);
        return list;
    }
    /**
     * 连接所有假人
     * @returns {Promise<{list: string[]}>} 返回结果
     */
    async connectAll() {
        let msg = {
            type: FakePlayerController.OperationType.ConnectAll,
        }
        const { type, data: { list } } = await this.send(msg);
        return list;
    }
    /**
     * 断开所有假人连接
     * @returns {Promise<{list: string[]}>} 返回结果
     */
    async disconnectAll() {
        let msg = {
            type: FakePlayerController.OperationType.DisconnectAll,
        }
        const { type, data: { list } } = await this.send(msg);
        return list;
    }
    /**
     * 设置假人聊天控制
     * @param {string} name 假人名称
     * @param {boolean} allowChatControl 是否允许聊天控制
     * @returns {Promise<{name:string, success:boolean, resaon: string}>} 返回结果
     */
    async setChatControl(name, allowChatControl) {
        let msg = {
            type: FakePlayerController.OperationType.SetChatControl,
            data: {
                name: name,
                allowChatControl: allowChatControl,
            }
        }
        const { type, data } = await this.send(msg);
        return data;
    }
}

if (ENABLE_CHAT_CONTROL) {
    /**
     * @type {Map<String, Function>} 等待接收消息的回调函数
     */
    let waitingMsgCallbacks = new Map();

    mc.listen("onChat", function (player, msg) {
        if (!waitingMsgCallbacks.has(player.name)) {
            return;
        }
        let callback = waitingMsgCallbacks.get(player.name);
        if (callback(msg)) {
            waitingMsgCallbacks.delete(player.name);
        }
    });

    class FakePlayerChatController {
        constructor(player, target, quiet = true, permission = 1) {
            this.player = player;
            this.target = target;
            this.quiet = quiet;
            this.permission = permission;
            listenList.push(this.name);
        }
        get name() {
            return this.player.name;
        }
        get targetName() {
            return this.target.name;
        }
        version() {
            waitingMsgCallbacks.set(this.name, (msg) => {
                if (Settings.debugMode) debug(`${this.name} version: ${msg}`);
                return true;
            });
            this.player.talkTo(this.target, `${this.targetName} version`);
        }
        help() {
            waitingMsgCallbacks.set(this.name, (msg) => {
                if (Settings.debugMode) debug(`${this.name} help: ${msg}`);
                return true;
            });
            this.player.talkTo(this.target, `${this.targetName} help`);
        }
        getPos() {
            waitingMsgCallbacks.set(this.name, (msg) => {
                if (Settings.debugMode) debug(`${this.name} getPos: ${msg}`);
                return true;
            });
            this.player.talkTo(this.target, `${this.targetName} getPos`);
        }
        getInventory() {
            waitingMsgCallbacks.set(this.name, (msg) => {
                if (Settings.debugMode) debug(`${this.name} getInventory: ${msg}`);
                return true;
            });
            this.player.talkTo(this.target, `${this.targetName} getInventory`);
        }
        getSelectedSlot() {
            waitingMsgCallbacks.set(this.name, (msg) => {
                if (Settings.debugMode) debug(`${this.name} getSelectedSlot: ${msg}`);
                return true;
            });
            this.player.talkTo(this.target, `${this.targetName} getSelectedSlot`);
        }
        selectSlot(slot) {
            // if(slot>0&&slot<8)
            this.player.talkTo(this.target, `${this.targetName} selectSlot ${slot}`);
        }
        dropSlot() {
            // if(slot>0&&slot<35)
            this.player.talkTo(this.target, `${this.targetName} dropSlot`);
        }
        dropAll() {
            this.player.talkTo(this.target, `${this.targetName} dropAll`);
        }
        syncWith(syncPlayer = this.player) {
            this.player.talkTo(this.target, `${this.targetName} sycn start ${syncPlayer.name}`);
        }
        stopSync() {
            this.player.talkTo(this.target, `${this.targetName} sycn stop`);
        }
    }
}

module.exports = { FakePlayerManager, FakePlayer, FakePlayerWebSocketController };
