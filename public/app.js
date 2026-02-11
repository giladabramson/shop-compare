const PRICE_FILES = [
  {
    market: "Shufersal",
    path: "/PriceFull7290027600007-002-202602110300.xml",
  },
  {
    market: "Mahsanei Hashuk",
    path: "/mahsanei_hashuk.xml",
  },
];

const data = {
  supermarkets: PRICE_FILES.map((file) => file.market),
  products: [],
};

const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const maxPriceInput = document.getElementById("maxPrice");
const marketToggles = document.getElementById("marketToggles");
const productsTable = document.getElementById("productsTable");
const resultsCount = document.getElementById("resultsCount");
const comparisonCard = document.getElementById("comparisonCard");
const resetFilters = document.getElementById("resetFilters");

let activeMarkets = new Set(data.supermarkets);
let activeCategory = "All";
let lastCompared = null;

const formatPrice = (value) => value.toFixed(2);

const buildUnit = (item) => {
  const unit = item.unitQty ? item.unitQty : "";
  const quantity = item.quantity ? item.quantity : "";
  if (!unit && !quantity) return "";
  if (!unit) return `${quantity}`;
  if (!quantity) return unit;
  return `${quantity} ${unit}`;
};

const normalizeName = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05ff\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isBarcodeLike = (value) => /^\d{11,14}$/.test(value);

const parsePriceXml = (xmlText, market) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  const items = Array.from(doc.querySelectorAll("Item, Product"));

  return items
    .map((item) => {
      const getText = (tag) => item.querySelector(tag)?.textContent?.trim() || "";
      const itemCode = getText("ItemCode");
      const name = getText("ItemName");
      const priceRaw = getText("ItemPrice");
      const unitQty = getText("UnitQty");
      const quantity = getText("Quantity");
      const price = Number.parseFloat(priceRaw);

      if (!itemCode || !name || Number.isNaN(price)) return null;

      const normalizedName = normalizeName(name);
      const matchKey = isBarcodeLike(itemCode)
        ? `barcode:${itemCode}`
        : `name:${normalizedName}`;

      return {
        id: matchKey,
        itemCode,
        name,
        normalizedName,
        category: "Uncategorized",
        unit: buildUnit({ unitQty, quantity }),
        prices: {
          [market]: price,
        },
      };
    })
    .filter(Boolean);
};

const mergeProducts = (target, incoming) => {
  const map = new Map(target.map((product) => [product.id, product]));

  incoming.forEach((product) => {
    const existing = map.get(product.id);
    if (!existing) {
      map.set(product.id, product);
      return;
    }

    existing.prices = { ...existing.prices, ...product.prices };
    if (!existing.unit && product.unit) {
      existing.unit = product.unit;
    }
  });

  return Array.from(map.values());
};

