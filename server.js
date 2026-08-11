const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = Number(process.env.PORT) || 8080;
const adminPassword = process.env.ADMIN_PASSWORD || 'Humayun@Admin!2026';
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'humayun-shop.db');

fs.mkdirSync(dataDir, { recursive: true });

const defaultContent = {
  name: 'Madina Mazda Cabin House',
  tagline: 'Mazda cabin • auto electrical • interior & metal work',
  heroText: 'We focus on Mazda cabin work, auto electrical repair, wiring, battery service, cushion fitting, car interior designing, and metal fabrication for doors, windows, and grills. Our shop delivers reliable, customized workshop solutions for vehicles and commercial use, with M T-3000, M T-3500, M T-4500, and other M T-series support based on the job requirement.',
  heroSubtext: 'Trusted auto workshop solutions for cabin parts, electrical work, interior upgrades, and professional metal fabrication.',
  aboutText: 'Our business is centered around practical automotive workshop solutions, including Mazda cabin support, electrical work, wiring, battery repair, cushions, interior designing, and metal fabrication. We cover the main fabrication needs for doors, windows, and grills while keeping the work focused, clean, and customer-driven. We support M T-3000, M T-3500, and M T-4500 product series alongside custom workshop jobs and workshop requirements.',
  contactEmail: '',
  contactText: 'Plot no. 14-A, Street 1, Block 8, Zafar Town, near Mazil Pump, Landhi, Karachi',
  statOneValue: 'M T-3000',
  statOneLabel: 'Cabin series support',
  statTwoValue: 'M T-4500',
  statTwoLabel: 'Workshop range',
  statThreeValue: 'Custom',
  statThreeLabel: 'Interior & metal work',
  statFourValue: '24/7',
  statFourLabel: 'Support available',
  gallery: [
    { title: 'Mazda Cabin Work', category: 'Cabin & Body', description: 'Cabin repair, body matching, and dependable Mazda product support.', image: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80', detail: 'We provide fitment-focused Mazda cabin work and body support for repairs and replacement requirements.' },
    { title: 'Auto Electrical & Wiring', category: 'Electrical', description: 'Vehicle electrical repair, wiring troubleshooting, and system upgrades.', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80', detail: 'Our electrical work covers vehicle wiring, troubleshooting, and dependability checks for daily use.' },
    { title: 'Battery Service', category: 'Battery', description: 'Battery testing, replacement support, and dependable power service.', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80', detail: 'We handle battery-related vehicle issues with reliable checks and service support.' },
    { title: 'Interior Designing', category: 'Interior', description: 'Custom cushion work and car interior enhancements for comfort and style.', image: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=900&q=80', detail: 'Interior upgrades create a cleaner, more comfortable cabin experience with custom styling.' }
  ],
  certifications: [
    { title: 'Cabin & Body Service', subtitle: 'M T-3000 to M T-4500 workshop support', link: '#' },
    { title: 'Electrical & Battery Work', subtitle: 'Wiring, troubleshooting, and power support', link: '#' },
    { title: 'Interior & Metal Fabrication', subtitle: 'Cushions, door, window, and grill work', link: '#' }
  ],
  cvFile: '#contact',
  cvText: 'We deliver reliable cabin, electrical, cushion, and metal fabrication services with dependable workshop support.',
  cvStatus: 'Workshop support is available for Mazda cabin work, electrical systems, interior finishing, and custom metal fabrication.'
};

let pgClient = null;
let useSupabaseDb = false;
let supabaseClient = null;
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

function cloneDefaultContent() {
  return JSON.parse(JSON.stringify(defaultContent));
}

async function initializeDatabase() {
  if (supabaseUrl && supabaseKey) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const { data: tableCheck, error: tableError } = await supabaseClient.from('site_content').select('id').limit(1);
      if (tableError && tableError.code !== '42P01') {
        throw tableError;
      }

      if (tableError && tableError.code === '42P01') {
        console.warn('Supabase site_content table does not exist yet. Falling back to SQLite until it is created in Supabase.');
        throw new Error('Supabase table missing.');
      }

      const { data, error } = await supabaseClient.from('site_content').select('content').eq('id', 1).maybeSingle();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        const { error: insertError } = await supabaseClient.from('site_content').insert({ id: 1, content: defaultContent, updated_at: new Date().toISOString() });
        if (insertError) {
          throw insertError;
        }
      }

      useSupabaseDb = true;
      console.log('Database connection: Supabase active.');
      return;
    } catch (error) {
      console.warn('Supabase not available; falling back to SQLite:', error.message || error);
    }
  }

  if (process.env.DATABASE_URL) {
    pgClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await pgClient.connect();
    useSupabaseDb = true;

    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        content JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const existing = await pgClient.query('SELECT content FROM site_content WHERE id = 1');
    if (!existing.rows.length) {
      await pgClient.query('INSERT INTO site_content (id, content) VALUES (1, $1)', [JSON.stringify(defaultContent)]);
    }

    console.log('Database connection: Postgres active.');
    return;
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_content (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const existing = db.prepare('SELECT content FROM site_content WHERE id = 1').get();
  if (!existing) {
    db.prepare('INSERT INTO site_content (id, content, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)').run(JSON.stringify(defaultContent));
  }

  global.sqliteDb = db;
  console.log('Database connection: SQLite fallback active.');
}

function getSQLiteContent() {
  const db = global.sqliteDb;
  if (!db) {
    return cloneDefaultContent();
  }

  const row = db.prepare('SELECT content FROM site_content WHERE id = 1').get();
  if (!row) {
    db.prepare('INSERT INTO site_content (id, content, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)').run(JSON.stringify(defaultContent));
    return cloneDefaultContent();
  }

  try {
    return JSON.parse(row.content);
  } catch (error) {
    return cloneDefaultContent();
  }
}

async function getSavedContent() {
  if (useSupabaseDb && supabaseClient) {
    const { data, error } = await supabaseClient.from('site_content').select('content').eq('id', 1).maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase read failed:', error.message);
      return getSQLiteContent();
    }

    if (!data) {
      const { error: insertError } = await supabaseClient.from('site_content').insert({ id: 1, content: defaultContent, updated_at: new Date().toISOString() });
      if (insertError) {
        console.warn('Supabase insert failed:', insertError.message);
        return getSQLiteContent();
      }
      return cloneDefaultContent();
    }

    return data.content || cloneDefaultContent();
  }

  if (useSupabaseDb && pgClient) {
    const result = await pgClient.query('SELECT content FROM site_content WHERE id = 1');
    if (!result.rows.length) {
      await pgClient.query('INSERT INTO site_content (id, content) VALUES (1, $1)', [JSON.stringify(defaultContent)]);
      return cloneDefaultContent();
    }

    try {
      return result.rows[0].content;
    } catch (error) {
      return cloneDefaultContent();
    }
  }

  return getSQLiteContent();
}

function saveSQLiteContent(content) {
  const db = global.sqliteDb;
  if (!db) return;
  db.prepare('UPDATE site_content SET content = ?, updated_at = datetime("now") WHERE id = 1').run(JSON.stringify(content));
}

async function saveContent(content) {
  if (useSupabaseDb && supabaseClient) {
    const { error } = await supabaseClient.from('site_content').upsert({ id: 1, content, updated_at: new Date().toISOString() });
    if (error) {
      console.warn('Supabase save failed:', error.message);
      saveSQLiteContent(content);
      return;
    }
    return;
  }

  if (useSupabaseDb && pgClient) {
    await pgClient.query('UPDATE site_content SET content = $1, updated_at = NOW() WHERE id = 1', [JSON.stringify(content)]);
    return;
  }

  saveSQLiteContent(content);
}

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/content', async (_req, res) => {
  const content = await getSavedContent();
  res.json(content);
});

app.post('/api/login', (req, res) => {
  const password = String(req.body.password || '').trim();
  if (password === adminPassword) {
    return res.json({ ok: true, message: 'Authorized admin access granted.' });
  }

  return res.status(401).json({ ok: false, message: 'Invalid admin password.' });
});

app.post('/api/content', async (req, res) => {
  const password = String(req.body.password || req.headers['x-admin-password'] || '').trim();
  if (password !== adminPassword) {
    return res.status(401).json({ ok: false, message: 'Unauthorized. Please provide the admin password.' });
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

  await saveContent(merged);
  res.json({ ok: true, content: merged });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Humayun Shop site is running on http://localhost:${port}`);
      console.log(`Admin password loaded from environment: ${adminPassword ? 'configured' : 'default fallback'}`);
      console.log(useSupabaseDb ? 'Database mode: Supabase/Postgres' : 'Database mode: SQLite fallback');
    });
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
