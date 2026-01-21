const pointerDot = document.querySelector('.pointer-dot');
const pointerGlow = document.querySelector('.pointer-glow');
const pointerTrail = document.querySelector('.pointer-trail');
const interactiveSelectors = 'a, button, .chip, input, select, label';

const state = {
  data: null,
  bookingType: 'room',
  currentBookingId: null,
  pendingBookingPayload: null,
  activeModal: null,
  guestDetailsUnlocked: false,
};

const els = {
  roomSelect: document.getElementById('roomSelect'),
  floorSelect: document.getElementById('floorSelect'),
  roomLabel: document.getElementById('roomOptionLabel'),
  floorLabel: document.getElementById('floorOptionLabel'),
  summaryList: document.getElementById('summaryList'),
  totalPrice: document.getElementById('totalPrice'),
  depositPrice: document.getElementById('depositPrice'),
  bookingForm: document.getElementById('bookingForm'),
  guestName: document.getElementById('guestName'),
  guestEmail: document.getElementById('guestEmail'),
  guestPhone: document.getElementById('guestPhone'),
  guestDetails: document.getElementById('guestDetails'),
  galleryGrid: document.getElementById('galleryGrid'),
  chips: document.querySelectorAll('.chip'),
  checkInDate: document.getElementById('checkInDate'),
  checkOutDate: document.getElementById('checkOutDate'),
  nightCount: document.getElementById('nightCount'),
  formErrors: document.getElementById('formErrors'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  termsModal: document.getElementById('termsModal'),
  termsAgreeBtn: document.getElementById('termsAgreeBtn')
};

const roomCaps = {
  robusta: { adults: 4, children: 2 },
  arabica: { adults: 3, children: 2 },
  excelsa: { adults: 3, children: 2 },
  liberica: { adults: 3, children: 2 }
};

const floorCaps = {
  ground: { adults: 7, children: 4 },
  top: { adults: 6, children: 4 }
};

const villaCaps = { adults: 13, children: 8 };

/* ---------- Custom cursor ---------- */
if (pointerDot && pointerGlow && pointerTrail) {
  const cursorState = {
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    glowX: window.innerWidth / 2,
    glowY: window.innerHeight / 2,
    trailX: window.innerWidth / 2,
    trailY: window.innerHeight / 2,
    isOverInteractive: false
  };

  document.addEventListener('mousemove', (e) => {
    pointerDot.style.left = `${e.clientX}px`;
    pointerDot.style.top = `${e.clientY}px`;
    cursorState.targetX = e.clientX;
    cursorState.targetY = e.clientY;

    // Check if pointer is over interactive element
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    const isInteractive = elementBelow && (
      elementBelow.matches(interactiveSelectors) ||
      elementBelow.closest(interactiveSelectors)
    );
    cursorState.isOverInteractive = !!isInteractive;
    
    if (isInteractive) {
      pointerGlow.classList.add('active');
    } else {
      pointerGlow.classList.remove('active');
    }
  });

  function animateGlow() {
    cursorState.glowX += (cursorState.targetX - cursorState.glowX) * 0.18;
    cursorState.glowY += (cursorState.targetY - cursorState.glowY) * 0.18;
    cursorState.trailX += (cursorState.targetX - cursorState.trailX) * 0.08;
    cursorState.trailY += (cursorState.targetY - cursorState.trailY) * 0.08;
    pointerGlow.style.left = `${cursorState.glowX}px`;
    pointerGlow.style.top = `${cursorState.glowY}px`;
    pointerTrail.style.left = `${cursorState.trailX}px`;
    pointerTrail.style.top = `${cursorState.trailY}px`;
    requestAnimationFrame(animateGlow);
  }

  animateGlow();
}

/* ---------- Helpers ---------- */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getStayDateStrings() {
  const dates = [];
  const checkInValue = els.checkInDate.value;
  if (!checkInValue) {
    return dates;
  }
  const checkIn = new Date(checkInValue);
  if (!Number.isFinite(checkIn.getTime())) {
    return dates;
  }
  const nights = getNights();
  for (let i = 0; i < nights; i += 1) {
    const day = new Date(checkIn);
    day.setDate(day.getDate() + i);
    dates.push(formatDate(day));
  }
  return dates;
}

function getBaseRate(selectionType, selectionId) {
  if (!state.data) return 0;
  if (selectionType === 'room') {
    return state.data.prices?.[selectionId] || 0;
  }
  if (selectionType === 'floor') {
    return state.data.floorPrices?.[selectionId] || 0;
  }
  return state.data.floorPrices?.villa || 0;
}

function getOverrideRate(selectionType, selectionId, date) {
  if (!state.data?.priceOverrides?.length) {
    return null;
  }
  const match = state.data.priceOverrides.find(
    (entry) => entry.targetType === selectionType && entry.targetId === selectionId && entry.date === date
  );
  return match ? Number(match.price) : null;
}

function getNightlyRate(selectionType, selectionId, date) {
  const override = getOverrideRate(selectionType, selectionId, date);
  const base = getBaseRate(selectionType, selectionId);
  return Number.isFinite(override) && override > 0 ? override : base;
}

function setDateLimits() {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);

  els.checkInDate.min = formatDate(today);
  els.checkInDate.max = formatDate(maxDate);
  els.checkInDate.value = els.checkInDate.value || formatDate(today);

  const minCheckout = new Date(els.checkInDate.value);
  minCheckout.setDate(minCheckout.getDate() + 1);

  els.checkOutDate.min = formatDate(minCheckout);
  els.checkOutDate.max = formatDate(maxDate);
  if (!els.checkOutDate.value || new Date(els.checkOutDate.value) <= minCheckout) {
    els.checkOutDate.value = formatDate(minCheckout);
  }
}

