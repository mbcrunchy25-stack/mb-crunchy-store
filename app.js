/* MB Crunchy — Storefront app logic */

let ALL_PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem("mb_cart") || "{}");
let wishlist = JSON.parse(localStorage.getItem("mb_wishlist") || "[]");
let appliedCoupon = JSON.parse(localStorage.getItem("mb_coupon") || "null");
let activeCategory = "all";
let searchTerm = "";

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const money = (n) => `₹${Number(n).toFixed(0)}`;

/* ---------------------------- INIT ---------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  renderCategories();
  renderSkeletons();
  ALL_PRODUCTS = await mbFetchProducts();
  renderProducts();
  renderBestsellers();
  updateCartUI();
  bindGlobalEvents();
  buildFaq();
});

/* ---------------------------- THEME ---------------------------- */
function initTheme() {
  const saved = localStorage.getItem("mb_theme");
  if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
  $("#themeToggle").textContent = saved === "dark" ? "☀️" : "🌙";
}
function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("mb_theme", "light");
    $("#themeToggle").textContent = "🌙";
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("mb_theme", "dark");
    $("#themeToggle").textContent = "☀️";
  }
}

/* ---------------------------- CATEGORIES ---------------------------- */
function renderCategories() {
  const grid = $("#categoryGrid");
  grid.innerHTML = MB_CATEGORIES.map(
    (c) => `
    <button class="cat-card" data-cat="${c.id}">
      <div class="cat-emoji">${c.emoji}</div>
      <span>${c.name}</span>
    </button>`
  ).join("");
  $$(".cat-card", grid).forEach((btn) =>
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      syncFilterChips();
      renderProducts();
      document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
    })
  );
}

function syncFilterChips() {
  $$(".chip").forEach((c) => c.classList.toggle("active", c.dataset.cat === activeCategory));
  $$(".cat-card").forEach((c) => c.classList.toggle("active", c.dataset.cat === activeCategory));
}

/* ---------------------------- PRODUCT RENDERING ---------------------------- */
function renderSkeletons() {
  const grid = $("#productGrid");
  grid.innerHTML = Array.from({ length: 8 })
    .map(
      () => `
    <div class="product-card">
      <div class="product-thumb skeleton"></div>
      <div class="product-body">
        <div class="skeleton" style="height:14px;border-radius:6px;margin-bottom:8px;"></div>
        <div class="skeleton" style="height:20px;width:60%;border-radius:6px;"></div>
      </div>
    </div>`
    )
    .join("");
}

function getFilteredProducts() {
  return ALL_PRODUCTS.filter((p) => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch =
      !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });
}

function productCardHTML(p) {
  const inWish = wishlist.includes(p.id);
  const qty = cart[p.id]?.qty || 0;
  const outOfStock = p.stock === "out";
  const thumb = p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
    : `<span>${emojiFor(p.category)}</span>`;
  return `
  <div class="product-card" data-id="${p.id}">
    <div class="product-thumb">
      ${p.bestseller ? `<span class="badge-best">🔥 Bestseller</span>` : ""}
      <button class="wish-btn ${inWish ? "active" : ""}" data-wish="${p.id}" aria-label="Toggle wishlist">
        ${inWish ? "❤️" : "🤍"}
      </button>
      ${thumb}
      ${outOfStock ? `<div class="badge-out">Out of Stock</div>` : ""}
    </div>
    <div class="product-body">
      <h4>${p.name}</h4>
      <div class="product-unit">${p.unit || ""}</div>
      <div class="product-price-row">
        <span class="price">${money(p.price)}</span>
        ${
          outOfStock
            ? `<button class="add-btn" disabled style="opacity:.5;">Notify me</button>`
            : qty > 0
            ? `<div class="qty-stepper" data-qty="${p.id}">
                 <button data-step="-1">−</button><span>${qty}</span><button data-step="1">+</button>
               </div>`
            : `<button class="add-btn" data-add="${p.id}">Add +</button>`
        }
      </div>
    </div>
  </div>`;
}

function emojiFor(cat) {
  const map = { frozen: "🧊", appadalu: "🫓", pickles: "🥒", oils: "🛢", honey: "🍯", jaggery: "🌴" };
  return map[cat] || "🍽️";
}

