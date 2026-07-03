# Days Since Last Arkie Hang

A single-page site that tracks days since the last Arkie hang. The counter is shared across all visitors — anyone updating it from any computer sees the same number.

## How it works

The date is stored in **Cloud Firestore** (project `arkhang-74922`), in a single shared document:

```
arkie/hang  ->  { lastHang: "YYYY-MM-DD", updatedAt: <server timestamp> }
```

- On load, the page subscribes to that document with `onSnapshot`, so when anyone sets a new date, every open page updates **in realtime** — no polling, no refresh needed.
- Setting a date writes `lastHang` plus a `serverTimestamp()` so the update time is recorded accurately by Firebase's servers, not the visitor's clock.
- The last known date is also cached in `localStorage` so the counter paints instantly on reload while Firestore connects.
- The count re-renders every minute so it rolls over correctly at midnight.

Because the backend is Firestore, the site is fully static — it works as-is on GitHub Pages (already set up via `.github/workflows/static.yml`), Netlify, Vercel, etc. No server or persistent disk needed.

## Files

- `index.html` — the front-end (animated boat scene + counter + modal + Firebase/Firestore wiring)
- `firestore.rules` — Firestore security rules for the counter document
- `.github/workflows/static.yml` — deploys the site to GitHub Pages
- `server.js`, `package.json`, `Dockerfile` — **legacy** Express/JSON-file backend, no longer used by the front-end; kept for reference

## Firebase setup (one-time)

1. In the [Firebase console](https://console.firebase.google.com/project/arkhang-74922), go to **Build → Firestore Database** and click **Create database** (production mode, any region) if you haven't already.
2. Go to the **Rules** tab and paste in the contents of `firestore.rules`, then **Publish**. (Or with the Firebase CLI: `firebase deploy --only firestore:rules`.)
3. In **Project settings → General → Your apps**, make sure your web app is registered (it is — the config in `index.html` came from there).
4. If Firebase complains about unauthorized domains, add your GitHub Pages domain under **Authentication → Settings → Authorized domains** (only needed if you add auth later; plain Firestore reads/writes don't require it).

### What the rules allow

- **Anyone can read** the counter (it's a public page).
- **Anyone can write** the date, but *only* in the exact shape the app uses: a `lastHang` string matching `YYYY-MM-DD` plus `updatedAt` that must equal the server's time (`serverTimestamp()`), so clients can't spoof the update time or stuff arbitrary data in.
- The document can't be deleted, and every other path in the database is locked down.

If random-stranger writes ever become a problem, the next step up is enabling **Anonymous Authentication** and requiring `request.auth != null` in the rules, or gating writes behind Firebase **App Check**.

## Run locally

It's a static page — open `index.html` directly, or serve it with any static server:

```bash
npx serve .
```

The counter talks straight to Firestore, so localhost works out of the box.
