# 🧙 Wizzardobe — WardrobeAI

> Your AI-powered personal stylist. Manage your wardrobe, get smart outfit suggestions, track laundry, and shop smarter — all in one place.

---

## ✨ Features

- 👔 **Smart Wardrobe Management** — Add, organise, and search your entire wardrobe
- 🤖 **AI Outfit Suggestions** — GPT-powered daily outfit recommendations by occasion & weather
- 🧺 **Laundry Tracker** — Never forget clothes in the wash again; overdue alerts included
- 📊 **Analytics Dashboard** — Cost-per-wear, most/least worn items, style persona
- 🛍️ **Shopping Wishlist & Gap Analysis** — AI identifies what's missing from your wardrobe
- 🧳 **AI Stylist Tools** — Trip packing, capsule wardrobe builder, seasonal refresh
- 📅 **Calendar Integration** — Plan outfits on your Google Calendar
- 📸 **Photo Upload** — Attach real photos to each garment

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| AI | OpenAI GPT-4o |
| Auth | JWT |
| File Storage | Multer (local) |
| Container | Docker, Docker Compose |
| Web Server | Nginx (frontend) |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                   Docker Network                 │
│                                                  │
│  ┌──────────────┐      ┌──────────────────────┐  │
│  │   Frontend   │      │       Backend        │  │
│  │ React + Vite │─────▶│  Node.js / Express   │  │
│  │  Nginx :80   │      │       :5000          │  │
│  └──────────────┘      └──────────┬───────────┘  │
│                                   │              │
│                        ┌──────────▼───────────┐  │
│                        │       MongoDB        │  │
│                        │       :27017         │  │
│                        └──────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Docker)

```bash
git clone https://github.com/im45145v/Wizzardobe.git && cd Wizzardobe
cp backend/.env.example backend/.env  # set JWT_SECRET and OPENAI_API_KEY
docker compose up --build
```

- App: http://localhost:5173
- API: http://localhost:5000

---

## 🔧 Manual Setup

### Backend

```bash
cd backend && npm install
cp .env.example .env   # fill in values
npm run dev            # starts on :5000
```

### Frontend

```bash
cd frontend && npm install
npm run dev            # starts on :5173
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/wizzardobe` | MongoDB connection string |
| `JWT_SECRET` | — | **Required.** Secret for signing JWTs |
| `NODE_ENV` | `development` | Environment mode |
| `OPENAI_API_KEY` | — | OpenAI key for AI features |
| `GOOGLE_CLIENT_ID` | — | Google OAuth (Calendar) |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth (Calendar) |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | Backend API base URL |

---

## 📡 API Reference

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | Login, returns JWT |
| GET | `/profile` | Get current user |
| PUT | `/profile` | Update profile |
| POST | `/api-key` | Save OpenAI key |
| POST | `/onboarding` | Complete onboarding |

### Wardrobe — `/api/wardrobe`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all clothes |
| POST | `/` | Add clothing (multipart) |
| GET | `/:id` | Get single item |
| PUT | `/:id` | Update item |
| DELETE | `/:id` | Delete item |
| POST | `/:id/wear` | Mark as worn |
| PATCH | `/:id/status` | Update laundry status |

### Outfits — `/api/outfits`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/suggest` | AI outfit suggestion |
| GET | `/suggestions` | List past suggestions |
| POST | `/suggestions/:id/rate` | Rate a suggestion |
| POST | `/suggestions/:id/wear` | Mark suggestion as worn |
| POST | `/judge` | AI judges an outfit combo |

### Laundry — `/api/laundry`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List dirty/in-wash items |
| PATCH | `/:id` | Update item status |
| GET | `/overdue` | Items overdue from wash |
| GET | `/stats` | Laundry statistics |

### Shopping — `/api/shopping`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/gaps` | AI gap analysis |
| GET | `/wishlist` | List wishlist |
| POST | `/wishlist` | Add item |
| PUT | `/wishlist/:id` | Update item |
| DELETE | `/wishlist/:id` | Remove item |

### Analytics — `/api/analytics`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Full stats overview |
| GET | `/most-worn` | Top worn items |
| GET | `/least-worn` | Least worn items |
| GET | `/cost-per-wear` | Cost efficiency |
| GET | `/persona` | Your style persona |

### Stylist — `/api/stylist`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/pack-trip` | Trip packing list |
| POST | `/capsule` | Capsule wardrobe builder |
| POST | `/seasonal-refresh` | Season transition advice |

### Calendar — `/api/calendar`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth-url` | Google OAuth URL |
| GET | `/events` | List calendar events |
| POST | `/events` | Create outfit event |
| GET | `/weekly-plan` | Weekly outfit plan |

---

## �� Demo Credentials

| User | Email | Password |
|---|---|---|
| Alex Demo | `demo@wizzardobe.com` | `demo1234` |
| Jordan Style | `fashionista@wizzardobe.com` | `fashion1234` |

---

## 🌱 Seed Data

```bash
cd backend && node src/seed.js
```

Creates 2 demo users, 10 clothing items, and laundry log entries (including an overdue item).

---

## 📸 Screenshots

> _Screenshots coming soon._

| Wardrobe | Outfit Suggestion | Analytics |
|---|---|---|
| _(placeholder)_ | _(placeholder)_ | _(placeholder)_ |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT © [Wizzardobe Contributors](https://github.com/im45145v/Wizzardobe)
