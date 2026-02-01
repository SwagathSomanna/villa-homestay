# Anudina Kunteera Resorts

## Structure

- `public/` – Static frontend (`index.html`, `reviews.html`, shared `styles.css` and `app.js`).
- `server.js` – Express server serving the static files plus JSON APIs for bookings/admin tooling.
- `data/state.json` – Lightweight storage for prices, bookings, blocks, gallery, and saved guests.
- `data/reviews.json` – Pre-seeded reviews surfaced on `reviews.html`.

## Requirements

- Node 18+ (install from https://nodejs.org if not already available).
- SMTP credentials for Nodemailer (any provider) to enable outgoing emails.

## Setup

```bash
cd C:/Users/Acer/villa-rooms-site
npm install
npm run dev            # or npm start for production
```

## Frontend Highlights

- Guest login card saves name/email before booking.
- Booking widget enforces 2-month check-in window, guest caps, and computes totals + 50% deposit.
- Selection for single rooms, floors (ground/top), or entire villa; includes activities pricing.
- Payment section includes QR code, 25% notice, and refund policy.
- Admin console (PIN `2025`) adjusts pricing, blocks dates, updates the 4-image interior gallery,
  and confirms bookings, triggering guest notification emails.
- Reviews page aggregates testimonials from multiple platforms.
- Hover-based cursor accent replicates the Wix UI feel.

## API Overview

| Endpoint                    | Method      | Purpose                                         |
| --------------------------- | ----------- | ----------------------------------------------- |
| `/api/state`                | GET         | Fetch current prices, bookings, gallery, blocks |
| `/api/login`                | POST        | Save guest name/email                           |
| `/api/bookings`             | POST        | Create booking, validate constraints            |
| `/api/payment-confirmation` | POST        | Guest marks 25% payment complete (notify admin) |
| `/api/admin/pricing`        | PUT         | Update room/floor prices & activity rates       |
| `/api/admin/block-dates`    | POST/DELETE | Manage availability blocks                      |
| `/api/admin/gallery`        | POST        | Replace the gallery images (max 4)              |
| `/api/admin/confirm`        | POST        | Admin confirms booking and emails guest         |
| `/api/reviews`              | GET         | Data source for reviews page                    |

All data persists in `data/state.json`; back up this file before deploying.

## Deployment Notes

- Behind a production proxy, serve the app (e.g., `npm start`) and point your purchased domain at the hosting provider.
- Secure the admin PIN and consider moving credentials to environment variables in production.
- Swap placeholder gallery/room imagery with your actual content via the admin console.

