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

## Live URLs

- Frontend: TBD
- Backend API: TBD
