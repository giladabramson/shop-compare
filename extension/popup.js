// Popup script
chrome.storage.local.get(["shoppingList", "targetRetailer", "exportTimestamp"], (result) => {
  const statusText = document.getElementById("statusText");
  const itemsList = document.getElementById("itemsList");

  if (result.shoppingList && result.targetRetailer) {
    const timeAgo = Math.round((Date.now() - result.exportTimestamp) / 1000 / 60);
    statusText.innerHTML = `
      <strong>${result.targetRetailer}</strong><br>
      ${result.shoppingList.length} items • ${timeAgo}m ago
    `;

    itemsList.innerHTML = result.shoppingList
      .map(
        (item) => `
        <div class="item">
          ${item.name || item.itemCode}
        </div>
      `
      )
      .join("");
  } else {
    statusText.textContent = "No active export";
    itemsList.innerHTML = '<div class="empty">Export a basket from the comparison site to get started</div>';
  }
});
