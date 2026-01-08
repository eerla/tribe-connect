import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = process.env.SITE_URL || 'https://tribe-connect-two.vercel.app';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const outPath = path.resolve(import.meta.dirname, '..', 'public', 'sitemap.xml');

const xmlEscape = (str = '') =>
  str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const makeUrl = (loc, lastmod, priority = '0.7') => `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}\n    <priority>${priority}</priority>\n  </url>`;

async function fetchEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('slug, id, updated_at')
    .eq('is_cancelled', false)
    .eq('is_deleted', false);
  if (error) throw error;
  return data || [];
}

async function fetchTribes() {
  const { data, error } = await supabase
    .from('tribes')
    .select('slug, id, updated_at')
    .eq('is_deleted', false);
  if (error) throw error;
  return data || [];
}

async function run() {
  const [events, tribes] = await Promise.all([fetchEvents(), fetchTribes()]);

  const urls = [
    makeUrl(`${SITE_URL}/`, null, '1.0'),
    makeUrl(`${SITE_URL}/events`, null, '0.8'),
    makeUrl(`${SITE_URL}/groups`, null, '0.8'),
  ];

  events.forEach((e) => {
    const slug = e.slug || e.id;
    urls.push(makeUrl(`${SITE_URL}/events/${slug}`, e.updated_at));
  });

  tribes.forEach((t) => {
    const slug = t.slug || t.id;
    urls.push(makeUrl(`${SITE_URL}/groups/${slug}`, t.updated_at));
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(`sitemap.xml written to ${outPath}`);
}

run().catch((err) => {
  console.error('Failed to generate sitemap:', err.message || err);
  process.exit(1);
});
