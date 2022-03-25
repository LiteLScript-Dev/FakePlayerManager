/* eslint-disable no-undef */

const PluginIdentifier = "FpmApiTemplate";

/**
 * async version of setTimeout
 * @param {Number} ms milliseconds to wait
 * @returns {Promise<void>}
 */
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/////////////////////////////////////// FakePlayerManager API START ///////////////////////////////////////

const FPM_API_PREFIX = "FakePlayerManagerAPI";
const FPM_API_DEBUG = false;

/**
 * @type {boolean} whether the FakePlayerManager is installed 
 */
const FPM_INSTALLED = lxl.require("FakePlayerManager.lxl.js");
if(!FPM_INSTALLED){
    // TODO when FakePlayerManager.lxl.js is not found
}

/**
 * Import a FakePlayerManager API by name
 * @param {string} name the name of the API
 * @returns {(...args: any[]) => any} the API
 */
function fpmImport(name){
    if(FPM_INSTALLED){
        if(FPM_API_DEBUG) logger.info(`Importing FakePlayerManager API ${name}`);
        return lxl.import(`${FPM_API_PREFIX}_${name}`);
    }else{
        return ()=>{
            logger.error(`Can't call ${name} because FakePlayerManager is not installed.`);
            logger.error(`Please install FakePlayerManager.lxl.js first.`);
            logger.error(`You can download it from https://www.minebbs.com/resources/fakeplayermanager-gui.2945/`);
            if(FPM_API_DEBUG) throw new Error("FakePlayerManager is not installed.");
        };
    }
}

/**
 * @param {string} identifier the identifier of the API
 * @param {string} resolveFuncName the name of the resolve function
 * @param {string} rejectFuncName the name of the reject function
 * @returns {void}
 * @type {(identifier: string, resolveFuncName: string, rejectFuncName: string) => void}
 */
const fpmResiterAsync = fpmImport("registerAsync");

/**
 * Import a async FakePlayerManager API by name
 * @param {string} name the name of the API, e.g. "list"
 * @returns {(...args: any[]) => Promise<any>} the API
 */
function fpmImportAsync(name){
    if(!FPM_INSTALLED){
        return async ()=>{
            logger.error(`Can't call ${name} because FakePlayerManager is not installed.`);
            logger.error(`Please install FakePlayerManager.lxl.js first.`);
            logger.error(`You can download it from https://www.minebbs.com/resources/fakeplayermanager-gui.2945/`);
            if(FPM_API_DEBUG) throw new Error("FakePlayerManager is not installed.");
        };
    }
    const fullName = `${FPM_API_PREFIX}_async_${PluginIdentifier}_${name}`;
    let resolveFunc = {};
    let rejectFunc = {};
    lxl.export((id, ...args)=>{
        if(Object.prototype.hasOwnProperty.call(resolveFunc, id)){
            resolveFunc[id](...args);
            delete resolveFunc[id];
        }
    }, `${fullName}_resolve`);
    lxl.export((id, ...args)=>{
        if(Object.prototype.hasOwnProperty.call(rejectFunc, id)){
            rejectFunc[id](...args);
            delete rejectFunc[id];
        }
    }, `${fullName}_reject`);
    
    if(FPM_API_DEBUG) logger.info(`fpmResiterAsync ${fullName}`);
    setTimeout(() => {
        fpmResiterAsync(`${fullName}`,`${fullName}_resolve`,`${fullName}_reject`);
    }, 0);
    if(FPM_API_DEBUG) logger.info(`Importing FakePlayerManager API async_${name}`);
    const syncFunc = fpmImport(`async_${name}`);
    
    return async(...args) => {
        if(!FpmApi.inited){
            await wait(0);
            FpmApi.inited = true;
        }
        return new Promise((resolve, reject) => {
            const id = system.randomGuid();
            resolveFunc[id] = resolve;
            rejectFunc[id] = reject;
            try{
                syncFunc(fullName, id, ...args);
            }catch(e){
                reject(e);
            }
        });
    };
}

/**
 * FakePlayerManager API for LiteLoader Script Engine
 * @author xiaoqch
 * @version 1.2.0
 * @license MIT
 * @see https://www.minebbs.com/resources/fakeplayermanager-gui.2945/
 */
// eslint-disable-next-line no-unused-vars
class FpmApi{
    /**
     * @type {boolean} whether the FakePlayerManager is installed
     */
    inited = false;
    /**
     * get the list of all the fake players
     * @type {() => Promise<string[]>}
     * @example
     * FpmApi.list().then(list=>{
     *     logger.info(`${list.length} players found.`);
     * }).catch(err=>{
     *     logger.error(`${err.name}: ${err.message}`);
     *     logger.error(err.stack);
     * });
     * @example
     * try{
     *     const list = await FpmApi.list();
     *     logger.info(`${list.length} players found.`);
     * }catch(err){
     *     logger.error(`${err.name}: ${err.message}`);
     *     logger.error(err.stack);
     * }
     */
    static list = fpmImportAsync("list");

