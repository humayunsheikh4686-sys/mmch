require('dotenv').config();
const express = require('express');
const path = require('path');
const { Client } = require('pg');

const app = express();
const port = Number(process.env.PORT) || 8080;
const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'Humayun@Admin!2026';
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('FATAL: DATABASE_URL is not set. Please provide your Supabase Postgres connection string in the environment.');
  console.error('Example: postgresql://postgres:YOUR_PASSWORD@db.lumwkrkffqjjeiruurpd.supabase.co:5432/postgres');
  process.exit(1);
}

const pgClient = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function initDb() {
  await pgClient.connect();

  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS site_content (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      content JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const passwordRow = await pgClient.query('SELECT value FROM app_config WHERE key = $1', ['admin_password']);
  if (!passwordRow.rows.length) {
    await pgClient.query('INSERT INTO app_config (key, value) VALUES ($1, $2)', ['admin_password', defaultAdminPassword]);
  }

  const res = await pgClient.query('SELECT content FROM site_content WHERE id = 1');
  if (!res.rows.length) {
    await pgClient.query('INSERT INTO site_content (id, content) VALUES (1, $1::jsonb)', [JSON.stringify({
      name: 'Madina Mazda Cabin House',
      tagline: 'Mazda cabin • auto electrical • interior & metal work',
      heroText: 'We focus on Mazda cabin work, auto electrical repair, wiring, battery service, cushion fitting, car interior designing, and metal fabrication for doors, windows, and grills. Our shop delivers reliable, customized workshop solutions for vehicles and commercial use, with M T-3000, M T-3500, M T-4500, and other M T-series support based on the job requirement.',
      heroSubtext: 'Trusted auto workshop solutions for cabin parts, electrical work, interior upgrades, and professional metal fabrication.',
      aboutText: 'Our business is centered around practical automotive workshop solutions, including Mazda cabin support, electrical work, wiring, battery repair, cushions, interior designing, and metal fabrication. We cover the main fabrication needs for doors, windows, and grills while keeping the work focused, clean, and customer-driven. We support M T-3000, M T-3500, and M T-4500 product series alongside custom workshop jobs and workshop requirements.',
      contactEmail: '',
      contactText: 'Plot no. 14-A, Street 1, Block 8, Zafar Town, near Mazil Pump, Landhi, Karachi',
      statOneValue: 'M T-3000', statOneLabel: 'Cabin series support',
      statTwoValue: 'M T-4500', statTwoLabel: 'Workshop range',
      statThreeValue: 'Custom', statThreeLabel: 'Interior & metal work',
      statFourValue: '24/7', statFourLabel: 'Support available',
      gallery: [],
      certifications: [],
      cvFile: '#contact',
      cvText: '',
      cvStatus: ''
    })]);
  }
}

async function getAdminPassword() {
  const res = await pgClient.query('SELECT value FROM app_config WHERE key = $1', ['admin_password']);
  if (res.rows.length && res.rows[0].value) {
    return String(res.rows[0].value);
  }
  return defaultAdminPassword;
}

async function getSavedContent() {
  const res = await pgClient.query('SELECT content FROM site_content WHERE id = 1');
  if (!res.rows.length) return {};
  return res.rows[0].content;
}

async function saveContent(content) {
  await pgClient.query(`
    INSERT INTO site_content (id, content, updated_at)
    VALUES (1, $1::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();
  `, [JSON.stringify(content)]);
}

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/content', async (_req, res) => {
  try {
    const content = await getSavedContent();
    res.json(content);
  } catch (err) {
    console.error('Read content error:', err);
    res.status(500).json({ ok: false, message: 'Unable to read content.' });
  }
});

app.post('/api/login', async (req, res) => {
  const password = String(req.body.password || '').trim();
  const expectedPassword = await getAdminPassword();
  if (password === expectedPassword) {
    return res.json({ ok: true, message: 'Authorized admin access granted.' });
  }

  return res.status(401).json({ ok: false, message: 'Invalid admin password.' });
});

app.post('/api/content', async (req, res) => {
  const password = String(req.body.password || req.headers['x-admin-password'] || '').trim();
  const expectedPassword = await getAdminPassword();
  if (password !== expectedPassword) {
    return res.status(401).json({ ok: false, message: 'Unauthorized.' });
  }

  const incoming = req.body.content;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ ok: false, message: 'Content payload is required.' });
  }

  const base = await getSavedContent();
  const merged = {
    ...base,
    ...incoming,
    gallery: Array.isArray(incoming.gallery) && incoming.gallery.length ? incoming.gallery : base.gallery,
    certifications: Array.isArray(incoming.certifications) && incoming.certifications.length ? incoming.certifications : base.certifications
  };

  try {
    await saveContent(merged);
    res.json({ ok: true, content: merged });
  } catch (err) {
    console.error('Save content error:', err);
    res.status(500).json({ ok: false, message: 'Unable to save content.' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true, status: 'healthy' }));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Humayun Shop (Supabase) is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
