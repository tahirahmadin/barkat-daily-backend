# Barkat Reads – Backend API

Node.js Express API for the Barkat Reads app: user auth, progress, and cards.

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env and set JWT_SECRET (required in production)
npm install
```

## Run

- **Development (with auto-reload):** `npm run dev`
- **Production:** `npm start`

Default: `http://localhost:3001`

## API

Base URL: `http://localhost:3001/api`

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST   | `/users/signup` | No  | Register (body: `email`, `password`, optional `name`, `preferences[]`) |
| POST   | `/users/login`  | No  | Login (body: `email`, `password`) → returns `token`, `user` |
| GET    | `/users/me`     | Yes | Current user profile |
| PATCH  | `/users/me`     | Yes | Update profile (body: `name`, `preferences[]`) |

### Progress

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/progress` | Yes | Get learned/saved card IDs and stats |
| PATCH  | `/progress` | Yes | Update (body: `learnedCardIds`, `savedCardIds`, `stats`, `lastLearningDate`) |

### Cards

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/cards`      | No  | List all cards (subjects → topics → articles) |
| GET    | `/cards/saved`| Yes | List saved cards for current user |
| POST   | `/cards/saved`| Yes | Save a card (body: `cardId`) |
| DELETE | `/cards/saved`| Yes | Unsave a card (body: `cardId`) |

### Auth

Send the JWT in the header:

```
Authorization: Bearer <token>
```

## Data

- **Storage:** In-memory (resets on restart). Replace `src/store/index.js` with a DB (e.g. SQLite/PostgreSQL) for production.
- **Cards:** Content is in `src/data/cards.js`. You can later move it to a DB or CMS.
