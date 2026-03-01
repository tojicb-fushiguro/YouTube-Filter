/**
 * YouTube Advanced Keyword Filter - Content Script
 *
 * Main filtering logic that runs on all YouTube pages.
 * Filters videos by title keywords using allowlist/blocklist.
 * Also handles DOM hiding features.
 * Cross-browser compatible (Chrome & Firefox).
 *
 * @author tojicb-fushiguro
 * @repository https://github.com/tojicb-fushiguro/YouTube-Filter
 * @license MIT
 */

const DEFAULT_SETTINGS = {
  keywords: "",
  blocklist: "",
  channelAllowlist: "",
  channelBlocklist: "",
  regex: false,
  enabled: true,
  wordBoundary: false,
  softHide: false,
  dateFilter: "any",

  // Core
  hideShorts: false,
  hideHomepageFeed: false,
  hideAllComments: false,

  // Feeds
  hideSponsoredCards: false,
  hideSubscriptionCard: false,
  hideSubscriptionButton: false,
  hideMembersOnlyVideos: false,
  hidePlaylistCards: false,
  hideMixRadioPlaylists: false,

  // Watch Page
  hideVideoSidebar: false,
  hideLiveChat: false,
  hideWatchPlaylistPanel: false,
  hideEndCards: false, // ← new

  // Navigation
  hideTopHeader: false,
  hideNotificationBell: false,
  hideExploreSection: false,
  hideMoreFromYoutube: false,
  hideYouSection: false,
  disableAutoplay: false
};

let currentSettings = {
  ...DEFAULT_SETTINGS,
  parsedAllowlist: [],
  parsedBlocklist: [],
  parsedChannelAllowlist: [],
  parsedChannelBlocklist: [],
  compiledAllowlistRegex: [],
  compiledBlocklistRegex: []
};

let filterTimeout = null;
let isFiltering = false; // ── guard against re-entrant observer feedback loop

// ─────────────────────────────────────────────
// CSS Injection
// ─────────────────────────────────────────────

const STYLE_TAG_ID = 'yt-filter-injected-styles';

// ─────────────────────────────────────────────
// DOM-fingerprinted section selectors
// ─────────────────────────────────────────────

const SUBSCRIPTIONS_SECTION =
  'ytd-guide-section-renderer:has(> div#items > ytd-guide-collapsible-section-entry-renderer > div#header a[href="/feed/subscriptions"])';

const YOU_SECTION =
  'ytd-guide-section-renderer:has(> div#items > ytd-guide-collapsible-section-entry-renderer > div#header a[href="/feed/you"])';

const MORE_FROM_YOUTUBE_SECTION =
  'ytd-guide-section-renderer:has(> h3 yt-formatted-string#guide-section-title:not([is-empty]))';

