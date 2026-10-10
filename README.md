# Secure Notes Frontend

Minimal React + Vite UI for the Secure Notes API. Functional only, no design work.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

`.env` keys: `VITE_API_URL=http://localhost:5000` locally, or the deployed Render URL in production.

## Screens

Login/Register, My Notes (list, create, edit, delete), My Posts (publish, view via aggregation), Admin (users, all notes, by-interest) for `role: Admin`.

JWT is stored in localStorage and sent as `Authorization: Bearer <token>`. Admin nav is hidden for non-admins; the API enforces permissions.

## Demo accounts (live testing)

Log in at `https://secure-notes-frontend.pages.dev/` with these demo-only accounts (delete/rotate after interview):

| Role | Email | Password |
|---|---|---|
| Admin | sara.admin@test.com | Pass1234 |
| User | arif@test.com | Pass1234 |

## Live URLs

- Frontend: https://secure-notes-frontend.pages.dev/
- Backend API: https://secure-notes-backend-yyo2.onrender.com
