'use strict';

const electron = require('electron');

const core = require('../core');
const config = require('../config/config');
const menu = require('../components/menu');
const tray = require('../components/tray');
const notification = require('../components/notification');
const http = require('../lib/http');
const websocket = require('../lib/websocket');
const localfs = require('../lib/localfs');
const bittorrent = require('../lib/bittorrent');

const shell = electron.shell;
const nativeTheme = electron.nativeTheme;
const dialog = electron.dialog;
const ipcMain = electron.ipcMain;

ipcMain.on('render-sync-get-runtime-environment', (event) => {
    if (!process || !process.versions) {
        return null;
    }

    var versions = process.versions;

    event.returnValue = [
        {
            name: 'Electron',
            value: versions.electron
        },
        {
            name: 'Node.js',
            value: versions.node
        },
        {
            name: 'Chrome',
            value: versions.chrome
        },
        {
            name: 'V8',
            value: versions.v8
        }
    ];
});

ipcMain.on('render-sync-get-global-setting', (event, key) => {
    if (key === 'version') {
        event.returnValue = core.version;
    } else if (key === 'ariaNgVersion') {
        event.returnValue = core.ariaNgVersion;
    } else if (key === 'buildCommit') {
        event.returnValue = core.buildCommit;
    } else if (key === 'isDevMode') {
        event.returnValue = core.isDevMode;
    } else if (key === 'useCustomAppTitle') {
        event.returnValue = core.useCustomAppTitle;
    } else {
        event.returnValue = undefined;
    }
});

ipcMain.on('render-set-native-theme', (event, theme) => {
    if (theme === 'dark') {
        nativeTheme.themeSource = 'dark';
    } else if (theme === 'light')  {
        nativeTheme.themeSource = 'light'
    } else {
        nativeTheme.themeSource = 'system';
    }
})

ipcMain.handle('render-get-native-window-maximized', (event) => {
    return core.mainWindow.isMaximized();
});

ipcMain.on('render-minimize-native-window', (event) => {
    core.mainWindow.minimize();
});

ipcMain.on('render-maximize-or-restore-native-window', (event) => {
    if (!core.mainWindow.isMaximized()) {
        core.mainWindow.maximize();
    } else {
        core.mainWindow.unmaximize();
    }
});

ipcMain.on('render-reload-native-window', (event) => {
    core.mainWindow.reload();
});

ipcMain.on('render-exit-native-app', (event) => {
    core.mainWindow.close();
});

ipcMain.on('render-show-textbox-context-menu', (event, context) => {
    const contextMenu = menu.getTextboxContentMenu(context);

    if (contextMenu) {
        contextMenu.popup(core.mainWindow);
    }
});

ipcMain.on('render-show-system-notification', (event, context) => {
    notification.showNotification(context.title, context.body, context.silent);
});

ipcMain.on('render-update-app-menu-label', (event, labels) => {
    menu.setApplicationMenu({
        labels: labels
    });
    menu.setTextboxContextMenuTemplate({
        labels: labels
    });
});

ipcMain.on('render-update-tray-menu-label', (event, labels) => {
    tray.setContextMenu({
        labels: labels
    });
});

ipcMain.on('render-update-tray-tip', (event, tooltip) => {
    tray.setToolTip(tooltip);
});

ipcMain.on('render-sync-get-native-config', (event) => {
    event.returnValue = {
        defaultPosition: config.defaultPosition,
        minimizedToTray: config.minimizedToTray,
        execCommandOnStartup: config.execCommandOnStartup,
        execCommandArgumentsOnStartup: config.execCommandArgumentsOnStartup,
        execDetachedCommandOnStartup: config.execDetachedCommandOnStartup
    };
});

ipcMain.on('render-set-native-config-default-position', (event, value) => {
    config.defaultPosition = value;
    config.save('defaultPosition');
});

