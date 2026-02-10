const express = require('express');
const router = express.Router();
const { createRefund } = require('../cashfree');
const fs = require('fs/promises');
const path = require('path');
const dayjs = require('dayjs');

const DATA_PATH = path.join(__dirname, '..', 'data', 'state.json');

async function readState() {
  const data = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(data);
}

async function writeState(state) {
  await fs.writeFile(DATA_PATH, JSON.stringify(state, null, 2));
}

// Middleware to require admin session
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.admin) {
    return res.status(401).json({ message: 'Admin session expired or invalid.' });
  }
  next();
}

// Apply admin middleware to all routes
router.use(requireAdmin);

// Get all bookings
router.get('/bookings', async (req, res) => {
  try {
    const state = await readState();
    const bookings = state.bookings.map(b => ({
      bookingId: b.id,
      guestName: b.name,
      email: b.email,
      phone: b.phone || '',
      room: `${b.selectionType} - ${b.selectionId}`,
      checkIn: b.checkInDate,
      checkOut: b.checkOutDate,
      totalAmount: b.totalAmount || b.total || 0,
      paidAmount: b.paidAmount || 0,
      refundAmount: b.refundAmount || 0,
      status: b.status || 'PENDING',
      orderId: b.cf_order_id || b.cashfreeOrderId || null,
      paymentId: b.cf_payment_id || b.cashfreePaymentId || null,
      refundId: b.cashfreeRefundId || null,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Confirm booking
router.post('/confirm-booking', async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const state = await readState();
    const booking = state.bookings.find(b => b.id === bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'CONFIRMED' || booking.status === 'paid') {
      return res.status(400).json({ message: 'Booking already confirmed' });
    }

    booking.status = 'CONFIRMED';
    booking.updatedAt = new Date().toISOString();

    // Block room dates
    const targets = booking.selectionType === 'room' 
      ? [{ targetType: 'room', targetId: booking.selectionId }]
      : booking.selectionType === 'floor'
      ? [{ targetType: 'floor', targetId: booking.selectionId }]
      : [{ targetType: 'villa', targetId: 'villa' }];

    targets.forEach(target => {
      const existingBlock = state.blocks.find(
        b => b.bookingId === booking.id && 
             b.targetType === target.targetType && 
             b.targetId === target.targetId
      );
      
      if (!existingBlock) {
        const { v4: uuid } = require('uuid');
        state.blocks.push({
          id: uuid(),
          targetType: target.targetType,
          targetId: target.targetId,
          startDate: booking.checkInDate,
          endDate: booking.checkOutDate,
          source: 'booking',
          bookingId: booking.id,
          label: `${booking.selectionType} ${booking.selectionId}`
        });
      }
    });

    await writeState(state);
    res.json({ success: true, message: 'Booking confirmed', booking });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ message: error.message || 'Failed to confirm booking' });
  }
});

// Cancel booking and process refund (7 days before check-in)
router.post('/cancel-booking', async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const state = await readState();
    const booking = state.bookings.find(b => b.id === bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'REFUNDED' || booking.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Booking already cancelled or refunded' });
    }

    if (booking.status !== 'CONFIRMED' && booking.status !== 'paid') {
      return res.status(400).json({ message: 'Only confirmed bookings can be cancelled' });
    }

    const paymentId = booking.cf_payment_id || booking.cashfreePaymentId;
    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID not found. Cannot process refund.' });
    }

    // Enforce refund policy: no refund <7 days before check-in
    const checkInDate = dayjs(booking.checkInDate);
    const now = dayjs();
    const daysUntilCheckIn = checkInDate.diff(now, 'day');

    if (daysUntilCheckIn < 7) {
      // No refund allowed, but still cancel booking
      booking.status = 'CANCELLED';
      booking.updatedAt = new Date().toISOString();
      state.blocks = state.blocks.filter(b => b.bookingId !== booking.id);
      await writeState(state);
      
      return res.status(400).json({ 
        message: 'Cancellation allowed but no refund (policy: <7 days before check-in)',
        refund: { amount: 0, percentage: 0 }
      });
    }

    // Full refund (≥7 days before check-in)
    const refund_rupees = booking.paidAmount || booking.deposit || 0;

    // Convert rupees to paise for Cashfree API
    const refund_paise = Math.round(refund_rupees * 100);

    if (refund_paise > 0) {
      try {
        // Create refund via Cashfree (amount in paise)
        const refundResult = await createRefund(
          paymentId,
          refund_paise,
          'Booking cancellation refund (≥7 days before check-in)'
        );

        // Update booking
        booking.status = 'REFUNDED';
        booking.cashfreeRefundId = refundResult.refundId;
        booking.refundAmount = refund_rupees; // Store in rupees
        booking.updatedAt = new Date().toISOString();

        // Remove booking blocks
        state.blocks = state.blocks.filter(b => b.bookingId !== booking.id);

        await writeState(state);

        console.log(`[ADMIN] Booking ${bookingId} cancelled. Refund: ₹${refund_rupees}`);

        res.json({
          success: true,
          message: `Refund processed: ₹${refund_rupees}`,
          refund: {
            amount: refund_rupees,
            refundId: refundResult.refundId
          }
        });
      } catch (refundError) {
        console.error('Refund error:', refundError);
        // Mark as cancelled even if refund fails (admin can retry)
        booking.status = 'CANCELLED';
        booking.updatedAt = new Date().toISOString();
        state.blocks = state.blocks.filter(b => b.bookingId !== booking.id);
        await writeState(state);

        return res.status(500).json({
          message: 'Refund processing failed. Booking marked as cancelled.',
          error: refundError.message
        });
      }
    } else {
      // No refund amount
      booking.status = 'CANCELLED';
      booking.updatedAt = new Date().toISOString();
      state.blocks = state.blocks.filter(b => b.bookingId !== booking.id);
      await writeState(state);

      res.json({
        success: true,
        message: 'Booking cancelled. No refund amount found.',
        refund: { amount: 0 }
      });
    }
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: error.message || 'Failed to cancel booking' });
  }
});

module.exports = router;
