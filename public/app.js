// ============================================================================
// CONFIG & CONSTANTS
// ============================================================================
const API_BASE_URL = "http://localhost:4000/api";
const RAZORPAY_KEY_ID = "rzp_live_S8OxnCgzgl8m8L";

// Villa pricing data (fetched from backend)
let villaPricing = null;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Parse date to midnight local time
function parseDateOnly(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Calculate number of nights between dates
function calculateNights(checkIn, checkOut) {
  const diffTime = checkOut - checkIn;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Format date to YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ============================================================================
// API CALLS
// ============================================================================

// Fetch villa pricing data
async function fetchVillaPricing() {
  try {
    const response = await fetch(`${API_BASE_URL}/villa/pricing`);
    if (!response.ok) throw new Error("Failed to fetch pricing");
    const data = await response.json();
    villaPricing = data;
    return data;
  } catch (error) {
    console.error("Error fetching pricing:", error);
    showError("Failed to load pricing information. Please refresh the page.");
    return null;
  }
}

// Fetch booked dates for visual calendar
async function fetchBookedDates(
  targetType,
  roomId,
  floorId,
  startDate,
  endDate,
) {
  try {
    const params = new URLSearchParams({
      targetType,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    });

    if (targetType === "room" && roomId) params.append("roomId", roomId);
    if (targetType === "floor" && floorId) params.append("floorId", floorId);

    const response = await fetch(
      `${API_BASE_URL}/booking/booked-dates?${params.toString()}`,
    );

    if (!response.ok) throw new Error("Failed to fetch booked dates");

    const data = await response.json();
    return data.bookedRanges || [];
  } catch (error) {
    console.error("Error fetching booked dates:", error);
    return [];
  }
}

// Check date availability
async function checkAvailability(
  checkIn,
  checkOut,
  targetType,
  roomId,
  floorId,
) {
  try {
    const body = {
      checkIn: formatDate(checkIn),
      checkOut: formatDate(checkOut),
      targetType,
    };

    if (targetType === "room" && roomId) body.roomId = roomId;
    if (targetType === "floor" && floorId) body.floorId = floorId;

    const response = await fetch(`${API_BASE_URL}/booking/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return {
      available: response.ok,
      message: data.message,
    };
  } catch (error) {
    console.error("Error checking availability:", error);
    return {
      available: false,
      message: "Failed to check availability",
    };
  }
}

// Create booking
async function createBooking(bookingData) {
  try {
    const response = await fetch(`${API_BASE_URL}/booking/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Booking failed");
    }

    return data;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
}

// ============================================================================
// PRICE CALCULATION (ESTIMATE ONLY - Backend calculates actual price)
// ============================================================================

function calculateEstimatedPrice(targetType, roomId, floorId, nights) {
  if (!villaPricing) return 0;

  let pricePerNight = 0;

  if (targetType === "villa") {
    pricePerNight = villaPricing.price;
  } else if (targetType === "floor") {
    const floor = villaPricing.floors.find((f) => f.floorId === floorId);
    pricePerNight = floor ? floor.price : 0;
  } else if (targetType === "room") {
    for (const floor of villaPricing.floors) {
      const room = floor.rooms.find((r) => r.roomId === roomId);
      if (room) {
        pricePerNight = room.price;
        break;
      }
    }
  }

  return pricePerNight * nights;
}

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const bookingForm = document.getElementById("bookingForm");
const guestDetailsFieldset = document.getElementById("guestDetails");
const guestNameInput = document.getElementById("guestName");
const guestEmailInput = document.getElementById("guestEmail");
const guestPhoneInput = document.getElementById("guestPhone");

const bookingTypeChips = document.querySelectorAll(".chip[data-type]");
const roomSelect = document.getElementById("roomSelect");
const floorSelect = document.getElementById("floorSelect");
const roomOptionLabel = document.getElementById("roomOptionLabel");
const floorOptionLabel = document.getElementById("floorOptionLabel");

const checkInInput = document.getElementById("checkInDate");
const checkOutInput = document.getElementById("checkOutDate");
const nightCountDisplay = document.getElementById("nightCount");

const adultCountInput = document.getElementById("adultCount");
const childCountInput = document.getElementById("childCount");

const summaryList = document.getElementById("summaryList");
const totalPriceDisplay = document.getElementById("totalPrice");
const depositPriceDisplay = document.getElementById("depositPrice");
const formErrors = document.getElementById("formErrors");

const termsModal = document.getElementById("termsModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const termsAgreeBtn = document.getElementById("termsAgreeBtn");
const modalCloseBtn = document.querySelector("[data-close-modal]");

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let currentBookingType = "room";
let currentRoomId = "R1"; // Maps to 'robusta'
let currentFloorId = "F1";
let pendingBookingData = null;
let bookedDateRanges = []; // Store booked dates for current selection
let availabilityCheckTimeout = null; // Debounce availability checks

// Room name to ID mapping
const roomNameToId = {
  robusta: "R1",
  arabica: "R2",
  excelsa: "R3",
  liberica: "R4",
};

const floorNameToId = {
  ground: "F1",
  top: "F2",
};

// ============================================================================
// AVAILABILITY CALENDAR FUNCTIONS
// ============================================================================

// Check if a date falls within any booked range
function isDateBooked(date) {
  const checkDate = formatDate(date);

  return bookedDateRanges.some((range) => {
    const rangeStart = range.checkIn;
    const rangeEnd = range.checkOut;
    return checkDate >= rangeStart && checkDate < rangeEnd;
  });
}

// Update booked dates based on current selection
async function updateBookedDates() {
  const today = new Date();
  const threeMonthsLater = new Date(today);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

  bookedDateRanges = await fetchBookedDates(
    currentBookingType,
    currentRoomId,
    currentFloorId,
    today,
    threeMonthsLater,
  );

  // Update date inputs to reflect availability
  updateDateInputConstraints();
}

// Disable booked dates in date inputs
function updateDateInputConstraints() {
  // Note: HTML5 date inputs don't support disabling specific dates
  // We'll add visual feedback and validation instead
  // For full calendar UI, we'd need a calendar library
}

// Real-time availability check with debouncing
function scheduleAvailabilityCheck() {
  clearTimeout(availabilityCheckTimeout);

  availabilityCheckTimeout = setTimeout(async () => {
    const checkIn = checkInInput.value
      ? parseDateOnly(checkInInput.value)
      : null;
    const checkOut = checkOutInput.value
      ? parseDateOnly(checkOutInput.value)
      : null;

    if (!checkIn || !checkOut || checkOut <= checkIn) {
      hideAvailabilityStatus();
      return;
    }

    // Show loading state
    showAvailabilityLoading();

    const availability = await checkAvailability(
      checkIn,
      checkOut,
      currentBookingType,
      currentRoomId,
      currentFloorId,
    );

    if (availability.available) {
      showAvailabilitySuccess();
    } else {
      showAvailabilityError(availability.message);
    }
  }, 500); // Wait 500ms after user stops typing
}

function showAvailabilityLoading() {
  const indicator = document.getElementById("availabilityIndicator");
  if (indicator) {
    indicator.className = "availability-indicator loading";
    indicator.innerHTML =
      '<span class="spinner">⏳</span> Checking availability...';
  }
}

function showAvailabilitySuccess() {
  const indicator = document.getElementById("availabilityIndicator");
  if (indicator) {
    indicator.className = "availability-indicator success";
    indicator.innerHTML = '<span class="check">✓</span> Dates available!';
  }
}

function showAvailabilityError(message) {
  const indicator = document.getElementById("availabilityIndicator");
  if (indicator) {
    indicator.className = "availability-indicator error";
    indicator.innerHTML = `<span class="cross">✗</span> ${message || "Dates not available"}`;
  }
}

function hideAvailabilityStatus() {
  const indicator = document.getElementById("availabilityIndicator");
  if (indicator) {
    indicator.className = "availability-indicator hidden";
    indicator.innerHTML = "";
  }
}

// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================

function showError(message) {
  formErrors.textContent = message;
  formErrors.classList.remove("hidden");

  // Auto-hide after 5 seconds
  setTimeout(() => {
    formErrors.classList.add("hidden");
  }, 5000);
}

function hideError() {
  formErrors.classList.add("hidden");
}

function updateBookingSummary() {
  const checkIn = checkInInput.value ? parseDateOnly(checkInInput.value) : null;
  const checkOut = checkOutInput.value
    ? parseDateOnly(checkOutInput.value)
    : null;

  if (!checkIn || !checkOut || checkOut <= checkIn) {
    summaryList.innerHTML = "<li>Select check-in and check-out dates</li>";
    totalPriceDisplay.textContent = "₹0";
    depositPriceDisplay.textContent = "₹0";
    return;
  }

  const nights = calculateNights(checkIn, checkOut);
  nightCountDisplay.textContent = `${nights} night${nights !== 1 ? "s" : ""}`;

  const adults = parseInt(adultCountInput.value) || 0;
  const children = parseInt(childCountInput.value) || 0;

  // Calculate estimated price (actual price comes from backend)
  const estimatedPrice = calculateEstimatedPrice(
    currentBookingType,
    currentRoomId,
    currentFloorId,
    nights,
  );
  const estimatedDeposit = Math.ceil(estimatedPrice * 0.25);

  // Build summary
  let summaryHTML = "";

  // Booking type
  let bookingTypeText = "";
  if (currentBookingType === "villa") {
    bookingTypeText = "Entire Villa";
  } else if (currentBookingType === "floor") {
    const floorName = currentFloorId === "F1" ? "Ground Floor" : "Top Floor";
    bookingTypeText = floorName;
  } else {
    const roomNames = {
      R1: "Robusta",
      R2: "Arabica",
      R3: "Excelsa",
      R4: "Liberica",
    };
    bookingTypeText = roomNames[currentRoomId];
  }
  summaryHTML += `<li><strong>Booking:</strong> ${bookingTypeText}</li>`;

  // Dates
  summaryHTML += `<li><strong>Check-in:</strong> ${checkIn.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</li>`;
  summaryHTML += `<li><strong>Check-out:</strong> ${checkOut.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</li>`;
  summaryHTML += `<li><strong>Duration:</strong> ${nights} night${nights !== 1 ? "s" : ""}</li>`;

  // Guests
  summaryHTML += `<li><strong>Guests:</strong> ${adults} adult${adults !== 1 ? "s" : ""}${children > 0 ? `, ${children} child${children !== 1 ? "ren" : ""}` : ""}</li>`;

  // Price breakdown (estimated)
  const pricePerNight = nights > 0 ? estimatedPrice / nights : 0;
  summaryHTML += `<li><strong>Rate:</strong> ₹${pricePerNight.toLocaleString("en-IN")} × ${nights} night${nights !== 1 ? "s" : ""}</li>`;

  summaryList.innerHTML = summaryHTML;
  totalPriceDisplay.textContent = `₹${estimatedPrice.toLocaleString("en-IN")}`;
  depositPriceDisplay.textContent = `₹${estimatedDeposit.toLocaleString("en-IN")}`;
}

function updateBookingTypeUI() {
  // Update chip states
  bookingTypeChips.forEach((chip) => {
    if (chip.dataset.type === currentBookingType) {
      chip.classList.add("active");
    } else {
      chip.classList.remove("active");
    }
  });

  // Show/hide appropriate selects
  if (currentBookingType === "room") {
    roomSelect.classList.remove("hidden");
    roomOptionLabel.classList.remove("hidden");
    floorSelect.classList.add("hidden");
    floorOptionLabel.classList.add("hidden");
  } else if (currentBookingType === "floor") {
    roomSelect.classList.add("hidden");
    roomOptionLabel.classList.add("hidden");
    floorSelect.classList.remove("hidden");
    floorOptionLabel.classList.remove("hidden");
  } else {
    roomSelect.classList.add("hidden");
    roomOptionLabel.classList.add("hidden");
    floorSelect.classList.add("hidden");
    floorOptionLabel.classList.add("hidden");
  }

  // Fetch booked dates for new selection
  updateBookedDates();

  // Re-check availability if dates are selected
  if (checkInInput.value && checkOutInput.value) {
    scheduleAvailabilityCheck();
  }

  updateBookingSummary();
}

// ============================================================================
// RAZORPAY INTEGRATION
// ============================================================================

function initRazorpay(orderData, bookingInfo) {
  // IMPORTANT: Always use amount from backend, never frontend calculation
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: orderData.data.order.amount, // Backend-calculated amount in paise
    currency: orderData.data.order.currency,
    name: "Anudina Kuteera",
    description: `${bookingInfo.bookingTypeText} Booking`,
    order_id: orderData.data.order.id,
    prefill: {
      name: bookingInfo.guestName,
      email: bookingInfo.guestEmail,
      contact: bookingInfo.guestPhone,
    },
    theme: {
      color: "#2c5f2d",
    },
    handler: function (response) {
      // Payment successful
      handlePaymentSuccess(response, orderData);
    },
    modal: {
      ondismiss: function () {
        showError(
          "Payment cancelled. Your booking is pending - complete payment within 2 hours to confirm.",
        );
      },
      confirm_close: true, // Ask user before closing modal
    },
  };

  const rzp = new Razorpay(options);
  rzp.on("payment.failed", function (response) {
    handlePaymentFailure(response, orderData);
  });
  rzp.open();
}

function handlePaymentSuccess(paymentResponse, bookingData) {
  // Show success message with booking details
  const checkInDate = new Date(bookingData.data.checkIn).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
  const checkOutDate = new Date(bookingData.data.checkOut).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );

  alert(`🎉 Payment Successful!

Booking Confirmed for ${bookingData.data.name}

📅 Check-in: ${checkInDate}
📅 Check-out: ${checkOutDate}
🔑 Access Token: ${bookingData.data.accessToken}

A confirmation email has been sent to ${bookingData.data.email}

Payment ID: ${paymentResponse.razorpay_payment_id}`);

  // Reset form
  bookingForm.reset();
  guestDetailsFieldset.classList.add("hidden");
  setMinDates();
  updateBookingSummary();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handlePaymentFailure(response, bookingData) {
  const errorMsg =
    response.error.description || response.error.reason || "Payment failed";

  showError(`❌ Payment Failed: ${errorMsg}

Your booking (${bookingData.data.accessToken}) is still pending. 
You can retry payment within 2 hours, or contact us for assistance.`);

  // Optionally: Provide a way to retry payment with same order
  console.error("Payment failure details:", response.error);
}

// Optional: Check payment status for existing booking
async function checkPaymentStatus(accessToken) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/booking/status/${accessToken}`,
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking payment status:", error);
    return null;
  }
}

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

function showTermsModal() {
  termsModal.classList.remove("hidden");
  modalBackdrop.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function hideTermsModal() {
  termsModal.classList.add("hidden");
  modalBackdrop.classList.add("hidden");
  document.body.style.overflow = "";
}

// ============================================================================
// FORM VALIDATION & SUBMISSION
// ============================================================================

function validateForm() {
  hideError();

  // Guest details
  const guestName = guestNameInput.value.trim();
  const guestEmail = guestEmailInput.value.trim();
  const guestPhone = guestPhoneInput.value.trim();

  if (!guestName || !guestEmail || !guestPhone) {
    showError("Please fill in all guest details");
    return false;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(guestEmail)) {
    showError("Please enter a valid email address");
    return false;
  }

  // Phone validation (basic)
  const phoneRegex = /^[+]?[0-9]{10,15}$/;
  if (!phoneRegex.test(guestPhone.replace(/\s/g, ""))) {
    showError("Please enter a valid phone number");
    return false;
  }

  // Dates
  const checkIn = checkInInput.value ? parseDateOnly(checkInInput.value) : null;
  const checkOut = checkOutInput.value
    ? parseDateOnly(checkOutInput.value)
    : null;
  const today = parseDateOnly(formatDate(new Date()));

  if (!checkIn || !checkOut) {
    showError("Please select check-in and check-out dates");
    return false;
  }

  if (checkIn < today) {
    showError("Check-in date must be in the future");
    return false;
  }

  if (checkOut <= checkIn) {
    showError("Check-out date must be after check-in date");
    return false;
  }

  // Guest count
  const adults = parseInt(adultCountInput.value);
  const children = parseInt(childCountInput.value);

  if (isNaN(adults) || adults < 1) {
    showError("At least 1 adult is required");
    return false;
  }

  if (isNaN(children) || children < 0) {
    showError("Invalid number of children");
    return false;
  }

  return true;
}

async function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  // Prepare booking data
  const checkIn = parseDateOnly(checkInInput.value);
  const checkOut = parseDateOnly(checkOutInput.value);

  const bookingData = {
    targetType: currentBookingType,
    checkIn: formatDate(checkIn),
    checkOut: formatDate(checkOut),
    guest: {
      name: guestNameInput.value.trim(),
      email: guestEmailInput.value.trim(),
      phone: guestPhoneInput.value.trim(),
      adults: parseInt(adultCountInput.value),
      children: parseInt(childCountInput.value),
    },
  };

  if (currentBookingType === "room") {
    bookingData.roomId = currentRoomId;
  } else if (currentBookingType === "floor") {
    bookingData.floorId = currentFloorId;
  }

  // Store for later use
  pendingBookingData = bookingData;

  // Show terms modal
  showTermsModal();
}

async function proceedWithBooking() {
  hideTermsModal();

  // Show loading state
  const submitBtn = bookingForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Processing...";

  // Check availability first
  const checkIn = parseDateOnly(pendingBookingData.checkIn);
  const checkOut = parseDateOnly(pendingBookingData.checkOut);

  const availability = await checkAvailability(
    checkIn,
    checkOut,
    pendingBookingData.targetType,
    pendingBookingData.roomId,
    pendingBookingData.floorId,
  );

  if (!availability.available) {
    showError(availability.message || "Selected dates are not available");
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    return;
  }

  // Create booking
  try {
    const response = await createBooking(pendingBookingData);

    // Get booking type text for display
    let bookingTypeText = "";
    if (pendingBookingData.targetType === "villa") {
      bookingTypeText = "Entire Villa";
    } else if (pendingBookingData.targetType === "floor") {
      bookingTypeText =
        pendingBookingData.floorId === "F1" ? "Ground Floor" : "Top Floor";
    } else {
      const roomNames = {
        R1: "Robusta",
        R2: "Arabica",
        R3: "Excelsa",
        R4: "Liberica",
      };
      bookingTypeText = roomNames[pendingBookingData.roomId];
    }

    // Initialize Razorpay with backend response
    initRazorpay(response, {
      bookingTypeText,
      guestName: pendingBookingData.guest.name,
      guestEmail: pendingBookingData.guest.email,
      guestPhone: pendingBookingData.guest.phone,
    });
  } catch (error) {
    showError(error.message || "Failed to create booking. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Booking type selection
bookingTypeChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    currentBookingType = chip.dataset.type;
    updateBookingTypeUI();
  });
});

// Room selection
roomSelect.addEventListener("change", (e) => {
  currentRoomId = roomNameToId[e.target.value];
  updateBookedDates(); // Fetch booked dates for new room
  if (checkInInput.value && checkOutInput.value) {
    scheduleAvailabilityCheck(); // Re-check availability
  }
  updateBookingSummary();
});

// Floor selection
floorSelect.addEventListener("change", (e) => {
  currentFloorId = floorNameToId[e.target.value];
  updateBookedDates(); // Fetch booked dates for new floor
  if (checkInInput.value && checkOutInput.value) {
    scheduleAvailabilityCheck(); // Re-check availability
  }
  updateBookingSummary();
});

// Date changes
checkInInput.addEventListener("change", () => {
  // Set minimum checkout date to day after checkin
  if (checkInInput.value) {
    const checkIn = parseDateOnly(checkInInput.value);
    const minCheckOut = new Date(checkIn);
    minCheckOut.setDate(minCheckOut.getDate() + 1);
    checkOutInput.min = formatDate(minCheckOut);

    // If checkout is before new minimum, reset it
    if (checkOutInput.value && parseDateOnly(checkOutInput.value) <= checkIn) {
      checkOutInput.value = "";
    }
  }
  updateBookingSummary();
  scheduleAvailabilityCheck(); // Check availability in real-time
});

checkOutInput.addEventListener("change", () => {
  updateBookingSummary();
  scheduleAvailabilityCheck(); // Check availability in real-time
});

// Guest count changes
adultCountInput.addEventListener("change", updateBookingSummary);
childCountInput.addEventListener("change", updateBookingSummary);

// Guest details - show fieldset when any input is focused OR when user interacts with booking form
const bookingFormInputs = document.querySelectorAll(
  "#bookingForm input, #bookingForm select, #bookingForm .chip",
);

// Show guest details when user interacts with any form element
bookingFormInputs.forEach((input) => {
  input.addEventListener("focus", () => {
    guestDetailsFieldset.classList.remove("hidden");
  });

  input.addEventListener("click", () => {
    guestDetailsFieldset.classList.remove("hidden");
  });
});

// Also show when clicking on booking type chips
bookingTypeChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    guestDetailsFieldset.classList.remove("hidden");
  });
});

// Show guest details if user scrolls to booking section
const bookingSection = document.getElementById("booking");
if (bookingSection) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // User has scrolled to booking section, show guest details after a short delay
          setTimeout(() => {
            guestDetailsFieldset.classList.remove("hidden");
          }, 1000);
        }
      });
    },
    { threshold: 0.3 },
  );

  observer.observe(bookingSection);
}

// Form submission
bookingForm.addEventListener("submit", handleFormSubmit);

// Terms modal
termsAgreeBtn.addEventListener("click", proceedWithBooking);
modalCloseBtn.addEventListener("click", hideTermsModal);
modalBackdrop.addEventListener("click", hideTermsModal);

// ============================================================================
// CUSTOM CURSOR (Desktop only)
// ============================================================================

function initCustomCursor() {
  // Only enable on desktop with fine pointer
  const hasFinPointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;

  if (!hasFinPointer) {
    return; // Skip cursor on mobile/tablet
  }

  const cursorDot = document.querySelector(".pointer-dot");
  const cursorGlow = document.querySelector(".pointer-glow");
  const cursorTrail = document.querySelector(".pointer-trail");

  if (!cursorDot || !cursorGlow || !cursorTrail) {
    return; // Elements not found
  }

  // Enable custom cursor
  document.body.classList.add("custom-cursor-enabled");

  let mouseX = 0;
  let mouseY = 0;
  let trailX = 0;
  let trailY = 0;

  // Track mouse position
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Update dot and glow immediately
    cursorDot.style.left = mouseX + "px";
    cursorDot.style.top = mouseY + "px";
    cursorGlow.style.left = mouseX + "px";
    cursorGlow.style.top = mouseY + "px";
  });

  // Smooth trail animation
  function animateTrail() {
    const diffX = mouseX - trailX;
    const diffY = mouseY - trailY;

    trailX += diffX * 0.1;
    trailY += diffY * 0.1;

    cursorTrail.style.left = trailX + "px";
    cursorTrail.style.top = trailY + "px";

    requestAnimationFrame(animateTrail);
  }
  animateTrail();

  // Highlight on hover over interactive elements
  const interactiveElements = "a, button, .chip, input, select";

  document.addEventListener(
    "mouseenter",
    (e) => {
      if (e.target.matches(interactiveElements)) {
        cursorGlow.classList.add("active");
      }
    },
    true,
  );

  document.addEventListener(
    "mouseleave",
    (e) => {
      if (e.target.matches(interactiveElements)) {
        cursorGlow.classList.remove("active");
      }
    },
    true,
  );
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function setMinDates() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = formatDate(tomorrow);
  checkInInput.min = minDate;

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  checkOutInput.min = formatDate(dayAfterTomorrow);
}

async function initApp() {
  // Initialize custom cursor (desktop only)
  initCustomCursor();

  // Set minimum dates
  setMinDates();

  // Set current year in footer
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Fetch pricing data
  await fetchVillaPricing();

  // Fetch initial booked dates for default selection (Robusta room)
  await updateBookedDates();

  // Initial UI state
  updateBookingTypeUI();
  updateBookingSummary();

  // Load Razorpay script
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  document.head.appendChild(script);
}

// Start the app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// ============================================================================
// GALLERY & REVIEWS (Placeholder functions - implement as needed)
// ============================================================================

// Load gallery images (if you have a backend endpoint)
async function loadGallery() {
  // TODO: Implement gallery loading
  const galleryGrid = document.getElementById("galleryGrid");
  if (galleryGrid) {
    galleryGrid.innerHTML = "<p>Gallery loading...</p>";
  }
}

// Load reviews (if you have a backend endpoint)
async function loadReviews() {
  // TODO: Implement reviews loading
  const reviewsGrid = document.getElementById("reviewsGridIndex");
  if (reviewsGrid) {
    reviewsGrid.innerHTML = "<p>Reviews loading...</p>";
  }
}

// Call these if needed
// loadGallery();
// loadReviews();