    /**
     * add a fake player
     * @type {(name: string, allowChatControl: boolean?, skin: string?) => Promise<{success: boolean, reason: string}>}
     * @example:
     * const { success, reason } = await FpmApi.add("Player");
     */
    static add = fpmImportAsync("add");
    
    /**
     * connect to a fake player
     * @type {(name: string) => Promise<{success: boolean, reason: string}>}
     * @example
     * const { success, reason } = await FpmApi.connect("Player");
     */
    static connect = fpmImportAsync("connect");
    
    /**
     * disconnect a fake player
     * @type {(name: string) => Promise<{name:string, success:boolean, reason:string}>}
     */
    static disconnect = fpmImportAsync("disconnect");

    /**
     * get state of a fake player
     * @type {(name: string) => Promise<{name:string, success:boolean, resaon: string, state: string}>}
     * @example
     * const { success, reason, state } = await FpmApi.getState("Player");
     */
    static getState = fpmImportAsync("getState");

    /**
     * get states of all fake players
     * @type {() => Promise<object>}
     * @example
     * const states = await FpmApi.getStates();
     * const playerNames = Object.keys(states);
     * for(const name of playerNames){
     *     const state = states[name].state;
     *     const allowChatControl = states[name].allowChatControl;
     *     logger.info(`${name} is ${state}`);
     * }
     */
    static getAllState = fpmImportAsync("getAllState");

    /**
     * remove a fake player
     * @type {(name: string) => Promise<{success: boolean, reason: string}>}
     * @example
     * const { success, reason } = await FpmApi.remove("Player");
     */
    static remove = fpmImportAsync("remove");

    /**
     * remove all fake players
     * @type {() => Promise<string[]>}
     * @example
     * const list = await FpmApi.removeAll();
     * logger.info(`${list.length} players removed.`);
     */
    static removeAll = fpmImportAsync("removeAll");

    /**
     * connect all fake players
     * @type {() => Promise<string[]>}
     * @example
     * const list = await FpmApi.connectAll();
     * logger.info(`${list.length} players connected.`);
     */
    static connectAll = fpmImportAsync("connectAll");

    /**
     * disconnect all fake players
     * @type {() => Promise<string[]>}
     * @example
     * const list = await FpmApi.disconnectAll();
     * logger.info(`${list.length} players disconnected.`);
     */
    static disconnectAll = fpmImportAsync("disconnectAll");

    /**
     * set chat control of a fake player
     * @type {(name: string, allowChatControl: boolean) => Promise<{success: boolean, reason: string}>}
     * @example
     * const { success, reason } = await FpmApi.setChatControl("Player", true);
     * @example
     * const { success, reason } = await FpmApi.setChatControl("Player", false);
     */
    static setChatControl = fpmImportAsync("setChatControl");

    /**
     * reconnect FakePlayerManager WebSocket
     * @type {() => Promise<boolean>}
     */
    static reconnect = fpmImportAsync("reconnect");

    /**
     * whether the FakePlayerManager is ready
     * @type {() => boolean}
     */
    static _isReady = fpmImport("isReady");
    /**
     * FakePlayerManager version
     * @type {() => number[]}
     */
    static _version = fpmImport("version");

    /**
     * whether the FakePlayerManager is ready
     * @type {() => boolean}
     */
    static get ready(){ return FPM_INSTALLED && FpmApi._isReady(); }
    /**
     * FakePlayerManager version
     * @type {() => number[]}
     */
    static get version(){ return FpmApi._version(); }
    static get versionString(){ return FpmApi.version.join("."); }
    
    /**
     * disable the constructor
     * @private
     * @constructor
     */
    constructor(){
        throw new Error("This is a static class.");
    }
}

/////////////////////////////////////// FakePlayerManager API END ///////////////////////////////////////

if(FPM_API_DEBUG) {
    (async () => {
        const list = await FpmApi.list();
        logger.info(`${list.length} players found.`);
        logger.info(`list: ${list.join(", ")}`);
        for (const name of list) {
            if (!name.startsWith("test_"))
                continue;
            const { success, reason } = await FpmApi.connect(name);
            if (!success) {
                logger.error(`${name} connect failed: ${reason}`);
            }
        }
    })().catch(err => {
        logger.error(err.stack);
    });
}
