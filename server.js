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

// Server-authoritative menu (same file the browser uses — dual-exported).
// Any price the client sends is ignored; we look up price from here.
const MM_CONFIG = require('./js/config.js');
const MENU      = MM_CONFIG.inventory;

const app  = express();
const PORT = process.env.PORT || 3000;
const SITE = process.env.SITE_URL || 'https://monismunchies.com';

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({ origin: [SITE, 'http://localhost'] }));

/* ================================================================
   POST /api/stripe-webhook
   Stripe calls this after a checkout completes. We verify the
   signature, then email an order notification via Resend.

   IMPORTANT: this route MUST be mounted BEFORE express.json(),
   because Stripe signature verification needs the raw request body.
   ================================================================ */
app.post(
  '/api/stripe-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig           = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[webhook] STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).send('Webhook not configured');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('[webhook] Signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // We only care about completed checkouts right now
    if (event.type === 'checkout.session.completed') {
      try {
        await sendOrderEmail(event.data.object);
      } catch (err) {
        // Never let an email failure block Stripe — just log it loudly
        console.error('[webhook] sendOrderEmail failed:', err);
      }
    }

    res.json({ received: true });
  }
);

// JSON parser for every OTHER route (webhook needed raw body above)
app.use(express.json());

// ── Deposit calculation (mirrors config.js tiers) ─────────────────
function calcDeposit(cartTotal) {
  if (cartTotal <= 0)  return 0;
  if (cartTotal < 20)  return 5;
  if (cartTotal <= 50) return 10;
  return Math.round(cartTotal * 0.5 * 100) / 100; // 50%, rounded to cents
}

/* ================================================================
   validateCart(clientCart)
   ----------------------------------------------------------------
   Takes the cart the client sent and REBUILDS it from the server's
   own menu — client prices are ignored entirely. This is what stops
   a customer from editing the browser JS to check out for $0.01.

   Returns { ok: true, cart, cartTotal } on success,
           { ok: false, error: '...' } on any validation failure.
   Rules:
     - Each item must have a `key` that exists in MENU
     - Item must not be soldOut
     - qty must be a positive integer between 1 and 50
     - If maxQty is set, a single order can't exceed it
     - Price + label + unit come from MENU, never from the client
   ================================================================ */
