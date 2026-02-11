const data = {
  supermarkets: ["Shufersal", "Rami Levi", "Yenot Bitan", "Victory"],
  products: [
    {
      id: "milk-1l",
      name: "Milk 3%",
      category: "Dairy",
      unit: "1L",
      prices: {
        Shufersal: 6.4,
        "Rami Levi": 5.9,
        "Yenot Bitan": 6.2,
        Victory: 6.1,
      },
    },
    {
      id: "eggs-12",
      name: "Eggs",
      category: "Dairy",
      unit: "12 pcs",
      prices: {
        Shufersal: 12.5,
        "Rami Levi": 11.9,
        "Yenot Bitan": 12.1,
        Victory: 12.0,
      },
    },
    {
      id: "rice-1kg",
      name: "Basmati Rice",
      category: "Pantry",
      unit: "1kg",
      prices: {
        Shufersal: 10.9,
        "Rami Levi": 9.8,
        "Yenot Bitan": 10.4,
        Victory: 10.1,
      },
    },
    {
      id: "chicken-1kg",
      name: "Chicken Breast",
      category: "Meat",
      unit: "1kg",
      prices: {
        Shufersal: 29.9,
        "Rami Levi": 27.4,
        "Yenot Bitan": 28.7,
        Victory: 28.5,
      },
    },
    {
      id: "tomatoes-1kg",
      name: "Tomatoes",
      category: "Produce",
      unit: "1kg",
      prices: {
        Shufersal: 8.5,
        "Rami Levi": 7.8,
        "Yenot Bitan": 8.1,
        Victory: 8.0,
      },
    },
    {
      id: "olive-oil-750",
      name: "Olive Oil",
      category: "Pantry",
      unit: "750ml",
      prices: {
        Shufersal: 36.9,
        "Rami Levi": 34.5,
        "Yenot Bitan": 35.4,
        Victory: 35.1,
      },
    },
  ],
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
      return `
        <tr>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${product.unit}</td>
          <td>${bestText}</td>
          <td><button class="compare" data-id="${product.id}">Compare</button></td>
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

buildCategories();
buildMarkets();
renderProducts();
comparisonCard.innerHTML = "<p class=\"muted\">Select a product to compare.</p>";
