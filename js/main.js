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
     ORDER NOW DROPDOWN — click-toggle (replaces CSS-only hover)
     ============================================================== */
  const orderDropdown = document.querySelector('.nav-order-dropdown');
  if (orderDropdown) {
    const orderCta = orderDropdown.querySelector('.nav-cta');
    orderCta && orderCta.addEventListener('click', (e) => {
      e.preventDefault();
      orderDropdown.classList.toggle('open');
    });
    // Close when clicking a menu link
    orderDropdown.querySelectorAll('.nav-order-menu a').forEach(link => {
      link.addEventListener('click', () => orderDropdown.classList.remove('open'));
    });
    // Close when clicking anywhere outside
    document.addEventListener('click', (e) => {
      if (!orderDropdown.contains(e.target)) {
        orderDropdown.classList.remove('open');
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
          // Cap stagger at 120ms so the last card never waits more than ~120ms
          setTimeout(() => entry.target.classList.add('visible'), Math.min(i * 50, 120));
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      // Pre-trigger 200px before the element reaches the viewport bottom
      // so items load before the user has to scroll all the way to them
      rootMargin: '0px 0px 200px 0px'
    });
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
     SHOP PAGE — Label info modal popup
     (product-card has overflow:hidden so inline dropdown can't work)
     ============================================================== */
  const labelModal      = document.getElementById('label-modal');
  const labelModalBody  = document.getElementById('label-modal-body');
  const labelModalTitle = document.getElementById('label-modal-title');
  const labelModalClose = document.getElementById('label-modal-close');

  function closeLabelModal() {
    if (labelModal) {
      labelModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (labelModal) {
    document.querySelectorAll('.label-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel       = btn.nextElementSibling;
        const productName = btn.closest('.product-info')?.querySelector('.product-name')?.textContent || 'Product';
        if (labelModalTitle) labelModalTitle.textContent = `📋 ${productName} — Label Info`;
        if (labelModalBody)  labelModalBody.innerHTML    = panel?.querySelector('.label-info-inner')?.innerHTML || '';
        labelModal.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    if (labelModalClose) labelModalClose.addEventListener('click', closeLabelModal);
    labelModal.addEventListener('click', e => { if (e.target === labelModal) closeLabelModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && labelModal.classList.contains('open')) closeLabelModal();
    });
  }


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

        const btn = card.querySelector('.btn-order');
        if (btn) {
          btn.textContent = 'Sold Out';
          btn.style.pointerEvents = 'none';
          btn.removeAttribute('href');
        }
      }

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
     SHOP PAGE — Ensure all product cards are visible after 600ms
     (fallback in case IntersectionObserver misses any below-fold cards)
     ============================================================== */
  if (document.querySelector('.product-grid')) {
    setTimeout(() => {
      document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    }, 600);
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
     EMAIL SUBSCRIBE HELPER
     Calls /api/subscribe (server-side Mailchimp proxy).
     Silent fail — non-critical, never blocks order flow.
     ============================================================== */
  async function subscribeEmail(email, fname) {
    if (!email) return;
    const endpoint = CFG?.mailchimp?.subscribeEndpoint || '/api/subscribe';
    try {
      await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, fname: fname || '' }),
      });
    } catch (_) { /* silent — subscription is non-critical */ }
  }


  /* ==============================================================
     NEWSLETTER POPUP
     Shows after 8s on first visit; suppressed for 7 days after dismiss.
     ============================================================== */
  const POPUP_KEY = 'mm_popup_dismissed';
  const popupEl   = document.getElementById('newsletter-popup');

  if (popupEl) {
    const lastDismissed = localStorage.getItem(POPUP_KEY);
    const sevenDaysAgo  = Date.now() - 7 * 24 * 60 * 60 * 1000;

    if (!lastDismissed || parseInt(lastDismissed, 10) < sevenDaysAgo) {
      setTimeout(() => popupEl.classList.add('visible'), 8000);
    }

    function dismissPopup() {
      popupEl.style.opacity = '0';
      setTimeout(() => popupEl.classList.remove('visible'), 350);
      localStorage.setItem(POPUP_KEY, Date.now());
    }

    const closeBtn = popupEl.querySelector('.popup-close');
    if (closeBtn) closeBtn.addEventListener('click', dismissPopup);

    popupEl.addEventListener('click', (e) => {
      if (e.target === popupEl) dismissPopup();
    });

    const popupForm = document.getElementById('popup-signup-form');
    if (popupForm) {
      popupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailVal = popupForm.querySelector('[name="email"]')?.value?.trim();
        const fnameVal = popupForm.querySelector('[name="fname"]')?.value?.trim() || '';
        if (!emailVal) return;

        const subBtn = popupForm.querySelector('[type="submit"]');
        if (subBtn) { subBtn.textContent = 'Signing you up…'; subBtn.disabled = true; }

        await subscribeEmail(emailVal, fnameVal);

        popupForm.innerHTML = `
          <p style="text-align:center; color:var(--yellow); font-size:1.2rem; font-weight:700; margin:0 0 .5rem;">🎉 You're on the list!</p>
          <p style="text-align:center; color:rgba(255,255,255,.75); font-size:.9rem; margin:0;">Watch your inbox for sweet deals & fresh drop alerts.</p>
        `;
        localStorage.setItem(POPUP_KEY, Date.now());
        setTimeout(dismissPopup, 2800);
      });
    }
  }


  /* ==============================================================
     NEWSLETTER SECTION FORM (homepage & other pages)
     ============================================================== */
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailVal = newsletterForm.querySelector('[name="email"]')?.value?.trim();
      const fnameVal = newsletterForm.querySelector('[name="fname"]')?.value?.trim() || '';
      if (!emailVal) return;

      const subBtn = newsletterForm.querySelector('[type="submit"]');
      if (subBtn) { subBtn.textContent = 'Subscribing…'; subBtn.disabled = true; }

      await subscribeEmail(emailVal, fnameVal);

      newsletterForm.innerHTML = `
        <p style="text-align:center; color:var(--yellow); font-size:1.15rem; font-weight:700; margin:0 0 .4rem;">🎉 You're in! Sweet.</p>
        <p style="text-align:center; color:rgba(255,255,255,.75); font-size:.9rem; margin:0;">You'll hear from us when fresh batches drop.</p>
      `;
    });
  }


  /* ==============================================================
     SCHEDULE HELPERS (used by both order page & custom order page)
     ============================================================== */
  function fmtDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function getCutoffForWeekend(weekendDate) {
    const d   = new Date(weekendDate);
    const dow = d.getDay();
    const daysBack = (dow === 6) ? 3 : 4;
    d.setDate(d.getDate() - daysBack);
    const s = CFG ? CFG.schedule : {};
    d.setHours(s.cutoffHour ?? 23, s.cutoffMinute ?? 59, 59, 999);
    return d;
  }

  function isDateDisabled(date) {
    const schedule = CFG?.schedule ?? { pickupDays: [6, 0], minLeadDays: 3 };
    const day      = date.getDay();
    if (!schedule.pickupDays.includes(day)) return true;
    const minDate  = new Date();
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


  /* ==============================================================
     ▌▌▌  MENU ORDER PAGE  (#order-form)  ▐▐▐
     ============================================================== */
  if (document.getElementById('order-form')) {


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
    if (typeof flatpickr !== 'undefined' && document.getElementById('pickup-date')) {
      flatpickr('#pickup-date', {
        minDate: (() => {
          const d = new Date();
          d.setDate(d.getDate() + (CFG?.schedule?.minLeadDays ?? 3));
          return d;
        })(),
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
      });
    }


    /* ── CART SYSTEM ── */
    let cart = [];

    const productSelect  = document.getElementById('order-product');
    const qtyInput       = document.getElementById('order-qty');
    const qtyWarning     = document.getElementById('qty-warning');
    const qtyWarningText = document.getElementById('qty-warning-text');
    const qtyUnitNote    = document.getElementById('qty-unit-note');

    const PRODUCT_GROUPS = {
      cookie:  { label: '🍪 Cookies',   keys: ['chocolate-chip','devils-food','sugar-cookie','yin-yang-cookie','kitchen-sink','rocky-road'] },
      pastry:  { label: '🥐 Pastries',  keys: ['cinnamon-roll'] },
      brownie: { label: '🍫 Brownies',  keys: ['fudge-brownie','blondie'] },
      muffin:  { label: '🧁 Muffins',   keys: ['blueberry-muffin','choc-chip-muffin','banana-nut-muffin','snickerdoodle-muffin'] },
      mix:     { label: '🥄 Dry Mixes', keys: ['sugar-mix','snickerdoodle-mix','choc-chip-cookie-mix','devils-food-cookie-mix','dark-cocoa-mix','milk-cocoa-mix'] },
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

    function updateQtyHints() {
      if (!productSelect) return;
      const key  = productSelect.value;
      const item = CFG?.inventory?.[key];

      if (!item) {
        if (qtyUnitNote)  qtyUnitNote.textContent = 'Select a product to see unit info.';
        if (qtyWarning)   qtyWarning.classList.remove('visible');
        if (qtyInput)     qtyInput.max = 50;
        return;
      }

      const unitMap = { dozen: 'dozens', '6-pack': '6-packs', '4-pack': '4-packs', bag: 'bags', kit: 'kits' };
      if (qtyUnitNote) qtyUnitNote.textContent = `Ordered in ${unitMap[item.unit] || item.unit}. $${item.price} per ${item.unit}.`;

      if (item.maxQty !== null) {
        if (qtyInput)       qtyInput.max = item.maxQty;
        if (qtyWarningText) qtyWarningText.textContent = `Max available this weekend: ${item.maxQty} ${item.unit}`;
        if (qtyWarning)     qtyWarning.classList.add('visible');
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
        if (productSelect) {
          productSelect.style.borderColor = '#FF2D78';
          productSelect.focus();
          setTimeout(() => { productSelect.style.borderColor = ''; }, 2000);
        }
        return;
      }

      const item = CFG?.inventory?.[key];
      if (!item || item.soldOut) return;

      const qty       = Math.max(1, parseInt(qtyInput?.value) || 1);
      const cappedQty = (item.maxQty !== null) ? Math.min(qty, item.maxQty) : qty;

      const existing = cart.find(c => c.key === key);
      if (existing) {
        const newQty   = existing.qty + cappedQty;
        existing.qty   = (item.maxQty !== null) ? Math.min(newQty, item.maxQty) : newQty;
      } else {
        cart.push({ key, qty: cappedQty, item });
      }

      renderCart();
      calcCartDeposit();
      updatePaymentUI();

      const btn = document.getElementById('add-to-cart-btn');
      if (btn) {
        btn.textContent = '✓ Added!';
        btn.style.background = 'var(--purple)';
        setTimeout(() => { btn.textContent = '+ Add to Cart'; btn.style.background = ''; }, 1200);
      }

      if (productSelect) productSelect.value = '';
      if (qtyInput)      qtyInput.value = 1;
      if (qtyUnitNote)   qtyUnitNote.textContent = 'Select a product to see unit info.';
      if (qtyWarning)    qtyWarning.classList.remove('visible');
    }

    window.removeCartItem = function(key) {
      cart = cart.filter(c => c.key !== key);
      renderCart();
      calcCartDeposit();
      updatePaymentUI();
    };

    window.updateCartQty = function(key, delta) {
      const entry = cart.find(c => c.key === key);
      if (!entry) return;
      const newQty = entry.qty + delta;
      if (newQty <= 0) { window.removeCartItem(key); return; }
      const maxQ   = entry.item.maxQty;
      entry.qty    = (maxQ !== null) ? Math.min(newQty, maxQ) : newQty;
      renderCart();
      calcCartDeposit();
      updatePaymentUI();
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
    let _cartTotal   = 0;
    let _depositAmt  = 0;

    function calcDeposit(total) {
      if (total <= 0) return 0;
      if (CFG?.deposits?.tiers) {
        for (const tier of CFG.deposits.tiers) {
          if (total <= tier.upTo) {
            return tier.amount ?? Math.round(total * (tier.percent ?? 0.5));
          }
        }
      }
      if (total < 20)  return 5;
      if (total <= 50) return 10;
      return Math.round(total * 0.5);
    }

    function getAmountChoice() {
      return document.querySelector('input[name="payment-amount-choice"]:checked')?.value || 'deposit';
    }

    function calcCartDeposit() {
      const total          = cart.reduce((sum, c) => sum + (c.qty * c.item.price), 0);
      const depositDisplay = document.getElementById('deposit-amount');
      const depositInline  = document.getElementById('cart-deposit-inline');
      const depositHidden  = document.getElementById('deposit-hidden');
      const totalDisplay   = document.getElementById('order-total');
      const subtotalEl     = document.getElementById('cart-subtotal');

      _cartTotal  = total;
      _depositAmt = calcDeposit(total);

      if (subtotalEl)   subtotalEl.textContent  = total > 0 ? `$${total}` : '$0';
      if (totalDisplay) totalDisplay.textContent = total > 0 ? `$${total}` : '—';

      // Update the amount-choice panel prices
      const depChoiceAmt  = document.getElementById('deposit-choice-amt');
      const fullChoiceAmt = document.getElementById('full-choice-amt');
      if (depChoiceAmt)  depChoiceAmt.textContent  = _depositAmt > 0 ? `$${_depositAmt}`  : '—';
      if (fullChoiceAmt) fullChoiceAmt.textContent = total > 0       ? `$${total}` : '—';

      // Sidebar summary reflects chosen amount
      updateAmountDisplay();
    }

    function updateAmountDisplay() {
      const choice         = getAmountChoice();
      const amountDue      = choice === 'full' ? _cartTotal : _depositAmt;
      const depositDisplay = document.getElementById('deposit-amount');
      const depositInline  = document.getElementById('cart-deposit-inline');
      const depositHidden  = document.getElementById('deposit-hidden');
      const summaryLabel   = document.querySelector('.summary-total .label');
      const agreeText      = document.getElementById('deposit-agree-text');

      const amountText = amountDue > 0 ? `$${amountDue}` : '—';
      if (depositDisplay) depositDisplay.textContent = amountText;
      if (depositInline)  depositInline.textContent  = amountText;
      if (depositHidden)  depositHidden.value         = amountDue;

      if (summaryLabel) {
        summaryLabel.textContent = choice === 'full' ? 'Total Due Today' : 'Deposit Due Today';
      }

      if (agreeText) {
        if (choice === 'full') {
          agreeText.innerHTML = 'I understand the full amount is charged today to confirm my order. Orders are non-refundable if cancelled with less than 48 hours notice. <span class="required">*</span>';
        } else {
          agreeText.innerHTML = 'I understand a deposit is required to confirm my order. The remaining balance is due at pickup. Deposits are non-refundable if I cancel with less than 48 hours notice. <span class="required">*</span>';
        }
      }
    }

    // Wire up amount-choice radios
    document.querySelectorAll('input[name="payment-amount-choice"]').forEach(r => {
      r.addEventListener('change', () => { updateAmountDisplay(); updatePaymentUI(); });
    });


    /* ── PAYMENT METHOD SELECTOR ── */
    const paymentRadios      = document.querySelectorAll('input[name="deposit-payment-method"]');
    const paymentAltNotice   = document.getElementById('payment-alt-notice');
    const stripeSecurityNote = document.getElementById('stripe-security-note');
    const submitBtn          = document.getElementById('submit-btn');
    const cashHandleCard     = document.getElementById('cash-handle-card');
    const cashappHandleCard  = document.getElementById('cashapp-handle-card');
    const venmoHandleCard    = document.getElementById('venmo-handle-card');
    const cashNotice         = document.getElementById('payment-cash-notice');

    // Populate handles from config
    if (CFG?.payments) {
      const caHandle = CFG.payments.cashapp?.handle || '$MonisM';
      const vmHandle = CFG.payments.venmo?.handle   || '@MonisM';
      ['cashapp-handle-sub', 'cashapp-handle-display'].forEach(id => {
        const el = document.getElementById(id); if (el) el.textContent = caHandle;
      });
      ['venmo-handle-sub', 'venmo-handle-display'].forEach(id => {
        const el = document.getElementById(id); if (el) el.textContent = vmHandle;
      });
      if (CFG.payments.cashapp?.enabled === false) {
        document.getElementById('payment-opt-cashapp')?.style.setProperty('display','none');
      }
      if (CFG.payments.venmo?.enabled === false) {
        document.getElementById('payment-opt-venmo')?.style.setProperty('display','none');
      }
    }

    function getSelectedPaymentMethod() {
      return document.querySelector('input[name="deposit-payment-method"]:checked')?.value || 'stripe';
    }

    function updatePaymentUI() {
      const method    = getSelectedPaymentMethod();
      const choice    = getAmountChoice();
      const isAlt     = method === 'cashapp' || method === 'venmo';
      const isCash    = method === 'cash';
      const isStripe  = method === 'stripe';

      // Show/hide notices
      if (paymentAltNotice)   paymentAltNotice.style.display  = isAlt   ? 'flex'  : 'none';
      if (cashNotice)         cashNotice.style.display         = isCash  ? 'flex'  : 'none';
      if (stripeSecurityNote) stripeSecurityNote.style.display = isStripe ? 'flex' : 'none';

      // Show/hide sidebar handle cards
      if (cashHandleCard)    cashHandleCard.style.display    = isCash              ? 'block' : 'none';
      if (cashappHandleCard) cashappHandleCard.style.display = method === 'cashapp' ? 'block' : 'none';
      if (venmoHandleCard)   venmoHandleCard.style.display   = method === 'venmo'   ? 'block' : 'none';

      // Show amount-choice section only for non-Cash methods when cart has items
      const amountSection = document.getElementById('payment-amount-section');
      if (amountSection) {
        amountSection.style.display = (!isCash && _cartTotal > 0) ? 'block' : 'none';
      }

      // Update amounts in sidebar handle cards to reflect choice
      const amountDue = (isCash || choice === 'full') ? _cartTotal : _depositAmt;
      const amountStr = amountDue > 0 ? `$${amountDue}` : '—';
      ['cashapp-handle-display','venmo-handle-display'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          // Only update the sibling amount label if it exists
          const card = el.closest('.pay-handle-card');
          const amtEl = card?.querySelector('.pay-handle-send-amount');
          if (amtEl) amtEl.textContent = `Send: ${amountStr}`;
        }
      });

      // Update the CashApp/Venmo sidebar warning text for amount
      document.querySelectorAll('.pay-handle-warning').forEach(el => {
        if (el.closest('#cashapp-handle-card, #venmo-handle-card')) {
          const baseText = choice === 'full'
            ? `Send ${amountStr} — full amount`
            : `Send ${amountStr} deposit within 24 hrs or order is canceled`;
          el.textContent = `⚠️ ${baseText}`;
        }
      });

      // Submit button label
      if (submitBtn) {
        const isFull = choice === 'full';
        if (method === 'cashapp') {
          submitBtn.textContent      = `Submit Order — ${isFull ? 'Pay Full via' : 'Send Deposit via'} CashApp →`;
          submitBtn.style.background = 'linear-gradient(135deg,#00c62c,#00a024)';
          submitBtn.style.boxShadow  = '0 0 18px rgba(0,198,44,0.4)';
        } else if (method === 'venmo') {
          submitBtn.textContent      = `Submit Order — ${isFull ? 'Pay Full via' : 'Send Deposit via'} Venmo →`;
          submitBtn.style.background = 'linear-gradient(135deg,#0074de,#005cb3)';
          submitBtn.style.boxShadow  = '0 0 18px rgba(0,116,222,0.4)';
        } else if (method === 'cash') {
          submitBtn.textContent      = 'Submit Order — Pay Cash at Pickup →';
          submitBtn.style.background = 'linear-gradient(135deg,#b8860b,#daa520)';
          submitBtn.style.boxShadow  = '0 0 18px rgba(218,165,32,0.4)';
        } else {
          submitBtn.textContent      = isFull ? 'Pay Full Amount via Card →' : 'Pay Deposit via Card →';
          submitBtn.style.background = '';
          submitBtn.style.boxShadow  = '';
        }
      }
    }

    paymentRadios.forEach(r => r.addEventListener('change', updatePaymentUI));
    updatePaymentUI();


    /* ── ORDER FORM SUBMISSION → STRIPE CHECKOUT API ── */
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
      orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate required fields
        let valid = true;
        ['customer-name', 'customer-phone', 'customer-email'].forEach(id => {
          const field = document.getElementById(id);
          if (field && !field.value.trim()) {
            field.style.borderColor = '#FF2D78';
            field.style.boxShadow   = '0 0 0 3px rgba(255,45,120,0.2)';
            valid = false;
            setTimeout(() => { field.style.borderColor = ''; field.style.boxShadow = ''; }, 3000);
          }
        });

        const depositAgree = document.getElementById('deposit-agree');
        if (depositAgree && !depositAgree.checked) {
          depositAgree.style.outline = '2px solid #FF2D78';
          valid = false;
          setTimeout(() => { depositAgree.style.outline = ''; }, 3000);
        }

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

        if (!valid) return;

        const formData      = Object.fromEntries(new FormData(orderForm));
        const customerEmail = document.getElementById('customer-email')?.value?.trim() || '';
        const customerName  = document.getElementById('customer-name')?.value?.trim()  || '';
        const paymentMethod = getSelectedPaymentMethod();
        const amountChoice  = getAmountChoice(); // 'deposit' | 'full'

        // Email opt-in
        const emailOptin = document.getElementById('email-optin');
        if (emailOptin?.checked && customerEmail) {
          subscribeEmail(customerEmail, customerName.split(' ')[0]);
        }

        // Build cart payload
        const cartPayload = cart.map(c => ({
          key:   c.key,
          label: c.item.label,
          qty:   c.qty,
          unit:  c.item.unit,
          price: c.item.price,
          line:  c.qty * c.item.price,
        }));

        if (submitBtn) { submitBtn.textContent = 'Securing your order…'; submitBtn.disabled = true; }

        /* ── Cash at Pickup path ── */
        if (paymentMethod === 'cash') {
          try {
            const res  = await fetch('/api/submit-order', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                orderType: 'menu', cart: cartPayload,
                customerEmail, orderData: formData, paymentMethod: 'cash',
                amountChoice: 'full', // cash is always full at pickup
              }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Order submission failed');
            const params = new URLSearchParams({ payment: 'cash', name: customerName });
            window.location.href = `thankyou.html?${params.toString()}`;
          } catch (err) {
            console.error('Cash order error:', err);
            if (submitBtn) {
              submitBtn.textContent  = 'Error — please try again';
              submitBtn.style.background = '#aa0000';
              setTimeout(() => { updatePaymentUI(); submitBtn.disabled = false; }, 3000);
            }
          }
          return;
        }

        /* ── CashApp / Venmo path ── */
        if (paymentMethod === 'cashapp' || paymentMethod === 'venmo') {
          try {
            const res  = await fetch('/api/submit-order', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                orderType: 'menu', cart: cartPayload,
                customerEmail, orderData: formData, paymentMethod, amountChoice,
              }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Order submission failed');

            const handle = paymentMethod === 'cashapp'
              ? (CFG?.payments?.cashapp?.handle || '$MonisMunchiesBakery')
              : (CFG?.payments?.venmo?.handle   || '@MonisMunchiesBakery');

            // Show deposit OR full amount on thank-you page
            const amountDue = amountChoice === 'full'
              ? (data.cartTotal || 0)
              : (data.depositAmount || 0);

            const params = new URLSearchParams({
              payment:     paymentMethod,
              deposit:     amountDue.toFixed(2),
              amountType:  amountChoice,
              handle,
              name:        customerName,
            });
            window.location.href = `thankyou.html?${params.toString()}`;
          } catch (err) {
            console.error('Alt-pay order error:', err);
            if (submitBtn) {
              submitBtn.textContent  = 'Error — please try again';
              submitBtn.style.background = '#aa0000';
              setTimeout(() => { updatePaymentUI(); submitBtn.disabled = false; }, 3000);
            }
          }
          return;
        }

        /* ── Stripe / Card path ── */
        try {
          const endpoint = CFG?.stripe?.checkoutEndpoint || '/api/create-checkout-session';
          const res = await fetch(endpoint, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              orderType: 'menu', cart: cartPayload,
              customerEmail, orderData: formData, amountChoice,
            }),
          });

          const data = await res.json();
          if (data.url) {
            window.location.href = data.url;
          } else {
            throw new Error(data.error || 'No checkout URL returned');
          }
        } catch (err) {
          console.error('Checkout error:', err);
          if (submitBtn) {
            submitBtn.textContent = 'Error — please try again';
            submitBtn.style.background = '#aa0000';
            setTimeout(() => { updatePaymentUI(); submitBtn.disabled = false; }, 3000);
          }
        }
      });
    }

  } // end #order-form block


  /* ==============================================================
     ▌▌▌  CUSTOM ORDER PAGE  (#custom-order-form)  ▐▐▐
     ============================================================== */
  if (document.getElementById('custom-order-form')) {

    /* ── Flatpickr on date field ── */
    if (typeof flatpickr !== 'undefined' && document.getElementById('co-date')) {
      flatpickr('#co-date', {
        minDate: (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d; })(),
        dateFormat: 'Y-m-d',
        altInput:   true,
        altFormat:  'l, F j, Y',
        onChange(selectedDates) {
          const el = document.getElementById('co-sum-date');
          if (el) el.textContent = selectedDates[0] ? fmtDate(selectedDates[0]) : '—';
        }
      });
    }

    /* ── Live sidebar summary ── */
    const coType     = document.getElementById('co-type');
    const coOccasion = document.getElementById('co-occasion');
    const coQty      = document.getElementById('co-qty');

    function updateCoSummary() {
      const typeEl = document.getElementById('co-sum-type');
      const occEl  = document.getElementById('co-sum-occasion');
      const qtyEl  = document.getElementById('co-sum-qty');
      if (typeEl) typeEl.textContent = coType?.value
        ? coType.options[coType.selectedIndex]?.text : '—';
      if (occEl)  occEl.textContent  = coOccasion?.value
        ? coOccasion.options[coOccasion.selectedIndex]?.text : '—';
      if (qtyEl)  qtyEl.textContent  = coQty?.value || '—';
    }

    if (coType)     coType.addEventListener('change', updateCoSummary);
    if (coOccasion) coOccasion.addEventListener('change', updateCoSummary);
    if (coQty)      coQty.addEventListener('input', updateCoSummary);

    /* ── Custom order form submission → Stripe Checkout API ── */
    const customOrderForm = document.getElementById('custom-order-form');
    customOrderForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate
      let valid = true;
      [
        { id: 'co-name',     type: 'text'     },
        { id: 'co-phone',    type: 'text'     },
        { id: 'co-email',    type: 'text'     },
        { id: 'co-type',     type: 'select'   },
        { id: 'co-occasion', type: 'select'   },
        { id: 'co-qty',      type: 'text'     },
        { id: 'co-date',     type: 'text'     },
        { id: 'co-desc',     type: 'textarea' },
        { id: 'co-agree',    type: 'checkbox' },
      ].forEach(({ id, type }) => {
        const field = document.getElementById(id);
        if (!field) return;
        const empty = type === 'checkbox' ? !field.checked : !field.value.trim();
        if (empty) {
          field.style.borderColor = '#FF2D78';
          field.style.boxShadow   = '0 0 0 3px rgba(255,45,120,0.2)';
          valid = false;
          setTimeout(() => { field.style.borderColor = ''; field.style.boxShadow = ''; }, 3000);
        }
      });

      if (!valid) return;

      const formData      = Object.fromEntries(new FormData(customOrderForm));
      const customerEmail = document.getElementById('co-email')?.value?.trim() || '';

      // Email opt-in
      const coOptin = document.getElementById('co-optin');
      if (coOptin?.checked && customerEmail) {
        const fname = (formData['customer-name'] || '').split(' ')[0];
        subscribeEmail(customerEmail, fname);
      }

      const submitBtn = document.getElementById('co-submit-btn');
      if (submitBtn) { submitBtn.textContent = 'Securing deposit…'; submitBtn.disabled = true; }

      try {
        const endpoint = CFG?.stripe?.checkoutEndpoint || '/api/create-checkout-session';
        const res = await fetch(endpoint, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            orderType:     'custom',
            customerEmail,
            orderData:     formData,
          }),
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'No checkout URL returned');
        }
      } catch (err) {
        console.error('Custom order checkout error:', err);
        if (submitBtn) {
          submitBtn.textContent  = 'Error — please try again';
          submitBtn.style.background = '#aa0000';
          setTimeout(() => {
            submitBtn.textContent  = '💜 Submit Custom Order & Pay $10 Deposit';
            submitBtn.style.background = '';
            submitBtn.disabled     = false;
          }, 3000);
        }
      }
    });

  } // end #custom-order-form block


  /* ==============================================================
     THANK YOU PAGE — Stripe session recap
     ============================================================== */
  const orderRecap = document.getElementById('order-recap');
  if (orderRecap) {
    // Pull session_id from URL (Stripe appends it)
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const orderType = urlParams.get('type');

    // Show appropriate message
    const typeMsg = document.getElementById('thankyou-type-msg');
    if (typeMsg) {
      typeMsg.textContent = orderType === 'custom'
        ? 'Your custom order deposit is confirmed. Monica will reach out within 24 hours to discuss details and finalize your quote.'
        : 'Your deposit is confirmed and your order is in the queue. Monica will have it fresh and ready for pickup!';
    }

    // Show session ID for reference
    if (sessionId) {
      const refEl = document.getElementById('order-ref');
      if (refEl) refEl.textContent = `Order Reference: ${sessionId.substring(0, 24)}…`;
    }
  }


  /* ==============================================================
     CONTACT FORM (Formspree)
     ============================================================== */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn        = contactForm.querySelector('[type="submit"]');
      const successMsg = document.getElementById('contact-success');
      const orig       = btn.textContent;
      btn.textContent  = 'Sending…';
      btn.disabled     = true;

      const formId = CFG?.formspree ?? '';
      const url    = formId && !formId.includes('REPLACE')
        ? `https://formspree.io/f/${formId}`
        : null;

      if (!url) {
        contactForm.style.display = 'none';
        if (successMsg) successMsg.style.display = 'block';
        return;
      }

      try {
        const res = await fetch(url, {
          method:  'POST',
          headers: { 'Accept': 'application/json' },
          body:    new FormData(contactForm),
        });
        if (res.ok) {
          contactForm.style.display = 'none';
          if (successMsg) successMsg.style.display = 'block';
        } else throw new Error('failed');
      } catch (_) {
        btn.textContent = 'Error — please try again';
        btn.style.background = '#aa0000';
        setTimeout(() => {
          btn.textContent      = orig;
          btn.style.background = '';
          btn.disabled         = false;
        }, 3000);
      }
    });
  }

}); // end DOMContentLoaded