function renderProducts() {
  const grid = $("#productGrid");
  const list = getFilteredProducts();
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <span class="em">🔍</span>No products match your search. Try another keyword or category.
    </div>`;
    return;
  }
  grid.innerHTML = list.map(productCardHTML).join("");
  bindProductCardEvents(grid);
}

function renderBestsellers() {
  const grid = $("#bestsellerGrid");
  const list = ALL_PRODUCTS.filter((p) => p.bestseller).slice(0, 8);
  grid.innerHTML = list.map(productCardHTML).join("");
  bindProductCardEvents(grid);
}

function bindProductCardEvents(container) {
  $$("[data-add]", container).forEach((btn) =>
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.add);
      refreshAllProductGrids();
    })
  );
  $$("[data-qty]", container).forEach((wrap) => {
    const id = wrap.dataset.qty;
    $$("button", wrap).forEach((btn) =>
      btn.addEventListener("click", () => {
        changeQty(id, parseInt(btn.dataset.step, 10));
        refreshAllProductGrids();
      })
    );
  });
  $$("[data-wish]", container).forEach((btn) =>
    btn.addEventListener("click", () => toggleWishlist(btn.dataset.wish))
  );
}

function refreshAllProductGrids() {
  renderProducts();
  renderBestsellers();
  updateCartUI();
}

/* ---------------------------- CART ---------------------------- */
function addToCart(id) {
  const p = ALL_PRODUCTS.find((x) => x.id === id);
  if (!p || p.stock === "out") return;
  cart[id] = cart[id] || { qty: 0 };
  cart[id].qty += 1;
  persistCart();
  showToast(`Added ${p.name} to cart`);
}
function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  persistCart();
}
function removeFromCart(id) {
  delete cart[id];
  persistCart();
  showToast("Item removed");
  refreshAllProductGrids();
  renderCartDrawer();
}
function persistCart() {
  localStorage.setItem("mb_cart", JSON.stringify(cart));
}
function cartCount() {
  return Object.values(cart).reduce((s, i) => s + i.qty, 0);
}
function cartSubtotal() {
  return Object.entries(cart).reduce((sum, [id, item]) => {
    const p = ALL_PRODUCTS.find((x) => x.id === id);
    return p ? sum + p.price * item.qty : sum;
  }, 0);
}
function discountAmount(subtotal) {
  if (!appliedCoupon) return 0;
  if (appliedCoupon.type === "percent") return Math.round((subtotal * appliedCoupon.value) / 100);
  return Math.min(appliedCoupon.value, subtotal);
}
function deliveryFee(subtotal) {
  if (subtotal === 0) return 0;
  return subtotal >= MB_CONFIG.FREE_DELIVERY_ABOVE ? 0 : MB_CONFIG.DELIVERY_CHARGE;
}

function updateCartUI() {
  const count = cartCount();
  $("#cartBadge").textContent = count;
  $("#cartBadge").style.display = count ? "flex" : "none";
  renderCartDrawer();
}

function renderCartDrawer() {
  const body = $("#cartBody");
  const entries = Object.entries(cart);
  if (!entries.length) {
    body.innerHTML = `<div class="empty-state"><span class="em">🛒</span>Your cart is empty.<br>Add some crunch!</div>`;
    $("#cartFoot").style.display = "none";
    return;
  }
  $("#cartFoot").style.display = "block";
  body.innerHTML = entries
    .map(([id, item]) => {
      const p = ALL_PRODUCTS.find((x) => x.id === id);
      if (!p) return "";
      return `
      <div class="cart-row">
        <div class="thumb">${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">` : emojiFor(p.category)}</div>
        <div class="info">
          <h5>${p.name}</h5>
          <div class="u">${p.unit || ""} · ${money(p.price)}</div>
          <div class="qty-stepper" data-qty="${p.id}" style="background:var(--cream-2); display:inline-flex; margin-top:6px;">
            <button data-step="-1" style="color:var(--ink);">−</button>
            <span style="color:var(--ink);">${item.qty}</span>
            <button data-step="1" style="color:var(--ink);">+</button>
          </div>
        </div>
        <button class="remove" data-remove="${id}">Remove</button>
      </div>`;
    })
    .join("");

  $$("[data-remove]", body).forEach((btn) =>
    btn.addEventListener("click", () => removeFromCart(btn.dataset.remove))
  );
  $$("[data-qty]", body).forEach((wrap) => {
    const id = wrap.dataset.qty;
    $$("button", wrap).forEach((btn) =>
      btn.addEventListener("click", () => {
        changeQty(id, parseInt(btn.dataset.step, 10));
        updateCartUI();
        refreshAllProductGrids();
      })
    );
  });

  const subtotal = cartSubtotal();
  const discount = discountAmount(subtotal);
  const delivery = deliveryFee(subtotal - discount);
  const total = subtotal - discount + delivery;

  $("#cartFoot").innerHTML = `
    <div class="coupon-row">
      <input id="couponInput" placeholder="Coupon code" value="${appliedCoupon ? appliedCoupon.code : ""}">
      <button class="btn btn-outline btn-sm" id="applyCouponBtn">Apply</button>
    </div>
    <div id="couponMsg" style="font-size:12px;color:var(--leaf);margin:-8px 0 10px;"></div>
    <div class="row-line"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    ${discount ? `<div class="row-line"><span>Discount (${appliedCoupon.code})</span><span>−${money(discount)}</span></div>` : ""}
    <div class="row-line"><span>Delivery</span><span>${delivery === 0 ? "FREE" : money(delivery)}</span></div>
    <div class="row-line total"><span>Total</span><span>${money(total)}</span></div>
    <button class="btn btn-primary btn-block" id="checkoutBtn" style="margin-top:12px;">Proceed to Checkout</button>
    <button class="btn btn-leaf btn-block" id="waCartBtn" style="margin-top:10px;">Order on WhatsApp</button>
  `;
  $("#applyCouponBtn").addEventListener("click", applyCouponHandler);
  $("#checkoutBtn").addEventListener("click", openCheckout);
  $("#waCartBtn").addEventListener("click", () => sendWhatsAppOrder(null));
}

async function applyCouponHandler() {
  const code = $("#couponInput").value;
  const result = await mbValidateCoupon(code);
  const msg = $("#couponMsg");
  if (result && result.valid) {
    appliedCoupon = result;
    localStorage.setItem("mb_coupon", JSON.stringify(appliedCoupon));
    msg.style.color = "var(--leaf)";
    msg.textContent = `Coupon ${result.code} applied ✅`;
  } else {
    appliedCoupon = null;
    localStorage.removeItem("mb_coupon");
    msg.style.color = "var(--chili)";
    msg.textContent = "Invalid or expired coupon.";
  }
  renderCartDrawer();
}

/* ---------------------------- WISHLIST ---------------------------- */
function toggleWishlist(id) {
  if (wishlist.includes(id)) wishlist = wishlist.filter((x) => x !== id);
  else wishlist.push(id);
  localStorage.setItem("mb_wishlist", JSON.stringify(wishlist));
  refreshAllProductGrids();
}

/* ---------------------------- DRAWER / MODALS ---------------------------- */
function openCart() {
  $("#overlay").classList.add("show");
  $("#cartDrawer").classList.add("show");
}
function closeCart() {
  $("#overlay").classList.remove("show");
  $("#cartDrawer").classList.remove("show");
}
function openCheckout() {
  if (!cartCount()) return;
  closeCart();
  $("#checkoutOverlay").classList.add("show");
}
function closeCheckout() {
  $("#checkoutOverlay").classList.remove("show");
}

/* ---------------------------- CHECKOUT / ORDER ---------------------------- */
let selectedPayment = "COD";

function selectPayment(method) {
  selectedPayment = method;
  $$(".pay-opt").forEach((el) => el.classList.toggle("active", el.dataset.pay === method));
  const qrBox = $("#qrBox");
  if (method !== "COD") {
    qrBox.classList.add("show");
    renderUpiQr();
    $("#txnRow").style.display = "block";
  } else {
    qrBox.classList.remove("show");
    $("#txnRow").style.display = "none";
  }
}

function renderUpiQr() {
  const subtotal = cartSubtotal();
  const discount = discountAmount(subtotal);
  const delivery = deliveryFee(subtotal - discount);
  const total = subtotal - discount + delivery;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(MB_CONFIG.UPI_ID)}&pn=${encodeURIComponent(
    "MB Crunchy"
  )}&am=${total}&cu=INR&tn=${encodeURIComponent("MB Crunchy Order")}`;
  const box = $("#qrCanvas");
  box.innerHTML = "";
  if (window.QRCode) {
    new QRCode(box, { text: upiUrl, width: 170, height: 170 });
  } else {
    box.innerHTML = `<p style="font-size:12px;">Scan with GPay / PhonePe / Paytm using UPI ID: <b>${MB_CONFIG.UPI_ID}</b></p>`;
  }
}

async function submitOrder(e) {
  e.preventDefault();
  const form = e.target;
  const subtotal = cartSubtotal();
  const discount = discountAmount(subtotal);
  const delivery = deliveryFee(subtotal - discount);
  const total = subtotal - discount + delivery;

  const items = Object.entries(cart).map(([id, item]) => {
    const p = ALL_PRODUCTS.find((x) => x.id === id);
    return { id, name: p?.name, price: p?.price, qty: item.qty, lineTotal: (p?.price || 0) * item.qty };
  });

  const order = {
    orderId: mbGenerateLocalOrderId(),
    date: new Date().toISOString(),
    customerName: form.custName.value.trim(),
    phone: form.custPhone.value.trim(),
    address: form.custAddress.value.trim(),
    location: form.custLocation.value.trim(),
    notes: form.custNotes.value.trim(),
    paymentMethod: selectedPayment,
    transactionId: form.txnId ? form.txnId.value.trim() : "",
    items,
    subtotal,
    discount,
    coupon: appliedCoupon ? appliedCoupon.code : "",
    delivery,
    total,
  };

  $("#placeOrderBtn").textContent = "Placing order...";
  $("#placeOrderBtn").disabled = true;

  const result = await mbSubmitOrder(order);
  order.orderId = result.orderId || order.orderId;

  closeCheckout();
  showOrderSuccess(order);

  cart = {};
  appliedCoupon = null;
  persistCart();
  localStorage.removeItem("mb_coupon");
  updateCartUI();
  refreshAllProductGrids();

  $("#placeOrderBtn").textContent = "Place Order";
  $("#placeOrderBtn").disabled = false;
  form.reset();
}

function showOrderSuccess(order) {
  $("#successOrderId").textContent = order.orderId;
  $("#successOverlay").classList.add("show");
  $("#waFinalBtn").onclick = () => sendWhatsAppOrder(order);
}

/* ---------------------------- WHATSAPP ---------------------------- */
function sendWhatsAppOrder(order) {
  let lines = [`Hello MB Crunchy,`, ``, `I want to order:`];
  let total;

  if (order) {
    order.items.forEach((i) => lines.push(`• ${i.name} x${i.qty} — ${money(i.lineTotal)}`));
    total = order.total;
    lines.push(``, `Total Price: ${money(total)}`, `Customer Name: ${order.customerName}`, `Order ID: ${order.orderId}`);
  } else {
    Object.entries(cart).forEach(([id, item]) => {
      const p = ALL_PRODUCTS.find((x) => x.id === id);
      if (p) lines.push(`• ${p.name} x${item.qty} — ${money(p.price * item.qty)}`);
    });
    const subtotal = cartSubtotal();
    const discount = discountAmount(subtotal);
    const delivery = deliveryFee(subtotal - discount);
    total = subtotal - discount + delivery;
    lines.push(``, `Total Price: ${money(total)}`);
  }

  const msg = encodeURIComponent(lines.join("\n"));
  window.open(`https://wa.me/${MB_CONFIG.WHATSAPP_NUMBER}?text=${msg}`, "_blank");
}

/* ---------------------------- TOASTS ---------------------------- */
function showToast(text) {
  const stack = $("#toastStack");
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  stack.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, 2200);
}

/* ---------------------------- FAQ ---------------------------- */
function buildFaq() {
  $$(".faq-item").forEach((item) => {
    $(".faq-q", item).addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      $$(".faq-item").forEach((i) => i.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    });
  });
}

/* ---------------------------- GLOBAL EVENTS ---------------------------- */
function bindGlobalEvents() {
  $("#themeToggle").addEventListener("click", toggleTheme);
  $("#cartIconBtn").addEventListener("click", openCart);
  $("#closeCartBtn").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);
  $("#closeCheckoutBtn").addEventListener("click", closeCheckout);
  $("#checkoutOverlay").addEventListener("click", (e) => {
    if (e.target.id === "checkoutOverlay") closeCheckout();
  });
  $("#closeSuccessBtn").addEventListener("click", () => $("#successOverlay").classList.remove("show"));

  $("#searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderProducts();
  });

  $$(".chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      activeCategory = chip.dataset.cat;
      syncFilterChips();
      renderProducts();
    })
  );

  $$(".pay-opt").forEach((el) => el.addEventListener("click", () => selectPayment(el.dataset.pay)));
  $("#checkoutForm").addEventListener("submit", submitOrder);
}