function buildCSS(settings) {
  const rules = [];

  // ── Core ──────────────────────────────────

  if (!settings.enabled) {
    rules.push('[data-filtered="hard"] { display: revert !important; }');
    rules.push('[data-filtered="soft"] { opacity: revert !important; filter: revert !important; pointer-events: revert !important; }');
  }

  // ── Hide Shorts ────────────────────────────
  // CSS handles ALL shorts hiding — JS never touches shorts elements
  // to avoid MutationObserver feedback loop (263 fires vs 21 without)
  if (settings.hideShorts) {
    // ── Homepage & subscriptions feed ──
    rules.push('ytd-reel-shelf-renderer { display: none !important; }');
    rules.push('ytd-rich-shelf-renderer[is-shorts] { display: none !important; }');
    rules.push('ytd-rich-section-renderer:has(ytd-reel-shelf-renderer) { display: none !important; }');
    rules.push('ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]) { display: none !important; }');
    rules.push('ytd-rich-item-renderer:has(a[href*="/shorts/"]) { display: none !important; }');
    rules.push('ytd-video-renderer:has(a[href*="/shorts/"]) { display: none !important; }');
    rules.push('ytd-reel-item-renderer { display: none !important; }');

    // ── Sidebar navigation Shorts link ──
    rules.push('ytd-guide-entry-renderer:has(a[title="Shorts"]) { display: none !important; }');
    rules.push('ytd-mini-guide-entry-renderer:has(a[href^="/shorts"]) { display: none !important; }');

    // ── Search page — no :has(), confirmed fast selectors ──
    // ytGridShelfViewModelHost confirmed shorts-only (23/23 elements contained shorts)
    // grid-shelf-view-model is the shelf wrapper — safe to hide entirely on search page
    rules.push('ytm-shorts-lockup-view-model { display: none !important; }');
    rules.push('ytm-shorts-lockup-view-model-v2 { display: none !important; }');
    rules.push('.ytGridShelfViewModelHost { display: none !important; }');
    rules.push('grid-shelf-view-model { display: none !important; }');
  }

  // ── Hide Homepage Feed ─────────────────────
  if (settings.hideHomepageFeed) {
    rules.push('ytd-browse[page-subtype="home"] ytd-two-column-browse-results-renderer { display: none !important; }');
    rules.push('body[data-yt-filter-home="true"] ytd-two-column-browse-results-renderer { display: none !important; }');
  }

  // ── Hide All Comments ──────────────────────
  if (settings.hideAllComments) {
    rules.push('ytd-comments#comments { display: none !important; }');
  }

  // ── Feeds ──────────────────────────────────

  if (settings.hideSponsoredCards) {
    rules.push('ytd-promoted-sparkles-web-renderer { display: none !important; }');
    rules.push('ytd-promoted-video-renderer { display: none !important; }');
    rules.push('ytd-display-ad-renderer { display: none !important; }');
    rules.push('ytd-rich-item-renderer:has(ytd-ad-slot-renderer) { display: none !important; }');
    rules.push('ytd-ad-slot-renderer { display: none !important; }');
    rules.push('#masthead-ad { display: none !important; }');
    rules.push('ytd-statement-banner-renderer { display: none !important; }');
    rules.push('ytd-in-feed-ad-layout-renderer { display: none !important; }');
    rules.push('ytd-banner-promo-renderer { display: none !important; }');
  }

  // ── Hide Subscription Section ──────────────
  if (settings.hideSubscriptionCard) {
    rules.push(`${SUBSCRIPTIONS_SECTION} { display: none !important; }`);
    rules.push('ytd-guide-subscriptions-section-renderer { display: none !important; }');
    rules.push('ytd-mini-guide-entry-renderer:has(a[href="/feed/subscriptions"]) { display: none !important; }');
    rules.push('ytd-mini-guide-entry-renderer:has(a[title="Subscriptions"]) { display: none !important; }');
  }

  if (settings.hideSubscriptionButton) {
    rules.push('ytd-subscribe-button-renderer { display: none !important; }');
    rules.push('yt-subscribe-button-view-model { display: none !important; }');
    rules.push('#subscribe-button { display: none !important; }');
    rules.push('#subscribe-button-shape { display: none !important; }');
  }

  if (settings.hideMembersOnlyVideos) {
    rules.push('ytd-video-renderer:has([overlay-style="BADGE_STYLE_TYPE_MEMBERS_ONLY"]) { display: none !important; }');
    rules.push('ytd-rich-item-renderer:has([overlay-style="BADGE_STYLE_TYPE_MEMBERS_ONLY"]) { display: none !important; }');
    rules.push('ytd-compact-video-renderer:has([overlay-style="BADGE_STYLE_TYPE_MEMBERS_ONLY"]) { display: none !important; }');
    rules.push('ytd-grid-video-renderer:has([overlay-style="BADGE_STYLE_TYPE_MEMBERS_ONLY"]) { display: none !important; }');
    rules.push('ytd-grid-video-renderer:has([badge-style="BADGE_STYLE_TYPE_MEMBERS_ONLY"]) { display: none !important; }');
    rules.push('ytd-video-renderer:has(ytd-badge-supported-renderer .badge-style-type-members-only) { display: none !important; }');
    rules.push('ytd-grid-video-renderer:has(ytd-badge-supported-renderer .badge-style-type-members-only) { display: none !important; }');
    rules.push('ytd-rich-item-renderer:has(ytd-badge-supported-renderer .badge-style-type-members-only) { display: none !important; }');
    rules.push('ytd-browse[page-subtype="memberships"] #contents { display: none !important; }');
    rules.push('ytd-item-section-renderer:has([overlay-style="BADGE_STYLE_TYPE_MEMBERS_ONLY"]) { display: none !important; }');
    rules.push('ytd-shelf-renderer:has([overlay-style="BADGE_STYLE_TYPE_MEMBERS_ONLY"]) { display: none !important; }');
    rules.push('yt-lockup-view-model:has([badge-style="MEMBERS_ONLY"]) { display: none !important; }');
    rules.push('ytd-rich-item-renderer:has(yt-lockup-view-model[members-only]) { display: none !important; }');
  }

  if (settings.hideMixRadioPlaylists) {
    rules.push('ytd-compact-radio-renderer { display: none !important; }');
    rules.push('ytd-radio-renderer { display: none !important; }');
    rules.push('ytd-rich-item-renderer:has(a[href*="start_radio=1"]) { display: none !important; }');
    rules.push('ytd-playlist-renderer:has(a[href*="start_radio=1"]) { display: none !important; }');
    rules.push('ytd-grid-radio-renderer { display: none !important; }');
  }

  // ── Watch Page ─────────────────────────────

  if (settings.hideVideoSidebar) {
    rules.push('#secondary { display: none !important; }');
    rules.push('#secondary-inner { display: none !important; }');
    rules.push('#primary { max-width: 100% !important; }');
  }

  if (settings.hideLiveChat) {
    rules.push('ytd-live-chat-frame { display: none !important; }');
    rules.push('#chat { display: none !important; }');
  }

  if (settings.hideWatchPlaylistPanel) {
    rules.push('#playlist { display: none !important; }');
    rules.push('ytd-playlist-panel-renderer { display: none !important; }');
  }

  // ── Hide End Cards ─────────────────────────
  // Hides clickable end card overlays shown in last 20s of video:
  // video suggestion cards, external link cards (Patreon etc), subscribe circle.
  // Does NOT hide baked-in video content (credits, member lists) — those are video pixels.
  if (settings.hideEndCards) {
    rules.push('.ytp-ce-element { display: none !important; }');
    rules.push('.ytp-ce-element-shadow { display: none !important; }');
    rules.push('.ytp-ce-covering-overlay { display: none !important; }');
    rules.push('.ytp-ce-rendered-overlay { display: none !important; }');
    rules.push('.ytp-endscreen-content { display: none !important; }');
    rules.push('.html5-endscreen { display: none !important; }');
  }

  // ── Navigation ─────────────────────────────

  if (settings.hideTopHeader) {
    rules.push('#masthead-container { display: none !important; }');
    rules.push('ytd-app { --ytd-masthead-height: 0px !important; }');
  }

  if (settings.hideNotificationBell) {
    rules.push('ytd-notification-topbar-button-renderer { display: none !important; }');
    rules.push('#notification-button { display: none !important; }');
  }

  // ── Hide Explore Section ──────────────────
  if (settings.hideExploreSection) {
    rules.push('ytd-guide-section-renderer:has(a[href*="UCEgdi0XIXXZ-qJOFPf4JSKg"]) { display: none !important; }');
    rules.push('ytd-guide-section-renderer:has(a[href="/gaming"]) { display: none !important; }');
    rules.push('ytd-guide-section-renderer:has(a[href*="/gaming"]) { display: none !important; }');
    rules.push('ytd-guide-section-renderer:has(a[href*="sport"]) { display: none !important; }');
    rules.push('ytd-guide-entry-renderer:has(a[href*="UCEgdi0XIXXZ-qJOFPf4JSKg"]) { display: none !important; }');
    rules.push('ytd-guide-entry-renderer:has(a[href="/gaming"]) { display: none !important; }');
    rules.push('ytd-guide-entry-renderer:has(a[href*="sport"]) { display: none !important; }');
    rules.push('ytd-guide-section-renderer:has(#guide-section-title:is([title="Explore"], [aria-label="Explore"])) { display: none !important; }');
  }

  // ── Hide More from YouTube ────────────────
  if (settings.hideMoreFromYoutube) {
    rules.push(`${MORE_FROM_YOUTUBE_SECTION} { display: none !important; }`);
  }

  // ── Hide "You" Section ────────────────────
  if (settings.hideYouSection) {
    rules.push(`${YOU_SECTION} { display: none !important; }`);
  }

  return rules.join('\n');
}