function getNights() {
  const checkIn = new Date(els.checkInDate.value);
  const checkOut = new Date(els.checkOutDate.value);
  const diff = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
  return Number.isFinite(diff) && diff > 0 ? Math.round(diff) : 1;
}

function updateNightDisplay() {
  const nights = getNights();
  els.nightCount.textContent = `${nights} night${nights > 1 ? 's' : ''}`;
}

function buildActivitiesTotal() {
  if (!state.data) return 0;
  const rates = state.data.activityRates;
  const pool = Number(document.getElementById('poolCount').value || 0) * rates.pool;
  const safari = Number(document.getElementById('safariCount').value || 0) * rates.safari;
  const fishing = Number(document.getElementById('fishingCount').value || 0) * rates.fishing;
  return pool + safari + fishing;
}

function calculateAmounts() {
  if (!state.data) return { base: 0, activities: 0, total: 0, deposit: 0 };
  const nights = getNights();
  const selectionType =
    state.bookingType === 'room' ? 'room' : state.bookingType === 'floor' ? 'floor' : 'villa';
  const selectionId =
    selectionType === 'room'
      ? els.roomSelect.value
      : selectionType === 'floor'
      ? els.floorSelect.value
      : 'villa';
  const nightlyDates = getStayDateStrings();
  let base = 0;
  if (nightlyDates.length) {
    base = nightlyDates.reduce(
      (sum, date) => sum + getNightlyRate(selectionType, selectionId, date),
      0
    );
  } else {
    base = getBaseRate(selectionType, selectionId) * nights;
  }

  const activities = buildActivitiesTotal();
  const total = base + activities;
  const deposit = Math.round(total * 0.25);
  return { base, activities, total, deposit };
}

function validateGuestCounts() {
  const adults = Number(document.getElementById('adultCount').value) || 0;
  const children = Number(document.getElementById('childCount').value) || 0;

  if (state.bookingType === 'room') {
    const caps = roomCaps[els.roomSelect.value];
    if (adults > caps.adults || children > caps.children) {
      return {
        valid: false,
        message: `This room allows ${caps.adults} adults & ${caps.children} children max.`
      };
    }
  }

  if (state.bookingType === 'floor') {
    const caps = floorCaps[els.floorSelect.value];
    if (adults > caps.adults || children > caps.children) {
      return {
        valid: false,
        message: `This floor allows ${caps.adults} adults & ${caps.children} children max.`
      };
    }
  }

  if (state.bookingType === 'villa') {
    if (adults > villaCaps.adults || children > villaCaps.children) {
      return {
        valid: false,
        message: 'Entire villa allows up to 13 adults & 8 children.'
      };
    }
  }

  return { valid: true };
}

function showFormError(message) {
  els.formErrors.classList.remove('hidden');
  els.formErrors.textContent = message;
}

function clearFormErrors() {
  els.formErrors.classList.add('hidden');
  els.formErrors.textContent = '';
}