function validateCart(clientCart) {
  if (!Array.isArray(clientCart) || clientCart.length === 0) {
    return { ok: false, error: 'Cart is empty' };
  }

  // Cap total distinct line items — stops giant cart DoS
  if (clientCart.length > 50) {
    return { ok: false, error: 'Too many items in cart' };
  }

  const trustedCart = [];
  let   cartTotal   = 0;

  for (const raw of clientCart) {
    const key = typeof raw?.key === 'string' ? raw.key : null;
    const qty = Number.isFinite(+raw?.qty) ? Math.floor(+raw.qty) : 0;

    if (!key || !MENU[key]) {
      return { ok: false, error: `Unknown product: ${key || 'missing key'}` };
    }
    if (qty < 1 || qty > 50) {
      return { ok: false, error: `Invalid quantity for ${key}` };
    }

    const item = MENU[key];
    if (item.soldOut) {
      return { ok: false, error: `${item.label} is sold out` };
    }
    if (item.maxQty && qty > item.maxQty) {
      return {
        ok: false,
        error: `${item.label} — only ${item.maxQty} ${item.unit} available`,
      };
    }

    const price = Number(item.price);
    const line  = Math.round(qty * price * 100) / 100;

    trustedCart.push({
      key,
      label: item.label,
      unit:  item.unit,
      qty,
      price,       // server price, never client price
      line,
    });

    cartTotal += line;
  }

  cartTotal = Math.round(cartTotal * 100) / 100;
  return { ok: true, cart: trustedCart, cartTotal };
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

    let lineItems    = [];
    let depositCents = 0;
    let description  = '';
    let trustedCart  = null;   // populated below for menu orders only

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
      // Menu orders: validate cart server-side, ignore client prices
      const check = validateCart(cart);
      if (!check.ok) {
        return res.status(400).json({ error: check.error });
      }
      // Trusted cart from server — these numbers are authoritative
      trustedCart      = check.cart;
      const cartTotal  = check.cartTotal;
      const deposit    = calcDeposit(cartTotal);
      depositCents     = Math.round(deposit * 100);

      const itemList = trustedCart.map(c => `${c.label} × ${c.qty} ${c.unit}`).join(', ');
      description    = `Order Deposit · ${itemList}`;

      lineItems = [{
        price_data: {
          currency:     'usd',
          product_data: {
            name:        "Order Deposit — Moni's Munchies",
            description: `Items: ${itemList} · Cart Total: $${cartTotal.toFixed(2)} · Deposit: $${deposit.toFixed(2)}`.substring(0, 200),
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
      // Use trustedCart (server-authoritative) — NOT the client's original cart
      metadata.cart_summary   = trustedCart.map(c => `${c.qty}×${c.label}`).join(', ').substring(0, 400);
      metadata.cart_total     = String(trustedCart.reduce((s, c) => s + c.line, 0).toFixed(2));
      metadata.deposit_amount = String((depositCents / 100).toFixed(2));
      metadata.special_notes  = (orderData?.['special-requests'] || '').substring(0, 400);
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
   POST /api/submit-order
   Used for CashApp / Venmo deposit orders (no Stripe involved).
   Body: {
     orderType: 'menu' | 'custom',
     cart: [...],          // menu orders only
     customerEmail: string,
     orderData: {},
     paymentMethod: 'cashapp' | 'venmo',
   }
   Returns: { success: true, depositAmount: number }
   ================================================================ */
app.post('/api/submit-order', async (req, res) => {
  try {
    const { orderType, cart, customerEmail, orderData, paymentMethod } = req.body;

    if (!['cashapp', 'venmo', 'cash'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method for this endpoint.' });
    }
    if (!orderType) {
      return res.status(400).json({ error: 'orderType is required.' });
    }

    let depositAmount = 0;
    let trustedCart   = null;
    let cartTotal     = 0;

    if (orderType === 'menu') {
      const check = validateCart(cart);
      if (!check.ok) return res.status(400).json({ error: check.error });
      trustedCart   = check.cart;
      cartTotal     = check.cartTotal;
      depositAmount = calcDeposit(cartTotal);
    } else {
      // Custom orders — flat $10 deposit
      depositAmount = 10;
    }

    // Notify Monica of the pending order
    try {
      await sendAltPayOrderEmail({
        orderType, trustedCart, cartTotal, customerEmail,
        orderData, paymentMethod, depositAmount,
      });
    } catch (err) {
      console.error('[submit-order] email error (non-fatal):', err.message);
    }

    res.json({ success: true, depositAmount });

  } catch (err) {
    console.error('[submit-order] error:', err.message);
    res.status(500).json({ error: 'Could not process order. Please try again.' });
  }
});


/* ================================================================
   sendAltPayOrderEmail
   Notifies Monica of a pending CashApp / Venmo deposit order.
   ================================================================ */
async function sendAltPayOrderEmail({ orderType, trustedCart, cartTotal, customerEmail, orderData, paymentMethod, depositAmount }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to     = process.env.ORDER_NOTIFY_EMAIL || 'orders@monismunchies.com';
  const from   = process.env.ORDER_FROM_EMAIL   || `Moni's Munchies Orders <orders@monismunchies.com>`;

  if (!apiKey) {
    console.log(`[submit-order] Resend not configured. Pending ${paymentMethod} order from ${customerEmail} for $${depositAmount}`);
    return;
  }

  const m      = orderData || {};
  const method = paymentMethod === 'cashapp' ? 'CashApp' : paymentMethod === 'venmo' ? 'Venmo' : 'Cash at Pickup';
  const subject = paymentMethod === 'cash'
    ? `💵 CASH ORDER — ${m['customer-name'] || customerEmail} ($${depositAmount.toFixed(2)} total)`
    : `⏳ PENDING ${method} DEPOSIT — ${m['customer-name'] || customerEmail} ($${depositAmount.toFixed(2)})`;

  let itemsHtml = '';
  if (orderType === 'menu' && trustedCart) {
    itemsHtml = trustedCart.map(c => `${c.qty} × ${c.label} ($${c.line.toFixed(2)})`).join('<br>');
  } else {
    itemsHtml = `Custom order — ${m['custom-type'] || 'TBD'}`;
  }

  const html = `
    <h2>⏳ Pending ${method} Deposit Order</h2>
    <p style="color:#e87c22;"><strong>NOT confirmed yet.</strong> Customer must send the $${depositAmount.toFixed(2)} deposit to your ${method} within 24 hours.</p>
    <hr>
    <p><strong>Deposit owed:</strong> $${depositAmount.toFixed(2)} via <strong>${method}</strong><br>
       <strong>Cart total:</strong> $${(cartTotal || 0).toFixed(2)}<br>
       <strong>Balance due at pickup:</strong> $${Math.max(0, (cartTotal || 0) - depositAmount).toFixed(2)}</p>
    <hr>
    <p><strong>Customer:</strong> ${m['customer-name'] || ''}<br>
       <strong>Email:</strong> ${customerEmail || ''}<br>
       <strong>Phone:</strong> ${m['customer-phone'] || ''}<br>
       <strong>Pickup date:</strong> ${m['pickup-date'] || m['custom-date'] || ''}</p>
    <hr>
    <p><strong>Items:</strong><br>${itemsHtml}</p>
    <p><strong>Special notes:</strong><br>${String(m['special-requests'] || '').replace(/\n/g, '<br>')}</p>
    <hr>
    <p style="color:#888;font-size:12px;">Payment method: ${method} (deposit not yet received — cancel if not paid within 24 hrs)</p>
  `;

  const r = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ from, to: [to], subject, html, reply_to: customerEmail || undefined }),
  });

  if (!r.ok) {
    const errText = await r.text();
    console.error('[submit-order] Resend send failed:', r.status, errText);
  }
}


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


/* ================================================================
   sendOrderEmail — formats the Stripe session metadata into a
   human-readable order summary and sends it via Resend.
   ================================================================ */
async function sendOrderEmail(session) {
  const apiKey = process.env.RESEND_API_KEY;
  const to     = process.env.ORDER_NOTIFY_EMAIL || 'orders@monismunchies.com';
  const from   = process.env.ORDER_FROM_EMAIL   || `Moni's Munchies Orders <orders@monismunchies.com>`;

  if (!apiKey) {
    console.error('[webhook] RESEND_API_KEY missing — cannot send order email');
    console.log('[webhook] Would have emailed. Metadata:', session.metadata);
    return;
  }

  const m         = session.metadata || {};
  const orderType = m.order_type || 'unknown';
  const depositPaid = ((session.amount_total || 0) / 100).toFixed(2);

  const subject = orderType === 'custom'
    ? `NEW CUSTOM ORDER — ${m.customer_name || 'Customer'} ($${depositPaid} deposit)`
    : `NEW ORDER — ${m.customer_name || 'Customer'} ($${depositPaid} deposit)`;

  const html = buildOrderEmailHtml(session, m);

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to:       [to],
      subject,
      html,
      reply_to: m.customer_email || undefined,
    }),
  });

  if (!r.ok) {
    const errText = await r.text();
    console.error('[webhook] Resend send failed:', r.status, errText);
  } else {
    console.log(`[webhook] Order email sent to ${to} for session ${session.id}`);
  }
}


