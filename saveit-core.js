// saveit-core.js — Shared Cobalt API utility for SaveIt
// Used by all platform download pages

const SaveIt = {

  // Get API base URL from localStorage
  getApiUrl() {
    return (localStorage.getItem('cobalt-api-url') || '').replace(/\/$/, '');
  },

  // Build POST request to Cobalt API
  async download(url, opts = {}) {
    const apiBase = this.getApiUrl();
    if (!apiBase) {
      return { ok: false, error: 'No Cobalt API instance configured. Go back to the homepage and set your instance URL.' };
    }
    if (!url || !url.startsWith('http')) {
      return { ok: false, error: 'Please enter a valid URL starting with http:// or https://' };
    }

    const body = { url };
    if (opts.audioOnly) body.downloadMode = 'audio';
    if (opts.videoOnly) body.downloadMode = 'mute';
    if (opts.quality) body.videoQuality = opts.quality;
    if (opts.noWatermark) body.tiktokH265 = true;

    try {
      const res = await fetch(`${apiBase}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `API error ${res.status}: ${text}` };
      }

      const data = await res.json();
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: `Network error: ${e.message}. Is your Cobalt instance online?` };
    }
  },

  // Render result into a container element
  renderResult(container, result) {
    container.innerHTML = '';
    if (!result.ok) {
      container.innerHTML = `<div class="dl-error">${result.error}</div>`;
      return;
    }
    const d = result.data;
    if (d.status === 'redirect' || d.status === 'stream' || d.url) {
      const fname = d.filename || 'download';
      container.innerHTML = `
        <div class="dl-success">
          <div class="dl-filename">${fname}</div>
          <div class="dl-type">Type: ${d.status || 'stream'}</div>
          <a class="dl-btn" href="${d.url}" target="_blank" rel="noopener" download="${fname}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download File
          </a>
        </div>`;
    } else if (d.status === 'picker') {
      const items = (d.picker || []).map((p, i) => `
        <a class="dl-btn" href="${p.url}" target="_blank" rel="noopener" download>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Item ${i + 1}
        </a>`).join('');
      container.innerHTML = `<div class="dl-success"><div class="dl-filename">Multiple items found</div><div class="dl-picker">${items}</div></div>`;
    } else if (d.status === 'error' || d.error) {
      container.innerHTML = `<div class="dl-error">${d.error?.code || d.text || JSON.stringify(d)}</div>`;
    } else {
      container.innerHTML = `<div class="dl-error">Unexpected response. Check your Cobalt instance or try a different URL.</div>`;
    }
  }
};