const loadPriceFiles = async () => {
  resultsCount.textContent = "Loading items...";
  try {
    let merged = [];
    for (const file of PRICE_FILES) {
      const response = await fetch(file.path, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load price file (${response.status})`);
      }
      const xmlText = await response.text();
      const products = parsePriceXml(xmlText, file.market);
      merged = mergeProducts(merged, products);
    }
    data.products = merged;
  } catch (error) {
    console.error(error);
    resultsCount.textContent = "Failed to load price file.";
    data.products = [];
  }
};

const buildCategories = () => {
  const categories = ["All", ...new Set(data.products.map((p) => p.category))];
  categorySelect.innerHTML = categories
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join("");
};

const buildMarkets = () => {
  marketToggles.innerHTML = "";
  data.supermarkets.forEach((market) => {
    const pill = document.createElement("button");
    pill.className = "pill active";
    pill.textContent = market;
    pill.addEventListener("click", () => {
      if (activeMarkets.has(market)) {
        if (activeMarkets.size === 1) return;
        activeMarkets.delete(market);
        pill.classList.remove("active");
      } else {
        activeMarkets.add(market);
        pill.classList.add("active");
      }
      renderProducts();
      if (lastCompared) renderComparison(lastCompared);
    });
    marketToggles.appendChild(pill);
  });
};

const getBestPrice = (prices) => {
  let best = { market: null, price: Infinity };
  Object.entries(prices).forEach(([market, price]) => {
    if (!activeMarkets.has(market)) return;
    if (price < best.price) {
      best = { market, price };
    }
  });
  return best;
};

const matchesFilters = (product) => {
  const query = searchInput.value.trim().toLowerCase();
  const maxPrice = parseFloat(maxPriceInput.value);
  const hasQuery = query.length > 0;

  if (hasQuery && !product.name.toLowerCase().includes(query)) return false;
  if (activeCategory !== "All" && product.category !== activeCategory) return false;

  if (!Number.isNaN(maxPrice)) {
    const best = getBestPrice(product.prices);
    if (best.price === Infinity || best.price > maxPrice) return false;
  }

  return true;
};

const renderProducts = () => {
  const filtered = data.products.filter(matchesFilters);
  resultsCount.textContent = `${filtered.length} items`;
  productsTable.innerHTML = filtered
    .map((product) => {
      const best = getBestPrice(product.prices);
      const bestText = best.market
        ? `${formatPrice(best.price)} at ${best.market}`
        : "No market selected";
      const hasBoth = data.supermarkets.every(
        (market) => product.prices[market] !== undefined
      );
      const shufersalPrice = product.prices.Shufersal;
      const mahsaneiPrice = product.prices["Mahsanei Hashuk"];
      return `
        <tr>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${product.unit}</td>
          <td>${shufersalPrice !== undefined ? formatPrice(shufersalPrice) : "—"}</td>
          <td>${mahsaneiPrice !== undefined ? formatPrice(mahsaneiPrice) : "—"}</td>
          <td>${bestText}</td>
          <td>
            ${hasBoth ? "Both markets" : "Single market"}
            <button class="compare" data-id="${product.id}">Compare</button>
          </td>
        </tr>
      `;
    })
    .join("");

  productsTable.querySelectorAll("button.compare").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.getAttribute("data-id");
      const product = data.products.find((item) => item.id === productId);
      if (product) {
        lastCompared = product;
        renderComparison(product);
      }
    });
  });
};

const renderComparison = (product) => {
  const entries = Object.entries(product.prices).filter(([market]) =>
    activeMarkets.has(market)
  );

  if (entries.length === 0) {
    comparisonCard.innerHTML = "<p class=\"muted\">Select at least one supermarket.</p>";
    return;
  }

  const best = getBestPrice(product.prices);
  comparisonCard.innerHTML = entries
    .map(([market, price]) => {
      const isBest = market === best.market;
      return `
        <div class="card">
          <h3>${market}</h3>
          <p class="muted">${product.name} (${product.unit})</p>
          <p><strong>₪${formatPrice(price)}</strong></p>
          <p class="muted">${isBest ? "Best price" : ""}</p>
        </div>
      `;
    })
    .join("");
};

const resetAll = () => {
  searchInput.value = "";
  maxPriceInput.value = "";
  activeCategory = "All";
  categorySelect.value = "All";
  activeMarkets = new Set(data.supermarkets);
  buildMarkets();
  renderProducts();
  comparisonCard.innerHTML = "<p class=\"muted\">Select a product to compare.</p>";
};

searchInput.addEventListener("input", renderProducts);
categorySelect.addEventListener("change", (event) => {
  activeCategory = event.target.value;
  renderProducts();
});
maxPriceInput.addEventListener("input", renderProducts);
resetFilters.addEventListener("click", resetAll);

const init = async () => {
  await loadPriceFiles();
  activeMarkets = new Set(data.supermarkets);
  buildCategories();
  buildMarkets();
  renderProducts();
  comparisonCard.innerHTML = "<p class=\"muted\">Select a product to compare.</p>";
};

init();
