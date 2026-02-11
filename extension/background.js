// Background service worker for the extension

// Listen for messages from the website or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "exportToRetailer") {
    handleExportToRetailer(request.data);
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "getShoppingList") {
    chrome.storage.local.get(["shoppingList", "targetRetailer"], (result) => {
      sendResponse(result);
    });
    return true;
  }

  if (request.action === "updateProgress") {
    // Update badge or notification
    chrome.action.setBadgeText({ text: request.progress.toString() });
    return true;
  }

  if (request.action === "completeExport") {
    chrome.storage.local.remove(["shoppingList", "targetRetailer"]);
    chrome.action.setBadgeText({ text: "" });
    sendResponse({ success: true });
    return true;
  }
});

async function handleExportToRetailer(data) {
  const { retailer, items } = data;

  // Store the shopping list in local storage
  await chrome.storage.local.set({
    shoppingList: items,
    targetRetailer: retailer,
    exportTimestamp: Date.now(),
  });

  // Determine the retailer URL
  const retailerUrls = {
    Shufersal: "https://www.shufersal.co.il/online/he/shop",
    "Rami Levy": "https://www.rami-levy.co.il/he/online/market",
    "Mahsanei Hashuk": "https://www.mahsaneihashuk.co.il",
    Victory: "https://www.victory.co.il",
    "Yenot Bitan": "https://www.ybitan.co.il/online",
  };

  const url = retailerUrls[retailer];

  if (url) {
    // Open the retailer's site in a new tab
    chrome.tabs.create({ url, active: true });
  } else {
    console.error("Unknown retailer:", retailer);
  }
}

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Israeli Supermarket Cart Filler installed");
  chrome.action.setBadgeBackgroundColor({ color: "#2563eb" });
});