/* ================================================================
   buildOrderEmailHtml — returns the email body for an order.
   Plain HTML, no external assets, safe for any mail client.
   ================================================================ */
function buildOrderEmailHtml(session, m) {
  const depositPaid = ((session.amount_total || 0) / 100).toFixed(2);
  const orderType   = m.order_type || 'unknown';

  if (orderType === 'custom') {
    return `
      <h2>New Custom Order</h2>
      <p><strong>Deposit paid:</strong> $${depositPaid}</p>
      <hr>
      <p><strong>Customer:</strong> ${m.customer_name || ''}<br>
         <strong>Email:</strong> ${m.customer_email || ''}<br>
         <strong>Phone:</strong> ${m.customer_phone || ''}<br>
         <strong>Pickup date:</strong> ${m.custom_date || m.pickup_date || ''}</p>
      <hr>
      <p><strong>Type:</strong> ${m.custom_type || ''}<br>
         <strong>Occasion:</strong> ${m.custom_occasion || ''}<br>
         <strong>Qty:</strong> ${m.custom_qty || ''}<br>
         <strong>Budget:</strong> ${m.custom_budget || ''}</p>
      <p><strong>Details:</strong><br>${String(m.custom_description || '').replace(/\n/g, '<br>')}</p>
      <hr>
      <p><em>Balance due at pickup.</em></p>
      <p style="color:#888;font-size:12px;">Stripe session: ${session.id}</p>
    `;
  }

  const cartTotalNum  = parseFloat(m.cart_total || 0);
  const depositNum    = parseFloat(depositPaid);
  const balanceDue    = Math.max(0, cartTotalNum - depositNum).toFixed(2);

  return `
    <h2>New Order</h2>
    <p><strong>Deposit paid:</strong> $${depositPaid}<br>
       <strong>Cart total:</strong> $${cartTotalNum.toFixed(2)}<br>
       <strong>Balance due at pickup:</strong> $${balanceDue}</p>
    <hr>
    <p><strong>Customer:</strong> ${m.customer_name || ''}<br>
       <strong>Email:</strong> ${m.customer_email || ''}<br>
       <strong>Phone:</strong> ${m.customer_phone || ''}<br>
       <strong>Pickup date:</strong> ${m.pickup_date || ''}</p>
    <hr>
    <p><strong>Items:</strong><br>${String(m.cart_summary || '').replace(/,\s*/g, '<br>')}</p>
    <p><strong>Special notes:</strong><br>${String(m.special_notes || '').replace(/\n/g, '<br>')}</p>
    <hr>
    <p style="color:#888;font-size:12px;">Stripe session: ${session.id}</p>
  `;
}


app.listen(PORT, () => {
  console.log(`Moni's Munchies API running on port ${PORT}`);
});
