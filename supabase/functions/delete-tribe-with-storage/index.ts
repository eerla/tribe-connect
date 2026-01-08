// [supabase/functions/delete-tribe-with-storage/index.ts]
// Deletes a tribe and its storage files (cover_url + event banner_urls) directly
// POST { tribeId }
// Auth: Authorization: Bearer <user_access_token>
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const getEnvVar = (key: string): string | undefined => {
  // @ts-ignore
  const deno = typeof Deno !== 'undefined' ? Deno : undefined;
  if (deno?.env?.get) return deno.env.get(key) ?? undefined;
  if (typeof process !== 'undefined' && process.env) return process.env[key];
  return undefined;
};

const SUPABASE_URL = getEnvVar('SUPABASE_URL');
const SERVICE_KEY =
  getEnvVar('SERVICE_ROLE_KEY') ||
  getEnvVar('SUPABASE_SERVICE_KEY') ||
  getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const json = (obj: any, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

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

serve(async (req: Request) => {
  const handlerStart = Date.now();
  console.log('delete-tribe-with-storage: handler start', { 
    method: req.method, 
    url: req.url, 
    ts: handlerStart,
    env_status: {
      has_SUPABASE_URL: Boolean(SUPABASE_URL),
      resolved_SERVICE_KEY: Boolean(SERVICE_KEY),
    }
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log('delete-tribe-with-storage: missing env', { hasUrl: Boolean(SUPABASE_URL), hasKey: Boolean(SERVICE_KEY) });
    return json({ error: 'Server not configured' }, 500);
  }

  let body: any = {};
  try { body = await req.json(); } catch (e) { console.log('delete-tribe-with-storage: body parse failed', { error: (e as Error).message }); }
  
  const tribeId = body?.tribeId;
  const authHeader = req.headers.get('authorization') || '';
  const accessToken = authHeader.replace(/^Bearer\s*/i, '');

  if (!tribeId) {
    return json({ error: 'Missing tribeId' }, 400);
  }

  if (!accessToken) {
    return json({ error: 'Missing Authorization token' }, 401);
  }

  try {
    // 1) Validate user token
    console.log('delete-tribe-with-storage: validating token', { elapsed_ms: Date.now() - handlerStart });
    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        apikey: SERVICE_KEY,
      },
    });

    if (!userResp.ok) {
      console.log('delete-tribe-with-storage: token validation failed', { status: userResp.status });
      return json({ error: 'Invalid token' }, 401);
    }

    const userData = await userResp.json();
    const userId = userData?.id;
    console.log('delete-tribe-with-storage: user validated', { userId });

    // 2) Fetch tribe (verify ownership and get cover_url)
    console.log('delete-tribe-with-storage: fetching tribe', { tribeId, elapsed_ms: Date.now() - handlerStart });
    const tribeResp = await fetch(`${SUPABASE_URL}/rest/v1/tribes?id=eq.${tribeId}&select=id,owner,cover_url`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });

    if (!tribeResp.ok) {
      return json({ error: 'Tribe not found' }, 404);
    }

    const tribes = await tribeResp.json();
    const tribe = Array.isArray(tribes) && tribes[0];

    if (!tribe) {
      return json({ error: 'Tribe not found' }, 404);
    }

    if (tribe.owner !== userId) {
      return json({ error: 'Not authorized' }, 403);
    }

    // 3) Fetch all events for the tribe (get banner_urls)
    console.log('delete-tribe-with-storage: fetching events', { tribeId, elapsed_ms: Date.now() - handlerStart });
    const eventsResp = await fetch(`${SUPABASE_URL}/rest/v1/events?tribe_id=eq.${tribeId}&select=id,banner_url`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });

    if (!eventsResp.ok) {
      throw new Error('Failed to fetch events');
    }

    const events = await eventsResp.json();
    console.log('delete-tribe-with-storage: events fetched', { count: events?.length || 0 });

    // 4) Collect all storage paths to delete
    const filesToDelete: { bucket: string; path: string }[] = [];

    if (tribe.cover_url) {
      const parsed = parsePublicUrl(tribe.cover_url);
      if (parsed) {
        filesToDelete.push({ bucket: parsed.bucket, path: parsed.objectPath });
      }
    }

    for (const event of events || []) {
      if (event.banner_url) {
        const parsed = parsePublicUrl(event.banner_url);
        if (parsed) {
          filesToDelete.push({ bucket: parsed.bucket, path: parsed.objectPath });
        }
      }
    }

    console.log('delete-tribe-with-storage: files to delete', { count: filesToDelete.length, elapsed_ms: Date.now() - handlerStart });

    // 5) Delete storage files
    if (filesToDelete.length > 0) {
      const byBucket: Record<string, string[]> = {};
      for (const file of filesToDelete) {
        byBucket[file.bucket] = byBucket[file.bucket] || [];
        byBucket[file.bucket].push(file.path);
      }

      let deletedCount = 0;
      for (const [bucket, paths] of Object.entries(byBucket)) {
        try {
          console.log(`delete-tribe-with-storage: deleting from bucket "${bucket}"`, { paths_count: paths.length });
          const { error: deleteError } = await fetch(
            `${SUPABASE_URL}/storage/v1/b/${bucket}/o`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${SERVICE_KEY}`,
                apikey: SERVICE_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ prefixes: paths }),
            }
          ).then(r => r.json().catch(() => ({ error: null })));

          if (deleteError) {
            console.warn(`delete-tribe-with-storage: deletion error for bucket ${bucket}:`, deleteError);
          } else {
            deletedCount += paths.length;
          }
        } catch (e) {
          console.warn(`delete-tribe-with-storage: storage deletion failed for bucket ${bucket}:`, e);
        }
      }
      console.log('delete-tribe-with-storage: storage files deleted', { count: deletedCount, elapsed_ms: Date.now() - handlerStart });
    }

    // 6) Soft delete: Set tribe is_deleted = true and events is_cancelled = true
    console.log('delete-tribe-with-storage: soft deleting tribe and events', { tribeId, eventsCount: events?.length || 0, elapsed_ms: Date.now() - handlerStart });
    
    // Update tribe: set is_deleted = true
    const tribeUpdateResp = await fetch(`${SUPABASE_URL}/rest/v1/tribes?id=eq.${tribeId}`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_deleted: true }),
    });

    if (!tribeUpdateResp.ok) {
      const text = await tribeUpdateResp.text();
      console.error('delete-tribe-with-storage: tribe update failed', { status: tribeUpdateResp.status, body: text });
      throw new Error(`Failed to update tribe: ${text}`);
    }

    // Update events: set is_cancelled = true for all tribe events
    if (events && events.length > 0) {
      const eventsUpdateResp = await fetch(`${SUPABASE_URL}/rest/v1/events?tribe_id=eq.${tribeId}`, {
        method: 'PATCH',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_cancelled: true }),
      });

      if (!eventsUpdateResp.ok) {
        const text = await eventsUpdateResp.text();
        console.warn('delete-tribe-with-storage: events update failed (continuing)', { status: eventsUpdateResp.status, body: text });
      }
    }

    console.log('delete-tribe-with-storage: completed successfully', { tribeId, filesDeleted: filesToDelete.length, eventsProcessed: events?.length || 0, elapsed_ms: Date.now() - handlerStart });
    return json({
      ok: true,
      tribeId,
      filesDeleted: filesToDelete.length,
      eventsProcessed: events?.length || 0,
    }, 200);

  } catch (err: any) {
    console.error('delete-tribe-with-storage: error', err, { elapsed_ms: Date.now() - handlerStart });
    return json({ error: err?.message || 'Server error' }, 500);
  }
});
