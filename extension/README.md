# Israeli Supermarket Cart Filler Extension

A Chrome extension that automatically fills shopping carts on Israeli supermarket websites from your comparison basket.

## Features

- **One-Click Export**: Export your comparison basket directly to retailer websites
- **Auto-Fill**: Automatically adds items to cart using barcodes
- **Multi-Retailer Support**: Shufersal, Rami Levy, and more
- **Login Detection**: Waits for you to log in before processing
- **Progress Tracking**: Real-time updates as items are added

## Installation

### For Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top right
3. Click "Load unpacked"
4. Select the `extension` folder from this project

### Icons (Required)

The extension needs icon files. Create simple icons or use these placeholders:

- `icons/icon16.png` - 16x16 pixels
- `icons/icon48.png` - 48x48 pixels
- `icons/icon128.png` - 128x128 pixels

You can create these using any image editor or use online generators.

## Usage

1. **Compare Prices**: Use the comparison website to build your shopping basket
2. **Export**: Click "Export to Retailer" and select which supermarket
3. **Login**: The extension opens the retailer's site - log in if needed
4. **Auto-Fill**: Click "Start Filling Cart" in the banner at the top
5. **Wait**: The extension automatically adds each item (1.5s delay between items)
6. **Done**: Proceed to checkout when complete

## How It Works

### Website Communication

The website sends basket data to the extension using `window.postMessage`:

```javascript
window.exportToRetailer('Shufersal', [
  { itemCode: '7290000000000', name: 'Product Name', quantity: 2 },
  // ... more items
]);
```

### Extension Flow

1. **Bridge Script** (`bridge.js`): Listens on the comparison website for export events
2. **Background Worker** (`background.js`): Stores the basket and opens retailer tab
3. **Retailer Scripts** (`retailers/shufersal.js`): Inject banner and fill cart

### Adding Items

Two methods (tries API first, falls back to UI):

**Method A - Internal API** (Faster):
```javascript
fetch("retailer.com/api/cart/add", {
  method: "POST",
  body: JSON.stringify({ barcode, quantity }),
  credentials: "include"
});
```

**Method B - UI Simulation** (Fallback):
1. Find search input
2. Type barcode
3. Wait for results
4. Click "Add to Cart" button

## Customization

### Adding Retailers

1. Create new content script in `retailers/` folder
2. Add to `manifest.json` content_scripts array
3. Add URL mapping in `background.js` retailerUrls object
4. Implement `addItemToCart()` with retailer-specific selectors

### Updating Selectors

Retailers change their HTML frequently. Update selectors in retailer scripts:

```javascript
// In retailers/shufersal.js
const searchInput = document.querySelector('YOUR_NEW_SELECTOR');
const addButtons = document.querySelectorAll('UPDATED_BUTTON_SELECTOR');
```

## Technical Details

### Manifest V3

Uses service workers (background.js) instead of background pages for better performance.

### Permissions

- `storage`: Store shopping list between page loads
- `tabs`: Open retailer tabs
- `scripting`: Inject content scripts
- `host_permissions`: Access retailer websites

### Rate Limiting

1.5 second delay between items to avoid being flagged. Adjust in:

```javascript
await sleep(1500); // in retailers/*.js
```

## Troubleshooting

### Items Not Adding

1. Check console for errors (`F12` on retailer page)
2. Inspect network tab when manually adding items to find API endpoint
3. Update selectors if HTML structure changed

### Extension Not Loading

1. Check `chrome://extensions/` for errors
2. Verify icons folder exists
3. Reload extension after code changes

### Login Issues

- Extension doesn't handle login/2FA automatically
- User must log in manually
- Extension waits until "Start" is clicked

## Future Enhancements

- [ ] Detect login status automatically
- [ ] Support for quantity updates
- [ ] Handle out-of-stock items
- [ ] Save failed items for manual retry
- [ ] Support for promotions/coupons
- [ ] Multi-tab processing for speed

## Security Note

The extension runs with your logged-in session. Never share the extension with credentials stored. The extension does not collect or transmit any personal data.
