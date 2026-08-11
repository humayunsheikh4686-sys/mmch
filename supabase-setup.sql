-- Supabase setup for Madina Mazda Cabin House
-- Run these statements in Supabase SQL editor (SQL Editor -> New query)

-- 1) Create table to hold site content (single-row JSONB)
CREATE TABLE IF NOT EXISTS public.site_content (
  id integer PRIMARY KEY,
  content jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Insert an initial content row (id = 1). Edit the JSON below if you want different default text.
INSERT INTO public.site_content (id, content)
VALUES (
  1,
  ('{
    "name": "Madina Mazda Cabin House",
    "tagline": "Mazda cabin • auto electrical • interior & metal work",
    "heroText": "We focus on Mazda cabin work, auto electrical repair, wiring, battery service, cushion fitting, car interior designing, and metal fabrication for doors, windows, and grills. Our shop delivers reliable, customized workshop solutions for vehicles and commercial use, with M T-3000, M T-3500, M T-4500, and other M T-series support based on the job requirement.",
    "heroSubtext": "Trusted auto workshop solutions for cabin parts, electrical work, interior upgrades, and professional metal fabrication.",
    "aboutText": "Our business is centered around practical automotive workshop solutions, including Mazda cabin support, electrical work, wiring, battery repair, cushions, interior designing, and metal fabrication. We cover the main fabrication needs for doors, windows, and grills while keeping the work focused, clean, and customer-driven.",
    "contactText": "Plot no. 14-A, Street 1, Block 8, Zafar Town, near Mazil Pump, Landhi, Karachi"
  }')::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 3) Enable Row Level Security (RLS) and add policies
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anonymous) to read the content (SELECT)
CREATE POLICY "Allow public select" ON public.site_content
  FOR SELECT
  USING (true);

-- Allow authenticated users to INSERT/UPDATE the single row
CREATE POLICY "Allow authenticated write" ON public.site_content
  FOR INSERT, UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Optional stricter policy: restrict writes to a specific admin email (uncomment and adapt)
-- CREATE POLICY "Allow admin by email" ON public.site_content
--   FOR INSERT, UPDATE
--   USING (auth.role() = 'authenticated' AND auth.email() = 'admin@yourdomain.com')
--   WITH CHECK (auth.role() = 'authenticated' AND auth.email() = 'admin@yourdomain.com');

-- 4) (Optional) Grant minimal permissions to the anon role if you prefer explicit grants
-- Note: With RLS policies above, explicit grants are not strictly required for SELECT by anon
-- GRANT SELECT ON public.site_content TO anon;

-- Done. After running this, make sure you create an admin user in Supabase Auth (Dashboard -> Authentication -> Users)
-- Then sign in from the frontend (client-side) as that user to make edits, or use server-side service-role key if performing admin operations from a backend.
