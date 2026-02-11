# Quick Start: Israeli Supermarket Cart Filler

Get the extension running in 5 minutes:

## Step 1: Create Icons (2 minutes)

Choose the fastest option:

**Option A - Placeholder (30 seconds)**
1. Create any 3 PNG files (even blank blue squares)
2. Name them `icon16.png`, `icon48.png`, `icon128.png`
3. Put them in `extension/icons/`

**Option B - Proper Icons (2 minutes)**
See [ICON_GUIDE.md](icons/ICON_GUIDE.md) for detailed instructions.

## Step 2: Load Extension (1 minute)

1. Open Chrome
2. Go to `chrome://extensions/`
3. Toggle "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `extension` folder

✅ You should see "Israeli Supermarket Cart Filler" in your extensions list.

## Step 3: Test It (2 minutes)

1. Open your comparison site: https://shop-compare-89a46.web.app
2. Add items to your basket
3. Click the basket icon (🛒)
4. Click "Export"
5. Choose "Shufersal" or "Rami Levy"
6. You should see:
   - Alert: "Basket exported to [retailer]"
   - New tab opens with the retailer's site
   - Blue/red banner at the top

If you see the banner → **Success!** The extension is working.

## Step 4: Auto-Fill Cart

1. On the retailer's site, **log in first** (if needed)
2. Click "Start Filling Cart" in the banner
3. Watch as items are automatically added
4. Progress updates show in real-time

⏱️ Expect ~1.5 seconds per item (to avoid rate limiting)

## Troubleshooting

### "Chrome Extension not detected"
- Make sure extension is loaded in `chrome://extensions/`
- Refresh the comparison website page
- Check that the extension is enabled

### Banner doesn't appear on retailer site
- Try refreshing the page
- Check if you clicked the right retailer
- Open DevTools (F12) → Console for errors

### Items not adding
- **Most common**: Retailer changed their HTML structure
- Solution: Update selectors in `extension/retailers/[retailer].js`
- See [README.md](README.md) "Updating Selectors" section

## Next Steps

1. **Customize selectors**: Retailers update their sites frequently. See main README.md for how to find and update element selectors.

2. **Add more retailers**: Copy `extension/retailers/shufersal.js` and modify for new sites.

3. **Discover API endpoints**: Open DevTools → Network tab while manually adding an item. Look for POST requests to find the internal API.

## Need Help?

- Check `extension/README.md` for full documentation
- Look at console errors in DevTools (F12)
- Inspect the Network tab to find API endpoints
- Check the extension popup (click extension icon) to see stored basket

---

**Pro Tip**: Keep DevTools open on retailer sites to watch the extension work and debug issues.