function updateSummary() {
  clearFormErrors();
  const { activities, total, deposit } = calculateAmounts();
  const nights = getNights();
  const adults = Number(document.getElementById('adultCount').value) || 0;
  const children = Number(document.getElementById('childCount').value) || 0;
  const selection =
    state.bookingType === 'room'
      ? els.roomSelect.options[els.roomSelect.selectedIndex].text
      : state.bookingType === 'floor'
      ? els.floorSelect.options[els.floorSelect.selectedIndex].text
      : 'Entire Villa';

  els.summaryList.innerHTML = `
    <li>${selection}</li>
    <li>${els.checkInDate.value} → ${els.checkOutDate.value} (${nights} night${
      nights > 1 ? 's' : ''
    })</li>
    <li>${adults} adult(s), ${children} child(ren)</li>
    <li>Activities: ₹${activities}</li>
  `;
  els.totalPrice.textContent = `₹${total.toLocaleString()}`;
  els.depositPrice.textContent = `₹${deposit.toLocaleString()}`;

  const caps = validateGuestCounts();
  if (!caps.valid) {
    showFormError(caps.message);
  }
}

function switchBookingType(type) {
  state.bookingType = type;
  els.chips.forEach((chip) => chip.classList.toggle('active', chip.dataset.type === type));
  if (type === 'room') {
    els.roomSelect.classList.remove('hidden');
    els.roomLabel.classList.remove('hidden');
    els.floorSelect.classList.add('hidden');
    els.floorLabel.classList.add('hidden');
  } else if (type === 'floor') {
    els.roomSelect.classList.add('hidden');
    els.roomLabel.classList.add('hidden');
    els.floorSelect.classList.remove('hidden');
    els.floorLabel.classList.remove('hidden');
  } else {
    els.roomSelect.classList.add('hidden');
    els.roomLabel.classList.add('hidden');
    els.floorSelect.classList.add('hidden');
    els.floorLabel.classList.add('hidden');
  }
  updateSummary();
}

function handleRoomCardClick(card) {
  const room = card.dataset.room;
  switchBookingType('room');
  els.roomSelect.value = room;
  updateSummary();
  document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
}

async function fetchState() {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error('Failed to load state');
  state.data = await res.json();
  renderGallery();
  updateSummary();
}

function renderGallery() {
  if (!state.data) return;
  els.galleryGrid.innerHTML = state.data.gallery
    .map(
      (src) => `
      <figure>
        <img src="${src}" alt="Room interior" loading="lazy">
      </figure>
    `
    )
    .join('');
}

async function loadReviewsForIndex() {
  const reviewsGrid = document.getElementById('reviewsGridIndex');
  if (!reviewsGrid) return;
  try {
    const res = await fetch('/api/reviews');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error();
    // Show only first 3 reviews on index page
    const reviewsToShow = data.slice(0, 3);
    reviewsGrid.innerHTML = reviewsToShow
      .map(
        (review) => `
        <article class="review-card">
          <h3>${review.source}</h3>
          <p class="rating">${review.rating.toFixed(1)} ★</p>
          <p>${review.text}</p>
          <small>— ${review.author}, ${new Date(review.date).toLocaleDateString()}</small>
        </article>
      `
      )
      .join('');
  } catch (err) {
    reviewsGrid.innerHTML = '<p>Unable to load reviews right now.</p>';
  }
}

function loadSavedGuestDetails() {
  const saved = JSON.parse(localStorage.getItem('guestCredentials') || '{}');
  if (saved.name) els.guestName.value = saved.name;
  if (saved.email) els.guestEmail.value = saved.email;
  if (saved.phone) els.guestPhone.value = saved.phone;
}

function saveGuestDetails(payload) {
  localStorage.setItem(
    'guestCredentials',
    JSON.stringify({ name: payload.name, email: payload.email, phone: payload.phone })
  );
  // Also save full booking payload for checkout.html retry scenarios
  if (payload) {
    localStorage.setItem('pendingBookingPayload', JSON.stringify(payload));
  }
}

/* ---------- Modal handling ---------- */
function openModal(modal) {
  if (!modal) {
    console.error('Modal element is null');
    alert('Error: Modal not found. Please refresh the page.');
    return;
  }
  console.log('Opening modal:', modal.id);
  closeActiveModal();
  state.activeModal = modal;

  // Remove hidden class and force display
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  modal.style.visibility = 'visible';
  modal.style.pointerEvents = 'auto';
  modal.style.zIndex = '10000';

  // Show backdrop
  if (els.modalBackdrop) {
    els.modalBackdrop.classList.remove('hidden');
    els.modalBackdrop.classList.add('active');
    els.modalBackdrop.style.display = 'block';
    els.modalBackdrop.style.visibility = 'visible';
    els.modalBackdrop.style.opacity = '1';
  } else {
    console.error('Modal backdrop not found');
  }

  console.log('Modal opened, display:', modal.style.display, 'visibility:', modal.style.visibility);
}

// closeActiveModal is defined after QR scanner code

