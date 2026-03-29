# ShareTea POS – Team 43

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
