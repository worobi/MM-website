/* ================================================================
   MONI'S MUNCHIES — main.js
   Shared JavaScript for all pages
   monismunchies.com
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Pull in config (defined in config.js, loaded before this script)
  const CFG = (typeof MM_CONFIG !== 'undefined') ? MM_CONFIG : null;


  /* ==============================================================
     MOBILE NAVIGATION
     ============================================================== */
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.nav-mobile');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', (e) => {
      if (mobileNav.classList.contains('open') &&
          !mobileNav.contains(e.target) &&
          !hamburger.contains(e.target)) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
        document.body.style.overflow = '';
      }
    });
  }


  /* ==============================================================
     ACTIVE NAV LINK
     ============================================================== */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });


  /* ==============================================================
     NAV SCROLL EFFECT
     ============================================================== */
  const siteNav = document.querySelector('.site-nav');
  if (siteNav) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY > 20;
      siteNav.style.background = scrolled ? 'rgba(13,0,34,0.99)' : 'rgba(13,0,34,0.96)';
      siteNav.style.boxShadow  = scrolled
        ? '0 2px 32px rgba(155,0,255,0.45)'
        : '0 2px 28px rgba(155,0,255,0.35)';
    }, { passive: true });
  }


  /* ==============================================================
     FAQ ACCORDION
     ============================================================== */
  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const item   = button.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('open');
      item.classList.toggle('open', !isOpen);
      answer.style.maxHeight = isOpen ? '0' : answer.scrollHeight + 'px';
    });
  });


  /* ==============================================================
     SCROLL FADE-IN ANIMATION
     ============================================================== */
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 60);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    fadeEls.forEach(el => obs.observe(el));
  }


  /* ==============================================================
     HERO STAR PARTICLES
     ============================================================== */
  const starsContainer = document.querySelector('.hero-stars');
  if (starsContainer) {
    const colors = ['#FF2D78','#FFE600','#9B00FF','#00D4FF','#FFFFFF'];
    for (let i = 0; i < 55; i++) {
      const s = document.createElement('div');
      const size  = Math.random() * 3 + 1;
      const color = colors[Math.floor(Math.random() * colors.length)];
      s.style.cssText = `
        position:absolute; width:${size}px; height:${size}px; border-radius:50%;
        background:${color}; left:${Math.random()*100}%; top:${Math.random()*100}%;
        box-shadow:0 0 ${size*3}px ${color};
        animation:star-twinkle ${1.5+Math.random()*2.5}s ${Math.random()*2}s ease-in-out infinite;
        pointer-events:none;
      `;
      starsContainer.appendChild(s);
    }
  }


  /* ==============================================================
     SMOOTH SCROLL
     ============================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = siteNav ? siteNav.offsetHeight : 68;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 16, behavior: 'smooth' });
      }
    });
  });


  /* ==============================================================
     SHOP PAGE — Inventory sold-out states (reads config.js)
     ============================================================== */
  if (CFG && document.querySelector('.product-grid')) {
    document.querySelectorAll('.product-card').forEach(card => {
      const productKey = card.querySelector('.btn-order')?.getAttribute('href')?.match(/product=([^&]+)/)?.[1];
      if (!productKey) return;

      const item = CFG.inventory[productKey];
      if (!item) return;

      if (item.soldOut) {
        card.classList.add('sold-out');

        // Replace badge
        const badge = card.querySelector('.product-badge');
        if (badge) {
          badge.textContent = 'Sold Out';
          badge.className = 'product-badge sold-out-badge';
        } else {
          const newBadge = document.createElement('div');
          newBadge.className = 'product-badge sold-out-badge';
          newBadge.textContent = 'Sold Out';
          card.querySelector('.product-img').appendChild(newBadge);
        }

        // Disable the order button
        const btn = card.querySelector('.btn-order');
        if (btn) {
          btn.textContent = 'Sold Out';
          btn.style.pointerEvents = 'none';
          btn.removeAttribute('href');
        }
      }

      // Show limited-quantity badge if maxQty is set
      if (!item.soldOut && item.maxQty !== null) {
        const badge = card.querySelector('.product-badge');
        const limitBadge = badge || document.createElement('div');
        if (!badge) {
          limitBadge.className = 'product-badge';
          card.querySelector('.product-img').appendChild(limitBadge);
        }
        if (!item.soldOut) {
          limitBadge.textContent = `Limit ${item.maxQty}`;
          limitBadge.className = 'product-badge';
          limitBadge.style.background = 'rgba(255,230,0,0.85)';
          limitBadge.style.color = '#1A0033';
        }
      }
    });
  }


  /* ==============================================================
     CATEGORY FILTER (shop page)
     ============================================================== */
  const catTags      = document.querySelectorAll('.cat-tag');
  const productCards = document.querySelectorAll('.product-card');

  if (catTags.length && productCards.length) {
    catTags.forEach(tag => {
      tag.addEventListener('click', () => {
        catTags.forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        const filter = tag.dataset.filter || 'all';
        productCards.forEach(card => {
          const show = filter === 'all' || card.dataset.category === filter;
          if (show) { card.style.display = ''; setTimeout(() => card.style.opacity = '1', 10); }
          else { card.style.opacity = '0'; setTimeout(() => card.style.display = 'none', 220); }
        });
      });
    });
  }


  /* ==============================================================
     ▌▌▌ ORDER PAGE LOGIC ▐▐▐
     ============================================================== */
  if (!document.getElementById('order-form')) return; // only runs on order.html


  /* ── SCHEDULE HELPERS ── */

  function getCutoffForWeekend(weekendDate) {
    const d = new Date(weekendDate);
    const dow = d.getDay();
    const daysBack = (dow === 6) ? 3 : 4;
    d.setDate(d.getDate() - daysBack);
    const s = CFG ? CFG.schedule : {};
    d.setHours(s.cutoffHour ?? 23, s.cutoffMinute ?? 59, 59, 999);
    return d;
  }

  function isDateDisabled(date) {
    const schedule = CFG?.schedule ?? { pickupDays: [6, 0], minLeadDays: 3 };
    const day = date.getDay();
    if (!schedule.pickupDays.includes(day)) return true;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + (schedule.minLeadDays ?? 3));
    minDate.setHours(0, 0, 0, 0);
    if (date < minDate) return true;
    const cutoff = getCutoffForWeekend(date);
    if (new Date() > cutoff) return true;
    return false;
  }

  function getUpcomingWeekends(count = 4) {
    const results = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 60 && results.length < count; i++) {
      d.setDate(d.getDate() + 1);
      const check = new Date(d);
      if (!isDateDisabled(check)) results.push(new Date(check));
    }
    return results;
  }

  function fmtDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }


  /* ── ORDERS CLOSED BANNER ── */
  function checkAndShowClosedBanner() {
    const banner    = document.getElementById('orders-closed-banner');
    const nextLabel = document.getElementById('next-open-date');
    if (!banner) return;
    const upcoming = getUpcomingWeekends(6);
    const now      = new Date();
    const nextSat  = new Date(now);
    nextSat.setDate(nextSat.getDate() + ((6 - nextSat.getDay() + 7) % 7 || 7));
    nextSat.setHours(0, 0, 0, 0);
    const satCutoff = getCutoffForWeekend(nextSat);
    if (now > satCutoff) {
      banner.classList.add('visible');
      const nextAvail = upcoming[0];
      if (nextLabel && nextAvail) {
        nextLabel.textContent = `Next available weekend: ${fmtDate(nextAvail)}`;
      }
    }
  }
  checkAndShowClosedBanner();


  /* ── UPCOMING PICKUP SCHEDULE WIDGET ── */
  function buildPickupSchedule() {
    const container = document.getElementById('pickup-schedule');
    if (!container) return;
    const weekends = getUpcomingWeekends(5);
    container.innerHTML = '';
    weekends.forEach(date => {
      const cutoff = getCutoffForWeekend(date);
      const isOpen = new Date() <= cutoff;
      const chip = document.createElement('div');
      chip.className = 'pickup-chip';
      chip.innerHTML = `
        <span class="chip-date">${fmtDate(date)}</span>
        <span class="chip-status ${isOpen ? 'open' : 'closed'}">${isOpen ? '✓ Open' : 'Closed'}</span>
        ${isOpen ? `<span style="font-size:0.78rem;color:var(--text-faint);">closes Wed ${cutoff.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>` : ''}
      `;
      container.appendChild(chip);
    });
  }
  buildPickupSchedule();


  /* ── FLATPICKR CALENDAR INIT ── */
  const fpConfig = {
    minDate: (() => { const d = new Date(); d.setDate(d.getDate() + (CFG?.schedule?.minLeadDays ?? 3)); return d; })(),
    dateFormat:    'Y-m-d',
    altInput:      true,
    altFormat:     'l, F j, Y',
    disableMobile: false,
    disable:       [function(date) { return isDateDisabled(date); }],
    onDayCreate(dObj, dStr, fp, dayElem) {
      if (dayElem.dateObj && !isDateDisabled(dayElem.dateObj)) {
        dayElem.classList.add('weekend-available');
      }
    },
    onChange(selectedDates) {
      const summDate = document.getElementById('summary-date');
      if (summDate) summDate.textContent = selectedDates[0] ? fmtDate(selectedDates[0]) : '—';
    }
  };

  if (typeof flatpickr !== 'undefined') {
    // Menu order calendar
    if (document.getElementById('pickup-date')) {
      flatpickr('#pickup-date', fpConfig);
    }
    // Custom order calendar (any date, no weekend restriction)
    if (document.getElementById('custom-date')) {
      flatpickr('#custom-date', {
        minDate: (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d; })(),
        dateFormat: 'Y-m-d',
        altInput:   true,
        altFormat:  'l, F j, Y',
        onChange(selectedDates) {
          const summDate = document.getElementById('summary-date');
          if (summDate) summDate.textContent = selectedDates[0] ? fmtDate(selectedDates[0]) : '—';
        }
      });
    }
  }


  /* ── ORDER TABS ── */
  let activeTab = 'menu';

  document.querySelectorAll('.order-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;

      // Update tab button states
      document.querySelectorAll('.order-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === activeTab);
        t.setAttribute('aria-selected', t.dataset.tab === activeTab);
      });

      // Show/hide panels
      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('hidden', panel.id !== `tab-${activeTab}`);
      });

      // Update hidden order-type field
      const orderTypeHidden = document.getElementById('order-type-hidden');
      if (orderTypeHidden) orderTypeHidden.value = activeTab;

      // Toggle sidebar summary sections
      const summMenu   = document.getElementById('summary-menu-items');
      const summCustom = document.getElementById('summary-custom');
      const totalRow   = document.getElementById('summary-total-row');
      if (summMenu)   summMenu.style.display   = activeTab === 'menu'   ? '' : 'none';
      if (summCustom) summCustom.style.display  = activeTab === 'custom' ? '' : 'none';
      if (totalRow)   totalRow.style.display    = activeTab === 'custom' ? 'none' : '';

      // Refresh deposit display for custom tab
      if (activeTab === 'custom') {
        const depositDisplay = document.getElementById('deposit-amount');
        const depositHidden  = document.getElementById('deposit-hidden');
        if (depositDisplay) depositDisplay.textContent = '$10';
        if (depositHidden)  depositHidden.value        = 10;
        const totalDisplay = document.getElementById('order-total');
        if (totalDisplay)   totalDisplay.textContent   = 'TBD — we\'ll quote you';
      } else {
        calcCartDeposit();
      }
    });
  });


  /* ══════════════════════════════════════════════════════════════
     ▌▌▌  CART SYSTEM  ▐▐▐
     ══════════════════════════════════════════════════════════════ */

  let cart = []; // Array of { key, qty, item }

  /* ── Build product dropdown from config ── */
  const productSelect  = document.getElementById('order-product');
  const qtyInput       = document.getElementById('order-qty');
  const qtyWarning     = document.getElementById('qty-warning');
  const qtyWarningText = document.getElementById('qty-warning-text');
  const qtyUnitNote    = document.getElementById('qty-unit-note');

  const PRODUCT_GROUPS = {
    cookie:  { label: '🍪 Cookies',   keys: ['chocolate-chip','devils-food','kitchen-sink'] },
    brownie: { label: '🍫 Brownies',  keys: ['fudge-brownie','blondie','marble-brownie','salted-caramel'] },
    muffin:  { label: '🧁 Muffins',   keys: ['blueberry-muffin','choc-chip-muffin','banana-nut-muffin'] },
    mix:     { label: '🥄 Dry Mixes', keys: ['sugar-mix','snickerdoodle-mix','chocolate-mix','dark-cocoa-mix','milk-cocoa-mix','mint-cocoa-mix'] },
    kit:     { label: '🎁 Kits',      keys: ['sugar-kit'] },
  };

  if (productSelect && CFG) {
    productSelect.innerHTML = '<option value="">— Choose a product —</option>';
    Object.entries(PRODUCT_GROUPS).forEach(([, group]) => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = group.label;
      group.keys.forEach(key => {
        const item = CFG.inventory[key];
        if (!item) return;
        const opt      = document.createElement('option');
        opt.value      = key;
        const limitNote = item.maxQty !== null ? ` (max ${item.maxQty})` : '';
        const soldNote  = item.soldOut ? ' — SOLD OUT' : '';
        opt.textContent = `${item.label}${soldNote || limitNote} — $${item.price}/${item.unit}`;
        opt.disabled    = item.soldOut;
        if (item.soldOut) opt.style.color = 'rgba(255,255,255,0.3)';
        optgroup.appendChild(opt);
      });
      if (optgroup.children.length) productSelect.appendChild(optgroup);
    });

    // Pre-select from URL param
    const preselect = new URLSearchParams(window.location.search).get('product');
    if (preselect && CFG.inventory[preselect] && !CFG.inventory[preselect].soldOut) {
      productSelect.value = preselect;
      updateQtyHints();
    }
  }

  /* ── Update qty hints when product changes ── */
  function updateQtyHints() {
    if (!productSelect) return;
    const key  = productSelect.value;
    const item = CFG?.inventory?.[key];

    if (!item) {
      if (qtyUnitNote)    qtyUnitNote.textContent = 'Select a product to see unit info.';
      if (qtyWarning)     qtyWarning.classList.remove('visible');
      if (qtyInput)       qtyInput.max = 50;
      return;
    }

    const unitMap = { dozen: 'dozens', '6-pack': '6-packs', bag: 'bags', kit: 'kits' };
    if (qtyUnitNote) qtyUnitNote.textContent = `Ordered in ${unitMap[item.unit] || item.unit}. $${item.price} per ${item.unit}.`;

    if (item.maxQty !== null) {
      if (qtyInput) qtyInput.max = item.maxQty;
      if (qtyWarningText) qtyWarningText.textContent = `Max available this weekend: ${item.maxQty} ${item.unit}`;
      if (qtyWarning) qtyWarning.classList.add('visible');
    } else {
      if (qtyInput)   qtyInput.max = 50;
      if (qtyWarning) qtyWarning.classList.remove('visible');
    }
  }

  if (productSelect) productSelect.addEventListener('change', updateQtyHints);


  /* ── ADD TO CART ── */
  function addToCart() {
    const key = productSelect?.value;
    if (!key) {
      productSelect?.focus();
      productSelect?.style && (productSelect.style.borderColor = '#FF2D78');
      setTimeout(() => { if (productSelect) productSelect.style.borderColor = ''; }, 2000);
      return;
    }

    const item = CFG?.inventory?.[key];
    if (!item || item.soldOut) return;

    const qty = Math.max(1, parseInt(qtyInput?.value) || 1);

    // Cap at maxQty
    const cappedQty = (item.maxQty !== null) ? Math.min(qty, item.maxQty) : qty;

    // Check if already in cart — merge quantities
    const existing = cart.find(c => c.key === key);
    if (existing) {
      const newQty = existing.qty + cappedQty;
      existing.qty = (item.maxQty !== null) ? Math.min(newQty, item.maxQty) : newQty;
    } else {
      cart.push({ key, qty: cappedQty, item });
    }

    renderCart();
    calcCartDeposit();

    // Flash the button
    const btn = document.getElementById('add-to-cart-btn');
    if (btn) {
      btn.textContent = '✓ Added!';
      btn.style.background = 'var(--purple)';
      setTimeout(() => {
        btn.textContent = '+ Add to Cart';
        btn.style.background = '';
      }, 1200);
    }

    // Reset picker
    if (productSelect) productSelect.value = '';
    if (qtyInput)      qtyInput.value = 1;
    if (qtyUnitNote)   qtyUnitNote.textContent = 'Select a product to see unit info.';
    if (qtyWarning)    qtyWarning.classList.remove('visible');
  }

  // Expose removeCartItem globally for inline onclick
  window.removeCartItem = function(key) {
    cart = cart.filter(c => c.key !== key);
    renderCart();
    calcCartDeposit();
  };

  window.updateCartQty = function(key, delta) {
    const entry = cart.find(c => c.key === key);
    if (!entry) return;
    const newQty = entry.qty + delta;
    if (newQty <= 0) {
      window.removeCartItem(key);
      return;
    }
    const maxQ = entry.item.maxQty;
    entry.qty = (maxQ !== null) ? Math.min(newQty, maxQ) : newQty;
    renderCart();
    calcCartDeposit();
  };

  const addBtn = document.getElementById('add-to-cart-btn');
  if (addBtn) addBtn.addEventListener('click', addToCart);


  /* ── RENDER CART ── */
  function renderCart() {
    const cartItemsEl = document.getElementById('cart-items');
    const cartEmptyEl = document.getElementById('cart-empty');
    const subtotalSec = document.getElementById('cart-subtotal-section');
    const summLines   = document.getElementById('summary-cart-lines');
    const summEmpty   = document.getElementById('summary-empty');

    if (!cartItemsEl) return;

    if (cart.length === 0) {
      cartItemsEl.innerHTML = '';
      if (cartEmptyEl)  cartEmptyEl.style.display  = '';
      if (subtotalSec)  subtotalSec.style.display   = 'none';
      if (summLines)    summLines.innerHTML          = '';
      if (summEmpty)    summEmpty.style.display      = '';
      return;
    }

    if (cartEmptyEl) cartEmptyEl.style.display = 'none';
    if (summEmpty)   summEmpty.style.display   = 'none';
    if (subtotalSec) subtotalSec.style.display = '';

    // Render cart rows
    cartItemsEl.innerHTML = cart.map(c => `
      <div class="cart-item" data-key="${c.key}">
        <div class="cart-item-info">
          <span class="cart-item-name">${c.item.label}</span>
          <span class="cart-item-meta">$${c.item.price} / ${c.item.unit}</span>
        </div>
        <div class="cart-item-controls">
          <button type="button" class="cart-qty-btn" onclick="updateCartQty('${c.key}', -1)" aria-label="Remove one">−</button>
          <span class="cart-qty-num">${c.qty}</span>
          <button type="button" class="cart-qty-btn" onclick="updateCartQty('${c.key}', 1)" aria-label="Add one">+</button>
        </div>
        <div class="cart-item-right">
          <span class="cart-item-price">$${c.qty * c.item.price}</span>
          <button type="button" class="cart-remove" onclick="removeCartItem('${c.key}')" aria-label="Remove item">✕</button>
        </div>
      </div>
    `).join('');

    // Render sidebar summary lines
    if (summLines) {
      summLines.innerHTML = cart.map(c => `
        <div class="summary-row" style="font-size: 0.88rem;">
          <span class="label">${c.item.label} × ${c.qty}</span>
          <span class="value">$${c.qty * c.item.price}</span>
        </div>
      `).join('');
    }
  }


  /* ── CART DEPOSIT CALCULATOR ── */
  function calcCartDeposit() {
    if (activeTab !== 'menu') return;

    const total         = cart.reduce((sum, c) => sum + (c.qty * c.item.price), 0);
    const depositDisplay = document.getElementById('deposit-amount');
    const depositInline  = document.getElementById('cart-deposit-inline');
    const depositHidden  = document.getElementById('deposit-hidden');
    const totalDisplay   = document.getElementById('order-total');
    const subtotalEl     = document.getElementById('cart-subtotal');

    if (subtotalEl) subtotalEl.textContent = total > 0 ? `$${total}` : '$0';
    if (totalDisplay) totalDisplay.textContent = total > 0 ? `$${total}` : '—';

    let deposit = 0;
    if (total > 0) {
      if (CFG?.deposits?.tiers) {
        for (const tier of CFG.deposits.tiers) {
          if (total <= tier.upTo) {
            deposit = tier.amount ?? Math.round(total * (tier.percent ?? 0.5));
            break;
          }
        }
      } else {
        if      (total < 20) deposit = 5;
        else if (total < 50) deposit = 10;
        else                 deposit = Math.round(total * 0.5);
      }
    }

    const depositText = deposit > 0 ? `$${deposit}` : '—';
    if (depositDisplay) depositDisplay.textContent = depositText;
    if (depositInline)  depositInline.textContent  = depositText;
    if (depositHidden)  depositHidden.value         = deposit;
  }


  /* ── CUSTOM ORDER SIDEBAR LIVE UPDATES ── */
  const customTypeEl     = document.getElementById('custom-type');
  const customOccEl      = document.getElementById('custom-occasion');
  const customQtyEl      = document.getElementById('custom-qty');

  function updateCustomSummary() {
    const typeOpt = customTypeEl?.options[customTypeEl.selectedIndex];
    const occOpt  = customOccEl?.options[customOccEl.selectedIndex];
    const qty     = customQtyEl?.value;

    const st = document.getElementById('summary-custom-type');
    const so = document.getElementById('summary-custom-occasion');
    const sq = document.getElementById('summary-custom-qty');

    if (st) st.textContent = typeOpt?.value ? typeOpt.text : '—';
    if (so) so.textContent = occOpt?.value  ? occOpt.text  : '—';
    if (sq) sq.textContent = qty || '—';
  }

  if (customTypeEl)  customTypeEl.addEventListener('change', updateCustomSummary);
  if (customOccEl)   customOccEl.addEventListener('change', updateCustomSummary);
  if (customQtyEl)   customQtyEl.addEventListener('input',  updateCustomSummary);


  /* ── ORDER FORM SUBMISSION ── */
  const orderForm = document.getElementById('order-form');

  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Determine which fields are relevant for this tab
      const isCustom = activeTab === 'custom';

      // Validate shared required fields
      const sharedRequired = ['customer-name', 'customer-phone', 'customer-email', 'deposit-agree'];
      let valid = true;

      sharedRequired.forEach(id => {
        const field = document.getElementById(id);
        if (!field) return;
        const empty = field.type === 'checkbox' ? !field.checked : !field.value.trim();
        if (empty) {
          field.style.borderColor = '#FF2D78';
          field.style.boxShadow   = '0 0 0 3px rgba(255,45,120,0.2)';
          valid = false;
          setTimeout(() => { field.style.borderColor = ''; field.style.boxShadow = ''; }, 3000);
        }
      });

      if (!isCustom) {
        // Menu order: must have at least one cart item + pickup date
        if (cart.length === 0) {
          const cartWrap = document.getElementById('cart-list-wrap');
          if (cartWrap) {
            cartWrap.style.outline = '2px solid #FF2D78';
            cartWrap.style.borderRadius = '8px';
            setTimeout(() => { cartWrap.style.outline = ''; }, 3000);
          }
          valid = false;
        }
        const pickupField = document.getElementById('pickup-date');
        if (!pickupField?.value) {
          if (pickupField) {
            pickupField.style.borderColor = '#FF2D78';
            setTimeout(() => { pickupField.style.borderColor = ''; }, 3000);
          }
          valid = false;
        }
      } else {
        // Custom order: must have type, occasion, qty, date, description
        ['custom-type','custom-occasion','custom-qty','custom-date','custom-description'].forEach(id => {
          const field = document.getElementById(id);
          if (field && !field.value.trim()) {
            field.style.borderColor = '#FF2D78';
            field.style.boxShadow   = '0 0 0 3px rgba(255,45,120,0.2)';
            valid = false;
            setTimeout(() => { field.style.borderColor = ''; field.style.boxShadow = ''; }, 3000);
          }
        });
      }

      if (!valid) return;

      // Build order data object
      const formData = Object.fromEntries(new FormData(orderForm));
      const deposit  = parseInt(formData['deposit-hidden']) || 0;

      const orderData = {
        ...formData,
        'order-type': activeTab,
        'cart':       isCustom ? [] : cart.map(c => ({
          key:   c.key,
          label: c.item.label,
          qty:   c.qty,
          unit:  c.item.unit,
          price: c.item.price,
          line:  c.qty * c.item.price,
        })),
        'cart-total': isCustom ? 'TBD' : cart.reduce((s, c) => s + c.qty * c.item.price, 0),
      };

      sessionStorage.setItem('mm_order', JSON.stringify(orderData));

      // Stripe routing
      const links    = CFG?.stripe?.links ?? {};
      const stripeUrl = isCustom
        ? (links['custom'] ?? '')
        : (links[deposit] ?? links['custom'] ?? '');

      if (!stripeUrl || stripeUrl.includes('REPLACE_WITH')) {
        window.location.href = 'thankyou.html';
      } else {
        window.location.href = stripeUrl;
      }
    });
  }


  /* ── THANK YOU PAGE — order recap ── */
  const orderRecap = document.getElementById('order-recap');
  if (orderRecap) {
    const stored = sessionStorage.getItem('mm_order');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        let html = '<ul style="list-style:none;text-align:left;max-width:400px;margin:0 auto 1rem;">';

        const addRow = (label, val) => {
          if (val) html += `<li style="margin-bottom:.5rem;color:rgba(255,255,255,.65);font-size:.95rem;"><strong style="color:#fff">${label}:</strong> ${val}</li>`;
        };

        addRow('Name',   data['customer-name']);
        addRow('Email',  data['customer-email']);
        addRow('Phone',  data['customer-phone']);
        addRow('Type',   data['order-type'] === 'custom' ? 'Custom Order' : 'Menu Order');

        if (data['order-type'] === 'custom') {
          addRow('Requested', data['custom-type']);
          addRow('Occasion',  data['custom-occasion']);
          addRow('Quantity',  data['custom-qty']);
          addRow('Date Needed', data['custom-date']);
        } else {
          const cartItems = data['cart'];
          if (Array.isArray(cartItems)) {
            cartItems.forEach(c => addRow(c.label, `${c.qty} ${c.unit} — $${c.line}`));
            addRow('Cart Total', `$${data['cart-total']}`);
          }
          addRow('Pickup Date', data['pickup-date']);
        }

        html += '</ul>';
        orderRecap.innerHTML = html;
      } catch (_) { /* ignore */ }
      sessionStorage.removeItem('mm_order');
    }
  }


  /* ── CONTACT FORM (Formspree) ── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('[type="submit"]');
      const successMsg = document.getElementById('contact-success');
      const orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;

      const formId = CFG?.formspree ?? '';
      const url = formId && !formId.includes('REPLACE')
        ? `https://formspree.io/f/${formId}`
        : null;

      if (!url) {
        // Dev mode fallback
        contactForm.style.display = 'none';
        if (successMsg) successMsg.style.display = 'block';
        return;
      }

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(contactForm),
        });
        if (res.ok) {
          contactForm.style.display = 'none';
          if (successMsg) successMsg.style.display = 'block';
        } else throw new Error('failed');
      } catch (_) {
        btn.textContent = 'Error — please try again';
        btn.style.background = '#aa0000';
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      }
    });
  }

}); // end DOMContentLoaded
