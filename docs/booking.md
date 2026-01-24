- when booking prices can be fetched while the app loads.
- But availability depends on the selected dates and selection type

So availability is:

> Computed dynamically every time the user changes dates / selection.

availability must be checked when:

- Booking type changes (Room / Floor / Villa)
- Selected room/floor changes
- Check-in date changes
- Check-out date changes

Each of these is a state change that invalidates availability.

---

So the flow is:

1. User selects:

- targetType
- room/floor
- checkin
- checkout

2. Frontend sends an API request:

```
POST /api/check-availability
```

with payload:

```
{
  "targetType": "room",
  "floorId": "F1",
  "roomId": "R2",
  "checkIn": "2026-01-23",
  "checkOut": "2026-01-26"
}
```

3. Backend:

- Queries and returns:

```
{
"available": true,
"pricePerNight": 3000,
"totalPrice": 9000,
"deposit": 2250
}

```

or

```
{
  "available": false,
  "reason": "Room already booked for selected dates"
}
```

4. Frontend updates:

- Enables / disables “Reserve & Pay”
- Shows “Not available for selected dates”
- Shows price only if available

---

3. How backend actually knows availability (conceptually)

- Find all bookings that overlap with the selected date range
  and conflict with the selected target.

- the heirarchial structure (too lazy to write)

---

4. How does this fit into ui
   Initial load:

- Load villa structure + base prices
- No availability yet

When a user selects dates:
you immediately call:

```
checkAvailability(...)
```

and updates:

- Stay summary
- Total price
- Deposit
- Enable / disable pay button

---

###### imp: Availablity rechecked at payment (okay man, common sense)

Even if UI shows “available”, before creating payment:

1. User clicks “Reserve & Pay”
2. Frontend sends final selection to backend
3. Backend rechecks availability again
4. Only if still free → create payment order

Because:

- Two users can select same dates at same time
- First payment wins
- Second must be rejected

This is standard race-condition handling.

---

#### Payment flow

User
|
Frontend (Availability Page)
|
| POST /create-order
v
Backend -----> Razorpay (create order)
| |
| <--- order_id--|
|
v
Frontend opens Razorpay Checkout
|
User pays via Razorpay UI
|
Razorpay -> Frontend (payment_id, signature)
|
| POST /verify-payment
v
Backend verifies signature
|
DB: mark booking confirmed
