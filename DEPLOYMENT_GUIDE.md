# MB Crunchy — Deployment Guide (100% Free Stack)

This guide takes you from zero to a live, working store using only free
Google tools + GitHub Pages. No subscriptions, no paid APIs.

Estimated setup time: 45–60 minutes, one time only.

---

## 0. What you're deploying

```
mb-crunchy/
├── index.html              ← the storefront (homepage, shop, cart, checkout)
├── admin.html               ← password-protected admin dashboard
├── manifest.json / sw.js    ← PWA install + offline shell caching
├── css/style.css            ← storefront design
├── css/admin.css            ← admin design
├── js/products-data.js      ← offline fallback product list (seed data)
├── js/api.js                ← connects the site to your Google Sheet
├── js/app.js                ← storefront logic (cart, checkout, WhatsApp)
├── js/admin.js              ← admin dashboard logic
├── icons/                   ← app icons
└── google-apps-script/Code.gs  ← paste this into your Sheet's Apps Script
```

The **Google Sheet is your database**. The **Apps Script is your backend
API**. **GitHub Pages (or Google Sites) hosts the HTML/CSS/JS for free**.

---

## 1. Create the Google Sheet ("your database")

1. Go to [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**.
2. Rename it `MB Crunchy Database`.
3. You do **not** need to manually create tabs — step 3 below runs a script
   that creates all 6 tabs (`Products`, `Orders`, `Customers`, `Coupons`,
   `Inventory`, `Admin`) with the correct headers automatically.

---

## 2. Add the Apps Script backend

1. In your Sheet, click **Extensions → Apps Script**.
2. Delete any starter code in `Code.gs`.
3. Open `google-apps-script/Code.gs` from this project, copy **all** of it,
   and paste it into the Apps Script editor.
4. Click **Save** (💾 icon).
5. In the function dropdown at the top (next to "Debug"), select
   **`setupSheets`**, then click **Run** (▶️).
   - The first time, Google will ask you to authorize the script. Click
     **Review permissions → (your account) → Advanced → Go to MB Crunchy
     (unsafe) → Allow**. This warning appears because it's your own
     unpublished script — it's expected and safe.
6. Go back to your Sheet — you should now see 6 tabs, each with header rows,
   and 2 demo coupons (`WELCOME10`, `FLAT50`) in the Coupons tab.

### Add your admin login
In the **Admin** tab, add one row under the headers, e.g.:

| username | password |
|---|---|
| admin | ChooseAStrongPassword123 |

> ⚠️ Security note: this is a lightweight password check suitable for a
> single small-business owner, not enterprise-grade auth. Don't reuse a
> password you use elsewhere, and don't share the Sheet with anyone you
> don't want managing the store.

### Add your real products
Fill in the **Products** tab yourself, or just import the starter catalog:
1. In the Apps Script editor, you can skip this — the site already ships
   with all ~60 MB Crunchy products in `js/products-data.js` as a fallback.
2. To make the **Sheet** the source of truth (recommended), copy each row
   from that JS file into the Products tab, matching these columns exactly:
   `id | category | name | price | unit | image | stock | bestseller | description`
   - `category` must be one of: `frozen`, `appadalu`, `pickles`, `oils`, `honey`, `jaggery`
   - `stock` must be exactly `in` or `out`
   - `bestseller` should be `TRUE` or `FALSE`

---

## 3. Deploy the Apps Script as a Web App (your free API)

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon ⚙️ next to "Select type" → choose **Web app**.
3. Fill in:
   - **Description**: `MB Crunchy API v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**.
5. Authorize again if prompted.
6. Copy the **Web app URL** shown — it looks like:
   `https://script.google.com/macros/s/AKfycb..................../exec`

### Paste the URL into your site
Open `js/api.js` and replace this line:
```js
APPS_SCRIPT_URL: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE",
```
with your real URL. Save the file.

> Whenever you edit the Apps Script code later, you must create a
> **new deployment version** (Deploy → Manage deployments → ✏️ → New
> version) for the changes to go live — just saving isn't enough.

---

## 4. Connect Google Drive for product images

1. Create a Google Drive folder, e.g. `MB Crunchy Product Photos`.
2. Upload a photo for each product.
3. Right-click the photo → **Share → Anyone with the link → Viewer**.
4. Copy the file's share link, which looks like:
   `https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing`
5. Extract the file ID (the part between `/d/` and `/view`) and build the
   direct-image URL:
   ```
   https://drive.google.com/uc?export=view&id=1AbCdEfGhIjKlMnOp
   ```
6. Paste that URL into the `image` column for that product, in the Sheet
   (or via the Admin Panel → Products → Edit).

If an `image` cell is left blank, the site automatically shows a friendly
emoji placeholder for that category instead of a broken image.

---

## 5. Configure WhatsApp, Call button, UPI, and delivery settings

Open `js/api.js` and fill in the top of `MB_CONFIG`:

```js
WHATSAPP_NUMBER: "919876543210",   // country code + number, no + or spaces
CALL_NUMBER: "+919876543210",
UPI_ID: "mbcrunchy@okaxis",        // your real UPI ID, shown on the QR code
DELIVERY_CHARGE: 40,
FREE_DELIVERY_ABOVE: 499,
GOOGLE_MAPS_EMBED_SRC: "https://www.google.com/maps?q=YOUR+SHOP+ADDRESS&output=embed",
```

For the Maps embed link: open Google Maps, search your shop address,
click **Share → Embed a map**, and copy the URL inside `src="..."`.

---

## 6. Host it for free (GitHub Pages)

1. Create a free GitHub account if you don't have one: [github.com](https://github.com).
2. Create a **new public repository**, e.g. `mb-crunchy-store`.
3. Upload every file and folder from this project (drag-and-drop works, or
   use "Add file → Upload files").
4. Go to the repo's **Settings → Pages**.
5. Under "Build and deployment" → **Source**, choose `Deploy from a branch`,
   branch `main`, folder `/ (root)`. Click **Save**.
6. Wait 1–2 minutes. Your site will be live at:
   `https://your-username.github.io/mb-crunchy-store/`

That's it — completely free hosting, HTTPS included (required for the PWA
"install app" feature and camera/QR features to work).

