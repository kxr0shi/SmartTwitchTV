/* Modern rounded corners for stream thumbnails and banners. */
(function () {
    var style = document.createElement('style');
    style.id = 'sttv_rounded_corners_css';
    style.textContent = [
        '.stream_thumbnail_live_img,',
        '.stream_thumbnail_channel_vod,',
        '.stream_thumbnail_player_feed,',
        '.inner_banner_holder,',
        '.stream_thumbnail_game_feed,',
        '.stream_thumbnail_game,',
        '.stream_thumbnail_side,',
        '.stream_thumbnail_live,',
        '.stream_thumbnail_user,',
        '.stream_thumbnail_channel {',
        '    border-radius: 12px;',
        '    overflow: hidden;',
        '}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(style);
})();
