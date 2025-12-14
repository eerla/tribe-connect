// Supabase Edge Function: geocode
// Geocodes a location string using OpenStreetMap Nominatim API
// Returns latitude and longitude coordinates

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface GeocodeRequest {
  location: string;
}

interface GeocodeResponse {
  lat: number | null;
  lng: number | null;
  error?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name?: string;
  importance?: number;  // Importance score (0.0 to 1.0, higher = more reliable)
  type?: string;        // Result type (e.g., "house", "city", "town", etc.)
}

/**
 * Validates if the input location string is reasonable and likely to be a valid location
 * Rejects inputs that are clearly invalid (e.g., only numbers, only letters, etc.)
 */
const isValidLocationInput = (location: string): boolean => {
  const normalized = location.trim();
  
  // Reject empty strings
  if (normalized.length === 0) return false;
  
  // Reject if it's only numbers (like "123456789")
  if (/^\d+$/.test(normalized)) {
    console.log(`Rejected: Input contains only numbers: "${normalized}"`);
    return false;
  }
  
  // Reject if it's only letters without spaces and too short (like "abcdefg")
  // But allow single words that might be valid (like "Paris" - minimum 3 chars)
  if (/^[a-zA-Z]+$/.test(normalized) && normalized.length < 3) {
    console.log(`Rejected: Input is too short or invalid: "${normalized}"`);
    return false;
  }
  
  // Reject if it's too short (less than 2 characters)
  if (normalized.length < 2) return false;
  
  // Reject if it contains only special characters
  if (/^[^a-zA-Z0-9\s]+$/.test(normalized)) {
    console.log(`Rejected: Input contains only special characters: "${normalized}"`);
    return false;
  }
  
  return true;
};

/**
 * Validates if the geocoding result is reliable and should be accepted
 * Checks coordinate ranges, importance score, and display name matching
 */
const isValidGeocodeResult = (result: NominatimResult, originalInput: string): boolean => {
  // Check if coordinates are valid numbers
  const lat = parseFloat(result.lat);
  const lng = parseFloat(result.lon);
  
  if (isNaN(lat) || isNaN(lng)) {
    console.log("Rejected: Invalid coordinate values");
    return false;
  }
  
  // Validate coordinate ranges (latitude: -90 to 90, longitude: -180 to 180)
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.log("Rejected: Coordinates out of valid range");
    return false;
  }
  
  // Check importance score (lower = less reliable)
  // Nominatim importance ranges from 0.0 to 1.0
  // Reject results with very low importance (< 0.1) as they're likely incorrect
  if (result.importance !== undefined && result.importance < 0.1) {
    console.log(`Rejected: Low importance score: ${result.importance}`);
    return false;
  }
  
  // Check if display_name exists and is reasonable
  if (result.display_name) {
    // Reject if display_name is suspiciously short or doesn't contain the input
    const displayLower = result.display_name.toLowerCase();
    const inputLower = originalInput.toLowerCase();
    
    // If the input is substantial, check if display_name contains some of it
    if (originalInput.length > 5) {
      const inputWords = inputLower.split(/\s+/).filter(w => w.length > 2);
      const hasMatchingWord = inputWords.some(word => displayLower.includes(word));
      
      if (!hasMatchingWord && inputWords.length > 0) {
        console.log(`Rejected: Display name doesn't match input. Input: "${originalInput}", Display: "${result.display_name}"`);
        return false;
      }
    }
  }
  
  return true;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: GeocodeRequest = await req.json();
    const { location } = body;

    // Validate input
    if (!location || typeof location !== "string") {
      return new Response(
        JSON.stringify({
          lat: null,
          lng: null,
          error: "Location is required and must be a string",
        } as GeocodeResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Normalize location string
    const normalizedLocation = location.trim();

    // Return null for empty or "online" locations
    if (
      normalizedLocation === "" ||
      normalizedLocation.toLowerCase() === "online"
    ) {
      return new Response(
        JSON.stringify({ lat: null, lng: null } as GeocodeResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ============================================
    // INPUT VALIDATION: Filter out invalid inputs
    // ============================================
    // Reject inputs that are clearly invalid (e.g., "123456789", "abcdefg")
    // This prevents Nominatim from returning random coordinates for nonsensical inputs
    if (!isValidLocationInput(normalizedLocation)) {
      console.log(`Invalid location input rejected: "${normalizedLocation}"`);
      return new Response(
        JSON.stringify({ lat: null, lng: null } as GeocodeResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    // ============================================

    // Call OpenStreetMap Nominatim API
    const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
    nominatimUrl.searchParams.set("q", normalizedLocation);
    nominatimUrl.searchParams.set("format", "json");
    nominatimUrl.searchParams.set("limit", "1");
    nominatimUrl.searchParams.set("addressdetails", "1"); // Get structured address data for better validation

    const response = await fetch(nominatimUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "TribeConnect/1.0 (contact@tribeconnect.example)", // Required by Nominatim ToS
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `Nominatim API error: ${response.status} ${response.statusText}`
      );
      return new Response(
        JSON.stringify({
          lat: null,
          lng: null,
          error: "Failed to geocode location",
        } as GeocodeResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const results: NominatimResult[] = await response.json();

    // If no results found, return null
    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({ lat: null, lng: null } as GeocodeResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Extract first result
    const firstResult = results[0];

    // ============================================
    // RESULT VALIDATION: Filter out low-quality results
    // ============================================
    // Validate the geocoding result to ensure it's reliable
    // This prevents accepting random coordinates for invalid inputs
    if (!isValidGeocodeResult(firstResult, normalizedLocation)) {
      console.log(`Invalid geocode result rejected for input: "${normalizedLocation}"`);
      return new Response(
        JSON.stringify({ lat: null, lng: null } as GeocodeResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    // ============================================

    // Extract and validate coordinates
    const lat = parseFloat(firstResult.lat);
    const lng = parseFloat(firstResult.lon);

    // Final coordinate validation (should already be validated above, but double-check)
    if (isNaN(lat) || isNaN(lng)) {
      console.error("Invalid coordinates received from Nominatim");
      return new Response(
        JSON.stringify({
          lat: null,
          lng: null,
          error: "Invalid coordinates received",
        } as GeocodeResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Return coordinates
    return new Response(
      JSON.stringify({ lat, lng } as GeocodeResponse),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Geocode function error:", error);
    return new Response(
      JSON.stringify({
        lat: null,
        lng: null,
        error: error instanceof Error ? error.message : "Unknown error",
      } as GeocodeResponse),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

