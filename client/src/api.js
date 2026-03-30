const BASE = "/api";

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
  getMenu:       ()           => request("/menu"),
  getMenuItem:   (id)         => request(`/menu/${id}`),
  getModifiers:  (id)         => request(`/menu/${id}/modifiers`),
  createMenuItem:(body)       => request("/menu", { method: "POST", body: JSON.stringify(body) }),
  updateMenuItem:(id, body)   => request(`/menu/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteMenuItem:(id)         => request(`/menu/${id}`, { method: "DELETE" }),

  getInventory:      ()           => request("/inventory"),
  updateInventory:   (id, body)   => request(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  createInventory:   (body)       => request("/inventory", { method: "POST", body: JSON.stringify(body) }),

  getEmployees:      ()           => request("/employees"),
  createEmployee:    (body)       => request("/employees", { method: "POST", body: JSON.stringify(body) }),
  updateEmployee:    (id, body)   => request(`/employees/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  submitOrder:       (body)       => request("/orders", { method: "POST", body: JSON.stringify(body) }),
  getOrders:         (params)     => request(`/orders?${new URLSearchParams(params)}`),

  getXReport:        ()           => request("/reports/x-report"),
  generateZReport:   ()           => request("/reports/z-report", { method: "POST" }),
  resetZReport:      ()           => request("/reports/reset-z-report", { method: "POST" }),
  getSalesSummary:   (s, e)       => request(`/reports/sales-summary?start=${s}&end=${e}`),
  getSalesByItem:    (s, e)       => request(`/reports/sales-by-item?start=${s}&end=${e}`),
  getProductUsage:   (s, e)       => request(`/reports/product-usage?start=${s}&end=${e}`),

  getWeather:        ()           => request("/external/weather"),
  translate:         (text, tgt)  => request("/external/translate", { method: "POST", body: JSON.stringify({ text, target: tgt }) }),
  chat:              (message)    => request("/external/chat", { method: "POST", body: JSON.stringify({ message }) }),
};