/**
 * YouTube Advanced Keyword Filter - Content Script
 * 
 * Main filtering logic that runs on all YouTube pages.
 * Filters videos by title keywords using allowlist/blocklist.
 * Cross-browser compatible (Chrome & Firefox).
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
  enabled: true,
  wordBoundary: false,
  softHide: false,
  dateFilter: "any"
};

let currentSettings = { 
  ...DEFAULT_SETTINGS,
  // Performance optimization: cached parsed keywords
  parsedAllowlist: [],
  parsedBlocklist: [],
  // Performance optimization: pre-compiled regex patterns
  compiledAllowlistRegex: [],
  compiledBlocklistRegex: []
};
let filterTimeout = null;

/**
 * Get the optimal MutationObserver target
 * Targets YouTube-specific containers for better performance
 */
function getObserverTarget() {
  // Priority: ytd-page-manager (least noisy) → #content → ytd-app → body
  return document.querySelector('ytd-page-manager') || 
         document.querySelector('#content') || 
         document.querySelector('ytd-app') || 
         document.body;
}

/**
 * Escape special regex characters for safe regex construction
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Compile regex patterns from keyword list
 * @returns {RegExp[]} Array of compiled RegExp objects
 */
function compileRegexPatterns(keywords, useWordBoundary = false) {
  if (!keywords || keywords.length === 0) return [];
  
  return keywords.map(keyword => {
    if (!keyword) return null;
    
    try {
      if (useWordBoundary) {
        // Wrap keyword with word boundaries for whole word matching
        const pattern = `\\b${escapeRegex(keyword)}\\b`;
        return new RegExp(pattern, 'i');
      } else {
        // Standard regex pattern
        return new RegExp(keyword, 'i');
      }
    } catch (e) {
      console.warn(`[YouTube Filter] Invalid regex pattern: ${keyword}`, e);
      return null;
    }
  }).filter(Boolean);
}

/**
 * Prepare settings by parsing keywords and compiling regex patterns
 * This optimization ensures parsing and compilation happens ONCE instead of on every video
 */
function prepareSettings(settings) {
  // Parse keywords once and cache them
  settings.parsedAllowlist = parseKeywords(settings.keywords);
  settings.parsedBlocklist = parseKeywords(settings.blocklist);
  
  // Pre-compile regex patterns if regex mode is enabled
  if (settings.regex) {
    settings.compiledAllowlistRegex = compileRegexPatterns(settings.parsedAllowlist, false);
    settings.compiledBlocklistRegex = compileRegexPatterns(settings.parsedBlocklist, false);
  } else if (settings.wordBoundary) {
    // Compile with word boundaries if word boundary mode is enabled
    settings.compiledAllowlistRegex = compileRegexPatterns(settings.parsedAllowlist, true);
    settings.compiledBlocklistRegex = compileRegexPatterns(settings.parsedBlocklist, true);
  } else {
    settings.compiledAllowlistRegex = [];
    settings.compiledBlocklistRegex = [];
  }
  
  console.log('[YouTube Filter] Settings prepared:', {
    allowlist: settings.parsedAllowlist.length,
    blocklist: settings.parsedBlocklist.length,
    regex: settings.regex,
    wordBoundary: settings.wordBoundary,
    compiledRegex: settings.compiledAllowlistRegex.length + settings.compiledBlocklistRegex.length
  });
}

/**
 * Check if text matches any keyword in the list
 * Uses pre-compiled regex patterns for performance
 */
