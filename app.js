// app.js — UI state, filtering, sorting, cart persistence and error states
import { fetchProducts, fetchCategories } from "./api.js";

const $ = (selector) => document.querySelector(selector);
const state = {
  products: [], category: "all", query: "", sort: "featured",
  cart: loadCart(), categories: []
};
const CACHE_CART_KEY = "foundry-cart-v1";

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CACHE_CART_KEY) || "[]"); }
  catch { return []; }
}
function saveCart() {
  try { localStorage.setItem(CACHE_CART_KEY, JSON.stringify(state.cart)); }
  catch { showToast("Unable to save bag on this browser."); }
}
function money(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value); }
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
}
let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}
function setApiStatus(mode, text) {
  $("#apiStatus").className = `api-status ${mode}`;
  $("#apiStatus").lastChild.textContent = text;
}

async function loadCollection({ retry = false } = {}) {
  $("#loadingGrid").hidden = false;
  $("#productGrid").hidden = true;
  $("#errorBanner").hidden = true;
  $("#emptyState").hidden = true;
  setApiStatus("", " Connecting to store");
  try {
    const [productResult, categoryResult] = await Promise.all([fetchProducts(), fetchCategories()]);
    state.products = productResult.products;
    state.categories = categoryResult.categories;
    renderCategories();
    renderProducts();
    $("#loadingGrid").hidden = true;
    $("#productGrid").hidden = false;
    setApiStatus("online", productResult.fromCache ? " Using saved collection" : " Store connected");
  } catch (error) {
    $("#loadingGrid").hidden = true;
    $("#errorBanner").hidden = false;
    $("#errorMessage").textContent = error.message;
    setApiStatus("offline", " Store unavailable");
    // Keep cached content visible if it was loaded earlier in this session.
    if (state.products.length) {
      $("#productGrid").hidden = false;
      renderProducts();
    }
  }
}

function renderCategories() {
  const tabs = $("#categoryTabs");
  tabs.innerHTML = `<button class="category-tab ${state.category === "all" ? "active" : ""}" data-category="all">All items</button>`;
  state.categories.forEach(category => {
    const active = state.category === category ? "active" : "";
    tabs.insertAdjacentHTML("beforeend", `<button class="category-tab ${active}" data-category="${escapeHTML(category)}">${escapeHTML(category.replace(/-/g, " "))}</button>`);
  });
}

function visibleProducts() {
  let items = [...state.products];
  if (state.category !== "all") items = items.filter(item => item.category === state.category);
  if (state.query.trim()) {
    const query = state.query.trim().toLowerCase();
    items = items.filter(item => [item.title, item.description, item.category, item.brand].some(value => String(value || "").toLowerCase().includes(query)));
  }
  switch (state.sort) {
    case "price-asc": items.sort((a,b) => a.price - b.price); break;
    case "price-desc": items.sort((a,b) => b.price - a.price); break;
    case "rating": items.sort((a,b) => b.rating - a.rating); break;
    case "title": items.sort((a,b) => a.title.localeCompare(b.title)); break;
  }
  return items;
}

function renderProducts() {
  const items = visibleProducts();
  $("#resultCount").textContent = `${items.length} ${items.length === 1 ? "item" : "items"}`;
  $("#productGrid").innerHTML = items.map(product => {
    const image = product.thumbnail || product.images?.[0] || "";
    return `<article class="product-card">
      <div class="product-image"><span class="product-category">${escapeHTML(product.category)}</span>
        <img src="${escapeHTML(image)}" alt="${escapeHTML(product.title)}" loading="lazy" onerror="this.style.opacity='.15'">
      </div>
      <div class="product-info"><div class="product-title">${escapeHTML(product.title)}</div>
        <div class="product-meta"><strong class="price">${money(product.price)}</strong><span class="rating">★ ${Number(product.rating || 0).toFixed(1)}</span></div>
        <button class="add-button" data-add="${product.id}">＋ Add to bag</button>
      </div>
    </article>`;
  }).join("");
  $("#emptyState").hidden = items.length !== 0;
  $("#productGrid").hidden = items.length === 0;
}

function addToCart(id) {
  const product = state.products.find(item => item.id === Number(id));
  if (!product) return;
  const existing = state.cart.find(item => item.id === product.id);
  if (existing) existing.quantity += 1;
  else state.cart.push({ id: product.id, title: product.title, price: product.price, image: product.thumbnail, quantity: 1 });
  saveCart(); renderCart(); showToast(`${product.title} added to your bag`);
}

function changeQuantity(id, amount) {
  const item = state.cart.find(entry => entry.id === Number(id));
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) state.cart = state.cart.filter(entry => entry.id !== Number(id));
  saveCart(); renderCart();
}

function renderCart() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  $("#cartCount").textContent = count;
  $("#drawerCount").textContent = `(${count})`;
  $("#cartSubtotal").textContent = money(subtotal);
  $("#cartItems").innerHTML = state.cart.length ? state.cart.map(item => `
    <div class="cart-line"><img src="${escapeHTML(item.image)}" alt="">
      <div class="cart-line-info"><strong>${escapeHTML(item.title)}</strong><small>${money(item.price)} each</small>
        <div class="quantity"><button data-qty="${item.id}" data-change="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-qty="${item.id}" data-change="1" aria-label="Increase quantity">＋</button></div>
      </div><b>${money(item.price * item.quantity)}</b>
    </div>`).join("") : `<div class="cart-empty">Your bag is waiting for something good.</div>`;
}

function openCart() { $("#cartOverlay").hidden = false; document.body.style.overflow = "hidden"; $("#closeCart").focus(); }
function closeCart() { $("#cartOverlay").hidden = true; document.body.style.overflow = ""; $("#cartButton").focus(); }

$("#searchInput").addEventListener("input", event => { state.query = event.target.value; renderProducts(); });
$("#sortSelect").addEventListener("change", event => { state.sort = event.target.value; renderProducts(); });
$("#categoryTabs").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderCategories(); renderProducts();
});
$("#productGrid").addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(button.dataset.add);
});
$("#clearFilters").addEventListener("click", () => {
  state.category = "all"; state.query = ""; state.sort = "featured";
  $("#searchInput").value = ""; $("#sortSelect").value = "featured";
  renderCategories(); renderProducts();
});
$("#retryButton").addEventListener("click", () => loadCollection({ retry: true }));
$("#cartButton").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#closeCartBackdrop").addEventListener("click", closeCart);
$("#cartItems").addEventListener("click", event => {
  const button = event.target.closest("[data-qty]");
  if (button) changeQuantity(button.dataset.qty, Number(button.dataset.change));
});
$("#checkoutButton").addEventListener("click", () => showToast("Demo checkout — no payment will be taken."));
document.addEventListener("keydown", event => { if (event.key === "Escape" && !$("#cartOverlay").hidden) closeCart(); });

renderCart();
loadCollection();