els.modalBackdrop?.addEventListener('click', closeActiveModal);
document.querySelectorAll('[data-close-modal]').forEach((btn) => {
  btn.addEventListener('click', closeActiveModal);
});

/* ---------- Booking flow ---------- */
function buildBookingPayload() {
  clearFormErrors();

  if (!state.guestDetailsUnlocked) {
    ensureGuestDetailsVisible();
    showFormError('Please share your name, email, and phone to continue.');
    return null;
  }
  if (!els.bookingForm.reportValidity()) {
    return null;
  }

  const caps = validateGuestCounts();
  if (!caps.valid) {
    showFormError(caps.message);
    return null;
  }

  const { total, deposit } = calculateAmounts();
  if (total <= 0) {
    showFormError('Please choose valid dates and booking details.');
    return null;
  }

  return {
    name: els.guestName.value.trim(),
    email: els.guestEmail.value.trim().toLowerCase(),
    phone: els.guestPhone.value.trim(),
    selectionType: state.bookingType,
    selectionId:
      state.bookingType === 'room'
        ? els.roomSelect.value
        : state.bookingType === 'floor'
        ? els.floorSelect.value
        : 'villa',
    checkInDate: els.checkInDate.value,
    checkOutDate: els.checkOutDate.value,
    nights: getNights(),
    adults: Number(document.getElementById('adultCount').value) || 0,
    children: Number(document.getElementById('childCount').value) || 0,
    activities: {
      pool: Number(document.getElementById('poolCount').value || 0),
      safari: Number(document.getElementById('safariCount').value || 0),
      fishing: Number(document.getElementById('fishingCount').value || 0)
    },
    total,
    deposit
  };
}

els.bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  console.log('Form submitted');
  clearFormErrors();
  
  // Show guest details when user proceeds to book
  showGuestDetailsOnReserve();
  
  // Validate guest details are filled
  if (!els.guestName || !els.guestEmail || !els.guestPhone) {
    console.error('Guest input elements not found');
    showFormError('Error: Form elements not found. Please refresh the page.');
    return;
  }
  
  if (!els.guestName.value.trim() || !els.guestEmail.value.trim() || !els.guestPhone.value.trim()) {
    showFormError('Please fill in your name, email, and phone number to continue.');
    if (els.guestDetails) {
      els.guestDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (!els.guestName.value.trim()) {
      els.guestName.focus();
    } else if (!els.guestEmail.value.trim()) {
      els.guestEmail.focus();
    } else {
      els.guestPhone.focus();
    }
    return;
  }
  
  // Validate form
  if (!els.bookingForm.reportValidity()) {
    console.log('Form validation failed');
    return;
  }
  
  // Validate guest counts
  const caps = validateGuestCounts();
  if (!caps.valid) {
    showFormError(caps.message);
    return;
  }
  
  // Calculate amounts
  const { total, deposit } = calculateAmounts();
  if (total <= 0) {
    showFormError('Please choose valid dates and booking details.');
    return;
  }
  
  // Build payload
  state.pendingBookingPayload = {
    name: els.guestName.value.trim(),
    email: els.guestEmail.value.trim().toLowerCase(),
    phone: els.guestPhone.value.trim(),
    selectionType: state.bookingType,
    selectionId:
      state.bookingType === 'room'
        ? els.roomSelect.value
        : state.bookingType === 'floor'
        ? els.floorSelect.value
        : 'villa',
    checkInDate: els.checkInDate.value,
    checkOutDate: els.checkOutDate.value,
    nights: getNights(),
    adults: Number(document.getElementById('adultCount').value) || 0,
    children: Number(document.getElementById('childCount').value) || 0,
    activities: {
      pool: Number(document.getElementById('poolCount').value || 0),
      safari: Number(document.getElementById('safariCount').value || 0),
      fishing: Number(document.getElementById('fishingCount').value || 0)
    },
    total,
    deposit
  };
  
  console.log('Payload built, opening terms modal');
  console.log('Terms modal element:', els.termsModal);
  
  // Show terms modal
  if (els.termsModal) {
    openModal(els.termsModal);
  } else {
    console.error('Terms modal not found');
    alert('Error: Terms modal not found. Please refresh the page.');
    showFormError('Error: Terms modal not found. Please refresh the page.');
  }
});

