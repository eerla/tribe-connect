# Supabase Edge Functions

This directory contains Supabase Edge Functions for the Tribe Connect application.

## Functions

### `geocode`

Geocodes a location string using OpenStreetMap Nominatim API and returns latitude/longitude coordinates.

**Endpoint:** `POST /functions/v1/geocode`

**Request Body:**
```json
{
  "location": "San Francisco, CA"
}
```

**Response:**
```json
{
  "lat": 37.7749,
  "lng": -122.4194
}
```

**Special Cases:**
- Empty string or "online" (case-insensitive) returns `{ lat: null, lng: null }`
- Invalid or not found locations return `{ lat: null, lng: null }`

## Deployment

### Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

### Deploy Function

Deploy the geocode function:
```bash
supabase functions deploy geocode
```

### Test Locally

Start Supabase locally:
```bash
supabase start
```

Serve the function locally:
```bash
supabase functions serve geocode
```

Test with curl:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/geocode' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"location": "San Francisco, CA"}'
```

## Usage in Frontend

```typescript
import { supabase } from '@/integrations/supabase/client';

const geocodeLocation = async (location: string) => {
  const { data, error } = await supabase.functions.invoke('geocode', {
    body: { location }
  });
  
  if (error) {
    console.error('Geocoding error:', error);
    return { lat: null, lng: null };
  }
  
  return data;
};
```

