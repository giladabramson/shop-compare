# Firestore schema (Supermarket Compare)

This schema maps a universal product catalog (barcodes/names) to retailer-specific IDs, prices, and store branches.

## Collections

### `retailers/{retailerId}`
Fields:
- `name` (string)
- `website` (string)
- `supportsCartAutomation` (bool)
- `createdAt` (timestamp)

### `stores/{storeId}`
Fields:
- `retailerId` (string)
- `branchCode` (string)
- `city` (string)
- `address` (string)
- `geo` (geopoint)
- `updatedAt` (timestamp)

### `products/{productId}`
Use barcode as `productId` when available. Fallback to a hash of normalized name.

Fields:
- `barcode` (string)
- `name` (string)
- `brand` (string)
- `categories` (array of string)
- `unitSize` (string)
- `normalizedName` (string)
- `updatedAt` (timestamp)

#### Subcollection: `products/{productId}/retailerItems/{retailerId}`
Maps a universal product to retailer-specific internal IDs.

Fields:
- `retailerItemId` (string)
- `retailerName` (string)
- `lastSeenAt` (timestamp)
- `source` (string)

### `storeItems/{storeId}/items/{productId}`
Latest price for a product at a specific store.

Fields:
- `productId` (string)
- `retailerId` (string)
- `storeId` (string)
- `price` (number)
- `currency` (string, e.g. "ILS")
- `promoId` (string, optional)
- `effectiveDate` (timestamp)
- `sourceFile` (string)
- `updatedAt` (timestamp)

#### Subcollection: `storeItems/{storeId}/items/{productId}/history/{historyId}`
Optional price history.

Fields:
- `price` (number)
- `promoId` (string, optional)
- `effectiveDate` (timestamp)
- `sourceFile` (string)
- `createdAt` (timestamp)

### `promotions/{promoId}`
Fields:
- `retailerId` (string)
- `storeId` (string)
- `type` (string)
- `description` (string)
- `startDate` (timestamp)
- `endDate` (timestamp)
- `productIds` (array of string)

## Suggested indexes
- `storeItems` collection group: `storeId` + `price`
- `storeItems` collection group: `storeId` + `productId`
- `products`: `normalizedName` (for search), `categories`

## Notes
- Keep `storeItems` for fast reads and `history` for audit and trend analysis.
- Use `products/{productId}/retailerItems` to map universal products to internal retailer IDs.
- Normalize product names for search (lowercase, remove punctuation, collapse spaces).
