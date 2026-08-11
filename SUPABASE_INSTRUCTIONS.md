Supabase setup and deployment instructions
=========================================

This document contains step-by-step instructions to prepare the Supabase database and Auth for the Madina Mazda site. The SQL file `supabase-setup.sql` has the necessary DDL and initial data.

1) Create the table and seed initial content
-------------------------------------------
- Open your Supabase project dashboard -> SQL Editor -> New query
- Copy & paste the contents of `supabase-setup.sql` and run it
  - This creates table `public.site_content` and adds a seeded row with id=1
  - It also enables Row Level Security (RLS) and policies to allow public SELECT and authenticated writes

2) Create an admin user (recommended)
-------------------------------------
Option A — Dashboard (recommended):
- Go to Authentication -> Users -> Invite or "New user" (create a user with an email and password)
- Note the admin user's email and password; use that to sign in from the site to edit content

Option B — Admin API (service role key required):
- Use the Supabase Admin API to create a user. This requires your SUPABASE_SERVICE_ROLE_KEY which must never be embedded in client code.

Example curl (replace placeholders):

  SUPABASE_URL="https://<your-project>.supabase.co"
  SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY>"
  ADMIN_EMAIL="admin@example.com"
  ADMIN_PASSWORD="StrongPassword!23"

  curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{"email":"'"$ADMIN_EMAIL"'","password":"'"$ADMIN_PASSWORD"'","email_confirm":true}'

Notes:
- Do not store the SERVICE_ROLE_KEY in client-side code or in a public repo. Use it only on trusted server-side environments.

3) RLS and policies
-------------------
- The provided SQL enables RLS and adds two policies:
  - "Allow public select": anyone (including anon) can read the site_content row(s)
  - "Allow authenticated write": only authenticated users can insert/update the table

- If you prefer stronger control, uncomment and adapt the "Allow admin by email" policy in `supabase-setup.sql` to limit writes to a single admin email.

4) Testing the setup
--------------------
- Use the single-file frontend (single-file-supabase.html) or your index.html (update with project URL and anon key) to test:
  - Configure SUPABASE_URL and SUPABASE_ANON_KEY in the client file
  - Load the page, verify content loads from site_content row id=1
  - Sign in with the admin user (email/password) and attempt to edit & save content — the upsert should succeed for authenticated users

5) Client-side recommendations
------------------------------
- Use the Supabase "anon" publishable key in your client code — it's safe for reads and for authenticated writes provided RLS policies allow it
- Keep the Service Role key secret; use it only on server-side deployments
- If you host only a static site (GitHub Pages) and want server-only protection for editing, either:
  - Use the client approach with a single admin account and strict email-based RLS, OR
  - Build a small server-side endpoint that uses the service role key to authenticate and perform writes (recommended for stricter security)

6) Optional: Creating the site_content row manually
-------------------------------------------------
If you prefer to create or edit the row directly in Supabase Table Editor:
- Go to Table Editor -> public -> site_content
- Add a new row with id = 1 and content = (paste JSON)

7) Example JSON schema for `content` (one JSON object stored in row id=1)
--------------------------------------------------------------------------
{
  "name": "Madina Mazda Cabin House",
  "tagline": "Mazda cabin • auto electrical • interior & metal work",
  "heroText": "...",
  "heroSubtext": "...",
  "aboutText": "...",
  "contactText": "...",
  "services": [
    "Mazda cabin parts",
    "Auto electrical & wiring",
    "Battery service",
    "Cushions & interior design",
    "Metal work for doors, windows, grills"
  ],
  "models": ["M T-3000","M T-3500","M T-4500"]
}

8) Final notes
--------------
- After setting up the database, upload your index.html to GitHub (or GitHub Pages) and configure the file to point to your SUPABASE_URL and SUPABASE_ANON_KEY for client usage.
- If you'd like, provide the exact SUPABASE_URL (public) and the anon key and the assistant can update your index file locally to wire in those constants — do not share service_role or DB passwords here.

If any step should be performed directly in the repo (for example, wiring the client keys into index.html placeholders), confirm and the assistant will make the change using placeholders for secrets.
