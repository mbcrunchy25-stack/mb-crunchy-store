/*
  MB Crunchy — Product Catalog (fallback / seed data)
  ----------------------------------------------------
  This file is the OFFLINE FALLBACK for the storefront. On every page load the
  site tries to fetch the live catalog from your Google Apps Script Web App
  (which reads the "Products" tab of your Google Sheet). If that fetch fails
  (no internet, script not deployed yet, first-time setup) it falls back to
  this local list so the site never shows a blank page.

  IMPORTANT: Once your Google Sheet is connected, THIS FILE IS NO LONGER YOUR
  SOURCE OF TRUTH — the Sheet is. Edit prices/stock/images in the Sheet (or
  through the Admin Panel) and the site updates automatically. Only edit this
  file if you want to change the offline fallback / initial seed data.

  Schema (must match the "Products" sheet column order exactly):
  id | category | name | price | unit | image | stock | bestseller | description
*/

const MB_PRODUCTS = [
  // ---------------- FROZEN FOODS ----------------
  { id: "FZ01", category: "frozen", name: "Veg Cheese Pizza", price: 189, unit: "1 pc (7 inch)", image: "https://drive.google.com/uc?export=view&id=REPLACE_WITH_FILE_ID", stock: "in", bestseller: true, description: "Loaded with mozzarella and garden veggies, ready to bake in minutes." },
  { id: "FZ02", category: "frozen", name: "Veg Burger Patty", price: 99, unit: "Pack of 4", image: "", stock: "in", bestseller: false, description: "Crispy vegetable patties, just shallow fry and assemble." },
  { id: "FZ03", category: "frozen", name: "Chicken Burger Patty", price: 149, unit: "Pack of 4", image: "", stock: "in", bestseller: true, description: "Juicy chicken patties made with tender boneless chicken." },
  { id: "FZ04", category: "frozen", name: "Veg Momos", price: 129, unit: "Pack of 10", image: "", stock: "in", bestseller: false, description: "Steamed dumplings packed with fresh cabbage and carrot." },
  { id: "FZ05", category: "frozen", name: "Paneer Momos", price: 159, unit: "Pack of 10", image: "", stock: "in", bestseller: false, description: "Soft paneer filling wrapped in delicate momo dough." },
  { id: "FZ06", category: "frozen", name: "Chicken Momos", price: 169, unit: "Pack of 10", image: "", stock: "in", bestseller: true, description: "Classic minced chicken momos, steam and serve with chutney." },
  { id: "FZ07", category: "frozen", name: "French Fries", price: 99, unit: "400g", image: "", stock: "in", bestseller: false, description: "Golden, crispy straight-cut fries." },
  { id: "FZ08", category: "frozen", name: "Peri Peri Fries", price: 119, unit: "400g", image: "", stock: "in", bestseller: true, description: "Fries pre-seasoned with a tangy peri peri coating." },
  { id: "FZ09", category: "frozen", name: "Veg Spring Roll", price: 139, unit: "Pack of 10", image: "", stock: "in", bestseller: false, description: "Crunchy rolls stuffed with a stir-fried veggie mix." },
  { id: "FZ10", category: "frozen", name: "Chicken Spring Roll", price: 169, unit: "Pack of 10", image: "", stock: "in", bestseller: false, description: "Shredded chicken and glass noodles in a crisp wrapper." },
  { id: "FZ11", category: "frozen", name: "Chicken Nuggets", price: 159, unit: "400g", image: "", stock: "in", bestseller: true, description: "Everyone's favourite — golden crumb-coated chicken nuggets." },
  { id: "FZ12", category: "frozen", name: "Chicken Wings", price: 219, unit: "500g", image: "", stock: "in", bestseller: false, description: "Marinated wings, ready to fry or air-fry." },
  { id: "FZ13", category: "frozen", name: "Chicken Cheese Garlic Fingers", price: 199, unit: "400g", image: "", stock: "in", bestseller: false, description: "Cheesy garlic-butter chicken fingers." },
  { id: "FZ14", category: "frozen", name: "Corn & Cheese Nuggets", price: 149, unit: "400g", image: "", stock: "in", bestseller: false, description: "Sweet corn and melty cheese in every bite." },
  { id: "FZ15", category: "frozen", name: "Potato Cheese Shots", price: 139, unit: "400g", image: "", stock: "in", bestseller: false, description: "Bite-sized mashed potato and cheese poppers." },
  { id: "FZ16", category: "frozen", name: "Veggie Finger", price: 129, unit: "400g", image: "", stock: "in", bestseller: false, description: "Mixed vegetable fingers with a crispy shell." },
  { id: "FZ17", category: "frozen", name: "Hara Bhara Kebab", price: 139, unit: "Pack of 8", image: "", stock: "in", bestseller: false, description: "Spinach and green-pea kebabs, shallow fry ready." },
  { id: "FZ18", category: "frozen", name: "Cheese Loaded Fries", price: 169, unit: "400g", image: "", stock: "in", bestseller: false, description: "Fries pre-topped with a rich cheese blend." },
  { id: "FZ19", category: "frozen", name: "Creamy White Sauce Pasta", price: 179, unit: "Ready-to-heat, 350g", image: "", stock: "in", bestseller: false, description: "Restaurant-style creamy pasta, heat and serve." },
  { id: "FZ20", category: "frozen", name: "Spicy Red Chilli Pasta", price: 179, unit: "Ready-to-heat, 350g", image: "", stock: "in", bestseller: false, description: "Bold red-chilli arrabbiata style pasta." },
  { id: "FZ21", category: "frozen", name: "Cheese Masala Maggi", price: 89, unit: "Ready-to-heat, 250g", image: "", stock: "in", bestseller: true, description: "Everyday comfort — cheesy masala Maggi." },
  { id: "FZ22", category: "frozen", name: "Egg Masala Maggi", price: 99, unit: "Ready-to-heat, 250g", image: "", stock: "in", bestseller: false, description: "Maggi tossed with masala and boiled egg." },

  // ---------------- ANDHRA APPADALU / TRADITIONAL SNACKS ----------------
  { id: "TS01", category: "appadalu", name: "Sanna Rava Appadalu (Raw Mango)", price: 149, unit: "500g", image: "", stock: "in", bestseller: true, description: "Fine rava appadam infused with tangy raw mango." },
  { id: "TS02", category: "appadalu", name: "Sanna Rava Appadalu (Avakaya)", price: 149, unit: "500g", image: "", stock: "in", bestseller: false, description: "Fine rava appadam with authentic avakaya spice." },
  { id: "TS03", category: "appadalu", name: "Four Colour Appadalu", price: 159, unit: "500g", image: "", stock: "in", bestseller: true, description: "A colourful assortment of four traditional appadam flavours." },
  { id: "TS04", category: "appadalu", name: "Sabbadhan Appadalu", price: 139, unit: "500g", image: "", stock: "in", bestseller: false, description: "Sago-based crispy appadam, sun-dried the traditional way." },
  { id: "TS05", category: "appadalu", name: "Majjiga Mirapakayalu", price: 129, unit: "250g", image: "", stock: "in", bestseller: false, description: "Buttermilk-soaked sun-dried green chillies." },
  { id: "TS06", category: "appadalu", name: "Aallu Chips (Potato Vadiyalu)", price: 129, unit: "250g", image: "", stock: "in", bestseller: false, description: "Sun-dried potato chip vadiyalu, deep-fry ready." },
  { id: "TS07", category: "appadalu", name: "Gulabi Puvvulu", price: 149, unit: "250g", image: "", stock: "in", bestseller: false, description: "Rose-shaped crispy rice snack, a festive favourite." },
  { id: "TS08", category: "appadalu", name: "Pessara Pappu Vadiyalu", price: 139, unit: "250g", image: "", stock: "in", bestseller: false, description: "Moong dal vadiyalu, sun-dried and ready to fry." },
  { id: "TS09", category: "appadalu", name: "Pebbara Vadiyalu", price: 139, unit: "250g", image: "", stock: "in", bestseller: false, description: "Traditional urad-dal based vadiyalu." },
  { id: "TS10", category: "appadalu", name: "Janthikalu", price: 129, unit: "250g", image: "", stock: "in", bestseller: true, description: "Crispy spiral rice-flour murukku, an Andhra classic." },

  // ---------------- HOMEMADE PICKLES ----------------
  { id: "PK01", category: "pickles", name: "Mango Pickle (Avakaya)", price: 219, unit: "500g", image: "", stock: "in", bestseller: true, description: "Homestyle mango pickle in cold-pressed oil, no preservatives." },
  { id: "PK02", category: "pickles", name: "Tomato Pickle", price: 179, unit: "500g", image: "", stock: "in", bestseller: false, description: "Tangy tomato pickle simmered with traditional spices." },
  { id: "PK03", category: "pickles", name: "Lemon Pickle", price: 169, unit: "500g", image: "", stock: "in", bestseller: false, description: "Classic sun-cured lemon pickle." },
  { id: "PK04", category: "pickles", name: "Amla Pickle", price: 189, unit: "500g", image: "", stock: "in", bestseller: false, description: "Vitamin-C rich gooseberry pickle, tangy and spiced." },
  { id: "PK05", category: "pickles", name: "Ginger Tamarind Pickle", price: 189, unit: "500g", image: "", stock: "in", bestseller: false, description: "Sweet-sour-spicy ginger tamarind pickle." },

  // ---------------- COLD PRESSED OILS ----------------
  { id: "OIL01", category: "oils", name: "Groundnut Oil", price: 145, unit: "500ml", image: "", stock: "in", bestseller: true, description: "Wood cold-pressed groundnut oil, no chemical extraction." },
  { id: "OIL02", category: "oils", name: "Groundnut Oil", price: 269, unit: "1L", image: "", stock: "in", bestseller: false, description: "Wood cold-pressed groundnut oil, no chemical extraction." },
  { id: "OIL03", category: "oils", name: "Sunflower Oil", price: 139, unit: "500ml", image: "", stock: "in", bestseller: false, description: "Cold-pressed sunflower oil, light and pure." },
  { id: "OIL04", category: "oils", name: "Sunflower Oil", price: 259, unit: "1L", image: "", stock: "in", bestseller: false, description: "Cold-pressed sunflower oil, light and pure." },
  { id: "OIL05", category: "oils", name: "Mustard Oil", price: 149, unit: "500ml", image: "", stock: "in", bestseller: false, description: "Cold-pressed mustard oil with a strong authentic pungency." },
  { id: "OIL06", category: "oils", name: "Mustard Oil", price: 279, unit: "1L", image: "", stock: "in", bestseller: false, description: "Cold-pressed mustard oil with a strong authentic pungency." },
  { id: "OIL07", category: "oils", name: "Sesame (Til) Oil", price: 189, unit: "500ml", image: "", stock: "in", bestseller: true, description: "Cold-pressed sesame oil, ideal for cooking and tempering." },
  { id: "OIL08", category: "oils", name: "Sesame (Til) Oil", price: 349, unit: "1L", image: "", stock: "in", bestseller: false, description: "Cold-pressed sesame oil, ideal for cooking and tempering." },
  { id: "OIL09", category: "oils", name: "Coconut Oil", price: 159, unit: "500ml", image: "", stock: "in", bestseller: false, description: "Cold-pressed virgin coconut oil." },
  { id: "OIL10", category: "oils", name: "Coconut Oil", price: 299, unit: "1L", image: "", stock: "out", bestseller: false, description: "Cold-pressed virgin coconut oil." },

  // ---------------- NATURAL HONEY (seed placeholders — edit in Sheet) ----------------
  { id: "HN01", category: "honey", name: "Raw Forest Honey", price: 249, unit: "500g", image: "", stock: "in", bestseller: true, description: "Unprocessed, unheated raw honey sourced from forest apiaries." },
  { id: "HN02", category: "honey", name: "Raw Forest Honey", price: 449, unit: "1kg", image: "", stock: "in", bestseller: false, description: "Unprocessed, unheated raw honey sourced from forest apiaries." },

  // ---------------- ORGANIC BELLAM / JAGGERY (seed placeholders — edit in Sheet) ----------------
  { id: "BL01", category: "jaggery", name: "Organic Bellam (Jaggery) Block", price: 99, unit: "500g", image: "", stock: "in", bestseller: false, description: "Chemical-free organic jaggery, made from sun-ripened sugarcane." },
  { id: "BL02", category: "jaggery", name: "Organic Bellam Powder", price: 109, unit: "500g", image: "", stock: "in", bestseller: false, description: "Fine organic jaggery powder, easy to use in cooking and drinks." },
];

// Category metadata used to render the homepage category cards.
const MB_CATEGORIES = [
  { id: "frozen",   name: "Frozen Foods",      emoji: "🍕" },
  { id: "appadalu", name: "Andhra Appadalu",   emoji: "🫓" },
  { id: "pickles",  name: "Homemade Pickles",  emoji: "🥒" },
  { id: "oils",     name: "Cold Pressed Oils", emoji: "🛢" },
  { id: "honey",    name: "Natural Honey",     emoji: "🍯" },
  { id: "jaggery",  name: "Organic Bellam",    emoji: "🌴" },
];