function matches(text, list, compiledRegexList, useRegex, useWordBoundary) {
  if (!list || list.length === 0) return false;
  
  // Use pre-compiled regex if available (much faster!)
  if (compiledRegexList && compiledRegexList.length > 0) {
    return compiledRegexList.some(regex => regex.test(text));
  }
  
  // Fallback to substring matching (when regex disabled and no word boundary)
  if (!useRegex && !useWordBoundary) {
    return list.some(keyword => {
      if (!keyword) return false;
      return text.includes(keyword);
    });
  }
  
  // Fallback for dynamic regex (shouldn't happen with prepareSettings, but kept for safety)
  return list.some(keyword => {
    if (!keyword) return false;
    
    try {
      if (useRegex) {
        const regex = new RegExp(keyword, 'i');
        return regex.test(text);
      } else if (useWordBoundary) {
        const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
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

/**
 * Determine if content should be shown based on allowlist/blocklist
 * Uses cached parsed keywords for performance (no re-parsing!)
 */
function shouldShowContent(title, settings) {
  // Use cached parsed lists instead of parsing every time
  const allowlist = settings.parsedAllowlist || [];
  const blocklist = settings.parsedBlocklist || [];

  const isAllowed = allowlist.length === 0 || matches(
    title, 
    allowlist, 
    settings.compiledAllowlistRegex,
    settings.regex,
    settings.wordBoundary
  );
  
  const isBlocked = matches(
    title, 
    blocklist, 
    settings.compiledBlocklistRegex,
    settings.regex,
    settings.wordBoundary
  );

  return isAllowed && !isBlocked;
}

/**
 * Apply filtering style to element (hide or soft-hide)
 */
function applyFilterStyle(container, shouldShow, settings) {
  if (!shouldShow) {
    if (settings.softHide) {
      // Soft-hide: blur and reduce opacity instead of hiding
      container.style.display = '';
      container.style.opacity = '0.3';
      container.style.filter = 'blur(8px)';
      container.style.pointerEvents = 'none';
      container.setAttribute('data-filtered', 'soft');
      container.setAttribute('aria-label', 'Filtered content (blurred)');
    } else {
      // Hard-hide: completely hide element (default behavior)
      container.style.display = 'none';
      container.style.opacity = '';
      container.style.filter = '';
      container.style.pointerEvents = '';
      container.setAttribute('data-filtered', 'hard');
      container.setAttribute('aria-hidden', 'true');
    }
  } else {
    // Reset all styles when showing
    container.style.display = '';
    container.style.opacity = '';
    container.style.filter = '';
    container.style.pointerEvents = '';
    container.removeAttribute('data-filtered');
    container.removeAttribute('aria-label');
    container.removeAttribute('aria-hidden');
  }
}

/**
 * Extract upload time text from video element
 * @param {HTMLElement} container - Video container element
 * @returns {string|null} - Relative time text (e.g., "2 hours ago") or null
 */
function getUploadTimeText(container) {
  // Try different selectors for upload time metadata
  const selectors = [
    '#metadata-line span.inline-metadata-item',
    '#metadata-line span',
    'ytd-video-meta-block span',
    '.metadata-line span'
  ];
  
  for (const selector of selectors) {
    const spans = container.querySelectorAll(selector);
    for (const span of spans) {
      const text = span.textContent.trim().toLowerCase();
      // Check if text contains time-related keywords
      if (text.includes('ago') || text.includes('streamed') || 
          text.includes('hour') || text.includes('day') || 
          text.includes('week') || text.includes('month') || 
          text.includes('year') || text.includes('minute') || 
          text.includes('second')) {
        return text;
      }
    }
  }
  
  return null;
}

/**
 * Parse relative time text into approximate hours
 * @param {string} timeText - Relative time text (e.g., "2 hours ago")
 * @returns {number|null} - Approximate hours or null if parsing fails
 */
function parseRelativeTime(timeText) {
  if (!timeText) return null;
  
  timeText = timeText.toLowerCase().trim();
  
  // Extract number from text
  const match = timeText.match(/(\d+)/);
  if (!match) {
    // Handle special cases like "streamed live" or text without numbers
    if (timeText.includes('streamed')) {
      // Treat as recent (within 24 hours)
      return 12;
    }
    return null;
  }
  
  const value = parseInt(match[1], 10);
  
  // Convert to hours based on unit
  if (timeText.includes('second')) {
    return value / 3600; // Convert seconds to hours
  } else if (timeText.includes('minute')) {
    return value / 60; // Convert minutes to hours
  } else if (timeText.includes('hour')) {
    return value;
  } else if (timeText.includes('day')) {
    return value * 24;
  } else if (timeText.includes('week')) {
    return value * 24 * 7;
  } else if (timeText.includes('month')) {
    return value * 24 * 30; // Approximate month as 30 days
  } else if (timeText.includes('year')) {
    return value * 24 * 365;
  }
  
  return null;
}

/**
 * Check if video passes the date filter
 * @param {HTMLElement} container - Video container element
 * @param {Object} settings - Current settings
 * @returns {boolean} - True if video should be shown
 */
function passesDateFilter(container, settings) {
  // If date filter is disabled (any), always pass
  if (!settings.dateFilter || settings.dateFilter === 'any') {
    return true;
  }
  
  // Extract upload time text
  const timeText = getUploadTimeText(container);
  
  // Fail open: if we can't find the time, show the video
  if (!timeText) {
    return true;
  }
  
  // Parse time to hours
  const hours = parseRelativeTime(timeText);
  
  // Fail open: if we can't parse the time, show the video
  if (hours === null) {
    return true;
  }
  
  // Check against filter thresholds
  switch (settings.dateFilter) {
    case 'today':
      return hours <= 24;
    case 'week':
      return hours <= 24 * 7;
    case 'month':
      return hours <= 24 * 30;
    case 'year':
      return hours <= 24 * 365;
    default:
      return true;
  }
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

    // Optimize: normalize title once
    const normalizedTitle = title.trim().toLowerCase();
    if (!normalizedTitle || normalizedTitle.length < 5) return;

    totalCount++;

    const shouldShow = shouldShowContent(normalizedTitle, settings) && passesDateFilter(container, settings);
    if (!shouldShow) {
      hiddenCount++;
      console.log(`[YouTube Filter] 🚫 "${normalizedTitle.substring(0, 40)}..."`);
    }
    
    applyFilterStyle(container, shouldShow, settings);
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
    );

    // Optimize: normalize title once
    const normalizedTitle = title.toLowerCase().trim();
    if (!normalizedTitle || normalizedTitle.length < 5) {
      return;
    }

    totalCount++;

    const shouldShow = shouldShowContent(normalizedTitle, settings) && passesDateFilter(video, settings);
    if (!shouldShow) {
      hiddenCount++;
      console.log(`[YouTube Filter] 🚫 Hiding: "${normalizedTitle.substring(0, 50)}..."`);
    }
    
    applyFilterStyle(video, shouldShow, settings);
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

    const title = (titleEl?.title || titleEl?.innerText || '');

    // Optimize: normalize title once
    const normalizedTitle = title.toLowerCase().trim();
    if (!normalizedTitle) return;

    const shouldShow = shouldShowContent(normalizedTitle, settings) && passesDateFilter(container, settings);
    if (!shouldShow) {
      hiddenCount++;
    }
    
    applyFilterStyle(container, shouldShow, settings);
  });

  console.log(`[YouTube Filter] Shorts: ${hiddenCount} hidden`);
}

function runAllFilters() {
  console.log('[YouTube Filter] ========== FILTERING ==========');
  
  // Disconnect BOTH observers during batch filtering to avoid recursive calls
  observer.disconnect();
  if (urlObserver) {
    urlObserver.disconnect();
  }
  
  try {
    filterVideos(currentSettings);
    filterShorts(currentSettings);
    filterSidebarVideos(currentSettings);
  } catch (error) {
    console.error('[YouTube Filter] Error during filtering:', error);
  } finally {
    // ALWAYS reconnect both observers, even if filtering failed
    const target = getObserverTarget();
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
    }
    
    // Reconnect URL observer
    if (urlObserver) {
      const urlObserverTarget = document.querySelector('title') || document.head || document.documentElement;
      if (urlObserverTarget) {
        urlObserver.observe(urlObserverTarget, { childList: true, subtree: true });
      }
    }
  }
  
  console.log('[YouTube Filter] ========== DONE ==========');
}

function scheduleFilter() {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(runAllFilters, 500);
}

async function initialize() {
  console.log('[YouTube Filter] 🚀 Starting');
  try {
    const settings = await browser.storage.sync.get(DEFAULT_SETTINGS);
    currentSettings = { ...currentSettings, ...settings };
    
    // Performance optimization: prepare settings once at startup
    prepareSettings(currentSettings);
    
    console.log('[YouTube Filter] Settings:', settings);
    runAllFilters();
    setTimeout(runAllFilters, 1500);
  } catch (error) {
    console.error('[YouTube Filter] Error loading settings:', error);
  }
}

const observer = new MutationObserver(() => scheduleFilter());

// Optimization: Observe more specific YouTube container instead of entire body
if (document.body) {
  const target = getObserverTarget();
  observer.observe(target, { childList: true, subtree: true });
  console.log(`[YouTube Filter] Observing: ${target.tagName || 'body'}`);
}

// Bug #1 Fix: Store URL observer in variable for proper management
// Bug #2 Fix: Add null check before observing
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(runAllFilters, 1000);
  }
});

// Safe fallback: try <title>, then document.head, then document.documentElement
const urlObserverTarget = document.querySelector('title') || document.head || document.documentElement;
if (urlObserverTarget) {
  urlObserver.observe(urlObserverTarget, { childList: true, subtree: true });
  console.log(`[YouTube Filter] URL observer: ${urlObserverTarget.tagName}`);
}

browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'refilter') {
    // Return Promise to indicate async handling
    return (async () => {
      try {
        const settings = await browser.storage.sync.get(DEFAULT_SETTINGS);
        currentSettings = { ...currentSettings, ...settings };
        
        // Performance optimization: prepare settings on update
        prepareSettings(currentSettings);
        
        runAllFilters();
      } catch (error) {
        console.error('[YouTube Filter] Error reloading settings:', error);
      }
    })();
  }
});

browser.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'sync') {
    try {
      const settings = await browser.storage.sync.get(DEFAULT_SETTINGS);
      currentSettings = { ...currentSettings, ...settings };
      
      // Performance optimization: prepare settings on change
      prepareSettings(currentSettings);
      
      runAllFilters();
    } catch (error) {
      console.error('[YouTube Filter] Error handling storage change:', error);
    }
  }
});

initialize();
console.log('[YouTube Filter] ✅ Loaded');
