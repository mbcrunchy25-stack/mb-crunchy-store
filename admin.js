/* MB Crunchy — Admin Panel logic */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const money = (n) => `₹${Number(n || 0).toFixed(0)}`;

let TOKEN = sessionStorage.getItem("mb_admin_token") || "";
let ORDERS = [];
let PRODUCTS = [];

document.addEventListener("DOMContentLoaded", () => {
  if (!mbIsBackendConnected()) {
    $("#connectWarning").style.display = "block";
  }
  if (TOKEN) showDashboard();

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = e.target.username.value.trim();
    const password = e.target.password.value.trim();
    $("#loginError").textContent = "";
    $("#loginBtn").textContent = "Signing in...";
    try {
      const res = await fetch(MB_CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "login", username, password }),
      });
      const data = await res.json();
      if (data.success) {
        TOKEN = data.token;
        sessionStorage.setItem("mb_admin_token", TOKEN);
        showDashboard();
      } else {
        $("#loginError").textContent = data.error || "Login failed.";
      }
    } catch (err) {
      $("#loginError").textContent = "Could not reach the backend. Check your Apps Script URL in js/api.js.";
    }
    $("#loginBtn").textContent = "Sign In";
  });

  $("#logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("mb_admin_token");
    TOKEN = "";
    location.reload();
  });

  $$(".tab-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      $$(".tab-btn").forEach((b) => b.classList.remove("active"));
      $$(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      $("#" + btn.dataset.tab).classList.add("active");
    })
  );

  $("#exportCsvBtn").addEventListener("click", exportOrdersCsv);
  $("#addProductBtn").addEventListener("click", () => openProductForm());
  $("#productForm").addEventListener("submit", saveProduct);
  $("#cancelProductBtn").addEventListener("click", () => $("#productFormWrap").style.display = "none");
});

async function showDashboard() {
  $("#loginScreen").style.display = "none";
  $("#dashboard").style.display = "block";
  await Promise.all([loadOrders(), loadProducts()]);
  renderStats();
  renderOrdersTable();
  renderProductsTable();
  renderChart();
}

async function loadOrders() {
  try {
    const res = await fetch(`${MB_CONFIG.APPS_SCRIPT_URL}?action=orders&token=${TOKEN}`);
    ORDERS = await res.json();
    if (!Array.isArray(ORDERS)) ORDERS = [];
  } catch (err) {
    ORDERS = [];
  }
}
async function loadProducts() {
  PRODUCTS = await mbFetchProducts();
}

function renderStats() {

const totalOrders=ORDERS.length;

const totalRevenue=ORDERS.reduce((s,o)=>s+Number(o.total||0),0);

const pending=ORDERS.filter(o=>o.status==="New").length;

const avg=totalOrders?Math.round(totalRevenue/totalOrders):0;

$("#statGrid").innerHTML=`

<div class="dashboard-card">

<h2>📦 ${PRODUCTS.length}</h2>

<p>Total Products</p>

</div>

<div class="dashboard-card">

<h2>🛒 ${totalOrders}</h2>

<p>Total Orders</p>

</div>

<div class="dashboard-card">

<h2>💰 ${money(totalRevenue)}</h2>

<p>Revenue</p>

</div>

<div class="dashboard-card">

<h2>⚠ ${pending}</h2>

<p>Pending Orders</p>

</div>

<div class="dashboard-card">

<h2>📈 ${money(avg)}</h2>

<p>Average Order</p>

</div>

`;

}

