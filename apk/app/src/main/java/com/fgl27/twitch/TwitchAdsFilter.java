package com.fgl27.twitch;

/**
 * Removes Twitch server-stitched ad video from live HLS playlists before Media3 parses them.
 *
 * Twitch marks stitched ads with a twitch-stitched-ad DATERANGE and uses a non-live title
 * (for example DCM|...) on the ad EXTINF entries. We keep the HLS timeline intact by reusing
 * a nearby content segment URI for the ad duration, while removing the ad DATERANGE metadata
 * that can trigger client-side ad UI. If the playlist does not contain a known ad marker it is
 * returned unchanged.
 */
final class TwitchAdsFilter {

    private TwitchAdsFilter() {}

    static String rewrite(String playlist) {
        if (playlist == null || playlist.isEmpty()) return playlist;
        if (!playlist.contains("twitch-stitched-ad")
            && !playlist.contains("X-TV-TWITCH-AD")
            && !playlist.contains("X-TTV-MAF-AD")) {
            return playlist;
        }

        String[] lines = playlist.split("\\n", -1);
        String[] uris = new String[lines.length];
        boolean hasAd = false;
        boolean pendingExtinf = false;
        boolean pendingAd = false;

        // First pass: find content segment URIs. Twitch content segments normally use title "live".
        String firstContent = null;
        String lastContent = null;
        for (int i = 0; i < lines.length; i++) {
            String t = lines[i].trim();
            if (t.startsWith("#EXTINF")) {
                int comma = t.indexOf(',');
                String title = comma >= 0 ? t.substring(comma + 1).trim() : "";
                pendingExtinf = true;
                pendingAd = !"live".equals(title);
            } else if (pendingExtinf && !t.isEmpty() && !t.startsWith("#")) {
                uris[i] = lines[i];
                if (!pendingAd) {
                    if (firstContent == null) firstContent = lines[i];
                    lastContent = lines[i];
                }
                pendingExtinf = false;
                pendingAd = false;
            }
        }

        if (firstContent == null && lastContent == null) return playlist;

        String replacement = lastContent != null ? lastContent : firstContent;
        StringBuilder out = new StringBuilder(playlist.length());
        pendingExtinf = false;
        pendingAd = false;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            String t = line.trim();

            if (isAdDaterange(t)) {
                hasAd = true;
                continue;
            }

            if (t.startsWith("#EXTINF")) {
                int comma = t.indexOf(',');
                String title = comma >= 0 ? t.substring(comma + 1).trim() : "";
                pendingExtinf = true;
                pendingAd = !"live".equals(title);
                if (pendingAd) hasAd = true;
                out.append(line).append('\n');
                continue;
            }

            if (pendingExtinf && !t.isEmpty() && !t.startsWith("#")) {
                if (pendingAd) {
                    out.append(replacement).append('\n');
                } else {
                    out.append(line).append('\n');
                }
                pendingExtinf = false;
                pendingAd = false;
                continue;
            }

            out.append(line).append('\n');
        }

        return hasAd ? out.toString() : playlist;
    }

    private static boolean isAdDaterange(String line) {
        return line.startsWith("#EXT-X-DATERANGE")
            && (line.contains("twitch-stitched-ad")
                || line.contains("X-TV-TWITCH-AD")
                || line.contains("X-TTV-MAF-AD"));
    }
}
