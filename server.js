// Tiny Express server for the Arkie Hang counter.
// Serves index.html and persists the shared counter date to data/hang.json.

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Where to store the persisted date. On most hosts you can leave this as ./data.
// On Fly.io, mount a volume at /data and set DATA_DIR=/data so the file survives deploys/restarts.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'hang.json');

// Make sure the data dir exists.
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helpers ------------------------------------------------------------

function readState() {
  try {
    if (!fs.existsSync(DATA_FILE)) return { lastHang: null };
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('readState failed', e);
    return { lastHang: null };
  }
}

function writeState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// Validate YYYY-MM-DD and that the date isn't in the future.
function isValidISODate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return dt <= today;
}

// Middleware ---------------------------------------------------------

app.use(express.json({ limit: '1kb' }));

// Serve the static front-end (index.html lives next to this file).
app.use(express.static(__dirname, { extensions: ['html'] }));

// API ----------------------------------------------------------------

// GET /api/hang  -> { lastHang: "YYYY-MM-DD" | null }
app.get('/api/hang', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(readState());
});

// POST /api/hang  body: { lastHang: "YYYY-MM-DD" }  -> { lastHang: "YYYY-MM-DD" }
app.post('/api/hang', (req, res) => {
  const { lastHang } = req.body || {};
  if (!isValidISODate(lastHang)) {
    return res.status(400).json({ error: 'lastHang must be a valid YYYY-MM-DD date that is not in the future' });
  }
  const state = { lastHang };
  writeState(state);
  res.json(state);
});

// Boot ---------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Arkie Hang server listening on http://localhost:${PORT}`);
  console.log(`Persisting to ${DATA_FILE}`);
});
