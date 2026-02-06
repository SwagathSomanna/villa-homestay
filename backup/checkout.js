let currentBookingId = null;
let depositAmount = 0;
let totalAmount = 0;
let isProcessing = false;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initializeCheckout();
});

// Get booking ID from localStorage if it exists for this payload
function getStoredBookingId() {
  try {
    const stored = localStorage.getItem('currentBookingId');
    const payload = localStorage.getItem('pendingBookingPayload');
    if (stored && payload) {
      // Verify the booking ID is still valid by checking if payload matches
      return stored;
    }
  } catch (e) {
    console.error('Failed to get stored booking ID:', e);
  }
  return null;
}

// Store booking ID in localStorage
function storeBookingId(bookingId) {
  try {
    localStorage.setItem('currentBookingId', bookingId);
  } catch (e) {
    console.error('Failed to store booking ID:', e);
  }
}

// Clear stored booking ID (call after successful payment)
function clearStoredBookingId() {
  try {
    localStorage.removeItem('currentBookingId');
    localStorage.removeItem('pendingBookingPayload');
  } catch (e) {
    console.error('Failed to clear stored booking ID:', e);
  }
}

async function initializeCheckout() {
  const payButton = document.getElementById('reservePayBtn');
  const statusDiv = document.getElementById('status');
  const summaryDiv = document.getElementById('summary');
  
  if (!payButton) {
    console.error('Reserve & Pay button not found');
    return;
  }

  // Check URL params for order_id (return from Cashfree)
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');
  
  // Try to get booking payload from localStorage (set by app.js)
  let bookingPayload = null;
  try {
    const saved = localStorage.getItem('pendingBookingPayload');
    if (saved) {
      bookingPayload = JSON.parse(saved);
      window.bookingPayload = bookingPayload;
    }
  } catch (e) {
    console.error('Failed to load booking payload from localStorage:', e);
  }

  // If no payload, show error
  if (!window.bookingPayload && !bookingPayload) {
    statusDiv.innerHTML = '<div class="error">Booking information not found. Please start a new booking.</div>';
    payButton.style.display = 'none';
    return;
  }

  // Calculate amounts from payload
  if (window.bookingPayload) {
    totalAmount = window.bookingPayload.total || 0;
    depositAmount = window.bookingPayload.deposit || Math.round(totalAmount * 0.25);
    
    // Update UI
    document.getElementById('totalAmount').textContent = `₹${totalAmount.toLocaleString()}`;
    document.getElementById('depositAmount').textContent = `₹${depositAmount.toLocaleString()}`;
    summaryDiv.style.display = 'block';
  }

  // Try to restore booking ID from localStorage
  currentBookingId = getStoredBookingId();

  // If returning from payment, check status
  if (orderId) {
    statusDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Verifying your payment...</p></div>';
    payButton.disabled = true;
    
    try {
      // Verify payment status via backend
      const verifyRes = await fetch(`/api/payments/verify?order_id=${orderId}`);
      if (verifyRes.ok) {
        const result = await verifyRes.json();
        if (result.success) {
          statusDiv.innerHTML = '<div class="success">Payment successful! Your booking is confirmed.</div>';
          payButton.style.display = 'none';
          clearStoredBookingId(); // Clear stored data after successful payment
          return;
        }
      }
    } catch (e) {
      console.error('Payment verification failed:', e);
    }
    
    // Payment not successful, show retry option
    statusDiv.innerHTML = '<div class="error">Payment was not completed. You can try again below.</div>';
    payButton.disabled = false;
    payButton.textContent = 'Reserve & Pay';
  } else {
    // Fresh page load, show ready state
    statusDiv.innerHTML = '<p>Click the button below to proceed with payment.</p>';
  }

  // Bind click handler exactly once
  payButton.addEventListener('click', handleReserveAndPay);
}

async function handleReserveAndPay() {
  const payButton = document.getElementById('reservePayBtn');
  const statusDiv = document.getElementById('status');
  
  if (!payButton || isProcessing) return;
  
  // Reset button state first (in case of retry)
  payButton.disabled = false;
  payButton.textContent = 'Reserve & Pay';
  
  try {
    isProcessing = true;
    payButton.disabled = true;
    payButton.textContent = 'Processing...';

    // Ensure we have booking payload
    if (!window.bookingPayload) {
      throw new Error('Booking information not found. Please start a new booking.');
    }

    // 1️⃣ Create booking ONCE per attempt (tracked by currentBookingId)
    if (!currentBookingId) {
      statusDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Creating booking...</p></div>';
      
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(window.bookingPayload)
      });

      if (!bookingRes.ok) {
        const errorText = await bookingRes.text();
        throw new Error(errorText || 'Booking creation failed');
      }

      const data = await bookingRes.json();
      currentBookingId = data.booking.id;
      storeBookingId(currentBookingId); // Store for retry scenarios
      
      // Recalculate deposit from booking total (use booking.total or payload total)
      const bookingTotal = data.booking.total || data.booking.totalAmount || window.bookingPayload.total || 0;
      depositAmount = Math.round(bookingTotal * 0.25);
      
      // Update UI
      document.getElementById('depositAmount').textContent = `₹${depositAmount.toLocaleString()}`;
    }

    // 2️⃣ ALWAYS create new payment order (backend handles retries)
    statusDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Creating payment order...</p></div>';
    
    const payRes = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: currentBookingId,
        amountRs: depositAmount
      })
    });

    if (!payRes.ok) {
      const errorText = await payRes.text();
      throw new Error(errorText || 'Payment order creation failed');
    }

    const { payment_session_id } = await payRes.json();
    if (!payment_session_id) {
      throw new Error('Payment session ID missing from server response');
    }

    // 3️⃣ ALWAYS open Cashfree checkout
    statusDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Redirecting to payment...</p></div>';
    
    if (!window.Cashfree) {
      throw new Error('Cashfree SDK not loaded. Please refresh the page.');
    }

    const cashfree = new Cashfree();
    cashfree.checkout({
      paymentSessionId: payment_session_id,
      redirectTarget: '_self'
    });

    // If checkout doesn't redirect (shouldn't happen), reset after timeout
    setTimeout(() => {
      if (isProcessing) {
        isProcessing = false;
        payButton.disabled = false;
        payButton.textContent = 'Reserve & Pay';
        statusDiv.innerHTML = '<div class="error">Payment window did not open. Please try again.</div>';
      }
    }, 3000);

  } catch (err) {
    // ALWAYS reset button state on error
    isProcessing = false;
    payButton.disabled = false;
    payButton.textContent = 'Reserve & Pay';
    
    const errorMsg = err.message || 'Payment failed. Please try again.';
    statusDiv.innerHTML = `<div class="error">${errorMsg}</div>`;
    console.error('Payment error:', err);
  }
}
