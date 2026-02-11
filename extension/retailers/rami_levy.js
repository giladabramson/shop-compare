// Content script for Rami Levy
// Similar structure to Shufersal but with Rami Levy-specific selectors

console.log("Rami Levy cart filler loaded");

let isProcessing = false;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function init() {
  chrome.runtime.sendMessage({ action: "getShoppingList" }, (result) => {
    if (result && result.shoppingList && result.targetRetailer === "Rami Levy") {
      displayBanner(result.shoppingList);
    }
  });
}

function displayBanner(items) {
  const banner = document.createElement("div");
  banner.id = "cart-filler-banner";
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    padding: 16px;
    z-index: 999999;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: system-ui, sans-serif;
  `;

  banner.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px;">🛒 Ready to fill cart with ${items.length} items</h3>
      <p style="margin: 0 0 12px 0; font-size: 14px; opacity: 0.9;">
        Please log in if needed, then click "Start" to automatically add items to your cart.
      </p>
      <div style="display: flex; gap: 12px; justify-content: center; align-items: center;">
        <button id="start-fill-btn" style="
          background: white;
          color: #dc2626;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">Start Filling Cart</button>
        <button id="cancel-fill-btn" style="
          background: transparent;
          color: white;
          border: 2px solid white;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">Cancel</button>
        <span id="progress-text" style="margin-left: 12px; font-size: 14px;"></span>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById("start-fill-btn").addEventListener("click", () => {
    startFillingCart(items);
  });

  document.getElementById("cancel-fill-btn").addEventListener("click", () => {
    banner.remove();
    chrome.runtime.sendMessage({ action: "completeExport" });
  });
}

async function startFillingCart(items) {
  if (isProcessing) return;
  isProcessing = true;

  const startBtn = document.getElementById("start-fill-btn");
  const cancelBtn = document.getElementById("cancel-fill-btn");
  const progressText = document.getElementById("progress-text");

  startBtn.disabled = true;
  cancelBtn.disabled = true;
  startBtn.style.opacity = "0.5";
  cancelBtn.style.opacity = "0.5";

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    progressText.textContent = `Processing ${i + 1}/${items.length}...`;

    try {
      await addItemToCart(item);
      successCount++;
      chrome.runtime.sendMessage({ action: "updateProgress", progress: i + 1 });
    } catch (error) {
      console.error("Failed to add item:", item, error);
      failCount++;
    }

    await sleep(1500);
  }

  progressText.textContent = `Complete! Added ${successCount} items (${failCount} failed)`;
  startBtn.remove();
  cancelBtn.textContent = "Close";
  cancelBtn.disabled = false;
  cancelBtn.style.opacity = "1";

  chrome.runtime.sendMessage({ action: "completeExport" });
  isProcessing = false;
}

async function addItemToCart(item) {
  // Rami Levy specific implementation
  // Similar to Shufersal but with different selectors
  const searchInput = document.querySelector('input[type="search"], input[name="q"]');
  
  if (!searchInput) {
    throw new Error("Search input not found");
  }

  searchInput.focus();
  searchInput.value = item.itemCode || item.name;
  searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  
  await sleep(1000);
  
  const addButtons = document.querySelectorAll('button[title*="הוסף"], button[class*="add-to-cart"]');
  
  if (addButtons.length > 0) {
    addButtons[0].click();
    await sleep(500);
    return true;
  }

  throw new Error("Add to cart button not found");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
