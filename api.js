/*
  MB Crunchy — API layer
  -----------------------
  Talks to your Google Apps Script Web App, which reads/writes your Google
  Sheet. Paste your deployed Web App URL below (see DEPLOYMENT_GUIDE.md,
  step 4). Until you do, the site runs fully on the local fallback data in
  products-data.js — nothing breaks, you just can't sync live orders yet.
*/

const MB_CONFIG = {
  // Example: "https://script.google.com/macros/s/AKfycb.../exec"
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycby3FP7YBMwY0_1FHdw6QzPIAdoY7ZgVYFJhnUZZkHozxzSl1ZUt7sYse2tFC0llAU4/exec",
,

  WHATSAPP_NUMBER: "917842032879", // country code + number, no + or spaces
  CALL_NUMBER: "+919908560248",
  UPI_ID: "Yachamswapna@ybl",           // your real UPI ID for QR generation
  DELIVERY_CHARGE: 40,
  FREE_DELIVERY_ABOVE: 499,
  GOOGLE_MAPS_EMBED_SRC:
"https://www.google.com/maps/embed?pb=!3m2!1sen!2sin!4v1783336051779!5m2!1sen!2sin!6m8!1m7!1sr3CqE4oVkHaLkPL0-XFv8g!2m2!1d16.75310409675271!2d78.00285889484857!3f128.91799150091882!4f2.2902369577635966!5f0.7820865974627469",

function mbIsBackendConnected() {
  return (
    MB_CONFIG.APPS_SCRIPT_URL &&
    MB_CONFIG.APPS_SCRIPT_URL.startsWith("https://script.google.com/")
  );
}

/** Fetch products from the Sheet via Apps Script. Falls back to local data on any failure. */
async function mbFetchProducts() {
  if (!mbIsBackendConnected()) return MB_PRODUCTS;
  try {
    const res = await fetch(`${MB_CONFIG.APPS_SCRIPT_URL}?action=products`);
    if (!res.ok) throw new Error("Bad response");
    const data = await res.json();
    if (Array.isArray(data) && data.length) return data;
    return MB_PRODUCTS;
  } catch (err) {
    console.warn("Falling back to local product data:", err);
    return MB_PRODUCTS;
  }
}

/** Validate a coupon code against the Sheet. Falls back to a couple of local demo codes. */
async function mbValidateCoupon(code) {
  code = (code || "").trim().toUpperCase();
  if (!code) return null;

  if (mbIsBackendConnected()) {
    try {
      const res = await fetch(
        `${MB_CONFIG.APPS_SCRIPT_URL}?action=coupon&code=${encodeURIComponent(code)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.valid) return data; // { valid, type: 'flat'|'percent', value, code }
        return null;
      }
    } catch (err) {
      console.warn("Coupon check failed, using local demo coupons:", err);
    }
  }

  const local = { WELCOME10: { valid: true, type: "percent", value: 10, code: "WELCOME10" },
                  FLAT50:    { valid: true, type: "flat",    value: 50, code: "FLAT50" } };
  return local[code] || null;
}

/** Save a completed order. Falls back to storing locally (localStorage) if backend isn't connected. */
async function mbSubmitOrder(order) {
  if (mbIsBackendConnected()) {
    try {
      const res = await fetch(MB_CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight on Apps Script
        body: JSON.stringify({ action: "createOrder", order }),
      });
      const data = await res.json();
      return data; // { success, orderId }
    } catch (err) {
      console.warn("Order sync to Sheet failed, saving locally instead:", err);
    }
  }
  // Local fallback so no order is ever lost, even offline.
  const orderId = order.orderId || mbGenerateLocalOrderId();
  const pending = JSON.parse(localStorage.getItem("mb_pending_orders") || "[]");
  pending.push({ ...order, orderId });
  localStorage.setItem("mb_pending_orders", JSON.stringify(pending));
  return { success: true, orderId, offline: true };
}

function mbGenerateLocalOrderId() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MBC-${stamp}-${rand}`;
}
