/**
 * YouTube Advanced Keyword Filter - Popup Script
 * 
 * Handles user interaction with extension settings popup.
 * Manages saving/loading settings from browser storage.
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

// Load current settings when popup opens
async function loadSettings() {
  try {
    const settings = await browser.storage.sync.get(DEFAULT_SETTINGS);
    document.getElementById("keywords").value = settings.keywords || "";
    document.getElementById("blocklist").value = settings.blocklist || "";
    document.getElementById("regex").checked = settings.regex || false;
    document.getElementById("enabled").checked = settings.enabled !== false;
    document.getElementById("wordBoundary").checked = settings.wordBoundary || false;
    document.getElementById("softHide").checked = settings.softHide || false;
    document.getElementById("dateFilter").value = settings.dateFilter || "any";
  } catch (error) {
    console.error('[YouTube Filter] Error loading settings:', error);
  }
}

// Show status message
function showStatus(message, isError = false) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `status show ${isError ? "error" : "success"}`;
  
  setTimeout(() => {
    status.classList.remove("show");
  }, 3000);
}

// Save settings
document.getElementById("save").addEventListener("click", async () => {
  const settings = {
    keywords: document.getElementById("keywords").value.trim(),
    blocklist: document.getElementById("blocklist").value.trim(),
    regex: document.getElementById("regex").checked,
    enabled: document.getElementById("enabled").checked,
    wordBoundary: document.getElementById("wordBoundary").checked,
    softHide: document.getElementById("softHide").checked,
    dateFilter: document.getElementById("dateFilter").value
  };

  try {
    await browser.storage.sync.set(settings);
    showStatus("✓ Settings saved successfully");
    
    // Notify content script to re-filter
    try {
      const tabs = await browser.tabs.query({ url: "https://www.youtube.com/*" });
      tabs.forEach(tab => {
        browser.tabs.sendMessage(tab.id, { action: "refilter" }).catch(() => {
          // Ignore errors if content script isn't ready
        });
      });
    } catch (error) {
      // Ignore errors - settings are saved, just couldn't notify tabs
    }
  } catch (error) {
    showStatus("Error saving settings", true);
    console.error('[YouTube Filter] Error saving settings:', error);
  }
});

// Reset to defaults
document.getElementById("reset").addEventListener("click", async () => {
  if (confirm("Reset all settings to default?")) {
    try {
      await browser.storage.sync.set(DEFAULT_SETTINGS);
      await loadSettings();
      showStatus("✓ Reset to defaults");
    } catch (error) {
      showStatus("Error resetting settings", true);
      console.error('[YouTube Filter] Error resetting settings:', error);
    }
  }
});

// Load settings when popup opens
document.addEventListener("DOMContentLoaded", loadSettings);

// Allow Enter key to save in text fields
document.querySelectorAll("input[type='text']").forEach(input => {
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      document.getElementById("save").click();
    }
  });
});
