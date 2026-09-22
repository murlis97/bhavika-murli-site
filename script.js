/* =========================================================
   1. PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
   (see README.md for step-by-step setup instructions)
   ========================================================= */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyz3duv0Yodpz9PFKKUdyqD-N4R0ZFMVTQYQl_aJMOIA3VDE_8iu7_WZuS4FdHT6Sra/exec";

async function findGuestByCode(rawCode) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return null;

  const response = await fetch('guest-codes.csv', { cache: 'no-store' });
  if (!response.ok) return null;

  const rows = (await response.text()).split(/\r?\n/).filter(Boolean);
  rows.shift();
  const match = rows.find(row => {
    const [csvCode] = row.split(',').map(part => part.trim());
    return csvCode && csvCode.toUpperCase() === code;
  });
  if (!match) return null;

  const [, page, access] = match.split(',').map(part => part.trim());
  return page && access ? { code, page, access: access.toLowerCase() } : null;
}

async function initGuestRedirectFromCsv() {
  const params = new URLSearchParams(window.location.search);
  const rawCode = (params.get('code') || '').trim();
  if (!rawCode) return;
  if (params.has('selected')) return;

  const code = rawCode.toUpperCase();
  const currentUrl = new URL(window.location.href);

  try {
    const guest = await findGuestByCode(code);
    if (!guest) return;

    const targetUrl = new URL(`${guest.page}?access=${encodeURIComponent(guest.access)}&code=${encodeURIComponent(guest.code)}`, currentUrl.href);
    const alreadyAtTarget = currentUrl.pathname.endsWith(`/${guest.page}`)
      && currentUrl.searchParams.get('access') === guest.access
      && currentUrl.searchParams.get('code')?.toUpperCase() === guest.code;

    if (!alreadyAtTarget) {
      window.location.replace(targetUrl.href);
    }
  } catch (error) {
    console.warn('Guest redirect CSV could not be loaded:', error);
  }
}

initGuestRedirectFromCsv();

(function initMobileNavigation() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const navigation = document.querySelector('.site-nav');
  if (!header || !toggle || !navigation) return;

  function setNavigationOpen(isOpen) {
    header.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.textContent = isOpen ? 'Close' : 'Menu';
  }

  toggle.addEventListener('click', function () {
    setNavigationOpen(!header.classList.contains('is-open'));
  });

  navigation.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setNavigationOpen(false));
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setNavigationOpen(false);
  });

  window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
    if (event.matches) setNavigationOpen(false);
  });
})();

(function initGuestRsvpEntry() {
  const form = document.getElementById('guest-rsvp-form');
  if (!form) return;

  const codeInput = document.getElementById('guest-access-code');
  const status = document.getElementById('guest-rsvp-status');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const code = codeInput.value.trim();
    status.textContent = 'Checking your invitation code...';
    status.classList.remove('error');

    try {
      const guest = await findGuestByCode(code);
      if (!guest) {
        status.textContent = 'That invitation code was not found. Please check it and try again.';
        status.classList.add('error');
        return;
      }

      const rsvpUrl = new URL('rsvp-main.html', window.location.href);
      rsvpUrl.searchParams.set('access', guest.access);
      rsvpUrl.searchParams.set('code', guest.code);
      window.location.assign(rsvpUrl.href);
    } catch (error) {
      status.textContent = 'We could not verify your code right now. Please try again.';
      status.classList.add('error');
    }
  });
})();

/* =========================================================
   Invitation page schedule — show private events only for access=all
   ========================================================= */
(function initIndexSchedule() {
  const eventList = document.querySelector('.event-list');
  if (!eventList) return;

  const access = new URLSearchParams(window.location.search).get('access');
  if (access === 'all') {
    eventList.querySelectorAll('[data-access-all-only]').forEach(event => {
      event.hidden = false;
    });
  }
})();

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
  Usage: events.html?access=stay|mehndi|haldi|sangeet|wedding
   ========================================================= */
