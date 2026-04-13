/**
 * Lightweight API wrapper for the client application.
 *
 * Each helper forwards to the server-side REST endpoints and normalizes
 * error handling so components can work with plain data objects.
 */
const BASE = "/api";

/**
 * Perform a JSON API request and return the parsed response body.
 *
 * @param {string} path - API path relative to `/api`.
 * @param {RequestInit} [opts={}] - Fetch options for the request.
 * @returns {Promise<any>} Parsed JSON payload from the server.
 */
async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const api = {
  // --- Menu Management ---
  /**
   * Fetch all menu items.
   * @returns {Promise<Array>} Array of menu items with pricing and category.
   */
  getMenu:       ()           => request("/menu"),

  /**
   * Fetch single menu item with ingredient details.
   * @param {number} id - Menu item ID.
   * @returns {Promise<Object>} Menu item with ingredients list.
   */
  getMenuItem:   (id)         => request(`/menu/${id}`),

  /**
   * Fetch modifiers available for a menu item.
   * @param {number} id - Menu item ID.
   * @returns {Promise<Array>} Modifier groups with choice options and price deltas.
   */
  getModifiers:  (id)         => request(`/menu/${id}/modifiers`),

  /**
   * Create a new menu item.
   * @param {Object} body - Menu item payload with name, category, base_price, ingredients.
   * @returns {Promise<Object>} Created menu item with ID.
   */
  createMenuItem:(body)       => request("/menu", { method: "POST", body: JSON.stringify(body) }),

  /**
   * Update menu item details and ingredients.
   * @param {number} id - Menu item ID.
   * @param {Object} body - Update payload.
   * @returns {Promise<Object>} Updated menu item.
   */
  updateMenuItem:(id, body)   => request(`/menu/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  /**
   * Delete a menu item.
   * @param {number} id - Menu item ID.
   * @returns {Promise<Object>} Deletion confirmation.
   */
  deleteMenuItem:(id)         => request(`/menu/${id}`, { method: "DELETE" }),

  // --- Inventory Management ---
  /**
   * Fetch all inventory items.
   * @returns {Promise<Array>} Inventory items with stock quantities and units.
   */
  getInventory:      ()           => request("/inventory"),

  /**
   * Update ingredient stock quantity.
   * @param {number} id - Inventory item ID.
   * @param {Object} body - Update with stock_quantity.
   * @returns {Promise<Object>} Updated inventory item.
   */
  updateInventory:   (id, body)   => request(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  /**
   * Create a new inventory item.
   * @param {Object} body - Inventory payload with name, unit, stock_quantity.
   * @returns {Promise<Object>} Created inventory item.
   */
  createInventory:   (body)       => request("/inventory", { method: "POST", body: JSON.stringify(body) }),

  // --- Employee Management ---
  /**
   * Fetch all employees.
   * @returns {Promise<Array>} Employee roster with names, roles, active status.
   */
  getEmployees:      ()           => request("/employees"),

  /**
   * Create a new employee.
   * @param {Object} body - Employee payload with name and role.
   * @returns {Promise<Object>} Created employee with ID.
   */
  createEmployee:    (body)       => request("/employees", { method: "POST", body: JSON.stringify(body) }),

  /**
   * Update employee details (name, role, is_active).
   * @param {number} id - Employee ID.
   * @param {Object} body - Update payload.
   * @returns {Promise<Object>} Updated employee.
   */
  updateEmployee:    (id, body)   => request(`/employees/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  // --- Order Management ---
  /**
   * Submit a new order with items and modifiers.
   * @param {Object} body - Order with items array containing menu_item_id, quantity, choice_ids.
   * @returns {Promise<Object>} Created order with order_id and total.
   */
  submitOrder:       (body)       => request("/orders", { method: "POST", body: JSON.stringify(body) }),

  /**
   * Retrieve orders with optional date filtering.
   * @param {Object} params - Query parameters (start_date, end_date).
   * @returns {Promise<Array>} Matched orders.
   */
  getOrders:         (params)     => request(`/orders?${new URLSearchParams(params)}`),

  // --- Reports ---
  /**
   * Get X-Report (shift total) with hourly breakdown.
   * @returns {Promise<Object>} Hourly sales data and totals.
   */
  getXReport:        ()           => request("/reports/x-report"),

  /**
   * Generate Z-Report and close today's sales.
   * @returns {Promise<Object>} Closed report with summary.
   */
  generateZReport:   ()           => request("/reports/z-report", { method: "POST" }),

  /**
   * Reset Z-Report for testing purposes.
   * @returns {Promise<Object>} Reset confirmation.
   */
  resetZReport:      ()           => request("/reports/reset-z-report", { method: "POST" }),

  /**
   * Fetch sales summary for a date range.
   * @param {string} s - Start date (YYYY-MM-DD).
   * @param {string} e - End date (YYYY-MM-DD).
   * @returns {Promise<Object>} Total orders, revenue, average order value.
   */
  getSalesSummary:   (s, e)       => request(`/reports/sales-summary?start=${s}&end=${e}`),

  /**
   * Fetch sales breakdown by menu item for date range.
   * @param {string} s - Start date (YYYY-MM-DD).
   * @param {string} e - End date (YYYY-MM-DD).
   * @returns {Promise<Array>} Items with quantity sold and revenue.
   */
  getSalesByItem:    (s, e)       => request(`/reports/sales-by-item?start=${s}&end=${e}`),

  /**
   * Fetch ingredient usage for date range.
   * @param {string} s - Start date (YYYY-MM-DD).
   * @param {string} e - End date (YYYY-MM-DD).
   * @returns {Promise<Array>} Ingredients with quantity used.
   */
  getProductUsage:   (s, e)       => request(`/reports/product-usage?start=${s}&end=${e}`),

  // --- External Services ---
  /**
   * Fetch current weather for College Station.
   * @returns {Promise<Object>} Weather data with temperature and WMO code.
   */
  getWeather:        ()           => request("/external/weather"),

  /**
   * Translate a single text to target language.
   * @param {string} text - Text to translate.
   * @param {string} tgt - Target language code (e.g., 'zh', 'es').
   * @param {string} [src='en'] - Source language code.
   * @returns {Promise<Object>} Translation result.
   */
  translate:         (text, tgt, src) => request("/external/translate", { method: "POST", body: JSON.stringify({ text, target: tgt, source: src }) }),

  /**
   * Batch translate multiple texts efficiently.
   * @param {Array<string>} texts - Texts to translate.
   * @param {string} tgt - Target language code.
   * @param {string} [src='en'] - Source language code.
   * @returns {Promise<Object>} Array of translations.
   */
  translateBatch:    (texts, tgt, src) => request("/external/translate-batch", { method: "POST", body: JSON.stringify({ texts, target: tgt, source: src }) }),

  /**
   * Send message to AI chat endpoint.
   * @param {string} message - User message.
   * @returns {Promise<Object>} Chat response with reply field.
   */
  chat:              (message)    => request("/external/chat", { method: "POST", body: JSON.stringify({ message }) }),
};
