/**
 * YouTube Advanced Keyword Filter - Popup Script
 *
 * @author tojicb-fushiguro
 * @repository https://github.com/tojicb-fushiguro/YouTube-Filter
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
  hideShorts: false,
  hideHomepageFeed: false,
  hideAllComments: false,
  hideSponsoredCards: false,
  hideSubscriptionCard: false,
  hideSubscriptionButton: false,
  hidePlaylistCards: false,
  hideMembersOnlyVideos: false,
  hideMixRadioPlaylists: false,
  hideVideoSidebar: false,
  hideLiveChat: false,
  hideWatchPlaylistPanel: false,
  hideTopHeader: false,
  hideNotificationBell: false,
  hideExploreSection: false,
  hideMoreFromYoutube: false,
  hideYouSection: false,
  disableAutoplay: false
};

async function loadPopup() {
  try {
    const settings = await browser.storage.sync.get(DEFAULT_SETTINGS);
    document.getElementById('enabled').checked = settings.enabled !== false;
    updateStats(settings);
  } catch (e) {
    console.error('[YouTube Filter] Popup load error:', e);
  }
}

function updateStats(settings) {
  const domToggles = [
    'hideShorts', 'hideHomepageFeed', 'hideAllComments',
    'hideSponsoredCards', 'hideSubscriptionCard', 'hideSubscriptionButton',
    'hidePlaylistCards', 'hideMembersOnlyVideos', 'hideMixRadioPlaylists',
    'hideVideoSidebar', 'hideLiveChat', 'hideWatchPlaylistPanel',
    'hideTopHeader', 'hideNotificationBell',
    'hideExploreSection', 'hideMoreFromYoutube', 'hideYouSection',
    'disableAutoplay'
  ];
  const activeToggles = domToggles.filter((k) => settings[k]).length;
  const hasAllowlist = settings.keywords?.trim().length > 0;
  const hasBlocklist = settings.blocklist?.trim().length > 0;
  const hasChannelAllowlist = settings.channelAllowlist?.trim().length > 0;
  const hasChannelBlocklist = settings.channelBlocklist?.trim().length > 0;
  const hasDateFilter = settings.dateFilter && settings.dateFilter !== 'any';

  const parts = [];
  if (activeToggles > 0) parts.push(`<span>${activeToggles}</span> hide rule${activeToggles !== 1 ? 's' : ''} active`);
  if (hasAllowlist) parts.push('title allowlist on');
  if (hasBlocklist) parts.push('title blocklist on');
  if (hasChannelAllowlist) parts.push('channel allowlist on');
  if (hasChannelBlocklist) parts.push('channel blocklist on');
  if (hasDateFilter) parts.push(`date: ${settings.dateFilter}`);

  document.getElementById('stats').innerHTML =
    parts.length > 0 ? parts.join(' · ') : 'No active filters';
}

document.getElementById('enabled').addEventListener('change', async (e) => {
  try {
    await browser.storage.sync.set({ enabled: e.target.checked });
    const tabs = await browser.tabs.query({ url: 'https://www.youtube.com/*' });
    tabs.forEach((tab) =>
      browser.tabs.sendMessage(tab.id, { action: 'refilter' }).catch(() => {})
    );
  } catch (err) {
    console.error('[YouTube Filter] Error saving enabled state:', err);
  }
});

document.getElementById('openSettings').addEventListener('click', () => {
  if (chrome?.runtime?.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    browser.runtime.openOptionsPage?.();
  }
});

document.addEventListener('DOMContentLoaded', loadPopup);