function injectStyles(settings) {
  let styleTag = document.getElementById(STYLE_TAG_ID);
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = STYLE_TAG_ID;
    (document.head || document.documentElement).appendChild(styleTag);
  }
  styleTag.textContent = buildCSS(settings);
}

// ─────────────────────────────────────────────
// Homepage detection
// ─────────────────────────────────────────────

function markPageType() {
  const path = location.pathname;
  if (path === '/' || path === '/feed/subscriptions') {
    document.body.setAttribute('data-yt-filter-home', 'true');
  } else {
    document.body.removeAttribute('data-yt-filter-home');
  }
}

// ─────────────────────────────────────────────
// Disable Autoplay
// ─────────────────────────────────────────────

let autoplayRetryTimer = null;
let autoplayRetryCount = 0;
const AUTOPLAY_MAX_RETRIES = 20;
const AUTOPLAY_RETRY_INTERVAL = 500;

function tryDisableAutoplay() {
  const btn = document.querySelector('.ytp-autonav-toggle-button[aria-checked="true"]');
  if (btn) {
    btn.click();
    console.log('[YouTube Filter] ✅ Autoplay disabled');
    autoplayRetryCount = 0;
    clearTimeout(autoplayRetryTimer);
    return;
  }
  autoplayRetryCount++;
  if (autoplayRetryCount < AUTOPLAY_MAX_RETRIES) {
    autoplayRetryTimer = setTimeout(tryDisableAutoplay, AUTOPLAY_RETRY_INTERVAL);
  } else {
    autoplayRetryCount = 0;
  }
}

