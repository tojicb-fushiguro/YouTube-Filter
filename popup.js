// Default settings
const DEFAULT_SETTINGS = {
  keywords: "",
  blocklist: "",
  regex: false,
  enabled: true
};

// Load current settings when popup opens
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    document.getElementById("keywords").value = settings.keywords || "";
    document.getElementById("blocklist").value = settings.blocklist || "";
    document.getElementById("regex").checked = settings.regex || false;
    document.getElementById("enabled").checked = settings.enabled !== false;
  });
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
document.getElementById("save").addEventListener("click", () => {
  const settings = {
    keywords: document.getElementById("keywords").value.trim(),
    blocklist: document.getElementById("blocklist").value.trim(),
    regex: document.getElementById("regex").checked,
    enabled: document.getElementById("enabled").checked
  };

  chrome.storage.sync.set(settings, () => {
    if (chrome.runtime.lastError) {
      showStatus("Error saving settings", true);
      console.error(chrome.runtime.lastError);
    } else {
      showStatus("✓ Settings saved successfully");
      
      // Notify content script to re-filter
      chrome.tabs.query({ url: "https://www.youtube.com/*" }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: "refilter" }).catch(() => {
            // Ignore errors if content script isn't ready
          });
        });
      });
    }
  });
});

// Reset to defaults
document.getElementById("reset").addEventListener("click", () => {
  if (confirm("Reset all settings to default?")) {
    chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
      loadSettings();
      showStatus("✓ Reset to defaults");
    });
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