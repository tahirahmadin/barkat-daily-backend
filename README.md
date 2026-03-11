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
| POST   | `/users/signup` | No  | Register (body: `email`, `password`; optional onboarding: `name` or `fullName`, `profilePicture`, `language`, `preferences[]`) |
| POST   | `/users/login`  | No  | Login (body: `email`, `password`) → returns `token`, `user` |
| GET    | `/users/me`     | Yes | Current user profile |
| PATCH  | `/users/me`     | Yes | Update profile / complete onboarding (body: `name` or `fullName`, `profilePicture`, `language`, `preferences[]`) |
| POST   | `/users/me/avatar` | Yes | Upload profile picture (multipart field `avatar`); stored in Supabase with compression. Returns updated `user`. |

### Progress

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/progress` | Yes | Get learned/saved card IDs and stats |
| GET    | `/progress/leaderboard` | No  | Top 20 by learnt cards; if current user (optional auth) not in top 20, appended as 21st with rank |
| PATCH  | `/progress` | Yes | Update (body: `learnedCardIds`, `savedCardIds`, `stats`, `lastLearningDate`) |

### Cards

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/cards`      | No  | List all cards (subjects → topics → articles) |
| GET    | `/cards/feed` | Yes | Personalized feed (unlearned cards) |
| GET    | `/cards/category/:category` | Yes | Cards in category (category or slug, e.g. `quran-surah`) |
| GET    | `/cards/:slug/completed` | Yes | Completed cards in category by slug (e.g. `/cards/quran-surah/completed?limit=10&offset=0`) |
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

**Profile picture upload:** Pictures are stored in **Supabase Storage** with server-side **compression** (max width 800px, JPEG quality 85). Set `SUPABASE_URL` (project URL like https://YOUR_REF.supabase.co — not the S3 endpoint), `SUPABASE_SERVICE_ROLE_KEY` (Dashboard → API → service_role), and optionally `SUPABASE_STORAGE_BUCKET` (default `profile-photos`) in `.env`. Create a public bucket in Supabase Dashboard. Without these, `POST /users/me/avatar` returns 503; clients can still set `profilePicture` via `PATCH /users/me` with a URL.
