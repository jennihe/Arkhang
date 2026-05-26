# Days Since Last Arkie Hang

A single-page site that tracks days since the last Arkie hang. The counter is shared across all visitors — anyone updating it from any computer sees the same number.

## Files

- `index.html` — the front-end (full-bleed animated boat scene + counter + modal)
- `server.js` — tiny Express server that serves `index.html` and exposes `/api/hang`
- `package.json` — Node dependencies (just Express)
- `Dockerfile` — optional, for container-based hosts
- `data/hang.json` — created automatically on first update; this is the persisted state

## How it works

- `GET /api/hang` returns `{ "lastHang": "YYYY-MM-DD" | null }`
- `POST /api/hang` with body `{ "lastHang": "YYYY-MM-DD" }` saves the date
- The front-end polls every 30 seconds so updates from one user appear for others without a manual refresh
- All visitors share the same counter (no per-user storage)

## Run locally

```bash
npm install
npm start
```

Then open http://localhost:3000

## Deploy

You need a host that runs Node and gives you persistent disk for `data/hang.json`. Pick one:

### Option 1 — Render.com (easiest, free tier available)

1. Push these files to a GitHub repo.
2. On Render, create a new **Web Service**, point it at the repo.
3. Build command: `npm install` — Start command: `npm start`.
4. Add a **Disk**: mount path `/data`, size 1 GB is plenty.
5. Add an env var: `DATA_DIR=/data`.
6. Deploy. Done.

### Option 2 — Fly.io

```bash
fly launch          # accept defaults, don't deploy yet
fly volumes create arkie_data --size 1
```

Edit `fly.toml` to mount the volume and set the env var:

```toml
[env]
  DATA_DIR = "/data"

[mounts]
  source = "arkie_data"
  destination = "/data"
```

Then:

```bash
fly deploy
```

### Option 3 — Railway

1. New project from this repo.
2. Add a **Volume**, mount path `/data`.
3. Set env var `DATA_DIR=/data`.
4. Deploy.

### Option 4 — Any VPS (DigitalOcean, Hetzner, Linode, etc.)

```bash
# on the server
git clone <your-repo> && cd <repo>
npm install
# run under a process manager so it restarts on crash / reboot
npm install -g pm2
pm2 start server.js --name arkie
pm2 save
pm2 startup
```

Put nginx or Caddy in front of it for HTTPS. For Caddy, the entire config is:

```
arkie.yourdomain.com {
    reverse_proxy localhost:3000
}
```

### Option 5 — Docker (works on Fly, Railway, any Docker host)

```bash
docker build -t arkie-hang .
docker run -d -p 3000:3000 -v arkie-data:/data arkie-hang
```

## Important: persistent disk

The counter date is stored in a plain JSON file at `$DATA_DIR/hang.json`. **If your host's filesystem resets on every deploy** (Heroku-style ephemeral filesystems, free Render without a disk, Vercel/Netlify functions without storage), the counter will reset too.

Make sure your host either:
- gives you a persistent disk volume that you mount and point `DATA_DIR` at, **or**
- you swap the file-based persistence in `server.js` for a database (Postgres, Redis, etc.) — the API surface is just two endpoints, so this is a small change.

## Hosting just the front-end somewhere else

If you host `index.html` on a static-only host (GitHub Pages, Netlify, Vercel without functions) and run the API on a different domain, edit one line at the top of the `<script>` in `index.html`:

```js
const API_BASE = 'https://your-api-host.example.com';
```

And in `server.js`, you'll need to add CORS. Install `cors` (`npm i cors`) and add near the top of `server.js`:

```js
const cors = require('cors');
app.use(cors({ origin: 'https://your-frontend.example.com' }));
```
