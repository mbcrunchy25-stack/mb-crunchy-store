/**
 * MB CRUNCHY — Google Apps Script Backend
 * -----------------------------------------
 * Paste this whole file into Extensions > Apps Script of your Google Sheet,
 * then deploy as a Web App (see DEPLOYMENT_GUIDE.md, step 4).
 *
 * Expected Sheet tabs (exact names, case-sensitive):
 *   Products   | id | category | name | price | unit | image | stock | bestseller | description
 *   Orders     | orderId | date | customerName | phone | address | location | notes |
 *                paymentMethod | transactionId | itemsJSON | subtotal | discount |
 *                coupon | delivery | total | status
 *   Customers  | phone | name | address | location | firstOrderDate | lastOrderDate | totalOrders | totalSpent
 *   Coupons    | code | type | value | active
 *   Inventory  | id | name | stock | lowStockAlert
 *   Admin      | username | password   (simple — see security note in the guide)
 */

const SHEET_NAMES = {
  PRODUCTS: "Products",
  ORDERS: "Orders",
  CUSTOMERS: "Customers",
  COUPONS: "Coupons",
  INVENTORY: "Inventory",
  ADMIN: "Admin",
};

function getSS() {
  return SpreadsheetApp.getActiveSpreadsheet();
}
function getSheet(name) {
  const ss = getSS();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

/* ------------------------- ROUTER ------------------------- */
function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === "products") return jsonOut(getProducts());
    if (action === "coupon") return jsonOut(checkCoupon(e.parameter.code));
    if (action === "orders") return jsonOut(getOrders(e.parameter.token));
    if (action === "ping") return jsonOut({ ok: true, time: new Date().toISOString() });
    return jsonOut({ error: "Unknown action" });
  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === "createOrder") return jsonOut(createOrder(body.order));
    if (action === "updateProduct") return jsonOut(updateProduct(body.token, body.product));
    if (action === "addProduct") return jsonOut(addProduct(body.token, body.product));
    if (action === "updateStock") return jsonOut(updateStock(body.token, body.id, body.stock));
    if (action === "login") return jsonOut(adminLogin(body.username, body.password));
    if (action === "updateOrderStatus") return jsonOut(updateOrderStatus(body.token, body.orderId, body.status));

    return jsonOut({ error: "Unknown action" });
  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/* ------------------------- PRODUCTS ------------------------- */
function getProducts() {
  const sheet = getSheet(SHEET_NAMES.PRODUCTS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  return rows
    .filter((r) => r[0]) // skip blank rows
    .map((r) => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = r[i]));
      obj.bestseller = obj.bestseller === true || obj.bestseller === "TRUE" || obj.bestseller === "true";
      return obj;
    });
}

function updateProduct(token, product) {
  requireAdmin(token);
  const sheet = getSheet(SHEET_NAMES.PRODUCTS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf("id");
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === product.id) {
      headers.forEach((h, colIdx) => {
        if (product[h] !== undefined) sheet.getRange(i + 1, colIdx + 1).setValue(product[h]);
      });
      return { success: true };
    }
  }
  return { success: false, error: "Product not found" };
}

function addProduct(token, product) {
  requireAdmin(token);
  const sheet = getSheet(SHEET_NAMES.PRODUCTS);
  const headers = sheet.getDataRange().getValues()[0];
  const row = headers.map((h) => product[h] ?? "");
  sheet.appendRow(row);
  return { success: true };
}

function updateStock(token, id, stock) {
  requireAdmin(token);
  const sheet = getSheet(SHEET_NAMES.PRODUCTS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf("id");
  const stockCol = headers.indexOf("stock");
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === id) {
      sheet.getRange(i + 1, stockCol + 1).setValue(stock);
      return { success: true };
    }
  }
  return { success: false, error: "Product not found" };
}

/* ------------------------- COUPONS ------------------------- */
function checkCoupon(code) {
  if (!code) return { valid: false };
  const sheet = getSheet(SHEET_NAMES.COUPONS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  const codeCol = headers.indexOf("code");
  const typeCol = headers.indexOf("type");
  const valueCol = headers.indexOf("value");
  const activeCol = headers.indexOf("active");

  for (const r of rows) {
    if (String(r[codeCol]).toUpperCase() === String(code).toUpperCase()) {
      const active = r[activeCol] === true || r[activeCol] === "TRUE" || r[activeCol] === "";
      if (!active) return { valid: false };
      return { valid: true, code: r[codeCol], type: r[typeCol], value: Number(r[valueCol]) };
    }
  }
  return { valid: false };
}

/* ------------------------- ORDERS ------------------------- */
function createOrder(order) {
  if (!order) return { success: false, error: "No order data" };
  const sheet = getSheet(SHEET_NAMES.ORDERS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "orderId", "date", "customerName", "phone", "address", "location", "notes",
      "paymentMethod", "transactionId", "itemsJSON", "subtotal", "discount",
      "coupon", "delivery", "total", "status",
    ]);
  }

  const orderId = order.orderId || generateOrderId();
  sheet.appendRow([
    orderId,
    order.date || new Date().toISOString(),
    order.customerName || "",
    order.phone || "",
    order.address || "",
    order.location || "",
    order.notes || "",
    order.paymentMethod || "COD",
    order.transactionId || "",
    JSON.stringify(order.items || []),
    order.subtotal || 0,
    order.discount || 0,
    order.coupon || "",
    order.delivery || 0,
    order.total || 0,
    "New",
  ]);

  reduceStockForOrder(order.items || []);
  upsertCustomer(order);

  return { success: true, orderId };
}

function generateOrderId() {
  const now = new Date();
  const stamp = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
  return `MBC-${stamp}`;
}

