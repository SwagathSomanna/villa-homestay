# Anudina Kuteera — Homestay Booking Website

A full-stack booking platform for **Anudina Kuteera**, a villa homestay in Coorg, Karnataka. Guests can browse rooms, check real-time availability, get dynamic price quotes, and pay a 50 % deposit online via Razorpay. An admin dashboard lets the property owner manage bookings, block dates, and configure seasonal pricing rules.

----

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Room & Pricing Details](#room--pricing-details)
- [Admin Dashboard](#admin-dashboard)
- [Business Rules](#business-rules)
- [Deployment Notes](#deployment-notes)
- [License](#license)

---

## Features

**Guest-facing**
- Hero drone-shot video and image gallery carousel
- Four individually bookable rooms, two floor packages, and a full-villa option
- Real-time date availability checking
- Dynamic pricing with seasonal / day-of-week rules and per-night breakdown
- Razorpay-powered 50 % deposit checkout
- Confirmation emails via Resend
- Reviews page aggregating Google, Airbnb, and Booking.com testimonials
- Google Maps embed for directions
- Responsive design with custom cursor accent on desktop

**Admin-facing**
- OTP-based login with JWT session management
- Dashboard with stats (total / paid / pending bookings, blocked dates)
- View, filter, edit, and cancel bookings
- Block dates for maintenance (per room, floor, or villa)
- Create, edit, and delete seasonal pricing rules with priority ordering

---

## Tech Stack

| Layer     | Technology                                                     |
| --------- | -------------------------------------------------------------- |
| Runtime   | Node.js 18+                                                   |
| Framework | Express 4                                                      |
| Database  | MongoDB (Mongoose 9)                                           |
| Payments  | Razorpay (server SDK + Checkout.js)                            |
| Email     | Resend / Nodemailer                                            |
| Auth      | JSON Web Tokens, OTP verification                              |
| Frontend  | Vanilla HTML / CSS / JavaScript (ES modules)                   |
| Dev tools | nodemon                                                        |

---

## Project Structure

```
├── public/                      # Static frontend served by Express
│   ├── index.html               # Homepage & booking flow
│   ├── reviews.html             # Guest reviews page
│   ├── admin-login.html         # Admin OTP login
│   ├── admin.html               # Admin dashboard
│   ├── sitemap.xml              # XML sitemap for search engines
│   ├── app.js                   # Main frontend logic
│   ├── admin-app.js             # Admin dashboard logic
│   ├── admin-login.js           # Admin login logic
│   ├── reviews.js               # Reviews page logic
│   ├── styles.css               # Main stylesheet
│   ├── admin-styles.css         # Admin stylesheet
│   └── assets/                  # Images, videos, logos, QR code
│
├── controllers/                 # Route handlers
│   ├── booking.controller.js    # Booking CRUD & availability
│   ├── razorpay.controller.js   # Payment creation & verification
│   ├── admin.controller.js      # Admin operations
│   └── admin.auth.controller.js # OTP login & JWT issuance
│
├── routes/                      # Express route definitions
│   ├── booking.route.js
│   ├── razorpay.route.js
│   ├── villa.routes.js
│   ├── admin.route.js
│   └── admin.auth.route.js
│
├── models/                      # Mongoose schemas
│   ├── booking.model.js         # Bookings
│   ├── villa.model.js           # Villa → Floors → Rooms
│   ├── pricingRule.model.js     # Seasonal pricing rules
│   ├── userInfo.model.js        # Guest information
│   └── otp.model.js             # Admin OTPs
│
├── middleware/
│   └── admin.midddleware.js     # JWT verification middleware
│
├── utils/
│   ├── seed.js                  # Database seeding (rooms, floors, villa)
│   ├── pricingHelper.util.js    # Dynamic pricing calculator
│   ├── resend.util.js           # Email sending helper
│   └── otp.util.js              # OTP generation helper
│
├── docs/                        # Internal design docs
├── server.js                    # Express app entry point
├── db.js                        # MongoDB connection
├── constants.js                 # App-wide constants
├── .env.sample                  # Environment variable template
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **MongoDB** — local instance or a cloud cluster (e.g. MongoDB Atlas)
- **Razorpay account** — for payment processing ([razorpay.com](https://razorpay.com))
- **Resend account** — for transactional emails ([resend.com](https://resend.com))

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd anudinakuteera-homestay-website-main

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.sample .env
# Then fill in every value — see the section below

# 4. Start the development server (auto-restarts on file changes)
npm run dev

# — or start in production mode —
npm start
```

The server seeds the database automatically on first run (when `SEED_VALUES=true`). After seeding completes you can set it to `false`.

### Access

| Page            | URL                                       |
| --------------- | ----------------------------------------- |
| Homepage        | `http://localhost:<PORT>`                 |
| Reviews         | `http://localhost:<PORT>/reviews.html`    |
| Admin Login     | `http://localhost:<PORT>/admin-login.html`|
| Admin Dashboard | `http://localhost:<PORT>/admin.html`      |
| Sitemap         | `http://localhost:<PORT>/sitemap.xml`     |

---

## Environment Variables

Copy `.env.sample` to `.env` and fill in every value.

| Variable                 | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `PORT`                   | Server port (e.g. `4000`)                        |
| `MONGODB_URI`            | MongoDB connection string                        |
| `DB_NAME`                | Database name                                    |
| `SEED_VALUES`            | `true` to seed rooms/floors/villa on startup     |
| `CORS_ORIGIN`            | Allowed frontend origin for CORS                 |
| `RAZORPAY_KEY_ID`        | Razorpay public key                              |
| `RAZORPAY_KEY_SECRET`    | Razorpay secret key                              |
| `RAZORPAY_WEBHOOK_SECRET`| Secret for verifying Razorpay webhooks           |
| `RESEND_API`             | Resend API key                                   |
| `ACCESSTOKEN_SECRET`     | Secret for signing JWTs                          |
| `ACCESSTOKEN_EXPIRY`     | JWT expiry duration (e.g. `1d`)                  |
| `ADMIN_USERNAME`         | Admin account username                           |
| `ADMIN_PASSWORD`         | Admin account password                           |
| `ADMIN_EMAIL`            | Email address for receiving admin OTPs           |
| `ADMIN_NUMBER`           | Admin phone number                               |

---

## API Reference

### Booking

| Method | Endpoint                         | Description                          |
| ------ | -------------------------------- | ------------------------------------ |
| POST   | `/api/booking/checkout`          | Create a booking & Razorpay order    |
| GET    | `/api/booking/booked-dates`      | Retrieve booked date ranges          |
| POST   | `/api/booking/check-availability`| Check availability for given dates   |
| POST   | `/api/booking/price-quote`       | Get a detailed price quote           |

### Villa

| Method | Endpoint             | Description                |
| ------ | -------------------- | -------------------------- |
| GET    | `/api/villa/pricing` | Get villa pricing structure|

### Payment

| Method | Endpoint                         | Description                        |
| ------ | -------------------------------- | ---------------------------------- |
| POST   | `/api/payment/verify`            | Verify Razorpay payment signature  |
| POST   | `/api/payment/razorpay-webhook`  | Razorpay webhook handler           |

### Admin (JWT-protected unless noted)

| Method | Endpoint                            | Description                    |
| ------ | ----------------------------------- | ------------------------------ |
| POST   | `/api/admin/login`                  | Request OTP (public)           |
| POST   | `/api/admin/verify-otp`             | Verify OTP and get JWT (public)|
| POST   | `/api/admin/logout`                 | Clear session                  |
| GET    | `/api/admin/bookings`               | List all bookings              |
| GET    | `/api/admin/filterBookings`         | Filter bookings by status      |
| PATCH  | `/api/admin/bookings/:bookingId`    | Update a booking               |
| DELETE | `/api/admin/bookings/:bookingId`    | Delete a booking               |
| POST   | `/api/admin/blocked-dates`          | Block dates for maintenance    |
| POST   | `/api/admin/pricing-rules`          | Create a pricing rule          |
| GET    | `/api/admin/pricing-rules`          | List all pricing rules         |
| PATCH  | `/api/admin/pricing-rules/:ruleId`  | Update a pricing rule          |
| DELETE | `/api/admin/pricing-rules/:ruleId`  | Delete a pricing rule          |

---

## Room & Pricing Details

### Rooms

| ID | Name     | Floor  | Base Price  | Max Guests (Adults / Children) |
| -- | -------- | ------ | ----------- | ------------------------------ |
| R1 | Robusta  | Ground | ₹5,990/night | 6 (4 / 2)                    |
| R2 | Arabica  | Ground | ₹3,990/night | 4 (3 / 1)                    |
| R3 | Excelsa  | Top    | ₹4,990/night | 4 (3 / 1)                    |
| R4 | Liberica | Top    | ₹4,990/night | 4 (3 / 1)                    |

### Floors

| ID | Name         | Rooms              | Base Price   | Max Guests |
| -- | ------------ | ------------------ | ------------ | ---------- |
| F1 | Ground Floor | Robusta + Arabica  | ₹8,990/night | 10 (7 / 3) |
| F2 | Top Floor    | Excelsa + Liberica | ₹9,990/night | 8 (6 / 2)  |

### Entire Villa

| Base Price     | Max Guests  |
| -------------- | ----------- |
| ₹18,980/night  | 18 (13 / 5) |

### Dynamic Pricing

Admins can create pricing rules that adjust base prices:
- **Date-range rules** — apply a percentage or fixed-amount modifier for specific date ranges (e.g. holiday surcharges)
- **Day-of-week rules** — e.g. weekend premiums
- **Priority system** — higher-priority rules take precedence when multiple rules overlap

---

## Admin Dashboard

1. **Login** — navigate to `/admin-login.html`, enter credentials, receive an OTP via email, and verify it to get a session token.
2. **Bookings** — view summary stats, list / filter / edit / cancel bookings.
3. **Blocked Dates** — block specific dates for maintenance at the room, floor, or villa level.
4. **Pricing Rules** — create seasonal or day-of-week pricing modifiers with customizable priority.

---

## Business Rules

| Rule                    | Detail                                                        |
| ----------------------- | ------------------------------------------------------------- |
| Check-in time           | 2:00 PM                                                      |
| Check-out time          | 11:00 AM                                                     |
| Advance booking window  | Up to 3 months from today                                    |
| Deposit                 | 50 % at the time of booking                                  |
| Balance                 | Remaining 50 % on arrival                                    |
| Cancellation refund     | 100 % refund if cancelled 15+ days before check-in           |
| Extra person charge     | ₹2,000 per additional person                                 |
| Stale booking cleanup   | Unconfirmed bookings auto-deleted after 45 days              |
| Expired pricing rules   | Auto-deleted 15 days after their end date                    |

---

## Deployment Notes

- Set `NODE_ENV=production` and use `npm start` (no file watcher overhead).
- Update the `<loc>` URLs in `public/sitemap.xml` to your production domain (e.g. `https://yourdomain.com`) before deploying.
- Place the app behind a reverse proxy (Nginx, Caddy, etc.) for TLS termination.
- Configure the Razorpay webhook URL to point to `/api/payment/razorpay-webhook` on your domain.
- Set `CORS_ORIGIN` to your production domain.
- After the initial seed, set `SEED_VALUES=false` to avoid re-seeding on every restart.
- Back up your MongoDB database regularly.

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
=======
# Anudina Kuteera 

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

>>>>>>> 53a4b48044c5e30d7f3dbc9f48d215763e790669
