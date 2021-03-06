//////////////////////////////////// Update Manager ////////////////////////////////////
// Author: xiaoqch
// Example:
//  if (Settings.checkUpdate) {
//      const UpdateManagerPath = 'FakePlayerManager/UpdateManager.js';
//      if (!File.exists(UpdateManagerPath))
//          logger.warn(`[Update] UpdateManager is not found, skip check update.`);
//      const { UpdateManager } = require(UpdateManagerPath);
//      const updateManager = new UpdateManager(MINE_BBS_RESOURCE_ID, VERSION);
//      (async () => {
//          while (true) {
//              const { success, version } = await updateManager.checkUpdate();
//              if (success) {
//                  const { success, update_info } = await updateManager.getUpdateInfo();
//                  if (success) {
//                      const { title, message, post_date, view_url } = update_info;
//                      logger.info(Color.transformToConsole(Color.green(`New Update Found: ${title}`)));
//                      logger.info(message);
//                      logger.info(`Update Time: ${new Date(post_date).toLocaleString()}`);
//                      logger.info(`URL: ${view_url}`);
//                      return;
//                  }
//              }
//              await wait(1000 * 60 * 60 * 24);
//          }
//      })().catch(e => {
//          logger.error("Error in CheckUpdate: ");
//          logger.error(e.stack);
//      });
//  }

const MINEBBS_APIS = {
    getResourceUrl: (resourceId) => `https://api.minebbs.com/api/openapi/v1/resources/${resourceId}`,
    getUpdatesUrl: (resourceId) => `https://api.minebbs.com/api/openapi/v1/resources/${resourceId}/updates?page=1`,
}

const fetch = (url) => {
    return new Promise((resolve, reject) => {
        let res = network.httpGet(url, (status, result) => {
            if (status === 200) {
                resolve(result);
            } else {
                reject(new Error(`Failed to fetch resource info from ${url}, status: ${status}`));
            }
        });
        if (!res) {
            reject(new Error(`Failed to fetch resource info from ${url}`));
        }
    });
}

class UpdateManager {
    constructor(resource_id, current_version, download_url = null) {
        this.resource_id = resource_id;
        if (current_version instanceof Array) {
            this.current_version = current_version;
        } else if (current_version instanceof String) {
            this.current_version = current_version.split('.');
        } else {
            throw new Error('current_version must be String or Array');
        }
        this.download_url = download_url;
    }
    get updates_url() {
        return MINEBBS_APIS.getUpdatesUrl(this.resource_id);
    }
    get resource_url() {
        return MINEBBS_APIS.getResourceUrl(this.resource_id);
    }

    async checkUpdate() {
        const data_json = await fetch(this.resource_url);
        const data_obj = JSON.parse(data_json);
        if (data_obj.success) {
            const resource_info = data_obj.data;
            const latest_version = resource_info.version;
            const [major, minor, subminor] = latest_version.split('.');
            const [current_major, current_minor, current_subminor] = this.current_version;
            if (major > current_major || (major === current_major && minor > current_minor) || (major === current_major && minor === current_minor && subminor > current_subminor)) {
                return { success: true, version: latest_version };
            } else {
                return { success: false, version: latest_version };
            }
        } else {
            throw new Error(`Check update failed. ${data_obj.message}`);
        }
    }

    async getUpdateInfo() {
        const data_json = await fetch(this.updates_url);
        const data_obj = JSON.parse(data_json);
        if (data_obj.success) {
            const updates_info = data_obj.data;
            return { success: true, update_info: updates_info[0] };
        } else {
            throw new Error(`Get update info failed. ${data_obj.message}`);
        }
    }

    updateInfoToMessage(update_info) {
        const { title, message, post_date, view_url } = update_info;
        const time_str = new Date(post_date).toLocaleString();
        return `New Update Found: ${title}\n${message}\n${time_str}\n${view_url}`;
    }

    static getUpdateTimeStr(post_date) {
        // YYYY-MM-DD HH:MM:SS
        const time = new Date(post_date*1000);
        return `${time.getFullYear()}-${time.getMonth()+1}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
    }

}

module.exports = { UpdateManager };