function renderOrdersTable() {
  const tbody = $("#ordersTable tbody");
  if (!ORDERS.length) {
    tbody.innerHTML = `<tr><td colspan="7">No orders yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = ORDERS.slice().reverse().map((o) => `
    <tr>
      <td>${o.orderId}</td>
      <td>${new Date(o.date).toLocaleString()}</td>
      <td>${o.customerName}<br><small>${o.phone}</small></td>
      <td>${money(o.total)}</td>
      <td>${o.paymentMethod}</td>
      <td><span class="status-pill status-${o.status}">${o.status}</span></td>
      <td>
        <select data-order-status="${o.orderId}" class="small-btn">
          ${["New", "Packed", "Delivered", "Cancelled"].map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </td>
    </tr>`).join("");

  $$("[data-order-status]", tbody).forEach((sel) =>
    sel.addEventListener("change", async () => {
      await fetch(MB_CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "updateOrderStatus", token: TOKEN, orderId: sel.dataset.orderStatus, status: sel.value }),
      });
      const order = ORDERS.find((o) => o.orderId === sel.dataset.orderStatus);
      if (order) order.status = sel.value;
      renderStats();
      renderChart();
    })
  );
}

function renderProductsTable() {
  const tbody = $("#productsTable tbody");
  tbody.innerHTML = PRODUCTS.map((p) => `
    <tr>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td><input type="number" value="${p.price}" data-field="price" data-id="${p.id}" style="width:80px;padding:6px;border-radius:6px;border:1px solid var(--line);"></td>
      <td>
        <select data-field="stock" data-id="${p.id}" style="padding:6px;border-radius:6px;border:1px solid var(--line);">
          <option value="in" ${p.stock === "in" ? "selected" : ""}>In Stock</option>
          <option value="out" ${p.stock === "out" ? "selected" : ""}>Out of Stock</option>
        </select>
      </td>
      <td><button class="small-btn" data-edit="${p.id}">Edit</button></td>
    </tr>`).join("");

  $$("[data-field]", tbody).forEach((el) =>
    el.addEventListener("change", async () => {
      const id = el.dataset.id;
      const field = el.dataset.field;
      const product = PRODUCTS.find((p) => p.id === id);
      product[field] = el.value;
      await fetch(MB_CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "updateProduct", token: TOKEN, product: { id, [field]: el.value } }),
      });
    })
  );
  $$("[data-edit]", tbody).forEach((btn) =>
    btn.addEventListener("click", () => openProductForm(PRODUCTS.find((p) => p.id === btn.dataset.edit)))
  );
}

function openProductForm(product) {
  $("#productFormWrap").classList.add("show");
  const f = $("#productForm");
  f.reset();
  f.dataset.editingId = product ? product.id : "";
  if (product) {
    f.elements["id"].value = product.id;
    f.elements["name"].value = product.name;
    f.elements["category"].value = product.category;
    f.elements["price"].value = product.price;
    f.elements["unit"].value = product.unit || "";
    f.elements["image"].value = product.image || "";
    f.elements["description"].value = product.description || "";
    f.elements["bestseller"].checked = !!product.bestseller;
  } else {
    f.elements["id"].value = "NEW" + Math.floor(Math.random() * 9000 + 1000);
  }
}

async function saveProduct(e) {
  e.preventDefault();
  const f = e.target;
  const isEdit = !!f.dataset.editingId;
  const product = {
    id: f.elements["id"].value.trim(),
    name: f.elements["name"].value.trim(),
    category: f.elements["category"].value,
    price: Number(f.elements["price"].value),
    unit: f.elements["unit"].value.trim(),
    image: f.elements["image"].value.trim(),
    description: f.elements["description"].value.trim(),
    bestseller: f.elements["bestseller"].checked,
    stock: "in",
};
  await fetch(MB_CONFIG.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: isEdit ? "updateProduct" : "addProduct", token: TOKEN, product }),
  });
  $("#productFormWrap").classList.remove("show");
  await loadProducts();
  renderProductsTable();
}

function exportOrdersCsv() {
  if (!ORDERS.length) return;
  const headers = Object.keys(ORDERS[0]);
  const rows = ORDERS.map((o) => headers.map((h) => `"${String(o[h] ?? "").replace(/"/g, '""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mb-crunchy-orders-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderChart() {
  const canvas = $("#salesChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Group revenue by date (last 7 distinct order dates)
  const byDate = {};
  ORDERS.forEach((o) => {
    const d = new Date(o.date).toLocaleDateString();
    byDate[d] = (byDate[d] || 0) + Number(o.total || 0);
  });
  const labels = Object.keys(byDate).slice(-7);
  const values = labels.map((l) => byDate[l]);
  const max = Math.max(...values, 1);

  const w = canvas.width, h = canvas.height, pad = 30;
  const barW = (w - pad * 2) / (labels.length || 1);

  ctx.strokeStyle = "#e2d3b8";
  ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();

  labels.forEach((l, i) => {
    const barH = (values[i] / max) * (h - pad * 2);
    const x = pad + i * barW + 8;
    const y = h - pad - barH;
    ctx.fillStyle = "#C1272D";
    ctx.fillRect(x, y, barW - 16, barH);
    ctx.fillStyle = "#2B1B12";
    ctx.font = "11px Mulish, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(l.slice(0, 5), x + (barW - 16) / 2, h - pad + 14);
  });

  if (!labels.length) {
    ctx.fillStyle = "#5B463A";
    ctx.font = "13px Mulish, sans-serif";
    ctx.fillText("No sales data yet", w / 2, h / 2);
  }
}