(function initEventsAccess() {
  const wrap = document.getElementById('events-wrap');
  if (!wrap) return;

  const params = new URLSearchParams(window.location.search);
  const access = (params.get('access') || '').toLowerCase().trim();
  const validTiers = ['stay', 'mehndi', 'haldi', 'sangeet', 'wedding'];
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
  const selectedParam = params.get('selected');
  const selectedEvents = selectedParam
    ? new Set(selectedParam.split(',').map(event => event.trim()).filter(Boolean))
    : null;

  if (!validTiers.includes(access)) {
    if (lockedEl) lockedEl.hidden = false;
    if (rsvpCta) rsvpCta.hidden = true;
    details.forEach(el => { el.hidden = true; });
    return;
  }

  if (rsvpCta) rsvpCta.hidden = false;
  if (rsvpLink) {
    const rsvpUrl = new URL('rsvp-main.html', window.location.href);
    rsvpUrl.searchParams.set('access', access);
    const code = params.get('code');
    if (code) rsvpUrl.searchParams.set('code', code);
    rsvpLink.href = rsvpUrl.href;
  }

  details.forEach(el => {
    const tiers = (el.dataset.tier || '').split(',').map(t => t.trim());
    const isSelected = !selectedEvents || selectedEvents.has(el.dataset.event);
    el.hidden = !tiers.includes(access) || !isSelected;
  });
})();

/* =========================================================
   RSVP form (RSVP.html)
   ========================================================= */