function applyDisableAutoplay(settings) {
  clearTimeout(autoplayRetryTimer);
  autoplayRetryCount = 0;
  if (!settings.disableAutoplay) return;
  if (!location.pathname.startsWith('/watch')) return;
  tryDisableAutoplay();
}

window.addEventListener('yt-navigate-finish', () => {
  if (currentSettings.disableAutoplay) applyDisableAutoplay(currentSettings);
});

window.addEventListener('yt-player-updated', () => {
  if (currentSettings.disableAutoplay) applyDisableAutoplay(currentSettings);
});

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────

function getObserverTarget() {
  return (
    document.querySelector('ytd-page-manager') ||
    document.querySelector('#content') ||
    document.querySelector('ytd-app') ||
    document.body
  );
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compileRegexPatterns(keywords, useWordBoundary = false) {
  if (!keywords || keywords.length === 0) return [];
  return keywords
    .map((keyword) => {
      if (!keyword) return null;
      try {
        const pattern = useWordBoundary
          ? `\\b${escapeRegex(keyword)}\\b`
          : keyword;
        return new RegExp(pattern, 'i');
      } catch (e) {
        console.warn(`[YouTube Filter] Invalid regex pattern: ${keyword}`, e);
        return null;
      }
    })
    .filter(Boolean);
}

function prepareSettings(settings) {
  settings.parsedAllowlist = parseKeywords(settings.keywords);
  settings.parsedBlocklist = parseKeywords(settings.blocklist);
  settings.parsedChannelAllowlist = parseKeywords(settings.channelAllowlist || '');
  settings.parsedChannelBlocklist = parseKeywords(settings.channelBlocklist || '');

  if (settings.regex) {
    settings.compiledAllowlistRegex = compileRegexPatterns(settings.parsedAllowlist, false);
    settings.compiledBlocklistRegex = compileRegexPatterns(settings.parsedBlocklist, false);
  } else if (settings.wordBoundary) {
    settings.compiledAllowlistRegex = compileRegexPatterns(settings.parsedAllowlist, true);
    settings.compiledBlocklistRegex = compileRegexPatterns(settings.parsedBlocklist, true);
  } else {
    settings.compiledAllowlistRegex = [];
    settings.compiledBlocklistRegex = [];
  }
}

function matches(text, list, compiledRegexList, useRegex, useWordBoundary) {
  if (!list || list.length === 0) return false;
  if (compiledRegexList && compiledRegexList.length > 0) {
    return compiledRegexList.some((regex) => regex.test(text));
  }
  if (!useRegex && !useWordBoundary) {
    return list.some((keyword) => keyword && text.includes(keyword));
  }
  return list.some((keyword) => {
    if (!keyword) return false;
    try {
      if (useRegex) return new RegExp(keyword, 'i').test(text);
      if (useWordBoundary) return new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i').test(text);
      return text.includes(keyword);
    } catch (e) {
      return text.includes(keyword);
    }
  });
}

function parseKeywords(str) {
  if (!str) return [];
  return str.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
}

// ─────────────────────────────────────────────
// Channel name extractor
// ─────────────────────────────────────────────

function getChannelName(container) {
  // New card structure (yt-lockup-view-model) — confirmed from DevTools
  const newStyleLink = container.querySelector('a[href^="/@"]');
  if (newStyleLink) {
    return newStyleLink.textContent?.trim().toLowerCase() || '';
  }
  // Old card structure fallback
  const oldStyleLink =
    container.querySelector('#channel-name a') ||
    container.querySelector('#channel-name yt-formatted-string') ||
    container.querySelector('ytd-channel-name a');
  if (oldStyleLink) {
    return oldStyleLink.textContent?.trim().toLowerCase() || '';
  }
  return '';
}

function shouldShowByChannel(channelName, settings) {
  if (!channelName) return true;
  const allowlist = settings.parsedChannelAllowlist || [];
  const blocklist = settings.parsedChannelBlocklist || [];
  const isChannelBlocked = blocklist.length > 0 &&
    blocklist.some(c => channelName.includes(c));
  if (isChannelBlocked) return false;
  const isChannelAllowed = allowlist.length === 0 ||
    allowlist.some(c => channelName.includes(c));
  return isChannelAllowed;
}

function shouldShowContent(title, settings) {
  const allowlist = settings.parsedAllowlist || [];
  const blocklist = settings.parsedBlocklist || [];
  const isAllowed =
    allowlist.length === 0 ||
    matches(title, allowlist, settings.compiledAllowlistRegex, settings.regex, settings.wordBoundary);
  const isBlocked = matches(
    title,
    blocklist,
    settings.compiledBlocklistRegex,
    settings.regex,
    settings.wordBoundary
  );
  return isAllowed && !isBlocked;
}

function applyFilterStyle(container, shouldShow, settings) {
  if (!shouldShow) {
    if (settings.softHide) {
      container.style.display = '';
      container.style.opacity = '0.3';
      container.style.filter = 'blur(8px)';
      container.style.pointerEvents = 'none';
      container.setAttribute('data-filtered', 'soft');
    } else {
      container.style.display = 'none';
      container.style.opacity = '';
      container.style.filter = '';
      container.style.pointerEvents = '';
      container.setAttribute('data-filtered', 'hard');
      container.setAttribute('aria-hidden', 'true');
    }
  } else {
    container.style.display = '';
    container.style.opacity = '';
    container.style.filter = '';
    container.style.pointerEvents = '';
    container.removeAttribute('data-filtered');
    container.removeAttribute('aria-label');
    container.removeAttribute('aria-hidden');
  }
}

// ─────────────────────────────────────────────
// Date Filter
// ─────────────────────────────────────────────

const HOURS_PER_DAY = 24;
const HOURS_PER_WEEK = 24 * 7;
const HOURS_PER_MONTH = 24 * 30;
const HOURS_PER_YEAR = 24 * 365;
const STREAMED_CONTENT_DEFAULT_HOURS = HOURS_PER_DAY / 2;

function getUploadTimeText(container) {
  const selectors = [
    '#metadata-line span.inline-metadata-item:last-child',
    'ytd-video-meta-block #metadata-line span:last-child',
    '#metadata-line span',
    'ytd-video-meta-block span',
    '.metadata-line span',
    'yt-formatted-string.style-scope.ytd-video-meta-block',
    'span'
  ];
  for (const selector of selectors) {
    const spans = container.querySelectorAll(selector);
    for (const span of spans) {
      const text = span.textContent.trim().toLowerCase();
      if (
        text.match(/\d+\s*(second|minute|hour|day|week|month|year)s?\s*ago/i) ||
        text.includes('streamed') ||
        text === 'live'
      ) {
        return text;
      }
    }
  }
  return null;
}

function parseRelativeTime(timeText) {
  if (!timeText) return null;
  timeText = timeText.toLowerCase().trim();
  if (timeText === 'live' || timeText.includes('watching now')) return 0;
  if (timeText.includes('streamed') && !timeText.match(/\d+/))
    return STREAMED_CONTENT_DEFAULT_HOURS;
  const match = timeText.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/i);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const conversions = {
    second: value / 3600,
    minute: value / 60,
    hour: value,
    day: value * HOURS_PER_DAY,
    week: value * HOURS_PER_WEEK,
    month: value * HOURS_PER_MONTH,
    year: value * HOURS_PER_YEAR
  };
  return conversions[unit] ?? null;
}

