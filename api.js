// api.js — isolated REST client with local cache, timeout and normalized errors
const API_BASE = "https://dummyjson.com";
const CACHE_PREFIX = "foundry-api:";
const CACHE_TTL = 5 * 60 * 1000;

function readCache(key) {
  try {
    const item = JSON.parse(localStorage.getItem(CACHE_PREFIX + key) || "null");
    if (item && Date.now() - item.savedAt < CACHE_TTL) return item.data;
  } catch (error) {
    console.warn("Cache read skipped:", error);
  }
  return null;
}

function writeCache(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch (error) {
    console.warn("Cache write skipped:", error);
  }
}

export async function getJSON(path, { cache = true, timeout = 10000 } = {}) {
  const cached = cache ? readCache(path) : null;
  if (cached) return { data: cached, fromCache: true };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) {
      const error = new Error(`The store returned ${response.status}. Please try again.`);
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    if (cache) writeCache(path, data);
    return { data, fromCache: false };
  } catch (error) {
    if (error.name === "AbortError") throw new Error("The request took too long. Check your connection and retry.");
    if (error instanceof TypeError) throw new Error("Network error. Check your internet connection and try again.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchProducts() {
  const result = await getJSON("/products?limit=100&select=id,title,description,category,price,rating,thumbnail,images,brand");
  return { products: result.data.products || [], fromCache: result.fromCache };
}

export async function fetchCategories() {
  const result = await getJSON("/products/category-list");
  return { categories: result.data, fromCache: result.fromCache };
}