async function createBooking() {
  if (!state.pendingBookingPayload) return;
  
  // Prevent double submit
  const submitBtn = els.termsAgreeBtn;
  if (submitBtn && submitBtn.disabled) return;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
  }
  
  try {
    if (!state.data) await fetchState();
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.pendingBookingPayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Booking failed');
    state.currentBookingId = data.booking.id;
    
    // Show loading state
    if (submitBtn) submitBtn.textContent = 'Creating payment...';
    
    const orderRes = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        bookingId: data.booking.id, 
        amountRs: state.pendingBookingPayload.deposit, // Send in RUPEES only
        deposit_rupees: state.pendingBookingPayload.deposit
      })
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(orderData.message || 'Payment order failed');
    
    // Show redirecting state
    if (submitBtn) submitBtn.textContent = 'Redirecting to payment...';
    
    // Open Cashfree Checkout
    const checkoutOptions = {
      paymentSessionId: orderData.payment_session_id,
      returnUrl: `${window.location.origin}/checkout.html?order_id=${orderData.orderId || state.currentBookingId}`
    };
    
    // Load Cashfree Checkout script dynamically
    if (!window.Cashfree) {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = () => {
        openCashfreeCheckout(orderData, checkoutOptions);
      };
      document.head.appendChild(script);
    } else {
      openCashfreeCheckout(orderData, checkoutOptions);
    }
    
    function openCashfreeCheckout(orderData, options) {
      const cashfree = Cashfree({
        mode: 'sandbox' // Use 'production' in production
      });
      
      cashfree.checkout({
        paymentSessionId: options.paymentSessionId,
        redirectTarget: '_self'
      });
    }
    
    saveGuestDetails(state.pendingBookingPayload);
    closeActiveModal();
  } catch (err) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'I Agree & Continue';
    }
    closeActiveModal();
    showFormError(err.message);
  }
}

if (els.termsAgreeBtn) {
  els.termsAgreeBtn.addEventListener('click', createBooking);
} else {
  console.error('Terms agree button not found');
}

function closeActiveModal() {
  if (state.activeModal) {
    state.activeModal.classList.add('hidden');
    state.activeModal.style.display = 'none';
    state.activeModal.style.visibility = 'hidden';
  }
  state.activeModal = null;
  if (els.modalBackdrop) {
    els.modalBackdrop.classList.add('hidden');
    els.modalBackdrop.classList.remove('active');
  }
}

/* ---------- Events ---------- */
els.chips.forEach((chip) => chip.addEventListener('click', () => switchBookingType(chip.dataset.type)));

document.querySelectorAll('#bookingForm input, #bookingForm select').forEach((el) => {
  el.addEventListener('input', () => {
    if (el === els.checkInDate || el === els.checkOutDate) {
      setDateLimits();
      updateNightDisplay();
    }
    updateSummary();
  });
  el.addEventListener('change', () => {
    if (el === els.checkInDate || el === els.checkOutDate) {
      setDateLimits();
      updateNightDisplay();
    }
    updateSummary();
  });
});

document.querySelectorAll('.room-card').forEach((card) => {
  card.addEventListener('click', () => handleRoomCardClick(card));
});

function ensureGuestDetailsVisible() {
  if (state.guestDetailsUnlocked) return;
  state.guestDetailsUnlocked = true;
  els.guestDetails?.classList.remove('hidden');
}

// Only show guest details when proceeding to book (on Reserve button click)
function setGuestFieldRequirements(enabled) {
  ['guestName', 'guestEmail', 'guestPhone'].forEach((key) => {
    if (els[key]) {
      els[key].required = enabled;
    }
  });
}

// Set guest fields as not required until unlocked
setGuestFieldRequirements(false);

function showGuestDetailsOnReserve() {
  if (!state.guestDetailsUnlocked) {
    state.guestDetailsUnlocked = true;
    if (els.guestDetails) {
      els.guestDetails.classList.remove('hidden');
      els.guestDetails.style.display = 'block';
      els.guestDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      console.error('Guest details element not found');
    }
    setGuestFieldRequirements(true);
  }
}

/* ---------- Init ---------- */
// Verify all critical elements are found
function verifyElements() {
  const critical = ['bookingForm', 'termsModal', 'guestDetails', 'guestName', 'guestEmail', 'guestPhone', 'termsAgreeBtn'];
  const missing = [];
  critical.forEach(key => {
    if (!els[key]) {
      missing.push(key);
    }
  });
  if (missing.length > 0) {
    console.error('Missing elements:', missing);
    alert('Error: Some form elements are missing. Please refresh the page.\nMissing: ' + missing.join(', '));
  } else {
    console.log('All critical elements found');
  }
}

document.getElementById('year').textContent = new Date().getFullYear();
setDateLimits();
updateNightDisplay();
loadSavedGuestDetails();
verifyElements();
fetchState().catch((err) => console.error(err));
loadReviewsForIndex();