### Alternative: Google Sites
If you prefer not to use GitHub, you can also host static files via
Google Sites' "Embed" feature, though GitHub Pages gives cleaner control
over custom HTML/CSS/JS and is recommended.

---

## 7. Test everything end-to-end

1. Open your live GitHub Pages URL.
2. Add a few products to the cart, apply coupon `WELCOME10`.
3. Go to checkout, fill the form, choose **Cash on Delivery**, place the order.
4. Check your Google Sheet's **Orders** tab — the order should appear
   within a few seconds.
5. Check the **Customers** tab — the customer should be added/updated.
6. Open `admin.html` (e.g. `https://your-username.github.io/mb-crunchy-store/admin.html`),
   log in with the username/password you set in the Admin tab, and confirm
   you can see the order and update its status.
7. Try the floating WhatsApp button and the "Order on WhatsApp" button in
   the cart — both should open WhatsApp with a pre-filled message.

---

## 8. How to update products (no code changes needed)

- **Change a price or mark something out of stock**: edit it directly in
  the **Products** tab of the Sheet, or in **Admin Panel → Products**
  (price and stock are editable inline).
- **Add a brand-new product**: use **Admin Panel → Products → + Add
  Product**, or add a new row directly to the Products sheet with a unique
  `id`.
- Changes typically reflect on the storefront within a few seconds to a
  minute, since the site fetches the product list fresh on every page load.

## 9. How to add/manage coupons

Edit the **Coupons** tab: `code | type | value | active`
- `type` is either `flat` (fixed ₹ off) or `percent` (% off)
- `active` should be `TRUE` or `FALSE`

## 10. Backup

Google Sheets auto-saves and keeps version history
(**File → Version history → See version history**), but for extra safety:
- Monthly: **File → Download → Microsoft Excel (.xlsx)** and save a local copy.
- Your GitHub repository is itself a full backup/version history of your
  website code — every change is tracked automatically.

## 11. Migration (e.g., moving to a paid platform later)

- **Products**: export the Products sheet as CSV (`File → Download → CSV`)
  — most platforms (Shopify, WooCommerce, etc.) can import product CSVs.
- **Orders/Customers**: same — export as CSV for your records or for
  import into a CRM.
- **Website code**: it's plain HTML/CSS/JS with no vendor lock-in, so it
  can be hosted anywhere (any static host, or wrapped into a mobile app).

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Products don't update from the Sheet | `APPS_SCRIPT_URL` not set in `js/api.js`, or you edited `Code.gs` but didn't create a **new deployment version** |
| Orders don't appear in the Sheet | Same as above — check the browser console (F12) for errors, and confirm the Web app's "Who has access" is set to **Anyone** |
| Admin login fails | Confirm there's a row in the **Admin** tab matching the username/password exactly, and that you're using the freshly deployed Web App URL |
| Images don't show | Make sure the Drive file is shared as "Anyone with the link" and you used the `uc?export=view&id=...` URL format, not the raw sharing link |
| Site works locally but not on GitHub Pages | Check that `index.html` is in the repository **root**, not inside a subfolder, unless your Pages settings point to that subfolder |

---

## What's included vs. what to treat as a first pass

Fully working: storefront UI, cart, coupons, delivery-fee logic, checkout,
WhatsApp order handoff, UPI QR generation, Sheet-backed products/orders/
customers/coupons, admin login, order status + CSV export, inline product
editing, dark mode, search/filter, wishlist, PWA install + offline app
shell caching.

Worth strengthening before a big launch: swap the simple Admin-tab password
check for something sturdier if more than one person will manage orders;
add real product photography; and load-test the Apps Script quota (free
tier allows generous but not unlimited requests/day) if you expect very
high order volume.
