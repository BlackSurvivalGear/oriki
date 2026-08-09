/* ORÍKÌ — AI Revolution X latest-video module */
(function () {
  'use strict';

  const CHANNEL_URL = 'https://www.youtube.com/@airevolutionx';
  const FEED_URLS = [
    'https://rsshub.app/youtube/user/airevolutionx',
    'https://rsshub.rssforever.com/youtube/user/airevolutionx'
  ];
  const VIDEO_ID_RE = /(?:<yt:videoId>|<videoId>)([^<]+)</i;

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[c]);
  }

  function findVideoId(xml) {
    const match = xml.match(VIDEO_ID_RE);
    if (match) return match[1].trim();
    const links = [...xml.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)];
    for (const match of links) {
      const id = match[1].match(/[?&]v=([^&]+)/);
      if (id) return id[1];
    }
    return null;
  }

  function latestEntry(xml) {
    const entry = xml.match(/<entry[\s\S]*?<\/entry>/i)?.[0] || '';
    if (!entry) return null;
    return {
      videoId: findVideoId(entry),
      title: entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || 'Latest AI Revolution X video',
      published: entry.match(/<published[^>]*>([^<]+)<\/published>/i)?.[1]?.trim() || ''
    };
  }

  function mount() {
    const page = document.getElementById('pageContent');
    if (!page || !document.querySelector('.news-hero')) return;
    if (document.getElementById('orikiAiRevolutionX')) return;

    const section = document.createElement('section');
    section.id = 'orikiAiRevolutionX';
    section.className = 'oriki-youtube-section';
    section.innerHTML = `
      <div class="oriki-youtube-head">
        <div><p class="eyebrow">AI REVOLUTION X</p><h2>LATEST VIDEO.</h2><p class="muted">The latest video from AI Revolution X, automatically refreshed.</p></div>
        <a href="${CHANNEL_URL}" target="_blank" rel="noopener noreferrer">VIEW CHANNEL ↗</a>
      </div>
      <div class="oriki-youtube-loading">Loading latest video…</div>`;
    page.appendChild(section);
    load(section);
  }

  async function load(section) {
    let item = null;
    for (const url of FEED_URLS) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) continue;
        item = latestEntry(await response.text());
        if (item?.videoId) break;
      } catch (_) {}
    }

    if (!item?.videoId) {
      section.querySelector('.oriki-youtube-loading').innerHTML = `Unable to retrieve the latest video automatically. <a href="${CHANNEL_URL}" target="_blank" rel="noopener noreferrer">Open AI Revolution X ↗</a>`;
      return;
    }

    const date = item.published ? new Date(item.published).toLocaleDateString('en-GB') : '';
    section.querySelector('.oriki-youtube-loading').outerHTML = `
      <div class="oriki-youtube-meta"><strong>${escapeHtml(item.title)}</strong>${date ? `<span>${date}</span>` : ''}</div>
      <div class="oriki-youtube-frame">
        <iframe src="https://www.youtube.com/embed/${encodeURIComponent(item.videoId)}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1"
          title="${escapeHtml(item.title)}" allow="autoplay; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>
      </div>`;
  }

  function observe() {
    const page = document.getElementById('pageContent');
    if (!page) return;
    const observer = new MutationObserver(mount);
    observer.observe(page, { childList: true, subtree: false });
    mount();
  }

  document.addEventListener('DOMContentLoaded', observe);
})();
