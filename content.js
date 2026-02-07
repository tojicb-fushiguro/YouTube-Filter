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
    compiledRegex: settings.compiledAllowlistRegex.length + settings.compiledBlocklistRegex.length,
    dateFilter: settings.dateFilter
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

// Date filter constants
const HOURS_PER_DAY = 24;
const HOURS_PER_WEEK = 24 * 7;
const HOURS_PER_MONTH = 24 * 30;
const HOURS_PER_YEAR = 24 * 365;
const STREAMED_CONTENT_DEFAULT_HOURS = HOURS_PER_DAY / 2;

/**
 * Extract upload time text from video element
 * IMPROVED: Added more selectors and better detection
 */
function getUploadTimeText(container) {
  // Try different selectors for upload time metadata (in order of reliability)
  const selectors = [
    // Primary selectors (most reliable)
    '#metadata-line span.inline-metadata-item:last-child',
    'ytd-video-meta-block #metadata-line span:last-child',
    
    // Secondary selectors (grid/list views)
    '#metadata-line span',
    'ytd-video-meta-block span',
    
    // Tertiary selectors (fallback for compact renderers)
    '.metadata-line span',
    'yt-formatted-string.style-scope.ytd-video-meta-block',
    
    // Last resort (search in all spans)
    'span'
  ];
  
  for (const selector of selectors) {
    const spans = container.querySelectorAll(selector);
    for (const span of spans) {
      const text = span.textContent.trim().toLowerCase();
      
      // Check if text contains time-related keywords
      if (text.match(/\d+\s*(second|minute|hour|day|week|month|year)s?\s*ago/i) || 
          text.includes('streamed') ||
          text === 'live') {
        console.log(`[YouTube Filter] 📅 Found time: "${text}" using selector: ${selector}`);
        return text;
      }
    }
  }
  
  console.warn('[YouTube Filter] ⚠️ Could not find upload time for video:', container);
  return null;
}

/**
 * Parse relative time text into approximate hours
 * IMPROVED: Better parsing and edge case handling
 */
function parseRelativeTime(timeText) {
  if (!timeText) return null;
  
  timeText = timeText.toLowerCase().trim();
  
  // Handle special cases first
  if (timeText === 'live' || timeText.includes('watching now')) {
    return 0; // Live content is 0 hours old
  }
  
  if (timeText.includes('streamed') && !timeText.match(/\d+/)) {
    // "Streamed X ago" without number = treat as recent (12 hours)
    return STREAMED_CONTENT_DEFAULT_HOURS;
  }
  
  // Extract number and unit
  const match = timeText.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/i);
  if (!match) {
    console.warn('[YouTube Filter] ⚠️ Could not parse time text:', timeText);
    return null;
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  
  // Convert to hours based on unit
  const conversions = {
    'second': value / 3600,
    'minute': value / 60,
    'hour': value,
    'day': value * HOURS_PER_DAY,
    'week': value * HOURS_PER_WEEK,
    'month': value * HOURS_PER_MONTH,
    'year': value * HOURS_PER_YEAR
  };
  
  const hours = conversions[unit];
  console.log(`[YouTube Filter] ⏱️ Parsed "${timeText}" as ${hours} hours`);
  return hours;
}

/**
 * Check if video passes the date filter
 * IMPROVED: Better logging and fail-safe behavior
 */
function passesDateFilter(container, settings) {
  // If date filter is disabled (any), always pass
  if (!settings.dateFilter || settings.dateFilter === 'any') {
    return true;
  }
  
  // Extract upload time text
  const timeText = getUploadTimeText(container);
  
  // Fail open: if we can't find the time, show the video (better UX)
  if (!timeText) {
    console.warn('[YouTube Filter] ⚠️ No time found, showing video (fail-open)');
    return true;
  }
  
  // Parse time to hours
  const hours = parseRelativeTime(timeText);
  
  // Fail open: if we can't parse the time, show the video
  if (hours === null) {
    console.warn('[YouTube Filter] ⚠️ Could not parse time, showing video (fail-open)');
    return true;
  }
  
  // Check against filter thresholds
  let maxHours;
  switch (settings.dateFilter) {
    case 'today':
      maxHours = HOURS_PER_DAY;
      break;
    case 'week':
      maxHours = HOURS_PER_WEEK;
      break;
    case 'month':
      maxHours = HOURS_PER_MONTH;
      break;
    case 'year':
      maxHours = HOURS_PER_YEAR;
      break;
    default:
      return true;
  }
  
  const passes = hours <= maxHours;
  console.log(`[YouTube Filter] 📊 Video age: ${hours.toFixed(1)}h, max: ${maxHours}h, passes: ${passes}`);
  
  return passes;
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
                     link.closest('ytd-compact-radio-renderer') ||
                     link.closest('ytd-compact-playlist-renderer') ||
                     link.closest('[class*="video"]') ||
                     link.closest('[id*="video"]') ||
                     link.parentElement?.parentElement;

    if (!container || processed.has(container)) return;
    processed.add(container);

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
      console.log(`[YouTube Filter] 🚫 Sidebar: "${normalizedTitle.substring(0, 40)}..."`);
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
      console.log(`[YouTube Filter] 🚫 Main: "${normalizedTitle.substring(0, 50)}..."`);
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
