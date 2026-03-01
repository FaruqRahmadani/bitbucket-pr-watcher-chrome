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
