/* =========================================================
   1. PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
   (see README.md for step-by-step setup instructions)
   ========================================================= */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz5gYQFgpkYHS9-ZCkw8ILJLQ_BUhCXdNC4Bp5uB70uBTSDn34mjUB344_suXLXguxj/exec";

async function initGuestRedirectFromCsv() {
  const params = new URLSearchParams(window.location.search);
  const rawCode = (params.get('code') || '').trim();
  if (!rawCode) return;

  const code = rawCode.toUpperCase();
  const currentUrl = new URL(window.location.href);

  try {
    const response = await fetch('guest-codes.csv');
    if (!response.ok) return;

    const text = await response.text();
    const rows = text.split(/\r?\n/).filter(Boolean);
    const header = rows.shift();
    if (!header) return;

    const match = rows.find(row => {
      const [csvCode, ,] = row.split(',').map(part => part.trim());
      return csvCode && csvCode.toUpperCase() === code;
    });

    if (!match) return;

    const [, page, access] = match.split(',').map(part => part.trim());
    if (!page || !access) return;

    const targetUrl = new URL(`${page}?access=${encodeURIComponent(access)}`, currentUrl.href);
    const alreadyAtTarget = currentUrl.pathname.endsWith(`/${page}`)
      && currentUrl.searchParams.get('access') === access;

    if (!alreadyAtTarget) {
      window.location.replace(targetUrl.href);
    }
  } catch (error) {
    console.warn('Guest redirect CSV could not be loaded:', error);
  }
}

initGuestRedirectFromCsv();

/* =========================================================
   Countdown timer (index.html)
   ========================================================= */
(function initCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  const target = new Date(el.dataset.target).getTime();
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now = Date.now();
    let diff = Math.max(0, target - now);

    const days = Math.floor(diff / 86400000);
    diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000);
    diff -= hours * 3600000;
    const mins = Math.floor(diff / 60000);
    diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minsEl.textContent = pad(mins);
    secsEl.textContent = pad(secs);
  }

  tick();
  setInterval(tick, 1000);
})();

/* =========================================================
   Detailed events page (events.html) — access-gated by tier
   Usage: events.html?access=all | events.html?access=sangeet | events.html?access=wedding
   - all:     Haldi + Sangeet + Baraat/Wedding (full 3-day guests)
   - sangeet: Sangeet + Baraat/Wedding (2-day guests, Nov 24-25)
   - wedding: Baraat/Wedding only (Nov 25 only guests)
   ========================================================= */
(function initEventsAccess() {
  const wrap = document.getElementById('events-wrap');
  if (!wrap) return;

  const params = new URLSearchParams(window.location.search);
  const access = (params.get('access') || '').toLowerCase().trim();
  const validTiers = ['all', 'sangeet', 'wedding'];
  const isEventsPage = window.location.pathname.endsWith('/events.html');

  if (isEventsPage && params.has('scope')) {
    params.delete('scope');
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('scope');
    window.history.replaceState(null, '', cleanUrl.href);
  }

  const lockedEl = document.getElementById('access-locked');
  const rsvpCta = document.getElementById('events-rsvp-cta');
  const rsvpLink = document.getElementById('events-rsvp-link');
  const details = wrap.querySelectorAll('.event-detail');

  if (!validTiers.includes(access)) {
    if (lockedEl) lockedEl.hidden = false;
    if (rsvpCta) rsvpCta.hidden = true;
    details.forEach(el => { el.hidden = true; });
    return;
  }

  if (rsvpCta) rsvpCta.hidden = false;
  if (rsvpLink) {
    const rsvpUrl = new URL('RSVP.html', window.location.href);
    rsvpUrl.searchParams.set('access', access);
    const code = params.get('code');
    if (code) rsvpUrl.searchParams.set('code', code);
    const scope = params.get('scope');
    if (scope && !isEventsPage) rsvpUrl.searchParams.set('scope', scope);
    const source = isEventsPage ? 'events' : params.get('source');
    if (source) rsvpUrl.searchParams.set('source', source);
    rsvpLink.href = rsvpUrl.href;
  }

  details.forEach(el => {
    const tiers = (el.dataset.tier || '').split(',').map(t => t.trim());
    el.hidden = !tiers.includes(access);
  });
})();

