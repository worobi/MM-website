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

  /**
   * Get the Wednesday cutoff Date for a given weekend date.
   * Sat → 3 days back; Sun → 4 days back.
   */
  function getCutoffForWeekend(weekendDate) {
    const d = new Date(weekendDate);
    const dow = d.getDay(); // 6=Sat, 0=Sun
    const daysBack = (dow === 6) ? 3 : 4;
    d.setDate(d.getDate() - daysBack);
    const s = CFG ? CFG.schedule : {};
    d.setHours(s.cutoffHour ?? 23, s.cutoffMinute ?? 59, 59, 999);
    return d;
  }

  /**
   * Returns true if the given date is a valid, orderable pickup day.
   * A date is disabled if:
   *   - It's not in config pickupDays, OR
   *   - Its Wednesday cutoff has already passed
   */
  function isDateDisabled(date) {
    const schedule = CFG?.schedule ?? { pickupDays: [6, 0], minLeadDays: 3 };
    const day = date.getDay();

    // Must be a pickup day
    if (!schedule.pickupDays.includes(day)) return true;

    // Must be far enough in the future
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + (schedule.minLeadDays ?? 3));
    minDate.setHours(0, 0, 0, 0);
    if (date < minDate) return true;

    // Check cutoff for this weekend
    const cutoff = getCutoffForWeekend(date);
    if (new Date() > cutoff) return true;

    return false;
  }

  /**
   * Find the next N orderable weekends from today.
   */
  function getUpcomingWeekends(count = 4) {
    const results = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);

    // Scan up to 60 days out
    for (let i = 0; i < 60 && results.length < count; i++) {
      d.setDate(d.getDate() + 1);
      const check = new Date(d);
      if (!isDateDisabled(check)) {
        results.push(new Date(check));
      }
    }
    return results;
  }

  /**
   * Format a Date nicely (e.g. "Sat, Apr 5")
   */
  function fmtDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }


  /* ── ORDERS CLOSED BANNER ── */
  function checkAndShowClosedBanner() {
    const banner    = document.getElementById('orders-closed-banner');
    const nextLabel = document.getElementById('next-open-date');
    if (!banner) return;

    // Find upcoming weekends
    const upcoming  = getUpcomingWeekends(6);

    // Is there any available date within the next 7 days?
    const now    = new Date();
    const in7    = new Date(now); in7.setDate(in7.getDate() + 7);
    const urgent = upcoming.find(d => d <= in7);

    // If the very next calendar Saturday is past cutoff, show the banner
    // Get upcoming Saturday
    const nextSat = new Date(now);
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
        <span class="chip-status ${isOpen ? 'open' : 'closed'}">
          ${isOpen ? '✓ Open' : 'Closed'}
        </span>
        ${isOpen
          ? `<span style="font-size:0.78rem;color:var(--text-faint);">closes Wed ${cutoff.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>`
          : ''
        }
      `;
      container.appendChild(chip);
    });
  }

  buildPickupSchedule();


  /* ── FLATPICKR CALENDAR INIT ── */
  if (typeof flatpickr !== 'undefined') {
    const schedule = CFG?.schedule ?? { minLeadDays: 3 };

    const minDate = new Date();
    minDate.setDate(minDate.getDate() + schedule.minLeadDays);

    flatpickr('#pickup-date', {
      minDate,
      dateFormat:  'Y-m-d',
      altInput:    true,
      altFormat:   'l, F j, Y',       // "Saturday, April 5, 2026"
      disableMobile: false,

      // Disable non-pickup days and past-cutoff weekends
      disable: [
        function(date) { return isDateDisabled(date); }
      ],

      // Style available weekend days with yellow
      onDayCreate(dObj, dStr, fp, dayElem) {
        const d = dayElem.dateObj;
        if (d && !isDateDisabled(d)) {
          dayElem.classList.add('weekend-available');
        }
      },

      onChange(selectedDates, dateStr) {
        // Update sidebar summary
        const summDate = document.getElementById('summary-date');
        if (summDate) {
          summDate.textContent = selectedDates[0]
            ? fmtDate(selectedDates[0])
            : '—';
        }
      }
    });
  }


  /* ── PRODUCT DROPDOWN — build from config ── */
  const productSelect = document.getElementById('order-product');

  if (productSelect && CFG) {
    // Group products by type
    const groups = {
      cookie:  { label: '🍪 Cookies',   keys: ['chocolate-chip','devils-food','kitchen-sink'] },
      brownie: { label: '🍫 Brownies',  keys: ['fudge-brownie','blondie','marble-brownie','salted-caramel'] },
      muffin:  { label: '🧁 Muffins',   keys: ['blueberry-muffin','choc-chip-muffin','banana-nut-muffin'] },
      mix:     { label: '🥄 Dry Mixes', keys: ['sugar-mix','snickerdoodle-mix','chocolate-mix','dark-cocoa-mix','milk-cocoa-mix','mint-cocoa-mix'] },
      kit:     { label: '🎁 Kits',      keys: ['sugar-kit'] },
    };

    // Clear existing options (keep the placeholder)
    productSelect.innerHTML = '<option value="">— Select a product —</option>';

    Object.entries(groups).forEach(([, group]) => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = group.label;

      group.keys.forEach(key => {
        const item = CFG.inventory[key];
        if (!item) return;

        const opt = document.createElement('option');
        opt.value = key;

        const limitNote = item.maxQty !== null ? ` (max ${item.maxQty} this weekend)` : '';
        const soldNote  = item.soldOut ? ' — SOLD OUT' : '';

        opt.textContent = `${item.label}${soldNote || limitNote} — $${item.price}/${item.unit}`;
        opt.disabled    = item.soldOut;
        if (item.soldOut) opt.style.color = 'rgba(255,255,255,0.3)';

        optgroup.appendChild(opt);
      });

      if (optgroup.children.length) productSelect.appendChild(optgroup);
    });

    // Pre-select from URL param
    const urlParams  = new URLSearchParams(window.location.search);
    const preselect  = urlParams.get('product');
    if (preselect && CFG.inventory[preselect] && !CFG.inventory[preselect].soldOut) {
      productSelect.value = preselect;
    }
  }


  /* ── DEPOSIT & SUMMARY CALCULATOR ── */
  const qtyInput       = document.getElementById('order-qty');
  const depositDisplay = document.getElementById('deposit-amount');
  const depositHidden  = document.getElementById('deposit-hidden');
  const totalDisplay   = document.getElementById('order-total');
  const summProduct    = document.getElementById('summary-product');
  const summQty        = document.getElementById('summary-qty');
  const qtyWarning     = document.getElementById('qty-warning');
  const qtyWarningText = document.getElementById('qty-warning-text');
  const qtyUnitNote    = document.getElementById('qty-unit-note');

  function calcDeposit() {
    if (!productSelect || !qtyInput) return;

    const key  = productSelect.value;
    const item = CFG?.inventory?.[key];
    const qty  = parseInt(qtyInput.value) || 1;
    const price = item?.price ?? 0;
    const total = price * qty;

    // Max qty warning
    if (qtyWarning && item?.maxQty !== null && item?.maxQty !== undefined) {
      qtyInput.max = item.maxQty;
      if (qty > item.maxQty) {
        qtyInput.value = item.maxQty;
      }
      qtyWarningText.textContent = `Max available this weekend: ${item.maxQty} ${item.unit}`;
      qtyWarning.classList.toggle('visible', true);
    } else {
      qtyInput.max = 50;
      if (qtyWarning) qtyWarning.classList.remove('visible');
    }

    // Unit note
    if (qtyUnitNote && item) {
      const unitMap = { dozen: 'dozens', '6-pack': '6-packs', bag: 'bags', kit: 'kits' };
      qtyUnitNote.textContent = `Ordered in ${unitMap[item.unit] || item.unit}.`;
    }

    // Deposit tiers from config
    let deposit = 0;
    if (CFG?.deposits?.tiers) {
      for (const tier of CFG.deposits.tiers) {
        if (total <= tier.upTo) {
          deposit = tier.amount ?? Math.round(total * (tier.percent ?? 0.5));
          break;
        }
      }
    } else {
      // Fallback
      if      (total < 20) deposit = 5;
      else if (total < 50) deposit = 10;
      else                 deposit = Math.round(total * 0.5);
    }

    if (depositDisplay) depositDisplay.textContent = deposit > 0 ? `$${deposit}` : '—';
    if (depositHidden)  depositHidden.value         = deposit;
    if (totalDisplay)   totalDisplay.textContent    = total > 0 ? `$${total}` : '—';

    // Summary sidebar
    if (summProduct && item) {
      const opt = productSelect.options[productSelect.selectedIndex];
      summProduct.textContent = opt?.text?.split(' — ')[0] || '—';
    } else if (summProduct) {
      summProduct.textContent = '—';
    }
    if (summQty) summQty.textContent = qty > 0 ? `${qty} ${item?.unit ?? ''}` : '—';
  }

  if (productSelect) productSelect.addEventListener('change', calcDeposit);
  if (qtyInput)      qtyInput.addEventListener('input', calcDeposit);

  // Run once on load (in case URL pre-selected a product)
  if (productSelect?.value) calcDeposit();


  /* ── ORDER FORM SUBMISSION ── */
  const orderForm = document.getElementById('order-form');

  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate required fields manually for better UX
      const required = orderForm.querySelectorAll('[required]');
      let valid = true;
      required.forEach(field => {
        if (!field.value || (field.type === 'checkbox' && !field.checked)) {
          field.style.borderColor = '#FF2D78';
          field.style.boxShadow   = '0 0 0 3px rgba(255,45,120,0.2)';
          valid = false;
          setTimeout(() => {
            field.style.borderColor = '';
            field.style.boxShadow   = '';
          }, 3000);
        }
      });
      if (!valid) return;

      const data    = Object.fromEntries(new FormData(orderForm));
      const deposit = parseInt(data['deposit-hidden']) || 0;

      // Store for thank-you page
      sessionStorage.setItem('mm_order', JSON.stringify(data));

      // Stripe routing
      const links  = CFG?.stripe?.links ?? {};
      let stripeUrl = links[deposit] ?? links['custom'] ?? '';

      // Dev mode (Stripe not configured yet) — go straight to thank you
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
        const rows = {
          'Name':     data['customer-name'],
          'Email':    data['customer-email'],
          'Phone':    data['customer-phone'],
          'Product':  CFG?.inventory?.[data['order-product']]?.label ?? data['order-product'],
          'Qty':      data['order-qty'],
          'Pickup':   data['pickup-date'],
        };
        let html = '<ul style="list-style:none;text-align:left;max-width:360px;margin:0 auto 1rem;">';
        Object.entries(rows).forEach(([k, v]) => {
          if (v) html += `<li style="margin-bottom:.5rem;color:rgba(255,255,255,.65);font-size:.95rem;"><strong style="color:#fff">${k}:</strong> ${v}</li>`;
        });
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