function passesDateFilter(container, settings) {
  if (!settings.dateFilter || settings.dateFilter === 'any') return true;
  const timeText = getUploadTimeText(container);
  if (!timeText) return true;
  const hours = parseRelativeTime(timeText);
  if (hours === null) return true;
  const thresholds = {
    today: HOURS_PER_DAY,
    week: HOURS_PER_WEEK,
    month: HOURS_PER_MONTH,
    year: HOURS_PER_YEAR
  };
  const maxHours = thresholds[settings.dateFilter];
  if (!maxHours) return true;
  return hours <= maxHours;
}

// ─────────────────────────────────────────────
// Keyword + Channel Filters
// ─────────────────────────────────────────────

function filterVideos(settings) {
  if (!settings.enabled) return;
  const videos = document.querySelectorAll(
    'ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer'
  );
  videos.forEach((video) => {
    // Always skip shorts in filterVideos — CSS handles them when hideShorts is on,
    // and filterShorts() handles keyword filtering when hideShorts is off.
    // Never set display:none on shorts here to avoid observer feedback loop.
    if (video.querySelector('a[href*="/shorts/"]')) return;

    let titleEl = video.querySelector('#video-title');
    if (!titleEl && video.tagName === 'YTD-RICH-ITEM-RENDERER') {
      titleEl = video.querySelector('ytd-video-renderer #video-title');
    }
    if (!titleEl) {
      titleEl =
        video.querySelector('a#video-title-link yt-formatted-string') ||
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
    const channelName = getChannelName(video);
    if (!title || title.length < 5) return;
    const shouldShow =
      shouldShowContent(title, settings) &&
      shouldShowByChannel(channelName, settings) &&
      passesDateFilter(video, settings);
    applyFilterStyle(video, shouldShow, settings);
  });
}

function filterShorts(settings) {
  if (!settings.enabled) return;
  // If hideShorts is on, CSS handles everything silently — never touch shorts via JS.
  // JS setting display:none on shorts caused observer to fire 263x vs 21x,
  // freezing the search page for 10-15 seconds.
  if (settings.hideShorts) return;

  const shorts = document.querySelectorAll('a[href*="/shorts/"]');
  shorts.forEach((link) => {
    const container = link.closest(
      'ytd-video-renderer, ytd-rich-item-renderer, ytd-reel-item-renderer'
    );
    if (!container) return;
    let titleEl = container.querySelector('#video-title');
    if (!titleEl && container.tagName === 'YTD-RICH-ITEM-RENDERER') {
      titleEl = container.querySelector('ytd-video-renderer #video-title');
    }
    const title = (titleEl?.title || titleEl?.innerText || '').toLowerCase().trim();
    const channelName = getChannelName(container);
    if (!title) return;
    const shouldShow =
      shouldShowContent(title, settings) &&
      shouldShowByChannel(channelName, settings) &&
      passesDateFilter(container, settings);
    applyFilterStyle(container, shouldShow, settings);
  });
}

function filterSidebarVideos(settings) {
  if (!settings.enabled) return;
  const sidebar = document.querySelector('#related');
  if (!sidebar) return;
  const processed = new Set();
  const links = sidebar.querySelectorAll('a[href*="/watch?v="]');
  links.forEach((link) => {
    const container =
      link.closest('ytd-compact-video-renderer') ||
      link.closest('ytd-compact-radio-renderer') ||
      link.closest('ytd-compact-playlist-renderer') ||
      link.closest('[class*="video"]') ||
      link.parentElement?.parentElement;
    if (!container || processed.has(container)) return;
    processed.add(container);
    let title = link.title || link.getAttribute('aria-label') || link.innerText || '';
    if (!title || title.length < 10) {
      const titleEl = container.querySelector('#video-title, span, h3');
      if (titleEl) title = titleEl.innerText || '';
    }
    const normalizedTitle = title.trim().toLowerCase();
    const channelName = getChannelName(container);
    if (!normalizedTitle || normalizedTitle.length < 5) return;
    const shouldShow =
      shouldShowContent(normalizedTitle, settings) &&
      shouldShowByChannel(channelName, settings) &&
      passesDateFilter(container, settings);
    applyFilterStyle(container, shouldShow, settings);
  });
}

// ─────────────────────────────────────────────
// Channel Card + Shelf Filter (search page)
// Handles ytd-channel-renderer profile cards and
// "Latest from X" / "Latest posts from X" shelves.
// Done in JS not CSS — CSS :has() attribute matching
// had case-sensitivity issues with /@MrBeast handles.
// ─────────────────────────────────────────────

function filterChannelCards(settings) {
  if (!settings.enabled) return;
  const blocklist = settings.parsedChannelBlocklist || [];
  const allowlist = settings.parsedChannelAllowlist || [];
  if (blocklist.length === 0 && allowlist.length === 0) return;

  // ── Channel profile cards on search page ──
  document.querySelectorAll('ytd-channel-renderer').forEach(card => {
    const link = card.querySelector('a[href^="/@"]');
    const handle = link?.getAttribute('href')?.replace('/@', '').toLowerCase() || '';
    const name = link?.textContent?.trim().toLowerCase() || '';
    const isBlocked = blocklist.length > 0 &&
      blocklist.some(c => handle.includes(c) || name.includes(c));
    const isAllowed = allowlist.length === 0 ||
      allowlist.some(c => handle.includes(c) || name.includes(c));
    // Hide the whole item-section so no blank gap is left
    const section = card.closest('ytd-item-section-renderer') || card;
    applyFilterStyle(section, !isBlocked && isAllowed, settings);
  });

  // ── "Latest from X" and "Latest posts from X" shelves ──
  document.querySelectorAll('ytd-shelf-renderer, ytd-horizontal-card-list-renderer').forEach(shelf => {
    const link = shelf.querySelector('a[href^="/@"]');
    if (!link) return;
    const handle = link.getAttribute('href')?.replace('/@', '').toLowerCase() || '';
    const name = link.textContent?.trim().toLowerCase() || '';
    const isBlocked = blocklist.length > 0 &&
      blocklist.some(c => handle.includes(c) || name.includes(c));
    const isAllowed = allowlist.length === 0 ||
      allowlist.some(c => handle.includes(c) || name.includes(c));
    applyFilterStyle(shelf, !isBlocked && isAllowed, settings);
  });
}

// ─────────────────────────────────────────────
// Master runner
// ─────────────────────────────────────────────

function runAllFilters() {
  // Prevent re-entrant calls — if our own DOM writes triggered the observer,
  // ignore it to avoid the feedback loop that caused 263 fires in 5 seconds
  if (isFiltering) return;
  isFiltering = true;

  observer.disconnect();
  if (urlObserver) urlObserver.disconnect();

  try {
    markPageType();
    injectStyles(currentSettings);
    filterVideos(currentSettings);
    filterShorts(currentSettings);
    filterSidebarVideos(currentSettings);
    filterChannelCards(currentSettings);
    applyDisableAutoplay(currentSettings);
  } catch (error) {
    console.error('[YouTube Filter] Error during filtering:', error);
  } finally {
    isFiltering = false;
    const target = getObserverTarget();
    if (target) observer.observe(target, { childList: true, subtree: true });
    if (urlObserver) {
      const urlTarget =
        document.querySelector('title') || document.head || document.documentElement;
      if (urlTarget) urlObserver.observe(urlTarget, { childList: true, subtree: true });
    }
  }
}

function scheduleFilter() {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(runAllFilters, 500);
}

// ─────────────────────────────────────────────
// Init & Observers
// ─────────────────────────────────────────────

async function initialize() {
  try {
    const settings = await browser.storage.sync.get(DEFAULT_SETTINGS);
    currentSettings = { ...currentSettings, ...settings };
    prepareSettings(currentSettings);
    runAllFilters();
    setTimeout(runAllFilters, 1500);
  } catch (error) {
    console.error('[YouTube Filter] Error loading settings:', error);
  }
}

const observer = new MutationObserver(() => scheduleFilter());

if (document.body) {
  const target = getObserverTarget();
  observer.observe(target, { childList: true, subtree: true });
}

let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(runAllFilters, 1000);
  }
});

const urlObserverTarget =
  document.querySelector('title') || document.head || document.documentElement;
if (urlObserverTarget) {
  urlObserver.observe(urlObserverTarget, { childList: true, subtree: true });
}

browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'refilter') {
    return (async () => {
      try {
        const settings = await browser.storage.sync.get(DEFAULT_SETTINGS);
        currentSettings = { ...currentSettings, ...settings };
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
      prepareSettings(currentSettings);
      runAllFilters();
    } catch (error) {
      console.error('[YouTube Filter] Error handling storage change:', error);
    }
  }
});

initialize();
