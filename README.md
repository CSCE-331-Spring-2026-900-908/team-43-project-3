# Iroh's Tea POS – Team 43

Web-based Point of Sale system for Project 3.

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Development (runs both server and client with hot-reload)
npm run dev

# Production build
npm run build
npm start
```

## Google OAuth Setup

Add these environment variables before using the protected `/cashier` and `/manager` views:

```bash
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_IDS=your-google-oauth-client-id.apps.googleusercontent.com
APP_AUTH_SECRET=replace-with-a-long-random-secret
GOOGLE_MANAGER_EMAILS=manager1@example.com,manager2@example.com
GOOGLE_CASHIER_EMAILS=cashier1@example.com,cashier2@example.com
# Optional: grants cashier access to any verified Google account on this domain
GOOGLE_ALLOWED_DOMAIN=example.com
```

Notes:

- `GOOGLE_CLIENT_ID` should match the Web client you configure in Google Cloud.
- `GOOGLE_CLIENT_IDS` can contain a comma-separated list if you use separate client IDs across environments.
- `/manager` requires a manager email.
- `/cashier` accepts cashier or manager emails.
- Set the same variables in Vercel project settings for production deployments.

## Structure

```
project3/
├── server/          # Express.js backend (port 3001)
│   ├── index.js     # Entry point
│   ├── db.js        # PostgreSQL connection pool
│   └── routes/      # API route handlers
├── client/          # React frontend (Vite)
│   └── src/
│       ├── pages/   # Portal, Customer, Cashier, Manager, MenuBoard
│       └── components/
└── .env             # Database & API credentials (git-ignored)
```

## Views

| View | URL | User | Input |
|------|-----|------|-------|
| Portal | `/` | All | Links to all interfaces |
| Customer Kiosk | `/customer` | Casual user | Touchscreen |
| Cashier POS | `/cashier` | Power user | Touchscreen |
| Manager | `/manager` | Familiar user | Keyboard & mouse |
| Menu Board | `/menuboard` | Passive viewer | Non-interactive |

## Tech Stack

- **Frontend:** React 19, Vite, React Router
- **Backend:** Node.js, Express 5
- **Database:** PostgreSQL (TAMU AWS)
- **External APIs:** Open-Meteo (weather), LibreTranslate, OpenAI (chatbot)
