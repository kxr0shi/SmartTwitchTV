/*
 * SmartTwitchTV Xtra/RTE playlist proxy integration.
 *
 * The proxy is used only for live HLS playlists. VODs and clips keep the
 * original SmartTwitchTV playback path.
 */

var STTV_XTRA_PROXY = 'https://proxy4.rte.net.ru/https://usher.ttvnw.net/api/v2/channel/hls/';
var STTV_XTRA_PROXY_PARAMS = '?allow_source=true&allow_audio_only=true&fast_bread=true';

// Keep the existing implementation for VOD/clip playback.
var STTV_XTRA_ORIGINAL_GET_PLAYLIST_URL = PlayHLS_GetPlayListUrl;
var STTV_XTRA_ORIGINAL_GET_PLAYLIST_ASYNC = PlayHLS_GetPlayListAsync;

// Replace only live playlist URLs with the RTE/Xtra-compatible endpoint.
PlayHLS_GetPlayListUrl = function (isLive, Channel_or_VOD_Id, Token, Sig, useProxy) {
    if (isLive) {
        return {
            url: STTV_XTRA_PROXY + Channel_or_VOD_Id + '.m3u8' + STTV_XTRA_PROXY_PARAMS,
            headers: null
        };
    }

    return STTV_XTRA_ORIGINAL_GET_PLAYLIST_URL(isLive, Channel_or_VOD_Id, Token, Sig, useProxy);
};

// The RTE endpoint does not require Twitch playback-access tokens, so skip the
// token request for live playback. This also makes playback independent of the
// direct usher.ttvnw.net request that Twitch may reject.
PlayHLS_GetPlayListAsync = function (isLive, Channel_or_VOD_Id, CheckId_y, CheckId_x, callBackSuccess) {
    if (isLive) {
        proxy_fail_counter_checker = proxy_fail_counter;
        PlayHLS_PlayListUrl(
            true,
            Channel_or_VOD_Id,
            CheckId_y,
            CheckId_x,
            callBackSuccess.name,
            null,
            null,
            true
        );
        return;
    }

    STTV_XTRA_ORIGINAL_GET_PLAYLIST_ASYNC(isLive, Channel_or_VOD_Id, CheckId_y, CheckId_x, callBackSuccess);
};

// Synchronous live-playlist checks use the same endpoint.
var STTV_XTRA_ORIGINAL_GET_PLAYLIST_SYNC = PlayHLS_GetPlayListSync;
PlayHLS_GetPlayListSync = function (isLive, Channel_or_VOD_Id) {
    if (isLive) {
        proxy_fail_counter_checker = proxy_fail_counter;
        return PlayHLS_GetPlayListSyncUrl(true, Channel_or_VOD_Id, true);
    }

    return STTV_XTRA_ORIGINAL_GET_PLAYLIST_SYNC(isLive, Channel_or_VOD_Id);
};
