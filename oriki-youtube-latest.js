/* ORÍKÌ — AI Revolution X latest-video embed
 * Source channel: https://www.youtube.com/@airevolutionx
 * Uses the channel's public uploads RSS feed to discover the newest video.
 */
(function () {
  'use strict';

  const CHANNEL_URL = 'https://www.youtube.com/@airevolutionx';
  const FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC';
  const FALLBACK_EMBED = 'https://www.youtube.com/embed?listType=user_uploads&list=airevolutionx&autoplay=1&mute=1';
  const CONTAINER_ID = 'orikiAiRevolutionX';

  function render(videoId, title, published) {
    const el = document.getElementById(CONTAINER_ID);
    if (!el) return;
    const safeTitle = title || 'AI Revolution X — Latest Video';
    el.innerHTML = `
      <div class="oriki-youtube-head">
        <div>
          <p class="eyebrow">AI REVOLUTION X</p>
          <h3>${safeTitle.replace(/[<>]/g, '')}</h3>
          ${published ? `<span class="muted">Latest video · ${published}</span>` : ''}
        </div>
        <a href="${CHANNEL_URL}" target="_blank" rel="noopener noreferrer">VIEW CHANNEL ↗</a>
      </div>
      <div class="oriki-youtube-frame">
        <iframe
          src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=1&rel=0&modestbranding=1"
          title="${safeTitle.replace(/[\"]/g, '&quot;')}"
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          allowfullscreen></iframe>
      </div>`;
  }

  async function load() {
    const el = document.getElementById(CONTAINER_ID);
    if (!el) return;

    // RSS is intentionally fetched through the ORÍKÌ feed proxy if configured.
    // A direct browser fetch is blocked by YouTube CORS, so the page falls back
    // to YouTube's public uploads playlist embed when no proxy is available.
    const proxy = window.ORIKI_YOUTUBE_FEED_PROXY;
    if (proxy) {
      try {
        const response = await fetch(proxy + '?channel=airevolutionx', { cache: 'no-store' });
        if (!response.ok) throw new Error('feed unavailable');
        const item = await response.json();
        if (item.videoId) {
          render(item.videoId, item.title, item.published);
          return;
        }
      } catch (error) {
        console.warn('ORÍKÌ YouTube feed unavailable; using uploads fallback.', error);
      }
    }

    el.innerHTML = `
      <div class="oriki-youtube-head">
        <div><p class="eyebrow">AI REVOLUTION X</p><h3>Latest videos from AI Revolution X</h3></div>
        <a href="${CHANNEL_URL}" target="_blank" rel="noopener noreferrer">VIEW CHANNEL ↗</a>
      </div>
      <div class="oriki-youtube-frame">
        <iframe src="${FALLBACK_EMBED}" title="AI Revolution X latest videos" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>
      </div>`;
  }

  document.addEventListener('DOMContentLoaded', load);
})();