/* =========================================================
   RSVP form (RSVP.html)
   ========================================================= */
(function initRsvpForm() {
  const form = document.getElementById('rsvp-form');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code') || '';
  const validTiers = ['all', 'ganesh', 'haldi', 'sangeet', 'wedding'];
  const accessParam = (params.get('access') || '').toLowerCase().trim();
  const scope = (params.get('scope') || '').toLowerCase().trim();
  const source = (params.get('source') || '').toLowerCase().trim();
  const codeParam = code.toLowerCase().trim();
  const access = validTiers.includes(accessParam)
    ? accessParam
    : (validTiers.includes(codeParam) ? codeParam : '');
  const rsvpCard = document.getElementById('rsvp-card');
  const rsvpLocked = document.getElementById('rsvp-access-locked');

  if (!validTiers.includes(access)) {
    if (rsvpCard) rsvpCard.hidden = true;
    if (rsvpLocked) rsvpLocked.hidden = false;
    return;
  }

  const eventOptions = form.querySelectorAll('#event-options [data-tier]');
  const allowedEvents = new Set();

  eventOptions.forEach(option => {
    const tiers = (option.dataset.tier || '').split(',').map(tier => tier.trim());
    const isMehendiScope = scope === 'nov23' && source === 'mehendi';
    const isEventsScope = source === 'events';
    const isInScope = isMehendiScope
      ? option.dataset.date === 'nov23'
      : !isEventsScope || option.dataset.date !== 'nov23';
    const isAllowed = validTiers.includes(access) && tiers.includes(access) && isInScope;
    option.hidden = !isAllowed;
    const input = option.querySelector('input[name="events"]');
    if (input) {
      input.disabled = !isAllowed;
      if (isAllowed) allowedEvents.add(input.value);
    }
  });

  document.getElementById('guest-code').value = code;
  
    const guestCountEl = form.querySelector('#guest-count');
    const guestNamesWrap = document.getElementById('guest-names-wrap');
    const guestNamesList = document.getElementById('guest-names-list');
    const fullNameEl = document.getElementById('full-name');

    function createGuestInputs(count) {
      guestNamesList.innerHTML = '';
      for (let i = 1; i <= count; i++) {
        const row = document.createElement('div');
        row.className = 'guest-name-row';

        const label = document.createElement('label');
        label.htmlFor = `guest-name-${i}`;
        label.textContent = `Guest ${i} full name`;

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `guest-name-${i}`;
        input.name = 'guestNames[]';
        input.required = true;
        input.placeholder = i === 1 ? 'Guest 1 (you)' : `Guest ${i}`;
        if (i === 1 && fullNameEl && fullNameEl.value.trim()) input.value = fullNameEl.value.trim();

        row.appendChild(label);
        row.appendChild(input);
        guestNamesList.appendChild(row);
      }
    }

    function updateGuestNamesVisibility() {
      const count = parseInt(guestCountEl.value, 10) || 1;
      if (count > 1) {
        guestNamesWrap.hidden = false;
        createGuestInputs(count);
      } else {
        guestNamesWrap.hidden = true;
        guestNamesList.innerHTML = '';
      }
    }

    if (guestCountEl) {
      guestCountEl.addEventListener('change', updateGuestNamesVisibility);
      updateGuestNamesVisibility();
    }

    if (fullNameEl) {
      fullNameEl.addEventListener('input', function () {
        const first = document.getElementById('guest-name-1');
        if (first) first.value = fullNameEl.value;
      });
    }

  const statusEl = document.getElementById('form-status');
  const submitBtn = form.querySelector('.submit-btn');
  const attendingInputs = form.querySelectorAll('input[name="attending"]');
  const eventFieldset = form.querySelector('#event-options');

  function setDeclineMode(isDecline) {
    const eventInputs = form.querySelectorAll('input[name="events"]');
    eventInputs.forEach(input => {
      input.disabled = isDecline;
      input.checked = false;
    });

    if (eventFieldset) {
      eventFieldset.style.opacity = isDecline ? '0.55' : '1';
      eventFieldset.style.pointerEvents = isDecline ? 'none' : 'auto';
    }
  }

  attendingInputs.forEach(input => {
    input.addEventListener('change', function () {
      setDeclineMode(this.value === 'No');
    });
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Honeypot check: if this hidden field was filled in, it's a bot.
    // Pretend to succeed so the bot doesn't learn to avoid the check.
    const honeypot = form.querySelector('#website');
    if (honeypot && honeypot.value.trim() !== '') {
      statusEl.textContent = 'Thank you! Your RSVP has been received.';
      form.reset();
      document.getElementById('guest-code').value = code;
      return;
    }

    if (APPS_SCRIPT_URL.includes('PASTE_YOUR')) {
      statusEl.textContent = 'RSVP saving isn\u2019t connected yet \u2014 see README.md to link your Google Sheet.';
      statusEl.classList.add('error');
      return;
    }
    
      // Let native browser validation run for required fields first
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
    
      const attendingSelection = form.querySelector('input[name="attending"]:checked');
      if (attendingSelection && attendingSelection.value === 'No') {
        const selectedEvents = Array.from(form.querySelectorAll('input[name="events"]:checked'));
        if (selectedEvents.length > 0) {
          statusEl.textContent = 'You can leave a message for the couple and submit without selecting any events.';
          statusEl.classList.add('error');
          return;
        }
      } else {
        const selectedEvents = Array.from(form.querySelectorAll('input[name="events"]:checked'));
        const eventsChecked = selectedEvents.filter(input => allowedEvents.has(input.value)).length;
        if (eventsChecked === 0) {
          statusEl.textContent = 'Please select at least one event you will join.';
          statusEl.classList.add('error');
          return;
        }

        if (selectedEvents.some(input => !allowedEvents.has(input.value))) {
          statusEl.textContent = 'Please select only the events available on your invitation.';
          statusEl.classList.add('error');
          return;
        }
      }

    const formData = new FormData(form);
    const events = formData.getAll('events').join(', ');
    // collect guest names from generated inputs if present
    const guestNamesInputs = Array.from(form.querySelectorAll('input[name="guestNames[]"]'));
    const guestNames = guestNamesInputs.length ? guestNamesInputs.map(i => i.value.trim()).filter(Boolean) : (formData.get('guestNames') ? formData.get('guestNames').split(/\r?\n/).map(s => s.trim()).filter(Boolean) : []);

    const payload = {
      guestCode: formData.get('guestCode'),
      website: formData.get('website'),
      fullName: formData.get('fullName'),
      attending: formData.get('attending'),
      guestCount: formData.get('guestCount'),
      events: events,
      meal: formData.get('meal'),
      guestNames: guestNames,
      message: formData.get('message'),
      submittedAt: new Date().toISOString()
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusEl.classList.remove('error');
    statusEl.textContent = '';

    try {
      // Apps Script web apps don't return readable CORS responses in no-cors mode,
      // so we fire the request and treat completion as success.
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      statusEl.textContent = 'Thank you! Your RSVP has been received.';
      form.reset();
      document.getElementById('guest-code').value = code;
      // reset conditional guest names visibility
      try { updateGuestNamesVisibility(); } catch (e) { /* ignore if function not available */ }
    } catch (err) {
      statusEl.textContent = 'Something went wrong. Please try again in a moment.';
      statusEl.classList.add('error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send RSVP';
    }
  });
})();
