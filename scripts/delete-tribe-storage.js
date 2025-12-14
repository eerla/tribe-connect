#!/usr/bin/env node
/*
 One-off script to delete Supabase Storage objects related to a tribe.

 Usage:
   SUPABASE_URL="https://..." SUPABASE_SERVICE_ROLE_KEY="<service-key>" node scripts/delete-tribe-storage.js <tribeId>

 Behavior:
 - Collects cover_url (tribes) and banner_url (events) for the tribe.
 - Groups object paths by bucket, dedupes, then deletes in batches.
 - Prints progress and retries failed batches with backoff.
*/

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';


  // Log key env diagnostics (mask service key)
  const mask = (s) => (typeof s === 'string' && s.length > 8 ? `${s.slice(0,4)}...${s.slice(-4)}` : s);

// Prefer using dotenv if available (recommended). Falls back to a simple parser.
try {
  const dotenv = await import('dotenv');
  dotenv.config();
  console.log('Loaded .env via dotenv');
} catch (e) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, 'utf8');
      raw.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eq = trimmed.indexOf('=');
        if (eq === -1) return;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      });
      console.log('Loaded env from .env (fallback)');
    }
  } catch (err) {
    console.warn('Failed to load .env', err?.message || err);
  }
}

const BATCH_SIZE = Number(process.env.DELETE_BATCH_SIZE) || 10;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function parsePublicUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const marker = '/storage/v1/object/public/';
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const after = u.pathname.slice(idx + marker.length);
    const segments = after.split('/');
    const bucket = segments.shift();
    const objectPath = segments.join('/');
    if (!bucket || !objectPath) return null;
    return { bucket, objectPath };
  } catch (e) {
    return null;
  }
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const JOB_FETCH_LIMIT = Number(process.env.DELETE_JOB_FETCH_LIMIT) || 100; // max pending jobs to fetch per run
  const dryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    console.log(`Starting deletion job worker (dryRun=${dryRun})`);

    // 1) Fetch pending jobs
    const { data: pendingJobs, error: fetchErr } = await supabase
      .from('deletion_jobs')
      .select('id,tribe_id,event_id,bucket,object_path,status,attempts')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(JOB_FETCH_LIMIT);

    if (fetchErr) throw fetchErr;
    if (!Array.isArray(pendingJobs) || pendingJobs.length === 0) {
      console.log('No pending deletion jobs found. Exiting.');
      process.exit(0);
    }

    console.log(`Fetched ${pendingJobs.length} pending job(s)`);

    if (dryRun) {
      console.log('Dry-run mode: the following jobs would be processed:');
      console.table(pendingJobs.map(j => ({ id: j.id, bucket: j.bucket, object_path: j.object_path })));
      process.exit(0);
    }

    // 2) Claim jobs atomically: update status -> in_progress and increment attempts
    const ids = pendingJobs.map((j) => j.id);
    const { data: claimedRows, error: claimErr } = await supabase
      .from('deletion_jobs')
      .update({ status: 'in_progress', attempts: supabase.rpc ? undefined : null })
      // Use PostgreSQL expression to increment attempts when possible via PostgREST? Fallback: fetch then update per-row.
      .in('id', ids)
      .select('*');

    // Note: supabase-js doesn't support SQL expressions in update payload easily.
    // We'll perform a PATCH per id to increment attempts and set in_progress to be safe.
    if (claimErr) {
      console.warn('Bulk claim via update returned error; falling back to per-row claim', claimErr.message || claimErr);
    }

    // Fallback per-row claim
    const claimed = [];
    for (const j of pendingJobs) {
      try {
        const { data: up, error: upErr } = await supabase
          .from('deletion_jobs')
          .update({ status: 'in_progress', attempts: (j.attempts || 0) + 1 })
          .eq('id', j.id)
          .eq('status', 'pending')
          .select('*')
          .single();
        if (up && up.id) claimed.push(up);
      } catch (e) {
        console.warn('Failed to claim job', j.id, e?.message || e);
      }
    }

    if (claimed.length === 0) {
      console.log('No jobs could be claimed (possibly raced by another worker). Exiting.');
      process.exit(0);
    }

    console.log(`Claimed ${claimed.length} job(s) for processing`);

    // 3) Group claimed jobs by bucket for efficient deletes
    const jobsByBucket = {};
    for (const j of claimed) {
      jobsByBucket[j.bucket] = jobsByBucket[j.bucket] || [];
      jobsByBucket[j.bucket].push(j);
    }

    let anyErrors = false;

    for (const bucket of Object.keys(jobsByBucket)) {
      const jobs = jobsByBucket[bucket];
      const paths = jobs.map((j) => j.object_path);
      const idMap = new Map(jobs.map((j) => [j.object_path, j.id]));

      // Chunk by BATCH_SIZE
      const chunks = chunkArray(paths, BATCH_SIZE);
      console.log(`Processing ${paths.length} objects from bucket "${bucket}" in ${chunks.length} batches`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        let attempt = 0;
        let success = false;
        let lastError = null;

        while (attempt <= MAX_RETRIES && !success) {
          try {
            attempt++;
            const { error: remErr } = await supabase.storage.from(bucket).remove(chunk);
            if (remErr) {
              lastError = remErr;
              throw remErr;
            }

            // On success, mark associated jobs as completed
            const chunkIds = chunk.map((p) => idMap.get(p)).filter(Boolean);
            if (chunkIds.length) {
              const { error: upErr } = await supabase
                .from('deletion_jobs')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .in('id', chunkIds);
              if (upErr) console.warn('Failed to mark jobs completed', upErr);
            }

            success = true;
            console.log(`Bucket ${bucket} - batch ${i + 1}/${chunks.length} removed ${chunk.length} items`);
          } catch (e) {
            console.warn(`Bucket ${bucket} - batch ${i + 1}/${chunks.length} attempt ${attempt} failed: ${e.message || e}`);
            if (attempt <= MAX_RETRIES) {
              const backoff = RETRY_BASE_MS * Math.pow(2, attempt - 1);
              console.log(`Retrying in ${backoff}ms...`);
              await sleep(backoff);
            } else {
              anyErrors = true;
              // mark affected jobs as failed with last_error
              const chunkIds = chunk.map((p) => idMap.get(p)).filter(Boolean);
              const errText = String(lastError || e);
              if (chunkIds.length) {
                const { error: upErr } = await supabase
                  .from('deletion_jobs')
                  .update({ status: 'failed', last_error: errText })
                  .in('id', chunkIds);
                if (upErr) console.error('Failed to mark jobs failed', upErr);
              }
            }
          }
        }

        // small pause between batches
        await sleep(200);
      }
    }

    if (anyErrors) {
      console.warn('Completed with some errors. Check logs for details.');
      process.exit(2);
    }

    console.log('Deletion queue processing finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error processing deletion jobs:', err.message || err);
    process.exit(1);
  }
}

main();