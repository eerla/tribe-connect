# Supabase Edge Functions

Edge Functions used by Tribe Connect. Includes geocoding and secure server-side operations for tribe deletion and storage cleanup.

## Functions

### `geocode`

Geocodes a location string using OpenStreetMap Nominatim API and returns latitude/longitude.

- Endpoint: `POST /functions/v1/geocode`
- Auth: Requires an authenticated request with a valid anon or user JWT in `Authorization: Bearer …`
- Request Body:
```json
{ "location": "San Francisco, CA" }
```
- Response:
```json
{ "lat": 37.7749, "lng": -122.4194 }
```
- Special Cases:
  - Empty string or "online" → `{ lat: null, lng: null }`
  - Invalid or not found → `{ lat: null, lng: null }`

### `delete-tribe-with-storage`

Deletes a tribe the signed-in user owns, along with its banner/cover images in Storage. It first validates the caller via Supabase Auth, then removes related storage files, and finally deletes the tribe record via PostgREST using the service role key.

- Endpoint: `POST /functions/v1/delete-tribe-with-storage`
- Auth: Requires `Authorization: Bearer <user_jwt>` AND `apikey: <anon_or_service_key>` headers
- Environment Secrets used:
  - `SUPABASE_URL`: Your project API URL
  - `SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`): Service role key for server-side REST calls
- Request Body:
```json
{ "tribe_id": "00000000-0000-0000-0000-000000000000" }
```
- Response (example):
```json
{
  "deletedStorage": { "count": 3 },
  "deletedTribe": { "count": 1 }
}
```
- Notes:
  - Storage deletion parses the public URLs to derive `bucket` and `object_path` prefixes.
  - Only the tribe owner can delete; the function validates ownership before proceeding.
  - CORS handled via shared headers and Deno `serve()`.

## CORS

All functions use consistent CORS handling with preflight support. Typical headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, apikey, content-type
Access-Control-Allow-Methods: POST, OPTIONS
```

Functions respond to `OPTIONS` requests with the same CORS headers and `204` status to satisfy browser preflight.

## Secrets

Set required secrets before deploying functions:

```bash
supabase secrets set SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
supabase secrets set SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
# Optional fallback name if already in use elsewhere
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

Notes:
- Supabase dashboard may restrict custom secrets that start with `SUPABASE_` for certain contexts; prefer `SERVICE_ROLE_KEY`.
- Frontend build-time envs (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are separate and must be configured in your hosting (e.g., Vercel) and re-deployed to take effect.

## Deployment

### Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```
2. Login:
```bash
supabase login
```
3. Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Deploy Functions

```bash
# Geocode
supabase functions deploy geocode

# Delete tribe with storage
supabase functions deploy delete-tribe-with-storage
```

### Test Locally

Start local stack (optional):
```bash
supabase start
```

Serve a function:
```bash
supabase functions serve geocode
supabase functions serve delete-tribe-with-storage
```

Curl examples:
```bash
# Geocode
curl -i -X POST 'http://localhost:54321/functions/v1/geocode' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"location":"San Francisco, CA"}'

# Delete tribe with storage
curl -i -X POST 'http://localhost:54321/functions/v1/delete-tribe-with-storage' \
  -H 'Authorization: Bearer YOUR_USER_JWT' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"tribe_id":"00000000-0000-0000-0000-000000000000"}'
```

## Frontend Usage

```typescript
import { supabase } from '@/integrations/supabase/client';

// Geocode
export async function geocodeLocation(location: string) {
  const { data, error } = await supabase.functions.invoke('geocode', {
    body: { location }
  });
  if (error) return { lat: null, lng: null };
  return data as { lat: number | null; lng: number | null };
}

// Delete tribe with storage
export async function deleteTribeWithStorage(tribeId: string) {
  const { data, error } = await supabase.functions.invoke('delete-tribe-with-storage', {
    body: { tribe_id: tribeId }
  });
  if (error) throw error;
  return data as { deletedStorage: { count: number }; deletedTribe: { count: number } };
}
```

## Troubleshooting

- CORS: Ensure functions return consistent CORS headers and handle `OPTIONS`.
- Auth: For protected endpoints, include both `Authorization: Bearer <user_jwt>` and `apikey` headers when calling Auth/REST.
- Env Names: Frontend envs (`VITE_*`) are inlined at build-time in Vite; redeploy after updating.
- Secrets: Verify `SUPABASE_URL` and `SERVICE_ROLE_KEY` are set; add logging in functions if needed to confirm.

## Deprecated

- `delete-tribe` (queued deletion jobs) has been removed in favor of `delete-tribe-with-storage`.

