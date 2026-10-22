# Architecture

## Sign-in flow

`/sign-in` is the single entry point for authentication. Routes that need an
account (`/notifications`, `/set-username`) are wrapped in
`components/auth/RequireAccount`, which sends visitors to
`/sign-in?next=<path>` when a step is missing.

1. **Connect wallet**: `useStellar().connect()` opens the Stellar Wallets Kit
   modal.
2. **Sign the challenge** (LF-228): the frontend requests
   `POST /auth/challenge { address }`, signs the returned challenge with
   `StellarWalletsKit.signMessage`, and sends it to
   `POST /auth/verify { address, signedChallenge }`. If a valid refresh cookie
   already exists, `POST /auth/refresh` restores the session and this step is
   skipped.
3. **Set a username**: shown only on a wallet's first login. Returning users go
   straight to `next`.

Legacy paths redirect: `/notifications/notifications` → `/notifications` and
`/sign-in-page` → `/sign-in`.

## Auth tokens

- The **access token** is kept in memory only (`lib/auth/session.ts`) and sent
  as a `Bearer` header by `services/api.ts`. On a `401`, the client refreshes
  it once and retries the request.
- The **refresh token** is an `HttpOnly; Secure; SameSite=Lax` cookie set by
  the backend on sign-in. `POST /auth/refresh` reads it from the cookie, and
  `POST /auth/sign-out` clears it. No auth token is stored in `localStorage`
  or `sessionStorage`.
- CORS allows credentials from `FRONTEND_URL` only (default
  `http://localhost:3001`).
- Cookie-authenticated mutations (`/auth/refresh`, `/auth/sign-out`) require the
  `X-Requested-With: XMLHttpRequest` header, which `services/api.ts` sends on
  every request. Cross-site forms cannot set it, and cross-origin scripts
  cannot pass the CORS preflight, so this blocks CSRF.