(async function initRsvpForm() {
  const form = document.getElementById('rsvp-form');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code') || '';
  const validTiers = ['stay', 'mehndi', 'haldi', 'sangeet', 'wedding'];
  const accessParam = (params.get('access') || '').toLowerCase().trim();
  const codeParam = code.toLowerCase().trim();
  const access = validTiers.includes(accessParam)
    ? accessParam
    : (validTiers.includes(codeParam) ? codeParam : '');
  const rsvpCard = document.getElementById('rsvp-card');
  const rsvpLocked = document.getElementById('rsvp-access-locked');
  const rsvpVenue = document.getElementById('event-venue');
  let guest;

  try {
    guest = await findGuestByCode(code);
  } catch (error) {
    guest = null;
  }

  const hasValidGuestAccess = guest
    && guest.access === accessParam
    && guest.page === 'rsvp-main.html';

  if (!validTiers.includes(access) || !hasValidGuestAccess) {
    if (rsvpCard) rsvpCard.hidden = true;
    if (rsvpVenue) rsvpVenue.hidden = true;
    if (rsvpLocked) rsvpLocked.hidden = false;
    return;
  }

  if (rsvpLocked) rsvpLocked.hidden = true;
  if (rsvpCard) rsvpCard.hidden = false;
  if (rsvpVenue) rsvpVenue.hidden = false;

  const eventOptions = form.querySelectorAll('#event-options [data-tier]');
  const allowedEvents = new Set();
  const eventAccessNote = document.getElementById('event-access-note');
  const selectAllCheckbox = document.getElementById('select-all-events');

  const allowedEventMap = {
    stay: [
      'Mehndi',
      'Tilak',
      'Ganesh Sthapna & Tel Bukki',
      'Ganesh Pooja & Vansh Ropan',
      'Haldi',
      'Sangeet',
      'Baraat & Wedding Ceremony'
    ],
    mehndi: [
      'Mehndi',
      'Tilak',
      'Haldi',
      'Sangeet',
      'Baraat & Wedding Ceremony'
    ],
    haldi: [
      'Haldi',
      'Sangeet',
      'Baraat & Wedding Ceremony'
    ],
    sangeet: [
      'Sangeet',
      'Baraat & Wedding Ceremony'
    ],
    wedding: [
      'Baraat & Wedding Ceremony'
    ]
  };

  if (access === 'stay' && eventAccessNote) {
    eventAccessNote.hidden = false;
  }

  function getActiveEventInputs() {
    return Array.from(form.querySelectorAll('#event-options input[name="events"]')).filter(input => {
      const row = input.closest('.checkbox-row');
      return !input.disabled && (!row || !row.hidden);
    });
  }

  function syncSelectAllState() {
    if (!selectAllCheckbox) return;

    const enabledInputs = getActiveEventInputs();
    const checkedCount = enabledInputs.filter(input => input.checked).length;

    selectAllCheckbox.checked = enabledInputs.length > 0 && checkedCount === enabledInputs.length;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < enabledInputs.length;
  }

  const allowedSet = new Set(allowedEventMap[access] || []);

  eventOptions.forEach(option => {
    const input = option.querySelector('input[name="events"]');
    const isAllowed = input && allowedSet.has(input.value);
    option.hidden = !isAllowed;
    if (input) {
      input.disabled = !isAllowed;
      if (isAllowed) allowedEvents.add(input.value);
      input.addEventListener('change', syncSelectAllState);
    }
  });

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function () {
      const enabledInputs = getActiveEventInputs();
      enabledInputs.forEach(input => {
        input.checked = selectAllCheckbox.checked;
      });
      syncSelectAllState();
    });
  }

  Array.from(form.querySelectorAll('#event-options input[name="events"]')).forEach(input => {
    if (input.disabled) {
      input.checked = false;
    }
  });

  syncSelectAllState();

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

    if (selectAllCheckbox) {
      selectAllCheckbox.disabled = isDecline;
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    }

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
    
    // Let native browser validation run for required fields first
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
      const attendingSelection = form.querySelector('input[name="attending"]:checked');
      const selectedEvents = Array.from(
        form.querySelectorAll('#event-options input[name="events"]:checked')
      ).filter(input => {
        const row = input.closest('.checkbox-row');
        return !input.disabled && (!row || !row.hidden);
      });

      if (attendingSelection && attendingSelection.value === 'No') {
        if (selectedEvents.length > 0) {
          statusEl.textContent = 'You can leave a message for the couple and submit without selecting any events.';
          statusEl.classList.add('error');
          return;
        }
      } else {
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
    const guestNames = guestNamesInputs.length ? guestNamesInputs.map(i => i.value.trim()).filter(Boolean) : [];
    const guestNamesString = guestNames.join(', ');

    const payload = {
      guestCode: formData.get('guestCode'),
      website: formData.get('website'),
      websiteUrl: new URL('index.html', window.location.href).href,
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      attending: formData.get('attending'),
      guestCount: formData.get('guestCount'),
      events: events,
      meal: formData.get('meal'),
      guestNames: guestNamesString,
      message: formData.get('message'),
      submittedAt: new Date().toISOString()
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusEl.classList.remove('error');
    statusEl.textContent = '';

    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE')) {
      statusEl.textContent = 'The RSVP backend is not configured yet. Paste your Google Apps Script web app URL into script.js.';
      statusEl.classList.add('error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send RSVP';
      return;
    }

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let result = {};
      const text = await response.text();
      console.error('RSVP submission response:', {
        status: response.status,
        statusText: response.statusText,
        body: text
      });

      if (text) {
        try {
          result = JSON.parse(text);
        } catch (error) {
          result = { result: 'unknown' };
        }
      }

      if (!response.ok || result.result === 'rejected' || result.result === 'ignored') {
        const reason = response.status ? ` (HTTP ${response.status})` : '';
        statusEl.textContent = `Your RSVP could not be submitted${reason}. The server rejected the request or blocked the POST.`;
        statusEl.classList.add('error');
        return;
      }

      statusEl.textContent = 'Thank you! Your RSVP has been received.';
      if (attendingSelection && attendingSelection.value === 'Yes') {
        const eventsUrl = new URL('events.html', window.location.href);
        eventsUrl.searchParams.set('access', access);
        eventsUrl.searchParams.set('code', code);
        eventsUrl.searchParams.set('selected', events);
        window.location.assign(eventsUrl.href);
        return;
      }
      form.reset();
      document.getElementById('guest-code').value = code;
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
