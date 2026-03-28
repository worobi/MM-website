/* ================================================================
   MONI'S MUNCHIES — server.js
   Stripe Checkout API backend
   ================================================================
   Runs on the VPS as a Node.js process (managed by PM2).
   Nginx proxies /api/* requests here (port 3000).

   SETUP ON VPS:
     cd /var/www/monismunchies
     npm install
     cp .env.example .env
     nano .env            ← paste your Stripe secret key
     pm2 start server.js --name monismunchies
     pm2 save
     pm2 startup          ← follow the printed command to auto-start on reboot

   AFTER UPDATING server.js:
     pm2 restart monismunchies
   ================================================================ */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app  = express();
const PORT = process.env.PORT || 3000;
const SITE = process.env.SITE_URL || 'https://monismunchies.com';

// ── Middleware ────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({ origin: [SITE, 'http://localhost'] }));

// ── Deposit calculation (mirrors config.js tiers) ─────────────────
function calcDeposit(cartTotal) {
  if (cartTotal <= 0)  return 0;
  if (cartTotal < 20)  return 5;
  if (cartTotal <= 50) return 10;
  return Math.round(cartTotal * 0.5 * 100) / 100; // 50%, rounded to cents
}


/* ================================================================
   POST /api/create-checkout-session
   Body: {
     orderType: 'menu' | 'custom',
     cart: [{ key, label, qty, unit, price, line }],  // menu only
     customerEmail: string,
     orderData: {}   // full form data for metadata
   }
   Returns: { url: string }  ← Stripe hosted checkout URL
   ================================================================ */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { orderType, cart, customerEmail, orderData } = req.body;

    if (!orderType) {
      return res.status(400).json({ error: 'orderType is required' });
    }

    let lineItems = [];
    let depositCents = 0;
    let description  = '';

    if (orderType === 'custom') {
      // Custom orders: flat $10 deposit
      depositCents = 1000;
      description  = `Custom Order — ${orderData?.['custom-type'] || 'Custom Baked Goods'} · ${orderData?.['custom-occasion'] || ''} · Qty: ${orderData?.['custom-qty'] || 'TBD'}`;

      lineItems = [{
        price_data: {
          currency:     'usd',
          product_data: {
            name:        "Custom Order Deposit — Moni's Munchies",
            description: description.substring(0, 200),
          },
          unit_amount: depositCents,
        },
        quantity: 1,
      }];

    } else {
      // Menu orders: calculated deposit based on cart total
      if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      const cartTotal = cart.reduce((sum, item) => sum + (item.line || 0), 0);
      const deposit   = calcDeposit(cartTotal);
      depositCents    = Math.round(deposit * 100);

      const itemList = cart.map(c => `${c.label} × ${c.qty} ${c.unit}`).join(', ');
      description    = `Order Deposit · ${itemList}`;

      lineItems = [{
        price_data: {
          currency:     'usd',
          product_data: {
            name:        "Order Deposit — Moni's Munchies",
            description: `Items: ${itemList} · Cart Total: $${cartTotal} · Deposit: $${deposit}`.substring(0, 200),
          },
          unit_amount: depositCents,
        },
        quantity: 1,
      }];
    }

    // Build safe metadata (Stripe limit: 500 chars per value, 50 keys)
    const metadata = {
      order_type:     orderType,
      customer_name:  (orderData?.['customer-name']  || '').substring(0, 100),
      customer_email: (customerEmail || '').substring(0, 100),
      customer_phone: (orderData?.['customer-phone'] || '').substring(0, 30),
      pickup_date:    (orderData?.['pickup-date']    || orderData?.['custom-date'] || '').substring(0, 20),
    };

    if (orderType === 'menu') {
      metadata.cart_summary  = cart.map(c => `${c.qty}×${c.label}`).join(', ').substring(0, 400);
      metadata.cart_total    = String(cart.reduce((s, c) => s + c.line, 0));
      metadata.deposit_amount = String(depositCents / 100);
      metadata.special_notes = (orderData?.['special-requests'] || '').substring(0, 400);
    } else {
      metadata.custom_type       = (orderData?.['custom-type']        || '').substring(0, 100);
      metadata.custom_occasion   = (orderData?.['custom-occasion']    || '').substring(0, 100);
      metadata.custom_qty        = (orderData?.['custom-qty']         || '').substring(0, 50);
      metadata.custom_budget     = (orderData?.['custom-budget']      || '').substring(0, 50);
      metadata.custom_date       = (orderData?.['custom-date']        || '').substring(0, 20);
      metadata.custom_description = (orderData?.['custom-description'] || '').substring(0, 400);
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items:           lineItems,
      mode:                 'payment',
      customer_email:       customerEmail || undefined,
      metadata,
      success_url: `${SITE}/thankyou.html?session_id={CHECKOUT_SESSION_ID}&type=${orderType}`,
      cancel_url:  orderType === 'custom'
        ? `${SITE}/custom-order.html?cancelled=1`
        : `${SITE}/order.html?cancelled=1`,
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: 'Could not create checkout session. Please try again.' });
  }
});


/* ================================================================
   POST /api/subscribe
   Subscribe an email to Mailchimp via server-side API call.
   Body: { email: string, fname: string }
   Returns: { success: bool, message: string }
   ================================================================ */
app.post('/api/subscribe', async (req, res) => {
  const { email, fname } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const apiKey    = process.env.MAILCHIMP_API_KEY;
  const listId    = process.env.MAILCHIMP_LIST_ID;
  const serverDC  = process.env.MAILCHIMP_SERVER; // e.g. "us1"

  if (!apiKey || !listId || !serverDC) {
    // Mailchimp not configured — log it and succeed silently
    console.log(`[subscribe] Mailchimp not configured. Would have subscribed: ${email}`);
    return res.json({ success: true, message: 'Subscribed!' });
  }

  try {
    const mcRes = await fetch(
      `https://${serverDC}.api.mailchimp.com/3.0/lists/${listId}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status:        'subscribed',
          merge_fields:  { FNAME: fname || '' },
          tags:          ['website-signup'],
        }),
      }
    );

    const data = await mcRes.json();

    if (mcRes.ok || data.title === 'Member Exists') {
      res.json({ success: true, message: "You're on the list!" });
    } else {
      console.error('Mailchimp error:', data);
      res.json({ success: false, message: data.detail || 'Could not subscribe. Please try again.' });
    }
  } catch (err) {
    console.error('Mailchimp fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});


// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', site: SITE });
});

app.listen(PORT, () => {
  console.log(`Moni's Munchies API running on port ${PORT}`);
});
