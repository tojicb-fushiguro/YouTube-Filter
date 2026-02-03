/**
 * YouTube Advanced Keyword Filter - Content Script
 * 
 * Main filtering logic that runs on all YouTube pages.
 * Filters videos by title keywords using allowlist/blocklist.
 * 
 * @author tojicb-fushiguro
 * @repository https://github.com/tojicb-fushiguro/YouTube-Filter
 * @license MIT
 */

// Default settings
const DEFAULT_SETTINGS = {
  keywords: "",
  blocklist: "",
  regex: false,
  enabled: true
};

let currentSettings = { ...DEFAULT_SETTINGS };
let filterTimeout = null;

function matches(text, list, useRegex) {
  if (!list || list.length === 0) return false;
  
  return list.some(keyword => {
    if (!keyword) return false;
    
    try {
      if (useRegex) {
        const regex = new RegExp(keyword, 'i');
        return regex.test(text);
      } else {
        return text.includes(keyword);
      }
    } catch (e) {
      console.warn(`[YouTube Filter] Invalid regex: ${keyword}`, e);
      return text.includes(keyword);
    }
  });
}

function parseKeywords(str) {
  if (!str) return [];
  return str
    .split(",")
    .map(k => k.trim().toLowerCase())
    .filter(Boolean);
}

function shouldShowContent(title, settings) {
  const allowlist = parseKeywords(settings.keywords);
  const blocklist = parseKeywords(settings.blocklist);

  const isAllowed = allowlist.length === 0 || matches(title, allowlist, settings.regex);
  const isBlocked = matches(title, blocklist, settings.regex);

  return isAllowed && !isBlocked;
}

function filterSidebarVideos(settings) {
  if (!settings.enabled) return;

  const sidebar = document.querySelector('#related');
  if (!sidebar) {
    console.log('[YouTube Filter] No sidebar');
    return;
  }

  console.log('[YouTube Filter] 📺 Filtering sidebar...');

  let hiddenCount = 0;
  let totalCount = 0;
  const processed = new Set();

  // Find all video links
  const links = sidebar.querySelectorAll('a[href*="/watch?v="]');
  console.log(`[YouTube Filter] Found ${links.length} sidebar links`);

  links.forEach(link => {
    const container = link.closest('ytd-compact-video-renderer') ||
                     link.closest('ytd-compact-radio-renderer') ||      // For live streams
                     link.closest('ytd-compact-playlist-renderer') ||    // For playlists
                     link.closest('[class*="video"]') ||
                     link.closest('[id*="video"]') ||
                     link.parentElement?.parentElement;

    if (!container || processed.has(container)) return;
    processed.add(container);

    console.log(`[YouTube Filter] Container type: ${container.tagName}`);

    let title = link.title || link.getAttribute('aria-label') || link.innerText || '';
    
    if (!title || title.length < 10) {
      const titleEl = container.querySelector('#video-title, span, h3');
      if (titleEl) title = titleEl.innerText || '';
    }

    title = title.trim().toLowerCase();
    if (!title || title.length < 5) return;

    totalCount++;

    if (!shouldShowContent(title, settings)) {
      hiddenCount++;
      console.log(`[YouTube Filter] 🚫 "${title.substring(0, 40)}..."`);
      container.style.display = 'none';
    } else {
      container.style.display = '';
    }
  });

  console.log(`[YouTube Filter] Sidebar: ${hiddenCount}/${totalCount} hidden`);
}

function filterVideos(settings) {
  if (!settings.enabled) return;

  console.log('[YouTube Filter] 🏠 Filtering main feed...');

  const videos = document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer');
  console.log(`[YouTube Filter] Found ${videos.length} main feed videos`);
  
  let hiddenCount = 0;
  let totalCount = 0;

  videos.forEach(video => {
    // Skip shorts
    if (video.querySelector('a[href*="/shorts/"]')) {
      return;
    }

    // For ytd-rich-item-renderer, the title is nested inside ytd-video-renderer
    let titleEl = video.querySelector('#video-title');
    
    // If not found, try nested renderer
    if (!titleEl && video.tagName === 'YTD-RICH-ITEM-RENDERER') {
      const innerRenderer = video.querySelector('ytd-video-renderer');
      if (innerRenderer) {
        titleEl = innerRenderer.querySelector('#video-title');
      }
    }

    // Try alternative selectors
    if (!titleEl) {
      titleEl = video.querySelector('a#video-title-link yt-formatted-string') ||
               video.querySelector('h3 a') ||
               video.querySelector('yt-formatted-string#video-title') ||
               video.querySelector('a[id*="video-title"]');
    }

    const title = (
      titleEl?.title || 
      titleEl?.getAttribute('aria-label') ||
      titleEl?.innerText || 
      titleEl?.textContent ||
      ''
    ).toLowerCase().trim();

    if (!title || title.length < 5) {
      return;
    }

    totalCount++;

    if (!shouldShowContent(title, settings)) {
      hiddenCount++;
      console.log(`[YouTube Filter] 🚫 Hiding: "${title.substring(0, 50)}..."`);
      video.style.display = 'none';
    } else {
      video.style.display = '';
    }
  });

  console.log(`[YouTube Filter] 📊 Main feed: ${hiddenCount}/${totalCount} hidden`);
}

function filterShorts(settings) {
  if (!settings.enabled) return;

  const shorts = document.querySelectorAll('a[href*="/shorts/"]');
  let hiddenCount = 0;

  shorts.forEach(link => {
    const container = link.closest('ytd-video-renderer, ytd-rich-item-renderer, ytd-reel-item-renderer');
    if (!container) return;

    let titleEl = container.querySelector('#video-title');
    
    if (!titleEl && container.tagName === 'YTD-RICH-ITEM-RENDERER') {
      const innerRenderer = container.querySelector('ytd-video-renderer');
      if (innerRenderer) {
        titleEl = innerRenderer.querySelector('#video-title');
      }
    }

    const title = (titleEl?.title || titleEl?.innerText || '').toLowerCase().trim();

    if (!title) return;

    if (!shouldShowContent(title, settings)) {
      hiddenCount++;
      container.style.display = 'none';
    } else {
      container.style.display = '';
    }
  });

  console.log(`[YouTube Filter] Shorts: ${hiddenCount} hidden`);
}

function runAllFilters() {
  console.log('[YouTube Filter] ========== FILTERING ==========');
  filterVideos(currentSettings);
  filterShorts(currentSettings);
  filterSidebarVideos(currentSettings);
  console.log('[YouTube Filter] ========== DONE ==========');
}

function scheduleFilter() {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(runAllFilters, 500);
}

function initialize() {
  console.log('[YouTube Filter] 🚀 Starting');
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    currentSettings = settings;
    console.log('[YouTube Filter] Settings:', settings);
    runAllFilters();
    setTimeout(runAllFilters, 1500);
  });
}

const observer = new MutationObserver(() => scheduleFilter());

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
}

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(runAllFilters, 1000);
  }
}).observe(document.querySelector('title'), { childList: true });

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'refilter') {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      currentSettings = settings;
      runAllFilters();
    });
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      currentSettings = settings;
      runAllFilters();
    });
  }
});

initialize();
console.log('[YouTube Filter] ✅ Loaded');
