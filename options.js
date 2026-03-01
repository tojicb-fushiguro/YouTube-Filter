/**
 * YouTube Advanced Keyword Filter - Options Page Script
 *
 * @author tojicb-fushiguro
 * @repository https://github.com/tojicb-fushiguro/YouTube-Filter
 */

const _api = (typeof browser !== 'undefined' && browser.storage)
  ? browser
  : {
      storage: {
        sync: {
          get: (defaults) => new Promise((resolve, reject) =>
            chrome.storage.sync.get(defaults, (result) => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
              else resolve(result);
            })
          ),
          set: (items) => new Promise((resolve, reject) =>
            chrome.storage.sync.set(items, () => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
              else resolve();
            })
          )
        }
      },
      tabs: {
        query: (queryInfo) => new Promise((resolve, reject) =>
          chrome.tabs.query(queryInfo, (tabs) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(tabs);
          })
        ),
        sendMessage: (tabId, message) => new Promise((resolve, reject) =>
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(response);
          })
        )
      }
    };

const DEFAULT_SETTINGS = {
  keywords: "",
  blocklist: "",
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

  // Navigation
  hideTopHeader: false,
  hideNotificationBell: false,
  hideExploreSection: false,
  hideMoreFromYoutube: false,
  hideYouSection: false,
  disableAutoplay: false
};

const TOGGLE_IDS = [
  'enabled',
  'hideShorts', 'hideHomepageFeed', 'hideAllComments',
  'hideSponsoredCards', 'hideSubscriptionCard', 'hideSubscriptionButton',
  'hideMembersOnlyVideos', 'hidePlaylistCards', 'hideMixRadioPlaylists',
  'hideVideoSidebar', 'hideLiveChat', 'hideWatchPlaylistPanel',
  'hideTopHeader', 'hideNotificationBell',
  'hideExploreSection', 'hideMoreFromYoutube', 'hideYouSection',
  'disableAutoplay',
  'regex', 'wordBoundary', 'softHide'
];

const INPUT_IDS = ['keywords', 'blocklist', 'dateFilter'];

function initNav() {
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.settings-section');
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.section;
      links.forEach((l) => l.classList.remove('active'));
      sections.forEach((s) => s.classList.remove('active'));
      link.classList.add('active');
      const targetSection = document.getElementById(`section-${target}`);
      if (targetSection) targetSection.classList.add('active');
    });
  });
}

async function loadSettings() {
  try {
    const settings = await _api.storage.sync.get(DEFAULT_SETTINGS);
    TOGGLE_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!settings[id];
    });
    INPUT_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'SELECT') {
        el.value = settings[id] || DEFAULT_SETTINGS[id];
      } else {
        el.value = settings[id] || '';
      }
    });
  } catch (err) {
    console.error('[YouTube Filter] Error loading settings:', err);
    showStatus('Error loading settings', true);
  }
}

function collectSettings() {
  const settings = {};
  TOGGLE_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) settings[id] = el.checked;
  });
  INPUT_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) settings[id] = el.value.trim ? el.value.trim() : el.value;
  });
  return settings;
}

function showStatus(message, isError = false) {
  const el = document.getElementById('saveStatus');
  el.textContent = message;
  el.className = `save-status show${isError ? ' error' : ''}`;
  setTimeout(() => el.classList.remove('show'), 2500);
}

async function notifyTabs() {
  try {
    const tabs = await _api.tabs.query({ url: 'https://www.youtube.com/*' });
    tabs.forEach((tab) =>
      _api.tabs.sendMessage(tab.id, { action: 'refilter' }).catch(() => {})
    );
  } catch (e) {}
}

async function saveSettings() {
  try {
    const settings = collectSettings();
    await _api.storage.sync.set(settings);
    showStatus('✓ Settings saved');
    await notifyTabs();
  } catch (err) {
    console.error('[YouTube Filter] Error saving settings:', err);
    showStatus('Error saving settings', true);
  }
}

async function resetSettings() {
  if (!confirm('Reset all settings to default?')) return;
  try {
    await _api.storage.sync.set(DEFAULT_SETTINGS);
    await loadSettings();
    showStatus('✓ Reset to defaults');
    await notifyTabs();
  } catch (err) {
    console.error('[YouTube Filter] Error resetting settings:', err);
    showStatus('Error resetting', true);
  }
}

function initAutoSave() {
  TOGGLE_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => saveSettings());
  });
  let debounceTimer = null;
  INPUT_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => saveSettings(), 600);
      });
      el.addEventListener('change', () => saveSettings());
    }
  });
}

function initEnterKey() {
  document.querySelectorAll('input[type="text"]').forEach((input) => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveSettings();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  loadSettings();
  initAutoSave();
  initEnterKey();
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('resetBtn').addEventListener('click', resetSettings);
});