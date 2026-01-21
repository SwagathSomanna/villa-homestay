// Simple in-memory booking model structure
// In production, replace with MongoDB schema

function createBooking(data) {
  return {
    id: data.id || require('uuid').v4(),
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    selectionType: data.selectionType, // 'room', 'floor', 'villa'
    selectionId: data.selectionId,
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    nights: data.nights,
    adults: data.adults,
    children: data.children,
    activities: data.activities || {},
    total: data.total,
    deposit: data.deposit,
    status: data.status || 'pending', // 'pending', 'paid', 'confirmed', 'cancelled'
    cashfreeOrderId: data.cashfreeOrderId || null,
    cashfreePaymentId: data.cashfreePaymentId || null,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

function updateBookingStatus(booking, status, paymentData = {}) {
  booking.status = status;
  booking.updatedAt = new Date().toISOString();
  
  if (paymentData.orderId) {
    booking.cashfreeOrderId = paymentData.orderId;
  }
  if (paymentData.paymentId) {
    booking.cashfreePaymentId = paymentData.paymentId;
  }
  
  return booking;
}

module.exports = {
  createBooking,
  updateBookingStatus
};
