chrome.action.onClicked.addListener(async () => {
  const dashboardUrl = chrome.runtime.getURL("dashboard.html");
  const tabs = await chrome.tabs.query({ url: dashboardUrl });

  if (tabs.length > 0 && tabs[0].id) {
    // Focus existing tab
    chrome.tabs.update(tabs[0].id, { active: true });
    if (tabs[0].windowId) {
      chrome.windows.update(tabs[0].windowId, { focused: true });
    }
  } else {
    // Open new tab
    chrome.tabs.create({ url: "dashboard.html" });
  }
});

// Context Menu Logic
const MENU_INTERVALS = [1, 2, 5, 15, 30, 60];

function setupMenus() {
  // Clear existing menus to avoid "duplicate id" errors
  chrome.contextMenus.removeAll(async () => {
    // Create parent menu
    chrome.contextMenus.create({
      id: "refresh_interval_parent",
      title: "Refresh Interval",
      contexts: ["action"]
    });

    // Get current setting
    const { refreshInterval } = await chrome.storage.local.get("refreshInterval");
    const currentInterval = refreshInterval ? parseInt(String(refreshInterval)) : 5;

    // Create radio items
    MENU_INTERVALS.forEach((minutes) => {
      chrome.contextMenus.create({
        id: `interval_${minutes}`,
        parentId: "refresh_interval_parent",
        title: `${minutes} Minute${minutes > 1 ? 's' : ''}`,
        type: "radio",
        checked: currentInterval === minutes,
        contexts: ["action"]
      });
    });
  });
}

chrome.runtime.onInstalled.addListener(setupMenus);
chrome.runtime.onStartup.addListener(setupMenus);

// Handle menu clicks
chrome.contextMenus.onClicked.addListener((info, _tab) => {
  if (info.menuItemId.toString().startsWith("interval_")) {
    const minutes = parseInt(info.menuItemId.toString().split("_")[1]);
    chrome.storage.local.set({ refreshInterval: minutes });
  }
});

// Sync menu checked state if changed from Options page or elsewhere
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.refreshInterval) {
    const newMinutes = parseInt(String(changes.refreshInterval.newValue));
    // Check if it matches one of our menu items
    if (MENU_INTERVALS.includes(newMinutes)) {
      chrome.contextMenus.update(`interval_${newMinutes}`, { checked: true });
    }
  }
});
