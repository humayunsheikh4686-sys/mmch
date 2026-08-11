# Madina Mazda Cabin House

Live GitHub Pages site:
https://humayunsheikh4686-sys.github.io/testing/

## About
This repository contains a static website front end that loads business content from Supabase. The site supports:

- Supabase `site_content` JSON data for hero, about, gallery, and contact content
- Admin sign-in using Supabase Auth
- Save/edit content directly from the page when signed in
- Focused services: Mazda cabin work, auto electrical, wiring, battery service, cushions, interior design, door/window/grill metal work

## Deployment
The site is deployed through GitHub Pages using the `main` branch and root folder.

### Supabase Setup
1. Open your Supabase project.
2. Run `supabase-setup.sql` in the SQL Editor.
3. Create an admin user in Authentication.
4. Ensure RLS policies allow public `SELECT` and authenticated `INSERT/UPDATE` on `public.site_content`.

### Admin login
Use the Supabase Auth user credentials created in the dashboard.

### Notes
- Do not store service role keys in the frontend.
- The client uses the anon key for Supabase.
- The repository should not include `node_modules`; this is excluded by `.gitignore`.

## Local development
Open `index.html` in a browser to view the static frontend locally.

## Custom domain
To use a custom domain you must register a real domain name and configure DNS to point to GitHub Pages.
