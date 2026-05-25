# EcoTrade — Smart Waste Management E-commerce Platform

A full-stack platform connecting waste **Publishers** with **Manufacturers** who recycle waste into products.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, React Router v6, Recharts, Socket.IO Client |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Real-time | Socket.IO |
| Storage | AWS S3 (multer-s3) |
| Charts | Recharts |

---

## Project Structure

```
ecotrade/
├── backend/
│   ├── config/         # Socket.IO handler, AWS S3 config
│   ├── middleware/      # JWT auth, error handler
│   ├── models/          # User, Listing, Order, Cart, Chat, Review, Notification, Pickup
│   ├── routes/          # All REST API routes
│   ├── server.js        # Entry point
│   └── .env.example
└── frontend/
    ├── public/
    └── src/
        ├── components/  # Shared UI components (Layout, Cards, etc.)
        ├── context/     # AuthContext, CartContext, NotificationContext
        ├── pages/       # All page components
        │   ├── publisher/
        │   ├── manufacturer/
        │   └── admin/
        └── utils/       # API client, Socket utility, helpers
```

---

## Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- AWS S3 bucket (for image uploads)

---

### Backend Setup

```bash
cd ecotrade/backend
npm install

# Copy env and fill in values
cp .env.example .env

# Start development server
npm run dev
```

**Required `.env` values:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecotrade
JWT_SECRET=your_super_secret_key_here
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
AWS_S3_BUCKET=ecotrade-waste-images
FRONTEND_URL=http://localhost:3000
```

---

### Frontend Setup

```bash
cd ecotrade/frontend
npm install

cp .env.example .env
# Edit .env:
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_SOCKET_URL=http://localhost:5000

npm start
```

---

## Seeding Demo Data

```bash
cd backend
node config/seed.js
```

This creates:
- `admin@ecotrade.com` / `admin123`
- `publisher1@ecotrade.com` / `password123`  
- `manufacturer1@ecotrade.com` / `password123`

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |

### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings` | Browse listings (with filters) |
| GET | `/api/listings/my` | Publisher's own listings |
| GET | `/api/listings/:id` | Single listing detail |
| POST | `/api/listings` | Create listing (publisher) |
| PUT | `/api/listings/:id` | Update listing (publisher) |
| DELETE | `/api/listings/:id` | Remove listing |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place order (manufacturer) |
| GET | `/api/orders` | List orders |
| GET | `/api/orders/:id` | Order detail |
| PUT | `/api/orders/:id/status` | Update order status |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart |
| POST | `/api/cart/add` | Add item |
| PUT | `/api/cart/item/:listingId` | Update quantity |
| DELETE | `/api/cart/item/:listingId` | Remove item |
| DELETE | `/api/cart/clear` | Clear cart |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations` | List conversations |
| POST | `/api/chat/conversations` | Start conversation |
| GET | `/api/chat/conversations/:id/messages` | Get messages |
| POST | `/api/chat/conversations/:id/messages` | Send message |

### Reviews, Notifications, Admin, Logistics
All standard CRUD endpoints available at their respective base paths.

---

## Features

- ✅ JWT Authentication with role-based access (Publisher / Manufacturer / Admin)
- ✅ Waste listing CRUD with categories, images, location, pricing
- ✅ Marketplace with search, filter, pagination
- ✅ Shopping cart and checkout
- ✅ Order management with status tracking timeline
- ✅ Real-time chat via Socket.IO
- ✅ Real-time notifications
- ✅ Rating & Review system
- ✅ Admin panel: user management, listing moderation, dispute resolution
- ✅ Pickup scheduling & logistics tracking
- ✅ AWS S3 image upload support
- ✅ Responsive modern UI (Tailwind CSS)
- ✅ Charts & analytics dashboards

---

## User Roles

| Role | Access |
|------|--------|
| **Publisher** | Add/edit/delete listings, manage incoming orders, chat |
| **Manufacturer** | Browse marketplace, cart, checkout, track orders, chat |
| **Admin** | Manage all users, listings, orders, resolve disputes |
