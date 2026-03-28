/* ================================================================
   MONI'S MUNCHIES — config.js
   ================================================================
   This is the CONTROL FILE for the whole site.
   Brandon or Monica — edit this file to:

     ✦ Mark items as sold out
     ✦ Set max quantities per product per weekend
     ✦ Change the order cutoff day/time
     ✦ Change which days customers can pick up

   After editing, save and re-upload this file to the VPS.
   No other files need to change.
   ================================================================ */

const MM_CONFIG = {

  /* ──────────────────────────────────────────────────────────────
     SCHEDULE SETTINGS
     ────────────────────────────────────────────────────────────── */
  schedule: {

    // Day orders close for the upcoming weekend
    // 0=Sunday  1=Monday  2=Tuesday  3=Wednesday  4=Thursday  5=Friday  6=Saturday
    cutoffDay: 3,       // Wednesday

    // Time orders close (24-hour)
    cutoffHour:   23,   // 11 PM
    cutoffMinute: 59,   // :59

    // Which days customers can pick up (0=Sun, 6=Sat)
    // Default: Saturday and Sunday only
    pickupDays: [6, 0],

    // Minimum lead time in days (customer must order at least this far in advance)
    minLeadDays: 3,
  },


  /* ──────────────────────────────────────────────────────────────
     INVENTORY
     ──────────────────────────────────────────────────────────────
     For each product:
       soldOut  — set to true to immediately block ordering
       maxQty   — max quantity (dozens/packs/bags) per weekend.
                  Set to null for unlimited.
                  Example: maxQty: 5  means max 5 dozen this weekend

     HOW TO MARK SOMETHING SOLD OUT:
       Change  soldOut: false  →  soldOut: true
       Save the file and re-upload.

     HOW TO SET A LIMIT (e.g. only 4 dozen Kitchen Sink available):
       Change  maxQty: null  →  maxQty: 4
     ────────────────────────────────────────────────────────────── */
  inventory: {

    /* ── COOKIES ── */
    'chocolate-chip': {
      label:   'Chocolate Chip Cookies',
      price:   12,
      unit:    'dozen',
      maxQty:  null,      // ← null = unlimited
      soldOut: false,     // ← set true to block orders
    },
    'devils-food': {
      label:   "Devil's Food Cookies",
      price:   12,
      unit:    'dozen',
      maxQty:  null,
      soldOut: false,
    },
    'kitchen-sink': {
      label:   'Kitchen Sink Cookies',
      price:   15,
      unit:    'dozen',
      maxQty:  null,
      soldOut: false,
    },

    /* ── BROWNIES ── */
    'fudge-brownie': {
      label:   'Fudge Brownie',
      price:   14,
      unit:    'dozen',
      maxQty:  null,
      soldOut: false,
    },
    'blondie': {
      label:   'Blondie',
      price:   13,
      unit:    'dozen',
      maxQty:  null,
      soldOut: false,
    },
    'marble-brownie': {
      label:   'Marble Brownie',
      price:   14,
      unit:    'dozen',
      maxQty:  null,
      soldOut: false,
    },
    'salted-caramel': {
      label:   'Salted Caramel Brownie',
      price:   16,
      unit:    'dozen',
      maxQty:  null,
      soldOut: false,
    },

    /* ── MUFFINS ── */
    'blueberry-muffin': {
      label:   'Blueberry Muffin',
      price:   10,
      unit:    '6-pack',
      maxQty:  null,
      soldOut: false,
    },
    'choc-chip-muffin': {
      label:   'Chocolate Chip Muffin',
      price:   10,
      unit:    '6-pack',
      maxQty:  null,
      soldOut: false,
    },
    'banana-nut-muffin': {
      label:   'Banana Nut Muffin',
      price:   10,
      unit:    '6-pack',
      maxQty:  null,
      soldOut: false,
    },

    /* ── DRY MIXES ── */
    'sugar-mix': {
      label:   'Sugar Cookie Mix',
      price:   8,
      unit:    'bag',
      maxQty:  null,
      soldOut: false,
    },
    'snickerdoodle-mix': {
      label:   'Snickerdoodle Mix',
      price:   8,
      unit:    'bag',
      maxQty:  null,
      soldOut: false,
    },
    'chocolate-mix': {
      label:   'Chocolate Cookie Mix',
      price:   8,
      unit:    'bag',
      maxQty:  null,
      soldOut: false,
    },
    'dark-cocoa-mix': {
      label:   'Dark Hot Cocoa Mix',
      price:   9,
      unit:    'bag',
      maxQty:  null,
      soldOut: false,
    },
    'milk-cocoa-mix': {
      label:   'Milk Hot Cocoa Mix',
      price:   9,
      unit:    'bag',
      maxQty:  null,
      soldOut: false,
    },
    'mint-cocoa-mix': {
      label:   'Andes Mint Cocoa Mix',
      price:   9,
      unit:    'bag',
      maxQty:  null,
      soldOut: false,
    },

    /* ── KITS ── */
    'sugar-kit': {
      label:   'Sugar Cookie Decorating Kit',
      price:   18,
      unit:    'kit',
      maxQty:  null,
      soldOut: false,
    },
  },


  /* ──────────────────────────────────────────────────────────────
     DEPOSIT RULES (matches what's in main.js — edit both if changing)
     ────────────────────────────────────────────────────────────── */
  deposits: {
    tiers: [
      { upTo: 20,       amount: 5,    label: 'Orders under $20'  },
      { upTo: 50,       amount: 10,   label: 'Orders $20 – $50'  },
      { upTo: Infinity, percent: 0.5, label: 'Orders over $50'   },
    ],
  },


  /* ──────────────────────────────────────────────────────────────
     STRIPE CHECKOUT API
     The site now uses Stripe Checkout (dynamic amounts) via the
     Node.js backend in server.js.
     Set STRIPE_SECRET_KEY in the .env file on the VPS.

     STRIPE_PUBLISHABLE_KEY goes here (safe to expose in frontend):
     Get from: stripe.com → Developers → API Keys → Publishable key
     ────────────────────────────────────────────────────────────── */
  stripe: {
    publishableKey: 'pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY',
    // API endpoint — served by server.js via Nginx proxy
    checkoutEndpoint: '/api/create-checkout-session',
  },


  /* ──────────────────────────────────────────────────────────────
     MAILCHIMP EMAIL LIST
     Used by the newsletter popup and order opt-in.
     The actual subscription call goes through server.js (/api/subscribe)
     so your API key stays private on the server.

     Set MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID, MAILCHIMP_SERVER
     in the .env file on the VPS.

     The values below are just for display/reference — they are
     not secret and are safe to leave as-is until you're ready.
     ────────────────────────────────────────────────────────────── */
  mailchimp: {
    subscribeEndpoint: '/api/subscribe',  // proxied through Nginx to server.js
    listName:          "Moni's Munchies Updates",
  },


  /* ──────────────────────────────────────────────────────────────
     CONTACT / FORMSPREE
     Replace with your Formspree form ID (formspree.io)
     ────────────────────────────────────────────────────────────── */
  formspree: 'REPLACE_WITH_YOUR_FORM_ID',

};
