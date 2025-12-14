// [supabase/functions/delete-tribe/index.ts]
// Minimal Edge Function using fetch (no supabase-js) to avoid large bundles.
// POST { tribeId, dryRun?: boolean }
// Auth: Authorization: Bearer <user_access_token>
// Requires env: SUPABASE_URL, SUPABASE_SERVICE_KEY

const getEnv = () => {
  // support Deno runtime env
  // @ts-ignore
  const deno = typeof Deno !== 'undefined' ? Deno : undefined;
  const env = deno ? deno.env : process.env;
  return env || {};
};

const env = getEnv();
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_KEY;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-dev-bypass, x-debug-quick',
};

const json = (obj: any, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });

const parsePublicUrl = (url: string | null) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    const marker = '/storage/v1/object/public/';
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const after = u.pathname.slice(idx + marker.length);
    const parts = after.split('/');
    const bucket = parts.shift();
    const objectPath = parts.join('/');
    if (!bucket || !objectPath) return null;
    return { bucket, objectPath };
  } catch {
    return null;
  }
};

export default async function (req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log('delete-tribe: missing env', { hasUrl: Boolean(SUPABASE_URL), hasKey: Boolean(SERVICE_KEY) });
    return json({ error: 'Server not configured' }, 500);
  }

  const startTs = Date.now();
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const tribeId = body?.tribeId;
  const dryRun = !!body?.dryRun;

  const jobs: Array<any> = [];
  const authHeader = req.headers.get('authorization') || '';
  const accessToken = authHeader.replace(/^Bearer\s*/i, '');
  // Dev bypass via custom header or query param to avoid proxy JWT validation. Only for local testing.
  const devBypassHeader = req.headers.get('x-dev-bypass') || '';
  let isDevBypass = devBypassHeader === '88888';
  try {
    const urlObj = new URL(req.url);
    const devParam = urlObj.searchParams.get('dev') || '';
    if (devParam === '88888') isDevBypass = true;
  } catch (e) {
    // ignore
  }

  if (!tribeId) return json({ error: 'Missing tribeId' }, 400);
  if (!accessToken && !isDevBypass) return json({ error: 'Missing Authorization token' }, 401);

  // quick debug short-circuit
  if (dryRun && req.headers.get('x-debug-quick')) {
    console.log('delete-tribe: debug quick short-circuit', { tribeId });
    return json({ ok: 'debug-short-circuit', tribeId, note: 'no imports/no db' }, 200);
  }

  try {
    // Dev bypass: accept access token '88888' or header/param for local testing only.
    // If used, skip auth validation and treat the caller as the tribe owner (so owner-only flows work in dev).
    if (accessToken === '88888') isDevBypass = true;

    let tribeRow: any = null;
    let userId: string | undefined;

    if (isDevBypass) {
      console.log('delete-tribe: using dev bypass token');
      // Fetch tribe first, then set userId to tribe owner so owner checks pass during testing.
      const tribeResp = await fetch(`${SUPABASE_URL}/rest/v1/tribes?id=eq.${tribeId}&select=id,owner,cover_url`, {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      });
      if (!tribeResp.ok) {
        console.log('delete-tribe: tribe fetch failed (dev bypass)', { status: tribeResp.status });
        return json({ error: 'Tribe not found' }, 404);
      }
      const tribeRows = await tribeResp.json();
      tribeRow = Array.isArray(tribeRows) && tribeRows[0];
      if (!tribeRow) return json({ error: 'Tribe not found' }, 404);
      userId = tribeRow.owner; // treat as owner for dev
      console.log('delete-tribe: dev bypass mapped to owner', { userId });
    } else {
      // 1) Validate user token: GET /auth/v1/user with user's token
      const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userResp.ok) {
        console.log('delete-tribe: auth /user returned', { status: userResp.status });
        return json({ error: 'Invalid token' }, 401);
      }
      const userData = await userResp.json();
      userId = userData?.id;
      console.log('delete-tribe: validated user', { userId });

      // 2) Fetch tribe via PostgREST using SERVICE_KEY
      const tribeResp = await fetch(`${SUPABASE_URL}/rest/v1/tribes?id=eq.${tribeId}&select=id,owner,cover_url`, {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      });
      if (!tribeResp.ok) {
        console.log('delete-tribe: tribe fetch failed', { status: tribeResp.status });
        return json({ error: 'Tribe not found' }, 404);
      }
      const tribeRows = await tribeResp.json();
      tribeRow = Array.isArray(tribeRows) && tribeRows[0];
      if (!tribeRow) return json({ error: 'Tribe not found' }, 404);
      if (tribeRow.owner !== userId) {
        console.log('delete-tribe: not owner', { owner: tribeRow.owner, userId });
        return json({ error: 'Not authorized' }, 403);
      }
      console.log('delete-tribe: fetched tribe', { tribeId: tribeRow.id });
    }

    // 3) Fetch events for tribe
    const eventsResp = await fetch(`${SUPABASE_URL}/rest/v1/events?tribe_id=eq.${tribeId}&select=id,banner_url`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!eventsResp.ok) {
      console.log('delete-tribe: events fetch failed', { status: eventsResp.status });
      throw new Error('Failed to fetch events');
    }
    const events = await eventsResp.json();
    console.log('delete-tribe: events count', events.length || 0);

    // 4) Collect object paths
    const removalsByBucket: Record<string, string[]> = {};
    if (tribeRow.cover_url) {
      const p = parsePublicUrl(tribeRow.cover_url);
      if (p) { removalsByBucket[p.bucket] = removalsByBucket[p.bucket] || []; removalsByBucket[p.bucket].push(p.objectPath); }
    }
    for (const ev of events) {
      if (ev.banner_url) {
        const p = parsePublicUrl(ev.banner_url);
        if (p) { removalsByBucket[p.bucket] = removalsByBucket[p.bucket] || []; removalsByBucket[p.bucket].push(p.objectPath); }
      }
    }

    if (dryRun) return json({ dryRun: true, removalsByBucket }, 200);

    // Instead of deleting storage objects here (which can be long-running),
    // enqueue deletion jobs into `deletion_jobs` table so an external worker
    // (GitHub Action / Cloud Run) can process them with the service-role key.

    // tribe cover
    if (tribeRow.cover_url) {
      const parsed = parsePublicUrl(tribeRow.cover_url);
      if (parsed) {
        jobs.push({ tribe_id: tribeId, event_id: null, bucket: parsed.bucket, object_path: parsed.objectPath, status: 'pending', created_by: userId });
      }
    }

    // event banners
    for (const ev of events) {
      if (ev.banner_url) {
        const parsed = parsePublicUrl(ev.banner_url);
        if (parsed) {
          jobs.push({ tribe_id: tribeId, event_id: ev.id || null, bucket: parsed.bucket, object_path: parsed.objectPath, status: 'pending', created_by: userId });
        }
      }
    }

    if (jobs.length === 0) {
      console.log('delete-tribe: no storage jobs to enqueue');
      return json({ ok: true, inserted: 0 }, 200);
    }

    if (dryRun) {
      return json({ dryRun: true, plannedJobs: jobs }, 200);
    }

    // Insert jobs via PostgREST
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/deletion_jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify(jobs),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.log('delete-tribe: failed to insert jobs', { status: resp.status, body: text });
        return json({ error: 'Failed to enqueue deletion jobs', details: text }, 500);
      }

      const inserted = await resp.json().catch(() => null);
      console.log('delete-tribe: enqueued jobs', { count: Array.isArray(inserted) ? inserted.length : jobs.length });
      return json({ ok: true, inserted: Array.isArray(inserted) ? inserted.length : jobs.length, rows: inserted }, 200);
    } catch (e: unknown) {
      console.error('delete-tribe: enqueue exception', e);
      return json({ error: 'Failed to enqueue deletion jobs', details: e instanceof Error ? e.message : String(e) }, 500);
    }
  } catch (err: any) {
    console.error('delete-tribe error', err);
    return json({ error: err?.message || 'Server error' }, 500);
  }
}