ipcMain.on('render-set-native-config-minimized-to-tray', (event, value) => {
    config.minimizedToTray = !!value;
    config.save('minimizedToTray');
});

ipcMain.on('render-set-native-config-exec-command-on-startup', (event, value) => {
    config.execCommandOnStartup = value;
    config.save('execCommandOnStartup');
});

ipcMain.on('render-set-native-config-exec-command-arguments-on-startup', (event, value) => {
    config.execCommandArgumentsOnStartup = value;
    config.save('execCommandArgumentsOnStartup');
});

ipcMain.on('render-set-native-config-exec-detached-command-on-startup', (event, value) => {
    config.execDetachedCommandOnStartup = value;
    config.save('execDetachedCommandOnStartup');
});

ipcMain.handle('render-get-native-config-last-check-updates-time', (event) => {
    return config.lastCheckUpdatesTime;
});

ipcMain.on('render-set-native-config-last-check-updates-time', (event, value) => {
    config.lastCheckUpdatesTime = value;
    config.save('lastCheckUpdatesTime');
});

ipcMain.handle('render-get-startup-command-process-output', (event, requestContext) => {
    return core.startupCommandOutput;
});

ipcMain.handle('render-request-http', (event, requestContext) => {
    return http.request(requestContext);
});

ipcMain.on('render-connect-websocket', (event, rpcUrl, options) => {
    websocket.connect(rpcUrl, options,
        function onOpen(context) {
            try {
                core.mainWindow.webContents.send('on-main-websocket-open', {
                    url: context.url
                });
            } catch (ex) {
                // Do Nothing
            }
        },
        function onClose(context) {
            try {
                core.mainWindow.webContents.send('on-main-websocket-close', {
                    url: context.url,
                    autoReconnect: context.autoReconnect
                });
            } catch (ex) {
                // Do Nothing
            }
        },
        function onMessage(context) {
            try {
                core.mainWindow.webContents.send('on-main-websocket-message', {
                    success: context.success,
                    url: context.url,
                    data: context.message
                });
            } catch (ex) {
                // Do Nothing
            }
        }
    );
});

ipcMain.on('render-reconnect-websocket', (event, rpcUrl, options) => {
    websocket.reconnect(rpcUrl, options);
});

ipcMain.on('render-send-websocket-message', (event, requestContext) => {
    websocket.send(requestContext)
        .catch(function () {
            try {
                core.mainWindow.webContents.send('on-main-websocket-message', {
                    success: false,
                    url: requestContext.url,
                    request: requestContext.data,
                    data: null
                });
            } catch (ex) {
                // Do Nothing
            }
        });
});

ipcMain.on('render-get-websocket-readystate', (event) => {
    event.returnValue = websocket.getReadyState();
});

ipcMain.on('render-open-external-url', (event, url) => {
    shell.openExternal(url);
});

ipcMain.on('render-sync-get-package-file-content', (event, path) => {
    event.returnValue = localfs.readPackageFile(path);
});

ipcMain.handle('render-get-localfs-file-buffer', (event, fullpath) => {
    return localfs.getLocalFSFileBuffer(fullpath);
});

ipcMain.handle('render-get-localfs-exists', (event, fullpath) => {
    return localfs.isExists(fullpath);
});

ipcMain.on('render-open-local-directory', (event, dir, filename) => {
    let fullpath = localfs.getFullPath(dir, filename);

    if (localfs.isExists(fullpath)) {
        shell.showItemInFolder(fullpath);
    } else {
        shell.openPath(dir);
    }
});

ipcMain.handle('render-show-open-file-dialog', (event, filters) => {
    return dialog.showOpenDialog({
        properties: ['openFile'],
        filters: filters
    });
});

ipcMain.on('render-show-dev-tools', (event) => {
    core.mainWindow.webContents.openDevTools();
});

ipcMain.on('render-sync-parse-bittorrent-info', (event, data) => {
    event.returnValue = bittorrent.parseBittorrentInfo(data);
});
