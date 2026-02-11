// Content script for Shufersal.co.il
// Handles automatic cart filling for Shufersal

console.log("Shufersal cart filler loaded");

let isProcessing = false;

// Wait for page to be fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function init() {
  // Check if we have a shopping list to process
  chrome.runtime.sendMessage({ action: "getShoppingList" }, (result) => {
    if (result && result.shoppingList && result.targetRetailer === "Shufersal") {
      displayBanner(result.shoppingList);
    }
  });
}

function displayBanner(items) {
  // Create a banner at the top of the page
  const banner = document.createElement("div");
  banner.id = "cart-filler-banner";
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #22d3ee, #2563eb);
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
          color: #2563eb;
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

    // Add delay between items to avoid rate limiting
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
  // Method 1: Try to use internal API (faster and more reliable)
  try {
    return await addViaAPI(item);
  } catch (apiError) {
    console.log("API method failed, trying UI method:", apiError);
    // Method 2: Fallback to UI simulation
    return await addViaUI(item);
  }
}

async function addViaAPI(item) {
  // This is a placeholder - actual API endpoint needs to be discovered
  // by inspecting Shufersal's network requests when adding items
  
  // Example (needs real endpoint):
  // const response = await fetch("https://www.shufersal.co.il/online/api/cart/add", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ barcode: item.itemCode, quantity: item.quantity || 1 }),
  //   credentials: "include"
  // });
  
  // if (!response.ok) throw new Error("API add failed");
  // return await response.json();
  
  throw new Error("API method not implemented - using UI method");
}

async function addViaUI(item) {
  // Search for the product using the search bar
  const searchInput = document.querySelector('input[type="search"], input[placeholder*="חיפוש"], input[name="search"]');
  
  if (!searchInput) {
    throw new Error("Search input not found");
  }

  // Focus and type the barcode
  searchInput.focus();
  searchInput.value = item.itemCode || item.name;
  searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  searchInput.dispatchEvent(new Event("change", { bubbles: true }));

  // Press Enter or click search button
  const searchBtn = document.querySelector('button[type="submit"], button:has([class*="search"])');
  if (searchBtn) {
    searchBtn.click();
  } else {
    searchInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }));
  }

  // Wait for search results
  await sleep(2000);

  // Find and click "Add to Cart" button for the first result
  const addButtons = document.querySelectorAll('button[class*="add"], button:has([class*="cart"])');
  
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
