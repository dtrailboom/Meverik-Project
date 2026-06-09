# Meverik — Websites for Small Businesses

A subscription-based website-as-a-service platform. Clients submit change requests, your team builds them, and a token system controls usage.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML, Tailwind CSS, Vanilla JS |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Auth | express-session + bcrypt |
| Payments | Stripe (subscriptions + one-time top-ups) |
| Hosting | Vercel (frontend) / Railway or Render (backend) |
| Email | Nodemailer + SMTP |

---

## Project structure

```
meverik/
├── public/               # Static assets served directly
│   ├── css/
│   │   └── main.css
│   ├── js/
│   │   ├── landing.js
│   │   ├── portal.js
│   │   └── admin.js
│   └── images/
├── src/
│   ├── config/
│   │   ├── db.js         # MongoDB connection
│   │   ├── stripe.js     # Stripe client setup
│   │   └── session.js    # Session config
│   ├── middleware/
│   │   ├── auth.js       # requireLogin, requireAdmin
│   │   └── tokens.js     # checkTokenBalance
│   ├── models/
│   │   ├── User.js
│   │   ├── Ticket.js
│   │   └── Transaction.js
│   └── controllers/
│       ├── authController.js
│       ├── ticketController.js
│       ├── tokenController.js
│       └── stripeController.js
├── views/
│   ├── layouts/
│   │   ├── main.html     # Public layout
│   │   └── portal.html   # Client portal layout
│   ├── pages/
│   │   ├── landing.html
│   │   ├── portal/
│   │   │   ├── overview.html
│   │   │   ├── request.html
│   │   │   ├── tickets.html
│   │   │   ├── topup.html
│   │   │   └── billing.html
│   │   └── admin/
│   │       ├── tickets.html
│   │       ├── clients.html
│   │       ├── tokens.html
│   │       ├── payments.html
│   │       └── settings.html
│   └── partials/
│       ├── nav.html
│       ├── sidebar-portal.html
│       └── sidebar-admin.html
├── database/
│   └── migrations/
│       └── seed.js       # Sample data for dev
├── tests/
├── .env.example
├── .gitignore
├── package.json
├── server.js             # Express app entry point
└── README.md
```

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/meverik.git
cd meverik
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Fill in all values in .env
```

### 3. Start MongoDB

Make sure MongoDB is running locally, or use a MongoDB Atlas connection string in `.env`.

### 4. Seed the database (optional)

```bash
npm run seed
```

### 5. Run the dev server

```bash
npm run dev
# App runs at http://localhost:3000
```

---

## Environment variables

See `.env.example` for all required variables.

---

## Token system

| Change type | Token cost |
|---|---|
| Small (text, image swap) | 1 token |
| Medium (new section, form) | 3 tokens |
| Large (new page, integration) | 8 tokens |

Plans refill tokens monthly via Stripe subscription webhooks.

---

## Stripe integration

- Subscriptions: monthly plans (Starter €29, Growth €59, Pro €99)
- One-time payments: top-up packs (€9 / €19 / €39)
- Webhooks: `checkout.session.completed`, `invoice.paid`, `payment_intent.payment_failed`

---

## Deployment

See hosting instructions below. Recommended:
- **Frontend + server**: [Railway](https://railway.app) or [Render](https://render.com)
- **Database**: MongoDB Atlas (free tier available)
- **Domain + CDN**: Cloudflare

---

## Git workflow

```bash
main        → production
develop     → staging / active development
feature/*   → individual features
```
