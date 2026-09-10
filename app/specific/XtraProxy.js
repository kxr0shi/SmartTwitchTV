/*
 * SmartTwitchTV Xtra/RTE proxy integration.
 *
 * Adds a user-selectable live HLS proxy backed by proxy4/5/6/7.rte.net.ru.
 * VODs and clips continue to use the original SmartTwitchTV playback path.
 */

var STTV_XTRA_PROXY_SERVERS = [
    'https://proxy4.rte.net.ru/',
    'https://proxy5.rte.net.ru/',
    'https://proxy6.rte.net.ru/',
    'https://proxy7.rte.net.ru/'
];
var STTV_XTRA_PROXY_UPSTREAM = 'https://usher.ttvnw.net/api/v2/channel/hls/';
var STTV_XTRA_PROXY_PARAMS = '?allow_source=true&allow_audio_only=true&fast_bread=true';

/* Add persistent settings without modifying the large generated Settings.js. */
Settings_value.xtra_proxy = {
    values: ['no', 'yes'],
    defaultValue: 1
};
Settings_value.xtra_proxy_server = {
    values: ['proxy4.rte.net.ru', 'proxy5.rte.net.ru', 'proxy6.rte.net.ru', 'proxy7.rte.net.ru'],
    defaultValue: 1
};

/* Make the existing Proxy settings entry visible in the main settings list. */
var STTV_XTRA_ORIGINAL_SETTINGS_CONTENT = Settings_Content;
Settings_Content = function (key, valuesArray, STR, STR_SUMMARY) {
    var result = STTV_XTRA_ORIGINAL_SETTINGS_CONTENT(key, valuesArray, STR, STR_SUMMARY);

    if (key === 'speed_adjust') {
        result += STTV_XTRA_ORIGINAL_SETTINGS_CONTENT(
            'proxy_settings',
            [STR_ENTER_TO_OPEN],
            PROXY_SETTINGS,
            PROXY_SETTINGS_SUMMARY
        );
    }

    return result;
};

/* Extend the existing single-active-proxy selector. */
proxyArray.push('xtra_proxy');
proxyArrayFull.splice(proxyArrayFull.length - 1, 0, 'xtra_proxy');

var STTV_XTRA_ORIGINAL_GET_ENABLED_PROXY = Settings_get_enabled_Proxy;
Settings_get_enabled_Proxy = function () {
    if (Settings_Obj_default('xtra_proxy') === 1) {
        return proxyArrayFull.indexOf('xtra_proxy');
    }
    return STTV_XTRA_ORIGINAL_GET_ENABLED_PROXY();
};

var STTV_XTRA_ORIGINAL_PROXY_SET_CURRENT = Settings_proxy_set_current;
Settings_proxy_set_current = function (current) {
    if (current === 'xtra_proxy') {
        var serverIndex = Settings_Obj_default('xtra_proxy_server');
        if (serverIndex < 0 || serverIndex >= STTV_XTRA_PROXY_SERVERS.length) serverIndex = 0;

        proxy_url = STTV_XTRA_PROXY_SERVERS[serverIndex] + STTV_XTRA_PROXY_UPSTREAM;
        proxy_headers = null;
        proxy_has_parameter = false;
        proxy_has_token = false;
        return;
    }

    STTV_XTRA_ORIGINAL_PROXY_SET_CURRENT(current);
};

/* The normal proxy dialog is extended with Xtra controls. */
var STTV_XTRA_ORIGINAL_PROXY_DIALOG = Settings_DialogShowProxy;
Settings_DialogShowProxy = function (click) {
    Settings_value.xtra_proxy.values = [STR_NO, STR_YES];

    var obj = {
        proxy_timeout: {
            defaultValue: Settings_value.proxy_timeout.defaultValue,
            values: Settings_value.proxy_timeout.values,
            title: STR_PROXY_TIMEOUT,
            summary: STR_PROXY_TIMEOUT_SUMMARY
        },
        xtra_proxy: {
            defaultValue: Settings_value.xtra_proxy.defaultValue,
            values: Settings_value.xtra_proxy.values,
            title: 'Xtra/RTE proxy',
            summary: 'Use the RTE proxy for live Twitch HLS playback.'
        },
        xtra_proxy_server: {
            defaultValue: Settings_value.xtra_proxy_server.defaultValue,
            values: Settings_value.xtra_proxy_server.values,
            title: 'Xtra/RTE proxy server',
            summary: 'Select proxy4, proxy5, proxy6 or proxy7.'
        },
        T1080: {
            defaultValue: Settings_value.T1080.defaultValue,
            values: Settings_value.T1080.values,
            title: STR_T1080,
            summary: STR_T1080_SUMMARY
        },
        ttv_lolProxy: {
            defaultValue: Settings_value.ttv_lolProxy.defaultValue,
            values: Settings_value.ttv_lolProxy.values,
            title: STR_TTV_LOL,
            summary: STR_TTV_LOL_SUMMARY
        },
        k_twitch: {
            defaultValue: Settings_value.k_twitch.defaultValue,
            values: Settings_value.k_twitch.values,
            title: STR_K_TWITCH,
            summary: STR_K_TWITCH_SUMMARY
        }
    };

    Settings_DialogShow(obj, PROXY_SETTINGS + STR_BR + STR_BR + PROXY_SETTINGS_SUMMARY, click);
};

/* Apply proxy changes immediately from the dialog. */
var STTV_XTRA_ORIGINAL_DIALOG_RIGHT_LEFT_AFTER = Settings_DialogRightLeftAfter;
Settings_DialogRightLeftAfter = function (key, offset, skipDefault) {
    STTV_XTRA_ORIGINAL_DIALOG_RIGHT_LEFT_AFTER(key, offset, skipDefault);

    if (key === 'xtra_proxy' || key === 'xtra_proxy_server') {
        if (Settings_Obj_default('xtra_proxy') === 1) {
            Settings_set_all_proxy('xtra_proxy');
        } else if (key === 'xtra_proxy') {
            Settings_set_all_proxy('xtra_proxy');
        }
    }
};

/* Route only live playlist requests through the selected RTE endpoint.
 * VODs and clips keep the original SmartTwitchTV URL generation. */
var STTV_XTRA_ORIGINAL_GET_PLAYLIST_URL = PlayHLS_GetPlayListUrl;
PlayHLS_GetPlayListUrl = function (isLive, Channel_or_VOD_Id, Token, Sig, useProxy) {
    if (isLive && useProxy && proxyType === 'xtra_proxy') {
        var serverIndex = Settings_Obj_default('xtra_proxy_server');
        if (serverIndex < 0 || serverIndex >= STTV_XTRA_PROXY_SERVERS.length) serverIndex = 0;

        return {
            url: STTV_XTRA_PROXY_SERVERS[serverIndex] +
                STTV_XTRA_PROXY_UPSTREAM +
                Channel_or_VOD_Id +
                '.m3u8' +
                STTV_XTRA_PROXY_PARAMS,
            headers: null
        };
    }

    return STTV_XTRA_ORIGINAL_GET_PLAYLIST_URL(isLive, Channel_or_VOD_Id, Token, Sig, useProxy);
};