function reduceStockForOrder(items) {
  // Optional simple inventory hook — if you track numeric stock counts in the
  // Inventory sheet, this decrements them. Safe no-op if the sheet is empty.
  const sheet = getSheet(SHEET_NAMES.INVENTORY);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return;
  const headers = rows[0];
  const idCol = headers.indexOf("id");
  const stockCol = headers.indexOf("stock");
  if (idCol === -1 || stockCol === -1) return;

  items.forEach((item) => {
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idCol] === item.id) {
        const current = Number(rows[i][stockCol]) || 0;
        const updated = Math.max(0, current - item.qty);
        sheet.getRange(i + 1, stockCol + 1).setValue(updated);
        break;
      }
    }
  });
}

function upsertCustomer(order) {
  const sheet = getSheet(SHEET_NAMES.CUSTOMERS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["phone", "name", "address", "location", "firstOrderDate", "lastOrderDate", "totalOrders", "totalSpent"]);
  }
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const phoneCol = headers.indexOf("phone");
  const orderPhone = String(order.phone || "").trim();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][phoneCol] || "").trim() === orderPhone) {
      const totalOrdersCol = headers.indexOf("totalOrders");
      const totalSpentCol = headers.indexOf("totalSpent");
      const lastOrderCol = headers.indexOf("lastOrderDate");
      sheet.getRange(i + 1, totalOrdersCol + 1).setValue((Number(rows[i][totalOrdersCol]) || 0) + 1);
      sheet.getRange(i + 1, totalSpentCol + 1).setValue((Number(rows[i][totalSpentCol]) || 0) + (order.total || 0));
      sheet.getRange(i + 1, lastOrderCol + 1).setValue(new Date().toISOString());
      return;
    }
  }
  sheet.appendRow([
    order.phone, order.customerName, order.address, order.location,
    new Date().toISOString(), new Date().toISOString(), 1, order.total || 0,
  ]);
}

function getOrders(token) {
  requireAdmin(token);
  const sheet = getSheet(SHEET_NAMES.ORDERS);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows.shift();
  return rows.map((r) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = r[i]));
    return obj;
  });
}

function updateOrderStatus(token, orderId, status) {
  requireAdmin(token);
  const sheet = getSheet(SHEET_NAMES.ORDERS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf("orderId");
  const statusCol = headers.indexOf("status");
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === orderId) {
      sheet.getRange(i + 1, statusCol + 1).setValue(status);
      return { success: true };
    }
  }
  return { success: false, error: "Order not found" };
}

/* ------------------------- ADMIN AUTH -------------------------
   Simple token check: on login, we issue a token = hash(username + a
   script property secret) that the admin panel stores and sends back on
   every write request. Good enough for a single-owner shop; see the
   deployment guide for how to rotate the secret / password.
------------------------------------------------------------------ */
function adminLogin(username, password) {
  const sheet = getSheet(SHEET_NAMES.ADMIN);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) {
    return { success: false, error: "No admin configured. Add a row to the Admin sheet first." };
  }
  const headers = rows[0];
  const userCol = headers.indexOf("username");
  const passCol = headers.indexOf("password");

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][userCol] === username && String(rows[i][passCol]) === String(password)) {
      const token = generateToken(username);
      PropertiesService.getScriptProperties().setProperty("token_" + token, username);
      return { success: true, token };
    }
  }
  return { success: false, error: "Invalid username or password" };
}

function generateToken(username) {
  const raw = username + "_" + new Date().getTime() + "_" + Math.random();
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw));
}

function requireAdmin(token) {
  if (!token) throw new Error("Unauthorized: missing token");
  const stored = PropertiesService.getScriptProperties().getProperty("token_" + token);
  if (!stored) throw new Error("Unauthorized: invalid or expired token");
}

/* ------------------------- ONE-TIME SETUP HELPER -------------------------
   Run this once manually from the Apps Script editor (select
   "setupSheets" in the function dropdown, then click Run) to create all
   tabs with correct headers if they don't already exist.
---------------------------------------------------------------------------- */
function setupSheets() {
  const productHeaders = ["id", "category", "name", "price", "unit", "image", "stock", "bestseller", "description"];
  const orderHeaders = ["orderId", "date", "customerName", "phone", "address", "location", "notes", "paymentMethod", "transactionId", "itemsJSON", "subtotal", "discount", "coupon", "delivery", "total", "status"];
  const customerHeaders = ["phone", "name", "address", "location", "firstOrderDate", "lastOrderDate", "totalOrders", "totalSpent"];
  const couponHeaders = ["code", "type", "value", "active"];
  const inventoryHeaders = ["id", "name", "stock", "lowStockAlert"];
  const adminHeaders = ["username", "password"];

  ensureHeaders(SHEET_NAMES.PRODUCTS, productHeaders);
  ensureHeaders(SHEET_NAMES.ORDERS, orderHeaders);
  ensureHeaders(SHEET_NAMES.CUSTOMERS, customerHeaders);
  ensureHeaders(SHEET_NAMES.COUPONS, couponHeaders);
  ensureHeaders(SHEET_NAMES.INVENTORY, inventoryHeaders);
  ensureHeaders(SHEET_NAMES.ADMIN, adminHeaders);

  // Seed two demo coupons if the sheet is empty.
  const couponSheet = getSheet(SHEET_NAMES.COUPONS);
  if (couponSheet.getLastRow() === 1) {
    couponSheet.appendRow(["WELCOME10", "percent", 10, true]);
    couponSheet.appendRow(["FLAT50", "flat", 50, true]);
  }

  Logger.log("Setup complete. Tabs created: Products, Orders, Customers, Coupons, Inventory, Admin.");
}

function ensureHeaders(sheetName, headers) {
  const sheet = getSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
}
